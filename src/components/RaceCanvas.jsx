// This canvas runs local physics while private room snapshots carry the rival and race clock.
import {useEffect,useRef,useState} from 'react';
// Reuse the input arbitration that prevents sticky keys and multi-touch pedal conflicts.
import {createInputState,GAS_KEYS,BRAKE_KEYS} from '../game/controls';
// Fixed physics steps keep handling independent of mobile display refresh rate.
import {createSimulationClock} from '../game/simulationClock';
// The finite course provides checkpoint restoration and dedicated hazards.
import {createRaceRun,stepRaceRun,dangerAhead,RACE_FINISH} from '../game/barracks';
// Military scenery and opponent ghosts are drawn separately from the solo world.
import {drawBarracks} from '../game/barracksDraw';
// Load only the two selected car images before racing.
import {vehicleImages} from '../game/vehicleImages';
// Keep the same selectable roster and handling as solo play.
import {getVehicle} from '../game/vehicles';
// Exhaust remains a lightweight visual effect rather than a gameplay penalty.
import {stepExhaust} from '../game/exhaust';
// Use familiar sound feedback for fuel and crashes.
import {playCrash,playFuel,unlockSound} from '../game/sound';
// A round remounts this component; room polls update refs without restarting physics.
export default function RaceCanvas({room,userId,onSnapshot}) {
  // Canvas, room state and local controls survive ordinary React renders.
  const canvas=useRef(null),roomRef=useRef(room),snapshotRef=useRef(onSnapshot),input=useRef(null),driveAllowed=useRef(false);
  // Keep refs current without restarting the animation effect on every network poll.
  roomRef.current=room;snapshotRef.current=onSnapshot;
  // Display only low-frequency dashboard updates in React.
  const [hud,setHud]=useState({fuel:100,x:40,checkpoint:0,deaths:0,warning:''}),[overlay,setOverlay]=useState('Loading vehicles…');
  // Start one isolated simulation for this round.
  useEffect(()=>{
    // Resolve the current seat and chosen vehicle from authoritative room state.
    const initial=roomRef.current,me=initial.players.find(p=>p.user_id===userId),vehicle=getVehicle(me.vehicle_id);
    // Returning after a reload counts as a recovery, not a new race at the start.
    const reconnect=Date.now()+initial.clockOffset-new Date(initial.start_at).getTime()>3000;
    // Restore only the checkpoint previously acknowledged by the server.
    let run=createRaceRun(vehicle.id,me.checkpoint,me.deaths+(reconnect?1:0)),awaitingRespawn=reconnect,delay=0,alive=true,loaded=false,frame=0,last=performance.now(),lastHud=0;
    // Keep inputs and physics scheduling independent of render frequency.
    const controls={gas:false,brake:false},keys=createInputState(controls),clock=createSimulationClock();input.current=keys;
    // The opponent is rendered with its own real sprite.
    const rival=initial.players.find(p=>p.user_id!==userId);
    // Asset readiness precedes local motion even when reconnecting mid-race.
    Promise.all([vehicleImages.load(vehicle.url),vehicleImages.load(getVehicle(rival.vehicle_id).url)]).then(()=>{if(alive)loaded=true;}).catch(()=>{if(alive)setOverlay('Could not load a vehicle. Leave and rejoin to retry.');});
    // Draw in fixed world coordinates with a capped device-pixel ratio.
    const c=canvas.current.getContext('2d');
    // Fit the track and touch controls into the available landscape phone height.
    function fit(){const width=canvas.current.parentElement.clientWidth,available=Math.max(160,window.innerHeight-canvas.current.getBoundingClientRect().top-105),height=Math.min(width/2,available),dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.current.width=960*dpr;canvas.current.height=480*dpr;canvas.current.style.width=`${Math.min(width,height*2)}px`;canvas.current.style.height=`${height}px`;c.setTransform(dpr,0,0,dpr,0,0);}
    // Observe browser rotation and dynamic viewport resizing.
    fit();window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
    // Losing focus releases throttle immediately; the shared race clock keeps running.
    function clear(){keys.clear();clock.reset();last=performance.now();}
    // Ignore typing in dialogs and prevent accidental page scrolling while driving.
    function down(event){if(event.target?.closest?.('input,select,textarea,dialog'))return;const pedal=GAS_KEYS.includes(event.code)?'gas':BRAKE_KEYS.includes(event.code)?'brake':null;if(pedal){event.preventDefault();if(driveAllowed.current&&!event.repeat){unlockSound();keys.press(`key:${event.code}`,pedal);}}}
    // Releases must work even when a player just crashed or lost connection.
    function up(event){keys.release(`key:${event.code}`);}
    // Install keyboard and visibility listeners for this race only.
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
    // Render continuously but publish only lightweight local snapshots to the room controller.
    function tick(now){
      // Stop cleanly when leaving this room or switching rounds.
      if(!alive)return;frame=requestAnimationFrame(tick);const dt=(now-last)/1000;last=now;
      // Latest network state controls race status and the synchronized start time.
      const state=roomRef.current,mine=state.players.find(p=>p.user_id===userId),other=state.players.find(p=>p.user_id!==userId),left=new Date(state.start_at).getTime()-(Date.now()+state.clockOffset);
      // Freeze driving after a connection gap, before clients drift indefinitely apart.
      const connected=Date.now()-state.receivedAt<4000;
      // Wait for the server to acknowledge a checkpoint recovery before moving again.
      if(awaitingRespawn&&mine.deaths>=run.deaths)awaitingRespawn=false;
      // Choose one clear status overlay, preserving the shared clock during local interruptions.
      let label=!loaded?'Loading vehicles…':state.status==='finished'?'Race complete':!connected?'Reconnecting…':left>3000?'GET READY':left>0?String(Math.ceil(left/1000)):awaitingRespawn?'Restoring checkpoint…':run.finished?'Confirming finish…':document.hidden?'':delay>0?`Respawn in ${Math.ceil(delay)}`:'';
      // Only a connected, loaded, active car accepts input.
      driveAllowed.current=loaded&&connected&&left<=0&&state.status==='racing'&&!awaitingRespawn&&!run.finished&&!document.hidden&&delay<=0;
      // Release stale held inputs whenever the race cannot advance normally.
      if(!driveAllowed.current){keys.clear();clock.reset();}
      // Crashes cost three seconds while the opponent continues racing.
      if(delay>0&&connected&&!document.hidden&&dt<.25){delay=Math.max(0,delay-dt);if(delay===0){run=createRaceRun(vehicle.id,Math.min(run.checkpoint,mine.checkpoint),run.deaths+1);awaitingRespawn=true;}}
      // Advance the original vehicle simulation at a fixed step while racing.
      if(driveAllowed.current)clock.advance(dt,step=>{const event=stepRaceRun(run,step,controls);stepExhaust(run.exhaust,step,run,vehicle,controls);if(event==='fuel')playFuel();if(event==='crash'){delay=3;keys.clear();playCrash();return false;}if(event==='finish'){keys.clear();return false;}});
      // Bound packet coordinates and share checkpoint/death information with the controller.
      snapshotRef.current({x:Math.max(20,Math.min(RACE_FINISH,run.x)),y:Math.max(-2000,Math.min(2500,run.y)),angle:run.angle,fuel:run.fuel,deaths:run.deaths,round:state.round});
      // Draw the base, road, fuel, checkpoints and latest rival ghost.
      drawBarracks(c,run,other,vehicle.id);
      // Update accessible overlays and fuel/progress text at ten hertz.
      if(now-lastHud>100){lastHud=now;setOverlay(label);const warn=dangerAhead(run.x);setHud({fuel:run.fuel,x:run.x,checkpoint:run.checkpoint,deaths:run.deaths,warning:warn?warn.label:''});}
    // Finish an animation frame.
    }
    // Begin the frame loop after all handlers exist.
    frame=requestAnimationFrame(tick);
    // Remove every listener and pending frame when the race component unmounts.
    return()=>{alive=false;keys.clear();driveAllowed.current=false;cancelAnimationFrame(frame);window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);};
  // A fresh round is mounted by the parent key rather than by network snapshot changes.
  },[userId]);
  // Pointer capture makes two-thumb controls reliable when fingers slide off the buttons.
  function pedalDown(event,name){event.preventDefault();if(!driveAllowed.current)return;unlockSound();event.currentTarget.setPointerCapture(event.pointerId);input.current?.press(`pointer:${event.pointerId}`,name);}
  // Clear the correct finger on release, cancellation or lost capture.
  function pedalUp(event){input.current?.release(`pointer:${event.pointerId}`);}
  // Display race-specific fuel, recovery and progress information.
  return <div className="race-driving">
    {/* A compact dashboard leaves room for the road on landscape phones. */}
    <div className="race-stats"><span>Fuel <strong>{Math.ceil(hud.fuel)}%</strong></span><span>Checkpoint {hud.checkpoint/2000}/14</span><span>Respawns {hud.deaths}</span><span>{Math.floor(hud.x/RACE_FINISH*100)}% complete</span>{hud.warning?<span className="race-warning" role="status">{hud.warning}</span>:null}</div>
    {/* The overlay is separate from the pedals so touch targets never move. */}
    <div className="race-stage"><canvas ref={canvas} aria-label="Ojo Barracks military obstacle course"/>{overlay&&<div className="race-overlay" role="status">{overlay}</div>}</div>
    {/* Race mode uses the same brake/reverse and gas/air-tilt techniques as solo. */}
    <div className="race-pedals">{['brake','gas'].map(name=><button key={name} className={`pedal ${name}`} type="button" onPointerDown={event=>pedalDown(event,name)} onPointerUp={pedalUp} onPointerCancel={pedalUp} onLostPointerCapture={pedalUp}>{name==='gas'?'Gas':'Brake'}</button>)}</div>
  {/* Finish the driving panel. */}
  </div>;
// Finish multiplayer rendering and input.
}
