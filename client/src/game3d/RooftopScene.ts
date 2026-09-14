/**
 * The rooftop. Corrugated iron, a scaffold-pipe rail round three sides, and
 * ten subletters who have been up here the entire game waiting for someone to
 * notice. Below the north rail is the backyard you started in, with the kiddy
 * pool you are shortly going to have to jump into.
 *
 * This is the only room that is not 20 tiles wide, so nothing here may assume
 * GRID_W — the railings are driven off the room's own furniture list.
 */

import * as THREE from 'three';
import { ROOFTOP, gridToWorldX, gridToWorldZ } from './constants';
import { buildStringLights } from './downstairsProps';
import {
  buildAcUnit,
  buildChimney,
  buildEsky,
  buildLadderHead,
  buildLawnChair,
  buildRoofRailing,
  buildSatelliteDish,
  buildSubletter,
} from './rooftopProps';
import { createCorrugatedIronTexture, createPuffTexture, tiled } from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const W = ROOFTOP.width;
const D = ROOFTOP.depth;
const DROP = ROOFTOP.heightAboveYard;

const SKY_VERTEX = `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Night, with the suburb's light pollution sitting in a band on the horizon. */
const SKY_FRAGMENT = `
  varying vec3 vWorld;
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHaze;

  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y * 1.3 + 0.04, -1.0, 1.0);
    vec3 sky = mix(uMid, uZenith, smoothstep(0.1, 0.8, h));
    sky = mix(uHaze, sky, smoothstep(-0.08, 0.22, h));
    gl_FragColor = vec4(sky, 1.0);
  }
`;

export class RooftopScene extends PovScene {
  /**
   * You come up the ladder in the south-east corner. Looking back across the
   * roof takes in the chimney, the dish and most of the ten of them.
   */
  readonly focus = { x: 9, y: 4 };

  private readonly lowDetail: boolean;

  constructor(room: RoomLike, lowDetail: boolean) {
    super();
    this.lowDetail = lowDetail;

    this.scene.fog = new THREE.Fog(0x141a30, 40, 210);
    this.scene.background = new THREE.Color(0x0a0d1c);

    this.buildSky();
    this.buildLighting();
    this.buildRoof();
    this.buildRailings(room);
    this.buildBelow();
    this.buildPartyLights();
    this.buildFurniture(room);
    this.buildExits();
  }

  private buildSky(): void {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(440, 32, 24),
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new THREE.Color(0x05060f) },
          uMid: { value: new THREE.Color(0x12193a) },
          uHaze: { value: new THREE.Color(0x4a3a4e) },
        },
      }),
    );
    sky.position.set(W / 2, 0, D / 2);
    this.scene.add(sky);

    const count = this.lowDetail ? 300 : 700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 + 0.08);
      const r = 400;
      positions[i * 3] = W / 2 + Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r;
      positions[i * 3 + 2] = D / 2 + Math.sin(phi) * Math.sin(theta) * r;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.scene.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0xf0f4ff,
          size: 1.9,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.85,
          fog: false,
          depthWrite: false,
        }),
      ),
    );

    // The moon, well round to the west so it rakes across the iron. A disc,
    // because an untextured sprite renders as a plain square; the soft edge is
    // the halo behind it.
    const moonPosition = new THREE.Vector3(-260, 150, -120);
    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(9, 28),
      new THREE.MeshBasicMaterial({ color: 0xfff4e0, fog: false }),
    );
    moon.position.copy(moonPosition);
    moon.lookAt(W / 2, 1.4, D / 2);
    this.scene.add(moon);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createPuffTexture(),
        color: 0xa8c0ff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        fog: false,
        depthWrite: false,
      }),
    );
    halo.scale.set(80, 80, 1);
    halo.position.copy(moonPosition);
    this.scene.add(halo);
  }

  private buildLighting(): void {
    this.scene.add(new THREE.AmbientLight(0x424f82, 1.6));
    // Ground half is the suburb's sodium glow coming back up off everything
    this.scene.add(new THREE.HemisphereLight(0x5c6ea8, 0x6a4f36, 1.4));

    const moonlight = new THREE.DirectionalLight(0xa8c2ff, 1.5);
    moonlight.position.set(-52, 38, -30);
    moonlight.target.position.set(W / 2, 0, D / 2);
    moonlight.castShadow = true;
    moonlight.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    moonlight.shadow.camera.near = 1;
    moonlight.shadow.camera.far = 150;
    moonlight.shadow.camera.left = -34;
    moonlight.shadow.camera.right = 34;
    moonlight.shadow.camera.top = 34;
    moonlight.shadow.camera.bottom = -34;
    moonlight.shadow.bias = -0.0008;
    moonlight.shadow.normalBias = 0.04;
    this.scene.add(moonlight);
    this.scene.add(moonlight.target);

    // Streetlights below, throwing orange up over the edge of the roof
    const upglow = new THREE.DirectionalLight(0xff9c4e, 0.45);
    upglow.position.set(W / 2, -14, D + 30);
    upglow.target.position.set(W / 2, 1, D / 2);
    this.scene.add(upglow);
    this.scene.add(upglow.target);
  }

  private buildRoof(): void {
    const iron = new THREE.MeshStandardMaterial({
      map: tiled(createCorrugatedIronTexture(), W * 0.16, D * 0.05),
      color: 0x6f7682,
      roughness: 0.66,
      metalness: 0.5,
    });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(W, 0.24, D), iron);
    deck.position.set(W / 2, -0.12, D / 2);
    deck.receiveShadow = true;
    this.scene.add(deck);

    // Ridge capping along the north edge, where the roof carries on over the
    // rest of the house and out of the room
    const ridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, W, 10, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x8a919c, roughness: 0.55, metalness: 0.55 }),
    );
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(W / 2, 0.06, 0.4);
    ridge.castShadow = true;
    this.scene.add(ridge);

    // Gutter round the three open edges
    const gutter = new THREE.MeshStandardMaterial({ color: 0x77808c, roughness: 0.6, metalness: 0.5 });
    ([
      [W / 2, D, W, 0],
      [0, D / 2, D, Math.PI / 2],
      [W, D / 2, D, Math.PI / 2],
    ] as [number, number, number, number][]).forEach(([x, z, length, yaw]) => {
      const run = new THREE.Mesh(new THREE.BoxGeometry(length, 0.26, 0.34), gutter);
      run.position.set(x, -0.1, z);
      run.rotation.y = yaw;
      run.castShadow = true;
      this.scene.add(run);
    });
  }

  /**
   * The 2D room lists the edge as one `roof_edge` per tile. Drawing 54 separate
   * railings is a waste, so those tiles render nothing and the runs are built
   * once each here.
   */
  private buildRailings(room: RoomLike): void {
    const spans: [number, number, number, number][] = [
      // centre x, centre z, length, yaw
      [W / 2, gridToWorldZ(0), W, 0],
      [gridToWorldX(0), D / 2 + 1, D - 2, Math.PI / 2],
      [gridToWorldX(room.width - 1), D / 2 + 1, D - 2, Math.PI / 2],
    ];

    spans.forEach(([x, z, length, yaw]) => {
      const railing = buildRoofRailing(length);
      railing.position.set(x, 0, z);
      railing.rotation.y = yaw;
      this.scene.add(railing);
    });
  }

  /** What you can see over the rails: the yard behind, the street in front. */
  private buildBelow(): void {
    // The backyard, a long way down past the north rail. The kiddy pool is the
    // one thing up here that matters — it is where the game ends.
    const yard = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 60),
      new THREE.MeshStandardMaterial({ color: 0x3c5433, roughness: 1 }),
    );
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(W / 2, -DROP, -32);
    this.scene.add(yard);

    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.4, 0.7, 20),
      new THREE.MeshStandardMaterial({ color: 0xf25ba6, roughness: 0.6 }),
    );
    pool.position.set(W / 2 - 3, -DROP + 0.35, -13);
    this.scene.add(pool);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 20),
      new THREE.MeshStandardMaterial({
        color: 0x2fa8d8,
        roughness: 0.12,
        metalness: 0.2,
        emissive: 0x11384a,
        emissiveIntensity: 0.6,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(W / 2 - 3, -DROP + 0.62, -13);
    this.scene.add(water);

    // Fences, and the neighbours' roofs all round
    const fence = new THREE.Mesh(
      new THREE.BoxGeometry(90, 2.6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x4a3722, roughness: 1 }),
    );
    fence.position.set(W / 2, -DROP + 1.3, -52);
    this.scene.add(fence);

    const silhouette = new THREE.MeshStandardMaterial({ color: 0x232a44, roughness: 1 });
    const roofs: [number, number, number, number, number][] = [
      // x, z, width, ridge height, y offset below
      [-46, -40, 30, 9, 4],
      [92, -34, 28, 8, 4],
      [-38, 70, 26, 8, 3],
      [30, 96, 34, 11, 3],
      [104, 76, 30, 9, 3],
    ];
    roofs.forEach(([x, z, width, ridge, lift]) => {
      const shape = new THREE.Shape();
      shape.moveTo(-width / 2, 0);
      shape.lineTo(-width / 2, ridge * 0.5);
      shape.lineTo(0, ridge);
      shape.lineTo(width / 2, ridge * 0.5);
      shape.lineTo(width / 2, 0);
      shape.closePath();
      const house = new THREE.Mesh(new THREE.ShapeGeometry(shape), silhouette);
      house.position.set(x, -DROP + lift, z);
      // Face the middle of the roof, so they read as silhouettes from up here
      house.lookAt(W / 2, -DROP + lift + ridge / 2, D / 2);
      this.scene.add(house);
    });

    // The city, a long way off, as a band of lit blocks on the horizon
    const cityMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3050,
      emissive: 0x3d4a7a,
      emissiveIntensity: 0.45,
      roughness: 1,
      fog: false,
    });
    for (let i = 0; i < 22; i++) {
      const height = 5 + Math.random() * 20;
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(4 + Math.random() * 6, height, 5),
        cityMaterial,
      );
      tower.position.set(-190 + i * 19 + Math.random() * 8, -DROP + height / 2, -330);
      this.scene.add(tower);
    }

    // and the glow it puts into the sky above itself
    const cityGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createPuffTexture(),
        color: 0xffb070,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        fog: false,
        depthWrite: false,
      }),
    );
    cityGlow.scale.set(260, 44, 1);
    cityGlow.position.set(W / 2, -DROP + 16, -248);
    this.scene.add(cityGlow);

    // Streetlights out the front, over the south rail
    [-24, 34, 88].forEach((x, i) => {
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createPuffTexture(),
          color: 0xffa850,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          fog: false,
          depthWrite: false,
        }),
      );
      glow.scale.set(7, 7, 1);
      glow.position.set(x, -DROP + 8, D + 40 + i * 14);
      this.scene.add(glow);
    });
  }

  /** The party rig: lights strung from the chimney across to the dish and the AC. */
  private buildPartyLights(): void {
    const runs: [THREE.Vector3, THREE.Vector3][] = [
      [
        new THREE.Vector3(gridToWorldX(3.5), 3.8, gridToWorldZ(2.5)),
        new THREE.Vector3(gridToWorldX(10.5), 3.3, gridToWorldZ(2.5)),
      ],
      [
        new THREE.Vector3(gridToWorldX(10.5), 3.3, gridToWorldZ(2.5)),
        new THREE.Vector3(gridToWorldX(19), 2.6, gridToWorldZ(3.5)),
      ],
      [
        new THREE.Vector3(gridToWorldX(3.5), 3.6, gridToWorldZ(2.5)),
        new THREE.Vector3(gridToWorldX(15.5), 2.3, gridToWorldZ(8)),
      ],
    ];

    runs.forEach(([from, to], i) => {
      const lights = buildStringLights(from, to, this.lowDetail ? 10 : 18, 0.9 + i * 0.2);
      this.scene.add(lights.group);
      this.animated.push(lights.animated);
    });

    // Strings of bulbs read as decoration rather than lighting unless something
    // actually lands on the people standing under them.
    ([
      [gridToWorldX(7), 2.4],
      [gridToWorldX(13), 2.2],
      [gridToWorldX(18), 2.2],
    ] as [number, number][]).forEach(([x, y]) => {
      const lamp = new THREE.PointLight(0xffc98a, 6.5, 16, 2);
      lamp.position.set(x, y, gridToWorldZ(5));
      this.scene.add(lamp);
    });
  }

  // ----------------------------------------------------------------- furniture

  protected createFurnitureNode(f: Furniture): THREE.Object3D | null {
    if (f.type.startsWith('subletter_')) {
      // Added straight to the scene rather than parented: each of them works
      // out which way to look from their own position, and nested that
      // position is local and they all end up facing the same way.
      const person = buildSubletter(f.type, f.x * 61 + f.y * 13);
      // Built at human proportions, then scaled to this world, where a tile is
      // two units and the camp chairs they are sitting in are a metre wide.
      person.group.scale.setScalar(1.45);
      person.group.position.set(gridToWorldX(f.x), 0, gridToWorldZ(f.y));
      person.group.rotation.y = ((f.x * 37 + f.y * 11) % 100) / 100 * Math.PI * 2;
      this.scene.add(person.group);
      this.characters.push(person);
      return null;
    }

    switch (f.type) {
      // Drawn as three continuous runs in buildRailings, not 54 tiles
      case 'roof_edge':
        return null;

      case 'chimney':
        return buildChimney(f.width, f.height);

      case 'ac_unit': {
        const unit = buildAcUnit(f.width, f.height);
        this.animated.push(unit.animated);
        return unit.group;
      }

      case 'satellite_dish':
        return buildSatelliteDish(f.width);

      case 'cooler':
        return buildEsky(f.width, f.height);

      case 'lawn_chair':
        return buildLawnChair(f.x * 29 + f.y * 7);

      default:
        return null;
    }
  }

  private buildExits(): void {
    // The ladder head, poking over the south-east corner where you came up
    const ladder = buildLadderHead();
    ladder.position.set(gridToWorldX(22.4), 0, D - 0.3);
    this.scene.add(ladder);

    const climbDown = makeLabelSprite('CLIMB DOWN');
    climbDown.position.set(gridToWorldX(22.4), 2.6, D - 0.6);
    this.addLabel(climbDown);
  }
}
