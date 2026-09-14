/**
 * Builders for the bedroom.
 *
 * Somebody's room in a sharehouse, at night: a bed that has not been made
 * since autopilot took over, a desk with a monitor left on, clothes measured in
 * layers rather than items, and a ceiling fan that ticks. Everything here is
 * built to be lit by three small warm sources and one cold one, so the forms
 * are chunky and the materials are dull — nothing here has a specular kick
 * except the glass and the chrome.
 */

import * as THREE from 'three';
import { Animated } from './props';
import {
  createBookSpineTexture,
  createDoonaTexture,
  createPosterTexture,
  createWoodTexture,
  createXrayTexture,
  tiled,
} from './textures';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function matte(color: number, roughness = 0.92): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function metal(color: number, roughness = 0.34): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.85 });
}

function timber(color: number, repeat = 2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), repeat, 1),
    color,
    roughness: 0.72,
    metalness: 0,
  });
}

function solid(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * A soft lump: a box pushed around by a couple of sine waves so it reads as
 * fabric rather than furniture. Used for the doona, the pillows and the piles.
 */
function rumpled(
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  amount: number,
  seed: number,
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(w, h, d, 8, 3, 8);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const rand = seededRandom(seed);
  const phaseX = rand() * 6.3;
  const phaseZ = rand() * 6.3;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    // Only the upper surface creases; the underside stays flat on the mattress
    const top = vertex.y > 0 ? 1 : 0.25;
    const wave =
      Math.sin(vertex.x * 2.6 + phaseX) * Math.cos(vertex.z * 2.1 + phaseZ) +
      Math.sin(vertex.z * 4.3 + phaseZ) * 0.4;
    // Edges drape down over the sides
    const edge = 1 - 0.28 * (Math.abs(vertex.x / (w / 2)) + Math.abs(vertex.z / (d / 2))) * 0.5;
    position.setXYZ(
      i,
      vertex.x * edge,
      vertex.y + wave * amount * top,
      vertex.z * edge,
    );
  }
  geometry.computeVertexNormals();
  return solid(new THREE.Mesh(geometry, material));
}

// ---------------------------------------------------------------------- bed

/** An unmade double: frame, mattress, a doona half off it, two flat pillows. */
export function buildBed(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const w = widthTiles * 2 - 0.5;
  const d = depthTiles * 2 - 0.4;

  const frameMaterial = timber(0x5b3f28, 3);

  // Base rails and four stubby legs
  const base = solid(new THREE.Mesh(new THREE.BoxGeometry(w, 0.34, d), frameMaterial));
  base.position.y = 0.36;
  group.add(base);

  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.18), frameMaterial));
      leg.position.set((sx * (w - 0.3)) / 2, 0.1, (sz * (d - 0.3)) / 2);
      group.add(leg);
    }),
  );

  // Headboard at the north end
  const headboard = solid(
    new THREE.Mesh(new THREE.BoxGeometry(w, 1.35, 0.16), frameMaterial),
  );
  headboard.position.set(0, 1.0, -d / 2 + 0.06);
  group.add(headboard);

  // Mattress
  const mattress = solid(
    new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, 0.4, d - 0.18), matte(0xd8d2c4, 0.98)),
  );
  mattress.position.y = 0.73;
  group.add(mattress);

  // Doona, thrown back so two thirds of the bed is covered and the rest isn't
  const doona = rumpled(
    new THREE.MeshStandardMaterial({
      map: tiled(createDoonaTexture(), 1.4, 1.4),
      roughness: 0.96,
      metalness: 0,
    }),
    w - 0.05,
    0.3,
    d * 0.62,
    0.1,
    91,
  );
  doona.position.set(0.12, 1.02, d * 0.16);
  doona.rotation.y = 0.06;
  group.add(doona);

  // The bit hanging off the side onto the floor
  const overhang = rumpled(
    new THREE.MeshStandardMaterial({
      map: tiled(createDoonaTexture(), 0.7, 0.7),
      roughness: 0.96,
    }),
    0.7,
    0.9,
    d * 0.4,
    0.12,
    17,
  );
  overhang.position.set(w / 2 - 0.05, 0.5, d * 0.2);
  overhang.rotation.z = 0.2;
  group.add(overhang);

  // Two pillows, neither of them square to anything
  [-0.5, 0.5].forEach((side, i) => {
    const pillow = rumpled(matte(0xefe9dc, 0.98), 1.25, 0.28, 0.75, 0.07, 400 + i * 31);
    pillow.position.set(side * (w / 4), 1.02, -d / 2 + 0.62);
    pillow.rotation.y = side * 0.22 + 0.08;
    group.add(pillow);
  });

  // A phone left face-down on the doona, still faintly lit
  const phone = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.03, 0.15),
    matte(0x14161c, 0.4),
  );
  phone.position.set(-w / 4, 1.2, d * 0.08);
  phone.rotation.y = 0.7;
  group.add(phone);

  return group;
}

// ------------------------------------------------------------------ storage

/** Chest of drawers with a swing mirror on top. */
export function buildDresser(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const w = widthTiles * 2 - 0.6;
  const d = depthTiles * 2 - 1.2;
  const h = 1.0;

  const carcass = timber(0x8a6d4c, 2);
  const body = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), carcass));
  body.position.y = h / 2 + 0.1;
  group.add(body);

  const top = solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.12), timber(0x9c7d59, 2)));
  top.position.y = h + 0.14;
  group.add(top);

  // Three drawers, the middle one not quite shut
  for (let i = 0; i < 3; i++) {
    const out = i === 1 ? 0.16 : 0;
    const front = solid(
      new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, h / 3 - 0.08, 0.06), matte(0x7a5c3e, 0.8)),
    );
    front.position.set(0, 0.28 + i * (h / 3), d / 2 + 0.02 + out);
    group.add(front);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, w * 0.42, 6),
      metal(0xb9bcc2, 0.4),
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.28 + i * (h / 3), d / 2 + 0.1 + out);
    group.add(handle);
  }

  // Mirror in a frame, tilted back the way a swing mirror always is
  const mirrorGroup = new THREE.Group();
  const frame = solid(new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 1.3, 0.07), carcass));
  mirrorGroup.add(frame);

  // Nothing in these scenes has an environment map, so a full-metal mirror
  // renders as a black hole. A dark, very smooth dielectric still catches the
  // lamp and the window and reads as glass.
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.62, 1.16),
    new THREE.MeshStandardMaterial({
      color: 0x60708c,
      roughness: 0.1,
      metalness: 0.35,
    }),
  );
  glass.position.z = 0.04;
  mirrorGroup.add(glass);

  mirrorGroup.position.set(0, h + 0.85, -d / 2 + 0.1);
  mirrorGroup.rotation.x = 0.13;
  group.add(mirrorGroup);

  // Uprights holding it
  [-1, 1].forEach((side) => {
    const post = solid(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.95, 0.07), carcass));
    post.position.set((side * w * 0.72) / 2 + side * 0.05, h + 0.6, -d / 2 + 0.14);
    group.add(post);
  });

  return group;
}

/** Freestanding wardrobe. One door has never closed properly. */
export function buildWardrobe(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const w = depthTiles * 2 - 0.5;
  const d = widthTiles * 2 - 1.4;
  const h = 2.6;

  const carcass = timber(0x6d4a28, 2);

  // Five slabs with the front left open, so the door that hangs ajar actually
  // reveals something. A solid box with doors stuck on the outside just reads
  // as a brown wall.
  const panel = (px: number, py: number, pz: number, pw: number, ph: number, pd: number): void => {
    const slab = solid(new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), carcass));
    slab.position.set(px, py, pz);
    group.add(slab);
  };
  panel(0, h / 2 + 0.08, -d / 2 + 0.04, w, h, 0.08); // back
  panel(-w / 2 + 0.04, h / 2 + 0.08, 0, 0.08, h, d); // sides
  panel(w / 2 - 0.04, h / 2 + 0.08, 0, 0.08, h, d);
  panel(0, h + 0.04, 0, w, 0.08, d); // top
  panel(0, 0.12, 0, w, 0.08, d); // bottom

  // Cornice and plinth
  const cornice = solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.14, d + 0.16), carcass));
  cornice.position.y = h + 0.12;
  group.add(cornice);

  const plinth = solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.1, d + 0.1), matte(0x3d2817)));
  plinth.position.y = 0.05;
  group.add(plinth);

  // Two doors on the front face, the left one hanging open
  const doorW = w / 2 - 0.06;
  [-1, 1].forEach((side) => {
    const hinge = new THREE.Group();
    const door = solid(new THREE.Mesh(new THREE.BoxGeometry(doorW, h - 0.3, 0.06), matte(0x7b5630, 0.78)));
    door.position.x = (side * doorW) / 2;
    hinge.add(door);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), metal(0xc9a227, 0.3));
    knob.position.set(side * doorW * 0.86, 0, 0.06);
    hinge.add(knob);

    hinge.position.set((-side * w) / 2, h / 2 + 0.08, d / 2 + 0.04);
    // Only the left one swings open
    if (side > 0) hinge.rotation.y = 0.55;
    group.add(hinge);
  });

  // A rail of clothes hanging in the half the open door reveals
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, w - 0.2, 8),
    metal(0xa8acb2, 0.4),
  );
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, h - 0.3, 0);
  group.add(rail);

  const rand = seededRandom(66);
  const shirts = [0x8c3f3f, 0x2f4d6d, 0x6a6a3c, 0x54345c, 0xa89464];
  for (let i = 0; i < 8; i++) {
    const shirt = solid(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.95 + rand() * 0.35, d - 0.34),
        matte(shirts[i % shirts.length], 0.98),
      ),
    );
    // Bunched into the open half, which is why that door will not shut
    shirt.position.set(-w / 2 + 0.28 + i * 0.15, h - 0.86 - rand() * 0.18, (rand() - 0.5) * 0.1);
    shirt.rotation.z = (rand() - 0.5) * 0.1;
    group.add(shirt);

    const hanger = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.008, 4, 10, Math.PI),
      metal(0xb8bcc2, 0.5),
    );
    hanger.position.set(shirt.position.x, h - 0.28, 0);
    group.add(hanger);
  }

  return group;
}

/** Two shelves of books and whatever else ended up on them. */
export function buildSmallBookshelf(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const w = widthTiles * 2 - 0.5;
  const d = depthTiles * 2 - 2.2;
  const h = 1.5;

  const carcass = timber(0x5b4026, 2);

  [-1, 1].forEach((side) => {
    const panel = solid(new THREE.Mesh(new THREE.BoxGeometry(0.07, h, d), carcass));
    panel.position.set((side * w) / 2, h / 2, 0);
    group.add(panel);
  });

  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), matte(0x3a2817)));
  back.position.set(0, h / 2, -d / 2);
  group.add(back);

  const spineMaterial = new THREE.MeshStandardMaterial({
    map: tiled(createBookSpineTexture(), 1, 1),
    roughness: 0.92,
  });
  const rand = seededRandom(313);

  [0.06, h / 2, h - 0.06].forEach((y, shelfIndex) => {
    const shelf = solid(new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), carcass));
    shelf.position.set(0, y, 0);
    group.add(shelf);

    if (shelfIndex === 2) return;

    // Books, leaning where the row has run out of support
    let x = -w / 2 + 0.12;
    while (x < w / 2 - 0.3) {
      const bw = 0.08 + rand() * 0.1;
      const bh = 0.4 + rand() * 0.22;
      const lean = rand() > 0.78 ? (rand() - 0.5) * 0.5 : 0;
      const book = solid(new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d * 0.7), spineMaterial));
      book.position.set(x + bw / 2, y + 0.03 + bh / 2, 0);
      book.rotation.z = lean;
      group.add(book);
      x += bw + 0.015 + Math.abs(lean) * 0.3;
    }
  });

  return group;
}

// ------------------------------------------------------------------- desk

/**
 * Desk with the computer left on. The screen is the room's only cold light, so
 * it gets a real emissive plane and the scene hangs a point light off it.
 */
export function buildDesk(
  widthTiles: number,
  depthTiles: number,
): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const w = widthTiles * 2 - 0.5;
  const d = depthTiles * 2 - 1.4;
  const h = 0.78;

  const top = solid(new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), timber(0x9a7b57, 2)));
  top.position.y = h;
  group.add(top);

  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = solid(new THREE.Mesh(new THREE.BoxGeometry(0.07, h, 0.07), metal(0x3a3d44, 0.6)));
      leg.position.set((sx * (w - 0.24)) / 2, h / 2, (sz * (d - 0.24)) / 2);
      group.add(leg);
    }),
  );

  // Monitor, back to the window, facing whoever is sitting at it
  const stand = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.04, 12), metal(0x26282e)));
  stand.position.set(0, h + 0.05, -d / 4);
  group.add(stand);

  const neck = solid(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), metal(0x26282e)));
  neck.position.set(0, h + 0.2, -d / 4);
  group.add(neck);

  const bezel = solid(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.92, 0.07), matte(0x1a1c21, 0.6)));
  bezel.position.set(0, h + 0.78, -d / 4);
  group.add(bezel);

  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1430,
    emissive: 0x4d7bd8,
    emissiveIntensity: 1.5,
    roughness: 0.28,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.82), screenMaterial);
  screen.position.set(0, h + 0.78, -d / 4 + 0.04);
  group.add(screen);

  // Keyboard, mouse, and a mug that has been there long enough to grow a skin
  const keyboard = solid(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.34), matte(0x23252b, 0.7)));
  keyboard.position.set(-0.05, h + 0.06, d / 6);
  keyboard.rotation.y = 0.06;
  group.add(keyboard);

  const mouse = solid(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), matte(0x23252b, 0.6)));
  mouse.scale.set(1, 0.55, 1.5);
  mouse.position.set(0.7, h + 0.08, d / 6);
  group.add(mouse);

  const mug = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.22, 12), matte(0xd8d2c0, 0.85)));
  mug.position.set(-w / 2 + 0.35, h + 0.14, d / 5);
  group.add(mug);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 12), matte(0xd8d2c0, 0.85));
  handle.position.set(-w / 2 + 0.24, h + 0.14, d / 5);
  handle.rotation.y = Math.PI / 2;
  group.add(handle);

  // A chair, pushed back and turned away
  const chair = buildDeskChair();
  chair.position.set(0.25, 0, d / 2 + 0.55);
  chair.rotation.y = 0.5;
  group.add(chair);

  // Screens never hold still: a slow brightness drift, plus the odd flicker
  const animated: Animated = {
    update: (time) => {
      const drift = 1.35 + Math.sin(time * 0.7) * 0.18;
      const flicker = Math.sin(time * 37) > 0.985 ? 0.5 : 1;
      screenMaterial.emissiveIntensity = drift * flicker;
    },
  };

  return { group, animated };
}

/** Office chair on a five-star base. */
export function buildDeskChair(): THREE.Group {
  const group = new THREE.Group();
  const fabric = matte(0x2c2f36, 0.96);

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const arm = solid(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.34), metal(0x33363c, 0.55)));
    arm.position.set(Math.sin(angle) * 0.17, 0.08, Math.cos(angle) * 0.17);
    arm.rotation.y = angle;
    group.add(arm);

    const castor = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), matte(0x16181c, 0.5));
    castor.position.set(Math.sin(angle) * 0.33, 0.05, Math.cos(angle) * 0.33);
    group.add(castor);
  }

  const column = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.38, 10), metal(0x4a4e55)));
  column.position.y = 0.29;
  group.add(column);

  const seat = solid(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.11, 0.52), fabric));
  seat.position.y = 0.53;
  group.add(seat);

  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.09), fabric));
  back.position.set(0, 0.86, -0.24);
  back.rotation.x = -0.12;
  group.add(back);

  // A jumper over the back of it, as is traditional
  const jumper = rumpled(matte(0x6d4b3a, 0.98), 0.5, 0.22, 0.4, 0.05, 808);
  jumper.position.set(0.04, 1.14, -0.22);
  jumper.rotation.x = 0.3;
  group.add(jumper);

  return group;
}

/** Bedside table, lamp, alarm clock. The lamp is the room's warm anchor. */
export function buildNightstand(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const carcass = timber(0x7d6142, 2);

  const body = solid(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.62), carcass));
  body.position.y = 0.36;
  group.add(body);

  const top = solid(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.72), timber(0x8d6f4d, 2)));
  top.position.y = 0.68;
  group.add(top);

  const drawer = solid(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.05), matte(0x6a5138, 0.8)));
  drawer.position.set(0, 0.5, 0.33);
  group.add(drawer);

  [-1, 1].forEach((side) => {
    const leg = solid(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.06), carcass));
    leg.position.set(side * 0.3, 0.05, 0.26);
    group.add(leg);
  });

  // Lamp: brass stem, fabric shade lit from the inside
  const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 14), metal(0xb08b3e, 0.4)));
  base.position.y = 0.73;
  group.add(base);

  const stem = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34, 8), metal(0xb08b3e, 0.4)));
  stem.position.y = 0.92;
  group.add(stem);

  const shadeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0d9a8,
    emissive: 0xffb257,
    emissiveIntensity: 1.5,
    roughness: 0.92,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.26, 16, 1, true), shadeMaterial);
  shade.position.y = 1.18;
  group.add(shade);

  // Alarm clock, red seven-segment glow, permanently unset
  const clock = solid(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.12), matte(0x1d1f24, 0.6)));
  clock.position.set(0.26, 0.77, 0.12);
  clock.rotation.y = -0.3;
  group.add(clock);

  const clockFaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a0000,
    emissive: 0xff2b16,
    emissiveIntensity: 2.2,
    roughness: 0.4,
  });
  const clockFace = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), clockFaceMaterial);
  clockFace.position.set(0.28, 0.77, 0.18);
  clockFace.rotation.y = -0.3;
  group.add(clockFace);

  // Old incandescent lamps breathe; the clock blinks its colon once a second
  const animated: Animated = {
    update: (time) => {
      shadeMaterial.emissiveIntensity = 1.42 + Math.sin(time * 1.9) * 0.08;
      clockFaceMaterial.emissiveIntensity = time % 1 < 0.5 ? 2.2 : 1.4;
    },
  };

  return { group, animated };
}

// ------------------------------------------------------------------- clutter

/**
 * A heap of clothes that has developed structure. Squashed spheres rather than
 * boxes — flat-shaded boxes at this size read as packing cartons, not fabric.
 */
export function buildClothesPile(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);
  const colours = [0xb5514c, 0x3f8f8a, 0x3b6ea8, 0x6f8f5c, 0xc8a24a, 0x504a63];

  const count = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < count; i++) {
    const r = 0.16 + rand() * 0.14;
    const geometry = new THREE.SphereGeometry(r, 10, 7);
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    const wobble = rand() * 6.3;
    for (let v = 0; v < position.count; v++) {
      vertex.fromBufferAttribute(position, v);
      // Squash flat, then dent the surface so it creases like cloth
      const dent = 1 + Math.sin(vertex.x * 14 + wobble) * 0.11 + Math.cos(vertex.z * 11) * 0.09;
      position.setXYZ(v, vertex.x * 1.5 * dent, vertex.y * 0.42 * dent, vertex.z * 1.25 * dent);
    }
    geometry.computeVertexNormals();

    const lump = solid(
      new THREE.Mesh(geometry, matte(colours[Math.floor(rand() * colours.length)], 0.98)),
    );
    lump.position.set((rand() - 0.5) * 0.85, r * 0.42 + rand() * 0.07, (rand() - 0.5) * 0.85);
    lump.rotation.y = rand() * Math.PI;
    lump.rotation.z = (rand() - 0.5) * 0.25;
    group.add(lump);
  }

  // A sock, because there is always one on its own
  const sock = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.18, 3, 6), matte(0xe0dccd, 0.98)));
  sock.position.set(0.55, 0.05, -0.45);
  sock.rotation.set(Math.PI / 2, 0, rand() * Math.PI);
  group.add(sock);

  return group;
}

/**
 * Floor cushions round a low crate table — where anyone who visits this room
 * actually sits, since the bed is not an option and there is one chair.
 */
export function buildFloorCushions(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);
  const colours = [0x8a4a56, 0x46604f, 0x6a5a34];

  colours.forEach((colour, i) => {
    const angle = (i / colours.length) * Math.PI * 2 + rand();
    const cushion = rumpled(matte(colour, 0.98), 0.78, 0.2, 0.78, 0.045, seed + i * 41);
    cushion.position.set(Math.sin(angle) * 0.95, 0.11, Math.cos(angle) * 0.95);
    cushion.rotation.y = angle;
    group.add(cushion);
  });

  // An upturned crate doing duty as a table, with an ashtray and a candle
  const table = solid(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.62), timber(0x7a5c3c, 1)));
  table.position.y = 0.21;
  table.rotation.y = 0.3;
  group.add(table);

  const ashtray = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.04, 12), matte(0x5a5f66, 0.5)));
  ashtray.position.set(0.12, 0.44, 0.08);
  group.add(ashtray);

  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.16, 10),
    new THREE.MeshStandardMaterial({
      color: 0xe8ddc4,
      emissive: 0xffa040,
      emissiveIntensity: 0.6,
      roughness: 0.9,
    }),
  );
  candle.position.set(-0.14, 0.5, -0.1);
  group.add(candle);

  return group;
}

/** Cane laundry basket, well past capacity. */
export function buildLaundryBasket(): THREE.Group {
  const group = new THREE.Group();
  const cane = matte(0xb07a3f, 0.95);

  const body = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.68, 14, 1, true), cane),
  );
  body.position.y = 0.34;
  group.add(body);

  // Weave, as rings up the outside
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36 + i * 0.016, 0.02, 5, 16), matte(0x8e5f2d, 0.95));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08 + i * 0.14;
    group.add(ring);
  }

  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.34, 14), matte(0x6d4823));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  group.add(floor);

  // Overflow
  const rand = seededRandom(1212);
  [0xb5514c, 0xe0dccd, 0x3b6ea8].forEach((colour, i) => {
    const lump = rumpled(matte(colour, 0.98), 0.5, 0.2, 0.45, 0.06, 90 + i * 7);
    lump.position.set((rand() - 0.5) * 0.28, 0.68 + i * 0.12, (rand() - 0.5) * 0.28);
    lump.rotation.y = rand() * Math.PI;
    group.add(lump);
  });

  return group;
}

/** Beanbag. Half-empty, so it slumps. */
export function buildBeanbag(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  const geometry = new THREE.SphereGeometry(0.62, 16, 12);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    // Squash vertically, spread at the base, and dent the seat. The lumps are
    // what stop it reading as a flying saucer — a bean bag holding its shape
    // perfectly is a bean bag nobody has sat in.
    const squash = vertex.y > 0 ? 0.62 : 0.4;
    const spread = vertex.y < 0 ? 1.22 : 0.98;
    const dent = vertex.y > 0.25 ? 0.68 : 1;
    const lump = 1 + Math.sin(vertex.x * 5.4) * 0.09 + Math.cos(vertex.z * 4.1 + 1.2) * 0.08;
    position.setXYZ(
      i,
      vertex.x * spread * lump,
      vertex.y * squash * dent + 0.31,
      vertex.z * spread * lump,
    );
  }
  geometry.computeVertexNormals();

  const bag = solid(
    new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x6d3f52, roughness: 0.6, metalness: 0.08 }),
    ),
  );
  group.add(bag);

  // Seams
  for (let i = 0; i < 4; i++) {
    const seam = new THREE.Mesh(
      new THREE.TorusGeometry(0.63, 0.012, 4, 20, Math.PI),
      matte(0x4c2b39, 0.8),
    );
    seam.rotation.y = (i / 4) * Math.PI;
    seam.rotation.x = Math.PI / 2;
    seam.scale.set(1.2, 1.2, 0.55);
    seam.position.y = 0.31;
    group.add(seam);
  }

  group.rotation.y = rand() * Math.PI;
  return group;
}

// --------------------------------------------------------------------- fans

/**
 * Ceiling fan, three blades, running on the low speed that moves no air. The
 * wobble is the point — a Queenslander fan that runs true has been replaced.
 */
export function buildCeilingFan(ceilingY: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const rod = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), metal(0x6e7076)));
  rod.position.y = ceilingY - 0.25;
  group.add(rod);

  const canopy = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.1, 12), metal(0x6e7076)));
  canopy.position.y = ceilingY - 0.05;
  group.add(canopy);

  const spinner = new THREE.Group();
  spinner.position.y = ceilingY - 0.52;

  const motor = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 14), metal(0x8a8d94)));
  spinner.add(motor);

  const bladeMaterial = timber(0x7a5c3c, 3);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const arm = new THREE.Group();
    const blade = solid(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.3), bladeMaterial));
    blade.position.x = 0.9;
    blade.rotation.z = 0.14; // pitch
    arm.add(blade);
    arm.rotation.y = angle;
    spinner.add(arm);
  }

  // The pull chain, which does nothing
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.55, 4), metal(0xb0b4bb, 0.5));
  chain.position.set(0.1, -0.35, 0);
  spinner.add(chain);

  group.add(spinner);

  const animated: Animated = {
    update: (time, delta) => {
      spinner.rotation.y += delta * 2.6;
      // A slow figure-of-eight wobble from the bent downrod
      spinner.rotation.x = Math.sin(time * 2.6) * 0.012;
      spinner.rotation.z = Math.cos(time * 2.6) * 0.012;
    },
  };

  return { group, animated };
}

/** Pedestal fan, oscillating, pointed at the bed. */
export function buildPedestalFan(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const plastic = matte(0xd8d4c6, 0.72);

  const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.07, 16), plastic));
  base.position.y = 0.035;
  group.add(base);

  const column = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.05, 10), plastic));
  column.position.y = 0.57;
  group.add(column);

  // Everything above the column swings
  const head = new THREE.Group();
  head.position.y = 1.12;

  const housing = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.24, 12), plastic));
  housing.rotation.x = Math.PI / 2;
  head.add(housing);

  const spinner = new THREE.Group();
  spinner.position.z = 0.16;
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 10, 0, Math.PI / 2.6),
      new THREE.MeshStandardMaterial({
        color: 0xe6e2d4,
        roughness: 0.5,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    );
    blade.rotation.z = (i / 4) * Math.PI * 2;
    spinner.add(blade);
  }
  head.add(spinner);

  // Cage: two rings and a set of radial wires
  [0.1, 0.26].forEach((z, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.34 - i * 0.02, 0.01, 5, 24),
      metal(0xbfc3c8, 0.45),
    );
    ring.position.z = z;
    head.add(ring);
  });
  for (let i = 0; i < 12; i++) {
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.66, 4), metal(0xbfc3c8, 0.45));
    wire.rotation.x = Math.PI / 2;
    wire.rotation.z = (i / 12) * Math.PI * 2;
    wire.position.set(Math.sin((i / 12) * Math.PI * 2) * 0.17, Math.cos((i / 12) * Math.PI * 2) * 0.17, 0.18);
    head.add(wire);
  }

  group.add(head);

  const animated: Animated = {
    update: (time, delta) => {
      spinner.rotation.z += delta * 26;
      head.rotation.y = Math.sin(time * 0.42) * 0.7;
    },
  };

  return { group, animated };
}

// ------------------------------------------------------------------ the x-ray

/**
 * The x-ray, on a lightbox propped against the wall. It is a foot. Nobody in
 * the house has explained whose, or why it is the thing that matters.
 */
export function buildXrayViewer(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const w = 1.3;
  const h = 1.65;

  // A dark surround: a white one at this size reads as a blank sheet of paper
  // and swallows the film entirely.
  const shell = solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.14), matte(0x33363d, 0.6)));
  shell.position.y = h / 2;
  group.add(shell);

  const filmMaterial = new THREE.MeshStandardMaterial({
    map: createXrayTexture(),
    emissiveMap: createXrayTexture(),
    emissive: 0xffffff,
    emissiveIntensity: 1.6,
    roughness: 0.32,
  });
  const film = new THREE.Mesh(new THREE.PlaneGeometry(w, h), filmMaterial);
  film.position.set(0, h / 2, 0.085);
  group.add(film);

  // Clips along the top
  [-0.4, 0.4].forEach((x) => {
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.05), metal(0xa8acb2, 0.4));
    clip.position.set(x, h - 0.02, 0.09);
    group.add(clip);
  });

  // A folding leg, so it leans back like a photo frame
  const leg = solid(new THREE.Mesh(new THREE.BoxGeometry(0.08, h * 0.7, 0.05), matte(0x4a4d54, 0.75)));
  leg.position.set(0, h * 0.34, -0.34);
  leg.rotation.x = -0.36;
  group.add(leg);

  group.rotation.x = 0.16;

  // The lightbox's tube is dying, so it pulses and occasionally stutters
  const animated: Animated = {
    update: (time) => {
      const pulse = 1.45 + Math.sin(time * 1.4) * 0.22;
      const stutter = Math.sin(time * 53) > 0.97 ? 0.35 : 1;
      filmMaterial.emissiveIntensity = pulse * stutter;
    },
  };

  return { group, animated };
}

// -------------------------------------------------------------------- walls

/** A poster, blu-tacked flat and curling off the wall at one corner. */
export function buildRoomPoster(index: number, width: number, height: number): THREE.Group {
  const group = new THREE.Group();

  const geometry = new THREE.PlaneGeometry(width, height, 6, 6);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    // Bottom-left corner peels forward; the rest bows very slightly
    const u = (vertex.x / width + 0.5);
    const v = (vertex.y / height + 0.5);
    const peel = Math.max(0, 0.35 - u) * Math.max(0, 0.3 - v) * 3.4;
    const bow = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.012;
    position.setZ(i, peel + bow);
  }
  geometry.computeVertexNormals();

  const poster = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: createPosterTexture(index),
      roughness: 0.94,
      side: THREE.DoubleSide,
    }),
  );
  group.add(poster);

  // Blu-tack, at three of the four corners
  const tack = matte(0x8fa4c6, 0.98);
  ([[-1, 1], [1, 1], [1, -1]] as [number, number][]).forEach(([sx, sy]) => {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), tack);
    blob.scale.set(1, 1, 0.5);
    blob.position.set((sx * width) / 2 - sx * 0.08, (sy * height) / 2 - sy * 0.08, -0.01);
    group.add(blob);
  });

  return group;
}

/** Sash window, as a frame with two panes and a pull-down blind left half up. */
export function buildSashWindow(width: number, height: number): THREE.Group {
  const group = new THREE.Group();
  const frame = matte(0xe6e2d2, 0.8);

  // Surround
  const bars: [number, number, number, number][] = [
    [0, height / 2, width + 0.2, 0.12],
    [0, -height / 2, width + 0.2, 0.12],
    [-width / 2, 0, 0.12, height],
    [width / 2, 0, 0.12, height],
    [0, 0, width, 0.08], // the meeting rail between the two sashes
  ];
  bars.forEach(([x, y, w, h]) => {
    const bar = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), frame));
    bar.position.set(x, y, 0);
    group.add(bar);
  });

  // Glazing bars down each sash
  [-1, 1].forEach((half) => {
    const mullion = solid(new THREE.Mesh(new THREE.BoxGeometry(0.06, height / 2 - 0.1, 0.1), frame));
    mullion.position.set(0, (half * height) / 4, 0);
    group.add(mullion);
  });

  // Glass: barely there, just enough to catch a highlight
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshPhysicalMaterial({
      color: 0x9ab4d8,
      transparent: true,
      opacity: 0.12,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.85,
      side: THREE.DoubleSide,
    }),
  );
  group.add(glass);

  // Holland blind, pulled down a third of the way and crooked
  const blind = solid(
    new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, height * 0.34, 0.03), matte(0xd9cbae, 0.95)),
  );
  blind.position.set(0, height / 2 - height * 0.17, 0.09);
  blind.rotation.z = 0.02;
  group.add(blind);

  const roller = solid(
    new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, width - 0.06, 8), matte(0xcfc2a6, 0.9)),
  );
  roller.rotation.z = Math.PI / 2;
  roller.position.set(0, height / 2 - 0.06, 0.1);
  group.add(roller);

  return group;
}

/** Milk crates stacked into a bedside table, holding a book and a glass. */
export function buildCrateStack(): THREE.Group {
  const group = new THREE.Group();

  [0, 1].forEach((i) => {
    const crate = new THREE.Group();
    const colour = i === 0 ? 0x2f6ba8 : 0xb5423a;
    const shell = matte(colour, 0.75);

    // Four walls of a crate, lattice implied by the gaps between slats
    ([[0, -0.19], [0, 0.19], [-0.19, 0], [0.19, 0]] as [number, number][]).forEach(([x, z]) => {
      for (let s = 0; s < 3; s++) {
        const slat = solid(
          new THREE.Mesh(
            new THREE.BoxGeometry(x === 0 ? 0.4 : 0.03, 0.07, x === 0 ? 0.03 : 0.4),
            shell,
          ),
        );
        slat.position.set(x, 0.05 + s * 0.11, z);
        crate.add(slat);
      }
      const post = solid(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.04), shell));
      post.position.set(x === 0 ? 0.19 : x, 0.17, z === 0 ? 0.19 : z);
      crate.add(post);
    });

    const base = solid(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.4), shell));
    base.position.y = 0.015;
    crate.add(base);

    crate.position.y = i * 0.36;
    crate.rotation.y = i * 0.22;
    group.add(crate);
  });

  // A paperback and a glass of water on top
  const book = solid(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.32), matte(0x9a4b3c, 0.9)));
  book.position.set(-0.05, 0.75, 0.02);
  book.rotation.y = 0.4;
  group.add(book);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.05, 0.16, 12),
    new THREE.MeshPhysicalMaterial({
      color: 0xbcd6e6,
      transparent: true,
      opacity: 0.4,
      roughness: 0.04,
      transmission: 0.9,
    }),
  );
  glass.position.set(0.12, 0.8, -0.06);
  group.add(glass);

  return group;
}

/**
 * Mosquito coil on a saucer, lit. The smoke is a handful of sprites drifting
 * up and fading, which at this scale is all it needs to be.
 */
export function buildMosquitoCoil(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const saucer = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 14), matte(0xcfc9b8, 0.8)));
  group.add(saucer);

  const coil = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.012, 5, 24),
    matte(0x4e6b3a, 0.95),
  );
  coil.rotation.x = Math.PI / 2;
  coil.position.y = 0.025;
  group.add(coil);

  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 5, 20), matte(0x4e6b3a, 0.95));
  inner.rotation.x = Math.PI / 2;
  inner.position.y = 0.025;
  group.add(inner);

  // The lit tip
  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0x3a2010, emissive: 0xff5a1e, emissiveIntensity: 3 }),
  );
  ember.position.set(0.075, 0.03, 0);
  group.add(ember);

  // Smoke
  const puffMaterial = new THREE.MeshBasicMaterial({
    color: 0xcfd6dd,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), puffMaterial.clone());
    puff.position.set(0.075, 0.04, 0);
    group.add(puff);
    puffs.push(puff);
  }

  const animated: Animated = {
    update: (time) => {
      puffs.forEach((puff, i) => {
        // Each puff runs the same 4-second rise, offset along the cycle
        const life = ((time * 0.25 + i / puffs.length) % 1);
        const rise = life * 1.4;
        puff.position.set(
          0.075 + Math.sin(rise * 3.1 + i) * 0.09 * life,
          0.04 + rise,
          Math.cos(rise * 2.4 + i) * 0.09 * life,
        );
        puff.scale.setScalar(1 + life * 5);
        (puff.material as THREE.MeshBasicMaterial).opacity = 0.12 * (1 - life) * (1 - life);
      });
    },
  };

  return { group, animated };
}

/** Clothes airer, permanently up, permanently half-loaded. */
export function buildClothesAirer(): THREE.Group {
  const group = new THREE.Group();
  const frame = metal(0xd2d5d8, 0.45);
  const w = 1.5;
  const h = 1.25;

  // Two A-frame halves leaning on each other
  [-1, 1].forEach((side) => {
    const half = new THREE.Group();

    [-1, 1].forEach((sx) => {
      const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, h, 6), frame);
      upright.position.set((sx * w) / 2, h / 2, 0);
      half.add(upright);
    });

    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, w, 5), frame);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 0.3 + i * 0.22;
      half.add(bar);
    }

    half.rotation.x = side * 0.22;
    half.position.z = side * 0.18;
    group.add(half);
  });

  // Washing, hung over the bars at the angles washing hangs at
  const rand = seededRandom(551);
  const colours = [0xe4e0d4, 0x3f6f9c, 0x8c4a44, 0x5f6b45];
  for (let i = 0; i < 6; i++) {
    const item = rumpled(
      matte(colours[i % colours.length], 0.98),
      0.34 + rand() * 0.2,
      0.5 + rand() * 0.3,
      0.05,
      0.04,
      700 + i * 9,
    );
    item.position.set(-w / 2 + 0.2 + rand() * (w - 0.4), 0.6 + Math.floor(rand() * 3) * 0.22, (rand() - 0.5) * 0.4);
    item.rotation.z = (rand() - 0.5) * 0.2;
    group.add(item);
  }

  return group;
}

/** Storage that was meant to be temporary: boxes, a suitcase, a crate of junk. */
export function buildStorageStack(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  let y = 0;
  for (let i = 0; i < 3; i++) {
    const w = 0.9 - i * 0.12;
    const d = 0.7 - i * 0.08;
    const h = 0.34 + rand() * 0.16;
    const box = solid(
      new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matte(i === 1 ? 0x8f7248 : 0xa58a5c, 0.96)),
    );
    box.position.set((rand() - 0.5) * 0.14, y + h / 2, (rand() - 0.5) * 0.12);
    box.rotation.y = (rand() - 0.5) * 0.3;
    group.add(box);

    // Packing tape down the seam
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.1, h + 0.01, d + 0.01), matte(0xcfc4a8, 0.5));
    tape.position.copy(box.position);
    tape.rotation.y = box.rotation.y;
    group.add(tape);

    y += h;
  }

  // A hard-shell suitcase leaning against the stack
  const suitcase = solid(
    new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.22), matte(0x2f4257, 0.6)),
  );
  suitcase.position.set(0.7, 0.46, 0.1);
  suitcase.rotation.z = -0.13;
  group.add(suitcase);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 5, 12, Math.PI), metal(0x9a9da2, 0.5));
  handle.position.set(0.72, 0.92, 0.1);
  group.add(handle);

  return group;
}

/** Full-length mirror, leaning on the wall, reflecting almost nothing. */
export function buildLeaningMirror(): THREE.Group {
  const group = new THREE.Group();
  const w = 0.7;
  const h = 1.8;

  const frame = solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.08), timber(0x6b4a2c, 1)));
  frame.position.y = h / 2;
  group.add(frame);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      color: 0x64758f,
      roughness: 0.09,
      metalness: 0.35,
    }),
  );
  glass.position.set(0, h / 2, 0.045);
  group.add(glass);

  // Stickers, because it lived in a share house before this one
  [
    [0xffd23f, -0.2, 1.4],
    [0xff5a2d, 0.22, 0.5],
  ].forEach(([colour, x, y]) => {
    const sticker = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 12),
      new THREE.MeshStandardMaterial({ color: colour as number, roughness: 0.6 }),
    );
    sticker.position.set(x as number, y as number, 0.047);
    group.add(sticker);
  });

  group.rotation.x = -0.1;
  return group;
}
