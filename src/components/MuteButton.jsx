// MuteButton is the sound switch used on the menus and during a run.
export default function MuteButton({ muted, onToggle }) {
  // The word on the button follows the current choice.
  const label = muted ? "Sound off" : "Sound on";
  // The button.
  return (
    // A quiet button so it does not look like the main Start button.
    <button className="button ghost" type="button" onClick={onToggle} aria-pressed={muted}>
      {/* The current sound state. */}
      {label}
    {/* Closes the button. */}
    </button>
  // Closes this call.
  );
// Closes the block above.
}
