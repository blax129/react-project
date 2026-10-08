// Guests choose a unique name without email or password.
import PlayerAccount from "./PlayerAccount";
// Explain landscape play before the player starts the countdown.
import RotateTip from "./RotateTip";
// React state for the ride in the middle of the slideshow.
import { useEffect, useState } from "react";
// Share the same sound settings menu as the driving dashboard.
import SettingsButton from "./SettingsButton";
import ShareButton from "./ShareButton";
// The rides, ratings, and the browser key for the last pick.
import { VEHICLE_KEY, VEHICLES, getVehicle, vehicleRatings } from "../game/vehicles";

import { vehicleImages } from "../game/vehicleImages";

// Every ride in picker order.
const RIDE_LIST = Object.values(VEHICLES);

// One comparable bar on the middle ride card.
function StatBar({ label, value }) {
  // Five slots. Filled ones match the rating.
  const dots = [1, 2, 3, 4, 5];
  return (
    <div className="ride-stat">
      <span className="ride-stat-label">{label}</span>
      <span className="ride-stat-dots" aria-label={`${label} ${value} of 5`}>
        {dots.map((n) => (
          <span key={n} className={n <= value ? "ride-dot on" : "ride-dot"} />
        ))}
      </span>
    </div>
  );
}

// A peek card for the ride before or after the middle one.
function SideRide({ ride, side, onSelect }) {
  return (
    <button className={`ride-side ride-side-${side}`} type="button" onClick={onSelect} aria-label={`Show ${ride.name}`}>
      <img className="ride-side-art" loading="lazy" decoding="async" src={ride.url} alt="" />
      <span className="ride-side-name">{ride.name}</span>
    </button>
  );
}

// Slideshow used only inside Story mode — never on the bare home screen.
function VehiclePicker({ index, onPrev, onNext, onSelectSide }) {
  const count = RIDE_LIST.length;
  const current = RIDE_LIST[index];
  const prev = RIDE_LIST[(index - 1 + count) % count];
  const next = RIDE_LIST[(index + 1) % count];
  const ratings = vehicleRatings(current);
  useEffect(() => {
    vehicleImages.load(current.url).catch(() => {});
  }, [current.url]);

  return (
    <>
      <h2>Choose your ride</h2>
      <div className="ride-show">
        <button className="ride-arrow" type="button" onClick={onPrev} aria-label="Previous ride">
          ‹
        </button>
        <div className="ride-track">
          <SideRide ride={prev} side="prev" onSelect={() => onSelectSide("prev")} />
          <div className="ride-card selected" role="group" aria-label={`${current.name} selected`}>
            <img className="ride-art" src={current.url} alt={current.name} />
            <span className="ride-name">{current.name}</span>
            <span className="ride-blurb">{current.blurb}</span>
            <div className="ride-stats">
              <StatBar label="Speed" value={ratings.speed} />
              <StatBar label="Climbing" value={ratings.climbing} />
              <StatBar label="Stability" value={ratings.stability} />
              <StatBar label="Fuel economy" value={ratings.fuelEconomy} />
            </div>
          </div>
          <SideRide ride={next} side="next" onSelect={() => onSelectSide("next")} />
        </div>
        <button className="ride-arrow" type="button" onClick={onNext} aria-label="Next ride">
          ›
        </button>
      </div>
      <p className="ride-count">
        {index + 1} of {count}
      </p>
    </>
  );
}

// Short control tips shared by home and story mode.
function HowToPlay() {
  return (
    <details className="driving-help">
      <summary>How to play</summary>
      <ul className="controls">
        <li>Hold Right, the right arrow, D, or Space to drive forward. The Gas pedal does the same.</li>
        <li>Hold Left, the left arrow, or A to brake, then reverse. The Brake pedal does the same. Reversing uses fuel; braking and coasting do not.</li>
        <li>Do not hold Gas the whole way. Before a crest or bridge lip, release Gas and dab Brake to plant the nose. In the air, Gas tips up and Brake tips down — you lose only if you land upside down.</li>
        <li>Press P, or the Pause button, to pause and resume.</li>
        <li>Mud sticks hard and burns fuel. Debris slows you and can puncture the tank — crawl or jump clear. Bridges and sawtooth lips punish held Gas. Green repair stops seal leaks and restore fuel.</li>
        <li>At police checkpoints, brake, release Gas, and stop briefly for the barrier to open. Ramming the gate wastes 12% fuel.</li>
      </ul>
      <p className="note">
        Fuel stops refill when your tank is low. Coast downhill to save fuel. The score is how far you get. Landing upside
        down, or an empty tank, ends the run.
      </p>
    </details>
  );
}

// The screen shown before a run starts.
export default function StartScreen({ muted, onToggleMute, onStart, onBoard, onRace }) {
  // null = home with mode boxes; solo = story picker + Start.
  const [mode, setMode] = useState(null);
  // Index of the ride in the middle. Remembers the last pick in this browser.
  const [index, setIndex] = useState(() => {
    const saved = getVehicle(localStorage.getItem(VEHICLE_KEY)).id;
    const found = RIDE_LIST.findIndex((ride) => ride.id === saved);
    return found < 0 ? 0 : found;
  });

  const count = RIDE_LIST.length;
  const current = RIDE_LIST[index];

  function goPrev() {
    setIndex((i) => (i - 1 + count) % count);
  }

  function goNext() {
    setIndex((i) => (i + 1) % count);
  }

  // Saves the middle ride and starts the solo run.
  function pickAndStart() {
    localStorage.setItem(VEHICLE_KEY, current.id);
    onStart(current.id);
  }

  // Shared footer: scores, sound, share, username — never the vehicle list.
  const sharedActions = (
    <div className="actions home-actions">
      <button className="button ghost" type="button" onClick={onBoard}>
        Leaderboard
      </button>
      <SettingsButton muted={muted} onToggleMute={onToggleMute} />
      <ShareButton />
      <PlayerAccount />
    </div>
  );

  // Story mode: vehicles first, then Start.
  if (mode === "solo") {
    return (
      <section className="panel start-panel">
        <h1 className="game-title">Road Clear</h1>
        <p className="lead start-lead">Story mode — Lagos hills, fuel, and one long run.</p>
        <RotateTip />
        <button className="button ghost mode-back" type="button" onClick={() => setMode(null)}>
          ← Modes
        </button>
        <h2 className="mode-heading">Single player</h2>
        <VehiclePicker
          index={index}
          onPrev={goPrev}
          onNext={goNext}
          onSelectSide={(side) => (side === "prev" ? goPrev() : goNext())}
        />
        <div className="actions solo-actions">
          <button className="button" type="button" onClick={pickAndStart}>
            Start
          </button>
        </div>
        <HowToPlay />
        {sharedActions}
      </section>
    );
  }

  // Home: two mode boxes only — vehicles stay inside each mode.
  return (
    <section className="panel start-panel">
      <h1 className="game-title">Road Clear</h1>
      <p className="lead start-lead">
        Drive through 30 Lagos-inspired areas, or race a friend on Ojo Barracks. Pick a mode to choose your ride.
      </p>
      <RotateTip />

      <div className="mode-grid" role="group" aria-label="Game modes">
        {/* Solo opens the vehicle picker and Start. */}
        <button className="mode-card mode-card-solo" type="button" onClick={() => setMode("solo")}>
          <span className="mode-card-label">Single player</span>
          <span className="mode-card-title">Story mode</span>
          <span className="mode-card-copy">Endless Lagos hills, fuel stops, bridges, and a high score.</span>
        </button>
        {/* 1 v 1 opens the private Barracks lobby (vehicles live there). */}
        <button className="mode-card mode-card-race" type="button" onClick={onRace}>
          <span className="mode-card-label">1 v 1</span>
          <span className="mode-card-title">Ojo Barracks</span>
          <span className="mode-card-copy">Private room, countdown, checkpoints, and a finish line.</span>
        </button>
      </div>

      <HowToPlay />
      {sharedActions}
    </section>
  );
}
