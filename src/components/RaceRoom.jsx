// The private-room lobby coordinates invitations, vehicle readiness and live race snapshots.
import {useEffect,useRef,useState} from 'react';
// Reuse the guest-only username picker and browser identity.
import PlayerAccount,{usePlayer} from './PlayerAccount';
// The driving simulation stays isolated from the solo game.
import RaceCanvas from './RaceCanvas';
// Orientation guidance remains visible on portrait phones.
import RotateTip from './RotateTip';
// Both racers may select any of the nineteen existing vehicles.
import {VEHICLES,getVehicle} from '../game/vehicles';
// A player becomes ready only after their selected sprite is decoded.
import {vehicleImages} from '../game/vehicleImages';
// Server operations enforce private membership, a two-seat limit and a shared countdown.
import {cleanRoomCode,roomAction,roomError,roomInvite} from '../raceRooms';
// Race progress is independent of the solo leaderboard score.
import {RACE_FINISH} from '../game/barracks';
// Persist the invitation locally so a page reload can reconnect to the same private race.
const ROOM_KEY='road-clear-private-room';
// Render an invitation form, ready room, race, or final result as appropriate.
export default function RaceRoom({onBack,initialCode=''}) {
  // Resolve the current named guest identity.
  const player=usePlayer();
  // Keep room state, typed invite and selected car separate from network progress.
  const [room,setRoom]=useState(null),[code,setCode]=useState(initialCode),[vehicle,setVehicle]=useState('korope'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[qr,setQr]=useState(''),[copyStatus,setCopyStatus]=useState('');
  // Network requests read the newest simulation packet without rerendering on every frame.
  const snapshot=useRef(null),seq=useRef(0),roomRef=useRef(null),inFlight=useRef(false),mounted=useRef(true),autoJoined=useRef(false);
  // Keep a ref synchronized for polling and async action completions.
  roomRef.current=room;
  // Stop updates and delayed polls when the user leaves the mode.
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  // Accept a server snapshot and update the local clock estimate.
  function accept(next){if(!mounted.current)return;seq.current=Math.max(seq.current,next.players.find(p=>p.user_id===player.session?.user?.id)?.seq||0);setRoom(next);setError('');try{localStorage.setItem(ROOM_KEY,next.code);}catch{}}
  // Serialize UI operations with polling so stale reads cannot overwrite a start or finish.
  async function action(type,invite=roomRef.current?.code,state={}) {
    // Only one room mutation is allowed at a time from this browser.
    if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
    // Keep failures visible without silently abandoning the existing room.
    try {const next=await roomAction(type,invite,vehicle,state);accept(next);}
    // Translate membership, readiness and network failures for the player.
    catch(e){if(mounted.current)setError(roomError(e));}
    // Release both network and UI locks after every outcome.
    finally{inFlight.current=false;if(mounted.current)setBusy(false);}
  // Finish one explicit room action.
  }
  // Invitations in links join only after the guest has chosen a username.
  useEffect(()=>{
    // The player can claim a name first without losing the incoming room code.
    if(!player.name||player.loading||autoJoined.current)return;
    // Prefer the explicit invitation over a previously remembered room.
    let remembered='';try{remembered=localStorage.getItem(ROOM_KEY)||'';}catch{}
    // Resume only when there is an actual invitation to use.
    const invite=initialCode||remembered;if(invite){autoJoined.current=true;setCode(invite);action('join',invite);}
  // A newly claimed guest name can unlock the original invitation.
  },[player.name,player.loading,initialCode]);
  // Polling uses a single in-flight request and a bounded rate, including progress updates.
  useEffect(()=>{
    // No room means there is nothing private to read yet.
    if(!room?.code||!player.session?.user?.id)return;
    // Ignore results after this room or round is discarded.
    let live=true,timer;
    // Fetch the latest shared state or publish the next movement packet.
    async function poll(){
      // UI actions take priority over background polling.
      if(!live)return;
      // Only the current room and round may consume this snapshot.
      if(!inFlight.current){inFlight.current=true;try{
        // Publish movement only after the shared start, otherwise send a heartbeat read.
        const current=roomRef.current,packet=snapshot.current,started=current.status==='racing'&&Date.now()+current.clockOffset>=new Date(current.start_at).getTime();
        // A rematch discards packets belonging to its previous round.
        const publish=started&&packet?.round===current.round;
        // Sequence numbers prevent old packets from reversing progress.
        const next=await roomAction(publish?'progress':'read',current.code,vehicle,publish?{...packet,seq:++seq.current}:{});
        // Update state only if this poll still belongs to the mounted room.
        if(live)accept(next);
      // Network errors freeze local controls after a short grace period, then retry automatically.
      }catch(e){if(live)setError(roomError(e));}finally{inFlight.current=false;}}
      // Lobby checks are slower; active races send about two reports per second.
      if(live)timer=setTimeout(poll,roomRef.current?.status==='racing'?500:1200);
    // Finish the bounded polling loop.
    }
    // Start shortly after admission, avoiding a redundant immediate request.
    timer=setTimeout(poll,600);
    // Cancel future requests while allowing an already sent one to settle harmlessly.
    return()=>{live=false;clearTimeout(timer);};
  // Restart only when room membership changes, not on every snapshot.
  },[room?.code,player.session?.user?.id]);
  // Generate the invitation QR only for an actual server-created private room.
  useEffect(()=>{let live=true;setQr('');if(room?.code)import('qrcode').then(({default:QRCode})=>QRCode.toDataURL(roomInvite(room.code),{width:220,margin:3})).then(value=>{if(live)setQr(value);}).catch(()=>{if(live)setCopyStatus('QR unavailable. Share the room code or link instead.');});return()=>{live=false;};},[room?.code]);
  // Local image decoding is part of readiness, preventing one player starting before their car loads.
  async function ready(){if(busy||inFlight.current)return;setBusy(true);try{await vehicleImages.load(getVehicle(vehicle).url);setBusy(false);await action('ready',room.code,{ready:!me.ready});}catch{setError('Could not load that vehicle. Try again.');setBusy(false);}}
  // Changing the lobby car cancels readiness on the server before a start can occur.
  async function chooseCar(id){if(busy||inFlight.current)return;setVehicle(id);if(room){inFlight.current=true;setBusy(true);try{accept(await roomAction('ready',room.code,id,{ready:false}));}catch(e){setError(roomError(e));}finally{inFlight.current=false;setBusy(false);}}}
  // A local exit explicitly forfeits a running race rather than leaving an opponent waiting.
  async function leave(){if(inFlight.current)return;setBusy(true);try{if(room)await roomAction('leave',room.code,vehicle);try{localStorage.removeItem(ROOM_KEY);}catch{}setRoom(null);snapshot.current=null;const url=new URL(window.location.href);url.searchParams.delete('room');window.history.replaceState({},'',url);onBack();}catch(e){setError(roomError(e));}finally{setBusy(false);}}
  // Copy and native sharing require an explicit player gesture.
  async function copyInvite(){try{await navigator.clipboard.writeText(roomInvite(room.code));setCopyStatus('Invite link copied.');}catch{setCopyStatus('Copy the invite link below, or share the room code.');}}
  // Native sharing opens the phone's chosen destination without sending automatically.
  async function shareInvite(){try{await navigator.share({title:'Road Clear — Ojo Barracks',text:`Race me! Private room ${room.code}`,url:roomInvite(room.code)});}catch(e){if(e.name!=='AbortError')setCopyStatus('Use Copy invite or the room code instead.');}}
  // Resolve the local and remote seats from the private snapshot.
  const me=room?.players.find(p=>p.user_id===player.session?.user?.id),rival=room?.players.find(p=>p.user_id!==player.session?.user?.id),host=room?.host_id===player.session?.user?.id;
  // Render the complete private-race flow.
  return <section className="race-room">
    {/* Keep the new world visually distinct from the solo route. */}
    <header className="race-header"><div><span className="race-eyebrow">ROAD CLEAR · PRIVATE 1 V 1</span><h1>Ojo Barracks</h1></div><button className="button ghost" type="button" disabled={busy} onClick={leave}>{room?.status==='racing'?'Leave / forfeit':'Back'}</button></header>
    {/* Explain landscape play before entering the long course. */}
    <RotateTip/>
    {/* Room failures do not discard the invitation or completed progress. */}
    {error&&<p className="race-error" role="alert">{error}</p>}
    {/* Guest identity is required for room ownership, with no email or password fields. */}
    {!player.name?<div className="race-panel"><h2>Choose your callsign</h2><p>Pick a unique username, then host a private room or join a friend.</p><PlayerAccount/></div>:!room?<div className="race-panel"><h2>Enter the proving ground</h2><p>15 sectors. Watch for mud and gravel warnings — mud sticks hard and burns fuel if you keep Gas down. Build speed on the runway, then climb. Fuel cans are scarce. Crash and respawn after 3 seconds at your last checkpoint. First across the finish wins.</p><p>Choose any ride. Your rival is a ghost, so collisions between players cannot decide the race.</p><h3 className="race-vehicles-heading">Available vehicles</h3><div className="race-vehicle-grid" role="listbox" aria-label="Choose your race vehicle">{Object.values(VEHICLES).map(v=><button key={v.id} type="button" role="option" aria-selected={vehicle===v.id} className={vehicle===v.id?'race-vehicle-chip selected':'race-vehicle-chip'} disabled={busy} onClick={()=>setVehicle(v.id)}><img src={v.url} alt="" loading="lazy"/><span>{v.name}</span></button>)}</div><div className="actions"><button className="button" disabled={busy} onClick={()=>action('create',null)}>Host private room</button></div><form onSubmit={e=>{e.preventDefault();action('join',cleanRoomCode(code));}}><label className="field">Room code<input value={code} maxLength={8} onChange={e=>setCode(cleanRoomCode(e.target.value))} placeholder="8-character code" required pattern="[A-Fa-f0-9]{8}"/></label><button className="button ghost" disabled={busy} type="submit">Join room</button></form></div>:<>
      {/* The roster and progress bar make the head-to-head race visible even when cars are far apart. */}
      <div className="race-roster">{room.players.map(p=><div key={p.user_id}><strong>{p.player_name}{p.user_id===player.session.user.id?' · You':''}</strong><span>{getVehicle(p.vehicle_id).name} · {room.status==='waiting'?(p.ready?'Ready':'Choosing ride'):`${Math.floor(p.x/RACE_FINISH*100)}% · ${p.deaths} respawns`}</span><progress max={RACE_FINISH} value={p.x} aria-label={`${p.player_name} race progress`}/></div>)}{!rival&&<div><strong>Waiting for your rival</strong><span>Share the private invitation below.</span></div>}</div>
      {/* Both players must load their chosen vehicles and explicitly become ready. */}
      {room.status==='waiting'&&<div className="race-panel race-lobby"><div><h2>Room <span className="room-code">{room.code}</span></h2><h3 className="race-vehicles-heading">Your vehicle</h3><div className="race-vehicle-grid" role="listbox" aria-label="Choose your race vehicle">{Object.values(VEHICLES).map(v=><button key={v.id} type="button" role="option" aria-selected={me.vehicle_id===v.id} className={me.vehicle_id===v.id?'race-vehicle-chip selected':'race-vehicle-chip'} disabled={busy} onClick={()=>chooseCar(v.id)}><img src={v.url} alt="" loading="lazy"/><span>{v.name}</span></button>)}</div><div className="actions"><button className="button" disabled={busy} onClick={ready}>{me.ready?'Not ready':'Ready to race'}</button>{host&&<button className="button ghost" disabled={busy||room.players.length!==2||!room.players.every(p=>p.ready)} onClick={()=>action('start')}>Start countdown</button>}</div><p>{host?'Both players must be ready before you start.':'The host starts once both of you are ready.'}</p><p>Use separate phones or browser profiles; one browser remembers one player.</p></div><div className="room-invite">{qr&&<img src={qr} alt={`Scan to join private room ${room.code}`} width="180" height="180"/>}<label>Invite link<input readOnly value={roomInvite(room.code)} onFocus={e=>e.target.select()}/></label><div className="actions"><button className="button ghost" onClick={copyInvite}>Copy invite</button>{navigator.share&&<button className="button ghost" onClick={shareInvite}>Share</button>}</div><p role="status">{copyStatus}</p></div></div>}
      {/* Each round gets fresh physics while snapshots keep the active race synchronized. */}
      {room.status==='racing'&&me&&rival&&<RaceCanvas key={`${room.code}-${room.round}`} room={room} userId={player.session.user.id} onSnapshot={value=>{snapshot.current=value;}}/>}
      {/* Only the server-locked result can declare a winner. */}
      {room.status==='finished'&&<div className="race-panel race-result"><span className="race-eyebrow">MISSION COMPLETE</span><h2>{room.players.find(p=>p.user_id===room.winner_id)?.player_name||'No player'} wins!</h2><p>{room.reason==='finish line'?'First across the Ojo Barracks finish line.':room.reason==='opponent left'?'The other player left the race.':'The other player disconnected for over 60 seconds.'}</p>{host?<button className="button" disabled={busy} onClick={()=>{snapshot.current=null;seq.current=0;action('rematch');}}>Rematch</button>:<p>Waiting for the host to offer a rematch.</p>}</div>}
      {/* A closed invitation cannot silently become a new public lobby. */}
      {room.status==='closed'&&<div className="race-panel"><h2>The host closed this room.</h2><p>Go back and create or join another private race.</p></div>}
    {/* Finish the joined-room views. */}
    </>}
  {/* Finish the military race mode. */}
  </section>;
// Finish private-room orchestration.
}
