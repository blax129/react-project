// Node's test runner executes focused obstacle regressions.
import test from 'node:test';
// Strict assertions make behavioural failures stop the test run.
import assert from 'node:assert/strict';
// Real runs provide the same fuel and hazard state used by the game.
import { createRun, stepRun, reseat } from '../src/game/world.js';
// Test fixed locations, contact detection, warnings, and one-time effects.
import { hazardsNear, stepHazards, hazardCue } from '../src/game/hazards.js';
// Terrain helpers let test vehicles be seated at the marked road patch.
import { groundY } from '../src/game/terrain.js';
// Find the first set of route features once for these focused tests.
const features = hazardsNear(4000, 3000, 3000);
// Retrieve a feature by its readable type.
const feature = type => features.find(h => h.type === type);
// Position a fresh ride at a real hazard without driving through earlier tests.
function at(type) {
  // Use a small forgiving vehicle to isolate the hazard's effect.
  const run = createRun('micra');
  // Place the vehicle inside the visible marked zone.
  run.x = feature(type).x + 20;
  // Put its body near the actual road before seating its tires.
  run.y = groundY(run.x) - 40;
  // Align tires with the surface.
  reseat(run);
  // Return the ready test state.
  return run;
// Finish the setup helper.
}
// Punctures must be avoidable and must not apply repeated impact charges.
test('debris punctures once at speed, drains over time, and rewards slowing or jumping', () => {
  // Begin with a full tank and a fast grounded vehicle.
  const fast = at('debris'); fast.vx = 180;
  // Apply the initial ground contact.
  stepHazards(fast, 1/120, true, {gas:true});
  // The hit should start a leak with one immediate eighteen-unit loss.
  assert.equal(fast.leaking, true); assert.equal(fast.fuel, 82);
  // Remaining on the patch should apply only the ongoing leak.
  stepHazards(fast, 1, true, {gas:true});
  // A one-second leak costs 2.7 units rather than another impact penalty.
  assert.ok(Math.abs(fast.fuel - 79.3) < 1e-9);
  // The HUD must explain the emergency.
  assert.match(hazardCue(fast), /FUEL LEAK/);
  // Test the safe low-speed alternative (crawl below the puncture threshold).
  const slow = at('debris'); slow.vx = 50;
  // Gentle ground contact should not puncture the tank.
  stepHazards(slow, 1/120, true, {});
  // Both fuel and leak state must remain unchanged.
  assert.equal(slow.leaking, false); assert.equal(slow.fuel, 100);
  // Test a fast vehicle that clears the patch in the air.
  const airborne = at('debris'); airborne.vx = 180;
  // No ground contact means no debris damage.
  stepHazards(airborne, 1/120, false, {gas:true});
  // Jumping is another valid way to avoid the puncture.
  assert.equal(airborne.leaking, false);
// Finish debris behaviour coverage.
});
// Repair stops offer recovery without allowing infinite fuel from reversing.
test('repair seals leaks and supplies emergency fuel only once', () => {
  // Arrive with a damaged tank and a small reserve.
  const run = at('repair'); run.fuel = 10; run.leaking = true;
  // Reach the roadside service stop.
  stepHazards(run, 1/120, true, {});
  // The leak ends and the limited refill is applied.
  assert.equal(run.leaking, false); assert.ok(run.fuel > 29 && run.fuel <= 30);
  // Record the fuel after service.
  const fuel = run.fuel;
  // Revisiting the same stop cannot add more fuel.
  stepHazards(run, 1, true, {});
  // The reserve stays unchanged.
  assert.equal(run.fuel, fuel);
// Finish repair coverage.
});
// Police stops should be deliberate, finite, and safe to repeat after clearance.
test('checkpoint requires a brief stop and opens without charging careful drivers', () => {
  // Arrive in the marked stopping zone.
  const run = at('police');
  // Remain stationary with Gas released for long enough to complete inspection.
  for(let i=0;i<100;i++) stepHazards(run, 1/120, true, {});
  // The checkpoint should now be permanently cleared for this run.
  assert.ok(run.clearedCheckpoints.has(feature('police').id));
  // A proper stop carries no fuel penalty.
  assert.equal(run.fuel, 100);
// Finish the controlled-stop test.
});
// Ramming must not allow bypassing the barrier or multiply the penalty each frame.
test('closed barrier blocks ramming and jumping, charges once, and cannot be cleared with Gas held', () => {
  // Start with a fast vehicle at the stopping zone.
  const run = at('police'), gate = feature('police');
  // Move its centre past the closed barrier to simulate an impact.
  run.x = gate.x + gate.width + 2; run.vx = 200;
  // Even an airborne crossing must be blocked.
  stepHazards(run, 1/120, false, {gas:true});
  // Position is constrained to the near side and the warned penalty is applied.
  assert.ok(run.x < gate.x + gate.width); assert.equal(run.fuel, 88);
  // Holding Gas against the gate cannot satisfy the stop requirement.
  for(let i=0;i<240;i++) stepHazards(run, 1/120, true, {gas:true});
  // The barrier remains closed without repeatedly draining fuel.
  assert.equal(run.clearedCheckpoints.size, 0); assert.equal(run.fuel, 88);
// Finish impact coverage.
});
// Mud should consume more fuel and reduce acceleration while retaining escape grip.
test('mud costs more fuel and speed than the same road without hazards', () => {
  // Compare identical rides on exactly the same terrain.
  const muddy = at('mud'), clean = at('mud'); clean.hazardsEnabled = false;
  // Use matching forward speeds so the traction comparison is meaningful.
  muddy.vx = 100; clean.vx = 100;
  // Advance one fixed simulation step with the same throttle input.
  stepRun(muddy, 1/120, {gas:true}); stepRun(clean, 1/120, {gas:true});
  // Mud adds fuel pressure and reduces the resulting forward speed.
  assert.ok(muddy.fuel < clean.fuel); assert.ok(muddy.vx < clean.vx);
// Finish mud coverage.
});
// Fixed hazard layouts are necessary for fair retries and future competitive modes.
test('hazard positions and warnings are deterministic', () => {
  // Query the same section twice and compare the complete visible feature list.
  assert.deepEqual(hazardsNear(4000), hazardsNear(4000));
  // A checkpoint must be announced before the rider reaches its stopping zone.
  const run = at('police'); run.x = feature('police').x - 300;
  // The warning should identify the required police stop.
  assert.match(hazardCue(run), /POLICE CHECKPOINT/);
// Finish deterministic-route coverage.
});
