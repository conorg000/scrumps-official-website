/**
 * The backyard, rebuilt in 3D.
 *
 * Placement is driven entirely by `Room.furniture` from client/public/room.js,
 * so the 3D world and the 2D collision map can never drift apart. Items the
 * quest logic removes (collected CDs, cans, the ladder, Mr Tibbles once he
 * joins you) disappear here too, via `syncFurniture`.
 */

import * as THREE from 'three';
import {
  GRID_H,
  GRID_W,
  HOUSE,
  POV_BLOCKERS,
  PALETTE,
  TILE,
  WORLD_H,
  WORLD_W,
  gridToWorldX,
  gridToWorldZ,
  isPovBlocked,
  worldToGridX,
  worldToGridY,
} from './constants';
import {
  Animated,
  buildBeerBottle,
  buildBoxingGloves,
  buildBoxingRing,
  buildBush,
  buildCD,
  buildFenceRun,
  buildHollandiaCan,
  buildKiddyPool,
  buildLadder,
  buildTree,
} from './props';
import { buildHouse } from './house';
import { Character, buildBushTurkey, buildMrFeng, buildMrTibbles } from './characters';
import { createBladeTexture, createGrassRoughness, createGrassTexture, createPuffTexture } from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

// Furniture and RoomLike used to live here; they are shared with the other
// rooms now, but plenty of call sites still import them from this module.
export type { Furniture, RoomLike };

export class BackyardScene extends PovScene {
  readonly blockers = POV_BLOCKERS;
  /** Open looking at the boxing ring, so Scrump's first line lands. */
  readonly focus = { x: 16.5, y: 2.5 };

  readonly sun: THREE.DirectionalLight;

  private readonly clouds: { sprite: THREE.Sprite; speed: number; baseX: number }[] = [];
  private slug: THREE.Group | null = null;
  private readonly windUniform = { value: 0 };

  private bushTurkey: { character: Character; object: THREE.Object3D } | null = null;
  private mrFeng: { character: Character; object: THREE.Object3D } | null = null;

  private readonly lowDetail: boolean;

  constructor(room: RoomLike, lowDetail: boolean) {
    super();
    this.lowDetail = lowDetail;

    this.scene.fog = new THREE.Fog(0xbfe0f0, 44, 130);

    // Sky-and-ground ambient bounce, plus a flat lift so surfaces facing away
    // from the sun (the inside face of the back fence, mostly) stay readable.
    const hemisphere = new THREE.HemisphereLight(0xa8d8f5, 0x6b8a52, 1.9);
    this.scene.add(hemisphere);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // Warm afternoon key light from the back-right, matching the 2D sun
    this.sun = new THREE.DirectionalLight(PALETTE.sunlight, 2.6);
    this.sun.position.set(WORLD_W * 0.85, 34, -22);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(lowDetail ? 1024 : 2048, lowDetail ? 1024 : 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    this.sun.shadow.camera.left = -34;
    this.sun.shadow.camera.right = 34;
    this.sun.shadow.camera.top = 34;
    this.sun.shadow.camera.bottom = -34;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.sun.target.position.set(WORLD_W / 2, 0, WORLD_H / 2);
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // Cool fill from the opposite side so shadowed faces do not go flat
    const fill = new THREE.DirectionalLight(0x9dc6ef, 0.45);
    fill.position.set(-20, 14, 30);
    this.scene.add(fill);

    this.buildSky();
    this.buildGround();
    this.buildFencing();
    this.buildNeighbourhood();
    this.buildGrass(room);
    this.buildClouds();
    this.buildSlug();
    this.buildFurniture(room);
    this.buildExits();
  }

  // ---------------------------------------------------------------- environment

  private buildSky(): void {
    const skyGeometry = new THREE.SphereGeometry(300, 32, 20);
    const sunDirection = this.sun.position.clone().normalize();

    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x3f8fd8) },
        uMiddle: { value: new THREE.Color(PALETTE.sky) },
        uHorizon: { value: new THREE.Color(PALETTE.skyHorizon) },
        uSunDirection: { value: sunDirection },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldDirection;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldDirection = normalize(worldPosition.xyz - cameraPosition);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop;
        uniform vec3 uMiddle;
        uniform vec3 uHorizon;
        uniform vec3 uSunDirection;
        varying vec3 vWorldDirection;

        void main() {
          vec3 dir = normalize(vWorldDirection);
          float h = clamp(dir.y, -1.0, 1.0);

          // Two-stop vertical gradient: hazy at the horizon, deep overhead
          vec3 color = mix(uHorizon, uMiddle, smoothstep(-0.05, 0.32, h));
          color = mix(color, uTop, smoothstep(0.3, 0.95, h));

          // Sun disc and its bloom
          float sunAmount = max(dot(dir, normalize(uSunDirection)), 0.0);
          color += vec3(1.0, 0.92, 0.72) * pow(sunAmount, 900.0) * 2.2;
          color += vec3(1.0, 0.86, 0.58) * pow(sunAmount, 26.0) * 0.28;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.frustumCulled = false;
    this.scene.add(sky);
  }

  private buildGround(): void {
    const grassMap = createGrassTexture();
    const grassRoughness = createGrassRoughness();
    grassMap.repeat.set(14, 10.5);
    grassRoughness.repeat.set(14, 10.5);

    // The yard itself
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_W, WORLD_H),
      new THREE.MeshStandardMaterial({
        map: grassMap,
        roughnessMap: grassRoughness,
        roughness: 1,
        metalness: 0,
        color: 0xb6c9a4,
      }),
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(WORLD_W / 2, 0, WORLD_H / 2);
    lawn.receiveShadow = true;
    this.scene.add(lawn);

    // A much larger ground plane beyond the fence for horizon context
    const surrounds = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: 0x6d8a58, roughness: 1 }),
    );
    surrounds.rotation.x = -Math.PI / 2;
    surrounds.position.set(WORLD_W / 2, -0.12, WORLD_H / 2);
    this.scene.add(surrounds);

    // Paved apron running along the base of the house
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_W, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xa8a498, roughness: 0.95 }),
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(WORLD_W / 2, 0.02, HOUSE.faceZ - 1.2);
    apron.receiveShadow = true;
    this.scene.add(apron);

    // Worn dirt path from the back door toward the middle of the yard.
    // The soft radial mask keeps it from reading as a hard-edged rectangle.
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 15),
      new THREE.MeshStandardMaterial({
        color: 0x7d6647,
        roughness: 1,
        transparent: true,
        opacity: 0.6,
        alphaMap: createPuffTexture(),
        depthWrite: false,
      }),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(gridToWorldX(10), 0.02, gridToWorldZ(8.5));
    path.receiveShadow = true;
    this.scene.add(path);
  }

  /**
   * Fencing runs along three sides only — the house closes off the fourth. The
   * side runs stop short of the house so they cannot poke through its walls.
   */
  private buildFencing(): void {
    const sideLength = Math.floor(HOUSE.faceZ / TILE);

    // Back fence
    const back = buildFenceRun(GRID_W, 1);
    back.position.set(WORLD_W / 2, 0, -0.1);
    this.scene.add(back);

    // Left fence
    const left = buildFenceRun(sideLength, 3);
    left.position.set(-0.1, 0, (sideLength * TILE) / 2);
    left.rotation.y = Math.PI / 2;
    this.scene.add(left);

    // Right fence
    const right = buildFenceRun(sideLength, 4);
    right.position.set(WORLD_W + 0.1, 0, (sideLength * TILE) / 2);
    right.rotation.y = -Math.PI / 2;
    this.scene.add(right);
  }

  /** Rooftops and a power line beyond the fence, purely for depth. */
  private buildNeighbourhood(): void {
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5348, roughness: 0.95 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xb9a894, roughness: 0.95 });

    // Kept well back from the fence so they read as the next street over
    const houses: [number, number, number, number][] = [
      // x, z, width, height
      [-30, -34, 14, 7],
      [6, -46, 18, 9],
      [48, -36, 15, 8],
      [72, 8, 16, 7.5],
      [-34, 26, 13, 6.5],
      [16, 72, 20, 8],
      [66, 62, 14, 7],
    ];

    houses.forEach(([x, z, width, height], i) => {
      const group = new THREE.Group();

      const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, width * 0.8), wallMaterial);
      walls.position.y = height / 2;
      group.add(walls);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(width * 0.78, height * 0.5, 4),
        roofMaterial,
      );
      roof.position.y = height + height * 0.25;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);

      group.position.set(x, 0, z);
      group.rotation.y = i * 0.7;
      this.scene.add(group);
    });

    // A lone power pole, because every backyard has one in the way
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 16, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b5a49, roughness: 1 }),
    );
    pole.position.set(WORLD_W + 16, 8, WORLD_H * 0.2);
    this.scene.add(pole);

    const crossarm = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x5b4b3c, roughness: 1 }),
    );
    crossarm.position.set(WORLD_W + 16, 14.5, WORLD_H * 0.2);
    this.scene.add(crossarm);
  }

  /**
   * True where ground cover should not grow: on the house apron and staircase,
   * and under anything solid (the ring deck, the pool, the tree trunk) where
   * blades would otherwise poke through the geometry.
   */
  private isBareGround(worldX: number, worldZ: number, room: RoomLike): boolean {
    // Paving along the base of the house
    if (worldZ > HOUSE.faceZ - 2.4) return true;

    const tx = Math.round(worldToGridX(worldX));
    const ty = Math.round(worldToGridY(worldZ));
    if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) return true;
    if (isPovBlocked(tx, ty)) return true;

    // Pickups sit on open lawn, so only genuinely solid tiles are cleared
    if (!room.collisionMap?.[ty]?.[tx]) return false;
    return !room.furniture.some(
      (f) =>
        f.noCollision &&
        tx >= f.x &&
        tx < f.x + f.width &&
        ty >= f.y &&
        ty < f.y + f.height,
    );
  }

  /** Instanced grass blades with a wind shader. The single biggest look win. */
  private buildGrass(room: RoomLike): void {
    const count = this.lowDetail ? 12000 : 36000;

    // Blades stay well under eye height — Scrump is small, but the lawn still
    // has to be see-over rather than see-through. Narrow and dense reads much
    // better than wide and sparse.
    const blade = new THREE.PlaneGeometry(0.1, 0.34);
    blade.translate(0, 0.17, 0);

    const material = new THREE.MeshStandardMaterial({
      map: createBladeTexture(),
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 0,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.windUniform;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          /* glsl */ `
          #include <begin_vertex>
          // Bend more toward the tip, and offset each blade by its world position
          // so the whole lawn ripples rather than moving as one block.
          float tip = uv.y * uv.y;
          vec3 instanceOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          float phase = instanceOrigin.x * 0.55 + instanceOrigin.z * 0.7;
          float gust = sin(uTime * 1.6 + phase) * 0.6 + sin(uTime * 3.3 + phase * 1.9) * 0.25;
          transformed.x += gust * tip * 0.28;
          transformed.z += gust * tip * 0.16;
          `,
        );
    };

    const grass = new THREE.InstancedMesh(blade, material, count);
    grass.castShadow = false;
    grass.receiveShadow = true;
    grass.frustumCulled = false;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();
    const color = new THREE.Color();

    // Rejected samples are simply not drawn, so the live instance count is
    // trimmed to however many blades actually found open lawn.
    let placed = 0;
    for (let i = 0; i < count; i++) {
      const spot = this.sampleOpenGround(room);
      if (!spot) continue;

      position.set(spot.x, 0, spot.z);
      euler.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
      quaternion.setFromEuler(euler);
      const height = 0.62 + Math.random() * 0.55;
      scale.set(0.8 + Math.random() * 0.5, height, 1);
      matrix.compose(position, quaternion, scale);
      grass.setMatrixAt(placed, matrix);

      // Vary the tint so the lawn is not one flat green
      const t = Math.random();
      color.setRGB(0.78 + t * 0.35, 0.9 + t * 0.22, 0.62 + t * 0.3);
      grass.setColorAt(placed, color);
      placed++;
    }
    grass.count = placed;
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    this.scene.add(grass);

    // A scatter of small rocks and weeds to break up the ground plane
    this.buildGroundClutter(room);
  }

  /** Reject-sample a point on open lawn, or null if it kept landing on solids. */
  private sampleOpenGround(room: RoomLike): { x: number; z: number } | null {
    for (let attempt = 0; attempt < 8; attempt++) {
      const x = Math.random() * WORLD_W;
      const z = Math.random() * WORLD_H;
      if (!this.isBareGround(x, z, room)) return { x, z };
    }
    return null;
  }

  private buildGroundClutter(room: RoomLike): void {
    const rockGeometry = new THREE.DodecahedronGeometry(0.18, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x8b8579, roughness: 1, flatShading: true });
    const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, 60);
    rocks.castShadow = true;
    rocks.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    let rockCount = 0;
    for (let i = 0; i < 60; i++) {
      const spot = this.sampleOpenGround(room);
      if (!spot) continue;
      position.set(spot.x, 0.04, spot.z);
      quaternion.setFromEuler(
        new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      );
      const s = 0.35 + Math.random() * 0.75;
      scale.set(s, s * 0.6, s);
      matrix.compose(position, quaternion, scale);
      rocks.setMatrixAt(rockCount, matrix);
      rockCount++;
    }
    rocks.count = rockCount;
    rocks.instanceMatrix.needsUpdate = true;
    this.scene.add(rocks);

    // Dandelions, sitting down among the blades rather than hovering over them
    const flowerGeometry = new THREE.SphereGeometry(0.06, 8, 6);
    const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0xf5d33a, roughness: 0.8 });
    const flowers = new THREE.InstancedMesh(flowerGeometry, flowerMaterial, 110);
    let flowerCount = 0;
    for (let i = 0; i < 110; i++) {
      const spot = this.sampleOpenGround(room);
      if (!spot) continue;
      position.set(spot.x, 0.16 + Math.random() * 0.08, spot.z);
      quaternion.identity();
      scale.setScalar(0.7 + Math.random() * 0.6);
      matrix.compose(position, quaternion, scale);
      flowers.setMatrixAt(flowerCount, matrix);
      flowerCount++;
    }
    flowers.count = flowerCount;
    flowers.instanceMatrix.needsUpdate = true;
    this.scene.add(flowers);
  }

  private buildClouds(): void {
    const puff = createPuffTexture();
    const count = this.lowDetail ? 14 : 26;

    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: puff,
          transparent: true,
          opacity: 0.55 + Math.random() * 0.35,
          depthWrite: false,
          fog: false,
        }),
      );
      const size = 18 + Math.random() * 34;
      sprite.scale.set(size, size * (0.45 + Math.random() * 0.3), 1);
      const baseX = -120 + Math.random() * 340;
      sprite.position.set(baseX, 42 + Math.random() * 40, -60 + Math.random() * 200);
      this.scene.add(sprite);
      this.clouds.push({ sprite, speed: 0.35 + Math.random() * 0.9, baseX });
    }
  }

  /** The flying slug from the 2D sky. Non-negotiable. */
  private buildSlug(): void {
    const slug = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8fbc8f, roughness: 0.55 });
    const bellyMaterial = new THREE.MeshStandardMaterial({ color: 0xb8f0b8, roughness: 0.6 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 2.4, 8, 14), bodyMaterial);
    body.rotation.z = Math.PI / 2;
    slug.add(body);

    const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.2, 6, 12), bellyMaterial);
    belly.rotation.z = Math.PI / 2;
    belly.position.y = -0.45;
    slug.add(belly);

    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 12), bodyMaterial);
    hump.position.set(-0.3, 0.35, 0);
    hump.scale.set(1.3, 0.8, 1.0);
    slug.add(hump);

    // Eye stalks
    [-0.35, 0.35].forEach((z) => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.0, 6), bodyMaterial);
      stalk.position.set(1.5, 0.7, z);
      stalk.rotation.z = -0.25;
      slug.add(stalk);

      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.2 }),
      );
      eye.position.set(1.62, 1.2, z);
      slug.add(eye);
    });

    slug.scale.setScalar(1.6);
    this.scene.add(slug);
    this.slug = slug;
  }

  // ------------------------------------------------------------------ furniture

  protected createFurnitureNode(f: Furniture): THREE.Object3D | null {
    switch (f.type) {
      case 'tree': {
        const { group, animated } = buildTree();
        this.animated.push(animated);
        return group;
      }
      case 'bush': {
        const { group, animated } = buildBush(f.x * 31 + f.y * 17 + 5);
        this.animated.push(animated);
        return group;
      }
      case 'boxing_ring':
        return buildBoxingRing(f.width, f.height);
      case 'kiddy_pool': {
        const { group, animated } = buildKiddyPool(f.width);
        this.animated.push(animated);
        return group;
      }
      case 'beer_bottle':
        return buildBeerBottle();
      case 'boxing_gloves':
        return buildBoxingGloves();
      case 'hollandia_can': {
        const { group, animated } = buildHollandiaCan();
        this.animated.push(animated);
        return group;
      }
      case 'cd_item': {
        const { group, animated } = buildCD(f.songName ?? 'Unknown Track');
        this.animated.push(animated);
        return group;
      }
      case 'ladder': {
        const ladder = buildLadder();
        // The model leans toward +z by default. Turn it so it leans against
        // whichever boundary it has been placed against.
        if (f.x <= 1) ladder.rotation.y = -Math.PI / 2;
        else if (f.x >= GRID_W - 2) ladder.rotation.y = Math.PI / 2;
        else if (f.y <= 1) ladder.rotation.y = Math.PI;
        return ladder;
      }
      case 'mr_tibbles': {
        const cat = buildMrTibbles(1.15);
        this.characters.push(cat);
        // Facing roughly into the yard so you meet his eyes on arrival
        cat.group.rotation.y = Math.PI * 0.15;
        return cat.group;
      }
      default:
        // pool_rim and other invisible collision helpers render nothing
        return null;
    }
  }

  /**
   * The house supplies both exits: the brown back door leads downstairs, and
   * the concrete staircase up its left-hand end leads to the balcony.
   */
  private buildExits(): void {
    const house = buildHouse();
    this.scene.add(house.group);
    this.animated.push(...house.animated);

    const downLabel = makeLabelSprite('DOWNSTAIRS');
    downLabel.position.set(HOUSE.door.centreX, HOUSE.door.height + 0.9, HOUSE.faceZ - 0.4);
    this.addLabel(downLabel);

    const upLabel = makeLabelSprite('UPSTAIRS');
    upLabel.position.set(
      HOUSE.stair.lower.centreX,
      2.4,
      HOUSE.stair.lower.fromZ - 0.6,
    );
    this.addLabel(upLabel);
  }

  /** Show or hide the end-game arrivals. */
  setBushTurkeyVisible(visible: boolean): void {
    if (visible && !this.bushTurkey) {
      const character = buildBushTurkey();
      character.group.position.set(gridToWorldX(12), 0, gridToWorldZ(3));
      this.scene.add(character.group);
      this.characters.push(character);
      this.bushTurkey = { character, object: character.group };
    }
    if (this.bushTurkey) this.bushTurkey.object.visible = visible;
  }

  setMrFengVisible(visible: boolean): void {
    if (visible && !this.mrFeng) {
      const character = buildMrFeng();
      character.group.position.set(gridToWorldX(8), 0, gridToWorldZ(10));
      this.scene.add(character.group);
      this.characters.push(character);
      this.mrFeng = { character, object: character.group };
    }
    if (this.mrFeng) this.mrFeng.object.visible = visible;
  }

  // ---------------------------------------------------------------------- frame

  update(time: number, delta: number, playerPos: THREE.Vector3): void {
    this.windUniform.value = time;
    super.update(time, delta, playerPos);

    // Clouds drift and wrap around
    this.clouds.forEach((cloud) => {
      cloud.sprite.position.x = ((cloud.baseX + time * cloud.speed * 3 + 200) % 460) - 160;
    });

    // Slug flies a lazy figure-8 overhead
    if (this.slug) {
      const t = time * 0.28;
      this.slug.position.set(
        WORLD_W / 2 + Math.sin(t) * 26,
        30 + Math.sin(t * 2) * 6,
        WORLD_H / 2 + Math.sin(t * 2) * 18,
      );
      // Point it along its own velocity
      const ahead = 0.05;
      const next = new THREE.Vector3(
        WORLD_W / 2 + Math.sin(t + ahead) * 26,
        30 + Math.sin((t + ahead) * 2) * 6,
        WORLD_H / 2 + Math.sin((t + ahead) * 2) * 18,
      );
      this.slug.lookAt(next);
      this.slug.rotateY(-Math.PI / 2);
    }

    // Keep the shadow camera centred on the player so shadows stay crisp
    this.sun.position.set(playerPos.x + 26, 34, playerPos.z - 22);
    this.sun.target.position.set(playerPos.x, 0, playerPos.z);
    this.sun.target.updateMatrixWorld();
  }
}
