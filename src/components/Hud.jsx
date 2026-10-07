// The sound switch.
import MuteButton from "./MuteButton";

// The score and buttons shown above the hills.
export default function Hud({ score, fuel, area, paused, muted, onTogglePause, onToggleMute }) {
  // The pause button word follows the current state.
  const pauseLabel = paused ? "Resume" : "Pause";
  // The bar.
  return (
    // Score, place, fuel, and buttons in a compact grid.
    <div className="hud">
      {/* Score and place stay together on a phone. */}
      <div className="hud-meta">
        {/* The distance so far. */}
        <p className="score">Score {score}</p>
        {/* The part of Lagos the korope is in. */}
        <p className="area">{area}</p>
      {/* Closes the meta group. */}
      </div>
      {/* The tank. 25 is the low-fuel mark, where the petrol turns red. */}
      <div className="fuel" aria-label={`Fuel ${Math.round(fuel)}`}>
        {/* The word beside the can. */}
        <span className="fuel-name">Fuel</span>
        {/* A yellow jerry can. The amber fill is the petrol still in it. */}
        <div className="jerry">
          {/* The handle on the shoulder of the can. */}
          <span className="jerry-handle" />
          {/* The red cap. */}
          <span className="jerry-cap" />
          {/* The metal body. The liquid sits at the bottom and grows with the percent. */}
          <div className="jerry-body">
            {/* 25 percent is the empty warning. The height is how full the can is. */}
            <div
              className={fuel < 25 ? "jerry-liquid low" : "jerry-liquid"}
              style={{ height: `${Math.max(0, Math.min(100, fuel))}%` }}
            />
          </div>
        </div>
      </div>
      {/* The buttons. */}
      <div className="actions hud-actions">
        {/* Pauses or continues the ride. */}
        <button className="button ghost" type="button" onClick={onTogglePause}>
          {pauseLabel}
        {/* Closes the button. */}
        </button>
        {/* Sound switch. */}
        <MuteButton muted={muted} onToggle={onToggleMute} />
      {/* Closes this box. */}
      </div>
    {/* Closes this box. */}
    </div>
  // Closes this call.
  );
// Closes the block above.
}
