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

/** True if the tile falls inside any POV-only blocker. */
export function isPovBlocked(tx: number, ty: number): boolean {
  return POV_BLOCKERS.some(
    (rect) => tx >= rect.x0 && tx <= rect.x1 && ty >= rect.y0 && ty <= rect.y1,
  );
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
