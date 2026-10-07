/* Responsibilities and saved evidence; simulated activity never completes real work. */
(function (root) {
  'use strict';
  const LH = root.Longhand = root.Longhand || {};
  function guide(project, reports) {
    const state = LH.ResearchOperations.projectState(project, reports);
    const needsReasoning = state.research && !state.reasoning && !state.approved && ['writing', 'review'].includes(state.stage);
    const tasks = [
      { id: 'associate', name: 'Research Associate', section: 'source-heading',
        output: 'Original source links and collection notes.',
        criteria: 'Collect relevant primary sources; record their dates, scope and gaps.',
        record: project.sources.length + ' source(s) saved.' },
      { id: 'researcher', name: 'Researcher', section: state.checked && !state.unchecked ? 'reasoning-heading' : 'source-heading',
        output: 'Findings tied to source passages, with open questions.',
        criteria: 'Read the originals, record what they support and challenge, then check the notes manually.',
        record: state.checked + ' source(s) checked manually; ' + state.unchecked + ' unchecked. ' + (state.reasoning ? 'Core reasoning and thesis evidence saved.' : 'Core reasoning or thesis evidence is incomplete.') },
      { id: 'analyst', name: 'Data Analyst', section: 'reasoning-heading',
        output: 'Reproducible calculations, tables and data limitations where relevant.',
        criteria: 'Explain inputs, units, dates and calculations in the reasoning and draft. State when quantitative analysis is not applicable.',
        record: 'Calculation validation is not recorded separately. Check the draft manually.' },
      { id: 'editor', name: 'Editor', section: state.approved ? 'report-heading' : 'draft-heading',
        output: 'A researched draft; after approval, a checked final PDF for Library.',
        criteria: 'Connect findings into a clear argument, reconcile the draft with the saved reasoning, label uncertainty and prepare the approved report for publication.',
        record: state.research ? 'Research draft saved; factual checks remain manual.' : 'No researched draft saved. Simulation text is planning only.' },
      { id: 'director', name: 'Research Director', section: 'review-heading',
        output: 'A review decision with reasons and revision instructions.',
        criteria: 'Review evidence, reasoning and relevant calculations; record approval or request changes.',
        record: state.approved ? (project.review ? 'Named reviewer and six manual checks recorded.' : 'Legacy approval; reviewer and constitutional checklist were not recorded.') : project.status === 'IN_REVIEW' ? 'Awaiting a manual review decision.' : 'Current research has no approval.' }
    ];
    const owner = needsReasoning ? 'researcher' : state.stage === 'sources' ? (project.sources.length ? 'researcher' : 'associate') :
      state.stage === 'missing' ? 'associate' : ['review', 'published'].includes(state.stage) ? 'director' : 'editor';
    const task = tasks.find(item => item.id === owner);
    const section = needsReasoning ? 'reasoning-heading' : state.stage === 'missing' || (state.published && state.approved) ? 'report-heading' : task.section;
    const blocker = state.missing ? 'The linked Library record is unavailable.' :
      state.published && !state.approved ? 'The current research changed after approval; the catalogue report is unchanged.' :
      state.stage === 'sources' ? (state.unchecked ? 'Source notes still need manual checking.' : 'No checked evidence is saved.') :
      needsReasoning ? 'Core reasoning or linked thesis evidence is missing. Complete it before a fresh manual review.' :
      state.stage === 'writing' ? (state.research ? 'The saved draft needs submission for review.' : 'Researched prose still needs to be written.') :
      state.stage === 'review' ? 'A person must review the saved research and record a decision.' :
      state.stage === 'publication' ? 'Final PDF preparation and publication are manual.' : 'Live deployment must be confirmed separately.';
    return { tasks, owner: task.name, section, next: state.next, blocker,
      simulation: project.run.times.length + '/29 simulated events saved. Simulation does not fetch sources, validate data, write researched prose or grant approval.' };
  }
  LH.ResearchTasks = Object.freeze({ guide });
})(globalThis);
