import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context = vm.createContext({ Date, URL, TextEncoder });
vm.runInContext(fs.readFileSync(new URL('../assets/js/research-projects.js', import.meta.url), 'utf8'), context);
const model = context.Longhand.Research;
const copy = value => JSON.parse(JSON.stringify(value));
const scope = { topic: 'Research workflow test', question: 'Which evidence is needed?', objective: 'Keep the source and draft connected.' };
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
  project = await repo.save({ ...project, sources: [{ id: 'source-1', title: 'Test source', url: 'https://example.com/', notes: 'Test evidence note.', checked: true }] }, project.revision);
  assert.equal(project.status, 'DRAFT');
  project = await repo.review(project.id, project.revision, 'submit', 'Ready.');
  project = await repo.review(project.id, project.revision, 'approve', 'Evidence and wording checked manually.');
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
