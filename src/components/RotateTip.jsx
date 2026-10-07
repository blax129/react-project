// A shared, portrait-only reminder appears before and during a drive.
export default function RotateTip() {
  // Keep the advice visible without blocking portrait play.
  return <aside className="rotate-tip" aria-label="Better on a sideways screen">
    {/* The animated phone makes the suggested gesture easy to understand. */}
    <span className="rotate-phone" aria-hidden="true">↻<span /></span>
    {/* State the action first, followed by its benefit and the lock setting. */}
    <div><strong>Rotate your phone to play</strong><span>Turn sideways for a wider road and easier controls.</span><small>Not rotating? Turn off your phone’s rotation lock.</small></div>
  {/* Finish the non-blocking reminder. */}
  </aside>;
// Finish the reusable orientation prompt.
}
