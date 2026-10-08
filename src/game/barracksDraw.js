// Share the real vehicle cutouts and exhaust with the solo game.
import {drawVehicle} from './draw';
// Bounded particles keep the military race lightweight on phones.
import {drawExhaust} from './exhaust';
// Render the exact course used by collision and fuel physics.
import {barracksY,barracksSurface,RACE_FINISH,CHECKPOINT_GAP} from './barracks';
// Small geometry helpers keep the original military artwork readable.
const rect=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};
// Draw a clearly readable sign above the track.
function sign(c,x,y,label,colour='#ded5ad'){rect(c,x-3,y,6,80,'#686950');rect(c,x-80,y-27,160,30,colour);c.fillStyle='#17271d';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(label,x,y-7);}
// Hazard boards use a hotter colour so mud and gravel read as danger, not scenery.
function dangerSign(c,x,y,label){rect(c,x-3,y,6,72,'#5a4030');rect(c,x-92,y-28,184,32,'#e4a045');c.fillStyle='#2a1608';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(label,x,y-7);}
// Draw the fictional Ojo Barracks training course and the other racer's latest position.
export function drawBarracks(c,run,opponent,vehicleId) {
  // A dusty green horizon replaces the solo city skyline.
  const sky=c.createLinearGradient(0,0,0,480);sky.addColorStop(0,'#647e79');sky.addColorStop(1,'#c7c3a0');c.fillStyle=sky;c.fillRect(0,0,960,480);
  // Keep the low sun behind the architecture.
  c.fillStyle='#eee1a0';c.beginPath();c.arc(800,82,32,0,Math.PI*2);c.fill();
  // Repeat tents, watchtowers and concrete bunkers in a parallax military compound.
  const shift=(run.x*.14)%1200;
  // Two copies maintain a continuous base perimeter.
  for(let copy=-1;copy<2;copy++) {
    // Translate a single repeating set of original scenery.
    c.save();c.translate(copy*1200-shift,0);
    // A low barracks block and narrow windows establish the base setting.
    rect(c,25,170,230,106,'#696e4a');rect(c,15,165,250,12,'#3c4837');for(let w=0;w<8;w++)rect(c,40+w*26,190,15,25,'#263f3a');
    // A gate carries the requested world name rather than a real unit insignia.
    rect(c,285,140,14,145,'#555d43');rect(c,565,140,14,145,'#555d43');rect(c,280,132,305,38,'#2b4032');c.fillStyle='#f1e6b7';c.font='bold 23px system-ui';c.textAlign='center';c.fillText('OJO BARRACKS',432,159);
    // A watchtower with a fenced platform gives the skyline military character.
    rect(c,645,120,8,165,'#526149');rect(c,702,120,8,165,'#526149');rect(c,627,95,100,45,'#596843');rect(c,639,103,75,20,'#263c39');rect(c,618,88,118,10,'#354b36');
    // Canvas tents sit beside sandbags and supply crates.
    c.fillStyle='#707349';c.beginPath();c.moveTo(780,280);c.lineTo(865,185);c.lineTo(950,280);c.fill();rect(c,856,232,25,48,'#26392b');
    // Nigerian flag colours identify the setting without copying a real operational base.
    rect(c,1010,120,4,165,'#536353');rect(c,1014,120,22,40,'#158259');rect(c,1036,120,22,40,'#eee8d3');rect(c,1058,120,22,40,'#158259');
    // Perimeter fencing and wire stay behind the playable terrain.
    c.strokeStyle='#53604c';c.lineWidth=2;c.beginPath();for(let x=0;x<1200;x+=40){c.moveTo(x,245);c.lineTo(x,289);c.moveTo(x,248);c.lineTo(x+40,280);}c.stroke();
    // Restore the original screen transform for the next tile.
    c.restore();
  // Finish distant architecture.
  }
  // Follow the local car while preserving the familiar 960×480 world framing.
  c.save();c.translate(330-run.x,230-run.y);
  // Fill the terrain down below the viewport, even in deep trenches.
  const left=run.x-360,right=run.x+680;c.beginPath();c.moveTo(left,run.y+900);for(let x=left;x<=right;x+=6)c.lineTo(x,barracksY(x));c.lineTo(right,run.y+900);c.closePath();c.fillStyle='#6b5b3c';c.fill();
  // Give the main road a light dirt edge and a dark, rough driving surface.
  c.beginPath();for(let x=left;x<=right;x+=6){if(x===left)c.moveTo(x,barracksY(x));else c.lineTo(x,barracksY(x));}c.strokeStyle='#c4b38a';c.lineWidth=14;c.stroke();c.strokeStyle='#484d3b';c.lineWidth=8;c.stroke();
  // Paint surface hazards in the same exact coordinates as their physics effects.
  for(let x=Math.floor(left/12)*12;x<right;x+=12){const surface=barracksSurface(x);if(surface){c.strokeStyle=surface==='mud'?'#352b22':'#9b9c86';c.lineWidth=surface==='mud'?10:7;c.beginPath();c.moveTo(x,barracksY(x)-1);c.lineTo(x+12,barracksY(x+12)-1);c.stroke();}}
  // Checkpoint signs make the safe respawn aprons easy to recognize.
  for(let x=Math.max(0,Math.floor(left/CHECKPOINT_GAP)*CHECKPOINT_GAP);x<right&&x<RACE_FINISH;x+=CHECKPOINT_GAP)sign(c,x,barracksY(x)-85,x===0?'TRAINING START':`CHECKPOINT ${x/CHECKPOINT_GAP}`,x<=run.checkpoint?'#9bd0a0':'#ded5ad');
  // Warn before each sector's hazard and climb so players can prepare.
  for(let base=Math.max(0,Math.floor(left/CHECKPOINT_GAP)*CHECKPOINT_GAP);base<right&&base<RACE_FINISH;base+=CHECKPOINT_GAP){
    const sector=base/CHECKPOINT_GAP;
    // Sign just before the mud/gravel patch.
    const hazardX=base+320;
    if(hazardX>left&&hazardX<right)dangerSign(c,hazardX,barracksY(hazardX)-88,sector%2?'GRAVEL AHEAD':'MUD AHEAD — EASE OFF');
    // Sign at the start of the speed runway before the climb.
    const climbX=base+580;
    if(climbX>left&&climbX<right)dangerSign(c,climbX,barracksY(climbX)-88,'CLIMB AHEAD — BUILD SPEED');
    // Late-race second mud strip after the crest.
    if(sector>=7){const lateX=base+1280;if(lateX>left&&lateX<right)dangerSign(c,lateX,barracksY(lateX)-88,'MUD AHEAD');}
  }
  // Fuel markers use bright gold jerrycans and a simple FUEL label.
  for(const can of run.cans){if(can.taken||can.x<left||can.x>right)continue;const y=barracksY(can.x)-42;rect(c,can.x-14,y-15,28,32,'#ffd05a');rect(c,can.x-6,y-22,12,7,'#293f31');c.fillStyle='#25392b';c.font='bold 11px system-ui';c.textAlign='center';c.fillText('FUEL',can.x,y+6);}
  // A tall checked gate is visible before crossing the finite finish line.
  if(right>RACE_FINISH-100){rect(c,RACE_FINISH-5,barracksY(RACE_FINISH)-155,10,155,'#d9dec8');for(let x=0;x<8;x++)for(let y=0;y<2;y++)rect(c,RACE_FINISH+x*15,barracksY(RACE_FINISH)-155+y*15,15,15,(x+y)%2?'#18231f':'#f6eed5');sign(c,RACE_FINISH,barracksY(RACE_FINISH)-190,'FINISH');}
  // The rival is a non-colliding ghost: both players race the same course without network collisions.
  if(opponent&&Math.abs(opponent.x-run.x)<760){c.save();c.globalAlpha=.5;drawVehicle(c,opponent,opponent.vehicle_id);c.restore();c.fillStyle='#e8f1df';c.font='bold 13px system-ui';c.textAlign='center';c.fillText(opponent.player_name,opponent.x,opponent.y-70);}
  // Local exhaust and the player's vehicle remain fully opaque.
  drawExhaust(c,run.exhaust);drawVehicle(c,run,vehicleId);c.restore();
// Finish the military race scene.
}
