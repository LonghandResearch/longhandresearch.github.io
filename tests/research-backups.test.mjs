import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

function fixture(options = {}) {
  const context = vm.createContext({ TextEncoder, Uint8Array, Date, URL, crypto: webcrypto, setTimeout, clearTimeout });
  for (const file of ['research-projects.js', 'research-backups.js']) vm.runInContext(fs.readFileSync(new URL('../assets/js/' + file, import.meta.url), 'utf8'), context);
  const LH = context.Longhand, rows = new Map();
  let sequence = 0, config = null, permission = options.permission || 'granted', requests = 0;
  const records = {
    all: async () => [...rows.values()], get: async id => rows.get(id),
    change: async (id, transform) => { const next = transform(rows.get(id)); if (next === null) rows.delete(id); else rows.set(id, next); return next; },
    changeMany: async (ids, transform) => { const next = transform(ids.map(id => rows.get(id))); next.forEach((row, index) => rows.set(ids[index], row)); return next; }
  };
  const repository = LH.Research.createRepository(records, { makeId: () => 'fixture-' + ++sequence });
  function directory(name) {
    return { name, directories: new Map(), files: new Map(),
      queryPermission: async () => permission,
      requestPermission: async () => { requests++; return permission = options.requestResult || 'granted'; },
      async getDirectoryHandle(name) { if (!this.directories.has(name)) this.directories.set(name, directory(name)); return this.directories.get(name); },
      async getFileHandle(name) {
        const parent = this;
        return { async createWritable() {
          let body;
          return {
            async write(value) { if (options.failWrite) throw new Error('Disk full'); body = value; },
            async close() { parent.files.set(name, body); }, async abort() {}
          };
        } };
      }
    };
  }
  const folder = directory('Private fixtures'), timers = new Map();
  const controller = LH.ResearchBackup.createController({ repository,
    settings: { get: async () => config, set: async value => { config = value; } },
    pickDirectory: options.unsupported ? null : async () => folder,
    nonce: () => 'snapshot-' + ++sequence,
    setTimeout: callback => { const id = ++sequence; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id)
  });
  LH.ResearchBackups = controller;
  return { LH, controller, repository, folder, rows, timers, context, records,
    get config() { return config; }, get requests() { return requests; },
    snapshots: () => [...(folder.directories.get('longhand-research-backups')?.directories.values() || [])],
    async settle() { for (const [id, callback] of timers) { timers.delete(id); callback(); } await controller.init(); }
  };
}
const brief = { topic: 'Synthetic backup', question: 'Can the saved record be recovered?', objective: 'Verify local snapshots.' };

test('saved research restores from a completed snapshot; changes and deletion keep earlier files', async () => {
  const app = fixture(); let project = await app.repository.create(brief);
  project = await app.repository.save({ ...project, draftBody: 'Saved research text.' }, project.revision);
  await app.controller.connect(); await app.settle();
  assert.equal(app.snapshots().length, 1);
  const first = app.snapshots()[0], marker = JSON.parse(first.files.get('snapshot.json'));
  assert.equal(marker.projects, 1);
  const restored = app.LH.Research.parseBackup(first.files.get(marker.files[0]));
  assert.equal(restored[0].draftBody, 'Saved research text.');
  assert.equal(restored[0].revision, project.revision);
  await app.repository.save({ ...project, draftBody: 'Updated evidence.' }, project.revision); await app.settle();
  assert.equal(app.snapshots().length, 2);
  assert.equal(app.LH.Research.parseBackup(first.files.get('projects-1.json'))[0].draftBody, 'Saved research text.');
  const current = await app.repository.get(project.id);
  await app.repository.remove(project.id, current.revision); await app.settle();
  assert.equal(app.snapshots().length, 3);
  assert.equal(app.LH.Research.parseBackup(app.snapshots()[2].files.get('projects-1.json')).length, 0);
  await app.controller.disconnect();
  assert.equal(app.config, null); assert.equal(app.snapshots().length, 3);
});

test('automatic checks never request permissions; an explicit backup can restore access', async () => {
  const options = {}, app = fixture(options);
  await app.repository.create(brief); await app.controller.connect(); await app.settle();
  app.folder.queryPermission = async () => 'prompt';
  await app.controller.init();
  assert.equal(app.controller.status.state, 'permission'); assert.equal(app.requests, 0);
  await app.controller.backupNow();
  assert.equal(app.requests, 1); assert.equal(app.controller.status.state, 'saved');
  options.requestResult = 'denied'; await app.controller.backupNow();
  assert.equal(app.controller.status.state, 'permission');
  assert.equal(app.snapshots().length, 2); assert.equal(app.rows.size, 1);
});

test('failed writes keep research and previous backups and do not advance the success timestamp', async () => {
  const options = {}, app = fixture(options);
  let project = await app.repository.create(brief); await app.controller.connect(); await app.settle();
  const savedConfig = app.config, first = app.snapshots()[0];
  options.failWrite = true;
  project = await app.repository.save({ ...project, draftBody: 'Research survives a failed backup.' }, project.revision);
  await app.settle();
  assert.equal(app.controller.status.state, 'error'); assert.match(app.controller.status.text, /Disk full/);
  assert.equal(app.config, savedConfig); assert.ok(first.files.has('snapshot.json'));
  assert.equal(app.snapshots().at(-1).files.has('snapshot.json'), false);
  assert.equal((await app.repository.get(project.id)).draftBody, 'Research survives a failed backup.');
  options.failWrite = false; await app.controller.backupNow(); assert.equal(app.controller.status.state, 'saved');
});

test('workspaces over 5 MB are split into independently importable files without losing projects', async () => {
  const app = fixture();
  for (let index = 0; index < 55; index++) {
    const project = await app.repository.create({ ...brief, topic: 'Project ' + index });
    await app.repository.save({ ...project, draftBody: 'x'.repeat(100000) }, project.revision);
  }
  await app.controller.connect(); await app.settle();
  const snapshot = app.snapshots()[0], marker = JSON.parse(snapshot.files.get('snapshot.json'));
  assert.ok(marker.files.length > 1);
  const ids = new Set();
  for (const file of marker.files) {
    const body = snapshot.files.get(file); assert.ok(new TextEncoder().encode(body).byteLength <= 5000000);
    for (const project of app.LH.Research.parseBackup(body)) { assert.equal(project.draftBody.length, 100000); ids.add(project.id); }
  }
  assert.equal(ids.size, 55); assert.equal(marker.projects, 55);
});

test('duplicate checks and overlapping saves back up the latest committed revision', async () => {
  const app = fixture(); let project = await app.repository.create(brief);
  await app.controller.connect(); await app.settle();
  await Promise.all([app.controller.init(), app.controller.init()]); assert.equal(app.snapshots().length, 1);
  project = await app.repository.save({ ...project, draftBody: 'First revision.' }, project.revision);
  project = await app.repository.save({ ...project, draftBody: 'Latest committed revision.' }, project.revision);
  await app.settle(); assert.equal(app.snapshots().length, 2);
  const restored = app.LH.Research.parseBackup(app.snapshots()[1].files.get('projects-1.json'));
  assert.equal(restored[0].draftBody, 'Latest committed revision.');
  assert.equal(app.controller.pending, false);
  const signature = app.config.signature;
  await assert.rejects(app.repository.save(project, project.revision - 1), /another tab/);
  assert.equal(app.timers.size, 0); assert.equal(app.config.signature, signature);
});

test('unsupported browsers and cancelled pickers retain manual export and saved projects', async () => {
  const app = fixture({ unsupported: true }); await app.repository.create(brief); await app.controller.connect();
  assert.equal(app.controller.status.state, 'unsupported');
  assert.equal(app.LH.Research.parseBackup(await app.repository.exportBackup()).length, 1);
  assert.equal(app.snapshots().length, 0);
  const controller = app.LH.ResearchBackup.createController({ repository: app.repository,
    settings: { get: async () => null, set: async () => { throw new Error('Should not write settings'); } },
    pickDirectory: async () => { const error = new Error('Cancelled'); error.name = 'AbortError'; throw error; }
  });
  await controller.connect(); assert.equal(controller.status.state, 'off'); assert.equal(app.rows.size, 1);
  assert.match(controller.status.text, /No new backup folder was selected/);
  assert.match(controller.status.text, /Export backup/);
});

test('a broken backup notifier cannot report a committed research save as failed', async () => {
  const app = fixture();
  app.LH.ResearchBackups = { changed() { throw new Error('Backup notifier failed'); } };
  const project = await app.repository.create(brief);
  const updated = await app.repository.save({ ...project, draftBody: 'Committed safely.' }, project.revision);
  assert.equal((await app.repository.get(project.id)).draftBody, 'Committed safely.');
  assert.equal(updated.revision, project.revision + 1);
});

test('the browser wiring connects a folder, saves on repository changes and leaves public pages untouched', async () => {
  const app = fixture(); let config = null, lockCalls = 0;
  const elements = new Map(['folder-backup', 'backup-status', 'choose-backup-folder', 'backup-now', 'stop-backup'].map(id => [id,
    { hidden: true, handlers: {}, addEventListener(type, handler) { this.handlers[type] = handler; } }]));
  app.context.document = { getElementById: id => elements.get(id) };
  app.context.addEventListener = () => {};
  app.context.navigator = { locks: { request: async (name, operation) => { assert.equal(name, 'longhand-research-backup'); lockCalls++; return operation(); } } };
  app.context.showDirectoryPicker = async options => { assert.equal(options.mode, 'readwrite'); return app.folder; };
  app.context.setTimeout = callback => { app.timers.set(1, callback); return 1; };
  app.context.clearTimeout = () => app.timers.delete(1);
  app.LH.isLocal = true;
  app.LH.researchRecords = { ...app.records, backupSettings: { get: async () => config, set: async value => { config = value; } } };
  const source = fs.readFileSync(new URL('../assets/js/research-backups.js', import.meta.url), 'utf8');
  vm.runInContext(source, app.context); await app.LH.ResearchBackups.init();
  assert.equal(elements.get('folder-backup').hidden, false);
  await elements.get('choose-backup-folder').handlers.click();
  assert.equal(elements.get('stop-backup').disabled, false);
  await app.repository.create(brief);
  assert.match(elements.get('backup-status').textContent, /Checking/);
  app.timers.get(1)(); app.timers.clear(); await app.LH.ResearchBackups.init();
  assert.equal(app.snapshots().length, 2); assert.ok(lockCalls > 0);
  assert.match(elements.get('backup-status').textContent, /current/);
  await elements.get('stop-backup').handlers.click(); assert.equal(elements.get('stop-backup').disabled, true);
  delete app.LH.ResearchBackups; app.LH.isLocal = false;
  app.LH.researchRecords.backupSettings.get = () => { throw new Error('Public page read private settings'); };
  vm.runInContext(source, app.context); assert.equal(app.LH.ResearchBackups, undefined);
});


test('a pending picker has visible guidance, prevents duplicate pickers and survives focus checks', async () => {
  const app = fixture(); let complete, calls = 0;
  const controller = app.LH.ResearchBackup.createController({ repository: app.repository,
    settings: { get: async () => null, set: async () => {} },
    pickDirectory: () => { calls++; return new Promise(resolve => { complete = resolve; }); }
  });
  const selection = controller.connect();
  assert.equal(controller.status.state, 'choosing');
  assert.match(controller.status.text, /If no window appears, use Export backup/);
  await controller.init(); await controller.connect();
  assert.equal(controller.status.state, 'choosing'); assert.equal(calls, 1);
  complete(app.folder); await selection;
});

test('cancelling a replacement folder preserves the configured backup and its files', async () => {
  const app = fixture(); await app.repository.create(brief); await app.controller.connect();
  const config = app.config;
  const controller = app.LH.ResearchBackup.createController({ repository: app.repository,
    settings: { get: async () => config, set: async () => { throw new Error('Must retain settings'); } },
    pickDirectory: async () => { const error = new Error('Cancelled'); error.name = 'AbortError'; throw error; }
  });
  await controller.init(); await controller.connect();
  assert.equal(controller.status.configured, true);
  assert.match(controller.status.text, /existing folder backup remains configured/);
  assert.equal(app.config, config); assert.equal(app.snapshots().length, 1);
});
