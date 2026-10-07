/* DOM-free agent state. Event producers and the World renderer share this boundary. */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const STATUSES = Object.freeze(['IDLE', 'WORKING', 'THINKING', 'DIRECTING', 'READING', 'MEETING', 'REVIEWING', 'COMPLETED', 'ERROR']);
  const ROOMS = Object.freeze({
    hall: 'Main Hall', library: 'Library', research: 'Research Office',
    data: 'Data Lab', editor: 'Editor Office', director: 'Director Office'
  });
  const INITIAL_AGENTS = Object.freeze([
    { id: 'director', name: 'Research Director', role: 'Founder & Research Lead', location: 'director', status: 'THINKING', currentTask: 'Setting the research agenda', progress: 18,
      description: 'Leads Longhand Research, sets the research agenda and reviews the team\'s evidence and final argument.' },
    { id: 'researcher', name: 'Researcher', role: 'Research and source analysis', location: 'library', status: 'READING', currentTask: 'Reading AI infrastructure sources', progress: 34,
      description: 'Investigates the research questions, analyzes original sources and builds a reasoned draft.' },
    { id: 'analyst', name: 'Data Analyst', role: 'Quantitative analysis and validation', location: 'data', status: 'WORKING', currentTask: 'Checking the model assumptions', progress: 42,
      description: 'Processes the data, tests assumptions, reconciles observations and validates the calculations.' },
    { id: 'editor', name: 'Editor', role: 'Writing and publication preparation', location: 'editor', status: 'REVIEWING', currentTask: 'Reviewing clarity and source notes', progress: 61,
      description: 'Develops the prose, reviews the evidence and prepares the research draft for publication.' },
    { id: 'associate', name: 'Research Associate', role: 'Research coordination', location: 'hall', status: 'WORKING', currentTask: 'Organizing the team source materials', progress: 32,
      description: 'Collects sources, maintains the source pack and coordinates the team\'s research handoffs.' }
  ].map(Object.freeze));
  const TYPES = ['agent.started_task', 'agent.changed_status', 'agent.moved', 'agent.arrived', 'agent.progress', 'agent.completed_task', 'agent.error'];
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const text = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 240;

  function createStore(options = {}) {
    const clock = options.clock || (() => new Date().toISOString());
    let agents, events, sequence;
    const listeners = new Set();
    const getSnapshot = () => ({ agents: agents.map((agent) => ({ ...agent })), events: events.map((event) => ({ ...event })), sequence });
    const notify = () => listeners.forEach((listener) => listener(getSnapshot()));
    function reset() {
      const time = clock();
      agents = INITIAL_AGENTS.map((agent) => ({ ...agent, destination: null, lastActivity: time, lastActivityText: 'At work in the institution' }));
      events = [];
      sequence = 0;
      notify();
    }
    function dispatch(event) {
      if (!event || typeof event !== 'object' || !TYPES.includes(event.type)) return false;
      const index = agents.findIndex((agent) => agent.id === event.agentId);
      if (index < 0) return false;
      if (own(event, 'status') && !STATUSES.includes(event.status)) return false;
      if (own(event, 'location') && (typeof event.location !== 'string' || !own(ROOMS, event.location))) return false;
      if (own(event, 'progress') && (typeof event.progress !== 'number' || !Number.isFinite(event.progress) || event.progress < 0 || event.progress > 100)) return false;
      if (own(event, 'task') && !text(event.task)) return false;
      if (own(event, 'activity') && !text(event.activity)) return false;
      if (event.type === 'agent.started_task' && !text(event.task)) return false;
      if (event.type === 'agent.changed_status' && !own(event, 'status')) return false;
      if (['agent.moved', 'agent.arrived'].includes(event.type) && !own(event, 'location')) return false;
      if (event.type === 'agent.progress' && !own(event, 'progress')) return false;
      const agent = { ...agents[index] };
      let activity;
      switch (event.type) {
        case 'agent.started_task':
          agent.currentTask = event.task.trim();
          agent.progress = event.progress ?? 0;
          agent.status = event.status || 'WORKING';
          activity = 'Started: ' + agent.currentTask;
          break;
        case 'agent.changed_status':
          agent.status = event.status;
          activity = 'Status changed to ' + agent.status.toLowerCase();
          break;
        case 'agent.moved':
          activity = 'Walking to ' + ROOMS[event.location];
          break;
        case 'agent.arrived':
          if (agent.destination !== event.location) return false;
          agent.location = event.location;
          agent.destination = null;
          activity = 'Arrived at ' + ROOMS[event.location];
          break;
        case 'agent.progress':
          agent.progress = event.progress;
          activity = 'Task progress reached ' + agent.progress + '%';
          break;
        case 'agent.completed_task':
          agent.status = 'COMPLETED';
          agent.progress = 100;
          activity = 'Completed: ' + agent.currentTask;
          break;
        case 'agent.error':
          agent.status = 'ERROR';
          activity = 'A source is unavailable; waiting for review';
          break;
      }
      // Location remains the last confirmed room until the behavior layer arrives.
      if (event.type !== 'agent.arrived' && own(event, 'location')) {
        agent.destination = event.location;
      }
      agent.lastActivity = clock();
      agent.lastActivityText = event.activity || activity;
      agents[index] = agent;
      sequence += 1;
      events.unshift({ id: sequence, type: event.type, agentId: agent.id, name: agent.name, activity: agent.lastActivityText, time: agent.lastActivity });
      events = events.slice(0, 12);
      notify();
      return true;
    }
    reset();
    return Object.freeze({ getSnapshot, dispatch, reset, subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    } });
  }
  World.State = Object.freeze({ STATUSES, ROOMS, INITIAL_AGENTS, createStore });
})(globalThis);
