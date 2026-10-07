import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGE_START,SECTION_LENGTH,groundY,groundSlope,terrainCue} from '../src/game/terrain.js';
import {createRun,stepRun} from '../src/game/world.js';
import {VEHICLES} from '../src/game/vehicles.js';
import {careful} from './fixtures/careful-driver.js';

test('terrain is repeatable, finite, and continuous across challenge joins',()=>{
  for(let x=-500;x<40000;x+=17) {
    const value=groundY(x);assert.ok(Number.isFinite(value));assert.equal(groundY(x),value);
    assert.ok(Number.isFinite(groundSlope(x)));
  }
  for(let i=0;i<20;i++) {
    const x=CHALLENGE_START+i*SECTION_LENGTH;
    assert.ok(Math.abs(groundY(x-.001)-groundY(x+.001))<.01);
    assert.ok(Math.abs(groundSlope(x-.001)-groundSlope(x+.001))<.01);
  }
  assert.match(terrainCue(40),/Warm-up/);
  assert.match(terrainCue(CHALLENGE_START-200),/Ahead: Crest control/);
  assert.match(terrainCue(CHALLENGE_START+SECTION_LENGTH+100),/Broken road/);
});
for(const v of Object.values(VEHICLES)) {
  test(`${v.id}: timed controls clear all four challenge types`,()=>{
    const run=createRun(v.id);
    for(let i=0;i<10800&&!run.over&&run.x<9800;i++)stepRun(run,1/120,careful(run,v));
    assert.equal(run.over,false,run.endReason);
    assert.ok(run.x>=9800,`stalled at ${run.x}`);
  });
}
test('continuous throttle is measurably less successful than timed control',()=>{
  let crashes=0;
  for(const v of Object.values(VEHICLES)) {
    const run=createRun(v.id);
    for(let i=0;i<10800&&!run.over&&run.x<9800;i++)stepRun(run,1/120,{gas:true});
    if(run.endReason==='flip')crashes++;
  }
  assert.ok(crashes>=6,`only ${crashes} rides punished blind throttle`);
});
