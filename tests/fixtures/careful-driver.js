import{createRun,stepRun,groundY,groundSlope}from'../../src/game/world.js';import{VEHICLES}from'../../src/game/vehicles.js';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function careful(r,v){
 const c=Math.cos(r.angle),s=Math.sin(r.angle);
 const grounded=r.wheels.some(w=>r.y+w.x*s+w.y*c+w.r>groundY(r.x+w.x*c-w.y*s)-2);
 if(!grounded){let target=Math.atan(groundSlope(r.x+r.vx*.18));let correction=wrap(target-r.angle)-r.angVel*.3;return {gas:correction<-.06,brake:correction>.06};}
 const drop=Math.max(...[30,60,90,120,150,180].map(d=>groundSlope(r.x+d)));
 const target=drop>1?120:v.maxSpeed*.88;
 return {gas:r.vx<target-8,brake:r.vx>target+20};
}
