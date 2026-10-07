/* Read-only operations view over saved projects and the existing Library. */
(function (root) {
  'use strict';
  const LH = root.Longhand = root.Longhand || {};
  const reasoningLabels = Object.freeze({ thesis: 'Current thesis', analysis: 'Evidence, interpretation and reasoning',
    assumptions: 'Key assumptions', alternatives: 'Alternatives and qualifying explanations',
    uncertainty: 'Confidence and uncertainty', horizon: 'Time and scope', reviewConditions: 'Conditions for review or revision' });
  function reasoningReady(reasoning) {
    return Boolean(reasoning && ['thesis', 'analysis', 'uncertainty', 'reviewConditions'].every(key => reasoning[key].trim()) && reasoning.evidence.length);
  }
  function reasoningText(reasoning, sources) {
    const value = reasoning || LH.Research.emptyReasoning();
    return [...Object.entries(reasoningLabels).flatMap(([key, label]) => [label, value[key] || 'Not recorded.', '']),
      'Evidence for the thesis', ...(value.evidence.length ? value.evidence.map(item => {
        const source = sources.find(source => source.id === item.sourceId);
        return [item.relation + ' · ' + (source ? source.title : item.sourceId), 'Source ID: ' + item.sourceId,
          source ? source.url : 'Source unavailable.', 'Locator: ' + item.locator, item.note].join('\n');
      }) : ['No evidence links recorded.'])].join('\n');
  }
  function projectState(project, reports) {
    const report = reports.find(item => item.id === project.reportId) || null;
    const unchecked = project.sources.filter(source => !source.checked).length;
    const checked = project.sources.length - unchecked;
    const research = project.draftKind === 'research' && Boolean(project.draftBody.trim());
    const approved = project.status === 'APPROVED';
    const reasoning = reasoningReady(project.reasoning);
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
      next = reasoning ? 'Check the claims and evidence, then record approval or request changes.' : 'Complete the reasoning record and linked evidence, then resubmit for review.';
    } else if (approved) {
      stage = 'publication'; label = 'Prepare report'; priority = 2;
      next = report ? 'Check the linked PDF draft in Library, then use its Publish tools.' : 'Download the approved text, prepare a PDF and add it to Library.';
    } else if (!checked || unchecked > 0) {
      stage = 'sources'; label = 'Collect evidence'; priority = 3;
      next = project.sources.length ? 'Check an original source and record the evidence it supports.' : 'Add original sources and evidence notes.';
    } else {
      stage = 'writing'; label = 'Write / revise'; priority = 4;
      next = research ? (reasoning ? 'Submit the saved research draft for manual review.' : 'Record the thesis, reasoning, uncertainty and review conditions, then link its evidence.') : 'Replace planning text with a research draft written from evidence.';
    }
    return { stage, label, next, priority, report, checked, unchecked, research, reasoning, approved, published, missing,
      attention: !checked || unchecked > 0 || missing || project.status === 'IN_REVIEW' || (approved && !published) || (published && !approved),
      checks: [
        { label: 'Research draft saved', done: research },
        { label: 'At least one original source checked with an evidence note', done: checked > 0 },
        { label: 'Reasoning record and thesis evidence saved', done: reasoning },
        { label: 'Manual editorial approval recorded', done: approved },
        { label: 'Constitutional review checklist recorded', done: Boolean(approved && project.review) },
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
      '', 'Reasoning record', reasoningText(project.reasoning, project.sources),
      '', 'Manual approval · ' + approval.at, approval.note,
      ...(project.review ? ['Reviewer: ' + project.review.reviewer + ' (manually supplied)',
        'Reviewed content revision: ' + project.review.revision,
        ...LH.Research.REVIEW_CHECKS.map(check => 'Checked manually: ' + check.label)] :
        ['Legacy approval: the constitutional checklist and reviewer attribution were not recorded.']),
      '', 'Prepare and check the final PDF in Library. This text download does not publish a report.'
    ].join('\n');
  }
  LH.ResearchOperations = Object.freeze({ projectState, summarize, approvedText, reasoningReady, reasoningText });
})(globalThis);
