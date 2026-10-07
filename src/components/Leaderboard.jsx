// Loads the board when this panel opens.
import { useEffect, useState } from "react";
// The shared load, and the browser list used when sharing fails.
import { loadBoard, readLocal } from "../leaderboard";

// One table of ranks, names, and scores.
function ScoreTable({ rows }) {
  // An empty list gets a sentence instead of a blank table.
  if (rows.length === 0) {
    // The empty sentence.
    return <p className="note">No scores yet. Finish a run to be first.</p>;
  // Closes the block above.
  }
  // The table.
  return (
    // The score table.
    <table>
      {/* The column names. */}
      <thead>
        {/* One header row. */}
        <tr>
          {/* Rank column. */}
          <th>Rank</th>
          {/* Name column. */}
          <th>Name</th>
          {/* Score column. */}
          <th>Score</th>
        {/* Closes this row. */}
        </tr>
      {/* Closes the column names. */}
      </thead>
      {/* The ten rows, or fewer. */}
      <tbody>
        {/* Each saved run. */}
        {rows.map((row, index) => (
          // The rank is the position after sorting, starting at 1.
          <tr key={`${row.name}-${row.score}-${row.at}`}>
            {/* The place. */}
            <td>{index + 1}</td>
            {/* The nickname. */}
            <td>{row.name}</td>
            {/* The points. */}
            <td>{row.score}</td>
          {/* Closes this row. */}
          </tr>
        ))}
      {/* Closes the score rows. */}
      </tbody>
    {/* Closes the table. */}
    </table>
  // Closes this call.
  );
// Closes the block above.
}

// The leaderboard panel.
export default function Leaderboard({ onBack }) {
  // True until the first load finishes.
  const [loading, setLoading] = useState(true);
  // The shared or local result.
  const [board, setBoard] = useState({ source: "local", rows: [], error: "" });
  // A second list, shown only when the shared board fails.
  const [localRows, setLocalRows] = useState([]);

  // Loads scores when the panel opens.
  useEffect(() => {
    // False after the panel closes, so a late reply is ignored.
    let live = true;
    // Asks for the top ten.
    loadBoard().then((result) => {
      // The panel was closed before the reply.
      if (!live) {
        // Ignores the reply.
        return;
      // Closes the block above.
      }
      // Stores the result.
      setBoard(result);
      // A failed shared load still shows this browser's scores underneath.
      if (result.error) {
        // Reads those local rows.
        setLocalRows(readLocal());
      // Closes the block above.
      }
      // Hides the loading sentence.
      setLoading(false);
    // Closes this call.
    });
    // Marks the request stale if the panel closes.
    return () => {
      // The reply should be ignored.
      live = false;
    // Closes this object.
    };
  }, []);

  // The heading depends on where the rows came from.
  const title = board.source === "cloud" ? "Shared leaderboard" : "This browser only";
  // The card.
  return (
    // The cream panel.
    <section className="panel">
      {/* The page heading. */}
      <h1>Leaderboard</h1>
      {/* The source heading. */}
      <h2>{title}</h2>
      {/* The waiting sentence. */}
      {loading ? <p className="note">Loading scores...</p> : null}
      {/* The error sentence. */}
      {board.error ? <p className="error">{board.error}</p> : null}
      {/* The main list, after loading. */}
      {loading ? null : <ScoreTable rows={board.rows} />}
      {/* The local backup list, only after a shared error. */}
      {board.error ? (
        // A second block so these rows are not mistaken for shared scores.
        <div>
          {/* The local heading. */}
          <h2>This browser only</h2>
          {/* The local rows. */}
          <ScoreTable rows={localRows} />
        {/* Closes this box. */}
        </div>
      ) : null}
      {/* Returns to the start screen or the game-over screen. */}
      <div className="actions">
        {/* The back button. */}
        <button className="button" type="button" onClick={onBack}>
          Back
        {/* Closes the button. */}
        </button>
      {/* Closes this box. */}
      </div>
    {/* Closes this card. */}
    </section>
  // Closes this call.
  );
// Closes the block above.
}
