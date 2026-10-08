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
  const REASONING_FIELDS = Object.freeze(['thesis', 'analysis', 'assumptions', 'alternatives', 'uncertainty', 'reviewConditions', 'horizon']);
  const REVIEW_CHECKS = Object.freeze([
    { id: 'claims', label: 'Material claims have appropriate support or explicit uncertainty labels.' },
    { id: 'sources', label: 'Source passages, definitions, dates and independence have been examined.' },
    { id: 'reasoning', label: 'The reasoning and any calculations follow from the stated evidence and assumptions.' },
    { id: 'alternatives', label: 'Relevant assumptions, alternatives and qualifying evidence have been considered.' },
    { id: 'uncertainty', label: 'Confidence, limitations and the applicable scope or horizon are explained.' },
    { id: 'monitoring', label: 'Review conditions are observable, and the draft reflects the current reasoning.' }
  ].map(Object.freeze));
  const HISTORY_LIMIT = 5, HISTORY_BYTES = 2000000;
  const bytes = value => new TextEncoder().encode(JSON.stringify(value)).byteLength;
  const emptyReasoning = () => ({ ...Object.fromEntries(REASONING_FIELDS.map(field => [field, ''])), evidence: [] });
  function brief(value) {
    if (!value || !text(value.topic, 160) || !text(value.question, 480) || !text(value.objective, 480)) fail('Enter a topic, research question and objective.');
    return { topic: value.topic.trim(), question: value.question.trim(), objective: value.objective.trim() };
  }
  function sourceNotebook(value) {
    if (!Array.isArray(value) || value.length > 100) fail('A project can contain up to 100 source records.');
    const seen = new Set();
    return value.map(source => {
      if (!source || !id(source.id) || seen.has(source.id) || !text(source.title, 240) || !text(source.url, 2000) ||
        !text(source.notes, 2000, false) || typeof source.checked !== 'boolean') fail('Invalid or duplicate source record.');
      if (source.checked && !source.notes.trim()) fail('Record what the source supports before marking it checked.');
      let url;
      try { url = new URL(source.url); } catch { fail('Use a full https:// or http:// source URL.'); }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.href.length > 2000) fail('Use a full https:// or http:// source URL without credentials, up to 2,000 characters.');
      seen.add(source.id);
      return { id: source.id, title: source.title.trim(), url: url.href, notes: source.notes, checked: source.checked };
    });
  }
  function reasoningRecord(value, sources) {
    if (value === undefined) return emptyReasoning();
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid reasoning record.');
    const result = {};
    for (const field of REASONING_FIELDS) {
      const content = value[field] === undefined ? '' : value[field];
      if (!text(content, field === 'analysis' ? 12000 : 4000, false)) fail('Invalid or oversized reasoning field: ' + field + '.');
      result[field] = content;
    }
    const evidence = value.evidence === undefined ? [] : value.evidence;
    if (!Array.isArray(evidence) || evidence.length > 100) fail('Reasoning can contain up to 100 evidence links.');
    const sourceIds = new Set(sources.map(source => source.id)), seen = new Set();
    result.evidence = evidence.map(link => {
      if (!link || !sourceIds.has(link.sourceId) || !['supports', 'qualifies', 'challenges'].includes(link.relation) ||
        !text(link.locator, 240) || !text(link.note, 2000)) fail('Each evidence link needs a project source, relationship, locator and note.');
      const locator = link.locator.trim(), key = JSON.stringify([link.sourceId, link.relation, locator]);
      if (seen.has(key)) fail('Duplicate reasoning evidence link.');
      seen.add(key);
      return { sourceId: link.sourceId, relation: link.relation, locator, note: link.note.trim() };
    });
    return result;
  }
  function checklist(value) {
    const keys = REVIEW_CHECKS.map(check => check.id);
    if (!Array.isArray(value) || value.length !== keys.length || new Set(value).size !== keys.length ||
      !keys.every(key => value.includes(key))) fail('Complete all six review checks before approval.');
    return keys;
  }
  function reviewRecord(value, revision) {
    if (value === undefined || value === null) return null;
    if (!value || !iso(value.at) || !Number.isSafeInteger(value.revision) || value.revision < 1 ||
      value.revision > revision || !text(value.reviewer, 160)) fail('Invalid manual review record.');
    return { at: value.at, revision: value.revision, reviewer: value.reviewer.trim(), checks: checklist(value.checks) };
  }
  function requireReasoning(reasoning) {
    if (!['thesis', 'analysis', 'uncertainty', 'reviewConditions'].every(field => reasoning[field].trim()) || !reasoning.evidence.length) {
      fail('Approval needs a thesis, analysis, uncertainty, review conditions and at least one evidence link.');
    }
  }
  function reasoningSnapshot(value) {
    if (!value || !iso(value.at) || !Number.isSafeInteger(value.revision) || value.revision < 1 ||
      !['planning', 'research'].includes(value.draftKind) || !text(value.draftBody, 100000, false)) fail('Invalid retained reasoning version.');
    const sources = sourceNotebook(value.sources), reasoning = reasoningRecord(value.reasoning, sources), review = reviewRecord(value.review, value.revision);
    const status = value.status === undefined ? null : value.status;
    const approvalNote = value.approvalNote === undefined ? '' : value.approvalNote;
    if ((status !== null && !statuses.includes(status)) || !text(approvalNote, 2000, false) ||
      (status === 'APPROVED' && !approvalNote.trim()) || (status !== 'APPROVED' && approvalNote.trim()) ||
      (review && status !== null && status !== 'APPROVED')) fail('Invalid retained approval state or note.');
    if (review || status === 'APPROVED') {
      if (value.draftKind !== 'research' || !value.draftBody.trim() || !sources.some(source => source.checked)) fail('A retained approval needs research text and a checked source.');
      if (review) {
        requireReasoning(reasoning);
        if (review.at > value.at) fail('The retained approval timestamp is later than its saved version.');
      }
    }
    return { at: value.at, revision: value.revision, brief: brief(value.brief), sources,
      draftKind: value.draftKind, draftBody: value.draftBody,
      reasoning, review, status, approvalNote };
  }
  function captureSnapshot(current) {
    const approval = current.status === 'APPROVED' && current.history.slice().reverse().find(entry => entry.action === 'Approved');
    return reasoningSnapshot({ ...current, at: current.updatedAt, approvalNote: approval ? approval.note : '' });
  }
  function normalize(value) {
    if (!value || value.version !== 1 || !id(value.id) || !iso(value.createdAt) || !iso(value.updatedAt) ||
      value.updatedAt < value.createdAt || !Number.isSafeInteger(value.revision) || value.revision < 1 || !statuses.includes(value.status)) fail('Invalid research project record.');
    const sources = sourceNotebook(value.sources), reasoning = reasoningRecord(value.reasoning, sources);
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
    const review = reviewRecord(value.review, value.revision);
    if (review && value.status !== 'APPROVED') fail('A manual approval record belongs to approved research.');
    if (review) requireReasoning(reasoning);
    if (review && (review.at < value.createdAt || review.at > value.updatedAt)) fail('The approval timestamp is outside the project lifetime.');
    const retained = value.reasoningHistory === undefined ? [] : value.reasoningHistory;
    if (!Array.isArray(retained) || retained.length > HISTORY_LIMIT) fail('Keep at most five retained reasoning versions.');
    const reasoningHistory = retained.map(reasoningSnapshot);
    if (reasoningHistory.some((snapshot, index) => snapshot.revision >= value.revision || snapshot.at < value.createdAt || snapshot.at > value.updatedAt ||
      (snapshot.review && snapshot.review.at < value.createdAt) ||
      (index > 0 && snapshot.revision <= reasoningHistory[index - 1].revision)) ||
      (reasoningHistory.length && bytes(reasoningHistory) > HISTORY_BYTES)) fail('Invalid retained reasoning history or history exceeds 2 MB.');
    return { version: 1, id: value.id, createdAt: value.createdAt, updatedAt: value.updatedAt,
      revision: value.revision, brief: brief(value.brief), status: value.status, sources,
      draftKind: value.draftKind, draftBody: value.draftBody, run: { times: [...value.run.times] },
      outputs, reportId: value.reportId, history, reasoning, review, reasoningHistory };
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
    function retain(current) {
      const versions = [...current.reasoningHistory, captureSnapshot(current)].slice(-HISTORY_LIMIT);
      while (bytes(versions) > HISTORY_BYTES) versions.shift();
      return versions;
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
        // Review and retained versions are derived from the stored record, never caller edits.
        const next = normalize({ ...value, status: 'DRAFT', review: null, reasoningHistory: [],
          history: [{ at: value && value.createdAt, action: 'Saving', note: '' }] });
        return records.change(next.id, value => {
          const current = requireRevision(value, expected);
          if (current.draftKind === 'planning' && next.draftKind === 'research' && next.draftBody === current.draftBody) fail('Replace the planning text with your research draft before marking it ready for review.');
          if (JSON.stringify(next.brief) !== JSON.stringify(current.brief)) {
            next.run = { times: [] }; next.outputs = [];
            if (next.draftKind === 'planning' && next.draftBody === current.draftBody) next.draftBody = '';
          }
          const researchContent = project => JSON.stringify([project.brief, project.sources, project.draftKind, project.draftBody, project.reasoning]);
          const researchChanged = researchContent(next) !== researchContent(current);
          const changed = researchChanged || JSON.stringify([next.run, next.outputs]) !== JSON.stringify([current.run, current.outputs]);
          const at = clock();
          let reasoningHistory = current.reasoningHistory;
          if (researchChanged && ((current.draftKind === 'research' && current.draftBody.trim()) ||
            REASONING_FIELDS.some(field => current.reasoning[field].trim()) || current.reasoning.evidence.length)) {
            reasoningHistory = retain(current);
          }
          return normalize({ ...next, createdAt: current.createdAt, revision: current.revision + 1, updatedAt: at,
            status: changed ? 'DRAFT' : current.status,
            review: changed ? null : current.review, reasoningHistory,
            history: history(current, changed && current.status !== 'DRAFT' ? 'Changed; review reset' : 'Saved') });
        });
      },
      async review(key, expected, action, note, attestation) {
        if (!text(note, 2000)) fail('Write a review note first.');
        return records.change(key, value => {
          const current = requireRevision(value, expected);
          let status;
          if (action === 'submit' && current.status === 'DRAFT') status = 'IN_REVIEW';
          else if (action === 'approve' && current.status === 'IN_REVIEW') status = 'APPROVED';
          else if (action === 'revise' && current.status !== 'DRAFT') status = 'DRAFT';
          else fail('That review action is not available in the current state.');
          let review = null;
          if (action === 'approve') {
            if (!current.sources.some(source => source.checked)) fail('Approval needs a checked source and a review note.');
            requireReasoning(current.reasoning);
            if (!attestation || !text(attestation.reviewer, 160)) fail('Name the reviewer before approval.');
            review = { at: clock(), revision: current.revision, reviewer: attestation.reviewer.trim(), checks: checklist(attestation.checks) };
          }
          return normalize({ ...current, status, revision: current.revision + 1, updatedAt: clock(),
            review,
            history: history(current, { submit: 'Submitted for review', approve: 'Approved', revise: 'Changes requested' }[action], note.trim()) });
        });
      },
      async exportBackup(key) {
        const projects = key ? [await this.get(key)] : await this.all();
        const backup = JSON.stringify({ format: 'longhand-research-projects', version: 1, exportedAt: clock(), projects }, null, 2);
        parseBackup(backup); return backup;
      },
      async prepareImport(input) {
        const projects = parseBackup(input), saved = new Map((await this.all()).map(project => [project.id, project]));
        return projects.map(project => ({ id: project.id, topic: project.brief.topic,
          revision: saved.has(project.id) ? saved.get(project.id).revision : null }));
      },
      async importBackup(input, expected) {
        const projects = parseBackup(input);
        // Restore-only callers retain the existing conflict protection. The UI
        // explicitly confirms updates against the revisions shown in its preview.
        if (expected === undefined) { await records.insertMany(projects); return projects.length; }
        if (!Array.isArray(expected) || expected.length !== projects.length || expected.some((entry, index) =>
          !entry || entry.id !== projects[index].id || (entry.revision !== null && (!Number.isSafeInteger(entry.revision) || entry.revision < 1)))) fail('Preview this backup again before importing.');
        await records.changeMany(projects.map(project => project.id), values => projects.map((incoming, index) => {
          const value = values[index], revision = expected[index].revision;
          if (revision === null) {
            if (value) fail('A project appeared in another tab. Preview this backup again; nothing was imported.');
            return incoming;
          }
          const current = requireRevision(value, revision);
          const next = { ...incoming, run: clone(incoming.run), outputs: clone(incoming.outputs) };
          if (JSON.stringify(next.brief) !== JSON.stringify(current.brief)) { next.run = { times: [] }; next.outputs = []; }
          const content = project => JSON.stringify([project.brief, project.sources, project.draftKind, project.draftBody,
            project.reasoning, project.run, project.outputs]);
          if (content(next) === content(current)) {
            if (next.reportId === current.reportId) return current;
            return normalize({ ...current, reportId: next.reportId, updatedAt: clock(), revision: current.revision + 1,
              history: history(current, 'Imported report connection', 'Research and its current review were unchanged.') });
          }
          if (current.draftKind === 'planning' && next.draftKind === 'research' && next.draftBody === current.draftBody) fail('Replace the planning text with your research draft before marking it ready for review.');
          return normalize({ ...next, createdAt: current.createdAt, updatedAt: clock(), revision: current.revision + 1,
            status: 'DRAFT', review: null, reasoningHistory: retain(current),
            history: history(current, 'Imported update; review reset', 'Draft, sources and reasoning imported together. Previous version retained.') });
        }));
        return projects.length;
      }
    });
  }
  LH.Research = Object.freeze({ normalize, parseBackup, createRepository, clone, REASONING_FIELDS, REVIEW_CHECKS, emptyReasoning });
})(globalThis);
