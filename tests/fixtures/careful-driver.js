// The test driver reacts to the same fixed warning locations shown to players.
import { hazardsNear } from '../../src/game/hazards.js';
import{createRun,stepRun,groundY,groundSlope}from'../../src/game/world.js';import{VEHICLES}from'../../src/game/vehicles.js';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function careful(r,v){
 const c=Math.cos(r.angle),s=Math.sin(r.angle);
 const grounded=r.wheels.some(w=>r.y+w.x*s+w.y*c+w.r>groundY(r.x+w.x*c-w.y*s)-2);
 if(!grounded){let target=Math.atan(groundSlope(r.x+r.vx*.18));let correction=wrap(target-r.angle)-r.angVel*.3;return {gas:correction<-.06,brake:correction>.06};}
 // Brake for checkpoints and release the pedals to complete inspection.
 const police=r.hazardsEnabled&&hazardsNear(r.x,180,350).find(h=>h.type==='police'&&!r.clearedCheckpoints.has(h.id));
 // At the stopping zone, hold still until the visible barrier clears.
 if(police&&r.x>=police.x-90&&Math.hypot(r.vx,r.vy)<22)return {};
 // Approach at walking pace, braking before reaching the barrier.
 if(police){const target=r.x<police.x-120?70:12;return {gas:r.vx<target-4,brake:r.vx>target+4};}
 // Roll over sharp debris slowly rather than relying on a lucky jump.
 const debris=r.hazardsEnabled&&hazardsNear(r.x,120,350).find(h=>h.type==='debris'&&h.x+h.width>=r.x);
 // Keep a margin below the puncture threshold.
 if(debris)return {gas:r.vx<72,brake:r.vx>90};
 const drop=Math.max(...[30,60,90,120,150,180].map(d=>groundSlope(r.x+d)));
 const target=drop>1?120:v.maxSpeed*.88;
 return {gas:r.vx<target-8,brake:r.vx>target+20};
}
