/**
 * The front porch: the verandah wrapping the front and the side of the
 * Queenslander, half an hour after the sunset you watched from the balcony.
 *
 * The house is behind you and to your right; the deck runs out to the west and
 * south, where the front steps go down to the path, the picket fence and a
 * street that has already switched its lights on. Only the northern rows are
 * actually walkable — everything from row 12 south is the flight and the drop
 * to the yard, which the 2D collision map knows nothing about.
 *
 * Humunculous is out here, missing a foot, waiting for someone to bring him an
 * x-ray of it.
 */

import * as THREE from 'three';
import {
  FRONT_PORCH,
  FRONT_PORCH_BLOCKERS,
  gridToWorldX,
  gridToWorldZ,
} from './constants';
import { applyWorldUVs, buildHollandiaCan, buildLadder, createPickupGlow } from './props';
import {
  TRIM_GREEN,
  buildBougainvillea,
  buildBreezeBlockFence,
  buildFacadeWindow,
  buildFlatVerandahRoof,
  buildFrontDoor,
  buildFrontGate,
  buildGreenBalustrade,
  buildPalm,
  buildPorchChair,
  buildPorchLight,
  buildPorchSteps,
  buildPorchTable,
  buildSteelPost,
  buildStreetSign,
  buildStreetlight,
  buildWeatherboardWall,
  buildWelcomeMat,
  buildWheelieBin,
} from './frontPorchProps';
import { buildPotPlant } from './balconyProps';
import { buildHumunculous } from './characters';
import { createDeckingTexture, createGrassTexture, createPuffTexture, tiled } from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const W = FRONT_PORCH.width;
const D = FRONT_PORCH.depth;
const DECK_Z = FRONT_PORCH.deckMaxZ;
const DROP = FRONT_PORCH.dropToGround;
const ROOF = FRONT_PORCH.roof;
const FACADE = FRONT_PORCH.facade;

const SKY_VERTEX = `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Afternoon: deep blue overhead washing out to a pale, slightly hazy band at
 * the rooflines, which is what a Brisbane sky actually does — the horizon is
 * never the same blue as the zenith.
 */
const SKY_FRAGMENT = `
  varying vec3 vWorld;
  uniform vec3 uHigh;
  uniform vec3 uMid;
  uniform vec3 uLow;
  uniform vec3 uEmber;
  uniform vec3 uSunDir;

  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y * 1.25 + 0.06, -1.0, 1.0);

    vec3 sky = mix(uMid, uHigh, smoothstep(0.12, 0.75, h));
    sky = mix(uLow, sky, smoothstep(-0.06, 0.2, h));

    // Sun glare, tight around the sun itself rather than spread along the
    // horizon the way a sunset's is
    float toward = max(dot(dir, normalize(uSunDir)), 0.0);
    sky = mix(sky, uEmber, clamp(pow(toward, 7.0) * 0.8, 0.0, 1.0));

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export class FrontPorchScene extends PovScene {
  readonly blockers = FRONT_PORCH_BLOCKERS;
  /**
   * You arrive near the front edge, facing back at the house: the lit windows,
   * the front door and the lace, with Humunculous off at the right-hand end of
   * the verandah. The street is over your shoulder for whenever you turn round.
   */
  readonly focus = { x: 16, y: 4 };

  private readonly lowDetail: boolean;

  constructor(room: RoomLike, lowDetail: boolean) {
    super();
    this.lowDetail = lowDetail;

    // Daylight haze rather than dusk: far enough back that the neighbours are
    // still readable, tinted to the pale end of the sky so it reads as distance.
    this.scene.fog = new THREE.Fog(0xbcd2e8, 90, 320);
    this.scene.background = new THREE.Color(0x8fbce0);

    this.buildSky();
    this.buildLighting();
    this.buildDeck();
    this.buildHouse();
    this.buildVerandahRoof();
    this.buildBalustrades();
    this.buildFrontYard();
    this.buildFurniture(room);
    this.buildExits();
  }

  // ----------------------------------------------------------------------- sky

  private buildSky(): void {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(420, 32, 24),
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uHigh: { value: new THREE.Color(0x3f7fc8) },
          uMid: { value: new THREE.Color(0x76abdc) },
          uLow: { value: new THREE.Color(0xcfe2f0) },
          uEmber: { value: new THREE.Color(0xfff4d8) },
          uSunDir: { value: new THREE.Vector3(-0.5, 0.62, 0.6).normalize() },
        },
      }),
    );
    sky.position.set(W / 2, 0, D / 2);
    this.scene.add(sky);

    // Afternoon cloud, high and thin
    const puff = createPuffTexture();
    const count = this.lowDetail ? 10 : 20;
    for (let i = 0; i < count; i++) {
      const cloud = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: puff,
          color: 0xffffff,
          transparent: true,
          opacity: 0.5 + Math.random() * 0.35,
          depthWrite: false,
          fog: false,
        }),
      );
      const size = 50 + Math.random() * 90;
      cloud.scale.set(size, size * (0.34 + Math.random() * 0.22), 1);
      // Well out toward the sky sphere. Closer in, a sprite this size fills a
      // corner of the screen and reads as a sheet hanging off the roof.
      const angle = Math.random() * Math.PI * 2;
      const radius = 300 + Math.random() * 90;
      cloud.position.set(
        W / 2 + Math.cos(angle) * radius,
        90 + Math.random() * 90,
        D / 2 + Math.sin(angle) * radius,
      );
      this.scene.add(cloud);
    }
  }

  private buildLighting(): void {
    // A verandah is a roof over an outdoor room, so almost everything you stand
    // on is in shade and the sky is doing the lighting. Both of these have to
    // be generous or the deck goes to mud under a bright sky.
    this.scene.add(new THREE.AmbientLight(0xc8dcf0, 2.2));
    this.scene.add(new THREE.HemisphereLight(0xbcdcff, 0x8a7a58, 2.0));

    // Mid-afternoon sun, round to the west so it still rakes in under the roof
    const sun = new THREE.DirectionalLight(0xfff0d0, 3.2);
    sun.position.set(-70, 54, 44);
    sun.target.position.set(W * 0.6, 1, D * 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 160;
    sun.shadow.camera.left = -26;
    sun.shadow.camera.right = 26;
    sun.shadow.camera.top = 26;
    sun.shadow.camera.bottom = -26;
    sun.shadow.bias = -0.0012;
    sun.shadow.normalBias = 0.09;
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Sky fill from the opposite side, so shadowed faces are blue rather than black
    const fill = new THREE.DirectionalLight(0xa8c8f0, 0.9);
    fill.position.set(60, 40, -30);
    fill.target.position.set(W / 2, 1, D / 2);
    this.scene.add(fill);
    this.scene.add(fill.target);

    // Sun off a bright timber deck goes straight back up into the roof. Without
    // this the underside of the iron is the one black thing in a daylight scene,
    // and it is directly overhead in almost every view.
    const bounce = new THREE.DirectionalLight(0xffe0b4, 1.5);
    bounce.position.set(W / 2, -6, D * 0.7);
    bounce.target.position.set(W / 2, ROOF.wallY, D * 0.2);
    this.scene.add(bounce);
    this.scene.add(bounce.target);
  }

  // ---------------------------------------------------------------------- deck

  private buildDeck(): void {
    const deckMaterial = new THREE.MeshStandardMaterial({
      map: tiled(createDeckingTexture(), W * 0.24, DECK_Z * 0.24),
      color: 0xb99169,
      roughness: 0.82,
      metalness: 0.02,
    });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, DECK_Z), deckMaterial);
    deck.position.set(W / 2, -0.15, DECK_Z / 2);
    deck.receiveShadow = true;
    this.scene.add(deck);

    // Bearer and the lattice skirt that hides the stumps, which is what you
    // see of the underside of a Queenslander from the garden
    const bearer = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.35, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x6d5236, roughness: 0.92 }),
    );
    bearer.position.set(W / 2, -0.5, DECK_Z - 0.15);
    bearer.castShadow = true;
    this.scene.add(bearer);

    const lattice = new THREE.Mesh(
      new THREE.BoxGeometry(W, DROP - 0.7, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x8a7350, roughness: 0.95 }),
    );
    lattice.position.set(W / 2, -0.7 - (DROP - 0.7) / 2, DECK_Z - 0.2);
    this.scene.add(lattice);

    for (let i = 0; i < 26; i++) {
      [-1, 1].forEach((lean) => {
        const slat = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, DROP + 1.6, 0.03),
          new THREE.MeshStandardMaterial({ color: 0xc2ab86, roughness: 0.9 }),
        );
        slat.position.set((i / 25) * W, -0.7 - (DROP - 0.7) / 2, DECK_Z - 0.14);
        slat.rotation.z = lean * 0.72;
        this.scene.add(slat);
      });
    }

    // Stumps, marching off under the house
    for (let i = 0; i < 5; i++) {
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, DROP, 8),
        new THREE.MeshStandardMaterial({ color: 0x4f4034, roughness: 0.96 }),
      );
      stump.position.set(3 + i * 8.5, -DROP / 2, DECK_Z - 1.6);
      this.scene.add(stump);
    }
  }

  // --------------------------------------------------------------------- house

  /** Front wall along the north, side wall along the east, both weatherboard. */
  private buildHouse(): void {
    const door = FRONT_PORCH.frontDoor;

    // North wall, in runs either side of the front door
    const northRuns: [number, number][] = [
      [-FACADE.thickness, door.centre - door.width / 2],
      [door.centre + door.width / 2, W + FACADE.thickness],
    ];
    northRuns.forEach(([x0, x1]) => {
      const wall = buildWeatherboardWall(x1 - x0, FACADE.height, FACADE.thickness);
      wall.position.set((x0 + x1) / 2, FACADE.height / 2, -FACADE.thickness / 2);
      this.scene.add(wall);
    });

    // Over the door
    const overDoor = buildWeatherboardWall(
      door.width,
      FACADE.height - door.height - 0.3,
      FACADE.thickness,
    );
    overDoor.position.set(
      door.centre,
      door.height + 0.3 + (FACADE.height - door.height - 0.3) / 2,
      -FACADE.thickness / 2,
    );
    this.scene.add(overDoor);

    // Standing open, because it is the only way into the house
    const frontDoor = buildFrontDoor(door.width, door.height, 1.15);
    frontDoor.position.set(door.centre, 0, 0.02);
    this.scene.add(frontDoor);

    // The hallway behind it, turned inside out, so the opening reads as
    // somewhere to go rather than a black rectangle
    const hallDepth = 6;
    const hall = new THREE.Mesh(
      new THREE.BoxGeometry(door.width * 0.6, door.height + 0.6, hallDepth),
      new THREE.MeshStandardMaterial({ color: 0xb9a888, roughness: 1, side: THREE.BackSide }),
    );
    hall.position.set(door.centre, door.height / 2, -FACADE.thickness - hallDepth / 2);
    this.scene.add(hall);

    const hallFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(door.width * 0.6, hallDepth),
      new THREE.MeshStandardMaterial({ color: 0xa87d4e, roughness: 0.7 }),
    );
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(door.centre, 0.01, -FACADE.thickness - hallDepth / 2);
    this.scene.add(hallFloor);

    const hallLight = new THREE.PointLight(0xffe0b0, 4.5, 12, 2);
    hallLight.position.set(door.centre, 2.2, -FACADE.thickness - 1.8);
    this.scene.add(hallLight);

    // The light over the door, off — it is the middle of the afternoon
    const porchLight = buildPorchLight();
    porchLight.group.position.set(door.centre + door.width / 2 + 0.7, door.height + 0.5, 0.05);
    this.scene.add(porchLight.group);
    this.animated.push(porchLight.animated);

    // House number, because Adele needs to be able to find it
    const numberPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x24282e, roughness: 0.6 }),
    );
    numberPlate.position.set(door.centre - door.width / 2 - 0.7, door.height * 0.62, 0.06);
    this.scene.add(numberPlate);

    FRONT_PORCH.windows.forEach((spec) => {
      const window = buildFacadeWindow(spec.width, spec.height);
      window.position.set(spec.along, spec.sill + spec.height / 2, 0.06);
      this.scene.add(window);

    });

    // East wall: unbroken. The front door is the only way in.
    const eastWall = buildWeatherboardWall(DECK_Z + 2 + FACADE.thickness, FACADE.height, FACADE.thickness);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.position.set(
      W + FACADE.thickness / 2,
      FACADE.height / 2,
      (DECK_Z + 2 - FACADE.thickness) / 2,
    );
    this.scene.add(eastWall);

    // The house going up above the verandah roof, seen from the yard
    const upper = buildWeatherboardWall(W + FACADE.thickness * 2, 4, FACADE.thickness);
    upper.position.set(W / 2, FACADE.height + 1.6, -FACADE.thickness / 2);
    this.scene.add(upper);
  }

  private buildVerandahRoof(): void {
    const roof = buildFlatVerandahRoof(W + 1.2, ROOF.frontZ, ROOF.wallY, ROOF.frontY, ROOF.thickness);
    roof.position.set(W / 2, 0, 0);
    this.scene.add(roof);

    // Plain green steel posts, which is what the real house has. The turned
    // timber and cast-iron lace belonged to a house fifty years older.
    const postZ = gridToWorldZ(FRONT_PORCH.postGridY);
    FRONT_PORCH.postGridX.forEach((gx) => {
      const post = buildSteelPost(ROOF.frontY - 0.52);
      post.position.set(gridToWorldX(gx), 0, postZ);
      this.scene.add(post);
    });

    // The two posts the 2D room actually lists, further in under the deep end
    [2, 17].forEach((gx) => {
      const post = buildSteelPost(ROOF.wallY - 0.4);
      post.position.set(gridToWorldX(gx), 0, gridToWorldZ(3));
      this.scene.add(post);
    });
  }

  private buildBalustrades(): void {
    const railHeight = 1.15;
    const steps = FRONT_PORCH.steps;

    // Green steel with pale infill bars. The orange wavy bars are the back
    // balcony's — the front of this house is green and straight.
    const runs: [number, number, number, number][] = [
      // centre x, centre z, length, yaw
      [steps.fromX / 2, DECK_Z, steps.fromX, 0],
      [(steps.toX + W) / 2, DECK_Z, W - steps.toX, 0],
      [0, DECK_Z / 2, DECK_Z, Math.PI / 2],
    ];

    runs.forEach(([x, z, length, yaw]) => {
      if (length < 0.4) return;
      const rail = buildGreenBalustrade(length, railHeight);
      rail.position.set(x, 0, z);
      rail.rotation.y = yaw;
      this.scene.add(rail);
    });
  }

  // ----------------------------------------------------------------- the yard

  /** Everything below and beyond the deck: lawn, path, fence, street, sky. */
  private buildFrontYard(): void {
    const steps = FRONT_PORCH.steps;

    const flight = buildPorchSteps(steps.toX - steps.fromX, DROP, FRONT_PORCH.steps.count);
    flight.position.set((steps.fromX + steps.toX) / 2, 0, DECK_Z);
    this.scene.add(flight);

    // Lawn, running away to the street. Dusk has taken most of the green out
    // of it, so the map is knocked well back rather than left at daylight.
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 90),
      new THREE.MeshStandardMaterial({
        map: tiled(createGrassTexture(), 60, 36),
        color: 0x86a86a,
        roughness: 1,
      }),
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(W / 2, -DROP, DECK_Z + 20);
    this.scene.add(lawn);

    // Concrete path from the bottom of the steps to the gate
    // Weathered concrete, not fresh: at this sun angle a pale grey slab this
    // size is the brightest thing in the scene by a mile.
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(steps.toX - steps.fromX - 8, 15),
      new THREE.MeshStandardMaterial({ color: 0x8e8a80, roughness: 1 }),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set((steps.fromX + steps.toX) / 2, -DROP + 0.02, DECK_Z + 8);
    this.scene.add(path);

    // Rendered front wall with a course of pierced breeze blocks and a green
    // capping, broken for the driveway gate. Not a picket fence — this is a
    // 1960s Brisbane front wall and the blocks are half its character.
    const gateWidth = 5.2;
    const gateCentre = (steps.fromX + steps.toX) / 2;
    ([
      [-48 + (gateCentre - gateWidth / 2 + 48) / 2, gateCentre - gateWidth / 2 + 48],
      [(gateCentre + gateWidth / 2 + 48) / 2, 48 - gateCentre - gateWidth / 2],
    ] as [number, number][]).forEach(([centre, length]) => {
      if (length < 1) return;
      const wall = buildBreezeBlockFence(length);
      wall.position.set(centre, -DROP, DECK_Z + 14);
      this.scene.add(wall);
    });

    const gate = buildFrontGate(gateWidth);
    gate.position.set(gateCentre, -DROP, DECK_Z + 14);
    this.scene.add(gate);

    // Number 9 on the pier beside the gate
    const numberPier = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 2.1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xe0d7bf, roughness: 0.96 }),
    );
    numberPier.position.set(gateCentre + gateWidth / 2 + 0.4, -DROP + 1.05, DECK_Z + 14);
    numberPier.castShadow = true;
    this.scene.add(numberPier);

    // Road beyond the fence, and the far side of the street
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(190, 16),
      new THREE.MeshStandardMaterial({ color: 0x5a5a60, roughness: 1 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(W / 2, -DROP - 0.3, DECK_Z + 22);
    this.scene.add(road);

    // The streetlight is out — it is the middle of the afternoon
    const streetlight = buildStreetlight(false);
    streetlight.group.position.set(W / 2 - 24, -DROP, DECK_Z + 16);
    this.scene.add(streetlight.group);

    // The palm thicket, which is the front yard's whole personality. Clustered
    // to one side so they frame the steps rather than block the way out.
    ([
      [W / 2 - 15, DECK_Z + 5, 31],
      [W / 2 - 11, DECK_Z + 9, 47],
      [W / 2 - 19, DECK_Z + 10, 63],
      [W / 2 + 16, DECK_Z + 6, 91],
      [W / 2 + 21, DECK_Z + 10, 108],
      [W / 2 + 13, DECK_Z + 11, 126],
      [W / 2 + 34, DECK_Z + 26, 144],
    ] as [number, number, number][]).forEach(([x, z, seed]) => {
      const palm = buildPalm(seed);
      palm.group.position.set(x, -DROP, z);
      this.scene.add(palm.group);
      this.animated.push(palm.animated);
    });

    // Bougainvillea going off over the wall, which is the other half of it
    ([
      [W / 2 + 26, DECK_Z + 13, 211],
      [W / 2 - 24, DECK_Z + 13, 322],
    ] as [number, number, number][]).forEach(([x, z, seed]) => {
      const bush = buildBougainvillea(seed);
      bush.position.set(x, -DROP, z);
      this.scene.add(bush);
    });

    // The street sign on the corner, which is the answer to where any of this is
    const sign = buildStreetSign('Peterson St');
    sign.position.set(gateCentre + 6.5, -DROP, DECK_Z + 16);
    // Turned back toward the house: you read this walking down the steps, not
    // driving past, so the lettered face has to point at the porch.
    sign.rotation.y = Math.PI - 0.5;
    sign.scale.setScalar(1.8);
    this.scene.add(sign);

    // Bins out on the kerb, as they eternally are
    ([
      [gateCentre - 8, 0x2f6ba8],
      [gateCentre - 6.8, 0xd8a12f],
    ] as [number, number][]).forEach(([x, lid]) => {
      const bin = buildWheelieBin(lid);
      bin.position.set(x, -DROP, DECK_Z + 16.5);
      bin.rotation.y = 0.4;
      this.scene.add(bin);
    });

    // Neighbouring rooflines across the way
    const silhouette = new THREE.MeshStandardMaterial({ color: 0x7e93a8, roughness: 1 });
    [
      [-34, 26, 9],
      [4, 30, 11],
      [46, 24, 8.5],
      [84, 28, 10],
    ].forEach(([x, width, ridge]) => {
      const shape = new THREE.Shape();
      shape.moveTo(-width / 2, 0);
      shape.lineTo(-width / 2, ridge * 0.55);
      shape.lineTo(0, ridge);
      shape.lineTo(width / 2, ridge * 0.55);
      shape.lineTo(width / 2, 0);
      shape.closePath();
      const house = new THREE.Mesh(new THREE.ShapeGeometry(shape), silhouette);
      house.position.set(x, -DROP, DECK_Z + 34);
      this.scene.add(house);
    });
  }

  // ----------------------------------------------------------------- furniture

  protected createFurnitureNode(f: Furniture): THREE.Object3D | null {
    switch (f.type) {
      // Built into the facade and the roof rather than stood on their tiles
      case 'front_door':
      case 'column':
      case 'porch_steps':
        return null;

      case 'porch_chair': {
        const chair = buildPorchChair(f.width, f.height);
        // Both turned in toward the table between them
        chair.rotation.y = f.x < 10 ? 0.9 : -0.9;
        return chair;
      }

      case 'porch_table':
        return buildPorchTable(f.width);

      case 'welcome_mat':
        return buildWelcomeMat(f.width * 2 - 0.4, f.height * 2 - 0.3);

      case 'potplant': {
        const plant = buildPotPlant(f.x * 23 + f.y, 1.3);
        this.animated.push(plant.animated);
        return plant.group;
      }

      case 'hollandia_can': {
        const { group, animated } = buildHollandiaCan();
        this.animated.push(animated);
        // The last one, sitting on the porch table
        group.position.y = 0.72;
        return group;
      }

      case 'humunculous': {
        // Added to the scene rather than parented to the returned node: his
        // facing is worked out from his own position, and nested that position
        // is local and he ends up addressing the balustrade.
        const skeleton = buildHumunculous();
        // A touch over the player's eye height: everything in this world is
        // built for a crisp, and a skeleton you look down on is not ominous.
        skeleton.group.scale.setScalar(1.35);
        skeleton.group.position.set(
          gridToWorldX(f.x + (f.width - 1) / 2),
          0,
          gridToWorldZ(f.y + (f.height - 1) / 2),
        );
        this.scene.add(skeleton.group);
        this.characters.push(skeleton);

        // A pool of light so he is findable at dusk, and so the red in his
        // sockets has something to read against
        const halo = createPickupGlow(0xff6a4a);
        this.animated.push(halo.animated);
        return halo.group;
      }

      default:
        return null;
    }
  }

  private buildExits(): void {
    // The ladder, propped in the corner once you have carried it here. It is
    // always drawn: the 2D game only adds the furniture after you place it,
    // and this is the one thing in the room that is about where you go next.
    const ladder = buildLadder();
    ladder.position.set(FRONT_PORCH.ladderSpot.x, 0, FRONT_PORCH.ladderSpot.z);
    ladder.rotation.y = Math.PI;
    ladder.rotation.x = -0.22;
    this.scene.add(ladder);

    const roofLabel = makeLabelSprite('ROOF');
    roofLabel.position.set(FRONT_PORCH.ladderSpot.x, 4.2, FRONT_PORCH.ladderSpot.z + 0.6);
    this.addLabel(roofLabel);

    const livingRoom = makeLabelSprite('INSIDE');
    livingRoom.position.set(
      FRONT_PORCH.frontDoor.centre,
      FRONT_PORCH.frontDoor.height + 0.6,
      0.8,
    );
    this.addLabel(livingRoom);

    const street = makeLabelSprite('THE STREET');
    street.position.set(
      (FRONT_PORCH.steps.fromX + FRONT_PORCH.steps.toX) / 2,
      1.4,
      DECK_Z + 1.4,
    );
    this.addLabel(street);
  }
}
