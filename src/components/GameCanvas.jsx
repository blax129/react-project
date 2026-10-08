// Countdown time and visual exhaust stay separate from driving physics.
import { createCountdown } from "../game/countdown";
// Update bounded, vehicle-specific smoke only during active driving.
import { createExhaust, stepExhaust } from "../game/exhaust";
// Road hazards override normal hill advice while a decision is close.
import { hazardCue } from "../game/hazards";
import { terrainCue } from "../game/terrain";
import { createSimulationClock } from "../game/simulationClock";
import { createInputState, GAS_KEYS, BRAKE_KEYS } from "../game/controls";
// React helpers for the canvas element and the animation loop.
import { useEffect, useRef, useState } from "react";
// The picture size.
import { WORLD_H, WORLD_W } from "../game/constants";
// One frame of movement, and the whole-number score.
import { createRun, shownScore, stepRun } from "../game/world";
// The Lagos name at the korope's position.
import { areaLabel } from "../game/areas";
// The drawing function.
import { drawWorld } from "../game/draw";
// The beeps.
import { playCrash, playFuel, unlockSound } from "../game/sound";

import { vehicleImages } from "../game/vehicleImages";
import { getVehicle } from "../game/vehicles";

// The road. React does not redraw this every score change. The loop does.
export default function GameCanvas({ runId, vehicleId, visible, pausedRef, controlsRef, onScore, onFuel, onArea, onChallenge, onOver, onTogglePause }) {
  // The canvas element.
  const canvasRef = useRef(null);
  const [assetState, setAssetState] = useState("loading");
  // Display the countdown only after the vehicle image has decoded.
  const [countdown, setCountdown] = useState(3);
  const [retry, setRetry] = useState(0);
  const readyRef = useRef(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const inputRef = useRef(null);
  const overRef = useRef(false);
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
  const onChallengeRef = useRef(onChallenge);
  onChallengeRef.current = onChallenge;
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
    // Each restart gets fresh particles and a complete countdown.
    run.exhaust = createExhaust();
    const launch = createCountdown();
    const vehicle = getVehicle(vehicleRef.current);
    setCountdown(3);
    overRef.current = false;
    const clock = createSimulationClock();
    const input = createInputState(controlsRef.current);
    input.clear();
    inputRef.current = input;
    // The browser's request id, so cleanup can stop the loop.
    let frame = 0;
    // The time of the previous frame.
    let last = performance.now();
    // The last time React was told the score.
    let lastScoreAt = 0;
    // False after cleanup, so a late frame does nothing.
    let alive = true;
    let ready = false;
    readyRef.current = false;
    setAssetState("loading");
    vehicleImages.load(getVehicle(vehicleRef.current).url).then(() => {
      if (!alive) return;
      ready = true; readyRef.current = false; input.clear(); clock.reset(); last = performance.now();
      setAssetState("ready");
    }).catch(() => { if (alive) setAssetState("error"); });

    // Matches the canvas pixels to the box on the page.
    function fit() {
      // The box around the canvas.
      const availableWidth = canvas.parentElement.parentElement.clientWidth;
      let width = availableWidth;
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
      const room = viewH - (canvas.getBoundingClientRect().top + window.scrollY) - 12;
      // Shrink the picture on landscape phones so the pedals stay on screen.
      if (room > 120 && height > room) {
        // Cap to the free height.
        height = room;
        width = height * WORLD_W / WORLD_H;
      // Closes the block above.
      }
      // Phone screens use more pixels than CSS pixels. Cap it so the picture stays light.
      const dpr = Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2);
      // The real pixel width.
      canvas.parentElement.style.width = `${width}px`;
      canvas.parentElement.style.marginInline = "auto";
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
      const dt = (now-last)/1000;
      last = now;
      if (!ready || pausedRef.current || !visibleRef.current || document.hidden) {
        input.clear();
        clock.reset();
        if (visibleRef.current) drawWorld(ctx,run,pausedRef.current,vehicleRef.current);
        return;
      }
      // Freeze score, fuel and vehicle motion until all three seconds have elapsed.
      if (launch.value > 0) {
        // Clear any held pedal so the start cannot inherit accidental input.
        input.clear(); clock.reset();
        // Advance only while visible, loaded and unpaused, as checked above.
        const number = launch.advance(dt);
        // React updates only when the displayed whole number changes.
        setCountdown(previous => previous === number ? previous : number);
        // Enable input exactly when the last countdown second finishes.
        readyRef.current = number === 0;
        // Keep the opening world visible under the overlay.
        drawWorld(ctx, run, false, vehicleRef.current);
        // The first physics tick happens on the next animation frame.
        return;
      }
      let result = "idle";
      clock.advance(dt, (step) => {
        const event = stepRun(run,step,controlsRef.current);
        // Exhaust changes with throttle and body angle without changing handling.
        stepExhaust(run.exhaust, step, run, vehicle, controlsRef.current);
        if (event === "crash") { result=event; return false; }
        if (event === "fuel" || result === "idle") result=event;
      });
      // A fuel can gets a short blip.
      if (result === "fuel") {
        // Plays it.
        playFuel();
      // Closes the block above.
      }
      // A flip or an empty tank ends the run.
      if (result === "crash") {
        overRef.current = true;
        input.clear();
        // Plays the low buzz.
        playCrash();
        // The whole-number score, which is the distance.
        const points = shownScore(run);
        // Updates the number above the road.
        onScoreRef.current(points);
        // The tank at the moment the run ended.
        onFuelRef.current(run.fuel);
        // The area where the run ended.
        onAreaRef.current(areaLabel(run.x));
        onChallengeRef.current?.(hazardCue(run) || terrainCue(run.x));
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
        onAreaRef.current(areaLabel(run.x));
        onChallengeRef.current?.(hazardCue(run) || terrainCue(run.x));
      // Closes the block above.
      }
      // Draws the road after the move. The ride matches the picker.
      drawWorld(ctx, run, false, vehicleRef.current);
    // Closes the block above.
    }

    // The first frame.
    frame = requestAnimationFrame(loop);

    function onKeyDown(event) {
      // Settings owns keyboard input while open; P must not resume driving behind it.
      if (document.querySelector("dialog[open]")) return;
      if (!ready || !visibleRef.current || document.hidden || run.over) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (event.code === "KeyP") {
        if (!event.repeat) { input.clear(); clock.reset(); last=performance.now(); onPauseRef.current(); }
        return;
      }
      // Countdown accepts pause, but no driving keys.
      if (launch.value > 0) { if (GAS_KEYS.includes(event.code) || BRAKE_KEYS.includes(event.code)) event.preventDefault(); return; }
      if (pausedRef.current || (event.code === "Space" && event.target?.closest?.('button'))) return;
      const name = GAS_KEYS.includes(event.code) ? "gas" : BRAKE_KEYS.includes(event.code) ? "brake" : null;
      if (name) {
        event.preventDefault();
        unlockSound();
        // A held key must be released after a focus/pause interruption.
        if (!event.repeat) input.press(`key:${event.code}`,name);
      }
    }
    function onKeyUp(event) { input.release(`key:${event.code}`); }
    function suspend() {
      input.clear();
      clock.reset();
      last=performance.now();
      if (visibleRef.current && !run.over && !pausedRef.current) onPauseRef.current();
    }
    function onVisibility() { if (document.hidden) suspend(); }
    window.addEventListener("blur",suspend);
    document.addEventListener("visibilitychange",onVisibility);

    // Starts listening for keys.
    window.addEventListener("keydown", onKeyDown);
    // Starts listening for releases.
    window.addEventListener("keyup", onKeyUp);

    // React calls this when the run is thrown away.
    return () => {
      // Blocks a frame that was already queued.
      alive = false;
      input.clear();
      window.removeEventListener("blur",suspend);
      document.removeEventListener("visibilitychange",onVisibility);
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
  }, [runId, retry, pausedRef, controlsRef]);

  // The road is hidden on the leaderboard, so measure it again when it returns.
  useEffect(() => {
    // Only a visible road has a real width.
    inputRef.current?.clear();
    if (visible) {
      // Applies the current page width.
      fitRef.current();
    // Closes the block above.
    }
  }, [visible]);

  function pedalDown(event,name) {
    event.preventDefault();
    if (!readyRef.current || !visible || pausedRef.current || overRef.current || document.hidden) return;
    unlockSound();
    event.currentTarget.setPointerCapture(event.pointerId);
    inputRef.current?.press(`pointer:${event.pointerId}`,name);
  }
  function pedalUp(event) {
    inputRef.current?.release(`pointer:${event.pointerId}`);
  }

  // The picture, with Left/Brake on the left thumb and Right/Gas on the right.
  return (
    // The box that gives the canvas its width.
    <div className="stage">
      {/* The hills. */}
      <canvas ref={canvasRef} aria-label="Road Clear hills" />
      {assetState !== "ready" && <div className="vehicle-loading" role="status">{assetState === "error" ? <><p>Could not load your ride. Check your connection.</p><button className="button" onClick={() => setRetry(n => n + 1)}>Retry</button></> : "Loading your ride…"}</div>}
      {/* Large start lights announce each second while physics and fuel stay frozen. */}
      {assetState === "ready" && countdown > 0 && !pausedRef.current && <div className="start-countdown" role="status" aria-live="assertive" aria-atomic="true"><span>GET READY</span><strong key={countdown}>{countdown}</strong><small>Hold Gas when the countdown ends</small></div>}
      {/* Left thumb: back along the road, and brake in the air. */}
      <div className="pedals pedals-left">

        {/* Brake. On the road it rolls back. In the air it tips the nose down. */}
        <button
          // Lock pedals until the opening countdown completes.
          disabled={assetState !== "ready" || countdown > 0}
          className="pedal brake"
          type="button"
          onPointerDown={(event) => pedalDown(event, "brake")}
          onPointerUp={pedalUp}
          onPointerCancel={pedalUp}
          onLostPointerCapture={pedalUp}
        >
          Brake
        {/* Closes the button. */}
        </button>
      {/* Closes the left cluster. */}
      </div>
      {/* Right thumb: forward along the road, and gas in the air. */}
      <div className="pedals pedals-right">

        {/* Gas. On the road it climbs. In the air it tips the nose up. */}
        <button
          // Lock pedals until the opening countdown completes.
          disabled={assetState !== "ready" || countdown > 0}
          className="pedal gas"
          type="button"
          onPointerDown={(event) => pedalDown(event, "gas")}
          onPointerUp={pedalUp}
          onPointerCancel={pedalUp}
          onLostPointerCapture={pedalUp}
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
