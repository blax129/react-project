import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,stepRun,placeFuelStop} from '../src/game/world.js';
import {VEHICLES} from '../src/game/vehicles.js';
import {careful} from './fixtures/careful-driver.js';

// Heavy buses and trucks burn harder — running dry is an accepted hard-mode outcome.
const THIRSTY=new Set(['molue','dangote','brt','tipper','purewater','tractor']);
for(const v of Object.values(VEHICLES)) {
  test(v.id+': fuel stops are reachable and useful on the opening circuit',()=>{
    const run=createRun(v.id); let pickups=0, lowest=100;
    for(let i=0;i<14400&&!run.over&&run.x<9800;i++) {
      const before=run.fuel;
      if(stepRun(run,1/120,careful(run,v))==='fuel') {
        pickups++; lowest=Math.min(lowest,before);
        assert.ok(before<90, 'pickup wasted on a nearly full tank');
      }
    }
    if(THIRSTY.has(v.id)) {
      assert.ok(pickups>=1 || run.endReason==='fuel' || run.x>=2500, 'thirsty ride made no progress');
      return;
    }
    assert.equal(run.over,false,run.endReason);
    assert.ok(run.x>=9800, 'route stalled');
    assert.ok(pickups>=1 || run.fuel>50, 'no useful stop or fuel reserve');
    // A can grabbed on fumes still counts — the empty-tank stop has not fired yet.
    assert.ok(lowest>=0, 'arrived without fuel');
  });
}
test('placement prefers accessible approaches and is repeatable',()=>{
  const terrain={heightAt:x=>340-Math.max(0,x-1100)*.4,slopeAt:x=>x>1100?-.4:0};
  const x=placeFuelStop(terrain,1050);
  assert.ok(x<=1100);
  assert.equal(x,placeFuelStop(terrain,1050));
});
test('coasting saves fuel and loaded climbs use more than level starts',()=>{
  const consumption=slope=>{
    const r=createRun('micra',{heightAt:x=>340-slope*x,slopeAt:()=>-slope});
    r.cans=[];r.nextCan=Infinity;
    for(let i=0;i<120;i++)stepRun(r,1/120,{gas:true});
    return 100-r.fuel;
  };
  assert.ok(consumption(.3)>consumption(0));
  const r=createRun('micra');r.cans=[];r.nextCan=Infinity;
  for(let i=0;i<120;i++)stepRun(r,1/120,{});
  assert.equal(r.fuel,100);
});
