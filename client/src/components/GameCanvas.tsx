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
  const [atBalconyBottomLeft, setAtBalconyBottomLeft] = useState(false);
  const [atBalconyBottomRight, setAtBalconyBottomRight] = useState(false);
  const [atLivingRoomTopRight, setAtLivingRoomTopRight] = useState(false);
  const [nearTinyClown, setNearTinyClown] = useState(false);
  const [nearHollandiaCan, setNearHollandiaCan] = useState(false);
  const [nearCD, setNearCD] = useState(false);
  const [hollandiaCount, setHollandiaCount] = useState(0);
  const [collectedCDs, setCollectedCDs] = useState<string[]>([]);
  const [tinyClownJoined, setTinyClownJoined] = useState(false);
  const [hasLadder, setHasLadder] = useState(false);
  const [nearLadder, setNearLadder] = useState(false);
  const [hasXray, setHasXray] = useState(false);
  const [nearXray, setNearXray] = useState(false);
  const [atLivingRoomRight, setAtLivingRoomRight] = useState(false);
  const [atBedroomLeft, setAtBedroomLeft] = useState(false);
  const [nearHumunculous, setNearHumunculous] = useState(false);
  const [humunculousJoined, setHumunculousJoined] = useState(false);
  const [isChaseActive, setIsChaseActive] = useState(false);
  const [atLivingRoomLeft, setAtLivingRoomLeft] = useState(false);
  const [atFrontPorchRight, setAtFrontPorchRight] = useState(false);
  const [nearLadderSpot, setNearLadderSpot] = useState(false);
  const [ladderPlaced, setLadderPlaced] = useState(false);
  const [atRooftopLadder, setAtRooftopLadder] = useState(false);
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
        const scripts = ['/utils.js', '/player.js', '/room.js', '/downstairsRoom.js', '/balcony.js', '/livingRoom.js', '/bedroom.js', '/frontPorch.js', '/rooftop.js', '/controls.js', '/game.js'];
        
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

  // Check if player is at left edge of upstairs room (top half - to go back to backyard)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkLeftEdge = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'upstairs') {
        setAtLeftEdge(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Left edge, top half (x <= 1 and y <= 7) - goes to backyard
      setAtLeftEdge(playerX <= 1 && playerY <= 7);
    };

    const interval = setInterval(checkLeftEdge, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at bottom-left of balcony (to go to living room)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkBalconyBottomLeft = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'upstairs') {
        setAtBalconyBottomLeft(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Bottom-left area of balcony (y >= 8 and x <= 4) - goes to living room
      setAtBalconyBottomLeft(playerY >= 8 && playerX <= 4);
    };

    const interval = setInterval(checkBalconyBottomLeft, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at bottom-right of balcony (to go back to backyard)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkBalconyBottomRight = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'upstairs') {
        setAtBalconyBottomRight(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Bottom-right area of balcony (y >= 12 and x >= 16) - goes to backyard
      setAtBalconyBottomRight(playerY >= 12 && playerX >= 16);
    };

    const interval = setInterval(checkBalconyBottomRight, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at top-right of living room (to go back to balcony)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkLivingRoomTopRight = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'livingRoom') {
        setAtLivingRoomTopRight(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Top-right area of living room (y <= 3 and x >= 16)
      setAtLivingRoomTopRight(playerY <= 3 && playerX >= 16);
    };

    const interval = setInterval(checkLivingRoomTopRight, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at right edge of living room (to go to bedroom)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkLivingRoomRight = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'livingRoom') {
        setAtLivingRoomRight(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Right edge of living room (x >= 18 and y > 6)
      setAtLivingRoomRight(playerX >= 18 && playerY > 6);
    };

    const interval = setInterval(checkLivingRoomRight, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at left edge of bedroom (to go back to living room)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkBedroomLeft = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'bedroom') {
        setAtBedroomLeft(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Left edge of bedroom (x <= 1 and y > 8)
      setAtBedroomLeft(playerX <= 1 && playerY > 8);
    };

    const interval = setInterval(checkBedroomLeft, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at left edge of living room (to go to front porch)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkLivingRoomLeft = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'livingRoom') {
        setAtLivingRoomLeft(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Left edge of living room (x <= 1 and y > 10)
      setAtLivingRoomLeft(playerX <= 1 && playerY > 10);
    };

    const interval = setInterval(checkLivingRoomLeft, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at right edge of front porch (to go back to living room)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkFrontPorchRight = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'frontPorch') {
        setAtFrontPorchRight(false);
        return;
      }

      const playerX = Math.floor(player.gridX);

      // Right edge of front porch
      setAtFrontPorchRight(playerX >= 18);
    };

    const interval = setInterval(checkFrontPorchRight, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is near ladder spot on front porch
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkLadderSpot = () => {
      const player = gameRef.current.player;
      const room = gameRef.current.room;
      if (!player || !room || gameRef.current.currentScene !== 'frontPorch') {
        setNearLadderSpot(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Ladder spot is at (18, 2)
      const near = Math.abs(playerX - 18) <= 2 && Math.abs(playerY - 2) <= 2;
      setNearLadderSpot(near);
    };

    const interval = setInterval(checkLadderSpot, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if player is at rooftop ladder (to go back down)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkRooftopLadder = () => {
      const player = gameRef.current.player;
      if (!player || gameRef.current.currentScene !== 'rooftop') {
        setAtRooftopLadder(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      // Ladder access at (22, 12)
      setAtRooftopLadder(playerX >= 21 && playerY >= 11);
    };

    const interval = setInterval(checkRooftopLadder, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Check proximity to collectibles and special items (all rooms)
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkCollectibleProximity = () => {
      const player = gameRef.current.player;
      const room = gameRef.current.room;
      if (!player || !room) {
        setNearTinyClown(false);
        setNearHollandiaCan(false);
        setNearCD(false);
        return;
      }

      const playerX = Math.floor(player.gridX);
      const playerY = Math.floor(player.gridY);

      let touchingTinyClown = false;
      let touchingHollandiaCan = false;
      let touchingCD = false;
      let touchingLadder = false;
      let touchingXray = false;
      let touchingHumunculous = false;

      // Check all furniture for proximity
      room.furniture?.forEach((furniture: any) => {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;

            const adjacentX = playerX + dx;
            const adjacentY = playerY + dy;

            if (adjacentX >= furniture.x && adjacentX < furniture.x + furniture.width &&
                adjacentY >= furniture.y && adjacentY < furniture.y + furniture.height) {

              if (furniture.type === 'tiny_clown') {
                touchingTinyClown = true;
              } else if (furniture.type === 'hollandia_can') {
                touchingHollandiaCan = true;
              } else if (furniture.type === 'cd_item') {
                touchingCD = true;
              } else if (furniture.type === 'ladder') {
                touchingLadder = true;
              } else if (furniture.type === 'xray') {
                touchingXray = true;
              } else if (furniture.type === 'humunculous') {
                touchingHumunculous = true;
              }
            }
          }
        }
      });

      setNearTinyClown(touchingTinyClown);
      setNearHollandiaCan(touchingHollandiaCan);
      setNearCD(touchingCD);
      setNearLadder(touchingLadder);
      setNearXray(touchingXray);
      setNearHumunculous(touchingHumunculous);
    };

    const interval = setInterval(checkCollectibleProximity, 100);
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

      // Check if Tiny Clown just finished talking after getting cans - add as companion
      if (currentSpeakerRef.current === 'Tiny Clown' && tinyClownJoined) {
        if (gameRef.current && gameRef.current.addCompanion) {
          gameRef.current.addCompanion('tiny_clown');
        }
      }

      // Check if Humunculous just finished talking after getting x-ray - add as companion
      if (currentSpeakerRef.current === 'Humunculous' && humunculousJoined) {
        if (gameRef.current && gameRef.current.addCompanion) {
          gameRef.current.addCompanion('humunculous');
        }
      }
      currentSpeakerRef.current = null;
    }
  }, [dialogState.currentTextIndex, dialogState.text.length, mrTibblesJoined, possumFed, tinyClownJoined, humunculousJoined]);

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

  const handleTalkToTinyClown = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      if (tinyClownJoined) {
        gameRef.current.showDialog("Tiny Clown", [
          "*honk honk*",
          "My pyramid is complete!",
          "We're best friends now, crispy buddy!"
        ]);
      } else if (hollandiaCount >= 5) {
        gameRef.current.showDialog("Tiny Clown", [
          "*eyes widen*",
          "IS THAT... FIVE HOLLANDIA CANS?!",
          "*You hand over the cans*",
          "MY PYRAMID! IT'S COMPLETE!",
          "*happy clown noises*",
          "You've made a tiny clown very happy today.",
          "As a reward, I shall join your quest!",
          "HONK HONK LET'S GO!"
        ]);
        setTinyClownJoined(true);
        setHollandiaCount(0);
        // Update game state for pyramid
        if (gameRef.current) {
          gameRef.current.tinyClownCans = 5;
        }
        currentSpeakerRef.current = 'Tiny Clown';
      } else {
        gameRef.current.showDialog("Tiny Clown", [
          "*honk*",
          "Hello there, little crisp friend!",
          "I'm building a MAGNIFICENT beer pyramid!",
          `But I need ${5 - hollandiaCount} more Hollandia cans...`,
          "Find me 5 total and I'll reward you handsomely!",
          "*does a tiny cartwheel*"
        ]);
      }
    }
  };

  const handlePickUpHollandia = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      const newCount = hollandiaCount + 1;
      setHollandiaCount(newCount);

      // Remove the can from furniture
      const room = gameRef.current.room;
      if (room && room.furniture) {
        const canIndex = room.furniture.findIndex((f: any) => f.type === 'hollandia_can');
        if (canIndex !== -1) {
          room.furniture.splice(canIndex, 1);
        }
      }

      gameRef.current.showDialog("Scrump", [
        "*picks up Hollandia can*",
        `Got it! That's ${newCount} of 5 for the clown's pyramid.`,
        newCount >= 5 ? "That should be enough!" : "Need to find more..."
      ]);
    }
  };

  const handlePickUpCD = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      const room = gameRef.current.room;
      if (room && room.furniture) {
        const cdIndex = room.furniture.findIndex((f: any) => f.type === 'cd_item');
        if (cdIndex !== -1) {
          const cd = room.furniture[cdIndex];
          const songName = cd.songName || 'Unknown Track';

          if (!collectedCDs.includes(songName)) {
            setCollectedCDs(prev => [...prev, songName]);
            room.furniture.splice(cdIndex, 1);

            gameRef.current.showDialog("Scrump", [
              "*picks up CD*",
              `Oh sick, it's "${songName}" by The Scrumps!`,
              `That's ${collectedCDs.length + 1} of 4 CDs collected.`,
              "These tunes are gonna slap."
            ]);
          }
        }
      }
    }
  };

  const handlePickUpLadder = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      if (hasLadder) {
        gameRef.current.showDialog("Scrump", [
          "I've already got the ladder.",
          "This thing is surprisingly light for a crisp to carry."
        ]);
      } else {
        const room = gameRef.current.room;
        if (room && room.furniture) {
          const ladderIndex = room.furniture.findIndex((f: any) => f.type === 'ladder');
          if (ladderIndex !== -1) {
            room.furniture.splice(ladderIndex, 1);
            // Clear collision
            const ladder = { x: 18, y: 12, width: 1, height: 2 };
            for (let y = ladder.y; y < ladder.y + ladder.height; y++) {
              for (let x = ladder.x; x < ladder.x + ladder.width; x++) {
                if (room.collisionMap && room.collisionMap[y]) {
                  room.collisionMap[y][x] = false;
                }
              }
            }
          }
        }
        setHasLadder(true);
        gameRef.current.showDialog("Scrump", [
          "*picks up ladder*",
          "A sturdy wooden ladder!",
          "This could help me reach high places.",
          "Like... a roof perhaps?"
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

  const handleGoToLivingRoom = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('livingRoom');
    }
  };

  const handleGoToBalconyFromLivingRoom = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('upstairs');
    }
  };

  const handleGoToBedroom = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('bedroom');
    }
  };

  const handleGoToLivingRoomFromBedroom = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('livingRoom');
    }
  };

  const handleGoToFrontPorch = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('frontPorch');
    }
  };

  const handleGoToLivingRoomFromPorch = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('livingRoom');
    }
  };

  const handlePlaceLadder = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      if (!hasLadder) {
        gameRef.current.showDialog("Scrump", [
          "I need a ladder to reach the roof.",
          "Maybe there's one somewhere in the backyard..."
        ]);
      } else {
        setLadderPlaced(true);
        setHasLadder(false);
        gameRef.current.showDialog("Scrump", [
          "*places ladder against wall*",
          "Perfect! Now I can climb up to the roof!",
          "The subletters should be hiding up there."
        ]);
      }
    }
  };

  const handleClimbToRoof = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('rooftop');
    }
  };

  const handleClimbDownFromRoof = () => {
    if (gameRef.current && gameRef.current.loadScene) {
      gameRef.current.loadScene('frontPorch');
    }
  };

  const handlePickUpXray = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      if (hasXray) {
        gameRef.current.showDialog("Scrump", [
          "I already have the x-ray.",
          "Those bones are spooky..."
        ]);
      } else {
        const room = gameRef.current.room;
        if (room && room.furniture) {
          const xrayIndex = room.furniture.findIndex((f: any) => f.type === 'xray');
          if (xrayIndex !== -1) {
            room.furniture.splice(xrayIndex, 1);
          }
        }
        setHasXray(true);
        gameRef.current.showDialog("Scrump", [
          "*picks up x-ray*",
          "Whoa, this is an x-ray of a foot!",
          "Someone's missing a foot around here...",
          "I bet whoever lost this would want it back."
        ]);
      }
    }
  };

  const handleTalkToHumunculous = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      if (humunculousJoined) {
        gameRef.current.showDialog("Humunculous", [
          "*rattles bones*",
          "My foot! It's so good to have it back!",
          "Well, at least know where it is now.",
          "Let's find those subletters!"
        ]);
      } else if (hasXray) {
        // Give x-ray to Humunculous - triggers chase if 4 CDs collected!
        gameRef.current.showDialog("Humunculous", [
          "*gasp* MY FOOT!",
          "You found it! It was inside me all along!",
          "How did I not notice that...",
          "You've done me a great service, crispy friend.",
          "I shall join your quest!",
          collectedCDs.length >= 4 ? "Wait... I hear music... THE SCRUMPS!" : "Lead the way!"
        ]);
        setHasXray(false);
        setHumunculousJoined(true);
        currentSpeakerRef.current = 'Humunculous';

        // Check if chase should trigger (4 CDs + Humunculous joining)
        if (collectedCDs.length >= 4) {
          // Chase will trigger after dialog!
          setTimeout(() => {
            if (gameRef.current && gameRef.current.showDialog) {
              gameRef.current.showDialog("Mr Tibbles", [
                "What's that noise?!",
                "Oh no... the music is too loud!",
                "ADELE CAN HEAR US!",
                "TO THE ROOF! EVERYONE TO THE ROOF!",
                "We need the ladder to get up there!"
              ]);
              setIsChaseActive(true);
            }
          }, 1000);
        }
      } else {
        gameRef.current.showDialog("Humunculous", [
          "*rattle rattle*",
          "Oooooh... my foot... where is my foot?",
          "I've been hobbling around for AGES.",
          "There's an x-ray somewhere that shows where it went...",
          "Find it for me, and I'll help you find the subletters!",
          "*sad bone noises*"
        ]);
      }
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

      {/* Talk to Humunculous Button - in downstairs room */}
      {!isLoading && !dialogState.isVisible && nearHumunculous && gameRef.current?.currentScene === 'downstairs' && !humunculousJoined && (
        <button
          onClick={handleTalkToHumunculous}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {hasXray ? 'GIVE X-RAY TO SKELETON' : 'TALK TO SKELETON'}
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
      
      {/* Go to Backyard Button - appears when at bottom-right of balcony */}
      {!isLoading && !dialogState.isVisible && atBalconyBottomRight && gameRef.current?.currentScene === 'upstairs' && (
        <button
          onClick={handleGoToBackyardFromUpstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BACKYARD
        </button>
      )}

      {/* Go to Living Room Button - appears when at bottom-left of balcony */}
      {!isLoading && !dialogState.isVisible && atBalconyBottomLeft && gameRef.current?.currentScene === 'upstairs' && (
        <button
          onClick={handleGoToLivingRoom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO LIVING ROOM
        </button>
      )}

      {/* Go to Balcony Button - appears when at top-right of living room */}
      {!isLoading && !dialogState.isVisible && atLivingRoomTopRight && gameRef.current?.currentScene === 'livingRoom' && (
        <button
          onClick={handleGoToBalconyFromLivingRoom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BALCONY
        </button>
      )}

      {/* Talk to Tiny Clown Button - in living room */}
      {!isLoading && !dialogState.isVisible && nearTinyClown && gameRef.current?.currentScene === 'livingRoom' && (
        <button
          onClick={handleTalkToTinyClown}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {tinyClownJoined ? 'TALK TO TINY CLOWN' : (hollandiaCount >= 5 ? 'GIVE CANS TO CLOWN' : 'TALK TO TINY CLOWN')}
        </button>
      )}

      {/* Pick up Hollandia Can Button - in any room */}
      {!isLoading && !dialogState.isVisible && nearHollandiaCan && !nearTinyClown && (
        <button
          onClick={handlePickUpHollandia}
          className="fixed top-4 right-4 bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-green-600 transition-all duration-200 hover:scale-105 z-50"
        >
          PICK UP HOLLANDIA CAN
        </button>
      )}

      {/* Pick up CD Button - in any room */}
      {!isLoading && !dialogState.isVisible && nearCD && !nearTinyClown && !nearHollandiaCan && (
        <button
          onClick={handlePickUpCD}
          className="fixed top-4 right-4 bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-purple-600 transition-all duration-200 hover:scale-105 z-50"
        >
          PICK UP CD
        </button>
      )}

      {/* Pick up Ladder Button - in backyard */}
      {!isLoading && !dialogState.isVisible && nearLadder && gameRef.current?.currentScene === 'mainRoom' && !hasLadder && (
        <button
          onClick={handlePickUpLadder}
          className="fixed top-4 right-4 bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-orange-600 transition-all duration-200 hover:scale-105 z-50"
        >
          PICK UP LADDER
        </button>
      )}

      {/* Pick up X-ray Button - in bedroom */}
      {!isLoading && !dialogState.isVisible && nearXray && gameRef.current?.currentScene === 'bedroom' && !hasXray && (
        <button
          onClick={handlePickUpXray}
          className="fixed top-4 right-4 bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-cyan-600 transition-all duration-200 hover:scale-105 z-50"
        >
          PICK UP X-RAY
        </button>
      )}

      {/* Go to Bedroom Button - from living room right edge */}
      {!isLoading && !dialogState.isVisible && atLivingRoomRight && gameRef.current?.currentScene === 'livingRoom' && !atLivingRoomTopRight && (
        <button
          onClick={handleGoToBedroom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BEDROOM
        </button>
      )}

      {/* Go to Living Room Button - from bedroom left edge */}
      {!isLoading && !dialogState.isVisible && atBedroomLeft && gameRef.current?.currentScene === 'bedroom' && (
        <button
          onClick={handleGoToLivingRoomFromBedroom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO LIVING ROOM
        </button>
      )}

      {/* Go to Front Porch Button - from living room left edge */}
      {!isLoading && !dialogState.isVisible && atLivingRoomLeft && gameRef.current?.currentScene === 'livingRoom' && (
        <button
          onClick={handleGoToFrontPorch}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO FRONT PORCH
        </button>
      )}

      {/* Go to Living Room Button - from front porch right edge */}
      {!isLoading && !dialogState.isVisible && atFrontPorchRight && gameRef.current?.currentScene === 'frontPorch' && !nearLadderSpot && (
        <button
          onClick={handleGoToLivingRoomFromPorch}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO LIVING ROOM
        </button>
      )}

      {/* Place/Climb Ladder Button - on front porch */}
      {!isLoading && !dialogState.isVisible && nearLadderSpot && gameRef.current?.currentScene === 'frontPorch' && (
        <button
          onClick={ladderPlaced ? handleClimbToRoof : handlePlaceLadder}
          className="fixed top-4 right-4 bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-orange-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {ladderPlaced ? 'CLIMB TO ROOF' : (hasLadder ? 'PLACE LADDER' : 'NEED LADDER')}
        </button>
      )}

      {/* Climb Down Button - on rooftop */}
      {!isLoading && !dialogState.isVisible && atRooftopLadder && gameRef.current?.currentScene === 'rooftop' && (
        <button
          onClick={handleClimbDownFromRoof}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          CLIMB DOWN
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