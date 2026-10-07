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
    location: { href: 'http://localhost/research.html' },
    history: { replaceState(unused, title, url) { context.location.href = String(url); } },
    crypto: { randomUUID: () => 'workspace-test-' + ++ids },
    Longhand: { isLocal: !options.publicHost, researchRecords: records, allReports: async () => options.reports || [], reportHref: report => 'report.html?id=' + report.id },
    addEventListener: (type, listener) => events.set(type, listener)
  });
  context.window = context;
  for (const file of ['research-projects.js', 'research-operations.js', 'research-workspace.js']) vm.runInContext(fs.readFileSync(new URL('../assets/js/' + file, import.meta.url), 'utf8'), context);
  await flush();
  const app = { elements, rows, records, context, events, downloads, click: id => elements.get(id).emit('click'), submit: id => elements.get(id).emit('submit') };
  if (!options.publicHost && !options.blocked) {
    for (const [key, value] of Object.entries({ topic: 'Workspace test', question: 'What is the evidence?', objective: 'Check local draft handling.' })) elements.get('project-' + key).value = value;
    app.submit('project-form'); await flush();
  }
  return app;
}

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
  app.elements.get('source-title').value = 'Test source'; app.elements.get('source-url').value = 'https://example.com/';
  app.elements.get('source-notes').value = 'Synthetic evidence note.'; app.elements.get('source-checked').checked = true;
  app.elements.get('project-draft').value = 'A manually written test draft.'; app.elements.get('draft-research').checked = true;
  app.submit('source-form'); await flush();
  const record = [...app.rows.values()][0];
  assert.equal(record.sources.length, 1); assert.equal(record.draftKind, 'research');
  assert.equal(record.draftBody, 'A manually written test draft.');
  assert.equal(app.elements.get('source-notes').value, '');
  assert.equal(record.reportId, null); assert.equal(record.status, 'DRAFT');
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
  app.elements.get('review-note').value = 'Submit test research.'; app.click('submit-review'); await flush();
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
  assert.match(app.downloads[0].filename, /-approved-r\d+\.txt$/);
});

test('failed catalogue refresh retains open work and shows a visible failure', async () => {
  const options = { catalogueFailure: true }; const app = await workspace(options);
  app.elements.get('project-objective').value = 'Retain this unsaved test edit.';
  app.click('reload-projects'); await flush(); app.click('confirm-accept'); await flush();
  assert.match(app.elements.get('workspace-message').textContent, /catalogue could not be reloaded/);
  assert.equal(app.elements.get('project-objective').value, 'Retain this unsaved test edit.');
  assert.equal(app.elements.get('workspace-content').inert, false);
});
