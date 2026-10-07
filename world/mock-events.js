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
    { type: 'agent.changed_status', agentId: 'director', status: 'DIRECTING', location: 'research', activity: 'Discussing the research argument with the team' },
    { type: 'agent.changed_status', agentId: 'researcher', status: 'THINKING', activity: 'Considering the argument with the analyst' },
    { type: 'agent.started_task', agentId: 'analyst', task: 'Reconciling the research draft', progress: 12 },
    { type: 'agent.error', agentId: 'analyst', activity: 'A mock source is unavailable; verification is on hold' },
    { type: 'agent.changed_status', agentId: 'analyst', status: 'WORKING', activity: 'Mock source restored; verification resumed' },
    { type: 'agent.progress', agentId: 'researcher', progress: 76 },
    { type: 'agent.completed_task', agentId: 'researcher', location: 'library', activity: 'Draft ready for editorial review' },
    { type: 'agent.started_task', agentId: 'editor', task: 'Editing the simulated research draft', location: 'research', status: 'REVIEWING', progress: 22 },
    { type: 'agent.changed_status', agentId: 'researcher', status: 'READING', activity: 'Reading supporting source notes' },
    { type: 'agent.progress', agentId: 'editor', progress: 68 },
    { type: 'agent.completed_task', agentId: 'editor', location: 'editor', activity: 'Editorial pass complete; no report is published' },
    { type: 'agent.completed_task', agentId: 'analyst', location: 'data' },
    { type: 'agent.changed_status', agentId: 'director', status: 'REVIEWING', location: 'data', activity: 'Reviewing the simulated scenario checks in Data Lab' },
    { type: 'agent.changed_status', agentId: 'director', status: 'REVIEWING', location: 'director', activity: 'Reviewing the simulated team handoff' },
    { type: 'agent.completed_task', agentId: 'director', activity: 'Research cycle reviewed' },
    { type: 'agent.changed_status', agentId: 'researcher', status: 'IDLE' },
    { type: 'agent.started_task', agentId: 'analyst', task: 'Checking the model assumptions', location: 'data', progress: 6 },
    { type: 'agent.started_task', agentId: 'editor', task: 'Reviewing clarity and source notes', status: 'REVIEWING', location: 'editor', progress: 9 },
    { type: 'agent.started_task', agentId: 'director', task: 'Setting the next research agenda', status: 'THINKING', location: 'director', progress: 12 },
    { type: 'agent.started_task', agentId: 'researcher-ii', task: 'Comparing the supporting source notes', status: 'READING', location: 'library', progress: 15 },
    { type: 'agent.started_task', agentId: 'analyst-ii', task: 'Discussing the scenario checks', location: 'research', progress: 23 },
    { type: 'agent.started_task', agentId: 'associate', task: 'Preparing the next team handoff', location: 'research', progress: 19 },
    { type: 'agent.changed_status', agentId: 'associate', status: 'READING', location: 'library', activity: 'Collecting supporting references for the team handoff' },
    { type: 'agent.started_task', agentId: 'editor-ii', task: 'Checking the simulated source pack', status: 'REVIEWING', location: 'research', progress: 31 },
    { type: 'agent.completed_task', agentId: 'researcher-ii', location: 'research' },
    { type: 'agent.completed_task', agentId: 'analyst-ii', location: 'data' },
    { type: 'agent.started_task', agentId: 'researcher', task: 'Reading AI infrastructure sources', status: 'READING', location: 'research', progress: 4, activity: 'Reading the digital source notes in Research Office' },
    { type: 'agent.completed_task', agentId: 'editor-ii', location: 'editor' },
    { type: 'agent.completed_task', agentId: 'associate', location: 'hall' },
    { type: 'agent.started_task', agentId: 'researcher-female', task: 'Checking the digital reference notes', status: 'READING', progress: 12 },
    { type: 'agent.progress', agentId: 'researcher-female', progress: 58, activity: 'Connecting the reference notes to the simulated draft' },
    { type: 'agent.completed_task', agentId: 'researcher-female', activity: 'Reference notes prepared for the simulated research draft' },
    { type: 'agent.started_task', agentId: 'analyst-female', task: 'Testing the simulated scenario relationships', status: 'WORKING', progress: 16 },
    { type: 'agent.progress', agentId: 'analyst-female', progress: 63, activity: 'Cross-checking the model inputs and scenario relationships' },
    { type: 'agent.completed_task', agentId: 'analyst-female', activity: 'Scenario checks ready for the research handoff' },
    { type: 'agent.started_task', agentId: 'editor-female', task: 'Refining the simulated publication layout', status: 'REVIEWING', progress: 21 },
    { type: 'agent.progress', agentId: 'editor-female', progress: 72, activity: 'Checking the narrative structure and source captions' },
    { type: 'agent.completed_task', agentId: 'editor-female', activity: 'Editorial layout ready; no report is published' }
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
