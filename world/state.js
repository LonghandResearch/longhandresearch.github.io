/* DOM-free agent state. Event producers and the World renderer share this boundary. */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const STATUSES = Object.freeze(['IDLE', 'WORKING', 'THINKING', 'READING', 'MEETING', 'REVIEWING', 'COMPLETED', 'ERROR']);
  const ROOMS = Object.freeze({
    hall: 'Main Hall', library: 'Library', research: 'Research Office',
    data: 'Data Lab', editor: 'Editor Office', director: 'Director Office'
  });
  const INITIAL_AGENTS = Object.freeze([
    { id: 'director', name: 'Research Director', role: 'Research direction', location: 'director', status: 'THINKING', currentTask: 'Setting the research agenda', progress: 18,
      description: 'Sets the question, assigns the work and considers the final argument.' },
    { id: 'researcher', name: 'Researcher I', role: 'Primary research', location: 'library', status: 'READING', currentTask: 'Reading AI infrastructure sources', progress: 34,
      description: 'Reads original sources and builds a reasoned research draft.' },
    { id: 'researcher-ii', name: 'Researcher II', role: 'Research and synthesis', location: 'research', status: 'THINKING', currentTask: 'Structuring the research questions', progress: 27,
      description: 'Connects source material, frames the questions and develops the research argument.' },
    { id: 'researcher-female', name: 'Female Researcher', role: 'Source research', location: 'library', status: 'READING', currentTask: 'Reviewing the primary source materials', progress: 36,
      description: 'Reads the source record and develops the evidence behind the research questions.' },
    { id: 'analyst', name: 'Data Analyst I', role: 'Data and verification', location: 'data', status: 'WORKING', currentTask: 'Checking the model assumptions', progress: 42,
      description: 'Tests assumptions, reconciles observations and checks the calculations.' },
    { id: 'analyst-ii', name: 'Data Analyst II', role: 'Data and modelling', location: 'data', status: 'WORKING', currentTask: 'Reconciling the scenario inputs', progress: 46,
      description: 'Organizes the model inputs and checks the consistency of the simulated scenarios.' },
    { id: 'analyst-female', name: 'Female Data Analyst', role: 'Scenario analysis', location: 'data', status: 'WORKING', currentTask: 'Checking the scenario relationships', progress: 39,
      description: 'Examines the inputs, model relationships and supporting analytical observations.' },
    { id: 'editor', name: 'Editor I', role: 'Editorial review', location: 'editor', status: 'REVIEWING', currentTask: 'Reviewing clarity and source notes', progress: 61,
      description: 'Reviews the evidence, the prose and the final shape of a report.' },
    { id: 'editor-ii', name: 'Editor II', role: 'Editorial production', location: 'editor', status: 'READING', currentTask: 'Reading the draft and source notes', progress: 53,
      description: 'Checks the structure, supporting notes and presentation of the research draft.' },
    { id: 'editor-female', name: 'Female Editor', role: 'Editorial structure', location: 'editor', status: 'REVIEWING', currentTask: 'Refining the simulated research narrative', progress: 58,
      description: 'Shapes the narrative and checks that the evidence and editorial structure agree.' },
    { id: 'associate', name: 'Research Associate', role: 'Research coordination', location: 'hall', status: 'WORKING', currentTask: 'Organizing the team source materials', progress: 32,
      description: 'Maintains the source pack and helps the researchers, analysts and editors collaborate.' }
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
