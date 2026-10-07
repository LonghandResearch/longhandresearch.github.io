/* Replace this producer with an authorized real event source; state/rendering stay separate. */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const task = World.State.TASK_DEFINITION;
  const step = (type, agentId, fields) => ({ type: 'agent.' + type, agentId, taskId: task.id, ...fields });
  const start = (agentId, fields) => step('started_task', agentId, { task: task.title, ...fields });
  const SCRIPT = Object.freeze([
    start('associate', { location: 'library', progress: 5, activity: 'Collecting relevant primary sources' }),
    step('changed_status', 'associate', { status: 'READING', activity: 'Checking source dates and relevance' }),
    step('progress', 'associate', { progress: 70, activity: 'Organizing the source pack for the Researcher' }),
    step('completed_task', 'associate', { location: 'hall', activity: 'Source collection complete; ready for research analysis' }),

    start('researcher', { status: 'READING', location: 'library', progress: 10, activity: 'Reading the collected primary sources' }),
    step('changed_status', 'researcher', { status: 'THINKING', location: 'research', activity: 'Connecting the evidence to the research question' }),
    step('changed_status', 'researcher', { status: 'WORKING', activity: 'Analyzing the source evidence and market themes' }),
    step('progress', 'researcher', { progress: 75, activity: 'Structuring the findings for quantitative validation' }),
    step('completed_task', 'researcher', { activity: 'Source analysis complete; ready for the Data Analyst' }),

    start('analyst', { location: 'data', progress: 10, activity: 'Processing the simulated research data' }),
    step('progress', 'analyst', { progress: 65, activity: 'Cross-checking the inputs and calculations' }),
    step('changed_status', 'analyst', { status: 'REVIEWING', activity: 'Validating the quantitative findings' }),
    step('completed_task', 'analyst', { activity: 'Quantitative validation complete; ready for editorial preparation' }),

    start('editor', { status: 'READING', location: 'editor', progress: 10, activity: 'Reading the research findings and validation notes' }),
    step('changed_status', 'editor', { status: 'WORKING', activity: 'Writing and editing the research narrative' }),
    step('progress', 'editor', { progress: 70, activity: 'Preparing the draft and source captions' }),
    step('changed_status', 'editor', { status: 'REVIEWING', activity: 'Reviewing clarity, evidence and publication readiness' }),
    step('completed_task', 'editor', { activity: 'Editorial preparation complete; ready for final review' }),

    start('director', { status: 'THINKING', location: 'director', progress: 10, activity: 'Considering the combined research and validation' }),
    step('changed_status', 'director', { status: 'DIRECTING', location: 'research', activity: 'Discussing the research argument with the team' }),
    step('changed_status', 'director', { status: 'MEETING', location: 'hall', activity: 'Coordinating the final team handoff' }),
    step('changed_status', 'director', { status: 'REVIEWING', location: 'data', progress: 60, activity: 'Reviewing the validated quantitative evidence' }),
    step('changed_status', 'director', { status: 'REVIEWING', location: 'director', progress: 85, activity: 'Reviewing the final research argument' }),
    step('completed_task', 'director', { activity: 'Final review complete; simulated research task completed' }),

    ...task.stages.map(stage => ({ type: 'agent.changed_status', agentId: stage.agentId,
      status: 'IDLE', activity: stage.label + ' complete; ready for the next research task' }))
  ].map(Object.freeze));
  function createSource(dispatch, getTask = () => task) {
    let cursor = 0;
    return Object.freeze({
      next() {
        const event = { ...SCRIPT[cursor] };
        if (event.type === 'agent.started_task') event.task = getTask().title;
        cursor = (cursor + 1) % SCRIPT.length;
        return dispatch(event);
      },
      reset() { cursor = 0; },
      getCursor() { return cursor; }
    });
  }
  World.Mock = Object.freeze({ SCRIPT, createSource });
})(globalThis);
