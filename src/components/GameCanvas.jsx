// React helpers for the canvas element and the animation loop.
import { useEffect, useRef } from "react";
// The picture size.
import { WORLD_H, WORLD_W } from "../game/constants";
// One frame of movement, and the whole-number score.
import { createRun, shownScore, stepRun } from "../game/world";
// The Lagos name at the korope's position.
import { areaAt } from "../game/areas";
// The drawing function.
import { drawWorld } from "../game/draw";
// The beeps.
import { playCrash, playFuel, unlockSound } from "../game/sound";

// The road. React does not redraw this every score change. The loop does.
export default function GameCanvas({ runId, vehicleId, visible, pausedRef, controlsRef, onScore, onFuel, onArea, onOver, onTogglePause }) {
  // The canvas element.
  const canvasRef = useRef(null);
  // The ride the player picked. A ref so the loop can read it without restarting.
  const vehicleRef = useRef(vehicleId);
  // Keeps the ride id current when the parent changes it.
  vehicleRef.current = vehicleId;
  // The latest fit function, so showing the road again can resize it.
  const fitRef = useRef(() => {});
  // The latest score callback, so the loop does not restart when the parent renders.
  const onScoreRef = useRef(onScore);
  // The latest fuel callback.
  const onFuelRef = useRef(onFuel);
  // The latest place-name callback.
  const onAreaRef = useRef(onArea);
  // The latest crash callback.
  const onOverRef = useRef(onOver);
  // The latest pause callback.
  const onPauseRef = useRef(onTogglePause);
  // Keeps the score callback current.
  onScoreRef.current = onScore;
  // Keeps the fuel callback current.
  onFuelRef.current = onFuel;
  // Keeps the place-name callback current.
  onAreaRef.current = onArea;
  // Keeps the crash callback current.
  onOverRef.current = onOver;
  // Keeps the pause callback current.
  onPauseRef.current = onTogglePause;

  // Starts one run when this canvas is mounted, and when Restart changes runId.
  useEffect(() => {
    // The canvas from this render.
    const canvas = canvasRef.current;
    // The drawing pen.
    const ctx = canvas.getContext("2d");
    // A new run with the ride the player picked.
    const run = createRun(vehicleRef.current);
    // The browser's request id, so cleanup can stop the loop.
    let frame = 0;
    // The time of the previous frame.
    let last = performance.now();
    // The last time React was told the score.
    let lastScoreAt = 0;
    // False after cleanup, so a late frame does nothing.
    let alive = true;

    // Matches the canvas pixels to the box on the page.
    function fit() {
      // The box around the canvas.
      const width = canvas.parentElement.clientWidth;
      // A hidden leaderboard visit reports no width. Keep the old picture size.
      if (width < 10) {
        // Leaves the canvas pixels alone.
        return;
      // Closes the block above.
      }
      // The height that keeps the 960 by 480 picture.
      let height = width * (WORLD_H / WORLD_W);
      // How tall the window is, including a phone's dynamic toolbar.
      const viewH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      // 120 leaves room for the score bar and safe edges on a short phone.
      const room = viewH - 120;
      // Shrink the picture on landscape phones so the pedals stay on screen.
      if (room > 120 && height > room) {
        // Cap to the free height.
        height = room;
      // Closes the block above.
      }
      // Phone screens use more pixels than CSS pixels. Cap it so the picture stays light.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The real pixel width.
      canvas.width = Math.floor(width * dpr);
      // The real pixel height.
      canvas.height = Math.floor(height * dpr);
      // The CSS width follows the page.
      canvas.style.width = "100%";
      // The CSS height matches the picture shape.
      canvas.style.height = `${height}px`;
      // Drawing commands stay in the 960 by 480 game units.
      ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
    // Closes the block above.
    }

    // Remembers fit so a later visibility change can call it.
    fitRef.current = fit;
    // Sizes the canvas before the first frame.
    fit();
    // Sizes it again when the window changes.
    window.addEventListener("resize", fit);
    // Phones fire this when the address bar shows or hides.
    if (window.visualViewport) {
      // Same fit when the visible height changes.
      window.visualViewport.addEventListener("resize", fit);
    // Closes the block above.
    }

    // One animation frame.
    function loop(now) {
      // Stopped canvases do not schedule more frames.
      if (!alive) {
        // Leaves the loop.
        return;
      // Closes the block above.
      }
      // Asks for the next frame.
      frame = requestAnimationFrame(loop);
      // A paused run stays on the current picture.
      if (pausedRef.current) {
        // Draws the same hills with the Paused label. Pedals stay held.
        drawWorld(ctx, run, true, vehicleRef.current);
        // Skips movement.
        return;
      // Closes the block above.
      }
      // Seconds since the last frame. Capped so a hidden tab does not teleport the tricycle.
      const dt = Math.min(0.033, (now - last) / 1000);
      // Remembers this frame's time.
      last = now;
      // Gas and brake stay true for as long as the pedal is held.
      const result = stepRun(run, dt, controlsRef.current);
      // A fuel can gets a short blip.
      if (result === "fuel") {
        // Plays it.
        playFuel();
      // Closes the block above.
      }
      // A flip or an empty tank ends the run.
      if (result === "crash") {
        // Plays the low buzz.
        playCrash();
        // The whole-number score, which is the distance.
        const points = shownScore(run);
        // Updates the number above the road.
        onScoreRef.current(points);
        // The tank at the moment the run ended.
        onFuelRef.current(run.fuel);
        // The area where the run ended.
        onAreaRef.current(areaAt(run.x).name);
        // Opens the game-over panel and tells it why the run ended.
        onOverRef.current(points, run.endReason);
      } else if (now - lastScoreAt > 100) {
        // Remembers when the score text last changed.
        lastScoreAt = now;
        // Updates the number about ten times a second, not every frame.
        onScoreRef.current(shownScore(run));
        // The tank, on the same slow tick as the score.
        onFuelRef.current(run.fuel);
        // The part of Lagos under the korope.
        onAreaRef.current(areaAt(run.x).name);
      // Closes the block above.
      }
      // Draws the road after the move. The ride matches the picker.
      drawWorld(ctx, run, false, vehicleRef.current);
    // Closes the block above.
    }

    // The first frame.
    frame = requestAnimationFrame(loop);

    // Keys that push the gas pedal.
    const gasKeys = ["ArrowRight", "ArrowUp", "KeyD", "Space"];
    // Keys that push the brake.
    const brakeKeys = ["ArrowLeft", "ArrowDown", "KeyA"];

    // Keyboard controls. They listen on the window so the canvas does not need focus.
    function onKeyDown(event) {
      // Gas or brake. Arrow keys would otherwise scroll the page.
      if (gasKeys.includes(event.code) || brakeKeys.includes(event.code)) {
        // Stops the page from scrolling.
        event.preventDefault();
        // A key is a user gesture, so sound is allowed after this.
        unlockSound();
      // Closes the block above.
      }
      // Holds the gas while the key is down.
      if (gasKeys.includes(event.code)) {
        // The physics reads this every frame.
        controlsRef.current.gas = true;
      // Closes the block above.
      }
      // Holds the brake while the key is down.
      if (brakeKeys.includes(event.code)) {
        // The physics reads this every frame.
        controlsRef.current.brake = true;
      // Closes the block above.
      }
      // P pauses or resumes. A finished run ignores it.
      if (event.code === "KeyP" && !run.over) {
        // Tells the parent to flip the pause flag.
        onPauseRef.current();
      // Closes the block above.
      }
    // Closes the block above.
    }

    // Letting go of a key releases that pedal.
    function onKeyUp(event) {
      // Releases the gas.
      if (gasKeys.includes(event.code)) {
        // The moruwa stops accelerating.
        controlsRef.current.gas = false;
      // Closes the block above.
      }
      // Releases the brake.
      if (brakeKeys.includes(event.code)) {
        // The moruwa stops braking.
        controlsRef.current.brake = false;
      // Closes the block above.
      }
    // Closes the block above.
    }

    // Starts listening for keys.
    window.addEventListener("keydown", onKeyDown);
    // Starts listening for releases.
    window.addEventListener("keyup", onKeyUp);

    // React calls this when the run is thrown away.
    return () => {
      // Blocks a frame that was already queued.
      alive = false;
      // Cancels that frame.
      cancelAnimationFrame(frame);
      // Stops the resize listener.
      window.removeEventListener("resize", fit);
      // Stops the phone viewport listener.
      if (window.visualViewport) {
        // Same fit cleanup.
        window.visualViewport.removeEventListener("resize", fit);
      // Closes the block above.
      }
      // Stops the key listeners.
      window.removeEventListener("keydown", onKeyDown);
      // And the releases.
      window.removeEventListener("keyup", onKeyUp);
    // Closes this object.
    };
    // A new runId starts a new loop. Pause and score updates do not.
  }, [runId, pausedRef, controlsRef]);

  // The road is hidden on the leaderboard, so measure it again when it returns.
  useEffect(() => {
    // Only a visible road has a real width.
    if (visible) {
      // Applies the current page width.
      fitRef.current();
    // Closes the block above.
    }
  }, [visible]);

  // Presses a pedal and keeps the events on that button until the finger lifts.
  function pedalDown(event, name) {
    // A phone tap should not scroll the page.
    event.preventDefault();
    // The first tap may unlock sound.
    unlockSound();
    // Later move and lift events stay on this button.
    event.currentTarget.setPointerCapture(event.pointerId);
    // Holds that pedal.
    controlsRef.current[name] = true;
  // Closes the block above.
  }

  // Releases a pedal.
  function pedalUp(name) {
    // Lets go.
    controlsRef.current[name] = false;
  // Closes the block above.
  }

  // The picture, with Left/Brake on the left thumb and Right/Gas on the right.
  return (
    // The box that gives the canvas its width.
    <div className="stage">
      {/* The hills. */}
      <canvas ref={canvasRef} aria-label="Korope hills" />
      {/* Left thumb: back along the road, and brake in the air. */}
      <div className="pedals pedals-left">
        {/* Back along the road. */}
        <button
          className="pedal left"
          type="button"
          onPointerDown={(event) => pedalDown(event, "left")}
          onPointerUp={() => pedalUp("left")}
          onPointerCancel={() => pedalUp("left")}
        >
          Left
        {/* Closes the button. */}
        </button>
        {/* Brake. On the road it rolls back. In the air it tips the nose down. */}
        <button
          className="pedal brake"
          type="button"
          onPointerDown={(event) => pedalDown(event, "brake")}
          onPointerUp={() => pedalUp("brake")}
          onPointerCancel={() => pedalUp("brake")}
        >
          Brake
        {/* Closes the button. */}
        </button>
      {/* Closes the left cluster. */}
      </div>
      {/* Right thumb: forward along the road, and gas in the air. */}
      <div className="pedals pedals-right">
        {/* Forward along the road. */}
        <button
          className="pedal right"
          type="button"
          onPointerDown={(event) => pedalDown(event, "right")}
          onPointerUp={() => pedalUp("right")}
          onPointerCancel={() => pedalUp("right")}
        >
          Right
        {/* Closes the button. */}
        </button>
        {/* Gas. On the road it climbs. In the air it tips the nose up. */}
        <button
          className="pedal gas"
          type="button"
          onPointerDown={(event) => pedalDown(event, "gas")}
          onPointerUp={() => pedalUp("gas")}
          onPointerCancel={() => pedalUp("gas")}
        >
          Gas
        {/* Closes the button. */}
        </button>
      {/* Closes the right cluster. */}
      </div>
    {/* Closes this box. */}
    </div>
  // Closes this call.
  );
// Closes the block above.
}
