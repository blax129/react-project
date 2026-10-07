// Pixel landmarks measured on the existing PNGs. Wheels are [x, y, radius].
// Roof polylines follow solid upper bodywork (the Okada uses its rider's head).
// Multi-axle vehicles remain rigid bodies; the tractor's trailer is not articulated.
export const VEHICLE_GEOMETRY = {
  korope: { wheels: [[36,176,25],[278,176,25]], roof: [[22,36],[57,9],[222,18],[246,49]] },
  okada: { wheels: [[131,300,54],[364,300,52]], roof: [[96,72],[171,49],[188,70],[207,142]] },
  danfo: { wheels: [[88,163,27],[303,164,27]], roof: [[37,41],[99,30],[304,31],[345,62]] },
  molue: { wheels: [[132,143,30],[373,144,30]], roof: [[30,27],[443,24],[463,67]] },
  taxi: { wheels: [[88,134,27],[351,134,27]], roof: [[80,47],[119,22],[247,24],[276,56]] },
  delivery: { wheels: [[87,146,29],[318,145,29]], roof: [[13,58],[95,25],[244,49],[264,12],[329,11],[354,31]] },
  tipper: { wheels: [[85,165,41],[170,165,41],[356,165,41]], roof: [[24,44],[284,36],[327,8],[409,21],[435,49]] },
  suv: { wheels: [[106,141,41],[376,142,41]], roof: [[43,41],[84,14],[246,14],[280,35]] },
  dangote: { wheels: [[61,155,28],[123,155,28],[184,155,28],[339,155,28],[402,155,28],[521,155,28]], roof: [[17,44],[62,15],[436,14],[457,41],[487,23],[556,31],[577,55]] },
  police: { wheels: [[94,130,36],[339,130,36]], roof: [[17,58],[129,57],[141,20],[253,21],[290,50]] },
  lexus: { wheels: [[94,134,39],[374,134,39]], roof: [[57,38],[112,13],[249,13],[301,46]] },
  fayawo: { wheels: [[99,150,42],[385,152,41]], roof: [[40,45],[109,10],[238,21],[286,52]] },
  micra: { wheels: [[59,106,26],[275,106,26]], roof: [[39,32],[73,9],[168,9],[205,48]] },
  brt: { wheels: [[141,134,30],[416,134,30]], roof: [[18,27],[506,26],[529,47]] },
  peugeot: { wheels: [[71,121,30],[305,121,30]], roof: [[65,43],[119,14],[239,13],[274,46]] },
  purewater: { wheels: [[121,155,31],[394,154,31]], roof: [[18,45],[313,39],[353,17],[420,17],[450,43]] },
  tractor: { wheels: [[51,144,33],[264,124,54],[434,144,34]], roof: [[17,83],[191,85]], extraRoof: [[242,17],[342,18]] },
  benzgle: { wheels: [[80,140,41],[355,140,41]], roof: [[50,51],[113,15],[234,15],[291,48]] },
  benzcoupe: { wheels: [[80,130,40],[347,130,40]], roof: [[54,48],[160,14],[250,14],[294,44]] },
};

export function vehicleGeometry(opts) {
  const landmarks = VEHICLE_GEOMETRY[opts.id];
  const scale = opts.width / opts.natW;
  const first = landmarks.wheels[0];
  const last = landmarks.wheels.at(-1);
  const midX = (first[0] + last[0]) / 2;
  const midY = (first[1] + last[1]) / 2;
  const local = ([x,y]) => [(x-midX)*scale, opts.wheelY+(y-midY)*scale];
  const wheels = landmarks.wheels.map(([x,y,r]) => {
    const [lx,ly] = local([x,y]);
    return {x:lx,y:ly,r:r*scale};
  });
  // Sample the polyline so a narrow terrain lip cannot slip between roof probes.
  const roof = [];
  for (const line of [landmarks.roof, landmarks.extraRoof].filter(Boolean)) {
  line.forEach((p,i) => {
    if (!i) { roof.push(local(p)); return; }
    const a=local(line[i-1]), b=local(p);
    const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));
    for(let j=1;j<=n;j++) roof.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);
  });
  }
  return {
    midX:midX/opts.natW, midY:midY/opts.natH,
    wheelX:(last[0]-first[0])*scale/2,
    wheelR:wheels.reduce((sum,w)=>sum+w.r,0)/wheels.length,
    wheels, roof,
  };
}
