// Both racers use one fixed military obstacle course and the existing vehicle physics.
import { createRun, reseat, stepRun } from './world';
// Respawning clears visual particles without changing vehicle handling.
import { createExhaust } from './exhaust';

// Fifteen sectors form a long but finite race with a real finish line.
export const RACE_FINISH = 30000;
// One checkpoint every 2000 units keeps retries fair.
export const CHECKPOINT_GAP = 2000;

// Smooth 0→1 fade used to shape detail without inventing cliff walls.
const smooth = (t) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};

// One smooth hill that starts and ends at zero. Peak slope ≈ height * π / width.
function hump(local, start, width, height) {
  // Outside the hump the road stays unchanged.
  if (local <= start || local >= start + width) return 0;
  const t = (local - start) / width;
  // Raised sine: flat at both ends, peak in the middle.
  return height * Math.sin(Math.PI * t);
}

// Sustained climb: steepest in the middle of the rise, so a weak run-up stalls mid-face.
// Peak grade ≈ 1.5 * height / halfWidth (from the smoothstep derivative).
function climbHill(local, start, halfWidth, height) {
  // Flat outside the full up-and-down window.
  if (local <= start || local >= start + halfWidth * 2) return 0;
  const t = (local - start) / halfWidth;
  // Climb to the crest with a smooth S-curve.
  if (t <= 1) return height * smooth(t);
  // Descend the far face the same way.
  return height * (1 - smooth(t - 1));
}

// A deterministic course gives both guests identical obstacles.
export function barracksY(x) {
  // Flat start and finish aprons are safe for every vehicle.
  if (x < 150 || x > RACE_FINISH - 180) return 350;

  // Checkpoints divide the track into progressively harder sectors.
  const sector = Math.floor(x / CHECKPOINT_GAP);
  const local = x - sector * CHECKPOINT_GAP;
  // 0 at sector 0 → 1 by sector 12; late race is tougher, never a wall.
  const hard = Math.min(1, sector / 12);

  // Main proving climb after a long runway (local ~520–720 is flat for building speed).
  // Early peak ≈ 0.33, late ≈ 0.42 — hold speed through the face or slide back.
  const climbHeight = 72 + 14 * hard;
  const halfWidth = 340 - 20 * hard;
  // Runway sits before this start so every vehicle can build momentum.
  const climbStart = 720;
  const mainClimb = climbHill(local, climbStart, halfWidth, climbHeight);

  // Mild crest near the summit — release Gas or tippy rides flip.
  const crest = hump(local, climbStart + halfWidth - 40, 200, 6 + 3 * hard);

  // Sector flavour AFTER the climb so it never spikes the entrance grade.
  let detail = 0;
  if (sector % 3 === 0) {
    // Light washboard on the far side of the hill only.
    detail =
      7 *
      Math.sin(local * Math.PI / 80) *
      smooth((local - 1380) / 60) *
      smooth((1680 - local) / 70);
  } else if (sector % 3 === 1) {
    // Shallow trench after the crest — dip then climb out with leftover speed.
    detail = -32 * Math.exp(-(((local - 1500) / 140) ** 2));
  } else {
    // Gentle rolling humps before the next apron.
    detail =
      10 * Math.sin(local * Math.PI / 120) * smooth((local - 1400) / 70) * smooth((1720 - local) / 80);
  }

  // Tiny early ripples that fully return to flat before the speed runway.
  const ripples = hump(local, 280, 180, 10);

  // No multiplicative envelope — every piece already returns to zero before the next apron.
  return 350 - (mainClimb + crest + detail + ripples);
}

// Stable numerical differentiation supplies the slope needed by suspension and traction.
export const barracksSlope = (x) => (barracksY(x + 1) - barracksY(x - 1)) / 2;

// Terrain injection leaves the solo Lagos route unchanged.
export const BARRACKS_TERRAIN = { heightAt: barracksY, slopeAt: barracksSlope };

// Both opponents encounter fuel at identical fixed locations.
// Wider gaps (was 780) make empty-tank pressure a real race decision.
export const RACE_FUEL_GAP = 1180;
// First can still appears early enough that the opening sector is learnable.
export const RACE_FUEL = Array.from({ length: Math.ceil(RACE_FINISH / RACE_FUEL_GAP) }, (_, i) => 520 + i * RACE_FUEL_GAP).filter(
  (x) => x < RACE_FINISH - 280,
);
// Extra race-only burn on top of each vehicle's solo fuelBurn.
export const RACE_FUEL_EXTRA = 1.35;

// How much forward speed (units/sec) a climb at this spot expects.
// Flat / gentle grades return 0. Steeper faces need a run-up — crawl and you slide.
export function climbSpeedNeeded(x) {
  // Canvas Y shrinks when climbing, so a negative slope means an uphill face.
  const grade = Math.max(0, -barracksSlope(x));
  // Below this grade the base physics already climb from a near-stop.
  if (grade < 0.28) return 0;
  // Cap stays under slow trucks' top speed (~190) so heavy rides can still clear with a run-up.
  return Math.min(150, 55 + (grade - 0.28) * 240);
}

// Restore an upright vehicle to the most recently earned checkpoint.
export function createRaceRun(vehicleId, checkpoint = 0, deaths = 0) {
  // Reuse all nineteen production handling profiles.
  const run = createRun(vehicleId, BARRACKS_TERRAIN);
  // Clamp reconnection and respawn data to actual checkpoint boundaries.
  run.checkpoint = Math.max(0, Math.min(RACE_FINISH - CHECKPOINT_GAP, Math.floor(checkpoint / CHECKPOINT_GAP) * CHECKPOINT_GAP));
  // Reseat the wheels on the flat checkpoint apron.
  run.x = Math.max(40, run.checkpoint);
  run.y = barracksY(run.x) - 120;
  run.vx = 0;
  run.vy = 0;
  reseat(run);
  // Disable the solo generator and use identical race fuel stops.
  run.cans = RACE_FUEL.filter((x) => x > run.x - 80).map((x) => ({ x, taken: false }));
  run.nextCan = Infinity;
  // A full tank makes every individual sector retryable after the time penalty.
  run.fuel = 100;
  run.deaths = deaths;
  run.exhaust = createExhaust();
  run.finished = false;
  // Return a complete playable state.
  return run;
}

// Mud and gravel punish poor entries but never trap a stationary car permanently.
export function barracksSurface(x) {
  // Surface hazards stay clear of safe respawn aprons and the speed runway.
  const local = ((x % CHECKPOINT_GAP) + CHECKPOINT_GAP) % CHECKPOINT_GAP;
  const sector = Math.floor(x / CHECKPOINT_GAP);
  // Wider mud / gravel before the runway — clear it, then accelerate into the climb.
  if (local > 360 && local < 540) return sector % 2 ? 'gravel' : 'mud';
  // Later sectors add a thicker mud strip after the crest.
  if (sector >= 7 && local > 1360 && local < 1520) return 'mud';
  // Other road sections use normal traction.
  return '';
}

// Look ahead for the next hazard so the HUD and roadside signs can warn the driver.
export function dangerAhead(x, look = 560) {
  // Scan forward in short steps for the first surface threat.
  for (let d = 60; d <= look; d += 16) {
    const surface = barracksSurface(x + d);
    // Mud is the sticky fuel sink — call it out first.
    if (surface === 'mud') return { type: 'mud', at: x + d, label: '⚠ MUD AHEAD' };
    // Gravel slips at high speed — ease off before you hit it.
    if (surface === 'gravel') return { type: 'gravel', at: x + d, label: '⚠ GRAVEL AHEAD' };
  }
  // Inside a sector, warn before the proving climb so players build speed on the runway.
  const local = ((x % CHECKPOINT_GAP) + CHECKPOINT_GAP) % CHECKPOINT_GAP;
  if (local > 540 && local < 720) {
    return { type: 'climb', at: x + (720 - local), label: '⚠ CLIMB AHEAD — BUILD SPEED' };
  }
  // No near threat in the look-ahead window.
  return null;
}

// After physics: steep faces keep only cars that still hold the required speed.
function applyClimbSpeedGate(run, dt, grounded) {
  // Airborne cars are past the gate; landing decides the next attempt.
  if (!grounded) return;
  const need = climbSpeedNeeded(run.x);
  // Gentle grades do not gate.
  if (need <= 0) return;
  // Measure speed along the road, not raw screen velocity.
  const hill = Math.atan(barracksSlope(run.x));
  const along = run.vx * Math.cos(hill) + run.vy * Math.sin(hill);
  // Fast enough — the hill is earned; leave physics alone.
  if (along >= need) return;
  // Shortfall 0–1: how far under the required approach speed you are.
  const shortfall = Math.min(1, (need - Math.max(0, along)) / need);
  // Scrub Gas crawls without permanently trapping trucks that almost made the mark.
  const scrub = Math.exp(-dt * (1.4 + shortfall * 2.6));
  run.vx *= scrub;
  run.vy *= scrub;
  // Far under the mark: gravity-like pull back down the grade.
  if (along < need * 0.55) {
    const pull = (need * 0.55 - Math.max(0, along)) * 2.4 * dt;
    run.vx -= Math.cos(hill) * pull;
    run.vy -= Math.sin(hill) * pull;
  }
}

// Advance one local physics tick; the room database separately arbitrates the winner.
export function stepRaceRun(run, dt, controls) {
  // Crashed and finished vehicles wait for the room controller.
  if (run.finished || run.over) return run.finished ? 'finish' : 'crash';
  // Surface effects apply only while at least one tire touches the course.
  const grounded = run.wheels.some(
    (w) =>
      run.y + w.x * Math.sin(run.angle) + w.y * Math.cos(run.angle) + w.r >=
      barracksY(run.x + w.x * Math.cos(run.angle) - w.y * Math.sin(run.angle)) - 3,
  );
  // Determine the shared surface at the vehicle's current position.
  const surface = grounded ? barracksSurface(run.x) : '';
  // Mud sticks harder and drinks fuel if you keep Gas buried.
  if (surface === 'mud') {
    // Strong horizontal scrub — momentum dies fast in the muck.
    run.vx *= Math.exp(-dt * 1.65);
    // Vertical scrub stops bouncing out of the patch for free.
    run.vy *= Math.exp(-dt * 1.1);
    // Holding Gas in mud burns a noticeable extra chunk of tank.
    if (controls.gas) run.fuel = Math.max(0, run.fuel - dt * 3.4);
  }
  // Gravel slips harder at speed — crawl or you lose the run-up.
  if (surface === 'gravel' && Math.abs(run.vx) > 110) run.vx *= Math.exp(-dt * 0.95);
  // Preserve the tested driving controls, suspension and upside-down crash rules.
  const event = stepRun(run, dt, controls);
  // Race-only fuel pressure on top of each vehicle's normal burn rate.
  if ((controls.gas || controls.right) && !controls.brake && !controls.left && run.fuel > 0 && !run.over) {
    run.fuel = Math.max(0, run.fuel - RACE_FUEL_EXTRA * dt);
  }
  // Re-check contact after the step so the gate matches the new pose.
  const stillGrounded = run.wheels.some(
    (w) =>
      run.y + w.x * Math.sin(run.angle) + w.y * Math.cos(run.angle) + w.r >=
      barracksY(run.x + w.x * Math.cos(run.angle) - w.y * Math.sin(run.angle)) - 3,
  );
  // Gate after the push so Gas cannot erase a failed run-up in one frame.
  applyClimbSpeedGate(run, dt, stillGrounded);
  // Upright arrivals earn permanent progress to the next checkpoint.
  if (!run.over) {
    run.checkpoint = Math.max(
      run.checkpoint,
      Math.min(RACE_FINISH - CHECKPOINT_GAP, Math.floor(Math.max(0, run.x) / CHECKPOINT_GAP) * CHECKPOINT_GAP),
    );
  }
  // Crossing the finish freezes this car while the server confirms the result.
  if (!run.over && run.x >= RACE_FINISH) {
    run.x = RACE_FINISH;
    run.finished = true;
    return 'finish';
  }
  // Bound reverse driving to the start apron.
  if (run.x < 20) {
    run.x = 20;
    run.vx = Math.max(0, run.vx);
  }
  // Return ordinary driving, pickup or crash feedback.
  return event;
}
