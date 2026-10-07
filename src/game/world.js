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

// The road height at this x. Smaller y is higher on the screen.
export function groundY(x) {
  // The flat starting height.
  const base = 340;
  // Roughness stays light for a short opening, then comes in quickly.
  const fade = clamp((x - 80) / 280, 0, 1);
  // 0 in CMS, 1 by Epe. Later areas grow taller hills.
  const hard = hardship(x);
  // 14 is the gentle opening. 52 is the extra height by Epe, still low enough to climb.
  const amp = (14 + hard * 52) * fade;
  // A long roll.
  const roll = Math.sin(x / 170) * amp;
  // Medium bumps, stronger than the long roll so the surface is uneven.
  const bump = Math.sin(x / (64 - hard * 16) + 0.8) * amp * (0.34 + hard * 0.16);
  // Close bumps, about one wheelbase apart, so the tires rise and fall.
  const rough = Math.sin(x / 42) * (5 + hard * 5) * fade;
  // A finer chatter on top of those bumps. Kept small so it shakes the ride without throwing it.
  const chatter = Math.sin(x / 24 + 2.1) * (1.8 + hard * 1.6) * fade;
  // Sharp crowns. These are the hills that throw the korope if the gas stays down.
  const crown = Math.pow(Math.max(0, Math.sin(x / 240)), 2) * amp * (0.28 + hard * 0.4);
  // Up the screen is a smaller y.
  return base - roll - bump - rough - chatter - crown - launchHeight(x);
}

// A short ramp and a sudden drop. Fast riders leave the road here.
function launchHeight(x) {
  // The opening stretch stays smooth so the first seconds are for learning the pedals.
  if (x < 800) {
    // No ramp yet.
    return 0;
  }
  // 0 in CMS, 1 by Epe.
  const hard = hardship(x);
  // Ramps start 1500 units apart and move closer. 520 is how much that gap shrinks.
  const period = 1500 - hard * 520;
  // Position inside the current gap.
  const p = ((x % period) + period) % period;
  // Short ramps at the start. By Epe they are much taller.
  const height = 18 + hard * 46;
  // The climb stays long enough to drive up.
  const climb = 220;
  // The lip gets shorter later, so the drop is sharper. 16 is the most it shrinks.
  const lip = 42 - hard * 16;
  // Rises toward the lip.
  if (p < climb) {
    // The climb.
    return (p / climb) * height;
  }
  // The lip. A short drop is what throws the korope.
  if (p < climb + lip) {
    // Drops back to the rolling hills.
    return height * (1 - (p - climb) / lip);
  }
  // Ordinary road until the next ramp.
  return 0;
}

// How steep the road is. Positive means the road drops as x grows.
export function groundSlope(x) {
  // A short sample on each side of the wheel.
  return (groundY(x + 8) - groundY(x - 8)) / 16;
}

// Builds a fresh ride. vehicleId picks which handling and wheel size to use.
export function createRun(vehicleId) {
  // The ride from the picker. Unknown ids fall back to the korope.
  const vehicle = getVehicle(vehicleId);
  // The object stepRun changes every frame.
  const run = {
    // Which ride this is, so every frame can read its handling.
    vehicleId: vehicle.id,
    // Half the wheelbase for this ride.
    wheelX: vehicle.wheelX,
    // How far the tires sit below the body center.
    wheelY: vehicle.wheelY,
    // Tire radius for this ride.
    wheelR: vehicle.wheelR,
    // Along the road.
    x: 40,
    // Near the road. reseat drops the tires onto it.
    y: groundY(40) - 40,
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

// One wheel in world coordinates. side is -1 for the back wheel and 1 for the front.
function wheelPoint(run, side) {
  // The wheel sits wheelX ahead or behind, and wheelY below the middle.
  return localPoint(run, side * run.wheelX, run.wheelY);
}

// True when the roof faces the road instead of the sky.
function upsideDown(angle, slope) {
  // The lean is measured from the slope, so a tilted hill is not upside down by itself.
  return Math.abs(wrap(angle - Math.atan(slope))) > TUMBLE;
}

// Moves the body so the lower wheel sits on the road.
function reseat(run) {
  // How far the body must rise. Y grows downward, so rising subtracts.
  let lift = 0;
  // Both wheels.
  [-1, 1].forEach((side) => {
    // This wheel.
    const wheel = wheelPoint(run, side);
    // How far the tire has sunk through the road.
    const sunk = wheel.y + run.wheelR - groundY(wheel.x);
    // The deeper wheel decides the lift.
    if (sunk > lift) {
      // Remember that depth.
      lift = sunk;
    }
  });
  // Pulls the body up out of the road.
  run.y -= lift;
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

// Keeps a number between two limits.
function clamp(value, low, high) {
  // The limited number.
  return Math.max(low, Math.min(high, value));
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
  const step = Math.min(0.033, dt);
  // Right and Gas both drive toward the nose. Left and Brake both drive back along the road.
  const forwardHeld = Boolean(controls.gas) || Boolean(controls.right);
  // Either back control is enough to roll the other way.
  const backHeld = Boolean(controls.brake) || Boolean(controls.left);
  // Forward drive only works while fuel remains.
  const gas = forwardHeld && run.fuel > 0;
  // The back pedals always work.
  const brake = backHeld;
  // Holding a forward pedal burns fuel at this ride's rate.
  if (forwardHeld && run.fuel > 0) {
    // The tank falls, and it cannot go below empty.
    run.fuel = Math.max(0, run.fuel - vehicle.fuelBurn * step);
  }
  // How deep each tire is right now. A negative number means the tire is in the air.
  const backBefore = tireSunk(run, -1);
  // The front tire.
  const frontBefore = tireSunk(run, 1);
  // Touching means the tire has met the road, with a small grace so it does not chatter.
  const grounded = backBefore > -3 || frontBefore > -3;
  // The slope under the body, used to settle the wheels.
  const hill = Math.atan(groundSlope(run.x));

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
      // A small wheelie. 0.08 keeps the nose from flipping while the tires are down.
      run.angVel -= vehicle.wheelie * 0.08 * step;
    }
    // Brake pushes the nose down onto the slope.
    if (brake) {
      // A small nose-down. The big flip is reserved for the air.
      run.angVel += vehicle.noseDown * 0.08 * step;
    }
    // Pulls the body back toward the slope so it rides the hill.
    run.angVel += wrap(hill - run.angle) * vehicle.stick * step;
  }
  // Stops the spin from growing forever. Heavier rides damp faster.
  run.angVel *= Math.exp(-vehicle.spinDamp * step);

  // Gravity always pulls down the screen.
  run.vy += GRAVITY * step;
  // Drive force points out of the nose.
  if (grounded && gas) {
    // Forward.
    run.vx += Math.cos(run.angle) * vehicle.accel * step;
    // The matching vertical part when the nose is tilted.
    run.vy += Math.sin(run.angle) * vehicle.accel * step;
  }
  // Brake pushes the other way and can roll backward.
  if (grounded && brake) {
    // Backward.
    run.vx -= Math.cos(run.angle) * vehicle.brake * step;
    // The matching vertical part.
    run.vy -= Math.sin(run.angle) * vehicle.brake * step;
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
  // Both wheels, back then front.
  [-1, 1].forEach((side) => {
    // This tire after the move.
    const wheel = wheelPoint(run, side);
    // The road under it.
    const road = groundY(wheel.x);
    // How far the tire has sunk. Above the road this is negative.
    const sunk = wheel.y + run.wheelR - road;
    // Only a tire inside the ground needs a push.
    if (sunk <= 0) {
      // This tire is clear.
      return;
    }
    // The slope at the contact.
    const slope = groundSlope(wheel.x);
    // Landing with the roof toward the road is the loss. A steep tilt still rolls back onto the wheels.
    if (upsideDown(run.angle, slope)) {
      // The korope is upside down on the road.
      crashed = true;
      // Leave the body where it fell instead of planting the wheels.
      return;
    }
    // Length of the uphill normal.
    const len = Math.sqrt(1 + slope * slope);
    // The normal points up out of the road. Y grows downward, so up is negative.
    const nx = slope / len;
    // The upward part.
    const ny = -1 / len;
    // Lifts the body out by the depth of the tire.
    run.x += nx * sunk;
    // The vertical part of that lift.
    run.y += ny * sunk;
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
  // The roof. These points sit above the cabin before the korope rotates.
  [[-48, -30], [0, -32], [42, -28]].forEach(([lx, ly]) => {
    // Already lost.
    if (crashed) {
      // Skip the rest.
      return;
    }
    // This spot on the roof, in the world.
    const roof = localPoint(run, lx, ly);
    // The slope under that spot.
    const slope = groundSlope(roof.x);
    // The roof is in the dirt, and the cabin is upside down.
    if (roof.y > groundY(roof.x) && upsideDown(run.angle, slope)) {
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
    const dy = groundY(can.x) - 36 - run.y;
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
function tireSunk(run, side) {
  // The tire's place.
  const wheel = wheelPoint(run, side);
  // Depth under the surface.
  return wheel.y + run.wheelR - groundY(wheel.x);
}

// The whole number shown to the player. It is the distance along the road.
export function shownScore(run) {
  // 40 is the starting x, so the score opens at zero.
  return Math.min(MAX_SCORE, Math.max(0, Math.floor((run.x - 40) / METERS)));
}
