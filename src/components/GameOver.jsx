// The form state.
import { useState } from "react";
// The save function, and the nickname this browser already knows.
import { readPlayerName, rememberPlayerName, saveScore } from "../leaderboard";
// True when a shared board is configured.
import { supabase } from "../supabaseClient";

// The panel shown after a crash.
export default function GameOver({ score, reason, onRestart, onMenu, onBoard }) {
  // The nickname. A returning player starts with the name saved last time.
  const [name, setName] = useState(readPlayerName);
  // True when this browser already had a name before this card opened.
  const [remembered] = useState(() => readPlayerName() !== "");
  // idle, saving, done, or error.
  const [status, setStatus] = useState("idle");
  // The sentence under the form.
  const [message, setMessage] = useState("");

  // Sends the name and this run's score.
  async function onSubmit(event) {
    // Stops the page from reloading.
    event.preventDefault();
    // A finished save should not be sent twice.
    if (status === "saving" || status === "done") {
      // Leaves the form as it is.
      return;
    // Closes the block above.
    }
    // Shows the waiting sentence.
    setStatus("saving");
    // Clears an older error.
    setMessage("");
    // Checks the name and writes the score.
    const result = await saveScore(name, score);
    // A valid name is kept for the next run, even if the shared board is down.
    if (result.ok || result.savedLocal) {
      // Fills the box automatically next time.
      rememberPlayerName(name);
    // Closes the block above.
    }
    // This run did not beat the score already stored for that name.
    if (result.ok && result.kept) {
      // The player can still change the name and save again.
      setStatus("idle");
      // Tells them which score still stands.
      setMessage(`${name.trim()}'s best is still ${result.best}.`);
      // Stops here.
      return;
    // Closes the block above.
    }
    // The shared board accepted it.
    if (result.ok && result.source === "cloud") {
      // The button stays disabled.
      setStatus("done");
      // The success sentence.
      setMessage("Saved on the shared leaderboard.");
      // Stops here.
      return;
    // Closes the block above.
    }
    // This browser accepted it because Supabase is not set up.
    if (result.ok && result.source === "local") {
      // The button stays disabled.
      setStatus("done");
      // The local sentence.
      setMessage("Saved in this browser only.");
      // Stops here.
      return;
    // Closes the block above.
    }
    // The name was fine, the share failed, and a local copy was kept.
    if (!result.ok && result.savedLocal) {
      // Lets the player try the shared board again after fixing the keys.
      setStatus("error");
      // Shows both facts.
      setMessage(`${result.error} Saved in this browser only.`);
      // Stops here.
      return;
    // Closes the block above.
    }
    // A name or score problem. Nothing was written.
    setStatus("error");
    // The validation sentence.
    setMessage(result.error);
  // Closes the block above.
  }

  // The card.
  return (
    // A dark sheet over the road, with the card in the middle.
    <div className="lost-backdrop">
      {/* Pops in from small to full size. */}
      <section className="panel lost-pop">
      {/* The end heading. */}
      <h2 className="lost-title">You lost</h2>
      {/* Why it ended. fuel is an empty tank. Anything else is a flip. */}
      <p className="note lost-reason">{reason === "fuel" ? "The tank ran dry." : "The korope landed upside down."}</p>
      {/* The points from this run, counting up. */}
      <p className="lost-points">{score}<span>points</span></p>
      {/* Where this save will go. */}
      <p className="note">
        {remembered && name.trim()
          ? `Saving as ${name}. Change it in the box if this is not you.`
          : supabase
            ? "Type a name once. This browser remembers it for the next run."
            : "Type a name once. This browser remembers it, and the score stays on this computer."}
      {/* Closes this sentence. */}
      </p>
      {/* The name form. */}
      <form onSubmit={onSubmit}>
        {/* The nickname field. */}
        <label className="field">
          {/* The label the player reads. */}
          Name
          {/* The typed nickname. 16 is the same limit as the database. */}
          <input
            // The letters currently in the box.
            value={name}
            // Stops the box at 16 characters.
            maxLength={16}
            // Opens the keyboard only when the player still needs to type a name.
            autoFocus={!remembered}
            // Stores each keystroke.
            onChange={(event) => setName(event.target.value)}
            // Example nickname shown until the player types.
            placeholder="Ada"
          />
        {/* Closes the name field. */}
        </label>
        {/* The result sentence, when there is one. */}
        {message ? <p className={status === "error" ? "error" : "note"}>{message}</p> : null}
        {/* The actions. */}
        <div className="actions">
          {/* Saves the score. */}
          <button className="button" type="submit" disabled={status === "saving" || status === "done"}>
            {status === "saving" ? "Saving..." : "Save score"}
          {/* Closes the button. */}
          </button>
          {/* Starts a new run with the same ride. */}
          <button className="button ghost" type="button" onClick={onRestart}>
            Restart
          {/* Closes the button. */}
          </button>
          {/* Returns to the picker so the player can choose another ride. */}
          <button className="button ghost" type="button" onClick={onMenu}>
            Change ride
          {/* Closes the button. */}
          </button>
          {/* Opens the score list. */}
          <button className="button ghost" type="button" onClick={onBoard}>
            Leaderboard
          {/* Closes the button. */}
          </button>
        {/* Closes this box. */}
        </div>
      {/* Closes the form. */}
      </form>
    {/* Closes this card. */}
    </section>
    {/* Closes the dark sheet. */}
    </div>
  // Closes this call.
  );
// Closes the block above.
}
