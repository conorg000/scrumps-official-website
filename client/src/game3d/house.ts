/**
 * The back of the house: a two-storey yellow rendered-concrete block closing off
 * the far edge of the yard.
 *
 * Ground floor carries the brown door (the way downstairs) with a big window
 * beside it. A two-flight concrete staircase climbs the left-hand end up to the
 * first-floor balcony (the way upstairs), which is fronted with orange bars and
 * lined with pot plants.
 *
 * Everything is positioned from HOUSE in constants.ts so the geometry here can
 * never drift from the walkable area PovEngine enforces.
 */

import * as THREE from 'three';
import { HOUSE } from './constants';
import { Animated, applyWorldUVs, spanBetween } from './props';
import { createConcreteTexture, createStuccoTexture, createWoodTexture } from './textures';

export const ORANGE = 0xef7a24;
export const ORANGE_DARK = 0xc25a12;
const DOOR_BROWN = 0x8a5a2e;
const DOOR_BROWN_DARK = 0x4a2a14;
const DOOR_BROWN_LIGHT = 0xa87038;
const INTERIOR_DARK = 0x14100c;

/** How many texture tiles per world unit on the house surfaces. */
const TEXEL_DENSITY = 0.26;

/** Box with world-scaled UVs, sized by its extents rather than its centre. */
function box(material: THREE.Material, w: number, h: number, d: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(w, h, d);
  applyWorldUVs(geometry, w, h, d, TEXEL_DENSITY);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Axis-aligned box spanning the given world bounds. */
function slab(
  material: THREE.Material,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
): THREE.Mesh {
  const mesh = box(material, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return mesh;
}

/** A flight of steps climbing from `from` to `to` along one horizontal axis. */
function flight(
  material: THREE.Material,
  axis: 'x' | 'z',
  from: number,
  to: number,
  crossCentre: number,
  crossWidth: number,
  baseY: number,
  topY: number,
  steps: number,
): THREE.Group {
  const group = new THREE.Group();
  const run = (to - from) / steps;
  const rise = (topY - baseY) / steps;

  for (let i = 0; i < steps; i++) {
    const treadY = baseY + rise * (i + 1);
    const nearEdge = from + run * i;
    const farEdge = from + run * (i + 1);

    // Tread, plus the riser closing the gap below its leading edge
    const tread =
      axis === 'x'
        ? slab(
            material,
            Math.min(nearEdge, farEdge),
            Math.max(nearEdge, farEdge),
            treadY - 0.18,
            treadY,
            crossCentre - crossWidth / 2,
            crossCentre + crossWidth / 2,
          )
        : slab(
            material,
            crossCentre - crossWidth / 2,
            crossCentre + crossWidth / 2,
            treadY - 0.18,
            treadY,
            Math.min(nearEdge, farEdge),
            Math.max(nearEdge, farEdge),
          );
    group.add(tread);

    const riser =
      axis === 'x'
        ? slab(
            material,
            nearEdge - Math.sign(run) * 0.12,
            nearEdge,
            treadY - rise,
            treadY,
            crossCentre - crossWidth / 2,
            crossCentre + crossWidth / 2,
          )
        : slab(
            material,
            crossCentre - crossWidth / 2,
            crossCentre + crossWidth / 2,
            treadY - rise,
            treadY,
            nearEdge - Math.sign(run) * 0.12,
            nearEdge,
          );
    group.add(riser);
  }

  return group;
}

/**
 * A run of orange balusters with a top and bottom rail, from `from` to `to`.
 * Used along the balcony edge and up the open side of the stairs, and it slopes
 * happily if the two ends are at different heights.
 *
 * Exported so the balcony you stand on upstairs is built from the same railing
 * you see from the yard below.
 */
export function balustrade(from: THREE.Vector3, to: THREE.Vector3, height: number): THREE.Group {
  const group = new THREE.Group();

  const barMaterial = new THREE.MeshStandardMaterial({
    color: ORANGE,
    roughness: 0.42,
    metalness: 0.35,
  });
  const railMaterial = new THREE.MeshStandardMaterial({
    color: ORANGE_DARK,
    roughness: 0.4,
    metalness: 0.4,
  });

  const span = from.distanceTo(to);
  const count = Math.max(2, Math.round(span / 0.46));

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, height, 8), barMaterial);
    bar.position.lerpVectors(from, to, t);
    bar.position.y += height / 2;
    bar.castShadow = true;
    group.add(bar);
  }

  // Top rail, and a lower one so the run does not look like loose sticks
  [height, height * 0.42].forEach((y, i) => {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(i === 0 ? 0.085 : 0.05, i === 0 ? 0.085 : 0.05, span, 10),
      railMaterial,
    );
    spanBetween(
      rail,
      new THREE.Vector3(from.x, from.y + y, from.z),
      new THREE.Vector3(to.x, to.y + y, to.z),
    );
    rail.castShadow = true;
    group.add(rail);
  });

  return group;
}

/** Terracotta pot with a leafy occupant. */
function potPlant(seed: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.32, 0.6, 14),
    new THREE.MeshStandardMaterial({ color: 0xb4633a, roughness: 0.85 }),
  );
  pot.position.y = 0.3;
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.1, 14),
    new THREE.MeshStandardMaterial({ color: 0xc4744a, roughness: 0.8 }),
  );
  lip.position.y = 0.6;
  lip.castShadow = true;
  group.add(lip);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.06, 14),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 1 }),
  );
  soil.position.y = 0.62;
  group.add(soil);

  // Foliage, a few fronds fanning out of the pot
  const foliage = new THREE.Group();
  foliage.position.y = 0.65;
  group.add(foliage);

  const greens = [0x3f8f36, 0x56a63f, 0x2f7a2c];
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + seed;
    const frond = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.55 + (i % 3) * 0.18, 5, 8),
      new THREE.MeshStandardMaterial({ color: greens[i % 3], roughness: 0.8, flatShading: true }),
    );
    frond.position.set(Math.cos(angle) * 0.2, 0.42, Math.sin(angle) * 0.2);
    frond.rotation.z = Math.cos(angle) * 0.55;
    frond.rotation.x = -Math.sin(angle) * 0.55;
    frond.castShadow = true;
    foliage.add(frond);
  }

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x4a9c3c, roughness: 0.85, flatShading: true }),
  );
  crown.position.y = 0.75;
  crown.castShadow = true;
  foliage.add(crown);

  return {
    group,
    animated: {
      update(time) {
        // Gentle nodding in the breeze
        foliage.rotation.z = Math.sin(time * 1.2 + seed) * 0.05;
        foliage.rotation.x = Math.cos(time * 0.9 + seed) * 0.04;
      },
    },
  };
}

export function buildHouse(): { group: THREE.Group; animated: Animated[] } {
  const group = new THREE.Group();
  const animated: Animated[] = [];

  const H = HOUSE;
  const wallTop = H.groundHeight + H.upperHeight;
  const facadeBack = H.faceZ + 0.5;

  const stuccoMap = createStuccoTexture();
  stuccoMap.repeat.set(1, 1);
  const concreteMap = createConcreteTexture();
  concreteMap.repeat.set(1, 1);

  const stucco = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: stuccoMap,
    roughness: 0.95,
    metalness: 0,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: concreteMap,
    roughness: 0.92,
    metalness: 0,
  });
  const interior = new THREE.MeshStandardMaterial({ color: INTERIOR_DARK, roughness: 1 });

  // ------------------------------------------------------------------ structure

  // The bulk of the building, sitting behind the facade
  group.add(
    slab(stucco, H.minX, H.maxX, 0, wallTop, facadeBack, H.faceZ + H.depth),
  );

  // Facade panels, cut around the openings
  const w = H.window;
  const d = H.door;
  const windowX0 = w.centreX - w.width / 2;
  const windowX1 = w.centreX + w.width / 2;
  const doorX0 = d.centreX - d.width / 2;
  const doorX1 = d.centreX + d.width / 2;

  const facade = (x0: number, x1: number, y0: number, y1: number): void => {
    if (x1 - x0 <= 0.001 || y1 - y0 <= 0.001) return;
    group.add(slab(stucco, x0, x1, y0, y1, H.faceZ, facadeBack));
  };

  // Ground floor: solid either side of the two openings, plus over/under them
  facade(H.minX, windowX0, 0, H.groundHeight);
  facade(windowX0, windowX1, 0, w.sill);
  facade(windowX0, windowX1, w.sill + w.height, H.groundHeight);
  facade(windowX1, doorX0, 0, H.groundHeight);
  facade(doorX0, doorX1, d.height, H.groundHeight);
  facade(doorX1, H.maxX, 0, H.groundHeight);

  // Upper floor: a balcony door in the middle, a window either side
  const balconyDoor = { x0: 19.4, x1: 22.6, y0: H.groundHeight, y1: H.groundHeight + 3.5 };
  const upperWindows = [
    { x0: 9.5, x1: 14.0, y0: H.groundHeight + 1.4, y1: H.groundHeight + 3.6 },
    { x0: 26.5, x1: 31.0, y0: H.groundHeight + 1.4, y1: H.groundHeight + 3.6 },
  ];

  const upperCuts = [...upperWindows, balconyDoor].sort((a, b) => a.x0 - b.x0);
  let cursor: number = H.minX;
  upperCuts.forEach((cut) => {
    facade(cursor, cut.x0, H.groundHeight, wallTop);
    facade(cut.x0, cut.x1, H.groundHeight, cut.y0);
    facade(cut.x0, cut.x1, cut.y1, wallTop);
    cursor = cut.x1;
  });
  facade(cursor, H.maxX, H.groundHeight, wallTop);

  // Darkness behind every opening
  [
    { x0: windowX0, x1: windowX1, y0: w.sill, y1: w.sill + w.height },
    { x0: doorX0, x1: doorX1, y0: 0, y1: d.height },
    balconyDoor,
    ...upperWindows,
  ].forEach((cut) => {
    group.add(slab(interior, cut.x0, cut.x1, cut.y0, cut.y1, facadeBack - 0.02, facadeBack + 0.02));
  });

  // Floor band between the storeys, and a parapet capping the roof
  group.add(slab(concrete, H.minX - 0.3, H.maxX + 0.3, H.groundHeight - 0.35, H.groundHeight, H.faceZ - 0.25, facadeBack));
  group.add(slab(concrete, H.minX - 0.3, H.maxX + 0.3, wallTop, wallTop + H.parapetHeight, H.faceZ - 0.25, H.faceZ + H.depth));

  // --------------------------------------------------------------------- door

  const doorFrame = new THREE.MeshStandardMaterial({ color: 0xf0e6cf, roughness: 0.7 });
  const woodMap = createWoodTexture();
  const doorLeaf = new THREE.MeshStandardMaterial({
    color: DOOR_BROWN,
    map: woodMap,
    roughness: 0.55,
  });
  const doorTrim = new THREE.MeshStandardMaterial({ color: DOOR_BROWN_DARK, roughness: 0.6 });
  const doorPanel = new THREE.MeshStandardMaterial({
    color: DOOR_BROWN_LIGHT,
    map: woodMap,
    roughness: 0.5,
  });

  // Reveal around the opening
  group.add(slab(doorFrame, doorX0 - 0.28, doorX0, 0, d.height + 0.28, H.faceZ - 0.06, facadeBack));
  group.add(slab(doorFrame, doorX1, doorX1 + 0.28, 0, d.height + 0.28, H.faceZ - 0.06, facadeBack));
  group.add(slab(doorFrame, doorX0 - 0.28, doorX1 + 0.28, d.height, d.height + 0.28, H.faceZ - 0.06, facadeBack));

  // The leaf itself, set back in the reveal
  const leafZ = H.faceZ + 0.34;
  group.add(slab(doorLeaf, doorX0 + 0.05, doorX1 - 0.05, 0.02, d.height - 0.05, leafZ, leafZ + 0.12));

  // Two raised panels. They sit slightly proud of the leaf and are lighter than
  // it — under the balcony the door is in deep shade, and darker inserts just
  // read as holes punched through it.
  [
    { y0: 0.35, y1: 1.9 },
    { y0: 2.2, y1: 3.75 },
  ].forEach((panel) => {
    // Surround, darker, to give the moulding a shadow line
    group.add(
      slab(doorTrim, doorX0 + 0.3, doorX1 - 0.3, panel.y0 - 0.06, panel.y1 + 0.06, leafZ - 0.05, leafZ + 0.01),
    );
    group.add(
      slab(doorPanel, doorX0 + 0.42, doorX1 - 0.42, panel.y0, panel.y1, leafZ - 0.09, leafZ + 0.01),
    );
  });

  // Handle and a step at the threshold
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd9b45a, roughness: 0.3, metalness: 0.85 }),
  );
  handle.position.set(doorX1 - 0.42, 2.0, leafZ - 0.08);
  handle.castShadow = true;
  group.add(handle);

  group.add(slab(concrete, doorX0 - 0.7, doorX1 + 0.7, 0, 0.16, H.faceZ - 0.9, H.faceZ + 0.1));

  // ------------------------------------------------------------------- windows

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x9fd4e8,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.35,
    transmission: 0,
    clearcoat: 1,
  });
  const mullion = new THREE.MeshStandardMaterial({ color: 0xf0e6cf, roughness: 0.65 });

  const addWindow = (x0: number, x1: number, y0: number, y1: number, columns: number): void => {
    // Frame
    group.add(slab(mullion, x0 - 0.22, x0, y0 - 0.22, y1 + 0.22, H.faceZ - 0.06, facadeBack));
    group.add(slab(mullion, x1, x1 + 0.22, y0 - 0.22, y1 + 0.22, H.faceZ - 0.06, facadeBack));
    group.add(slab(mullion, x0 - 0.22, x1 + 0.22, y1, y1 + 0.22, H.faceZ - 0.06, facadeBack));
    // Sill, projecting a little
    group.add(slab(concrete, x0 - 0.34, x1 + 0.34, y0 - 0.26, y0, H.faceZ - 0.22, facadeBack));

    // Glazing
    const pane = slab(glass, x0, x1, y0, y1, H.faceZ + 0.2, H.faceZ + 0.26);
    pane.castShadow = false;
    group.add(pane);

    // Vertical mullions dividing the glazing
    for (let i = 1; i < columns; i++) {
      const mx = x0 + ((x1 - x0) / columns) * i;
      group.add(slab(mullion, mx - 0.05, mx + 0.05, y0, y1, H.faceZ + 0.16, H.faceZ + 0.3));
    }
  };

  addWindow(windowX0, windowX1, w.sill, w.sill + w.height, 3);
  upperWindows.forEach((win) => addWindow(win.x0, win.x1, win.y0, win.y1, 2));
  addWindow(balconyDoor.x0, balconyDoor.x1, balconyDoor.y0 + 0.1, balconyDoor.y1, 2);

  // ------------------------------------------------------------------- balcony

  const b = H.balcony;

  // Deck slab and its upstand
  group.add(slab(concrete, b.minX, b.maxX, b.deckY - 0.4, b.deckY, b.frontZ, H.faceZ));
  group.add(slab(concrete, b.minX - 0.15, b.maxX + 0.15, b.deckY - 0.5, b.deckY - 0.1, b.frontZ - 0.15, b.frontZ));

  // Columns carrying the outer edge
  b.columnsX.forEach((x) => {
    const column = box(concrete, 0.5, b.deckY - 0.4, 0.5);
    column.position.set(x, (b.deckY - 0.4) / 2, b.frontZ + 0.3);
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);
  });

  // Orange bars: along the front edge, and returning at both ends
  const railY = b.deckY;
  group.add(
    balustrade(
      new THREE.Vector3(b.minX, railY, b.frontZ + 0.08),
      new THREE.Vector3(b.maxX, railY, b.frontZ + 0.08),
      b.railHeight,
    ),
  );
  group.add(
    balustrade(
      new THREE.Vector3(b.minX + 0.08, railY, b.frontZ + 0.08),
      new THREE.Vector3(b.minX + 0.08, railY, H.faceZ),
      b.railHeight,
    ),
  );

  // Pot plants dotted along the deck
  [b.minX + 2.2, b.minX + 8.5, b.minX + 15.5, b.maxX - 4.5, b.maxX - 1.4].forEach((x, i) => {
    const plant = potPlant(i * 1.7);
    plant.group.position.set(x, b.deckY, i % 2 === 0 ? b.frontZ + 0.9 : H.faceZ - 0.9);
    group.add(plant.group);
    animated.push(plant.animated);
  });

  // ---------------------------------------------------------------- staircase

  const s = H.stair;

  // Lower flight, climbing out of the yard toward the house
  group.add(
    flight(concrete, 'z', s.lower.fromZ, s.lower.toZ, s.lower.centreX, s.lower.width, 0, s.lower.topY, s.steps),
  );

  // Solid cheeks either side of the lower flight. The box is built with its
  // long axis on y because that is the axis spanBetween aligns to the slope;
  // the other two stay as the cross-section, which is what we want here.
  const cheekLength = Math.hypot(s.lower.toZ - s.lower.fromZ, s.lower.topY);
  [-1, 1].forEach((side) => {
    const x = s.lower.centreX + side * (s.lower.width / 2 + 0.14);
    const cheek = box(concrete, 0.28, cheekLength, 0.6);
    spanBetween(
      cheek,
      new THREE.Vector3(x, 0.05, s.lower.fromZ),
      new THREE.Vector3(x, s.lower.topY + 0.05, s.lower.toZ),
    );
    cheek.castShadow = true;
    cheek.receiveShadow = true;
    group.add(cheek);
  });

  // Soffit closing the underside of the lower flight
  const lowerSoffit = box(concrete, s.lower.width, cheekLength, 0.34);
  spanBetween(
    lowerSoffit,
    new THREE.Vector3(s.lower.centreX, 0.05, s.lower.fromZ),
    new THREE.Vector3(s.lower.centreX, s.lower.topY + 0.05, s.lower.toZ),
  );
  lowerSoffit.castShadow = true;
  lowerSoffit.receiveShadow = true;
  group.add(lowerSoffit);

  // Half-landing filling the corner against the house, on a solid plinth
  group.add(
    slab(concrete, s.landing.minX, s.landing.maxX, s.lower.topY - 0.35, s.lower.topY, s.landing.minZ, s.landing.maxZ),
  );
  group.add(
    slab(
      concrete,
      s.landing.minX + 0.25,
      s.landing.maxX - 0.25,
      0,
      s.lower.topY - 0.35,
      s.landing.minZ + 0.25,
      s.landing.maxZ,
    ),
  );

  // Upper flight, turning ninety degrees to run along the house to the balcony
  group.add(
    flight(concrete, 'x', s.upper.fromX, s.upper.toX, s.upper.centreZ, s.upper.width, s.lower.topY, b.deckY, s.steps),
  );

  // Soffit under the upper flight
  const upperRun = Math.abs(s.upper.toX - s.upper.fromX);
  const upperSoffit = box(concrete, 0.34, Math.hypot(upperRun, b.deckY - s.lower.topY), s.upper.width);
  spanBetween(
    upperSoffit,
    new THREE.Vector3(s.upper.fromX, s.lower.topY - 0.05, s.upper.centreZ),
    new THREE.Vector3(s.upper.toX, b.deckY - 0.05, s.upper.centreZ),
  );
  upperSoffit.castShadow = true;
  upperSoffit.receiveShadow = true;
  group.add(upperSoffit);

  // Orange handrails following both flights and around the landing
  group.add(
    balustrade(
      new THREE.Vector3(s.lower.centreX - s.lower.width / 2 - 0.1, 0, s.lower.fromZ),
      new THREE.Vector3(s.lower.centreX - s.lower.width / 2 - 0.1, s.lower.topY, s.lower.toZ),
      1.05,
    ),
  );
  group.add(
    balustrade(
      new THREE.Vector3(s.landing.minX - 0.1, s.lower.topY, s.landing.minZ),
      new THREE.Vector3(s.landing.maxX, s.lower.topY, s.landing.minZ),
      1.05,
    ),
  );
  group.add(
    balustrade(
      new THREE.Vector3(s.upper.fromX, s.lower.topY, s.upper.centreZ - s.upper.width / 2 - 0.1),
      new THREE.Vector3(s.upper.toX, b.deckY, s.upper.centreZ - s.upper.width / 2 - 0.1),
      1.05,
    ),
  );

  return { group, animated };
}
