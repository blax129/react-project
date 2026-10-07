// Count only active, visible time so loading or switching apps never skips the start.
export function createCountdown() {
  // Three complete seconds separate ready assets from active physics.
  let remaining = 3;
  // Expose a tiny state machine that can be tested without a browser.
  return {
    // The overlay shows 3, 2, 1, then disappears at zero.
    get value() { return Math.max(0, Math.ceil(remaining - 1e-9)); },
    // Ignore suspended time and long animation gaps.
    advance(dt, active = true) {
      // Short frame gaps advance normally; hidden or stalled frames do not.
      if (active && Number.isFinite(dt) && dt > 0 && dt <= .25) remaining = Math.max(0, remaining - dt);
      // Return the updated number for React's overlay.
      return this.value;
    // Finish the active-time update.
    },
  // Finish the countdown interface.
  };
// Finish countdown construction.
}
