import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context = vm.createContext({});
for (const name of ['research-operations', 'research-tasks']) vm.runInContext(fs.readFileSync(new URL('../assets/js/' + name + '.js', import.meta.url), 'utf8'), context);
const guide = context.Longhand.ResearchTasks.guide;
const project = extra => ({ sources: [], status: 'DRAFT', draftKind: 'planning', draftBody: '', reportId: null, run: { times: [] }, ...extra });
const source = { checked: true, notes: 'Synthetic evidence.' };

test('next responsible role follows saved evidence, review and Library state', () => {
  assert.equal(guide(project(), []).owner, 'Research Associate');
  assert.equal(guide(project({ sources: [{ ...source, checked: false }] }), []).owner, 'Researcher');
  assert.equal(guide(project({ sources: [source] }), []).owner, 'Editor');
  assert.equal(guide(project({ status: 'IN_REVIEW' }), []).owner, 'Research Director');
  assert.equal(guide(project({ status: 'APPROVED' }), []).section, 'report-heading');
  assert.equal(guide(project({ reportId: 'missing' }), []).section, 'report-heading');
  const revised = guide(project({ reportId: 'report' }), [{ id: 'report', isLocal: false }]);
  assert.equal(revised.owner, 'Research Director'); assert.equal(revised.section, 'review-heading');
  assert.match(revised.blocker, /catalogue report is unchanged/);
  assert.equal(guide(project({ reportId: 'report', status: 'APPROVED' }), [{ id: 'report', isLocal: false }]).section, 'report-heading');
});

test('completed simulations cannot create evidence, analysis validation or approval signals', () => {
  const record = project({ run: { times: Array(29).fill('2026-10-08T00:00:00.000Z') }, outputs: Array(5).fill({}), draftBody: 'Simulated planning text.' });
  const before = JSON.stringify(record);
  const result = guide(record, []);
  assert.equal(result.tasks.length, 5);
  assert.equal(new Set(result.tasks.map(task => task.id)).size, 5);
  assert.equal(result.owner, 'Research Associate');
  assert.match(result.tasks.find(task => task.id === 'analyst').record, /not recorded separately/);
  assert.match(result.tasks.find(task => task.id === 'editor').record, /No researched draft/);
  assert.match(result.tasks.find(task => task.id === 'director').record, /no approval/);
  assert.match(result.simulation, /29\/29 simulated/);
  assert.equal(JSON.stringify(record), before);
});

test('missing constitutional reasoning routes researched drafts to the Researcher before review', () => {
  const draft = project({ sources: [source], draftKind: 'research', draftBody: 'Synthetic researched prose.' });
  const incomplete = guide(draft, []);
  assert.equal(incomplete.owner, 'Researcher'); assert.equal(incomplete.section, 'reasoning-heading');
  assert.match(incomplete.blocker, /reasoning or linked thesis evidence is missing/);
  assert.match(incomplete.next, /link its evidence/);
  const submitted = guide({ ...draft, status: 'IN_REVIEW' }, []);
  assert.equal(submitted.owner, 'Researcher'); assert.equal(submitted.section, 'reasoning-heading');
  assert.match(submitted.next, /resubmit for review/);
  const reasoning = { thesis: 'Test thesis', analysis: 'Test interpretation', uncertainty: 'Test limits', reviewConditions: 'Test trigger', evidence: [{}] };
  assert.equal(guide({ ...draft, reasoning: { ...reasoning, evidence: [] } }, []).owner, 'Researcher');
  const ready = guide({ ...draft, reasoning }, []);
  assert.equal(ready.owner, 'Editor'); assert.equal(ready.section, 'draft-heading');
  assert.match(ready.next, /Submit the saved research/);
  assert.equal(guide({ ...draft, reasoning, status: 'IN_REVIEW' }, []).owner, 'Research Director');
});

test('the role guide distinguishes legacy approval from an attributed constitutional review', () => {
  const legacy = guide(project({ status: 'APPROVED' }), []);
  assert.match(legacy.tasks.find(task => task.id === 'director').record, /Legacy approval/);
  const current = guide(project({ status: 'APPROVED', review: { reviewer: 'Synthetic reviewer' } }), []);
  assert.match(current.tasks.find(task => task.id === 'director').record, /Named reviewer and six manual checks/);
});
