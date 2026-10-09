/* Local folder snapshots. No network calls and no automatic permission prompts. */
(function (root) {
  'use strict';
  const LH = root.Longhand = root.Longhand || {};
  const LIMIT = 5000000;
  const size = body => new TextEncoder().encode(body).byteLength;
  function snapshotFiles(projects, at) {
    const body = rows => JSON.stringify({ format: 'longhand-research-projects', version: 1, exportedAt: at, projects: rows }, null, 2);
    const groups = [];
    let group = [];
    for (const project of projects) {
      const normalized = LH.Research.normalize(project);
      if (size(body([normalized])) > LIMIT) throw new Error('A project exceeds the 5 MB import limit. Reduce its size before creating a folder backup.');
      if (group.length && size(body([...group, normalized])) > LIMIT) { groups.push(group); group = []; }
      group.push(normalized);
    }
    if (group.length || !groups.length) groups.push(group);
    return groups.map((rows, index) => ({ name: 'projects-' + (index + 1) + '.json', body: body(rows) }));
  }
  function createController(options) {
    const { repository, settings, onStatus = () => {}, pickDirectory } = options;
    const clock = options.clock || (() => new Date().toISOString());
    const nonce = options.nonce || (() => root.crypto.randomUUID());
    const lock = options.lock || (operation => operation());
    const later = options.setTimeout || root.setTimeout.bind(root);
    const cancel = options.clearTimeout || root.clearTimeout.bind(root);
    let timer, queue = Promise.resolve(), pendingJobs = 0, initialized = false, configured = false;
    let status = { state: 'off', text: 'Folder backup is off. Choose a private backup folder or export a JSON backup.' };
    function report(state, text) { status = { state, text }; onStatus(status); return status; }
    function failure(error) { return report('error', 'Folder backup failed: ' + error.message + ' Your projects remain saved in this browser. Retry or export a JSON backup.'); }
    function enqueue(operation) {
      pendingJobs++;
      queue = queue.then(() => lock(operation)).catch(failure).finally(() => { pendingJobs--; });
      return queue;
    }
    async function write(requestAccess = false, force = false) {
      const config = await settings.get();
      configured = Boolean(config && config.handle); initialized = true;
      if (!config || !config.handle) return report('off', pickDirectory ?
        'Folder backup is off. Choose a private backup folder or export a JSON backup.' :
        'Automatic folder backup is unavailable in this browser. Use Export backup, or open the workspace in Chrome or Edge.');
      let permission = await config.handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted' && requestAccess) permission = await config.handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') return report('permission', 'Folder access is needed. Click Back up now to allow access again, or export a JSON backup.');
      const projects = (await repository.all()).sort((a, b) => a.id.localeCompare(b.id));
      const digest = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(projects)));
      const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (!force && config.signature === signature) return report('saved', 'Folder backup is current · ' + new Date(config.lastAt).toLocaleString() + ' · ' + config.handle.name + '/longhand-research-backups');
      const at = clock(), files = snapshotFiles(projects, at);
      report('writing', 'Writing a folder backup of saved projects…');
      const parent = await config.handle.getDirectoryHandle('longhand-research-backups', { create: true });
      const folder = await parent.getDirectoryHandle(at.replace(/[:.]/g, '-') + '-' + nonce(), { create: true });
      for (const file of files) {
        const handle = await folder.getFileHandle(file.name, { create: true });
        const writer = await handle.createWritable();
        try { await writer.write(file.body); await writer.close(); }
        catch (error) { await writer.abort().catch(() => {}); throw error; }
      }
      // Write the completion marker last. Incomplete snapshots never count as backed up.
      const manifest = await folder.getFileHandle('snapshot.json', { create: true });
      const writer = await manifest.createWritable();
      try {
        await writer.write(JSON.stringify({ format: 'longhand-research-snapshot', version: 1, exportedAt: at,
          projects: projects.length, files: files.map(file => file.name) }, null, 2));
        await writer.close();
      } catch (error) { await writer.abort().catch(() => {}); throw error; }
      await settings.set({ ...config, signature, lastAt: at });
      return report('saved', 'Folder backup saved · ' + new Date(at).toLocaleString() + ' · ' + projects.length + ' project(s) · ' + config.handle.name + '/longhand-research-backups');
    }
    return Object.freeze({
      get status() { return status; },
      get pending() { return Boolean(timer || pendingJobs); },
      async init() { return enqueue(() => write()); },
      changed() {
        if (initialized && !configured) return;
        if (timer) cancel(timer);
        timer = later(() => { timer = null; enqueue(() => write()); }, 1000);
        report('pending', 'Research saved in this browser. Checking its folder backup…');
      },
      backupNow() { if (timer) { cancel(timer); timer = null; } return enqueue(() => write(true, true)); },
      async connect() {
        if (!pickDirectory) return report('unsupported', 'This browser cannot write folder backups. Use Export backup, or open the workspace in Chrome or Edge.');
        // The picker is called directly from the button gesture, before asynchronous work.
        let handle;
        try { handle = await pickDirectory(); }
        catch (error) { if (error.name === 'AbortError') return status; return failure(error); }
        return enqueue(async () => { await settings.set({ handle }); return write(); });
      },
      disconnect() {
        if (timer) { cancel(timer); timer = null; }
        return enqueue(async () => { await settings.set(null); configured = false; initialized = true; return report('off', 'Folder backup is off. Existing backup files were kept.'); });
      }
    });
  }
  LH.ResearchBackup = Object.freeze({ snapshotFiles, createController });
  if (!root.document || !LH.isLocal || !LH.Research || !LH.researchRecords.backupSettings) return;
  const byId = id => root.document.getElementById(id);
  const controller = createController({ repository: LH.Research.createRepository(LH.researchRecords), settings: LH.researchRecords.backupSettings,
    pickDirectory: root.showDirectoryPicker ? () => root.showDirectoryPicker({ id: 'longhand-research-backup', mode: 'readwrite' }) : null,
    lock: operation => root.navigator.locks ? root.navigator.locks.request('longhand-research-backup', operation) : operation(),
    onStatus(status) {
      const message = byId('backup-status');
      if (message) message.textContent = status.text;
      const stop = byId('stop-backup');
      if (stop) stop.disabled = ['off', 'unsupported'].includes(status.state);
    }
  });
  LH.ResearchBackups = controller;
  const panel = byId('folder-backup');
  if (panel) panel.hidden = false;
  for (const [id, method] of [['choose-backup-folder', 'connect'], ['backup-now', 'backupNow'], ['stop-backup', 'disconnect']]) {
    const button = byId(id);
    if (button) button.addEventListener('click', () => controller[method]());
  }
  if (!root.showDirectoryPicker) {
    const choose = byId('choose-backup-folder');
    if (choose) { choose.disabled = true; choose.textContent = 'Folder backup needs Chrome or Edge'; }
  }
  root.addEventListener('focus', () => controller.init());
  root.addEventListener('beforeunload', event => { if (controller.pending) { event.preventDefault(); event.returnValue = ''; } });
  controller.init();
})(globalThis);
