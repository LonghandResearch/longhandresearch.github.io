/* Owner workspace UI; publication remains in the existing library workflow. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LH = window.Longhand;
  if (!LH || !LH.isLocal || !LH.Research || !LH.ResearchOperations || !LH.ResearchTasks) {
    $('workspace-message').textContent = 'Open this workspace from localhost on your own computer to manage local research. Published reports are in the library.';
    return;
  }
  const repository = LH.Research.createRepository(LH.researchRecords);
  const operations = LH.ResearchOperations;
  const fields = LH.Research.REASONING_FIELDS;
  const reviewChecks = LH.Research.REVIEW_CHECKS;
  const names = { DRAFT: 'Draft', IN_REVIEW: 'In review', APPROVED: 'Approved' };
  let projects = [], selected = null, reports = [], busy = false;
  const message = text => { $('workspace-message').textContent = text; };
  let confirmation = null;
  function confirmAction(text, action = 'Discard changes') {
    if (confirmation) return Promise.resolve(false);
    $('confirm-heading').textContent = action === 'Delete project' ? 'Delete project?' : action === 'Remove source' ? 'Remove source?' : 'Unsaved changes';
    $('confirm-message').textContent = text; $('confirm-accept').textContent = action;
    $('workspace-confirm').showModal();
    return new Promise(resolve => { confirmation = resolve; });
  }
  function answerConfirmation(answer) {
    const resolve = confirmation; confirmation = null; $('workspace-confirm').close();
    if (resolve) resolve(answer);
  }
  $('confirm-cancel').addEventListener('click', () => answerConfirmation(false));
  $('confirm-accept').addEventListener('click', () => answerConfirmation(true));
  $('workspace-confirm').addEventListener('cancel', event => { event.preventDefault(); answerConfirmation(false); });
  const hasSourceInput = () => ['title', 'url', 'notes'].some(key => $('source-' + key).value) || $('source-checked').checked;
  const hasEvidenceInput = () => ['source', 'locator', 'note'].some(key => $('evidence-' + key).value) || $('evidence-relation').value !== 'supports';
  function readReasoning() {
    return { ...Object.fromEntries(fields.map(key => [key, $('reasoning-' + key).value])),
      evidence: selected ? LH.Research.clone(selected.reasoning.evidence) : [] };
  }
  function resetReviewInputs(review = null) {
    $('reviewer-name').value = review ? review.reviewer : '';
    reviewChecks.forEach(check => { $('review-check-' + check.id).checked = Boolean(review && review.checks.includes(check.id)); });
  }
  function invalidateReviewInputs(previousReview, pendingReviewer) {
    resetReviewInputs();
    if (!previousReview || pendingReviewer !== previousReview.reviewer) $('reviewer-name').value = pendingReviewer;
  }
  function reviewInput() {
    return { reviewer: $('reviewer-name').value,
      checks: reviewChecks.filter(check => $('review-check-' + check.id).checked).map(check => check.id) };
  }
  function hasReviewInput() {
    const saved = selected && selected.review;
    return JSON.stringify(reviewInput()) !== JSON.stringify({ reviewer: saved ? saved.reviewer : '', checks: saved ? saved.checks : [] });
  }
  function hasContentEdits() {
    if (!selected) return ['topic', 'question', 'objective'].some(key => $('project-' + key).value);
    const saved = { brief: selected.brief, draftBody: selected.draftBody, draftKind: selected.draftKind,
      reportId: selected.reportId, reasoning: selected.reasoning };
    return JSON.stringify(edits()) !== JSON.stringify(saved);
  }
  function hasUnsaved() {
    return hasContentEdits() || hasSourceInput() || hasEvidenceInput() || hasReviewInput() || $('review-note').value.length > 0;
  }
  const permitSwitch = () => hasUnsaved() ? confirmAction('Discard the unsaved edits on this page?') : Promise.resolve(true);
  function node(tag, text) { const result = document.createElement(tag); result.textContent = text; return result; }
  function showList() {
    const overview = operations.summarize(projects, reports);
    $('operations-summary').replaceChildren(...[
      ['Saved projects', overview.total], ['In review', overview.review],
      ['Awaiting report', overview.publication], ['Unchecked sources', overview.unchecked], ['In catalogue', overview.published]
    ].map(([label, count]) => {
      const item = node('div', ''); item.append(node('dt', label), node('dd', String(count))); return item;
    }));
    const filter = $('project-filter').value || 'all';
    const queue = overview.queue.filter(state => filter === 'all' || (filter === 'attention' ? state.attention : state.stage === filter));
    $('queue-count').textContent = queue.length + ' of ' + projects.length + ' projects · ordered by next action';
    $('project-list').replaceChildren(...queue.map(state => {
      const project = state.project;
      const row = document.createElement('li'), button = node('button', project.brief.topic);
      button.type = 'button'; button.setAttribute('aria-current', String(selected && selected.id === project.id));
      button.append(node('small', state.label === names[project.status] ? state.label : state.label + ' · ' + names[project.status]), node('small', LH.ResearchTasks.guide(project, reports).owner + ' · ' + state.next));
      button.addEventListener('click', async () => { if (!busy && await permitSwitch()) open(project); });
      row.append(button); return row;
    }));
    if (!queue.length) $('project-list').append(node('li', projects.length ? 'No projects match this filter.' : 'No saved projects yet. Start with a question.'));
  }
  function open(project, preserveNotes = false) {
    selected = project ? LH.Research.clone(project) : null;
    if (!preserveNotes) {
      $('source-form').reset(); $('review-note').value = ''; resetReviewInputs(selected && selected.review);
      ['source', 'locator', 'note'].forEach(key => { $('evidence-' + key).value = ''; });
      $('evidence-relation').value = 'supports';
    }
    fields.forEach(key => { $('reasoning-' + key).value = selected ? selected.reasoning[key] : ''; });
    const url = new URL(location.href);
    if (selected) url.searchParams.set('project', selected.id); else url.searchParams.delete('project');
    try { history.replaceState(null, '', url); } catch { /* Direct-file browsers may reject URL updates; keep the workspace usable. */ }
    ['topic', 'question', 'objective'].forEach(key => { $('project-' + key).value = selected ? selected.brief[key] : ''; });
    $('saved-project').hidden = !selected;
    $('export-project').disabled = !selected;
    $('delete-project').disabled = !selected;
    if (!selected) { $('project-draft').value = ''; $('draft-research').checked = false; $('source-list').replaceChildren(); }
    $('project-heading').textContent = selected ? selected.brief.topic : 'Start with a question.';
    $('project-meta').textContent = selected ? selected.id + ' / Revision ' + selected.revision : 'New project';
    $('project-status').textContent = selected ? names[selected.status] : 'Draft';
    if (selected) {
      const state = operations.projectState(selected, reports);
      const guide = LH.ResearchTasks.guide(selected, reports);
      $('project-next').textContent = state.label + ' · Next: ' + state.next;
      $('task-owner').textContent = guide.owner;
      $('task-blocker').textContent = guide.blocker;
      $('task-action').textContent = guide.next;
      $('task-action').href = '#' + guide.section;
      $('research-tasks').replaceChildren(...guide.tasks.map(task => {
        const row = node('li', '');
        row.append(node('h4', task.name), node('p', 'Deliverable: ' + task.output), node('p', task.criteria), node('p', 'Saved record: ' + task.record));
        const link = node('a', 'Open ' + task.name + ' work'); link.href = '#' + task.section; row.append(link);
        return row;
      }));
      $('open-world').href = 'world/index.html?project=' + encodeURIComponent(selected.id);
      $('workflow-progress').textContent = guide.simulation;
      $('project-draft').value = selected.draftBody;
      $('draft-research').checked = selected.draftKind === 'research';
      $('draft-note').textContent = selected.draftKind === 'planning' ? 'Planning text from the simulation. Replace it with researched prose before submitting for review.' : 'Your research draft. Source and claim checks are manual.';
      $('submit-review').disabled = selected.status !== 'DRAFT';
      $('approve-review').disabled = selected.status !== 'IN_REVIEW';
      $('revise-review').disabled = selected.status === 'DRAFT';
      $('source-list').replaceChildren(...selected.sources.map(source => {
        const row = document.createElement('li'), link = node('a', source.title);
        link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        row.append(link, node('p', 'Source ID: ' + source.id), node('p', source.notes || 'No evidence note recorded.'), node('p', source.checked ? 'Checked manually' : 'Unchecked'));
        const toggle = node('button', source.checked ? 'Mark unchecked' : 'Mark checked'); toggle.type = 'button'; toggle.className = 'world-action';
        toggle.addEventListener('click', () => perform(async () => {
          const sources = selected.sources.map(item => item.id === source.id ? { ...item, checked: !item.checked } : item);
          await save({ sources });
        }));
        const remove = node('button', 'Remove'); remove.type = 'button'; remove.className = 'world-action';
        remove.addEventListener('click', async () => {
          if (selected.reasoning.evidence.some(item => item.sourceId === source.id)) {
            message('Remove this source\'s thesis evidence links first. Earlier reasoning keeps its own captured sources.'); return;
          }
          if (!await confirmAction('Remove this source from the project?', 'Remove source')) return;
          perform(() => save({ sources: selected.sources.filter(item => item.id !== source.id) }));
        });
        row.append(toggle, remove); return row;
      }));
      const pendingSource = $('evidence-source').value;
      const sourceChoices = [node('option', 'Choose a source')]; sourceChoices[0].value = '';
      selected.sources.forEach(source => {
        const option = node('option', source.title + (source.checked ? ' · checked manually' : ' · unchecked'));
        option.value = source.id; sourceChoices.push(option);
      });
      if (pendingSource && !selected.sources.some(source => source.id === pendingSource)) {
        const option = node('option', 'Source removed: choose another'); option.value = pendingSource; sourceChoices.push(option);
      }
      $('evidence-source').replaceChildren(...sourceChoices); $('evidence-source').value = pendingSource;
      $('thesis-evidence').replaceChildren(...selected.reasoning.evidence.map((item, index) => {
        const source = selected.sources.find(source => source.id === item.sourceId);
        const row = document.createElement('li'), link = node('a', source.title);
        link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        row.append(node('strong', item.relation.charAt(0).toUpperCase() + item.relation.slice(1) + ' · '), link,
          node('p', item.locator + ' · ' + (source.checked ? 'Source checked manually' : 'Source unchecked')), node('p', item.note));
        const remove = node('button', 'Unlink evidence'); remove.type = 'button'; remove.className = 'world-action';
        remove.addEventListener('click', () => perform(() => save({ reasoning: { ...readReasoning(),
          evidence: selected.reasoning.evidence.filter((unused, position) => position !== index) } })));
        row.append(remove); return row;
      }));
      if (!selected.reasoning.evidence.length) $('thesis-evidence').append(node('li', 'No thesis evidence linked yet. Add a notebook source and describe its relevance.'));
      $('review-record').textContent = selected.review ?
        'Reviewed by ' + selected.review.reviewer + ' (manually supplied) · content revision ' + selected.review.revision + ' · ' + new Date(selected.review.at).toLocaleString() :
        selected.status === 'APPROVED' ? 'Legacy approval retained. The new checklist and reviewer attribution were not recorded.' : 'No current constitutional review recorded.';
      $('reasoning-history').replaceChildren(...selected.reasoningHistory.slice().reverse().map(version => {
        const detail = document.createElement('details');
        detail.append(node('summary', 'Revision ' + version.revision + ' · saved ' + new Date(version.at).toLocaleString() + ' · ' + version.brief.topic),
          node('pre', ['Research question', version.brief.question, '', 'Objective', version.brief.objective, '',
            operations.reasoningText(version.reasoning, version.sources), '', 'Source notebook',
            ...version.sources.map(source => [source.title, source.id, source.url, source.notes,
              source.checked ? 'Checked manually' : 'Unchecked'].join('\n')),
            '', 'Working draft (' + version.draftKind + ')', version.draftBody,
            '', version.review ? 'Review by ' + version.review.reviewer + ' · content revision ' + version.review.revision : 'No constitutional checklist recorded for this version.'
          ].join('\n')));
        return detail;
      }));
      if (!selected.reasoningHistory.length) $('reasoning-history').append(node('p', 'No earlier material reasoning retained yet.'));
      const choices = [node('option', 'No report linked')]; choices[0].value = '';
      reports.forEach(report => { const option = node('option', report.title + (report.isLocal ? ' (browser draft)' : ' (published)')); option.value = report.id; choices.push(option); });
      if (selected.reportId && !reports.some(report => report.id === selected.reportId)) {
        const missing = node('option', 'Linked record unavailable: ' + selected.reportId); missing.value = selected.reportId; choices.push(missing);
      }
      $('linked-report').replaceChildren(...choices); $('linked-report').value = selected.reportId || '';
      const report = reports.find(report => report.id === selected.reportId);
      $('report-link').replaceChildren();
      if (report) { const link = node('a', 'Open ' + (report.isLocal ? 'browser draft' : 'published report')); link.href = LH.reportHref(report); $('report-link').append(link); }
      else if (selected.reportId) $('report-link').textContent = 'The linked record is unavailable. The project and its evidence remain saved.';
      $('publication-checklist').replaceChildren(...state.checks.map(check => {
        const row = node('li', (check.done ? 'Done · ' : 'Pending · ') + check.label);
        row.setAttribute('data-complete', String(check.done)); return row;
      }));
      const warnings = [];
      if (state.unchecked) warnings.push(state.unchecked + ' source(s) remain unchecked. Review them before publication.');
      if (state.published && !state.approved) warnings.push('The current project is not approved. The linked report is already in the catalogue; project edits do not revise that report.');
      if (state.missing) warnings.push('The connected report is unavailable. Reconnect or clear it; project evidence is still saved.');
      if (state.approved && !selected.review) warnings.push('Legacy approval has no recorded constitutional checklist. You can request changes and review it under the new practice.');
      $('publication-warning').textContent = warnings.join(' ');
      $('download-approved').disabled = !state.approved;
      $('project-history').replaceChildren(...selected.history.slice().reverse().map(entry => {
        const row = document.createElement('li'); row.append(node('strong', entry.action), node('p', new Date(entry.at).toLocaleString()), node('p', entry.note)); return row;
      }));
    }
    showList();
  }
  function edits() {
    return { brief: { topic: $('project-topic').value, question: $('project-question').value, objective: $('project-objective').value },
      draftBody: $('project-draft').value, draftKind: $('draft-research').checked ? 'research' : 'planning',
      reportId: $('linked-report').value || null, reasoning: readReasoning() };
  }
  async function refresh(project = selected, preserveNotes = true) {
    projects = await repository.all(); reports = await LH.allReports();
    open(project ? projects.find(item => item.id === project.id) : null, preserveNotes);
  }
  async function save(extra = {}) {
    if (!selected) throw new Error('Save the brief to create a project first.');
    const next = { ...selected, ...edits(), ...extra };
    const content = value => JSON.stringify([value.brief, value.sources, value.draftBody, value.draftKind, value.reasoning]);
    const previous = selected, pendingReviewer = $('reviewer-name').value;
    const updated = await repository.save(next, selected.revision);
    await refresh(updated);
    if (content(updated) !== content(previous)) invalidateReviewInputs(previous.review, pendingReviewer);
  }
  async function perform(operation, success = 'Saved in this browser.') {
    if (busy) return;
    busy = true; $('workspace-content').inert = true; $('workspace-content').setAttribute('aria-busy', 'true');
    try { await operation(); message(success); }
    catch (error) { message('Not saved. ' + error.message); }
    finally { busy = false; $('workspace-content').inert = false; $('workspace-content').setAttribute('aria-busy', 'false'); }
  }
  window.addEventListener('beforeunload', event => { if (hasUnsaved()) { event.preventDefault(); event.returnValue = ''; } });
  $('new-project').addEventListener('click', async () => { if (!busy && await permitSwitch()) open(null); });
  $('delete-project').addEventListener('click', async () => {
    if (busy || !selected) return;
    const target = { id: selected.id, revision: selected.revision, topic: selected.brief.topic };
    if (!await confirmAction('Permanently delete “' + target.topic + '”, including its sources, draft, workflow and review history? This cannot be undone without an exported backup. Linked Library reports are kept.', 'Delete project')) return;
    await perform(async () => { await repository.remove(target.id, target.revision); await refresh(null, false); }, 'Project deleted. Sources, draft and workflow removed; Library reports were kept.');
  });
  $('project-filter').addEventListener('change', showList);
  function reloadCatalogue() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const previous = window.LONGHAND_REPORTS;
      script.src = 'reports/reports.js?v=' + Date.now();
      script.onload = () => {
        script.remove();
        if (!Array.isArray(window.LONGHAND_REPORTS) || window.LONGHAND_REPORTS === previous) reject(new Error('The report catalogue did not load correctly. Your open work was kept.'));
        else resolve();
      };
      script.onerror = () => { script.remove(); reject(new Error('The report catalogue could not be reloaded. Try again; your open work was kept.')); };
      document.head.append(script);
    });
  }
  $('reload-projects').addEventListener('click', async () => {
    if (!busy && await permitSwitch()) perform(async () => { await reloadCatalogue(); await refresh(selected, false); }, 'Saved projects and the current report catalogue reloaded.');
  });
  $('project-form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      if (selected) await save();
      else { const project = await repository.create(edits().brief); await refresh(project); }
    });
  });
  $('draft-form').addEventListener('submit', event => { event.preventDefault(); perform(() => save()); });
  $('reasoning-form').addEventListener('submit', event => { event.preventDefault(); perform(() => save()); });
  $('evidence-form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      if (!selected) throw new Error('Save a project first.');
      const item = { sourceId: $('evidence-source').value, relation: $('evidence-relation').value,
        locator: $('evidence-locator').value, note: $('evidence-note').value };
      await save({ reasoning: { ...readReasoning(), evidence: [...selected.reasoning.evidence, item] } });
      ['source', 'locator', 'note'].forEach(key => { $('evidence-' + key).value = ''; });
      $('evidence-relation').value = 'supports';
    }, 'Thesis evidence linked in this browser. Its relevance remains your analytical judgment.');
  });
  $('append-reasoning').addEventListener('click', () => {
    if (busy || !selected) return;
    const extra = '\n\nReasoning record\n\n' + operations.reasoningText(readReasoning(), selected.sources);
    if ($('project-draft').value.length + extra.length > 100000) { message('The appended reasoning would exceed the draft limit. Keep it in the reasoning record.'); return; }
    $('project-draft').value += extra;
    message('Reasoning appended to your open draft. Review the prose and save it; editorial status has not changed.');
  });
  $('report-form').addEventListener('submit', event => { event.preventDefault(); perform(() => save()); });
  $('source-form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      const source = { id: 'source-' + crypto.randomUUID(), title: $('source-title').value,
        url: $('source-url').value, notes: $('source-notes').value, checked: $('source-checked').checked };
      await save({ sources: [...selected.sources, source] });
      $('source-form').reset();
    });
  });
  [['submit-review', 'submit'], ['approve-review', 'approve'], ['revise-review', 'revise']].forEach(([button, action]) => {
    $(button).addEventListener('click', () => perform(async () => {
      const note = $('review-note').value;
      if (hasSourceInput() || hasEvidenceInput()) throw new Error('Add or clear the pending source or evidence link before reviewing.');
      if (hasContentEdits()) throw new Error('Save your brief, draft and reasoning before reviewing this version.');
      const project = await repository.review(selected.id, selected.revision, action, note, reviewInput());
      const previousReview = selected.review, pendingReviewer = $('reviewer-name').value;
      await refresh(project); $('review-note').value = '';
      if (action === 'approve') resetReviewInputs(project.review);
      else if (action === 'revise') invalidateReviewInputs(previousReview, pendingReviewer);
    }, 'Review decision saved. Nothing has been published.'));
  });
  function exportBackup(single = false) { return perform(async () => {
    if (hasSourceInput()) throw new Error('Add the pending source before exporting.');
    if (hasEvidenceInput()) throw new Error('Link or clear the pending thesis evidence before exporting.');
    if ($('review-note').value || hasReviewInput()) throw new Error('Save the pending review decision before exporting.');
    if (hasContentEdits()) { if (!selected) throw new Error('Save the new project before exporting.'); await save(); }
    download(await repository.exportBackup(single && selected ? selected.id : undefined), 'application/json',
      'longhand-research-' + (single && selected ? selected.id : 'backup') + '-' + new Date().toISOString().slice(0, 10) + '.json');
  }, 'Backup exported. It includes projects, sources, drafts and review history; PDF files are separate.'); }
  function download(body, type, filename) {
    const url = URL.createObjectURL(new Blob([body], { type })), link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('download-approved').addEventListener('click', () => perform(async () => {
    if (hasUnsaved()) throw new Error('Save your edits and complete their review before downloading approved text.');
    const current = selected && await repository.get(selected.id);
    if (!current || current.revision !== selected.revision) throw new Error('This project changed in another tab. Reload it before downloading approved text.');
    download(operations.approvedText(current), 'text/plain;charset=utf-8', current.id + '-approved-r' + current.revision + '.txt');
  }, 'Approved text downloaded. Prepare and check its PDF in Library before publication.'));
  $('export-projects').addEventListener('click', () => exportBackup());
  $('export-project').addEventListener('click', () => exportBackup(true));
  $('import-projects').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!await permitSwitch()) { event.target.value = ''; return; }
    perform(async () => {
      if (file.size > 5000000) throw new Error('Choose a backup smaller than 5 MB.');
      await repository.importBackup(await file.text()); await refresh(selected, false);
    }, 'Backup imported. Existing projects were preserved.').finally(() => { event.target.value = ''; });
  });
  perform(async () => {
    projects = await repository.all(); reports = await LH.allReports();
    const id = new URL(location.href).searchParams.get('project');
    const project = id ? projects.find(item => item.id === id) : projects[0];
    if (id && !project) throw new Error('This project was not found in this browser.');
    open(project || null); $('workspace-content').hidden = false;
  }, 'Research storage ready. Work is saved in this browser.');
})();
