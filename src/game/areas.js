// Researched area cues are documented in docs/lagos-world-research.md.
// Route order is a stylized tour with detours, not turn-by-turn navigation.
export const AREA_LENGTH = 2200;
// Every entry has its own architecture, street labels, road texture and obstacle emphasis.
const ROUTE = [
  // Festac First Gate: Estate gateway and solar streetlights.
  {"name":"Festac First Gate","id":"festac-first-gate","theme":"gateway","landmark":"FESTAC TOWN","subtitle":"FIRST AVENUE","description":"Estate gateway and solar streetlights","shops":["ESTATE SHOPS","CLINIC","BUS STOP"],"roadStyle":"humps","hazard":"police","source":"festac","palette":0,"detail":0,"from":0,"terrainAmplitude":5,"terrainWaves":3},
  // Festac 21 Road: Balconied estate blocks and roadside car displays.
  {"name":"Festac 21 Road","id":"festac-21-road","theme":"estate","landmark":"21 ROAD","subtitle":"FESTAC ESTATE","description":"Balconied estate blocks and roadside car displays","shops":["AUTO SALES","BARBER","PROVISIONS"],"roadStyle":"rollers","hazard":"mud","source":"festac","palette":1,"detail":1,"from":2200,"terrainAmplitude":5.16,"terrainWaves":4},
  // Festac 22 Road: Computer training plaza and neighbourhood shops.
  {"name":"Festac 22 Road","id":"festac-22-road","theme":"school","landmark":"NIIT FESTAC","subtitle":"22 ROAD · DAMILOLA PLAZA","description":"Computer training plaza and neighbourhood shops","shops":["NIIT","BOOKSHOP","PRINT & COPY"],"roadStyle":"rumble","hazard":"police","source":"niit","palette":2,"detail":2,"from":4400,"terrainAmplitude":5.32,"terrainWaves":5},
  // Festac 23 Road: Mixed shops below housing blocks.
  {"name":"Festac 23 Road","id":"festac-23-road","theme":"avenue","landmark":"23 ROAD","subtitle":"FESTAC TOWN","description":"Mixed shops below housing blocks","shops":["PHARMACY","TAILOR","FOOD CANTEEN"],"roadStyle":"dips","hazard":"debris","source":"festac","palette":3,"detail":3,"from":6600,"terrainAmplitude":5.48,"terrainWaves":6},
  // Festac Second Gate: Estate entrance meeting a busy market corridor.
  {"name":"Festac Second Gate","id":"festac-second-gate","theme":"gateMarket","landmark":"SECOND GATE","subtitle":"AGBOJU · FESTAC","description":"Estate entrance meeting a busy market corridor","shops":["GROCERIES","FRESH BREAD","POS"],"roadStyle":"humps","hazard":"police","source":"festac","palette":4,"detail":4,"from":8800,"terrainAmplitude":5.64,"terrainWaves":7},
  // Apple Junction: Commercial junction, eateries and tricycle traffic.
  {"name":"Apple Junction","id":"apple-junction","theme":"junction","landmark":"APPLE JUNCTION","subtitle":"AMUWO ODOFIN","description":"Commercial junction, eateries and tricycle traffic","shops":["EATERY","SUPERMARKET","EVENT HALL"],"roadStyle":"crests","hazard":"debris","source":"apple","palette":5,"detail":5,"from":11000,"terrainAmplitude":5.8,"terrainWaves":3},
  // Amuwo Odofin: Estate walls, landscaped compounds and shopping plazas.
  {"name":"Amuwo Odofin","id":"amuwo-odofin","theme":"garden","landmark":"AMUWO ODOFIN","subtitle":"RESIDENTIAL DISTRICT","description":"Estate walls, landscaped compounds and shopping plazas","shops":["SHOPPING PLAZA","HOTEL","RESTAURANT"],"roadStyle":"rollers","hazard":"police","source":"amuwo","palette":0,"detail":6,"from":13200,"terrainAmplitude":5.96,"terrainWaves":4},
  // Agboju: Produce stalls, umbrellas and yellow minibuses.
  {"name":"Agboju","id":"agboju","theme":"market","landmark":"AGBOJU MARKET","subtitle":"BADAGRY CORRIDOR","description":"Produce stalls, umbrellas and yellow minibuses","shops":["TOMATOES","YAM & RICE","FABRICS"],"roadStyle":"potholes","hazard":"mud","source":"festac","palette":1,"detail":7,"from":15400,"terrainAmplitude":6.12,"terrainWaves":5},
  // Alakija: Expressway junction with a gateway and transit activity.
  {"name":"Alakija","id":"alakija","theme":"interchange","landmark":"ALAKIJA","subtitle":"FESTAC THIRD GATE","description":"Expressway junction with a gateway and transit activity","shops":["BUS PARK","SPARE PARTS","POS"],"roadStyle":"crests","hazard":"debris","source":"festac","palette":2,"detail":8,"from":17600,"terrainAmplitude":6.28,"terrainWaves":6},
  // Satellite Town: Housing beside industrial storage and service roads.
  {"name":"Satellite Town","id":"satellite-town","theme":"industrial","landmark":"SATELLITE TOWN","subtitle":"RESIDENTIAL / INDUSTRIAL EDGE","description":"Housing beside industrial storage and service roads","shops":["ESTATE STORES","WORKSHOP","CANTEEN"],"roadStyle":"dips","hazard":"mud","source":"satellite","palette":3,"detail":9,"from":19800,"terrainAmplitude":6.4399999999999995,"terrainWaves":7},
  // Abule Ado: Low-rise homes, local shops and community facilities.
  {"name":"Abule Ado","id":"abule-ado","theme":"neighborhood","landmark":"ABULE ADO","subtitle":"BADAGRY CORRIDOR","description":"Low-rise homes, local shops and community facilities","shops":["COMMUNITY SCHOOL","BUILDING SUPPLIES","FOOD MART"],"roadStyle":"potholes","hazard":"mud","source":"amuwo","palette":4,"detail":10,"from":22000,"terrainAmplitude":6.6,"terrainWaves":3},
  // Trade Fair Complex: Broad pavilion roofs, wholesale shops and loading yards.
  {"name":"Trade Fair Complex","id":"trade-fair-complex","theme":"wholesale","landmark":"LAGOS TRADE FAIR","subtitle":"INTERNATIONAL TRADE FAIR COMPLEX","description":"Broad pavilion roofs, wholesale shops and loading yards","shops":["WHOLESALE","WAREHOUSE","LOADING BAY"],"roadStyle":"rumble","hazard":"debris","source":"trade","palette":5,"detail":11,"from":24200,"terrainAmplitude":6.76,"terrainWaves":4},
  // Volks: Industrial sheds, automotive workshops and bus stops.
  {"name":"Volks","id":"volks","theme":"factory","landmark":"VOLKS","subtitle":"OJO · BADAGRY EXPRESSWAY","description":"Industrial sheds, automotive workshops and bus stops","shops":["AUTO PARTS","MECHANIC","BUS STOP"],"roadStyle":"rollers","hazard":"debris","source":"volks","palette":0,"detail":12,"from":26400,"terrainAmplitude":6.92,"terrainWaves":5},
  // Iyana Iba: Flyover piers, busy market frontage and minibuses.
  {"name":"Iyana Iba","id":"iyana-iba","theme":"interchangeMarket","landmark":"IYANA IBA","subtitle":"LASU / BADAGRY INTERCHANGE","description":"Flyover piers, busy market frontage and minibuses","shops":["FRESH PRODUCE","BUS PARK","COLD DRINKS"],"roadStyle":"crests","hazard":"police","source":"iyana","palette":1,"detail":13,"from":28600,"terrainAmplitude":7.08,"terrainWaves":6},
  // LASU Ojo: University entrance, crest, trees and campus buildings.
  {"name":"LASU Ojo","id":"lasu-ojo","theme":"campus","landmark":"LAGOS STATE UNIVERSITY","subtitle":"OJO CAMPUS","description":"University entrance, crest, trees and campus buildings","shops":["BOOKSHOP","STUDENT CAFE","PRINT CENTRE"],"roadStyle":"humps","hazard":"police","source":"lasu","palette":2,"detail":14,"from":30800,"terrainAmplitude":7.24,"terrainWaves":7},
  // Iba Town: Civic frontage and local mixed-use neighbourhood.
  {"name":"Iba Town","id":"iba-town","theme":"townhall","landmark":"IBA TOWN","subtitle":"LASU–IBA ROAD","description":"Civic frontage and local mixed-use neighbourhood","shops":["COMMUNITY HALL","PRIMARY SCHOOL","MARKET"],"roadStyle":"dips","hazard":"mud","source":"iba","palette":3,"detail":15,"from":33000,"terrainAmplitude":7.4,"terrainWaves":3},
  // Igando: Bus interchange activity, shop rows and market awnings.
  {"name":"Igando","id":"igando","theme":"terminalMarket","landmark":"IGANDO","subtitle":"LASU–ISHERI CORRIDOR","description":"Bus interchange activity, shop rows and market awnings","shops":["BUS TERMINAL","PROVISIONS","WORKSHOP"],"roadStyle":"rumble","hazard":"debris","source":"igando","palette":4,"detail":16,"from":35200,"terrainAmplitude":7.5600000000000005,"terrainWaves":4},
  // Ikotun: Dense market frontage with a church silhouette.
  {"name":"Ikotun","id":"ikotun","theme":"churchMarket","landmark":"IKOTUN","subtitle":"MARKET / IKOTUN-EGBE","description":"Dense market frontage with a church silhouette","shops":["IREPODUN MARKET","GUEST HOUSE","TEXTILES"],"roadStyle":"potholes","hazard":"police","source":"ikotun","palette":5,"detail":17,"from":37400,"terrainAmplitude":7.720000000000001,"terrainWaves":5},
  // Egbeda: Low-rise commercial blocks, pharmacies and transport stops.
  {"name":"Egbeda","id":"egbeda","theme":"commercial","landmark":"EGBEDA","subtitle":"AKOWONJO / IDIMU","description":"Low-rise commercial blocks, pharmacies and transport stops","shops":["SHOPPING PLAZA","PHARMACY","FOOD COURT"],"roadStyle":"rollers","hazard":"mud","source":"alimosho","palette":0,"detail":18,"from":39600,"terrainAmplitude":7.88,"terrainWaves":6},
  // Akowonjo: Residential side streets, schools and shopfronts.
  {"name":"Akowonjo","id":"akowonjo","theme":"neighborhood","landmark":"AKOWONJO","subtitle":"ALIMOSHO","description":"Residential side streets, schools and shopfronts","shops":["SCHOOL","BAKERY","TAILOR"],"roadStyle":"humps","hazard":"debris","source":"alimosho","palette":1,"detail":19,"from":41800,"terrainAmplitude":8.04,"terrainWaves":7},
  // Dopemu: Raised road infrastructure and workshop frontage.
  {"name":"Dopemu","id":"dopemu","theme":"flyover","landmark":"DOPEMU","subtitle":"LAGOS–ABEOKUTA CORRIDOR","description":"Raised road infrastructure and workshop frontage","shops":["TYRES","SPARE PARTS","WORKSHOP"],"roadStyle":"crests","hazard":"debris","source":"transport","palette":2,"detail":20,"from":44000,"terrainAmplitude":8.2,"terrainWaves":3},
  // Iyana Ipaja: Busy interchange with layered roads and bus queues.
  {"name":"Iyana Ipaja","id":"iyana-ipaja","theme":"interchangeBus","landmark":"IYANA IPAJA","subtitle":"BUS INTERCHANGE","description":"Busy interchange with layered roads and bus queues","shops":["BUS PARK","MARKET","TRAVEL OFFICE"],"roadStyle":"rumble","hazard":"police","source":"transport","palette":3,"detail":21,"from":46200,"terrainAmplitude":8.36,"terrainWaves":4},
  // Agege: Pen Cinema flyover, railway and market edges.
  {"name":"Agege","id":"agege","theme":"railMarket","landmark":"AGEGE · PEN CINEMA","subtitle":"RAIL / FLYOVER","description":"Pen Cinema flyover, railway and market edges","shops":["AGEGE BREAD","MARKET","STATION"],"roadStyle":"dips","hazard":"mud","source":"agege","palette":4,"detail":22,"from":48400,"terrainAmplitude":8.52,"terrainWaves":5},
  // Ikeja Along: Rail platforms, pedestrian bridge and bus bays.
  {"name":"Ikeja Along","id":"ikeja-along","theme":"railTerminal","landmark":"IKEJA ALONG","subtitle":"RAIL & BUS TERMINAL","description":"Rail platforms, pedestrian bridge and bus bays","shops":["IKEJA STATION","BUS TERMINAL","NEWSSTAND"],"roadStyle":"humps","hazard":"police","source":"lamata","palette":5,"detail":23,"from":50600,"terrainAmplitude":8.68,"terrainWaves":6},
  // Computer Village: Electronics plazas, device displays, umbrellas and cables.
  {"name":"Computer Village","id":"computer-village","theme":"tech","landmark":"COMPUTER VILLAGE","subtitle":"OTIGBA · IKEJA","description":"Electronics plazas, device displays, umbrellas and cables","shops":["PHONES","LAPTOPS","REPAIRS"],"roadStyle":"potholes","hazard":"debris","source":"computer","palette":0,"detail":24,"from":52800,"terrainAmplitude":8.84,"terrainWaves":7},
  // Allen Avenue: Banking plazas, hotels, restaurants and evening signage.
  {"name":"Allen Avenue","id":"allen-avenue","theme":"hotel","landmark":"ALLEN AVENUE","subtitle":"IKEJA HIGH STREET","description":"Banking plazas, hotels, restaurants and evening signage","shops":["HOTEL","LOUNGE","BANK"],"roadStyle":"rollers","hazard":"police","source":"allen","palette":1,"detail":25,"from":55000,"terrainAmplitude":9,"terrainWaves":3},
  // Opebi: Office and residential frontage with a link-bridge motif.
  {"name":"Opebi","id":"opebi","theme":"officeBridge","landmark":"OPEBI","subtitle":"IKEJA","description":"Office and residential frontage with a link-bridge motif","shops":["OFFICES","SCHOOL","RESTAURANT"],"roadStyle":"crests","hazard":"mud","source":"opebi","palette":2,"detail":26,"from":57200,"terrainAmplitude":9.16,"terrainWaves":4},
  // Alausa: Civic blocks, flags and landscaped public greenery.
  {"name":"Alausa","id":"alausa","theme":"civicPark","landmark":"ALAUSA","subtitle":"STATE SECRETARIAT / JJT PARK","description":"Civic blocks, flags and landscaped public greenery","shops":["SECRETARIAT","JJT PARK","VISITORS"],"roadStyle":"rumble","hazard":"police","source":"alausa","palette":3,"detail":27,"from":59400,"terrainAmplitude":9.32,"terrainWaves":5},
  // Ikeja GRA: Tree-lined compounds, hotels and low-density homes.
  {"name":"Ikeja GRA","id":"ikeja-gra","theme":"gardenHotel","landmark":"IKEJA GRA","subtitle":"GARDEN DISTRICT","description":"Tree-lined compounds, hotels and low-density homes","shops":["GARDEN HOTEL","RESTAURANT","RESIDENCES"],"roadStyle":"dips","hazard":"debris","source":"gra","palette":4,"detail":28,"from":61600,"terrainAmplitude":9.48,"terrainWaves":6},
  // Airport Road: Terminal frontage, control tower and passing aircraft.
  {"name":"Airport Road","id":"airport-road","theme":"airport","landmark":"MURTALA MUHAMMED","subtitle":"IKEJA · AIRPORT CORRIDOR","description":"Terminal frontage, control tower and passing aircraft","shops":["DEPARTURES","ARRIVALS","AIRPORT HOTEL"],"roadStyle":"crests","hazard":"police","source":"airport","palette":5,"detail":29,"from":63800,"terrainAmplitude":9.64,"terrainWaves":7},
// Finish the thirty-location route.
];
// Muted Lagos daylight palettes preserve contrast with fuel and hazard markers.
const PALETTES = [["#8cbecd","#f5dbb0","#ad8456","#d3bd8d","#825f43"],["#83b9c5","#ede2c0","#b38e64","#b6bba3","#647967"],["#92bbc9","#eedbc2","#9c8666","#becbd3","#5c7c92"],["#baaa9e","#eed2ae","#ad784e","#d5b68b","#805e49"],["#708da0","#e7bb95","#8f7454","#bfa89b","#705f61"],["#566986","#dbac8e","#82644f","#9e9aaa","#5e5772"]];
// Expand compact scene settings into the colours used by the game renderer.
export const AREAS = ROUTE.map((area, index) => {
  // Choose this scene's sky, ground, wall and trim colours.
  const [skyTop, skyBottom, dirt, wall, accent] = PALETTES[area.palette];
  // Build a stable silhouette behind the detailed architecture.
  const buildings = Array.from({length:7}, (_, n) => ({x:n*145+15,w:70+(index+n)%4*12,h:55+(index*13+n*29)%95,color:accent}));
  // Keep all researched metadata available to the route browser and renderer.
  return {...area,index,skyTop,skyBottom,dirt,wall,accent,road:'#303436',edge:'#e3c878',sun:'#ffe1a0',night:false,palms:['garden','gardenHotel','campus','civicPark'].includes(area.theme),buildings};
// Finish expanding the area list.
});
// Look up the stage by position while keeping reverse travel and endless play valid.
export function areaAt(x) {
  // Clamp the position so driving beyond the tour stays in the airport stage.
  return AREAS[Math.max(0,Math.min(AREAS.length-1,Math.floor(x/AREA_LENGTH)))];
// Finish the area lookup.
}
// Preserve the established early difficulty ramp independently of tour length.
export function hardship(x) {
  // Terrain's separate late-game curve continues increasing beyond this base ramp.
  return Math.max(0,Math.min(1,x/15800));
// Finish the base difficulty helper.
}

// Show both the current place and progress through the thirty-area journey.
export function areaLabel(x) {
  // Resolve the actual area from the vehicle's world position.
  const area=areaAt(x);
  // Keep progress visible without changing the distance-based score.
  return area.name+' · '+(area.index+1)+'/30';
// Finish the HUD label helper.
}
