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

test('initial state has eleven distinct staff, required fields and selectable stations', () => {
  const store = create();
  const agents = store.getSnapshot().agents;
  assert.equal(agents.length, 11);
  assert.equal(new Set(agents.map(agent => agent.id)).size, 11);
  assert.deepEqual(plain(agents.map(agent => agent.id)), ['director', 'researcher', 'researcher-ii', 'researcher-female', 'analyst', 'analyst-ii', 'analyst-female', 'editor', 'editor-ii', 'editor-female', 'associate']);
  for (const agent of agents) {
    for (const key of ['id', 'name', 'role', 'location', 'status', 'currentTask', 'progress', 'lastActivity']) assert.ok(Object.hasOwn(agent, key), key);
    assert.ok(State.STATUSES.includes(agent.status));
    assert.ok(Object.hasOwn(State.ROOMS, agent.location));
  }
  const movement = Movement.createMovement(); movement.reset(agents);
  assertSelectableStations(store, movement);
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

test('all required event types have defined behavior', () => {
  const store = create();
  assert.equal(store.dispatch({ type: 'agent.started_task', agentId: 'researcher', task: '  New draft  ', location: 'research', progress: 0 }), true);
  assert.equal(member(store).status, 'WORKING');
  assert.equal(member(store).currentTask, 'New draft');
  assert.equal(member(store).progress, 0);
  assert.equal(member(store).location, 'library');
  assert.equal(member(store).destination, 'research');
  assert.equal(store.dispatch({ type: 'agent.changed_status', agentId: 'researcher', status: 'THINKING' }), true);
  assert.equal(member(store).status, 'THINKING');
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
  const before = plain(store.getSnapshot());
  const snap = store.getSnapshot();
  snap.agents[0].name = 'corrupted'; snap.agents.push({}); snap.events[0].activity = 'corrupted'; snap.events.length = 0; snap.sequence = -1;
  assert.deepEqual(plain(store.getSnapshot()), before);
  store.subscribe(next => { next.agents[0].progress = -10; next.events[0].name = 'corrupted'; });
  store.dispatch({ type: 'agent.progress', agentId: 'researcher', progress: 31 });
  assert.equal(member(store, 'director').progress, 18);
  assert.notEqual(store.getSnapshot().events[0].name, 'corrupted');
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
  assert.equal(member(store).progress, 34);
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

test('mock workflow includes every professional and coherent department handoffs', () => {
  const store = create(); const movement = Movement.createMovement(); movement.reset(store.getSnapshot().agents);
  const itineraries = new Map(store.getSnapshot().agents.map(agent => [agent.id, [agent.location]]));
  const started = new Set();
  for (const event of Mock.SCRIPT) {
    assert.equal(store.dispatch(event), true);
    if (event.type === 'agent.started_task') started.add(event.agentId);
    movement.sync(store.getSnapshot().agents);
    movement.advance(0, true).forEach(arrival => assert.equal(store.dispatch(arrival), true));
    for (const agent of store.getSnapshot().agents) {
      const rooms = itineraries.get(agent.id);
      if (rooms.at(-1) !== agent.location) rooms.push(agent.location);
    }
  }
  assert.deepEqual([...started].sort(), plain(State.INITIAL_AGENTS.map(agent => agent.id)).sort());
  const handoffs = {
    researcher: ['research', 'library', 'research'],
    analyst: ['data', 'research', 'data'],
    editor: ['editor', 'research', 'editor'],
    director: ['director', 'hall', 'research', 'data', 'director'],
    associate: ['research', 'library', 'hall']
  };
  for (const [id, expected] of Object.entries(handoffs)) {
    let next = 0;
    for (const room of itineraries.get(id)) if (room === expected[next]) next++;
    assert.equal(next, expected.length, id + ' participates in the department workflow');
  }
  for (const [id, home] of [['researcher-female', 'library'], ['analyst-female', 'data'], ['editor-female', 'editor']]) {
    assert.deepEqual(itineraries.get(id), [home]);
    assert.equal(member(store, id).status, 'COMPLETED');
  }
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
