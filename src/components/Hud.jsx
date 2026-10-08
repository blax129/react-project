import { useEffect, useRef, useState } from "react";
// Open sound preferences without crowding the driving controls.
import SettingsButton from "./SettingsButton";

export default function Hud({ score, fuel, area, paused, muted, onTogglePause, onToggleMute, onOpenSettings, onMenu }) {
  const previous = useRef(fuel);
  const [refilled, setRefilled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [screenHint, setScreenHint] = useState("");
  const timer = useRef(null);
  const value = Math.round(Math.max(0, Math.min(100, fuel)));
  useEffect(() => {
    if (fuel > previous.current + 1) {
      setRefilled(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRefilled(false), 1200);
    }
    previous.current = fuel;
  }, [fuel]);
  useEffect(() => {
    const change = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", change);
    return () => { clearTimeout(timer.current); document.removeEventListener("fullscreenchange", change); };
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        setScreenHint("Fullscreen isn’t supported here. Try your browser’s Add to Home Screen option, then open the game from there.");
      }
    } catch {
      setScreenHint("Fullscreen was unavailable. You can still play sideways, or open the game from your Home Screen.");
    }
  }
  return <div className="hud">
    <div className="hud-meta"><p className="score">Score {score}</p><p className="area">{area}</p></div>
    <div className={"fuel fuel-gauge " + (value < 10 ? "critical" : value < 25 ? "low" : "")}>
      <div className="fuel-heading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M2 21h14M4 10h10M17 5l3 3v10a2 2 0 0 1-4 0v-4h-2M18 6v5h2"/></svg>
        <span>FUEL</span><span className="fuel-percent">{value}%</span>
      </div>
      <div className="fuel-track" role="progressbar" aria-label="Fuel" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className="fuel-fill" style={{width: value + "%"}} /></div>
      <span className="fuel-feedback" aria-live="polite">{refilled ? "+Fuel" : value < 10 ? "LOW FUEL" : ""}</span>
    </div>
    <div className="actions hud-actions">
      <button className="button ghost" type="button" onClick={onTogglePause}>{paused ? "Resume" : "Pause"}</button>
      {/* Only while paused — leave the run and return to the start card. */}
      {paused && onMenu ? (
        <button className="button ghost" type="button" onClick={onMenu}>
          Top menu
        </button>
      ) : null}
      {/* Opening settings pauses the run before showing the sound controls. */}
      <SettingsButton muted={muted} onToggleMute={onToggleMute} onOpen={onOpenSettings} />
      <button className="button ghost fullscreen-button" type="button" onClick={toggleFullscreen}>{fullscreen ? "Exit full screen" : "Full screen"}</button>
    </div>
    {screenHint && <div className="screen-hint" role="status">{screenHint}<button type="button" onClick={() => setScreenHint("")} aria-label="Dismiss fullscreen tip">×</button></div>}
  </div>;
}
