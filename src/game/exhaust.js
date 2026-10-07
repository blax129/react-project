// Artistic exhaust tuning: rate, opacity, size, lifetime, colour, nozzle X/Y and upward stack flag.
// Modern petrol rides have a faint haze; older commercial diesels have larger grey puffs under load.
export const EXHAUST_PROFILES = {
  // Compact three-wheeler: small, intermittent pale puffs at the rear.
  korope: [8,.16,2.5,.8,'153,165,174',.03,.81,false],
  // Motorcycle: a narrow, low-volume trail from its silencer.
  okada: [6,.12,1.8,.65,'169,182,191',.22,.79,false],
  // Older commuter van: more visible grey exhaust under acceleration.
  danfo: [15,.26,3.8,1.15,'119,126,132',.03,.84,false],
  // Older heavy bus: broad soot-grey puffs that linger briefly.
  molue: [22,.32,5,1.5,'88,94,100',.02,.82,false],
  // Taxi: a moderate, pale rear plume.
  taxi: [7,.13,2.4,.85,'166,174,181',.02,.8,false],
  // Delivery bike: tiny pulses close to its rear wheel.
  delivery: [5,.1,1.7,.6,'177,186,193',.13,.82,false],
  // Tipper: a higher diesel outlet beside the cab.
  tipper: [20,.3,4.5,1.3,'98,104,110',.59,.2,true],
  // Premium SUV: nearly transparent warm-engine haze.
  suv: [3,.055,2,.55,'198,207,212',.02,.83,false],
  // Loaded truck: strong grey pulses behind the cab, especially uphill.
  dangote: [24,.29,4.8,1.45,'100,108,115',.74,.2,true],
  // Police pickup: restrained exhaust close to its rear bumper.
  police: [6,.1,2.6,.75,'174,183,190',.02,.8,false],
  // RX 330: subtle, short-lived petrol exhaust.
  lexus: [3.5,.06,2.1,.6,'196,205,213',.02,.82,false],
  // Weathered estate car: irregular bluish-grey puffs.
  fayawo: [13,.23,3.3,1.1,'144,160,177',.02,.82,false],
  // Small hatchback: sparse wisps rather than a large cloud.
  micra: [4.5,.08,1.8,.65,'187,197,204',.02,.81,false],
  // City bus: a longer but lighter diesel trail than the old Molue.
  brt: [11,.16,3.5,1.05,'145,156,164',.02,.82,false],
  // Older saloon: modest blue-grey puffs on the throttle.
  peugeot: [9,.17,2.8,.95,'153,167,180',.02,.81,false],
  // Delivery truck: medium-density diesel puffs from the chassis rear.
  purewater: [17,.24,4,1.2,'121,132,143',.02,.83,false],
  // Tractor: vertical exhaust from the engine stack.
  tractor: [19,.33,3.6,1.4,'91,99,107',.76,.32,true],
  // Modern GLE: very faint exhaust that disperses quickly.
  benzgle: [2.5,.045,2.2,.5,'204,212,218',.02,.84,false],
  // Coupe: the smallest, quickest-dispersing exhaust effect.
  benzcoupe: [2,.04,1.9,.45,'208,216,221',.02,.83,false],
// Finish all nineteen individual vehicle profiles.
};
// Keep exhaust independent from collision, scoring and fuel consumption.
export function createExhaust() {
  // Particles stay bounded even during long runs on phones.
  return { particles: [], remainder: 0, serial: 0 };
// Finish effect state creation.
}
// Advance effects on the same fixed step as driving, so pausing freezes them too.
export function stepExhaust(state, dt, run, vehicle, controls) {
  // Move existing puffs in world coordinates so the vehicle can leave them behind.
  for (const p of state.particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-dt * 1.5); }
  // Retire expired particles before adding new ones.
  state.particles = state.particles.filter(p => p.age < p.life);
  // An ended run or an empty tank cannot generate more exhaust.
  if (run.over || run.fuel <= 0) return;
  // Resolve the selected ride's individual engine and outlet characteristics.
  const [rate, opacity, size, life, colour, nx, ny, stack] = EXHAUST_PROFILES[vehicle.id];
  // A low-speed uphill throttle creates a stronger plume than coasting.
  const throttle = controls.gas || (controls.brake && run.vx < -5);
  // Negative body angle means the nose points uphill in canvas coordinates.
  const load = throttle ? 1 + Math.max(0, -Math.sin(run.angle)) * .8 : .12;
  // Accumulate fractional emissions independently of screen refresh rate.
  state.remainder += rate * load * dt;
  // Locate the exhaust using the same image-to-body transform as the sprite.
  const lx = vehicle.width * (nx - vehicle.midX), ly = vehicle.wheelY + vehicle.width * vehicle.natH / vehicle.natW * (ny - vehicle.midY);
  // Rotate the outlet with the car when climbing or jumping.
  const cos = Math.cos(run.angle), sin = Math.sin(run.angle);
  // Emit a bounded number of soft particles with deterministic variation.
  while (state.remainder >= 1 && state.particles.length < 64) {
    // Consume one puff and change its shape without affecting gameplay randomness.
    state.remainder--; state.serial++;
    // A repeatable wobble keeps puffs from looking identical.
    const variation = Math.sin(state.serial * 2.399);
    // Stack exhaust rises, while rear exhaust initially jets backwards.
    const jetX = stack ? -6 : -24, jetY = stack ? -32 : -7;
    // Remember the puff's source and individual size, opacity and lifetime.
    state.particles.push({ x: run.x + lx*cos - ly*sin, y: run.y + lx*sin + ly*cos, vx: jetX*cos-jetY*sin+run.vx*.08, vy: jetX*sin+jetY*cos-9+variation*5, age:0, life:life*(1+variation*.18), size:size*(1+variation*.18), opacity:opacity*Math.min(1.3,load), colour });
  // Finish this frame's emissions.
  }
  // Discard excess emissions rather than releasing a burst after reaching the cap.
  state.remainder = Math.min(state.remainder, 1);
// Finish updating the exhaust trail.
}
// Soft radial gradients expand and fade instead of drawing opaque cartoon circles.
export function drawExhaust(ctx, state) {
  // A missing state is allowed in static previews and tests.
  if (!state) return;
  // Paint behind the vehicle using the existing world camera transform.
  for (const p of state.particles) {
    // Expand each puff as its remaining opacity falls.
    const t = p.age / p.life, radius = p.size * (1 + t * 3.5);
    // Feather the entire plume to transparency at its edge.
    const fill = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
    // Fade in briefly at the pipe to avoid a hard popping dot.
    fill.addColorStop(0,`rgba(${p.colour},${p.opacity * Math.min(1,p.age*18) * (1-t)**2})`); fill.addColorStop(1,`rgba(${p.colour},0)`);
    // Draw the expanding puff without changing global opacity.
    ctx.fillStyle=fill; ctx.beginPath(); ctx.arc(p.x,p.y,radius,0,Math.PI*2); ctx.fill();
  // Finish the bounded particle list.
  }
// Finish exhaust rendering.
}
