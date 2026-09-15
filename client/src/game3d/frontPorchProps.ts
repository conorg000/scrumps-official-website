/**
 * Builders for the front porch.
 *
 * A Queenslander verandah at dusk: turned posts, cast-iron lace, a bullnose
 * roof, cane chairs nobody sits in, and the front path going down to a street
 * that is already switching its lights on.
 */

import * as THREE from 'three';
import { Animated, applyWorldUVs } from './props';
import { ORANGE, ORANGE_DARK } from './house';
import {
  createBreezeBlockAlpha,
  createCorrugatedIronTexture,
  createPuffTexture,
  createStreetSignTexture,
  createWeatherboardTexture,
  createWoodTexture,
  tiled,
} from './textures';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function matte(color: number, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function metal(color: number, roughness = 0.4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.8 });
}

function timber(color: number, repeat = 2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), repeat, 1),
    color,
    roughness: 0.78,
    metalness: 0,
  });
}

function solid(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * A turned verandah post: square at the base and the capital, chamfered
 * octagonal through the middle, with a moulded band either end.
 */
export function buildVerandahPost(height: number): THREE.Group {
  const group = new THREE.Group();
  const paint = matte(0xf2e6c2, 0.82);

  const plinth = solid(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.34), paint));
  plinth.position.y = 0.25;
  group.add(plinth);

  const shaft = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, height - 1.1, 8), paint),
  );
  shaft.position.y = height / 2;
  group.add(shaft);

  [0.55, height - 0.58].forEach((y) => {
    const band = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 8), paint));
    band.position.y = y;
    group.add(band);
  });

  const capital = solid(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.3), paint));
  capital.position.y = height - 0.26;
  group.add(capital);

  return group;
}

/**
 * Cast-iron lace: a bracket in each corner where a post meets the beam, plus
 * a run of scrollwork along the beam itself. Built from rings and bars rather
 * than a texture so it reads at any distance.
 */
export function buildLaceBracket(size: number): THREE.Group {
  const group = new THREE.Group();
  const iron = matte(0xf4ead0, 0.7);

  // The quarter-circle sweep
  const sweep = new THREE.Mesh(
    new THREE.TorusGeometry(size, 0.028, 5, 16, Math.PI / 2),
    iron,
  );
  sweep.rotation.z = Math.PI;
  sweep.position.set(size, size, 0);
  group.add(sweep);

  // Scrolls filling the corner
  for (let i = 0; i < 3; i++) {
    const t = (i + 1) / 4;
    const scroll = new THREE.Mesh(
      new THREE.TorusGeometry(size * 0.2, 0.02, 5, 12),
      iron,
    );
    scroll.position.set(size * t * 0.9, size * (1 - t) * 0.9, 0);
    group.add(scroll);
  }

  const edgeA = new THREE.Mesh(new THREE.BoxGeometry(size, 0.03, 0.03), iron);
  edgeA.position.set(size / 2, size, 0);
  group.add(edgeA);

  const edgeB = new THREE.Mesh(new THREE.BoxGeometry(0.03, size, 0.03), iron);
  edgeB.position.set(0, size / 2, 0);
  group.add(edgeB);

  return group;
}

/** The run of lace along a beam between two posts. */
export function buildLaceValance(length: number, drop: number): THREE.Group {
  const group = new THREE.Group();
  const iron = matte(0xf4ead0, 0.7);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, 0.04), iron);
  rail.position.y = -0.02;
  group.add(rail);

  const count = Math.max(4, Math.round(length / 0.34));
  for (let i = 0; i <= count; i++) {
    const x = -length / 2 + (i / count) * length;

    const ring = new THREE.Mesh(new THREE.TorusGeometry(drop * 0.17, 0.014, 5, 10), iron);
    ring.position.set(x, -drop * 0.22, 0);
    group.add(ring);

    // Alternating scallop and drip, which is what stops a row of rings
    // reading as a bicycle chain slung under the roof
    if (i % 2 === 0) {
      const scallop = new THREE.Mesh(
        new THREE.TorusGeometry(drop * 0.26, 0.014, 5, 10, Math.PI),
        iron,
      );
      scallop.rotation.z = Math.PI;
      scallop.position.set(x + length / count / 2, -drop * 0.2, 0);
      group.add(scallop);
    } else {
      const drip = new THREE.Mesh(new THREE.ConeGeometry(0.022, drop * 0.28, 5), iron);
      drip.rotation.x = Math.PI;
      drip.position.set(x, -drop * 0.52, 0);
      group.add(drip);
    }
  }

  return group;
}

/**
 * Bullnose verandah roof: corrugated iron falling away from the wall, with the
 * front metre curled over into the bullnose every Queenslander has.
 */
export function buildBullnoseRoof(
  width: number,
  depth: number,
  wallY: number,
  frontY: number,
  thickness: number,
): THREE.Group {
  const group = new THREE.Group();

  const iron = new THREE.MeshStandardMaterial({
    map: tiled(createCorrugatedIronTexture(), width * 0.14, depth * 0.1),
    color: 0xb9c0c8,
    roughness: 0.62,
    metalness: 0.35,
    side: THREE.DoubleSide,
  });

  // The main fall, as a thin slab tipped forward
  const fall = depth - 1.1;
  const slope = Math.atan2(wallY - frontY, fall);
  const sheet = new THREE.Mesh(
    new THREE.BoxGeometry(width, thickness, fall / Math.cos(slope)),
    iron,
  );
  sheet.position.set(0, (wallY + frontY) / 2 + 0.22, fall / 2);
  sheet.rotation.x = slope;
  sheet.castShadow = true;
  group.add(sheet);

  // The bullnose: a quarter cylinder curling down at the front edge
  const radius = 0.85;
  const nose = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 16, 1, true, 0, Math.PI / 2),
    iron,
  );
  nose.rotation.z = Math.PI / 2;
  nose.rotation.y = -Math.PI / 2;
  nose.position.set(0, frontY + 0.22 - radius * 0.1, fall + radius * 0.4);
  nose.castShadow = true;
  group.add(nose);

  // Gutter along the front, and the beam the posts carry
  const gutter = solid(
    new THREE.Mesh(new THREE.BoxGeometry(width, 0.22, 0.26), metal(0x9aa0a6, 0.55)),
  );
  gutter.position.set(0, frontY - 0.62, fall + radius * 0.75);
  group.add(gutter);

  const beam = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, 0.3), matte(0xf2e6c2, 0.82)));
  beam.position.set(0, frontY - 0.95, fall + 0.1);
  group.add(beam);

  // Rafters, visible from below because there is no ceiling under a verandah
  const rafterCount = Math.round(width / 1.6);
  for (let i = 0; i <= rafterCount; i++) {
    const x = -width / 2 + (i / rafterCount) * width;
    const rafter = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, fall / Math.cos(slope)), timber(0xd8b483, 1)),
    );
    rafter.position.set(x, (wallY + frontY) / 2 + 0.05, fall / 2);
    rafter.rotation.x = slope;
    group.add(rafter);
  }

  return group;
}

/**
 * The front door: panelled, with a fanlight over it and sidelights either side.
 *
 * `swing` is how far the leaf stands open, in radians — this is the one way
 * into the house, so it is never drawn shut.
 */
export function buildFrontDoor(width: number, height: number, swing: number): THREE.Group {
  const group = new THREE.Group();

  const leafWidth = width * 0.56;

  // Everything that swings hangs off the hinge stile, not the door's centre
  const hinge = new THREE.Group();
  hinge.position.x = -leafWidth / 2;
  hinge.rotation.y = swing;
  group.add(hinge);

  const leaf = solid(
    new THREE.Mesh(new THREE.BoxGeometry(leafWidth, height * 0.82, 0.12), timber(0x7c3f24, 1)),
  );
  leaf.position.set(leafWidth / 2, (height * 0.82) / 2, 0);
  hinge.add(leaf);

  // Four sunk panels
  ([[-1, 1], [1, 1], [-1, -1], [1, -1]] as [number, number][]).forEach(([sx, sy]) => {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth * 0.36, height * 0.28, 0.03),
      matte(0x69341d, 0.85),
    );
    panel.position.set(
      leafWidth / 2 + sx * leafWidth * 0.22,
      height * 0.41 + sy * height * 0.19,
      0.07,
    );
    hinge.add(panel);
  });

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), metal(0xc9a227, 0.3));
  knob.position.set(leafWidth * 0.86, height * 0.38, 0.1);
  hinge.add(knob);

  // Leadlight: coloured glass in the fanlight and the two sidelights
  const glass = (w: number, h: number, x: number, y: number, tint: number): void => {
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        color: tint,
        emissive: tint,
        // Coloured glass with the afternoon behind it, not a lamp in front
        emissiveIntensity: 0.55,
        roughness: 0.35,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
    );
    pane.position.set(x, y, 0.02);
    group.add(pane);
  };

  const tints = [0xc8452f, 0xe0a83c, 0x2f7f6a, 0xe0a83c, 0xc8452f];
  tints.forEach((tint, i) => {
    const w = leafWidth / tints.length - 0.03;
    glass(w, height * 0.13, -leafWidth / 2 + (i + 0.5) * (leafWidth / tints.length), height * 0.88, tint);
  });

  [-1, 1].forEach((side) => {
    const sideWidth = (width - leafWidth) / 2 - 0.12;
    glass(
      sideWidth,
      height * 0.6,
      (side * (leafWidth + sideWidth + 0.12)) / 2,
      height * 0.48,
      0x2f7f6a,
    );
    const mullion = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, height * 0.95, 0.14), matte(0xf2e6c2, 0.8)),
    );
    mullion.position.set((side * (leafWidth + 0.12)) / 2, (height * 0.95) / 2, 0);
    group.add(mullion);
  });

  // Architrave
  const head = solid(new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.22, 0.2), matte(0xf2e6c2, 0.8)));
  head.position.set(0, height + 0.05, 0);
  group.add(head);

  return group;
}

/** Casement window with a hood, as the front rooms of a Queenslander have. */
export function buildFacadeWindow(width: number, height: number): THREE.Group {
  const group = new THREE.Group();
  const frame = matte(0xf2e6c2, 0.8);

  const bars: [number, number, number, number][] = [
    [0, height / 2, width + 0.24, 0.14],
    [0, -height / 2, width + 0.3, 0.2],
    [-width / 2, 0, 0.14, height],
    [width / 2, 0, 0.14, height],
    [0, 0, 0.08, height],
  ];
  bars.forEach(([x, y, w, h]) => {
    const bar = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), frame));
    bar.position.set(x, y, 0);
    group.add(bar);
  });

  // Daylight glass: dark inside, with a sky reflection across it. Lit panes
  // only read as lit when the world outside them is darker than they are.
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      color: 0x38414a,
      roughness: 0.08,
      metalness: 0.4,
      envMapIntensity: 1,
    }),
  );
  pane.position.z = 0.02;
  group.add(pane);

  // Little corrugated hood over the top
  const hood = solid(
    new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.5, 0.1, 0.5),
      new THREE.MeshStandardMaterial({
        map: tiled(createCorrugatedIronTexture(), 3, 1),
        color: 0x8f959b,
        roughness: 0.6,
        metalness: 0.45,
      }),
    ),
  );
  hood.position.set(0, height / 2 + 0.22, 0.2);
  hood.rotation.x = -0.26;
  group.add(hood);

  return group;
}

/** Cane porch chair, sagging. */
export function buildPorchChair(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  // The 2D room gives these a 2x2 footprint, but filling it makes a four-metre
  // bench. A chair keeps to the middle of its tiles.
  const w = widthTiles * 2 - 2.6;
  const d = depthTiles * 2 - 2.6;
  const cane = matte(0xb59a72, 0.94);
  const caneDark = matte(0x8a7350, 0.94);

  const seat = solid(new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), cane));
  seat.position.y = 0.52;
  group.add(seat);

  // Woven seat, as crossed strands
  for (let i = 0; i < 6; i++) {
    const strand = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, 0.05), caneDark);
    strand.position.set(0, 0.59, -d / 2 + ((i + 0.5) * d) / 6);
    group.add(strand);
  }

  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(w, 0.72, 0.1), cane));
  back.position.set(0, 0.94, -d / 2 + 0.05);
  back.rotation.x = -0.14;
  group.add(back);

  // The hoop caps the backrest rather than floating over it — sitting clear of
  // the back it reads as a croquet hoop stuck behind a bench.
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.05, 6, 16, Math.PI), cane);
  hoop.position.set(0, 1.28, -d / 2 + 0.07);
  hoop.rotation.x = -0.14;
  group.add(hoop);

  // Cane fill inside the hoop
  for (let i = 1; i < 5; i++) {
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, w / 2, 5),
      caneDark,
    );
    spindle.position.set(-w / 2 + (i * w) / 5, 1.34, -d / 2 + 0.06);
    spindle.scale.y = Math.sin((i / 5) * Math.PI) * 0.95;
    group.add(spindle);
  }

  [-1, 1].forEach((side) => {
    const arm = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, d), cane));
    arm.position.set((side * w) / 2, 0.86, 0);
    group.add(arm);

    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.52, 7), cane));
      leg.position.set((side * (w - 0.14)) / 2, 0.26, (sz * (d - 0.14)) / 2);
      group.add(leg);
    });

    const support = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.36, 6), cane));
    support.position.set((side * w) / 2, 0.68, d / 2 - 0.07);
    group.add(support);
  });

  // A cushion somebody left out in the rain
  const cushion = solid(
    new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.16, d - 0.2), matte(0x5c6b52, 0.98)),
  );
  cushion.position.set(0.04, 0.68, 0.03);
  cushion.rotation.y = 0.08;
  group.add(cushion);

  return group;
}

/** Little round table between the chairs, with an ashtray and a dead candle. */
export function buildPorchTable(widthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const radius = widthTiles * 0.42;
  const cane = matte(0xb59a72, 0.94);

  const top = solid(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.07, 18), cane));
  top.position.y = 0.66;
  group.add(top);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 6, 20), matte(0x8a7350, 0.94));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.66;
  group.add(rim);

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.64, 7), cane));
    leg.position.set(Math.sin(angle) * radius * 0.6, 0.33, Math.cos(angle) * radius * 0.6);
    leg.rotation.x = Math.cos(angle) * 0.08;
    leg.rotation.z = -Math.sin(angle) * 0.08;
    group.add(leg);
  }

  const ashtray = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.05, 14), matte(0x6a6f76, 0.5)));
  ashtray.position.set(-0.2, 0.72, 0.12);
  group.add(ashtray);

  const candle = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12), matte(0xd9cfb4, 0.9)));
  candle.position.set(0.24, 0.79, -0.1);
  group.add(candle);

  return group;
}

/** Coir mat, worn through where the door swings over it. */
export function buildWelcomeMat(width: number, depth: number): THREE.Mesh {
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.05, depth),
    matte(0x6b4a2c, 1),
  );
  mat.position.y = 0.025;
  mat.receiveShadow = true;
  return mat;
}

/**
 * The flight down to the front path, with a stringer and a handrail each side.
 * Nobody can walk it — it is the way the house looks at the street.
 */
export function buildPorchSteps(
  width: number,
  drop: number,
  count: number,
): THREE.Group {
  const group = new THREE.Group();
  const tread = timber(0xb08a5a, 3);
  const run = 0.62;

  for (let i = 0; i < count; i++) {
    const y = -((i + 1) * drop) / count;
    const board = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, run), tread));
    board.position.set(0, y, (i + 0.5) * run);
    group.add(board);

    const riser = solid(
      new THREE.Mesh(new THREE.BoxGeometry(width, drop / count, 0.06), matte(0x8a6a44, 0.9)),
    );
    riser.position.set(0, y + drop / count / 2, i * run - 0.03);
    group.add(riser);
  }

  // Stringers and handrails
  [-1, 1].forEach((side) => {
    const length = Math.hypot(count * run, drop);
    const stringer = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, length), timber(0x8a6a44, 3)),
    );
    stringer.position.set((side * (width + 0.12)) / 2, -drop / 2 - 0.12, (count * run) / 2);
    stringer.rotation.x = Math.atan2(drop, count * run);
    group.add(stringer);

    const rail = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, length), matte(TRIM_GREEN, 0.55)),
    );
    rail.position.set((side * (width + 0.12)) / 2, -drop / 2 + 0.95, (count * run) / 2);
    rail.rotation.x = Math.atan2(drop, count * run);
    group.add(rail);

    // Pale infill bars between the rail and the stringer
    const bars = Math.round(length / 0.24);
    for (let i = 0; i <= bars; i++) {
      const t = i / bars;
      const bar = solid(
        new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.82, 0.045), matte(0xe8e4d6, 0.7)),
      );
      bar.position.set((side * (width + 0.12)) / 2, -drop * t + 0.5, t * count * run);
      group.add(bar);
    }

    for (let i = 0; i <= 3; i++) {
      const t = i / 3;
      const newel = solid(
        new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.15, 0.11), matte(TRIM_GREEN, 0.55)),
      );
      newel.position.set(
        (side * (width + 0.12)) / 2,
        -drop * t + 0.44,
        t * count * run,
      );
      group.add(newel);
    }
  });

  return group;
}

/**
 * Bare bulb over the front door, in a tin shade. `lit` is false in daylight,
 * when it is just a fitting on a wall and the moths are asleep.
 */
export function buildPorchLight(lit = false): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.06), matte(0x3f4349, 0.6)));
  group.add(back);

  const arm = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 6), metal(0x4a4e55)));
  arm.rotation.x = Math.PI / 2;
  arm.position.z = 0.16;
  group.add(arm);

  const shade = solid(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.2, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x4e5259, roughness: 0.55, side: THREE.DoubleSide }),
    ),
  );
  shade.position.set(0, 0.06, 0.32);
  group.add(shade);

  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: lit ? 0xfff2d0 : 0xe8e4d8,
    emissive: 0xffd28a,
    emissiveIntensity: lit ? 4 : 0,
    roughness: 0.4,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), bulbMaterial);
  bulb.position.set(0, -0.05, 0.32);
  group.add(bulb);

  const light = new THREE.PointLight(0xffc880, lit ? 9 : 0, 13, 2);
  light.position.set(0, -0.1, 0.35);
  group.add(light);

  // Moths, on their endless doomed orbits. Only out when the bulb is on.
  const moths: THREE.Mesh[] = [];
  if (lit) {
    const mothMaterial = new THREE.MeshStandardMaterial({ color: 0xd8cdb4, roughness: 1 });
    for (let i = 0; i < 6; i++) {
      const moth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.05), mothMaterial);
      group.add(moth);
      moths.push(moth);
    }
  }

  const animated: Animated = {
    update: (time) => {
      if (!lit) return;

      // Old bulbs on a country circuit never sit still
      bulbMaterial.emissiveIntensity = 3.7 + Math.sin(time * 9.3) * 0.25;
      light.intensity = 8.4 + Math.sin(time * 9.3) * 0.6;

      moths.forEach((moth, i) => {
        const phase = time * (1.6 + i * 0.27) + i * 2.1;
        const radius = 0.32 + Math.sin(time * 2.3 + i) * 0.16;
        moth.position.set(
          Math.sin(phase) * radius,
          -0.05 + Math.sin(phase * 1.7 + i) * 0.16,
          0.32 + Math.cos(phase) * radius,
        );
        moth.rotation.y = -phase;
        moth.rotation.z = Math.sin(time * 26 + i) * 0.7;
      });
    },
  };

  return { group, animated };
}

/** Letterbox on a post, at the bottom of the steps. */
export function buildLetterbox(): THREE.Group {
  const group = new THREE.Group();

  const post = solid(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), timber(0x6d4a2a, 1)));
  post.position.y = 0.65;
  group.add(post);

  const box = solid(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.6), matte(0x2f5b46, 0.8)));
  box.position.y = 1.45;
  group.add(box);

  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.02), matte(0x141a17, 0.7));
  slot.position.set(0, 1.5, 0.31);
  group.add(slot);

  // Junk mail that has been there a while
  const rand = seededRandom(212);
  for (let i = 0; i < 3; i++) {
    const flyer = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.01, 0.34), matte(0xe0dac8, 0.95));
    flyer.position.set((rand() - 0.5) * 0.1, 1.62 + i * 0.02, 0.24 + rand() * 0.1);
    flyer.rotation.y = (rand() - 0.5) * 0.5;
    flyer.rotation.x = -0.14;
    group.add(flyer);
  }

  return group;
}

/** Timber picket fence along the front boundary. */
export function buildPicketFence(length: number): THREE.Group {
  const group = new THREE.Group();
  const paint = matte(0xd8cfb0, 0.92);

  [0.42, 0.95].forEach((y) => {
    const rail = solid(new THREE.Mesh(new THREE.BoxGeometry(length, 0.09, 0.05), paint));
    rail.position.y = y;
    group.add(rail);
  });

  const count = Math.round(length / 0.36);
  const rand = seededRandom(88);
  for (let i = 0; i <= count; i++) {
    const picket = solid(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.24, 0.035), paint));
    picket.position.set(-length / 2 + (i / count) * length, 0.62, 0);
    picket.rotation.z = (rand() - 0.5) * 0.045;
    group.add(picket);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 4), paint);
    tip.rotation.y = Math.PI / 4;
    tip.position.set(picket.position.x, 1.31, 0);
    group.add(tip);
  }

  return group;
}

/** A jacaranda mid-flower. Purple, and dropping it everywhere. */
export function buildJacaranda(seed: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  const trunk = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.44, 4.2, 9), matte(0x5a4a3c, 0.96)),
  );
  trunk.position.y = 2.1;
  group.add(trunk);

  const canopy = new THREE.Group();
  canopy.position.y = 4.4;
  group.add(canopy);

  const flower = matte(0x7b5bc4, 0.95);
  const flowerDeep = matte(0x543a94, 0.95);

  for (let i = 0; i < 3; i++) {
    const limb = solid(
      new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.19, 2.2, 7), matte(0x5a4a3c, 0.96)),
    );
    const angle = (i / 3) * Math.PI * 2 + rand();
    limb.position.set(Math.sin(angle) * 0.8, -0.6, Math.cos(angle) * 0.8);
    limb.rotation.set(Math.cos(angle) * 0.5, 0, -Math.sin(angle) * 0.5);
    canopy.add(limb);
  }

  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const r = 0.9 + rand() * 0.8;
    const puff = solid(new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), i % 3 === 0 ? flowerDeep : flower));
    const angle = rand() * Math.PI * 2;
    const spread = rand() * 2.4;
    puff.position.set(Math.sin(angle) * spread, (rand() - 0.3) * 1.5, Math.cos(angle) * spread);
    puff.scale.y = 0.72;
    canopy.add(puff);
    puffs.push(puff);
  }

  // Petals already on the ground under it, which is the actual jacaranda
  // experience — a purple carpet you cannot sweep up fast enough
  const litter = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 20),
    new THREE.MeshStandardMaterial({ color: 0x6b4fae, roughness: 1, transparent: true, opacity: 0.6 }),
  );
  litter.rotation.x = -Math.PI / 2;
  litter.position.y = 0.02;
  group.add(litter);

  const animated: Animated = {
    update: (time) => {
      puffs.forEach((puff, i) => {
        puff.position.y += Math.sin(time * 0.8 + i) * 0.0016;
      });
      canopy.rotation.z = Math.sin(time * 0.5) * 0.012;
    },
  };

  return { group, animated };
}

/** Streetlight. `lit` is false in daylight, when it is just a pole. */
export function buildStreetlight(lit = true): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const pole = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 8.5, 10), matte(0x6a6f76, 0.8)),
  );
  pole.position.y = 4.25;
  group.add(pole);

  const arm = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), matte(0x6a6f76, 0.8)));
  arm.rotation.z = Math.PI / 2 - 0.25;
  arm.position.set(1.05, 8.6, 0);
  group.add(arm);

  const headMaterial = new THREE.MeshStandardMaterial({
    color: lit ? 0x8a6a3a : 0x6e6a62,
    emissive: 0xffa040,
    emissiveIntensity: lit ? 3.4 : 0,
    roughness: 0.5,
  });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.42), headMaterial);
  head.position.set(2.1, 8.3, 0);
  group.add(head);

  if (!lit) {
    return { group, animated: { update: () => {} } };
  }

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createPuffTexture(),
      color: 0xffb060,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.scale.set(7, 7, 1);
  glow.position.set(2.1, 8.2, 0);
  group.add(glow);

  const light = new THREE.PointLight(0xffa850, 14, 26, 2);
  light.position.set(2.1, 8.1, 0);
  group.add(light);

  const animated: Animated = {
    update: (time) => {
      // Sodium lamps hum and take a while to settle
      const flicker = 3.2 + Math.sin(time * 1.3) * 0.2 + (Math.sin(time * 31) > 0.99 ? -1.4 : 0);
      headMaterial.emissiveIntensity = flicker;
      light.intensity = flicker * 4.1;
    },
  };

  return { group, animated };
}

/** The weatherboard wall of the house, run as a slab with real board shadows. */
export function buildWeatherboardWall(
  width: number,
  height: number,
  thickness: number,
): THREE.Group {
  const group = new THREE.Group();

  const core = new THREE.BoxGeometry(width, height, thickness);
  // The map carries 7 boards, and a board is about 0.34 high, so 0.42 tiles per
  // world unit lands the boards at their real size on any size of wall
  applyWorldUVs(core, width, height, thickness, 0.42);
  const wall = solid(
    new THREE.Mesh(
      core,
      new THREE.MeshStandardMaterial({
        map: createWeatherboardTexture(),
        color: 0xf6f0e0,
        roughness: 0.94,
        metalness: 0,
      }),
    ),
  );
  group.add(wall);

  return group;
}

// ------------------------------------------------- the real house, from photos

/** The dark bottle green every bit of trim on the front of the house is painted. */
export const TRIM_GREEN = 0x1f4a38;
export const TRIM_GREEN_LIGHT = 0x2c6449;

/**
 * Flat skillion verandah roof with a deep green fascia and a white sheeted
 * soffit, which is what the real house has — not the bullnose-and-lace of a
 * century earlier.
 */
export function buildFlatVerandahRoof(
  width: number,
  depth: number,
  wallY: number,
  frontY: number,
  thickness: number,
): THREE.Group {
  const group = new THREE.Group();

  const iron = new THREE.MeshStandardMaterial({
    map: tiled(createCorrugatedIronTexture(), width * 0.14, depth * 0.1),
    color: 0xc4cbd2,
    roughness: 0.6,
    metalness: 0.35,
  });

  const slope = Math.atan2(wallY - frontY, depth);
  const run = depth / Math.cos(slope);

  const sheet = solid(new THREE.Mesh(new THREE.BoxGeometry(width, thickness, run), iron));
  sheet.position.set(0, (wallY + frontY) / 2 + 0.3, depth / 2);
  sheet.rotation.x = slope;
  group.add(sheet);

  // The white soffit underneath. Flat sheet, not exposed rafters — you are
  // looking straight up at this from most of the deck.
  // Face down, not up: a plane rotated the other way shows the camera its unlit
  // back, which is why the ceiling came out grey under a white soffit.
  const soffit = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.1, run),
    new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.95, side: THREE.DoubleSide }),
  );
  soffit.position.set(0, (wallY + frontY) / 2 + 0.22, depth / 2);
  soffit.rotation.x = Math.PI / 2 + slope;
  soffit.receiveShadow = true;
  group.add(soffit);

  // Deep green fascia across the front, and the gutter under it
  const fascia = solid(new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.52, 0.12), matte(TRIM_GREEN, 0.6)));
  fascia.position.set(0, frontY + 0.12, depth + 0.1);
  group.add(fascia);

  const gutter = solid(new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.2, 0.24), matte(TRIM_GREEN, 0.55)));
  gutter.position.set(0, frontY - 0.2, depth + 0.14);
  group.add(gutter);

  // A downpipe at each end, running to the ground
  [-1, 1].forEach((side) => {
    const pipe = solid(
      new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, frontY + 2, 8), matte(TRIM_GREEN, 0.6)),
    );
    pipe.position.set((side * (width - 0.6)) / 2, (frontY - 2) / 2, depth + 0.16);
    group.add(pipe);
  });

  // Beam the posts carry
  const beam = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, 0.22), matte(TRIM_GREEN, 0.6)));
  beam.position.set(0, frontY - 0.52, depth - 0.05);
  group.add(beam);

  return group;
}

/** Plain square steel verandah post, painted the same green as everything else. */
export function buildSteelPost(height: number): THREE.Group {
  const group = new THREE.Group();
  const paint = matte(TRIM_GREEN, 0.55);

  const shaft = solid(new THREE.Mesh(new THREE.BoxGeometry(0.14, height, 0.14), paint));
  shaft.position.y = height / 2;
  group.add(shaft);

  [0.04, height - 0.04].forEach((y) => {
    const plate = solid(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.26), paint));
    plate.position.y = y;
    group.add(plate);
  });

  return group;
}

/**
 * Green steel balustrade: a top and bottom rail with plain vertical bars, as on
 * the front stairs. The orange wavy bars belong to the back balcony; the front
 * of this house is green and straight.
 */
export function buildGreenBalustrade(length: number, height: number): THREE.Group {
  const group = new THREE.Group();
  const paint = matte(TRIM_GREEN, 0.55);
  const pale = matte(0xe8e4d6, 0.7);

  [height, 0.12].forEach((y, i) => {
    const rail = solid(new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.1), paint));
    rail.position.y = y - (i === 0 ? 0.06 : 0);
    group.add(rail);
  });

  // Pale infill bars, the way the front gate is done
  const bars = Math.max(2, Math.round(length / 0.22));
  for (let i = 0; i <= bars; i++) {
    const bar = solid(new THREE.Mesh(new THREE.BoxGeometry(0.045, height - 0.16, 0.045), pale));
    bar.position.set(-length / 2 + (i / bars) * length, height / 2, 0);
    group.add(bar);
  }

  // Green posts at each end
  [-1, 1].forEach((side) => {
    const post = solid(new THREE.Mesh(new THREE.BoxGeometry(0.12, height + 0.12, 0.12), paint));
    post.position.set((side * length) / 2, (height + 0.12) / 2, 0);
    group.add(post);
  });

  return group;
}

/**
 * The front wall: a rendered base with a course of pierced breeze blocks along
 * the top and a green capping over them. The piercings are a real alpha map, so
 * you can see the street through them.
 */
export function buildBreezeBlockFence(length: number): THREE.Group {
  const group = new THREE.Group();

  const render = solid(
    new THREE.Mesh(new THREE.BoxGeometry(length, 1.15, 0.36), matte(0xe0d7bf, 0.96)),
  );
  render.position.y = 0.575;
  group.add(render);

  // The pierced course
  const blocks = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.62, 0.3),
    new THREE.MeshStandardMaterial({
      color: TRIM_GREEN_LIGHT,
      roughness: 0.92,
      alphaMap: tiled(createBreezeBlockAlpha(), Math.round(length / 0.62), 1),
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    }),
  );
  blocks.position.y = 1.46;
  blocks.castShadow = true;
  group.add(blocks);

  const capping = solid(
    new THREE.Mesh(new THREE.BoxGeometry(length, 0.14, 0.44), matte(TRIM_GREEN, 0.6)),
  );
  capping.position.y = 1.84;
  group.add(capping);

  return group;
}

/** The green steel driveway gate, with pale vertical bars. */
export function buildFrontGate(width: number): THREE.Group {
  const group = new THREE.Group();
  const height = 1.5;

  const frame = buildGreenBalustrade(width, height);
  group.add(frame);

  // A heavier green frame round the outside of the leaf
  const paint = matte(TRIM_GREEN, 0.55);
  [height, 0].forEach((y) => {
    const rail = solid(new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.14, 0.14), paint));
    rail.position.y = y + 0.07;
    group.add(rail);
  });

  return group;
}

/**
 * A cocos palm, of which the real front yard has an entire thicket. Fronds are
 * tapered strips fanning off the crown, arched over with a droop at the tip.
 */
export function buildPalm(seed: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const rand = seededRandom(seed);
  const height = 4.5 + rand() * 3.5;

  const trunkMaterial = matte(0x8a7a5e, 0.96);
  const segments = Math.round(height / 0.42);
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const r = 0.22 - t * 0.07;
    const ring = solid(new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.015, 0.42, 9), trunkMaterial));
    // Palms never grow straight
    ring.position.set(Math.sin(t * 2.2 + seed) * t * 0.5, 0.21 + i * 0.4, Math.cos(t * 1.7) * t * 0.3);
    group.add(ring);
  }

  const crown = new THREE.Group();
  crown.position.set(Math.sin(2.2 + seed) * 0.5, height, Math.cos(1.7) * 0.3);
  group.add(crown);

  const frondMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f7a35,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const frondDark = new THREE.MeshStandardMaterial({
    color: 0x2c5c28,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  const fronds: THREE.Group[] = [];
  const count = 13;
  for (let i = 0; i < count; i++) {
    const frond = new THREE.Group();
    const length = 3.2 + rand() * 1.2;

    // A rachis arching over, with long drooping leaflets in a V down both sides
    // of it. Short leaflets on a long rachis just read as a wire umbrella.
    const spineSegments = 11;
    const spine = solid(
      new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.018, length, 5), frondDark),
    );
    spine.rotation.z = Math.PI / 2;
    spine.position.set(length / 2, -length * 0.14, 0);
    frond.add(spine);

    for (let sIdx = 1; sIdx <= spineSegments; sIdx++) {
      const t = sIdx / spineSegments;
      // Longest in the middle of the frond, tapering to the tip
      const blade = 1.5 * Math.sin(t * Math.PI * 0.88) + 0.25;
      const droop = 0.55 + t * 0.5;

      [-1, 1].forEach((side) => {
        const leaflet = new THREE.Mesh(
          new THREE.PlaneGeometry(blade, 0.17),
          sIdx % 2 === 0 ? frondMaterial : frondDark,
        );
        // Hung off the rachis and falling away, so the blade's own length
        // carries it down rather than sticking out flat
        leaflet.position.set(
          t * length + Math.cos(droop) * blade * 0.4,
          -t * t * length * 0.4 - Math.sin(droop) * blade * 0.45,
          side * blade * 0.3,
        );
        leaflet.rotation.set(side * 1.15, 0, -droop);
        frond.add(leaflet);
      });
    }

    frond.rotation.y = (i / count) * Math.PI * 2 + rand() * 0.25;
    frond.rotation.z = 0.78 + rand() * 0.42;
    frond.userData.rest = frond.rotation.z;
    crown.add(frond);
    fronds.push(frond);
  }

  // Seed pods hanging under the crown
  for (let i = 0; i < 3; i++) {
    const pod = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), matte(0xd8a63a, 0.8));
    pod.position.set((rand() - 0.5) * 0.5, -0.3 - rand() * 0.3, (rand() - 0.5) * 0.5);
    crown.add(pod);
  }

  const animated: Animated = {
    update: (time) => {
      fronds.forEach((frond, i) => {
        frond.rotation.z = frond.userData.rest + Math.sin(time * 0.8 + i) * 0.06;
      });
      crown.rotation.z = Math.sin(time * 0.5) * 0.015;
    },
  };

  return { group, animated };
}

/** Bougainvillea, going off over the fence in magenta. */
export function buildBougainvillea(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  const leaf = matte(0x35662e, 0.95);
  const bract = matte(0xc82a72, 0.9);
  const bractPale = matte(0xe0568f, 0.9);

  for (let i = 0; i < 16; i++) {
    const r = 0.5 + rand() * 0.8;
    const clump = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 6),
      i % 3 === 0 ? leaf : i % 3 === 1 ? bract : bractPale,
    );
    clump.position.set((rand() - 0.5) * 3.4, r * 0.7 + rand() * 2.2, (rand() - 0.5) * 1.6);
    clump.scale.y = 0.8;
    clump.castShadow = true;
    group.add(clump);
  }

  return group;
}

/** Street sign on its pole: a green blade with the name in white capitals. */
export function buildStreetSign(name: string): THREE.Group {
  const group = new THREE.Group();

  const pole = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 10), matte(0x8e9298, 0.6)),
  );
  pole.position.y = 1.3;
  group.add(pole);

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.48, 0.05),
    new THREE.MeshStandardMaterial({
      map: createStreetSignTexture(name),
      roughness: 0.62,
      metalness: 0.1,
    }),
  );
  blade.position.y = 2.42;
  blade.castShadow = true;
  group.add(blade);

  // The back of the blade is plain green, not mirrored type
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.48),
    matte(0x1d5b3a, 0.62),
  );
  back.position.set(0, 2.42, -0.027);
  back.rotation.y = Math.PI;
  group.add(back);

  return group;
}

/** Wheelie bin, out on the kerb because it is always bin night somewhere. */
export function buildWheelieBin(lidColor: number): THREE.Group {
  const group = new THREE.Group();

  const body = solid(new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.56), matte(0x3c4048, 0.82)));
  body.position.y = 0.62;
  group.add(body);

  const lid = solid(new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.09, 0.6), matte(lidColor, 0.78)));
  lid.position.y = 1.16;
  group.add(lid);

  [-1, 1].forEach((side) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 10), matte(0x1a1c20, 0.7));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * 0.28, 0.11, -0.2);
    group.add(wheel);
  });

  return group;
}
