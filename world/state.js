/* DOM-free agent state. Event producers and the World renderer share this boundary. */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const STATUSES = Object.freeze(['IDLE', 'WORKING', 'THINKING', 'DIRECTING', 'READING', 'MEETING', 'REVIEWING', 'COMPLETED', 'ERROR']);
  const ROOMS = Object.freeze({
    hall: 'Main Hall', library: 'Library', research: 'Research Office',
    data: 'Data Lab', editor: 'Editor Office', director: 'Director Office'
  });
  const TASK_DEFINITION = Object.freeze({
    id: 'ai-infrastructure-trends', title: 'Analyze AI infrastructure market trends',
    stages: Object.freeze([
      { agentId: 'associate', label: 'Source collection', outputTitle: 'Source pack · mock',
        outputBody: 'Candidate source slots: company filings, official statistics, and technical publications. Each needs an author or issuer, publication date, relevant passage and original link. No documents have been collected in this simulation.' },
      { agentId: 'researcher', label: 'Source analysis', outputTitle: 'Analysis notes · mock',
        outputBody: 'Outline the question, identify the evidence needed, compare possible explanations and separate observations from assumptions. Findings remain open until primary sources have been read and assessed.' },
      { agentId: 'analyst', label: 'Quantitative validation', outputTitle: 'Validation checklist · mock',
        outputBody: 'Check units, currencies, reporting periods, source attribution and reproducibility of calculations. No dataset or calculations are supplied here; quantitative claims remain unverified.' },
      { agentId: 'editor', label: 'Editorial preparation', outputTitle: 'Draft outline · mock',
        outputBody: 'Proposed structure: research question and scope, source notes, evidence-led findings, quantitative checks and limitations. Findings and figures need verified evidence before a publication draft can be written.' },
      { agentId: 'director', label: 'Final review', outputTitle: 'Review decision · mock',
        outputBody: 'Simulation complete: all five workflow stages have delivered their mock planning records. Factual approval is pending. This demonstrates the team handoff and does not approve research for publication.' }
    ].map(Object.freeze))
  });
  const DEFAULT_BRIEF = Object.freeze({ topic: TASK_DEFINITION.title,
    question: 'What evidence is needed to assess AI infrastructure market trends?',
    objective: 'Prepare a source-led research note with transparent validation and a clear argument.' });
  const freshTask = (brief) => ({ id: TASK_DEFINITION.id, title: brief.topic,
    question: brief.question, objective: brief.objective,
    assignedAgentId: null, status: 'IDLE', stage: 0, completedStages: 0,
    location: null, currentActivity: 'Ready for source collection', startedAt: null, completedAt: null });
  const INITIAL_AGENTS = Object.freeze([
    { id: 'director', name: 'Research Director', role: 'Founder & Research Lead', location: 'director', status: 'IDLE', currentTask: TASK_DEFINITION.title, progress: 0,
      description: 'Leads Longhand Research, sets the research agenda and reviews the team\'s evidence and final argument.' },
    { id: 'researcher', name: 'Researcher', role: 'Research and source analysis', location: 'library', status: 'IDLE', currentTask: TASK_DEFINITION.title, progress: 0,
      description: 'Investigates the research questions, analyzes original sources and builds a reasoned draft.' },
    { id: 'analyst', name: 'Data Analyst', role: 'Quantitative analysis and validation', location: 'data', status: 'IDLE', currentTask: TASK_DEFINITION.title, progress: 0,
      description: 'Processes the data, tests assumptions, reconciles observations and validates the calculations.' },
    { id: 'editor', name: 'Editor', role: 'Writing and publication preparation', location: 'editor', status: 'IDLE', currentTask: TASK_DEFINITION.title, progress: 0,
      description: 'Develops the prose, reviews the evidence and prepares the research draft for publication.' },
    { id: 'associate', name: 'Research Associate', role: 'Research coordination', location: 'hall', status: 'IDLE', currentTask: TASK_DEFINITION.title, progress: 0,
      description: 'Collects sources, maintains the source pack and coordinates the team\'s research handoffs.' }
  ].map(Object.freeze));
  const TYPES = ['agent.started_task', 'agent.changed_status', 'agent.moved', 'agent.arrived', 'agent.progress', 'agent.completed_task', 'agent.error'];
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const text = (value, maximum = 240) => typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
  function normalizeBrief(value) {
    if (!value || !text(value.topic, 160) || !text(value.question, 480) || !text(value.objective, 480)) return null;
    return { topic: value.topic.trim(), question: value.question.trim(), objective: value.objective.trim() };
  }

  function createStore(options = {}) {
    const clock = options.clock || (() => new Date().toISOString());
    let agents, events, sequence, task, outputs;
    let brief = { ...DEFAULT_BRIEF };
    const listeners = new Set();
    const getSnapshot = () => ({ agents: agents.map((agent) => ({ ...agent })), events: events.map((event) => ({ ...event })),
      sequence, task: { ...task }, outputs: outputs.map(output => ({ ...output })) });
    const notify = () => listeners.forEach((listener) => listener(getSnapshot()));
    function reset(nextBrief = brief) {
      const normalized = normalizeBrief(nextBrief);
      if (!normalized) return false;
      const time = clock();
      brief = normalized;
      task = freshTask(brief);
      outputs = [];
      agents = INITIAL_AGENTS.map((agent) => ({ ...agent, currentTask: task.title, taskId: null, destination: null,
        currentActivity: 'Awaiting the team research task', lastActivity: time, lastActivityText: 'Awaiting the team research task' }));
      events = [];
      sequence = 0;
      notify();
      return true;
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
      const linked = own(event, 'taskId');
      const stageIndex = TASK_DEFINITION.stages.findIndex(stage => stage.agentId === event.agentId);
      if (!linked && event.type === 'agent.started_task' && task.status === 'WORKING' &&
        task.assignedAgentId === event.agentId && task.stage > task.completedStages) return false;
      if (linked) {
        if (typeof event.taskId !== 'string' || event.taskId !== task.id) return false;
        if (event.type === 'agent.started_task') {
          const expected = task.status === 'COMPLETED' ? 0 : task.completedStages;
          if (stageIndex !== expected || event.task.trim() !== task.title) return false;
          if (task.status === 'WORKING' && task.stage !== task.completedStages) return false;
        } else if (task.status !== 'WORKING' || task.assignedAgentId !== event.agentId ||
          task.stage !== task.completedStages + 1 || agents[index].taskId !== task.id) return false;
      }
      const agent = { ...agents[index] };
      let activity;
      switch (event.type) {
        case 'agent.started_task':
          agent.currentTask = event.task.trim();
          agent.taskId = linked ? event.taskId : null;
          agent.progress = event.progress ?? 0;
          agent.status = event.status || 'WORKING';
          activity = 'Started: ' + agent.currentTask;
          break;
        case 'agent.changed_status':
          agent.status = event.status;
          if (own(event, 'progress')) agent.progress = event.progress;
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
      // Arrival is journal history; the working activity continues at the destination.
      if (event.type !== 'agent.arrived') agent.currentActivity = agent.lastActivityText;
      if (linked) {
        if (event.type === 'agent.started_task') {
          if (stageIndex === 0) {
            task = { ...freshTask(brief), startedAt: agent.lastActivity };
            outputs = [];
          }
          task = { ...task, assignedAgentId: agent.id, status: 'WORKING', stage: stageIndex + 1 };
        }
        task = { ...task, location: agent.location, currentActivity: agent.currentActivity };
        if (event.type === 'agent.completed_task') {
          const stage = TASK_DEFINITION.stages[stageIndex];
          outputs.push({ agentId: agent.id, title: stage.outputTitle, body: stage.outputBody,
            completedAt: agent.lastActivity });
          const finished = task.stage === TASK_DEFINITION.stages.length;
          task = { ...task, completedStages: task.stage, status: finished ? 'COMPLETED' : 'WORKING',
            completedAt: finished ? agent.lastActivity : null };
        }
      } else if (event.type === 'agent.arrived' && task.status !== 'IDLE' &&
        task.assignedAgentId === agent.id && agent.taskId === task.id) {
        task = { ...task, location: agent.location };
        if (task.stage > task.completedStages) task.currentActivity = agent.currentActivity;
      }
      agents[index] = agent;
      sequence += 1;
      events.unshift({ id: sequence, type: event.type, agentId: agent.id, taskId: agent.taskId,
        name: agent.name, activity: agent.lastActivityText, time: agent.lastActivity });
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
  World.State = Object.freeze({ STATUSES, ROOMS, TASK_DEFINITION, DEFAULT_BRIEF, normalizeBrief, INITIAL_AGENTS, createStore });
})(globalThis);
