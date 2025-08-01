import React, { useRef, useEffect, useState } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { LoadingScreen } from './LoadingScreen';
import { DialogModal } from './DialogModal';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [joystickDirection, setJoystickDirection] = useState<string | null>(null);
  const [nearBoxingRing, setNearBoxingRing] = useState(false);
  const [atBottomEdge, setAtBottomEdge] = useState(false);
  const [dialogState, setDialogState] = useState({
    isVisible: false,
    characterName: '',
    text: [] as string[],
    currentTextIndex: 0,
    imageSrc: '',
    imageTitle: ''
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
        const scripts = ['/utils.js', '/player.js', '/room.js', '/greenRoom.js', '/controls.js', '/game.js'];
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
          gameRef.current.showDialog = (characterName: string, text: string | string[], imageSrc?: string, imageTitle?: string) => {
            const textArray = Array.isArray(text) ? text : [text];
            setDialogState({
              isVisible: true,
              characterName,
              text: textArray,
              currentTextIndex: 0,
              imageSrc: imageSrc || '',
              imageTitle: imageTitle || ''
            });
          };
          
          gameRef.current.hideDialog = () => {
            setDialogState(prev => ({ 
              ...prev, 
              isVisible: false,
              currentTextIndex: 0,
              imageSrc: '',
              imageTitle: ''
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

  // Check proximity to boxing ring
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkProximity = () => {
      const player = gameRef.current.player;
      if (!player) return;

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);
      
      // Boxing ring is at x: 14-19, y: 0-5
      const ringX = 14;
      const ringY = 0;
      const ringWidth = 6;
      const ringHeight = 6;
      
      // Check if player is adjacent to (touching) the boxing ring
      let touchingRing = false;
      
      // Check all 8 adjacent cells around the player
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue; // Skip player's own cell
          
          const adjacentX = playerX + dx;
          const adjacentY = playerY + dy;
          
          // Check if this adjacent cell is part of the boxing ring
          if (adjacentX >= ringX && adjacentX < ringX + ringWidth &&
              adjacentY >= ringY && adjacentY < ringY + ringHeight) {
            touchingRing = true;
            break;
          }
        }
        if (touchingRing) break;
      }
      
      setNearBoxingRing(touchingRing);
    };

    const interval = setInterval(checkProximity, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at bottom edge of main room
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkBottomEdge = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'mainRoom') {
        setAtBottomEdge(false);
        return;
      }

      const playerY = Math.floor(player.gridY);
      
      // Check if player is at the bottom edge (y = 14, since room height is 15)
      setAtBottomEdge(playerY === 14);
    };

    const interval = setInterval(checkBottomEdge, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle dialog dismissal with keyboard
  useEffect(() => {
    // Handle dialog dismissal with keyboard
    const handleKeyPress = (e: KeyboardEvent) => {
      if (dialogState.isVisible) {
        e.preventDefault();
        if (e.key === 'Escape') {
          setDialogState(prev => ({ 
            ...prev, 
            isVisible: false,
            currentTextIndex: 0,
            imageSrc: '',
            imageTitle: ''
          }));
        } else {
          handleDialogContinue();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [dialogState.isVisible, dialogState.currentTextIndex, dialogState.text.length]);

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
        currentTextIndex: 0,
        imageSrc: '',
        imageTitle: ''
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

  const handleExamineBoxingRing = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Scrump", [
        "Oh my god this isn't any old backyard boxing ring...",
        "This is the legendary walterweight chicken poultry championship ring!",
        "The Scrumps debuted their EP First Peak here!",
        "fucking cool man"
      ], "/boxing-ring.jpg", "Boxing Ring");
    }
  };

  const handleSceneChange = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      const newScene = gameRef.current.currentScene === 'mainRoom' ? 'downstairs' : 'mainRoom';
      gameRef.current.loadScene(newScene);
    }
  };

  const handleGoDownstairs = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('downstairs');
    }
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && <LoadingScreen progress={loadingProgress} />}
      
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
      
      {/* Examine Boxing Ring Button */}
      {!isLoading && !dialogState.isVisible && nearBoxingRing && (
        <button
          onClick={handleExamineBoxingRing}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          EXAMINE BOXING RING
        </button>
      )}
      
      {/* Scene Switch Button */}
      {!isLoading && !dialogState.isVisible && (
        <button
          onClick={handleSceneChange}
          className="fixed top-4 left-4 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-green-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {gameRef.current?.currentScene === 'mainRoom' ? 'GO DOWNSTAIRS' : 'GO TO MAIN ROOM'}
        </button>
      )}
      
      {/* Go Downstairs Button - appears when at bottom edge */}
      {!isLoading && !dialogState.isVisible && atBottomEdge && (
        <button
          onClick={handleGoDownstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO DOWNSTAIRS
        </button>
      )}
      
      {!isLoading && <VirtualJoystick onMove={handleJoystickMove} />}
      
      <DialogModal
        isVisible={dialogState.isVisible}
        characterName={dialogState.characterName}
        text={dialogState.text}
        imageSrc={dialogState.imageSrc}
        imageTitle={dialogState.imageTitle}
        currentTextIndex={dialogState.currentTextIndex}
        onClose={() => setDialogState(prev => ({ 
          ...prev, 
          isVisible: false,
          currentTextIndex: 0,
          imageSrc: '',
          imageTitle: ''
        }))}
        onNextText={() => setDialogState(prev => ({
          ...prev,
          currentTextIndex: prev.currentTextIndex + 1
        }))}
      />
    </div>
  );
};