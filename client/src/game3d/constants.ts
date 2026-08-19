/**
 * Shared constants for the 3D POV renderer.
 *
 * The 3D world is a direct re-projection of the existing isometric grid, so all
 * gameplay logic (collision map, proximity checks, exit markers, quest state)
 * keeps working untouched. Grid coordinates are the source of truth; world
 * coordinates are derived.
 *
 *   grid x  ->  world x
 *   grid y  ->  world z
 *   world y ->  up
 */

/** World units per grid tile. */
export const TILE = 2;

/** Backyard grid dimensions, matching Room in client/public/room.js. */
export const GRID_W = 20;
export const GRID_H = 15;

export const WORLD_W = GRID_W * TILE;
export const WORLD_H = GRID_H * TILE;

/** Camera height. Scrump is a crisp, so the whole yard towers over him. */
export const EYE_HEIGHT = 1.4;

/** How far from a tile centre the player is blocked, in tiles. */
export const PLAYER_RADIUS = 0.32;

/** Movement, in tiles per second. */
export const WALK_SPEED = 3.4;
export const SPRINT_MULTIPLIER = 1.75;

/** Look sensitivity. */
export const MOUSE_SENSITIVITY = 0.0022;
export const TOUCH_SENSITIVITY = 0.005;
export const TURN_SPEED = 2.1; // radians/sec for d-pad turning

/** Vertical look clamp, radians from horizon. */
export const PITCH_LIMIT = Math.PI / 2 - 0.08;

/**
 * Horizontal field of view in degrees. The camera's vertical fov is derived
 * from this and the aspect ratio, so portrait phones widen rather than crop.
 */
export const HORIZONTAL_FOV = 95;

/** Convert a grid coordinate to the centre of that tile in world space. */
export function gridToWorldX(gx: number): number {
  return (gx + 0.5) * TILE;
}

export function gridToWorldZ(gy: number): number {
  return (gy + 0.5) * TILE;
}

/** Convert a world coordinate back to fractional grid space. */
export function worldToGridX(wx: number): number {
  return wx / TILE - 0.5;
}

export function worldToGridY(wz: number): number {
  return wz / TILE - 0.5;
}

/**
 * The back of the house closes off the far edge of the yard. Everything about
 * it lives here because three separate systems have to agree on the layout:
 * the geometry in house.ts, the walkable area in PovEngine, and where ground
 * cover is allowed to grow.
 *
 * Orientation note: the player faces +z when looking at the house, so their
 * left is +x. The staircase is therefore at high x and the ground-floor window
 * at low x, which is what "stairs on the left, window right of the door" looks
 * like from the yard.
 */
export const HOUSE = {
  /** Plane of the front wall. The facade is 0.5 thick, the bulk sits behind. */
  faceZ: 28.6,
  depth: 16,
  minX: -3,
  maxX: 43,
  groundHeight: 5.5,
  upperHeight: 5.0,
  parapetHeight: 1.2,

  door: { centreX: 21, width: 2.6, height: 4.2 },
  window: { centreX: 13.5, width: 5.0, height: 3.0, sill: 1.6 },

  balcony: {
    minX: 1,
    maxX: 32.1,
    /** Outer edge, projecting into the yard. */
    frontZ: 25.0,
    /** Walking surface, level with the top of the ground floor. */
    deckY: 5.5,
    railHeight: 1.55,
    /** Columns carrying the outer edge, at these world x positions. */
    columnsX: [5, 17, 29],
  },

  /** Two perpendicular flights: up out of the yard, then along to the balcony. */
  stair: {
    lower: { centreX: 37.2, width: 2.6, fromZ: 22.6, toZ: 26.4, topY: 2.75 },
    landing: { minX: 35.9, maxX: 40.2, minZ: 26.4, maxZ: 28.6 },
    upper: { fromX: 35.9, toX: 32.1, centreZ: 27.5, width: 2.2 },
    steps: 7,
  },
} as const;

/** An inclusive rectangle of grid tiles. */
export interface GridRect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * Tiles that are solid in the 3D backyard only. The 2D collision map knows
 * nothing about the house, the staircase or the balcony columns, so the POV
 * engine adds them on top. Derived by hand from HOUSE above.
 */
export const POV_BLOCKERS: readonly GridRect[] = [
  { x0: 0, x1: 19, y0: 14, y1: 14 }, // back wall of the house
  { x0: 17, x1: 19, y0: 11, y1: 13 }, // lower flight and landing
  { x0: 16, x1: 16, y0: 13, y1: 13 }, // foot of the upper flight
  { x0: 2, x1: 2, y0: 12, y1: 12 }, // balcony columns
  { x0: 8, x1: 8, y0: 12, y1: 12 },
  { x0: 14, x1: 14, y0: 12, y1: 12 },
];

/** True if the tile falls inside any of the given blockers. */
export function isTileBlocked(blockers: readonly GridRect[], tx: number, ty: number): boolean {
  return blockers.some(
    (rect) => tx >= rect.x0 && tx <= rect.x1 && ty >= rect.y0 && ty <= rect.y1,
  );
}

/** True if the tile falls inside any POV-only backyard blocker. */
export function isPovBlocked(tx: number, ty: number): boolean {
  return isTileBlocked(POV_BLOCKERS, tx, ty);
}

/**
 * The converted garage under the house. Same 20x15 grid as the backyard, but
 * enclosed: four walls, a low ceiling of exposed joists, and one doorway back
 * out to the yard at grid (10, 0).
 */
export const DOWNSTAIRS = {
  width: WORLD_W,
  depth: WORLD_H,
  /** Underside of the floor joists. Low enough that the space feels like a lid. */
  ceilingY: 4.6,
  /** Height of the joists themselves, which sit above the ceiling line. */
  joistDepth: 0.55,
  wallThickness: 0.6,

  /** Opening back to the backyard, centred on the grid (10, 0) exit marker. */
  doorway: { centreX: gridToWorldX(10), width: 4.2, height: 3.5 },

  /**
   * Breeze-block screens, the one bit of a Queenslander garage that lets any
   * daylight in. Each is a run of decorative blocks set into a wall.
   */
  screens: [
    { wall: 'left' as const, from: 19.0, to: 25.0, baseY: 2.4 },
    { wall: 'right' as const, from: 16.0, to: 22.0, baseY: 2.4 },
    { wall: 'far' as const, from: 17.0, to: 25.0, baseY: 2.6 },
  ],
  /** One course of blocks, sized so the runs above divide evenly enough. */
  blockSize: 1.5,
} as const;

/**
 * Solid tiles that exist only in the 3D garage: the shelving, fridge, stacked
 * gear and laundry heaps pushed against the walls. The 2D collision map has no
 * idea these are here, exactly as with the backyard house.
 */
export const DOWNSTAIRS_BLOCKERS: readonly GridRect[] = [
  { x0: 0, x1: 0, y0: 3, y1: 8 }, // floor lamp, record crates and shelving, left wall
  { x0: 0, x1: 1, y0: 13, y1: 14 }, // bar fridge and laundry heap, back-left
  { x0: 4, x1: 8, y0: 14, y1: 14 }, // telly on milk crates, back wall
  { x0: 12, x1: 13, y0: 14, y1: 14 }, // stacked speaker cabs
  { x0: 19, x1: 19, y0: 2, y1: 7 }, // junk shelf and clothes rack, right wall
];

export function isDownstairsBlocked(tx: number, ty: number): boolean {
  return isTileBlocked(DOWNSTAIRS_BLOCKERS, tx, ty);
}

/**
 * The first-floor balcony, at the top of the concrete staircase.
 *
 * Orientation follows the exit markers in game.js: the yard is off the north
 * edge (grid y = 0), the house closes the south and the lower half of the west,
 * and the stair back down to the yard lands in the south-east corner at grid
 * (19, 14). Balcony's own railings already occupy grid row y = 0 and grid
 * column x = 0 for y 1..7, so those tiles come pre-blocked by the 2D map.
 *
 * Geometry sits on the near edge of whichever tile row is blocked, so the
 * player ends up standing right against it rather than a tile short.
 */
export const BALCONY = {
  /** Walking surface. The yard is BALCONY.dropToYard below this. */
  deckY: 0,
  dropToYard: HOUSE.balcony.deckY,
  railHeight: HOUSE.balcony.railHeight,

  /** Main deck, inside the railings and the house walls. */
  deck: { minX: 2.0, maxX: 38.0, minZ: 2.0, maxZ: 28.0 },
  /**
   * Concrete landing in the south-east corner, bulging out past the deck where
   * the stair arrives. Laid out on exact tile boundaries so the walkable tiles
   * and the geometry agree: the well below is a hole in it, not a slab over it.
   */
  landing: { minX: 32.0, maxX: 40.4, minZ: 24.0, maxZ: 30.4 },

  /** The railed edges, as world-space runs along the deck boundary. */
  rails: {
    north: { z: 2.0, fromX: 2.0, toX: 38.0 },
    west: { x: 2.0, fromZ: 2.0, toZ: 15.0 },
    east: { x: 38.0, fromZ: 2.0, toZ: 24.0 },
    landingEast: { x: 40.4, fromZ: 24.0, toZ: 30.4 },
  },

  /** Rendered house walls. The door in the west wall leads to the living room. */
  wall: {
    southZ: 28.0,
    /** The south wall stops here so the balcony can wrap the corner to the stair. */
    southMaxX: 32.0,
    westX: 2.0,
    westFromZ: 15.0,
    height: 5.0,
    thickness: 0.7,
  },
  /** Centred on the grid (0, 11) exit marker. */
  livingRoomDoor: { centreZ: gridToWorldZ(11), width: 3.4, height: 3.6 },
  /** Windows in the south wall, matching the pair on the house exterior. */
  southWindows: [
    { centreX: 11, width: 4.4, height: 2.6, sill: 1.3 },
    { centreX: 25, width: 4.4, height: 2.6, sill: 1.3 },
  ],

  /**
   * The hole the stair drops through, exactly covering grid tiles (17..18, 14).
   * The flight runs south out of it and below the deck.
   */
  stairWell: { minX: 34.0, maxX: 38.0, minZ: 28.0, maxZ: 30.4 },
} as const;

/**
 * Solid tiles that exist only in the 3D balcony: the house walls, and the
 * railing along the eastern edge that the 2D map never bothered with because
 * the isometric camera could not show you falling off it.
 */
export const BALCONY_BLOCKERS: readonly GridRect[] = [
  { x0: 0, x1: 0, y0: 8, y1: 14 }, // west wall, below the railed section
  { x0: 0, x1: 15, y0: 14, y1: 14 }, // south wall of the house
  { x0: 17, x1: 18, y0: 14, y1: 14 }, // the open stair well
  { x0: 19, x1: 19, y0: 0, y1: 11 }, // east railing, above the stair landing
];

export function isBalconyBlocked(tx: number, ty: number): boolean {
  return isTileBlocked(BALCONY_BLOCKERS, tx, ty);
}

/**
 * The living room, through the door off the balcony. Note this is the one room
 * that is NOT 20x15 — LivingRoom sets height to 16 — which is why the engine
 * reads room.width/height rather than the grid constants.
 *
 * Four walls, three doors: the balcony off the north end of the east wall, the
 * bedroom further down the same wall, and the front porch out to the west.
 */
export const LIVING_ROOM = {
  width: 20 * TILE,
  depth: 16 * TILE,
  /**
   * Low enough to feel like a room rather than a hall. At 5.2 the metre and a
   * half of blank plaster above the picture rail dominated every view.
   */
  ceilingY: 4.5,
  wallThickness: 0.6,
  /** Picture rail height, which the artwork hangs from. */
  railY: 3.3,

  doors: {
    balcony: { wall: 'east' as const, centre: gridToWorldZ(1), width: 3.2, height: 3.8 },
    bedroom: { wall: 'east' as const, centre: gridToWorldZ(10), width: 3.0, height: 3.8 },
    frontPorch: { wall: 'west' as const, centre: gridToWorldZ(13), width: 3.0, height: 3.8 },
  },

  /**
   * Where each banana painting hangs. The 2D room places them a tile in from
   * the wall; here they go on the wall itself, keyed by furniture type.
   */
  artwork: {
    banana_painting_1: { wall: 'north' as const, along: gridToWorldX(3.5), width: 2.6, height: 2.2 },
    banana_painting_2: { wall: 'north' as const, along: gridToWorldX(8.5), width: 3.0, height: 2.4 },
    banana_painting_3: { wall: 'north' as const, along: gridToWorldX(13.5), width: 2.4, height: 2.0 },
    banana_painting_4: { wall: 'east' as const, along: gridToWorldZ(3.5), width: 1.7, height: 2.8 },
  },
} as const;

/**
 * Solid tiles that exist only in the 3D living room: the plinth, the canvases
 * stacked against the south wall and the drinks trolley in the corner. The
 * walls themselves need no blockers — the engine's grid clamp stops the player
 * 0.64 short of them already.
 */
export const LIVING_ROOM_BLOCKERS: readonly GridRect[] = [
  { x0: 9, x1: 9, y0: 13, y1: 13 }, // plinth with the banana sculpture
  { x0: 2, x1: 4, y0: 15, y1: 15 }, // framed canvases leaning on the south wall
  { x0: 17, x1: 18, y0: 14, y1: 15 }, // drinks trolley and record player
];

export function isLivingRoomBlocked(tx: number, ty: number): boolean {
  return isTileBlocked(LIVING_ROOM_BLOCKERS, tx, ty);
}

/** Palette carried over from the pixel-art original, warmed up for 3D lighting. */
export const PALETTE = {
  grassLight: 0x7ba85a,
  grassDark: 0x41633a,
  grassDry: 0x9aa855,
  soil: 0x5c4433,
  fenceWood: 0x9a7248,
  fenceWoodDark: 0x6b4d2f,
  leaf: 0x3f8f36,
  leafDark: 0x1f5c22,
  leafLight: 0x7fc356,
  bark: 0x6b4b2f,
  ringMat: 0x3f5fd0,
  ringPost: 0xd42a2a,
  ringRope: 0xf4f4f4,
  poolPink: 0xf25ba6,
  poolDeep: 0xb8005a,
  water: 0x2fa8d8,
  hollandia: 0x1f8b2f,
  gold: 0xf2c541,
  sky: 0x82c8ef,
  skyHorizon: 0xd8ecf7,
  sunlight: 0xfff2cf,
} as const;
