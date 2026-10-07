import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context = vm.createContext({ Date, URL, TextEncoder });
vm.runInContext(fs.readFileSync(new URL('../assets/js/research-projects.js', import.meta.url), 'utf8'), context);
const model = context.Longhand.Research;
const copy = value => JSON.parse(JSON.stringify(value));
const scope = { topic: 'Research workflow test', question: 'Which evidence is needed?', objective: 'Keep the source and draft connected.' };
const checkedSource = { id: 'source-1', title: 'Synthetic source', url: 'https://example.com/document', notes: 'Synthetic evidence note.', checked: true };
const attestation = () => ({ reviewer: 'Test reviewer', checks: model.REVIEW_CHECKS.map(check => check.id) });
const reasoning = (overrides = {}) => ({ ...model.emptyReasoning(), thesis: 'A provisional test position.',
  analysis: 'The observation supports this explanation within its stated scope.', uncertainty: 'Other explanations remain possible.',
  reviewConditions: 'Revisit when the next comparable observation is available.',
  evidence: [{ sourceId: checkedSource.id, relation: 'supports', locator: 'Page 1, test table', note: 'Supports the synthetic observation.' }], ...overrides });
function storage() {
  const rows = new Map(); let queue = Promise.resolve();
  const atomic = operation => { const next = queue.then(operation); queue = next.catch(() => {}); return next; };
  return { rows,
    all: async () => [...rows.values()].map(copy),
    get: async id => rows.has(id) ? copy(rows.get(id)) : undefined,
    change: (id, transform) => atomic(() => { const next = transform(rows.has(id) ? copy(rows.get(id)) : undefined); if (next === null) rows.delete(id); else rows.set(id, copy(next)); return copy(next); }),
    insertMany: records => atomic(() => {
      if (records.some(record => rows.has(record.id))) throw new Error('Project already exists');
      records.forEach(record => rows.set(record.id, copy(record)));
    })
  };
}
function setup() {
  const records = storage(); let ids = 0;
  const repo = model.createRepository(records, { clock: () => '2026-10-07T10:00:00.000Z', makeId: () => 'project-' + ++ids });
  return { repo, records };
}

test('deletion keeps other projects and rejects stale deletion and resurrection', async () => {
  const { repo } = setup();
  const old = await repo.create(scope), other = await repo.create(scope);
  const current = await repo.save({ ...old, draftBody: 'New work in another tab' }, old.revision);
  await assert.rejects(repo.remove(old.id, old.revision), /another tab/);
  assert.equal((await repo.get(old.id)).draftBody, current.draftBody);
  await repo.remove(current.id, current.revision);
  assert.equal(await repo.get(current.id), null);
  assert.deepEqual((await repo.all()).map(item => item.id), [other.id]);
  await assert.rejects(repo.save(current, current.revision), /no longer exists/);
  await assert.rejects(repo.review(current.id, current.revision, 'submit', 'Stale review'), /no longer exists/);
});

test('project IDs, brief records and returned copies stay independent', async () => {
  const { repo } = setup(); const first = await repo.create(scope), second = await repo.create(scope);
  assert.notEqual(first.id, second.id);
  first.brief.topic = 'Changed copy'; first.sources.push({});
  assert.equal((await repo.get(first.id)).brief.topic, scope.topic);
  assert.equal((await repo.get(first.id)).sources.length, 0);
  await assert.rejects(repo.create({ ...scope, topic: '' }), /Enter a topic/);
  assert.equal((await repo.all()).length, 2);
});

test('unsafe source URLs, duplicate IDs and checked sources without evidence are rejected atomically', async () => {
  const { repo } = setup(); const project = await repo.create(scope);
  const source = { id: 'source-1', title: 'Example source', url: 'https://example.com/document', notes: 'Test passage only.', checked: false };
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@example.com']) {
    await assert.rejects(repo.save({ ...project, sources: [{ ...source, url }] }, 1), /URL/);
  }
  await assert.rejects(repo.save({ ...project, sources: [source, source] }, 1), /duplicate/);
  await assert.rejects(repo.save({ ...project, sources: [{ ...source, checked: true, notes: '' }] }, 1), /supports/);
  assert.equal((await repo.get(project.id)).revision, 1);
});

test('planning output cannot be approved or relabelled without a research edit', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, draftBody: 'Simulated planning record.' }, 1);
  await assert.rejects(repo.review(project.id, project.revision, 'submit', 'Review this.'), /Planning/);
  await assert.rejects(repo.save({ ...project, draftKind: 'research' }, project.revision), /Replace the planning/);
  assert.equal((await repo.get(project.id)).status, 'DRAFT');
});

test('manual review requires notes, evidence and ordered transitions; content edits reset approval', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, draftKind: 'research', draftBody: 'Human-written test draft.' }, project.revision);
  await assert.rejects(repo.review(project.id, project.revision, 'approve', 'Test review.'), /not available/);
  await assert.rejects(repo.review(project.id, project.revision, 'submit', ''), /note/);
  project = await repo.review(project.id, project.revision, 'submit', 'Review the test draft.');
  await assert.rejects(repo.review(project.id, project.revision, 'approve', 'Checked.'), /checked source/);
  project = await repo.save({ ...project, sources: [checkedSource], reasoning: reasoning() }, project.revision);
  assert.equal(project.status, 'DRAFT');
  project = await repo.review(project.id, project.revision, 'submit', 'Ready.');
  project = await repo.review(project.id, project.revision, 'approve', 'Evidence and wording checked manually.', attestation());
  assert.equal(project.status, 'APPROVED');
  const unchanged = await repo.save({ ...project, reportId: 'existing-report' }, project.revision);
  assert.equal(unchanged.status, 'APPROVED', 'linking does not publish or undo review');
  project = unchanged;
  for (let save = 0; save < 101; save++) project = await repo.save(project, project.revision);
  assert.equal(project.history.length, 100);
  assert.ok(project.history.some(entry => entry.action === 'Approved'));
  project = await repo.save({ ...project, sources: project.sources.map(source => ({ ...source, checked: false })) }, project.revision);
  assert.equal(project.status, 'DRAFT');
  assert.equal(project.history.at(-1).action, 'Changed; review reset');
});

test('optimistic revisions prevent two tabs from overwriting each other', async () => {
  const { repo } = setup(); const project = await repo.create(scope);
  const results = await Promise.allSettled([
    repo.save({ ...project, draftBody: 'First editor' }, 1),
    repo.save({ ...project, draftBody: 'Second editor' }, 1)
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(results.find(result => result.status === 'rejected').reason.message, /another tab/);
  assert.equal((await repo.get(project.id)).draftBody, 'First editor');
});

test('backups round-trip all research records and exclude PDFs and folder permissions', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, draftBody: '<script>plain text</script>', reportId: 'catalogue-1' }, project.revision);
  const backup = await repo.exportBackup(); const target = setup();
  assert.equal(await target.repo.importBackup(backup), 1);
  assert.deepEqual(await target.repo.all(), await repo.all());
  assert.equal((await target.repo.get(project.id)).draftBody, '<script>plain text</script>');
  assert.equal(backup.includes('siteDir'), false); assert.equal(backup.includes('pdfBlob'), false);
});

test('invalid, duplicate, conflicting and unsupported backups never partially import', async () => {
  const { repo } = setup(); const project = await repo.create(scope);
  const envelope = projects => JSON.stringify({ format: 'longhand-research-projects', version: 1, projects });
  await assert.rejects(repo.importBackup('not json'), /valid JSON/);
  await assert.rejects(repo.importBackup(envelope([{ ...project, id: 'new-project' }, { ...project, revision: 0 }])), /Invalid/);
  await assert.rejects(repo.importBackup(envelope([project, project])), /duplicate/);
  await assert.rejects(repo.importBackup(envelope([{ ...project, id: 'new-project' }, project])), /already exists/);
  await assert.rejects(repo.importBackup(JSON.stringify({ format: 'longhand-research-projects', version: 2, projects: [] })), /Unsupported/);
  assert.equal((await repo.all()).length, 1);
});

test('individual project backups remain importable when the full library exceeds the size limit', async () => {
  const { repo } = setup(); let first;
  for (let index = 0; index < 19; index++) {
    const project = await repo.create(scope);
    const saved = await repo.save({ ...project, draftBody: '漢'.repeat(100000) }, project.revision);
    if (!first) first = saved;
  }
  await assert.rejects(repo.exportBackup(), /exceeds 5 MB/);
  const backup = await repo.exportBackup(first.id);
  const projects = model.parseBackup(backup); assert.equal(projects.length, 1); assert.equal(projects[0].id, first.id);
});

test('workflow references and timestamp order are checked before saving or importing', async () => {
  const { repo } = setup(); const project = await repo.create(scope);
  await assert.rejects(repo.save({ ...project, run: { times: Array(4).fill('2026-10-07T10:00:00.000Z') } }, 1), /outputs do not match/);
  await assert.rejects(repo.save({ ...project, run: { times: ['2026-10-07T10:00:00.000Z', '2026-10-07T09:00:00.000Z'] } }, 1), /progress/);
  await assert.rejects(repo.save({ ...project, outputs: [{ agentId: 'researcher-2' }] }, 1), /outputs do not match/);
  assert.equal((await repo.get(project.id)).revision, 1);
});

test('storage failures propagate without claiming a successful save', async () => {
  const records = storage(); records.change = async () => { throw new Error('Quota exceeded'); };
  const repo = model.createRepository(records, { makeId: () => 'test-project' });
  await assert.rejects(repo.create(scope), /Quota exceeded/);
  assert.deepEqual(await repo.all(), []);
});

test('legacy version-1 projects and approved backups retain status without inventing reasoning or review checks', async () => {
  const { repo, records } = setup(); const created = await repo.create(scope);
  const legacy = { ...created, status: 'APPROVED', sources: [checkedSource], draftKind: 'research', draftBody: 'Previously approved prose.',
    history: [{ at: created.createdAt, action: 'Approved', note: 'Legacy approval note.' }] };
  delete legacy.reasoning; delete legacy.review; delete legacy.reasoningHistory;
  records.rows.set(legacy.id, legacy);
  const normalized = await repo.get(legacy.id);
  assert.equal(normalized.status, 'APPROVED'); assert.equal(normalized.review, null);
  assert.deepEqual(copy(normalized.reasoning), copy(model.emptyReasoning())); assert.equal(normalized.reasoningHistory.length, 0);
  const target = setup(); await target.repo.importBackup(await repo.exportBackup());
  assert.deepEqual(copy(await target.repo.all()), copy(await repo.all()));
  const saved = await repo.save({ ...normalized, reportId: 'legacy-report' }, normalized.revision);
  assert.equal(saved.status, 'APPROVED'); assert.equal(saved.review, null);
});

test('reasoning evidence uses real project sources, bounded plain text, allowed relationships and distinct locators', async () => {
  const { repo } = setup(); const created = await repo.create(scope);
  const value = { ...created, sources: [checkedSource], reasoning: reasoning() };
  const link = value.reasoning.evidence[0];
  for (const changed of [
    { sourceId: 'missing-source' }, { relation: 'proves' }, { locator: '' }, { note: '' },
    { locator: 'x'.repeat(241) }, { note: 'x'.repeat(2001) }
  ]) await assert.rejects(repo.save({ ...value, reasoning: reasoning({ evidence: [{ ...link, ...changed }] }) }, 1), /evidence link/);
  await assert.rejects(repo.save({ ...value, reasoning: reasoning({ evidence: [link, { ...link, locator: ' ' + link.locator + ' ' }] }) }, 1), /Duplicate/);
  await assert.rejects(repo.save({ ...value, reasoning: reasoning({ thesis: 'x'.repeat(4001) }) }, 1), /oversized.*thesis/);
  await assert.rejects(repo.save({ ...value, reasoning: reasoning({ analysis: 'x'.repeat(12001) }) }, 1), /oversized.*analysis/);
  await assert.rejects(repo.save({ ...value, reasoning: reasoning({ evidence: Array(101).fill(link) }) }, 1), /100 evidence/);
  assert.equal((await repo.get(created.id)).revision, 1);
  const saved = await repo.save({ ...value, reasoning: reasoning({ evidence: [link, { ...link, relation: 'challenges' }, { ...link, locator: 'Page 2' }] }) }, 1);
  assert.equal(saved.reasoning.evidence.length, 3);
  saved.reasoning.evidence[0].note = 'Changed returned copy';
  assert.equal((await repo.get(created.id)).reasoning.evidence[0].note, link.note);
});

test('new approval requires substantive reasoning, evidence, reviewer and every manual check on the saved revision', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, draftKind: 'research', draftBody: 'Synthetic research prose.', sources: [checkedSource] }, project.revision);
  project = await repo.review(project.id, project.revision, 'submit', 'Submit existing prose.');
  await assert.rejects(repo.review(project.id, project.revision, 'approve', 'Review note.', attestation()), /thesis, analysis/);
  project = await repo.save({ ...project, reasoning: reasoning() }, project.revision);
  project = await repo.review(project.id, project.revision, 'submit', 'Submit reasoned position.');
  const reviewedRevision = project.revision;
  for (const invalid of [undefined, { ...attestation(), reviewer: '' }, { ...attestation(), reviewer: 'x'.repeat(161) },
    { ...attestation(), checks: ['claims'] }, { ...attestation(), checks: [...attestation().checks.slice(0, 5), 'claims'] }]) {
    await assert.rejects(repo.review(project.id, project.revision, 'approve', 'Review note.', invalid), /reviewer|six review checks/);
  }
  project = await repo.review(project.id, project.revision, 'approve', 'Reasoning manually reviewed.', attestation());
  assert.equal(project.review.revision, reviewedRevision); assert.equal(project.review.reviewer, 'Test reviewer');
  assert.equal(project.review.checks.length, 6); assert.equal(project.status, 'APPROVED');
  const linked = await repo.save({ ...project, reportId: 'existing-report', review: { forged: true }, history: [], reasoningHistory: [{}] }, project.revision);
  assert.equal(linked.status, 'APPROVED'); assert.deepEqual(linked.review, project.review);
  assert.deepEqual(linked.reasoningHistory, project.reasoningHistory); assert.equal(linked.history.at(-1).action, 'Saved');
  project = await repo.review(linked.id, linked.revision, 'revise', 'Consider new evidence.');
  assert.equal(project.review, null); assert.equal(project.status, 'DRAFT');
});

test('material reasoning changes invalidate review and retain the previous thesis, uncertainty, evidence and approval', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, draftKind: 'research', draftBody: 'First argument.', sources: [checkedSource], reasoning: reasoning() }, project.revision);
  project = await repo.review(project.id, project.revision, 'submit', 'Ready for review.');
  project = await repo.review(project.id, project.revision, 'approve', 'Reviewed original position.', attestation());
  const original = copy(project);
  project = await repo.save({ ...project, draftBody: 'Revised argument.', sources: [], reasoning: reasoning({ thesis: 'A changed position.', uncertainty: 'A new uncertainty.', evidence: [] }) }, project.revision);
  assert.equal(project.status, 'DRAFT'); assert.equal(project.review, null);
  const snapshot = project.reasoningHistory.at(-1);
  assert.equal(snapshot.revision, original.revision); assert.equal(snapshot.draftBody, original.draftBody);
  assert.equal(snapshot.reasoning.thesis, original.reasoning.thesis); assert.equal(snapshot.reasoning.uncertainty, original.reasoning.uncertainty);
  assert.equal(snapshot.reasoning.evidence[0].sourceId, snapshot.sources[0].id);
  assert.deepEqual(copy(snapshot.review), original.review);
  const target = setup(); await target.repo.importBackup(await repo.exportBackup());
  assert.deepEqual(await target.repo.all(), await repo.all(), 'historical source references survive removal from the current notebook');
  snapshot.reasoning.thesis = 'Mutated caller copy';
  assert.equal((await repo.get(project.id)).reasoningHistory.at(-1).reasoning.thesis, original.reasoning.thesis);
});

test('brief, draft and source changes retain real research, while mock progress and unchanged saves do not', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, draftBody: 'Mock planning output.' }, project.revision);
  assert.equal(project.reasoningHistory.length, 0);
  project = await repo.save({ ...project, draftKind: 'research', draftBody: 'Actual synthetic research.', sources: [checkedSource], reasoning: reasoning() }, project.revision);
  assert.equal(project.reasoningHistory.length, 0);
  project = await repo.save({ ...project, run: { times: [project.createdAt] } }, project.revision);
  assert.equal(project.reasoningHistory.length, 0); assert.equal(project.review, null);
  assert.equal(project.reasoning.thesis, reasoning().thesis);
  project = await repo.save(project, project.revision); assert.equal(project.reasoningHistory.length, 0);
  project = await repo.save({ ...project, brief: { ...project.brief, objective: 'A revised objective.' } }, project.revision);
  assert.equal(project.reasoningHistory.length, 1); assert.equal(project.run.times.length, 0);
  project = await repo.save({ ...project, sources: [{ ...checkedSource, notes: 'Revised evidence context.' }] }, project.revision);
  assert.equal(project.reasoningHistory.length, 2);
  project = await repo.save({ ...project, draftBody: 'A revised draft.' }, project.revision);
  assert.equal(project.reasoningHistory.length, 3);
});

test('retained versions are bounded by five snapshots and a 2 MB UTF-8 budget without counting workflow saves', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, reasoning: reasoning({ evidence: [] }) }, project.revision);
  for (let index = 0; index < 7; index++) project = await repo.save({ ...project, reasoning: reasoning({ thesis: 'Position ' + index, evidence: [] }) }, project.revision);
  assert.equal(project.reasoningHistory.length, 5);
  assert.equal(project.reasoningHistory[0].reasoning.thesis, 'Position 1');
  const sources = Array.from({ length: 100 }, (_, index) => ({ ...checkedSource, id: 'large-' + index, notes: '漢'.repeat(2000) }));
  project = await repo.save({ ...project, sources, draftKind: 'research', draftBody: '漢'.repeat(100000), reasoning: reasoning({ evidence: [] }) }, project.revision);
  for (let index = 0; index < 5; index++) project = await repo.save({ ...project, reasoning: reasoning({ thesis: 'Large position ' + index, evidence: [] }) }, project.revision);
  assert.ok(project.reasoningHistory.length < 5, 'UTF-8 budget drops older large versions');
  assert.ok(new TextEncoder().encode(JSON.stringify(project.reasoningHistory)).byteLength <= 2000000);
  const target = setup(); await target.repo.importBackup(await repo.exportBackup(project.id));
  assert.deepEqual(await target.repo.get(project.id), await repo.get(project.id));
});

test('malformed historical references and review records reject the entire import; stale changes do not add versions', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, sources: [checkedSource], reasoning: reasoning() }, project.revision);
  const stale = project;
  project = await repo.save({ ...project, reasoning: reasoning({ thesis: 'Updated position.' }) }, project.revision);
  await assert.rejects(repo.save({ ...stale, reasoning: reasoning({ thesis: 'Stale position.' }) }, stale.revision), /another tab/);
  assert.equal((await repo.get(project.id)).reasoningHistory.length, 1);
  const backup = JSON.parse(await repo.exportBackup());
  const invalid = copy(backup); invalid.projects[0].reasoningHistory[0].reasoning.evidence[0].sourceId = 'not-in-snapshot';
  const target = setup(); await assert.rejects(target.repo.importBackup(JSON.stringify(invalid)), /evidence link/);
  assert.equal((await target.repo.all()).length, 0);
  const invalidReview = copy(backup); invalidReview.projects[0].review = { at: project.updatedAt, revision: project.revision, reviewer: 'Test', checks: ['claims'] };
  await assert.rejects(target.repo.importBackup(JSON.stringify(invalidReview)), /six review checks/);
  assert.equal((await target.repo.all()).length, 0);
});

test('retained reasoning records the prior saved timestamp, not the time of the later edit', async () => {
  const records = storage(); let at = '2026-10-07T10:00:00.000Z';
  const repo = model.createRepository(records, { clock: () => at, makeId: () => 'dated-position' });
  let project = await repo.create(scope);
  at = '2026-10-07T11:00:00.000Z';
  project = await repo.save({ ...project, sources: [checkedSource], reasoning: reasoning() }, project.revision);
  const prior = copy(project);
  at = '2026-10-08T14:00:00.000Z';
  project = await repo.save({ ...project, reasoning: reasoning({ thesis: 'Position after a later observation.' }) }, project.revision);
  assert.equal(project.updatedAt, at);
  assert.equal(project.reasoningHistory.at(-1).at, prior.updatedAt);
  assert.notEqual(project.reasoningHistory.at(-1).at, project.updatedAt);
});

test('historical approval requires its own researched prose, substantive reasoning and checked evidence', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, draftKind: 'research', draftBody: 'Reviewed synthetic position.', sources: [checkedSource], reasoning: reasoning() }, project.revision);
  project = await repo.review(project.id, project.revision, 'submit', 'Review original position.');
  project = await repo.review(project.id, project.revision, 'approve', 'Approved original position.', attestation());
  project = await repo.save({ ...project, reasoning: reasoning({ thesis: 'Revised synthetic position.' }) }, project.revision);
  const backup = JSON.parse(await repo.exportBackup());
  const mutations = [
    snapshot => { snapshot.draftKind = 'planning'; },
    snapshot => { snapshot.draftBody = ''; },
    snapshot => { snapshot.reasoning.analysis = ''; },
    snapshot => { snapshot.reasoning.evidence = []; },
    snapshot => { snapshot.sources[0].checked = false; },
    snapshot => { snapshot.review.at = '2026-10-08T14:00:00.000Z'; }
  ];
  for (const mutate of mutations) {
    const invalid = copy(backup); mutate(invalid.projects[0].reasoningHistory.at(-1));
    const target = setup();
    await assert.rejects(target.repo.importBackup(JSON.stringify(invalid)), /retained approval|Approval needs/);
    assert.equal((await target.repo.all()).length, 0);
  }
  const target = setup(); await target.repo.importBackup(JSON.stringify(backup));
  assert.deepEqual(await target.repo.get(project.id), await repo.get(project.id));
});

test('retained version dates and approval dates stay inside the saved project lifetime', async () => {
  const { repo } = setup(); let project = await repo.create(scope);
  project = await repo.save({ ...project, sources: [checkedSource], draftKind: 'research', draftBody: 'Synthetic prose.', reasoning: reasoning() }, project.revision);
  project = await repo.review(project.id, project.revision, 'submit', 'Submit synthetic position.');
  project = await repo.review(project.id, project.revision, 'approve', 'Approve synthetic position.', attestation());
  for (const at of ['2026-10-06T10:00:00.000Z', '2026-10-08T10:00:00.000Z']) {
    assert.throws(() => model.normalize({ ...project, review: { ...project.review, at } }), /project lifetime/);
  }
  project = await repo.save({ ...project, reasoning: reasoning({ thesis: 'A later position.' }) }, project.revision);
  const snapshot = project.reasoningHistory[0];
  for (const at of ['2026-10-06T10:00:00.000Z', '2026-10-08T10:00:00.000Z']) {
    assert.throws(() => model.normalize({ ...project, reasoningHistory: [{ ...snapshot, at, review: null }] }), /retained reasoning history/);
  }
});
