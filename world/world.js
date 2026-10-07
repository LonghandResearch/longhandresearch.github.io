/* Page controller and DOM rendering. This is the only World module that touches the page. */
(function () {
  'use strict';
  const World = window.LonghandWorld;
  if (!World || !World.State || !World.Movement || !World.Mock || !World.Visual) {
    document.getElementById('simulation-status').textContent = 'The institution could not load. Refresh to try again.';
    return;
  }
  const $ = (id) => document.getElementById(id);
  const store = World.State.createStore();
  const movement = World.Movement.createMovement();
  const source = World.Mock.createSource((event) => store.dispatch(event));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const elements = new Map();
  let selected = 'director';
  let userPaused = motion.matches;
  let snapshot = store.getSnapshot();
  let frame = 0, lastFrame = 0, timer = 0;
  let eventRemaining = 4000, eventStarted = 0;
  const interval = 11000;
  const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const showTime = (value) => timeFormat.format(new Date(value));
  const active = () => !userPaused && !document.hidden;
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
      source.next();
      eventRemaining = interval;
      schedule();
    }, eventRemaining);
  }
  function updateControls() {
    document.body.dataset.paused = String(!active());
    $('pause').textContent = userPaused ? 'Resume simulation' : 'Pause simulation';
    $('pause').setAttribute('aria-pressed', String(userPaused));
    $('simulation-status').textContent = userPaused ? (motion.matches ? 'Manual mode · reduced motion' : 'Simulation paused') : 'Simulation running · events every 11 seconds';
  }
  function syncActivity() {
    if (!active()) {
      stopTimer();
      if (frame) cancelAnimationFrame(frame);
      frame = 0; lastFrame = 0;
    } else { startMovement(); schedule(); }
    updateControls();
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
    userPaused = !userPaused; syncActivity();
    announce(userPaused ? 'Simulation paused.' : 'Simulation resumed.');
  });
  $('next').addEventListener('click', () => {
    stopTimer(); source.next();
    if (userPaused) settle();
    eventRemaining = interval; schedule();
    announce(snapshot.events[0].name + '. ' + snapshot.events[0].activity + '.');
  });
  $('reset').addEventListener('click', () => {
    stopTimer();
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastFrame = 0;
    movement.reset(World.State.INITIAL_AGENTS);
    source.reset(); store.reset();
    render(store.getSnapshot());
    eventRemaining = 4000; schedule(); updateControls();
    announce('Simulation restarted. All ' + snapshot.agents.length + ' staff are back at their initial tasks.');
  });
  document.addEventListener('visibilitychange', syncActivity);
  window.addEventListener('pagehide', () => {
    stopTimer(); if (frame) cancelAnimationFrame(frame); frame = 0; lastFrame = 0;
  });
  window.addEventListener('pageshow', syncActivity);
  motion.addEventListener('change', () => {
    if (motion.matches) { userPaused = true; settle(); }
    syncActivity();
  });
  ['pause', 'next', 'reset'].forEach((id) => { $(id).disabled = false; });
  syncActivity();

  // Adapter surface for future event sources. No network, requests, storage or publishing.
  World.dispatch = (event) => store.dispatch(event);
  World.getSnapshot = store.getSnapshot;
})();
