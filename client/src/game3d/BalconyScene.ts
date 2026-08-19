/**
 * Upstairs: the first-floor balcony, at sunset.
 *
 * The yard is off the north edge and five and a half metres down, so the whole
 * point of this room is the view over the rail — the backyard you came from,
 * the neighbours' roofs, and the sun going down behind them. The house closes
 * the south side and the lower half of the west, where a door leads inside.
 *
 * The railing is built from the same `balustrade` the house exterior uses, so
 * the orange bars you see from the yard are literally the ones you stand behind
 * up here. Balcony.furniture drives placement, as in every other room.
 */

import * as THREE from 'three';
import { BALCONY, BALCONY_BLOCKERS } from './constants';
import { applyWorldUVs, buildBoxingRing, buildHollandiaCan, buildKiddyPool, buildTree } from './props';
import { ORANGE_DARK, balustrade } from './house';
import {
  buildBBQ,
  buildCompostBin,
  buildOutdoorChair,
  buildOutdoorCouch,
  buildOutdoorTable,
  buildPotPlant,
} from './balconyProps';
import { buildStringLights } from './downstairsProps';
import { Character, buildMrTibbles } from './characters';
import {
  createConcreteTexture,
  createDeckingTexture,
  createGrassTexture,
  createPuffTexture,
  createStuccoTexture,
  createSunsetCloudTexture,
  tiled,
} from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const DECK = BALCONY.deck;
const LAND = BALCONY.landing;
const WALL = BALCONY.wall;
const DROP = BALCONY.dropToYard;

/** Yellow render, matching the house exterior seen from the yard. */
const HOUSE_YELLOW = 0xe8c65a;
const HOUSE_YELLOW_DARK = 0xc2a03e;

/** Where the sun sits. Low, north-north-west, and directly in your eyeline. */
const SUN_POSITION = new THREE.Vector3(-34, 7.5, -88);

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export class BalconyScene extends PovScene {
  readonly blockers = BALCONY_BLOCKERS;
  /** Open facing out over the rail into the sunset, not at the furniture. */
  readonly focus = { x: 6, y: -16 };

  private sun!: THREE.DirectionalLight;

  private readonly clouds: { sprite: THREE.Sprite; speed: number; baseX: number; span: number }[] = [];
  private readonly birds: { group: THREE.Group; wings: THREE.Mesh[]; offset: number }[] = [];
  private readonly lowDetail: boolean;

  constructor(room: RoomLike, lowDetail: boolean) {
    super();
    this.lowDetail = lowDetail;

    // Warm haze rather than grey. At this height you can see a long way, so the
    // fog has to start late or the neighbourhood vanishes.
    this.scene.fog = new THREE.Fog(0xe08a4e, 70, 320);
    this.scene.background = new THREE.Color(0xf0a35a);

    this.buildLighting();
    this.buildSky();
    this.buildClouds();
    this.buildBirds();
    this.buildViewBelow();
    this.buildDeck();
    this.buildRailings();
    this.buildHouseWalls();
    this.buildStairHead();
    this.buildStringLights();
    this.buildFurniture(room);
    this.buildExits();
  }

  // ------------------------------------------------------------------ lighting

  private buildLighting(): void {
    // Sky is hot orange overhead, and the deck bounces warm light back up
    this.scene.add(new THREE.HemisphereLight(0xff9a4e, 0x6b4a30, 1.5));
    this.scene.add(new THREE.AmbientLight(0xffd2a0, 0.5));

    // The sun itself: low, raking, and very warm. Long shadows across the deck
    // are most of what sells the hour.
    this.sun = new THREE.DirectionalLight(0xffb066, 4.2);
    this.sun.position.copy(SUN_POSITION).normalize().multiplyScalar(70).add(
      new THREE.Vector3(DECK.maxX / 2, 0, DECK.maxZ / 2),
    );
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 160;
    this.sun.shadow.camera.left = -30;
    this.sun.shadow.camera.right = 30;
    this.sun.shadow.camera.top = 30;
    this.sun.shadow.camera.bottom = -30;
    this.sun.shadow.bias = -0.0007;
    this.sun.shadow.normalBias = 0.035;
    this.sun.target.position.set(DECK.maxX / 2, 0, DECK.maxZ / 2);
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // Cool counter-fill from the opposite sky, so shadowed faces read blue-ish
    // against all that orange rather than going muddy.
    const counter = new THREE.DirectionalLight(0x7f9ad8, 0.7);
    counter.position.set(DECK.maxX + 30, 20, DECK.maxZ + 30);
    counter.target.position.set(DECK.maxX / 2, 0, DECK.maxZ / 2);
    this.scene.add(counter);
    this.scene.add(counter.target);
  }

  private buildSky(): void {
    const geometry = new THREE.SphereGeometry(500, 32, 24);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color(0x4a3f8f) },
        uHigh: { value: new THREE.Color(0xf2622e) },
        uMid: { value: new THREE.Color(0xffb43a) },
        uHorizon: { value: new THREE.Color(0xffe27a) },
        uBelow: { value: new THREE.Color(0x8a4a2a) },
        uSunDirection: { value: SUN_POSITION.clone().normalize() },
        uTime: { value: 0 },
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
        uniform vec3 uZenith;
        uniform vec3 uHigh;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        uniform vec3 uBelow;
        uniform vec3 uSunDirection;
        uniform float uTime;
        varying vec3 vWorldDirection;

        void main() {
          vec3 dir = normalize(vWorldDirection);
          float h = dir.y;

          // Four stops up the sky: gold at the horizon through orange and red
          // to a bruised violet overhead. Below the horizon it goes to haze.
          vec3 color = mix(uHorizon, uMid, smoothstep(0.0, 0.13, h));
          color = mix(color, uHigh, smoothstep(0.1, 0.34, h));
          color = mix(color, uZenith, smoothstep(0.32, 0.85, h));
          color = mix(uBelow, color, smoothstep(-0.16, 0.0, h));

          // The sun sits right on the horizon, so its glow spreads sideways
          // much further than it does vertically.
          vec3 sunDir = normalize(uSunDirection);
          float sunAmount = max(dot(dir, sunDir), 0.0);
          color += vec3(1.0, 0.86, 0.6) * pow(sunAmount, 1400.0) * 3.4;
          color += vec3(1.0, 0.72, 0.34) * pow(sunAmount, 42.0) * 0.5;
          color += vec3(1.0, 0.55, 0.22) * pow(sunAmount, 6.0) * 0.16;

          gl_FragColor = vec4(color, 1.0);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    const sky = new THREE.Mesh(geometry, material);
    sky.frustumCulled = false;
    this.scene.add(sky);

    // A soft bloom sprite sitting on the sun, which the sky shader alone cannot
    // do because it is behind everything in the scene.
    const bloom = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createPuffTexture(),
        color: 0xffc074,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    bloom.scale.set(150, 150, 1);
    bloom.position.copy(SUN_POSITION).normalize().multiplyScalar(380);
    this.scene.add(bloom);
  }

  /** Long thin clouds, lit from underneath, drifting across the sunset. */
  private buildClouds(): void {
    const map = createSunsetCloudTexture();
    const count = this.lowDetail ? 10 : 20;
    const rand = seededRandom(5150);

    for (let i = 0; i < count; i++) {
      const high = rand() > 0.55;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map,
          // Clouds near the sun catch gold; the rest sit in shadow
          color: high ? 0xff9d5c : 0xd8604a,
          transparent: true,
          opacity: 0.4 + rand() * 0.45,
          depthWrite: false,
          fog: false,
        }),
      );

      const span = 60 + rand() * 150;
      sprite.scale.set(span, span * (0.09 + rand() * 0.09), 1);
      const baseX = -280 + rand() * 620;
      sprite.position.set(baseX, 24 + rand() * 78, -110 - rand() * 190);
      this.scene.add(sprite);
      this.clouds.push({ sprite, speed: 0.6 + rand() * 1.6, baseX, span });
    }
  }

  /** A couple of skeins of birds crossing the sunset in V formation. */
  private buildBirds(): void {
    const material = new THREE.MeshBasicMaterial({
      color: 0x2a1a18,
      side: THREE.DoubleSide,
      fog: false,
    });

    [0, 1].forEach((flock) => {
      const group = new THREE.Group();
      const wings: THREE.Mesh[] = [];
      const size = 7 + flock * 2;

      for (let i = 0; i < size; i++) {
        // Two ranks peeling back from the leader
        const rank = Math.ceil(i / 2);
        const side = i % 2 === 0 ? 1 : -1;
        const bird = new THREE.Group();

        [-1, 1].forEach((wingSide) => {
          const shape = new THREE.Shape();
          shape.moveTo(0, 0);
          shape.quadraticCurveTo(wingSide * 0.5, 0.34, wingSide * 1.05, 0.06);
          shape.quadraticCurveTo(wingSide * 0.5, 0.12, 0, -0.06);
          const wing = new THREE.Mesh(new THREE.ShapeGeometry(shape, 6), material);
          bird.add(wing);
          wings.push(wing);
        });

        bird.position.set(rank * side * 1.9, rank * 0.5, rank * 2.4);
        group.add(bird);
      }

      group.scale.setScalar(1.6);
      this.scene.add(group);
      this.birds.push({ group, wings, offset: flock * 0.55 });
    });
  }

  // ------------------------------------------------------------------ the view

  /**
   * Everything below and beyond the railing. None of it is walkable — it exists
   * so that leaning over the rail shows you the yard you just climbed out of.
   */
  private buildViewBelow(): void {
    const grass = tiled(createGrassTexture(), 26, 26);

    // The yard, five and a half metres down and running away to the north
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.MeshStandardMaterial({ map: grass, color: 0xbfae7a, roughness: 1 }),
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(18, -DROP, -60);
    lawn.receiveShadow = true;
    this.scene.add(lawn);

    // The boxing ring and the kiddy pool, so the yard below is recognisably
    // the one you were just standing in
    const ring = buildBoxingRing(6, 6);
    ring.position.set(30, -DROP, -26);
    ring.rotation.y = 0.12;
    this.scene.add(ring);

    const pool = buildKiddyPool(3);
    pool.group.position.set(4, -DROP, -18);
    this.scene.add(pool.group);
    this.animated.push(pool.animated);

    const tree = buildTree();
    tree.group.position.set(-14, -DROP, -34);
    tree.group.scale.setScalar(1.15);
    this.scene.add(tree.group);
    this.animated.push(tree.animated);

    // Side and back fences, as flat runs — at this distance the palings of the
    // real fence builder would be a lot of geometry for a few pixels.
    const paling = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.95 });
    const fences: [number, number, number, number][] = [
      // centreX, centreZ, length, yaw
      [18, -78, 120, 0],
      [-42, -34, 92, Math.PI / 2],
      [78, -34, 92, Math.PI / 2],
    ];
    fences.forEach(([x, z, length, yaw]) => {
      const fence = new THREE.Mesh(new THREE.BoxGeometry(length, 3.6, 0.3), paling);
      fence.position.set(x, -DROP + 1.8, z);
      fence.rotation.y = yaw;
      fence.castShadow = true;
      this.scene.add(fence);
    });

    // Next street over: rooftops catching the last of the light
    const roof = new THREE.MeshStandardMaterial({ color: 0xa04a38, roughness: 0.9 });
    const render = new THREE.MeshStandardMaterial({ color: 0xd8c8ac, roughness: 0.95 });
    const rand = seededRandom(9012);

    for (let i = 0; i < (this.lowDetail ? 14 : 26); i++) {
      const group = new THREE.Group();
      const w = 12 + rand() * 12;
      const h = 6 + rand() * 5;

      const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.75), render);
      walls.position.y = h / 2;
      group.add(walls);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, h * 0.55, 4), roof);
      cap.position.y = h + h * 0.27;
      cap.rotation.y = Math.PI / 4;
      group.add(cap);

      // Scattered across the far side of the yard, never in the yard itself
      const distance = 100 + rand() * 210;
      const angle = -Math.PI * (0.15 + rand() * 0.7);
      group.position.set(18 + Math.cos(angle) * distance, -DROP, -40 + Math.sin(angle) * distance * 0.75);
      group.rotation.y = rand() * Math.PI;
      this.scene.add(group);
    }

    // Hills on the horizon. Three overlapping ridges of soft triangles rather
    // than one flat band, which otherwise reads as a purple wall behind the
    // roofs. Unlit and unfogged, and tinted toward the sky so they recede.
    const ridges: [number, number, number, number][] = [
      // z, height, colour, peak spacing
      [-330, 26, 0x9a6a72, 150],
      [-300, 18, 0xb07a72, 110],
      [-262, 11, 0xc48f78, 80],
    ];
    ridges.forEach(([z, height, color, spacing]) => {
      const rand = seededRandom(Math.abs(z));
      const points: number[] = [];
      const halfWidth = 900;
      const baseY = -DROP - 4;

      // A run of peaks along the top, closed off by a flat base
      const peaks = Math.ceil((halfWidth * 2) / spacing);
      for (let i = 0; i < peaks; i++) {
        const x0 = -halfWidth + i * spacing;
        const x1 = x0 + spacing;
        const peakX = x0 + spacing * (0.3 + rand() * 0.4);
        const peakY = baseY + height * (0.5 + rand() * 0.7);
        points.push(x0, baseY, 0, peakX, peakY, 0, x1, baseY, 0);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

      const ridge = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color, fog: false, side: THREE.DoubleSide }),
      );
      ridge.position.set(18, 0, z);
      this.scene.add(ridge);

      // A solid skirt below the peaks so there is no gap down to the horizon
      const skirt = new THREE.Mesh(
        new THREE.PlaneGeometry(halfWidth * 2, 60),
        new THREE.MeshBasicMaterial({ color, fog: false }),
      );
      skirt.position.set(18, baseY - 30, z);
      this.scene.add(skirt);
    });
  }

  // ---------------------------------------------------------------------- deck

  private buildDeck(): void {
    const decking = new THREE.MeshStandardMaterial({
      map: createDeckingTexture(),
      color: 0xc9ab84,
      roughness: 0.82,
      metalness: 0,
    });
    const concrete = new THREE.MeshStandardMaterial({
      map: createConcreteTexture(),
      color: 0xbdb7aa,
      roughness: 0.95,
    });

    /**
     * The deck is made of slabs of very different sizes, so their UVs are
     * scaled to world units — otherwise one board on the small landing is as
     * wide as six on the main deck.
     */
    const slab = (
      material: THREE.Material,
      density: number,
      x0: number,
      x1: number,
      z0: number,
      z1: number,
    ): void => {
      const w = Math.abs(x1 - x0);
      const d = Math.abs(z1 - z0);
      const geometry = new THREE.BoxGeometry(w, 0.42, d);
      applyWorldUVs(geometry, w, 0.42, d, density);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((x0 + x1) / 2, -0.21, (z0 + z1) / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    };

    // Boards come out about half a world unit wide at this density
    const BOARDS = 0.25;
    const CONCRETE = 0.3;

    // Timber deck, everything north of the stair landing
    slab(decking, BOARDS, DECK.minX - 1.2, DECK.maxX + 0.4, DECK.minZ - 0.8, LAND.minZ);
    // and the strip along the house wall, west of the landing
    slab(decking, BOARDS, DECK.minX - 1.2, LAND.minX, LAND.minZ, DECK.maxZ);

    // Concrete landing, wrapping the stair well on three sides
    const well = BALCONY.stairWell;
    slab(concrete, CONCRETE, LAND.minX, LAND.maxX, LAND.minZ, well.minZ);
    slab(concrete, CONCRETE, LAND.minX, well.minX, well.minZ, LAND.maxZ);
    slab(concrete, CONCRETE, well.maxX, LAND.maxX, well.minZ, LAND.maxZ);

    // Soffit under the deck, which is the balcony's belly seen from the yard
    const soffit = new THREE.Mesh(
      new THREE.BoxGeometry(DECK.maxX - DECK.minX + 3.4, 0.5, DECK.maxZ - DECK.minZ + 1.6),
      new THREE.MeshStandardMaterial({ color: 0xb8ae9c, roughness: 0.95 }),
    );
    soffit.position.set(
      (DECK.minX + DECK.maxX) / 2 - 0.4,
      -0.66,
      (DECK.minZ + DECK.maxZ) / 2 - 0.4,
    );
    this.scene.add(soffit);
  }

  private buildRailings(): void {
    const h = BALCONY.railHeight;
    const r = BALCONY.rails;

    const runs: [THREE.Vector3, THREE.Vector3][] = [
      // The long one overlooking the yard
      [new THREE.Vector3(r.north.fromX - 0.6, 0, r.north.z), new THREE.Vector3(r.north.toX + 0.6, 0, r.north.z)],
      // West return, stopping where the house wall takes over
      [new THREE.Vector3(r.west.x, 0, r.west.fromZ), new THREE.Vector3(r.west.x, 0, r.west.toZ)],
      // East side, down to the stair landing
      [new THREE.Vector3(r.east.x, 0, r.east.fromZ), new THREE.Vector3(r.east.x, 0, r.east.toZ)],
      // Round the outside of the landing
      [new THREE.Vector3(r.landingEast.x, 0, r.landingEast.fromZ), new THREE.Vector3(r.landingEast.x, 0, r.landingEast.toZ)],
      [new THREE.Vector3(r.east.x, 0, r.east.toZ), new THREE.Vector3(r.landingEast.x, 0, r.east.toZ)],
    ];

    runs.forEach(([from, to]) => this.scene.add(balustrade(from, to, h)));

    // Concrete upstand under the rail, matching the one you see from the yard
    const upstand = new THREE.MeshStandardMaterial({
      map: tiled(createConcreteTexture(), 3, 1),
      color: 0xb4aea2,
      roughness: 0.95,
    });

    const kerbs: [number, number, number, number][] = [
      // centreX, centreZ, length, yaw
      [(r.north.fromX + r.north.toX) / 2, r.north.z, r.north.toX - r.north.fromX + 1.2, 0],
      [r.west.x, (r.west.fromZ + r.west.toZ) / 2, r.west.toZ - r.west.fromZ, Math.PI / 2],
      [r.east.x, (r.east.fromZ + r.east.toZ) / 2, r.east.toZ - r.east.fromZ, Math.PI / 2],
      [r.landingEast.x, (r.landingEast.fromZ + r.landingEast.toZ) / 2, r.landingEast.toZ - r.landingEast.fromZ, Math.PI / 2],
    ];
    kerbs.forEach(([x, z, length, yaw]) => {
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(length, 0.34, 0.34), upstand);
      kerb.position.set(x, -0.05, z);
      kerb.rotation.y = yaw;
      kerb.castShadow = true;
      kerb.receiveShadow = true;
      this.scene.add(kerb);
    });
  }

  // --------------------------------------------------------------------- house

  private buildHouseWalls(): void {
    const render = new THREE.MeshStandardMaterial({
      map: tiled(createStuccoTexture(), 6, 2),
      color: HOUSE_YELLOW,
      roughness: 0.92,
    });
    const trim = new THREE.MeshStandardMaterial({ color: HOUSE_YELLOW_DARK, roughness: 0.9 });
    const interior = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 });

    const panel = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)),
        render,
      );
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    };

    // ---- south wall, with a window either side of centre
    const sz0 = WALL.southZ;
    const sz1 = WALL.southZ + WALL.thickness;
    const windows = BALCONY.southWindows;

    let cursor = DECK.minX - 2;
    windows.forEach((w) => {
      const x0 = w.centreX - w.width / 2;
      const x1 = w.centreX + w.width / 2;
      panel(cursor, x0, 0, WALL.height, sz0, sz1);
      panel(x0, x1, 0, w.sill, sz0, sz1);
      panel(x0, x1, w.sill + w.height, WALL.height, sz0, sz1);
      cursor = x1;

      // Glass, with the sunset reflected in it and the dark room behind
      const back = new THREE.Mesh(new THREE.PlaneGeometry(w.width, w.height), interior);
      back.position.set(w.centreX, w.sill + w.height / 2, sz0 - 0.02);
      back.rotation.y = Math.PI;
      this.scene.add(back);

      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(w.width, w.height),
        new THREE.MeshPhysicalMaterial({
          color: 0x2a3040,
          roughness: 0.08,
          metalness: 0.1,
          transmission: 0.25,
          transparent: true,
          opacity: 0.72,
          side: THREE.DoubleSide,
        }),
      );
      glass.position.set(w.centreX, w.sill + w.height / 2, sz0 - 0.04);
      this.scene.add(glass);

      const sill = new THREE.Mesh(new THREE.BoxGeometry(w.width + 0.4, 0.14, 0.34), trim);
      sill.position.set(w.centreX, w.sill - 0.05, sz0 - 0.12);
      sill.castShadow = true;
      this.scene.add(sill);
    });
    panel(cursor, WALL.southMaxX, 0, WALL.height, sz0, sz1);

    // The south wall ends where the balcony wraps to the stair, so its return
    // face needs closing off rather than showing a paper-thin edge.
    panel(WALL.southMaxX, WALL.southMaxX + 0.16, 0, WALL.height, sz0 - 0.16, sz1);

    // ---- west wall, from the end of the railing back to the house
    const door = BALCONY.livingRoomDoor;
    const wx0 = WALL.westX - WALL.thickness;
    const wx1 = WALL.westX;
    const dz0 = door.centreZ - door.width / 2;
    const dz1 = door.centreZ + door.width / 2;

    // A window between the corner and the door, so this wall is not five units
    // of blank render right where the player walks past it
    const win = { width: 2.8, height: 2.4, sill: 1.5, centre: (WALL.westFromZ + dz0) / 2 };
    const wz0 = win.centre - win.width / 2;
    const wz1 = win.centre + win.width / 2;

    // Run from the corner to the door, cut around the window
    panel(wx0, wx1, 0, WALL.height, WALL.westFromZ, wz0);
    panel(wx0, wx1, 0, win.sill, wz0, wz1);
    panel(wx0, wx1, win.sill + win.height, WALL.height, wz0, wz1);
    panel(wx0, wx1, 0, WALL.height, wz1, dz0);
    // Run from the door to the south wall, and the head over the door
    panel(wx0, wx1, 0, WALL.height, dz1, sz1);
    panel(wx0, wx1, door.height, WALL.height, dz0, dz1);

    // The doorway itself. A flat dark plane here reads as a painted-on hole
    // when you walk right up to it, so this is a shallow room you can see into:
    // a box turned inside out, with a lit floor and a lamp somewhere off left.
    const recessDepth = 5.0;
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(recessDepth, door.height + 0.6, door.width + 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2a1d16, roughness: 1, side: THREE.BackSide }),
    );
    recess.position.set(wx0 - recessDepth / 2 + 0.05, (door.height + 0.6) / 2 - 0.3, door.centreZ);
    this.scene.add(recess);

    const recessFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(recessDepth, door.width + 0.5),
      new THREE.MeshStandardMaterial({ color: 0x5a4028, roughness: 0.85 }),
    );
    recessFloor.rotation.x = -Math.PI / 2;
    recessFloor.rotation.z = Math.PI / 2;
    recessFloor.position.set(wx0 - recessDepth / 2 + 0.05, 0.01, door.centreZ);
    this.scene.add(recessFloor);

    // Warm light spilling out of the room beyond
    const inside = new THREE.PointLight(0xffb060, 6, 9, 2);
    inside.position.set(wx0 - 2.2, 1.6, door.centreZ - 0.6);
    this.scene.add(inside);

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.75 });
    [dz0, dz1].forEach((z) => {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(WALL.thickness + 0.14, door.height + 0.24, 0.22),
        frameMaterial,
      );
      jamb.position.set((wx0 + wx1) / 2, door.height / 2, z);
      jamb.castShadow = true;
      this.scene.add(jamb);
    });

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(WALL.thickness + 0.14, 0.24, door.width + 0.44),
      frameMaterial,
    );
    head.position.set((wx0 + wx1) / 2, door.height, door.centreZ);
    this.scene.add(head);

    // Glazing for that window: dark room behind, sunset reflected in the glass
    const westBack = new THREE.Mesh(
      new THREE.PlaneGeometry(win.width, win.height),
      interior,
    );
    westBack.rotation.y = Math.PI / 2;
    westBack.position.set(wx0 + 0.02, win.sill + win.height / 2, win.centre);
    this.scene.add(westBack);

    const westGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(win.width, win.height),
      new THREE.MeshPhysicalMaterial({
        color: 0x2a3040,
        roughness: 0.08,
        metalness: 0.1,
        transmission: 0.25,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      }),
    );
    westGlass.rotation.y = Math.PI / 2;
    westGlass.position.set(wx1 + 0.03, win.sill + win.height / 2, win.centre);
    this.scene.add(westGlass);

    const westSill = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, win.width + 0.4), trim);
    westSill.position.set(wx1 + 0.12, win.sill - 0.05, win.centre);
    westSill.castShadow = true;
    this.scene.add(westSill);

    // The corner where the west wall meets the railing, capped off
    panel(wx0, wx1 + 0.16, 0, WALL.height, WALL.westFromZ - 0.16, WALL.westFromZ);

    // ---- eaves overhanging both walls, throwing a shadow line down them
    const eave = new THREE.MeshStandardMaterial({ color: 0x8a7048, roughness: 0.9 });
    const southEave = new THREE.Mesh(
      new THREE.BoxGeometry(WALL.southMaxX - DECK.minX + 4, 0.34, 1.5),
      eave,
    );
    southEave.position.set((DECK.minX - 2 + WALL.southMaxX) / 2, WALL.height + 0.17, sz0 - 0.5);
    southEave.castShadow = true;
    this.scene.add(southEave);

    const westEave = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.34, sz1 - WALL.westFromZ),
      eave,
    );
    westEave.position.set(wx1 + 0.4, WALL.height + 0.17, (WALL.westFromZ + sz1) / 2);
    westEave.castShadow = true;
    this.scene.add(westEave);

    // A bug-blackened bulkhead light beside the door
    const lightBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0xf0e2c0,
        emissive: 0xffca70,
        emissiveIntensity: 0.6,
        roughness: 0.6,
      }),
    );
    lightBody.rotation.z = -Math.PI / 2;
    lightBody.position.set(wx1 + 0.05, door.height + 0.5, dz1 + 0.7);
    this.scene.add(lightBody);
  }

  /**
   * The head of the concrete staircase, dropping away toward the yard. Only the
   * top two treads are modelled — the rest is below the deck and out of sight.
   */
  /** Party lights strung along under the eaves and out to the corner post. */
  private buildStringLights(): void {
    const runs: [THREE.Vector3, THREE.Vector3, number][] = [
      [new THREE.Vector3(WALL.westX + 0.5, 3.5, 5.0), new THREE.Vector3(DECK.maxX - 0.5, 3.2, 4.0), this.lowDetail ? 9 : 15],
      [new THREE.Vector3(DECK.maxX - 0.5, 3.2, 4.0), new THREE.Vector3(DECK.maxX - 1.5, 3.6, WALL.southZ - 1), this.lowDetail ? 6 : 10],
    ];
    runs.forEach(([from, to, bulbs]) => {
      const lights = buildStringLights(from, to, bulbs, 0.9);
      this.scene.add(lights.group);
      this.animated.push(lights.animated);
    });

    // Posts carrying the outer end of the run
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 3.4, 8),
      new THREE.MeshStandardMaterial({ color: ORANGE_DARK, roughness: 0.5, metalness: 0.35 }),
    );
    post.position.set(DECK.maxX - 0.5, 1.7, 4.0);
    post.castShadow = true;
    this.scene.add(post);
  }

  /**
   * The head of the concrete staircase. Only the top few treads are modelled —
   * below that the flight is under the deck and out of sight from up here.
   */
  private buildStairHead(): void {
    const concrete = new THREE.MeshStandardMaterial({
      map: tiled(createConcreteTexture(), 2, 2),
      color: 0xb4aea2,
      roughness: 0.95,
    });

    const well = BALCONY.stairWell;
    const width = well.maxX - well.minX;
    const centreX = (well.minX + well.maxX) / 2;
    const steps = 5;
    const run = (well.maxZ - well.minZ) / steps;
    const rise = 0.46;

    for (let i = 0; i < steps; i++) {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, run), concrete);
      tread.position.set(centreX, -0.2 - i * rise, well.minZ + run * (i + 0.5));
      tread.castShadow = true;
      tread.receiveShadow = true;
      this.scene.add(tread);

      const riser = new THREE.Mesh(new THREE.BoxGeometry(width, rise, 0.14), concrete);
      riser.position.set(centreX, -0.2 - i * rise + rise / 2, well.minZ + run * i);
      riser.receiveShadow = true;
      this.scene.add(riser);
    }

    // Cheeks either side, closing the flight in
    [well.minX, well.maxX].forEach((x) => {
      const cheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 2.6, well.maxZ - well.minZ + 0.4),
        concrete,
      );
      cheek.position.set(x, -1.3, (well.minZ + well.maxZ) / 2);
      cheek.castShadow = true;
      cheek.receiveShadow = true;
      this.scene.add(cheek);
    });

    // Balustrade following the flight down, and a run closing off the top
    this.scene.add(
      balustrade(
        new THREE.Vector3(well.minX, 0, well.minZ),
        new THREE.Vector3(well.minX, -steps * rise, well.maxZ),
        BALCONY.railHeight,
      ),
    );
    this.scene.add(
      balustrade(
        new THREE.Vector3(well.maxX, 0, well.minZ),
        new THREE.Vector3(well.maxX, -steps * rise, well.maxZ),
        BALCONY.railHeight,
      ),
    );
    // Newel post where your hand lands on the way down
    [well.minX, well.maxX].forEach((x) => {
      const newel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, BALCONY.railHeight + 0.25, 10),
        new THREE.MeshStandardMaterial({ color: ORANGE_DARK, roughness: 0.4, metalness: 0.4 }),
      );
      newel.position.set(x, (BALCONY.railHeight + 0.25) / 2, well.minZ);
      newel.castShadow = true;
      this.scene.add(newel);
    });
  }

  // ----------------------------------------------------------------- furniture

  protected createFurnitureNode(f: Furniture): THREE.Object3D | null {
    switch (f.type) {
      // The railings are drawn as continuous runs in buildRailings, so the
      // per-tile entries only matter for collision.
      case 'railing':
        return null;

      case 'bbq':
        return this.turned(buildBBQ(f.width, f.height), Math.PI);

      case 'outdoor_couch':
        // Backed against the house, looking out at the view
        return this.turned(buildOutdoorCouch(f.width, f.height), Math.PI);

      case 'outdoor_chair':
        return buildOutdoorChair(f.x * 31 + f.y * 17);

      case 'outdoor_table':
        return buildOutdoorTable();

      case 'potplant': {
        const plant = buildPotPlant(f.x * 13 + f.y * 7, 0.95);
        this.animated.push(plant.animated);
        return plant.group;
      }

      case 'potplant_large': {
        const plant = buildPotPlant(f.x * 5 + f.y * 3, 1.5);
        this.animated.push(plant.animated);
        return plant.group;
      }

      case 'compost': {
        const bin = buildCompostBin();
        this.animated.push(bin.animated);
        return bin.group;
      }

      // The string-lights tile is only an anchor; the runs themselves are
      // strung across the whole deck in buildStringLights.
      case 'string_lights':
        return null;

      case 'hollandia_can': {
        const { group, animated } = buildHollandiaCan();
        this.animated.push(animated);
        return group;
      }

      default:
        return null;
    }
  }

  private turned(group: THREE.Group, yaw: number): THREE.Group {
    group.rotation.y = yaw;
    return group;
  }

  protected buildCompanion(type: string): Character | null {
    return type === 'mr_tibbles' ? buildMrTibbles(0.85) : null;
  }

  private buildExits(): void {
    const door = BALCONY.livingRoomDoor;
    const livingRoom = makeLabelSprite('LIVING ROOM');
    livingRoom.position.set(WALL.westX + 0.6, door.height + 0.7, door.centreZ);
    this.addLabel(livingRoom);

    const backyard = makeLabelSprite('BACKYARD');
    backyard.position.set(
      (BALCONY.stairWell.minX + BALCONY.stairWell.maxX) / 2,
      BALCONY.railHeight + 1.3,
      BALCONY.stairWell.minZ + 0.5,
    );
    this.addLabel(backyard);
  }

  // ---------------------------------------------------------------------- frame

  update(time: number, delta: number, playerPos: THREE.Vector3): void {
    super.update(time, delta, playerPos);

    // Clouds drift and wrap round
    this.clouds.forEach((cloud) => {
      cloud.sprite.position.x = ((cloud.baseX + time * cloud.speed + 400) % 900) - 460;
    });

    // Birds cross the sky on a long loop, flapping out of phase down the skein
    this.birds.forEach((flock, index) => {
      const t = (time * 0.035 + flock.offset) % 1;
      flock.group.position.set(-320 + t * 720, 46 + index * 16, -150 - index * 60);
      flock.group.rotation.y = Math.PI / 2;
      flock.wings.forEach((wing, i) => {
        wing.rotation.z = Math.sin(time * 7 + i * 0.4) * 0.5 * (i % 2 === 0 ? 1 : -1);
      });
    });

    // Keep the shadow camera on the player so the long sunset shadows stay sharp
    const offset = SUN_POSITION.clone().normalize().multiplyScalar(60);
    this.sun.position.set(playerPos.x + offset.x, offset.y, playerPos.z + offset.z);
    this.sun.target.position.set(playerPos.x, 0, playerPos.z);
    this.sun.target.updateMatrixWorld();
  }
}
