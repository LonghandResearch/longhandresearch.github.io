/* Small waypoint navigator. Geometry matches assets/institution.svg (960 x 620). */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const STATIONS = Object.freeze({
    library: { x: 220, y: 210 }, research: { x: 474, y: 208 }, data: { x: 758, y: 208 },
    editor: { x: 220, y: 448 }, director: { x: 758, y: 448 }, hall: { x: 474, y: 418 }
  });
  const OFFSETS = {
    hall: { director: -48, researcher: -16, analyst: 16, editor: 48, 'researcher-ii': -70, 'analyst-ii': 70, 'editor-ii': -36, associate: 32 },
    library: { editor: 38, analyst: -38, director: 18, 'researcher-ii': -70, 'analyst-ii': -18, 'editor-ii': 70, associate: 54 },
    research: { analyst: 38, editor: -38, director: 70, 'researcher-ii': -70, 'analyst-ii': -18, 'editor-ii': 54, associate: 70 },
    data: { researcher: -38, editor: 38, director: 70, 'researcher-ii': -70, 'analyst-ii': -38, 'editor-ii': 54, associate: -18 },
    editor: { researcher: -38, analyst: 38, director: -18, 'researcher-ii': -70, 'analyst-ii': 54, 'editor-ii': 38, associate: 70 },
    director: { researcher: -38, analyst: 38, editor: 70, 'researcher-ii': -70, 'analyst-ii': -18, 'editor-ii': 54, associate: 18 }
  };
  const station = (room, id) => ({ ...STATIONS[room], x: STATIONS[room].x + (OFFSETS[room][id] || 0) });
  const equal = (a, b) => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;

  function createMovement() {
    const members = new Map();
    function reset(agents) {
      members.clear();
      agents.forEach((agent) => members.set(agent.id, { ...station(agent.location, agent.id), room: agent.location, destination: null, arrivalPending: null, waypoints: [], walking: false, direction: 1 }));
    }
    function sync(agents) {
      agents.forEach((agent) => {
        const member = members.get(agent.id);
        if (!member) return;
        if (!agent.destination) { member.arrivalPending = null; return; }
        // A batch may finish several walks before the store confirms each arrival.
        if (member.destination === agent.destination || member.arrivalPending === agent.destination) return;
        member.arrivalPending = null;
        const target = station(agent.destination, agent.id);
        // For an interrupted walk, first follow the same clear aisle back to the corridor.
        const exitX = member.y >= 274 && member.y <= 358 ? member.x : member.x < 332 ? 220 : member.x < 616 ? 474 : 758;
        const entryX = STATIONS[agent.destination].x;
        const route = [{ x: exitX, y: member.y }, { x: exitX, y: 318 },
          { x: entryX, y: 318 }, { x: entryX, y: target.y }, target];
        if (agent.destination === member.room && !member.walking) route.splice(0, 4);
        member.destination = agent.destination;
        member.waypoints = route.filter((point, index) => !equal(point, index ? route[index - 1] : member));
        member.walking = true;
      });
    }
    function advance(seconds, instant = false) {
      const arrivals = [];
      const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      members.forEach((member, id) => {
        if (!member.walking) return;
        let distance = instant ? Infinity : elapsed * 70;
        while (member.waypoints.length) {
          const point = member.waypoints[0];
          const dx = point.x - member.x, dy = point.y - member.y;
          const length = Math.hypot(dx, dy);
          if (Math.abs(dx) > 0.01) member.direction = dx > 0 ? 1 : -1;
          if (length <= distance) {
            member.x = point.x; member.y = point.y;
            distance -= length;
            member.waypoints.shift();
          } else {
            member.x += dx / length * distance; member.y += dy / length * distance;
            break;
          }
        }
        if (!member.waypoints.length) {
          member.walking = false;
          member.room = member.destination;
          member.arrivalPending = member.destination;
          member.destination = null;
          arrivals.push({ type: 'agent.arrived', agentId: id, location: member.room });
        }
      });
      return arrivals;
    }
    const getPositions = () => Array.from(members, ([id, member]) => ({ id, x: member.x, y: member.y, walking: member.walking, direction: member.direction }));
    const isMoving = () => Array.from(members.values()).some((member) => member.walking);
    return Object.freeze({ reset, sync, advance, getPositions, isMoving });
  }
  World.Movement = Object.freeze({ STATIONS, createMovement });
})(globalThis);
