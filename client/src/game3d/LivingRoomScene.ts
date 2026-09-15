/**
 * The living room: the house's front room, run as an art gallery with exactly
 * one subject. Warm plaster, waxed floorboards, a picture rail hung with
 * bananas, and Tiny Clown in the corner building his beer pyramid.
 *
 * Three doors: the balcony off the north end of the east wall, the bedroom
 * further down it, and the front porch out west. A bank of windows runs the
 * length of the south wall, which is the only one with nothing hung on it. Placement comes from
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
  buildFretworkArch,
  buildGlobeChandelier,
  buildLeaningCanvases,
  buildLivingArmchair,
  buildLivingCoffeeTable,
  buildLivingCouch,
  buildPlinth,
  buildRecordPlayer,
  buildSheerCurtains,
  buildSideTable,
  buildSpotTrack,
  buildStandardLamp,
} from './livingRoomProps';
import { buildPotPlant } from './balconyProps';
import { buildSashWindow } from './bedroomProps';
import { buildRug } from './downstairsProps';
import { buildTinyClown } from './characters';
import {
  createCarpetTexture,
  createDamaskTexture,
  createRugTexture,
  tiled,
} from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const W = LIVING_ROOM.width;
const D = LIVING_ROOM.depth;
const CEILING = LIVING_ROOM.ceilingY;
const WT = LIVING_ROOM.wallThickness;
const RAIL_Y = LIVING_ROOM.railY;

/** Texture tiles per world unit. */
const CARPET_DENSITY = 0.22;
/** One damask drop is about 2.9 world units across, so a motif is ~1.4m. */
const PAPER_DENSITY = 0.35;

/** Stained joinery: skirting, picture rail, architraves and the arch. */
const MAROON = 0x7e2e26;

/**
 * Remove any lights a decorative builder brought with it.
 *
 * Lights are the expensive thing in these scenes — the shader evaluates every
 * one of them per pixel, and going past about eight halves the frame rate. In
 * a daylit room a lamp's emissive shade sells it on its own.
 */
function stripLights(group: THREE.Object3D): void {
  const lights: THREE.Object3D[] = [];
  group.traverse((object) => {
    if ((object as THREE.Light).isLight) lights.push(object);
  });
  lights.forEach((light) => light.removeFromParent());
}

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
    this.scene.fog = new THREE.Fog(0xe8e0cc, 60, 190);
    this.scene.background = new THREE.Color(0x8fbce0);

    // Gold damask, hung the way the real room is. The repeat is set in world
    // units by applyWorldUVs below, so a drop is about 1.4m however long the
    // wall is — a wallpaper that stretches to fit its wall stops being one.
    this.plaster = new THREE.MeshStandardMaterial({
      map: createDamaskTexture(),
      color: 0xf0e4c8,
      roughness: 0.96,
      metalness: 0,
    });

    this.buildLighting();
    this.buildShell();
    this.buildWindows();
    this.buildTrim();
    this.buildArtwork();
    this.buildGalleryDressing();
    this.buildFurniture(room);
    this.buildExits();
  }

  // ------------------------------------------------------------------ lighting

  private buildLighting(): void {
    // Daylight through three big windows: the ambient floor has to come up with
    // it, or everything facing away from the glass reads as night-time again.
    this.scene.add(new THREE.AmbientLight(0xf4ecdc, 2.1));
    // The ground half of the hemisphere is what lights a ceiling, since its
    // normal points down. Too dark a value here and the plaster reads as
    // stained timber wherever the windows do not reach.
    this.scene.add(new THREE.HemisphereLight(0xdcecff, 0xc0ab8a, 1.8));

    // Afternoon sun in through the south windows, high and white, throwing
    // three bright rectangles across the boards. The only shadow caster in here.
    const sun = new THREE.DirectionalLight(0xfff4e0, 3.4);
    sun.position.set(W * 0.3, 26, D + 34);
    sun.target.position.set(W * 0.55, 0, D * 0.4);
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

    // Bounce back off the floor and the north wall, so the side of everything
    // facing away from the windows is lit rather than merely less bright
    const bounce = new THREE.DirectionalLight(0xffeccc, 0.9);
    bounce.position.set(W * 0.5, 2, -20);
    bounce.target.position.set(W * 0.5, 2.5, D * 0.5);
    this.scene.add(bounce);
    this.scene.add(bounce.target);
  }

  // --------------------------------------------------------------------- shell

  private wall(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    const d = Math.abs(z1 - z0);
    const geometry = new THREE.BoxGeometry(w, h, d);
    applyWorldUVs(geometry, w, h, d, PAPER_DENSITY);
    const mesh = new THREE.Mesh(geometry, this.plaster);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  private buildShell(): void {
    // Wall-to-wall carpet, the oatmeal cut pile that came with the house
    const floorGeometry = new THREE.PlaneGeometry(W, D);
    const floor = new THREE.Mesh(
      floorGeometry,
      new THREE.MeshStandardMaterial({
        map: tiled(createCarpetTexture(), W * CARPET_DENSITY, D * CARPET_DENSITY),
        color: 0xcfc6b6,
        roughness: 1,
        metalness: 0,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(W / 2, 0, D / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling, with a plain plaster finish
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(W + WT * 2, D + WT * 2),
      new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 1 }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(W / 2, CEILING, D / 2);
    // Not receiveShadow: the sun is above the ceiling, so its underside gets no
    // direct light anyway and the shadow pass only paints artefacts up there.
    this.scene.add(ceiling);

    const doors = LIVING_ROOM.doors;

    // North wall, unbroken — the banana collection hangs on it
    this.wall(-WT, W + WT, 0, CEILING, -WT, 0);

    // South wall, cut for the window bank
    const cuts = LIVING_ROOM.windows
      .map((w) => ({ from: w.along - w.width / 2, to: w.along + w.width / 2, sill: w.sill, head: w.sill + w.height }))
      .sort((a, b) => a.from - b.from);

    let x = -WT;
    cuts.forEach((cut) => {
      this.wall(x, cut.from, 0, CEILING, D, D + WT);
      this.wall(cut.from, cut.to, 0, cut.sill, D, D + WT);
      this.wall(cut.from, cut.to, cut.head, CEILING, D, D + WT);
      x = cut.to;
    });
    this.wall(x, W + WT, 0, CEILING, D, D + WT);

    // East wall: the balcony door at the north end, the bedroom further along
    const doorCuts = [doors.balcony, doors.bedroom]
      .map((d) => ({ from: d.centre - d.width / 2, to: d.centre + d.width / 2, height: d.height }))
      .sort((a, b) => a.from - b.from);

    let cursor = 0;
    doorCuts.forEach((cut) => {
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

    const trim = new THREE.MeshStandardMaterial({ color: MAROON, roughness: 0.5 });

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

  /**
   * The window bank, and a slab of daylight beyond it. The outside is only ever
   * seen through three 3.6 x 3.0 holes, so a sky plane with a treeline in front
   * of it does the job — this room does not need the balcony's whole world.
   */
  private buildWindows(): void {
    LIVING_ROOM.windows.forEach((spec) => {
      const sash = buildSashWindow(spec.width, spec.height);
      sash.position.set(spec.along, spec.sill + spec.height / 2, D + WT / 2);
      sash.rotation.y = Math.PI;
      this.scene.add(sash);

      const curtains = buildSheerCurtains(spec.width, spec.height);
      curtains.position.set(spec.along, spec.sill + spec.height / 2, D - 0.3);
      curtains.rotation.y = Math.PI;
      this.scene.add(curtains);

      // Sill and apron inside
      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(spec.width + 0.5, 0.1, 0.34),
        new THREE.MeshStandardMaterial({ color: MAROON, roughness: 0.5 }),
      );
      sill.position.set(spec.along, spec.sill - 0.05, D - 0.14);
      sill.castShadow = true;
      this.scene.add(sill);

    });

    // As in the bedroom, no point light per window — the sun and the ambient
    // carry it, and lights are the expensive thing in these scenes, not polys.

    // Sky, well back so it never reads as wallpaper stuck to the glass
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 46),
      new THREE.MeshBasicMaterial({ color: 0x8fbce0, fog: false, depthWrite: false }),
    );
    sky.position.set(W / 2, 12, D + 34);
    sky.rotation.y = Math.PI;
    this.scene.add(sky);

    // Lawn running out from under the window, and a hedge and treeline on it
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 40),
      new THREE.MeshBasicMaterial({ color: 0x86b264, fog: false }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(W / 2, -4.6, D + 18);
    this.scene.add(ground);

    const hedge = new THREE.Mesh(
      new THREE.BoxGeometry(80, 3.2, 1.6),
      new THREE.MeshBasicMaterial({ color: 0x4e7a3c, fog: false }),
    );
    hedge.position.set(W / 2, -3, D + 12);
    this.scene.add(hedge);

    const canopy = new THREE.MeshBasicMaterial({ color: 0x3f6f38, fog: false });
    for (let i = 0; i < 9; i++) {
      const tree = new THREE.Mesh(new THREE.SphereGeometry(3.4 + (i % 3) * 1.1, 9, 7), canopy);
      tree.position.set(-24 + i * 11, 0.5 + (i % 4) * 1.4, D + 24 + (i % 2) * 5);
      tree.scale.y = 0.82;
      this.scene.add(tree);
    }
  }

  /** Skirting, picture rail and cornice — the things that make a room a room. */
  private buildTrim(): void {
    // Deep stained joinery against pale paper, which is the whole look of the
    // real room. The cornice stays white, because it is plaster, not timber.
    const timber = new THREE.MeshStandardMaterial({ color: MAROON, roughness: 0.45 });
    const plasterTrim = new THREE.MeshStandardMaterial({ color: 0xfbf7ef, roughness: 0.92 });

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
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(length, 0.3, 0.3), plasterTrim);
      cornice.position.set(x, CEILING - 0.15, z);
      cornice.rotation.y = yaw;
      this.scene.add(cornice);
    });

    // The fretwork archway across the middle of the room, which is the thing
    // anybody who has been in the real house remembers about it
    const arch = buildFretworkArch(W - 0.2, CEILING - 0.45);
    arch.position.set(W / 2, 0, gridToWorldZ(6) + 1);
    this.scene.add(arch);

    // Two ceiling roses with the globe chandeliers on them, one either side of
    // the arch, so both halves of the room have their own fitting
    [
      [gridToWorldX(7), gridToWorldZ(10)],
      [gridToWorldX(11), gridToWorldZ(3)],
    ].forEach(([x, z]) => {
      const light = buildGlobeChandelier(CEILING, 0);
      light.position.set(x, 0, z);
      this.scene.add(light);
    });
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

    // No wash lights under the track. They were three more per-pixel lights to
    // pick out paintings that a room with three south windows already lights.
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
        stripLights(lamp.group);
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
