/* Read-only operations view over saved projects and the existing Library. */
(function (root) {
  'use strict';
  const LH = root.Longhand = root.Longhand || {};
  function projectState(project, reports) {
    const report = reports.find(item => item.id === project.reportId) || null;
    const unchecked = project.sources.filter(source => !source.checked).length;
    const checked = project.sources.length - unchecked;
    const research = project.draftKind === 'research' && Boolean(project.draftBody.trim());
    const approved = project.status === 'APPROVED';
    const published = Boolean(report && !report.isLocal);
    const missing = Boolean(project.reportId && !report);
    let stage, label, next, priority;
    if (published) {
      stage = 'published'; label = 'In catalogue'; priority = approved ? 5 : 1;
      next = approved ? 'Open the linked report. Confirm the live deployment separately.' : 'Review the current project. Its linked report is already in the catalogue.';
    } else if (missing) {
      stage = 'missing'; label = 'Report unavailable'; priority = 0;
      next = 'Reconnect the project to a Library record, or clear the old connection.';
    } else if (project.status === 'IN_REVIEW') {
      stage = 'review'; label = 'In review'; priority = 1;
      next = 'Check the claims and evidence, then record approval or request changes.';
    } else if (approved) {
      stage = 'publication'; label = 'Prepare report'; priority = 2;
      next = report ? 'Check the linked PDF draft in Library, then use its Publish tools.' : 'Download the approved text, prepare a PDF and add it to Library.';
    } else if (!checked || unchecked > 0) {
      stage = 'sources'; label = 'Collect evidence'; priority = 3;
      next = project.sources.length ? 'Check an original source and record the evidence it supports.' : 'Add original sources and evidence notes.';
    } else {
      stage = 'writing'; label = 'Write / revise'; priority = 4;
      next = research ? 'Submit the saved research draft for manual review.' : 'Replace planning text with a research draft written from evidence.';
    }
    return { stage, label, next, priority, report, checked, unchecked, research, approved, published, missing,
      attention: !checked || unchecked > 0 || missing || project.status === 'IN_REVIEW' || (approved && !published) || (published && !approved),
      checks: [
        { label: 'Research draft saved', done: research },
        { label: 'At least one original source checked with an evidence note', done: checked > 0 },
        { label: 'Manual editorial approval recorded', done: approved },
        { label: 'Library record connected', done: Boolean(report) },
        { label: 'Connected report present in the local catalogue', done: published }
      ] };
  }
  function summarize(projects, reports) {
    const states = projects.map(project => ({ project, ...projectState(project, reports) }));
    return { total: states.length, review: states.filter(state => state.project.status === 'IN_REVIEW').length,
      publication: states.filter(state => state.approved && !state.published).length,
      unchecked: states.reduce((count, state) => count + state.unchecked, 0),
      published: states.filter(state => state.published).length,
      queue: states.sort((a, b) => a.priority - b.priority || b.project.updatedAt.localeCompare(a.project.updatedAt)) };
  }
  function approvedText(value) {
    const project = LH.Research.normalize(value);
    if (project.status !== 'APPROVED') throw new Error('Complete manual approval before downloading the approved text.');
    const approval = project.history.slice().reverse().find(entry => entry.action === 'Approved');
    return [project.brief.topic, 'Approved working text · Longhand Research',
      'Project: ' + project.id + ' · Revision ' + project.revision,
      '', 'Research question', project.brief.question, '', 'Objective', project.brief.objective,
      '', 'Research draft', project.draftBody, '', 'Source notebook',
      ...project.sources.map((source, index) => [String(index + 1) + '. ' + source.title, source.url,
        source.checked ? 'Checked manually' : 'Unchecked — review before publication', source.notes].join('\n')),
      '', 'Manual approval · ' + approval.at, approval.note,
      '', 'Prepare and check the final PDF in Library. This text download does not publish a report.'
    ].join('\n');
  }
  LH.ResearchOperations = Object.freeze({ projectState, summarize, approvedText });
})(globalThis);
