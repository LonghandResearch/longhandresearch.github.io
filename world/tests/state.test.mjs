import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const context = vm.createContext({ console });
for (const file of ['state.js', 'movement.js', 'mock-events.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'world', file), 'utf8'), context, { filename: file });
}
const { State, Movement, Mock } = context.LonghandWorld;
const plain = (value) => JSON.parse(JSON.stringify(value));
const member = (store, id = 'researcher') => store.getSnapshot().agents.find(agent => agent.id === id);
const create = () => State.createStore({ clock: () => '2026-10-05T00:00:00.000Z' });
const ACTIVE_STAFF = [
  ['director', 'Research Director'], ['researcher', 'Researcher'], ['analyst', 'Data Analyst'],
  ['editor', 'Editor'], ['associate', 'Research Associate']
];
const ACTIVE_IDS = ACTIVE_STAFF.map(([id]) => id);
const REMOVED_IDS = ['researcher-ii', 'researcher-female', 'analyst-ii', 'analyst-female', 'editor-ii', 'editor-female'];
const TASK_ID = 'ai-infrastructure-trends';
const TASK_TITLE = 'Analyze AI infrastructure market trends';
const PIPELINE = ['associate', 'researcher', 'analyst', 'editor', 'director'];
const freshTask = () => ({ id: TASK_ID, title: TASK_TITLE, assignedAgentId: null, status: 'IDLE',
  stage: 0, completedStages: 0, location: null, currentActivity: 'Ready for source collection',
  startedAt: null, completedAt: null });
const tagged = (type, agentId, fields = {}) => ({ type, agentId, taskId: TASK_ID, ...fields });
const begin = (agentId, fields = {}) => tagged('agent.started_task', agentId, { task: TASK_TITLE, progress: 0, ...fields });
const finish = (agentId, fields = {}) => tagged('agent.completed_task', agentId, fields);
function tickingStore() {
  let calls = 0;
  const store = State.createStore({ clock: () => new Date(Date.UTC(2026, 9, 7, 0, 0, ++calls)).toISOString() });
  return { store, calls: () => calls };
}
function assertSelectableStations(store, movement) {
  const positions = movement.getPositions();
  for (const [index, position] of positions.entries()) {
    for (const colleague of positions.slice(index + 1)) {
      if (member(store, position.id).location !== member(store, colleague.id).location) continue;
      // At the minimum map width, a colleague's 44px hitbox must not cover this sprite's center.
      assert.ok(Math.abs(position.x - colleague.x) * 700 / 960 > 22,
        position.id + ' and ' + colleague.id + ' remain individually selectable');
    }
  }
}

test('initial state has exactly five named professionals, required fields and selectable stations', () => {
  const store = create();
  const agents = store.getSnapshot().agents;
  assert.deepEqual(plain(agents.map(({ id, name }) => [id, name])), ACTIVE_STAFF);
  assert.equal(new Set(agents.map(agent => agent.id)).size, ACTIVE_IDS.length);
  for (const agent of agents) {
    for (const key of ['id', 'name', 'role', 'location', 'status', 'currentTask', 'progress', 'currentActivity', 'lastActivity', 'taskId']) assert.ok(Object.hasOwn(agent, key), key);
    assert.equal(agent.status, 'IDLE');
    assert.equal(agent.progress, 0);
    assert.equal(agent.currentTask, TASK_TITLE);
    assert.equal(agent.taskId, null);
    assert.ok(Object.hasOwn(State.ROOMS, agent.location));
  }
  assert.deepEqual(plain(store.getSnapshot().task), freshTask());
  const movement = Movement.createMovement(); movement.reset(agents);
  assertSelectableStations(store, movement);
});

test('the shared task definition fixes the five-stage order and cannot be edited', () => {
  assert.equal(State.TASK_DEFINITION.id, TASK_ID);
  assert.equal(State.TASK_DEFINITION.title, TASK_TITLE);
  assert.deepEqual(plain(State.TASK_DEFINITION.stages.map(stage => stage.agentId)), PIPELINE);
  assert.ok(Object.isFrozen(State.TASK_DEFINITION));
  assert.ok(Object.isFrozen(State.TASK_DEFINITION.stages));
  for (const stage of State.TASK_DEFINITION.stages) {
    assert.ok(Object.isFrozen(stage));
    assert.equal(typeof stage.label, 'string');
    assert.ok(stage.label.trim());
  }
});

test('removed staff cannot dispatch events or contaminate the activity feed', () => {
  const store = create();
  assert.equal(store.dispatch({ type: 'agent.progress', agentId: 'researcher', progress: 35 }), true);
  const before = plain(store.getSnapshot());
  let notifications = 0;
  store.subscribe(() => notifications++);
  const events = [
    { type: 'agent.started_task', task: 'Unexpected duplicate task', progress: 10 },
    { type: 'agent.changed_status', status: 'WORKING' },
    { type: 'agent.moved', location: 'research' },
    { type: 'agent.arrived', location: 'research' },
    { type: 'agent.progress', progress: 50 },
    { type: 'agent.completed_task' },
    { type: 'agent.error', activity: 'Unexpected duplicate activity' }
  ];
  for (const agentId of REMOVED_IDS) {
    for (const event of events) {
      assert.equal(store.dispatch({ ...event, agentId }), false, agentId + ': ' + event.type);
      assert.deepEqual(plain(store.getSnapshot()), before);
    }
  }
  assert.equal(notifications, 0);
  assert.equal(store.dispatch({ type: 'agent.progress', agentId: 'analyst', progress: 50 }), true);
  assert.equal(notifications, 1);
  const names = new Map(ACTIVE_STAFF);
  for (const event of store.getSnapshot().events) assert.equal(event.name, names.get(event.agentId));
});

test('invalid events never mutate state, sequence, logs or notifications', () => {
  const store = create();
  let notifications = 0;
  store.subscribe(() => notifications++);
  const before = plain(store.getSnapshot());
  const invalid = [null, undefined, {}, { type: 'unknown', agentId: 'researcher' },
    { type: 'agent.progress', agentId: 'unknown', progress: 1 },
    { type: 'agent.progress', agentId: 'researcher' },
    ...[-1, 101, NaN, Infinity, '30', null].map(progress => ({ type: 'agent.progress', agentId: 'researcher', progress })),
    { type: 'agent.started_task', agentId: 'researcher' },
    ...['', ' ', 'x'.repeat(241), null, 12].map(task => ({ type: 'agent.started_task', agentId: 'researcher', task })),
    { type: 'agent.changed_status', agentId: 'researcher' },
    { type: 'agent.changed_status', agentId: 'researcher', status: 'WALKING' },
    { type: 'agent.moved', agentId: 'researcher' },
    { type: 'agent.moved', agentId: 'researcher', location: 'unknown' },
    { type: 'agent.moved', agentId: 'researcher', location: '__proto__' },
    { type: 'agent.moved', agentId: 'researcher', location: ['hall'] },
    { type: 'agent.moved', agentId: 'researcher', location: new String('hall') },
    { type: 'agent.error', agentId: 'researcher', activity: ' ' },
    { type: 'agent.arrived', agentId: 'researcher', location: 'research' }];
  for (const event of invalid) {
    assert.equal(store.dispatch(event), false, String(event?.type));
    assert.deepEqual(plain(store.getSnapshot()), before);
  }
  assert.equal(notifications, 0);
});

test('invalid task tags, premature stages and duplicate completions never mutate or notify', () => {
  const ticking = tickingStore(); const { store } = ticking;
  let notifications = 0; store.subscribe(() => notifications++);
  function reject(events) {
    for (const event of events) {
      const before = plain(store.getSnapshot()), calls = ticking.calls(), count = notifications;
      assert.equal(store.dispatch(event), false, event.type + ': ' + event.agentId);
      assert.deepEqual(plain(store.getSnapshot()), before);
      assert.equal(ticking.calls(), calls, 'invalid events do not consume a timestamp');
      assert.equal(notifications, count);
    }
  }
  reject([
    ...[undefined, null, false, 1, {}, [], new String(TASK_ID), '', 'unknown-task'].map(taskId => begin('associate', { taskId })),
    begin('associate', { task: 'A different task title' }),
    begin('associate', { task: new String(TASK_TITLE) }),
    ...PIPELINE.slice(1).map(agentId => begin(agentId)),
    tagged('agent.progress', 'associate', { progress: 10 }),
    tagged('agent.changed_status', 'associate', { status: 'WORKING' }),
    finish('associate')
  ]);
  assert.equal(store.dispatch(begin('associate')), true);
  reject([
    begin('associate'), begin('researcher'),
    { type: 'agent.started_task', agentId: 'associate', task: 'Independent source request' },
    ...PIPELINE.slice(1).flatMap(agentId => [
      tagged('agent.progress', agentId, { progress: 50 }),
      tagged('agent.changed_status', agentId, { status: 'THINKING' }), finish(agentId)
    ]),
    tagged('agent.progress', 'associate', { taskId: new String(TASK_ID), progress: 50 }),
    tagged('agent.progress', 'associate', { taskId: 'unknown-task', progress: 50 })
  ]);
  assert.equal(store.dispatch(tagged('agent.changed_status', 'associate', { status: 'ERROR' })), true);
  assert.equal(store.getSnapshot().task.status, 'WORKING', 'local errors do not complete or replace the team task');
  reject([{ type: 'agent.started_task', agentId: 'associate', task: 'Replacement after local error' }]);
  assert.equal(store.dispatch(finish('associate')), true);
  reject([finish('associate'), begin('associate'), begin('analyst'),
    tagged('agent.progress', 'associate', { progress: 75 }),
    tagged('agent.changed_status', 'associate', { status: 'WORKING' })]);
  assert.equal(store.dispatch(begin('researcher')), true);
  assert.equal(store.getSnapshot().task.stage, 2);
  assert.equal(store.getSnapshot().task.completedStages, 1);
});

test('untagged adapter events remain local and clear a new local task association', () => {
  const store = create();
  assert.equal(store.dispatch({ type: 'agent.started_task', agentId: 'associate', task: 'Independent task before pipeline work' }), true);
  assert.deepEqual(plain(store.getSnapshot().task), freshTask());
  assert.equal(store.dispatch(begin('associate', { location: 'library', activity: 'Collecting source records' })), true);
  const task = plain(store.getSnapshot().task);
  const events = [
    { type: 'agent.started_task', agentId: 'researcher', task: 'Independent adapter draft' },
    { type: 'agent.progress', agentId: 'associate', progress: 50 },
    { type: 'agent.changed_status', agentId: 'associate', status: 'THINKING' },
    { type: 'agent.completed_task', agentId: 'associate' },
    { type: 'agent.error', agentId: 'analyst' }
  ];
  for (const event of events) {
    assert.equal(store.dispatch(event), true);
    assert.deepEqual(plain(store.getSnapshot().task), task);
  }
  assert.equal(member(store, 'researcher').taskId, null);
  // An adapter completion is local; the tagged completion is still required for the handoff.
  assert.equal(store.getSnapshot().task.completedStages, 0);
  assert.equal(store.dispatch(finish('associate')), true);
  const handoff = plain(store.getSnapshot().task);
  assert.equal(store.dispatch({ type: 'agent.started_task', agentId: 'associate', task: 'Independent source request' }), true);
  assert.equal(member(store, 'associate').taskId, null);
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'associate', location: 'library' }), true);
  assert.deepEqual(plain(store.getSnapshot().task), handoff, 'a cleared task link cannot redirect the shared task');
});

test('arrivals confirm owner location without replacing activity or a newer handoff', () => {
  const { store } = tickingStore();
  assert.equal(store.dispatch(begin('associate', { location: 'library', activity: 'Collecting source records' })), true);
  assert.equal(store.getSnapshot().task.location, 'hall');
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'associate', location: 'library' }), true);
  assert.equal(store.getSnapshot().task.location, 'library');
  assert.equal(store.getSnapshot().task.currentActivity, 'Collecting source records');
  assert.equal(member(store, 'associate').currentActivity, 'Collecting source records');
  assert.equal(member(store, 'associate').lastActivityText, 'Arrived at Library');
  assert.equal(store.getSnapshot().events[0].activity, 'Arrived at Library');
  assert.equal(store.dispatch(finish('associate', { location: 'research', activity: 'Source pack ready' })), true);
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'associate', location: 'research' }), true);
  assert.equal(store.getSnapshot().task.location, 'research');
  assert.equal(store.getSnapshot().task.currentActivity, 'Source pack ready');
  assert.equal(store.dispatch({ type: 'agent.moved', agentId: 'associate', location: 'hall' }), true);
  assert.equal(store.dispatch(begin('researcher', { location: 'research', activity: 'Analyzing the source evidence' })), true);
  const nextStage = plain(store.getSnapshot().task);
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'associate', location: 'hall' }), true);
  assert.deepEqual(plain(store.getSnapshot().task), nextStage, 'late prior-owner arrival cannot overwrite the current stage');
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'researcher', location: 'research' }), true);
  assert.equal(store.getSnapshot().task.location, 'research');
  assert.equal(store.getSnapshot().task.currentActivity, 'Analyzing the source evidence');
  assert.equal(store.dispatch(finish('researcher')), true);
  for (const agentId of ['analyst', 'editor']) {
    assert.equal(store.dispatch(begin(agentId)), true);
    assert.equal(store.dispatch(finish(agentId)), true);
  }
  assert.equal(store.dispatch(begin('director', { location: 'data', activity: 'Reviewing the final evidence' })), true);
  assert.equal(store.dispatch(finish('director', { activity: 'Final review complete' })), true);
  const completed = plain(store.getSnapshot().task);
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'director', location: 'data' }), true);
  assert.deepEqual(plain(store.getSnapshot().task), { ...completed, location: 'data' });
  assert.equal(member(store, 'director').currentActivity, 'Final review complete');
});

test('all required event types have defined behavior', () => {
  const store = create();
  assert.equal(store.dispatch({ type: 'agent.started_task', agentId: 'researcher', task: '  New draft  ', location: 'research', progress: 0 }), true);
  assert.equal(member(store).status, 'WORKING');
  assert.equal(member(store).currentTask, 'New draft');
  assert.equal(member(store).progress, 0);
  assert.equal(member(store).location, 'library');
  assert.equal(member(store).destination, 'research');
  assert.equal(store.dispatch({ type: 'agent.changed_status', agentId: 'researcher', status: 'THINKING', progress: 20 }), true);
  assert.equal(member(store).status, 'THINKING');
  assert.equal(member(store).progress, 20, 'adapter status events honor explicitly supplied progress');
  assert.equal(store.dispatch({ type: 'agent.changed_status', agentId: 'researcher', status: 'REVIEWING' }), true);
  assert.equal(member(store).progress, 20, 'status events without progress preserve the current value');
  assert.equal(store.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'data' }), true);
  assert.equal(member(store).location, 'library');
  assert.equal(member(store).destination, 'data');
  assert.equal(store.dispatch({ type: 'agent.completed_task', agentId: 'researcher' }), true);
  assert.equal(member(store).status, 'COMPLETED');
  assert.equal(member(store).progress, 100);
  assert.equal(store.dispatch({ type: 'agent.error', agentId: 'researcher' }), true);
  assert.equal(member(store).status, 'ERROR');
});

test('every allowed status is accepted; stale arrival is rejected without mutation', () => {
  const store = create();
  for (const status of State.STATUSES) assert.equal(store.dispatch({ type: 'agent.changed_status', agentId: 'researcher', status }), true);
  store.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'research' });
  store.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'data' });
  const before = plain(store.getSnapshot());
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'researcher', location: 'research' }), false);
  assert.deepEqual(plain(store.getSnapshot()), before);
  assert.equal(store.dispatch({ type: 'agent.arrived', agentId: 'researcher', location: 'data' }), true);
  assert.equal(member(store).location, 'data');
  assert.equal(member(store).destination, null);
});

test('snapshots and subscriber snapshots cannot mutate store state', () => {
  const store = create();
  store.dispatch({ type: 'agent.progress', agentId: 'researcher', progress: 30 });
  assert.equal(store.dispatch(begin('associate')), true);
  const before = plain(store.getSnapshot());
  const snap = store.getSnapshot();
  snap.agents[0].name = 'corrupted'; snap.agents.push({}); snap.events[0].activity = 'corrupted'; snap.events.length = 0; snap.sequence = -1;
  snap.task.title = 'corrupted'; snap.task.assignedAgentId = 'director'; snap.task.completedStages = 5; snap.task.status = 'COMPLETED';
  assert.deepEqual(plain(store.getSnapshot()), before);
  store.subscribe(next => {
    next.agents[0].progress = -10; next.events[0].name = 'corrupted';
    next.task.status = 'COMPLETED'; next.task.currentActivity = 'corrupted';
  });
  store.dispatch({ type: 'agent.progress', agentId: 'researcher', progress: 31 });
  assert.equal(member(store, 'director').progress, 0);
  assert.notEqual(store.getSnapshot().events[0].name, 'corrupted');
  assert.deepEqual(plain(store.getSnapshot().task), before.task);
});

test('event log is bounded, ordered and resettable; unsubscribe works', () => {
  const store = create();
  let count = 0;
  const unsubscribe = store.subscribe(() => count++);
  for (let i = 0; i < 50; i++) store.dispatch({ type: 'agent.progress', agentId: 'researcher', progress: i });
  const snap = store.getSnapshot();
  assert.equal(snap.sequence, 50); assert.equal(snap.events.length, 12); assert.equal(count, 50);
  assert.deepEqual(plain(snap.events.map(event => event.id)), Array.from({ length: 12 }, (_, i) => 50 - i));
  unsubscribe(); store.reset();
  assert.equal(count, 50); assert.equal(store.getSnapshot().sequence, 0); assert.equal(store.getSnapshot().events.length, 0);
  assert.equal(member(store).progress, 0);
});

test('movement advances by elapsed time and emits one arrival with confirmed location semantics', () => {
  const store = create(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  store.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'research' }); movement.sync(store.getSnapshot().agents);
  const before = plain(movement.getPositions());
  assert.deepEqual(plain(movement.advance(-1)), []); assert.deepEqual(plain(movement.advance(NaN)), []);
  assert.deepEqual(plain(movement.getPositions()), before);
  const first = movement.advance(1); assert.equal(first.length, 0); assert.equal(member(store).location, 'library');
  const position = movement.getPositions().find(agent => agent.id === 'researcher'); assert.equal(position.x, 220); assert.equal(position.y, 280);
  const arrivals = movement.advance(100); assert.deepEqual(plain(arrivals), [{ type: 'agent.arrived', agentId: 'researcher', location: 'research' }]);
  assert.equal(member(store).location, 'library');
  arrivals.forEach(store.dispatch); assert.equal(member(store).location, 'research'); assert.equal(member(store).destination, null);
  assert.equal(movement.isMoving(), false); assert.equal(movement.advance(100).length, 0);
  const end = movement.getPositions().find(agent => agent.id === 'researcher'); assert.equal(end.x, 474); assert.equal(end.y, 208);
  end.x = -1; assert.equal(movement.getPositions().find(agent => agent.id === 'researcher').x, 474);
});

test('interrupted route emits only newest destination and keeps finite positions', () => {
  const store = create(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  store.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'research' }); movement.sync(store.getSnapshot().agents); movement.advance(1);
  store.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'data' }); movement.sync(store.getSnapshot().agents);
  const arrivals = [];
  for (let i = 0; i < 2000 && movement.isMoving(); i++) {
    arrivals.push(...movement.advance(.01));
    for (const position of movement.getPositions()) assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y));
  }
  assert.deepEqual(plain(arrivals), [{ type: 'agent.arrived', agentId: 'researcher', location: 'data' }]);
  arrivals.forEach(store.dispatch); assert.equal(member(store).location, 'data');
  const end = movement.getPositions().find(agent => agent.id === 'researcher'); assert.equal(end.x, 720); assert.equal(end.y, 208);
});

test('instant settling works for every agent and every room', () => {
  const store = create(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  for (const id of store.getSnapshot().agents.map(agent => agent.id)) {
    for (const location of Object.keys(State.ROOMS)) {
      assert.equal(store.dispatch({ type: 'agent.moved', agentId: id, location }), true);
      movement.sync(store.getSnapshot().agents);
      const arrivals = movement.advance(0, true); assert.equal(arrivals.length, 1); assert.equal(arrivals[0].agentId, id); assert.equal(arrivals[0].location, location);
      arrivals.forEach(store.dispatch); assert.equal(member(store, id).location, location); assert.equal(movement.isMoving(), false);
    }
  }
});

test('mock source repeats deterministically, sends copies and resets cursor', () => {
  const seen = []; const source = Mock.createSource(event => { seen.push(plain(event)); event.task = 'mutated by consumer'; return true; });
  for (let i = 0; i < Mock.SCRIPT.length * 2; i++) assert.equal(source.next(), true);
  assert.deepEqual(seen.slice(0, Mock.SCRIPT.length), plain(Mock.SCRIPT));
  assert.deepEqual(seen.slice(Mock.SCRIPT.length), plain(Mock.SCRIPT)); assert.equal(source.getCursor(), 0);
  source.next(); assert.equal(source.getCursor(), 1); source.reset(); assert.equal(source.getCursor(), 0); source.next(); assert.deepEqual(seen.at(-1), plain(Mock.SCRIPT[0]));
});

test('two complete mock cycles dispatch and arrive successfully without invalid state', () => {
  const store = create(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  const source = Mock.createSource(event => {
    assert.equal(store.dispatch(event), true); movement.sync(store.getSnapshot().agents);
    movement.advance(0, true).forEach(arrival => assert.equal(store.dispatch(arrival), true)); return true;
  });
  for (let i = 0; i < Mock.SCRIPT.length * 2; i++) {
    source.next();
    for (const agent of store.getSnapshot().agents) {
      assert.ok(agent.progress >= 0 && agent.progress <= 100); assert.ok(State.STATUSES.includes(agent.status)); assert.equal(agent.destination, null);
    }
    assertSelectableStations(store, movement);
  }
  assert.equal(source.getCursor(), 0); assert.equal(store.getSnapshot().events.length, 12);
});

test('the default workflow completes one shared task only after five ordered stages', () => {
  const { store } = tickingStore(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  const started = []; const cleaned = new Set(); let completions = 0, startedAt = null, completedTask = null;
  for (const event of Mock.SCRIPT) {
    assert.ok(ACTIVE_IDS.includes(event.agentId), 'mock events reference only active professionals');
    const before = plain(store.getSnapshot().task);
    assert.equal(store.dispatch(event), true);
    let snapshot = store.getSnapshot();
    if (Object.hasOwn(event, 'taskId')) {
      assert.equal(event.taskId, TASK_ID);
      assert.equal(snapshot.task.assignedAgentId, event.agentId);
      assert.equal(member(store, event.agentId).taskId, TASK_ID);
      assert.equal(member(store, event.agentId).currentTask, TASK_TITLE);
      assert.equal(snapshot.task.currentActivity, member(store, event.agentId).currentActivity);
      if (Object.hasOwn(event, 'progress')) assert.equal(member(store, event.agentId).progress, event.progress);
      if (event.type === 'agent.started_task') {
        started.push(event.agentId);
        assert.equal(snapshot.task.stage, started.length);
        assert.equal(snapshot.task.completedStages, started.length - 1);
        if (startedAt === null) startedAt = snapshot.task.startedAt;
        assert.equal(snapshot.task.startedAt, startedAt, 'handoffs retain the original task start');
      }
      if (event.type === 'agent.completed_task') completions++;
      assert.equal(snapshot.task.completedStages, completions);
      assert.equal(snapshot.task.status, completions === 5 ? 'COMPLETED' : 'WORKING');
      if (completions < 5) assert.equal(snapshot.task.completedAt, null);
      else {
        assert.equal(event.agentId, 'director');
        assert.equal(snapshot.task.completedAt, member(store, 'director').lastActivity);
        assert.ok(Date.parse(snapshot.task.completedAt) > Date.parse(startedAt));
        completedTask = plain(snapshot.task);
      }
    } else {
      assert.equal(event.type, 'agent.changed_status');
      assert.equal(event.status, 'IDLE');
      cleaned.add(event.agentId);
      assert.deepEqual(plain(snapshot.task), before, 'idle cleanup preserves the completed team task');
    }
    const activity = snapshot.task.currentActivity;
    movement.sync(store.getSnapshot().agents);
    movement.advance(0, true).forEach(arrival => assert.equal(store.dispatch(arrival), true));
    snapshot = store.getSnapshot();
    assert.equal(snapshot.task.currentActivity, activity, 'arrival history does not replace meaningful task activity');
    assert.equal(snapshot.task.location, member(store, snapshot.task.assignedAgentId).location);
    for (const entry of snapshot.events) assert.ok(ACTIVE_IDS.includes(entry.agentId));
  }
  assert.deepEqual(started, PIPELINE);
  assert.deepEqual([...cleaned].sort(), [...ACTIVE_IDS].sort());
  assert.deepEqual(plain(store.getSnapshot().task), completedTask);
  assert.ok(store.getSnapshot().agents.every(agent => agent.status === 'IDLE'));
});

test('completed cycles restart the task record and reset restores a fresh idle pipeline', () => {
  const { store } = tickingStore(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  const source = Mock.createSource(event => {
    assert.equal(store.dispatch(event), true); movement.sync(store.getSnapshot().agents);
    movement.advance(0, true).forEach(arrival => assert.equal(store.dispatch(arrival), true)); return true;
  });
  for (let index = 0; index < Mock.SCRIPT.length; index++) assert.equal(source.next(), true);
  const completed = plain(store.getSnapshot().task);
  assert.equal(completed.status, 'COMPLETED');
  assert.equal(completed.completedStages, 5);
  assert.equal(source.getCursor(), 0);
  assert.equal(source.next(), true);
  let task = store.getSnapshot().task;
  assert.equal(task.status, 'WORKING'); assert.equal(task.assignedAgentId, 'associate');
  assert.equal(task.stage, 1); assert.equal(task.completedStages, 0); assert.equal(task.completedAt, null);
  assert.ok(Date.parse(task.startedAt) > Date.parse(completed.completedAt));
  assert.equal(member(store, 'associate').currentTask, TASK_TITLE);
  store.reset(); source.reset(); movement.reset(store.getSnapshot().agents);
  assert.deepEqual(plain(store.getSnapshot().task), freshTask());
  assert.equal(store.getSnapshot().events.length, 0); assert.equal(store.getSnapshot().sequence, 0);
  assert.ok(store.getSnapshot().agents.every(agent => agent.status === 'IDLE' && agent.progress === 0 && agent.taskId === null));
  assert.equal(source.next(), true);
  task = store.getSnapshot().task;
  assert.equal(task.stage, 1); assert.equal(task.assignedAgentId, 'associate'); assert.equal(task.status, 'WORKING');
});

test('arrival notification sync does not requeue other agents already arrived in the same frame', () => {
  const store = create(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  store.subscribe(snapshot => movement.sync(snapshot.agents));
  store.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'hall' });
  store.dispatch({ type: 'agent.moved', agentId: 'analyst', location: 'hall' });
  const arrivals = movement.advance(0, true); assert.equal(arrivals.length, 2); arrivals.forEach(store.dispatch);
  assert.equal(member(store, 'researcher').destination, null); assert.equal(member(store, 'analyst').destination, null);
  assert.equal(movement.isMoving(), false);
});
test('all room-pair routes use the architectural doorways and avoid partition walls', () => {
  const doors = [[212, 228], [466, 482], [750, 766]];
  const inDoor = x => doors.some(([minimum, maximum]) => x >= minimum && x <= maximum);
  function assertWalkable(position, label) {
    const { x, y } = position;
    assert.ok(x >= 76 && x <= 884 && y >= 86 && y <= 500, label + ': exterior wall');
    if (y >= 254 && y <= 274) assert.ok(inDoor(x), label + ': north room partition outside a doorway');
    if (y >= 86 && y < 274) {
      assert.ok(!(x >= 324 && x <= 340) && !(x >= 608 && x <= 624), label + ': north vertical partition');
    }
    if (y >= 358 && y <= 374) assert.ok((x >= 212 && x <= 228) || (x >= 340 && x <= 608) || (x >= 750 && x <= 766), label + ': south room partition outside a doorway');
    if (y > 374 && y <= 500) assert.ok(!(x >= 324 && x <= 340) && !(x >= 608 && x <= 624), label + ': south vertical partition');
  }
  for (const id of State.INITIAL_AGENTS.map(agent => agent.id)) {
    for (const from of Object.keys(State.ROOMS)) {
      for (const destination of Object.keys(State.ROOMS)) {
        const movement = Movement.createMovement(); const agent = { id, location: from, destination };
        movement.reset([{ id, location: from }]); movement.sync([agent]);
        const label = id + ': ' + from + ' to ' + destination;
        for (let tick = 0; tick < 2000 && movement.isMoving(); tick++) {
          movement.advance(.02); assertWalkable(movement.getPositions()[0], label);
        }
        assert.equal(movement.isMoving(), false, label + ': arrival');
      }
    }
  }
});

test('redirecting at room exit, corridor and room entry keeps routes inside door boundaries', () => {
  function safe({ x, y }) {
    if (y >= 254 && y <= 274) assert.ok([[212, 228], [466, 482], [750, 766]].some(([a, b]) => x >= a && x <= b));
    if (y >= 358 && y <= 374) assert.ok((x >= 212 && x <= 228) || (x >= 340 && x <= 608) || (x >= 750 && x <= 766));
    if (y < 274 || y > 374) assert.ok(!(x >= 324 && x <= 340) && !(x >= 608 && x <= 624));
  }
  for (const seconds of [.3, 1, 1.6, 3, 4.5, 5]) {
    const movement = Movement.createMovement(); const agent = { id: 'researcher', location: 'library', destination: 'data' };
    movement.reset([agent]); movement.sync([agent]); movement.advance(seconds);
    agent.destination = 'director'; movement.sync([agent]);
    const arrivals = [];
    for (let i = 0; i < 2000 && movement.isMoving(); i++) { arrivals.push(...movement.advance(.02)); safe(movement.getPositions()[0]); }
    assert.deepEqual(plain(arrivals), [{ type: 'agent.arrived', agentId: 'researcher', location: 'director' }]);
  }
});
