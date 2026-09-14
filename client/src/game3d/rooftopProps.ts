/**
 * Builders for the rooftop.
 *
 * The roof of the Queenslander, at night, with ten subletters on it who have
 * been hiding up here the whole game. Everything is corrugated iron, rust and
 * whatever got carried up the ladder.
 */

import * as THREE from 'three';
import { Animated } from './props';
import { Character } from './characters';
import { createCorrugatedIronTexture, createWoodTexture, tiled } from './textures';

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

function metal(color: number, roughness = 0.42): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.78 });
}

function solid(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Scaffold-pipe railing round the edge of the roof, welded up by somebody. */
export function buildRoofRailing(length: number): THREE.Group {
  const group = new THREE.Group();
  const pipe = metal(0x8d8579, 0.55);

  [0.55, 1.05].forEach((y) => {
    const rail = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, length, 8), pipe));
    rail.rotation.z = Math.PI / 2;
    rail.position.y = y;
    group.add(rail);
  });

  const posts = Math.max(2, Math.round(length / 2.6));
  for (let i = 0; i <= posts; i++) {
    const post = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.15, 8), pipe));
    post.position.set(-length / 2 + (i / posts) * length, 0.57, 0);
    group.add(post);

    // The welded foot plate bolted through the iron
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), pipe);
    plate.position.set(post.position.x, 0.02, 0);
    group.add(plate);
  }

  return group;
}

/** Brick chimney with a tin cowl, leaning very slightly. */
export function buildChimney(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const w = widthTiles * 2 - 1.2;
  const d = depthTiles * 2 - 1.2;
  const height = 3.4;

  const brick = matte(0x8a4a3a, 0.96);
  const stack = solid(new THREE.Mesh(new THREE.BoxGeometry(w, height, d), brick));
  stack.position.y = height / 2;
  group.add(stack);

  // Courses, as bands of slightly different brick
  for (let i = 0; i < 9; i++) {
    const course = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.03, 0.06, d + 0.03),
      matte(i % 2 === 0 ? 0x6e3a2e : 0x9c5a46, 0.96),
    );
    course.position.y = 0.25 + i * 0.36;
    group.add(course);
  }

  const cap = solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.18, d + 0.3), matte(0x6a6560, 0.9)));
  cap.position.y = height + 0.09;
  group.add(cap);

  // Spinning cowl, which has not spun in years and then suddenly does
  const cowl = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.4, 10), metal(0x9aa0a6, 0.6)));
  cowl.position.y = height + 0.38;
  group.add(cowl);

  const hat = solid(new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.26, 10), metal(0x9aa0a6, 0.6)));
  hat.position.y = height + 0.68;
  group.add(hat);

  group.rotation.z = 0.02;
  return group;
}

/** Air conditioner, rusted, with a fan that turns and a cage over it. */
export function buildAcUnit(
  widthTiles: number,
  depthTiles: number,
): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const w = widthTiles * 2 - 1.4;
  const d = depthTiles * 2 - 1.4;
  const h = 1.5;

  const shell = new THREE.MeshStandardMaterial({
    map: tiled(createCorrugatedIronTexture(), 2, 1),
    color: 0x9d9a90,
    roughness: 0.78,
    metalness: 0.3,
  });

  const body = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shell));
  body.position.y = h / 2 + 0.14;
  group.add(body);

  // Sits on rubber feet with a puddle of condensate under it
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), matte(0x2c2c2e, 0.8));
      foot.position.set((sx * (w - 0.4)) / 2, 0.07, (sz * (d - 0.4)) / 2);
      group.add(foot);
    }),
  );

  // Fan in the front face
  const fan = new THREE.Group();
  fan.position.set(0, h / 2 + 0.14, d / 2 + 0.03);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.03, 0.16),
      matte(0x3a3d42, 0.7),
    );
    blade.position.x = 0.24;
    blade.rotation.x = 0.4;
    const arm = new THREE.Group();
    arm.rotation.z = (i / 3) * Math.PI * 2;
    arm.add(blade);
    fan.add(arm);
  }
  group.add(fan);

  const cage = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 5, 20), metal(0x77736c, 0.6));
  cage.position.set(0, h / 2 + 0.14, d / 2 + 0.09);
  group.add(cage);
  for (let i = 0; i < 8; i++) {
    const wire = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.02, 0.02), metal(0x77736c, 0.6));
    wire.position.set(0, h / 2 + 0.14, d / 2 + 0.09);
    wire.rotation.z = (i / 8) * Math.PI;
    group.add(wire);
  }

  // Rust running down the side, and the conduit going back into the roof
  const streak = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.7, h * 0.8),
    new THREE.MeshStandardMaterial({
      color: 0x7a4320,
      roughness: 1,
      transparent: true,
      opacity: 0.35,
    }),
  );
  streak.position.set(0, h / 2, d / 2 + 0.02);
  group.add(streak);

  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 8), matte(0x50534f, 0.8));
  conduit.rotation.z = Math.PI / 2;
  conduit.position.set(-w / 2 - 0.6, 0.6, -d / 4);
  group.add(conduit);

  const animated: Animated = {
    update: (_time, delta) => {
      fan.rotation.z += delta * 5.5;
    },
  };

  return { group, animated };
}

/** Satellite dish, pointed at nothing in particular any more. */
export function buildSatelliteDish(widthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const radius = widthTiles * 0.5;

  const mast = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.5, 8), metal(0x7d7a74, 0.6)));
  mast.position.y = 0.75;
  group.add(mast);

  const base = solid(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), metal(0x6a6760, 0.7)));
  base.position.y = 0.05;
  group.add(base);

  const dishGroup = new THREE.Group();
  dishGroup.position.y = 1.7;
  // Aimed up and out at whatever satellite this house gave up on. The cap is
  // left the way it is built — flipping it turns the dish inside out and the
  // whole thing reads as an egg.
  dishGroup.rotation.x = -1.15;
  dishGroup.rotation.y = 0.4;

  const dish = solid(
    new THREE.Mesh(
      new THREE.SphereGeometry(radius, 20, 12, 0, Math.PI * 2, Math.PI * 0.64, Math.PI * 0.36),
      new THREE.MeshStandardMaterial({
        color: 0xd8d4c8,
        roughness: 0.6,
        metalness: 0.2,
        side: THREE.DoubleSide,
      }),
    ),
  );
  dish.position.y = radius * 0.78;
  dishGroup.add(dish);

  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, radius * 1.1, 6), metal(0x6a6760));
  arm.rotation.x = Math.PI / 2;
  arm.position.z = radius * 0.5;
  dishGroup.add(arm);

  const lnb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.24, 8), matte(0xe0ddd4, 0.6));
  lnb.rotation.x = Math.PI / 2;
  lnb.position.z = radius * 0.95;
  dishGroup.add(lnb);

  group.add(dishGroup);

  // A bird has been using it
  const nest = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), matte(0x6b5334, 0.98));
  nest.scale.y = 0.6;
  nest.position.set(radius * 0.4, 1.66, -0.1);
  group.add(nest);

  return group;
}

/** Esky, lid off, full of ice and cans. */
export function buildEsky(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const w = widthTiles * 2 - 0.8;
  const d = depthTiles * 2 - 0.5;
  const h = 0.78;

  const shell = matte(0xdcdcd4, 0.72);
  const body = solid(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shell));
  body.position.y = h / 2;
  group.add(body);

  const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.16, d + 0.03), matte(0x1d4fa0, 0.7));
  band.position.y = h * 0.78;
  group.add(band);

  // Ice, and the cans in it
  const ice = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.14, 0.12, d - 0.14),
    new THREE.MeshStandardMaterial({ color: 0xd4eaf4, roughness: 0.3, metalness: 0.1 }),
  );
  ice.position.y = h - 0.1;
  group.add(ice);

  const rand = seededRandom(515);
  for (let i = 0; i < 7; i++) {
    const can = solid(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.26, 10),
        matte(i % 2 === 0 ? 0x1f8b2f : 0xb5423a, 0.5),
      ),
    );
    can.position.set(
      (rand() - 0.5) * (w - 0.5),
      h - 0.02 + rand() * 0.06,
      (rand() - 0.5) * (d - 0.4),
    );
    can.rotation.z = (rand() - 0.5) * 0.5;
    group.add(can);
  }

  // Lid, off and dropped flat on the iron beside it
  const lid = solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.12, d + 0.06), shell));
  lid.position.set(w * 0.78, 0.06, 0.28);
  lid.rotation.y = 0.3;
  group.add(lid);

  return group;
}

/** Folding camp chair, the striped kind that lives in a boot. */
export function buildLawnChair(seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);
  const frame = metal(0xb9bcc2, 0.5);
  const stripes = [0x2f6ba8, 0xd8a12f, 0xb5423a, 0x3f8f6a];
  const fabric = matte(stripes[Math.floor(rand() * stripes.length)], 0.98);

  // Two crossed A-frames
  [-1, 1].forEach((side) => {
    [-1, 1].forEach((lean) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6), frame);
      leg.position.set(side * 0.34, 0.42, lean * 0.22);
      leg.rotation.x = lean * 0.42;
      group.add(leg);
    });
  });

  const seat = solid(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.07, 0.62), fabric));
  seat.position.y = 0.52;
  group.add(seat);

  const back = solid(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.72, 0.07), fabric));
  back.position.set(0, 0.88, -0.28);
  back.rotation.x = -0.3;
  group.add(back);

  // Webbing stripes across the seat
  for (let i = 0; i < 4; i++) {
    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.02, 0.07),
      matte(0xe8e4d8, 0.95),
    );
    strap.position.set(0, 0.56, -0.24 + i * 0.16);
    group.add(strap);
  }

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), frame);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(side * 0.38, 0.76, 0);
    group.add(arm);
  });

  group.rotation.y = rand() * Math.PI * 2;
  return group;
}

/** The head of the ladder, poking over the edge where you climbed up. */
export function buildLadderHead(): THREE.Group {
  const group = new THREE.Group();
  const rail = new THREE.MeshStandardMaterial({
    map: tiled(createWoodTexture(), 1, 3),
    color: 0xb08a58,
    roughness: 0.8,
  });

  [-0.3, 0.3].forEach((x) => {
    const stile = solid(new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.08), rail));
    stile.position.set(x, 0.6, 0);
    stile.rotation.x = 0.22;
    group.add(stile);
  });

  for (let i = 0; i < 4; i++) {
    const rung = solid(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), rail));
    rung.position.set(0, -0.5 + i * 0.5, (0.5 - i * 0.5) * 0.22);
    group.add(rung);
  }

  return group;
}

/**
 * One of the ten subletters.
 *
 * They share a body — head, torso, two arms, two legs at crisp-world scale —
 * and are told apart by palette and by the one prop each of them is defined by.
 * They are not doing anything except being extremely pleased you turned up.
 */
export function buildSubletter(variant: string, seed: number): Character {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);
  const rand = seededRandom(seed);

  const skins = [0xf0c8a0, 0xd9a173, 0xa8724a, 0x7a4f30, 0xf6d8b8];
  const skin = matte(skins[Math.floor(rand() * skins.length)], 0.8);
  const clothes = matte(
    [0x3f6f9c, 0x8c4a44, 0x5f6b45, 0x6d4b7a, 0xc8a24a, 0x2f7f6a][Math.floor(rand() * 6)],
    0.95,
  );
  const pants = matte([0x2c3442, 0x4a3b2c, 0x3a3a42][Math.floor(rand() * 3)], 0.95);

  const seated = variant === 'subletter_meditating';
  const lying = variant === 'subletter_sleeping';

  const torso = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 4, 10), clothes));
  torso.position.y = seated ? 0.52 : 0.92;
  root.add(torso);

  const head = new THREE.Group();
  head.position.y = seated ? 0.92 : 1.34;
  root.add(head);

  const skull = solid(new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), skin));
  skull.scale.set(1, 1.05, 0.98);
  head.add(skull);

  const hair = solid(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      matte([0x2a1d14, 0x5a3a20, 0xc8a04a, 0x8a2f2f, 0x1a1a1a][Math.floor(rand() * 5)], 0.95),
    ),
  );
  hair.position.y = 0.03;
  head.add(hair);

  [-0.075, 0.075].forEach((x) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.2 }),
    );
    eye.position.set(x, 0.02, 0.18);
    head.add(eye);
  });

  const arms: THREE.Group[] = [];
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.26, seated ? 0.68 : 1.1, 0);
    const arm = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.38, 4, 8), skin));
    arm.position.y = -0.24;
    shoulder.add(arm);
    root.add(shoulder);
    arms.push(shoulder);
  });

  const legs: THREE.Group[] = [];
  if (seated) {
    // Crossed, which at this size is two capsules laid across each other
    [-1, 1].forEach((side) => {
      const leg = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.44, 4, 8), pants));
      leg.rotation.z = Math.PI / 2;
      leg.rotation.y = side * 0.5;
      leg.position.set(side * 0.06, 0.12, 0.14);
      root.add(leg);
    });
  } else {
    [-1, 1].forEach((side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.13, 0.66, 0);
      const leg = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.46, 4, 8), pants));
      leg.position.y = -0.3;
      hip.add(leg);
      const shoe = solid(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.26), matte(0x22242a, 0.7)));
      shoe.position.set(0, -0.6, 0.05);
      hip.add(shoe);
      root.add(hip);
      legs.push(hip);
    });
  }

  // The one thing each of them is
  switch (variant) {
    case 'subletter_bathrobe': {
      const robe = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 10), matte(0xf0ece0, 0.98)));
      robe.position.y = 0.88;
      root.add(robe);
      const towel = solid(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), matte(0xe8e2d0, 0.98)));
      towel.scale.set(1, 1.3, 1);
      towel.position.y = 0.2;
      head.add(towel);
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 10), matte(0xd8d2c0, 0.85));
      mug.position.set(0, -0.48, 0.12);
      arms[1].add(mug);
      break;
    }
    case 'subletter_tattoo': {
      // Singlet, and ink from shoulder to wrist on both arms
      const singlet = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.36, 4, 10), matte(0x22242a, 0.95)));
      singlet.position.y = 0.94;
      root.add(singlet);
      arms.forEach((shoulder) => {
        for (let i = 0; i < 3; i++) {
          const ink = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.012, 4, 10), matte(0x2b3b58, 0.9));
          ink.rotation.x = Math.PI / 2;
          ink.position.y = -0.12 - i * 0.13;
          shoulder.add(ink);
        }
      });
      const beanie = solid(new THREE.Mesh(new THREE.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), matte(0x8c4a44, 0.98)));
      beanie.position.y = 0.05;
      head.add(beanie);
      break;
    }
    case 'subletter_guitar': {
      const body = solid(new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), matte(0xc08a44, 0.7)));
      body.scale.set(1, 1.25, 0.32);
      body.position.set(0.1, 0.86, 0.26);
      body.rotation.z = -0.35;
      root.add(body);
      const neck = solid(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.8, 0.05), matte(0x5a3a20, 0.75)));
      neck.position.set(0.42, 1.24, 0.26);
      neck.rotation.z = -0.35;
      root.add(neck);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), matte(0x1a1208, 0.9));
      hole.position.set(0.14, 0.9, 0.35);
      root.add(hole);
      break;
    }
    case 'subletter_headphones': {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 5, 14, Math.PI), matte(0x22242a, 0.6));
      band.position.y = 0.04;
      head.add(band);
      [-1, 1].forEach((side) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 12), matte(0x2f3238, 0.6));
        cup.rotation.z = Math.PI / 2;
        cup.position.set(side * 0.2, 0, 0);
        head.add(cup);
      });
      break;
    }
    case 'subletter_cereal': {
      const bowl = solid(
        new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), matte(0xe8e2d0, 0.8)),
      );
      bowl.rotation.x = Math.PI;
      bowl.position.set(0, -0.44, 0.16);
      arms[0].add(bowl);
      const milk = new THREE.Mesh(new THREE.CircleGeometry(0.13, 12), matte(0xf4f0e4, 0.5));
      milk.rotation.x = -Math.PI / 2;
      milk.position.set(0, -0.45, 0.16);
      arms[0].add(milk);
      const spoon = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), metal(0xc8ccd2, 0.4));
      spoon.position.set(0, -0.4, 0.12);
      spoon.rotation.z = 0.4;
      arms[1].add(spoon);
      break;
    }
    case 'subletter_mascot': {
      // A full costume: an enormous head over the real one, and mitts
      const costume = solid(new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 12), matte(0xd8a12f, 0.96)));
      costume.position.y = 0.16;
      head.add(costume);
      [-1, 1].forEach((side) => {
        const ear = solid(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), matte(0xd8a12f, 0.96)));
        ear.scale.set(0.5, 1, 0.9);
        ear.position.set(side * 0.38, 0.52, 0);
        head.add(ear);
      });
      const snout = solid(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), matte(0xf0e2c0, 0.96)));
      snout.position.set(0, 0.06, 0.38);
      head.add(snout);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), matte(0x2a2a2a, 0.6));
      nose.position.set(0, 0.1, 0.52);
      head.add(nose);
      [-1, 1].forEach((side) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), matte(0xffffff, 0.5));
        eye.position.set(side * 0.16, 0.24, 0.38);
        head.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), matte(0x141419, 0.3));
        pupil.position.set(side * 0.16, 0.24, 0.45);
        head.add(pupil);
      });
      arms.forEach((shoulder) => {
        const mitt = solid(new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), matte(0xd8a12f, 0.96)));
        mitt.position.y = -0.48;
        shoulder.add(mitt);
      });
      break;
    }
    case 'subletter_skater': {
      const deck = solid(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 1.0), matte(0x3a2f4a, 0.8)));
      deck.position.set(0.18, 0.1, 0.16);
      deck.rotation.y = 0.3;
      root.add(deck);
      [-0.32, 0.32].forEach((z) => {
        [-1, 1].forEach((sx) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 10), matte(0xe0dcd0, 0.6));
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(0.18 + sx * 0.11, 0.055, 0.16 + z);
          root.add(wheel);
        });
      });
      const cap = solid(
        new THREE.Mesh(new THREE.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), matte(0x2f6ba8, 0.95)),
      );
      cap.position.y = 0.05;
      head.add(cap);
      const peak = solid(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.18), matte(0x2f6ba8, 0.95)));
      peak.position.set(0, 0.05, -0.2);
      head.add(peak);
      break;
    }
    case 'subletter_meditating': {
      arms.forEach((shoulder, i) => {
        shoulder.rotation.z = (i === 0 ? 1 : -1) * 1.1;
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), skin);
        hand.position.y = -0.46;
        shoulder.add(hand);
      });
      const aura = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.012, 5, 22),
        new THREE.MeshStandardMaterial({
          color: 0x2a2a1a,
          emissive: 0xc8e070,
          emissiveIntensity: 2,
        }),
      );
      aura.rotation.x = Math.PI / 2;
      aura.position.y = 0.34;
      head.add(aura);
      break;
    }
    case 'subletter_phone': {
      const phoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x14161c,
        emissive: 0x8fb4ff,
        emissiveIntensity: 2.2,
        roughness: 0.3,
      });
      const phone = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.02), phoneMaterial);
      phone.position.set(0, -0.44, 0.16);
      phone.rotation.x = -0.6;
      arms[1].add(phone);
      arms[1].rotation.x = -0.7;
      head.rotation.x = 0.35;
      const glow = new THREE.PointLight(0x8fb4ff, 1.4, 2.4, 2);
      glow.position.set(0, -0.4, 0.22);
      arms[1].add(glow);
      break;
    }
    case 'subletter_sleeping': {
      // Flat out on the iron, with a jumper for a pillow
      root.rotation.x = -Math.PI / 2;
      root.position.set(0, 0.26, 0);
      const pillow = solid(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.3), matte(0x6d4b3a, 0.98)));
      pillow.position.set(0, 1.44, -0.16);
      root.add(pillow);
      break;
    }
    default:
      break;
  }

  const flat = new THREE.Vector3();
  const idle = rand() * 6.3;

  return {
    group,
    update(time, _delta, playerPos) {
      if (!lying) {
        flat.set(playerPos.x - group.position.x, 0, playerPos.z - group.position.z);
        if (flat.lengthSq() > 0.0001) {
          const targetY = Math.atan2(flat.x, flat.z) - group.rotation.y;
          const delta = Math.atan2(Math.sin(targetY), Math.cos(targetY));
          head.rotation.y = THREE.MathUtils.clamp(delta, -0.9, 0.9);
        }
      }

      // Breathing, and whatever each of them is doing with it
      root.position.y = (lying ? 0.26 : 0) + Math.sin(time * 1.7 + idle) * 0.016;

      if (variant === 'subletter_headphones') {
        head.rotation.z = Math.sin(time * 3.4 + idle) * 0.12;
        legs.forEach((leg) => {
          leg.rotation.x = Math.sin(time * 3.4 + idle) * 0.1;
        });
      } else if (variant === 'subletter_guitar') {
        arms[1].rotation.x = Math.sin(time * 4.2 + idle) * 0.3 - 0.5;
      } else if (variant === 'subletter_meditating') {
        root.rotation.y = Math.sin(time * 0.4 + idle) * 0.04;
      } else if (variant === 'subletter_cereal') {
        arms[1].rotation.x = Math.sin(time * 1.6 + idle) * 0.45 - 0.5;
      } else if (variant === 'subletter_sleeping') {
        // The snore, as a slightly bigger breath every few seconds
        root.position.y = 0.26 + Math.sin(time * 0.9) * 0.03;
      } else if (!lying) {
        arms.forEach((shoulder, i) => {
          shoulder.rotation.x = Math.sin(time * 1.3 + idle + i) * 0.08;
        });
      }
    },
  };
}
