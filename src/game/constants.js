// The view is 960 units wide. The screen scales it to fit.
export const WORLD_W = 960;
// The view is 480 units tall.
export const WORLD_H = 480;
// The camera keeps the korope this far from the left edge.
export const CAM_X = 330;
// The camera keeps the korope this far from the top.
export const CAM_Y = 230;
// How far the back wheel sits behind the middle.
export const WHEEL_X = 36;
// How far the wheels sit below the middle. Y grows downward.
export const WHEEL_Y = 18;
// The tire radius.
export const WHEEL_R = 12;
// Pull toward the ground, in units per second squared.
export const GRAVITY = 900;
// Forward push while the gas is held, in units per second squared.
export const ACCEL = 460;
// How hard the brake pulls the speed down.
export const BRAKE = 480;
// Top speed on flat ground.
export const MAX_SPEED = 380;
// Reverse stays slower than the 380 forward cap, but 260 is fast enough that Left clearly travels back along the road.
export const MAX_REVERSE = 260;
// Fuel burned each second the gas pedal is held.
export const FUEL_BURN = 4;
// A full tank.
export const FUEL_MAX = 100;
// A fuel can puts this much back in the tank.
export const CAN_FUEL = 34;
// How close the korope must be to pick up a can.
export const CAN_REACH = 68;
// The first can appears after this much road.
export const FIRST_CAN = 520;
// Cans are about this far apart. The gap grows a little with distance.
export const CAN_GAP = 900;
// Nose-up pull from the gas while airborne, in radians per second squared.
export const WHEELIE = 22;
// Nose-down pull from the brake while airborne, in radians per second squared.
export const NOSE_DOWN = 22;
// How fast the wheels settle back onto the slope.
export const STICK = 4;
// Half a turn from the slope. Past this, the roof faces the road and the korope is upside down.
export const TUMBLE = Math.PI / 2;
// A stopped, empty tank ends the run after this many seconds.
export const STOP_TIME = 0.55;
// Speed below this counts as stopped.
export const STOP_SPEED = 22;
// Distance divided by this number is the score. 42 is a long stretch, so the number climbs slowly.
export const METERS = 42;
// The biggest score the leaderboard will store.
export const MAX_SCORE = 999999;
// The longest name the form will store.
export const MAX_NAME = 16;
