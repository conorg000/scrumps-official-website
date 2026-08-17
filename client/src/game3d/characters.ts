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
