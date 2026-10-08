import { hardship, areaAt, AREA_LENGTH } from './areas';
import { METERS } from './constants';

export const CHALLENGE_START = 1100;
export const SECTION_LENGTH = 2200;
const smooth = t => t*t*(3-2*t);
const clamp01 = t => Math.max(0,Math.min(1,t));

// Fixed landmarks make each section learnable. Profiles punish held Gas at the lips.
export const CHALLENGES = [
  {
    name: 'Crest control',
    advice: 'Build speed uphill. Release Gas and dab Brake before the crest.',
    // Taller climb then a steeper drop — holding Gas over the lip launches a flip.
    profile: [[0,0],[100,0],[680,116],[780,116],[920,-102],[1080,-102],[2100,0],[2200,0]],
  },
  {
    name: 'Broken road',
    advice: 'Short Gas bursts. Brake between humps to keep the nose level.',
    // Sharper washboard that pitches the cabin if you keep Gas buried.
    profile: [[0,0],[140,0],[300,24],[430,-12],[570,28],[710,-14],[850,30],[990,-12],[1130,24],[1300,-8],[1520,0],[1700,0]],
  },
  {
    name: 'Momentum valley',
    advice: 'Coast downhill — Brake to settle. Gas only on the climb out.',
    // Deeper bowl so the exit crest sits higher and flips harder under Gas.
    profile: [[0,0],[160,0],[400,-110],[560,-110],[1400,48],[1880,0],[2200,0]],
  },
  {
    name: 'Double crest',
    advice: 'Brake before each drop. Match your tilt, then Gas again.',
    profile: [[0,0],[120,0],[580,80],[660,80],[780,-48],[940,-48],[1460,62],[1540,62],[1660,-28],[2080,0],[2200,0]],
  },
  {
    name: 'Bridge run',
    advice: 'Build speed onto the deck. Feather Gas — tip and the gorge ends the run.',
    // Higher deck over a deeper gorge — tip risk climbs with the span height.
    profile: [[0,0],[140,0],[360,66],[440,66],[1000,66],[1080,66],[1220,-130],[1460,-130],[1880,10],[2200,0]],
  },
  // Rapid lips that force Gas off / Brake on before each jump.
  {
    name: 'Sawtooth lips',
    advice: 'Release Gas before every lip. Brake to plant, then Gas again.',
    profile: [[0,0],[120,0],[320,54],[380,54],[500,-36],[620,-36],[820,58],[880,58],[1000,-42],[1140,-42],[1360,66],[1420,66],[1540,-48],[1720,-48],[1980,0],[2200,0]],
  },
];

// The first circuit teaches the obstacles. Later circuits keep escalating.
// Bounded growth prevents huge cliffs or numerically unstable endless terrain.
export function sectionDifficulty(index) {
  const extra = Math.max(0, index - CHALLENGES.length + 1);
  const pressure = extra / (extra + 10);
  return {
    // Peak height grows with distance — taller points mean harder capsizes.
    strength: 1.0 + hardship(CHALLENGE_START + index * SECTION_LENGTH) * .85 + pressure * 1.55,
    // Sharper joins with distance — lips become less forgiving, never walls.
    sharpness: 0.06 + pressure * .68,
  };
}

export function difficultyLabel(x) {
  const score = Math.max(0, Math.floor((x - 40) / METERS));
  if (score >= 1000) return 'Extreme';
  if (score >= 500) return 'Expert';
  // Hard begins after the opening circuit of challenge types (~four sections).
  if (x >= CHALLENGE_START + 4 * SECTION_LENGTH) return 'Hard';
  return '';
}

function profileHeight(points,x,sharpness=0) {
  for(let i=1;i<points.length;i++) {
    const [ax,ay]=points[i-1], [bx,by]=points[i];
    if(x<=bx) {
      const t=smooth(clamp01((x-ax)/(bx-ax)));
      // Sharper transitions retain zero slope at their ends: no seams or jumps.
      const eased=t+(smooth(t)-t)*sharpness;
      return ay+(by-ay)*eased;
    }
  }
  return 0;
}

export function groundY(x) {
  const fade=smooth(clamp01((x-80)/370));
  const hard=hardship(x);
  // Background rolls grow sooner so open road still needs throttle discipline.
  const baseRoll=(Math.sin(x/180)*(12+hard*20)+Math.sin(x/61+.8)*(4+hard*5))*fade;
  let obstacle=0;
  if(x>=CHALLENGE_START) {
    const index=Math.floor((x-CHALLENGE_START)/SECTION_LENGTH);
    const local=x-CHALLENGE_START-index*SECTION_LENGTH;
    // Difficulty increases between sections, never by shifting their positions.
    const {strength,sharpness}=sectionDifficulty(index);
    obstacle=profileHeight(CHALLENGES[index%CHALLENGES.length].profile,local,sharpness)*strength;
  }
  // Linking hills demand release-and-Gas rhythm between big landmarks.
  const rollingFade=smooth(clamp01((x-550)/650));
  const linkingHills=(Math.sin((x-550)/148)*(18+hard*14))*rollingFade;
  // Late-game combos: tight pairs that punish held Gas between crests.
  const comboFade=smooth(clamp01((x-8500)/5000));
  const combos=Math.sin(x/88)*15*comboFade + Math.sin(x/52)*6*comboFade;
  // Each neighbourhood adds a different signed road texture to the shared course.
  const area=areaAt(x), local=((Math.max(0,x)%AREA_LENGTH)/AREA_LENGTH);
  // A fourth-power envelope makes height and slope continuous at every area join.
  const envelope=Math.sin(Math.PI*local)**4*smooth(clamp01((x-700)/500));
  // Vary the number and position of surface features across the thirty stops.
  const wave=Math.sin(local*Math.PI*2*area.terrainWaves+area.index*.37);
  // Depressions, humps and rollers need different throttle and landing decisions.
  const shape=area.roadStyle==='potholes'?-wave*wave:area.roadStyle==='humps'?wave*wave:area.roadStyle==='rumble'?Math.sin(local*Math.PI*14):wave;
  // Bound the added geometry so the scene identity does not introduce vertical walls.
  const localRoad=shape*area.terrainAmplitude*1.12*envelope;
  // The final road includes both progressive difficulty and local obstacle character.
  return 340-baseRoll-obstacle-linkingHills-combos-localRoad;
}

export function groundSlope(x) {
  return (groundY(x+8)-groundY(x-8))/16;
}

// Tell the player before an obstacle, without exposing implementation details.
export function terrainCue(x) {
  if(x<CHALLENGE_START-350) return 'Warm-up · Feather Gas. Brake plants the nose before a lip.';
  const index=Math.max(0,Math.floor((x-CHALLENGE_START+350)/SECTION_LENGTH));
  const section=CHALLENGES[index%CHALLENGES.length];
  const ahead=x<CHALLENGE_START+index*SECTION_LENGTH;
  const level=difficultyLabel(x);
  return `${level ? level+' · ' : ''}${ahead?'Ahead: ':''}${section.name} · ${section.advice}`;
}
