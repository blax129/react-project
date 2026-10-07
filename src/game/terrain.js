import { hardship } from './areas';

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
];

function profileHeight(points,x) {
  for(let i=1;i<points.length;i++) {
    const [ax,ay]=points[i-1], [bx,by]=points[i];
    if(x<=bx) return ay+(by-ay)*smooth(clamp01((x-ax)/(bx-ax)));
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
    const strength=.95+hardship(CHALLENGE_START+index*SECTION_LENGTH)*.7;
    obstacle=profileHeight(CHALLENGES[index%CHALLENGES.length].profile,local)*strength;
  }
  return 340-baseRoll-obstacle;
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
  return `${ahead?'Ahead: ':''}${section.name} · ${section.advice}`;
}
