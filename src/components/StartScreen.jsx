// React state for the ride in the middle of the slideshow.
import { useEffect, useState } from "react";
// The sound switch.
import MuteButton from "./MuteButton";
// The rides, ratings, and the browser key for the last pick.
import { VEHICLE_KEY, VEHICLES, getVehicle, vehicleRatings } from "../game/vehicles";

import { vehicleImages } from "../game/vehicleImages";

// Every ride in picker order.
const RIDE_LIST = Object.values(VEHICLES);

// One comparable bar on the middle ride card.
function StatBar({ label, value }) {
  // Five slots. Filled ones match the rating.
  const dots = [1, 2, 3, 4, 5];
  // The row.
  return (
    // Label and dots on one line.
    <div className="ride-stat">
      {/* The name of this rating. */}
      <span className="ride-stat-label">{label}</span>
      {/* The five dots. */}
      <span className="ride-stat-dots" aria-label={`${label} ${value} of 5`}>
        {/* Each slot. */}
        {dots.map((n) => (
          // Filled when this slot is at or under the rating.
          <span key={n} className={n <= value ? "ride-dot on" : "ride-dot"} />
        ))}
      {/* Closes the dots. */}
      </span>
    {/* Closes the row. */}
    </div>
  // Closes this call.
  );
// Closes the block above.
}

// A peek card for the ride before or after the middle one.
function SideRide({ ride, side, onSelect }) {
  // The card.
  return (
    // Tapping a side card brings that ride to the middle.
    <button className={`ride-side ride-side-${side}`} type="button" onClick={onSelect} aria-label={`Show ${ride.name}`}>
      {/* A smaller cutout so the middle ride stays the focus. */}
      <img className="ride-side-art" loading="lazy" decoding="async" src={ride.url} alt="" />
      {/* Just the name under the peek picture. */}
      <span className="ride-side-name">{ride.name}</span>
    {/* Closes the side card. */}
    </button>
  // Closes this call.
  );
// Closes the block above.
}

// The screen shown before a run starts.
export default function StartScreen({ muted, onToggleMute, onStart, onBoard }) {
  // Index of the ride in the middle. Remembers the last pick in this browser.
  const [index, setIndex] = useState(() => {
    // The saved ride id, or the korope.
    const saved = getVehicle(localStorage.getItem(VEHICLE_KEY)).id;
    // Where that ride sits in the list.
    const found = RIDE_LIST.findIndex((ride) => ride.id === saved);
    // 0 if the saved id somehow vanished.
    return found < 0 ? 0 : found;
  });

  // How many rides there are.
  const count = RIDE_LIST.length;
  // The ride shown in the middle.
  const current = RIDE_LIST[index];
  // The ride to the left. Wraps from the first back to the last.
  const prev = RIDE_LIST[(index - 1 + count) % count];
  // The ride to the right. Wraps from the last back to the first.
  const next = RIDE_LIST[(index + 1) % count];
  // Bars for the middle ride only.
  const ratings = vehicleRatings(current);
  useEffect(() => { vehicleImages.load(current.url).catch(() => {}); }, [current.url]);

  // Moves one step toward the previous ride.
  function goPrev() {
    // Wraps around the list.
    setIndex((i) => (i - 1 + count) % count);
  // Closes the block above.
  }

  // Moves one step toward the next ride.
  function goNext() {
    // Wraps around the list.
    setIndex((i) => (i + 1) % count);
  // Closes the block above.
  }

  // Saves the middle ride and starts the run.
  function pickAndStart() {
    // The next visit opens on the same ride.
    localStorage.setItem(VEHICLE_KEY, current.id);
    // Tells the parent which ride to put on the road.
    onStart(current.id);
  // Closes the block above.
  }

  // The card.
  return (
    // The cream panel.
    <section className="panel start-panel">
      {/* The game name. */}
      <h1>Korope</h1>
      {/* What the player is about to do. */}
      <p className="lead">
        Take on Lagos hills. Pick your ride, time your climbs, and see how far you can go.
      {/* Closes this sentence. */}
      </p>
      {/* The ride picker heading. */}
      <h2>Choose your ride</h2>
      {/* Previous, current, and next, with arrow buttons. */}
      <div className="ride-show">
        {/* Steps to the previous ride. */}
        <button className="ride-arrow" type="button" onClick={goPrev} aria-label="Previous ride">
          ‹
        {/* Closes the previous arrow. */}
        </button>
        {/* The three visible slots. */}
        <div className="ride-track">
          {/* The ride before the middle one. */}
          <SideRide ride={prev} side="prev" onSelect={goPrev} />
          {/* The selected ride in the middle. */}
          <div className="ride-card selected" role="group" aria-label={`${current.name} selected`}>
            {/* The cutout of the middle ride. */}
            <img className="ride-art" src={current.url} alt={current.name} />
            {/* The name under the picture. */}
            <span className="ride-name">{current.name}</span>
            {/* The personality line. */}
            <span className="ride-blurb">{current.blurb}</span>
            {/* Comparable ratings. */}
            <div className="ride-stats">
              {/* Road pace. */}
              <StatBar label="Speed" value={ratings.speed} />
              {/* How well it climbs. */}
              <StatBar label="Climbing" value={ratings.climbing} />
              {/* How forgiving landings feel. */}
              <StatBar label="Stability" value={ratings.stability} />
              {/* Higher means less fuel burned. */}
              <StatBar label="Fuel economy" value={ratings.fuelEconomy} />
            {/* Closes the ratings. */}
            </div>
          {/* Closes the middle card. */}
          </div>
          {/* The ride after the middle one. */}
          <SideRide ride={next} side="next" onSelect={goNext} />
        {/* Closes the three slots. */}
        </div>
        {/* Steps to the next ride. */}
        <button className="ride-arrow" type="button" onClick={goNext} aria-label="Next ride">
          ›
        {/* Closes the next arrow. */}
        </button>
      {/* Closes the slideshow. */}
      </div>
      {/* Which ride number this is, so the wrap is obvious. */}
      <p className="ride-count">
        {index + 1} of {count}
      {/* Closes the count. */}
      </p>
      {/* The controls heading. */}
      <details className="driving-help"><summary>How to play</summary>
      {/* The list of ways to drive and pause. */}
      <ul className="controls">
        {/* Keyboard forward. */}
        <li>Hold Right, the right arrow, D, or Space to drive forward. The Gas pedal does the same.</li>
        {/* Keyboard back. */}
        <li>Hold Left, the left arrow, or A to brake, then reverse. The Brake pedal does the same. Reversing uses fuel; braking and coasting do not.</li>
        {/* The jump off a crest. */}
        <li>Let go of the gas before a steep lip. A tilt in the air is safe. You lose only if you land upside down.</li>
        {/* Pause. */}
        <li>Press P, or the Pause button, to pause and resume.</li>
      {/* Closes the control list. */}
      </ul>
      {/* Where scores go. */}
      <p className="note">
        The score is how far you get. Landing upside down, or an empty tank, ends the run.
      {/* Closes this sentence. */}
      </p>
      </details>
      {/* The three actions. */}
      <div className="actions">
        {/* Starts a run with the middle ride. */}
        <button className="button" type="button" onClick={pickAndStart}>
          Start
        {/* Closes the button. */}
        </button>
        {/* Opens the score list. */}
        <button className="button ghost" type="button" onClick={onBoard}>
          Leaderboard
        {/* Closes the button. */}
        </button>
        {/* Turns sound on or off. */}
        <MuteButton muted={muted} onToggle={onToggleMute} />
      {/* Closes this box. */}
      </div>
    {/* Closes this card. */}
    </section>
  // Closes this call.
  );
// Closes the block above.
}
