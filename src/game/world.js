// The numbers that shape the hills, the fuel, and the shared crash rules.
import {
  CAN_FUEL,
  CAN_GAP,
  CAN_REACH,
  FIRST_CAN,
  TUMBLE,
  FUEL_MAX,
  GRAVITY,
  MAX_SCORE,
  METERS,
  STOP_SPEED,
  STOP_TIME,
} from "./constants";
// How hard the road is at this distance. It climbs from CMS toward Epe.
import { hardship } from "./areas";
// The ride the player picked, and its handling numbers.
import { getVehicle } from "./vehicles";

import { groundY, groundSlope } from "./terrain";
export { groundY, groundSlope } from "./terrain";

// Builds a fresh ride. vehicleId picks which handling and wheel size to use.
export function createRun(vehicleId, terrain = { heightAt: groundY, slopeAt: groundSlope }) {
  // The ride from the picker. Unknown ids fall back to the korope.
  const vehicle = getVehicle(vehicleId);
  // The object stepRun changes every frame.
  const run = {
    // Which ride this is, so every frame can read its handling.
    vehicleId: vehicle.id,
    terrain,
    wheels: vehicle.wheels,
    // Along the road.
    x: 40,
    // Near the road. reseat drops the tires onto it.
    y: terrain.heightAt(40) - 40,
    // Level, facing right. Positive rotation tips the nose down.
    angle: 0,
    // Spin speed, used in the air.
    angVel: 0,
    // Along the screen.
    vx: 0,
    // Down the screen.
    vy: 0,
    // A full tank.
    fuel: FUEL_MAX,
    // Fuel cans still ahead.
    cans: [],
    // How far the can spawner has prepared.
    nextCan: FIRST_CAN,
    // Seconds spent almost still with an empty tank.
    still: 0,
    // True after a flip or an empty tank.
    over: false,
    // "flip" or "fuel", shown on the end card.
    endReason: "",
  };
  // Drops the wheels onto the road.
  reseat(run);
  // The first cans.
  ensureCans(run);
  // The ride is ready.
  return run;
}

// A point on the korope, rotated into the world. lx and ly are measured from the middle.
function localPoint(run, lx, ly) {
  // Cosine of the current tilt.
  const c = Math.cos(run.angle);
  // Sine of the current tilt.
  const s = Math.sin(run.angle);
  // Rotated into the world.
  return {
    // Horizontal place.
    x: run.x + lx * c - ly * s,
    // Vertical place.
    y: run.y + lx * s + ly * c,
  };
}

// Each contact uses the same pixel landmark as its pictured wheel.
function wheelPoint(run, wheel) {
  return localPoint(run, wheel.x, wheel.y);
}

// True when the roof faces the road instead of the sky.
function upsideDown(angle, slope) {
  // The lean is measured from the slope, so a tilted hill is not upside down by itself.
  return Math.abs(wrap(angle - Math.atan(slope))) > TUMBLE;
}

// Moves the body so the lower wheel sits on the road.
export function reseat(run) {
  const first = run.wheels[0], last = run.wheels.at(-1);
  run.angle = Math.atan2(
    run.terrain.heightAt(run.x + last.x) - run.terrain.heightAt(run.x + first.x)
      - (last.y + last.r - first.y - first.r), last.x - first.x);
  for (let i=0;i<3;i++) {
    const lift = Math.max(...run.wheels.map(w => {
      const p = wheelPoint(run,w);
      return p.y+w.r-run.terrain.heightAt(p.x);
    }));
    run.y -= lift;
  }
}

// Adds cans ahead of the rider.
function ensureCans(run) {
  // Keep a can ready past the right edge of the view.
  while (run.nextCan < run.x + 1400) {
    // One can on this stretch of road.
    run.cans.push({ x: run.nextCan, taken: false });
    // Later areas leave a longer gap, so coasting matters more. 480 is the extra gap by Epe.
    run.nextCan += CAN_GAP + hardship(run.nextCan) * 480 + (run.cans.length % 3) * 80;
  }
  // Drops cans the rider has left behind.
  run.cans = run.cans.filter((can) => can.x > run.x - 400);
}

// Wraps an angle into the range -pi to pi.
function wrap(angle) {
  // One turn.
  const turn = Math.PI * 2;
  // Shifted into range.
  return ((angle + Math.PI) % turn + turn) % turn - Math.PI;
}

// Moves one frame. controls.gas and controls.brake stay true while the pedals are held.
export function stepRun(run, dt, controls) {
  // A finished ride does not move.
  if (run.over) {
    // Nothing new happened.
    return "idle";
  }
  // The handling for this ride.
  const vehicle = getVehicle(run.vehicleId);
  // A hidden tab must not throw the ride across the map.
  const step = Math.min(1 / 30, Math.max(0, Number.isFinite(dt) ? dt : 0));
  if (!step) return "idle";
  const roadY = run.terrain.heightAt;
  const roadSlope = run.terrain.slopeAt;
  // Right/Gas drive forward. Left/Brake stop, then reverse.
  const forwardHeld = Boolean(controls.gas) || Boolean(controls.right);
  // Either back control is enough to roll the other way.
  const backHeld = Boolean(controls.brake) || Boolean(controls.left);
  const grounded = run.wheels.some(w => tireSunk(run, w) > -2);
  const first = run.wheels[0], last = run.wheels.at(-1);
  // Align to the wheel footprint, not a single bump below the centre.
  const hill = Math.atan2(roadY(run.x+last.x)-roadY(run.x+first.x)
    -(last.y+last.r-first.y-first.r), last.x-first.x);
  const tangentSpeed = run.vx*Math.cos(hill)+run.vy*Math.sin(hill);
  // Opposing pedals brake. A direction change must pass through zero first.
  const requested = forwardHeld === backHeld ? 0 : (forwardHeld ? 1 : -1);
  const stopping = (forwardHeld && backHeld) || (requested !== 0 && tangentSpeed*requested < -1);
  const drive = !stopping && run.fuel > 0 ? requested : 0;
  const gas = forwardHeld && !backHeld;
  const brake = backHeld && !forwardHeld;
  if (grounded && drive) run.fuel = Math.max(0,run.fuel-vehicle.fuelBurn*step);

  // In the air the pedals spin the ride. On the road they lean it and also drive.
  if (!grounded) {
    // Gas lifts the nose for a backflip.
    if (gas) {
      // Spin nose-up at this ride's air rate.
      run.angVel -= vehicle.wheelie * step;
    }
    // Brake drops the nose for a front flip.
    if (brake) {
      // Spin nose-down at this ride's air rate.
      run.angVel += vehicle.noseDown * step;
    }
  } else {
    // Gas still leans the nose up, so a hard climb can leave the ground.
    if (gas) {
      // Mild ground lean; full rotation remains available in the air.
      run.angVel -= vehicle.wheelie * 0.015 * step;
    }
    // Brake pushes the nose down onto the slope.
    if (brake) {
      // A small nose-down. The big flip is reserved for the air.
      run.angVel += vehicle.noseDown * 0.015 * step;
    }
    // Pulls the body back toward the slope so it rides the hill.
    run.angVel += wrap(hill - run.angle) * vehicle.stick * 12 * step;
  }
  // Stops the spin from growing forever. Heavier rides damp faster.
  run.angVel *= Math.exp(-(vehicle.spinDamp + (grounded ? 7 : 0)) * step);

  // Gravity always pulls down the screen.
  run.vy += GRAVITY * step;
  if (grounded && stopping) {
    // Remove only along-road velocity, never push through zero into reverse.
    const change = -Math.sign(tangentSpeed)*Math.min(Math.abs(tangentSpeed),vehicle.brake*step);
    run.vx += Math.cos(hill)*change;
    run.vy += Math.sin(hill)*change;
  } else if (grounded && drive) {
    const push = vehicle.accel * (drive < 0 ? 0.65 : 1) * drive * step;
    run.vx += Math.cos(hill)*push;
    run.vy += Math.sin(hill)*push;
  }
  // Tires scrub speed. Air does not.
  if (grounded) {
    // Drag for this short step, stronger on heavy rides.
    const drag = Math.exp(-vehicle.drag * step);
    // Slows the horizontal part.
    run.vx *= drag;
    // Slows the vertical part.
    run.vy *= drag;
  }
  // Caps the speed so a long downhill does not become a blur.
  const speedNow = Math.hypot(run.vx, run.vy);
  // The cap depends on direction.
  const cap = run.vx < 0 ? vehicle.maxReverse : vehicle.maxSpeed;
  // Too fast.
  if (speedNow > cap) {
    // Scale both parts down together.
    run.vx *= cap / speedNow;
    // Same scale.
    run.vy *= cap / speedNow;
  }

  // Moves the body.
  run.x += run.vx * step;
  // Up or down.
  run.y += run.vy * step;
  // Applies the spin.
  run.angle += run.angVel * step;

  // Pushes any buried tire back onto the road.
  let crashed = false;
  // Resolve each pictured axle from rear to front.
  run.wheels.forEach((contact) => {
    // This tire after the move.
    const wheel = wheelPoint(run, contact);
    // The road under it.
    const road = roadY(wheel.x);
    // How far the tire has sunk. Above the road this is negative.
    const sunk = wheel.y + contact.r - road;
    // Only a tire inside the ground needs a push.
    if (sunk <= 0) {
      // This tire is clear.
      return;
    }
    // The slope at the contact.
    const slope = roadSlope(wheel.x);
    // Upside-down contacts cannot lift the roof clear before its collision test.
    if (upsideDown(run.angle, slope)) return;
    // Length of the uphill normal.
    const len = Math.sqrt(1 + slope * slope);
    // The normal points up out of the road. Y grows downward, so up is negative.
    const nx = slope / len;
    // The upward part.
    const ny = -1 / len;
    // Lifts the body out by the depth of the tire.
    run.x += nx * sunk / len;
    // The vertical part of that lift.
    run.y += ny * sunk / len;
    // Speed into the road, along the normal. Negative means sinking.
    const into = run.vx * nx + run.vy * ny;
    // Removes only the part that is digging in.
    if (into < 0) {
      // Cancel the horizontal dig.
      run.vx -= into * nx;
      // Cancel the vertical dig.
      run.vy -= into * ny;
    }
  });
  // Roof landmarks are in the same local coordinates used to draw this ride.
  vehicle.roof.forEach(([lx, ly]) => {
    // Already lost.
    if (crashed) {
      // Skip the rest.
      return;
    }
    // This spot on the roof, in the world.
    const roof = localPoint(run, lx, ly);
    // The slope under that spot.
    const slope = roadSlope(roof.x);
    // The roof is in the dirt, and the cabin is upside down.
    if (roof.y > roadY(roof.x) && upsideDown(run.angle, slope)) {
      // The roof hit the road.
      crashed = true;
    }
  });
  // The landing was too crooked.
  if (crashed) {
    // The ride is over.
    run.over = true;
    // The end card names a flip.
    run.endReason = "flip";
    // Tells the screen.
    return "crash";
  }

  // Picks up a can when the body is close to it.
  let picked = false;
  // Cans near the rider.
  run.cans.forEach((can) => {
    // An empty can stays on the road but does nothing.
    if (can.taken) {
      // Skip it.
      return;
    }
    // Horizontal gap.
    const dx = can.x - run.x;
    // The can floats a little above the road.
    const dy = roadY(can.x) - 36 - run.y;
    // Close enough to collect.
    if (dx * dx + dy * dy < CAN_REACH * CAN_REACH) {
      // The can is used up.
      can.taken = true;
      // Fills the tank, but not past full.
      run.fuel = Math.min(FUEL_MAX, run.fuel + CAN_FUEL);
      // This frame should beep.
      picked = true;
    }
  });

  // Speed after the road has pushed back.
  const speed = Math.hypot(run.vx, run.vy);
  // An empty tank that has rolled to a stop ends the ride.
  if (run.fuel <= 0 && speed < STOP_SPEED) {
    // Counts the stopped time.
    run.still += step;
    // Long enough to count as stuck.
    if (run.still > STOP_TIME) {
      // Out of fuel.
      run.over = true;
      // The end card names the empty tank.
      run.endReason = "fuel";
      // Tells the screen.
      return "crash";
    }
  } else {
    // Moving again clears the timer.
    run.still = 0;
  }

  // Cans farther ahead.
  ensureCans(run);
  // A pickup, or an ordinary frame.
  return picked ? "fuel" : "run";
}

// How far a tire has sunk into the road. Negative means it is above the road.
function tireSunk(run, contact) {
  const wheel = wheelPoint(run, contact);
  return wheel.y + contact.r - run.terrain.heightAt(wheel.x);
}

// The whole number shown to the player. It is the distance along the road.
export function shownScore(run) {
  // 40 is the starting x, so the score opens at zero.
  return Math.min(MAX_SCORE, Math.max(0, Math.floor((run.x - 40) / METERS)));
}
