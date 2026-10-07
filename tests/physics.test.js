import test from 'node:test';
import assert from 'node:assert/strict';
import {VEHICLES} from '../src/game/vehicles.js';
import benchmarks from '../src/game/vehicleBenchmarks.json' with {type:'json'};
import {measureVehicle} from '../scripts/measure-vehicles.js';
import {createRun,stepRun} from '../src/game/world.js';
import {createSimulationClock,FIXED_STEP} from '../src/game/simulationClock.js';
import {createInputState} from '../src/game/controls.js';
import {CAN_FUEL,FUEL_MAX,CAM_X,CAM_Y,WORLD_W,WORLD_H} from '../src/game/constants.js';
const flat={heightAt:()=>340,slopeAt:()=>0};
const incline={heightAt:x=>340-0.15*x,slopeAt:()=>-0.15};
function advance(run, seconds, controls={}) {
  const events=[];
  for(let i=0;i<Math.round(seconds/FIXED_STEP)&&!run.over;i++) events.push(stepRun(run,FIXED_STEP,controls));
  return events;
}
function withoutCans(run) {run.cans=[];run.nextCan=Infinity;return run;}
for(const v of Object.values(VEHICLES)) {
  test(`${v.id}: spawn, opening route, climbing, braking, fuel and crash`,()=>{
    const run=createRun(v.id);
    // The warm-up ends before the deliberate skill obstacles begin.
    for(let i=0;i<1440 && run.x<700 && !run.over;i++) stepRun(run,FIXED_STEP,{gas:true});
    assert.ok(run.x>520,`did not reach opening pickup: ${run.x}`);
    assert.ok(!run.over,`opening crash: ${run.endReason}`);
    assert.ok(run.cans.some(c=>c.taken)||run.x>920,'first can not collected');
    const hill=withoutCans(createRun(v.id,incline));
    advance(hill,5,{gas:true});
    assert.ok(hill.x>200,`cannot climb a 15% grade: ${hill.x}`);
    assert.ok(!hill.over);
    const brake=withoutCans(createRun(v.id,flat));
    brake.vx=100;
    const fuel=brake.fuel;
    stepRun(brake,FIXED_STEP,{brake:true});
    assert.ok(brake.vx>=0&&brake.vx<100);
    assert.equal(brake.fuel,fuel,'braking consumed fuel');
    advance(brake,2,{brake:true});
    assert.ok(brake.vx<0,'no powered reverse');
    assert.ok(brake.fuel<fuel,'reverse used no fuel');
    const empty=withoutCans(createRun(v.id,flat));empty.fuel=0;
    advance(empty,2,{brake:true});
    assert.equal(empty.endReason,'fuel');
    assert.ok(Math.abs(empty.x-40)<0.01,'empty vehicle reversed');
    const coast=withoutCans(createRun(v.id,flat));coast.fuel=0;coast.vx=120;
    advance(coast,.25);
    assert.ok(coast.x>40&&!coast.over,'empty coasting broken');
    const pickup=createRun(v.id,flat);pickup.fuel=90;
    pickup.cans=[{x:pickup.x,taken:false}];pickup.nextCan=Infinity;
    assert.equal(stepRun(pickup,FIXED_STEP,{}),'fuel');
    assert.equal(pickup.fuel,FUEL_MAX);
    assert.notEqual(stepRun(pickup,FIXED_STEP,{}),'fuel');
    const low=createRun(v.id,flat);low.fuel=10;low.cans=[{x:low.x,taken:false}];low.nextCan=Infinity;
    stepRun(low,FIXED_STEP,{});assert.equal(low.fuel,10+CAN_FUEL);
    const upside=withoutCans(createRun(v.id,flat));upside.y=120;upside.angle=Math.PI;
    stepRun(upside,FIXED_STEP,{});
    assert.equal(upside.over,false,'crashed while airborne and roof clear');
    advance(upside,4);
    assert.equal(upside.endReason,'flip','upside-down landing not detected');
    const fresh=createRun(v.id);assert.equal(fresh.fuel,100);assert.equal(fresh.over,false);assert.equal(fresh.vx,0);
    assert.notEqual(fresh.cans,run.cans);
    const left=-v.width*v.midX, top=v.wheelY-v.width*v.natH/v.natW*v.midY;
    assert.ok(CAM_X+left>0 && CAM_X+left+v.width<WORLD_W,'horizontal camera clipping');
    assert.ok(CAM_Y+top>0 && CAM_Y+top+v.width*v.natH/v.natW<WORLD_H,'vertical camera clipping');
    for(const [x,y] of v.roof) assert.ok(x>=left&&x<=left+v.width&&y>=top&&y<=top+v.width*v.natH/v.natW,'roof outside artwork');
  });
  test(`${v.id}: identical simulation at 30, 60 and 120 FPS`,()=>{
    const sample=fps=>{
      const run=createRun(v.id),clock=createSimulationClock();let ticks=0;
      for(let frame=0;frame<fps*10;frame++)clock.advance(1/fps,dt=>{
        const t=ticks++*FIXED_STEP;
        stepRun(run,dt,{gas:t<4 || t>=7,brake:t>=5&&t<6});
      });
      return {x:run.x,y:run.y,vx:run.vx,vy:run.vy,angle:run.angle,fuel:run.fuel,over:run.over,ticks};
    };
    assert.deepEqual(sample(30),sample(120));
    assert.deepEqual(sample(60),sample(120));
  });
}
test('clock discards long interruptions and pause remainder',()=>{
  const clock=createSimulationClock();let ticks=0;
  clock.advance(60,()=>ticks++);assert.equal(ticks,0);
  clock.advance(FIXED_STEP/2,()=>ticks++);clock.reset();
  clock.advance(FIXED_STEP/2,()=>ticks++);assert.equal(ticks,0);
  clock.advance(FIXED_STEP/2,()=>ticks++);assert.equal(ticks,1);
});
test('simultaneous pedals brake without fuel or reversing',()=>{
  const r=withoutCans(createRun('micra',flat));r.vx=100;
  advance(r,1,{gas:true,brake:true});
  assert.equal(r.fuel,100);assert.ok(Math.abs(r.vx)<.01);
});
test('multiple keys and fingers release independently; interruptions clear all',()=>{
  const c={},input=createInputState(c);
  input.press('key:D','gas');input.press('key:Right','gas');input.release('key:D');assert.equal(c.gas,true);
  input.press('pointer:1','gas');input.release('key:Right');assert.equal(c.gas,true);
  input.press('pointer:2','left');input.release('pointer:1');assert.equal(c.gas,false);assert.equal(c.left,true);
  input.clear();assert.deepEqual(c,{gas:false,brake:false,left:false,right:false});
});
test('invalid or zero simulation steps do not mutate runs',()=>{
  const r=createRun('micra');const before=JSON.stringify(r);
  for(const dt of [0,-1,NaN,Infinity])stepRun(r,dt,{gas:true});
  assert.equal(JSON.stringify(r),before);
});

test('published vehicle ratings match freshly measured physics',()=>{
  for(const v of Object.values(VEHICLES)) assert.deepEqual(benchmarks[v.id],measureVehicle(v),`${v.id}: run npm run balance after physics changes`);
});
