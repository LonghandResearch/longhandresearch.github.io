import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function controller(options = {}) {
  class Element {
    constructor(tag = 'div', namespaceURI = null) {
      this.tag = tag; this.namespaceURI = namespaceURI;
      this.style = {}; this.dataset = {}; this.attributes = {};
      this.children = []; this.handlers = new Map();
      this.classList = { add() {} };
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    querySelector(tag) { return this.children.find(child => child.tag === tag) || null; }
    addEventListener(type, callback) {
      if (!this.handlers.has(type)) this.handlers.set(type, []);
      this.handlers.get(type).push(callback);
    }
    emit(type, event) { for (const callback of this.handlers.get(type) || []) callback(event); }
  }
  const elements = new Map();
  const html = fs.readFileSync(path.join(root, 'world/index.html'), 'utf8');
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id, new Element());
  const document = new Element();
  Object.assign(document, {
    hidden: false, body: new Element('body'),
    getElementById: id => elements.get(id),
    createElement: tag => new Element(tag),
    createElementNS: (namespace, tag) => new Element(tag, namespace)
  });
  const motion = new Element(); motion.matches = !!options.reduced;
  const frames = new Map(), timers = new Map();
  let handle = 0, now = 0;
  const context = vm.createContext({
    document, console, Intl, Date, URL,
    location: { href: options.url || 'http://localhost/world/index.html' },
    history: { replaceState(unused, title, url) { context.location.href = String(url); } },
    crypto: { randomUUID: () => 'controller-test-project' },
    matchMedia: () => motion,
    performance: { now: () => now },
    requestAnimationFrame(callback) { const id = ++handle; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback, delay) { const id = ++handle; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener() {}
  });
  context.window = context;
  if (options.records) {
    context.Longhand = { isLocal: true, researchRecords: options.records };
    vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/research-projects.js'), 'utf8'), context);
  }
  for (const file of ['state.js', 'movement.js', 'mock-events.js', 'sprites.js', 'world.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'world', file), 'utf8'), context, { filename: file });
  }
  return {
    world: context.LonghandWorld, frames, timers, elements, document, context,
    click: id => elements.get(id).emit('click'),
    tick(milliseconds = 60) {
      now += milliseconds;
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback(now);
    }
  };
}

function projectStorage() {
  const rows = new Map();
  const copy = value => value && JSON.parse(JSON.stringify(value));
  return { rows, all: async () => [...rows.values()].map(copy), get: async id => copy(rows.get(id)),
    change: async (id, transform) => { const next = transform(copy(rows.get(id))); rows.set(id, copy(next)); return copy(next); } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('saved World progress restores the same brief, outputs and completion times while paused', async () => {
  const records = projectStorage(), app = controller({ records, reduced: true });
  const brief = { topic: 'Persisted question', question: 'What evidence is required?', objective: 'Prepare a source plan.' };
  submitBrief(app, brief); await flush();
  for (let step = 2; step <= 13; step++) app.click('next');
  await flush();
  const saved = [...records.rows.values()][0];
  assert.equal(saved.run.times.length, 13); assert.equal(saved.outputs.length, 3);
  const repository = app.context.Longhand.Research.createRepository(records);
  const revised = await repository.save({ ...saved, brief: { ...saved.brief, topic: 'Different question' } }, saved.revision);
  assert.equal(revised.run.times.length, 0); assert.equal(revised.outputs.length, 0); assert.equal(revised.draftBody, '');
  records.rows.set(saved.id, saved);
  const restored = controller({ records, url: app.context.location.href }); await flush();
  assert.equal(restored.world.getSnapshot().task.title, brief.topic);
  assert.equal(JSON.stringify(restored.world.getSnapshot().outputs), JSON.stringify(saved.outputs));
  assert.equal(restored.timers.size, 0); assert.equal(restored.frames.size, 0);
  assert.match(restored.elements.get('project-save-status').textContent, /restored.*13\/29/);
  for (let step = 14; step <= 29; step++) restored.click('next');
  await flush();
  const completed = [...records.rows.values()][0];
  assert.equal(completed.run.times.length, 29); assert.equal(completed.outputs.length, 5);
  assert.equal(completed.status, 'DRAFT', 'simulated Director review never approves research');
  const final = controller({ records, url: app.context.location.href }); await flush();
  assert.equal(final.world.getSnapshot().task.completedAt, completed.outputs.at(-1).completedAt);
  assert.equal(final.elements.get('next').disabled, true);
  assert.ok(final.world.getSnapshot().agents.every(agent => agent.status === 'IDLE'));
  final.click('reset'); await flush();
  assert.equal([...records.rows.values()][0].run.times.length, 0);
  assert.equal([...records.rows.values()][0].outputs.length, 0);
});

test('failed progress save pauses the run and retry keeps unsaved work intact', async () => {
  const records = projectStorage(), app = controller({ records, reduced: true });
  submitBrief(app, { topic: 'Storage recovery', question: 'Can it retry?', objective: 'Keep unsaved progress.' }); await flush();
  const change = records.change; records.change = async () => { throw new Error('Quota exceeded'); };
  app.click('next'); await flush();
  assert.match(app.elements.get('project-save-status').textContent, /Not saved.*Quota exceeded/);
  assert.equal(app.timers.size, 0); assert.equal(app.elements.get('project-retry').hidden, false);
  records.change = change; app.click('project-retry'); await flush();
  assert.equal([...records.rows.values()][0].run.times.length, 2);
  assert.equal(app.elements.get('project-retry').hidden, true);
});

test('missing saved project reports the failure without creating a phantom record', async () => {
  const records = projectStorage();
  const app = controller({ records, url: 'http://localhost/world/index.html?project=missing-project' }); await flush();
  assert.match(app.elements.get('project-save-status').textContent, /not found/);
  assert.equal(records.rows.size, 0); assert.equal(app.world.getSnapshot().agents.length, 5);
  assert.equal(app.timers.size, 0);
});

function moveTogether(app) {
  assert.equal(app.world.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'hall' }), true);
  assert.equal(app.world.dispatch({ type: 'agent.moved', agentId: 'analyst', location: 'hall' }), true);
}

function submitBrief(app, brief) {
  for (const key of ['topic', 'question', 'objective']) app.elements.get('brief-' + key).value = brief[key];
  let prevented = false;
  app.elements.get('research-brief').emit('submit', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
}

test('invalid brief leaves the example task, timers and movement untouched', () => {
  const app = controller();
  const before = JSON.stringify(app.world.getSnapshot());
  const timers = [...app.timers.keys()], frames = [...app.frames.keys()];
  submitBrief(app, { topic: ' ', question: 'A question', objective: 'An objective' });
  assert.equal(JSON.stringify(app.world.getSnapshot()), before);
  assert.deepEqual([...app.timers.keys()], timers);
  assert.deepEqual([...app.frames.keys()], frames);
  assert.match(app.elements.get('brief-feedback').textContent, /Enter a topic/);
  assert.equal(app.elements.get('research-draft').hidden, true);
});

test('submitted brief reveals outputs by stage and a safe draft only after final review', () => {
  const app = controller({ reduced: true });
  const brief = { topic: 'Grid capacity <script>example</script>', question: 'Which evidence supports the case?', objective: 'Prepare a source plan & validation outline.' };
  submitBrief(app, brief);
  assert.equal(app.elements.get('agent-name').textContent, 'Research Associate');
  assert.equal(app.elements.get('agent-task').textContent, brief.topic);
  assert.equal(app.elements.get('brief-submit').disabled, true);
  assert.equal(app.world.getSnapshot().task.stage, 1);
  assert.equal(app.world.getSnapshot().outputs.length, 0);
  assert.equal(app.elements.get('research-draft').hidden, true);
  const active = JSON.stringify(app.world.getSnapshot());
  submitBrief(app, { topic: 'Replacement', question: 'Another question', objective: 'Another objective' });
  assert.equal(JSON.stringify(app.world.getSnapshot()), active, 'a locked active brief cannot be replaced');
  for (let step = 2; step <= 24; step++) {
    app.click('next');
    const snapshot = app.world.getSnapshot();
    assert.equal(app.elements.get('research-draft').hidden, step < 24);
    assert.equal(snapshot.outputs.length, snapshot.task.completedStages);
    const rows = app.elements.get('stage-outputs').children;
    assert.equal(rows.length, 5);
    for (const output of snapshot.outputs) {
      const row = rows.find(row => row.dataset.agent === output.agentId);
      assert.match(row.children[0].textContent, /Complete/);
      assert.equal(row.children[2].textContent, output.body);
    }
  }
  const draft = app.elements.get('draft-document').children;
  assert.equal(draft[0].tag, 'h3');
  assert.equal(draft[0].textContent, brief.topic, 'user HTML remains plain text');
  assert.ok(draft.some(node => node.textContent === brief.question));
  assert.ok(draft.some(node => node.textContent === brief.objective));
  assert.match(draft[1].textContent, /No sources were fetched/);
  assert.equal(draft.filter(node => node.tag === 'h4').length, 7);
  assert.equal(app.elements.get('brief-submit').disabled, false);
  for (let step = 25; step <= 29; step++) app.click('next');
  assert.ok(app.world.getSnapshot().agents.every(agent => agent.status === 'IDLE' && agent.destination === null));
  assert.equal(app.world.getSnapshot().task.status, 'COMPLETED');
  assert.equal(app.timers.size, 0); assert.equal(app.frames.size, 0);
  assert.equal(app.elements.get('next').disabled, true);
  assert.equal(app.elements.get('pause').disabled, true);
  const completed = JSON.stringify(app.world.getSnapshot());
  app.click('next');
  assert.equal(JSON.stringify(app.world.getSnapshot()), completed, 'a finished user run does not repeat');
  app.elements.get('research-draft').open = true;
  app.click('reset');
  assert.equal(app.world.getSnapshot().task.title, brief.topic);
  assert.equal(app.world.getSnapshot().task.question, brief.question);
  assert.equal(app.world.getSnapshot().outputs.length, 0);
  assert.equal(app.elements.get('research-draft').hidden, true);
  assert.equal(app.elements.get('research-draft').open, false);
  assert.equal(app.elements.get('next').disabled, false);
  app.click('next');
  assert.equal(app.world.getSnapshot().task.stage, 1);
});

test('automatic user run stops after cleanup and a new brief clears its old result', () => {
  const app = controller();
  app.click('next');
  const oldFrames = [...app.frames.keys()], oldTimers = [...app.timers.keys()];
  const brief = { topic: 'Research facilities', question: 'What must be checked?', objective: 'Prepare a planning record.' };
  submitBrief(app, brief);
  assert.ok(oldFrames.every(id => !app.frames.has(id)));
  assert.ok(oldTimers.every(id => !app.timers.has(id)));
  assert.equal(app.frames.size, 1); assert.equal(app.timers.size, 1);
  for (let step = 2; step <= 29; step++) {
    const [id, timer] = [...app.timers.entries()][0];
    app.timers.delete(id); timer.callback();
  }
  assert.equal(app.world.getSnapshot().task.status, 'COMPLETED');
  assert.equal(app.world.getSnapshot().outputs.length, 5);
  assert.equal(app.timers.size, 0); assert.equal(app.frames.size, 0);
  assert.ok(app.world.getSnapshot().agents.every(agent => agent.destination === null));
  assert.equal(app.elements.get('simulation-status').textContent, 'Research workflow complete');
  submitBrief(app, { ...brief, topic: 'Another research topic' });
  const restarted = app.world.getSnapshot();
  assert.equal(restarted.task.title, 'Another research topic');
  assert.equal(restarted.task.stage, 1); assert.equal(restarted.task.completedAt, null);
  assert.equal(restarted.outputs.length, 0);
  assert.equal(app.elements.get('research-draft').hidden, true);
  assert.equal(app.timers.size, 1);
});

test('exactly five staff have named map and roster entries and can be selected', () => {
  const app = controller();
  const staff = [
    { id: 'director', name: 'Research Director' },
    { id: 'researcher', name: 'Researcher' },
    { id: 'analyst', name: 'Data Analyst' },
    { id: 'editor', name: 'Editor' },
    { id: 'associate', name: 'Research Associate' }
  ];
  const ids = staff.map(agent => agent.id);
  const map = app.elements.get('characters').children;
  const roster = app.elements.get('roster').children;
  assert.deepEqual(map.map(button => button.dataset.agent), ids);
  assert.deepEqual(roster.map(button => button.dataset.agent), ids);
  assert.equal(new Set(map.map(button => button.attributes['aria-label'])).size, 5);
  assert.deepEqual(Object.keys(app.world.Visual.DESIGNS).sort(), [...ids].sort());
  const designs = Object.values(app.world.Visual.DESIGNS);
  assert.equal(designs.filter(design => design.build === 'female').length, 2);
  assert.equal(designs.filter(design => design.build !== 'female').length, 3);
  for (const [index, agent] of staff.entries()) {
    assert.ok(Object.hasOwn(app.world.Visual.DESIGNS, agent.id));
    assert.equal(roster[index].children.find(child => child.className === 'world-member-name').textContent, agent.name);
    for (const button of [map[index], roster[index]]) {
      assert.ok(button.querySelector('svg').children.length > 30, 'detailed native sprite exists');
      assert.ok(button.attributes['aria-label'].startsWith(agent.name + ', '));
      button.emit('click');
      assert.equal(app.elements.get('agent-name').textContent, agent.name);
      assert.equal(app.elements.get('agent-number').textContent, String(index + 1).padStart(2, '0') + ' / 05');
      assert.equal(app.elements.get('agent-portrait').dataset.agent, agent.id);
      assert.equal(app.elements.get('agent-status').textContent, 'IDLE');
      assert.equal(app.elements.get('agent-progress').value, 0);
      assert.equal(app.elements.get('agent-task').textContent, 'Analyze AI infrastructure market trends');
      assert.equal(button.attributes['aria-pressed'], 'true');
    }
  }
  app.click('reset');
  assert.equal(app.elements.get('world-announcement').textContent, 'Simulation restarted. All 5 staff are back at the current brief.');
  assert.deepEqual(app.elements.get('characters').children.map(button => button.dataset.agent), ids);
  assert.deepEqual(app.elements.get('roster').children.map(button => button.dataset.agent), ids);
  assert.equal(app.elements.get('agent-name').textContent, 'Research Associate');
  assert.equal(app.elements.get('agent-number').textContent, '05 / 05');
  assert.equal(app.elements.get('agent-status').textContent, 'IDLE');
  assert.equal(app.elements.get('agent-progress').value, 0);
});

test('director states and department visits reuse the shared controller without changing colleagues', () => {
  const app = controller({ reduced: true });
  const colleagues = () => JSON.parse(JSON.stringify(app.world.getSnapshot().agents.filter(agent => agent.id !== 'director')));
  const before = colleagues();
  const director = app.elements.get('characters').children[0];
  for (const status of ['IDLE', 'THINKING', 'REVIEWING', 'DIRECTING', 'MEETING', 'WORKING', 'COMPLETED']) {
    assert.equal(app.world.dispatch({ type: 'agent.changed_status', agentId: 'director', status }), true);
    assert.equal(app.elements.get('agent-status').textContent, status);
    assert.equal(director.dataset.status, status);
    assert.ok(director.dataset.behavior, 'supported status has an existing visual behavior');
    assert.equal(app.world.getSnapshot().task.status, 'IDLE');
    assert.equal(app.elements.get('task-state').dataset.status, 'IDLE', 'local Director status does not advance the shared task');
  }
  for (const location of ['research', 'data', 'editor', 'hall', 'director']) {
    assert.equal(app.world.dispatch({ type: 'agent.changed_status', agentId: 'director', status: location === 'director' ? 'IDLE' : 'MEETING', location }), true);
    assert.equal(app.world.getSnapshot().agents[0].location, location);
    assert.equal(app.world.getSnapshot().agents[0].destination, null);
    assert.equal(app.elements.get('agent-location').textContent, app.world.State.ROOMS[location]);
  }
  assert.deepEqual(colleagues(), before);
  assert.equal(app.frames.size, 0);
});

test('next event carries the shared task through five owners and keeps completion through cleanup', () => {
  const app = controller({ reduced: true });
  const pipeline = ['associate', 'researcher', 'analyst', 'editor', 'director'];
  const phases = ['Source collection', 'Source analysis', 'Quantitative validation', 'Editorial preparation', 'Final review'];
  const staffIds = ['director', 'researcher', 'analyst', 'editor', 'associate'];
  const title = 'Analyze AI infrastructure market trends';
  const visited = [];
  let completed = null;
  const plain = value => JSON.parse(JSON.stringify(value));
  function assertDisplay(snapshot) {
    const task = snapshot.task;
    const owner = snapshot.agents.find(agent => agent.id === task.assignedAgentId);
    const taskElement = app.elements.get('task-state');
    const taskState = taskElement.textContent;
    assert.ok(taskState.includes(task.status), 'the overall task status is visible');
    assert.equal(taskElement.dataset.status, task.status);
    if (task.status === 'COMPLETED') {
      assert.match(taskState, /5\s+of\s+5\s+stages complete/i);
    } else if (!task.stage) {
      assert.ok(taskState.toLowerCase().includes('ready for source collection'));
    } else {
      assert.ok(taskState.includes(phases[task.stage - 1]), 'the current stage label is visible');
      if (task.stage === task.completedStages) {
        assert.match(taskState, /complete.*awaiting/i);
        assert.ok(taskState.toLowerCase().includes(phases[task.stage].toLowerCase()), 'the next handoff stage is visible');
      } else {
        assert.match(taskState, new RegExp(task.stage + '\\s*(?:/|of)\\s*5'));
        assert.ok(taskState.includes(owner.name), 'the current shared-task owner is visible');
      }
    }
    if (owner) {
      app.elements.get('roster').children.find(button => button.dataset.agent === owner.id).emit('click');
      assert.equal(app.elements.get('agent-name').textContent, owner.name);
      assert.equal(app.elements.get('agent-status').textContent, owner.status);
      assert.equal(app.elements.get('agent-activity').textContent, owner.currentActivity);
      assert.equal(app.elements.get('agent-location').textContent, app.world.State.ROOMS[owner.location]);
      assert.equal(app.elements.get('agent-progress').value, owner.progress);
      assert.equal(app.elements.get('agent-percent').textContent, owner.progress + '%');
      const latest = snapshot.events[0];
      if (latest?.type === 'agent.arrived' && latest.agentId === owner.id) {
        assert.notEqual(app.elements.get('agent-activity').textContent, latest.activity, 'arrival history cannot replace the work activity');
      }
    }
    assert.equal(app.elements.get('agent-task').textContent, title);
    const rows = app.elements.get('event-log').children;
    for (const [index, event] of snapshot.events.slice(0, 4).entries()) {
      assert.equal(rows[index].querySelector('strong').textContent, event.name);
      assert.equal(rows[index].querySelector('span').textContent, event.activity);
    }
    assert.deepEqual(app.elements.get('characters').children.map(button => button.dataset.agent), staffIds);
    assert.deepEqual(app.elements.get('roster').children.map(button => button.dataset.agent), staffIds);
    assert.equal(app.frames.size, 0);
    assert.equal(app.timers.size, 0);
  }
  assertDisplay(app.world.getSnapshot());
  for (let step = 0; step < app.world.Mock.SCRIPT.length; step++) {
    app.click('next');
    const snapshot = app.world.getSnapshot();
    const task = snapshot.task;
    assert.equal(task.assignedAgentId, pipeline[task.stage - 1]);
    if (visited.at(-1) !== task.assignedAgentId) visited.push(task.assignedAgentId);
    if (task.completedStages < 5) {
      assert.equal(task.status, 'WORKING', 'an intermediate stage cannot complete the shared task');
      assert.equal(task.completedAt, null);
    } else if (!completed) {
      assert.equal(task.status, 'COMPLETED');
      assert.equal(task.stage, 5);
      assert.equal(task.assignedAgentId, 'director');
      assert.equal(snapshot.agents.find(agent => agent.id === 'director').status, 'COMPLETED');
      assert.ok(task.completedAt);
      completed = plain(task);
    } else {
      assert.deepEqual(plain(task), completed, 'idle cleanup preserves the completed shared task');
    }
    assertDisplay(snapshot);
  }
  assert.deepEqual(visited, pipeline);
  assert.ok(completed, 'the default source completes the final Director stage');
  assert.ok(app.world.getSnapshot().agents.every(agent => agent.status === 'IDLE'));
  app.click('next');
  const restarted = app.world.getSnapshot();
  assert.equal(restarted.task.status, 'WORKING');
  assert.equal(restarted.task.assignedAgentId, 'associate');
  assert.equal(restarted.task.stage, 1);
  assert.equal(restarted.task.completedStages, 0);
  assert.equal(restarted.task.completedAt, null);
  assert.ok(restarted.task.startedAt);
  assert.notEqual(restarted.task.currentActivity, completed.currentActivity);
  assertDisplay(restarted);
});

test('concurrent travel and first arrival retain at most one animation frame', () => {
  const app = controller(); moveTogether(app);
  assert.equal(app.frames.size, 1);
  let sawPartialArrival = false;
  for (let tick = 0; tick < 200 && app.frames.size; tick++) {
    app.tick();
    assert.ok(app.frames.size <= 1, 'arrival dispatch must not create a second frame loop');
    const agents = app.world.getSnapshot().agents;
    if (!agents.find(agent => agent.id === 'researcher').destination && agents.find(agent => agent.id === 'analyst').destination) sawPartialArrival = true;
  }
  assert.equal(sawPartialArrival, true, 'one walker arrives while the other still needs frames');
  assert.equal(app.frames.size, 0);
  for (const id of ['researcher', 'analyst']) {
    const agent = app.world.getSnapshot().agents.find(member => member.id === id);
    assert.equal(agent.location, 'hall'); assert.equal(agent.destination, null);
  }
});

test('pause cancels travel and timer; paused restart restores stations with no pending work', () => {
  const app = controller(); moveTogether(app); app.tick(); app.tick();
  assert.equal(app.frames.size, 1); assert.equal(app.timers.size, 1);
  app.click('pause'); assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  app.click('reset');
  assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  assert.equal(app.world.getSnapshot().sequence, 0);
  assert.ok(app.world.getSnapshot().agents.every(agent => agent.destination === null));
  assert.equal(app.world.getSnapshot().agents.find(agent => agent.id === 'researcher').location, 'library');
  const character = app.elements.get('characters').children.find(button => button.dataset.agent === 'researcher');
  assert.equal(character.style.left, 220 / 960 * 100 + '%');
  assert.equal(character.style.top, 210 / 620 * 100 + '%');
  app.click('pause'); assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 1);
});

test('running restart cancels old travel and replaces the event timer once', () => {
  const app = controller(); moveTogether(app); app.tick(); app.tick();
  app.click('reset');
  assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 1);
  assert.equal([...app.timers.values()][0].delay, 4000);
  assert.ok(app.world.getSnapshot().agents.every(agent => agent.destination === null));
  assert.equal(app.world.getSnapshot().events.length, 0);
});

test('hidden pages suspend timers and travel without a jump on return', () => {
  const app = controller(); moveTogether(app); app.tick(); app.tick();
  const character = app.elements.get('characters').children.find(button => button.dataset.agent === 'researcher');
  const before = { ...character.style };
  app.document.hidden = true; app.document.emit('visibilitychange');
  assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  app.tick(60000);
  assert.deepEqual(character.style, before);
  app.document.hidden = false; app.document.emit('visibilitychange');
  assert.equal(app.frames.size, 1); assert.equal(app.timers.size, 1);
  app.tick();
  assert.deepEqual(character.style, before, 'the first returning frame must reset elapsed time');
  app.tick();
  assert.notEqual(character.style.top, before.top);
});

test('reduced motion starts manually and next event settles without animation', () => {
  const app = controller({ reduced: true });
  assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  assert.equal(app.elements.get('pause').attributes['aria-pressed'], 'true');
  app.click('next');
  const associate = app.world.getSnapshot().agents.find(agent => agent.id === 'associate');
  assert.equal(associate.location, 'library'); assert.equal(associate.destination, null);
  assert.equal(associate.status, 'WORKING');
  assert.equal(associate.progress, 5);
  assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  app.click('pause');
  assert.equal(app.timers.size, 1);
  app.world.dispatch({ type: 'agent.moved', agentId: 'analyst', location: 'hall' });
  assert.equal(app.frames.size, 0);
  assert.equal(app.world.getSnapshot().agents.find(agent => agent.id === 'analyst').location, 'hall');
});
