import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context = vm.createContext({ Date, URL, TextEncoder });
for (const file of ['research-projects.js', 'research-operations.js']) vm.runInContext(fs.readFileSync(new URL('../assets/js/' + file, import.meta.url), 'utf8'), context);
const operations = context.Longhand.ResearchOperations;
const project = overrides => ({ version: 1, id: 'project-1', createdAt: '2026-10-07T10:00:00.000Z', updatedAt: '2026-10-07T10:00:00.000Z', revision: 1,
  brief: { topic: 'Synthetic research test', question: 'Which evidence?', objective: 'Test the handoff.' },
  status: 'DRAFT', sources: [], draftKind: 'planning', draftBody: '', run: { times: [] }, outputs: [], reportId: null,
  history: [{ at: '2026-10-07T10:00:00.000Z', action: 'Created', note: '' }], ...overrides });
const source = { id: 'source-1', title: 'Test source', url: 'https://example.com/', notes: 'Synthetic note.', checked: true };
const approved = overrides => project({ status: 'APPROVED', sources: [source], draftKind: 'research', draftBody: 'Human-written test prose.',
  history: [{ at: '2026-10-07T10:00:00.000Z', action: 'Approved', note: 'Test evidence and wording reviewed.' }], ...overrides });

test('operations distinguish evidence, writing, review and manual report handoff', () => {
  assert.equal(operations.projectState(project(), []).stage, 'sources');
  assert.equal(operations.projectState(project({ sources: [source] }), []).stage, 'writing');
  assert.equal(operations.projectState(project({ sources: [source, { ...source, id: 'source-2', checked: false }] }), []).stage, 'sources');
  assert.equal(operations.projectState(project({ status: 'IN_REVIEW', draftKind: 'research', draftBody: 'Test prose' }), []).stage, 'review');
  const ready = operations.projectState(approved(), []);
  assert.equal(ready.stage, 'publication'); assert.equal(ready.published, false);
  assert.equal(ready.attention, true);
  assert.equal(ready.checks.at(-1).done, false, 'manual approval never implies publication');
});

test('Library source determines catalogue state; drafts, missing IDs and edited published projects remain explicit', () => {
  const linked = approved({ reportId: 'report-1' });
  assert.equal(operations.projectState(linked, [{ id: 'report-1', isLocal: true }]).stage, 'publication');
  assert.equal(operations.projectState(linked, []).stage, 'missing');
  const published = operations.projectState(linked, [{ id: 'report-1', isLocal: false }]);
  assert.equal(published.stage, 'published'); assert.equal(published.attention, false);
  const revised = operations.projectState({ ...linked, status: 'DRAFT' }, [{ id: 'report-1', isLocal: false }]);
  assert.equal(revised.published, true); assert.equal(revised.approved, false); assert.equal(revised.attention, true);
  assert.match(revised.next, /Review the current project/);
});

test('summary counts source tasks and sorts actionable projects without changing any saved records', () => {
  const rows = [approved({ id: 'approved' }), project({ id: 'review', status: 'IN_REVIEW' }),
    project({ id: 'source', sources: [{ ...source, checked: false }] }), approved({ id: 'missing', reportId: 'gone' }),
    approved({ id: 'published', reportId: 'report-1' })];
  const before = JSON.stringify(rows);
  const summary = operations.summarize(rows, [{ id: 'report-1', isLocal: false }]);
  assert.equal(summary.total, 5); assert.equal(summary.review, 1); assert.equal(summary.publication, 2);
  assert.equal(summary.published, 1); assert.equal(summary.unchecked, 1);
  assert.equal(summary.queue[0].project.id, 'missing'); assert.equal(summary.queue.at(-1).project.id, 'published');
  assert.equal(JSON.stringify(rows), before);
});

test('approved handoff exports real saved prose, evidence and the review note; planning and unapproved records cannot export', () => {
  const record = approved({ sources: [source, { ...source, id: 'source-2', checked: false }] });
  const text = operations.approvedText(record);
  assert.match(text, /Human-written test prose/); assert.match(text, /https:\/\/example.com/);
  assert.match(text, /Test evidence and wording reviewed/); assert.match(text, /Unchecked — review before publication/);
  assert.match(text, /does not publish a report/);
  assert.match(text, /Legacy approval: the constitutional checklist and reviewer attribution were not recorded/);
  assert.throws(() => operations.approvedText(project()), /Complete manual approval/);
  assert.throws(() => operations.approvedText({ ...record, draftKind: 'planning' }), /Planning/);
});

test('current approved handoff connects reasoning, thesis evidence and attributed manual review', () => {
  const research = context.Longhand.Research;
  const reasoning = { ...research.emptyReasoning(), thesis: 'Synthetic bounded thesis.', analysis: 'Synthetic interpretation from a test observation.',
    uncertainty: 'Tentative test assessment.', reviewConditions: 'Revisit if the test condition changes.',
    evidence: [{ sourceId: source.id, relation: 'qualifies', locator: 'Synthetic table 1', note: 'A qualifying test condition.' }] };
  const record = approved({ revision: 2, reasoning, review: { at: '2026-10-07T10:00:00.000Z', revision: 1,
    reviewer: 'Synthetic reviewer', checks: research.REVIEW_CHECKS.map(check => check.id) } });
  assert.equal(operations.projectState(record, []).reasoning, true);
  const text = operations.approvedText(record);
  assert.match(text, /Synthetic bounded thesis/); assert.match(text, /Synthetic table 1/);
  assert.match(text, /Source ID: source-1/); assert.match(text, /Reviewer: Synthetic reviewer \(manually supplied\)/);
  assert.equal((text.match(/Checked manually:/g) || []).length, 6);
  assert.match(text, /Reviewed content revision: 1/);
});
