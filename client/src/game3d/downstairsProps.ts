/**
 * Builders for the converted garage downstairs.
 *
 * Same contract as props.ts: every builder returns a Group whose origin sits on
 * the floor at the centre of its grid footprint, so DownstairsScene can place
 * them straight from the coordinates on DownstairsRoom.furniture.
 *
 * Nothing down here matches anything else. That is the point.
 */

import * as THREE from 'three';
import { Animated } from './props';
import { createKilimTexture, createWoodTexture, tiled } from './textures';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function fabric(color: number, roughness = 0.96): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function metal(color: number, roughness = 0.3): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.85 });
}

/** Emissive material for anything that is its own light source. */
function glow(color: number, intensity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.4,
  });
}

function solid(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A rounded slab — cushions, seat pads, anything upholstered. */
function cushion(
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  segments = 3,
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(w, h, d, segments, segments, segments);
  // Round the corners by pulling every vertex toward a sphere a little. Cheap,
  // and it is the difference between a sofa and a stack of crates.
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const bulge = 1 - 0.16 * (Math.abs(vertex.x / (w / 2)) * Math.abs(vertex.z / (d / 2)));
    position.setXYZ(i, vertex.x * bulge, vertex.y, vertex.z * bulge);
  }
  geometry.computeVertexNormals();
  return solid(new THREE.Mesh(geometry, material));
}

// ------------------------------------------------------------------- seating

/**
 * The couch. Brown velour, rolled arms, one cushion permanently collapsed and
 * one replaced at some point with something that does not match, plus the
 * crocheted blanket nobody has ever washed.
 */
export function buildCouch(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 1.6;
  const depth = depthTiles * 2 - 1.0;

  const velour = fabric(0x6d4630);
  const velourDark = fabric(0x3f2718);
  const pad = fabric(0x8a5b3c);
  // The replacement cushion, from a completely different couch
  const oddOne = fabric(0x4a5f46);

  const base = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.9, 0.5, depth), velourDark));
  base.position.y = 0.5;
  group.add(base);

  // Squat dark-stained feet
  const foot = new THREE.BoxGeometry(0.16, 0.26, 0.16);
  const footMaterial = fabric(0x2e1d12, 0.7);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(foot, footMaterial));
      leg.position.set(sx * (width / 2 - 0.35), 0.13, sz * (depth / 2 - 0.3));
      group.add(leg);
    }),
  );

  // Back, raked and sitting proud of the seat so a shadow line separates them
  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 1.15, 0.32), velour));
  back.position.set(0, 1.5, -depth / 2 + 0.18);
  back.rotation.x = -0.1;
  group.add(back);

  // Rolled arms: a slab with a capsule laid along the top, well below the back
  [-1, 1].forEach((side) => {
    const arm = cushion(velour, 0.42, 0.7, depth, 2);
    arm.position.set(side * (width / 2 - 0.22), 1.0, 0);
    group.add(arm);

    const roll = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, depth - 0.44, 6, 12), velour);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(side * (width / 2 - 0.22), 1.32, 0);
    roll.castShadow = true;
    group.add(roll);
  });

  // Three seat cushions, and three back cushions above a clear gap
  const span = width - 1.0;
  const seatWidth = span / 3;
  for (let i = 0; i < 3; i++) {
    const sag = i === 1 ? 0.14 : 0;
    const seatFabric = i === 2 ? oddOne : pad;

    const seat = cushion(seatFabric, seatWidth - 0.12, 0.36, depth - 0.55);
    seat.position.set((i - 1) * seatWidth, 0.92 - sag, 0.12);
    seat.rotation.y = (i - 1) * 0.03;
    group.add(seat);

    const backPad = cushion(i === 2 ? oddOne : velourDark, seatWidth - 0.16, 0.68, 0.28);
    backPad.position.set((i - 1) * seatWidth, 1.55 - sag * 0.3, -depth / 2 + 0.46);
    backPad.rotation.x = -0.1;
    group.add(backPad);
  }

  // A mismatched scatter cushion, thrown rather than placed
  const scatter = cushion(fabric(0x2f6d5a), 0.66, 0.22, 0.58);
  scatter.position.set(-seatWidth * 0.8, 1.18, -0.25);
  scatter.rotation.set(0.6, 0.4, 0.25);
  group.add(scatter);

  // The blanket: draped over one arm and hanging down the outside, not a slab
  const blanketFabric = fabric(0xb5602c);
  const armX = width / 2 - 0.22;
  const drape = solid(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, depth - 0.7), blanketFabric));
  drape.position.set(armX, 1.5, 0.05);
  drape.rotation.z = -0.08;
  group.add(drape);

  const hang = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.85, depth - 0.9), blanketFabric));
  hang.position.set(armX + 0.24, 1.1, 0.05);
  hang.rotation.z = 0.06;
  group.add(hang);

  const inner = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.45, depth - 1.1), blanketFabric));
  inner.position.set(armX - 0.26, 1.3, 0.05);
  group.add(inner);

  return group;
}

/** The armchair that came with the house. Floral, wingback, deeply wrong. */
export function buildArmchair(): THREE.Group {
  const group = new THREE.Group();

  const floral = fabric(0x4f6b3c);
  const floralDark = fabric(0x33452a);
  const trim = fabric(0x8a4a3a);

  // Skirted base, set in from the arms so the chair does not read as one block
  const base = solid(new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.42, 1.3), floralDark));
  base.position.y = 0.42;
  group.add(base);

  const seat = cushion(floral, 1.16, 0.36, 1.16);
  seat.position.set(0, 0.8, 0.06);
  group.add(seat);

  // Back: shorter than the arms are long, and raked back so the silhouette
  // reads as a chair rather than a cupboard
  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(1.34, 1.15, 0.28), floral));
  back.position.set(0, 1.34, -0.6);
  back.rotation.x = -0.16;
  group.add(back);

  const backPad = cushion(floralDark, 1.05, 0.9, 0.24);
  backPad.position.set(0, 1.26, -0.45);
  backPad.rotation.x = -0.16;
  group.add(backPad);

  // Rolled arms, well below the top of the back
  [-1, 1].forEach((side) => {
    const arm = cushion(floral, 0.3, 0.5, 1.34, 2);
    arm.position.set(side * 0.66, 1.0, 0);
    group.add(arm);

    const roll = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.0, 6, 12), floral);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(side * 0.66, 1.22, 0);
    roll.castShadow = true;
    group.add(roll);

    // Small wings, angled in at the top of the back
    const wing = solid(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.3), floral));
    wing.position.set(side * 0.6, 1.75, -0.5);
    wing.rotation.y = side * 0.3;
    group.add(wing);
  });

  // Piped trim along the front rail, and turned wooden feet
  const piping = solid(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.08), trim));
  piping.position.set(0, 0.63, 0.66);
  group.add(piping);

  const footMaterial = fabric(0x3a2617, 0.7);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const foot = solid(
        new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.22, 8), footMaterial),
      );
      foot.position.set(sx * 0.52, 0.11, sz * 0.54);
      group.add(foot);
    }),
  );

  return group;
}

// --------------------------------------------------------------------- tables

/** Coffee table, invisible under everything that has been left on it. */
export function buildCoffeeTable(widthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 0.8;
  const depth = 1.5;
  const topY = 0.86;

  const woodMaterial = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 2, 1),
    color: 0x9a7a52,
    roughness: 0.6,
  });

  const top = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), woodMaterial));
  top.position.y = topY;
  group.add(top);

  const rail = solid(
    new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, 0.14, depth - 0.3), fabric(0x6b5334, 0.7)),
  );
  rail.position.y = topY - 0.14;
  group.add(rail);

  const legMaterial = fabric(0x53401f, 0.7);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(
        new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, topY - 0.2, 8), legMaterial),
      );
      leg.position.set(sx * (width / 2 - 0.22), (topY - 0.2) / 2, sz * (depth / 2 - 0.22));
      group.add(leg);
    }),
  );

  // The permanent layer of stuff
  const ashtray = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.08, 14), fabric(0x2b2b30, 0.35)),
  );
  ashtray.position.set(width * 0.22, topY + 0.09, 0.15);
  group.add(ashtray);

  const butts = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12),
    fabric(0x6b6255, 0.9),
  );
  butts.position.set(width * 0.22, topY + 0.12, 0.15);
  group.add(butts);

  const mug = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.26, 14), fabric(0xbe4a3a, 0.5)),
  );
  mug.position.set(-width * 0.28, topY + 0.18, -0.28);
  group.add(mug);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.025, 6, 12),
    fabric(0xbe4a3a, 0.5),
  );
  handle.position.set(-width * 0.28 + 0.14, topY + 0.18, -0.28);
  handle.rotation.y = Math.PI / 2;
  group.add(handle);

  // A leaning stack of magazines and unopened mail
  const paperColors = [0xd8d2c0, 0xc4b89a, 0xe0d8c4, 0xb8a888];
  for (let i = 0; i < 5; i++) {
    const sheet = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.44), fabric(paperColors[i % 4], 0.9)),
    );
    sheet.position.set(-width * 0.04, topY + 0.07 + i * 0.03, 0.3);
    sheet.rotation.y = (i - 2) * 0.12;
    group.add(sheet);
  }

  // A candle jammed into an empty bottle, the classic
  const candleBottle = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.5, 12), fabric(0x2f5c34, 0.15)),
  );
  candleBottle.position.set(width * 0.02, topY + 0.3, -0.3);
  group.add(candleBottle);

  const candle = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 10), fabric(0xe8e0c8, 0.7)),
  );
  candle.position.set(width * 0.02, topY + 0.68, -0.3);
  group.add(candle);

  return group;
}

// --------------------------------------------------------------- the jam area

/**
 * Drum kit: kick, snare, two rack toms, floor tom, hats, crash, ride, throne.
 * The cymbals sway, because a kit in a sharehouse is never quite still.
 */
export function buildDrumKit(widthTiles: number, depthTiles: number): {
  group: THREE.Group;
  animated: Animated;
} {
  const group = new THREE.Group();
  const scale = Math.min(widthTiles, depthTiles) * 0.5;

  const shell = new THREE.MeshStandardMaterial({ color: 0x8b1e2d, roughness: 0.25, metalness: 0.15 });
  const shellDark = new THREE.MeshStandardMaterial({ color: 0x5a1220, roughness: 0.3 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf0ece0, roughness: 0.7 });
  const chrome = metal(0xc8ccd0, 0.22);
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a13a, roughness: 0.25, metalness: 0.95 });

  const drum = (radius: number, depth: number, upright: boolean): THREE.Group => {
    const d = new THREE.Group();
    const body = solid(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 20), shell));
    d.add(body);

    [-1, 1].forEach((side) => {
      const head = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.02, 20), skin);
      head.position.y = (side * depth) / 2;
      d.add(head);

      const hoop = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.03, 0.035, 6, 22), chrome);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = (side * depth) / 2;
      d.add(hoop);
    });

    // Lugs around the shell
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const lug = new THREE.Mesh(new THREE.BoxGeometry(0.06, depth * 0.5, 0.05), chrome);
      lug.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      lug.rotation.y = -angle;
      d.add(lug);
    }

    if (!upright) d.rotation.x = Math.PI / 2;
    return d;
  };

  // Kick drum, lying on its side facing the room
  const kick = drum(0.62 * scale, 0.5 * scale, false);
  kick.position.set(0, 0.64 * scale, -0.1);
  group.add(kick);

  const kickLogo = new THREE.Mesh(
    new THREE.CircleGeometry(0.3 * scale, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.6 }),
  );
  kickLogo.position.set(0, 0.64 * scale, -0.37 * scale - 0.02);
  group.add(kickLogo);

  // Spurs holding the kick off the slab
  [-1, 1].forEach((side) => {
    const spur = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7 * scale, 6), chrome);
    spur.position.set(side * 0.5 * scale, 0.3 * scale, -0.3);
    spur.rotation.x = 0.4;
    group.add(spur);
  });

  const pedal = solid(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.42), chrome));
  pedal.position.set(0, 0.06, 0.5);
  pedal.rotation.x = -0.16;
  group.add(pedal);

  // Snare on its stand
  const snare = drum(0.36 * scale, 0.3 * scale, true);
  snare.position.set(-0.75 * scale, 0.95, 0.55);
  group.add(snare);
  group.add(tripod(chrome, -0.75 * scale, 0.55, 0.8, 0.34));

  // Rack toms mounted off the kick
  const tom1 = drum(0.3 * scale, 0.32 * scale, true);
  tom1.position.set(-0.32 * scale, 1.34 * scale, -0.06);
  tom1.rotation.x = 0.3;
  group.add(tom1);

  const tom2 = drum(0.34 * scale, 0.36 * scale, true);
  tom2.position.set(0.34 * scale, 1.32 * scale, -0.06);
  tom2.rotation.x = 0.3;
  group.add(tom2);

  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6 * scale, 6), chrome);
  mount.position.set(0, 1.15 * scale, -0.06);
  group.add(mount);

  // Floor tom on legs
  const floorTom = drum(0.46 * scale, 0.5 * scale, true);
  floorTom.position.set(0.95 * scale, 0.85, 0.5);
  group.add(floorTom);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.9, 6), chrome);
    leg.position.set(
      0.95 * scale + Math.cos(angle) * 0.44 * scale,
      0.45,
      0.5 + Math.sin(angle) * 0.44 * scale,
    );
    group.add(leg);
  }

  // Cymbals. Slightly conical so they catch the light like real ones.
  const cymbals: THREE.Mesh[] = [];
  const addCymbal = (radius: number, x: number, y: number, z: number, tilt: number): void => {
    const cymbal = new THREE.Mesh(new THREE.ConeGeometry(radius, 0.06, 28, 1, true), brass);
    cymbal.material.side = THREE.DoubleSide;
    cymbal.position.set(x, y, z);
    cymbal.rotation.z = tilt;
    cymbal.castShadow = true;
    group.add(cymbal);
    cymbals.push(cymbal);

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, y, 6), chrome);
    stand.position.set(x, y / 2, z);
    group.add(stand);
    group.add(tripod(chrome, x, z, y * 0.36, 0.3));
  };

  addCymbal(0.5 * scale, -1.2 * scale, 1.75 * scale, -0.15, 0.22);
  addCymbal(0.56 * scale, 1.3 * scale, 1.6 * scale, -0.15, -0.18);

  // Hi-hats: two cymbals face to face on one rod
  const hatX = -1.15 * scale;
  const hatZ = 0.75;
  const hatTop = new THREE.Mesh(new THREE.ConeGeometry(0.34 * scale, 0.05, 24, 1, true), brass);
  hatTop.material.side = THREE.DoubleSide;
  hatTop.position.set(hatX, 1.16, hatZ);
  group.add(hatTop);
  cymbals.push(hatTop);

  const hatBottom = new THREE.Mesh(new THREE.ConeGeometry(0.34 * scale, 0.05, 24, 1, true), brass);
  hatBottom.material.side = THREE.DoubleSide;
  hatBottom.rotation.x = Math.PI;
  hatBottom.position.set(hatX, 1.06, hatZ);
  group.add(hatBottom);

  const hatRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 1.1, 6), chrome);
  hatRod.position.set(hatX, 0.55, hatZ);
  group.add(hatRod);
  group.add(tripod(chrome, hatX, hatZ, 0.4, 0.3));

  // Throne, shoved back at an angle
  const throne = new THREE.Group();
  const seat = cushion(fabric(0x1e1e24, 0.8), 0.6, 0.16, 0.6);
  seat.position.y = 1.0;
  throne.add(seat);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), chrome);
  post.position.y = 0.5;
  throne.add(post);
  throne.add(tripod(chrome, 0, 0, 0.42, 0.42));
  throne.position.set(0.1, 0, 1.6);
  group.add(throne);

  // Sticks dropped on the floor
  [0, 1].forEach((i) => {
    const stick = solid(
      new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.038, 0.8, 8), fabric(0xd8bb84, 0.7)),
    );
    stick.rotation.set(Math.PI / 2, 0, 0.5 + i * 0.5);
    stick.position.set(1.5 + i * 0.2, 0.04, 1.5);
    group.add(stick);
  });

  return {
    group,
    animated: {
      update(time) {
        // Barely-there sway, as if someone walked past a moment ago
        cymbals.forEach((cymbal, i) => {
          cymbal.rotation.x = Math.sin(time * 1.3 + i * 1.7) * 0.03;
        });
      },
    },
  };
}

/** Three splayed legs, used under every cymbal, snare and throne stand. */
function tripod(material: THREE.Material, x: number, z: number, height: number, spread: number): THREE.Group {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + 0.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, height * 1.4, 6), material);
    leg.position.set(
      x + (Math.cos(angle) * spread) / 2,
      height / 2,
      z + (Math.sin(angle) * spread) / 2,
    );
    leg.rotation.set(-Math.sin(angle) * 0.42, 0, Math.cos(angle) * 0.42);
    group.add(leg);
  }
  return group;
}

/** Electric guitar on an A-frame stand, leaning back on its strap. */
export function buildGuitar(): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.MeshStandardMaterial({ color: 0x2a5f8f, roughness: 0.2, metalness: 0.1 });
  const neckWood = new THREE.MeshStandardMaterial({ color: 0xb98d54, roughness: 0.55 });
  const fretboard = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.6 });
  const chrome = metal(0xd0d4d8, 0.2);

  const stand = new THREE.Group();
  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.05, 6), fabric(0x1c1c22, 0.5));
    leg.position.set(side * 0.16, 0.5, 0.16);
    leg.rotation.set(-0.3, 0, side * -0.18);
    stand.add(leg);
  });
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), fabric(0x1c1c22, 0.5));
  yoke.position.set(0, 0.28, -0.02);
  stand.add(yoke);
  group.add(stand);

  // The guitar itself, tipped back into the cradle
  const guitar = new THREE.Group();

  // Offset double-cutaway body from two overlapping flattened spheres
  [[-0.16, 0.34], [0.13, 0.4]].forEach(([offsetY, radius]) => {
    const lobe = solid(new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 14), body));
    lobe.scale.set(1, 1, 0.16);
    lobe.position.set(0, offsetY, 0);
    guitar.add(lobe);
  });

  const neck = solid(new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.07), neckWood));
  neck.position.set(0, 1.05, 0.01);
  guitar.add(neck);

  const board = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.02), fretboard);
  board.position.set(0, 1.05, 0.05);
  guitar.add(board);

  for (let i = 0; i < 14; i++) {
    const fret = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.012, 0.01), chrome);
    fret.position.set(0, 0.6 + i * 0.07, 0.062);
    guitar.add(fret);
  }

  const headstock = solid(new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.34, 0.05), neckWood));
  headstock.position.set(0.01, 1.72, 0.0);
  headstock.rotation.z = 0.08;
  guitar.add(headstock);

  for (let i = 0; i < 6; i++) {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 6), chrome);
    peg.rotation.x = Math.PI / 2;
    peg.position.set(i < 3 ? -0.1 : 0.11, 1.62 + (i % 3) * 0.1, 0.04);
    guitar.add(peg);
  }

  // Pickups, bridge and scratchplate
  [0.02, 0.24].forEach((y) => {
    const pickup = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.05), fabric(0x14141a, 0.4));
    pickup.position.set(0, y, 0.07);
    guitar.add(pickup);
  });

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), chrome);
  bridge.position.set(0, -0.16, 0.07);
  guitar.add(bridge);

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.6, 0.01), fabric(0xe8e4d4, 0.35));
  plate.position.set(-0.12, 0.12, 0.075);
  plate.rotation.z = 0.2;
  guitar.add(plate);

  // Strings, running the length of the thing
  for (let i = 0; i < 6; i++) {
    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 1.85, 4),
      metal(0xdededa, 0.15),
    );
    string.position.set(-0.055 + i * 0.022, 0.7, 0.085);
    guitar.add(string);
  }

  guitar.position.set(0, 0.5, 0.02);
  guitar.rotation.x = -0.22;
  group.add(guitar);

  // A lead trailing off toward the amp
  const lead = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.16, 0.1),
        new THREE.Vector3(0.4, 0.05, 0.5),
        new THREE.Vector3(0.1, 0.05, 1.1),
        new THREE.Vector3(-0.7, 0.05, 1.5),
      ]),
      24,
      0.035,
      6,
    ),
    fabric(0x14141a, 0.6),
  );
  lead.castShadow = true;
  group.add(lead);

  return group;
}

/** Keyboard on an X-stand, sustain pedal trailing off the front. */
export function buildKeyboard(): THREE.Group {
  const group = new THREE.Group();
  const chrome = metal(0x30323a, 0.4);
  const bodyMaterial = fabric(0x1c1e26, 0.5);

  // X-stand
  [-1, 1].forEach((side) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.3, 0.07), chrome);
    bar.position.set(0, 0.5, 0);
    bar.rotation.z = side * 0.42;
    group.add(bar);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.7), chrome);
    foot.position.set(side * 0.42, 0.03, 0);
    group.add(foot);
  });

  const body = solid(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.17, 0.52), bodyMaterial));
  body.position.y = 1.06;
  group.add(body);

  // Control panel with a strip of blinking LEDs
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.05, 0.2), fabric(0x2a2d38, 0.4));
  panel.position.set(0, 1.16, -0.15);
  group.add(panel);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), glow(0x35c8e8, 1.6));
  screen.rotation.x = -Math.PI / 2;
  screen.position.set(0.5, 1.19, -0.15);
  group.add(screen);

  [0x2ee66a, 0xe8433a, 0xe8b53a].forEach((color, i) => {
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.022, 8), glow(color, 2.5));
    led.rotation.x = -Math.PI / 2;
    led.position.set(-0.6 + i * 0.1, 0.19, -0.15);
    panel.add(led);
  });

  // Keys: one white run, black keys placed on the real pattern
  const whiteMaterial = fabric(0xf2f0e6, 0.35);
  const blackMaterial = fabric(0x14141a, 0.3);
  const keyCount = 29;
  const keyWidth = 1.56 / keyCount;
  const blackAfter = [0, 1, 3, 4, 5];

  for (let i = 0; i < keyCount; i++) {
    const key = new THREE.Mesh(new THREE.BoxGeometry(keyWidth * 0.9, 0.04, 0.3), whiteMaterial);
    key.position.set(-0.78 + (i + 0.5) * keyWidth, 1.17, 0.08);
    group.add(key);

    if (blackAfter.includes(i % 7)) {
      const sharp = new THREE.Mesh(
        new THREE.BoxGeometry(keyWidth * 0.55, 0.05, 0.19),
        blackMaterial,
      );
      sharp.position.set(-0.78 + (i + 1) * keyWidth, 1.21, 0.02);
      group.add(sharp);
    }
  }

  const pedal = solid(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.3), chrome));
  pedal.position.set(0.3, 0.04, 0.7);
  pedal.rotation.x = -0.1;
  group.add(pedal);

  return group;
}

/** Mic on a boom stand, lead coiled at the base. */
export function buildMicrophone(): THREE.Group {
  const group = new THREE.Group();
  const chrome = metal(0x9a9ea6, 0.28);
  const black = fabric(0x16161c, 0.5);

  // Tripod base
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 6), black);
    leg.position.set(Math.cos(angle) * 0.2, 0.13, Math.sin(angle) * 0.2);
    leg.rotation.set(-Math.sin(angle) * 0.95, 0, Math.cos(angle) * 0.95);
    group.add(leg);
  }

  const column = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.05, 1.75, 10), chrome));
  column.position.y = 0.88;
  group.add(column);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10), black);
  collar.position.y = 1.4;
  group.add(collar);

  // Boom arm, angled out over where a singer would stand
  const boom = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), chrome));
  boom.position.set(0.34, 1.83, 0.14);
  boom.rotation.set(0.12, 0, -1.05);
  group.add(boom);

  const clip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 10), black);
  clip.position.set(0.76, 1.7, 0.2);
  clip.rotation.z = -0.7;
  group.add(clip);

  const mic = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.3, 12), black));
  mic.position.set(0.86, 1.6, 0.23);
  mic.rotation.z = -0.7;
  group.add(mic);

  const grille = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 10),
    metal(0xb0b4bb, 0.35),
  );
  grille.position.set(0.96, 1.52, 0.24);
  group.add(grille);

  // Lead, coiled on the slab the way every mic lead ends up
  const points: THREE.Vector3[] = [new THREE.Vector3(0.9, 1.5, 0.28)];
  points.push(new THREE.Vector3(0.5, 0.9, 0.4), new THREE.Vector3(0.2, 0.2, 0.5));
  for (let i = 0; i < 22; i++) {
    const t = i / 22;
    const angle = t * Math.PI * 5;
    const radius = 0.45 - t * 0.16;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0.04, 0.5 + Math.sin(angle) * radius));
  }
  const lead = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 90, 0.032, 6),
    black,
  );
  lead.castShadow = true;
  group.add(lead);

  return group;
}

/** Guitar amp: head on a 4x12 cab, one power lamp burning away. */
export function buildAmp(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const tolex = new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: 0.85 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x9a8a63, roughness: 0.95 });
  const trim = metal(0xc8b98a, 0.4);

  const cab = solid(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.8), tolex));
  cab.position.y = 0.85;
  group.add(cab);

  const grille = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 1.26), cloth);
  grille.position.set(0, 0.85, 0.405);
  group.add(grille);

  // Four speakers behind the cloth, just proud enough to catch a highlight
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sy) => {
      const cone = new THREE.Mesh(
        new THREE.CircleGeometry(0.26, 18),
        new THREE.MeshStandardMaterial({ color: 0x7d7052, roughness: 0.95 }),
      );
      cone.position.set(sx * 0.31, 0.85 + sy * 0.31, 0.407);
      group.add(cone);
    }),
  );

  // Corner protectors and castors
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const castor = solid(
        new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.07, 10), fabric(0x14141a, 0.5)),
      );
      castor.rotation.z = Math.PI / 2;
      castor.position.set(sx * 0.6, 0.08, sz * 0.3);
      group.add(castor);
    }),
  );

  // The head sitting on top
  const head = solid(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.72), tolex));
  head.position.y = 1.88;
  group.add(head);

  const faceplate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 0.04), trim);
  faceplate.position.set(0, 1.92, 0.37);
  group.add(faceplate);

  for (let i = 0; i < 7; i++) {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.06, 12),
      fabric(0x14141a, 0.35),
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(-0.45 + i * 0.15, 1.92, 0.4);
    group.add(knob);

    const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.02), fabric(0xf0f0f0, 0.4));
    pointer.position.set(-0.45 + i * 0.15, 1.955, 0.42);
    pointer.rotation.z = (i - 3) * 0.4;
    group.add(pointer);
  }

  const lampMaterial = glow(0xff3b2f, 3);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), lampMaterial);
  lamp.position.set(0.62, 1.92, 0.38);
  group.add(lamp);

  const lampLight = new THREE.PointLight(0xff4a2a, 0.7, 2.4, 2);
  lampLight.position.copy(lamp.position);
  group.add(lampLight);

  // The lead going nowhere
  const lead = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.6, 1.9, 0.4),
        new THREE.Vector3(-1.1, 1.2, 0.6),
        new THREE.Vector3(-1.2, 0.05, 0.9),
        new THREE.Vector3(-0.4, 0.05, 1.6),
      ]),
      30,
      0.035,
      6,
    ),
    fabric(0x14141a, 0.6),
  );
  lead.castShadow = true;
  group.add(lead);

  return {
    group,
    animated: {
      update(time) {
        // A valve amp's pilot lamp never sits perfectly still
        const flicker = 2.6 + Math.sin(time * 7.3) * 0.25 + Math.sin(time * 2.1) * 0.35;
        lampMaterial.emissiveIntensity = flicker;
        lampLight.intensity = 0.5 + flicker * 0.1;
      },
    },
  };
}

/** A stack of PA cabs shoved against the wall. Pure 3D-only clutter. */
export function buildSpeakerStack(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.9 });
  const cone = new THREE.MeshStandardMaterial({ color: 0x2c2c34, roughness: 0.85 });

  [
    { w: 1.5, h: 1.6, d: 1.0, y: 0.8, spin: 0.05 },
    { w: 1.3, h: 1.2, d: 0.9, y: 2.2, spin: -0.12 },
    { w: 1.0, h: 0.6, d: 0.8, y: 3.1, spin: 0.2 },
  ].forEach(({ w, h, d, y, spin }) => {
    const cab = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), box));
    cab.position.set(0, y, 0);
    cab.rotation.y = spin;
    group.add(cab);

    const driver = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, h) * 0.32, 18), cone);
    driver.position.set(0, 0, d / 2 + 0.01);
    cab.add(driver);
  });

  return group;
}

// ---------------------------------------------------------------- soft things

/**
 * The tent, still pitched indoors, with a possum in residence. The interior
 * glows from whatever the possum has plugged in.
 */
export function buildTent(widthTiles: number, depthTiles: number): {
  group: THREE.Group;
  animated: Animated;
} {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 1.2;
  const depth = depthTiles * 2 - 0.8;
  const height = 2.0;

  const flyMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8622c,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c6b8f,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  // Groundsheet, poking out past the fly the way it always does
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 0.5, depth + 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1e3a4a, roughness: 1 }),
  );
  sheet.rotation.x = -Math.PI / 2;
  sheet.position.y = 0.02;
  sheet.receiveShadow = true;
  group.add(sheet);

  // Dome built as a squashed hemisphere so the fabric reads as taut
  const dome = solid(
    new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), flyMaterial),
  );
  dome.scale.set(width / 2, height, depth / 2);
  group.add(dome);

  // Crossed poles over the top
  [-1, 1].forEach((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3((-width / 2) * 0.95, 0.05, (side * depth) / 2 * 0.95),
      new THREE.Vector3(0, height * 1.02, 0),
      new THREE.Vector3((width / 2) * 0.95, 0.05, (-side * depth) / 2 * 0.95),
    ]);
    const pole = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.04, 6),
      metal(0x8a9098, 0.4),
    );
    pole.castShadow = true;
    group.add(pole);
  });

  // Door: a dark opening with the flap peeled back and toggled to one side
  const doorway = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 20, Math.PI * 0.15, Math.PI * 0.7),
    new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 1 }),
  );
  doorway.position.set(0, 0.02, depth / 2 - 0.02);
  doorway.scale.set(1, 1.15, 1);
  group.add(doorway);

  const interior = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    innerMaterial,
  );
  interior.scale.set(width / 2.6, height * 0.8, depth / 2.6);
  interior.position.y = 0.02;
  group.add(interior);

  const flap = solid(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), flyMaterial));
  flap.position.set(-0.75, 0.7, depth / 2 - 0.04);
  flap.rotation.set(0, -0.9, 0.15);
  group.add(flap);

  // Guy ropes to pegs that are, of course, on a concrete floor
  const ropeMaterial = fabric(0xd8cf9a, 0.9);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 4), ropeMaterial);
      const from = new THREE.Vector3((sx * width) / 2.6, height * 0.8, (sz * depth) / 2.6);
      const to = new THREE.Vector3((sx * width) / 1.7, 0.02, (sz * depth) / 1.7);
      rope.position.copy(from).add(to).multiplyScalar(0.5);
      rope.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        to.clone().sub(from).normalize(),
      );
      rope.scale.y = from.distanceTo(to) / 1.1;
      group.add(rope);
    }),
  );

  // Whatever the possum is running in there
  const lampMaterial = glow(0xffb454, 2);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), lampMaterial);
  lantern.position.set(0.3, 0.9, -0.3);
  group.add(lantern);

  const lanternLight = new THREE.PointLight(0xffa040, 1.6, 5, 2);
  lanternLight.position.set(0, 0.8, 0.2);
  group.add(lanternLight);

  return {
    group,
    animated: {
      update(time) {
        const pulse = 1.7 + Math.sin(time * 1.7) * 0.25 + Math.sin(time * 5.1) * 0.12;
        lampMaterial.emissiveIntensity = pulse;
        lanternLight.intensity = 1.1 + pulse * 0.28;
      },
    },
  };
}

/** A rug on the slab. Thin box rather than a plane, so it has an edge. */
export function buildRug(
  texture: THREE.Texture,
  width: number,
  depth: number,
  rotation: number,
): THREE.Mesh {
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.04, depth),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 }),
  );
  rug.position.y = 0.02;
  rug.rotation.y = rotation;
  rug.receiveShadow = true;
  return rug;
}

/** The one houseplant, gamely surviving on almost no light. */
export function buildIndoorPlant(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const pot = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.6, 16), fabric(0xb56a45, 0.85)),
  );
  pot.position.y = 0.3;
  group.add(pot);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20), fabric(0xc47a52, 0.85));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.6;
  group.add(rim);

  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), fabric(0x2e2318, 1));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.58;
  group.add(soil);

  // Monstera: big split leaves on long stems, reaching for the doorway
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f6b34,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const rand = seededRandom(77);
  const stems: THREE.Group[] = [];

  for (let i = 0; i < 7; i++) {
    const stem = new THREE.Group();
    const lean = 0.25 + rand() * 0.5;
    const spin = (i / 7) * Math.PI * 2 + rand() * 0.5;
    const length = 0.75 + rand() * 0.65;

    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.032, length, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a7c3a, roughness: 0.8 }),
    );
    stalk.position.y = length / 2;
    stem.add(stalk);

    // Leaf blade with a couple of notches cut toward the midrib
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.34, 0.16, 0.34, 0.56, 0, 0.72);
    shape.bezierCurveTo(-0.34, 0.56, -0.34, 0.16, 0, 0);
    [-1, 1].forEach((side) => {
      const notch = new THREE.Path();
      notch.moveTo(side * 0.06, 0.3);
      notch.lineTo(side * 0.3, 0.34);
      notch.lineTo(side * 0.06, 0.4);
      shape.holes.push(notch);
    });

    const leaf = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), leafMaterial);
    leaf.position.y = length;
    leaf.rotation.x = -1.2 - rand() * 0.4;
    leaf.scale.setScalar(0.9 + rand() * 0.5);
    leaf.castShadow = true;
    stem.add(leaf);

    stem.position.y = 0.56;
    stem.rotation.set(Math.sin(spin) * lean, spin, Math.cos(spin) * lean);
    group.add(stem);
    stems.push(stem);
  }

  return {
    group,
    animated: {
      update(time) {
        // Barely moving — there is no breeze down here, just the odd draught
        stems.forEach((stem, i) => {
          stem.rotation.y += Math.sin(time * 0.6 + i) * 0.0004;
        });
      },
    },
  };
}

// ------------------------------------------------------------------- lighting

/** Floor lamp with a fringed shade. The main pool of warm light in the room. */
export function buildFloorLamp(castShadow: boolean): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const base = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 16), metal(0x6b5a3a, 0.5)),
  );
  base.position.y = 0.04;
  group.add(base);

  const stem = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.5, 10), metal(0x8a7448, 0.45)),
  );
  stem.position.y = 1.28;
  group.add(stem);

  const shadeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2c98a,
    emissive: 0xffb45a,
    emissiveIntensity: 0.9,
    roughness: 0.9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.94,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.68, 0.62, 18, 1, true), shadeMaterial);
  shade.position.y = 2.72;
  group.add(shade);

  // The fringe, which is the entire reason this lamp is in a sharehouse
  const fringeMaterial = fabric(0xc98a3a, 0.95);
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.24, 4), fringeMaterial);
    tassel.position.set(Math.cos(angle) * 0.67, 2.29, Math.sin(angle) * 0.67);
    group.add(tassel);
  }

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), glow(0xffd9a0, 3));
  bulb.position.y = 2.72;
  group.add(bulb);

  const light = new THREE.PointLight(0xffb257, 12, 24, 2);
  light.position.y = 2.7;
  light.castShadow = castShadow;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.004;
  group.add(light);

  return {
    group,
    animated: {
      update(time) {
        // Dodgy wiring, gently
        light.intensity = 11.4 + Math.sin(time * 2.3) * 0.45 + Math.sin(time * 11.7) * 0.22;
      },
    },
  };
}

/** Lava lamp. Non-negotiable in a house like this. */
export function buildLavaLamp(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const chrome = metal(0xb0a488, 0.3);
  const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.34, 16), chrome));
  base.position.y = 0.17;
  group.add(base);

  const cap = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.2, 16), chrome));
  cap.position.y = 1.34;
  group.add(cap);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.24, 1.0, 20, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xff2f9e,
      emissive: 0xff2f9e,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      transmission: 0.6,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.y = 0.84;
  group.add(glass);

  // The blobs, each on its own slow loop
  const blobMaterial = glow(0xffb02e, 2.2);
  const blobs: { mesh: THREE.Mesh; speed: number; phase: number; radius: number }[] = [];
  const rand = seededRandom(1971);
  for (let i = 0; i < 5; i++) {
    const radius = 0.06 + rand() * 0.06;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), blobMaterial);
    group.add(mesh);
    blobs.push({ mesh, speed: 0.18 + rand() * 0.22, phase: rand() * Math.PI * 2, radius });
  }

  const light = new THREE.PointLight(0xff3aa0, 2.6, 7, 2);
  light.position.y = 0.9;
  group.add(light);

  return {
    group,
    animated: {
      update(time) {
        blobs.forEach((blob, i) => {
          // A slow rise and fall, squashing at the turnaround like real wax
          const t = (Math.sin(time * blob.speed + blob.phase) + 1) / 2;
          blob.mesh.position.set(
            Math.sin(time * 0.4 + i) * 0.05,
            0.42 + t * 0.82,
            Math.cos(time * 0.35 + i * 2) * 0.05,
          );
          const squash = 1 + Math.sin(time * blob.speed * 2 + blob.phase) * 0.25;
          blob.mesh.scale.set(1 / squash, squash, 1 / squash);
        });
        light.intensity = 2.3 + Math.sin(time * 0.8) * 0.4;
      },
    },
  };
}

/**
 * A run of party lights strung along the ceiling. Real point lights would be
 * far too expensive at this count, so the bulbs are emissive and a couple of
 * cheap fills carry the actual illumination.
 */
export function buildStringLights(
  from: THREE.Vector3,
  to: THREE.Vector3,
  bulbCount: number,
  sag: number,
): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const point = (t: number): THREE.Vector3 =>
    new THREE.Vector3().lerpVectors(from, to, t).setY(
      THREE.MathUtils.lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * sag,
    );

  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 12 }, (_, i) => point(i / 11)),
  );
  const flex = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 40, 0.018, 5),
    fabric(0x1a1a20, 0.7),
  );
  group.add(flex);

  const colors = [0xff2d95, 0x2ee6d6, 0xf5f04a, 0x8a4cff, 0xff7a2d];
  const bulbs: { material: THREE.MeshStandardMaterial; phase: number }[] = [];

  // Two real lights for the whole run, so the middle of the floor picks up some
  // colour without paying for a light per bulb.
  const fills = [0.3, 0.72].map((t) => {
    const light = new THREE.PointLight(0xffffff, 2.2, 15, 2);
    light.position.copy(point(t));
    group.add(light);
    return light;
  });

  for (let i = 0; i < bulbCount; i++) {
    const t = (i + 0.5) / bulbCount;
    const at = point(t);
    const color = colors[i % colors.length];
    const material = glow(color, 2.4);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), material);
    bulb.position.copy(at).add(new THREE.Vector3(0, -0.09, 0));
    group.add(bulb);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.06, 8), fabric(0x2a2a30, 0.5));
    cap.position.copy(at);
    group.add(cap);

    bulbs.push({ material, phase: i * 0.6 });
  }

  return {
    group,
    animated: {
      update(time) {
        // A slow chase down the run rather than a disco strobe
        bulbs.forEach((bulb) => {
          bulb.material.emissiveIntensity = 1.5 + Math.sin(time * 1.4 - bulb.phase) * 1.1;
        });
        // The fills drift through the same palette, a beat behind the chase
        fills.forEach((light, i) => {
          light.color.setHSL((time * 0.03 + i * 0.4) % 1, 0.55, 0.6);
          light.intensity = 2.0 + Math.sin(time * 0.9 + i * 2) * 0.6;
        });
      },
    },
  };
}

/** Bare fluoro batten screwed to the joists. Never quite strikes properly. */
export function buildFluoroTube(length: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const batten = solid(
    new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 0.22), fabric(0xd8d4c8, 0.6)),
  );
  group.add(batten);

  const tubeMaterial = glow(0xdff0ff, 2.4);
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, length - 0.2, 12),
    tubeMaterial,
  );
  tube.rotation.z = Math.PI / 2;
  tube.position.y = -0.1;
  group.add(tube);

  const light = new THREE.PointLight(0xcfe4ff, 3.2, 14, 2);
  light.position.y = -0.2;
  group.add(light);

  return {
    group,
    animated: {
      update(time) {
        // A stuck starter: mostly on, with the odd dropout and stutter
        const t = time % 6.4;
        const failing = t > 5.2 && t < 5.75;
        const level = failing ? (Math.sin(t * 60) > 0.2 ? 1 : 0.06) : 1;
        tubeMaterial.emissiveIntensity = 2.4 * level;
        light.intensity = 3.2 * level;
      },
    },
  };
}

/**
 * The oil-wheel projection crawling across the wall. A full-screen metaball
 * field in a shader, additively blended so it sits in the room's light rather
 * than on top of it — much cheaper and much more convincing than geometry.
 */
export function buildOilProjection(width: number, height: number): {
  mesh: THREE.Mesh;
  animated: Animated;
} {
  const uniforms = { uTime: { value: 0 } };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;

      // Six drifting blobs summed into a scalar field, then sliced into bands
      float field(vec2 p) {
        float total = 0.0;
        for (int i = 0; i < 6; i++) {
          float fi = float(i);
          vec2 centre = vec2(
            0.5 + sin(uTime * (0.11 + fi * 0.017) + fi * 2.1) * 0.34,
            0.5 + cos(uTime * (0.09 + fi * 0.021) + fi * 1.3) * 0.3
          );
          float d = length((p - centre) * vec2(1.6, 1.0));
          total += 0.055 / (d * d + 0.006);
        }
        return total;
      }

      void main() {
        float v = field(vUv);

        // Hue drifts slowly with the field value. Wide bands, because a real
        // oil wheel smears colours together rather than ringing them.
        float band = fract(v * 0.085 - uTime * 0.017);
        vec3 color = 0.5 + 0.5 * cos(6.28318 * (band + vec3(0.0, 0.28, 0.55)));
        color = mix(vec3(dot(color, vec3(0.33))), color, 0.58);

        // Only the denser part of the field lights up, and it fades at the edges
        float mask = smoothstep(0.55, 3.2, v);
        float vignette = smoothstep(0.0, 0.28, vUv.x) * smoothstep(1.0, 0.72, vUv.x)
                       * smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.72, vUv.y);

        gl_FragColor = vec4(color * mask * vignette * 0.55, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.renderOrder = 5;

  return {
    mesh,
    animated: {
      update(time) {
        uniforms.uTime.value = time;
      },
    },
  };
}

// -------------------------------------------------------------------- clutter

/** Milk crate. The structural unit of every sharehouse in Queensland. */
export function buildMilkCrate(color: number): THREE.Group {
  const group = new THREE.Group();
  const material = fabric(color, 0.8);
  const size = 0.56;
  const wall = 0.05;

  const floor = solid(new THREE.Mesh(new THREE.BoxGeometry(size, wall, size), material));
  floor.position.y = wall / 2;
  group.add(floor);

  // Four slatted sides
  [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ].forEach(([sx, sz]) => {
    for (let i = 0; i < 3; i++) {
      const slat = solid(
        new THREE.Mesh(
          new THREE.BoxGeometry(sx === 0 ? size : wall, 0.1, sz === 0 ? size : wall),
          material,
        ),
      );
      slat.position.set((sx * size) / 2, 0.12 + i * 0.16, (sz * size) / 2);
      group.add(slat);
    }
    const post = solid(
      new THREE.Mesh(
        new THREE.BoxGeometry(sx === 0 ? size : wall, 0.06, sz === 0 ? size : wall),
        material,
      ),
    );
    post.position.set((sx * size) / 2, 0.5, (sz * size) / 2);
    group.add(post);
  });

  return group;
}

/** Records in a crate, leaning back the way they always do. */
export function buildRecordCrate(seed: number): THREE.Group {
  const group = buildMilkCrate(0x2b4f8a);
  const rand = seededRandom(seed);
  const sleeveColors = [0xd8452e, 0x2e7a8f, 0xe0b429, 0x5c2c6b, 0xf0ece0, 0x1f3a2e, 0xd86a2e];

  for (let i = 0; i < 11; i++) {
    const sleeve = solid(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.44, 0.02),
        fabric(sleeveColors[Math.floor(rand() * sleeveColors.length)], 0.85),
      ),
    );
    sleeve.position.set(0, 0.34, -0.2 + i * 0.035);
    sleeve.rotation.x = -0.12 - rand() * 0.06;
    group.add(sleeve);
  }

  return group;
}

/** Shelving unit made of scrap timber, holding whatever fits. */
export function buildJunkShelf(width: number, seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);
  const timber = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 3, 1),
    color: 0x8a7050,
    roughness: 0.85,
  });

  const shelfCount = 4;
  const spacing = 0.78;

  for (let i = 0; i < shelfCount; i++) {
    const board = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, 0.6), timber));
    board.position.y = 0.5 + i * spacing;
    group.add(board);

    // A random spread of boxes, tins and bottles on each shelf
    const items = 4 + Math.floor(rand() * 4);
    for (let j = 0; j < items; j++) {
      const kind = rand();
      const x = (rand() - 0.5) * (width - 0.5);
      const color = [0x8a4a2e, 0x2f6b5a, 0xc4a24a, 0x6b3f7a, 0xb8b0a0][Math.floor(rand() * 5)];

      if (kind < 0.45) {
        const box = solid(
          new THREE.Mesh(
            new THREE.BoxGeometry(0.2 + rand() * 0.24, 0.2 + rand() * 0.22, 0.24 + rand() * 0.2),
            fabric(color, 0.9),
          ),
        );
        box.position.set(x, board.position.y + 0.16, (rand() - 0.5) * 0.2);
        box.rotation.y = rand() * 0.6;
        group.add(box);
      } else if (kind < 0.78) {
        const tin = solid(
          new THREE.Mesh(
            new THREE.CylinderGeometry(0.09, 0.09, 0.22 + rand() * 0.16, 12),
            metal(color, 0.5),
          ),
        );
        tin.position.set(x, board.position.y + 0.18, (rand() - 0.5) * 0.2);
        group.add(tin);
      } else {
        const bottle = solid(
          new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 0.34, 10),
            fabric(0x2f5c34, 0.25),
          ),
        );
        bottle.position.set(x, board.position.y + 0.21, (rand() - 0.5) * 0.2);
        group.add(bottle);
      }
    }
  }

  // Uprights
  [-1, 1].forEach((side) => {
    const post = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, shelfCount * spacing + 0.3, 0.6), timber),
    );
    post.position.set((side * (width - 0.1)) / 2, (shelfCount * spacing) / 2 + 0.25, 0);
    group.add(post);
  });

  return group;
}

/** Bar fridge with a covering of stickers and a six-pack on top. */
export function buildBarFridge(): THREE.Group {
  const group = new THREE.Group();

  const body = solid(
    new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.7, 1.0), fabric(0xd8d4c8, 0.55)),
  );
  body.position.y = 0.85;
  group.add(body);

  const door = solid(new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.4, 0.06), fabric(0xe2ded2, 0.5)));
  door.position.set(0, 0.9, 0.52);
  group.add(door);

  const handle = solid(
    new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.07), metal(0x9a9a9a, 0.35)),
  );
  handle.position.set(0.42, 0.95, 0.58);
  group.add(handle);

  // Stickers, at every angle except straight
  const rand = seededRandom(313);
  const stickerColors = [0xff2d95, 0x2ee6d6, 0xf5f04a, 0xff7a2d, 0x8a4cff];
  for (let i = 0; i < 9; i++) {
    const sticker = new THREE.Mesh(
      new THREE.CircleGeometry(0.07 + rand() * 0.07, 14),
      fabric(stickerColors[Math.floor(rand() * stickerColors.length)], 0.5),
    );
    sticker.position.set((rand() - 0.5) * 0.8, 0.35 + rand() * 1.2, 0.56);
    sticker.rotation.z = rand() * Math.PI;
    group.add(sticker);
  }

  // Bottles on the lid, plus a stack of pizza boxes
  for (let i = 0; i < 4; i++) {
    const bottle = solid(
      new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.4, 10), fabric(0x4a2a10, 0.2)),
    );
    bottle.position.set(-0.36 + i * 0.2, 1.9, -0.2);
    group.add(bottle);
  }

  for (let i = 0; i < 3; i++) {
    const pizza = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 0.8), fabric(0xc4a878, 0.95)),
    );
    pizza.position.set(0.05, 1.75 + i * 0.08, 0.25);
    pizza.rotation.y = (i - 1) * 0.2;
    group.add(pizza);
  }

  return group;
}

/** CRT telly on crates, playing static nobody is watching. */
export function buildTelly(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  [-0.45, 0.45].forEach((x, i) => {
    const crate = buildMilkCrate(i === 0 ? 0xc4442e : 0xe0a82c);
    crate.position.set(x, 0, 0);
    group.add(crate);
  });

  const casing = solid(
    new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.1), fabric(0x3a3630, 0.7)),
  );
  casing.position.y = 1.2;
  group.add(casing);

  const bezel = solid(new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.08), fabric(0x2a2620, 0.6)));
  bezel.position.set(0, 1.24, 0.56);
  group.add(bezel);

  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f7391,
    emissive: 0x5a7db0,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.82), screenMaterial);
  screen.position.set(0, 1.24, 0.61);
  group.add(screen);

  const light = new THREE.PointLight(0x6f9ad8, 2.2, 8, 2);
  light.position.set(0, 1.3, 1.0);
  group.add(light);

  // Rabbit ears
  [-1, 1].forEach((side) => {
    const aerial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 1.1, 6),
      metal(0xb0b4bb, 0.3),
    );
    aerial.position.set(side * 0.2, 2.3, -0.2);
    aerial.rotation.z = side * 0.6;
    group.add(aerial);
  });

  return {
    group,
    animated: {
      update(time) {
        // Untuned static: fast noise on the emissive with an occasional roll bar
        const noise = Math.sin(time * 43.7) * Math.sin(time * 19.3) * 0.5 + 0.5;
        screenMaterial.emissiveIntensity = 0.55 + noise * 0.6;
        screenMaterial.emissive.setHSL(0.58, 0.28, 0.26 + noise * 0.16);
        light.intensity = 1.2 + noise * 1.1;
      },
    },
  };
}

/** Clothes horse, permanently deployed, permanently full. */
export function buildClothesRack(): THREE.Group {
  const group = new THREE.Group();
  const frame = metal(0xc8ccd2, 0.4);
  const rand = seededRandom(505);

  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8), frame);
    leg.position.set(side * 0.7, 0.85, side * 0.28);
    leg.rotation.x = side * 0.32;
    group.add(leg);
  });

  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.5, 8), frame);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = 1.62;
  group.add(rail);

  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), frame);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.6 + i * 0.32, -0.2);
    group.add(bar);
  }

  // The washing, hung at every angle but flat
  const shirtColors = [0x8a3a3a, 0x2f5c7a, 0xd8c88a, 0x3a6b4a, 0x6b4a7a, 0xd8d4c8];
  for (let i = 0; i < 9; i++) {
    const shirt = solid(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.34 + rand() * 0.16, 0.5 + rand() * 0.45, 0.03),
        fabric(shirtColors[Math.floor(rand() * shirtColors.length)], 0.95),
      ),
    );
    shirt.position.set(-0.6 + rand() * 1.2, 1.25 - rand() * 0.5, -0.22 + rand() * 0.35);
    shirt.rotation.set(0, rand() * 0.4 - 0.2, (rand() - 0.5) * 0.2);
    group.add(shirt);
  }

  return group;
}

/**
 * The litter that accumulates on the floor: bottles, cans, a stray thong.
 * Scattered by seed so it looks strewn rather than arranged.
 */
export function buildFloorLitter(seed: number, count: number, spread: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  const bottleGlass = fabric(0x5c3c18, 0.2);
  const canMetal = metal(0x8f9a8a, 0.45);

  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * spread;
    const z = (rand() - 0.5) * spread;
    const kind = rand();

    if (kind < 0.45) {
      const bottle = solid(
        new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 10), bottleGlass),
      );
      bottle.position.set(x, 0.1, z);
      bottle.rotation.set(Math.PI / 2, 0, rand() * Math.PI);
      group.add(bottle);
    } else if (kind < 0.75) {
      const can = solid(
        new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 12), canMetal),
      );
      can.position.set(x, 0.09, z);
      if (rand() > 0.5) can.rotation.set(Math.PI / 2, 0, rand() * Math.PI);
      else can.position.y = 0.13;
      group.add(can);
    } else if (kind < 0.9) {
      const cup = solid(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.07, 0.2, 12),
          fabric(0xd8302e + Math.floor(rand() * 3) * 0x001010, 0.7),
        ),
      );
      cup.position.set(x, 0.1, z);
      cup.rotation.z = rand() > 0.6 ? Math.PI / 2 : 0;
      group.add(cup);
    } else {
      const thong = solid(
        new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.42), fabric(0x5c86a8, 0.8)),
      );
      thong.position.set(x, 0.02, z);
      thong.rotation.y = rand() * Math.PI;
      group.add(thong);
    }
  }

  return group;
}

/** A power lead snaking across the slab between two points. */
export function buildCableRun(points: THREE.Vector3[]): THREE.Mesh {
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length * 8, 0.04, 6),
    fabric(0x16161c, 0.65),
  );
  cable.castShadow = true;
  return cable;
}

/** The kilim, exported here so the scene does not have to know the texture. */
export function buildJamRug(width: number, depth: number, rotation: number): THREE.Mesh {
  return buildRug(createKilimTexture(), width, depth, rotation);
}
