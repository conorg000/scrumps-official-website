import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { LoadingScreen } from './LoadingScreen';
import { DialogModal } from './DialogModal';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isLoadingRef = useRef(true);
  const pendingDialogRef = useRef<{characterName: string, text: string[], imageSrc: string, imageTitle: string} | null>(null);
  const currentSpeakerRef = useRef<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('scrumps-sound-muted');
    return saved === 'true';
  });
  const [joystickDirection, setJoystickDirection] = useState<string | null>(null);
  const [nearBoxingRing, setNearBoxingRing] = useState(false);
  const [atBottomEdge, setAtBottomEdge] = useState(false);
  const [nearBeerBottle, setNearBeerBottle] = useState(false);
  const [nearBoxingGloves, setNearBoxingGloves] = useState(false);
  const [nearTree, setNearTree] = useState(false);
  const [nearKiddyPool, setNearKiddyPool] = useState(false);
  const [nearBeerPyramid, setNearBeerPyramid] = useState(false);
  const [nearMrTibbles, setNearMrTibbles] = useState(false);
  const [mrTibblesJoined, setMrTibblesJoined] = useState(false);
  const [nearCompost, setNearCompost] = useState(false);
  const [hasCompost, setHasCompost] = useState(false);
  const [nearPossum, setNearPossum] = useState(false);
  const [possumFed, setPossumFed] = useState(false);
  const [atTopEdge, setAtTopEdge] = useState(false);
  const [atRightEdge, setAtRightEdge] = useState(false);
  const [atLeftEdge, setAtLeftEdge] = useState(false);
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

    // Background music initialization function
    const initBackgroundMusic = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.src = '/background-music.mp3';
        audio.volume = 0.5;
        const savedMuted = localStorage.getItem('scrumps-sound-muted') === 'true';
        audio.muted = savedMuted;
        
        if (!savedMuted) {
          audio.play().catch(() => {
            // Auto-play prevented, music will start on first user interaction
            const startAudioOnInteraction = () => {
              if (!audio.muted) {
                audio.play();
              }
              document.removeEventListener('click', startAudioOnInteraction);
              document.removeEventListener('touchstart', startAudioOnInteraction);
              document.removeEventListener('keydown', startAudioOnInteraction);
            };
            
            document.addEventListener('click', startAudioOnInteraction);
            document.addEventListener('touchstart', startAudioOnInteraction);
            document.addEventListener('keydown', startAudioOnInteraction);
          });
        }
      }
    };

    // Start background music immediately
    initBackgroundMusic();

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
      const isDev = import.meta.env.DEV;
      const MINIMUM_LOADING_TIME = isDev ? 1000 : 10000; // 1 second in dev, 10 seconds in production
      const loadingStartTime = Date.now();
      let gameReady = false;
      
      try {
        const scripts = ['/utils.js', '/player.js', '/room.js', '/downstairsRoom.js', '/balcony.js', '/controls.js', '/game.js'];
        
        // Load scripts one by one (actual loading happens fast)
        for (const script of scripts) {
          await loadScript(script);
        }
        
        // Initialize the game
        const Game = (window as any).Game;
        if (Game) {
          gameRef.current = new Game();
          
          // Override dialog system to use React modal
          gameRef.current.showDialog = (characterName: string, text: string | string[], imageSrc?: string, imageTitle?: string) => {
            const textArray = Array.isArray(text) ? text : [text];
            const dialogData = {
              characterName,
              text: textArray,
              imageSrc: imageSrc || '',
              imageTitle: imageTitle || ''
            };

            // Track who's speaking for post-dialog actions
            currentSpeakerRef.current = characterName;

            // Queue dialogs during loading, show immediately after
            if (isLoadingRef.current) {
              pendingDialogRef.current = dialogData;
              return;
            }

            setDialogState({
              isVisible: true,
              ...dialogData,
              currentTextIndex: 0
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
          
          gameReady = true;
        }
        
        // Animate progress over minimum loading time regardless of actual load speed
        const animateProgress = () => {
          const elapsed = Date.now() - loadingStartTime;
          const targetProgress = Math.min((elapsed / MINIMUM_LOADING_TIME) * 100, 100);
          setLoadingProgress(Math.round(targetProgress));
          
          if (elapsed < MINIMUM_LOADING_TIME || !gameReady) {
            // Keep animating until both time elapsed AND game is ready
            requestAnimationFrame(animateProgress);
          } else {
            // Loading time complete and game is ready
            setLoadingProgress(100);
            setTimeout(() => {
              isLoadingRef.current = false;
              setIsLoading(false);
              
              // Show any dialog that was queued during loading
              if (pendingDialogRef.current) {
                const pending = pendingDialogRef.current;
                pendingDialogRef.current = null;
                setTimeout(() => {
                  setDialogState({
                    isVisible: true,
                    characterName: pending.characterName,
                    text: pending.text,
                    currentTextIndex: 0,
                    imageSrc: pending.imageSrc,
                    imageTitle: pending.imageTitle
                  });
                }, 500); // Small delay after loading screen fades
              }
            }, 300);
          }
        };
        
        animateProgress();
        
      } catch (error) {
        console.error('Failed to load game scripts:', error);
        // Handle loading error - you might want to show an error state
        setLoadingProgress(0);
        setTimeout(() => {
          isLoadingRef.current = false;
          setIsLoading(false);
        }, 1000);
      }
    };

    // Start loading immediately
    initGame();

    return () => {
      // Cleanup
      if (gameRef.current) {
        gameRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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

  // Check proximity to beer bottles, boxing gloves, and trees
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkObjectProximity = () => {
      const player = gameRef.current.player;
      const room = gameRef.current.room;
      if (!player || !room) return;

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);
      
      let touchingBeerBottle = false;
      let touchingBoxingGloves = false;
      let touchingTree = false;
      let touchingKiddyPool = false;
      let touchingBeerPyramid = false;
      let touchingMrTibbles = false;
      let touchingCompost = false;
      let touchingPossum = false;
      
      // Check all furniture for proximity
      room.furniture.forEach((furniture: any) => {
        // Check if player is adjacent to this furniture
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Skip player's own cell
            
            const adjacentX = playerX + dx;
            const adjacentY = playerY + dy;
            
            // Check if this adjacent cell is part of the furniture
            if (adjacentX >= furniture.x && adjacentX < furniture.x + furniture.width &&
                adjacentY >= furniture.y && adjacentY < furniture.y + furniture.height) {
              
              // Only check for examine-able furniture types, not collision boundaries
              if (furniture.type === 'beer_bottle') {
                touchingBeerBottle = true;
              } else if (furniture.type === 'boxing_gloves') {
                touchingBoxingGloves = true;
              } else if (furniture.type === 'tree') {
                touchingTree = true;
              } else if (furniture.type === 'kiddy_pool') {
                touchingKiddyPool = true;
              } else if (furniture.type === 'beer_pyramid') {
                touchingBeerPyramid = true;
              } else if (furniture.type === 'mr_tibbles') {
                touchingMrTibbles = true;
              } else if (furniture.type === 'compost') {
                touchingCompost = true;
              } else if (furniture.type === 'tent' || furniture.type === 'possum') {
                touchingPossum = true;
              }
            }
          }
        }
      });

      setNearBeerBottle(touchingBeerBottle);
      setNearBoxingGloves(touchingBoxingGloves);
      setNearTree(touchingTree);
      setNearKiddyPool(touchingKiddyPool);
      setNearBeerPyramid(touchingBeerPyramid);
      setNearMrTibbles(touchingMrTibbles);
      setNearCompost(touchingCompost);
      setNearPossum(touchingPossum);
    };

    const interval = setInterval(checkObjectProximity, 100);
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

  // Check if player is at top edge of downstairs room
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkTopEdge = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'downstairs') {
        setAtTopEdge(false);
        return;
      }

      const playerY = Math.floor(player.gridY);
      
      // Check if player is at the top edge (y = 0)
      setAtTopEdge(playerY === 0);
    };

    const interval = setInterval(checkTopEdge, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at right edge of main room
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkRightEdge = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'mainRoom') {
        setAtRightEdge(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      
      // Check if player is at the right edge (x = 19, since room width is 20)
      setAtRightEdge(playerX === 19);
    };

    const interval = setInterval(checkRightEdge, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at left edge of upstairs room
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkLeftEdge = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'upstairs') {
        setAtLeftEdge(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      
      // Check if player is at the left edge (x = 0)
      setAtLeftEdge(playerX === 0);
    };

    const interval = setInterval(checkLeftEdge, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle dialog continue - defined before the useEffect that uses it
  const handleDialogContinue = useCallback(() => {
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

      // Check if Mr Tibbles just finished talking - add him as companion
      if (currentSpeakerRef.current === 'Mr Tibbles' && !mrTibblesJoined) {
        setMrTibblesJoined(true);
        if (gameRef.current && gameRef.current.addCompanion) {
          gameRef.current.addCompanion('mr_tibbles');
        }
      }

      // Check if Possum just finished talking after being fed - add as companion
      if (currentSpeakerRef.current === 'Possum' && possumFed) {
        if (gameRef.current && gameRef.current.addCompanion) {
          gameRef.current.addCompanion('tent');
        }
      }
      currentSpeakerRef.current = null;
    }
  }, [dialogState.currentTextIndex, dialogState.text.length, mrTibblesJoined, possumFed]);

  // Handle dialog dismissal with keyboard
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (dialogState.isVisible) {
        e.preventDefault();
        if (e.key === 'Escape') {
          // Skip to end of dialog but still trigger companion logic
          setDialogState(prev => ({
            ...prev,
            currentTextIndex: prev.text.length - 1
          }));
          // Use setTimeout to let state update, then close properly
          setTimeout(() => handleDialogContinue(), 0);
        } else {
          handleDialogContinue();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [dialogState.isVisible, dialogState.currentTextIndex, dialogState.text.length, handleDialogContinue]);

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

  const handleExamineBeerBottle = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Scrump", [
        "Ah, a classic beer bottle.",
        "Looks like someone had a good time here.",
        "Still got a few drops left... tempting.",
        "Better leave it for now though."
      ]);
    }
  };

  const handleExamineBoxingGloves = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Scrump", [
        "These are some well-worn boxing gloves.",
        "They've seen their fair share of fights.",
        "I can smell the sweat and determination.",
        "Maybe I should try them on sometime..."
      ]);
    }
  };

  const handleExamineTree = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Scrump", [
        "This is a magnificent tree!",
        "Its branches reach high into the sky.",
        "I wonder how many years it's been growing here.",
        "Nature is pretty fucking cool."
      ]);
    }
  };

  const handleExamineKiddyPool = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Scrump", [
        "Oh wow, a kiddy pool!",
        "The water looks refreshingly cool.",
        "I wonder if I should take a dip...",
        "Nah, I'm a crisp - I'd probably get soggy!"
      ]);
    }
  };

  const handleExamineBeerPyramid = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Scrump", [
        "Holy shit, that's an epic beer pyramid!",
        "Someone really went all out building this masterpiece.",
        "Look at how perfectly balanced those bottles are...",
        "I bet whoever built this knows how to party!"
      ]);
    }
  };

  const handleExamineMrTibbles = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Mr Tibbles", [
        "Oh! You're awake!",
        "Wow you're lucky to be alive. That bush turkey has been coming back everyday to eat you guys.",
        "I guess that was a tactless way to break such sad news. Sorry.",
        "Today is inspection day, Adele is here, we have to tell the subletters to hide!",
        "Come on, follow me!"
      ]);
    }
  };

  const handleExamineCompost = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      if (hasCompost) {
        gameRef.current.showDialog("Scrump", [
          "I've already got a handful of this stinky stuff.",
          "I don't need any more compost right now."
        ]);
      } else {
        gameRef.current.showDialog("Scrump", [
          "Ooh, a compost bin!",
          "It's full of decomposing organic matter. Smells... earthy.",
          "Banana peels, coffee grounds, eggshells...",
          "I bet some creature would love this stuff.",
          "*You grab a handful of compost*"
        ]);
        setHasCompost(true);
      }
    }
  };

  const handleTalkToPossum = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      if (possumFed) {
        gameRef.current.showDialog("Possum", [
          "*munch munch*",
          "Still no idea where those subletters are mate.",
          "But I'm here for moral support!"
        ]);
      } else if (hasCompost) {
        // Give compost to possum
        gameRef.current.showDialog("Possum", [
          "*sniff sniff*",
          "Is that... COMPOST?!",
          "*You hand over the compost*",
          "*MUNCH MUNCH MUNCH*",
          "Oh mate, that's the good stuff. Banana peels. Beautiful.",
          "You wanted to know where the subletters are hiding?",
          "...",
          "Yeah I have absolutely no idea.",
          "But I appreciate the compost so much I'll help you look!",
          "Let's go!"
        ]);
        setHasCompost(false);
        setPossumFed(true);
        // Possum will join as companion after dialog
        currentSpeakerRef.current = 'Possum';
      } else {
        gameRef.current.showDialog("Possum", [
          "*hisssss*",
          "What do you want, crispy boy?",
          "I'm not talking to anyone unless they bring me food.",
          "Something from the compost would be nice...",
          "Banana peels, coffee grounds, the good stuff.",
          "Come back when you have something tasty."
        ]);
      }
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

  const handleGoToBackyard = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('mainRoom');
    }
  };

  const handleGoUpstairs = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('upstairs');
    }
  };

  const handleGoToBackyardFromUpstairs = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('mainRoom');
    }
  };

  const toggleSound = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('scrumps-sound-muted', String(newMuted));
    
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
      if (!newMuted) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Background Music Audio Element */}
      <audio 
        ref={audioRef}
        src="/background-music.mp3"
        preload="auto"
        loop
        style={{ display: 'none' }}
      />

      {isLoading && <LoadingScreen progress={loadingProgress} />}
      
      {/* Sound Toggle Button - Top Left */}
      {!isLoading && (
        <button
          onClick={toggleSound}
          className={`fixed top-4 left-4 w-14 h-14 rounded-full font-mono text-2xl shadow-xl border-4 transition-all duration-300 hover:scale-110 hover:rotate-12 active:scale-95 z-[150] flex items-center justify-center ${
            isMuted 
              ? 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-200 hover:from-gray-200 hover:to-gray-300' 
              : 'bg-gradient-to-br from-green-400 to-green-600 border-green-300 hover:from-green-300 hover:to-green-500'
          }`}
          style={{
            boxShadow: isMuted 
              ? '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255,255,255,0.3)' 
              : '0 0 20px rgba(34, 197, 94, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
            textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
          }}
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
          data-testid="button-sound-toggle"
        >
          {isMuted ? '🔇' : '🎵'}
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
      
      {/* Examine Boxing Ring Button */}
      {!isLoading && !dialogState.isVisible && nearBoxingRing && gameRef.current?.currentScene === 'mainRoom' && (
        <button
          onClick={handleExamineBoxingRing}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          EXAMINE BOXING RING
        </button>
      )}
      
      {/* Examine Beer Bottle Button */}
      {!isLoading && !dialogState.isVisible && nearBeerBottle && !nearBoxingRing && !nearBeerPyramid && (
        <button
          onClick={handleExamineBeerBottle}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          EXAMINE BEER BOTTLE
        </button>
      )}
      
      {/* Examine Boxing Gloves Button */}
      {!isLoading && !dialogState.isVisible && nearBoxingGloves && !nearBoxingRing && !nearBeerBottle && !nearBeerPyramid && (
        <button
          onClick={handleExamineBoxingGloves}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          EXAMINE BOXING GLOVES
        </button>
      )}
      
      {/* Examine Tree Button */}
      {!isLoading && !dialogState.isVisible && nearTree && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearKiddyPool && !nearBeerPyramid && (
        <button
          onClick={handleExamineTree}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          EXAMINE TREE
        </button>
      )}
      
      {/* Examine Kiddy Pool Button */}
      {!isLoading && !dialogState.isVisible && nearKiddyPool && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearBeerPyramid && (
        <button
          onClick={handleExamineKiddyPool}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          EXAMINE KIDDY POOL
        </button>
      )}
      
      {/* Examine Beer Pyramid Button */}
      {!isLoading && !dialogState.isVisible && nearBeerPyramid && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearKiddyPool && !nearMrTibbles && (
        <button
          onClick={handleExamineBeerPyramid}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          EXAMINE BEER PYRAMID
        </button>
      )}

      {/* Talk to Mr Tibbles Button - only show if he hasn't joined yet */}
      {!isLoading && !dialogState.isVisible && nearMrTibbles && !mrTibblesJoined && gameRef.current?.currentScene === 'mainRoom' && (
        <button
          onClick={handleExamineMrTibbles}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          TALK TO MR TIBBLES
        </button>
      )}

      {/* Examine Compost Button - on the balcony */}
      {!isLoading && !dialogState.isVisible && nearCompost && gameRef.current?.currentScene === 'upstairs' && (
        <button
          onClick={handleExamineCompost}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {hasCompost ? 'EXAMINE COMPOST' : 'COLLECT COMPOST'}
        </button>
      )}

      {/* Talk to Possum Button - in the downstairs room */}
      {!isLoading && !dialogState.isVisible && nearPossum && gameRef.current?.currentScene === 'downstairs' && (
        <button
          onClick={handleTalkToPossum}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {possumFed ? 'TALK TO POSSUM' : (hasCompost ? 'GIVE COMPOST TO POSSUM' : 'INVESTIGATE TENT')}
        </button>
      )}

      {/* Go Downstairs Button - appears when at bottom edge */}
      {!isLoading && !dialogState.isVisible && atBottomEdge && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearKiddyPool && !nearBeerPyramid && !nearMrTibbles && (
        <button
          onClick={handleGoDownstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO DOWNSTAIRS
        </button>
      )}
      
      {/* Go to Backyard Button - appears when at top edge of downstairs room */}
      {!isLoading && !dialogState.isVisible && atTopEdge && gameRef.current?.currentScene === 'downstairs' && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearKiddyPool && !nearBeerPyramid && (
        <button
          onClick={handleGoToBackyard}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BACKYARD
        </button>
      )}
      
      {/* Go Upstairs Button - appears when at right edge of main room */}
      {!isLoading && !dialogState.isVisible && atRightEdge && gameRef.current?.currentScene === 'mainRoom' && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearKiddyPool && !nearBeerPyramid && !atBottomEdge && (
        <button
          onClick={handleGoUpstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO UPSTAIRS
        </button>
      )}
      
      {/* Go to Backyard Button - appears when at left edge of upstairs room */}
      {!isLoading && !dialogState.isVisible && atLeftEdge && gameRef.current?.currentScene === 'upstairs' && (
        <button
          onClick={handleGoToBackyardFromUpstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BACKYARD
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
        onClose={handleDialogContinue}
        onNextText={handleDialogContinue}
      />
    </div>
  );
};