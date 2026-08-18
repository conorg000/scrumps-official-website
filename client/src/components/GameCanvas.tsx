import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { LoadingScreen } from './LoadingScreen';
import { DialogModal } from './DialogModal';
import { InventoryUI } from './InventoryUI';
import { PovStage } from './PovStage';
import type { DPadDirection } from '../game3d/PovEngine';

/** Scenes that have been converted to the first-person 3D renderer. */
const POV_SCENES = ['mainRoom', 'downstairs'];

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isLoadingRef = useRef(true);
  const pendingDialogRef = useRef<{characterName: string, text: string[], imageSrc: string, imageTitle: string} | null>(null);
  const currentSpeakerRef = useRef<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // Mirrors gameRef.current.currentScene so React can swap renderers on it
  const [currentScene, setCurrentScene] = useState('mainRoom');
  const [isGameReady, setIsGameReady] = useState(false);
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
  const [hasJumpedToPool, setHasJumpedToPool] = useState(false);
  const [bushTurkeyDefeated, setBushTurkeyDefeated] = useState(false);
  const [boxingGameActive, setBoxingGameActive] = useState(false);
  const [boxingHealth, setBoxingHealth] = useState(100);
  const [turkeyHealth, setTurkeyHealth] = useState(100);
  const [boxingMessage, setBoxingMessage] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [lifeLostFlash, setLifeLostFlash] = useState(false);
  const [poolJumpActive, setPoolJumpActive] = useState(false);
  const [boxingAnimation, setBoxingAnimation] = useState<string | null>(null);
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
          
          // Wire up Adele caught handler
          gameRef.current.onAdeleCaught = () => {
            // Freeze the player in place
            if (gameRef.current) {
              gameRef.current.frozen = true;
            }

            setLives(prev => {
              const newLives = prev - 1;
              const dialogs = [
                ["*Adele grabs you by the collar*", "EXCUSE ME! Where is Mr Feng?!", "And why are there so many people here?!", "That's STRIKE ONE, potato boy!", "*You wriggle free and run to the backyard*"],
                ["*Adele corners you against the wall*", "I KNOW there are subletters here!", "This is a LEASE VIOLATION!", "STRIKE TWO! One more and you're OUT!", "*You duck under her clipboard and escape*"],
                ["*Adele is FURIOUS*", "THAT'S IT!", "THREE STRIKES!", "YOU'RE EVICTED!", "Pack your bags, crispy boy!"]
              ];
              const dialogIndex = Math.min(3 - newLives - 1, dialogs.length - 1);

              if (gameRef.current && gameRef.current.showDialog) {
                gameRef.current.showDialog("Adele", dialogs[dialogIndex]);
              }

              // Set AFTER showDialog (which sets it to 'Adele') so our marker sticks
              currentSpeakerRef.current = 'Adele_caught';

              // Flash the lives HUD
              setLifeLostFlash(true);
              setTimeout(() => setLifeLostFlash(false), 600);

              return newLives;
            });
          };

          // Override the canvas element
          gameRef.current.canvas = canvas;
          gameRef.current.ctx = canvas.getContext('2d');
          gameRef.current.ctx.imageSmoothingEnabled = false;
          gameRef.current.resizeCanvas();

          gameReady = true;
          setIsGameReady(true);
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

  // Consolidated door proximity detection for all room transitions
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkDoorProximity = () => {
      const player = gameRef.current?.player;
      const scene = gameRef.current?.currentScene;
      const exitMarkers = gameRef.current?.exitMarkers;
      if (!player || !scene || !exitMarkers) return;

      // Keep React in step with which scene the vanilla engine is showing, so
      // the 3D renderer can take over the scenes that have been converted.
      setCurrentScene(scene);

      const px = player.x;
      const py = player.y;
      const markers = exitMarkers[scene] || [];

      // Helper: check if player is within range of a door by label
      const nearDoor = (label: string) => {
        const marker = markers.find((m: any) => m.label === label);
        if (!marker) return false;
        const dx = px - marker.x;
        const dy = py - marker.y;
        return Math.sqrt(dx * dx + dy * dy) < 3;
      };

      // Backyard exits
      setAtBottomEdge(scene === 'mainRoom' && nearDoor('Downstairs'));
      setAtRightEdge(scene === 'mainRoom' && nearDoor('Upstairs'));

      // Downstairs exits
      setAtTopEdge(scene === 'downstairs' && nearDoor('Backyard'));

      // Balcony exits
      setAtBalconyBottomLeft(scene === 'upstairs' && nearDoor('Living Room'));
      setAtBalconyBottomRight(scene === 'upstairs' && nearDoor('Backyard'));

      // Living Room exits (3 directions)
      setAtLivingRoomTopRight(scene === 'livingRoom' && nearDoor('Balcony'));
      setAtLivingRoomRight(scene === 'livingRoom' && nearDoor('Bedroom'));
      setAtLivingRoomLeft(scene === 'livingRoom' && nearDoor('Front Porch'));

      // Bedroom exit
      setAtBedroomLeft(scene === 'bedroom' && nearDoor('Living Room'));

      // Front Porch exits
      setAtFrontPorchRight(scene === 'frontPorch' && nearDoor('Living Room'));

      // Ladder spot on front porch
      setNearLadderSpot(scene === 'frontPorch' && nearDoor('Roof'));

      // Rooftop exit
      setAtRooftopLadder(scene === 'rooftop' && nearDoor('Climb Down'));
    };

    const interval = setInterval(checkDoorProximity, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Rooftop arrival dialog during chase
  const rooftopChaseDialogShown = useRef(false);
  useEffect(() => {
    if (!gameRef.current || isLoading) return;

    const checkRooftopChase = () => {
      if (gameRef.current?.currentScene === 'rooftop' && isChaseActive && !hasJumpedToPool && !rooftopChaseDialogShown.current) {
        rooftopChaseDialogShown.current = true;
        setTimeout(() => {
          if (gameRef.current && gameRef.current.showDialog) {
            gameRef.current.showDialog("Subletters", [
              "Oh thank god, you made it!",
              "All 10 of us have been hiding up here!",
              "But wait... I can hear Adele climbing the ladder!",
              "She's almost here!",
              "We have to JUMP! The kiddy pool is right below!",
              "Everyone ready?!"
            ]);
          }
        }, 500);
      }
    };

    const interval = setInterval(checkRooftopChase, 200);
    return () => clearInterval(interval);
  }, [isLoading, isChaseActive, hasJumpedToPool]);

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

      // Adele caught: dialog finished -> unfreeze and teleport to backyard or game over
      if (currentSpeakerRef.current === 'Adele_caught') {
        if (gameRef.current) {
          gameRef.current.frozen = false;

          if (lives <= 0) {
            setGameOver(true);
          } else {
            gameRef.current.loadScene('mainRoom');

            // Move Adele to a random patrol room (not backyard)
            const patrolRooms = gameRef.current.adele.patrolRooms;
            const randomRoom = patrolRooms[Math.floor(Math.random() * patrolRooms.length)];
            gameRef.current.adele.currentRoom = randomRoom;
            gameRef.current.adele.x = 10;
            gameRef.current.adele.y = 8;
            gameRef.current.adele.catchCooldown = 3000;
          }
        }
        currentSpeakerRef.current = null;
        return;
      }

      // Ending sequence: Adele dialog finished -> show Mr Feng
      if (currentSpeakerRef.current === 'Adele_ending') {
        setTimeout(() => {
          if (gameRef.current && gameRef.current.showDialog) {
            gameRef.current.showDialog("Mr Feng", [
              "*walks in casually*",
              "...",
              "*looks around at the chaos*",
              "...",
              "I watched your Twitch stream guys.",
              "That was SICK.",
              "Let's get f***d up!",
              "*chaos and partying and boxing ensues*"
            ]);
            currentSpeakerRef.current = 'Mr_Feng_ending';
          }
        }, 500);
        return;
      }

      // Ending sequence: Mr Feng dialog finished -> show end screen
      if (currentSpeakerRef.current === 'Mr_Feng_ending') {
        // Make Mr Feng visible in the backyard
        if (gameRef.current) {
          gameRef.current.mrFengVisible = true;
        }
        setGameEnded(true);
        currentSpeakerRef.current = null;
        return;
      }

      currentSpeakerRef.current = null;
    }
  }, [dialogState.currentTextIndex, dialogState.text.length, mrTibblesJoined, possumFed, tinyClownJoined, humunculousJoined, lives]);

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

      // Remove the can from furniture and persist removal
      const room = gameRef.current.room;
      if (room && room.furniture) {
        const canIndex = room.furniture.findIndex((f: any) => f.type === 'hollandia_can');
        if (canIndex !== -1) {
          const can = room.furniture[canIndex];
          gameRef.current.removeItem(gameRef.current.currentScene, can.type, can.x, can.y);
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
            gameRef.current.removeItem(gameRef.current.currentScene, cd.type, cd.x, cd.y);
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
            const ladderItem = room.furniture[ladderIndex];
            gameRef.current.removeItem(gameRef.current.currentScene, ladderItem.type, ladderItem.x, ladderItem.y);
            room.furniture.splice(ladderIndex, 1);
            // Clear collision
            for (let y = ladderItem.y; y < ladderItem.y + ladderItem.height; y++) {
              for (let x = ladderItem.x; x < ladderItem.x + ladderItem.width; x++) {
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

  const handleJumpToPool = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      // Show brief dialog first
      gameRef.current.showDialog("Everyone", [
        "JUMP! JUMP! JUMP!"
      ]);

      setHasJumpedToPool(true);
      setIsChaseActive(false);

      // Deactivate Adele chase
      if (gameRef.current.adele) {
        gameRef.current.adele.isChasing = false;
        gameRef.current.adele.visible = false;
        gameRef.current.adele.currentRoom = 'rooftop'; // Stuck on roof
      }

      // Start pool jump animation after dialog
      setTimeout(() => {
        setPoolJumpActive(true);

        // After animation, load backyard and show bush turkey
        setTimeout(() => {
          setPoolJumpActive(false);
          if (gameRef.current && gameRef.current.loadScene) {
            gameRef.current.loadScene('mainRoom');
            gameRef.current.bushTurkeyVisible = true;

            // Mr Tibbles splash dialog
            setTimeout(() => {
              if (gameRef.current && gameRef.current.showDialog) {
                gameRef.current.showDialog("Mr Tibbles", [
                  "*spluttering*",
                  "We made it! Everyone okay?",
                  "The ladder fell... Adele is stuck on the roof!",
                  "Oh no...",
                  "I hear something...",
                  "*gobble gobble*",
                  "IT'S THE BUSH TURKEY!",
                  "It's coming for Scrump!",
                  "Quick! Get to the boxing ring! Fight back!"
                ]);
              }
            }, 1500);
          }
        }, 3000);
      }, 2000);
    }
  };

  const handleStartBoxingFight = () => {
    setBoxingGameActive(true);
    setBoxingHealth(100);
    setTurkeyHealth(100);
    setBoxingMessage("ROUND 1 - FIGHT!");
  };

  const handlePunch = () => {
    if (!boxingGameActive || turkeyHealth <= 0) return;

    // Random damage to turkey
    const damage = Math.floor(Math.random() * 20) + 10;
    const newTurkeyHealth = Math.max(0, turkeyHealth - damage);
    setTurkeyHealth(newTurkeyHealth);
    setBoxingMessage(`POW! ${damage} damage!`);
    setBoxingAnimation('punch');
    setTimeout(() => setBoxingAnimation(null), 300);

    // Turkey counter-attacks
    setTimeout(() => {
      if (newTurkeyHealth > 0) {
        const counterDamage = Math.floor(Math.random() * 15) + 5;
        setBoxingAnimation('turkey_attack');
        setTimeout(() => setBoxingAnimation(null), 300);
        setBoxingHealth(prev => {
          const newPlayerHealth = Math.max(0, prev - counterDamage);
          setBoxingMessage(`Turkey pecks back! ${counterDamage} damage!`);

          if (newPlayerHealth <= 0) {
            setTimeout(() => {
              setBoxingMessage("You got knocked out! Try again!");
              setTimeout(() => {
                setBoxingHealth(100);
                setTurkeyHealth(100);
                setBoxingMessage("ROUND 2 - FIGHT!");
              }, 2000);
            }, 0);
          }
          return newPlayerHealth;
        });
      }
    }, 500);

    // Check for victory
    if (newTurkeyHealth <= 0) {
      setBoxingMessage("K.O.! YOU WIN!");
      setBushTurkeyDefeated(true);
      setBoxingGameActive(false);
      // Remove bush turkey from backyard
      if (gameRef.current) {
        gameRef.current.bushTurkeyVisible = false;
      }

      // Trigger ending sequence
      setTimeout(() => {
        if (gameRef.current && gameRef.current.showDialog) {
          gameRef.current.showDialog("Bush Turkey", [
            "*defeated gobble*",
            "You... you actually beat me...",
            "I respect that, crispy one.",
            "I'll leave you chips alone from now on.",
            "*waddles away in shame*"
          ]);

          // After turkey dialog, trigger ending
          setTimeout(() => {
            triggerEnding();
          }, 5000);
        }
      }, 2000);
    }
  };

  const handleDodge = () => {
    if (!boxingGameActive || turkeyHealth <= 0) return;

    // 70% chance to dodge
    setBoxingAnimation('dodge');
    setTimeout(() => setBoxingAnimation(null), 300);
    if (Math.random() < 0.7) {
      setBoxingMessage("Dodged! Quick, counter-attack!");
    } else {
      const damage = Math.floor(Math.random() * 10) + 5;
      setBoxingHealth(prev => Math.max(0, prev - damage));
      setBoxingMessage(`Dodge failed! ${damage} damage!`);
    }
  };

  const triggerEnding = () => {
    if (gameRef.current && gameRef.current.showDialog) {
      gameRef.current.showDialog("Adele", [
        "*climbing down from roof, dishevelled*",
        "What... what is going on here?!",
        "Subletters everywhere! A possum! A tiny clown!",
        "Is that... a boxing ring?!",
        "MR FENG! Get over here!"
      ]);
      // Mr Feng dialog will be triggered when Adele's dialog closes
      currentSpeakerRef.current = 'Adele_ending';
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
            const xrayItem = room.furniture[xrayIndex];
            gameRef.current.removeItem(gameRef.current.currentScene, xrayItem.type, xrayItem.x, xrayItem.y);
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
              // Activate Adele chase in game engine
              if (gameRef.current && gameRef.current.adele) {
                gameRef.current.adele.isChasing = true;
              }
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

  const isPovScene = POV_SCENES.includes(currentScene);
  // The POV camera holds still whenever a modal, cutscene or mini-game is up
  const povPaused =
    dialogState.isVisible || boxingGameActive || poolJumpActive || gameOver || gameEnded;
  const povDpad = joystickDirection as DPadDirection;

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
        className={`absolute top-0 left-0 w-full h-full bg-[#87ceeb] ${isLoading || isPovScene ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        style={{
          imageRendering: 'pixelated',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      />

      {/* First-person renderer for the scenes that have been converted */}
      {isGameReady && (
        <PovStage
          game={gameRef.current}
          active={isPovScene && !isLoading}
          paused={povPaused}
          dpad={povDpad}
        />
      )}
      
      {/* Examine Boxing Ring Button (only when not in fight mode) */}
      {!isLoading && !dialogState.isVisible && nearBoxingRing && gameRef.current?.currentScene === 'mainRoom' && !hasJumpedToPool && (
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

      {/* Talk to Humunculous Button - on front porch */}
      {!isLoading && !dialogState.isVisible && nearHumunculous && gameRef.current?.currentScene === 'frontPorch' && !humunculousJoined && (
        <button
          onClick={handleTalkToHumunculous}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {hasXray ? 'GIVE X-RAY TO SKELETON' : 'TALK TO SKELETON'}
        </button>
      )}

      {/* Go Downstairs Button */}
      {!isLoading && !dialogState.isVisible && atBottomEdge && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearKiddyPool && !nearBeerPyramid && !nearMrTibbles && (
        <button
          onClick={handleGoDownstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO DOWNSTAIRS
        </button>
      )}
      
      {/* Go to Backyard Button (from downstairs) */}
      {!isLoading && !dialogState.isVisible && atTopEdge && gameRef.current?.currentScene === 'downstairs' && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearKiddyPool && !nearBeerPyramid && (
        <button
          onClick={handleGoToBackyard}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BACKYARD
        </button>
      )}
      
      {/* Go Upstairs Button */}
      {!isLoading && !dialogState.isVisible && atRightEdge && gameRef.current?.currentScene === 'mainRoom' && !nearBoxingRing && !nearBeerBottle && !nearBoxingGloves && !nearTree && !nearKiddyPool && !nearBeerPyramid && !atBottomEdge && (
        <button
          onClick={handleGoUpstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO UPSTAIRS
        </button>
      )}
      
      {/* Go to Backyard Button (from balcony) */}
      {!isLoading && !dialogState.isVisible && atBalconyBottomRight && gameRef.current?.currentScene === 'upstairs' && (
        <button
          onClick={handleGoToBackyardFromUpstairs}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BACKYARD
        </button>
      )}

      {/* Go to Living Room Button (from balcony) */}
      {!isLoading && !dialogState.isVisible && atBalconyBottomLeft && gameRef.current?.currentScene === 'upstairs' && (
        <button
          onClick={handleGoToLivingRoom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO LIVING ROOM
        </button>
      )}

      {/* Go to Balcony Button (from living room) */}
      {!isLoading && !dialogState.isVisible && atLivingRoomTopRight && gameRef.current?.currentScene === 'livingRoom' && (
        <button
          onClick={handleGoToBalconyFromLivingRoom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
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

      {/* Go to Bedroom Button (from living room) */}
      {!isLoading && !dialogState.isVisible && atLivingRoomRight && gameRef.current?.currentScene === 'livingRoom' && !atLivingRoomTopRight && (
        <button
          onClick={handleGoToBedroom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO BEDROOM
        </button>
      )}

      {/* Go to Living Room Button (from bedroom) */}
      {!isLoading && !dialogState.isVisible && atBedroomLeft && gameRef.current?.currentScene === 'bedroom' && (
        <button
          onClick={handleGoToLivingRoomFromBedroom}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO LIVING ROOM
        </button>
      )}

      {/* Go to Front Porch Button (from living room) */}
      {!isLoading && !dialogState.isVisible && atLivingRoomLeft && gameRef.current?.currentScene === 'livingRoom' && (
        <button
          onClick={handleGoToFrontPorch}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO FRONT PORCH
        </button>
      )}

      {/* Go to Living Room Button (from front porch) */}
      {!isLoading && !dialogState.isVisible && atFrontPorchRight && gameRef.current?.currentScene === 'frontPorch' && !nearLadderSpot && (
        <button
          onClick={handleGoToLivingRoomFromPorch}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          GO TO LIVING ROOM
        </button>
      )}

      {/* Place/Climb Ladder Button (on front porch) */}
      {!isLoading && !dialogState.isVisible && nearLadderSpot && gameRef.current?.currentScene === 'frontPorch' && (
        <button
          onClick={ladderPlaced ? handleClimbToRoof : handlePlaceLadder}
          className="fixed top-4 right-4 bg-orange-500 hover:bg-orange-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-orange-600 transition-all duration-200 hover:scale-105 z-50"
        >
          {ladderPlaced ? 'CLIMB TO ROOF' : (hasLadder ? 'PLACE LADDER' : 'NEED LADDER')}
        </button>
      )}

      {/* Climb Down Button (on rooftop, only when chase not active) */}
      {!isLoading && !dialogState.isVisible && atRooftopLadder && gameRef.current?.currentScene === 'rooftop' && !isChaseActive && (
        <button
          onClick={handleClimbDownFromRoof}
          className="fixed top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-lg font-mono text-base font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105 z-50"
        >
          CLIMB DOWN
        </button>
      )}

      {/* Jump to Kiddy Pool Button - on rooftop during chase */}
      {!isLoading && !dialogState.isVisible && gameRef.current?.currentScene === 'rooftop' && isChaseActive && !hasJumpedToPool && (
        <button
          onClick={handleJumpToPool}
          className="fixed top-4 right-4 bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-lg font-mono text-lg font-bold shadow-lg border-2 border-red-600 transition-all duration-200 hover:scale-105 z-50 animate-pulse"
        >
          🏊 JUMP TO KIDDY POOL! 🏊
        </button>
      )}

      {/* Chase Warning Indicator */}
      {!isLoading && isChaseActive && !hasJumpedToPool && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-mono text-sm font-bold animate-pulse z-50 border-2 border-red-400"
          style={{ animation: 'pulse 0.5s ease-in-out infinite' }}
        >
          ⚠️ ADELE IS COMING! GET TO THE ROOF! ⚠️
        </div>
      )}

      {/* Lives HUD */}
      {!isLoading && !gameOver && !boxingGameActive && !gameEnded && (
        <div
          className={`fixed bottom-36 left-4 z-50 transition-all duration-300 ${lifeLostFlash ? 'scale-125' : 'scale-100'}`}
        >
          <div className={`bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border ${lifeLostFlash ? 'border-red-400 bg-red-900/60' : 'border-gray-600'} transition-colors duration-300`}>
            <span className="text-2xl tracking-widest" style={{ letterSpacing: '0.3em' }}>
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={`inline-block transition-all duration-300 ${i < lives ? '' : 'opacity-20 grayscale'}`}>
                  {i < lives ? '🥔' : '💀'}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* Start Boxing Fight Button - in backyard after jump, near boxing ring */}
      {!isLoading && !dialogState.isVisible && nearBoxingRing && gameRef.current?.currentScene === 'mainRoom' && hasJumpedToPool && !bushTurkeyDefeated && !boxingGameActive && (
        <button
          onClick={handleStartBoxingFight}
          className="fixed top-4 right-4 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-mono text-lg font-bold shadow-lg border-2 border-red-700 transition-all duration-200 hover:scale-105 z-50 animate-bounce"
        >
          🥊 FIGHT BUSH TURKEY! 🥊
        </button>
      )}

      {/* Pool Jump Animation */}
      {poolJumpActive && (
        <div className="fixed inset-0 z-[250] overflow-hidden" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 70%, #4FA4DE 100%)' }}>
          <style>{`
            @keyframes fall-spin {
              0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            @keyframes splash-appear {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.3); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          {/* Falling characters */}
          {['🥔', '🐱', '🤡', '🦝', '💀', '🥔', '🐱', '🤡'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-6xl"
              style={{
                left: `${10 + i * 11}%`,
                top: '-80px',
                animation: `fall-spin ${2 + Math.random() * 0.5}s ease-in forwards`,
                animationDelay: `${i * 0.15}s`
              }}
            >
              {emoji}
            </div>
          ))}
          {/* SPLASH text */}
          <div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-7xl font-bold font-mono text-white"
            style={{
              animation: 'splash-appear 0.5s ease-out forwards',
              animationDelay: '2s',
              opacity: 0,
              textShadow: '4px 4px 0 #2E86AB, -2px -2px 0 #2E86AB, 2px -2px 0 #2E86AB, -2px 2px 0 #2E86AB'
            }}
          >
            SPLASH!!!
          </div>
          {/* Water at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to bottom, rgba(78, 164, 222, 0.6), #2E86AB)' }} />
        </div>
      )}

      {/* Boxing Mini-Game UI */}
      {boxingGameActive && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex flex-col items-center justify-center">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-2xl border-4 border-yellow-500 shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-center text-3xl font-bold text-yellow-400 font-mono mb-6">
              🥊 BOXING MATCH 🥊
            </h2>

            {/* Health Bars */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-white font-mono text-sm mb-1">
                  <span>SCRUMP</span>
                  <span>{boxingHealth}%</span>
                </div>
                <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden border-2 border-green-400">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                    style={{ width: `${boxingHealth}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-white font-mono text-sm mb-1">
                  <span>BUSH TURKEY</span>
                  <span>{turkeyHealth}%</span>
                </div>
                <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden border-2 border-red-400">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                    style={{ width: `${turkeyHealth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Fighters */}
            <div className="flex items-center justify-between mb-6 px-4">
              {/* Scrump Fighter */}
              <div
                className="relative transition-transform duration-200"
                style={{
                  transform: boxingAnimation === 'punch' ? 'translateX(30px)' :
                             boxingAnimation === 'dodge' ? 'translateX(-20px) rotate(-10deg)' :
                             boxingAnimation === 'turkey_attack' ? 'translateX(-5px)' : 'none'
                }}
              >
                <div className="w-16 h-20 rounded-lg relative" style={{ background: 'linear-gradient(135deg, #DAA520, #B8860B)' }}>
                  {/* Scrump face */}
                  <div className="absolute top-2 left-3 w-2 h-2 rounded-full bg-black" />
                  <div className="absolute top-2 right-3 w-2 h-2 rounded-full bg-black" />
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-1 bg-red-800 rounded" />
                </div>
                {/* Boxing gloves */}
                <div className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-red-600 border-2 border-red-800" />
                <div className="absolute -left-2 top-12 w-5 h-5 rounded-full bg-red-600 border-2 border-red-800" />
              </div>

              {/* VS */}
              <div className="text-3xl font-bold text-yellow-300 font-mono" style={{ textShadow: '2px 2px 0 #000' }}>
                VS
              </div>

              {/* Bush Turkey Fighter */}
              <div
                className="relative transition-transform duration-200"
                style={{
                  transform: boxingAnimation === 'turkey_attack' ? 'translateX(-30px)' :
                             boxingAnimation === 'punch' ? 'translateX(5px)' : 'none',
                  ...(boxingAnimation === 'turkey_attack' ? { animation: 'none' } : {})
                }}
              >
                <div className="w-16 h-18 relative">
                  {/* Turkey body */}
                  <div className="w-14 h-14 rounded-full mx-auto" style={{ background: 'linear-gradient(135deg, #6B3A2A, #4A2818)' }} />
                  {/* Turkey head */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full" style={{ background: '#6B3A2A' }}>
                    {/* Eye */}
                    <div className="absolute top-2 right-1 w-2 h-2 rounded-full bg-yellow-400">
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-black" />
                    </div>
                  </div>
                  {/* Wattle */}
                  <div className="absolute -top-1 right-1 w-3 h-5 rounded-b-full bg-red-600" />
                  {/* Beak */}
                  <div className="absolute top-1 -right-1 w-4 h-2 bg-yellow-600 rounded-r" />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center text-2xl font-bold text-white font-mono mb-6 min-h-[2rem]">
              {boxingMessage}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePunch}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-lg font-mono text-xl font-bold shadow-lg border-2 border-red-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                👊 PUNCH!
              </button>
              <button
                onClick={handleDodge}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-mono text-xl font-bold shadow-lg border-2 border-blue-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                🏃 DODGE!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen - Evicted by Adele */}
      {gameOver && (
        <div className="fixed inset-0 bg-black z-[350] flex flex-col items-center justify-center">
          <style>{`
            @keyframes evicted-shake {
              0%, 100% { transform: translateX(0) rotate(0); }
              10% { transform: translateX(-8px) rotate(-2deg); }
              20% { transform: translateX(8px) rotate(2deg); }
              30% { transform: translateX(-6px) rotate(-1deg); }
              40% { transform: translateX(6px) rotate(1deg); }
              50% { transform: translateX(-4px) rotate(0); }
              60% { transform: translateX(4px) rotate(0); }
            }
            @keyframes stamp-appear {
              0% { transform: scale(3) rotate(-30deg); opacity: 0; }
              60% { transform: scale(1.1) rotate(-15deg); opacity: 1; }
              100% { transform: scale(1) rotate(-12deg); opacity: 1; }
            }
          `}</style>
          <div className="text-center px-8" style={{ animation: 'evicted-shake 0.6s ease-in-out' }}>
            <h1 className="text-7xl font-bold text-red-500 font-mono mb-4" style={{ textShadow: '4px 4px 0 #7f1d1d' }}>
              EVICTED!
            </h1>
            <div className="text-6xl mb-6" style={{ animation: 'stamp-appear 0.5s ease-out forwards', animationDelay: '0.3s', opacity: 0 }}>
              📋
            </div>
            <p className="text-2xl text-white font-mono mb-2">
              Adele wins this round.
            </p>
            <p className="text-lg text-gray-400 font-mono mb-4">
              Three strikes and you're out, potato boy.
            </p>
            <p className="text-md text-gray-500 font-mono mb-8 italic">
              "Your security deposit has been forfeited for<br />
              unauthorized subletting, property damage,<br />
              and... is that a possum?!" — Adele
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-lg font-mono text-xl font-bold shadow-lg border-2 border-red-700 transition-all duration-200 hover:scale-105"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Game Ending Screen */}
      {gameEnded && (
        <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center">
          <div className="text-center px-8">
            <h1 className="text-6xl font-bold text-yellow-400 font-mono mb-8 animate-pulse">
              🎉 THE END 🎉
            </h1>
            <p className="text-2xl text-white font-mono mb-4">
              You did it, Scrump!
            </p>
            <p className="text-lg text-gray-300 font-mono mb-8">
              The subletters are safe, the turkey is defeated,<br />
              and Mr Feng is ready to party.
            </p>
            <p className="text-xl text-green-400 font-mono mb-8">
              Thank you for playing!
            </p>
            <div className="text-lg text-gray-400 font-mono">
              🎵 Check out The Scrumps music! 🎵
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-lg font-mono text-lg font-bold shadow-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {!isLoading && (
        <InventoryUI
          hollandiaCount={hollandiaCount}
          collectedCDs={collectedCDs}
          hasCompost={hasCompost}
          hasLadder={hasLadder}
          hasXray={hasXray}
          mrTibblesJoined={mrTibblesJoined}
          possumFed={possumFed}
          tinyClownJoined={tinyClownJoined}
          humunculousJoined={humunculousJoined}
          isChaseActive={isChaseActive}
        />
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