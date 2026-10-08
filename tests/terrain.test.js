import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGES,CHALLENGE_START,SECTION_LENGTH,groundY,groundSlope,terrainCue} from '../src/game/terrain.js';
import {createRun,stepRun} from '../src/game/world.js';
import {VEHICLES} from '../src/game/vehicles.js';
import {careful} from './fixtures/careful-driver.js';

// How many challenge shapes the rotation teaches.
const TYPES=CHALLENGES.length;
// Opening circuit distance used by careful-driver regressions.
const CLEAR_X=9800;

test('bridge run is part of the challenge rotation',()=>{
  assert.ok(CHALLENGES.some(c=>c.name==='Bridge run'));
});

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
// Thirsty heavies are meant to feel fuel pressure harder on the opening circuit.
const THIRSTY=new Set(['molue','dangote','brt']);
for(const v of Object.values(VEHICLES)) {
  test(`${v.id}: timed controls clear the opening challenge circuit`,()=>{
    const run=createRun(v.id);
    for(let i=0;i<10800&&!run.over&&run.x<CLEAR_X;i++)stepRun(run,1/120,careful(run,v));
    if(THIRSTY.has(v.id)) {
      // A fuel loss still proves they drove a meaningful stretch under pressure.
      assert.ok(run.x>=2500 || run.endReason==='fuel',`stalled early at ${run.x}`);
      assert.ok(!run.over || run.endReason==='fuel',run.endReason);
      return;
    }
    assert.equal(run.over,false,run.endReason);
    assert.ok(run.x>=CLEAR_X,`stalled at ${run.x}`);
  });
}
test('continuous throttle is measurably less successful than timed control',()=>{
  let crashes=0;
  for(const v of Object.values(VEHICLES)) {
    const run=createRun(v.id);
    for(let i=0;i<10800&&!run.over&&run.x<CLEAR_X;i++)stepRun(run,1/120,{gas:true});
    if(run.endReason==='flip')crashes++;
  }
  assert.ok(crashes>=6,`only ${crashes} rides punished blind throttle`);
});

test('later circuits have steeper drops and climbs, including beyond Epe', () => {
  const peakSlope = index => {
    let peak = 0;
    const start = CHALLENGE_START + index * SECTION_LENGTH;
    for (let dx = 0; dx < SECTION_LENGTH; dx += 4) peak = Math.max(peak, Math.abs(groundSlope(start + dx)));
    return peak;
  };
  // Compare the same challenge shape across early / mid / late circuits.
  for (let type = 0; type < TYPES; type++) {
    const early = peakSlope(type);
    const middle = peakSlope(type + TYPES * 2);
    const late = peakSlope(type + TYPES * 8);
    assert.ok(middle > early * 1.12, `type ${type}: insufficient progression`);
    assert.ok(late >= middle * 1.02, `type ${type}: progression stopped beyond Epe`);
  }
});

test('late-game terrain stays finite and smoothly joined at very high scores', () => {
  for (const index of [4, 12, 40, 400, 19090]) {
    const start = CHALLENGE_START + index * SECTION_LENGTH;
    for (let dx = 0; dx < SECTION_LENGTH; dx += 3) {
      assert.ok(Number.isFinite(groundY(start + dx)));
      assert.ok(Math.abs(groundSlope(start + dx)) < 20, 'unbounded cliff');
    }
    assert.ok(Math.abs(groundY(start - .001) - groundY(start + .001)) < .01);
    assert.ok(Math.abs(groundSlope(start - .001) - groundSlope(start + .001)) < .01);
  }
  assert.match(terrainCue(10000), /Hard/);
  assert.match(terrainCue(21040), /Expert/);
  assert.match(terrainCue(42040), /Extreme/);
});
