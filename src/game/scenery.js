// Cache a few rendered scenes so detailed buildings do not slow mobile frames.
const sceneCache = new Map();
// Each place has a different arrangement of architectural silhouettes and street life.
const LAYOUTS = {
  // The yellow estate gateway is the opening landmark.
  gateway: ['apartments','gate','clinic'],
  // Estate streets show homes and daily services rather than office towers.
  estate: ['apartments','cars','apartments'],
  // The researched Festac NIIT location is a plaza rather than an invented campus.
  school: ['apartments','niit','shops'],
  // Commercial streets mix housing with shops and small religious buildings.
  avenue: ['shops','apartments','church'],
  // A second gateway leads into market activity.
  gateMarket: ['market','gate','shops'],
  // Junction scenes include a roundabout marker and busy retail frontage.
  junction: ['shops','roundabout','hotel'],
  // Residential compounds provide a greener contrast to market scenes.
  garden: ['villa','trees','shops'],
  // Market scenes have several rows of awnings and produce displays.
  market: ['market','shops','market'],
  // Road interchanges are defined by elevated spans and open space below.
  interchange: ['gate','bridge','bus'],
  // Satellite's residential and industrial edges share the same horizon.
  industrial: ['apartments','tanks','warehouse'],
  // Community streets have small homes, school walls and local retail.
  neighborhood: ['villa','school','shops'],
  // Trade Fair uses broad pavilion roofs and stacked wholesale goods.
  wholesale: ['warehouse','pavilion','market'],
  // The Volks motif focuses on automotive sheds and service yards.
  factory: ['workshop','warehouse','cars'],
  // Iyana Iba combines interchange infrastructure and roadside trade.
  interchangeMarket: ['market','bridge','bus'],
  // LASU's gate and campus greenery form a distinct institutional skyline.
  campus: ['trees','campus','school'],
  // Civic neighbourhood frontage includes a modest public hall.
  townhall: ['shops','hall','villa'],
  // Igando combines bus loading activity with shop rows.
  terminalMarket: ['market','bus','shops'],
  // Ikotun combines a large market frontage and a church silhouette.
  churchMarket: ['market','church','hotel'],
  // Egbeda uses low-rise plazas and bus activity.
  commercial: ['shops','office','bus'],
  // Dopemu's elevated road is framed by workshops.
  flyover: ['workshop','bridge','shops'],
  // Iyana Ipaja puts the bus interchange at the centre of the composition.
  interchangeBus: ['bus','bridge','market'],
  // Agege is identified by its elevated road, railway and market edge.
  railMarket: ['market','rail','bridge'],
  // Ikeja Along gives the rail terminal a prominent facade.
  railTerminal: ['bus','rail','office'],
  // Device displays and colourful electronics facades distinguish Computer Village.
  tech: ['tech','tech','market'],
  // Allen's hotels and banking frontage use restrained evening-style signage.
  hotel: ['office','hotel','shops'],
  // Opebi combines office frontage with a link-bridge motif.
  officeBridge: ['villa','bridge','office'],
  // Alausa's government blocks stand beside landscaped public space.
  civicPark: ['trees','civic','park'],
  // Ikeja GRA has leafy compounds and hotel frontage.
  gardenHotel: ['villa','hotel','trees'],
  // The final stage has airport architecture instead of a generic city skyline.
  airport: ['terminal','tower','terminal'],
// Finish the architecture catalogue.
};
// Draw a solid rectangle with an explicit colour.
function box(c,x,y,w,h,color) { c.fillStyle=color; c.fillRect(x,y,w,h); }
// Draw a filled polygon for roofs, aircraft and decorative shapes.
function polygon(c,points,color) {
  // Start at the first corner.
  c.fillStyle=color; c.beginPath(); c.moveTo(...points[0]);
  // Connect the remaining corners.
  points.slice(1).forEach(point=>c.lineTo(...point));
  // Close and fill the silhouette.
  c.closePath(); c.fill();
// Finish the polygon helper.
}
// Render a readable sign without leaking text alignment into other objects.
function sign(c,text,x,y,w,color='#173b46',size=12) {
  // Paint a high-contrast sign board.
  box(c,x,y,w,22,color);
  // Centre the label, allowing long names to fit within the board.
  c.fillStyle='#fff6dd'; c.font=`bold ${size}px sans-serif`; c.textAlign='center'; c.fillText(text,x+w/2,y+15,w-10);
// Finish the sign helper.
}
// Repeated windows create depth without needing downloaded textures.
function windows(c,x,y,w,h,lit=false) {
  // Keep windows on a regular architectural grid.
  for(let row=0;row<h-16;row+=24) for(let col=0;col<w-15;col+=22) {
    // A small sill and glass pane keep the facade legible at phone scale.
    box(c,x+col,y+row,12,15,lit?'#e8c979':'#557684'); box(c,x+col,y+row+13,12,2,'#c9c4b2');
  // Finish the window grid.
  }
// Finish the window helper.
}
// Rounded tree crowns soften residential and campus scenes.
function tree(c,x,y,r=25) {
  // Draw the trunk first.
  box(c,x-3,y,6,42,'#765a3d');
  // Overlapping circles form a simple shaded canopy.
  for(const [dx,dy,color] of [[-12,0,'#4c7356'],[13,0,'#527c59'],[0,-16,'#628968']]) {
    // Fill one crown section.
    c.fillStyle=color; c.beginPath(); c.arc(x+dx,y+dy,r,0,Math.PI*2); c.fill();
  // Finish the leaves.
  }
// Finish the tree.
}
// Place a few residents on the pavement, never in the collision lane.
function people(c,x,y,count,seed) {
  // Vary clothing by location while keeping the crowd deterministic.
  const colors=['#af634d','#497f8a','#d1a643','#e7cfaa','#52566e'];
  // Space out a readable group of people.
  for(let i=0;i<count;i++) {
    // Give every person a different position and clothing colour.
    const px=x+i*19, top=y-27-(i%2)*3;
    // Draw head, clothing and separate legs.
    c.fillStyle='#80533c'; c.beginPath(); c.arc(px,top,4,0,Math.PI*2); c.fill(); box(c,px-4,top+4,8,13,colors[(i+seed)%colors.length]); box(c,px-4,top+17,3,10,'#29363b'); box(c,px+1,top+17,3,10,'#29363b');
  // Finish the group.
  }
// Finish pavement life.
}
// Draw one place-specific building or transport landmark in a scene slot.
function landmark(c,type,x,area,slot) {
  // Reuse the location's material colours and deterministic detail seed.
  const wall=area.wall, trim=area.accent, y=284, seed=area.detail+slot;
  // Apartments use balconies, water tanks and satellite dishes familiar to the estate.
  if(type==='apartments') {
    // Vary block height and bay spacing across the Festac streets.
    const h=115+(seed%3)*22;
    // Build the wall, shadow edge and flat roof.
    box(c,x,y-h,214,h,wall); box(c,x+197,y-h,17,h,trim); box(c,x-5,y-h-6,224,7,'#736858');
    // Add rows of glass and balcony railings.
    for(let row=0;row<3;row++) { windows(c,x+12,y-h+12+row*35,178,20); box(c,x+6,y-h+35+row*35,184,4,'#e8dfc9'); }
    // Add rooftop storage tanks and a dish silhouette.
    box(c,x+22,y-h-24,27,18,'#353e43'); c.strokeStyle='#e1ddd0'; c.lineWidth=3; c.beginPath(); c.arc(x+154,y-h-12,13,0,Math.PI); c.stroke();
  // Finish estate housing.
  } else if(type==='gate'||type==='campus') {
    // LASU uses a broad light canopy; Festac has a yellow rectangular gateway.
    const campus=type==='campus', color=campus?'#d5dedb':'#e2bc3d';
    // Draw the entrance's two main supports and upper beam.
    box(c,x+5,y-142,22,142,color); box(c,x+217,y-142,22,142,color); box(c,x,y-150,246,34,color);
    // The university canopy is more angular and carries a crest.
    if(campus) { polygon(c,[[x-8,y-150],[x+118,y-172],[x+255,y-150]],'#548b9a'); box(c,x+109,y-117,29,43,'#638b87'); }
    // Label the actual area rather than reusing a generic welcome sign.
    sign(c,campus?'LAGOS STATE UNIVERSITY':area.landmark,x+2,y-147,240,campus?'#477888':'#a68526',13);
    // Metal gates sit behind the road so they do not act as fake obstacles.
    for(let i=0;i<13;i++) box(c,x+28+i*14,y-65,3,65,'#3a4c4d');
    // Add a small guardhouse beside the entrance.
    box(c,x+241,y-59,29,59,wall); box(c,x+245,y-52,20,15,'#527a88');
  // Finish entrance landmarks.
  } else if(['shops','tech','market','niit','workshop'].includes(type)) {
    // Tech plazas and the training centre rise above the smaller market shops.
    const h=type==='tech'?150:type==='niit'?130:type==='market'?76:100;
    // Colourful facades distinguish electronics shops from ordinary trading rows.
    const color=type==='tech'?['#397f9d','#59977e','#bd8b50'][slot]:wall;
    // Build three bays with a shared corrugated roof line.
    box(c,x,y-h,252,h,color); box(c,x-4,y-h-8,260,8,trim);
    // Add upper-floor windows where there is enough wall height.
    if(h>100) windows(c,x+10,y-h+10,230,35);
    // Every bay gets a sign, dark doorway, striped awning and displayed goods.
    for(let n=0;n<3;n++) {
      // Position this shop's frontage.
      const bx=x+n*84;
      // Use the researched institution name or the area's local trade labels.
      const label=type==='niit'&&n===1?'NIIT FESTAC':type==='tech'?['PHONES','LAPTOPS','REPAIRS'][n]:area.shops[(n+slot)%3];
      // Place a shop sign above the shaded doorway.
      sign(c,label,bx+2,y-68,80,type==='tech'?'#204c66':trim,10); box(c,bx+8,y-44,66,44,'#3b4140');
      // Alternate fabric colours in the market awnings.
      for(let stripe=0;stripe<6;stripe++) box(c,bx+stripe*14,y-46,14,9,stripe%2?'#eee1b4':['#b7604c','#719680','#d2a747'][(n+seed)%3]);
      // Devices are rectangles; food and wholesale goods are small stacked crates.
      for(let k=0;k<4;k++) { box(c,bx+10+k*14,y-25,11,type==='tech'?18:12,type==='tech'?'#7fc0d0':['#c56942','#95a94f','#d1ab62'][k%3]); }
    // Finish the shop bays.
    }
    // Add a hanging IT-training panel on the first-floor plaza.
    if(type==='niit') sign(c,'NIIT · IT TRAINING',x+20,y-h+48,212,'#295e88',15);
    // Umbrellas and shoppers give the busiest markets a denser silhouette.
    if(type==='market'||type==='tech') { polygon(c,[[x+25,y-63],[x+57,y-89],[x+92,y-63]],'#d5b557'); box(c,x+57,y-63,2,63,'#635749'); people(c,x+116,y,6,seed); }
  // Finish market and training buildings.
  } else if(type==='bridge'||type==='rail') {
    // Road spans and rail stations share strong concrete horizontal forms.
    box(c,x-20,y-105,300,17,'#9aacae'); box(c,x-20,y-112,300,5,'#e6e5cf');
    // Tall support piers leave a visible underpass.
    for(let n=0;n<3;n++) { box(c,x+15+n*105,y-89,13,89,'#7f9397'); box(c,x+4+n*105,y-94,36,9,'#aab9b8'); }
    // A side rail or parapet gives the deck depth.
    for(let n=0;n<18;n++) box(c,x-12+n*16,y-128,3,16,'#becdcc');
    // A train and canopy identify the rail scenes without implying a level crossing.
    if(type==='rail') { box(c,x+15,y-153,216,35,'#c5574f'); box(c,x+22,y-147,200,15,'#3e6176'); box(c,x,y-169,247,9,'#9aacae'); sign(c,area.index===22?'AGEGE STATION':'IKEJA STATION',x+32,y-198,188,'#405d68',12); }
    // Green highway signs distinguish flyovers from train stations.
    else sign(c,area.landmark,x+39,y-160,180,'#326b58',13);
  // Finish the transport span.
  } else if(type==='warehouse'||type==='pavilion'||type==='tanks') {
    // Tank farms are visually different from commercial blocks.
    if(type==='tanks') {
      // Draw three cylindrical storage silhouettes with curved caps.
      for(let n=0;n<3;n++) { const tx=x+n*78; box(c,tx,y-84,66,84,'#b6c3ba'); c.fillStyle='#d5ded2'; c.beginPath(); c.ellipse(tx+33,y-84,33,10,0,0,Math.PI*2); c.fill(); box(c,tx+10,y-70,3,65,'#879d99'); }
    // Halls and workshops use broad pitched or faceted roofs.
    } else {
      // Wide low walls represent storage and exhibition halls.
      box(c,x,y-94,248,94,wall);
      // Trade Fair's pavilion roof has multiple peaks rather than a box silhouette.
      polygon(c,type==='pavilion'?[[x-8,y-94],[x+30,y-150],[x+120,y-174],[x+220,y-150],[x+257,y-94]]:[[x-8,y-94],[x+124,y-135],[x+257,y-94]],type==='pavilion'?'#587d6e':trim);
      // Large shutters and loading bays distinguish wholesale buildings.
      for(let n=0;n<4;n++) { box(c,x+12+n*60,y-61,45,61,'#586f70'); for(let j=0;j<6;j++) box(c,x+12+n*60,y-56+j*9,45,2,'#8da09c'); }
      // Name the pavilion with its researched landmark.
      if(type==='pavilion') sign(c,'LAGOS TRADE FAIR',x+20,y-88,210,'#365f50',14);
    // Finish hall architecture.
    }
    // Stack a few neutral freight boxes along the loading frontage.
    for(let k=0;k<4;k++) box(c,x+185+k%2*22,y-20-Math.floor(k/2)*17,20,16,'#b79060');
  // Finish industrial architecture.
  } else if(type==='bus'||type==='cars'||type==='roundabout') {
    // Transport bays are kept behind the player's road.
    box(c,x,y-8,250,8,'#bdb8a1');
    // Draw parked minibuses or cars at different positions.
    for(let n=0;n<3;n++) {
      // A row of yellow buses gives the corridor its familiar transport colour.
      const bx=x+n*82, h=type==='cars'?24:35;
      // Body, windows, stripe and wheels form a compact readable vehicle.
      box(c,bx,y-h-8,72,h,'#d8ac3e'); box(c,bx+7,y-h-4,54,12,'#334d5c'); box(c,bx,y-16,72,4,'#3a3a36');
      // Place both tires under each parked vehicle.
      for(const dx of [13,58]) { c.fillStyle='#293638'; c.beginPath(); c.arc(bx+dx,y-7,7,0,Math.PI*2); c.fill(); }
    // Finish the parked queue.
    }
    // A loading canopy identifies a bus park.
    if(type==='bus') { box(c,x+8,y-104,230,10,trim); box(c,x+12,y-94,5,47,'#8c9b93'); box(c,x+228,y-94,5,47,'#8c9b93'); sign(c,area.landmark,x+25,y-135,200,'#355c69',13); }
    // A planted traffic island distinguishes Apple Junction.
    if(type==='roundabout') { c.fillStyle='#b2b89a'; c.beginPath(); c.ellipse(x+124,y-75,64,13,0,0,Math.PI*2); c.fill(); tree(c,x+124,y-128,20); sign(c,'APPLE JUNCTION',x+43,y-185,165,'#47735c',13); }
  // Finish road transport features.
  } else if(type==='church') {
    // A church silhouette is an artistic district cue, not an exact building replica.
    box(c,x+15,y-95,224,95,wall); polygon(c,[[x,y-95],[x+127,y-164],[x+252,y-95]],trim);
    // Add a narrow tower and simple cross.
    box(c,x+102,y-160,46,160,'#d2cbb4'); box(c,x+122,y-202,6,42,'#536b70'); box(c,x+111,y-190,28,6,'#536b70');
    // Arched-looking windows and a dark entrance establish the building's purpose.
    windows(c,x+27,y-81,65,45); windows(c,x+160,y-81,65,45); box(c,x+111,y-49,27,49,'#4d626a');
  // Finish the church silhouette.
  } else if(type==='terminal'||type==='tower') {
    // Airport architecture includes a distinct control tower.
    if(type==='tower') { box(c,x+99,y-186,30,186,'#9caeae'); polygon(c,[[x+72,y-213],[x+151,y-213],[x+139,y-171],[x+84,y-171]],'#5c8296'); box(c,x+68,y-222,87,9,'#d9ded5'); box(c,x+110,y-247,4,25,'#5a6c71'); }
    // Terminal walls use broad glass bands and an extended roof.
    else { box(c,x,y-102,252,102,'#b9c9c4'); box(c,x+8,y-92,236,52,'#588b9f'); box(c,x-10,y-114,272,12,'#e1e1d3'); for(let n=0;n<12;n++) box(c,x+12+n*20,y-92,3,52,'#c6d5d1'); sign(c,slot===0?'DEPARTURES':'ARRIVALS',x+36,y-37,180,'#2d6976',14); }
  // Finish airport buildings.
  } else if(type==='trees'||type==='park') {
    // Green zones contain layered trees and a low planted boundary.
    for(let n=0;n<4;n++) tree(c,x+26+n*63,y-63-(n%2)*10,24);
    // A low green verge keeps the park silhouette grounded.
    box(c,x,y-9,250,9,'#65845c');
    // JJT Park gets a small named entrance sign.
    if(type==='park') sign(c,'JJT PARK',x+62,y-36,125,'#416b55',12);
  // Finish landscaped areas.
  } else {
    // Civic, office, school, clinic, hotel and villa forms share a detailed facade.
    const h=type==='office'?164:type==='hotel'?148:type==='civic'?156:type==='villa'?76:100;
    // Vary roof and wall treatment to separate residential and institutional uses.
    box(c,x+8,y-h,236,h,wall); box(c,x+225,y-h,19,h,trim);
    // Homes have pitched roofs; offices and civic blocks have broad flat cornices.
    if(type==='villa') polygon(c,[[x,y-h],[x+122,y-h-47],[x+252,y-h]],trim); else box(c,x,y-h-8,252,9,trim);
    // Repeated glass creates a multi-storey facade.
    windows(c,x+22,y-h+15,205,h-40,type==='hotel');
    // Name institutions and businesses without inventing real brand locations.
    const text={office:'BUSINESS PLAZA',hotel:area.theme==='hotel'?'HOTEL & LOUNGE':'GARDEN HOTEL',civic:'LAGOS STATE SECRETARIAT',school:'COMMUNITY SCHOOL',clinic:'COMMUNITY CLINIC',hall:'IBA CIVIC HALL',villa:'RESIDENCES'}[type]||area.landmark;
    // Keep the main sign clear and compact.
    sign(c,text,x+15,y-36,222,type==='civic'?'#386d5f':trim,12);
    // Civic buildings have Nigerian flagpoles.
    if(type==='civic'||type==='hall') for(let n=0;n<3;n++) { box(c,x+30+n*85,y-199,3,55,'#738586'); box(c,x+33+n*85,y-199,24,15,'#389167'); box(c,x+41+n*85,y-199,8,15,'#f5eee2'); }
    // Leafy residential compounds have boundary walls and trees.
    if(type==='villa') { box(c,x,y-22,252,22,'#929e89'); tree(c,x+20,y-92,20); }
  // Finish the building-specific branch.
  }
  // Add pavement life to every street without introducing pedestrian collisions.
  people(c,x+5,y,2+(seed%4),seed);
// Finish one scene landmark.
}
// Build an offscreen scene once per area rather than drawing hundreds of details every frame.
function sceneFor(area) {
  // Recently used scenes stay available when the player reverses.
  if(sceneCache.has(area.id)) return sceneCache.get(area.id);
  // This canvas is generated locally and never downloads an image.
  const canvas=document.createElement('canvas'); canvas.width=960; canvas.height=320;
  // Draw all architecture in game coordinates.
  const c=canvas.getContext('2d');
  // A faint far skyline adds depth behind the researched local landmarks.
  c.globalAlpha=.22;
  // Paint varied distant buildings without obscuring foreground signs.
  area.buildings.forEach(b=>box(c,b.x,282-b.h,b.w,b.h,area.accent));
  // Restore solid foreground colour.
  c.globalAlpha=1;
  // Give each area its own street frontage layout and placement offsets.
  const layout=LAYOUTS[area.theme];
  // Place three major scene features with small, deterministic local variation.
  layout.forEach((type,i)=>landmark(c,type,25+i*315+(area.detail%3)*5,area,i));
  // Festac entrance streets include solar lamps inspired by the restoration works.
  if (area.theme === 'gateway' || area.theme === 'gateMarket') {
    // Repeat two slim poles with tilted solar panels and warm lamps.
    [290, 610].forEach(x => { box(c,x,174,4,110,'#526068'); polygon(c,[[x-12,165],[x+23,169],[x+18,177],[x-17,173]],'#29485b'); box(c,x+2,183,22,3,'#526068'); box(c,x+17,186,8,4,'#ffde8a'); });
  // Finish the solar street lights.
  }
  // A low pavement strip visually joins the architecture.
  box(c,0,284,960,8,'#9a9c87');
  // Keep only four cached canvases to bound phone memory use.
  if(sceneCache.size>=4) sceneCache.delete(sceneCache.keys().next().value);
  // Remember this rendered scene.
  sceneCache.set(area.id,canvas);
  // Return the lightweight reusable bitmap.
  return canvas;
// Finish scene generation.
}
// Draw a looping parallax street with a location-specific landmark composition.
export function drawAreaScenery(ctx,shift,area) {
  // Wrap the parallax camera into a single scene width.
  const offset=((shift%960)+960)%960, scene=sceneFor(area);
  // Two copies ensure continuous background coverage.
  ctx.drawImage(scene,-offset,0); ctx.drawImage(scene,960-offset,0);
  // An aircraft crosses only the airport backdrop and follows travelled distance.
  if(area.theme==='airport') {
    // Move the silhouette smoothly without introducing extra animation timers.
    const x=((shift*.7)%1150+1150)%1150-90;
    // Save the normal drawing transform.
    ctx.save(); ctx.translate(x,76);
    // A fuselage, swept wings and tail make a recognizable plane.
    polygon(ctx,[[0,0],[66,-3],[91,2],[66,8],[0,8]],'#e7e3d3'); polygon(ctx,[[35,2],[14,-24],[27,-24],[58,3],[35,7],[21,26],[10,26]],'#d1d9d3'); polygon(ctx,[[6,1],[0,-13],[10,-13],[21,3]],'#769398');
    // Restore the scene coordinates.
    ctx.restore();
  // Finish airport movement.
  }
// Finish the area-specific background.
}
