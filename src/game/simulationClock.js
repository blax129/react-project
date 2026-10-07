// Physics always runs at 120 Hz, independent of display refresh rate.
export const FIXED_STEP = 1 / 120;
const MAX_CATCH_UP = 0.1;
export function createSimulationClock() {
  let remainder = 0;
  return {
    reset() { remainder = 0; },
    advance(elapsed, tick) {
      if (!Number.isFinite(elapsed) || elapsed <= 0) return;
      // Discard long interruptions instead of charging fuel or teleporting.
      if (elapsed > 0.25) { remainder = 0; return; }
      remainder += Math.min(elapsed, MAX_CATCH_UP);
      while (remainder + 1e-10 >= FIXED_STEP) {
        remainder = Math.max(0, remainder - FIXED_STEP);
        if (tick(FIXED_STEP) === false) { remainder = 0; break; }
      }
    },
  };
}
