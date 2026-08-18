/**
 * The contract every first-person room implements, plus the machinery they all
 * share: furniture placement keyed off the 2D room data, companion syncing,
 * floating exit labels and Adele.
 *
 * A scene owns geometry and nothing else. Game state stays in the vanilla
 * `Game` object, and PovEngine pushes the relevant slices in every frame.
 */

import * as THREE from 'three';
import { GridRect, gridToWorldX, gridToWorldZ } from './constants';
import { Animated } from './props';
import { Character, buildAdele } from './characters';

/** The shape of a furniture entry as defined by the vanilla JS rooms. */
export interface Furniture {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  songName?: string;
  noCollision?: boolean;
}

export interface RoomLike {
  width: number;
  height: number;
  furniture: Furniture[];
  collisionMap: boolean[][];
}

export interface CompanionLike {
  type: string;
  x: number;
  y: number;
  direction: string;
}

/** The property manager, as tracked by `game.adele`. */
export interface AdeleLike {
  x: number;
  y: number;
  visible: boolean;
  isChasing: boolean;
}

/** Key identifying a furniture instance across rebuilds. */
export function furnitureKey(f: Furniture): string {
  return `${f.type}:${f.x}:${f.y}`;
}

/** Text label floating above exits, mirroring the 2D exit markers. */
export function makeLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for label');

  ctx.font = 'bold 60px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(text, 256, 64);
  ctx.fillStyle = '#ffeeaa';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
  );
  sprite.scale.set(4, 1, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export abstract class PovScene {
  readonly scene = new THREE.Scene();

  /** Tiles that are solid here but absent from the room's 2D collision map. */
  readonly blockers: readonly GridRect[] = [];

  /** Grid point the camera turns toward when the player arrives. */
  abstract readonly focus: { x: number; y: number };

  protected readonly animated: Animated[] = [];
  protected readonly characters: Character[] = [];
  /** Furniture meshes keyed so they can be hidden when the quest removes them. */
  protected readonly furnitureNodes = new Map<string, THREE.Object3D>();
  protected readonly companionNodes = new Map<
    string,
    { object: THREE.Object3D; character: Character; lastPos: THREE.Vector3 }
  >();
  protected readonly labels: THREE.Sprite[] = [];

  private adele: { character: Character; object: THREE.Object3D } | null = null;

  /** Build the 3D node for one furniture entry, or null to render nothing. */
  protected abstract createFurnitureNode(f: Furniture): THREE.Object3D | null;

  // ------------------------------------------------------------------ building

  /**
   * Place every entry in `room.furniture`. Nodes are centred over their whole
   * footprint; a builder that wants to sit up off the floor (a bottle on a
   * table, say) sets its own y and that survives.
   */
  protected buildFurniture(room: RoomLike): void {
    room.furniture.forEach((f) => {
      const node = this.createFurnitureNode(f);
      if (!node) return;

      node.position.set(
        gridToWorldX(f.x + (f.width - 1) / 2),
        node.position.y,
        gridToWorldZ(f.y + (f.height - 1) / 2),
      );
      this.scene.add(node);
      this.furnitureNodes.set(furnitureKey(f), node);
    });
  }

  protected addLabel(sprite: THREE.Sprite): void {
    this.scene.add(sprite);
    this.labels.push(sprite);
  }

  /** Companions that have a model in this room. Default: none. */
  protected buildCompanion(_type: string): Character | null {
    return null;
  }

  // --------------------------------------------------------------- live syncing

  /**
   * Hide anything the quest logic has removed from `room.furniture`.
   * Called every frame; it is a cheap map walk.
   */
  syncFurniture(room: RoomLike): void {
    if (!room?.furniture) return;

    const present = new Set(room.furniture.map(furnitureKey));
    this.furnitureNodes.forEach((node, key) => {
      const shouldShow = present.has(key);
      if (node.visible !== shouldShow) node.visible = shouldShow;
    });
  }

  /**
   * Mirror `game.companions` into the scene. Companions are keyed by type, so
   * each one is built once and then just repositioned.
   */
  syncCompanions(companions: CompanionLike[]): void {
    companions.forEach((companion) => {
      let entry = this.companionNodes.get(companion.type);

      if (!entry) {
        const character = this.buildCompanion(companion.type);
        if (!character) return;
        this.scene.add(character.group);
        entry = {
          object: character.group,
          character,
          lastPos: new THREE.Vector3(gridToWorldX(companion.x), 0, gridToWorldZ(companion.y)),
        };
        this.companionNodes.set(companion.type, entry);
        this.characters.push(character);
      }

      // Companions carry the same grid coordinates as the 2D renderer uses
      const x = gridToWorldX(companion.x);
      const z = gridToWorldZ(companion.y);

      // Turn to face the way they are travelling. Below a small threshold the
      // heading is just noise, so they hold their last facing instead.
      const dx = x - entry.lastPos.x;
      const dz = z - entry.lastPos.z;
      if (dx * dx + dz * dz > 0.0004) {
        const target = Math.atan2(dx, dz);
        const delta = Math.atan2(
          Math.sin(target - entry.object.rotation.y),
          Math.cos(target - entry.object.rotation.y),
        );
        entry.object.rotation.y += THREE.MathUtils.clamp(delta, -0.12, 0.12);
        entry.lastPos.set(x, 0, z);
      }

      entry.object.position.x = x;
      entry.object.position.z = z;
    });
  }

  /**
   * Adele walks every room she patrols, so she lives on the base class. She is
   * built the first time she is actually seen — most playthroughs never bring
   * her into a given room at all.
   */
  setAdele(adele: AdeleLike | null): void {
    const visible = adele?.visible === true;

    if (visible && !this.adele) {
      const character = buildAdele();
      this.scene.add(character.group);
      this.characters.push(character);
      this.adele = { character, object: character.group };
    }
    if (!this.adele) return;

    this.adele.object.visible = visible;
    if (!visible || !adele) return;

    const x = gridToWorldX(adele.x);
    const z = gridToWorldZ(adele.y);
    // Face the player while chasing; otherwise face the way she is drifting
    const target = Math.atan2(x - this.adele.object.position.x, z - this.adele.object.position.z);
    if (Math.abs(x - this.adele.object.position.x) + Math.abs(z - this.adele.object.position.z) > 0.02) {
      const delta = Math.atan2(
        Math.sin(target - this.adele.object.rotation.y),
        Math.cos(target - this.adele.object.rotation.y),
      );
      this.adele.object.rotation.y += THREE.MathUtils.clamp(delta, -0.15, 0.15);
    }
    this.adele.object.position.set(x, 0, z);
  }

  /** End-game arrivals. Only the backyard has anywhere to put them. */
  setBushTurkeyVisible(_visible: boolean): void {}
  setMrFengVisible(_visible: boolean): void {}

  // ---------------------------------------------------------------------- frame

  update(time: number, delta: number, playerPos: THREE.Vector3): void {
    this.animated.forEach((item) => item.update(time, delta));
    this.characters.forEach((character) => character.update(time, delta, playerPos));

    // Exit labels hold a roughly constant on-screen size and get out of the way
    // once you are close enough for the interaction button to have appeared.
    this.labels.forEach((label) => {
      const distance = label.position.distanceTo(playerPos);
      const width = THREE.MathUtils.clamp(distance * 0.16, 1.6, 4.5);
      label.scale.set(width, width / 4, 1);
      (label.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.smoothstep(distance, 3.5, 7);
    });
  }

  dispose(): void {
    this.scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.Sprite
      ) {
        object.geometry?.dispose?.();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose?.();
      }
    });
    this.scene.clear();
  }
}
