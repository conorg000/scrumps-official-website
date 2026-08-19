/**
 * Character models.
 *
 * These mirror the cast drawn by the 2D renderer so the story beats look the
 * same: Mr Tibbles is the first companion, the Bush Turkey shows up for the
 * final fight, and Mr Feng wanders in at the very end.
 */

import * as THREE from 'three';

export interface Character {
  group: THREE.Group;
  /** Called every frame. `playerPos` lets characters turn to face Scrump. */
  update(time: number, delta: number, playerPos: THREE.Vector3): void;
}

const FUR_WHITE = 0xf7f7f2;
const FUR_SHADOW = 0xd8d8d0;
const PINK = 0xffb6c1;

function eyeMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.15, metalness: 0.1 });
}

/** Adds a pair of eyes with catchlights to a head group. */
function addEyes(
  parent: THREE.Object3D,
  spacing: number,
  y: number,
  z: number,
  radius: number,
): void {
  [-spacing, spacing].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 12), eyeMaterial());
    eye.position.set(x, y, z);
    parent.add(eye);

    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.32, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    shine.position.set(x + radius * 0.3, y + radius * 0.35, z + radius * 0.7);
    parent.add(shine);
  });
}

/**
 * Mr Tibbles — a cute white fluffy cat.
 *
 * `scale` lets the same model serve as the world-standing cat you first meet
 * and the smaller companion that trails you afterwards.
 */
export function buildMrTibbles(scale = 1): Character {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const fur = new THREE.MeshStandardMaterial({ color: FUR_WHITE, roughness: 0.95, flatShading: false });
  const furShadow = new THREE.MeshStandardMaterial({ color: FUR_SHADOW, roughness: 0.95 });
  const pink = new THREE.MeshStandardMaterial({ color: PINK, roughness: 0.7 });

  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 18), fur);
  body.scale.set(1.0, 0.86, 1.25);
  body.position.y = 0.52;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // Fluffy chest ruff
  const ruff = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), furShadow);
  ruff.position.set(0, 0.5, 0.42);
  ruff.scale.set(1.1, 0.9, 0.8);
  ruff.castShadow = true;
  root.add(ruff);

  // Head assembly, animated separately so he can look at you
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0.42);
  root.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.36, 22, 18), fur);
  skull.scale.set(1.05, 0.95, 1.0);
  skull.castShadow = true;
  head.add(skull);

  // Cheek floof
  [-0.26, 0.26].forEach((x) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), fur);
    cheek.position.set(x, -0.06, 0.14);
    cheek.castShadow = true;
    head.add(cheek);
  });

  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), fur);
  muzzle.position.set(0, -0.1, 0.28);
  muzzle.scale.set(1.2, 0.8, 0.9);
  head.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), pink);
  nose.position.set(0, -0.04, 0.42);
  nose.scale.set(1.3, 0.9, 0.8);
  head.add(nose);

  addEyes(head, 0.145, 0.06, 0.31, 0.062);

  // Ears
  [-0.2, 0.2].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 10), fur);
    ear.position.set(x, 0.32, -0.02);
    ear.rotation.z = x > 0 ? -0.28 : 0.28;
    ear.castShadow = true;
    head.add(ear);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), pink);
    inner.position.set(x * 0.92, 0.3, 0.04);
    inner.rotation.z = x > 0 ? -0.28 : 0.28;
    head.add(inner);
  });

  // Whiskers
  const whiskerMaterial = new THREE.MeshBasicMaterial({ color: 0xe8e8e8 });
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 3; i++) {
      const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.42, 4), whiskerMaterial);
      whisker.position.set(side * 0.2, -0.06 + i * 0.05, 0.3);
      whisker.rotation.z = Math.PI / 2 + side * (0.15 - i * 0.12);
      whisker.rotation.y = side * 0.5;
      head.add(whisker);
    }
  });

  // Legs
  const legs: THREE.Mesh[] = [];
  const legPositions: [number, number][] = [
    [-0.24, 0.42],
    [0.24, 0.42],
    [-0.26, -0.36],
    [0.26, -0.36],
  ];
  legPositions.forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 6, 10), fur);
    leg.position.set(x, 0.22, z);
    leg.castShadow = true;
    legs.push(leg);
    root.add(leg);
  });

  // Tail: a chain of shrinking spheres so it can wave
  const tail = new THREE.Group();
  tail.position.set(0, 0.62, -0.6);
  root.add(tail);
  const tailSegments: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const segment = new THREE.Mesh(new THREE.SphereGeometry(0.13 - i * 0.008, 12, 10), fur);
    segment.castShadow = true;
    tailSegments.push(segment);
    tail.add(segment);
  }

  root.scale.setScalar(scale);

  const forward = new THREE.Vector3();
  const flat = new THREE.Vector3();

  return {
    group,
    update(time, _delta, playerPos) {
      // Breathing
      const breath = 1 + Math.sin(time * 2.1) * 0.025;
      body.scale.set(1.0 * breath, 0.86 * breath, 1.25);

      // Head tracks the player, but only within a believable arc
      flat.set(playerPos.x - group.position.x, 0, playerPos.z - group.position.z);
      if (flat.lengthSq() > 0.0001) {
        flat.normalize();
        forward.set(0, 0, 1).applyQuaternion(group.quaternion);
        const angle = Math.atan2(flat.x, flat.z) - Math.atan2(forward.x, forward.z);
        const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
        head.rotation.y = THREE.MathUtils.clamp(wrapped, -0.8, 0.8);
        head.rotation.x = Math.sin(time * 1.3) * 0.05;
      }

      // Ear twitch
      const twitch = Math.sin(time * 0.7) > 0.96 ? 0.25 : 0;
      head.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.ConeGeometry) {
          child.rotation.x = twitch;
        }
      });

      // Tail wave
      tailSegments.forEach((segment, i) => {
        const t = i / (tailSegments.length - 1);
        const phase = time * 2.6 - i * 0.5;
        segment.position.set(
          Math.sin(phase) * 0.22 * t,
          t * 0.42 + Math.sin(phase * 0.7) * 0.06,
          -t * 0.38,
        );
      });

      // Idle paw shuffle
      legs.forEach((leg, i) => {
        leg.position.y = 0.22 + Math.sin(time * 1.8 + i * 1.6) * 0.012;
      });
    },
  };
}

/** The Bush Turkey. Menacing, ridiculous, has eaten many of your friends. */
export function buildBushTurkey(): Character {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const feather = new THREE.MeshStandardMaterial({ color: 0x4a3226, roughness: 0.9 });
  const featherDark = new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.9 });
  const wattle = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
  const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xd8a52a, roughness: 0.45 });
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0xc99a20, roughness: 0.6 });

  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 22, 18), feather);
  body.scale.set(1.0, 0.95, 1.2);
  body.position.y = 1.15;
  body.castShadow = true;
  root.add(body);

  // Breast highlight
  const breast = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), new THREE.MeshStandardMaterial({ color: 0x63422f, roughness: 0.9 }));
  breast.position.set(0, 1.05, 0.5);
  breast.scale.set(0.9, 1.0, 0.7);
  root.add(breast);

  // Fanned tail
  const tail = new THREE.Group();
  tail.position.set(0, 1.35, -0.75);
  root.add(tail);
  for (let i = 0; i < 9; i++) {
    const t = i / 8 - 0.5;
    const plume = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.05), i % 2 ? feather : featherDark);
    plume.position.set(t * 0.9, 0.5, -0.25);
    plume.rotation.z = t * 0.85;
    plume.rotation.x = -0.5;
    plume.castShadow = true;
    tail.add(plume);
  }

  // Wings
  const wings: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), featherDark);
    wing.scale.set(0.32, 0.85, 1.15);
    wing.position.set(side * 0.68, 1.15, 0);
    wing.castShadow = true;
    wings.push(wing);
    root.add(wing);
  });

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.26, 0.75, 12), feather);
  neck.position.set(0, 1.9, 0.24);
  neck.rotation.x = -0.28;
  neck.castShadow = true;
  root.add(neck);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 2.3, 0.36);
  root.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 14), feather);
  skull.castShadow = true;
  head.add(skull);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 8), beakMaterial);
  beak.position.set(0, -0.02, 0.3);
  beak.rotation.x = Math.PI / 2;
  head.add(beak);

  // Angry yellow eyes
  [-0.13, 0.13].forEach((x) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xffd400, roughness: 0.2, emissive: 0x553300 }),
    );
    eye.position.set(x, 0.07, 0.19);
    head.add(eye);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    );
    pupil.position.set(x, 0.07, 0.24);
    head.add(pupil);

    // Brow, for maximum menace
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), featherDark);
    brow.position.set(x, 0.15, 0.2);
    brow.rotation.z = x > 0 ? 0.3 : -0.3;
    head.add(brow);
  });

  // Wattle
  const wattleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), wattle);
  wattleMesh.scale.set(0.8, 1.5, 0.7);
  wattleMesh.position.set(0, -0.22, 0.18);
  head.add(wattleMesh);

  const snood = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.2, 4, 8), wattle);
  snood.position.set(0, 1.72, 0.42);
  root.add(snood);

  // Legs
  const legs: THREE.Group[] = [];
  [-0.26, 0.26].forEach((x) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0, 0);

    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.75, 8), legMaterial);
    shank.position.y = 0.38;
    shank.castShadow = true;
    leg.add(shank);

    // Toes
    for (let i = -1; i <= 1; i++) {
      const toe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.3), legMaterial);
      toe.position.set(i * 0.11, 0.03, 0.14);
      toe.rotation.y = i * 0.35;
      leg.add(toe);
    }

    legs.push(leg);
    root.add(leg);
  });

  const flat = new THREE.Vector3();

  return {
    group,
    update(time, _delta, playerPos) {
      // Turn to face the player — it is, after all, here for you
      flat.set(playerPos.x - group.position.x, 0, playerPos.z - group.position.z);
      if (flat.lengthSq() > 0.0001) {
        const targetY = Math.atan2(flat.x, flat.z);
        root.rotation.y += THREE.MathUtils.clamp(
          Math.atan2(Math.sin(targetY - root.rotation.y), Math.cos(targetY - root.rotation.y)),
          -0.03,
          0.03,
        );
      }

      // Head bob and strut
      head.position.y = 2.3 + Math.sin(time * 2.4) * 0.07;
      head.position.z = 0.36 + Math.sin(time * 2.4 - 0.6) * 0.06;
      body.position.y = 1.15 + Math.sin(time * 2.4) * 0.03;

      // Wing ruffle
      wings.forEach((wing, i) => {
        wing.rotation.z = Math.sin(time * 1.3 + i * Math.PI) * 0.09;
      });

      // Tail fan flex
      tail.rotation.x = Math.sin(time * 0.9) * 0.06;

      legs.forEach((leg, i) => {
        leg.position.z = Math.sin(time * 2.4 + i * Math.PI) * 0.08;
      });
    },
  };
}

/** Mr Feng, the landlord. Sunglasses, polo, absolutely unbothered. */
export function buildMrFeng(): Character {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const polo = new THREE.MeshStandardMaterial({ color: 0x2e5984, roughness: 0.8 });
  const poloDark = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.8 });
  const jeans = new THREE.MeshStandardMaterial({ color: 0x3a5fbf, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf0c39a, roughness: 0.7 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.6 });
  const sneaker = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.7 });

  // Legs
  const legs: THREE.Mesh[] = [];
  [-0.22, 0.22].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.3, 6, 10), jeans);
    leg.position.set(x, 0.95, 0);
    leg.castShadow = true;
    legs.push(leg);
    root.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.6), sneaker);
    shoe.position.set(x, 0.12, 0.1);
    shoe.castShadow = true;
    root.add(shoe);
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.8, 8, 14), polo);
  torso.position.y = 2.1;
  torso.scale.set(1.0, 1.0, 0.78);
  torso.castShadow = true;
  root.add(torso);

  // Collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 8, 16), poloDark);
  collar.position.y = 2.62;
  collar.rotation.x = Math.PI / 2;
  root.add(collar);

  // Arms
  const arms: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.85, 6, 10), skin);
    arm.position.set(side * 0.52, 2.0, 0);
    arm.castShadow = true;
    arms.push(arm);
    root.add(arm);

    // Sleeve
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.35, 12), polo);
    sleeve.position.set(side * 0.52, 2.35, 0);
    root.add(sleeve);
  });

  // Head
  const head = new THREE.Group();
  head.position.y = 2.95;
  root.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), skin);
  skull.scale.set(0.92, 1.1, 0.95);
  skull.castShadow = true;
  head.add(skull);

  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.315, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairMesh.scale.set(0.95, 1.1, 1.0);
  hairMesh.position.y = 0.03;
  head.add(hairMesh);

  // Sunnies
  const lensMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.08,
    metalness: 0.6,
  });
  [-0.12, 0.12].forEach((x) => {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.04), lensMaterial);
    lens.position.set(x, 0.05, 0.29);
    head.add(lens);
  });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), lensMaterial);
  bridge.position.set(0, 0.06, 0.29);
  head.add(bridge);

  // Easy grin
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.018, 6, 14, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xa8624a, roughness: 0.7 }),
  );
  smile.position.set(0, -0.1, 0.27);
  smile.rotation.z = Math.PI;
  head.add(smile);

  const flat = new THREE.Vector3();

  return {
    group,
    update(time, _delta, playerPos) {
      flat.set(playerPos.x - group.position.x, 0, playerPos.z - group.position.z);
      if (flat.lengthSq() > 0.0001) {
        const targetY = Math.atan2(flat.x, flat.z);
        root.rotation.y += THREE.MathUtils.clamp(
          Math.atan2(Math.sin(targetY - root.rotation.y), Math.cos(targetY - root.rotation.y)),
          -0.04,
          0.04,
        );
      }

      // Relaxed idle: weight shift and a slow nod
      root.position.y = Math.sin(time * 1.4) * 0.03;
      torso.rotation.z = Math.sin(time * 0.9) * 0.02;
      head.rotation.x = Math.sin(time * 1.1) * 0.04;
      arms.forEach((arm, i) => {
        arm.rotation.x = Math.sin(time * 1.2 + i * Math.PI) * 0.08;
      });
      legs.forEach((leg, i) => {
        leg.position.y = 0.95 + Math.sin(time * 1.4 + i * 0.4) * 0.01;
      });
    },
  };
}

/**
 * Adele, the property manager. Navy suit, brown bob, clipboard, and an
 * expression that has already decided against you.
 *
 * She patrols every room downstairs and up, so both POV scenes can build her;
 * PovScene only does so the first time she is actually seen.
 */
export function buildAdele(): Character {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const suit = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.78 });
  const suitDark = new THREE.MeshStandardMaterial({ color: 0x0f0f1a, roughness: 0.8 });
  const blouse = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf5cba7, roughness: 0.72 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.85 });

  // Legs and sensible shoes
  const legs: THREE.Mesh[] = [];
  [-0.16, 0.16].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.62, 6, 10), suit);
    leg.position.set(x, 0.46, 0);
    leg.castShadow = true;
    root.add(leg);
    legs.push(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.34), suitDark);
    shoe.position.set(x, 0.06, 0.06);
    shoe.castShadow = true;
    root.add(shoe);
  });

  // Jacket, cut square at the shoulders
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.36), suit);
  torso.position.y = 1.2;
  torso.castShadow = true;
  root.add(torso);

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.16, 0.4), suit);
  shoulders.position.y = 1.55;
  shoulders.castShadow = true;
  root.add(shoulders);

  // White blouse showing through the lapels
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.06), blouse);
  collar.position.set(0, 1.34, 0.19);
  root.add(collar);

  [-0.16, 0.16].forEach((x) => {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.06), suitDark);
    lapel.position.set(x, 1.36, 0.19);
    lapel.rotation.z = x > 0 ? -0.16 : 0.16;
    root.add(lapel);
  });

  // Arms. The right one holds the clipboard out in front of her.
  const arms: THREE.Group[] = [];
  [-1, 1].forEach((side) => {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.56, 6, 10), suit);
    sleeve.position.y = -0.34;
    sleeve.castShadow = true;
    arm.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), skin);
    hand.position.y = -0.66;
    arm.add(hand);

    arm.position.set(side * 0.38, 1.5, 0);
    arm.rotation.x = side > 0 ? -0.85 : -0.1;
    root.add(arm);
    arms.push(arm);
  });

  const clipboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.54, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xc4a35a, roughness: 0.7 }),
  );
  clipboard.position.set(0.34, 1.02, 0.5);
  clipboard.rotation.set(-1.1, 0, 0.1);
  clipboard.castShadow = true;
  root.add(clipboard);

  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xfdfdf8, roughness: 0.9 }),
  );
  paper.position.z = 0.025;
  clipboard.add(paper);

  const clip = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.35, metalness: 0.8 }),
  );
  clip.position.set(0, 0.24, 0.04);
  clipboard.add(clip);

  // Head
  const head = new THREE.Group();
  head.position.y = 1.78;
  root.add(head);

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.4), skin);
  face.castShadow = true;
  head.add(face);

  // Brown business bob: a shell around the back and sides, fringe at the front
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 14), hair);
  bob.scale.set(1.05, 0.95, 1.05);
  bob.position.set(0, 0.07, -0.03);
  head.add(bob);

  [-1, 1].forEach((side) => {
    const side_ = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.36), hair);
    side_.position.set(side * 0.22, -0.05, -0.02);
    head.add(side_);
  });

  const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.1), hair);
  fringe.position.set(0, 0.19, 0.17);
  head.add(fringe);

  addEyes(head, 0.11, 0.03, 0.21, 0.045);

  // Narrowed eyes: a brow bar low over each one does the whole expression
  [-0.11, 0.11].forEach((x) => {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, 0.03), hair);
    brow.position.set(x, 0.12, 0.21);
    brow.rotation.z = x > 0 ? 0.32 : -0.32;
    head.add(brow);
  });

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.02, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x8a4a4a, roughness: 0.7 }),
  );
  mouth.position.set(0, -0.13, 0.21);
  head.add(mouth);

  const flat = new THREE.Vector3();
  let stride = 0;
  const lastPos = new THREE.Vector3();

  return {
    group,
    update(time, delta, playerPos) {
      // Face the player. She is always either walking toward you or judging you.
      flat.set(playerPos.x - group.position.x, 0, playerPos.z - group.position.z);
      if (flat.lengthSq() > 0.0001) {
        const targetY = Math.atan2(flat.x, flat.z);
        root.rotation.y += THREE.MathUtils.clamp(
          Math.atan2(Math.sin(targetY - root.rotation.y), Math.cos(targetY - root.rotation.y)),
          -0.09,
          0.09,
        );
      }

      // Stride only advances while she is actually covering ground, so she does
      // not moonwalk on the spot between patrol waypoints.
      const moved = lastPos.distanceTo(group.position);
      lastPos.copy(group.position);
      stride += Math.min(moved, 0.4) * 7;

      const swing = Math.sin(stride);
      legs[0].rotation.x = swing * 0.6;
      legs[1].rotation.x = -swing * 0.6;
      arms[1].rotation.x = -0.85 + Math.sin(time * 2.4) * 0.05;
      arms[0].rotation.x = -0.1 - swing * 0.35;
      root.position.y = Math.abs(Math.sin(stride)) * 0.03;
      head.rotation.z = Math.sin(time * 0.8) * 0.03;
    },
  };
}

/**
 * The possum living in the tent downstairs. A brushtail: grey, enormous ears,
 * black eyes, entirely unbothered.
 */
export function buildPossum(): Character {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const fur = new THREE.MeshStandardMaterial({ color: 0x8d8577, roughness: 0.95 });
  const furLight = new THREE.MeshStandardMaterial({ color: 0xc0b5a0, roughness: 0.95 });
  const earPink = new THREE.MeshStandardMaterial({ color: 0xe0a0a8, roughness: 0.8 });
  const nose = new THREE.MeshStandardMaterial({ color: 0xf1b7c4, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), fur);
  body.scale.set(1, 0.86, 1.25);
  body.position.set(0, 0.3, -0.14);
  body.castShadow = true;
  root.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), furLight);
  belly.scale.set(1, 0.8, 1.15);
  belly.position.set(0, 0.22, 0.02);
  root.add(belly);

  const head = new THREE.Group();
  head.position.set(0, 0.5, 0.2);
  root.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), fur);
  skull.scale.set(1, 0.95, 1.05);
  skull.castShadow = true;
  head.add(skull);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 12), furLight);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.04, 0.2);
  head.add(snout);

  const snoutTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), nose);
  snoutTip.position.set(0, -0.04, 0.31);
  head.add(snoutTip);

  // The ears are the whole character. Comically large, thin, pink inside.
  const ears: THREE.Group[] = [];
  [-1, 1].forEach((side) => {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), fur);
    outer.scale.set(0.45, 1.25, 1);
    ear.add(outer);

    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), earPink);
    inner.scale.set(0.3, 1.2, 0.95);
    inner.position.x = side * 0.03;
    ear.add(inner);

    ear.position.set(side * 0.17, 0.22, -0.02);
    ear.rotation.z = side * 0.3;
    head.add(ear);
    ears.push(ear);
  });

  addEyes(head, 0.1, 0.03, 0.17, 0.055);

  // Bushy tail, curled around
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.42, 6, 10), fur);
  tail.rotation.x = 0.9;
  tail.position.set(0.14, 0.24, -0.44);
  tail.castShadow = true;
  root.add(tail);

  // Front paws, folded over the lip of the tent
  [-0.16, 0.16].forEach((x) => {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), furLight);
    paw.position.set(x, 0.16, 0.28);
    root.add(paw);
  });

  const flat = new THREE.Vector3();

  return {
    group,
    update(time, _delta, playerPos) {
      flat.set(playerPos.x - group.position.x, 0, playerPos.z - group.position.z);
      if (flat.lengthSq() > 0.0001) {
        // Measured against whichever way the tent has been turned, so he tracks
        // the player rather than a direction in his own local space.
        const targetY = Math.atan2(flat.x, flat.z) - group.rotation.y;
        // Only swivels within a narrow arc — he is not leaving the tent for you
        const delta = Math.atan2(Math.sin(targetY), Math.cos(targetY));
        head.rotation.y = THREE.MathUtils.clamp(delta, -0.7, 0.7);
      }

      // Breathing, plus the odd ear twitch
      root.position.y = Math.sin(time * 1.8) * 0.014;
      const twitch = Math.sin(time * 0.7) > 0.97 ? Math.sin(time * 40) * 0.18 : 0;
      ears.forEach((ear, i) => {
        ear.rotation.x = twitch * (i === 0 ? 1 : -1);
      });
    },
  };
}

/**
 * Tiny Clown, who lives in the living room and is building a beer pyramid.
 *
 * Rainbow hair, red nose, purple cone hat, enormous shoes, and roughly knee
 * height on a creature that is itself a crisp. He is delighted to see you.
 */
export function buildTinyClown(): Character {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const suit = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.85 });
  const dots = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xffe4c4, roughness: 0.75 });
  const red = new THREE.MeshStandardMaterial({ color: 0xff2020, roughness: 0.5 });
  const purple = new THREE.MeshStandardMaterial({ color: 0x8a2be2, roughness: 0.7 });

  // Jumpsuit: a tapered barrel, wider at the shoulders
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.85, 14), suit);
  body.position.y = 0.62;
  body.castShadow = true;
  root.add(body);

  // Polka dots, scattered around the front
  const dotSpots: [number, number, number][] = [
    [-0.14, 0.78, 0.3],
    [0.16, 0.62, 0.32],
    [-0.05, 0.45, 0.36],
    [0.2, 0.88, 0.26],
  ];
  dotSpots.forEach(([x, y, z]) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), dots);
    dot.position.set(x, y, z);
    dot.scale.z = 0.4;
    root.add(dot);
  });

  // Ruff collar
  const ruff = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.09, 8, 18), dots);
  ruff.rotation.x = Math.PI / 2;
  ruff.position.y = 1.04;
  ruff.castShadow = true;
  root.add(ruff);

  // Arms, held out because he is mid-gesture at all times
  const arms: THREE.Group[] = [];
  [-1, 1].forEach((side) => {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 6, 10), suit);
    sleeve.position.y = -0.26;
    sleeve.castShadow = true;
    arm.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), skin);
    hand.position.y = -0.52;
    arm.add(hand);

    arm.position.set(side * 0.3, 0.95, 0);
    arm.rotation.z = side * 0.9;
    root.add(arm);
    arms.push(arm);
  });

  // The shoes. Comically long, as is the tradition.
  const shoes: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), red);
    shoe.scale.set(0.75, 0.5, 2.1);
    shoe.position.set(side * 0.15, 0.08, 0.16);
    shoe.castShadow = true;
    root.add(shoe);
    shoes.push(shoe);
  });

  // Head
  const head = new THREE.Group();
  head.position.y = 1.28;
  root.add(head);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), skin);
  face.castShadow = true;
  head.add(face);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), red);
  nose.position.set(0, -0.02, 0.26);
  head.add(nose);

  addEyes(head, 0.11, 0.07, 0.24, 0.045);

  // A painted smile, built from a torus arc
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.022, 6, 14, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xd02020, roughness: 0.5 }),
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.13, 0.23);
  head.add(smile);

  // Rainbow hair: tufts around the back and sides, bald on top. The arc starts
  // past the front so the tufts do not sit over his face.
  const hairColours = [0xff0000, 0xff7f00, 0xffff00, 0x00c000, 0x0060ff, 0x8a2be2];
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI * 0.68 + (i / 9) * Math.PI * 1.64;
    const tuft = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 8),
      new THREE.MeshStandardMaterial({ color: hairColours[i % hairColours.length], roughness: 0.9 }),
    );
    tuft.position.set(Math.cos(angle) * 0.27, 0.05, Math.sin(angle) * 0.27);
    tuft.castShadow = true;
    head.add(tuft);
  }

  // Cone hat with a pompom
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.44, 14), purple);
  hat.position.set(0.03, 0.42, -0.03);
  hat.rotation.z = -0.16;
  hat.castShadow = true;
  head.add(hat);

  const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), dots);
  pompom.position.set(0.09, 0.63, -0.03);
  head.add(pompom);

  const flat = new THREE.Vector3();

  return {
    group,
    update(time, _delta, playerPos) {
      flat.set(playerPos.x - group.position.x, 0, playerPos.z - group.position.z);
      if (flat.lengthSq() > 0.0001) {
        const targetY = Math.atan2(flat.x, flat.z);
        root.rotation.y += THREE.MathUtils.clamp(
          Math.atan2(Math.sin(targetY - root.rotation.y), Math.cos(targetY - root.rotation.y)),
          -0.08,
          0.08,
        );
      }

      // Permanently bouncing on the spot, arms going
      const bounce = Math.abs(Math.sin(time * 3.1));
      root.position.y = bounce * 0.09;
      root.rotation.z = Math.sin(time * 1.6) * 0.05;
      head.rotation.z = Math.sin(time * 2.2) * 0.09;
      arms.forEach((arm, i) => {
        arm.rotation.z = (i === 0 ? -1 : 1) * (0.9 + Math.sin(time * 4 + i * Math.PI) * 0.35);
      });
      shoes.forEach((shoe, i) => {
        shoe.position.y = 0.08 + Math.max(0, Math.sin(time * 3.1 + i * Math.PI)) * 0.05;
      });
    },
  };
}
