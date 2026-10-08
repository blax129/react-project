// Both racers use one fixed military obstacle course and the existing vehicle physics.
import { createRun, reseat, stepRun } from './world';
// Respawning clears visual particles without changing vehicle handling.
import { createExhaust } from './exhaust';
// Fifteen sectors form a long but finite race with a real finish line.
export const RACE_FINISH=30000, CHECKPOINT_GAP=2000;
// Smooth interpolation keeps sector edges free of artificial vertical jumps.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// A deterministic course gives both guests identical obstacles.
export function barracksY(x) {
  // Flat start and finish aprons are safe for every vehicle.
  if(x<150||x>RACE_FINISH-180)return 350;
  // Checkpoints divide the track into progressively rougher sectors.
  const sector=Math.floor(x/CHECKPOINT_GAP),local=x-sector*CHECKPOINT_GAP;
  // Leave a long, level apron around every respawn point.
  // Later sectors get much harder; still finishable with careful throttle.
  const envelope=smooth((local-180)/180)*smooth((CHECKPOINT_GAP-180-local)/180),strength=1+Math.min(0.85,sector*.055);
  // Broad climbs combine with shorter crests that punish careless acceleration.
  const hill=110*Math.sin((local-200)*Math.PI/400)+62*Math.sin(local*Math.PI/(145+(sector%3)*18));
  // Alternate washboard ridges, trench bowls and closely spaced humps.
  const detail=sector%3===0?22*Math.sin(local*Math.PI/58):sector%3===1?-88*Math.exp(-(((local-1100)/115)**2)):48*Math.sin(local*Math.PI/95);
  // The same continuous road is used for collisions and rendering.
  return 350-envelope*(hill+detail)*strength;
// Finish the course height function.
}
// Stable numerical differentiation supplies the slope needed by suspension and traction.
export const barracksSlope=x=>(barracksY(x+1)-barracksY(x-1))/2;
// Terrain injection leaves the solo Lagos route unchanged.
export const BARRACKS_TERRAIN={heightAt:barracksY,slopeAt:barracksSlope};
// Both opponents encounter fuel at identical fixed locations.
// Scarce gold cans keep fuel pressure high on the long military course.
export const RACE_FUEL=Array.from({length:Math.ceil(RACE_FINISH/780)},(_,i)=>480+i*780).filter(x=>x<RACE_FINISH-220);
// Restore an upright vehicle to the most recently earned checkpoint.
export function createRaceRun(vehicleId,checkpoint=0,deaths=0) {
  // Reuse all nineteen production handling profiles.
  const run=createRun(vehicleId,BARRACKS_TERRAIN);
  // Clamp reconnection and respawn data to actual checkpoint boundaries.
  run.checkpoint=Math.max(0,Math.min(RACE_FINISH-CHECKPOINT_GAP,Math.floor(checkpoint/CHECKPOINT_GAP)*CHECKPOINT_GAP));
  // Reseat the wheels on the flat checkpoint apron.
  run.x=Math.max(40,run.checkpoint);run.y=barracksY(run.x)-120;run.vx=0;run.vy=0;reseat(run);
  // Disable the solo generator and use identical race fuel stops.
  run.cans=RACE_FUEL.filter(x=>x>run.x-80).map(x=>({x,taken:false}));run.nextCan=Infinity;
  // A full tank makes every individual sector retryable after the time penalty.
  run.fuel=100;run.deaths=deaths;run.exhaust=createExhaust();run.finished=false;
  // Return a complete playable state.
  return run;
// Finish checkpoint restoration.
}
// Mud and gravel punish poor entries but never trap a stationary car permanently.
export function barracksSurface(x) {
  // Surface hazards stay clear of safe respawn aprons.
  const local=((x%CHECKPOINT_GAP)+CHECKPOINT_GAP)%CHECKPOINT_GAP,sector=Math.floor(x/CHECKPOINT_GAP);
  // Alternate grip and fuel challenges between sectors.
  if(local>650&&local<850)return sector%2?'gravel':'mud';
  // Later sectors contain an extra mud patch before the final climb.
  if(sector>=8&&local>1380&&local<1490)return 'mud';
  // Other road sections use normal traction.
  return '';
// Finish surface lookup.
}
// Advance one local physics tick; the room database separately arbitrates the winner.
export function stepRaceRun(run,dt,controls) {
  // Crashed and finished vehicles wait for the room controller.
  if(run.finished||run.over)return run.finished?'finish':'crash';
  // Surface effects apply only while at least one tire touches the course.
  const grounded=run.wheels.some(w=>run.y+w.x*Math.sin(run.angle)+w.y*Math.cos(run.angle)+w.r>=barracksY(run.x+w.x*Math.cos(run.angle)-w.y*Math.sin(run.angle))-3);
  // Determine the shared surface at the vehicle's current position.
  const surface=grounded?barracksSurface(run.x):'';
  // Mud scrubs momentum and increases fuel pressure under throttle.
  if(surface==='mud'){run.vx*=Math.exp(-dt*1.05);if(controls.gas)run.fuel=Math.max(0,run.fuel-dt*2.4);}
  // Controlled low-speed gravel entries avoid the extra slip penalty.
  if(surface==='gravel'&&Math.abs(run.vx)>130)run.vx*=Math.exp(-dt*.65);
  // Preserve the tested driving controls, suspension and upside-down crash rules.
  const event=stepRun(run,dt,controls);
  // Upright arrivals earn permanent progress to the next checkpoint.
  if(!run.over)run.checkpoint=Math.max(run.checkpoint,Math.min(RACE_FINISH-CHECKPOINT_GAP,Math.floor(Math.max(0,run.x)/CHECKPOINT_GAP)*CHECKPOINT_GAP));
  // Crossing the finish freezes this car while the server confirms the result.
  if(!run.over&&run.x>=RACE_FINISH){run.x=RACE_FINISH;run.finished=true;return 'finish';}
  // Bound reverse driving to the start apron.
  if(run.x<20){run.x=20;run.vx=Math.max(0,run.vx);}
  // Return ordinary driving, pickup or crash feedback.
  return event;
// Finish a race physics tick.
}
