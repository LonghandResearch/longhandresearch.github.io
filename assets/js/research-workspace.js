/* Owner workspace UI; publication remains in the existing library workflow. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LH = window.Longhand;
  if (!LH || !LH.isLocal || !LH.Research) {
    $('workspace-message').textContent = 'Open this workspace from localhost on your own computer to manage local research. Published reports are in the library.';
    return;
  }
  const repository = LH.Research.createRepository(LH.researchRecords);
  const names = { DRAFT: 'Draft', IN_REVIEW: 'In review', APPROVED: 'Approved' };
  let projects = [], selected = null, reports = [], busy = false;
  const message = text => { $('workspace-message').textContent = text; };
  let confirmation = null;
  function confirmAction(text, action = 'Discard changes') {
    if (confirmation) return Promise.resolve(false);
    $('confirm-heading').textContent = action === 'Remove source' ? 'Remove source?' : 'Unsaved changes';
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
  function hasUnsaved() {
    if (!selected) return ['topic', 'question', 'objective'].some(key => $('project-' + key).value);
    const saved = { brief: selected.brief, draftBody: selected.draftBody, draftKind: selected.draftKind, reportId: selected.reportId };
    return JSON.stringify(edits()) !== JSON.stringify(saved) || hasSourceInput() || $('review-note').value.length > 0;
  }
  const permitSwitch = () => hasUnsaved() ? confirmAction('Discard the unsaved edits on this page?') : Promise.resolve(true);
  function node(tag, text) { const result = document.createElement(tag); result.textContent = text; return result; }
  function showList() {
    $('project-list').replaceChildren(...projects.map(project => {
      const row = document.createElement('li'), button = node('button', project.brief.topic);
      button.type = 'button'; button.setAttribute('aria-current', String(selected && selected.id === project.id));
      button.append(node('small', names[project.status] + ' · ' + project.run.times.length + '/29 steps'));
      button.addEventListener('click', async () => { if (!busy && await permitSwitch()) open(project); });
      row.append(button); return row;
    }));
    if (!projects.length) $('project-list').append(node('li', 'No saved projects yet.'));
  }
  function open(project, preserveNotes = false) {
    selected = project ? LH.Research.clone(project) : null;
    if (!preserveNotes) { $('source-form').reset(); $('review-note').value = ''; }
    const url = new URL(location.href);
    if (selected) url.searchParams.set('project', selected.id); else url.searchParams.delete('project');
    history.replaceState(null, '', url);
    ['topic', 'question', 'objective'].forEach(key => { $('project-' + key).value = selected ? selected.brief[key] : ''; });
    $('saved-project').hidden = !selected;
    $('export-project').disabled = !selected;
    $('project-heading').textContent = selected ? selected.brief.topic : 'Start with a question.';
    $('project-meta').textContent = selected ? selected.id + ' / Revision ' + selected.revision : 'New project';
    $('project-status').textContent = selected ? names[selected.status] : 'Draft';
    if (selected) {
      $('open-world').href = 'world/index.html?project=' + encodeURIComponent(selected.id);
      $('workflow-progress').textContent = selected.run.times.length + ' of 29 simulated steps saved · ' + selected.outputs.length + ' of 5 stage records';
      $('project-draft').value = selected.draftBody;
      $('draft-research').checked = selected.draftKind === 'research';
      $('draft-note').textContent = selected.draftKind === 'planning' ? 'Planning text from the simulation. Replace it with researched prose before submitting for review.' : 'Your research draft. Source and claim checks are manual.';
      $('submit-review').disabled = selected.status !== 'DRAFT';
      $('approve-review').disabled = selected.status !== 'IN_REVIEW';
      $('revise-review').disabled = selected.status === 'DRAFT';
      $('source-list').replaceChildren(...selected.sources.map(source => {
        const row = document.createElement('li'), link = node('a', source.title);
        link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        row.append(link, node('p', source.notes || 'No evidence note recorded.'), node('p', source.checked ? 'Checked manually' : 'Unchecked'));
        const toggle = node('button', source.checked ? 'Mark unchecked' : 'Mark checked'); toggle.type = 'button'; toggle.className = 'world-action';
        toggle.addEventListener('click', () => perform(async () => {
          const sources = selected.sources.map(item => item.id === source.id ? { ...item, checked: !item.checked } : item);
          await save({ sources });
        }));
        const remove = node('button', 'Remove'); remove.type = 'button'; remove.className = 'world-action';
        remove.addEventListener('click', async () => {
          if (!await confirmAction('Remove this source from the project?', 'Remove source')) return;
          perform(() => save({ sources: selected.sources.filter(item => item.id !== source.id) }));
        });
        row.append(toggle, remove); return row;
      }));
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
      $('project-history').replaceChildren(...selected.history.slice().reverse().map(entry => {
        const row = document.createElement('li'); row.append(node('strong', entry.action), node('p', new Date(entry.at).toLocaleString()), node('p', entry.note)); return row;
      }));
    }
    showList();
  }
  function edits() {
    return { brief: { topic: $('project-topic').value, question: $('project-question').value, objective: $('project-objective').value },
      draftBody: $('project-draft').value, draftKind: $('draft-research').checked ? 'research' : 'planning', reportId: $('linked-report').value || null };
  }
  async function refresh(project = selected, preserveNotes = true) {
    projects = await repository.all(); reports = await LH.allReports();
    open(project ? projects.find(item => item.id === project.id) : null, preserveNotes);
  }
  async function save(extra = {}) {
    if (!selected) throw new Error('Save the brief to create a project first.');
    const updated = await repository.save({ ...selected, ...edits(), ...extra }, selected.revision);
    await refresh(updated);
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
  $('reload-projects').addEventListener('click', async () => { if (!busy && await permitSwitch()) perform(() => refresh(selected, false), 'Saved work reloaded.'); });
  $('project-form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      if (selected) await save();
      else { const project = await repository.create(edits().brief); await refresh(project); }
    });
  });
  $('draft-form').addEventListener('submit', event => { event.preventDefault(); perform(() => save()); });
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
      if (hasUnsaved()) await save();
      const project = await repository.review(selected.id, selected.revision, action, note);
      await refresh(project); $('review-note').value = '';
    }, 'Review decision saved. Nothing has been published.'));
  });
  function exportBackup(single = false) { return perform(async () => {
    if (hasSourceInput()) throw new Error('Add the pending source before exporting.');
    if ($('review-note').value) throw new Error('Save the pending review decision before exporting.');
    if (hasUnsaved()) { if (!selected) throw new Error('Save the new project before exporting.'); await save(); }
    const blob = new Blob([await repository.exportBackup(single && selected ? selected.id : undefined)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'longhand-research-' + (single && selected ? selected.id : 'backup') + '-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'Backup exported. It includes projects, sources, drafts and review history; PDF files are separate.'); }
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
