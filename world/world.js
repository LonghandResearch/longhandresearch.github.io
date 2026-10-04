/* Page controller and DOM rendering. This is the only World module that touches the page. */
(function () {
  'use strict';
  const World = window.LonghandWorld;
  if (!World || !World.State || !World.Movement || !World.Mock) {
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
  const behavior = (status) => ({ READING: 'read', WORKING: 'work', REVIEWING: 'review', THINKING: 'think', MEETING: 'meeting', COMPLETED: 'complete', ERROR: 'error', IDLE: 'idle' })[status];

  function sprite(id) {
    const palette = {
      director: { coat: '#4d5c55', shade: '#303e37', skin: '#c9a78a', hair: '#bdbaa8', tie: '#d5bf8e' },
      researcher: { coat: '#8d8165', shade: '#625d48', skin: '#bd8c70', hair: '#433c30', tie: '#e0d4b6' },
      analyst: { coat: '#64837f', shade: '#3c5955', skin: '#d5b592', hair: '#383c34', tie: '#bed0c0' },
      editor: { coat: '#8b706f', shade: '#604e51', skin: '#b98467', hair: '#342e29', tie: '#d1b99c' }
    }[id];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 12 20');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.classList.add('world-sprite');
    const rect = (x, y, width, height, fill) => {
      const pixel = document.createElementNS(svg.namespaceURI, 'rect');
      Object.entries({ x, y, width, height, fill }).forEach(([key, value]) => pixel.setAttribute(key, value));
      svg.append(pixel);
    };
    rect(4, 1, 5, 6, palette.skin); rect(3, 1, 6, 2, palette.hair);
    rect(3, 3, 1, 3, palette.hair); rect(8, 3, 1, 1, palette.hair);
    rect(5, 4, 1, 1, '#423b32'); rect(7, 4, 1, 1, '#423b32');
    rect(5, 7, 2, 1, palette.skin); rect(3, 8, 6, 7, palette.coat);
    rect(2, 9, 1, 6, palette.shade); rect(9, 9, 1, 6, palette.shade);
    rect(5, 8, 2, 4, palette.tie); rect(6, 10, 1, 3, palette.shade);
    rect(2, 15, 1, 1, palette.skin); rect(9, 15, 1, 1, palette.skin);
    rect(3, 15, 3, 4, '#34392f'); rect(7, 15, 2, 4, '#34392f');
    rect(2, 19, 4, 1, '#21281f'); rect(7, 19, 3, 1, '#21281f');
    if (id === 'editor') { rect(3, 5, 2, 3, palette.hair); rect(8, 4, 2, 4, palette.hair); }
    if (id === 'director') { rect(4, 4, 5, 1, '#999c8d'); }
    return svg;
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
    member.append(name, status);
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
    $('agent-number').textContent = String(snapshot.agents.indexOf(agent) + 1).padStart(2, '0') + ' / 04';
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
    $('agent-activity').textContent = agent.lastActivityText;
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
    announce('Simulation restarted. All four agents are back at their initial tasks.');
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
