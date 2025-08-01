import React, { useRef, useEffect, useState } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { LoadingScreen } from './LoadingScreen';
import { DialogModal } from './DialogModal';
import { ExploreModal } from './ExploreModal';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const [joystickDirection, setJoystickDirection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dialogState, setDialogState] = useState({
    isVisible: false,
    characterName: '',
    text: [] as string[],
    currentTextIndex: 0
  });
  const [exploreModalState, setExploreModalState] = useState({
    isVisible: false,
    imageSrc: '/scrumps-character.png',
    title: 'Boxing Ring',
    description: 'A professional boxing ring stands before you, its blue canvas stretched tight across the square platform. Four red corner posts rise up, connected by white ropes that have seen countless matches.\n\nThe ring looks well-maintained despite being in this outdoor setting. You can almost hear the echoes of past fights - the sound of gloves hitting flesh, the roar of crowds, the referee counting down.\n\nWho built this here? And why? The mystery deepens as you examine the sturdy construction and professional setup. This isn\'t just some makeshift ring - this is the real deal.\n\nPerhaps there are clues nearby that might explain its presence in this strange place.'
  });
  const [nearBoxingRing, setNearBoxingRing] = useState(false);

  // Check if player is near boxing ring
  useEffect(() => {
    if (!gameRef.current) return;

    const checkProximity = () => {
      const player = gameRef.current.player;
      if (!player) return;

      // Boxing ring is at position (14, 0) with size 6x6
      const ringX = 14;
      const ringY = 0;
      const ringWidth = 6;
      const ringHeight = 6;

      // Check if player is adjacent to or inside the boxing ring area
      const playerX = Math.floor(player.x);
      const playerY = Math.floor(player.y);
      
      const isNear = (
        playerX >= ringX - 1 && playerX <= ringX + ringWidth &&
        playerY >= ringY - 1 && playerY <= ringY + ringHeight
      );

      setNearBoxingRing(isNear);
    };

    // Check proximity every frame
    const interval = setInterval(checkProximity, 100);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Load game scripts dynamically
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initGame = async () => {
      try {
        const scripts = ['/utils.js', '/player.js', '/room.js', '/controls.js', '/game.js'];
        const totalScripts = scripts.length;
        let loadedScripts = 0;
        
        // Load scripts one by one and update progress
        for (const script of scripts) {
          await loadScript(script);
          loadedScripts++;
          const progress = Math.round((loadedScripts / totalScripts) * 90); // Reserve 10% for game initialization
          setLoadingProgress(progress);
        }

        // Final initialization step
        setLoadingProgress(95);
        
        // Initialize the game
        const Game = (window as any).Game;
        if (Game) {
          gameRef.current = new Game();
          
          // Override dialog system to use React modal
          gameRef.current.showDialog = (characterName: string, text: string | string[]) => {
            const textArray = Array.isArray(text) ? text : [text];
            setDialogState({
              isVisible: true,
              characterName,
              text: textArray,
              currentTextIndex: 0
            });
          };
          
          gameRef.current.hideDialog = () => {
            setDialogState(prev => ({ 
              ...prev, 
              isVisible: false,
              currentTextIndex: 0
            }));
          };
          
          // Override the canvas element
          gameRef.current.canvas = canvas;
          gameRef.current.ctx = canvas.getContext('2d');
          gameRef.current.ctx.imageSmoothingEnabled = false;
          gameRef.current.resizeCanvas();
          
          // Complete loading
          setLoadingProgress(100);
          setTimeout(() => setIsLoading(false), 300); // Brief delay after 100%
        }
      } catch (error) {
        console.error('Failed to load game scripts:', error);
        // Handle loading error - you might want to show an error state
        setLoadingProgress(0);
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    // Start loading immediately
    initGame();

    return () => {
      // Cleanup
      if (gameRef.current) {
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Handle dialog dismissal with keyboard
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && exploreModalState.isVisible) {
        e.preventDefault();
        setExploreModalState(prev => ({ ...prev, isVisible: false }));
      } else if (dialogState.isVisible) {
        e.preventDefault();
        handleDialogContinue();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [dialogState.isVisible, dialogState.currentTextIndex, dialogState.text.length, exploreModalState.isVisible]);

  const handleDialogContinue = () => {
    if (dialogState.currentTextIndex < dialogState.text.length - 1) {
      // More text to show, go to next
      setDialogState(prev => ({
        ...prev,
        currentTextIndex: prev.currentTextIndex + 1
      }));
    } else {
      // End of dialog, close
      setDialogState(prev => ({ 
        ...prev, 
        isVisible: false,
        currentTextIndex: 0
      }));
    }
  };

  useEffect(() => {
    if (gameRef.current && joystickDirection) {
      // Send joystick input to game controls
      const controls = gameRef.current.controls;
      if (controls) {
        controls.movePlayer(joystickDirection);
      }
    }
  }, [joystickDirection]);

  const handleJoystickMove = (direction: string | null) => {
    setJoystickDirection(direction);
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && <LoadingScreen progress={loadingProgress} />}
      
      {/* Examine boxing ring button */}
      {!isLoading && !dialogState.isVisible && nearBoxingRing && (
        <button
          onClick={() => setExploreModalState(prev => ({ 
            ...prev, 
            isVisible: true,
            imageSrc: '/boxing-ring.jpg',
            title: 'Boxing Ring',
            description: 'The Scrumps EP debut at The Walterweight Chicken Poultry Championship Feb 2025'
          }))}
          className="absolute top-4 right-4 z-40 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm transition-colors"
        >
          Examine boxing ring
        </button>
      )}
      
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full bg-[#87ceeb] ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        style={{
          imageRendering: 'pixelated',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      />
      {!isLoading && <VirtualJoystick onMove={handleJoystickMove} />}
      
      <DialogModal
        isVisible={dialogState.isVisible}
        characterName={dialogState.characterName}
        text={dialogState.text}
        currentTextIndex={dialogState.currentTextIndex}
        onClose={() => setDialogState(prev => ({ 
          ...prev, 
          isVisible: false,
          currentTextIndex: 0
        }))}
        onNextText={() => setDialogState(prev => ({
          ...prev,
          currentTextIndex: prev.currentTextIndex + 1
        }))}
      />
      
      <ExploreModal
        isVisible={exploreModalState.isVisible}
        imageSrc={exploreModalState.imageSrc}
        title={exploreModalState.title}
        description={exploreModalState.description}
        onClose={() => setExploreModalState(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};