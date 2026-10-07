// The route supplies deterministic heights so hazards can use gentle approaches.
// The area's researched theme chooses its fictional gameplay obstacle emphasis.
import { AREAS, AREA_LENGTH } from './areas';
import { groundSlope } from './terrain';
// Repeat the obstacle sequence, with the same locations on every attempt.
export const HAZARD_CYCLE = 6600;
// Find a readable, relatively gentle road section close to a planned obstacle.
function gentlePosition(target, width = 0) {
  // Start with the planned position and an unlimited slope score.
  let best = target, cost = Infinity;
  // Search a small range without changing obstacle order.
  for (let x = target - (width ? 300 : 140); x <= target + (width ? 300 : 140); x += 20) {
    // Prefer gentle road while avoiding large shifts from the original target.
    const score = Math.max(Math.abs(groundSlope(x)), Math.abs(groundSlope(x + width / 2)), Math.abs(groundSlope(x + width))) + Math.abs(x - target) / 3000;
    // Remember the best approach found so far.
    if (score < cost) { best = x; cost = score; }
  // Finish the search.
  }
  // Return the same result for the same terrain and target.
  return best;
// Finish the placement helper.
}
// Cache fixed route features rather than resampling terrain every physics frame.
const cycles = new Map();
// Return the obstacles belonging to one route cycle.
function cycleHazards(index) {
  // Reuse positions that were already calculated.
  if (cycles.has(index)) return cycles.get(index);
  // Offset this cycle along the road.
  const base = index * HAZARD_CYCLE;
  // Place sharp debris after the first major climb.
  const debris = gentlePosition(base + 4400);
  // Describe each feature with a stable ID and visible world-space bounds.
  const features = [
    // Mud rewards momentum and makes continuous throttle expensive.
    { id: `mud-${index}`, type: 'mud', x: gentlePosition(base + 2500, 270), width: 180 + Math.min(index, 6) * 15 },
    // Debris only punctures a tank when crossed too fast while grounded.
    { id: `debris-${index}`, type: 'debris', x: debris, width: 100 },
    // A repair stop gives every puncture a reachable recovery opportunity.
    { id: `repair-${index}`, type: 'repair', x: debris + 650, width: 90 },
    // Police require a brief controlled stop before raising the barrier.
    { id: `police-${index}`, type: 'police', x: gentlePosition(base + 6200), width: 90 },
  // Finish this cycle's feature list.
  ];
  // Store the list so drawing and physics share the same positions.
  cycles.set(index, features);
  // Return the fixed features.
  return features;
// Finish the cycle builder.
}
// Cache the extra regional obstacles after the opening tutorial circuit.
const regionalFeatures = new Map();
// Different areas combine their local terrain texture with a distinct hazard emphasis.
function areaHazards(index) {
  // Reuse fixed positions once this region has been prepared.
  if (regionalFeatures.has(index)) return regionalFeatures.get(index);
  // The original opening hazards remain stable for the first five areas.
  if (index < 5 || index >= AREAS.length) return [];
  // Read this area's chosen mechanic and route bounds.
  const area=AREAS[index], target=area.from+650+(index%3)*120;
  // Place mud on gentle ground and stop zones away from severe slopes.
  const x=gentlePosition(target,area.hazard==='mud'?240:0);
  // Keep sufficient separation from the existing global hazards.
  const existing=[...cycleHazards(Math.floor(x/HAZARD_CYCLE)),...cycleHazards(Math.floor(x/HAZARD_CYCLE)+1)];
  // An existing feature takes priority when its warning would overlap this one.
  if (existing.some(h=>Math.abs(h.x-x)<360)) { regionalFeatures.set(index,[]); return []; }
  // A regional obstacle gets a stable ID so penalties and clearance cannot repeat.
  const features=[{id:'area-'+index,type:area.hazard,x,width:area.hazard==='mud'?140+(index%5)*18:90}];
  // Every additional puncture risk also gets a dedicated reachable repair opportunity.
  if(area.hazard==='debris') features.push({id:'area-repair-'+index,type:'repair',x:x+570,width:100});
  // Store the completed local feature set.
  regionalFeatures.set(index,features);
  // Return the fixed regional obstacles.
  return features;
// Finish regional hazard generation.
}

// Find features close enough to affect physics, warnings, or drawing.
export function hazardsNear(x, behind = 500, ahead = 1100) {
  // Begin with an empty visible feature list.
  const features = [];
  // Include adjoining cycles when the camera is near their boundary.
  for (let index = Math.max(0, Math.floor((x - behind) / HAZARD_CYCLE)); index <= Math.floor((x + ahead) / HAZARD_CYCLE); index++) {
    // Keep only features inside the requested range.
    features.push(...cycleHazards(index).filter(h => h.x + h.width >= x - behind && h.x <= x + ahead));
  // Finish collecting nearby cycles.
  }
  // Add nearby region-specific obstacles without searching all thirty areas each frame.
  for(let index=Math.max(0,Math.floor((x-behind-700)/AREA_LENGTH));index<=Math.min(AREAS.length-1,Math.floor((x+ahead)/AREA_LENGTH));index++) {
    // Apply the same visibility bounds as the original route hazards.
    features.push(...areaHazards(index).filter(h=>h.x+h.width>=x-behind&&h.x<=x+ahead));
  // Finish collecting regional features.
  }
  // Return features in their route order.
  return features.sort((a, b) => a.x - b.x);
// Finish the lookup helper.
}
// Ground contact is required for mud, debris, and roadside service stops.
export function activeHazard(run, type) {
  // Custom test terrains do not inherit obstacles from the main route.
  if (!run.hazardsEnabled) return null;
  // Match the ride's position against the feature's visible road patch.
  return hazardsNear(run.x, 300, 0).find(h => h.type === type && run.x >= h.x && run.x <= h.x + h.width) || null;
// Finish the contact lookup.
}
// Apply non-random obstacle effects after the vehicle has moved.
export function stepHazards(run, dt, grounded, controls) {
  // Leave custom terrain simulations unchanged.
  if (!run.hazardsEnabled) return;
  // Leak damage continues while moving or waiting, until a service stop repairs it.
  if (run.leaking) run.fuel = Math.max(0, run.fuel - 1.8 * dt);
  // Only ground contact with sharp debris can puncture the tank.
  const debris = grounded && activeHazard(run, 'debris');
  // A given debris patch can damage the same run only once.
  if (debris && Math.abs(run.vx) > 110 && !run.hazardsHit.has(debris.id)) {
    // Remember the hit so reversing cannot repeatedly apply the initial damage.
    run.hazardsHit.add(debris.id);
    // The initial visible puncture costs fuel immediately.
    run.fuel = Math.max(0, run.fuel - 12);
    // Start the ongoing leak and make its warning visible.
    run.leaking = true;
  // Finish puncture handling.
  }
  // Service stops work only when the ride reaches the road beside them.
  const repair = grounded && activeHazard(run, 'repair');
  // A stop repairs leaks and offers one small emergency refill per run.
  if (repair && !run.serviced.has(repair.id)) {
    // Mark the stop used so reversing cannot farm emergency fuel.
    run.serviced.add(repair.id);
    // Seal any fuel leak.
    run.leaking = false;
    // Restore a limited reserve rather than an entire tank.
    run.fuel = Math.min(100, run.fuel + 20);
  // Finish the service stop.
  }
  // A checkpoint remains active until this run completes its stop.
  const police = hazardsNear(run.x, 160, 150).find(h => h.type === 'police' && !run.clearedCheckpoints.has(h.id));
  // Do not apply checkpoint logic when none is nearby.
  if (!police) { run.checkpointWait = 0; return; }
  // The striped barrier is at the end of the stopping zone.
  const barrier = police.x + police.width;
  // Detect the first fast impact instead of charging a penalty every frame.
  if (run.x >= barrier && !run.hazardsHit.has(police.id)) {
    // Record that this checkpoint has been reached.
    run.hazardsHit.add(police.id);
    // A warned barrier impact wastes fuel; a controlled arrival avoids this cost.
    if (Math.abs(run.vx) > 90) run.fuel = Math.max(0, run.fuel - 12);
  // Finish first-contact handling.
  }
  // Prevent jumping or driving through a closed checkpoint.
  if (run.x >= barrier) {
    // Keep the ride immediately before the visible barrier.
    run.x = barrier - 1;
    // Remove forward movement while retaining natural settling on the road.
    run.vx = Math.min(0, run.vx);
  // Finish the barrier constraint.
  }
  // A near-stationary ride must release Gas and hold the stop for a moment.
  const stopped = grounded && run.x >= police.x - 90 && Math.hypot(run.vx, run.vy) < 22 && !(controls.gas || controls.right);
  // Hold the brakes during inspection so gravity cannot undo a completed stop.
  if (stopped) { run.vx = 0; run.vy = 0; }
  // Leaving the stop or accelerating resets the inspection timer.
  run.checkpointWait = stopped ? run.checkpointWait + dt : 0;
  // Raise the gate once the brief inspection finishes.
  if (run.checkpointWait >= .8) {
    // Remember clearance for the rest of this run, including reverse travel.
    run.clearedCheckpoints.add(police.id);
    // Reset the timer for the next checkpoint.
    run.checkpointWait = 0;
  // Finish checkpoint clearance.
  }
// Finish hazard effects.
}
// Give hazards priority over normal terrain advice when a decision is near.
export function hazardCue(run) {
  // Test terrains and routes without hazards need no extra warning.
  if (!run.hazardsEnabled) return '';
  // Leaking takes priority because it threatens the current run.
  if (run.leaking) return 'FUEL LEAK · Losing fuel fast! Reach the green repair stop.';
  // Show each approaching hazard early enough for braking.
  const next = hazardsNear(run.x, 250, 500).find(h => h.x + h.width >= run.x && !run.clearedCheckpoints.has(h.id) && !run.serviced.has(h.id));
  // Let ordinary terrain warnings return between hazards.
  if (!next) return '';
  // Explain the action needed without hiding the obstacle's consequences.
  const advice = { mud: 'MUD · Carry momentum. Short throttle bursts save fuel.', debris: 'SHARP DEBRIS · Slow to a crawl or jump clear to avoid a fuel leak.', repair: 'REPAIR STOP · Seal leaks and collect 20% emergency fuel.', police: 'POLICE CHECKPOINT · Brake, release Gas, and stop briefly. Ramming costs fuel.' };
  // Return this feature's instruction.
  return advice[next.type];
// Finish the warning helper.
}
