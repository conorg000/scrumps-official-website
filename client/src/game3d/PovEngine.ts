/**
 * First-person renderer and controller for the backyard.
 *
 * The engine never owns game state. Every frame it reads the live `Game`
 * instance created by client/public/game.js, moves the player within that grid,
 * and writes the result straight back onto `game.player`. All the existing
 * proximity checks, quest flags and dialog wiring keep working unchanged.
 */

import * as THREE from 'three';
import {
  EYE_HEIGHT,
  GRID_H,
  GRID_W,
  HORIZONTAL_FOV,
  MOUSE_SENSITIVITY,
  PITCH_LIMIT,
  PLAYER_RADIUS,
  SPRINT_MULTIPLIER,
  TOUCH_SENSITIVITY,
  TURN_SPEED,
  WALK_SPEED,
  gridToWorldX,
  gridToWorldZ,
  isPovBlocked,
} from './constants';
import { BackyardScene, Furniture, RoomLike } from './BackyardScene';

/** The subset of the vanilla Game object the engine touches. */
export interface GameLike {
  player: { x: number; y: number; gridX: number; gridY: number; direction: string; isMoving: boolean };
  room: RoomLike;
  currentScene: string;
  companions: { type: string; x: number; y: number; direction: string }[];
  frozen?: boolean;
  bushTurkeyVisible?: boolean;
  mrFengVisible?: boolean;
}

export type DPadDirection = 'up' | 'down' | 'left' | 'right' | null;

export class PovEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly world: BackyardScene;
  private readonly game: GameLike;
  private readonly canvas: HTMLCanvasElement;

  private yaw: number;
  private pitch = 0;
  private bobPhase = 0;

  private readonly keys = new Set<string>();
  private dpad: DPadDirection = null;
  private paused = false;
  /** Whether the backyard is the scene on screen right now. */
  private active = false;
  private disposed = false;

  /** Tiles blocked in the 2D map but flagged `noCollision`, so walkable here. */
  private passableTiles = new Set<number>();
  private passableSignature = -1;

  private readonly clock = new THREE.Clock();
  private frameHandle = 0;

  private lookPointerId: number | null = null;
  private lastPointer = { x: 0, y: 0 };

  private readonly playerWorldPos = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, game: GameLike) {
    this.canvas = canvas;
    this.game = game;

    const lowDetail =
      window.innerWidth <= 768 ||
      (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lowDetail,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowDetail ? 1.5 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(74, 1, 0.1, 400);
    // fov is recomputed from the aspect ratio in resize()

    this.world = new BackyardScene(game.room, lowDetail);

    // Open looking at the boxing ring, so Scrump's first line lands
    this.yaw = PovEngine.yawToward(game.player.x, game.player.y, 16.5, 2.5);

    this.resize();
    this.attachListeners();
  }

  // ------------------------------------------------------------------ lifecycle

  /** Yaw that points from one grid position toward another. */
  private static yawToward(fromX: number, fromY: number, toX: number, toY: number): number {
    const dx = toX - fromX;
    const dy = toY - fromY;
    // Camera forward in grid space is (-sin(yaw), -cos(yaw))
    return Math.atan2(-dx, -dy);
  }

  private attachListeners(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Drag-to-look rather than pointer lock: the quest UI is a set of on-screen
    // buttons, so the cursor has to stay available at all times.
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  /**
   * Start or stop driving the backyard. The engine is kept alive across scene
   * changes so returning from an interior does not rebuild the whole world.
   */
  setActive(active: boolean): void {
    if (this.disposed || this.active === active) return;
    this.active = active;

    if (active) {
      this.resetView();
      this.clock.getDelta(); // discard time spent in another scene
      this.frameHandle = requestAnimationFrame(this.loop);
    } else {
      cancelAnimationFrame(this.frameHandle);
      this.keys.clear();
      this.lookPointerId = null;
    }
  }

  /** Re-aim on entry and invalidate the cached walkability grid. */
  private resetView(): void {
    const { player } = this.game;
    this.yaw = PovEngine.yawToward(player.x, player.y, 16.5, 2.5);
    this.pitch = 0;
    this.passableSignature = -1;
  }

  dispose(): void {
    this.disposed = true;
    this.active = false;
    cancelAnimationFrame(this.frameHandle);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);

    this.world.dispose();
    this.renderer.dispose();
  }

  /** Freeze movement (dialog open, cutscene, caught by Adele). */
  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.lookPointerId = null;
  }

  /** Feed the on-screen d-pad. Up/down walk, left/right turn. */
  setDPad(direction: DPadDirection): void {
    this.dpad = direction;
  }

  // --------------------------------------------------------------------- input

  private onResize = (): void => this.resize();

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);

    const aspect = width / height;
    this.camera.aspect = aspect;

    // Three's fov is vertical, so a tall phone screen would crop the view down
    // to a slot. Hold the horizontal field of view instead and let the vertical
    // one open up, which keeps the framing consistent in portrait and landscape.
    const horizontalFov = THREE.MathUtils.degToRad(HORIZONTAL_FOV);
    const verticalFov = 2 * Math.atan(Math.tan(horizontalFov / 2) / aspect);
    this.camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(verticalFov), 55, 100);

    this.camera.updateProjectionMatrix();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    this.keys.add(event.code);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (this.paused || this.lookPointerId !== null) return;
    this.lookPointerId = event.pointerId;
    this.lastPointer = { x: event.clientX, y: event.clientY };
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.paused || this.lookPointerId !== event.pointerId) return;

    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.lastPointer = { x: event.clientX, y: event.clientY };

    const sensitivity = event.pointerType === 'touch' ? TOUCH_SENSITIVITY : MOUSE_SENSITIVITY * 2.4;
    this.applyLook(dx * sensitivity, dy * sensitivity);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.lookPointerId === event.pointerId) this.lookPointerId = null;
  };

  private applyLook(deltaYaw: number, deltaPitch: number): void {
    this.yaw -= deltaYaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch - deltaPitch, -PITCH_LIMIT, PITCH_LIMIT);
  }

  // ----------------------------------------------------------------- collision

  /**
   * Tiles are blocked by the shared collision map, except where every piece of
   * furniture covering the tile is flagged `noCollision` — those are pickups you
   * should be able to walk right up to.
   */
  private refreshPassableTiles(room: RoomLike): void {
    const signature = room.furniture.length;
    if (signature === this.passableSignature) return;
    this.passableSignature = signature;

    const blocking = new Set<number>();
    const passable = new Set<number>();

    room.furniture.forEach((f: Furniture) => {
      for (let y = f.y; y < f.y + f.height; y++) {
        for (let x = f.x; x < f.x + f.width; x++) {
          const key = y * GRID_W + x;
          if (f.noCollision) passable.add(key);
          else blocking.add(key);
        }
      }
    });

    blocking.forEach((key) => passable.delete(key));
    this.passableTiles = passable;
  }

  private isBlocked(gx: number, gy: number, room: RoomLike): boolean {
    const tx = Math.round(gx);
    const ty = Math.round(gy);

    if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) return true;

    // The house, its staircase and the balcony columns exist only in 3D, so the
    // 2D collision map still reports these tiles as open floor.
    if (isPovBlocked(tx, ty)) return true;

    if (!room.collisionMap?.[ty]?.[tx]) return false;

    return !this.passableTiles.has(ty * GRID_W + tx);
  }

  /** Sample the four corners of the player's footprint. */
  private collides(gx: number, gy: number, room: RoomLike): boolean {
    const r = PLAYER_RADIUS;
    return (
      this.isBlocked(gx - r, gy - r, room) ||
      this.isBlocked(gx + r, gy - r, room) ||
      this.isBlocked(gx - r, gy + r, room) ||
      this.isBlocked(gx + r, gy + r, room)
    );
  }

  // ---------------------------------------------------------------------- frame

  private loop = (): void => {
    if (this.disposed || !this.active) return;
    this.frameHandle = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;

    this.updateMovement(delta);
    this.syncWorld(time, delta);
    this.renderer.render(this.world.scene, this.camera);
  };

  private updateMovement(delta: number): void {
    const { player, room } = this.game;
    if (!player || !room) return;

    this.refreshPassableTiles(room);

    const blocked = this.paused || this.game.frozen === true;

    // Turning: arrow keys and the d-pad both rotate the view
    let turn = 0;
    if (!blocked) {
      if (this.keys.has('ArrowLeft')) turn += 1;
      if (this.keys.has('ArrowRight')) turn -= 1;
      if (this.dpad === 'left') turn += 1;
      if (this.dpad === 'right') turn -= 1;
    }
    this.yaw += turn * TURN_SPEED * delta;

    // Walking
    let forward = 0;
    let strafe = 0;
    if (!blocked) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.dpad === 'up') forward += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.dpad === 'down') forward -= 1;
      if (this.keys.has('KeyA')) strafe -= 1;
      if (this.keys.has('KeyD')) strafe += 1;
    }

    const moving = forward !== 0 || strafe !== 0;
    if (moving) {
      const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
      const speed = WALK_SPEED * (sprinting ? SPRINT_MULTIPLIER : 1) * delta;

      // Grid space is x-right / y-forward, and yaw 0 looks toward -y
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const length = Math.hypot(forward, strafe);
      const fx = forward / length;
      const sx = strafe / length;

      const moveX = (-sin * fx + cos * sx) * speed;
      const moveY = (-cos * fx - sin * sx) * speed;

      // Resolve each axis independently so walls slide instead of sticking
      const nextX = player.x + moveX;
      if (!this.collides(nextX, player.y, room)) player.x = nextX;

      const nextY = player.y + moveY;
      if (!this.collides(player.x, nextY, room)) player.y = nextY;

      // Keep inside the yard
      player.x = THREE.MathUtils.clamp(player.x, -0.5 + PLAYER_RADIUS, GRID_W - 0.5 - PLAYER_RADIUS);
      player.y = THREE.MathUtils.clamp(player.y, -0.5 + PLAYER_RADIUS, GRID_H - 0.5 - PLAYER_RADIUS);

      this.bobPhase += delta * (sprinting ? 13 : 9);
    } else {
      // Settle the head bob back to neutral when standing still
      this.bobPhase += delta * 2;
    }

    // Write back into the shape the rest of the game expects. The 2D Player
    // tween is disabled while we drive it, but keep its target in sync so
    // handing control back mid-scene cannot snap the player somewhere else.
    player.gridX = Math.round(player.x);
    player.gridY = Math.round(player.y);
    player.isMoving = false;
    player.direction = this.facingLabel();
    const tweened = player as unknown as { targetX: number; targetY: number };
    tweened.targetX = player.x;
    tweened.targetY = player.y;

    // Camera follows the player
    const bob = moving ? Math.sin(this.bobPhase) * 0.045 : Math.sin(this.bobPhase) * 0.008;
    const sway = moving ? Math.cos(this.bobPhase * 0.5) * 0.02 : 0;

    this.camera.position.set(
      gridToWorldX(player.x),
      EYE_HEIGHT + bob,
      gridToWorldZ(player.y),
    );
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotateY(this.yaw);
    this.camera.rotateX(this.pitch);
    this.camera.rotateZ(sway);
  }

  /**
   * Map the current yaw onto the four-way direction the 2D game stores.
   * Yaw 0 looks toward -grid-y ("up"); yaw increases counter-clockwise, so a
   * quarter turn from there faces -grid-x ("left").
   */
  private facingLabel(): string {
    const normalized = ((this.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (normalized < Math.PI / 4 || normalized >= (Math.PI * 7) / 4) return 'up';
    if (normalized < (Math.PI * 3) / 4) return 'left';
    if (normalized < (Math.PI * 5) / 4) return 'down';
    return 'right';
  }

  private syncWorld(time: number, delta: number): void {
    this.playerWorldPos.set(
      gridToWorldX(this.game.player.x),
      0,
      gridToWorldZ(this.game.player.y),
    );

    this.world.syncFurniture(this.game.room);
    this.world.syncCompanions(this.game.companions ?? []);
    this.world.setBushTurkeyVisible(this.game.bushTurkeyVisible === true);
    this.world.setMrFengVisible(this.game.mrFengVisible === true);
    this.world.update(time, delta, this.playerWorldPos);
  }
}
