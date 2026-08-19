/**
 * The living room: the house's front room, run as an art gallery with exactly
 * one subject. Warm plaster, waxed floorboards, a picture rail hung with
 * bananas, and Tiny Clown in the corner building his beer pyramid.
 *
 * Three doors: the balcony off the north end of the east wall, the bedroom
 * further down it, and the front porch out west. Placement comes from
 * LivingRoom.furniture, except the paintings — the 2D room hangs them a tile in
 * from the wall, so here they are moved onto the wall itself via LIVING_ROOM.
 *
 * This is also the only room that is not 20x15; LivingRoom sets height to 16.
 */

import * as THREE from 'three';
import {
  LIVING_ROOM,
  LIVING_ROOM_BLOCKERS,
  gridToWorldX,
  gridToWorldZ,
} from './constants';
import { applyWorldUVs, buildCD, buildHollandiaCan } from './props';
import {
  buildBananaPainting,
  buildBeerPyramid,
  buildBookshelf,
  buildDrinksTrolley,
  buildLeaningCanvases,
  buildLivingArmchair,
  buildLivingCoffeeTable,
  buildLivingCouch,
  buildPendant,
  buildPlinth,
  buildRecordPlayer,
  buildSideTable,
  buildSpotTrack,
  buildStandardLamp,
} from './livingRoomProps';
import { buildPotPlant } from './balconyProps';
import { buildRug } from './downstairsProps';
import { buildTinyClown } from './characters';
import {
  createFloorboardTexture,
  createRugTexture,
  createStuccoTexture,
  tiled,
} from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const W = LIVING_ROOM.width;
const D = LIVING_ROOM.depth;
const CEILING = LIVING_ROOM.ceilingY;
const WT = LIVING_ROOM.wallThickness;
const RAIL_Y = LIVING_ROOM.railY;

/** Texture tiles per world unit. Boards land about half a unit wide. */
const BOARD_DENSITY = 0.28;
const PLASTER_DENSITY = 0.16;

export class LivingRoomScene extends PovScene {
  readonly blockers = LIVING_ROOM_BLOCKERS;
  /**
   * You arrive in the north-east corner, a tile from the bookcase, so the view
   * is aimed diagonally down the room past it rather than into its end panel.
   */
  readonly focus = { x: 8, y: 14 };

  private readonly plaster: THREE.MeshStandardMaterial;
  private readonly lowDetail: boolean;
  private pyramid: ReturnType<typeof buildBeerPyramid> | null = null;

  constructor(room: RoomLike, lowDetail: boolean) {
    super();
    this.lowDetail = lowDetail;

    // Barely any fog: the room's diagonal is only about 51 units, so anything
    // closer than this paints a hard wedge of haze across the ceiling plane.
    // The colour has to sit near the plaster, not below it.
    this.scene.fog = new THREE.Fog(0x9a8a70, 46, 130);
    this.scene.background = new THREE.Color(0x2a1f18);

    this.plaster = new THREE.MeshStandardMaterial({
      map: createStuccoTexture(),
      color: 0xe8dcc8,
      roughness: 0.94,
      metalness: 0,
    });

    this.buildLighting();
    this.buildShell();
    this.buildTrim();
    this.buildArtwork();
    this.buildGalleryDressing();
    this.buildFurniture(room);
    this.buildExits();
  }

  // ------------------------------------------------------------------ lighting

  private buildLighting(): void {
    // Lamps do the work, but a lit room needs a real ambient floor or the
    // undersides of all this furniture go to mud.
    this.scene.add(new THREE.AmbientLight(0xffe0bc, 1.35));
    // The ground half of the hemisphere is what lights a ceiling, since its
    // normal points down. Too dark a value here and the plaster reads as
    // stained timber wherever the pendants do not reach.
    this.scene.add(new THREE.HemisphereLight(0xffd6a8, 0xa08a6e, 1.05));

    // Sunset coming through the balcony door, low and orange across the floor.
    // The only shadow caster in here.
    const door = LIVING_ROOM.doors.balcony;
    const sun = new THREE.DirectionalLight(0xffa860, 2.8);
    sun.position.set(W + 24, 8, door.centre - 6);
    sun.target.position.set(W * 0.35, 0, door.centre + 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -26;
    sun.shadow.camera.right = 26;
    sun.shadow.camera.top = 26;
    sun.shadow.camera.bottom = -26;
    sun.shadow.bias = -0.0007;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Bounce back off the west wall so the far end is not silhouetted
    const bounce = new THREE.DirectionalLight(0xffcf9a, 0.55);
    bounce.position.set(-14, 5, D * 0.6);
    bounce.target.position.set(W * 0.6, 1.5, D * 0.4);
    this.scene.add(bounce);
    this.scene.add(bounce.target);
  }

  // --------------------------------------------------------------------- shell

  private wall(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    const d = Math.abs(z1 - z0);
    const geometry = new THREE.BoxGeometry(w, h, d);
    applyWorldUVs(geometry, w, h, d, PLASTER_DENSITY);
    const mesh = new THREE.Mesh(geometry, this.plaster);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  private buildShell(): void {
    // Floorboards running the length of the room
    const floorGeometry = new THREE.PlaneGeometry(W, D);
    const floor = new THREE.Mesh(
      floorGeometry,
      new THREE.MeshStandardMaterial({
        map: tiled(createFloorboardTexture(), W * BOARD_DENSITY, D * BOARD_DENSITY),
        color: 0xc9a878,
        roughness: 0.55,
        metalness: 0.04,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(W / 2, 0, D / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling, with a plain plaster finish
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 1 }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(W / 2, CEILING, D / 2);
    // Not receiveShadow: the sun is above the ceiling, so its underside gets no
    // direct light anyway and the shadow pass only paints artefacts up there.
    this.scene.add(ceiling);

    const doors = LIVING_ROOM.doors;

    // North and south walls, unbroken
    this.wall(-WT, W + WT, 0, CEILING, -WT, 0);
    this.wall(-WT, W + WT, 0, CEILING, D, D + WT);

    // East wall: the balcony door at the north end, the bedroom further along
    const cuts = [doors.balcony, doors.bedroom]
      .map((d) => ({ from: d.centre - d.width / 2, to: d.centre + d.width / 2, height: d.height }))
      .sort((a, b) => a.from - b.from);

    let cursor = 0;
    cuts.forEach((cut) => {
      this.wall(W, W + WT, 0, CEILING, cursor, cut.from);
      this.wall(W, W + WT, cut.height, CEILING, cut.from, cut.to);
      cursor = cut.to;
    });
    this.wall(W, W + WT, 0, CEILING, cursor, D);

    // West wall: one door out to the front porch
    const porch = doors.frontPorch;
    const pz0 = porch.centre - porch.width / 2;
    const pz1 = porch.centre + porch.width / 2;
    this.wall(-WT, 0, 0, CEILING, 0, pz0);
    this.wall(-WT, 0, 0, CEILING, pz1, D);
    this.wall(-WT, 0, porch.height, CEILING, pz0, pz1);

    // Each opening gets a lined reveal and a glimpse of what is beyond
    this.buildDoorway(doors.balcony.centre, doors.balcony, 'east', 0xffb066, 5.0);
    this.buildDoorway(doors.bedroom.centre, doors.bedroom, 'east', 0x7f96d8, 3.4);
    this.buildDoorway(porch.centre, porch, 'west', 0xffa070, 4.0);
  }

  /**
   * A door opening: architrave, and a shallow room behind it lit its own
   * colour, so each exit reads as somewhere to go rather than a black panel.
   */
  private buildDoorway(
    centre: number,
    door: { width: number; height: number },
    wall: 'east' | 'west',
    glow: number,
    intensity: number,
  ): void {
    const outward = wall === 'east' ? 1 : -1;
    const inner = wall === 'east' ? W : 0;
    const outer = inner + outward * WT;

    const trim = new THREE.MeshStandardMaterial({ color: 0xd8c8ac, roughness: 0.7 });

    // Architrave either side and over the head
    [-1, 1].forEach((side) => {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, door.height + 0.3, 0.22),
        trim,
      );
      jamb.position.set(inner - outward * 0.1, door.height / 2, centre + (side * door.width) / 2);
      jamb.castShadow = true;
      this.scene.add(jamb);
    });

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.26, door.width + 0.44),
      trim,
    );
    head.position.set(inner - outward * 0.1, door.height + 0.1, centre);
    this.scene.add(head);

    // The space beyond: a box turned inside out with a floor and a light
    const depth = 5.0;
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(depth, door.height + 0.8, door.width + 0.8),
      new THREE.MeshStandardMaterial({ color: 0x2e241c, roughness: 1, side: THREE.BackSide }),
    );
    recess.position.set(outer + (outward * depth) / 2, (door.height + 0.8) / 2 - 0.4, centre);
    this.scene.add(recess);

    const recessFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(depth, door.width + 0.7),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.7 }),
    );
    recessFloor.rotation.x = -Math.PI / 2;
    recessFloor.rotation.z = Math.PI / 2;
    recessFloor.position.set(outer + (outward * depth) / 2, 0.01, centre);
    this.scene.add(recessFloor);

    const light = new THREE.PointLight(glow, intensity, 10, 2);
    light.position.set(outer + outward * 2.2, 1.8, centre);
    this.scene.add(light);
  }

  /** Skirting, picture rail and cornice — the things that make a room a room. */
  private buildTrim(): void {
    const timber = new THREE.MeshStandardMaterial({ color: 0xf0e6d2, roughness: 0.7 });

    const runs: [number, number, number, number, number][] = [
      // x, z, length, yaw, — one per wall
      [W / 2, 0.12, W, 0, 0],
      [W / 2, D - 0.12, W, 0, 0],
      [0.12, D / 2, D, Math.PI / 2, 0],
      [W - 0.12, D / 2, D, Math.PI / 2, 0],
    ];

    runs.forEach(([x, z, length, yaw]) => {
      // Skirting
      const skirting = new THREE.Mesh(new THREE.BoxGeometry(length, 0.42, 0.14), timber);
      skirting.position.set(x, 0.21, z);
      skirting.rotation.y = yaw;
      skirting.receiveShadow = true;
      this.scene.add(skirting);

      // Picture rail, which everything is hung from
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.16, 0.1), timber);
      rail.position.set(x, RAIL_Y, z);
      rail.rotation.y = yaw;
      rail.castShadow = true;
      this.scene.add(rail);

      // Cornice
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(length, 0.3, 0.3), timber);
      cornice.position.set(x, CEILING - 0.15, z);
      cornice.rotation.y = yaw;
      this.scene.add(cornice);
    });

    // Ceiling rose and pendant, over the middle of the seating group, and a
    // second one down the east end where the only other light is the doorway
    const pendant = buildPendant(CEILING);
    pendant.position.set(gridToWorldX(7), 0, gridToWorldZ(8));
    this.scene.add(pendant);

    const eastPendant = buildPendant(CEILING);
    eastPendant.position.set(gridToWorldX(15), 0, gridToWorldZ(11));
    this.scene.add(eastPendant);
  }

  // ------------------------------------------------------------------ artwork

  /**
   * The banana collection, hung on the walls proper. The 2D room lists these as
   * furniture a tile in from the wall; LIVING_ROOM.artwork says which wall each
   * one actually belongs on.
   */
  private buildArtwork(): void {
    Object.values(LIVING_ROOM.artwork).forEach((art, index) => {
      const painting = buildBananaPainting(index, art.width, art.height);
      const y = RAIL_Y - 0.5 - art.height / 2;

      if (art.wall === 'north') {
        painting.position.set(art.along, y, 0.14);
      } else {
        painting.position.set(W - 0.14, y, art.along);
        painting.rotation.y = -Math.PI / 2;
      }
      this.scene.add(painting);
    });

    // Track lighting aimed at the north wall run
    const track = buildSpotTrack(22, this.lowDetail ? 3 : 5);
    track.position.set(W * 0.42, CEILING - 0.5, 2.6);
    this.scene.add(track);

    // and the light those spots are supposedly throwing
    const washes: [number, number][] = [
      [gridToWorldX(3.5), 2.4],
      [gridToWorldX(8.5), 2.4],
      [gridToWorldX(13.5), 2.4],
    ];
    washes.forEach(([x, y]) => {
      const wash = new THREE.PointLight(0xfff0d0, 2.2, 8, 2);
      wash.position.set(x, y, 1.5);
      this.scene.add(wash);
    });
  }

  /** The 3D-only gallery dressing, all on tiles listed in the blockers. */
  private buildGalleryDressing(): void {
    const plinth = buildPlinth();
    plinth.group.position.set(gridToWorldX(9), 0, gridToWorldZ(13));
    this.scene.add(plinth.group);
    this.animated.push(plinth.animated);

    const canvases = buildLeaningCanvases(77);
    canvases.position.set(gridToWorldX(3), 0, D - 0.5);
    canvases.rotation.y = Math.PI;
    this.scene.add(canvases);

    const trolley = buildDrinksTrolley();
    trolley.position.set(gridToWorldX(17), 0, gridToWorldZ(15));
    trolley.rotation.y = Math.PI + 0.2;
    this.scene.add(trolley);

    const player = buildRecordPlayer();
    player.group.position.set(gridToWorldX(18.2), 0, gridToWorldZ(14));
    player.group.rotation.y = -Math.PI / 2 - 0.15;
    this.scene.add(player.group);
    this.animated.push(player.animated);
  }

  // ----------------------------------------------------------------- furniture

  protected createFurnitureNode(f: Furniture): THREE.Object3D | null {
    switch (f.type) {
      // Hung on the walls in buildArtwork, not on the floor tile listed here
      case 'banana_painting_1':
      case 'banana_painting_2':
      case 'banana_painting_3':
      case 'banana_painting_4':
        return null;

      case 'living_couch':
        // Backed to the north, facing the coffee table and the rest of the room
        return buildLivingCouch(f.width, f.height);

      case 'armchair': {
        const chair = buildLivingArmchair(f.width, f.height);
        // Turned in toward the couch
        chair.rotation.y = -Math.PI / 2;
        return chair;
      }

      case 'coffee_table':
        return buildLivingCoffeeTable(f.width);

      case 'side_table':
        return buildSideTable();

      case 'bookshelf':
        // Back toward the north wall, opening into the room. Left facing the
        // other way it is a four-metre slab across the arrival view.
        return buildBookshelf(f.width, f.height);

      case 'floor_lamp': {
        const lamp = buildStandardLamp(!this.lowDetail);
        this.animated.push(lamp.animated);
        return lamp.group;
      }

      case 'potplant': {
        const plant = buildPotPlant(f.x * 17 + f.y * 5, 1.15);
        this.animated.push(plant.animated);
        return plant.group;
      }

      case 'rug': {
        const rug = buildRug(
          tiled(createRugTexture(), 1, 1),
          f.width * 2 - 0.5,
          f.height * 2 - 0.5,
          0.02,
        );
        return rug;
      }

      case 'tiny_clown': {
        // The clown stands beside his work, admiring it. He is added to the
        // scene rather than parented to the returned node, because his facing
        // is worked out from his own position — nested, that position is local
        // and he ends up staring at a wall.
        const clown = buildTinyClown();
        clown.group.position.set(
          gridToWorldX(f.x + (f.width - 1) / 2) - 0.9,
          0,
          gridToWorldZ(f.y + (f.height - 1) / 2) - 0.1,
        );
        this.scene.add(clown.group);
        this.characters.push(clown);

        const pyramid = buildBeerPyramid();
        pyramid.group.position.set(0.8, 0, 0.3);
        this.animated.push(pyramid.animated);
        this.pyramid = pyramid;
        return pyramid.group;
      }

      case 'hollandia_can': {
        const { group, animated } = buildHollandiaCan();
        this.animated.push(animated);
        // This one is on the coffee table
        group.position.y = 0.88;
        return group;
      }

      case 'cd_item': {
        const { group, animated } = buildCD(f.songName ?? 'Unknown Track');
        this.animated.push(animated);
        // Floating at shelf height beside the bookcase
        group.position.y = 1.4;
        return group;
      }

      default:
        return null;
    }
  }

  setClownCans(count: number): void {
    this.pyramid?.setCans(count);
  }

  private buildExits(): void {
    const doors = LIVING_ROOM.doors;

    const balcony = makeLabelSprite('BALCONY');
    balcony.position.set(W - 0.8, doors.balcony.height + 0.5, doors.balcony.centre);
    this.addLabel(balcony);

    const bedroom = makeLabelSprite('BEDROOM');
    bedroom.position.set(W - 0.8, doors.bedroom.height + 0.5, doors.bedroom.centre);
    this.addLabel(bedroom);

    const porch = makeLabelSprite('FRONT PORCH');
    porch.position.set(0.8, doors.frontPorch.height + 0.5, doors.frontPorch.centre);
    this.addLabel(porch);
  }
}
