/* Portable research records. No DOM, publication writes, or network calls. */
(function (root) {
  'use strict';
  const LH = root.Longhand = root.Longhand || {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = (value, max, required = true) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
  const iso = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
  const fail = message => { throw new Error(message); };
  const statuses = ['DRAFT', 'IN_REVIEW', 'APPROVED'];
  const agents = ['associate', 'researcher', 'analyst', 'editor', 'director'];
  function brief(value) {
    if (!value || !text(value.topic, 160) || !text(value.question, 480) || !text(value.objective, 480)) fail('Enter a topic, research question and objective.');
    return { topic: value.topic.trim(), question: value.question.trim(), objective: value.objective.trim() };
  }
  function normalize(value) {
    if (!value || value.version !== 1 || !id(value.id) || !iso(value.createdAt) || !iso(value.updatedAt) ||
      value.updatedAt < value.createdAt || !Number.isSafeInteger(value.revision) || value.revision < 1 || !statuses.includes(value.status)) fail('Invalid research project record.');
    if (!Array.isArray(value.sources) || value.sources.length > 100) fail('A project can contain up to 100 source records.');
    const seen = new Set();
    const sources = value.sources.map(source => {
      if (!source || !id(source.id) || seen.has(source.id) || !text(source.title, 240) || !text(source.url, 2000) ||
        !text(source.notes, 2000, false) || typeof source.checked !== 'boolean') fail('Invalid or duplicate source record.');
      if (source.checked && !source.notes.trim()) fail('Record what the source supports before marking it checked.');
      let url;
      try { url = new URL(source.url); } catch { fail('Use a full https:// or http:// source URL.'); }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.href.length > 2000) fail('Use a full https:// or http:// source URL without credentials, up to 2,000 characters.');
      seen.add(source.id);
      return { id: source.id, title: source.title.trim(), url: url.href, notes: source.notes, checked: source.checked };
    });
    if (!['planning', 'research'].includes(value.draftKind) || !text(value.draftBody, 100000, false)) fail('The draft must be plain text, up to 100,000 characters.');
    if (!value.run || !Array.isArray(value.run.times) || value.run.times.length > 29 || !value.run.times.every(iso) ||
      value.run.times.some((time, index, times) => index > 0 && time < times[index - 1])) fail('Invalid workflow progress.');
    if (!Array.isArray(value.outputs) || value.outputs.length > 5) fail('Invalid workflow outputs.');
    const completedSteps = [4, 9, 13, 18, 24];
    if (value.outputs.length !== completedSteps.filter(step => step <= value.run.times.length).length) fail('Workflow outputs do not match its progress.');
    const outputs = value.outputs.map((output, index) => {
      if (!output || output.agentId !== agents[index] || !text(output.title, 240) || !text(output.body, 4000) ||
        output.completedAt !== value.run.times[completedSteps[index] - 1]) fail('Invalid workflow output reference.');
      return { agentId: output.agentId, title: output.title, body: output.body, completedAt: output.completedAt };
    });
    if (value.reportId !== null && !id(value.reportId)) fail('Invalid report link.');
    if (!Array.isArray(value.history) || value.history.length > 100 || !value.history.length) fail('Invalid project history.');
    const history = value.history.map(entry => {
      if (!entry || !iso(entry.at) || !text(entry.action, 100) || !text(entry.note, 2000, false)) fail('Invalid project history entry.');
      return { at: entry.at, action: entry.action, note: entry.note };
    });
    if (value.status !== 'DRAFT' && (value.draftKind !== 'research' || !value.draftBody.trim())) fail('Planning records cannot pass research review.');
    if (value.status === 'APPROVED' && (!sources.some(source => source.checked) || !history.some(entry => entry.action === 'Approved' && entry.note.trim()))) fail('Approval needs a checked source and a review note.');
    return { version: 1, id: value.id, createdAt: value.createdAt, updatedAt: value.updatedAt,
      revision: value.revision, brief: brief(value.brief), status: value.status, sources,
      draftKind: value.draftKind, draftBody: value.draftBody, run: { times: [...value.run.times] },
      outputs, reportId: value.reportId, history };
  }
  function parseBackup(input) {
    if (typeof input !== 'string' || new TextEncoder().encode(input).byteLength > 5000000) fail('The backup exceeds 5 MB. Export individual projects instead.');
    let data;
    try { data = JSON.parse(input); } catch { fail('This file is not valid JSON.'); }
    if (!data || data.format !== 'longhand-research-projects' || data.version !== 1 ||
      !Array.isArray(data.projects) || data.projects.length > 500) fail('Unsupported research backup format.');
    const projects = data.projects.map(normalize);
    if (new Set(projects.map(project => project.id)).size !== projects.length) fail('The backup contains duplicate project IDs.');
    return projects;
  }
  function createRepository(records, options = {}) {
    const clock = options.clock || (() => new Date().toISOString());
    const makeId = options.makeId || (() => 'research-' + root.crypto.randomUUID());
    function history(project, action, note = '') {
      const entries = [...project.history, { at: clock(), action, note }];
      const recent = entries.slice(-100);
      const approval = project.status === 'APPROVED' && entries.slice().reverse().find(entry => entry.action === 'Approved');
      return approval && !recent.includes(approval) ? [approval, ...recent.slice(-99)] : recent;
    }
    function requireRevision(current, expected) {
      if (!current) fail('This research project no longer exists.');
      if (current.revision !== expected) fail('This project changed in another tab. Reload it before saving; your open text has been kept.');
      return normalize(current);
    }
    return Object.freeze({
      async all() { return (await records.all()).map(normalize).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); },
      async get(key) { if (!id(key)) fail('Invalid project ID.'); const value = await records.get(key); return value ? normalize(value) : null; },
      async remove(key, expected) {
        if (!id(key)) fail('Invalid project ID.');
        return records.change(key, current => { requireRevision(current, expected); return null; });
      },
      async create(value) {
        const time = clock();
        const project = normalize({ version: 1, id: makeId(), createdAt: time, updatedAt: time, revision: 1,
          brief: brief(value), status: 'DRAFT', sources: [], draftKind: 'planning', draftBody: '',
          run: { times: [] }, outputs: [], reportId: null, history: [{ at: time, action: 'Created', note: '' }] });
        return records.change(project.id, current => { if (current) fail('Project ID already exists.'); return project; });
      },
      async save(value, expected) {
        const next = normalize({ ...value, status: 'DRAFT' });
        return records.change(next.id, value => {
          const current = requireRevision(value, expected);
          if (current.draftKind === 'planning' && next.draftKind === 'research' && next.draftBody === current.draftBody) fail('Replace the planning text with your research draft before marking it ready for review.');
          if (JSON.stringify(next.brief) !== JSON.stringify(current.brief)) {
            next.run = { times: [] }; next.outputs = [];
            if (next.draftKind === 'planning' && next.draftBody === current.draftBody) next.draftBody = '';
          }
          const content = project => JSON.stringify([project.brief, project.sources, project.draftKind, project.draftBody, project.run, project.outputs]);
          const changed = content(next) !== content(current);
          return normalize({ ...next, createdAt: current.createdAt, revision: current.revision + 1, updatedAt: clock(),
            status: changed ? 'DRAFT' : current.status,
            history: history(current, changed && current.status !== 'DRAFT' ? 'Changed; review reset' : 'Saved') });
        });
      },
      async review(key, expected, action, note) {
        if (!text(note, 2000)) fail('Write a review note first.');
        return records.change(key, value => {
          const current = requireRevision(value, expected);
          let status;
          if (action === 'submit' && current.status === 'DRAFT') status = 'IN_REVIEW';
          else if (action === 'approve' && current.status === 'IN_REVIEW') status = 'APPROVED';
          else if (action === 'revise' && current.status !== 'DRAFT') status = 'DRAFT';
          else fail('That review action is not available in the current state.');
          return normalize({ ...current, status, revision: current.revision + 1, updatedAt: clock(),
            history: history(current, { submit: 'Submitted for review', approve: 'Approved', revise: 'Changes requested' }[action], note.trim()) });
        });
      },
      async exportBackup(key) {
        const projects = key ? [await this.get(key)] : await this.all();
        const backup = JSON.stringify({ format: 'longhand-research-projects', version: 1, exportedAt: clock(), projects }, null, 2);
        parseBackup(backup); return backup;
      },
      async importBackup(input) { const projects = parseBackup(input); await records.insertMany(projects); return projects.length; }
    });
  }
  LH.Research = Object.freeze({ normalize, parseBackup, createRepository, clone });
})(globalThis);
