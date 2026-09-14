/**
 * The bedroom, east off the living room, and the only room the game visits at
 * night — which is also where the last CD, Middle of the Night, is sitting.
 *
 * Lined floor to ceiling in VJ boards, with sash windows north and east. Almost
 * nothing in here is lit by a lamp: the moon comes through over the desk, the
 * streetlight comes through over the fan, and the rest is a bedside lamp, a
 * monitor left on, and an x-ray on a lightbox that nobody has explained.
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
  createNightSkyTexture,
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

    // Night fog, close enough to swallow the far corners but not the far wall
    this.scene.fog = new THREE.Fog(0x12141f, 14, 74);
    this.scene.background = new THREE.Color(0x070910);

    this.boards = new THREE.MeshStandardMaterial({
      map: createVJBoardTexture(),
      // Nearly white: the ambient in here is blue, so anything with green in
      // the base colour comes back as teal glass rather than tired paint.
      color: 0xf2efdf,
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
    // A real floor of blue so the room reads as dark rather than black. Too low
    // and every unlit surface collapses into the fog.
    this.scene.add(new THREE.AmbientLight(0x3e496e, 1.5));
    // The ground half is the only thing lighting the ceiling boards, since
    // their normals point down and nothing in the room shines upward. Set it
    // too dark and the ceiling goes black and the room reads as open air.
    this.scene.add(new THREE.HemisphereLight(0x5567a0, 0x5a4a52, 1.5));

    // Moonlight, in over the desk through the north window. The only shadow
    // caster: a second one at this light level just muddies the first.
    const north = BEDROOM.windows[0];
    const moon = new THREE.DirectionalLight(0xa8c6ff, 2.1);
    moon.position.set(north.along - 10, 22, -34);
    moon.target.position.set(north.along + 2, 0.5, 12);
    moon.castShadow = true;
    moon.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 90;
    moon.shadow.camera.left = -26;
    moon.shadow.camera.right = 26;
    moon.shadow.camera.top = 26;
    moon.shadow.camera.bottom = -26;
    moon.shadow.bias = -0.0007;
    moon.shadow.normalBias = 0.035;
    this.scene.add(moon);
    this.scene.add(moon.target);

    // Sodium streetlight through the east window, low and orange
    const east = BEDROOM.windows[1];
    const street = new THREE.DirectionalLight(0xffb060, 0.85);
    street.position.set(W + 26, 9, east.along + 6);
    street.target.position.set(W * 0.5, 0.5, east.along - 4);
    this.scene.add(street);
    this.scene.add(street.target);

    // Both windows throw a patch of their own colour onto the floor inside
    const moonPatch = new THREE.PointLight(0x9fbcff, 2.6, 16, 2);
    moonPatch.position.set(north.along, 2.2, 2.4);
    this.scene.add(moonPatch);

    const streetPatch = new THREE.PointLight(0xffa858, 2.0, 14, 2);
    streetPatch.position.set(W - 2.4, 2.2, east.along);
    this.scene.add(streetPatch);
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

  /** Cut one opening out of a wall run that lies along a single axis. */
  private wallWithOpening(
    axis: 'x' | 'z',
    from: number,
    to: number,
    opening: { centre: number; width: number; sill: number; head: number },
    fixed: [number, number],
  ): void {
    const a = opening.centre - opening.width / 2;
    const b = opening.centre + opening.width / 2;
    const [f0, f1] = fixed;

    if (axis === 'x') {
      // Wall runs along x; f0/f1 are the z faces
      this.wall(from, a, 0, CEILING, f0, f1);
      this.wall(b, to, 0, CEILING, f0, f1);
      this.wall(a, b, 0, opening.sill, f0, f1);
      this.wall(a, b, opening.head, CEILING, f0, f1);
    } else {
      this.wall(f0, f1, 0, CEILING, from, a);
      this.wall(f0, f1, 0, CEILING, b, to);
      this.wall(f0, f1, 0, opening.sill, a, b);
      this.wall(f0, f1, opening.head, CEILING, a, b);
    }
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
      new THREE.PlaneGeometry(W, D),
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

    const [north, east] = BEDROOM.windows;

    // North wall, with the window over the desk
    this.wallWithOpening(
      'x',
      -WT,
      W + WT,
      { centre: north.along, width: north.width, sill: north.sill, head: north.sill + north.height },
      [-WT, 0],
    );

    // South wall, unbroken
    this.wall(-WT, W + WT, 0, CEILING, D, D + WT);

    // East wall, with the window onto the side street
    this.wallWithOpening(
      'z',
      0,
      D,
      { centre: east.along, width: east.width, sill: east.sill, head: east.sill + east.height },
      [W, W + WT],
    );

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
   * Each window gets a sash frame in the opening and, a good way beyond it,
   * a slab of night sky with a neighbouring roofline in front of it. The
   * backdrops are only ever seen through a 5x2.6 hole, so they can be crude.
   */
  private buildWindows(): void {
    const [north, east] = BEDROOM.windows;

    const northSash = buildSashWindow(north.width, north.height);
    northSash.position.set(north.along, north.sill + north.height / 2, -WT / 2);
    this.scene.add(northSash);

    const eastSash = buildSashWindow(east.width, east.height);
    eastSash.position.set(W + WT / 2, east.sill + east.height / 2, east.along);
    eastSash.rotation.y = -Math.PI / 2;
    this.scene.add(eastSash);

    // Sills, inside and out
    [
      { pos: new THREE.Vector3(north.along, north.sill - 0.04, 0.12), yaw: 0, len: north.width + 0.6 },
      { pos: new THREE.Vector3(W - 0.12, east.sill - 0.04, east.along), yaw: Math.PI / 2, len: east.width + 0.6 },
    ].forEach(({ pos, yaw, len }) => {
      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.1, 0.32),
        new THREE.MeshStandardMaterial({ color: 0xe4e0d0, roughness: 0.82 }),
      );
      sill.position.copy(pos);
      sill.rotation.y = yaw;
      sill.castShadow = true;
      this.scene.add(sill);
    });

    const northBackdrop = this.buildNightBackdrop(true);
    northBackdrop.position.set(north.along, 0, -34);
    this.scene.add(northBackdrop);

    const eastBackdrop = this.buildNightBackdrop(false);
    eastBackdrop.position.set(W + 30, 0, east.along);
    eastBackdrop.rotation.y = -Math.PI / 2;
    this.scene.add(eastBackdrop);
  }

  /** Sky slab, a moon if asked for, and two rooflines in silhouette. */
  private buildNightBackdrop(withMoon: boolean): THREE.Group {
    const group = new THREE.Group();

    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 36),
      new THREE.MeshBasicMaterial({ map: createNightSkyTexture(), fog: false, depthWrite: false }),
    );
    sky.position.set(0, 10, 0);
    group.add(sky);

    if (withMoon) {
      // A hard disc for the moon itself: an untextured sprite is a square, and
      // the soft falloff has to come from a separate halo behind it.
      const moon = new THREE.Mesh(
        new THREE.CircleGeometry(1.3, 24),
        new THREE.MeshBasicMaterial({ color: 0xfff6e0, fog: false }),
      );
      moon.position.set(7, 20, 0.5);
      group.add(moon);

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createPuffTexture(),
          color: 0xbfd4ff,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          fog: false,
          depthWrite: false,
        }),
      );
      halo.scale.set(12, 12, 1);
      halo.position.set(7, 20, 0.3);
      group.add(halo);
    } else {
      // A streetlight, which is why this window is orange
      const lamp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createPuffTexture(),
          color: 0xffc078,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          fog: false,
          depthWrite: false,
        }),
      );
      lamp.scale.set(7, 7, 1);
      lamp.position.set(-9, 7.5, 1);
      group.add(lamp);
    }

    // Neighbouring roofs, flat black against the sky
    const silhouette = new THREE.MeshBasicMaterial({ color: 0x090b12, fog: false });
    const roofs: [number, number, number, number][] = [
      // x, width, ridge height, eaves height
      [-18, 26, 7.5, 4.6],
      [12, 22, 6.2, 3.8],
    ];
    roofs.forEach(([x, width, ridge, eaves]) => {
      const shape = new THREE.Shape();
      shape.moveTo(-width / 2, 0);
      shape.lineTo(-width / 2, eaves);
      shape.lineTo(0, ridge);
      shape.lineTo(width / 2, eaves);
      shape.lineTo(width / 2, 0);
      shape.closePath();
      const roof = new THREE.Mesh(new THREE.ShapeGeometry(shape), silhouette);
      roof.position.set(x, 0, 0.4);
      group.add(roof);
    });

    // A power line across the lot, because this is Brisbane
    const line = new THREE.Mesh(new THREE.BoxGeometry(70, 0.09, 0.02), silhouette);
    line.position.set(0, 9.4, 0.6);
    line.rotation.z = 0.03;
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

  /** Dust in the moonbeam. Only visible where a window is throwing light. */
  private buildDustMotes(): void {
    const count = 260;
    const positions = new Float32Array(count * 3);
    const drift = new Float32Array(count);
    const north = BEDROOM.windows[0];

    for (let i = 0; i < count; i++) {
      // Clustered into the two shafts rather than spread through the room
      const inMoon = i % 3 !== 0;
      positions[i * 3] = inMoon ? north.along + (Math.random() - 0.5) * 8 : W - Math.random() * 7;
      positions[i * 3 + 1] = 0.4 + Math.random() * 3.2;
      positions[i * 3 + 2] = inMoon ? Math.random() * 7 : BEDROOM.windows[1].along + (Math.random() - 0.5) * 8;
      drift[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xd8e4ff,
        size: 0.035,
        transparent: true,
        opacity: 0.5,
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
        // The monitor is the only cold light in the room and it needs to read
        // as the source of the glow on the desk, not just a bright rectangle.
        const glow = new THREE.PointLight(0x6d94ff, 3.2, 9, 2);
        glow.position.set(0, 1.5, 0.4);
        desk.group.add(glow);
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
        const lamp = new THREE.PointLight(0xffb066, 7.0, 13, 2);
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
