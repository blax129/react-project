import { hardship, areaAt, AREA_LENGTH } from './areas';
import { METERS } from './constants';

export const CHALLENGE_START = 1100;
export const SECTION_LENGTH = 2200;
const smooth = t => t*t*(3-2*t);
const clamp01 = t => Math.max(0,Math.min(1,t));

// Fixed landmarks make each section learnable, with smooth joins and no cliffs.
export const CHALLENGES = [
  {
    name: 'Crest control',
    advice: 'Build speed uphill. Release gas before the crest.',
    profile: [[0,0],[120,0],[780,110],[840,110],[925,-100],[1000,-100],[2100,0],[2200,0]],
  },
  {
    name: 'Broken road',
    advice: 'Use short throttle bursts. Keep the nose level.',
    profile: [[0,0],[180,0],[330,15],[470,-6],[620,17],[760,-6],[910,19],[1050,-4],[1200,14],[1400,0],[1700,0]],
  },
  {
    name: 'Momentum valley',
    advice: 'Coast downhill, then use momentum for the climb.',
    profile: [[0,0],[180,0],[420,-90],[570,-90],[1450,30],[1900,0],[2200,0]],
  },
  {
    name: 'Double crest',
    advice: 'Brake before the drop. Match your tilt to the landing.',
    profile: [[0,0],[140,0],[650,65],[700,65],[790,-35],[960,-35],[1540,45],[1600,45],[1690,-15],[2100,0],[2200,0]],
  },
  // Elevated deck over a gorge — tip or crawl and the drop ends the run.
  {
    name: 'Bridge run',
    advice: 'Build speed onto the deck. Keep the nose level — tip and you fall into the gorge.',
    profile: [[0,0],[160,0],[380,58],[460,58],[1080,58],[1160,58],[1280,-130],[1480,-130],[1900,10],[2200,0]],
  },
];

// The first circuit teaches the four obstacles. Later circuits keep escalating.
// Bounded growth prevents huge cliffs or numerically unstable endless terrain.
export function sectionDifficulty(index) {
  const extra = Math.max(0, index - CHALLENGES.length + 1);
  const pressure = extra / (extra + 12);
  return {
    strength: .95 + hardship(CHALLENGE_START + index * SECTION_LENGTH) * .7 + pressure * 1.2,
    sharpness: pressure * .65,
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
  // Small background rolls leave the deliberate obstacles easy to read.
  const baseRoll=(Math.sin(x/190)*(10+hard*18)+Math.sin(x/67+.8)*(3+hard*4))*fade;
  let obstacle=0;
  if(x>=CHALLENGE_START) {
    const index=Math.floor((x-CHALLENGE_START)/SECTION_LENGTH);
    const local=x-CHALLENGE_START-index*SECTION_LENGTH;
    // Difficulty increases between sections, never by shifting their positions.
    const {strength,sharpness}=sectionDifficulty(index);
    obstacle=profileHeight(CHALLENGES[index%CHALLENGES.length].profile,local,sharpness)*strength;
  }
  // Broad linking hills replace long recovery flats while keeping a short start.
  const rollingFade=smooth(clamp01((x-650)/700));
  const linkingHills=(Math.sin((x-650)/155)*(17+hard*14))*rollingFade;
  // Later circuits add short hill pairs between the existing major obstacles.
  const comboFade=smooth(clamp01((x-9900)/6000));
  // The smaller wave requires repeated throttle and landing adjustments.
  const combos=Math.sin(x/94)*14*comboFade;
  // Combine the teachable opening with denser late-game climbs.
  // Each neighbourhood adds a different signed road texture to the shared course.
  const area=areaAt(x), local=((Math.max(0,x)%AREA_LENGTH)/AREA_LENGTH);
  // A fourth-power envelope makes height and slope continuous at every area join.
  const envelope=Math.sin(Math.PI*local)**4*smooth(clamp01((x-700)/500));
  // Vary the number and position of surface features across the thirty stops.
  const wave=Math.sin(local*Math.PI*2*area.terrainWaves+area.index*.37);
  // Depressions, humps and rollers need different throttle and landing decisions.
  const shape=area.roadStyle==='potholes'?-wave*wave:area.roadStyle==='humps'?wave*wave:area.roadStyle==='rumble'?Math.sin(local*Math.PI*14):wave;
  // Bound the added geometry so the scene identity does not introduce vertical walls.
  const localRoad=shape*area.terrainAmplitude*envelope;
  // The final road includes both progressive difficulty and local obstacle character.
  return 340-baseRoll-obstacle-linkingHills-combos-localRoad;
}

export function groundSlope(x) {
  return (groundY(x+8)-groundY(x-8))/16;
}

// Tell the player before an obstacle, without exposing implementation details.
export function terrainCue(x) {
  if(x<CHALLENGE_START-350) return 'Warm-up · Build speed and learn your balance.';
  const index=Math.max(0,Math.floor((x-CHALLENGE_START+350)/SECTION_LENGTH));
  const section=CHALLENGES[index%CHALLENGES.length];
  const ahead=x<CHALLENGE_START+index*SECTION_LENGTH;
  const level=difficultyLabel(x);
  return `${level ? level+' · ' : ''}${ahead?'Ahead: ':''}${section.name} · ${section.advice}`;
}
