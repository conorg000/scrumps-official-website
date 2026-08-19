/**
 * Builders for the living room.
 *
 * The house's front room is, for reasons nobody has explained, an art gallery
 * with exactly one subject. Everything else in here is the good furniture:
 * whatever was inherited with the house, kept nicer than the garage below.
 */

import * as THREE from 'three';
import { Animated } from './props';
import {
  createBananaArtTexture,
  createBookSpineTexture,
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

function metal(color: number, roughness = 0.35): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.85 });
}

function solid(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Rounded upholstery slab. */
function cushion(material: THREE.Material, w: number, h: number, d: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(w, h, d, 3, 2, 3);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const bulge = 1 - 0.15 * (Math.abs(vertex.x / (w / 2)) * Math.abs(vertex.z / (d / 2)));
    position.setXYZ(i, vertex.x * bulge, vertex.y, vertex.z * bulge);
  }
  geometry.computeVertexNormals();
  return solid(new THREE.Mesh(geometry, material));
}

// ------------------------------------------------------------------- artwork

/**
 * A framed banana. Deep moulded frame, visible canvas edge, and a slight
 * forward lean off the picture rail the way hung pictures actually sit.
 */
export function buildBananaPainting(variant: number, width: number, height: number): THREE.Group {
  const group = new THREE.Group();

  const frameDepth = 0.16;
  const frameWidth = 0.13;
  const frameMaterial = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 2, 1),
    color: variant === 2 ? 0xb08a4a : 0x5c4028,
    roughness: 0.55,
    metalness: variant === 2 ? 0.3 : 0,
  });

  // Four mitred sides
  const sides: [number, number, number, number][] = [
    [0, height / 2, width + frameWidth * 2, frameWidth],
    [0, -height / 2, width + frameWidth * 2, frameWidth],
    [-width / 2 - frameWidth / 2, 0, frameWidth, height],
    [width / 2 + frameWidth / 2, 0, frameWidth, height],
  ];
  sides.forEach(([x, y, w, h]) => {
    const bar = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, frameDepth), frameMaterial));
    bar.position.set(x, y, 0);
    group.add(bar);
  });

  // The canvas, set back inside the frame
  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: createBananaArtTexture(variant), roughness: 0.88 }),
  );
  canvas.position.z = frameDepth / 2 - 0.03;
  group.add(canvas);

  // Backing board, so it is not see-through from an angle
  const back = solid(
    new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.04), matte(0x2a2018, 0.9)),
  );
  back.position.z = -frameDepth / 2 + 0.02;
  group.add(back);

  // Hanging wire up to the picture rail
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.9, 4),
    matte(0x3a3a3a, 0.5),
  );
  wire.position.set(0, height / 2 + 0.45, -0.06);
  group.add(wire);

  // Pictures hung on a rail always tip forward a little at the top
  group.rotation.x = 0.05;
  return group;
}

/** A stack of framed canvases leaning against the wall, facing away. */
export function buildLeaningCanvases(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  for (let i = 0; i < 5; i++) {
    const w = 1.4 + rand() * 1.1;
    const h = 1.6 + rand() * 1.2;
    const canvas = solid(
      new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), matte(0x6b5438, 0.85)),
    );
    canvas.position.set((rand() - 0.5) * 0.7, h / 2, 0.14 + i * 0.13);
    canvas.rotation.set(0.17 + rand() * 0.05, (rand() - 0.5) * 0.3, 0);
    group.add(canvas);

    // Stretcher bars on the back, which is the side you see
    [-1, 1].forEach((side) => {
      const bar = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, h - 0.1, 0.03), matte(0x8a6f4a, 0.9)));
      bar.position.set(side * (w / 2 - 0.1), 0, 0.06);
      canvas.add(bar);
    });
    const rail = solid(new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.09, 0.03), matte(0x8a6f4a, 0.9)));
    rail.position.set(0, 0, 0.06);
    canvas.add(rail);
  }

  return group;
}

/** Gallery plinth with a banana on it. This is the collection's centrepiece. */
export function buildPlinth(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const plinth = solid(new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 1.0), matte(0xf0ece2, 0.85)));
  plinth.position.y = 1.0;
  group.add(plinth);

  const cap = solid(new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.06, 1.08), matte(0xe4dece, 0.8)));
  cap.position.y = 2.03;
  group.add(cap);

  // A single banana under a glass dome, lit from above
  const banana = new THREE.Group();
  const flesh = new THREE.MeshStandardMaterial({ color: 0xffd91e, roughness: 0.55 });

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.28, 0, 0),
    new THREE.Vector3(-0.1, 0.16, 0),
    new THREE.Vector3(0.12, 0.16, 0),
    new THREE.Vector3(0.28, 0, 0),
  ]);
  const body = solid(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.075, 10), flesh));
  banana.add(body);

  [-0.3, 0.3].forEach((x) => {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), matte(0x6b4a20, 0.7));
    tip.position.set(x, -0.01, 0);
    banana.add(tip);
  });

  banana.position.y = 2.22;
  group.add(banana);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0xdfe8f0,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.85,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    }),
  );
  dome.position.y = 2.06;
  group.add(dome);

  const spot = new THREE.PointLight(0xfff0d0, 3, 5, 2);
  spot.position.set(0, 3.4, 0);
  group.add(spot);

  // A gallery label, because of course there is one
  const label = solid(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.02), matte(0xf8f6f0, 0.85)));
  label.position.set(0, 1.5, 0.51);
  group.add(label);

  return {
    group,
    animated: {
      update(time) {
        banana.rotation.y = time * 0.35;
      },
    },
  };
}

// ------------------------------------------------------------------- seating

/** The big comfy couch. Chesterfield-ish, buttoned, sagging in the middle. */
export function buildLivingCouch(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 1.4;
  const depth = depthTiles * 2 - 0.9;

  const leather = matte(0x8a4a22, 0.62);
  const leatherDark = matte(0x5c2f14, 0.62);
  const seatLeather = matte(0xa85f2c, 0.6);

  const base = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.7, 0.5, depth), leatherDark));
  base.position.y = 0.48;
  group.add(base);

  // Rolled arms, running the full depth
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, depth, 16), leather);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(side * (width / 2 - 0.34), 1.02, 0);
    arm.castShadow = true;
    group.add(arm);

    const armBase = solid(new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.6, depth), leather));
    armBase.position.set(side * (width / 2 - 0.34), 0.72, 0);
    group.add(armBase);
  });

  // Buttoned back
  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 1.0, 0.42), leather));
  back.position.set(0, 1.18, -depth / 2 + 0.2);
  group.add(back);

  const backRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, width, 16), leather);
  backRoll.rotation.z = Math.PI / 2;
  backRoll.position.set(0, 1.66, -depth / 2 + 0.2);
  backRoll.castShadow = true;
  group.add(backRoll);

  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 6; i++) {
      const button = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), leatherDark);
      button.position.set(
        -width / 2 + 0.6 + i * ((width - 1.2) / 5),
        1.0 + row * 0.36,
        -depth / 2 + 0.41,
      );
      group.add(button);
    }
  }

  // Three seat cushions, the middle one gone soft
  const seatWidth = (width - 1.4) / 3;
  for (let i = 0; i < 3; i++) {
    const sag = i === 1 ? 0.1 : 0;
    const seat = cushion(seatLeather, seatWidth - 0.06, 0.32, depth - 0.5);
    seat.position.set((i - 1) * seatWidth, 0.88 - sag, 0.1);
    group.add(seat);
  }

  // Turned feet
  const foot = matte(0x3a2617, 0.7);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.24, 10), foot));
      leg.position.set(sx * (width / 2 - 0.45), 0.12, sz * (depth / 2 - 0.3));
      group.add(leg);
    }),
  );

  return group;
}

/** Matching armchair, with a throw over the back. */
export function buildLivingArmchair(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 1.6;
  const depth = depthTiles * 2 - 1.6;

  const leather = matte(0x8a4a22, 0.62);
  const leatherDark = matte(0x5c2f14, 0.62);

  const base = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, 0.5, depth), leatherDark));
  base.position.y = 0.48;
  group.add(base);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, depth, 14), leather);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(side * (width / 2 - 0.3), 1.0, 0);
    arm.castShadow = true;
    group.add(arm);

    const armBase = solid(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.58, depth), leather));
    armBase.position.set(side * (width / 2 - 0.3), 0.71, 0);
    group.add(armBase);
  });

  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 1.05, 0.4), leather));
  back.position.set(0, 1.2, -depth / 2 + 0.2);
  group.add(back);

  const backRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, width, 14), leather);
  backRoll.rotation.z = Math.PI / 2;
  backRoll.position.set(0, 1.7, -depth / 2 + 0.2);
  backRoll.castShadow = true;
  group.add(backRoll);

  const seat = cushion(matte(0xa85f2c, 0.6), width - 0.7, 0.34, depth - 0.5);
  seat.position.set(0, 0.88, 0.1);
  group.add(seat);

  // A knitted throw over one arm
  const throwOver = solid(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, depth - 0.3), matte(0x3f6b6b, 0.98)));
  throwOver.position.set(-(width / 2 - 0.3), 1.34, 0.05);
  group.add(throwOver);

  const hang = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, depth - 0.5), matte(0x3f6b6b, 0.98)));
  hang.position.set(-(width / 2 - 0.3) - 0.32, 0.95, 0.05);
  group.add(hang);

  const foot = matte(0x3a2617, 0.7);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.24, 10), foot));
      leg.position.set(sx * (width / 2 - 0.4), 0.12, sz * (depth / 2 - 0.28));
      group.add(leg);
    }),
  );

  return group;
}

// -------------------------------------------------------------------- tables

/** Low coffee table with a glass top on a timber frame. */
export function buildLivingCoffeeTable(widthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 0.8;
  const depth = 1.6;
  const topY = 0.82;

  const timber = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 2, 1),
    color: 0x8a6540,
    roughness: 0.6,
  });

  const frame = solid(new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), timber));
  frame.position.y = topY - 0.07;
  group.add(frame);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.2, 0.05, depth - 0.2),
    new THREE.MeshPhysicalMaterial({
      color: 0xd8e4e8,
      roughness: 0.03,
      metalness: 0,
      transmission: 0.9,
      transparent: true,
      opacity: 0.35,
    }),
  );
  glass.position.y = topY + 0.03;
  group.add(glass);

  // Magazine shelf underneath
  const shelf = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.06, depth - 0.5), timber));
  shelf.position.y = 0.3;
  group.add(shelf);

  const rand = seededRandom(4242);
  for (let i = 0; i < 6; i++) {
    const mag = solid(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.03, 0.5),
        matte([0xd8cfa8, 0xa8524a, 0x4a6b8a, 0xd8a84a][Math.floor(rand() * 4)], 0.9),
      ),
    );
    mag.position.set((rand() - 0.5) * (width - 1.2), 0.35 + i * 0.03, (rand() - 0.5) * 0.4);
    mag.rotation.y = (rand() - 0.5) * 0.5;
    group.add(mag);
  }

  const legs = matte(0x5c4028, 0.65);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.BoxGeometry(0.09, topY - 0.13, 0.09), legs));
      leg.position.set(
        sx * (width / 2 - 0.16),
        (topY - 0.13) / 2,
        sz * (depth / 2 - 0.16),
      );
      group.add(leg);
    }),
  );

  return group;
}

/** Little side table with a doily and a lamp-less lamp base on it. */
export function buildSideTable(): THREE.Group {
  const group = new THREE.Group();
  const topY = 1.0;

  const timber = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 1, 1),
    color: 0x7a5638,
    roughness: 0.6,
  });

  const top = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.08, 18), timber));
  top.position.y = topY;
  group.add(top);

  const doily = new THREE.Mesh(new THREE.CircleGeometry(0.46, 20), matte(0xf2ece0, 0.95));
  doily.rotation.x = -Math.PI / 2;
  doily.position.y = topY + 0.045;
  group.add(doily);

  const column = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, topY - 0.1, 12), timber));
  column.position.y = (topY - 0.1) / 2;
  group.add(column);

  // Three splayed feet
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const foot = solid(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.5), timber));
    foot.position.set(Math.cos(angle) * 0.2, 0.05, Math.sin(angle) * 0.2);
    foot.rotation.y = -angle;
    group.add(foot);
  }

  // A bowl of something and a stack of coasters
  const bowl = solid(new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), matte(0x2f6b7a, 0.4)));
  bowl.rotation.x = Math.PI;
  bowl.position.set(0.12, topY + 0.16, -0.06);
  group.add(bowl);

  for (let i = 0; i < 4; i++) {
    const coaster = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), matte(0x8a4a2a, 0.8)));
    coaster.position.set(-0.28, topY + 0.06 + i * 0.02, 0.2);
    coaster.rotation.y = i * 0.4;
    group.add(coaster);
  }

  return group;
}

/** Bookshelf, full. The CD collectible sits on it in the 2D room too. */
export function buildBookshelf(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const width = widthTiles * 2 - 0.8;
  const depth = Math.min(depthTiles * 2 - 0.8, 0.75);
  // Tall enough to loom over a crisp without blocking the whole room
  const height = 3.4;

  const timber = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 2, 3),
    color: 0x9a734a,
    roughness: 0.7,
  });
  const spines = new THREE.MeshStandardMaterial({
    map: tiled(createBookSpineTexture(), 2, 1),
    roughness: 0.85,
  });

  // Carcass
  [-1, 1].forEach((side) => {
    const upright = solid(new THREE.Mesh(new THREE.BoxGeometry(0.12, height, depth), timber));
    upright.position.set(side * (width / 2 - 0.06), height / 2, 0);
    group.add(upright);
  });

  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.06), timber));
  back.position.set(0, height / 2, -depth / 2 + 0.03);
  group.add(back);

  const shelves = 5;
  const rand = seededRandom(818);
  for (let i = 0; i <= shelves; i++) {
    const y = 0.2 + (i / shelves) * (height - 0.5);
    const board = solid(new THREE.Mesh(new THREE.BoxGeometry(width - 0.24, 0.08, depth - 0.06), timber));
    board.position.set(0, y, 0);
    group.add(board);

    if (i === shelves) continue;

    // A run of books, sometimes stopping short with a gap or a lying stack
    const run = (width - 0.4) * (0.55 + rand() * 0.4);
    const books = solid(
      new THREE.Mesh(new THREE.BoxGeometry(run, (height - 0.5) / shelves - 0.16, depth - 0.24), spines),
    );
    books.position.set(
      -(width - 0.4) / 2 + run / 2,
      y + ((height - 0.5) / shelves - 0.16) / 2 + 0.04,
      0.02,
    );
    group.add(books);

    if (rand() > 0.5) {
      const stack = solid(
        new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, depth - 0.3), spines),
      );
      stack.position.set((width - 0.4) / 2 - 0.4, y + 0.18, 0.02);
      stack.rotation.y = 0.1;
      group.add(stack);
    }
  }

  return group;
}

// ------------------------------------------------------------------- lighting

/** Standard lamp with a drum shade. Warmer and tidier than the garage one. */
export function buildStandardLamp(castShadow: boolean): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const brass = metal(0xb08a4a, 0.35);

  const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.07, 18), brass));
  base.position.y = 0.035;
  group.add(base);

  const stem = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.7, 10), brass));
  stem.position.y = 1.38;
  group.add(stem);

  const shadeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5e2bc,
    emissive: 0xffcf90,
    emissiveIntensity: 0.85,
    roughness: 0.9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.6, 0.66, 20, 1, true), shadeMaterial);
  shade.position.y = 2.94;
  group.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffd9a0, emissiveIntensity: 3 }),
  );
  bulb.position.y = 2.94;
  group.add(bulb);

  const light = new THREE.PointLight(0xffc078, 9, 18, 2);
  light.position.y = 2.92;
  light.castShadow = castShadow;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.004;
  group.add(light);

  return {
    group,
    animated: {
      update(time) {
        // Barely perceptible; just enough that it is not a dead light source
        light.intensity = 8.7 + Math.sin(time * 1.4) * 0.2;
      },
    },
  };
}

/** Pendant hanging on a flex from a ceiling rose. */
export function buildPendant(ceilingY: number): THREE.Group {
  const group = new THREE.Group();

  const rose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 0.1, 18),
    matte(0xf2ece0, 0.85),
  );
  rose.position.y = ceilingY - 0.05;
  group.add(rose);

  const drop = 1.5;
  const flex = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, drop, 6),
    matte(0x2a2a2a, 0.6),
  );
  flex.position.y = ceilingY - drop / 2;
  group.add(flex);

  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.5, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xe8ddc4,
      emissive: 0xffcf90,
      emissiveIntensity: 0.7,
      roughness: 0.85,
      side: THREE.DoubleSide,
    }),
  );
  shade.position.y = ceilingY - drop - 0.1;
  group.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff2d8, emissive: 0xffd9a0, emissiveIntensity: 2.6 }),
  );
  bulb.position.y = ceilingY - drop - 0.24;
  group.add(bulb);

  const light = new THREE.PointLight(0xffcf9a, 7, 20, 2);
  light.position.y = ceilingY - drop - 0.3;
  group.add(light);

  return group;
}

/** Track of gallery spots aimed at a wall. */
export function buildSpotTrack(length: number, count: number): THREE.Group {
  const group = new THREE.Group();
  const black = matte(0x2a2a2e, 0.5);

  const track = solid(new THREE.Mesh(new THREE.BoxGeometry(length, 0.09, 0.09), black));
  group.add(track);

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = -length / 2 + t * length;

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 6), black);
    stalk.position.set(x, -0.14, 0);
    group.add(stalk);

    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.24, 12), black);
    can.position.set(x, -0.3, 0.06);
    can.rotation.x = 0.7;
    can.castShadow = true;
    group.add(can);

    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.085, 12),
      new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffe0a8, emissiveIntensity: 2.2 }),
    );
    lens.position.set(x, -0.38, 0.16);
    lens.rotation.x = -0.87;
    group.add(lens);
  }

  return group;
}

// -------------------------------------------------------------- the pyramid

/**
 * Tiny Clown's beer pyramid. `setCans` rebuilds it as the quest advances, so
 * it matches the 2D version's behaviour: three cans in the base, two on top,
 * and a gold star once the fifth is placed.
 */
export function buildBeerPyramid(): {
  group: THREE.Group;
  setCans(count: number): void;
  animated: Animated;
} {
  const group = new THREE.Group();

  const green = new THREE.MeshStandardMaterial({ color: 0x1f8b2f, roughness: 0.3, metalness: 0.62 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c541, roughness: 0.3, metalness: 0.5 });
  const aluminium = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.2, metalness: 0.9 });

  const canGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.66, 18);
  const bandGeometry = new THREE.CylinderGeometry(0.225, 0.225, 0.26, 18);
  const lidGeometry = new THREE.CylinderGeometry(0.2, 0.22, 0.05, 18);

  const makeCan = (x: number, y: number, z: number): THREE.Group => {
    const can = new THREE.Group();
    const body = new THREE.Mesh(canGeometry, green);
    body.castShadow = true;
    can.add(body);
    const band = new THREE.Mesh(bandGeometry, gold);
    band.position.y = 0.02;
    can.add(band);
    const lid = new THREE.Mesh(lidGeometry, aluminium);
    lid.position.y = 0.35;
    can.add(lid);
    can.position.set(x, y + 0.33, z);
    return can;
  };

  // Base row of three, then two resting in the gaps above
  const slots: [number, number, number][] = [
    [-0.5, 0, 0],
    [0, 0, 0],
    [0.5, 0, 0],
    [-0.25, 0.68, 0],
    [0.25, 0.68, 0],
  ];

  const cans = slots.map(([x, y, z]) => {
    const can = makeCan(x, y, z);
    can.visible = false;
    group.add(can);
    return can;
  });

  // The gold star that crowns a finished pyramid
  const star = new THREE.Group();
  const starMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffb020,
    emissiveIntensity: 1.4,
    roughness: 0.25,
    metalness: 0.7,
  });
  [0, Math.PI / 2].forEach((twist) => {
    const spike = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), starMaterial);
    spike.rotation.y = twist;
    spike.scale.set(1, 1.6, 0.35);
    star.add(spike);
  });
  star.position.set(0, 1.62, 0);
  star.visible = false;
  group.add(star);

  const sparkle = new THREE.PointLight(0xffc040, 0, 4, 2);
  sparkle.position.set(0, 1.62, 0);
  group.add(sparkle);

  let placed = -1;

  return {
    group,
    setCans(count: number) {
      const clamped = THREE.MathUtils.clamp(Math.floor(count), 0, 5);
      if (clamped === placed) return;
      placed = clamped;
      cans.forEach((can, i) => {
        can.visible = i < clamped;
      });
      star.visible = clamped >= 5;
      sparkle.intensity = clamped >= 5 ? 2.4 : 0;
    },
    animated: {
      update(time) {
        if (!star.visible) return;
        star.rotation.y = time * 1.1;
        star.position.y = 1.62 + Math.sin(time * 2) * 0.06;
        sparkle.intensity = 2.0 + Math.sin(time * 3.4) * 0.6;
      },
    },
  };
}

/** Drinks trolley, loaded, in the corner. */
export function buildDrinksTrolley(): THREE.Group {
  const group = new THREE.Group();
  const brass = metal(0xb08a4a, 0.32);
  const rand = seededRandom(2020);

  [0.35, 1.0].forEach((y) => {
    const shelf = solid(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.9), brass));
    shelf.position.y = y;
    group.add(shelf);
  });

  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const post = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 8), brass));
      post.position.set(sx * 0.7, 0.52, sz * 0.4);
      group.add(post);

      const wheel = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), matte(0x2a2a2a, 0.6)));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * 0.7, 0.12, sz * 0.4);
      group.add(wheel);
    }),
  );

  // Bottles of assorted questionable spirits
  const bottleColours = [0x3a5c2a, 0x8a5a20, 0x2a3f6b, 0xd8d0b8, 0x6b2a3a];
  for (let i = 0; i < 7; i++) {
    const h = 0.5 + rand() * 0.28;
    const bottle = solid(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.11, h, 12),
        matte(bottleColours[Math.floor(rand() * bottleColours.length)], 0.25),
      ),
    );
    bottle.position.set(-0.6 + i * 0.2, 1.03 + h / 2, (rand() - 0.5) * 0.5);
    group.add(bottle);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.05, 0.18, 8),
      bottle.material as THREE.Material,
    );
    neck.position.set(bottle.position.x, 1.03 + h + 0.09, bottle.position.z);
    group.add(neck);
  }

  // Glasses on the lower shelf
  for (let i = 0; i < 5; i++) {
    const glass = solid(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.07, 0.22, 12),
        new THREE.MeshPhysicalMaterial({
          color: 0xdfeaf0,
          roughness: 0.05,
          transmission: 0.85,
          transparent: true,
          opacity: 0.35,
        }),
      ),
    );
    glass.position.set(-0.55 + i * 0.28, 0.49, (rand() - 0.5) * 0.4);
    group.add(glass);
  }

  return group;
}

/** Record player on a stand, lid up, something mid-side. */
export function buildRecordPlayer(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const timber = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 2, 1),
    color: 0x8a6540,
    roughness: 0.6,
  });

  const stand = solid(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.0), timber));
  stand.position.y = 0.9;
  group.add(stand);

  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.9, 8), timber));
      leg.position.set(sx * 0.62, 0.45, sz * 0.38);
      leg.rotation.set(sz * 0.07, 0, -sx * 0.07);
      group.add(leg);
    }),
  );

  const deck = solid(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.85), matte(0x2a2420, 0.5)));
  deck.position.y = 1.02;
  group.add(deck);

  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.04, 24),
    metal(0x9a9a9a, 0.3),
  );
  platter.position.set(-0.15, 1.12, 0);
  group.add(platter);

  const record = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.012, 24),
    matte(0x16161a, 0.35),
  );
  record.position.set(-0.15, 1.15, 0);
  group.add(record);

  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.014, 16), matte(0xd84a2a, 0.7));
  label.position.set(-0.15, 1.157, 0);
  group.add(label);

  // Tonearm, resting in the groove
  const arm = new THREE.Group();
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), metal(0xb0b0b0, 0.3));
  arm.add(pivot);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 8), metal(0xc0c0c0, 0.25));
  tube.rotation.z = Math.PI / 2;
  tube.position.set(-0.31, 0.02, 0);
  arm.add(tube);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.05), matte(0x2a2a2a, 0.5));
  head.position.set(-0.6, 0, 0);
  arm.add(head);
  arm.position.set(0.34, 1.16, -0.2);
  arm.rotation.y = -0.5;
  group.add(arm);

  // Lid, propped open behind
  const lid = solid(
    new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.04, 0.85),
      new THREE.MeshPhysicalMaterial({
        color: 0xc8d0d4,
        roughness: 0.08,
        transmission: 0.7,
        transparent: true,
        opacity: 0.4,
      }),
    ),
  );
  lid.position.set(0, 1.45, -0.6);
  lid.rotation.x = -1.15;
  group.add(lid);

  // Records filed on the shelf below
  const sleeveColours = [0xd8452e, 0x2e7a8f, 0xe0b429, 0x5c2c6b, 0xf0ece0, 0x1f3a2e];
  const rand = seededRandom(3131);
  for (let i = 0; i < 14; i++) {
    const sleeve = solid(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.68, 0.02),
        matte(sleeveColours[Math.floor(rand() * sleeveColours.length)], 0.85),
      ),
    );
    sleeve.position.set(-0.35 + i * 0.03, 0.44, 0);
    sleeve.rotation.y = Math.PI / 2;
    sleeve.rotation.z = -0.08;
    group.add(sleeve);
  }

  return {
    group,
    animated: {
      update(time) {
        record.rotation.y = time * 3.5;
        label.rotation.y = time * 3.5;
      },
    },
  };
}
