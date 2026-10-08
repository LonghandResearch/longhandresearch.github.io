/* Page controller and DOM rendering. This is the only World module that touches the page. */
(function () {
  'use strict';
  const World = window.LonghandWorld;
  if (!World || !World.State || !World.Movement || !World.Mock || !World.Visual) {
    document.getElementById('simulation-status').textContent = 'The institution could not load. Refresh to try again.';
    return;
  }
  const $ = (id) => document.getElementById(id);
  let replayTime = null, project = null, runTimes = [], restoring = false, opening = false;
  let saveQueue = Promise.resolve(), saveFailed = false, pendingSaves = 0;
  const LH = window.Longhand;
  const repository = LH && LH.isLocal && LH.Research ? LH.Research.createRepository(LH.researchRecords) : null;
  const store = World.State.createStore({ clock: () => replayTime || new Date().toISOString() });
  const movement = World.Movement.createMovement();
  const source = World.Mock.createSource((event) => store.dispatch(event), () => store.getSnapshot().task);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const elements = new Map();
  let selected = 'director';
  let userPaused = motion.matches;
  let submitted = false, runFinished = false, draftKey = null;
  let snapshot = store.getSnapshot();
  let frame = 0, lastFrame = 0, timer = 0;
  let eventRemaining = 4000, eventStarted = 0;
  const interval = 11000;
  const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const showTime = (value) => timeFormat.format(new Date(value));
  const active = () => !opening && !userPaused && !document.hidden && !runFinished;
  const behavior = (status) => ({ READING: 'read', WORKING: 'work', REVIEWING: 'review', THINKING: 'think', DIRECTING: 'meeting', MEETING: 'meeting', COMPLETED: 'complete', ERROR: 'error', IDLE: 'idle' })[status];

  function sprite(id) {
    return World.Visual.createSprite(document, id);
  }

  function createMember(agent) {
    const character = document.createElement('button');
    character.type = 'button';
    character.className = 'world-character';
    character.dataset.agent = agent.id;
    character.append(sprite(agent.id));
    character.addEventListener('click', () => select(agent.id));
    $('characters').append(character);
    const member = document.createElement('button');
    member.type = 'button';
    member.className = 'world-member';
    member.dataset.agent = agent.id;
    const name = document.createElement('span');
    name.className = 'world-member-name'; name.textContent = agent.name;
    const status = document.createElement('span');
    status.className = 'world-member-status';
    member.append(sprite(agent.id), name, status);
    member.addEventListener('click', () => select(agent.id));
    $('roster').append(member);
    elements.set(agent.id, { character, member, status });
  }
  function announce(message) { $('world-announcement').textContent = message; }
  function planningText(state) {
    return [state.task.title, 'Simulated planning record. No verified findings or publication approval.',
      'Research question: ' + state.task.question, 'Objective: ' + state.task.objective,
      ...state.outputs.map(output => output.title + '\n' + output.body)].join('\n\n');
  }
  function persistRun() {
    if (!repository || !project || restoring) return;
    const id = project.id, times = [...runTimes], state = store.getSnapshot();
    pendingSaves += 1;
    $('project-save-status').textContent = 'Saving project…';
    saveQueue = saveQueue.then(async () => {
      if (!project || project.id !== id) return;
      const next = { ...project, run: { times }, outputs: state.outputs };
      if (project.draftKind === 'planning') next.draftBody = planningText(state);
      project = await repository.save(next, project.revision);
      saveFailed = false;
      $('project-save-status').textContent = 'Saved in this browser · ' + times.length + '/29 simulated events';
      $('project-retry').hidden = true;
    }).catch(error => {
      saveFailed = true;
      userPaused = true; syncActivity();
      $('project-save-status').textContent = 'Not saved. ' + error.message;
      $('project-retry').hidden = false;
    }).finally(() => { pendingSaves -= 1; });
  }
  function select(id) {
    selected = id;
    render(snapshot);
    const agent = snapshot.agents.find((member) => member.id === id);
    announce(agent.name + ', ' + agent.status.toLowerCase() + ', ' + World.State.ROOMS[agent.location] + '. ' + agent.currentTask + ', ' + agent.progress + ' percent.');
  }
  function renderPanel(agent) {
    $('agent-number').textContent = String(snapshot.agents.indexOf(agent) + 1).padStart(2, '0') + ' / ' + String(snapshot.agents.length).padStart(2, '0');
    $('agent-name').textContent = agent.name;
    $('agent-role').textContent = agent.role;
    $('agent-description').textContent = agent.description;
    $('agent-status').textContent = agent.status;
    $('agent-status').dataset.status = agent.status;
    $('agent-location').textContent = World.State.ROOMS[agent.location] + (agent.destination ? ' → ' + World.State.ROOMS[agent.destination] : '');
    $('agent-task').textContent = agent.currentTask;
    $('agent-progress').value = agent.progress;
    $('agent-progress').textContent = agent.progress + '%';
    $('agent-percent').textContent = agent.progress + '%';
    $('agent-activity').textContent = agent.currentActivity;
    $('agent-time').dateTime = agent.lastActivity;
    $('agent-time').textContent = showTime(agent.lastActivity) + ' · Local time';
    if ($('agent-portrait').dataset.agent !== agent.id) {
      $('agent-portrait').replaceChildren(sprite(agent.id));
      $('agent-portrait').dataset.agent = agent.id;
    }
  }
  function renderLog(events) {
    if (!events.length) {
      const empty = document.createElement('li');
      empty.className = 'world-journal-empty';
      empty.textContent = 'The team is at work. The next event will appear here.';
      $('event-log').replaceChildren(empty);
      return;
    }
    $('event-log').replaceChildren(...events.slice(0, 4).map((event) => {
      const row = document.createElement('li');
      row.dataset.event = event.type;
      const time = document.createElement('time'); time.dateTime = event.time; time.textContent = showTime(event.time);
      const name = document.createElement('strong'); name.textContent = event.name;
      const activity = document.createElement('span'); activity.textContent = event.activity;
      row.append(time, name, activity);
      return row;
    }));
  }
  function renderOutputs(state) {
    $('stage-outputs').replaceChildren(...World.State.TASK_DEFINITION.stages.map(stage => {
      const output = state.outputs.find(record => record.agentId === stage.agentId);
      const owner = state.agents.find(agent => agent.id === stage.agentId);
      const working = state.task.status === 'WORKING' && state.task.assignedAgentId === owner.id;
      const row = document.createElement('li');
      row.dataset.agent = owner.id;
      const label = document.createElement('p'); label.className = 'world-output-owner';
      label.textContent = owner.name + ' · ' + (output ? 'Planning record generated' : working ? 'Simulating' : 'Pending simulation');
      const title = document.createElement('h3'); title.textContent = stage.outputTitle;
      const body = document.createElement('p'); body.className = 'world-output-body';
      body.textContent = output ? output.body : 'Available after ' + stage.label.toLowerCase() + '.';
      row.append(label, title, body);
      return row;
    }));
    const ready = state.task.status === 'COMPLETED';
    $('research-draft').hidden = !ready;
    if (!ready) { $('research-draft').open = false; draftKey = null; }
    else if (draftKey !== state.task.completedAt) {
      draftKey = state.task.completedAt;
      const title = document.createElement('h3'); title.textContent = state.task.title;
      const disclosure = document.createElement('p');
      disclosure.textContent = 'Simulated planning draft. No sources were fetched, no findings or figures were verified, and nothing has been published.';
      const reviewed = document.createElement('p');
      reviewed.textContent = 'Simulation completed at ' + showTime(state.task.completedAt) + ' · Local time';
      const blocks = [title, disclosure, reviewed];
      function section(heading, text) {
        const label = document.createElement('h4'); label.textContent = heading;
        const body = document.createElement('p'); body.textContent = text;
        blocks.push(label, body);
      }
      section('Research question', state.task.question);
      section('Objective', state.task.objective);
      state.outputs.forEach(output => section(state.agents.find(agent => agent.id === output.agentId).name + ' / ' + output.title, output.body));
      $('draft-document').replaceChildren(...blocks);
    }
    const locked = opening || (submitted && state.task.status === 'WORKING');
    ['brief-topic', 'brief-question', 'brief-objective', 'brief-submit'].forEach(id => { $(id).disabled = locked; });
    if (submitted && ready) $('brief-feedback').textContent = 'Simulation complete. Research is not finished. Open Workspace for the next action: collect evidence, write the research and record a manual review.';
  }
  function render(state) {
    snapshot = state;
    state.agents.forEach((agent) => {
      const element = elements.get(agent.id);
      [element.character, element.member].forEach((button) => {
        button.setAttribute('aria-pressed', String(agent.id === selected));
        button.setAttribute('aria-label', agent.name + ', ' + agent.status.toLowerCase() + '. View staff dossier');
      });
      element.status.textContent = agent.destination ? 'IN TRANSIT' : agent.status;
      element.character.dataset.status = agent.status;
      element.character.title = agent.name + ' · ' + agent.status.toLowerCase();
    });
    renderPanel(state.agents.find((agent) => agent.id === selected));
    const task = state.task;
    const stages = World.State.TASK_DEFINITION.stages;
    let detail = 'Ready for source collection';
    if (task.status === 'COMPLETED') detail = stages.length + ' of ' + stages.length + ' stages complete';
    else if (task.stage) {
      const stage = stages[task.stage - 1];
      const owner = state.agents.find(agent => agent.id === task.assignedAgentId);
      detail = task.stage === task.completedStages ? stage.label + ' complete; awaiting ' + stages[task.stage].label.toLowerCase() :
        stage.label + ' (' + task.stage + '/' + stages.length + ') · ' + owner.name;
    }
    $('task-state').textContent = 'Team task · ' + task.status + ' · ' + detail;
    $('task-state').dataset.status = task.status;
    renderOutputs(state);
    renderLog(state.events);
    renderPositions();
  }
  function renderPositions() {
    movement.getPositions().forEach((position) => {
      const button = elements.get(position.id).character;
      const agent = snapshot.agents.find((member) => member.id === position.id);
      button.style.left = position.x / 960 * 100 + '%';
      button.style.top = position.y / 620 * 100 + '%';
      button.dataset.behavior = position.walking ? 'walk' : behavior(agent.status);
      button.querySelector('svg').style.scale = position.direction < 0 ? '-1 1' : '1 1';
      button.style.zIndex = String(10 + Math.round(position.y));
    });
  }
  function settle() {
    movement.advance(0, true).forEach(store.dispatch);
    renderPositions();
  }
  function animate(now) {
    frame = 0;
    if (!active()) return;
    const seconds = lastFrame ? Math.min((now - lastFrame) / 1000, 0.06) : 0;
    lastFrame = now;
    movement.advance(seconds).forEach(store.dispatch);
    renderPositions();
    if (movement.isMoving()) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else lastFrame = 0;
  }
  function startMovement() {
    if (motion.matches) { settle(); return; }
    if (active() && movement.isMoving() && !frame) frame = requestAnimationFrame(animate);
  }
  function stopTimer() {
    if (timer) {
      eventRemaining = Math.max(0, eventRemaining - (performance.now() - eventStarted));
      clearTimeout(timer); timer = 0;
    }
  }
  function schedule() {
    if (!active() || timer) return;
    eventStarted = performance.now();
    timer = setTimeout(() => {
      timer = 0;
      if (!active()) return;
      advanceSource();
      eventRemaining = interval;
      schedule();
    }, eventRemaining);
  }
  function updateControls() {
    document.body.dataset.paused = String(!active());
    $('pause').textContent = userPaused ? 'Resume simulation' : 'Pause simulation';
    $('pause').setAttribute('aria-pressed', String(userPaused));
    $('simulation-status').textContent = runFinished ? 'Simulation complete · research requires manual work' : userPaused ? (motion.matches ? 'Manual mode · reduced motion' : 'Simulation paused') : 'Simulation running · events every 11 seconds';
    $('pause').disabled = runFinished;
    $('next').disabled = runFinished;
  }
  function syncActivity() {
    if (!active()) {
      stopTimer();
      if (frame) cancelAnimationFrame(frame);
      frame = 0; lastFrame = 0;
    } else { startMovement(); schedule(); }
    updateControls();
  }
  function advanceSource() {
    if (runFinished) return;
    if (project) { replayTime = new Date().toISOString(); runTimes.push(replayTime); }
    source.next();
    replayTime = null;
    if (submitted && source.getCursor() === 0 && snapshot.task.status === 'COMPLETED') {
      runFinished = true;
      userPaused = true;
      settle();
      syncActivity();
    }
    persistRun();
  }
  function resetSimulation(brief) {
    stopTimer();
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastFrame = 0; runFinished = false;
    movement.reset(World.State.INITIAL_AGENTS);
    source.reset(); store.reset(brief);
    eventRemaining = 4000; syncActivity();
  }
  function nextEvent() {
    if (opening) return;
    stopTimer(); advanceSource();
    if (userPaused) settle();
    eventRemaining = interval; schedule(); updateControls();
    announce(snapshot.events[0].name + '. ' + snapshot.events[0].activity + '.');
  }

  snapshot.agents.forEach(createMember);
  movement.reset(snapshot.agents);
  render(snapshot);
  store.subscribe((state) => {
    movement.sync(state.agents);
    render(state);
    startMovement();
  });
  $('pause').addEventListener('click', () => {
    if (opening) return;
    userPaused = !userPaused; syncActivity();
    announce(userPaused ? 'Simulation paused.' : 'Simulation resumed.');
  });
  $('next').addEventListener('click', nextEvent);
  $('reset').addEventListener('click', () => {
    if (opening) return;
    runTimes = [];
    resetSimulation();
    persistRun();
    if (submitted) $('brief-feedback').textContent = 'Current brief restarted. Use Next event to advance manually.';
    announce('Simulation restarted. All ' + snapshot.agents.length + ' staff are back at the current brief.');
  });
  $('research-brief').addEventListener('submit', async event => {
    event.preventDefault();
    if (opening || (submitted && snapshot.task.status === 'WORKING')) return;
    const brief = World.State.normalizeBrief({ topic: $('brief-topic').value,
      question: $('brief-question').value, objective: $('brief-objective').value });
    if (!brief) {
      $('brief-feedback').textContent = 'Enter a topic (up to 160 characters), question and objective (up to 480 characters each).';
      return;
    }
    if (repository) {
      opening = true; syncActivity(); render(snapshot);
      try {
        await saveQueue;
        if (saveFailed) throw new Error('Retry saving the previous run before starting another brief.');
        project = await repository.create(brief);
        const url = new URL(location.href); url.searchParams.set('project', project.id);
        try { history.replaceState(null, '', url); } catch { /* Direct-file browsers may reject URL updates; the saved project still starts. */ }
        $('project-workspace').href = '../research.html?project=' + encodeURIComponent(project.id);
      } catch (error) {
        opening = false; render(snapshot); syncActivity();
        $('brief-feedback').textContent = 'Could not save this brief. ' + error.message; return;
      }
      opening = false;
    }
    runTimes = [];
    submitted = true; userPaused = motion.matches; selected = 'associate';
    resetSimulation(brief);
    $('brief-feedback').textContent = 'Simulating your brief. Open Workspace to do the research. Use Next event to advance the simulation manually.';
    nextEvent();
  });
  document.addEventListener('visibilitychange', syncActivity);
  window.addEventListener('pagehide', () => {
    stopTimer(); if (frame) cancelAnimationFrame(frame); frame = 0; lastFrame = 0;
  });
  window.addEventListener('beforeunload', event => {
    if (pendingSaves || saveFailed) { event.preventDefault(); event.returnValue = ''; }
  });
  window.addEventListener('pageshow', syncActivity);
  motion.addEventListener('change', () => {
    if (motion.matches) { userPaused = true; settle(); }
    syncActivity();
  });
  ['pause', 'next', 'reset'].forEach((id) => { $(id).disabled = false; });
  syncActivity();

  if (repository) {
    $('project-tools').hidden = false;
    $('project-retry').addEventListener('click', persistRun);
    const id = new URL(location.href).searchParams.get('project');
    if (id) {
      opening = true; userPaused = true; syncActivity(); render(snapshot);
      ['pause', 'next', 'reset'].forEach(key => { $(key).disabled = true; });
      repository.get(id).then(record => {
        if (!record) throw new Error('This project was not found in this browser.');
        project = record; runTimes = [...record.run.times]; submitted = true; restoring = true;
        resetSimulation(record.brief);
        for (const time of runTimes) { replayTime = time; source.next(); settle(); }
        replayTime = null; restoring = false;
        runFinished = runTimes.length === World.Mock.SCRIPT.length;
        ['topic', 'question', 'objective'].forEach(key => { $('brief-' + key).value = record.brief[key]; });
        $('project-workspace').href = '../research.html?project=' + encodeURIComponent(record.id);
        $('project-save-status').textContent = 'Saved project restored · paused · ' + runTimes.length + '/29 simulated events';
        $('brief-feedback').textContent = 'Project restored. Resume or use Next event to continue.';
      }).catch(error => { $('project-save-status').textContent = error.message; }).finally(() => {
        opening = false; restoring = false; replayTime = null;
        ['pause', 'next', 'reset'].forEach(key => { $(key).disabled = false; });
        render(snapshot); syncActivity();
      });
    }
  }

  // Adapter surface for future event sources. External events are not persisted as mock steps.
  World.dispatch = (event) => store.dispatch(event);
  World.getSnapshot = store.getSnapshot;
})();
