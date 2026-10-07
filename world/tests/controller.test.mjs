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
    emit(type) { for (const callback of this.handlers.get(type) || []) callback(); }
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
    document, console, Intl, Date,
    matchMedia: () => motion,
    performance: { now: () => now },
    requestAnimationFrame(callback) { const id = ++handle; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback, delay) { const id = ++handle; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener() {}
  });
  context.window = context;
  for (const file of ['state.js', 'movement.js', 'mock-events.js', 'sprites.js', 'world.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'world', file), 'utf8'), context, { filename: file });
  }
  return {
    world: context.LonghandWorld, frames, timers, elements, document,
    click: id => elements.get(id).emit('click'),
    tick(milliseconds = 60) {
      now += milliseconds;
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback(now);
    }
  };
}

function moveTogether(app) {
  assert.equal(app.world.dispatch({ type: 'agent.moved', agentId: 'researcher', location: 'hall' }), true);
  assert.equal(app.world.dispatch({ type: 'agent.moved', agentId: 'analyst', location: 'hall' }), true);
}

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
      assert.equal(button.attributes['aria-pressed'], 'true');
    }
  }
  app.click('reset');
  assert.equal(app.elements.get('world-announcement').textContent, 'Simulation restarted. All 5 staff are back at their initial tasks.');
  assert.deepEqual(app.elements.get('characters').children.map(button => button.dataset.agent), ids);
  assert.deepEqual(app.elements.get('roster').children.map(button => button.dataset.agent), ids);
  assert.equal(app.elements.get('agent-name').textContent, 'Research Associate');
  assert.equal(app.elements.get('agent-number').textContent, '05 / 05');
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
  const researcher = app.world.getSnapshot().agents.find(agent => agent.id === 'researcher');
  assert.equal(researcher.location, 'research'); assert.equal(researcher.destination, null);
  assert.equal(researcher.status, 'WORKING');
  assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  app.click('pause');
  assert.equal(app.timers.size, 1);
  app.world.dispatch({ type: 'agent.moved', agentId: 'analyst', location: 'hall' });
  assert.equal(app.frames.size, 0);
  assert.equal(app.world.getSnapshot().agents.find(agent => agent.id === 'analyst').location, 'hall');
});
