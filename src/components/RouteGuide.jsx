// React manages the selected area and the native preview dialog.
import { useEffect, useRef, useState } from 'react';
// Use the same route and artwork as the driving game.
import { AREAS } from '../game/areas';
// Reuse the mobile-friendly scenery renderer rather than downloading preview images.
import { drawAreaScenery } from '../game/scenery';
// Explain the driving technique for each obstacle emphasis.
const ADVICE = { mud: 'Carry momentum through mud and avoid wasting fuel with prolonged throttle.', debris: 'Crawl over debris or jump clear; reach a green repair stop if your tank leaks.', police: 'Brake before the barrier, release Gas, and stop briefly to pass.' };
// Let players browse the journey without changing their score or starting position.
export default function RouteGuide() {
  // Store the modal and preview canvas elements.
  const dialog = useRef(null), canvas = useRef(null);
  // Begin the preview at the opening gate.
  const [index, setIndex] = useState(0);
  // Resolve the selected location from the shared route.
  const area = AREAS[index];
  // Redraw only when the player selects another location.
  useEffect(() => {
    // Obtain the drawing context for this mounted canvas.
    const ctx = canvas.current.getContext('2d');
    // Fill the sky with the area's own colour palette.
    ctx.fillStyle = area.skyTop; ctx.fillRect(0, 0, 960, 320);
    // Render the same landmarks seen while driving.
    drawAreaScenery(ctx, 0, area);
  // Repaint when the selected area changes.
  }, [area]);
  // Render the entry button and accessible native dialog.
  return <>
    {/* Open the route guide with keyboard focus contained inside it. */}
    <button className="button ghost" type="button" onClick={() => dialog.current.showModal()}>Explore 30 areas</button>
    {/* Escape and the Close button both dismiss this preview. */}
    <dialog ref={dialog} className="settings-dialog route-dialog" aria-labelledby="route-title">
      {/* Identify the journey and current stage. */}
      <h2 id="route-title">Your Lagos journey · {index + 1}/30</h2>
      {/* A native select supports touch and keyboard navigation. */}
      <label>Choose an area <select value={index} onChange={event => setIndex(Number(event.target.value))}>
        {/* Keep every route location available without unlocking gameplay stages. */}
        {AREAS.map((place, i) => <option value={i} key={place.id}>{i + 1}. {place.name}</option>)}
      {/* Finish the location selector. */}
      </select></label>
      {/* Describe the decorative preview for players using assistive technology. */}
      <canvas ref={canvas} width="960" height="320" role="img" aria-label={`${area.name}: ${area.description}`} />
      {/* Give context for the local architecture. */}
      <p><strong>{area.name}</strong> — {area.description}.</p>
      {/* Explain the road pattern and a useful driving strategy. */}
      <p>Road: {area.roadStyle}. {ADVICE[area.hazard]}</p>
      {/* Distinguish the game journey from a navigation map. */}
      <p className="note">A Lagos-inspired tour. Distances, hills and obstacles are designed for play.</p>
      {/* Return focus to the button that opened the guide. */}
      <button className="button" type="button" onClick={() => dialog.current.close()}>Close</button>
    {/* Finish the route preview. */}
    </dialog>
  {/* Finish the grouped controls. */}
  </>;
// Finish the route guide component.
}
