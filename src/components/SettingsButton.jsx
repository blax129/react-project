// React refs let the button open and close the native settings dialog.
import { useRef, useState } from 'react';
// These helpers read and update the volume used by the game's sound effects.
import { getEffectsVolume, setEffectsVolume, playFuel, unlockSound } from '../game/sound';

// The menu and dashboard use the same settings button and mute preference.
export default function SettingsButton({ muted, onToggleMute, onOpen }) {
  // Keep a reference to the dialog so it can be opened by a tap.
  const dialog = useRef(null);
  // Show the current volume as a percentage in the slider.
  const [volume, setVolume] = useState(() => Math.round(getEffectsVolume() * 100));
  // Open settings without allowing a driving run to continue behind the dialog.
  function openSettings() {
    // The parent pauses gameplay and clears held pedals when necessary.
    onOpen?.();
    // Refresh the slider in case settings were changed from the other screen.
    setVolume(Math.round(getEffectsVolume() * 100));
    // A modal traps keyboard focus and supports the Escape key.
    dialog.current.showModal();
  // Finish the opening handler.
  }
  // Apply a volume change immediately and remember it for later visits.
  function changeVolume(event) {
    // Convert the slider's text value to a number.
    const next = Number(event.target.value);
    // Update the visible percentage.
    setVolume(next);
    // Convert the percentage to the sound engine's zero-to-one range.
    setEffectsVolume(next / 100);
  // Finish the volume handler.
  }
  // Let the player hear the current effects volume without starting a run.
  function previewSound() {
    // Audio playback is unlocked by this explicit user gesture.
    unlockSound();
    // Play the familiar fuel pickup tone at the chosen volume.
    playFuel();
  // Finish the preview handler.
  }
  // Render the Settings button and its initially hidden dialog.
  return (
    // A fragment groups the button and dialog without adding a layout box.
    <>
      {/* Open the settings menu from this screen. */}
      <button className="button ghost" type="button" onClick={openSettings}>Settings</button>
      {/* A labelled native dialog provides modal keyboard navigation. */}
      <dialog className="settings-dialog" ref={dialog} aria-labelledby="settings-title">
        {/* Name the menu for both sighted players and screen readers. */}
        <h2 id="settings-title">Settings</h2>
        {/* Sound controls sit inside their own settings section. */}
        <fieldset>
          {/* Give this group the requested Sound settings heading. */}
          <legend>Sound settings</legend>
          {/* A checkbox uses its checked state to communicate whether effects are enabled. */}
          <label className="sound-toggle"><input type="checkbox" checked={!muted} onChange={onToggleMute} /> Sound effects</label>
          {/* Display the percentage alongside the slider's accessible label. */}
          <label className="volume-label">Effects volume: {volume}%
            {/* Disable volume changes while effects are muted. */}
            <input type="range" min="0" max="100" step="1" value={volume} disabled={muted} onChange={changeVolume} />
          {/* Finish the slider label. */}
          </label>
          {/* Play a sample only when the sound is enabled and audible. */}
          <button className="button ghost" type="button" disabled={muted || volume === 0} onClick={previewSound}>Test sound</button>
          {/* Clearly describe the music feature's current availability. */}
          <p className="music-status">Background music is not available yet.</p>
        {/* Finish the sound settings group. */}
        </fieldset>
        {/* Closing settings leaves a paused run paused until Resume is pressed. */}
        <button className="button" type="button" onClick={() => dialog.current.close()}>Done</button>
      {/* Finish the modal dialog. */}
      </dialog>
    {/* Finish the fragment. */}
    </>
  // Finish the returned interface.
  );
// Finish the shared settings component.
}
