// The Supabase helper. It is null when the keys are missing.
import { supabase } from "./supabaseClient";
// The biggest score and the longest name.
import { MAX_NAME, MAX_SCORE } from "./game/constants";

// Where this browser keeps scores when Supabase is not set up.
const LOCAL_KEY = "moruwa-dash-scores";
// The nickname from the last successful save, so the next run can reuse it.
const PLAYER_KEY = "moruwa-player-name";
// Letters, numbers, spaces, and a single hyphen are allowed in a name.
const NAME_PATTERN = /^[A-Za-z0-9 -]+$/;

// Reads the browser list. A broken save becomes an empty list.
export function readLocal() {
  // Starts from nothing.
  try {
    // The saved text, or nothing.
    const raw = localStorage.getItem(LOCAL_KEY);
    // No save yet.
    if (!raw) {
      // An empty board.
      return [];
    // Closes the block above.
    }
    // Turns the text back into rows.
    const parsed = JSON.parse(raw);
    // Only an array is a real board. Each name keeps its best run.
    return Array.isArray(parsed) ? bestRows(parsed) : [];
  } catch {
    // A bad save should not crash the game.
    return [];
  // Closes the block above.
  }
// Closes the block above.
}

// Saves one local row. A name already on the list keeps its higher score.
export function writeLocal(entry) {
  // The runs already stored in this browser.
  const current = readLocal();
  // The earlier run for this same name, if there is one.
  const previous = current.find((row) => row.name === entry.name);
  // This run did not beat the saved one.
  if (previous && entry.score <= previous.score) {
    // Leaves the list alone and reports the score that still stands.
    return { rows: current, kept: true, best: previous.score };
  // Closes the block above.
  }
  // Drops the old run for this name, then adds the new one.
  const next = current.filter((row) => row.name !== entry.name).concat(entry);
  // One row per name, then the best ten.
  const rows = bestRows(next);
  // Writes them back as text.
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  // The caller can show this list at once.
  return { rows, kept: false, best: entry.score };
// Closes the block above.
}

// The nickname this browser already accepted, or a blank string.
export function readPlayerName() {
  // Starts from nothing if the browser blocks storage.
  try {
    // The last saved nickname, or nothing.
    const saved = localStorage.getItem(PLAYER_KEY) || "";
    // Runs the same checks as the form.
    const named = cleanName(saved);
    // A bad old value is ignored.
    return named.error ? "" : named.name;
  } catch {
    // Storage failed, so the player types a name.
    return "";
  // Closes the block above.
  }
// Closes the block above.
}

// Remembers a nickname after a score is accepted.
export function rememberPlayerName(name) {
  // Cleans the nickname before storing it.
  const named = cleanName(name);
  // Only a real name is remembered.
  if (!named.error) {
    // The next game-over screen can fill this in.
    localStorage.setItem(PLAYER_KEY, named.name);
  // Closes the block above.
  }
// Closes the block above.
}

// Checks the nickname. Returns either a clean name or an error sentence.
export function cleanName(value) {
  // Trims the ends and turns extra spaces into one space.
  const name = String(value || "").trim().replace(/\s+/g, " ");
  // A blank box is not a name.
  if (!name) {
    // The sentence shown under the form.
    return { name: "", error: "Type a name first." };
  // Closes the block above.
  }
  // The form and the database both stop at 16 characters.
  if (name.length > MAX_NAME) {
    // The sentence shown under the form.
    return { name: "", error: "Use 16 letters or fewer." };
  // Closes the block above.
  }
  // Blocks symbols so a name stays readable on the board.
  if (!NAME_PATTERN.test(name)) {
    // The sentence shown under the form.
    return { name: "", error: "Use letters, numbers, and spaces." };
  // Closes the block above.
  }
  // The name is safe to save.
  return { name, error: "" };
// Closes the block above.
}

// Checks the points from the run that just ended.
export function cleanScore(value) {
  // Drops any fraction.
  const score = Math.floor(Number(value));
  // Rejects a missing, negative, or huge number.
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    // No usable score.
    return null;
  // Closes the block above.
  }
  // The whole number to store.
  return score;
// Closes the block above.
}

// One row per name. A higher score replaces an older one. An equal score keeps the earlier run.
export function bestRows(rows) {
  // The best run found so far for each name.
  const byName = new Map();
  // Looks at every saved run.
  rows.forEach((row) => {
    // The run already kept for this name, if there is one.
    const current = byName.get(row.name);
    // True when this run beats the one we kept, or ties it and happened earlier.
    const better = !current || row.score > current.score || (row.score === current.score && row.at < current.at);
    // Keeps the better run.
    if (better) {
      // Stores it under the name.
      byName.set(row.name, row);
    // Closes the block above.
    }
  // Closes the block above.
  });
  // Highest score first. An equal score keeps the earlier run first.
  return [...byName.values()].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 10);
// Closes the block above.
}

// Turns database rows into the same shape as browser rows.
function cloudRows(data) {
  // Each database row becomes name, score, and time.
  return data.map((row) => ({
    // The column is player_name in the database.
    name: row.player_name,
    // The points column.
    score: row.score,
    // The time column, used to break a tie.
    at: new Date(row.created_at).getTime(),
  }));
// Closes the block above.
}

// Loads the top ten. source says whether they are shared or local.
export async function loadBoard() {
  // No keys in the env file, so this browser is the whole leaderboard.
  if (!supabase) {
    // Local rows, with a clear label for the screen.
    return { source: "local", rows: readLocal(), error: "" };
  // Closes the block above.
  }
  // Asks Supabase for a wide set, then keeps each name's best run.
  const { data, error } = await supabase
    // The table created by leaderboard.sql.
    .from("moruwa_scores")
    // The three columns the board shows.
    .select("player_name, score, created_at")
    // Highest score first. An older run wins a tie.
    .order("score", { ascending: false })
    // The tie breaker.
    .order("created_at", { ascending: true })
    // 300 rows is enough to find the best run for each name before cutting to ten.
    .limit(300);
  // The request failed, so the screen must say so.
  if (error) {
    // Keeps the shared label and passes the error text up.
    return { source: "cloud", rows: [], error: error.message };
  // Closes the block above.
  }
  // A good shared list, with one row per name.
  return { source: "cloud", rows: bestRows(cloudRows(data || [])), error: "" };
// Closes the block above.
}

// Saves one finished run. Falls back to this browser if the share fails.
export async function saveScore(name, score) {
  // Checks the nickname first.
  const named = cleanName(name);
  // The name was rejected.
  if (named.error) {
    // Nothing was written.
    return { ok: false, error: named.error, source: supabase ? "cloud" : "local", savedLocal: false };
  // Closes the block above.
  }
  // Checks the points from this run.
  const points = cleanScore(score);
  // The points were not a real game score.
  if (points === null) {
    // Nothing was written.
    return { ok: false, error: "That score cannot be saved.", source: "local", savedLocal: false };
  // Closes the block above.
  }
  // The row shape used by this browser.
  const entry = { name: named.name, score: points, at: Date.now() };
  // No Supabase keys, so the score stays on this computer.
  if (!supabase) {
    // Writes the local top ten, or keeps the older higher score.
    const saved = writeLocal(entry);
    // Tells the form whether this run replaced the name's best.
    return { ok: true, error: "", source: "local", savedLocal: true, kept: saved.kept, best: saved.best };
  // Closes the block above.
  }
  // Asks the database to keep one best score for this name.
  const saved = await supabase.rpc("save_moruwa_score", {
    // The nickname argument.
    p_name: named.name,
    // The points argument.
    p_score: points,
  // Closes this call.
  });
  // The new save function is not in the database yet, so use a plain insert.
  if (saved.error) {
    // Reads this name's current best, if a row exists.
    const existing = await supabase
      // The scores table.
      .from("moruwa_scores")
      // Only the points are needed for the comparison.
      .select("score")
      // The same nickname.
      .eq("player_name", named.name)
      // The highest one.
      .order("score", { ascending: false })
      // One row is enough.
      .limit(1);
    // The read failed, so keep a copy in this browser.
    if (existing.error) {
      // The player still has the score here.
      writeLocal(entry);
      // The form explains that the shared board refused it.
      return { ok: false, error: existing.error.message, source: "local", savedLocal: true, kept: false, best: points };
    // Closes the block above.
    }
    // The score already stored for this name.
    const previous = existing.data && existing.data[0] ? existing.data[0].score : null;
    // This run did not beat it.
    if (previous !== null && points <= previous) {
      // Nothing new is written.
      return { ok: true, error: "", source: "cloud", savedLocal: false, kept: true, best: previous };
    // Closes the block above.
    }
    // Sends a higher score, or the first score for this name.
    const inserted = await supabase.from("moruwa_scores").insert({
      // The database column for the name.
      player_name: named.name,
      // The database column for the points.
      score: points,
    // Closes this call.
    });
    // The share failed, so keep a copy here and say so.
    if (inserted.error) {
      // The player still has the score in this browser.
      writeLocal(entry);
      // The form explains that the shared board refused it.
      return { ok: false, error: inserted.error.message, source: "local", savedLocal: true, kept: false, best: points };
    // Closes the block above.
    }
    // The shared board accepted the higher score.
    return { ok: true, error: "", source: "cloud", savedLocal: false, kept: false, best: points };
  // Closes the block above.
  }
  // The first row from the save function.
  const row = Array.isArray(saved.data) ? saved.data[0] : saved.data;
  // This run did not beat the stored best.
  if (row && row.outcome === "kept") {
    // The older score stays on the board.
    return { ok: true, error: "", source: "cloud", savedLocal: false, kept: true, best: row.best_score };
  // Closes the block above.
  }
  // The shared board accepted the new best score.
  return { ok: true, error: "", source: "cloud", savedLocal: false, kept: false, best: points };
// Closes the block above.
}
