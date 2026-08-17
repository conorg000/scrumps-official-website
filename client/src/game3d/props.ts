/**
 * Builders for every object in the backyard.
 *
 * Each builder returns a Group whose origin sits on the ground at the centre of
 * the footprint it occupies, so BackyardScene can place them straight from the
 * grid coordinates already stored on Room.furniture.
 */

import * as THREE from 'three';
import { PALETTE, TILE } from './constants';
import {
  createCDArtTexture,
  createPoolTexture,
  createPuffTexture,
  createRingMatTexture,
  createWoodTexture,
} from './textures';

/** Anything that needs a per-frame tick registers itself here. */
export interface Animated {
  update(time: number, delta: number): void;
}

let woodTexture: THREE.Texture | null = null;
function getWoodTexture(): THREE.Texture {
  if (!woodTexture) woodTexture = createWoodTexture();
  return woodTexture;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * An icosphere pushed around by cheap value noise, flat shaded. Used for tree
 * canopies, bushes and anything else that should read as organic rather than
 * geometric.
 */
function noisyBlob(radius: number, detail: number, amount: number, seed: number): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const rand = seededRandom(seed);

  // Pre-roll a small table of offsets and index it by rounded direction so
  // shared vertices move together and the surface stays watertight.
  const offsets: number[] = [];
  for (let i = 0; i < 512; i++) offsets.push((rand() - 0.5) * 2);

  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const key =
      (Math.round(vertex.x * 7) * 73856093) ^
      (Math.round(vertex.y * 7) * 19349663) ^
      (Math.round(vertex.z * 7) * 83492791);
    const offset = offsets[Math.abs(key) % offsets.length];
    vertex.multiplyScalar(1 + offset * amount);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Position and orient a y-axis mesh (cylinder, or a box built tall) so it spans
 * exactly from `from` to `to`. Much easier to reason about than hand-derived
 * Euler angles, and it cannot pick the mirrored solution by accident.
 */
export function spanBetween(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3): void {
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    to.clone().sub(from).normalize(),
  );
}

function foliageMaterial(color: number, seed: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
  });
}

/**
 * The big tree in the back-left corner. Occupies 2x2 tiles but the canopy
 * spreads well past that, which is the point — it should loom.
 */
export function buildTree(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const bark = new THREE.MeshStandardMaterial({
    color: PALETTE.bark,
    roughness: 0.95,
    metalness: 0,
    map: getWoodTexture(),
  });

  // Trunk, tapering as it rises
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.0, 7.5, 12, 3), bark);
  trunk.position.y = 3.75;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Root flare
  const roots = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.9, 0.9, 12, 1), bark);
  roots.position.y = 0.45;
  roots.castShadow = true;
  roots.receiveShadow = true;
  group.add(roots);

  // Branches reaching into the canopy
  const branchSpecs = [
    { angle: 0.4, tilt: 0.9, length: 3.4, y: 6.2 },
    { angle: 2.5, tilt: 1.05, length: 3.0, y: 6.8 },
    { angle: 4.3, tilt: 0.85, length: 3.6, y: 5.9 },
  ];
  branchSpecs.forEach((spec) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, spec.length, 7), bark);
    branch.position.set(
      Math.cos(spec.angle) * spec.length * 0.35,
      spec.y + spec.length * 0.28,
      Math.sin(spec.angle) * spec.length * 0.35,
    );
    branch.rotation.z = Math.cos(spec.angle) * spec.tilt;
    branch.rotation.x = -Math.sin(spec.angle) * spec.tilt;
    branch.castShadow = true;
    group.add(branch);
  });

  // Canopy: overlapping noisy blobs in three greens
  const canopy = new THREE.Group();
  canopy.position.y = 9.6;
  const clusters = [
    { pos: [0, 0.4, 0], r: 3.5, color: PALETTE.leaf, seed: 11 },
    { pos: [-2.7, -0.7, 1.1], r: 2.6, color: PALETTE.leafDark, seed: 23 },
    { pos: [2.6, -0.4, -1.3], r: 2.8, color: PALETTE.leaf, seed: 37 },
    { pos: [0.9, 1.9, 2.2], r: 2.3, color: PALETTE.leafLight, seed: 51 },
    { pos: [-1.4, 1.6, -2.3], r: 2.2, color: PALETTE.leafLight, seed: 67 },
    { pos: [1.8, -1.6, 2.0], r: 2.0, color: PALETTE.leafDark, seed: 83 },
    { pos: [-2.4, 0.9, -0.6], r: 2.1, color: PALETTE.leaf, seed: 97 },
  ];
  clusters.forEach((cluster) => {
    const mesh = new THREE.Mesh(
      noisyBlob(cluster.r, 2, 0.18, cluster.seed),
      foliageMaterial(cluster.color, cluster.seed),
    );
    mesh.position.set(cluster.pos[0], cluster.pos[1], cluster.pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    canopy.add(mesh);
  });
  group.add(canopy);

  const basePositions = canopy.children.map((child) => child.position.clone());

  return {
    group,
    animated: {
      update(time) {
        // Lazy sway, each cluster slightly out of phase
        canopy.children.forEach((child, i) => {
          const base = basePositions[i];
          const phase = time * 0.7 + i * 1.3;
          child.position.x = base.x + Math.sin(phase) * 0.16;
          child.position.z = base.z + Math.cos(phase * 0.8) * 0.14;
        });
        canopy.rotation.z = Math.sin(time * 0.5) * 0.014;
      },
    },
  };
}

/** A single scrubby bush, one tile. */
export function buildBush(seed: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  const clusters = [
    { pos: [0, 0.85, 0], r: 1.0, color: PALETTE.leaf },
    { pos: [-0.55, 0.6, 0.35], r: 0.7, color: PALETTE.leafDark },
    { pos: [0.5, 0.65, -0.4], r: 0.75, color: PALETTE.leaf },
    { pos: [0.15, 1.35, 0.2], r: 0.6, color: PALETTE.leafLight },
  ];

  clusters.forEach((cluster, i) => {
    const mesh = new THREE.Mesh(
      noisyBlob(cluster.r, 1, 0.24, seed + i * 31),
      foliageMaterial(cluster.color, seed + i),
    );
    mesh.position.set(cluster.pos[0], cluster.pos[1], cluster.pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // Woody stem peeking out the bottom
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.14, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: PALETTE.bark, roughness: 0.95 }),
  );
  stem.position.y = 0.25;
  group.add(stem);

  group.rotation.y = rand() * Math.PI * 2;
  const baseY = group.children.map((child) => child.position.y);

  return {
    group,
    animated: {
      update(time) {
        const sway = Math.sin(time * 1.1 + seed) * 0.03;
        group.rotation.z = sway;
        group.children.forEach((child, i) => {
          child.position.y = baseY[i] + Math.sin(time * 1.6 + i + seed) * 0.015;
        });
      },
    },
  };
}

/**
 * Timber paling fence. Built as one merged-ish group of instanced palings for
 * the run length requested, facing +z by default.
 */
export function buildFenceRun(lengthTiles: number, seed: number): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(seed);

  const wood = new THREE.MeshStandardMaterial({
    color: PALETTE.fenceWood,
    roughness: 0.92,
    metalness: 0,
    map: getWoodTexture(),
  });
  const woodDark = new THREE.MeshStandardMaterial({
    color: PALETTE.fenceWoodDark,
    roughness: 0.95,
    metalness: 0,
    map: getWoodTexture(),
  });

  const length = lengthTiles * TILE;
  const palingWidth = 0.42;
  const gap = 0.06;
  const step = palingWidth + gap;
  const count = Math.floor(length / step);

  // Palings, each nudged slightly so the fence looks built by hand
  const palingGeometry = new THREE.BoxGeometry(palingWidth, 3.2, 0.12);
  const palings = new THREE.InstancedMesh(palingGeometry, wood, count);
  palings.castShadow = true;
  palings.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const height = 0.94 + rand() * 0.12;
    position.set(-length / 2 + step * (i + 0.5), (3.2 * height) / 2, (rand() - 0.5) * 0.03);
    quaternion.setFromEuler(new THREE.Euler(0, 0, (rand() - 0.5) * 0.03));
    scale.set(1, height, 1);
    matrix.compose(position, quaternion, scale);
    palings.setMatrixAt(i, matrix);

    const tint = 0.82 + rand() * 0.3;
    color.setRGB(tint, tint * 0.97, tint * 0.9);
    palings.setColorAt(i, color);
  }
  palings.instanceMatrix.needsUpdate = true;
  if (palings.instanceColor) palings.instanceColor.needsUpdate = true;
  group.add(palings);

  // Horizontal rails behind the palings
  [1.0, 2.4].forEach((y) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.22, 0.14), woodDark);
    rail.position.set(0, y, -0.14);
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
  });

  // Posts every few tiles
  const postCount = Math.max(2, Math.round(lengthTiles / 3) + 1);
  for (let i = 0; i < postCount; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.6, 0.3), woodDark);
    post.position.set(-length / 2 + (length / (postCount - 1)) * i, 1.8, -0.2);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
  }

  return group;
}

/**
 * The legendary walterweight chicken poultry championship ring.
 * Sized in tiles so it lines up with the 6x6 collision footprint.
 */
export function buildBoxingRing(widthTiles: number, depthTiles: number): THREE.Group {
  const group = new THREE.Group();
  const w = widthTiles * TILE;
  const d = depthTiles * TILE;
  const deckHeight = 1.6;
  const postHeight = 3.4;

  // Apron / platform sides
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(w, deckHeight, d),
    new THREE.MeshStandardMaterial({ color: 0x1b2a63, roughness: 0.8 }),
  );
  apron.position.y = deckHeight / 2;
  apron.castShadow = true;
  apron.receiveShadow = true;
  group.add(apron);

  // Padded edge of the deck. Kept plain so the canvas artwork only ever shows
  // on the top face rather than smearing down the sides.
  const matEdge = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.1, 0.16, d - 0.1),
    new THREE.MeshStandardMaterial({ color: 0x2b3f96, roughness: 0.85 }),
  );
  matEdge.position.y = deckHeight + 0.08;
  matEdge.castShadow = true;
  matEdge.receiveShadow = true;
  group.add(matEdge);

  // Canvas artwork, laid over the top face only
  const mat = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.12, d - 0.12),
    new THREE.MeshStandardMaterial({
      map: createRingMatTexture(),
      roughness: 0.88,
      metalness: 0,
    }),
  );
  mat.rotation.x = -Math.PI / 2;
  mat.position.y = deckHeight + 0.17;
  mat.receiveShadow = true;
  group.add(mat);

  // Skirt banner hanging around the apron
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.14, 0.9, d + 0.14),
    new THREE.MeshStandardMaterial({ color: 0xd42a2a, roughness: 0.7, side: THREE.DoubleSide }),
  );
  skirt.position.y = deckHeight - 0.45;
  skirt.receiveShadow = true;
  group.add(skirt);

  const postMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.ringPost,
    roughness: 0.45,
    metalness: 0.15,
  });
  const ropeMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.ringRope,
    roughness: 0.6,
  });
  const padMaterial = new THREE.MeshStandardMaterial({ color: 0x1f4fd0, roughness: 0.6 });

  const inset = 0.55;
  const corners: [number, number][] = [
    [-w / 2 + inset, -d / 2 + inset],
    [w / 2 - inset, -d / 2 + inset],
    [w / 2 - inset, d / 2 - inset],
    [-w / 2 + inset, d / 2 - inset],
  ];

  corners.forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, postHeight, 10), postMaterial);
    post.position.set(x, deckHeight + postHeight / 2, z);
    post.castShadow = true;
    group.add(post);

    // Corner pad
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 10), padMaterial);
    pad.position.set(x, deckHeight + 1.1, z);
    pad.castShadow = true;
    group.add(pad);

    // Cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), postMaterial);
    cap.position.set(x, deckHeight + postHeight, z);
    group.add(cap);
  });

  // Three ropes per side
  const ropeHeights = [0.95, 1.75, 2.55];
  ropeHeights.forEach((h) => {
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = corners[i];
      const [x2, z2] = corners[(i + 1) % 4];
      const start = new THREE.Vector3(x1, deckHeight + h, z1);
      const end = new THREE.Vector3(x2, deckHeight + h, z2);
      const length = start.distanceTo(end);

      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, length, 8), ropeMaterial);
      rope.position.copy(start).add(end).multiplyScalar(0.5);
      // Slight sag in the middle
      rope.position.y -= 0.05;
      rope.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        end.clone().sub(start).normalize(),
      );
      rope.castShadow = true;
      group.add(rope);
    }
  });

  // Steps up to the apron on the near side
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.35, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x37476b, roughness: 0.85 }),
    );
    step.position.set(0, 0.175 + i * 0.5, d / 2 + 1.1 - i * 0.7);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }

  return group;
}

/** Kiddy pool with animated water and floating balls. */
export function buildKiddyPool(sizeTiles: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const radius = (sizeTiles * TILE) / 2 - 0.25;
  const wallHeight = 1.0;

  const shellMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.poolPink,
    map: createPoolTexture(),
    roughness: 0.42,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // Outer wall
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.92, wallHeight, 40, 1, true),
    shellMaterial,
  );
  wall.position.y = wallHeight / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Rolled rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.16, 10, 40),
    new THREE.MeshStandardMaterial({ color: 0xff7ec0, roughness: 0.35, metalness: 0.05 }),
  );
  rim.position.y = wallHeight;
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  group.add(rim);

  // Pool floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.94, 40),
    new THREE.MeshStandardMaterial({ color: PALETTE.poolDeep, roughness: 0.6 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.04;
  floor.receiveShadow = true;
  group.add(floor);

  // Animated water surface
  // Colours are authored in sRGB, so convert them for the linear pipeline the
  // renderer works in — otherwise the pool washes out to near-white.
  const waterUniforms = {
    uTime: { value: 0 },
    uShallow: { value: new THREE.Color(0x4fc4e8).convertSRGBToLinear() },
    uDeep: { value: new THREE.Color(0x0a5c8f).convertSRGBToLinear() },
  };
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.93, 64),
    new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Concentric ripples plus a slow cross swell
          float r = length(pos.xy);
          float wave = sin(r * 7.0 - uTime * 2.4) * 0.035
                     + sin(pos.x * 3.1 + uTime * 1.5) * 0.025
                     + cos(pos.y * 2.7 - uTime * 1.1) * 0.02;
          pos.z += wave;
          vWave = wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          // Shallower toward the rim, deeper in the middle
          float edge = smoothstep(0.5, 0.24, length(vUv - 0.5));
          vec3 color = mix(uShallow, uDeep, edge);

          // Ripple crests catch the light, troughs darken
          color += vec3(0.35, 0.42, 0.45) * clamp(vWave * 8.0, -0.6, 1.0);

          // Glints riding the crests
          float glint = smoothstep(0.045, 0.062, vWave);
          color += vec3(1.0, 0.98, 0.9) * glint * 0.5;

          // Caustic shimmer
          float shimmer = sin(vUv.x * 34.0 + uTime * 2.6) * sin(vUv.y * 30.0 - uTime * 2.0);
          color += vec3(0.06, 0.11, 0.13) * max(shimmer, 0.0);

          gl_FragColor = vec4(color, 0.88);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  // Sits just under the rim so you can actually see the surface from Scrump's
  // eye level rather than only the far inner wall.
  water.position.y = 0.86;
  group.add(water);

  // Floating balls
  const ballColors = [0xff4444, 0x00cccc, 0x4466ff, 0x44dd44, 0xffe044];
  const balls: THREE.Mesh[] = [];
  ballColors.forEach((color, i) => {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 20, 16),
      new THREE.MeshStandardMaterial({ color, roughness: 0.22, metalness: 0.05 }),
    );
    const angle = (i / ballColors.length) * Math.PI * 2;
    const dist = radius * (0.25 + (i % 3) * 0.2);
    ball.position.set(Math.cos(angle) * dist, 0.98, Math.sin(angle) * dist);
    ball.castShadow = true;
    balls.push(ball);
    group.add(ball);
  });

  const ballBases = balls.map((ball) => ball.position.clone());

  return {
    group,
    animated: {
      update(time) {
        waterUniforms.uTime.value = time;
        balls.forEach((ball, i) => {
          const base = ballBases[i];
          const drift = time * 0.25 + i * 1.7;
          ball.position.x = base.x + Math.sin(drift) * 0.35;
          ball.position.z = base.z + Math.cos(drift * 0.8) * 0.35;
          ball.position.y = 0.98 + Math.sin(time * 2.0 + i) * 0.06;
          ball.rotation.x = time * 0.5 + i;
          ball.rotation.z = time * 0.3 + i;
        });
      },
    },
  };
}

/** Empty beer bottle lying in the grass. */
export function buildBeerBottle(): THREE.Group {
  const group = new THREE.Group();

  const glass = new THREE.MeshStandardMaterial({
    color: 0x6b3a12,
    roughness: 0.12,
    metalness: 0.0,
    transparent: true,
    opacity: 0.86,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.62, 14), glass);
  body.position.y = 0.31;
  body.castShadow = true;
  group.add(body);

  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.19, 0.24, 14), glass);
  shoulder.position.y = 0.74;
  shoulder.castShadow = true;
  group.add(shoulder);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.3, 12), glass);
  neck.position.y = 1.0;
  neck.castShadow = true;
  group.add(neck);

  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a2a0c, roughness: 0.3 }),
  );
  lip.position.y = 1.16;
  group.add(lip);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.196, 0.196, 0.3, 14),
    new THREE.MeshStandardMaterial({ color: 0xf2efe4, roughness: 0.75 }),
  );
  label.position.y = 0.34;
  group.add(label);

  // Tipped over, because of course it is
  group.rotation.z = Math.PI / 2.1;
  group.rotation.y = 0.6;
  group.position.y = 0.2;
  return group;
}

/** A pair of well-worn boxing gloves. */
export function buildBoxingGloves(): THREE.Group {
  const group = new THREE.Group();

  const leather = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.45, metalness: 0.05 });
  const leatherDark = new THREE.MeshStandardMaterial({ color: 0x8f1414, roughness: 0.5 });
  const lace = new THREE.MeshStandardMaterial({ color: 0xf0f0e6, roughness: 0.8 });

  const makeGlove = (offsetX: number, offsetZ: number, rotation: number, tilt: number): THREE.Group => {
    const glove = new THREE.Group();

    // Padded fist, flattened front-to-back so it reads as a glove not an egg
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), leather);
    fist.scale.set(0.82, 1.0, 1.15);
    fist.position.set(0, 0.26, 0.1);
    fist.castShadow = true;
    glove.add(fist);

    // Knuckle roll across the front
    const knuckles = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 6, 10), leather);
    knuckles.rotation.z = Math.PI / 2;
    knuckles.position.set(0, 0.34, 0.32);
    knuckles.castShadow = true;
    glove.add(knuckles);

    // Thumb, tucked alongside
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.14, 6, 10), leather);
    thumb.rotation.x = 1.1;
    thumb.position.set(0.19, 0.22, 0.18);
    thumb.castShadow = true;
    glove.add(thumb);

    // Wrist wrap
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.28, 14), leatherDark);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, 0.24, -0.18);
    cuff.castShadow = true;
    glove.add(cuff);

    // Lacing panel and tie
    const laces = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.22), lace);
    laces.position.set(0, 0.4, 0.02);
    glove.add(laces);

    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 6, 14), lace);
    tie.rotation.x = Math.PI / 2;
    tie.position.set(0, 0.24, -0.3);
    glove.add(tie);

    glove.position.set(offsetX, 0, offsetZ);
    glove.rotation.y = rotation;
    glove.rotation.x = tilt;
    return glove;
  };

  // One flopped on its side, one propped against it
  group.add(makeGlove(-0.26, 0.06, 0.5, Math.PI / 2.3));
  group.add(makeGlove(0.28, -0.1, -0.8, Math.PI / 2.8));
  group.position.y = 0.16;
  return group;
}

/** Collectible Hollandia can. Glints so it reads as pickup-able. */
export function buildHollandiaCan(): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  const canBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.72, 20),
    new THREE.MeshStandardMaterial({ color: PALETTE.hollandia, roughness: 0.28, metalness: 0.65 }),
  );
  canBody.position.y = 0.36;
  canBody.castShadow = true;
  pivot.add(canBody);

  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.245, 0.245, 0.3, 20),
    new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.3, metalness: 0.5 }),
  );
  band.position.y = 0.38;
  pivot.add(band);

  const aluminium = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.2, metalness: 0.9 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.06, 20), aluminium);
  top.position.y = 0.73;
  pivot.add(top);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.06, 20), aluminium);
  base.position.y = 0.03;
  pivot.add(base);

  const glow = createPickupGlow(0x66ff88);
  group.add(glow.group);

  return {
    group,
    animated: {
      update(time, delta) {
        pivot.rotation.y = time * 0.9;
        pivot.position.y = 0.12 + Math.sin(time * 1.8) * 0.08;
        glow.animated.update(time, delta);
      },
    },
  };
}

/** Collectible CD in a jewel case. */
export function buildCD(songName: string): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  const caseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.68, 0.07),
    new THREE.MeshPhysicalMaterial({
      color: 0x2a2a32,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    }),
  );
  caseMesh.castShadow = true;
  pivot.add(caseMesh);

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.6),
    new THREE.MeshStandardMaterial({ map: createCDArtTexture(songName), roughness: 0.35 }),
  );
  art.position.z = 0.037;
  pivot.add(art);

  const artBack = art.clone();
  artBack.position.z = -0.037;
  artBack.rotation.y = Math.PI;
  pivot.add(artBack);

  // The disc itself, peeking out of the case
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.012, 40),
    new THREE.MeshStandardMaterial({
      color: 0xdfe6ef,
      roughness: 0.06,
      metalness: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.8,
    } as THREE.MeshStandardMaterialParameters),
  );
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0.28, 0, 0);
  disc.castShadow = true;
  pivot.add(disc);

  pivot.position.y = 0.55;

  const glow = createPickupGlow(0xcc66ff);
  group.add(glow.group);

  return {
    group,
    animated: {
      update(time, delta) {
        pivot.rotation.y = time * 0.8;
        pivot.position.y = 0.55 + Math.sin(time * 1.6) * 0.09;
        disc.rotation.y = time * 3.0;
        glow.animated.update(time, delta);
      },
    },
  };
}

/** Wooden ladder leaning against the fence. */
export function buildLadder(): THREE.Group {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({
    color: 0xa9773f,
    roughness: 0.9,
    map: getWoodTexture(),
  });

  const height = 4.6;
  const width = 0.85;

  [-width / 2, width / 2].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, height, 0.14), wood);
    rail.position.set(x, height / 2, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
  });

  const rungCount = 8;
  for (let i = 0; i < rungCount; i++) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(width, 0.09, 0.1), wood);
    rung.position.set(0, 0.4 + (i * (height - 0.8)) / (rungCount - 1), 0);
    rung.castShadow = true;
    group.add(rung);
  }

  // Leaning back against the fence
  group.rotation.x = 0.32;
  return group;
}

/**
 * Stairwell down to the downstairs room.
 *
 * Sized to fill the hole cut out of the lawn (see STAIR_PIT_BOUNDS). The origin
 * is the centre of that hole at ground level, and the steps descend toward +z,
 * away from the player as they walk up to it.
 */
export function buildStairsDown(width: number, depth: number): THREE.Group {
  const group = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.95 });
  const concreteDark = new THREE.MeshStandardMaterial({ color: 0x74706a, roughness: 0.95 });
  const shadowed = new THREE.MeshStandardMaterial({ color: 0x2b2a29, roughness: 1 });

  // Deliberately shallow. From Scrump's eye height you can only see so far into
  // a hole before the near kerb cuts the sightline off, and the whole point of
  // this thing is that the flight is legible from across the yard.
  const shaftDepth = 2.1;
  const stepCount = 4;
  const halfW = width / 2;
  const halfD = depth / 2;

  // Shaft floor, far below and in shade
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, depth), shadowed);
  floor.position.y = -shaftDepth;
  group.add(floor);

  // Retaining walls lining the hole. Rendered from the inside, which is all the
  // player can ever see of them.
  const wallMaterial = concreteDark;
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, shaftDepth, depth), wallMaterial);
    wall.position.set(side * (halfW + 0.15), -shaftDepth / 2, 0);
    wall.receiveShadow = true;
    group.add(wall);
  });

  const nearWall = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, shaftDepth, 0.3), wallMaterial);
  nearWall.position.set(0, -shaftDepth / 2, -(halfD + 0.15));
  nearWall.receiveShadow = true;
  group.add(nearWall);

  // Far end: a dark doorway leading under the house
  const farWall = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, shaftDepth, 0.3), wallMaterial);
  farWall.position.set(0, -shaftDepth / 2, halfD + 0.15);
  farWall.receiveShadow = true;
  group.add(farWall);

  const doorway = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.6, 1.5),
    new THREE.MeshBasicMaterial({ color: 0x07070c }),
  );
  doorway.position.set(0, -shaftDepth + 0.75, halfD - 0.01);
  doorway.rotation.y = Math.PI;
  group.add(doorway);

  // Steps descending away from the player
  const stepRise = shaftDepth / stepCount;
  const stepRun = (depth - 0.6) / stepCount;
  for (let i = 0; i < stepCount; i++) {
    const tread = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.2, stepRun), concrete);
    tread.position.set(0, -stepRise * (i + 1), -halfD + 0.3 + stepRun * (i + 0.5));
    tread.receiveShadow = true;
    tread.castShadow = true;
    group.add(tread);

    // Riser under each tread, so the flight reads as solid from above
    const riser = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, stepRise, 0.12), concreteDark);
    riser.position.set(0, -stepRise * (i + 0.5), -halfD + 0.3 + stepRun * i);
    group.add(riser);
  }

  // Kerb around the rim, just proud of the lawn
  const kerbMaterial = concrete;
  [-1, 1].forEach((side) => {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, depth + 0.7), kerbMaterial);
    kerb.position.set(side * (halfW + 0.15), 0.1, 0);
    kerb.castShadow = true;
    kerb.receiveShadow = true;
    group.add(kerb);
  });
  const kerbNear = new THREE.Mesh(new THREE.BoxGeometry(width + 0.7, 0.26, 0.34), kerbMaterial);
  kerbNear.position.set(0, 0.1, -(halfD + 0.15));
  kerbNear.castShadow = true;
  kerbNear.receiveShadow = true;
  group.add(kerbNear);

  // Handrails down both sides
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    roughness: 0.35,
    metalness: 0.8,
  });
  const railHeight = 0.95;
  [-1, 1].forEach((side) => {
    const x = side * (halfW - 0.12);
    // The rail runs parallel to the flight, one rail-height above the treads
    const top = new THREE.Vector3(x, railHeight, -halfD + 0.3);
    const bottom = new THREE.Vector3(x, -shaftDepth + railHeight, halfD - 0.3);

    const railLength = top.distanceTo(bottom);
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, railLength, 10),
      railMaterial,
    );
    spanBetween(rail, top, bottom);
    rail.castShadow = true;
    group.add(rail);

    // Uprights standing on the treads below the rail
    for (let i = 0; i <= 3; i++) {
      const t = i / 3;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, railHeight, 8),
        railMaterial,
      );
      post.position.set(
        x,
        THREE.MathUtils.lerp(top.y, bottom.y, t) - railHeight / 2,
        THREE.MathUtils.lerp(top.z, bottom.z, t),
      );
      group.add(post);
    }
  });

  return group;
}

/** External staircase up to the balcony. */
export function buildStairsUp(): THREE.Group {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({
    color: 0x8a6a45,
    roughness: 0.9,
    map: getWoodTexture(),
  });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8f959c, roughness: 0.4, metalness: 0.75 });

  const stepCount = 9;
  for (let i = 0; i < stepCount; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 0.62), wood);
    step.position.set(0, 0.4 + i * 0.5, 1.8 - i * 0.55);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);

    // Riser
    const riser = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.1), wood);
    riser.position.set(0, 0.15 + i * 0.5, 1.5 - i * 0.55);
    riser.receiveShadow = true;
    group.add(riser);
  }

  // The flight runs from the bottom step up to the landing
  const flightBottom = new THREE.Vector3(0, 0.4, 1.8);
  const flightTop = new THREE.Vector3(0, 0.4 + (stepCount - 1) * 0.5, 1.8 - (stepCount - 1) * 0.55);
  const railHeight = 1.05;

  [-1.05, 1.05].forEach((x) => {
    // Stringer, sitting just under the treads
    const stringerLength = flightBottom.distanceTo(flightTop) + 1.2;
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.16, stringerLength, 0.5), wood);
    spanBetween(
      stringer,
      new THREE.Vector3(x, flightBottom.y - 0.5, flightBottom.z + 0.5),
      new THREE.Vector3(x, flightTop.y - 0.5, flightTop.z - 0.5),
    );
    stringer.castShadow = true;
    group.add(stringer);

    // Handrail above it
    const railBottom = new THREE.Vector3(x, flightBottom.y + railHeight, flightBottom.z);
    const railTop = new THREE.Vector3(x, flightTop.y + railHeight, flightTop.z);
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, railBottom.distanceTo(railTop), 10),
      metal,
    );
    spanBetween(rail, railBottom, railTop);
    rail.castShadow = true;
    group.add(rail);

    // Balusters
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, railHeight, 8), metal);
      post.position.set(
        x,
        THREE.MathUtils.lerp(railBottom.y, railTop.y, t) - railHeight / 2,
        THREE.MathUtils.lerp(railBottom.z, railTop.z, t),
      );
      group.add(post);
    }
  });

  // Landing at the top, flush with the last tread
  const landing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 1.6), wood);
  landing.position.set(0, flightTop.y + 0.14, flightTop.z - 1.0);
  landing.castShadow = true;
  landing.receiveShadow = true;
  group.add(landing);

  return group;
}

/**
 * A soft ground halo plus rising motes, used to mark collectibles from a
 * distance the same way the 2D version pulsed its sprites.
 */
export function createPickupGlow(color: number): { group: THREE.Group; animated: Animated } {
  const group = new THREE.Group();

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 28),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  group.add(halo);

  // Motes drifting upward
  const moteCount = 12;
  const positions = new Float32Array(moteCount * 3);
  const seeds: number[] = [];
  for (let i = 0; i < moteCount; i++) {
    const angle = (i / moteCount) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * 0.4;
    positions[i * 3 + 1] = Math.random() * 1.2;
    positions[i * 3 + 2] = Math.sin(angle) * 0.4;
    seeds.push(Math.random());
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const motes = new THREE.Points(
    moteGeometry,
    new THREE.PointsMaterial({
      color,
      // Without a map, points draw as hard squares — the soft puff makes them
      // read as sparkles instead of stray pixels on whatever is behind them.
      map: createPuffTexture(),
      size: 0.16,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(motes);

  return {
    group,
    animated: {
      update(time) {
        const pulse = (Math.sin(time * 2.2) + 1) / 2;
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.14 + pulse * 0.2;
        halo.scale.setScalar(0.9 + pulse * 0.18);

        const array = moteGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < moteCount; i++) {
          array[i * 3 + 1] = ((time * 0.35 + seeds[i]) % 1) * 1.4;
        }
        moteGeometry.attributes.position.needsUpdate = true;
      },
    },
  };
}
