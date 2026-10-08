import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const flush = () => new Promise(resolve => setImmediate(resolve));
async function workspace(options = {}) {
  class Element {
    constructor(tag = 'div') { this.tag = tag; this.value = ''; this.checked = false; this.children = []; this.handlers = new Map(); this.attributes = {}; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(type, listener) { if (!this.handlers.has(type)) this.handlers.set(type, []); this.handlers.get(type).push(listener); }
    emit(type, event = {}) { for (const listener of this.handlers.get(type) || []) listener({ preventDefault() {}, ...event }); }
    showModal() { this.open = true; }
    close() { this.open = false; }
    remove() {}
    click() { if (this.download) downloads.push({ filename: this.download, blob: blobs.get(this.href) }); }
    reset() { for (const key of ['title', 'url', 'notes', 'checked']) { elements.get('source-' + key).value = ''; elements.get('source-' + key).checked = false; } }
  }
  const elements = new Map();
  for (const [, id] of fs.readFileSync(new URL('../research.html', import.meta.url), 'utf8').matchAll(/\bid="([^"]+)"/g)) elements.set(id, new Element());
  const downloads = [], blobs = new Map();
  const document = { getElementById: id => elements.get(id), createElement: tag => new Element(tag), body: new Element('body'),
    head: { append(script) { queueMicrotask(() => {
      if (options.catalogueFailure) script.onerror();
      else { context.LONGHAND_REPORTS = []; script.onload(); }
    }); } } };
  const rows = new Map(), copy = value => value && JSON.parse(JSON.stringify(value));
  const records = {
    all: async () => { if (options.blocked) throw new Error('Storage blocked'); return [...rows.values()].map(copy); },
    get: async id => copy(rows.get(id)),
    change: async (id, transform) => { const result = transform(copy(rows.get(id))); if (result === null) rows.delete(id); else rows.set(id, copy(result)); return copy(result); }
  };
  let ids = 0;
  const events = new Map();
  class TestURL extends URL { static createObjectURL(blob) { const key = 'blob:' + blobs.size; blobs.set(key, blob); return key; } static revokeObjectURL() {} }
  const context = vm.createContext({ document, URL: TestURL, Date, TextEncoder, Blob, console, setTimeout: callback => callback(),
    location: { href: options.url || 'http://localhost/research.html' },
    history: { replaceState(unused, title, url) { if (options.historyThrows) throw new Error('SecurityError: file URL'); context.location.href = String(url); } },
    crypto: { randomUUID: () => 'workspace-test-' + ++ids },
    Longhand: { isLocal: !options.publicHost, researchRecords: records, allReports: async () => options.reports || [], reportHref: report => 'report.html?id=' + report.id },
    addEventListener: (type, listener) => events.set(type, listener)
  });
  context.window = context;
  for (const file of ['research-projects.js', 'research-operations.js', 'research-tasks.js', 'research-workspace.js']) vm.runInContext(fs.readFileSync(new URL('../assets/js/' + file, import.meta.url), 'utf8'), context);
  await flush();
  const app = { elements, rows, records, context, events, downloads, click: id => elements.get(id).emit('click'), submit: id => elements.get(id).emit('submit') };
  if (!options.publicHost && !options.blocked) {
    for (const [key, value] of Object.entries({ topic: 'Workspace test', question: 'What is the evidence?', objective: 'Check local draft handling.' })) elements.get('project-' + key).value = value;
    app.submit('project-form'); await flush();
  }
  return app;
}

async function reasoning(app) {
  const values = { thesis: 'Synthetic thesis for UI verification.', analysis: 'A synthetic observation informs this interpretation.',
    assumptions: 'The test condition remains fixed.', alternatives: 'A different condition could explain the observation.',
    uncertainty: 'Tentative because this is synthetic evidence.', horizon: 'Test session only.', reviewConditions: 'Review if the synthetic condition changes.' };
  for (const [key, value] of Object.entries(values)) app.elements.get('reasoning-' + key).value = value;
  app.submit('reasoning-form'); await flush();
  const record = [...app.rows.values()][0];
  app.elements.get('evidence-source').value = record.sources[0].id;
  app.elements.get('evidence-relation').value = 'qualifies';
  app.elements.get('evidence-locator').value = 'Synthetic section 1';
  app.elements.get('evidence-note').value = 'The example qualifies this test thesis.';
  app.submit('evidence-form'); await flush();
}

function checkReview(app) {
  app.elements.get('reviewer-name').value = 'Synthetic reviewer';
  for (const check of app.context.Longhand.Research.REVIEW_CHECKS) app.elements.get('review-check-' + check.id).checked = true;
}

test('the visible checklist matches the attestations exported with approved research', async () => {
  const app = await workspace();
  const html = fs.readFileSync(new URL('../research.html', import.meta.url), 'utf8');
  for (const check of app.context.Longhand.Research.REVIEW_CHECKS) {
    const label = html.match(new RegExp('id="review-check-' + check.id + '">([^<]+)</label>'));
    assert.ok(label, 'visible checkbox exists for ' + check.id);
    assert.equal(label[1], check.label, 'exported attestation matches the visible check');
  }
});

test('a rejected file URL history update keeps the workspace visible and saves edits to the selected project', async () => {
  const app = await workspace({ historyThrows: true, url: 'file:///synthetic/research.html' });
  assert.equal(app.elements.get('workspace-content').hidden, false); assert.equal(app.rows.size, 1);
  app.elements.get('project-draft').value = 'Synthetic draft saved despite a rejected URL update.';
  app.submit('draft-form'); await flush();
  assert.equal(app.rows.size, 1); assert.equal([...app.rows.values()][0].draftBody, app.elements.get('project-draft').value);
  assert.match(app.elements.get('workspace-message').textContent, /Saved in this browser/);
});

test('project deletion requires confirmation and clears the selection without touching Library', async () => {
  const reports = [{ id: 'kept-report', title: 'Published report' }];
  const app = await workspace({ reports });
  app.click('delete-project'); await flush();
  assert.equal(app.elements.get('workspace-confirm').open, true);
  app.click('confirm-cancel'); await flush();
  assert.equal(app.rows.size, 1);
  app.click('delete-project'); await flush();
  app.click('confirm-accept'); await flush();
  assert.equal(app.rows.size, 0);
  assert.equal(app.elements.get('delete-project').disabled, true);
  assert.equal(app.elements.get('saved-project').hidden, true);
  assert.equal(app.elements.get('project-draft').value, '');
  assert.equal(new URL(app.context.location.href).searchParams.has('project'), false);
  assert.equal(reports.length, 1);
});

test('workspace keeps source notes, working draft and report connection in one project', async () => {
  const app = await workspace();
  assert.equal(app.elements.get('task-owner').textContent, 'Research Associate');
  assert.equal(app.elements.get('research-tasks').children.length, 5);
  app.elements.get('source-title').value = 'Test source'; app.elements.get('source-url').value = 'https://example.com/';
  app.elements.get('source-notes').value = 'Synthetic evidence note.'; app.elements.get('source-checked').checked = true;
  app.elements.get('project-draft').value = 'A manually written test draft.'; app.elements.get('draft-research').checked = true;
  app.submit('source-form'); await flush();
  const record = [...app.rows.values()][0];
  assert.equal(record.sources.length, 1); assert.equal(record.draftKind, 'research');
  assert.equal(record.draftBody, 'A manually written test draft.');
  assert.equal(app.elements.get('source-notes').value, '');
  assert.equal(record.reportId, null); assert.equal(record.status, 'DRAFT');
  assert.equal(app.elements.get('task-owner').textContent, 'Researcher');
  assert.equal(app.elements.get('task-action').href, '#reasoning-heading');
});

test('five-role guidance follows constitutional evidence, attributed review and invalidation together', async () => {
  const app = await workspace();
  app.elements.get('source-title').value = 'Synthetic integration source';
  app.elements.get('source-url').value = 'https://example.com/';
  app.elements.get('source-notes').value = 'Synthetic evidence only.';
  app.elements.get('source-checked').checked = true;
  app.elements.get('project-draft').value = 'Synthetic researched prose for integration.';
  app.elements.get('draft-research').checked = true;
  app.submit('source-form'); await flush();
  assert.equal(app.elements.get('task-owner').textContent, 'Researcher');
  await reasoning(app);
  assert.equal(app.elements.get('task-owner').textContent, 'Editor');
  assert.equal(app.elements.get('research-tasks').children.length, 5);
  app.elements.get('review-note').value = 'Synthetic manual submission.';
  app.click('submit-review'); await flush();
  assert.equal(app.elements.get('task-owner').textContent, 'Research Director');
  app.elements.get('review-note').value = 'Synthetic review, checks still missing.';
  app.click('approve-review'); await flush();
  assert.equal([...app.rows.values()][0].status, 'IN_REVIEW');
  checkReview(app);
  app.elements.get('review-note').value = 'Synthetic six-check review complete.';
  app.click('approve-review'); await flush();
  assert.equal(app.elements.get('task-owner').textContent, 'Editor');
  assert.equal(app.elements.get('task-action').href, '#report-heading');
  const approved = [...app.rows.values()][0];
  assert.equal(approved.status, 'APPROVED'); assert.equal(approved.review.reviewer, 'Synthetic reviewer');
  app.elements.get('reasoning-analysis').value = '';
  app.submit('reasoning-form'); await flush();
  const revised = [...app.rows.values()][0];
  assert.equal(revised.status, 'DRAFT'); assert.equal(revised.review, null);
  assert.equal(app.elements.get('task-owner').textContent, 'Researcher');
  assert.equal(app.elements.get('task-action').href, '#reasoning-heading');
  assert.equal(revised.reasoningHistory.at(-1).review.reviewer, 'Synthetic reviewer');
  assert.equal(revised.reasoningHistory.at(-1).reasoning.analysis, approved.reasoning.analysis);
});

test('confirmation keeps unsaved edits on cancel and reloads only after explicit discard', async () => {
  const app = await workspace();
  app.elements.get('project-objective').value = 'An unsaved edit, including autofilled values.';
  app.click('reload-projects'); await flush();
  assert.equal(app.elements.get('workspace-confirm').open, true);
  app.click('confirm-cancel'); await flush();
  assert.equal(app.elements.get('project-objective').value, 'An unsaved edit, including autofilled values.');
  app.click('reload-projects'); await flush(); app.click('confirm-accept'); await flush();
  assert.equal(app.elements.get('project-objective').value, 'Check local draft handling.');
  assert.equal(app.elements.get('workspace-confirm').open, false);
});

test('stale workspace save preserves the text being edited and shows the revision conflict', async () => {
  const app = await workspace(); const record = [...app.rows.values()][0];
  app.rows.set(record.id, { ...record, revision: record.revision + 1 });
  app.elements.get('project-draft').value = 'Keep this unsaved draft.';
  app.submit('draft-form'); await flush();
  assert.match(app.elements.get('workspace-message').textContent, /another tab/);
  assert.equal(app.elements.get('project-draft').value, 'Keep this unsaved draft.');
  assert.equal(app.elements.get('workspace-content').inert, false);
});

test('pending source and review notes are preserved during other saves and warn before leaving', async () => {
  const app = await workspace(); app.elements.get('source-notes').value = 'Source still being entered.';
  app.submit('project-form'); await flush();
  assert.equal(app.elements.get('source-notes').value, 'Source still being entered.');
  let warned = false;
  app.events.get('beforeunload')({ preventDefault() { warned = true; } }); assert.equal(warned, true);
  app.click('export-projects'); await flush();
  assert.match(app.elements.get('workspace-message').textContent, /pending source/);
});

test('public host and blocked storage show explicit states without inventing saved projects', async () => {
  const publicApp = await workspace({ publicHost: true });
  assert.match(publicApp.elements.get('workspace-message').textContent, /localhost/);
  assert.equal(publicApp.rows.size, 0);
  const blocked = await workspace({ blocked: true });
  assert.match(blocked.elements.get('workspace-message').textContent, /Storage blocked/);
  assert.equal(blocked.rows.size, 0);
});

test('dashboard filters projects and refreshes real Library state without writing publication into the project', async () => {
  const options = { reports: [{ id: 'report-1', title: 'Synthetic browser draft', isLocal: true }] };
  const app = await workspace(options);
  app.elements.get('linked-report').value = 'report-1'; app.submit('report-form'); await flush();
  const revision = [...app.rows.values()][0].revision;
  app.elements.get('project-filter').value = 'published'; app.elements.get('project-filter').emit('change');
  assert.match(app.elements.get('project-list').children[0].textContent, /No projects match/);
  options.reports[0].isLocal = false;
  app.click('reload-projects'); await flush();
  assert.equal(app.elements.get('operations-summary').children[4].children[1].textContent, '1');
  assert.equal(app.elements.get('project-list').children[0].children[0].textContent, 'Workspace test');
  assert.match(app.elements.get('publication-warning').textContent, /current project is not approved/);
  assert.equal([...app.rows.values()][0].revision, revision);
  assert.equal([...app.rows.values()][0].status, 'DRAFT');
});

test('approved download blocks unsaved edits and concurrent revision changes, then exports only current reviewed text', async () => {
  const app = await workspace();
  app.elements.get('source-title').value = 'Test source'; app.elements.get('source-url').value = 'https://example.com/';
  app.elements.get('source-notes').value = 'Synthetic evidence.'; app.elements.get('source-checked').checked = true;
  app.elements.get('project-draft').value = 'Reviewed synthetic test prose.'; app.elements.get('draft-research').checked = true;
  app.submit('source-form'); await flush();
  await reasoning(app);
  app.elements.get('review-note').value = 'Submit test research.'; app.click('submit-review'); await flush();
  checkReview(app);
  app.elements.get('review-note').value = 'Checked test research.'; app.click('approve-review'); await flush();
  assert.equal(app.elements.get('download-approved').disabled, false);
  app.elements.get('project-draft').value += ' Unsaved change.';
  app.click('download-approved'); await flush();
  assert.equal(app.downloads.length, 0); assert.match(app.elements.get('workspace-message').textContent, /Save your edits/);
  const record = [...app.rows.values()][0];
  app.elements.get('project-draft').value = record.draftBody;
  app.rows.set(record.id, { ...record, revision: record.revision + 1 });
  app.click('download-approved'); await flush();
  assert.equal(app.downloads.length, 0); assert.match(app.elements.get('workspace-message').textContent, /another tab/);
  app.click('reload-projects'); await flush(); app.click('download-approved'); await flush();
  assert.equal(app.downloads.length, 1);
  assert.match(await app.downloads[0].blob.text(), /Reviewed synthetic test prose/);
  assert.match(await app.downloads[0].blob.text(), /Checked test research/);
  assert.match(await app.downloads[0].blob.text(), /Synthetic thesis for UI verification/);
  assert.match(await app.downloads[0].blob.text(), /Synthetic section 1/);
  assert.match(await app.downloads[0].blob.text(), /Synthetic reviewer/);
  assert.match(app.downloads[0].filename, /-approved-r\d+\.txt$/);
});

test('open reasoning edits save alongside source work, reload, and append without replacing prose or approving planning', async () => {
  const app = await workspace();
  app.elements.get('reasoning-thesis').value = 'An unfinished synthetic thesis.';
  app.elements.get('source-title').value = 'Synthetic source'; app.elements.get('source-url').value = 'https://example.com/';
  app.submit('source-form'); await flush();
  assert.equal([...app.rows.values()][0].reasoning.thesis, 'An unfinished synthetic thesis.');
  app.elements.get('project-draft').value = 'Existing prose to keep.';
  app.click('append-reasoning'); await flush();
  assert.match(app.elements.get('project-draft').value, /^Existing prose to keep\./);
  assert.match(app.elements.get('project-draft').value, /An unfinished synthetic thesis/);
  assert.equal(app.elements.get('draft-research').checked, false);
  assert.equal(app.elements.get('review-check-claims').checked, false);
  assert.equal([...app.rows.values()][0].status, 'DRAFT');
  app.submit('draft-form'); await flush();
  app.click('reload-projects'); await flush();
  assert.equal(app.elements.get('reasoning-thesis').value, 'An unfinished synthetic thesis.');
});

test('new review needs manual checks; an approved reasoning edit clears attestation and retains its source context', async () => {
  const app = await workspace();
  app.elements.get('source-title').value = 'Synthetic source'; app.elements.get('source-url').value = 'https://example.com/';
  app.elements.get('source-notes').value = 'Captured original test note.'; app.elements.get('source-checked').checked = true;
  app.elements.get('project-draft').value = 'Synthetic research prose.'; app.elements.get('draft-research').checked = true;
  app.submit('source-form'); await flush(); await reasoning(app);
  app.elements.get('review-note').value = 'Submit the saved version.'; app.click('submit-review'); await flush();
  app.elements.get('review-note').value = 'Review not yet complete.'; app.click('approve-review'); await flush();
  assert.equal([...app.rows.values()][0].status, 'IN_REVIEW');
  checkReview(app);
  app.elements.get('review-note').value = 'All six checks assessed.'; app.click('approve-review'); await flush();
  const approved = [...app.rows.values()][0];
  assert.equal(approved.status, 'APPROVED'); assert.equal(approved.review.reviewer, 'Synthetic reviewer');
  app.elements.get('reasoning-uncertainty').value = 'A revised uncertainty assessment.';
  app.submit('reasoning-form'); await flush();
  const updated = [...app.rows.values()][0];
  assert.equal(updated.status, 'DRAFT'); assert.equal(updated.review, null);
  assert.equal(app.elements.get('review-check-claims').checked, false);
  assert.equal(app.elements.get('reviewer-name').value, '');
  assert.equal(app.elements.get('download-approved').disabled, true);
  const prior = updated.reasoningHistory.at(-1);
  assert.equal(prior.reasoning.uncertainty, approved.reasoning.uncertainty);
  assert.equal(prior.sources[0].notes, 'Captured original test note.');
  assert.equal(prior.review.reviewer, 'Synthetic reviewer');
  const historyText = app.elements.get('reasoning-history').children[0].children[1].textContent;
  assert.match(historyText, /Captured original test note/);
  assert.match(historyText, /Tentative because this is synthetic evidence/);
  assert.match(historyText, /Review state: Approved/);
  assert.match(historyText, /Approval note: All six checks assessed/);
});

test('a referenced notebook source stays until its thesis links are explicitly removed', async () => {
  const app = await workspace();
  app.elements.get('source-title').value = 'Synthetic source'; app.elements.get('source-url').value = 'https://example.com/';
  app.submit('source-form'); await flush(); await reasoning(app);
  app.elements.get('source-list').children[0].children.at(-1).emit('click'); await flush();
  assert.match(app.elements.get('workspace-message').textContent, /thesis evidence links first/);
  assert.equal([...app.rows.values()][0].sources.length, 1);
  app.elements.get('thesis-evidence').children[0].children.at(-1).emit('click'); await flush();
  app.elements.get('source-list').children[0].children.at(-1).emit('click'); await flush();
  app.click('confirm-accept'); await flush();
  const current = [...app.rows.values()][0];
  assert.equal(current.sources.length, 0); assert.equal(current.reasoning.evidence.length, 0);
  assert.ok(current.reasoningHistory.some(version => version.reasoning.evidence.length && version.sources.length));
});

test('submission preserves pending manual review, and normalized no-op saves preserve recorded approval', async () => {
  const app = await workspace();
  app.elements.get('source-title').value = 'Synthetic source'; app.elements.get('source-url').value = 'https://example.com/';
  app.elements.get('source-notes').value = 'Synthetic observation.'; app.elements.get('source-checked').checked = true;
  app.elements.get('project-draft').value = 'Synthetic research prose.'; app.elements.get('draft-research').checked = true;
  app.submit('source-form'); await flush(); await reasoning(app); checkReview(app);
  app.elements.get('review-note').value = 'Submit saved research.'; app.click('submit-review'); await flush();
  assert.equal(app.elements.get('reviewer-name').value, 'Synthetic reviewer');
  assert.equal(app.elements.get('review-check-claims').checked, true);
  app.elements.get('review-note').value = 'Review completed.'; app.click('approve-review'); await flush();
  const approved = [...app.rows.values()][0];
  app.elements.get('project-topic').value = '  ' + approved.brief.topic + '  ';
  app.submit('project-form'); await flush();
  assert.equal([...app.rows.values()][0].status, 'APPROVED');
  assert.equal(app.elements.get('reviewer-name').value, 'Synthetic reviewer');
  assert.equal(app.elements.get('review-check-claims').checked, true);
  app.click('download-approved'); await flush(); assert.equal(app.downloads.length, 1);
});

test('material saves clear pending checks while preserving a newly entered reviewer identity', async () => {
  const app = await workspace(); checkReview(app);
  app.elements.get('reasoning-thesis').value = 'A new synthetic thesis.';
  app.submit('reasoning-form'); await flush();
  assert.equal(app.elements.get('reviewer-name').value, 'Synthetic reviewer');
  assert.equal(app.elements.get('review-check-claims').checked, false);
});

test('stale writes and unsaved-change cancellation retain reasoning, evidence and pending review inputs', async () => {
  const app = await workspace(); const record = [...app.rows.values()][0];
  app.elements.get('reasoning-thesis').value = 'Keep this open reasoning.';
  app.elements.get('evidence-locator').value = 'Keep the pending locator.';
  app.elements.get('reviewer-name').value = 'Pending reviewer'; app.elements.get('review-check-claims').checked = true;
  app.rows.set(record.id, { ...record, revision: record.revision + 1 });
  app.submit('reasoning-form'); await flush();
  assert.match(app.elements.get('workspace-message').textContent, /another tab/);
  assert.equal(app.elements.get('reasoning-thesis').value, 'Keep this open reasoning.');
  assert.equal(app.elements.get('evidence-locator').value, 'Keep the pending locator.');
  assert.equal(app.elements.get('reviewer-name').value, 'Pending reviewer');
  assert.equal(app.elements.get('review-check-claims').checked, true);
  app.click('reload-projects'); await flush(); app.click('confirm-cancel'); await flush();
  assert.equal(app.elements.get('reasoning-thesis').value, 'Keep this open reasoning.');
  app.click('export-project'); await flush();
  assert.match(app.elements.get('workspace-message').textContent, /pending thesis evidence/);
});

test('legacy approval remains visible without fabricated new checks', async () => {
  const app = await workspace(); const record = [...app.rows.values()][0];
  const legacy = { ...record, draftKind: 'research', draftBody: 'Legacy synthetic prose.', status: 'APPROVED',
    sources: [{ id: 'legacy-source', title: 'Legacy source', url: 'https://example.com/', notes: 'Legacy note.', checked: true }],
    history: [{ at: record.createdAt, action: 'Approved', note: 'Earlier manual review.' }] };
  delete legacy.reasoning; delete legacy.review; delete legacy.reasoningHistory;
  app.rows.set(record.id, legacy); app.click('reload-projects'); await flush();
  assert.equal(app.elements.get('project-status').textContent, 'Approved');
  assert.match(app.elements.get('review-record').textContent, /Legacy approval retained/);
  assert.equal(app.elements.get('review-check-claims').checked, false);
  assert.equal(app.elements.get('download-approved').disabled, false);
  app.elements.get('project-draft').value = 'Changed legacy synthetic prose.';
  app.submit('draft-form'); await flush();
  const snapshot = [...app.rows.values()][0].reasoningHistory.at(-1);
  assert.equal(snapshot.status, 'APPROVED'); assert.equal(snapshot.approvalNote, 'Earlier manual review.');
  assert.equal(snapshot.review, null);
  const priorText = app.elements.get('reasoning-history').children[0].children[1].textContent;
  assert.match(priorText, /Review state: Approved/); assert.match(priorText, /Approval note: Earlier manual review/);
  delete snapshot.status; delete snapshot.approvalNote;
  app.click('reload-projects'); await flush();
  const unknownText = app.elements.get('reasoning-history').children[0].children[1].textContent;
  assert.match(unknownText, /Review state: Not recorded/); assert.match(unknownText, /Approval note was not retained/);
});

test('failed catalogue refresh retains open work and shows a visible failure', async () => {
  const options = { catalogueFailure: true }; const app = await workspace(options);
  app.elements.get('project-objective').value = 'Retain this unsaved test edit.';
  app.click('reload-projects'); await flush(); app.click('confirm-accept'); await flush();
  assert.match(app.elements.get('workspace-message').textContent, /catalogue could not be reloaded/);
  assert.equal(app.elements.get('project-objective').value, 'Retain this unsaved test edit.');
  assert.equal(app.elements.get('workspace-content').inert, false);
});
