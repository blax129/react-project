// The rickshaw picture. Kept from the earlier cutout.
import koropeUrl from "./korope.png";
// The motorcycle picture. Kept from the earlier cutout.
import okadaUrl from "./okada.png";
// The six rides cropped from the first concept sheet.
import danfoUrl from "./danfo.png";
import molueUrl from "./molue.png";
import taxiUrl from "./taxi.png";
import deliveryUrl from "./delivery.png";
import tipperUrl from "./tipper.png";
import suvUrl from "./suv.png";
// The five rides cropped from the second concept sheet.
import dangoteUrl from "./dangote.png";
import policeUrl from "./police.png";
import lexusUrl from "./lexus.png";
import fayawoUrl from "./fayawo.png";
import micraUrl from "./micra.png";
// The six rides cropped from the third concept sheet.
import brtUrl from "./brt.png";
import peugeotUrl from "./peugeot.png";
import purewaterUrl from "./purewater.png";
import tractorUrl from "./tractor.png";
import benzgleUrl from "./benzgle.png";
import benzcoupeUrl from "./benzcoupe.png";

// Base hill-climb numbers. Each ride multiplies or replaces these.
import {
  ACCEL,
  BRAKE,
  FUEL_BURN,
  MAX_REVERSE,
  MAX_SPEED,
  NOSE_DOWN,
  STICK,
  WHEELIE,
  WHEEL_R,
  WHEEL_X,
  WHEEL_Y,
} from "./constants";

// Builds one ride's drawing size and handling from the shared base numbers.
function ride(opts) {
  // The finished ride object.
  return {
    // Stored in state and localStorage.
    id: opts.id,
    // Shown on the picker card.
    name: opts.name,
    // The personality line under the name.
    blurb: opts.blurb,
    // The cutout file.
    url: opts.url,
    // Draw width that puts pictured wheels on the physics wheels.
    width: opts.width,
    // Natural pixel width of the cutout.
    natW: opts.natW,
    // Natural pixel height of the cutout.
    natH: opts.natH,
    // Wheel midpoint as a fraction of the picture width.
    midX: opts.midX,
    // Wheel vertical center as a fraction of the picture height.
    midY: opts.midY,
    // Forward push while gas is held.
    accel: opts.accel,
    // How hard brake and Left pull the speed down.
    brake: opts.brake,
    // Top forward speed.
    maxSpeed: opts.maxSpeed,
    // Top reverse speed.
    maxReverse: opts.maxReverse,
    // Fuel burned each second the gas is held.
    fuelBurn: opts.fuelBurn,
    // Nose-up pull in the air.
    wheelie: opts.wheelie,
    // Nose-down pull in the air.
    noseDown: opts.noseDown,
    // How hard the body sticks to the slope. Higher is more stable.
    stick: opts.stick,
    // Half the wheelbase. Larger values make a longer ride.
    wheelX: opts.wheelX,
    // How far the wheels sit below the body center.
    wheelY: opts.wheelY,
    // Tire radius. Larger tires ride over chatter more easily.
    wheelR: opts.wheelR,
    // Ground drag strength. Higher scrub makes the ride feel heavier.
    drag: opts.drag,
    // How fast spin fades. Higher keeps a heavy ride from flipping forever.
    spinDamp: opts.spinDamp,
  };
}

// All pickable rides, in slideshow order.
export const VEHICLES = {
  // Beginner keke. Light, steady, thrifty.
  korope: ride({
    id: "korope",
    name: "Korope",
    blurb: "Small body, strong spirit.",
    url: koropeUrl,
    width: 107,
    natW: 307,
    natH: 203,
    midX: 0.575,
    midY: 176 / 203,
    // Modest push. Easy to learn.
    accel: ACCEL * 0.95,
    brake: BRAKE * 1.0,
    // A little slower than the taxi and the SUV.
    maxSpeed: MAX_SPEED * 0.88,
    maxReverse: MAX_REVERSE * 0.9,
    // Sips fuel.
    fuelBurn: FUEL_BURN * 0.72,
    // Mild air tips. Can still tip if pushed.
    wheelie: WHEELIE * 0.9,
    noseDown: NOSE_DOWN * 0.9,
    // Steady on the slope.
    stick: STICK * 1.15,
    wheelX: WHEEL_X * 0.95,
    wheelY: WHEEL_Y,
    wheelR: WHEEL_R,
    drag: 0.55,
    spinDamp: 0.85,
  }),
  // Light bike. Quick, thrifty, tippy in the air.
  okada: ride({
    id: "okada",
    name: "Okada",
    blurb: "Beat the traffic. Chase the thrill.",
    url: okadaUrl,
    width: 130,
    natW: 421,
    natH: 358,
    midX: 199 / 421,
    midY: 310 / 358,
    // Snappy launch.
    accel: ACCEL * 1.22,
    brake: BRAKE * 0.95,
    maxSpeed: MAX_SPEED * 1.05,
    maxReverse: MAX_REVERSE * 1.0,
    // Very thrifty.
    fuelBurn: FUEL_BURN * 0.55,
    // Strong mid-air rotation. Stronger than the buses.
    wheelie: WHEELIE * 1.22,
    noseDown: NOSE_DOWN * 1.22,
    // Needs care on rough landings, but holds the opening road.
    stick: STICK * 1.05,
    wheelX: WHEEL_X * 0.88,
    wheelY: WHEEL_Y * 0.95,
    wheelR: WHEEL_R * 0.92,
    drag: 0.48,
    spinDamp: 0.75,
  }),
  // Versatile yellow bus from the concept sheet.
  danfo: ride({
    id: "danfo",
    name: "Danfo",
    blurb: "Every stop is an adventure.",
    url: danfoUrl,
    width: 128,
    natW: 394,
    natH: 188,
    midX: 0.551,
    midY: 0.75,
    // Strong acceleration for an all-rounder.
    accel: ACCEL * 1.08,
    brake: BRAKE * 1.0,
    maxSpeed: MAX_SPEED * 1.0,
    maxReverse: MAX_REVERSE * 0.95,
    // Moderate burn.
    fuelBurn: FUEL_BURN * 1.0,
    wheelie: WHEELIE * 1.0,
    noseDown: NOSE_DOWN * 1.0,
    // A little bounce, still steadier than the bike and the taxi.
    stick: STICK * 1.0,
    wheelX: WHEEL_X * 1.08,
    wheelY: WHEEL_Y,
    wheelR: WHEEL_R * 1.0,
    drag: 0.55,
    spinDamp: 0.8,
  }),
  // Long heavy bus. Momentum, slow climb off the line.
  molue: ride({
    id: "molue",
    name: "Molue",
    blurb: "Big bus. Big momentum.",
    url: molueUrl,
    width: 155,
    natW: 489,
    natH: 170,
    midX: 0.516,
    midY: 0.759,
    // Slow to get going.
    accel: ACCEL * 0.55,
    // Soft brakes. Needs distance.
    brake: BRAKE * 0.68,
    maxSpeed: MAX_SPEED * 0.78,
    maxReverse: MAX_REVERSE * 0.7,
    // Thirsty.
    fuelBurn: FUEL_BURN * 1.55,
    // Hard to flip on purpose in the air.
    wheelie: WHEELIE * 0.42,
    noseDown: NOSE_DOWN * 0.42,
    // Long body holds the slope, but crests are harsh.
    stick: STICK * 1.25,
    // Long wheelbase.
    wheelX: WHEEL_X * 1.45,
    wheelY: WHEEL_Y * 1.05,
    wheelR: WHEEL_R * 0.95,
    // Heavy scrub.
    drag: 0.72,
    spinDamp: 1.15,
  }),
  // Fast saloon. Low to the ground.
  taxi: ride({
    id: "taxi",
    name: "Lagos Taxi",
    blurb: "Another fare. Another fast run.",
    url: taxiUrl,
    width: 115,
    natW: 430,
    natH: 158,
    midX: 0.51,
    midY: 0.772,
    // Sharp launch.
    accel: ACCEL * 1.38,
    brake: BRAKE * 1.2,
    // Highest road speed among the early sheet.
    maxSpeed: MAX_SPEED * 1.28,
    maxReverse: MAX_REVERSE * 1.1,
    fuelBurn: FUEL_BURN * 1.05,
    wheelie: WHEELIE * 1.05,
    noseDown: NOSE_DOWN * 1.05,
    // Low clearance. Rough landings hurt more than the SUV.
    stick: STICK * 0.92,
    wheelX: WHEEL_X * 0.98,
    // Sits lower on the chassis.
    wheelY: WHEEL_Y * 0.85,
    // Smaller tires.
    wheelR: WHEEL_R * 0.82,
    drag: 0.48,
    spinDamp: 0.7,
  }),
  // Cargo truck. Soft and a bit top-heavy.
  delivery: ride({
    id: "delivery",
    name: "Delivery Truck",
    blurb: "Deliver the goods. Keep them aboard.",
    url: deliveryUrl,
    width: 125,
    natW: 427,
    natH: 172,
    midX: 0.445,
    midY: 0.746,
    accel: ACCEL * 0.95,
    brake: BRAKE * 0.95,
    maxSpeed: MAX_SPEED * 0.95,
    maxReverse: MAX_REVERSE * 0.9,
    fuelBurn: FUEL_BURN * 1.15,
    // Soft air control. Cargo makes flips sluggish.
    wheelie: WHEELIE * 0.78,
    noseDown: NOSE_DOWN * 0.78,
    // Soft suspension feel.
    stick: STICK * 0.78,
    wheelX: WHEEL_X * 1.12,
    wheelY: WHEEL_Y * 1.0,
    wheelR: WHEEL_R * 1.0,
    drag: 0.6,
    spinDamp: 0.9,
  }),
  // Dump truck. Torque and traction over speed.
  tipper: ride({
    id: "tipper",
    name: "Tipper Truck",
    blurb: "Slow climb. Serious power.",
    url: tipperUrl,
    width: 145,
    natW: 464,
    natH: 208,
    midX: 0.46,
    midY: 0.678,
    // Strong enough to climb, not snappy.
    accel: ACCEL * 0.88,
    brake: BRAKE * 0.82,
    // Slow on the flat.
    maxSpeed: MAX_SPEED * 0.62,
    maxReverse: MAX_REVERSE * 0.65,
    // Heavy burn.
    fuelBurn: FUEL_BURN * 1.5,
    // Slow air rotation.
    wheelie: WHEELIE * 0.38,
    noseDown: NOSE_DOWN * 0.38,
    // Excellent traction feel on the slope.
    stick: STICK * 1.4,
    wheelX: WHEEL_X * 1.28,
    wheelY: WHEEL_Y * 1.15,
    // Large tires.
    wheelR: WHEEL_R * 1.35,
    drag: 0.78,
    spinDamp: 1.25,
  }),
  // Luxury SUV. Strong, grippy, thirsty.
  suv: ride({
    id: "suv",
    name: "Premium SUV",
    blurb: "Comfort meets climbing power.",
    url: suvUrl,
    width: 125,
    natW: 468,
    natH: 179,
    midX: 0.515,
    midY: 0.706,
    accel: ACCEL * 1.2,
    brake: BRAKE * 1.1,
    maxSpeed: MAX_SPEED * 1.15,
    maxReverse: MAX_REVERSE * 1.0,
    // Comfort costs fuel.
    fuelBurn: FUEL_BURN * 1.4,
    wheelie: WHEELIE * 0.85,
    noseDown: NOSE_DOWN * 0.85,
    // Forgiving suspension.
    stick: STICK * 1.28,
    wheelX: WHEEL_X * 1.12,
    wheelY: WHEEL_Y * 1.1,
    // Tall tires and clearance.
    wheelR: WHEEL_R * 1.22,
    drag: 0.58,
    spinDamp: 0.95,
  }),
  // Articulated cement hauler. Slow, planted, thirsty.
  dangote: ride({
    id: "dangote",
    name: "Dangote Truck",
    blurb: "The Heavyweight. Slow and steady, but nothing stops the load.",
    url: dangoteUrl,
    width: 160,
    natW: 595,
    natH: 184,
    midX: 0.55,
    midY: 0.78,
    // Strong torque for hills, still slow to top out.
    accel: ACCEL * 0.78,
    // Soft brakes. Needs a long runway.
    brake: BRAKE * 0.55,
    // Lowest road speed in the garage.
    maxSpeed: MAX_SPEED * 0.52,
    maxReverse: MAX_REVERSE * 0.5,
    // Drinks fuel.
    fuelBurn: FUEL_BURN * 1.85,
    // Almost no mid-air flips.
    wheelie: WHEELIE * 0.28,
    noseDown: NOSE_DOWN * 0.28,
    // Long multi-axle body holds the slope hard.
    stick: STICK * 1.55,
    // Longest wheelbase.
    wheelX: WHEEL_X * 1.65,
    wheelY: WHEEL_Y * 1.1,
    wheelR: WHEEL_R * 1.15,
    // Heavy scrub.
    drag: 0.88,
    spinDamp: 1.4,
  }),
  // Pursuit pickup. Rugged all-rounder.
  police: ride({
    id: "police",
    name: "Police Pickup",
    blurb: "The Law. Rugged, reliable, and built for the chase.",
    url: policeUrl,
    width: 125,
    natW: 406,
    natH: 161,
    midX: 0.53,
    midY: 0.71,
    // Solid chase pace.
    accel: ACCEL * 1.12,
    brake: BRAKE * 1.1,
    maxSpeed: MAX_SPEED * 1.08,
    maxReverse: MAX_REVERSE * 1.0,
    fuelBurn: FUEL_BURN * 1.2,
    wheelie: WHEELIE * 0.75,
    noseDown: NOSE_DOWN * 0.75,
    // Wide stance and knobby tires.
    stick: STICK * 1.32,
    wheelX: WHEEL_X * 1.1,
    wheelY: WHEEL_Y * 1.08,
    // Tall off-road rubber.
    wheelR: WHEEL_R * 1.18,
    drag: 0.58,
    spinDamp: 1.0,
  }),
  // Soft-life luxury crossover.
  lexus: ride({
    id: "lexus",
    name: "Lexus RX 330",
    blurb: "Soft Life. Smooth handling for the urban elite.",
    url: lexusUrl,
    width: 125,
    natW: 471,
    natH: 170,
    midX: 0.497,
    midY: 0.789,
    // Smooth, quick enough for the express.
    accel: ACCEL * 1.18,
    brake: BRAKE * 1.15,
    maxSpeed: MAX_SPEED * 1.18,
    maxReverse: MAX_REVERSE * 1.0,
    fuelBurn: FUEL_BURN * 1.25,
    wheelie: WHEELIE * 0.8,
    noseDown: NOSE_DOWN * 0.8,
    // Balanced grip. Not a tipper, not a bike.
    stick: STICK * 1.15,
    wheelX: WHEEL_X * 1.05,
    wheelY: WHEEL_Y * 1.0,
    wheelR: WHEEL_R * 1.05,
    drag: 0.52,
    spinDamp: 0.9,
  }),
  // Jacked smuggler wagon. Fast but tippy.
  fayawo: ride({
    id: "fayawo",
    name: "Fayawo",
    blurb: "The Smuggler. Beat up but fast. Watch your balance on those bumps.",
    url: fayawoUrl,
    width: 125,
    natW: 466,
    natH: 188,
    midX: 0.515,
    midY: 0.705,
    // Quick getaway.
    accel: ACCEL * 1.32,
    brake: BRAKE * 1.05,
    // Near the top of the speed chart.
    maxSpeed: MAX_SPEED * 1.22,
    maxReverse: MAX_REVERSE * 1.05,
    // Thirsty modified motor.
    fuelBurn: FUEL_BURN * 1.35,
    // Raised rear makes air tips wild.
    wheelie: WHEELIE * 1.35,
    noseDown: NOSE_DOWN * 1.15,
    // Low stability from the rake.
    stick: STICK * 0.72,
    wheelX: WHEEL_X * 1.0,
    // Tall clearance from the lift.
    wheelY: WHEEL_Y * 1.2,
    wheelR: WHEEL_R * 1.1,
    drag: 0.5,
    spinDamp: 0.65,
  }),
  // Tiny city hatch. Nimble and thrifty.
  micra: ride({
    id: "micra",
    name: "Micra",
    blurb: "The Nimble One. Sips fuel and weaves through any gap.",
    url: micraUrl,
    width: 115,
    natW: 336,
    natH: 129,
    midX: 0.496,
    midY: 0.804,
    // Peppy for its size.
    accel: ACCEL * 1.05,
    brake: BRAKE * 1.1,
    maxSpeed: MAX_SPEED * 0.98,
    maxReverse: MAX_REVERSE * 0.95,
    // Best fuel economy in the garage.
    fuelBurn: FUEL_BURN * 0.48,
    wheelie: WHEELIE * 1.1,
    noseDown: NOSE_DOWN * 1.1,
    // Light body gets tossed on rough landings.
    stick: STICK * 0.82,
    // Short wheelbase.
    wheelX: WHEEL_X * 0.82,
    wheelY: WHEEL_Y * 0.9,
    // Small tires struggle on chatter.
    wheelR: WHEEL_R * 0.78,
    drag: 0.45,
    spinDamp: 0.7,
  }),
  // Long city bus. Steady, slow, thirsty.
  brt: ride({
    id: "brt",
    name: "Lagos BRT",
    blurb: "Blue corridor king. Long body, long runway.",
    url: brtUrl,
    width: 160,
    natW: 547,
    natH: 160,
    midX: 0.52,
    midY: 0.78,
    // Slow off the line.
    accel: ACCEL * 0.62,
    brake: BRAKE * 0.72,
    maxSpeed: MAX_SPEED * 0.72,
    maxReverse: MAX_REVERSE * 0.65,
    // Thirsty diesel.
    fuelBurn: FUEL_BURN * 1.6,
    // Hard to flip on purpose.
    wheelie: WHEELIE * 0.35,
    noseDown: NOSE_DOWN * 0.35,
    // Long wheelbase holds the slope.
    stick: STICK * 1.35,
    wheelX: WHEEL_X * 1.55,
    wheelY: WHEEL_Y * 1.05,
    wheelR: WHEEL_R * 1.05,
    drag: 0.74,
    spinDamp: 1.2,
  }),
  // Classic cream saloon. Balanced workhorse.
  peugeot: ride({
    id: "peugeot",
    name: "Peugeot 504",
    blurb: "Old school legend. Still refuses to die.",
    url: peugeotUrl,
    width: 115,
    natW: 458,
    natH: 150,
    midX: 0.51,
    midY: 0.8,
    accel: ACCEL * 1.05,
    brake: BRAKE * 1.0,
    maxSpeed: MAX_SPEED * 1.02,
    maxReverse: MAX_REVERSE * 0.95,
    fuelBurn: FUEL_BURN * 1.1,
    wheelie: WHEELIE * 0.95,
    noseDown: NOSE_DOWN * 0.95,
    // Rugged and planted.
    stick: STICK * 1.12,
    wheelX: WHEEL_X * 1.0,
    wheelY: WHEEL_Y * 0.92,
    wheelR: WHEEL_R * 0.95,
    drag: 0.52,
    spinDamp: 0.88,
  }),
  // Sachet water hauler. Soft and top-heavy.
  purewater: ride({
    id: "purewater",
    name: "Pure Water Truck",
    blurb: "Cold water for the road. Watch the load on the bumps.",
    url: purewaterUrl,
    width: 130,
    natW: 490,
    natH: 182,
    midX: 0.5,
    midY: 0.76,
    accel: ACCEL * 0.9,
    brake: BRAKE * 0.9,
    maxSpeed: MAX_SPEED * 0.88,
    maxReverse: MAX_REVERSE * 0.85,
    fuelBurn: FUEL_BURN * 1.25,
    // Soft flips with a tall cage of sachets.
    wheelie: WHEELIE * 0.7,
    noseDown: NOSE_DOWN * 0.7,
    // Top-heavy cargo.
    stick: STICK * 0.85,
    wheelX: WHEEL_X * 1.15,
    wheelY: WHEEL_Y * 1.05,
    wheelR: WHEEL_R * 1.05,
    drag: 0.62,
    spinDamp: 0.92,
  }),
  // Farm tractor with a loaded trailer. Slow climb, huge grip.
  tractor: ride({
    id: "tractor",
    name: "Tractor + Trailer",
    blurb: "Farm power. Slow climb, serious pull.",
    url: tractorUrl,
    width: 155,
    natW: 481,
    natH: 180,
    midX: 0.48,
    midY: 0.72,
    // Strong pull, not a highway machine.
    accel: ACCEL * 0.85,
    brake: BRAKE * 0.8,
    maxSpeed: MAX_SPEED * 0.55,
    maxReverse: MAX_REVERSE * 0.6,
    fuelBurn: FUEL_BURN * 1.45,
    wheelie: WHEELIE * 0.45,
    noseDown: NOSE_DOWN * 0.45,
    // Huge rear rubber digs in.
    stick: STICK * 1.48,
    // Long tractor-plus-trailer span.
    wheelX: WHEEL_X * 1.5,
    wheelY: WHEEL_Y * 1.2,
    // Big farm tires.
    wheelR: WHEEL_R * 1.4,
    drag: 0.8,
    spinDamp: 1.3,
  }),
  // Black luxury SUV. Fast and grippy.
  benzgle: ride({
    id: "benzgle",
    name: "Benz GLE",
    blurb: "Big money energy. Smooth power on every hill.",
    url: benzgleUrl,
    width: 125,
    natW: 492,
    natH: 182,
    midX: 0.51,
    midY: 0.78,
    accel: ACCEL * 1.28,
    brake: BRAKE * 1.15,
    maxSpeed: MAX_SPEED * 1.22,
    maxReverse: MAX_REVERSE * 1.05,
    // Thirsty V6 feel.
    fuelBurn: FUEL_BURN * 1.45,
    wheelie: WHEELIE * 0.78,
    noseDown: NOSE_DOWN * 0.78,
    stick: STICK * 1.3,
    wheelX: WHEEL_X * 1.12,
    wheelY: WHEEL_Y * 1.08,
    wheelR: WHEEL_R * 1.18,
    drag: 0.55,
    spinDamp: 0.98,
  }),
  // White coupe SUV. Quicker, a bit tippier.
  benzcoupe: ride({
    id: "benzcoupe",
    name: "Benz GLE Coupe",
    blurb: "Sport roof. Same flex, sharper nose.",
    url: benzcoupeUrl,
    width: 125,
    natW: 477,
    natH: 169,
    midX: 0.51,
    midY: 0.78,
    // Snappier than the regular GLE.
    accel: ACCEL * 1.35,
    brake: BRAKE * 1.2,
    maxSpeed: MAX_SPEED * 1.26,
    maxReverse: MAX_REVERSE * 1.08,
    fuelBurn: FUEL_BURN * 1.5,
    // Sloped roof flips a little easier.
    wheelie: WHEELIE * 0.92,
    noseDown: NOSE_DOWN * 0.92,
    stick: STICK * 1.18,
    wheelX: WHEEL_X * 1.08,
    wheelY: WHEEL_Y * 1.02,
    wheelR: WHEEL_R * 1.12,
    drag: 0.5,
    spinDamp: 0.88,
  }),
};

// The browser key for the last ride the player picked.
export const VEHICLE_KEY = "korope-vehicle";

// Returns a known ride. An unknown id falls back to the korope.
export function getVehicle(id) {
  // A named ride from the picker.
  if (VEHICLES[id]) {
    // That ride.
    return VEHICLES[id];
  }
  // Everyone else gets the korope.
  return VEHICLES.korope;
}

// Clamps a rating into the 1 to 5 stars shown on the card.
function stars(value, low, high) {
  // Where the value sits between low and high.
  const t = (value - low) / (high - low);
  // 1 is the weakest. 5 is the strongest.
  return Math.max(1, Math.min(5, Math.round(1 + t * 4)));
}

// Comparable bars derived from the same numbers the physics uses.
export function vehicleRatings(vehicle) {
  // The ride to score.
  const v = getVehicle(vehicle.id || vehicle);
  // Road pace from the speed cap.
  const speed = stars(v.maxSpeed, 180, 520);
  // Climb mixes push, grip, and tire size.
  const climbing = stars(v.accel * (0.55 + v.stick * 0.12) * (v.wheelR / WHEEL_R), 220, 780);
  // Stability rewards grip and wheelbase, and punishes snappy air flips.
  const stability = stars(v.stick * 22 + (v.wheelX / WHEEL_X) * 28 - v.wheelie * 2.4, 10, 160);
  // Higher fuel economy means less fuel burned.
  const fuelEconomy = stars(28 - v.fuelBurn, 0, 24);
  // The four bars for the card.
  return { speed, climbing, stability, fuelEconomy };
}
