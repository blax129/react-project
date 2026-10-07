// Each stretch of road is a part of Lagos. Later stretches are harder.
export const AREAS = [
  // The island start. Bright afternoon, modest blocks.
  {
    name: "CMS",
    from: 0,
    skyTop: "#7ec8e3",
    skyBottom: "#f3d5a0",
    dirt: "#c4a574",
    road: "#3a342c",
    edge: "#f0b400",
    sun: "#f6c445",
    night: false,
    palms: false,
    buildings: [
      { x: 40, w: 70, h: 140, color: "#243044" },
      { x: 140, w: 54, h: 96, color: "#31445c" },
      { x: 250, w: 90, h: 120, color: "#1d3148" },
      { x: 420, w: 46, h: 160, color: "#2a3d55" },
      { x: 560, w: 110, h: 84, color: "#3a4d38" },
      { x: 730, w: 64, h: 130, color: "#243044" },
    ],
  },
  // The bus park. Warmer sky and low market roofs.
  {
    name: "Obalende",
    from: 1400,
    skyTop: "#f0a05a",
    skyBottom: "#f6d7a2",
    dirt: "#c48a4a",
    road: "#3f2a22",
    edge: "#f0b400",
    sun: "#ffb703",
    night: false,
    palms: false,
    buildings: [
      { x: 30, w: 120, h: 70, color: "#8c3d2f" },
      { x: 170, w: 90, h: 54, color: "#c47b2b" },
      { x: 290, w: 70, h: 110, color: "#5c3428" },
      { x: 400, w: 140, h: 48, color: "#a15c32" },
      { x: 570, w: 80, h: 90, color: "#6a3a2a" },
      { x: 700, w: 150, h: 60, color: "#b56b2f" },
    ],
  },
  // The bridge. Open sky, thin towers, pale water color in the ground.
  {
    name: "Third Mainland",
    from: 3200,
    skyTop: "#8ec6e6",
    skyBottom: "#d5e7ef",
    dirt: "#8fafb8",
    road: "#2e3a40",
    edge: "#f4f7f8",
    sun: "#fff4d2",
    night: false,
    palms: false,
    buildings: [
      { x: 80, w: 18, h: 180, color: "#1e3a4c" },
      { x: 220, w: 16, h: 150, color: "#245066" },
      { x: 480, w: 22, h: 200, color: "#163244" },
      { x: 760, w: 18, h: 160, color: "#1e3a4c" },
    ],
  },
  // Dense and green, the campus and the market side by side.
  {
    name: "Yaba",
    from: 5200,
    skyTop: "#6eb0c9",
    skyBottom: "#d7e2b0",
    dirt: "#8ea35a",
    road: "#2c3324",
    edge: "#f0b400",
    sun: "#f6c445",
    night: false,
    palms: true,
    buildings: [
      { x: 20, w: 80, h: 100, color: "#2f4a32" },
      { x: 130, w: 50, h: 170, color: "#243044" },
      { x: 220, w: 100, h: 80, color: "#3d5c40" },
      { x: 360, w: 40, h: 190, color: "#1d3148" },
      { x: 450, w: 120, h: 70, color: "#4a6748" },
      { x: 620, w: 70, h: 140, color: "#31445c" },
      { x: 740, w: 90, h: 96, color: "#2a4030" },
    ],
  },
  // Evening gold and one wide low bowl, like the stadium end of town.
  {
    name: "Surulere",
    from: 7400,
    skyTop: "#e07a4c",
    skyBottom: "#f3c98a",
    dirt: "#a86b3c",
    road: "#3a241c",
    edge: "#f0b400",
    sun: "#ffd27a",
    night: false,
    palms: false,
    buildings: [
      { x: 40, w: 60, h: 90, color: "#5a2e38" },
      { x: 140, w: 280, h: 70, color: "#7a3040" },
      { x: 460, w: 70, h: 120, color: "#4a2830" },
      { x: 580, w: 90, h: 80, color: "#6a3830" },
      { x: 720, w: 80, h: 140, color: "#3d2430" },
    ],
  },
  // Dusk over taller blocks.
  {
    name: "Ikeja",
    from: 9800,
    skyTop: "#3d4d7a",
    skyBottom: "#e0a06a",
    dirt: "#8d6a48",
    road: "#241c28",
    edge: "#f0b400",
    sun: "#ffb15a",
    night: false,
    palms: false,
    buildings: [
      { x: 30, w: 70, h: 200, color: "#1a2038" },
      { x: 130, w: 54, h: 240, color: "#12182c" },
      { x: 220, w: 90, h: 170, color: "#243056" },
      { x: 360, w: 46, h: 260, color: "#101628" },
      { x: 460, w: 80, h: 190, color: "#1c2748" },
      { x: 600, w: 60, h: 220, color: "#182038" },
      { x: 720, w: 100, h: 160, color: "#2a3358" },
    ],
  },
  // The coast. Deep blue and palms, with spaced towers.
  {
    name: "Lekki",
    from: 12600,
    skyTop: "#16324a",
    skyBottom: "#4e88a8",
    dirt: "#c2a06a",
    road: "#1c2830",
    edge: "#f4f7f8",
    sun: "#f6e7b4",
    night: false,
    palms: true,
    buildings: [
      { x: 60, w: 50, h: 210, color: "#102030" },
      { x: 200, w: 36, h: 250, color: "#0c1824" },
      { x: 420, w: 64, h: 180, color: "#163044" },
      { x: 700, w: 44, h: 230, color: "#0e2030" },
    ],
  },
  // The far end. Night, and the steepest hills.
  {
    name: "Epe",
    from: 15800,
    skyTop: "#101828",
    skyBottom: "#243044",
    dirt: "#3d4a32",
    road: "#141810",
    edge: "#c9a227",
    sun: "#e8eef8",
    night: true,
    palms: true,
    buildings: [
      { x: 80, w: 90, h: 60, color: "#1a2418" },
      { x: 280, w: 50, h: 90, color: "#121c14" },
      { x: 520, w: 120, h: 48, color: "#1c2818" },
      { x: 760, w: 40, h: 80, color: "#101810" },
    ],
  },
];

// The area the korope is in. The last area whose start it has passed.
export function areaAt(x) {
  // CMS until the road reaches the next name.
  let found = AREAS[0];
  // Walks the list. Later areas overwrite earlier ones once x has passed them.
  AREAS.forEach((area) => {
    // This stretch has started.
    if (x >= area.from) {
      // Use it.
      found = area;
    }
  });
  // The current name and colors.
  return found;
}

// 0 at CMS and 1 at Epe. Smooth, so the hills do not jump at a boundary.
export function hardship(x) {
  // 15800 is where Epe starts. Past that, the road stays at its hardest.
  return Math.max(0, Math.min(1, x / 15800));
}
