// Exercise countdown timing and exhaust independently from browser rendering.
import test from 'node:test';
// Use strict assertions for launch and memory guarantees.
import assert from 'node:assert/strict';
// Import the actual active-time countdown used by the canvas.
import { createCountdown } from '../src/game/countdown.js';
// Import the bounded particle engine and all per-vehicle profiles.
import { createExhaust, stepExhaust, EXHAUST_PROFILES } from '../src/game/exhaust.js';
// Use production vehicle geometry when checking nozzle transforms.
import { VEHICLES } from '../src/game/vehicles.js';
// Ensure the countdown cannot finish early while loading, paused or backgrounded.
test('countdown shows three full seconds and ignores suspended time', () => {
  // Start with a fresh three-second launch.
  const launch = createCountdown(); assert.equal(launch.value, 3);
  // Hidden time and large animation gaps must not consume the countdown.
  launch.advance(.2, false); launch.advance(5); assert.equal(launch.value, 3);
  // Verify each displayed number at one-second boundaries.
  for (let expected = 2; expected >= 0; expected--) { for (let i = 0; i < 120; i++) launch.advance(1/120); assert.equal(launch.value, expected); }
  // A restart is independent of the completed launch.
  assert.equal(createCountdown().value, 3);
// Finish countdown regression coverage.
});
// Generate a short acceleration trail for a particular ride.
function trail(id, gas = true, angle = 0) {
  // Use a fixed pose and a full tank so results remain deterministic.
  const state = createExhaust(), run = {x:100,y:200,vx:70,angle,fuel:100,over:false};
  // Simulate two seconds at the production physics rate.
  for(let i=0;i<240;i++) stepExhaust(state,1/120,run,VEHICLES[id],{gas});
  // Return the resulting particles for comparisons.
  return state;
// Finish the test helper.
}
// Protect visual variety and avoid undefined profiles for any selectable vehicle.
test('all nineteen vehicles have finite, distinct exhaust profiles', () => {
  // No selectable ride should fall through to a generic plume.
  assert.deepEqual(Object.keys(EXHAUST_PROFILES).sort(), Object.keys(VEHICLES).sort());
  // Validate real geometry across the complete roster.
  for (const id of Object.keys(VEHICLES)) { const state=trail(id); assert.ok(state.particles.length>0); assert.ok(state.particles.every(p=>Number.isFinite(p.x+p.y+p.vx+p.vy+p.life+p.opacity))); }
  // Heavy diesel exhaust must be more substantial than a modern coupe's haze.
  assert.ok(trail('molue').particles.length > trail('benzcoupe').particles.length);
  // Uphill throttle should produce more exhaust than an idle engine.
  assert.ok(trail('dangote',true,-.6).particles.length > trail('dangote',false).particles.length);
// Finish vehicle profile coverage.
});
// Exhaust must never modify handling and must clear after the engine stops.
test('exhaust stays bounded, leaves physics untouched and expires after shutdown', () => {
  // Stress the highest-rate engine under uphill load.
  const state=createExhaust(), run={x:100,y:200,vx:30,angle:-1,fuel:100,over:false}, before={...run};
  // Simulate a full minute without letting effects grow indefinitely.
  for(let i=0;i<7200;i++) { stepExhaust(state,1/120,run,VEHICLES.dangote,{gas:true}); assert.ok(state.particles.length<=64); }
  // Only visual state may change.
  assert.deepEqual(run,before);
  // Fuel exhaustion stops emissions while existing particles disperse.
  run.fuel=0; for(let i=0;i<360;i++) stepExhaust(state,1/120,run,VEHICLES.dangote,{gas:true});
  // No stale plume should remain attached to a stopped engine.
  assert.equal(state.particles.length,0);
// Finish particle lifecycle checks.
});
