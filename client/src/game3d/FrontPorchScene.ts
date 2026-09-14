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
import { ORANGE, balustrade } from './house';
import {
  buildBullnoseRoof,
  buildFacadeWindow,
  buildFrontDoor,
  buildJacaranda,
  buildLaceBracket,
  buildLaceValance,
  buildLetterbox,
  buildPicketFence,
  buildPorchChair,
  buildPorchLight,
  buildPorchSteps,
  buildPorchTable,
  buildStreetlight,
  buildVerandahPost,
  buildWeatherboardWall,
  buildWelcomeMat,
} from './frontPorchProps';
import { buildPotPlant } from './balconyProps';
import { buildHumunculous } from './characters';
import { createDeckingTexture, createGrassTexture, tiled } from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const W = FRONT_PORCH.width;
const D = FRONT_PORCH.depth;
const DECK_Z = FRONT_PORCH.deckMaxZ;
const DROP = FRONT_PORCH.dropToGround;
const ROOF = FRONT_PORCH.roof;
const FACADE = FRONT_PORCH.facade;

/** Door through the side wall into the living room. Grid (19, 10). */
const LIVING_ROOM_DOOR = { centre: gridToWorldZ(10), width: 3.2, height: 3.8 };

const SKY_VERTEX = `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Dusk: the orange is nearly gone, sitting in a band just above the rooflines,
 * and the top of the sky has already gone to the deep blue that comes before
 * it is properly dark.
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

    // The last of the sun, spread wide along the horizon where it went down
    float toward = max(dot(dir, normalize(uSunDir)), 0.0);
    float band = pow(toward, 3.0) * (1.0 - smoothstep(-0.02, 0.26, h));
    sky = mix(sky, uEmber, clamp(band * 0.9, 0.0, 1.0));

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

    this.scene.fog = new THREE.Fog(0x4a4a66, 48, 190);
    this.scene.background = new THREE.Color(0x2d3350);

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
          uHigh: { value: new THREE.Color(0x121a3c) },
          uMid: { value: new THREE.Color(0x35406e) },
          uLow: { value: new THREE.Color(0x7a6480) },
          uEmber: { value: new THREE.Color(0xd8703c) },
          uSunDir: { value: new THREE.Vector3(-0.85, 0.05, 0.52).normalize() },
        },
      }),
    );
    sky.position.set(W / 2, 0, D / 2);
    this.scene.add(sky);

    // First stars, only in the upper half where the light has already gone
    const count = this.lowDetail ? 200 : 460;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.82 + 0.16);
      const r = 380;
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
          color: 0xe8eeff,
          size: 1.6,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.75,
          fog: false,
          depthWrite: false,
        }),
      ),
    );
  }

  private buildLighting(): void {
    this.scene.add(new THREE.AmbientLight(0x5a648c, 1.5));
    this.scene.add(new THREE.HemisphereLight(0x6f80b4, 0x3a3226, 1.1));

    // What is left of the sun, raking in under the verandah roof from the west
    const sun = new THREE.DirectionalLight(0xff9a52, 1.7);
    sun.position.set(-70, 9, 44);
    sun.target.position.set(W * 0.6, 1, D * 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 160;
    sun.shadow.camera.left = -36;
    sun.shadow.camera.right = 36;
    sun.shadow.camera.top = 36;
    sun.shadow.camera.bottom = -36;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Cool fill from the eastern half of the sky, which has already gone blue
    const fill = new THREE.DirectionalLight(0x7f95d8, 0.5);
    fill.position.set(60, 26, -30);
    fill.target.position.set(W / 2, 1, D / 2);
    this.scene.add(fill);
    this.scene.add(fill.target);
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

    const frontDoor = buildFrontDoor(door.width, door.height);
    frontDoor.position.set(door.centre, 0, 0.02);
    this.scene.add(frontDoor);

    // A light over it, which is where every moth in the street is
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

      // The light of the room behind it landing on the deck
      const spill = new THREE.PointLight(0xffb060, 3.4, 11, 2);
      spill.position.set(spec.along, spec.sill + spec.height / 2, 1.2);
      this.scene.add(spill);
    });

    // East wall, with the living room's doors onto the verandah
    const eastRuns: [number, number][] = [
      [-FACADE.thickness, LIVING_ROOM_DOOR.centre - LIVING_ROOM_DOOR.width / 2],
      [LIVING_ROOM_DOOR.centre + LIVING_ROOM_DOOR.width / 2, DECK_Z + 2],
    ];
    eastRuns.forEach(([z0, z1]) => {
      const wall = buildWeatherboardWall(z1 - z0, FACADE.height, FACADE.thickness);
      wall.rotation.y = -Math.PI / 2;
      wall.position.set(W + FACADE.thickness / 2, FACADE.height / 2, (z0 + z1) / 2);
      this.scene.add(wall);
    });

    const overSide = buildWeatherboardWall(
      LIVING_ROOM_DOOR.width,
      FACADE.height - LIVING_ROOM_DOOR.height,
      FACADE.thickness,
    );
    overSide.rotation.y = -Math.PI / 2;
    overSide.position.set(
      W + FACADE.thickness / 2,
      LIVING_ROOM_DOOR.height + (FACADE.height - LIVING_ROOM_DOOR.height) / 2,
      LIVING_ROOM_DOOR.centre,
    );
    this.scene.add(overSide);

    // The lit room beyond that opening
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(5, LIVING_ROOM_DOOR.height + 0.6, LIVING_ROOM_DOOR.width + 0.6),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1, side: THREE.BackSide }),
    );
    recess.position.set(W + FACADE.thickness + 2.5, LIVING_ROOM_DOOR.height / 2, LIVING_ROOM_DOOR.centre);
    this.scene.add(recess);

    const inside = new THREE.PointLight(0xffb878, 5, 12, 2);
    inside.position.set(W + 2.4, 1.9, LIVING_ROOM_DOOR.centre);
    this.scene.add(inside);

    // The house going up above the verandah roof, seen from the yard
    const upper = buildWeatherboardWall(W + FACADE.thickness * 2, 4, FACADE.thickness);
    upper.position.set(W / 2, FACADE.height + 1.6, -FACADE.thickness / 2);
    this.scene.add(upper);
  }

  private buildVerandahRoof(): void {
    const roof = buildBullnoseRoof(W + 1.2, ROOF.frontZ, ROOF.wallY, ROOF.frontY, ROOF.thickness);
    roof.position.set(W / 2, 0, 0);
    this.scene.add(roof);

    const postXs = FRONT_PORCH.postGridX.map(gridToWorldX);
    const postZ = gridToWorldZ(FRONT_PORCH.postGridY);

    postXs.forEach((x, i) => {
      const post = buildVerandahPost(ROOF.frontY - 0.95);
      post.position.set(x, 0, postZ);
      this.scene.add(post);

      // Lace bracket in each corner where the post meets the beam
      [-1, 1].forEach((side) => {
        const bracket = buildLaceBracket(0.6);
        bracket.position.set(x + side * 0.16, ROOF.frontY - 1.75, postZ);
        bracket.rotation.y = side < 0 ? Math.PI : 0;
        bracket.scale.x = side;
        this.scene.add(bracket);
      });

      // and a run of it between this post and the next
      if (i < postXs.length - 1) {
        const span = postXs[i + 1] - x;
        const valance = buildLaceValance(span - 0.4, 0.55);
        valance.position.set(x + span / 2, ROOF.frontY - 1.2, postZ);
        this.scene.add(valance);
      }
    });

    // The two posts the 2D room actually lists, standing further in
    // under the deep part of the verandah
    [2, 17].forEach((gx) => {
      const post = buildVerandahPost(ROOF.wallY - 0.7);
      post.position.set(gridToWorldX(gx), 0, gridToWorldZ(3));
      this.scene.add(post);
    });
  }

  private buildBalustrades(): void {
    const railHeight = 1.15;
    const steps = FRONT_PORCH.steps;

    // Along the front, broken where the steps come up
    [
      [new THREE.Vector3(0, 0, DECK_Z), new THREE.Vector3(steps.fromX, 0, DECK_Z)],
      [new THREE.Vector3(steps.toX, 0, DECK_Z), new THREE.Vector3(W, 0, DECK_Z)],
      // and all the way down the open western side
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, DECK_Z)],
    ].forEach(([from, to]) => {
      this.scene.add(balustrade(from, to, railHeight));
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
        map: tiled(createGrassTexture(), 30, 18),
        color: 0x4c6340,
        roughness: 1,
      }),
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(W / 2, -DROP, DECK_Z + 34);
    lawn.receiveShadow = true;
    this.scene.add(lawn);

    // Concrete path from the bottom of the steps to the gate
    // Weathered concrete, not fresh: at this sun angle a pale grey slab this
    // size is the brightest thing in the scene by a mile.
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(steps.toX - steps.fromX - 6, 22),
      new THREE.MeshStandardMaterial({ color: 0x55534d, roughness: 1 }),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set((steps.fromX + steps.toX) / 2, -DROP + 0.02, DECK_Z + 15);
    path.receiveShadow = true;
    this.scene.add(path);

    const fence = buildPicketFence(96);
    fence.position.set(W / 2, -DROP, DECK_Z + 26);
    this.scene.add(fence);

    const letterbox = buildLetterbox();
    letterbox.position.set((steps.fromX + steps.toX) / 2 + 5, -DROP, DECK_Z + 25);
    this.scene.add(letterbox);

    // Road beyond the fence, and the far side of the street
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(190, 16),
      new THREE.MeshStandardMaterial({ color: 0x33323a, roughness: 1 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(W / 2, -DROP - 0.3, DECK_Z + 37);
    this.scene.add(road);

    const streetlight = buildStreetlight();
    streetlight.group.position.set(W / 2 - 26, -DROP, DECK_Z + 28);
    this.scene.add(streetlight.group);
    this.animated.push(streetlight.animated);

    // The jacaranda, close enough to the steps to be the thing you look at,
    // and a second one across the road
    [
      [W / 2 - 13, DECK_Z + 11, 31, 1.5],
      [W / 2 + 30, DECK_Z + 42, 77, 1.8],
    ].forEach(([x, z, seed, scale]) => {
      const tree = buildJacaranda(seed);
      tree.group.position.set(x, -DROP, z);
      tree.group.scale.setScalar(scale);
      this.scene.add(tree.group);
      this.animated.push(tree.animated);
    });

    // Neighbouring rooflines across the way, flat against the dusk
    const silhouette = new THREE.MeshStandardMaterial({ color: 0x2f3050, roughness: 1 });
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
      house.position.set(x, -DROP, DECK_Z + 52);
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

    const livingRoom = makeLabelSprite('LIVING ROOM');
    livingRoom.position.set(W - 0.9, LIVING_ROOM_DOOR.height + 0.5, LIVING_ROOM_DOOR.centre);
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
