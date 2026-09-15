/**
 * The bedroom, east off the living room, where the last CD is sitting.
 *
 * Lined floor to ceiling in VJ boards, with a bank of five sash windows down
 * the north and east walls — the corner room of a Queenslander, which is all
 * glass and cross breeze. Daylight does nearly all the lighting; the bedside
 * lamp, the monitor somebody left on and the x-ray on its lightbox are just
 * things that happen to be switched on in a bright room.
 *
 * Placement comes from Bedroom.furniture, except the posters — the 2D room
 * hangs them a tile in from the wall, so BEDROOM.posters puts them on it.
 */

import * as THREE from 'three';
import { BEDROOM, BEDROOM_BLOCKERS, gridToWorldX, gridToWorldZ } from './constants';
import { applyWorldUVs, buildCD, buildHollandiaCan, createPickupGlow } from './props';
import {
  buildBeanbag,
  buildBed,
  buildClothesAirer,
  buildFloorCushions,
  buildLeaningMirror,
  buildStorageStack,
  buildCeilingFan,
  buildClothesPile,
  buildCrateStack,
  buildDesk,
  buildDresser,
  buildLaundryBasket,
  buildMosquitoCoil,
  buildNightstand,
  buildPedestalFan,
  buildRoomPoster,
  buildSashWindow,
  buildSmallBookshelf,
  buildWardrobe,
  buildXrayViewer,
} from './bedroomProps';
import {
  buildFloorLamp,
  buildFloorLitter,
  buildGuitar,
  buildRecordCrate,
  buildRug,
  buildStringLights,
} from './downstairsProps';
import {
  createFloorboardTexture,
  createKilimTexture,
  createPuffTexture,
  createVJBoardTexture,
  tiled,
} from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const W = BEDROOM.width;
const D = BEDROOM.depth;
const CEILING = BEDROOM.ceilingY;
const WT = BEDROOM.wallThickness;
const RAIL_Y = BEDROOM.railY;

/** Texture tiles per world unit. VJ boards land about 250mm wide. */
const VJ_DENSITY = 0.22;
const BOARD_DENSITY = 0.28;

/**
 * Remove any lights a decorative builder brought with it.
 *
 * Lights are the expensive thing in these scenes — the shader evaluates every
 * one of them per pixel, and going past about eight halves the frame rate. In
 * a daylit room the emissive on a bulb or a shade sells it on its own.
 */
function stripLights(group: THREE.Object3D): void {
  const lights: THREE.Object3D[] = [];
  group.traverse((object) => {
    if ((object as THREE.Light).isLight) lights.push(object);
  });
  lights.forEach((light) => light.removeFromParent());
}

export class BedroomScene extends PovScene {
  readonly blockers = BEDROOM_BLOCKERS;
  /**
   * You arrive by the door in the south-west corner. Looking north-east takes
   * in the bed, the desk under the window and the monitor still going.
   */
  readonly focus = { x: 11, y: 3 };

  private readonly boards: THREE.MeshStandardMaterial;
  private readonly lowDetail: boolean;

  constructor(room: RoomLike, lowDetail: boolean) {
    super();
    this.lowDetail = lowDetail;

    // Daylight haze only, well back — the room's diagonal is about 51 units and
    // anything nearer paints a wedge of fog across the ceiling.
    this.scene.fog = new THREE.Fog(0xdfe8f0, 60, 190);
    this.scene.background = new THREE.Color(0x8fbce0);

    this.boards = new THREE.MeshStandardMaterial({
      map: createVJBoardTexture(),
      // Nearly white: the ambient in here is blue, so anything with green in
      // the base colour comes back as teal glass rather than tired paint.
      color: 0xf6f3e4,
      roughness: 1,
      metalness: 0,
    });

    this.buildLighting();
    this.buildShell();
    this.buildTrim();
    this.buildWindows();
    this.buildDoorway();
    this.buildDressing();
    this.buildFurniture(room);
    this.buildExits();
  }

  // ------------------------------------------------------------------ lighting

  private buildLighting(): void {
    // Five windows' worth of sky. The ambient has to come up with them, or
    // every surface facing away from the glass reads as night again.
    this.scene.add(new THREE.AmbientLight(0xe4eefa, 2.0));
    // The ground half is the only thing lighting the ceiling boards, since
    // their normals point down and nothing in the room shines upward.
    this.scene.add(new THREE.HemisphereLight(0xdcecff, 0xbcae94, 1.9));

    // Morning sun in through the north-east corner, which is where the two
    // window walls meet. The only shadow caster in here.
    const sun = new THREE.DirectionalLight(0xfff4e0, 3.2);
    sun.position.set(W + 30, 28, -30);
    sun.target.position.set(W * 0.4, 0, D * 0.45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 110;
    sun.shadow.camera.left = -26;
    sun.shadow.camera.right = 26;
    sun.shadow.camera.top = 26;
    sun.shadow.camera.bottom = -26;
    sun.shadow.bias = -0.0009;
    sun.shadow.normalBias = 0.05;
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Bounce off the floor and the south wall, so the side of everything
    // facing away from the windows is lit rather than merely less bright
    const bounce = new THREE.DirectionalLight(0xffeedc, 0.85);
    bounce.position.set(W * 0.4, 1.5, D + 20);
    bounce.target.position.set(W * 0.5, 2.5, D * 0.3);
    this.scene.add(bounce);
    this.scene.add(bounce.target);
  }

  // --------------------------------------------------------------------- shell

  private wall(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    const d = Math.abs(z1 - z0);
    if (w < 0.001 || h < 0.001 || d < 0.001) return;

    const geometry = new THREE.BoxGeometry(w, h, d);
    applyWorldUVs(geometry, w, h, d, VJ_DENSITY);
    const mesh = new THREE.Mesh(geometry, this.boards);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  /**
   * A wall run along one axis with any number of openings cut out of it. Each
   * opening gets a pier either side, a spandrel under the sill and a head over
   * it; the piers between neighbouring openings are built once, not twice.
   */
  private wallWithOpenings(
    axis: 'x' | 'z',
    from: number,
    to: number,
    openings: { centre: number; width: number; sill: number; head: number }[],
    fixed: [number, number],
  ): void {
    const [f0, f1] = fixed;
    const cuts = openings
      .map((o) => ({ a: o.centre - o.width / 2, b: o.centre + o.width / 2, sill: o.sill, head: o.head }))
      .sort((x, y) => x.a - y.a);

    const solidRun = (p0: number, p1: number): void => {
      if (axis === 'x') this.wall(p0, p1, 0, CEILING, f0, f1);
      else this.wall(f0, f1, 0, CEILING, p0, p1);
    };
    const band = (p0: number, p1: number, y0: number, y1: number): void => {
      if (axis === 'x') this.wall(p0, p1, y0, y1, f0, f1);
      else this.wall(f0, f1, y0, y1, p0, p1);
    };

    let cursor = from;
    cuts.forEach((cut) => {
      solidRun(cursor, cut.a);
      band(cut.a, cut.b, 0, cut.sill);
      band(cut.a, cut.b, cut.head, CEILING);
      cursor = cut.b;
    });
    solidRun(cursor, to);
  }

  private buildShell(): void {
    // Floorboards, running the length of the room and darker than the ones
    // through in the living room because nothing in here gets waxed
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({
        map: tiled(createFloorboardTexture(), W * BOARD_DENSITY, D * BOARD_DENSITY),
        color: 0x8a6a48,
        roughness: 0.72,
        metalness: 0.02,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(W / 2, 0, D / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Beaded ceiling boards, running across the room
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(W + WT * 2, D + WT * 2),
      new THREE.MeshStandardMaterial({
        map: tiled(createVJBoardTexture(), D * VJ_DENSITY, W * VJ_DENSITY),
        color: 0xe4e2d2,
        roughness: 1,
      }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.rotation.z = Math.PI / 2;
    ceiling.position.set(W / 2, CEILING, D / 2);
    this.scene.add(ceiling);

    const opening = (w: (typeof BEDROOM.windows)[number]) => ({
      centre: w.along,
      width: w.width,
      sill: w.sill,
      head: w.sill + w.height,
    });
    const northWindows = BEDROOM.windows.filter((w) => w.wall === 'north').map(opening);
    const eastWindows = BEDROOM.windows.filter((w) => w.wall === 'east').map(opening);

    // North wall, with the three windows over the bed, the desk and the dresser
    this.wallWithOpenings('x', -WT, W + WT, northWindows, [-WT, 0]);

    // South wall, unbroken
    this.wall(-WT, W + WT, 0, CEILING, D, D + WT);

    // East wall, with two onto the side street
    this.wallWithOpenings('z', 0, D, eastWindows, [W, W + WT]);

    // West wall, with the door back through to the living room
    const door = BEDROOM.door;
    const dz0 = door.centre - door.width / 2;
    const dz1 = door.centre + door.width / 2;
    this.wall(-WT, 0, 0, CEILING, 0, dz0);
    this.wall(-WT, 0, 0, CEILING, dz1, D);
    this.wall(-WT, 0, door.height, CEILING, dz0, dz1);
  }

  /** Skirting, picture rail and a cornice mould, as every lined room has. */
  private buildTrim(): void {
    const trim = new THREE.MeshStandardMaterial({ color: 0xe4e0d0, roughness: 0.82 });

    const runs: [number, number, number, number][] = [
      [W / 2, 0.12, W, 0],
      [W / 2, D - 0.12, W, 0],
      [0.12, D / 2, D, Math.PI / 2],
      [W - 0.12, D / 2, D, Math.PI / 2],
    ];

    runs.forEach(([x, z, length, yaw]) => {
      const skirting = new THREE.Mesh(new THREE.BoxGeometry(length, 0.46, 0.14), trim);
      skirting.position.set(x, 0.23, z);
      skirting.rotation.y = yaw;
      skirting.receiveShadow = true;
      this.scene.add(skirting);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.14, 0.09), trim);
      rail.position.set(x, RAIL_Y, z);
      rail.rotation.y = yaw;
      rail.castShadow = true;
      this.scene.add(rail);

      const cornice = new THREE.Mesh(new THREE.BoxGeometry(length, 0.26, 0.26), trim);
      cornice.position.set(x, CEILING - 0.13, z);
      cornice.rotation.y = yaw;
      this.scene.add(cornice);
    });
  }

  // ------------------------------------------------------------------- windows

  /**
   * The window bank, and what is outside it. Each opening gets a sash frame and
   * a sill; the outside is a sky slab with a treeline and a neighbouring roof
   * on it, seen through five 3m holes, so it can stay cheap.
   */
  private buildWindows(): void {
    BEDROOM.windows.forEach((spec) => {
      const sash = buildSashWindow(spec.width, spec.height);
      const y = spec.sill + spec.height / 2;

      if (spec.wall === 'north') {
        sash.position.set(spec.along, y, -WT / 2);
      } else {
        sash.position.set(W + WT / 2, y, spec.along);
        sash.rotation.y = -Math.PI / 2;
      }
      this.scene.add(sash);

      // Sill inside
      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(spec.width + 0.5, 0.1, 0.34),
        new THREE.MeshStandardMaterial({ color: 0xe4e0d0, roughness: 0.82 }),
      );
      if (spec.wall === 'north') {
        sill.position.set(spec.along, spec.sill - 0.05, 0.12);
      } else {
        sill.position.set(W - 0.12, spec.sill - 0.05, spec.along);
        sill.rotation.y = Math.PI / 2;
      }
      sill.castShadow = true;
      this.scene.add(sill);
    });

    // Deliberately no point light per window. Every light in a scene costs a
    // per-pixel evaluation in the shader, and five of them here took the room
    // from 60fps to the mid twenties for a brightening the sun, the ambient and
    // the hemisphere already do.

    const north = this.buildDaylightBackdrop();
    north.position.set(W / 2, 0, -26);
    this.scene.add(north);

    const east = this.buildDaylightBackdrop();
    east.position.set(W + 26, 0, D / 2);
    east.rotation.y = -Math.PI / 2;
    this.scene.add(east);
  }

  /** Sky, a treeline and a neighbour's roof, for beyond the glass. */
  private buildDaylightBackdrop(): THREE.Group {
    const group = new THREE.Group();

    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 46),
      new THREE.MeshBasicMaterial({ color: 0x8fbce0, fog: false, depthWrite: false }),
    );
    sky.position.set(0, 16, 0);
    group.add(sky);

    // Ground, well below the sill so you are looking down on a yard
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 50),
      new THREE.MeshBasicMaterial({ color: 0x86a86a, fog: false }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -5.6, 18);
    group.add(ground);

    // A neighbour's roof, and a treeline behind it. Both kept low: you are on
    // the first floor looking down, so the eye line out of these windows is
    // mostly sky, and a treeline at sill height just paints the glass green.
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(26, 3.4, 12),
      new THREE.MeshBasicMaterial({ color: 0xa4aeb6, fog: false }),
    );
    roof.position.set(-16, -2.6, 8);
    roof.rotation.z = 0.08;
    group.add(roof);

    const canopy = new THREE.MeshBasicMaterial({ color: 0x4c7d42, fog: false });
    for (let i = 0; i < 11; i++) {
      const tree = new THREE.Mesh(new THREE.SphereGeometry(2.6 + (i % 3) * 1.1, 9, 7), canopy);
      tree.position.set(-34 + i * 8, -2.2 + (i % 4) * 1.1, 14 + (i % 2) * 5);
      tree.scale.y = 0.85;
      group.add(tree);
    }

    // A power line across it, because this is still Brisbane
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(90, 0.1, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x2b2f38, fog: false }),
    );
    line.position.set(0, 3.2, 1);
    line.rotation.z = 0.02;
    group.add(line);

    return group;
  }

  // -------------------------------------------------------------------- door

  private buildDoorway(): void {
    const door = BEDROOM.door;
    const trim = new THREE.MeshStandardMaterial({ color: 0xe4e0d0, roughness: 0.78 });

    [-1, 1].forEach((side) => {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.26, door.height + 0.3, 0.22), trim);
      jamb.position.set(0.1, door.height / 2, door.centre + (side * door.width) / 2);
      jamb.castShadow = true;
      this.scene.add(jamb);
    });

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, door.width + 0.48), trim);
    head.position.set(0.1, door.height + 0.12, door.centre);
    this.scene.add(head);

    // The living room beyond, warm and still lit, turned inside out
    const depth = 5;
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(depth, door.height + 0.8, door.width + 0.8),
      new THREE.MeshStandardMaterial({ color: 0x33261b, roughness: 1, side: THREE.BackSide }),
    );
    recess.position.set(-WT - depth / 2, (door.height + 0.8) / 2 - 0.4, door.centre);
    this.scene.add(recess);

    const recessFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(depth, door.width + 0.7),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.7 }),
    );
    recessFloor.rotation.x = -Math.PI / 2;
    recessFloor.rotation.z = Math.PI / 2;
    recessFloor.position.set(-WT - depth / 2, 0.01, door.centre);
    this.scene.add(recessFloor);

    const spill = new THREE.PointLight(0xffb070, 4.2, 12, 2);
    spill.position.set(-2.4, 1.9, door.centre);
    this.scene.add(spill);
  }

  // ---------------------------------------------------------------- dressing

  /** The 3D-only pieces. The blockers list is the three that are solid. */
  private buildDressing(): void {
    // Ceiling fan, dead centre, on the slow speed
    const fan = buildCeilingFan(CEILING);
    fan.group.position.set(gridToWorldX(10), 0, gridToWorldZ(8));
    this.scene.add(fan.group);
    this.animated.push(fan.animated);

    // Pedestal fan under the east window, pointed roughly at the bed
    const pedestal = buildPedestalFan();
    pedestal.group.position.set(gridToWorldX(18), 0, gridToWorldZ(13));
    pedestal.group.rotation.y = -2.2;
    this.scene.add(pedestal.group);
    this.animated.push(pedestal.animated);

    // Beanbag in the middle of the floor, where it is always in the way
    const beanbag = buildBeanbag(404);
    beanbag.position.set(gridToWorldX(13.5), 0, gridToWorldZ(8.5));
    this.scene.add(beanbag);

    // Milk crates doing duty as a second bedside table
    const crates = buildCrateStack();
    crates.position.set(gridToWorldX(2), 0, gridToWorldZ(6));
    this.scene.add(crates);

    // Fairy lights along the wall over the bed head, the only decorating
    // anybody has done in here
    const lights = buildStringLights(
      new THREE.Vector3(4, 3.05, 0.55),
      new THREE.Vector3(15, 2.75, 0.55),
      this.lowDetail ? 12 : 20,
      0.5,
    );
    stripLights(lights.group);
    this.scene.add(lights.group);
    this.animated.push(lights.animated);

    // A guitar leaning against the wardrobe, unplayed since the jam downstairs
    const guitar = buildGuitar();
    guitar.position.set(gridToWorldX(16.4), 0, gridToWorldZ(6));
    guitar.rotation.y = -1.1;
    guitar.rotation.z = 0.16;
    this.scene.add(guitar);

    // A mosquito coil going on the floor beside the bed
    const coil = buildMosquitoCoil();
    coil.group.position.set(gridToWorldX(6), 0.02, gridToWorldZ(5.6));
    this.scene.add(coil.group);
    this.animated.push(coil.animated);

    // Litter: socks, cans, a plate. Scattered where the walking is.
    [
      [gridToWorldX(12), gridToWorldZ(6), 71],
      [gridToWorldX(5), gridToWorldZ(13), 118],
      [gridToWorldX(15), gridToWorldZ(12), 209],
    ].forEach(([x, z, seed]) => {
      const litter = buildFloorLitter(seed, this.lowDetail ? 4 : 7, 1.6);
      litter.position.set(x, 0, z);
      this.scene.add(litter);
    });

    // Between the door and the far half of the room is otherwise bare floor,
    // which at this scale reads as a hall rather than somebody's bedroom. The
    // sitting corner goes on the room's rug, right along the arrival sightline,
    // and the lamp beside it gives the middle distance something lit.
    const cushions = buildFloorCushions(612);
    cushions.position.set(gridToWorldX(8.5), 0, gridToWorldZ(9));
    this.scene.add(cushions);

    // Off to one side of the arrival sightline, and two thirds the size of the
    // one downstairs — that one is scaled for a garage with a 4.6m ceiling.
    const lamp = buildFloorLamp(!this.lowDetail);
    stripLights(lamp.group);
    lamp.group.scale.setScalar(0.62);
    lamp.group.position.set(gridToWorldX(11), 0, gridToWorldZ(11));
    this.scene.add(lamp.group);
    this.animated.push(lamp.animated);

    // Records against the west wall, on the way out the door
    [14, 15].forEach((y, i) => {
      const crate = buildRecordCrate(330 + i * 17);
      crate.position.set(gridToWorldX(1), 0, gridToWorldZ(y));
      crate.rotation.y = Math.PI / 2 + (i - 0.5) * 0.14;
      this.scene.add(crate);
    });

    // The south wall run: everything that was going to get sorted out later
    const airer = buildClothesAirer();
    airer.position.set(gridToWorldX(5.5), 0, gridToWorldZ(15) + 0.3);
    airer.rotation.y = 0.12;
    this.scene.add(airer);

    const boxes = buildStorageStack(940);
    boxes.position.set(gridToWorldX(9.5), 0, gridToWorldZ(15) + 0.4);
    boxes.rotation.y = -0.18;
    this.scene.add(boxes);

    const mirror = buildLeaningMirror();
    mirror.position.set(gridToWorldX(13), 0, D - 0.3);
    mirror.rotation.y = Math.PI + 0.1;
    this.scene.add(mirror);

    if (!this.lowDetail) this.buildDustMotes();
  }

  /** Dust in the sunbeams, clustered where the windows are throwing light. */
  private buildDustMotes(): void {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const drift = new Float32Array(count);
    const windows = BEDROOM.windows;

    for (let i = 0; i < count; i++) {
      // Each mote belongs to one window's shaft, not to the room at large
      const spec = windows[i % windows.length];
      if (spec.wall === 'north') {
        positions[i * 3] = spec.along + (Math.random() - 0.5) * (spec.width + 2);
        positions[i * 3 + 2] = Math.random() * 7;
      } else {
        positions[i * 3] = W - Math.random() * 7;
        positions[i * 3 + 2] = spec.along + (Math.random() - 0.5) * (spec.width + 2);
      }
      positions[i * 3 + 1] = 0.4 + Math.random() * 3.2;
      drift[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xfff4e0,
        size: 0.035,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    this.scene.add(points);

    const attribute = geometry.attributes.position as THREE.BufferAttribute;
    this.animated.push({
      update: (time) => {
        for (let i = 0; i < count; i++) {
          const base = i * 3;
          attribute.array[base + 1] =
            0.4 + ((positions[base + 1] + time * 0.08 + drift[i]) % 3.2);
          attribute.array[base] = positions[base] + Math.sin(time * 0.3 + drift[i]) * 0.25;
        }
        attribute.needsUpdate = true;
      },
    });
  }

  // ----------------------------------------------------------------- furniture

  protected createFurnitureNode(f: Furniture): THREE.Object3D | null {
    switch (f.type) {
      case 'bed':
        return buildBed(f.width, f.height);

      case 'dresser':
        return buildDresser(f.width, f.height);

      case 'desk': {
        const desk = buildDesk(f.width, f.height);
        this.animated.push(desk.animated);
        // No point light off the monitor any more: it was there to be the only
        // cold source in a dark room, and in daylight its emissive is enough.
        return desk.group;
      }

      case 'wardrobe': {
        const wardrobe = buildWardrobe(f.width, f.height);
        // Backed onto the east wall, opening into the room
        wardrobe.rotation.y = -Math.PI / 2;
        return wardrobe;
      }

      case 'nightstand': {
        const stand = buildNightstand();
        this.animated.push(stand.animated);
        const lamp = new THREE.PointLight(0xffb066, 3.4, 10, 2);
        lamp.position.set(0, 1.18, 0);
        lamp.castShadow = false;
        stand.group.add(lamp);
        stand.group.rotation.y = -0.4;
        return stand.group;
      }

      case 'small_bookshelf': {
        const shelf = buildSmallBookshelf(f.width, f.height);
        shelf.rotation.y = -Math.PI / 2;
        return shelf;
      }

      case 'laundry_basket':
        return buildLaundryBasket();

      case 'clothes_pile':
        return buildClothesPile(f.x * 37 + f.y * 11);

      case 'rug': {
        const rug = buildRug(
          tiled(createKilimTexture(), 1, 1),
          f.width * 2 - 0.4,
          f.height * 2 - 0.4,
          0.02,
        );
        // At night the kilim is otherwise the loudest thing in the room
        (rug.material as THREE.MeshStandardMaterial).color.setHex(0x8a8070);
        return rug;
      }

      // Hung on the wall in buildPosters, not stood on the tile listed here
      case 'poster':
        return null;

      case 'xray': {
        const viewer = buildXrayViewer();
        this.animated.push(viewer.animated);

        // The lightbox actually lights the wall behind it
        const glow = new THREE.PointLight(0x9fd8ff, 4.5, 9, 2);
        glow.position.set(0, 0.9, 0.6);
        viewer.group.add(glow);

        // Same pickup halo every collectable gets, so it reads as one. It is a
        // flat disc on the floor, so it stays at the viewer's base.
        const halo = createPickupGlow(0x9fd8ff);
        viewer.group.add(halo.group);
        this.animated.push(halo.animated);

        // Angled off the dresser toward the middle of the room, so the film
        // faces whoever walks in rather than the wall beside it
        viewer.group.rotation.y = 0.75;
        return viewer.group;
      }

      case 'hollandia_can': {
        const { group, animated } = buildHollandiaCan();
        this.animated.push(animated);
        // Standing on the dresser top
        group.position.y = 1.18;
        return group;
      }

      case 'cd_item': {
        const { group, animated } = buildCD(f.songName ?? 'Unknown Track');
        this.animated.push(animated);
        // Left on the desk beside the keyboard
        group.position.y = 1.05;
        return group;
      }

      default:
        return null;
    }
  }

  /** Posters, on the north wall proper rather than a tile in from it. */
  private buildPosters(): void {
    BEDROOM.posters.forEach((spec, index) => {
      const poster = buildRoomPoster(index, spec.width, spec.height);
      // Hung off the picture rail, which is what stops them ending up on the
      // floor: at this ceiling height a full-size poster is nearly as tall as
      // the wall between the skirting and the rail.
      poster.position.set(spec.along, RAIL_Y - 0.25 - spec.height / 2, 0.06);
      this.scene.add(poster);
    });
  }

  private buildExits(): void {
    this.buildPosters();

    const label = makeLabelSprite('LIVING ROOM');
    label.position.set(0.9, BEDROOM.door.height + 0.5, BEDROOM.door.centre);
    this.addLabel(label);
  }
}
