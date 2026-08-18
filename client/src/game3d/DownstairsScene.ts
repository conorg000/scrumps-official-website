/**
 * Downstairs: the garage under the Queenslander, converted into a sharehouse.
 *
 * Concrete slab, painted besser block, exposed joists, one doorway of daylight
 * and a run of breeze blocks throwing bars of light across the floor. Everything
 * else is lamps, rugs and the accumulated debris of people who live in a garage.
 *
 * Placement of the furniture that the game knows about comes straight from
 * DownstairsRoom.furniture, exactly as in the backyard. The clutter that only
 * exists in 3D is pinned to the wall tiles listed in DOWNSTAIRS_BLOCKERS.
 */

import * as THREE from 'three';
import { DOWNSTAIRS, DOWNSTAIRS_BLOCKERS, gridToWorldX, gridToWorldZ } from './constants';
import { applyWorldUVs, buildBeerBottle, buildCD, buildHollandiaCan } from './props';
import {
  buildAmp,
  buildArmchair,
  buildBarFridge,
  buildCableRun,
  buildClothesRack,
  buildCoffeeTable,
  buildCouch,
  buildDrumKit,
  buildFloorLamp,
  buildFloorLitter,
  buildFluoroTube,
  buildGuitar,
  buildIndoorPlant,
  buildJamRug,
  buildJunkShelf,
  buildKeyboard,
  buildLavaLamp,
  buildMicrophone,
  buildMilkCrate,
  buildOilProjection,
  buildRecordCrate,
  buildRug,
  buildSpeakerStack,
  buildStringLights,
  buildTelly,
  buildTent,
} from './downstairsProps';
import { Character, buildMrTibbles, buildPossum } from './characters';
import {
  createBesserTexture,
  createPosterTexture,
  createPuffTexture,
  createRugTexture,
  createSlabTexture,
  createTapestryTexture,
  tiled,
} from './textures';
import { Furniture, PovScene, RoomLike, makeLabelSprite } from './PovScene';

const W = DOWNSTAIRS.width;
const D = DOWNSTAIRS.depth;
const CEILING = DOWNSTAIRS.ceilingY;
const WT = DOWNSTAIRS.wallThickness;

/** Texture tiles per world unit on the blockwork. One course ≈ 0.37 units. */
const BESSER_DENSITY = 0.68;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export class DownstairsScene extends PovScene {
  readonly blockers = DOWNSTAIRS_BLOCKERS;
  /** Open facing the jam corner, so the first thing you see is the drum kit. */
  readonly focus = { x: 17, y: 12 };

  private readonly besser: THREE.MeshStandardMaterial;
  private readonly lowDetail: boolean;

  constructor(room: RoomLike, lowDetail: boolean) {
    super();
    this.lowDetail = lowDetail;

    // Deep, close fog: it is a garage with three small openings, and the far
    // corners should genuinely fall away rather than just being dimly lit.
    this.scene.fog = new THREE.Fog(0x141020, 20, 76);
    this.scene.background = new THREE.Color(0x0b0912);

    this.besser = new THREE.MeshStandardMaterial({
      map: createBesserTexture(),
      color: 0xaaa396,
      roughness: 0.95,
      metalness: 0,
    });

    this.buildLighting();
    this.buildShell();
    this.buildScreens();
    this.buildDoorway();
    this.buildCeiling();
    this.buildWallDressing();
    this.buildRugs();
    this.buildClutter();
    this.buildPracticals();
    this.buildDustMotes();
    this.buildFurniture(room);
    this.buildExits();
  }

  // ------------------------------------------------------------------ lighting

  private buildLighting(): void {
    // Enough cool ambient to keep the room legible, and no more. Everything
    // that actually reads as lit is a lamp, the telly, or the doorway.
    this.scene.add(new THREE.AmbientLight(0x413c58, 1.15));
    this.scene.add(new THREE.HemisphereLight(0x4d5885, 0x352b23, 1.0));

    // Daylight punching through the open doorway. This is the only shadow
    // caster in the room, and it is doing a lot of work.
    const doorLight = new THREE.DirectionalLight(0xfff0d8, 2.4);
    doorLight.position.set(DOWNSTAIRS.doorway.centreX + 4, 7, -14);
    doorLight.target.position.set(DOWNSTAIRS.doorway.centreX - 2, 0, 10);
    doorLight.castShadow = true;
    doorLight.shadow.mapSize.set(this.lowDetail ? 1024 : 2048, this.lowDetail ? 1024 : 2048);
    doorLight.shadow.camera.near = 1;
    doorLight.shadow.camera.far = 70;
    doorLight.shadow.camera.left = -16;
    doorLight.shadow.camera.right = 16;
    doorLight.shadow.camera.top = 16;
    doorLight.shadow.camera.bottom = -16;
    doorLight.shadow.bias = -0.0008;
    doorLight.shadow.normalBias = 0.04;
    this.scene.add(doorLight);
    this.scene.add(doorLight.target);

    // Cooler spill coming in through the breeze blocks on the far side
    const screenLight = new THREE.DirectionalLight(0xbcd4ff, 1.15);
    screenLight.position.set(W + 18, 9, D + 14);
    screenLight.target.position.set(W * 0.6, 0, D * 0.6);
    this.scene.add(screenLight);
    this.scene.add(screenLight.target);

    // Warm bounce off the slab, so the seating half is not a black hole when
    // the floor lamp is the only thing near it
    const bounce = new THREE.DirectionalLight(0xffb98a, 0.5);
    bounce.position.set(-10, 5, 2);
    bounce.target.position.set(14, 1.5, 12);
    this.scene.add(bounce);
    this.scene.add(bounce.target);

    // Straight down the room from the doorway end. Without this the far wall
    // and the right-hand return fall to pure black between the practicals.
    const wash = new THREE.DirectionalLight(0x9fb0d8, 0.55);
    wash.position.set(W * 0.5, 5, -12);
    wash.target.position.set(W * 0.5, 1.5, D);
    this.scene.add(wash);
    this.scene.add(wash.target);
  }

  // --------------------------------------------------------------------- shell

  /** Box with world-scaled blockwork UVs, spanning the given world bounds. */
  private wall(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.Mesh {
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    const d = Math.abs(z1 - z0);
    const geometry = new THREE.BoxGeometry(w, h, d);
    applyWorldUVs(geometry, w, h, d, BESSER_DENSITY);
    const mesh = new THREE.Mesh(geometry, this.besser);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  private buildShell(): void {
    // The slab. One big plane; the map carries the joints and the stains.
    const slab = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({
        map: tiled(createSlabTexture(), 5, 4),
        color: 0xa8a49c,
        roughness: 0.82,
        metalness: 0.02,
      }),
    );
    slab.rotation.x = -Math.PI / 2;
    slab.position.set(W / 2, 0, D / 2);
    slab.receiveShadow = true;
    this.scene.add(slab);

    const [left, right, far] = DOWNSTAIRS.screens;
    const screenH = DOWNSTAIRS.blockSize;

    // Left wall (x = 0), with the breeze-block run cut out of it
    this.wall(-WT, 0, 0, CEILING, 0, left.from);
    this.wall(-WT, 0, 0, CEILING, left.to, D);
    this.wall(-WT, 0, 0, left.baseY, left.from, left.to);
    this.wall(-WT, 0, left.baseY + screenH, CEILING, left.from, left.to);

    // Right wall (x = W)
    this.wall(W, W + WT, 0, CEILING, 0, right.from);
    this.wall(W, W + WT, 0, CEILING, right.to, D);
    this.wall(W, W + WT, 0, right.baseY, right.from, right.to);
    this.wall(W, W + WT, right.baseY + screenH, CEILING, right.from, right.to);

    // Far wall (z = D)
    this.wall(0, far.from, 0, CEILING, D, D + WT);
    this.wall(far.to, W, 0, CEILING, D, D + WT);
    this.wall(far.from, far.to, 0, far.baseY, D, D + WT);
    this.wall(far.from, far.to, far.baseY + screenH, CEILING, D, D + WT);

    // Near wall (z = 0), with the doorway back out to the yard
    const door = DOWNSTAIRS.doorway;
    const doorL = door.centreX - door.width / 2;
    const doorR = door.centreX + door.width / 2;
    this.wall(-WT, doorL, 0, CEILING, -WT, 0);
    this.wall(doorR, W + WT, 0, CEILING, -WT, 0);
    this.wall(doorL, doorR, door.height, CEILING, -WT, 0);
  }

  /**
   * Decorative breeze blocks. Each block is a square frame with a diagonal
   * cross, which is the pattern on half the garages in Brisbane — and, more to
   * the point, throws a readable shape of light onto the slab.
   */
  private buildScreens(): void {
    const size = DOWNSTAIRS.blockSize;
    const bar = 0.24;
    const depth = WT;

    // Every bar in every block goes into one instanced draw
    const bars: { position: THREE.Vector3; rotation: number; scale: THREE.Vector3 }[] = [];

    const addBlock = (cx: number): void => {
      const half = (size - bar) / 2;
      // Frame
      bars.push({ position: new THREE.Vector3(cx, half, 0), rotation: 0, scale: new THREE.Vector3(size, bar, depth) });
      bars.push({ position: new THREE.Vector3(cx, -half, 0), rotation: 0, scale: new THREE.Vector3(size, bar, depth) });
      bars.push({ position: new THREE.Vector3(cx - half, 0, 0), rotation: 0, scale: new THREE.Vector3(bar, size, depth) });
      bars.push({ position: new THREE.Vector3(cx + half, 0, 0), rotation: 0, scale: new THREE.Vector3(bar, size, depth) });
      // Diagonal cross
      const diagonal = size * Math.SQRT2 - bar;
      bars.push({ position: new THREE.Vector3(cx, 0, 0), rotation: Math.PI / 4, scale: new THREE.Vector3(diagonal, bar * 0.8, depth) });
      bars.push({ position: new THREE.Vector3(cx, 0, 0), rotation: -Math.PI / 4, scale: new THREE.Vector3(diagonal, bar * 0.8, depth) });
    };

    DOWNSTAIRS.screens.forEach((screen) => {
      const run = screen.to - screen.from;
      const count = Math.max(1, Math.round(run / size));
      bars.length = 0;
      for (let i = 0; i < count; i++) addBlock((i - (count - 1) / 2) * (run / count));

      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x9aa094, roughness: 0.95 }),
        bars.length,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const matrix = new THREE.Matrix4();
      const quaternion = new THREE.Quaternion();
      bars.forEach((entry, i) => {
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), entry.rotation);
        matrix.compose(entry.position, quaternion, entry.scale);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;

      // A bright panel behind the blocks so the holes read as open sky
      const daylight = new THREE.Mesh(
        new THREE.PlaneGeometry(run, size),
        new THREE.MeshBasicMaterial({ color: 0x9dc0e6, fog: false }),
      );
      daylight.position.z = -depth * 0.6;

      const group = new THREE.Group();
      group.add(mesh);
      group.add(daylight);

      // Local +x runs along the wall, local +z points out of the room
      const centre = (screen.from + screen.to) / 2;
      const y = screen.baseY + size / 2;
      if (screen.wall === 'left') {
        group.position.set(-WT / 2, y, centre);
        group.rotation.y = Math.PI / 2;
      } else if (screen.wall === 'right') {
        group.position.set(W + WT / 2, y, centre);
        group.rotation.y = -Math.PI / 2;
      } else {
        group.position.set(centre, y, D + WT / 2);
        group.rotation.y = Math.PI;
      }
      this.scene.add(group);

      this.addLightShafts(screen.wall, centre, run, y);
    });
  }

  /**
   * The bars of light the screens throw into the room. Crossed additive quads
   * rather than real volumetrics: a fraction of the cost and, in a room this
   * dark, indistinguishable.
   */
  private addLightShafts(wall: string, centre: number, run: number, y: number): void {
    const material = new THREE.MeshBasicMaterial({
      map: createPuffTexture(),
      color: 0xcfe0ff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });

    const length = 7;
    const shafts = new THREE.Group();

    // Two quads sharing the beam axis. Built hanging straight down so the
    // crossing rotation is a plain spin about y, then the pair is tipped over
    // together to angle into the room.
    const beam = new THREE.Group();
    [0, Math.PI / 2].forEach((twist) => {
      const geometry = new THREE.PlaneGeometry(run * 0.9, length);
      geometry.translate(0, -length / 2, 0);
      const quad = new THREE.Mesh(geometry, material);
      quad.rotation.y = twist;
      beam.add(quad);
    });
    beam.rotation.x = -0.9;
    shafts.add(beam);
    shafts.renderOrder = 4;

    if (wall === 'left') {
      shafts.position.set(0.2, y, centre);
      shafts.rotation.y = Math.PI / 2;
    } else if (wall === 'right') {
      shafts.position.set(W - 0.2, y, centre);
      shafts.rotation.y = -Math.PI / 2;
    } else {
      shafts.position.set(centre, y, D - 0.2);
      shafts.rotation.y = Math.PI;
    }
    this.scene.add(shafts);
  }

  /** The doorway back to the yard, and a suggestion of the yard beyond it. */
  private buildDoorway(): void {
    const door = DOWNSTAIRS.doorway;

    // Painted timber reveal around the opening
    const reveal = new THREE.MeshStandardMaterial({ color: 0x6b6255, roughness: 0.85 });
    const jambGeometry = new THREE.BoxGeometry(0.18, door.height, WT + 0.1);
    [-1, 1].forEach((side) => {
      const jamb = new THREE.Mesh(jambGeometry, reveal);
      jamb.position.set(door.centreX + (side * door.width) / 2, door.height / 2, -WT / 2);
      jamb.castShadow = true;
      this.scene.add(jamb);
    });

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(door.width + 0.36, 0.2, WT + 0.1),
      reveal,
    );
    head.position.set(door.centreX, door.height, -WT / 2);
    this.scene.add(head);

    // What you can see outside: sunlit grass, then blown-out sky. Both are
    // unlit and unfogged so the opening reads as far brighter than the room.
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 34),
      new THREE.MeshBasicMaterial({ color: 0x8fb861, fog: false }),
    );
    lawn.rotation.x = -Math.PI / 2;
    // Kept entirely outside the room; at z = 0 it would slice a green line
    // across the near wall.
    lawn.position.set(door.centreX, 0.25, -17.6);
    this.scene.add(lawn);

    // Sky standing on the lawn, so the join reads as a horizon
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 40),
      new THREE.MeshBasicMaterial({ color: 0x9ec6e6, fog: false }),
    );
    sky.position.set(door.centreX, 20.25, -30);
    this.scene.add(sky);

    // A soft bloom in the plane of the opening itself
    const bloom = new THREE.Mesh(
      new THREE.PlaneGeometry(door.width + 2.5, door.height + 2),
      new THREE.MeshBasicMaterial({
        map: createPuffTexture(),
        color: 0xffeec8,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    bloom.position.set(door.centreX, door.height / 2, 0.25);
    bloom.renderOrder = 6;
    this.scene.add(bloom);
  }

  /** Exposed joists with the underside of the house floor above them. */
  private buildCeiling(): void {
    const deck = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ color: 0x3a2d20, roughness: 1, side: THREE.DoubleSide }),
    );
    deck.rotation.x = Math.PI / 2;
    deck.position.set(W / 2, CEILING + DOWNSTAIRS.joistDepth, D / 2);
    this.scene.add(deck);

    const joistMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.95 });
    const spacing = 1.9;
    const joist = new THREE.BoxGeometry(W, DOWNSTAIRS.joistDepth, 0.24);
    for (let z = spacing / 2; z < D; z += spacing) {
      const beam = new THREE.Mesh(joist, joistMaterial);
      beam.position.set(W / 2, CEILING + DOWNSTAIRS.joistDepth / 2, z);
      beam.castShadow = true;
      beam.receiveShadow = true;
      this.scene.add(beam);
    }

    // One bearer running the other way, on a couple of steel props
    const bearer = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.5, D),
      new THREE.MeshStandardMaterial({ color: 0x3d2d1e, roughness: 0.95 }),
    );
    bearer.position.set(W * 0.5, CEILING - 0.24, D / 2);
    bearer.castShadow = true;
    this.scene.add(bearer);

    [D * 0.22, D * 0.78].forEach((z) => {
      const prop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.13, CEILING - 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x6b6255, roughness: 0.6, metalness: 0.5 }),
      );
      prop.position.set(W * 0.5, (CEILING - 0.5) / 2, z);
      prop.castShadow = true;
      this.scene.add(prop);
    });
  }

  // ------------------------------------------------------------------ dressing

  private buildWallDressing(): void {
    // The oil-wheel projection, crawling across the wall beside the doorway
    const projection = buildOilProjection(14, 3.6);
    projection.mesh.position.set(9, 2.3, 0.35);
    this.scene.add(projection.mesh);
    this.animated.push(projection.animated);

    // Tapestry behind the jam corner
    const tapestry = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 3.6),
      new THREE.MeshStandardMaterial({
        map: createTapestryTexture(),
        roughness: 0.98,
        emissive: 0x1a0a2a,
        emissiveIntensity: 0.6,
        side: THREE.DoubleSide,
      }),
    );
    tapestry.position.set(W - 0.35, 2.55, 26.5);
    tapestry.rotation.y = -Math.PI / 2;
    this.scene.add(tapestry);

    // Gig posters, none of them straight
    const posters: [number, number, number, number][] = [
      // x, y, z, yaw
      [28.5, 2.5, 0.34, 0],
      [33.5, 2.2, 0.34, 0],
      [0.34, 2.4, 5.5, Math.PI / 2],
      [W - 0.34, 2.6, 13.6, -Math.PI / 2],
      [30.5, 2.3, D - 0.34, Math.PI],
    ];
    posters.forEach(([x, y, z, yaw], i) => {
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(1.05, 1.55),
        new THREE.MeshStandardMaterial({ map: createPosterTexture(i), roughness: 0.95 }),
      );
      poster.position.set(x, y, z);
      poster.rotation.set(0, yaw, (i % 2 === 0 ? 1 : -1) * (0.03 + i * 0.012));
      this.scene.add(poster);
    });
  }

  private buildRugs(): void {
    // The good rug, under the couch and coffee table
    const persian = buildRug(tiled(createRugTexture(), 1, 1), 11, 8, 0.06);
    persian.position.set(gridToWorldX(4), 0.02, gridToWorldZ(4));
    this.scene.add(persian);

    // The jam rug, which exists purely to stop the drum kit walking away
    const kilim = buildJamRug(9, 8, -0.12);
    kilim.position.set(gridToWorldX(16.5), 0.02, gridToWorldZ(11.5));
    this.scene.add(kilim);

    // Gaffer-tape marks left over from someone's stage plot, and the paint
    // that was spilled the day the garage was converted
    const tape = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9 });
    const marks: [number, number, number, number][] = [
      [18, 20, 1.4, 0.3],
      [18.9, 20.9, 0.3, 1.4],
      [26, 16, 1.6, 0.3],
      [12, 22, 0.3, 1.5],
    ];
    marks.forEach(([x, z, w, d]) => {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(w, d), tape);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(x, 0.012, z);
      this.scene.add(mark);
    });

    const spill = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 20),
      new THREE.MeshStandardMaterial({
        color: 0x2f6b8a,
        roughness: 0.55,
        transparent: true,
        opacity: 0.55,
        alphaMap: createPuffTexture(),
      }),
    );
    spill.rotation.x = -Math.PI / 2;
    spill.position.set(24.5, 0.014, 11);
    this.scene.add(spill);

    // A small shag mat in front of the telly, at an angle nobody has fixed
    const mat = buildRug(tiled(createRugTexture(), 2, 2), 4.5, 3, 0.5);
    mat.position.set(gridToWorldX(6), 0.02, gridToWorldZ(12));
    this.scene.add(mat);
  }

  /**
   * The 3D-only clutter. Every piece here sits on a tile listed in
   * DOWNSTAIRS_BLOCKERS, so the engine keeps the player out of it.
   */
  private buildClutter(): void {
    const place = (object: THREE.Object3D, gx: number, gy: number, yaw = 0): void => {
      object.position.set(gridToWorldX(gx), object.position.y, gridToWorldZ(gy));
      object.rotation.y = yaw;
      this.scene.add(object);
    };

    // Left wall: shelving and record crates (tiles 0, y4..y8)
    place(buildJunkShelf(5.5, 91), -0.2, 6, Math.PI / 2);
    place(buildRecordCrate(11), 0, 4, 0.3);
    const stackedCrate = buildRecordCrate(12);
    stackedCrate.position.y = 0.56;
    place(stackedCrate, 0, 4, -0.2);
    place(buildRecordCrate(13), 0, 8, 0.5);

    // Back-left: the fridge, the washing, the eternal pile
    place(buildBarFridge(), 0, 14, 0.35);
    place(buildClothesRack(), 1, 13, -0.5);
    place(buildMilkCrate(0x2e8a4a), 1, 14, 0.8);

    // Back wall: the telly, and the PA nobody has hooked up in months
    const telly = buildTelly();
    place(telly.group, 6, 14, Math.PI + 0.08);
    this.animated.push(telly.animated);
    place(buildMilkCrate(0xd8452e), 8, 14, 0.4);

    place(buildSpeakerStack(), 12.5, 14, Math.PI - 0.2);

    // Right wall: more shelving, more washing
    place(buildJunkShelf(6.0, 44), 19.2, 4, -Math.PI / 2);
    place(buildMilkCrate(0xe0a82c), 19, 7, -1.2);

    // Litter, thickest where people actually sit
    place(buildFloorLitter(21, 16, 9), 5, 4);
    place(buildFloorLitter(22, 12, 8), 15, 11);
    place(buildFloorLitter(23, 6, 6), 8, 11);

    // Power leads running from the jam corner back to a wall socket
    this.scene.add(
      buildCableRun([
        new THREE.Vector3(gridToWorldX(18), 0.05, gridToWorldZ(11)),
        new THREE.Vector3(gridToWorldX(15), 0.05, gridToWorldZ(9.4)),
        new THREE.Vector3(gridToWorldX(13.5), 0.05, gridToWorldZ(6)),
        new THREE.Vector3(gridToWorldX(12.4), 0.05, gridToWorldZ(3.6)),
      ]),
    );
    this.scene.add(
      buildCableRun([
        new THREE.Vector3(gridToWorldX(17.5), 0.05, gridToWorldZ(13.6)),
        new THREE.Vector3(gridToWorldX(19), 0.05, gridToWorldZ(12)),
        new THREE.Vector3(gridToWorldX(19.2), 0.05, gridToWorldZ(9)),
      ]),
    );
  }

  /** Everything that is actually emitting light in here. */
  private buildPracticals(): void {
    const lamp = buildFloorLamp(!this.lowDetail);
    lamp.group.position.set(gridToWorldX(0), 0, gridToWorldZ(3.2));
    this.scene.add(lamp.group);
    this.animated.push(lamp.animated);

    const lava = buildLavaLamp();
    // On the coffee table, next to everything else on the coffee table
    lava.group.position.set(gridToWorldX(4.85), 0.9, gridToWorldZ(6.2));
    lava.group.scale.setScalar(0.62);
    this.scene.add(lava.group);
    this.animated.push(lava.animated);

    const fluoro = buildFluoroTube(3.4);
    fluoro.group.position.set(gridToWorldX(10), CEILING - 0.16, gridToWorldZ(9));
    this.scene.add(fluoro.group);
    this.animated.push(fluoro.animated);

    // Party lights strung from the doorway wall across to the jam corner
    const strings = [
      buildStringLights(
        new THREE.Vector3(1.5, CEILING - 0.3, 3),
        new THREE.Vector3(W - 1.5, CEILING - 0.3, 7),
        this.lowDetail ? 8 : 12,
        0.9,
      ),
      buildStringLights(
        new THREE.Vector3(W - 1.5, CEILING - 0.3, 14),
        new THREE.Vector3(W - 2, CEILING - 0.3, D - 2),
        this.lowDetail ? 6 : 9,
        0.7,
      ),
    ];
    strings.forEach((run) => {
      this.scene.add(run.group);
      this.animated.push(run.animated);
    });
  }

  /**
   * Dust hanging in the air. Mostly invisible until it drifts through one of
   * the light shafts, which is exactly the point.
   */
  private buildDustMotes(): void {
    const count = this.lowDetail ? 160 : 420;
    const positions = new Float32Array(count * 3);
    const rand = seededRandom(4242);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = rand() * W;
      positions[i * 3 + 1] = 0.3 + rand() * (CEILING - 0.5);
      positions[i * 3 + 2] = rand() * D;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: createPuffTexture(),
        color: 0xd8e4ff,
        size: 0.08,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    motes.frustumCulled = false;
    this.scene.add(motes);

    const attribute = geometry.attributes.position as THREE.BufferAttribute;
    this.animated.push({
      update(_time, delta) {
        for (let i = 0; i < count; i++) {
          // Slow convection: up through the room, then round again
          let y = attribute.getY(i) + delta * (0.05 + (i % 7) * 0.012);
          if (y > CEILING - 0.2) y = 0.3;
          attribute.setY(i, y);
          attribute.setX(i, attribute.getX(i) + Math.sin(y * 2 + i) * delta * 0.06);
        }
        attribute.needsUpdate = true;
      },
    });
  }

  // ----------------------------------------------------------------- furniture

  protected createFurnitureNode(f: Furniture): THREE.Object3D | null {
    switch (f.type) {
      case 'couch':
        // Back to the near wall, facing the middle of the room
        return this.faced(buildCouch(f.width, f.height), 0.04);

      case 'chair':
        return this.faced(buildArmchair(), Math.PI * 0.86);

      case 'coffee_table':
        return buildCoffeeTable(f.width);

      case 'drum_kit': {
        const kit = buildDrumKit(f.width, f.height);
        this.animated.push(kit.animated);
        // The kit faces -z, so it is turned back toward the middle of the room
        return this.faced(kit.group, 0.98);
      }

      case 'guitar':
        return this.faced(buildGuitar(), -2.3);

      case 'keyboard':
        return this.faced(buildKeyboard(), -1.91);

      case 'microphone':
        return this.faced(buildMicrophone(), 0.8);

      case 'amp': {
        const amp = buildAmp();
        this.animated.push(amp.animated);
        return this.faced(amp.group, -0.56);
      }

      case 'tent': {
        const yaw = -1.22;
        const tent = buildTent(f.width, f.height);
        this.animated.push(tent.animated);

        // The possum, sitting in the mouth of the tent. He lives here now.
        // Added to the scene rather than parented to the tent, so his position
        // is in world space and he can turn to watch you cross the room.
        const possum = buildPossum();
        const mouth = (f.height * 2 - 0.8) / 2 - 0.25;
        possum.group.position.set(
          gridToWorldX(f.x + (f.width - 1) / 2) + Math.sin(yaw) * mouth,
          0.05,
          gridToWorldZ(f.y + (f.height - 1) / 2) + Math.cos(yaw) * mouth,
        );
        possum.group.rotation.y = yaw;
        possum.group.scale.setScalar(1.2);
        this.scene.add(possum.group);
        this.characters.push(possum);

        return this.faced(tent.group, yaw);
      }

      case 'plant': {
        const plant = buildIndoorPlant();
        this.animated.push(plant.animated);
        return plant.group;
      }

      case 'beer_bottle': {
        // This one sits on the coffee table, so it stands up rather than
        // lying in the grass the way the backyard bottle does.
        const bottle = buildBeerBottle();
        bottle.rotation.set(0, 0.7, 0);
        bottle.position.y = 0.91;
        bottle.scale.setScalar(0.55);
        return bottle;
      }

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

      default:
        return null;
    }
  }

  /** Turn a group about y, preserving whatever height its builder chose. */
  private faced(group: THREE.Group, yaw: number): THREE.Group {
    group.rotation.y = yaw;
    return group;
  }

  protected buildCompanion(type: string): Character | null {
    // Mr Tibbles follows you down here once he has joined
    return type === 'mr_tibbles' ? buildMrTibbles(0.85) : null;
  }

  private buildExits(): void {
    const label = makeLabelSprite('BACKYARD');
    label.position.set(DOWNSTAIRS.doorway.centreX, DOWNSTAIRS.doorway.height + 0.5, 0.6);
    this.addLabel(label);
  }
}
