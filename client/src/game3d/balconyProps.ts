/**
 * Builders for the first-floor balcony.
 *
 * Same contract as props.ts and downstairsProps.ts: origin on the deck at the
 * centre of the grid footprint, so BalconyScene can place them straight from
 * Balcony.furniture.
 *
 * Everything up here has been outside through several summers.
 */

import * as THREE from 'three';
import { Animated, createPickupGlow } from './props';
import { createWoodTexture, tiled } from './textures';

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

function steel(color: number, roughness = 0.35): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.85 });
}

function solid(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Slightly bulged slab, for outdoor cushions. */
function cushion(material: THREE.Material, w: number, h: number, d: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(w, h, d, 3, 2, 3);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const bulge = 1 - 0.14 * (Math.abs(vertex.x / (w / 2)) * Math.abs(vertex.z / (d / 2)));
    position.setXYZ(i, vertex.x * bulge, vertex.y, vertex.z * bulge);
  }
  geometry.computeVertexNormals();
  return solid(new THREE.Mesh(geometry, material));
}

// ---------------------------------------------------------------------- the bbq

/**
 * Four-burner with a hood, a gas bottle underneath and a wire shelf either
 * side. The lid is up, because it always is.
 */
export function buildBBQ(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 1.5;
  const depth = depthTiles * 2 - 1.6;

  const enamel = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.28, metalness: 0.55 });
  const chrome = steel(0xc4cad2, 0.22);
  const grill = matte(0x14161a, 0.55);

  // Cabinet on castors
  const cabinet = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 1.1, depth), enamel));
  cabinet.position.y = 1.05;
  group.add(cabinet);

  const doors = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.12, 0.9, 0.06), enamel));
  doors.position.set(0, 1.05, depth / 2 + 0.02);
  group.add(doors);

  [-1, 1].forEach((side) => {
    const handle = solid(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.5), chrome));
    handle.rotation.y = Math.PI / 2;
    handle.position.set(side * width * 0.22, 1.38, depth / 2 + 0.1);
    group.add(handle);
  });

  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), chrome));
      leg.position.set(sx * (width / 2 - 0.14), 0.25, sz * (depth / 2 - 0.14));
      group.add(leg);

      const castor = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 10), matte(0x18181c, 0.6)));
      castor.rotation.z = Math.PI / 2;
      castor.position.set(sx * (width / 2 - 0.14), 0.08, sz * (depth / 2 - 0.14));
      group.add(castor);
    }),
  );

  // Gas bottle, tucked in one end
  const bottle = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.72, 16), matte(0x9a9a9a, 0.5)));
  bottle.position.set(-width * 0.28, 0.86, 0);
  group.add(bottle);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.14, 12), matte(0x6b6b6b, 0.5));
  collar.position.set(-width * 0.28, 1.28, 0);
  group.add(collar);

  // Cooking surface: hotplate one side, grill bars the other
  const plate = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.07, depth - 0.2), grill));
  plate.position.y = 1.64;
  group.add(plate);

  const hotplate = new THREE.Mesh(
    new THREE.BoxGeometry((width - 0.3) / 2, 0.05, depth - 0.34),
    new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.42, metalness: 0.6 }),
  );
  hotplate.position.set(-(width - 0.3) / 4, 1.7, 0);
  group.add(hotplate);

  const bars = 9;
  for (let i = 0; i < bars; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, depth - 0.34), chrome);
    bar.position.set((width - 0.3) / 4 - (width - 0.4) / 4 + (i / (bars - 1)) * ((width - 0.4) / 2), 1.7, 0);
    bar.castShadow = true;
    group.add(bar);
  }

  // Hood, propped open
  const hood = solid(
    new THREE.Mesh(
      new THREE.CylinderGeometry(depth * 0.52, depth * 0.52, width - 0.1, 20, 1, false, 0, Math.PI),
      enamel,
    ),
  );
  hood.rotation.z = Math.PI / 2;
  hood.rotation.y = Math.PI / 2;
  hood.position.set(0, 1.72, -depth * 0.02);
  hood.rotation.x = -0.75;
  group.add(hood);

  const hoodHandle = solid(new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.06, 0.06), chrome));
  hoodHandle.position.set(0, 2.55, -depth * 0.55);
  group.add(hoodHandle);

  // Control panel and knobs
  const panel = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.22, 0.08), enamel));
  panel.position.set(0, 1.52, depth / 2 + 0.05);
  group.add(panel);

  for (let i = 0; i < 4; i++) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.07, 12), matte(0x101216, 0.4));
    knob.rotation.x = Math.PI / 2;
    knob.position.set(-width * 0.3 + i * (width * 0.2), 1.52, depth / 2 + 0.11);
    group.add(knob);
  }

  // Wire side shelves, with the tongs left on one of them
  [-1, 1].forEach((side) => {
    const shelf = solid(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, depth - 0.5), chrome));
    shelf.position.set(side * (width / 2 + 0.24), 1.6, 0);
    group.add(shelf);
  });

  const tongs = solid(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.62), chrome));
  tongs.position.set(width / 2 + 0.24, 1.64, 0.05);
  tongs.rotation.y = 0.3;
  group.add(tongs);

  return group;
}

// ------------------------------------------------------------------- soft stuff

/** Weatherproof outdoor sofa. Faded cushions, aluminium frame. */
export function buildOutdoorCouch(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 1.4;
  const depth = depthTiles * 2 - 1.2;

  const frame = matte(0x6b6257, 0.75);
  const weave = matte(0x8a7f6b, 0.95);
  const seatFabric = matte(0x9fb0a4, 0.98);
  const backFabric = matte(0x8ba396, 0.98);

  // Woven base and back
  const base = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, depth), weave));
  base.position.y = 0.5;
  group.add(base);

  const backPanel = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.9, 0.22), weave));
  backPanel.position.set(0, 1.1, -depth / 2 + 0.12);
  group.add(backPanel);

  // You see this side from the deck, so it gets the detail: a capping rail and
  // the vertical straps of the weave, rather than one flat panel.
  const capRail = solid(new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, 0.1, 0.3), frame));
  capRail.position.set(0, 1.6, -depth / 2 + 0.12);
  group.add(capRail);

  const straps = Math.max(4, Math.round(width / 0.55));
  for (let i = 0; i <= straps; i++) {
    const strap = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.94, 0.06), matte(0x6f6555, 0.95)),
    );
    strap.position.set(-width / 2 + (i / straps) * width, 1.1, -depth / 2 + 0.01);
    group.add(strap);
  }

  [-1, 1].forEach((side) => {
    const arm = solid(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, depth), weave));
    arm.position.set(side * (width / 2 - 0.12), 0.95, 0);
    group.add(arm);

    const cap = solid(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, depth + 0.1), frame));
    cap.position.set(side * (width / 2 - 0.12), 1.26, 0);
    group.add(cap);
  });

  // Seat and back cushions, sun-faded at slightly different rates
  const seats = 3;
  const seatWidth = (width - 0.6) / seats;
  for (let i = 0; i < seats; i++) {
    const seat = cushion(i === 1 ? matte(0x93a698, 0.98) : seatFabric, seatWidth - 0.08, 0.26, depth - 0.36);
    seat.position.set((i - 1) * seatWidth, 0.83, 0.06);
    group.add(seat);

    const back = cushion(backFabric, seatWidth - 0.1, 0.52, 0.22);
    back.position.set((i - 1) * seatWidth, 1.24, -depth / 2 + 0.3);
    back.rotation.x = 0.14;
    group.add(back);
  }

  // A towel someone left drying over the arm
  const towel = solid(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, depth - 0.5), matte(0xd8613f, 0.98)));
  towel.position.set(-(width / 2 - 0.12) - 0.14, 1.0, 0.05);
  group.add(towel);

  // Aluminium feet
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const foot = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), frame));
      foot.position.set(sx * (width / 2 - 0.2), 0.15, sz * (depth / 2 - 0.2));
      group.add(foot);
    }),
  );

  return group;
}

/** Stackable plastic outdoor chair, in the one colour they all come in. */
export function buildOutdoorChair(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);
  const plastic = matte(0xcfc7b4, 0.72);

  const seat = solid(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.09, 0.96), plastic));
  seat.position.y = 0.88;
  group.add(seat);

  // Slatted back, raked
  const back = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const slat = solid(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.13, 0.06), plastic));
    slat.position.set(0, 0.24 + i * 0.22, 0);
    back.add(slat);
  }
  const backFrame = solid(new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.07), plastic));
  backFrame.position.y = 0.55;
  back.add(backFrame);
  back.position.set(0, 0.9, -0.44);
  back.rotation.x = -0.2;
  group.add(back);

  // Arms and legs, all one moulding
  [-1, 1].forEach((side) => {
    const arm = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.9), plastic));
    arm.position.set(side * 0.48, 1.2, -0.06);
    group.add(arm);

    const support = solid(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.08), plastic));
    support.position.set(side * 0.48, 1.03, 0.34);
    group.add(support);

    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.88, 0.09), plastic));
      leg.position.set(side * 0.44, 0.44, sz * 0.4);
      group.add(leg);
    });
  });

  // Nobody ever puts them back square. Scaled down a little so they read as
  // chairs rather than thrones next to a knee-high crisp.
  group.rotation.y = (rand() - 0.5) * 1.2;
  group.scale.setScalar(0.82);
  return group;
}

/** Small round outdoor table, with an ashtray and a couple of empties. */
export function buildOutdoorTable(): THREE.Group {
  const group = new THREE.Group();
  const topY = 0.92;

  const timber = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 2, 2),
    color: 0x9a7b52,
    roughness: 0.8,
  });

  const top = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.09, 20), timber));
  top.position.y = topY;
  group.add(top);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.04, 8, 24), matte(0x6b5334, 0.8));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = topY;
  group.add(rim);

  const column = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, topY - 0.1, 12), matte(0x6b6257, 0.7)));
  column.position.y = (topY - 0.1) / 2;
  group.add(column);

  const foot = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.07, 16), matte(0x5c5449, 0.7)));
  foot.position.y = 0.035;
  group.add(foot);

  const ashtray = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.07, 14), matte(0x8a8f96, 0.4)));
  ashtray.position.set(0.18, topY + 0.08, -0.1);
  group.add(ashtray);

  [0, 1].forEach((i) => {
    const bottle = solid(
      new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.42, 10), matte(0x3a5c2a, 0.2)),
    );
    bottle.position.set(-0.24 - i * 0.2, topY + 0.25, 0.16 + i * 0.1);
    group.add(bottle);
  });

  return group;
}

// ----------------------------------------------------------------------- plants

/**
 * Terracotta pot with something leafy in it. `scale` covers both the small
 * pots dotted around and the big one in the corner.
 */
export function buildPotPlant(seed: number, scale: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  const pot = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.62, 16), matte(0xb5673f, 0.9)),
  );
  pot.position.y = 0.31;
  group.add(pot);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 8, 20), matte(0xc47a4e, 0.9));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.62;
  group.add(rim);

  const saucer = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 0.06, 16), matte(0xa35c38, 0.9)));
  saucer.position.y = 0.03;
  group.add(saucer);

  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), matte(0x3a2b1c, 1));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.6;
  group.add(soil);

  // Fronds: long tapered blades springing from the middle
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f7d38,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const blades: THREE.Group[] = [];
  const count = 9 + Math.floor(rand() * 5);

  for (let i = 0; i < count; i++) {
    const blade = new THREE.Group();
    const length = 0.9 + rand() * 0.9;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.1, length * 0.5, 0.02, length);
    shape.quadraticCurveTo(-0.02, length * 0.5, -0.1, length * 0.42);
    shape.lineTo(0, 0);

    const leaf = new THREE.Mesh(new THREE.ShapeGeometry(shape, 10), leafMaterial);
    leaf.castShadow = true;
    blade.add(leaf);

    const spin = (i / count) * Math.PI * 2 + rand() * 0.6;
    const lean = 0.3 + rand() * 0.65;
    blade.position.y = 0.6;
    blade.rotation.set(Math.sin(spin) * lean, spin, Math.cos(spin) * lean);
    group.add(blade);
    blades.push(blade);
  }

  group.scale.setScalar(scale);

  return {
    group,
    animated: {
      update(time) {
        // Up here there is always a bit of breeze
        blades.forEach((blade, i) => {
          blade.rotation.y += Math.sin(time * 1.1 + i * 0.7) * 0.0016;
        });
      },
    },
  };
}

// ---------------------------------------------------------------- the compost

/**
 * The compost bin. This is the item the whole downstairs possum subplot hangs
 * off, so it gets the same collectible glow as the cans and CDs.
 */
export function buildCompostBin(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const bin = matte(0x2f4f2f, 0.85);
  const binDark = matte(0x1d331d, 0.85);
  const binLid = matte(0x3f5f3f, 0.8);

  // Tapered body with moulded ribs
  const body = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 1.4, 14), bin));
  body.position.y = 0.7;
  group.add(body);

  [0.35, 0.72, 1.09].forEach((y) => {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 6, 18), binDark);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = y;
    rib.scale.set(1, 1, 1);
    group.add(rib);
  });

  // Lid, sitting slightly askew because it never quite clips on
  const lid = new THREE.Group();
  const lidTop = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.64, 0.12, 14), binLid));
  lid.add(lidTop);
  const lidHandle = solid(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.1), matte(0x2a2a2a, 0.6)));
  lidHandle.position.y = 0.1;
  lid.add(lidHandle);
  lid.position.set(0.05, 1.46, -0.03);
  lid.rotation.z = 0.07;
  group.add(lid);

  // The green recycling badge on the front
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), matte(0x8fe08f, 0.7));
  badge.position.set(0, 0.85, 0.6);
  group.add(badge);
  const badgeInner = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), bin);
  badgeInner.position.set(0, 0.85, 0.61);
  group.add(badgeInner);

  // Compost spilling out from under the lid, because it is overfull
  const heap = solid(new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), matte(0x4a3728, 1)));
  heap.scale.set(1.15, 0.42, 1.15);
  heap.position.y = 1.4;
  group.add(heap);

  const scraps = matte(0x6b5233, 1);
  const rand = seededRandom(808);
  for (let i = 0; i < 9; i++) {
    const scrap = solid(
      new THREE.Mesh(new THREE.BoxGeometry(0.1 + rand() * 0.1, 0.05, 0.08 + rand() * 0.1), scraps),
    );
    const angle = rand() * Math.PI * 2;
    const radius = rand() * 0.42;
    scrap.position.set(Math.cos(angle) * radius, 1.5 + rand() * 0.06, Math.sin(angle) * radius);
    scrap.rotation.set(rand(), rand() * Math.PI, rand());
    group.add(scrap);
  }

  // Flies. There are always flies.
  const flyMaterial = new THREE.MeshBasicMaterial({ color: 0x18181c });
  const flies: { mesh: THREE.Mesh; phase: number; radius: number; speed: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const fly = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), flyMaterial);
    group.add(fly);
    flies.push({ mesh: fly, phase: rand() * Math.PI * 2, radius: 0.35 + rand() * 0.5, speed: 1.4 + rand() * 1.8 });
  }

  const glow = createPickupGlow(0x9ce86a);
  glow.group.position.y = 0.6;
  group.add(glow.group);

  return {
    group,
    animated: {
      update(time, delta) {
        flies.forEach((fly, i) => {
          const t = time * fly.speed + fly.phase;
          fly.mesh.position.set(
            Math.cos(t) * fly.radius,
            1.6 + Math.sin(t * 2.3 + i) * 0.22,
            Math.sin(t * 1.3) * fly.radius,
          );
        });
        glow.animated.update(time, delta);
      },
    },
  };
}
