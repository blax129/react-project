// The picture size, the camera, and the tire positions.
import { CAM_X, CAM_Y, WORLD_H, WORLD_W } from "./constants";
// The road height, so the hills and the cans sit on the same curve the physics uses.
import { groundY } from "./world";
// The Lagos stretch the korope is driving through.
import { AREAS, areaAt } from "./areas";
// The ride the player picked, and its picture size.
import { getVehicle } from "./vehicles";

import { vehicleImages } from "./vehicleImages";
function spriteFor(vehicle) { return vehicleImages.get(vehicle.url); }

// Paints one frame. The camera follows the ride. vehicleId is "korope" or "okada".
export function drawWorld(ctx, run, paused, vehicleId) {
  // Colors and the skyline for this part of Lagos.
  const area = areaAt(run.x);
  // The sky stays fixed to the screen. The hills move under it.
  drawSky(ctx, area);
  // Buildings drift at a fraction of the camera, so they feel far away.
  drawBuildings(ctx, (run.x - CAM_X) * 0.18, area);
  // 0.35 is faster than the buildings, so the poles slide past them.
  drawWires(ctx, (run.x - CAM_X) * 0.35);
  // 0.55 is the go-slow lane, closer than the skyline.
  drawGoSlow(ctx, (run.x - CAM_X) * 0.55);
  // The sun, or the moon once the road reaches Epe.
  drawSun(ctx, area);
  // Saves the screen transform so the camera can be undone.
  ctx.save();
  // Puts the korope near the left-center of the view.
  ctx.translate(-(run.x - CAM_X), -(run.y - CAM_Y));
  // The dirt, the road, and the cans, in world coordinates.
  drawHills(ctx, run, area);
  // Stalls, people, and okadas planted on the roadside.
  drawRoadside(ctx, run);
  // A board at each boundary, with the name of the next area.
  drawSigns(ctx, run);
  // Cans that have not been collected.
  drawCans(ctx, run);
  // The ride the player picked, tilted with its wheels.
  drawVehicle(ctx, run, vehicleId);
  // Back to screen coordinates for the pause label.
  ctx.restore();
  // The pause label covers the middle.
  if (paused) {
    // Dark panel and the word Paused.
    drawPaused(ctx);
  }
}

// Fills the sky with this area's colors.
function drawSky(ctx, area) {
  // A vertical blend across the view.
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  // The top of this stretch of Lagos.
  sky.addColorStop(0, area.skyTop);
  // The color near the horizon.
  sky.addColorStop(1, area.skyBottom);
  // Uses that blend.
  ctx.fillStyle = sky;
  // Covers the picture.
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

// Draws the sun, or a moon when the area is night.
function drawSun(ctx, area) {
  // Epe uses a pale moon. Earlier areas use the sun color from that stretch.
  ctx.fillStyle = area.sun;
  // Starts a circle.
  ctx.beginPath();
  // Sits in the corner. 36 is the radius. Night uses a smaller moon.
  ctx.arc(860, 78, area.night ? 22 : 36, 0, Math.PI * 2);
  // Fills it.
  ctx.fill();
}

// Repeats this area's skyline as the camera moves.
function drawBuildings(ctx, shift, area) {
  // 960 is one copy of the skyline. The modulo keeps the shift inside one copy.
  const offset = ((shift % WORLD_W) + WORLD_W) % WORLD_W;
  // Two copies, so the seam never shows a gap.
  [0, 1].forEach((copy) => {
    // Each building in this copy.
    area.buildings.forEach((block) => {
      // Slides with the camera, then repeats.
      const x = block.x - offset + copy * WORLD_W;
      // The fill for this block.
      ctx.fillStyle = block.color;
      // The block sits on a horizon line 300 units down the view.
      ctx.fillRect(x, 300 - block.h, block.w, block.h);
      // Windows, an awning, and a shop sign on the face.
      drawBlockFace(ctx, x, 300 - block.h, block.w, block.h, area);
    });
    // Palms only on the greener, later stretches.
    if (area.palms) {
      // Four palms across one copy of the skyline.
      [160, 340, 560, 820].forEach((palmX) => {
        // The same slide as the buildings.
        drawPalm(ctx, palmX - offset + copy * WORLD_W);
      });
    }
  });
}

// A simple palm in front of the skyline.
function drawPalm(ctx, x) {
  // The trunk. 300 is the horizon the buildings stand on.
  ctx.fillStyle = "#6a4328";
  // A thin trunk.
  ctx.fillRect(x, 250, 6, 50);
  // The leaves.
  ctx.fillStyle = "#1f7a4d";
  // Starts the fronds.
  ctx.beginPath();
  // The top of the trunk.
  ctx.moveTo(x + 3, 246);
  // A left frond.
  ctx.lineTo(x - 16, 268);
  // Back to the crown.
  ctx.lineTo(x + 3, 256);
  // A right frond.
  ctx.lineTo(x + 22, 268);
  // Closes the leaves.
  ctx.closePath();
  // Fills them.
  ctx.fill();
}

// Windows, an awning, and a shop strip on one skyline block.
function drawBlockFace(ctx, x, y, w, h, area) {
  // Skip tiny blocks. 28 is too narrow for a readable face.
  if (w < 28 || h < 40) {
    // Leave the solid color alone.
    return;
  }
  // A row of pale windows near the top.
  ctx.fillStyle = area.night ? "#f6c445" : "rgba(255, 248, 238, 0.35)";
  // How many windows fit. 14 is one window plus a gap.
  const count = Math.max(1, Math.floor((w - 8) / 14));
  // Each window.
  for (let i = 0; i < count; i += 1) {
    // 4 is the left inset. 14 steps to the next window.
    const wx = x + 4 + i * 14;
    // 8 is down from the roof. 8 by 10 is a small pane.
    ctx.fillRect(wx, y + 8, 8, 10);
  }
  // A colored awning on wider shops.
  if (w > 50 && h < 120) {
    // Red cloth, common on Lagos stalls.
    ctx.fillStyle = "#c81d25";
    // 10 tall, hanging under the roof line.
    ctx.fillRect(x + 2, y + 22, w - 4, 10);
  }
}

// Power lines and poles that slide past behind the road.
function drawWires(ctx, shift) {
  // One copy of the 960-wide strip.
  const offset = ((shift % WORLD_W) + WORLD_W) % WORLD_W;
  // Two copies so the seam never gaps.
  [0, 1].forEach((copy) => {
    // The poles across one strip. 180 units apart.
    [80, 260, 440, 620, 800].forEach((poleX) => {
      // Slides with the mid-ground.
      const x = poleX - offset + copy * WORLD_W;
      // Dark wood.
      ctx.fillStyle = "#3a2a1c";
      // A thin pole. 300 is the horizon. 90 is how tall it stands.
      ctx.fillRect(x, 210, 4, 90);
      // A short crossbar.
      ctx.fillRect(x - 8, 214, 20, 3);
    });
    // One wire across the tops of the poles.
    ctx.strokeStyle = "rgba(28, 20, 15, 0.45)";
    // Thin cable.
    ctx.lineWidth = 1.5;
    // Starts the wire.
    ctx.beginPath();
    // Left edge of this copy.
    ctx.moveTo(copy * WORLD_W - offset, 218);
    // A gentle sag. 12 is how deep the dip is.
    ctx.quadraticCurveTo(copy * WORLD_W - offset + 480, 230, copy * WORLD_W - offset + WORLD_W, 218);
    // Draws the wire.
    ctx.stroke();
  });
}

// Yellow go-slow drums and a few parked shapes in the mid-ground.
function drawGoSlow(ctx, shift) {
  // One copy of the strip.
  const offset = ((shift % WORLD_W) + WORLD_W) % WORLD_W;
  // Two copies.
  [0, 1].forEach((copy) => {
    // Drums along the strip. 140 units apart.
    [40, 180, 320, 460, 600, 740, 880].forEach((drumX, index) => {
      // Slides with the go-slow lane.
      const x = drumX - offset + copy * WORLD_W;
      // Yellow body.
      ctx.fillStyle = "#f0b400";
      // 14 wide and 22 tall. 278 sits just above the horizon dirt.
      ctx.fillRect(x, 278, 14, 22);
      // A black stripe on every other drum.
      if (index % 2 === 0) {
        // Dark band.
        ctx.fillStyle = "#1c140f";
        // Across the middle of the drum.
        ctx.fillRect(x, 286, 14, 6);
      }
    });
  });
}

// Stalls, people, and parked okadas sitting on the roadside in world space.
function drawRoadside(ctx, run) {
  // The left edge of the view, with room so props enter smoothly.
  const left = run.x - CAM_X - 80;
  // The right edge.
  const right = left + WORLD_W + 160;
  // Plant a prop every 220 units along the road.
  const gap = 220;
  // The first prop index still on screen.
  const first = Math.floor(left / gap);
  // The last prop index still on screen.
  const last = Math.ceil(right / gap);
  // Each roadside spot.
  for (let i = first; i <= last; i += 1) {
    // The world x of this prop.
    const x = i * gap;
    // The road under it.
    const y = groundY(x);
    // Which prop to draw. 4 kinds, cycling.
    const kind = ((i % 4) + 4) % 4;
    // A market stall.
    if (kind === 0) {
      // The wood post.
      ctx.fillStyle = "#6a4328";
      // 4 wide. 48 tall above the road.
      ctx.fillRect(x - 18, y - 48, 4, 48);
      // The matching post on the right.
      ctx.fillRect(x + 14, y - 48, 4, 48);
      // A tarpaulin roof.
      ctx.fillStyle = "#2a6fbf";
      // 40 wide and 8 tall.
      ctx.fillRect(x - 20, y - 52, 40, 8);
      // Goods on the table.
      ctx.fillStyle = "#c81d25";
      // A low table of tomatoes.
      ctx.fillRect(x - 14, y - 18, 28, 10);
      // Skip the other kinds.
      continue;
    }
    // A person waiting by the road.
    if (kind === 1) {
      // The head.
      ctx.fillStyle = "#c68642";
      // Starts the head.
      ctx.beginPath();
      // 5 is the head radius. 40 above the road.
      ctx.arc(x, y - 40, 5, 0, Math.PI * 2);
      // Fills the head.
      ctx.fill();
      // A bright shirt.
      ctx.fillStyle = i % 8 === 1 ? "#c81d25" : "#2a6fbf";
      // The torso. 12 wide and 16 tall.
      ctx.fillRect(x - 6, y - 34, 12, 16);
      // Dark trousers.
      ctx.fillStyle = "#1c2430";
      // Legs down to the road.
      ctx.fillRect(x - 5, y - 18, 10, 18);
      // Skip the other kinds.
      continue;
    }
    // A parked okada silhouette.
    if (kind === 2) {
      // The frame.
      ctx.fillStyle = "#1c140f";
      // A low bike body. 36 wide and 10 tall.
      ctx.fillRect(x - 18, y - 22, 36, 10);
      // The front wheel.
      ctx.beginPath();
      // 7 is the tire radius.
      ctx.arc(x + 14, y - 8, 7, 0, Math.PI * 2);
      // Fills the tire.
      ctx.fill();
      // The rear wheel.
      ctx.beginPath();
      // Same size, behind the seat.
      ctx.arc(x - 14, y - 8, 7, 0, Math.PI * 2);
      // Fills the tire.
      ctx.fill();
      // A yellow helmet on the seat.
      ctx.fillStyle = "#f0b400";
      // Starts the helmet.
      ctx.beginPath();
      // 5 is the helmet radius.
      ctx.arc(x - 2, y - 28, 5, 0, Math.PI * 2);
      // Fills the helmet.
      ctx.fill();
      // Skip the other kinds.
      continue;
    }
    // A stack of yellow jerry cans by the roadside.
    // The first can.
    drawJerry(ctx, x - 8, y - 28);
    // The second can, a little to the right.
    drawJerry(ctx, x + 10, y - 28);
  }
}

// Fills the ground under the road and strokes the road itself.
function drawHills(ctx, run, area) {
  // The left edge of the view, with a little extra so the edge is not a gap.
  const left = run.x - CAM_X - 40;
  // The right edge.
  const right = left + WORLD_W + 80;
  // 4 units between samples, tight enough that the small bumps stay visible.
  const step = 4;
  // Starts the dirt shape on the left, below the road.
  ctx.beginPath();
  // The first point, deep underground so the fill has a bottom.
  ctx.moveTo(left, groundY(left) + 420);
  // Walks the surface.
  for (let x = left; x <= right; x += step) {
    // The road height at this x.
    ctx.lineTo(x, groundY(x));
  }
  // Closes along the bottom.
  ctx.lineTo(right, groundY(right) + 420);
  // Dirt for this part of Lagos.
  ctx.fillStyle = area.dirt;
  // Fills the hill.
  ctx.fill();
  // The road is a stroke along the same surface.
  ctx.beginPath();
  // Starts on the surface.
  ctx.moveTo(left, groundY(left));
  // Walks it again.
  for (let x = left; x <= right; x += step) {
    // The road line.
    ctx.lineTo(x, groundY(x));
  }
  // The road color for this stretch.
  ctx.strokeStyle = area.road;
  // 18 units thick, so it reads as a track.
  ctx.lineWidth = 18;
  // Round joins at the ramp lips.
  ctx.lineJoin = "round";
  // Draws the track.
  ctx.stroke();
  // The edge line for this stretch.
  ctx.strokeStyle = area.edge;
  // A thin line.
  ctx.lineWidth = 3;
  // Draws the edge.
  ctx.stroke();
  // Cream dashes down the middle of the track, like lane paint.
  ctx.strokeStyle = "rgba(255, 248, 238, 0.85)";
  // 3 units, thin enough to sit on the road.
  ctx.lineWidth = 3;
  // 16 of paint, then 20 of gap.
  ctx.setLineDash([16, 20]);
  // Draws the dashes on the same curve.
  ctx.stroke();
  // Later strokes are solid again.
  ctx.setLineDash([]);
}

// Draws fuel cans that are still full.
function drawCans(ctx, run) {
  // Every can near the rider.
  run.cans.forEach((can) => {
    // A used can is not drawn.
    if (can.taken) {
      // Skip it.
      return;
    }
    // Sits 36 units above the road, matching the pickup point in the physics.
    const y = groundY(can.x) - 36;
    // A yellow jerry can with petrol in the window.
    drawJerry(ctx, can.x, y);
  });
}

// One roadside jerry can. y is the middle of the can.
function drawJerry(ctx, x, y) {
  // The yellow metal body. 22 wide and 28 tall.
  ctx.fillStyle = "#f0b400";
  // The body.
  ctx.fillRect(x - 11, y - 8, 22, 28);
  // A darker side, so the can looks round.
  ctx.fillStyle = "#c47b00";
  // 6 units of shadow on the left.
  ctx.fillRect(x - 11, y - 8, 6, 28);
  // The dark window in the side.
  ctx.fillStyle = "#1c140f";
  // 8 by 14, centered on the body.
  ctx.fillRect(x - 2, y - 4, 8, 16);
  // The petrol sitting in the bottom of that window.
  ctx.fillStyle = "#f6c445";
  // 6 by 8, the lower half of the window.
  ctx.fillRect(x - 1, y + 2, 6, 8);
  // The red cap.
  ctx.fillStyle = "#c81d25";
  // 8 wide and 6 tall, on the neck.
  ctx.fillRect(x - 4, y - 16, 8, 6);
  // The handle and the spout use the same dark stroke.
  ctx.strokeStyle = "#1c140f";
  // 2 units, thick enough to read at this size.
  ctx.lineWidth = 2;
  // Starts the handle.
  ctx.beginPath();
  // The left shoulder.
  ctx.moveTo(x - 6, y - 8);
  // Up to the grip.
  ctx.lineTo(x - 6, y - 16);
  // Across the top.
  ctx.lineTo(x + 6, y - 16);
  // Down the right shoulder.
  ctx.lineTo(x + 6, y - 8);
  // Draws the handle.
  ctx.stroke();
  // The spout on the right.
  ctx.fillStyle = "#1c140f";
  // 6 wide and 4 tall.
  ctx.fillRect(x + 8, y - 4, 6, 4);
}

// A board where a new part of Lagos begins.
function drawSigns(ctx, run) {
  // Every named stretch after the start.
  AREAS.forEach((area) => {
    // CMS is the opening. It has no entry board.
    if (area.from < 100) {
      // Skip it.
      return;
    }
    // The left edge of the view.
    const left = run.x - CAM_X - 120;
    // The right edge.
    const right = left + WORLD_W + 200;
    // Skip boards that are off screen.
    if (area.from < left || area.from > right) {
      // Not in view.
      return;
    }
    // The road under the post.
    const y = groundY(area.from);
    // The post.
    ctx.fillStyle = "#6a4328";
    // A short post. 64 is how far it stands above the road.
    ctx.fillRect(area.from - 3, y - 64, 6, 64);
    // The board.
    ctx.fillStyle = "#fff8ee";
    // Wide enough for the longest name here, Lekki and Obalende.
    ctx.fillRect(area.from + 8, y - 72, 150, 28);
    // The name.
    ctx.fillStyle = "#1c140f";
    // A plain label.
    ctx.font = "700 16px Outfit, sans-serif";
    // Sits inside the board.
    ctx.fillText(area.name, area.from + 16, y - 52);
  });
}

// Draws the ride picture around its center, then rotates it onto the hill.
function drawVehicle(ctx, run, vehicleId) {
  // The size and wheel anchors for this ride.
  const vehicle = getVehicle(vehicleId);
  // The loaded cutout.
  const sprite = spriteFor(vehicle);
  // The picture is not ready on the very first frame.
  if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
    // Skip this frame.
    return;
  }
  // Saves the camera transform.
  ctx.save();
  // Moves to the body center.
  ctx.translate(run.x, run.y);
  // Positive angle tips the nose down, matching the physics.
  ctx.rotate(run.angle);
  // The width that puts the pictured wheels on the physics wheels.
  const width = vehicle.width;
  // Keeps the cutout's shape.
  const height = width * (vehicle.natH / vehicle.natW);
  // Places the wheel midpoint on the body center.
  const left = -width * vehicle.midX;
  // Places the pictured wheel row on this ride's physics wheel height.
  const top = vehicle.wheelY - height * vehicle.midY;
  // The same picture, tilted with the road.
  ctx.drawImage(sprite, left, top, width, height);
  // Restores the camera.
  ctx.restore();
}

// A dark band and the word Paused.
function drawPaused(ctx) {
  // A dark sheet over the picture.
  ctx.fillStyle = "rgba(28, 20, 15, 0.55)";
  // Covers the view.
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Cream letters.
  ctx.fillStyle = "#fff8ee";
  // A large label.
  ctx.font = "700 42px Fraunces, serif";
  // Centered by measuring the word.
  const label = "Paused";
  // The width of that word.
  const width = ctx.measureText(label).width;
  // Centers it. 230 is a little above the middle.
  ctx.fillText(label, (WORLD_W - width) / 2, 230);
}
