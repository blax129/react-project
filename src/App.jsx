// Load private racing only when selected to keep solo startup light.
import { lazy, Suspense } from "react";
// Ojo Barracks is a separate multiplayer world.
const RaceRoom = lazy(() => import("./components/RaceRoom"));
// A prominent orientation reminder is shared with the opening screen.
import RotateTip from "./components/RotateTip";
// The opening HUD label follows the researched route instead of a hard-coded old name.
import { areaLabel } from "./game/areas";
import { terrainCue } from "./game/terrain";
// React state and the pedal flags that the canvas reads every frame.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
// The opening card.
import StartScreen from "./components/StartScreen";
// The score bar.
import Hud from "./components/Hud";
// The road.
import GameCanvas from "./components/GameCanvas";
// The end card.
import GameOver from "./components/GameOver";
// The score list.
import Leaderboard from "./components/Leaderboard";
// Sound on, sound off, and the first-gesture unlock.
import { setMuted as applyMute, unlockSound } from "./game/sound";
// The last ride the player picked.
import { VEHICLE_KEY, getVehicle } from "./game/vehicles";

// The browser key for the mute choice.
const MUTE_KEY = "moruwa-muted";

// The whole page. The canvas owns the moving road. This file owns the menus.
export default function App() {
  // start, play, or board.
  const [screen, setScreen] = useState(() => new URLSearchParams(window.location.search).has("room") ? "race" : "start");
  // True after the first run, so the road can stay mounted behind the leaderboard.
  const [started, setStarted] = useState(false);
  // Where Back on the leaderboard should return.
  const [returnTo, setReturnTo] = useState("start");
  // The sound choice. "yes" means muted.
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === "yes");
  // Changes when Restart should build a new run.
  const [runId, setRunId] = useState(1);
  // The ride on the road. Remembers the last pick in this browser.
  const [vehicleId, setVehicleId] = useState(() => getVehicle(localStorage.getItem(VEHICLE_KEY)).id);
  // The score text. The road updates this about ten times a second.
  const [score, setScore] = useState(0);
  // The tank, from 0 to 100. The road updates this with the score.
  const [fuel, setFuel] = useState(100);
  // The part of Lagos on screen. The road starts at Festac First Gate.
  const [area, setArea] = useState(areaLabel(40));
  const [challenge, setChallenge] = useState(() => terrainCue(40));
  // "flip" or "fuel", shown on the end card.
  const [endReason, setEndReason] = useState("");
  // running, paused, or over.
  const [phase, setPhase] = useState("running");
  // The same phase, readable inside a click before React draws again.
  const phaseRef = useRef("running");
  // Gas, brake, left, and right stay true while a pedal or a key is held.
  const controlsRef = useRef({ gas: false, brake: false, left: false, right: false });
  // The pause flag. A ref lets the loop see it without restarting.
  const pausedRef = useRef(false);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, [screen, runId]);

  // Tells the sound file whenever the button changes, and remembers the choice.
  useEffect(() => {
    // The beeps check this flag.
    applyMute(muted);
    // The next visit starts with the same choice.
    localStorage.setItem(MUTE_KEY, muted ? "yes" : "no");
  }, [muted]);

  // Flips the mute button.
  function onToggleMute() {
    // A click can also unlock sound for later beeps.
    unlockSound();
    // The next state is the opposite of this one.
    setMuted((current) => !current);
  // Closes the block above.
  }

  // Leaves the start card and begins a run with the ride the player picked.
  function onStart(pickedId) {
    // The first click may unlock sound.
    unlockSound();
    // The ride from the picker, or the last one this browser saved.
    const nextVehicle = getVehicle(pickedId || vehicleId).id;
    // Puts that ride on the road.
    setVehicleId(nextVehicle);
    // Remembers it for the next visit.
    localStorage.setItem(VEHICLE_KEY, nextVehicle);
    // The tricycle is not paused.
    pausedRef.current = false;
    // The run is moving.
    phaseRef.current = "running";
    // The score text starts at zero.
    setScore(0);
    // A full tank.
    setFuel(100);
    // The ride opens in Festac First Gate.
    setArea(areaLabel(40));
    setChallenge(terrainCue(40));
    // Clears a leftover crash reason from a previous end card.
    setEndReason("");
    // Lets go of every pedal so the first frame is still.
    controlsRef.current.gas = false;
    // The brake too.
    controlsRef.current.brake = false;
    // Left drives back along the road.
    controlsRef.current.left = false;
    // Right drives forward along the road.
    controlsRef.current.right = false;
    // The road is moving.
    setPhase("running");
    // A new id remounts the canvas after a menu return or a first start.
    setRunId((current) => current + 1);
    // Shows the road.
    setScreen("play");
    // Keeps the road mounted if the player opens the leaderboard after a crash.
    setStarted(true);
  // Closes the block above.
  }

  // Leaves the you-lost card and opens the ride picker again.
  function onMenu() {
    // A click can unlock sound for later beeps.
    unlockSound();
    // The old run is no longer paused.
    pausedRef.current = false;
    // Pause is allowed again on the next run.
    phaseRef.current = "running";
    // Lets go of every pedal.
    controlsRef.current.gas = false;
    controlsRef.current.brake = false;
    controlsRef.current.left = false;
    controlsRef.current.right = false;
    // Closes the end card when the player starts again.
    setPhase("running");
    // Clears the crash label.
    setEndReason("");
    // Shows the start card with the slideshow.
    setScreen("start");
  // Closes the block above.
  }

  // Pauses or resumes, unless the run is already over.
  function onTogglePause() {
    // A finished run stays on the game-over card.
    if (phaseRef.current === "over") {
      // Ignores P and the Pause button.
      return;
    // Closes the block above.
    }
    // Flips the flag the loop reads.
    pausedRef.current = !pausedRef.current;
    // The next phase name.
    const nextPhase = pausedRef.current ? "paused" : "running";
    // Remembers it before the button text changes.
    phaseRef.current = nextPhase;
    // The button word follows that flag.
    setPhase(nextPhase);
  // Closes the block above.
  }

  // The canvas calls this when the moruwa flips or the tank runs dry.
  function onOver(points, reason) {
    // Shows the final score even if the last text update was early.
    setScore(points);
    // flip or fuel.
    setEndReason(reason || "flip");
    // Blocks pause before the end card has drawn.
    phaseRef.current = "over";
    // Opens the end card.
    setPhase("over");
    // A crash is not a pause.
    pausedRef.current = false;
  // Closes the block above.
  }

  // Throws away the old run and starts another.
  function onRestart() {
    // The new run is moving.
    pausedRef.current = false;
    // Pause is allowed again on the new run.
    phaseRef.current = "running";
    // Lets go of every pedal so the new run starts still.
    controlsRef.current.gas = false;
    // The brake too.
    controlsRef.current.brake = false;
    // Left drives back along the road.
    controlsRef.current.left = false;
    // Right drives forward along the road.
    controlsRef.current.right = false;
    // The score text starts at zero.
    setScore(0);
    // A full tank.
    setFuel(100);
    // The new ride opens in Festac First Gate.
    setArea(areaLabel(40));
    setChallenge(terrainCue(40));
    // The end card closes.
    setPhase("running");
    // A new id remounts the canvas, which creates a new run.
    setRunId((current) => current + 1);
  // Closes the block above.
  }

  // Opens the leaderboard and remembers which screen to restore.
  function onBoard() {
    // Back returns here.
    setReturnTo(screen);
    // Shows the scores.
    setScreen("board");
  // Closes the block above.
  }

  // The leaderboard Back button.
  function onBack() {
    // Returns to the start card or the run that was already open.
    setScreen(returnTo);
  // Closes the block above.
  }

  // Pause only an active run before opening Settings; Resume remains explicit.
  function onOpenSettings() {
    // Pausing also clears any held keyboard or touch pedals on the next frame.
    if (phaseRef.current === "running") onTogglePause();
  // Finish the settings-open handler.
  }

  // The page.
  return (
    // Centers the game on wide screens.
    <main className={screen === "play" ? "page page-playing" : "page"}>
      {/* The start card. */}
      {/* Private invites open the finite head-to-head race. */}
      {screen === "race" && <Suspense fallback={<p className="note">Loading Ojo Barracks…</p>}><RaceRoom initialCode={new URLSearchParams(window.location.search).get("room") || ""} onBack={() => setScreen("start")} /></Suspense>}
      {screen === "start" ? (
        // The instructions and the Start button.
        <StartScreen onRace={() => setScreen("race")} muted={muted} onToggleMute={onToggleMute} onStart={onStart} onBoard={onBoard} />
      ) : null}
      {/* The run stays mounted after the first start, so a crash frame is not lost. */}
      {started ? (
        // Hidden while the leaderboard is open. The road does not reset.
        <div className="play" hidden={screen !== "play"} onContextMenu={event => { if (!event.target.closest("input, textarea, [contenteditable]")) event.preventDefault(); }}>
          {/* Score, pause, and mute. The pedals sit under the picture. */}
          <Hud
            key={runId}
            // The distance so far.
            score={score}
            // The tank percent.
            fuel={fuel}
            // The Lagos name for this stretch.
            area={area}
            // True while the button should say Resume.
            paused={phase === "paused"}
            // True while the beeps are silenced.
            muted={muted}
            // Pause and resume.
            onTogglePause={onTogglePause}
            // Sound on and sound off.
            onToggleMute={onToggleMute}
            // Freeze driving while the settings dialog is open.
            onOpenSettings={onOpenSettings}
          />
          {/* A short control reminder. Hidden on short phones so the road keeps the space. */}
          <p className="terrain-cue">{challenge}</p>
          <RotateTip />
          <p className="hint">Left brakes, then reverses. Right drives. Gas and Brake tilt in the air. P pauses.</p>
          {/* The moving road. runId starts a fresh run. */}
          <GameCanvas
            // A new number throws away the old run and builds another.
            runId={runId}
            // The ride the player picked on the start card.
            vehicleId={vehicleId}
            // False while the leaderboard covers the road.
            visible={screen === "play"}
            // The loop reads this to freeze the road.
            pausedRef={pausedRef}
            // The loop reads gas and brake from this.
            controlsRef={controlsRef}
            // Updates the score text.
            onScore={setScore}
            // Updates the fuel bar.
            onFuel={setFuel}
            // Updates the place name.
            onArea={setArea}
            onChallenge={setChallenge}
            // Opens the end card.
            onOver={onOver}
            // P from the keyboard.
            onTogglePause={onTogglePause}
          />
          {/* The end card only appears after a crash. */}
          {phase === "over" ? (
            <GameOver
              score={score}
              reason={endReason}
              onRestart={onRestart}
              onMenu={onMenu}
              onBoard={onBoard}
            />
          ) : null}
        {/* Closes this box. */}
        </div>
      ) : null}
      {/* The score list. */}
      {screen === "board" ? <Leaderboard onBack={onBack} /> : null}
    {/* Closes the page. */}
    </main>
  // Closes this call.
  );
// Closes the block above.
}
