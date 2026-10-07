// The shared sound machine. It stays empty until the first tap or key.
let audioCtx = null;
// True when the player has turned sound off.
let muted = false;

// Remembers the mute choice.
export function setMuted(next) {
  // Stores the choice for the sound functions.
  muted = next;
// Closes the block above.
}

// Starts the sound machine after a click, which browsers require.
export function unlockSound() {
  // Creates the machine on the first gesture.
  if (!audioCtx) {
    // The browser's built-in tone maker. No sound files are needed.
    audioCtx = new AudioContext();
  // Closes the block above.
  }
  // Wakes the machine if the browser had paused it.
  if (audioCtx.state === "suspended") {
    // Continues the tone maker.
    audioCtx.resume();
  // Closes the block above.
  }
// Closes the block above.
}

// Plays a short beep. High pitch is the jump. Low pitch is the crash.
function beep(frequency, seconds, type) {
  // A muted game plays nothing.
  if (muted || !audioCtx) {
    // Leaves without a tone.
    return;
  // Closes the block above.
  }
  // One tone.
  const osc = audioCtx.createOscillator();
  // The volume control for that tone.
  const gain = audioCtx.createGain();
  // Jump is a square beep. Crash is a saw buzz.
  osc.type = type;
  // The pitch.
  osc.frequency.value = frequency;
  // Starts loud enough to hear, then falls to silence.
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  // Fades out so the beep does not click.
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + seconds);
  // Connects the tone to the volume.
  osc.connect(gain);
  // Connects the volume to the speakers.
  gain.connect(audioCtx.destination);
  // Starts now.
  osc.start();
  // Stops after the beep length.
  osc.stop(audioCtx.currentTime + seconds);
// Closes the block above.
}

// The jump beep.
export function playJump() {
  // A short high beep.
  beep(540, 0.12, "square");
// Closes the block above.
}

// The crash buzz.
export function playCrash() {
  // A short low buzz.
  beep(90, 0.28, "sawtooth");
// Closes the block above.
}

// The fuel-can beep.
export function playFuel() {
  // A short high blip, higher than the old jump beep so it reads as a pickup.
  beep(880, 0.08, "square");
// Closes the block above.
}
