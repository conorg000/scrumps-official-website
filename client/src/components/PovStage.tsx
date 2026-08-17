import React, { useEffect, useRef, useState } from 'react';
import { DPadDirection, GameLike, PovEngine } from '../game3d/PovEngine';

interface PovStageProps {
  /** The live Game instance created from client/public/game.js. */
  game: GameLike | null;
  /** True while the backyard is the scene on screen. */
  active: boolean;
  /** Freeze movement — dialog open, cutscene playing, mini-game running. */
  paused: boolean;
  /** Direction currently held on the on-screen d-pad, if any. */
  dpad: DPadDirection;
}

/**
 * Mounts the first-person backyard over the isometric canvas.
 *
 * The engine reads and writes the same Game object the rest of the app already
 * uses, so every quest flag, proximity button and dialog keeps working; this
 * component only owns the canvas and the POV-specific overlay.
 */
export const PovStage: React.FC<PovStageProps> = ({ game, active, paused, dpad }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PovEngine | null>(null);
  const [showHint, setShowHint] = useState(true);

  // Create the engine once the game object exists
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !game || engineRef.current) return;

    engineRef.current = new PovEngine(canvas, game);

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [game]);

  // Hand the backyard back and forth between the 3D and 2D renderers
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !game) return;

    engine.setActive(active);

    const anyGame = game as unknown as { use3D: boolean; controls?: { enabled: boolean } };
    anyGame.use3D = active;
    if (anyGame.controls) anyGame.controls.enabled = !active;
  }, [active, game]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    engineRef.current?.setDPad(active ? dpad : null);
  }, [dpad, active]);

  // The control hint is only useful until the player has actually looked around
  useEffect(() => {
    if (!active || !showHint) return;

    const dismiss = () => setShowHint(false);
    const timer = window.setTimeout(dismiss, 9000);
    window.addEventListener('pointerdown', dismiss, { once: true });
    window.addEventListener('keydown', dismiss, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', dismiss);
    };
  }, [active, showHint]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
          active ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        data-testid="canvas-pov"
      />

      {active && !paused && (
        <>
          {/* Crosshair */}
          <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
            <div className="relative w-6 h-6 opacity-60">
              <div className="absolute top-1/2 left-0 w-2 h-[2px] -translate-y-1/2 bg-white/90 rounded-full" />
              <div className="absolute top-1/2 right-0 w-2 h-[2px] -translate-y-1/2 bg-white/90 rounded-full" />
              <div className="absolute left-1/2 top-0 h-2 w-[2px] -translate-x-1/2 bg-white/90 rounded-full" />
              <div className="absolute left-1/2 bottom-0 h-2 w-[2px] -translate-x-1/2 bg-white/90 rounded-full" />
            </div>
          </div>

          {/* Vignette, to seat the render into the page */}
          <div
            className="fixed inset-0 z-30 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.28) 100%)',
            }}
          />

          {showHint && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-black/55 backdrop-blur-sm text-white/90 font-mono text-xs sm:text-sm px-4 py-2 rounded-full border border-white/20 whitespace-nowrap">
                <span className="hidden sm:inline">
                  DRAG to look &nbsp;·&nbsp; W/S walk &nbsp;·&nbsp; A/D strafe &nbsp;·&nbsp; ←/→ turn
                  &nbsp;·&nbsp; SHIFT run
                </span>
                <span className="sm:hidden">DRAG to look · ARROWS to move</span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
