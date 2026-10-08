// The test driver reacts to the same fixed warning locations shown to players.
import { hazardsNear } from '../../src/game/hazards.js';
import { groundY, groundSlope } from '../../src/game/world.js';

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function careful(r, v) {
  const c = Math.cos(r.angle),
    s = Math.sin(r.angle);
  const grounded = r.wheels.some((w) => r.y + w.x * s + w.y * c + w.r > groundY(r.x + w.x * c - w.y * s) - 2);
  if (!grounded) {
    const target = Math.atan(groundSlope(r.x + r.vx * 0.18));
    const correction = wrap(target - r.angle) - r.angVel * 0.3;
    return { gas: correction < -0.06, brake: correction > 0.06 };
  }
  const police =
    r.hazardsEnabled && hazardsNear(r.x, 200, 400).find((h) => h.type === 'police' && !r.clearedCheckpoints.has(h.id));
  if (police) {
    // Crawl into the inspection box first — do not stall on the slope before it.
    if (r.x < police.x - 50) {
      const target = r.x < police.x - 160 ? 80 : 35;
      if (r.vx > target + 6) return { gas: false, brake: true };
      if (r.vx < target - 5) return { gas: true, brake: false };
      return { gas: false, brake: false };
    }
    // Inside the box: release pedals until the barrier opens.
    return {};
  }
  const debris = r.hazardsEnabled && hazardsNear(r.x, 120, 350).find((h) => h.type === 'debris' && h.x + h.width >= r.x);
  if (debris) return { gas: r.vx < 72, brake: r.vx > 90 };

  // Slow rides need a shorter look-ahead so they do not brake early and waste tank time.
  const lookNear = v.maxSpeed < 220 ? 55 : 75;
  const lookFar = v.maxSpeed < 220 ? 95 : 110;
  const now = groundSlope(r.x);
  const near = Math.max(groundSlope(r.x + 45), groundSlope(r.x + lookNear), groundSlope(r.x + lookFar));
  // Low fuel: keep rolling toward the next can instead of soft braking on mild lips.
  const thirsty = r.fuel < 32;
  // Detect lips earlier on tall peaks so Brake plants before the height risk spikes.
  const atLip = near > 0.35 && now > -0.12;
  if (atLip && !thirsty) {
    if (r.vx > 95) return { gas: false, brake: true };
    if (r.vx < 45) return { gas: true, brake: false };
    return { gas: false, brake: false };
  }
  // Climbing: build speed; taller slopes need Gas held until the lip warning.
  if (near > 0.35 && now <= -0.12) {
    return { gas: r.vx < v.maxSpeed * 0.95, brake: false };
  }
  // Slow vehicles cruise closer to their ceiling so timed clears stay reachable.
  const cruise = v.maxSpeed < 220 ? 0.95 : 0.86;
  const target = near > 0.85 ? Math.min(125, v.maxSpeed * 0.98) : v.maxSpeed * cruise;
  if (r.vx > target + 20) return { gas: false, brake: true };
  if (r.vx < target - 8) return { gas: true, brake: false };
  return { gas: false, brake: false };
}
