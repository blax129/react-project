import { VEHICLES } from '../src/game/vehicles.js';
import {createRun,stepRun} from '../src/game/world.js';
import {FIXED_STEP} from '../src/game/simulationClock.js';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const flat={heightAt:()=>340,slopeAt:()=>0};
function runFor(run,seconds,controls) {
  for(let i=0;i<Math.round(seconds/FIXED_STEP)&&!run.over;i++)stepRun(run,FIXED_STEP,controls);
  return run;
}
function testRun(id,terrain=flat) {const r=createRun(id,terrain);r.cans=[];r.nextCan=Infinity;return r;}
export function measureVehicle(v) {
  const flatRun=runFor(testRun(v.id),8,{gas:true});
  const braking=testRun(v.id);braking.vx=150;const start=braking.x;
  for(let i=0;i<1200&&braking.vx>1;i++)stepRun(braking,FIXED_STEP,{brake:true});
  let grade=0;
  for(let percent=5;percent<=90;percent+=5) {
    const terrain={heightAt:x=>340-percent/100*x,slopeAt:()=>-percent/100};
    const climb=runFor(testRun(v.id,terrain),6,{gas:true});
    if(!climb.over&&climb.x>200)grade=percent;else break;
  }
  let recoveries=0;
  for(const angle of [-1.8,-1.5,-1.2,-.9,-.6,.6,.9,1.2,1.5,1.8]) {
    const landing=testRun(v.id);landing.y-=110;landing.angle=angle;
    runFor(landing,4,{});
    if(!landing.over&&Math.abs(landing.angle)<.25)recoveries++;
  }
  const opening=createRun(v.id);let pickups=0,seconds=0;
  for(;seconds<30&&!opening.over;seconds+=FIXED_STEP) {
    if(stepRun(opening,FIXED_STEP,{gas:true})==='fuel')pickups++;
  }
  return {
    speed: +flatRun.vx.toFixed(2), climbGrade:grade, landingRecoveries:recoveries,
    economy: +(flatRun.vx/v.fuelBurn).toFixed(2),
    brakingDistance:+(braking.x-start).toFixed(2),
    tankSeconds:+(100/v.fuelBurn).toFixed(2),
    openingDistance:+(opening.x-40).toFixed(1),openingSeconds:+seconds.toFixed(2),
    openingEnd:opening.endReason||'30-second limit',pickups,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const results=Object.fromEntries(Object.values(VEHICLES).map(v=>[v.id,measureVehicle(v)]));
writeFileSync('src/game/vehicleBenchmarks.json',JSON.stringify(results,null,2)+'\n');
console.table(Object.entries(results).map(([id,m])=>({id,...m})));
}
