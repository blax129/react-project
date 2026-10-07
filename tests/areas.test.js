// Use Node's built-in runner and strict assertions for route invariants.
import test from 'node:test';
// Fail clearly when a transition or route entry is invalid.
import assert from 'node:assert/strict';
// Exercise the same location lookup used by the dashboard and world renderer.
import { AREAS, AREA_LENGTH, areaAt, areaLabel } from '../src/game/areas.js';
// Check terrain on both sides of every location boundary.
import { groundY, groundSlope } from '../src/game/terrain.js';
// Prevent missing, duplicated or unreachable route stages.
test('thirty unique areas resolve at every stage boundary', () => {
  // Require the requested total and distinct identifiers.
  assert.equal(AREAS.length, 30); assert.equal(new Set(AREAS.map(a => a.id)).size, 30);
  // Confirm the beginning and endless final area are clamped correctly.
  assert.equal(areaAt(-1).name, 'Festac First Gate'); assert.equal(areaAt(1e8).name, 'Airport Road');
  // Check each transition before, at and after its boundary.
  AREAS.forEach((area, index) => {
    // Verify the stage begins at its declared distance.
    assert.equal(area.from, index * AREA_LENGTH); assert.equal(areaAt(area.from).id, area.id);
    // Ensure each scene supplies readable location context.
    assert.ok(area.description && area.landmark && area.source && area.theme);
    // Check the last metre belongs to the preceding stage.
    if (index) assert.equal(areaAt(area.from - 1).id, AREAS[index - 1].id);
  // Finish checking every route entry.
  });
  // Confirm the HUD communicates progress through the route.
  assert.match(areaLabel(0), /1\/30/); assert.match(areaLabel(29 * AREA_LENGTH), /30\/30/);
// Finish route coverage.
});
// Avoid sudden height changes that could throw a vehicle at an area transition.
test('all area joins preserve terrain height and slope continuity', () => {
  // Include the transition into the final endless stage.
  for (let index = 1; index < 30; index++) {
    // Sample very close to the shared boundary.
    const x = index * AREA_LENGTH;
    // Height and slope should approach the same value from each side.
    assert.ok(Math.abs(groundY(x - .001) - groundY(x + .001)) < .01, `height at ${index}`);
    // Reject an abrupt change in surface angle.
    assert.ok(Math.abs(groundSlope(x - .001) - groundSlope(x + .001)) < .01, `slope at ${index}`);
  // Finish boundary samples.
  }
// Finish continuity regression coverage.
});
