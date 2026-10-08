// Context shares the signed-in identity between the picker and game-over screen.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
// Supabase stores credentials and validates sessions; names stay in a separate protected table.
import { supabase } from '../supabaseClient';
// Claiming is a server-side atomic operation, never just a browser availability check.
import { claimPlayerName, playerError, validatePlayerName } from '../playerNames';
// A single provider keeps account state consistent throughout the app.
const PlayerContext = createContext(null);
// Components read the same current account and claimed name.
export const usePlayer = () => useContext(PlayerContext);
// Mount once above the app so changing screens does not discard identity.
export function PlayerProvider({children}) {
  // Keep the session and claimed name separate so stale names are cleared on logout.
  const [session,setSession] = useState(null), [name,setName] = useState('');
  // Track backend setup and loading without blocking guest play.
  const [loading,setLoading] = useState(Boolean(supabase)), [error,setError] = useState('');
  // Force a profile reload after claiming a name or retrying an interrupted request.
  const [revision,setRevision] = useState(0);
  // Subscribe synchronously; database calls happen outside the Auth callback to avoid locks.
  useEffect(() => {
    // Unconfigured local previews still support guest driving.
    if (!supabase) return;
    // Ignore late initial-session results after a newer authentication event.
    let live=true, changed=false;
    // Supabase restores and renews the persisted account session.
    const {data} = supabase.auth.onAuthStateChange((event,next) => {
      // Avoid changing state after unmount.
      if (!live) return;
      // Remember a newer event and update the current identity.
      changed=true; setSession(next);
      // A new identity must never briefly display the previous owner's name.
      if (event === 'SIGNED_OUT') { setName(''); }
    // Finish the lightweight Auth callback.
    });
    // Restore the existing account without requiring a login on every visit.
    supabase.auth.getSession().then(({data,error}) => { if(live&&!changed) { setSession(data.session); if(error) setError('Could not restore your guest identity. Please retry.'); } }).catch(() => {if(live) setError('Could not restore your player account.');}).finally(() => {if(live) setLoading(false);});
    // Remove the subscription when React cleans up the provider.
    return () => {live=false; data.subscription.unsubscribe();};
  // Subscribe once for the provider lifetime.
  },[]);
  // Load only the current account's protected profile.
  useEffect(() => {
    // Cancel results from a previous account or obsolete request.
    let live=true; setName(''); setError('');
    // Guests have no globally reserved name.
    if(!session?.user?.id || !supabase) {setLoading(false); return;}
    // Keep claiming and score submission unavailable until the profile is resolved.
    setLoading(true);
    // The RPC returns the caller's name without exposing any other identity.
    supabase.rpc('my_moruwa_name').then(({data,error}) => {if(live) {if(error)setError(playerError(error)); else setName(data||'');}}).catch(error=>{if(live)setError(playerError(error));}).finally(()=>{if(live)setLoading(false);});
    // Ignore late network responses after sign-out or an account switch.
    return () => {live=false;};
  // Refresh when identity changes or a successful claim requests a reload.
  },[session?.user?.id,revision]);
  // Expose only the account state and operations needed by the game UI.
  return <PlayerContext.Provider value={{session,name,loading,error,refresh:()=>setRevision(n=>n+1)}}>{children}</PlayerContext.Provider>;
// Finish the global player provider.
}
// Guests choose one permanent nickname without entering an email or password.
export default function PlayerAccount() {
  // The anonymous identity is stored by Supabase in this browser.
  const player=usePlayer(), dialog=useRef(null);
  // Only the public nickname is collected in the form.
  const [nickname,setNickname]=useState(''), [busy,setBusy]=useState(false), [message,setMessage]=useState('');
  // Open the non-blocking name picker from the menu or game-over screen.
  function open() {setMessage(''); dialog.current.showModal();}
  // Create a guest identity only when the player explicitly claims a name.
  async function submit(event) {
    // Avoid page navigation and duplicate requests.
    event.preventDefault(); if(busy||!supabase)return;
    // Invalid names should not create unnecessary guest identities.
    const checked=validatePlayerName(nickname); if(checked.error){setMessage(checked.error);return;}
    // Disable the form while the server resolves the first-claim race.
    setBusy(true); setMessage('');
    // Handle network errors without claiming success locally.
    try {
      // Reuse the browser's existing session instead of creating a new player each run.
      const existing=await supabase.auth.getSession(); if(existing.error)throw existing.error;
      // Anonymous Auth needs no email, password or sign-in screen.
      if(!existing.data.session) {const guest=await supabase.auth.signInAnonymously(); if(guest.error)throw guest.error;}
      // Let the database's unique constraint decide the actual name owner.
      const result=await claimPlayerName(supabase,checked.name);
      // A taken or reserved name remains editable so the guest can try another.
      if(result.error){setMessage(result.error);return;}
      // Refresh the protected profile after a confirmed claim.
      player.refresh(); setMessage(`You claimed ${result.name}! Your name is saved in this browser.`);
    // Distinguish disabled guest registration from normal network failures.
    } catch(error) {setMessage(String(error.message).toLowerCase().includes('anonymous') ? 'Guest name registration is not enabled yet. You can still play.' : playerError(error));}
    // Restore the controls regardless of success or failure.
    finally {setBusy(false);}
  // Finish guest registration.
  }
  // Render an ordinary nickname picker with no account-registration fields.
  return <>
    {/* The chosen username becomes the player's visible identity. */}
    <button className="button ghost" type="button" onClick={open}>{player.name ? `Player: ${player.name}` : 'Choose username'}</button>
    {/* Native dialog navigation keeps the form accessible on phones and keyboards. */}
    <dialog className="settings-dialog player-dialog" ref={dialog} aria-labelledby="player-title">
      {/* Show ownership once the server confirms it. */}
      <h2 id="player-title">{player.name?'Your username':'Choose your username'}</h2>
      {/* Explain the first-claim rule without exposing implementation details. */}
      <p className="note">No email. No password. Pick a name and play. The first player to claim a name keeps it; Ada and ada count as the same name.</p>
      {/* Do not pretend a local preview can reserve names globally. */}
      {!supabase ? <p className="error">Shared usernames are not configured yet. You can still play.</p> : player.name ? <p className="claimed-name">{player.name}<small>This is your name on the leaderboard.</small></p> : <form onSubmit={submit}>
        {/* Collect only the short public nickname. */}
        <label className="field">Username<input value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={16} required autoComplete="off" placeholder="e.g. FestacRider" disabled={busy}/><small>1–16 letters, numbers, spaces or hyphens.</small></label>
        {/* The server atomically reserves a name when this action succeeds. */}
        <button className="button" disabled={busy||player.loading} type="submit">{busy?'Claiming…':player.loading?'Checking your name…':'Claim username'}</button>
      {/* Finish the one-field nickname form. */}
      </form>}
      {/* Clearly explain the browser-only recovery limitation before claiming. */}
      <p className="note">Keep using this browser to keep your name. Clearing its data, using private browsing or switching phones loses access. Claimed names cannot be changed here.</p>
      {/* Profile setup failures are visible and retryable. */}
      {player.error&&<p className="error">{player.error}</p>}
      {/* Announce claim results without changing focus unexpectedly. */}
      {message&&<p role="status" aria-live="polite">{message}</p>}
      {/* Closing preserves both the guest session and any completed claim. */}
      <div className="actions">{player.error&&<button className="button ghost" type="button" onClick={player.refresh} disabled={busy}>Retry</button>}<button className="button ghost" type="button" onClick={()=>dialog.current.close()} disabled={busy}>Done</button></div>
    {/* Finish the nickname dialog. */}
    </dialog>
  {/* Finish the reusable identity control. */}
  </>;
// Finish guest username selection.
}
