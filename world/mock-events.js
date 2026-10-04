/* Replace this producer with an authorized real event source; state/rendering stay separate. */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const SCRIPT = Object.freeze([
    { type: 'agent.started_task', agentId: 'researcher', task: 'Drafting the AI infrastructure note', location: 'research', progress: 8 },
    { type: 'agent.changed_status', agentId: 'director', status: 'MEETING', location: 'hall', activity: 'Considering the research question in Main Hall' },
    { type: 'agent.progress', agentId: 'researcher', progress: 38, activity: 'Organizing the source evidence' },
    { type: 'agent.completed_task', agentId: 'analyst', activity: 'Finished the first assumptions check' },
    { type: 'agent.moved', agentId: 'analyst', location: 'research' },
    { type: 'agent.changed_status', agentId: 'researcher', status: 'THINKING', activity: 'Considering the argument with the analyst' },
    { type: 'agent.started_task', agentId: 'analyst', task: 'Reconciling the research draft', progress: 12 },
    { type: 'agent.error', agentId: 'analyst', activity: 'A mock source is unavailable; verification is on hold' },
    { type: 'agent.changed_status', agentId: 'analyst', status: 'WORKING', activity: 'Mock source restored; verification resumed' },
    { type: 'agent.progress', agentId: 'researcher', progress: 76 },
    { type: 'agent.completed_task', agentId: 'researcher', location: 'library', activity: 'Draft ready for editorial review' },
    { type: 'agent.started_task', agentId: 'editor', task: 'Editing the simulated research draft', location: 'library', status: 'REVIEWING', progress: 22 },
    { type: 'agent.changed_status', agentId: 'researcher', status: 'READING', activity: 'Reading supporting source notes' },
    { type: 'agent.progress', agentId: 'editor', progress: 68 },
    { type: 'agent.completed_task', agentId: 'editor', location: 'editor', activity: 'Editorial pass complete; no report is published' },
    { type: 'agent.completed_task', agentId: 'analyst', location: 'data' },
    { type: 'agent.changed_status', agentId: 'director', status: 'REVIEWING', location: 'director', activity: 'Reviewing the simulated team handoff' },
    { type: 'agent.completed_task', agentId: 'director', activity: 'Research cycle reviewed' },
    { type: 'agent.changed_status', agentId: 'researcher', status: 'IDLE' },
    { type: 'agent.started_task', agentId: 'researcher', task: 'Reading AI infrastructure sources', status: 'READING', location: 'library', progress: 4 },
    { type: 'agent.started_task', agentId: 'analyst', task: 'Checking the model assumptions', location: 'data', progress: 6 },
    { type: 'agent.started_task', agentId: 'editor', task: 'Reviewing clarity and source notes', status: 'REVIEWING', location: 'editor', progress: 9 },
    { type: 'agent.started_task', agentId: 'director', task: 'Setting the next research agenda', status: 'THINKING', location: 'director', progress: 12 }
  ].map(Object.freeze));
  function createSource(dispatch) {
    let cursor = 0;
    return Object.freeze({
      next() { const event = { ...SCRIPT[cursor] }; cursor = (cursor + 1) % SCRIPT.length; return dispatch(event); },
      reset() { cursor = 0; },
      getCursor() { return cursor; }
    });
  }
  World.Mock = Object.freeze({ SCRIPT, createSource });
})(globalThis);
