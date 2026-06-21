if (typeof Game === "undefined") {
    class Game {
        constructor() {
            this.canvas = document.getElementById("gameCanvas");
            if (!this.canvas) {
                // If no canvas found, create one (for React integration)
                this.canvas = document.createElement("canvas");
            }
            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;

            // Set canvas to full screen
            this.resizeCanvas();
            window.addEventListener("resize", () => this.resizeCanvas());

            // Game objects
            this.player = new Player(10, 7);
            this.room = new Room();
            this.currentScene = "mainRoom";
            window.room = this.room; // Make room global for collision checking
            this.controls = new Controls(this.player);

            // Camera follows player
            this.cameraX = 0;
            this.cameraY = 0;
            this.cameraSmoothing = 0.1;
            this.zoom = 1.7; // Zoom level for closer perspective

            // Dialog system
            this.dialog = null; // Will be handled by React component

            // Companions system - characters that follow the player
            this.companions = [];
            this.companionHistory = []; // Trail of player positions for companions to follow

            // Track removed items so they don't reappear when revisiting rooms
            this.removedItems = {};

            // Adele NPC - property manager who patrols and chases
            this.adele = {
                currentRoom: 'livingRoom',
                x: 10,
                y: 8,
                direction: 'down',
                isChasing: false,
                roomTimer: 0,
                speed: 0.07,
                patrolRooms: ['downstairs', 'upstairs', 'livingRoom', 'bedroom', 'frontPorch', 'rooftop'],
                visible: false,
                wanderTarget: { x: 10, y: 8 },
                wanderTimer: 0,
                catchCooldown: 0
            };

            // Exit markers for each scene
            this.exitMarkers = {
                mainRoom: [
                    { x: 10, y: 14, label: 'Downstairs', direction: 'down' },
                    { x: 19, y: 7, label: 'Upstairs', direction: 'right' }
                ],
                downstairs: [
                    { x: 10, y: 0, label: 'Backyard', direction: 'up' }
                ],
                upstairs: [
                    { x: 0, y: 11, label: 'Living Room', direction: 'left' },
                    { x: 19, y: 14, label: 'Backyard', direction: 'down-right' }
                ],
                livingRoom: [
                    { x: 19, y: 0, label: 'Balcony', direction: 'up-right' },
                    { x: 19, y: 10, label: 'Bedroom', direction: 'right' },
                    { x: 0, y: 13, label: 'Front Porch', direction: 'left' }
                ],
                bedroom: [
                    { x: 0, y: 12, label: 'Living Room', direction: 'left' }
                ],
                frontPorch: [
                    { x: 19, y: 10, label: 'Living Room', direction: 'right' },
                    { x: 18, y: 0, label: 'Roof', direction: 'up' }
                ],
                rooftop: [
                    { x: 23, y: 15, label: 'Climb Down', direction: 'down-right' }
                ]
            };

            // Visual NPC visibility flags
            this.bushTurkeyVisible = false;
            this.mrFengVisible = false;
            this.onAdeleCaught = null;
            this.frozen = false;

            // Start dialog after a brief delay to ensure game is visible
            setTimeout(() => {
                if (this.showDialog) {
                    this.showDialog("Scrump", [
                        "Where am I? What the fuck happened here?",
                        "Hm, seems I am a scrump. That's cool.",
                        "I better figure out what's going on.",
                        "Is that a boxing ring?",
                    ]);
                }
            }, 500);

            // Game loop
            this.lastTime = 0;
            this.fps = 60;
            this.frameTime = 1000 / this.fps;

            this.start();
        }

        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            // Disable image smoothing after resize
            this.ctx.imageSmoothingEnabled = false;
        }

        updateCamera() {
            // Get player's screen position
            const playerScreenPos = isometricToScreen(
                this.player.x,
                this.player.y,
            );

            // Calculate where camera should be to center player, accounting for zoom
            const targetCameraX =
                this.canvas.width / 2 - playerScreenPos.x * this.zoom;
            const targetCameraY =
                this.canvas.height / 2 - playerScreenPos.y * this.zoom;

            // Smooth camera movement
            this.cameraX +=
                (targetCameraX - this.cameraX) * this.cameraSmoothing;
            this.cameraY +=
                (targetCameraY - this.cameraY) * this.cameraSmoothing;
        }

        start() {
            this.gameLoop();
        }

        gameLoop(currentTime = 0) {
            const deltaTime = currentTime - this.lastTime;

            if (deltaTime >= this.frameTime) {
                this.update(deltaTime);
                this.draw();
                this.lastTime = currentTime;
            }

            requestAnimationFrame((time) => this.gameLoop(time));
        }

        update(deltaTime) {
            if (!this.frozen) {
                this.controls.update();
                this.player.update();
            }
            this.updateCamera();
            this.updateCompanions();
            this.updateAdele(deltaTime);
            if (window.Effects) window.Effects.update(deltaTime);

            // Dialog is now handled by React component
        }

        updateCompanions() {
            // Record player position history for companions to follow
            const currentPos = { x: this.player.x, y: this.player.y };

            // Only add to history if player has moved significantly
            if (this.companionHistory.length === 0 ||
                Math.abs(this.companionHistory[this.companionHistory.length - 1].x - currentPos.x) > 0.1 ||
                Math.abs(this.companionHistory[this.companionHistory.length - 1].y - currentPos.y) > 0.1) {
                this.companionHistory.push(currentPos);

                // Keep history limited
                if (this.companionHistory.length > 100) {
                    this.companionHistory.shift();
                }
            }

            // Update each companion to follow the trail
            this.companions.forEach((companion, index) => {
                // Each companion follows a point further back in the trail
                const followDelay = 15 + (index * 10); // Stagger companions
                const historyIndex = Math.max(0, this.companionHistory.length - followDelay);

                if (this.companionHistory[historyIndex]) {
                    const target = this.companionHistory[historyIndex];

                    // Smooth movement towards target
                    const dx = target.x - companion.x;
                    const dy = target.y - companion.y;

                    companion.x += dx * 0.15;
                    companion.y += dy * 0.15;

                    // Update grid position
                    companion.gridX = Math.floor(companion.x);
                    companion.gridY = Math.floor(companion.y);

                    // Update direction based on movement
                    if (Math.abs(dx) > Math.abs(dy)) {
                        companion.direction = dx > 0 ? 'right' : 'left';
                    } else if (Math.abs(dy) > 0.05) {
                        companion.direction = dy > 0 ? 'down' : 'up';
                    }
                }
            });
        }

        updateAdele(deltaTime) {
            if (!this.adele) return;
            if (this.frozen) return;

            const dt = Math.min(deltaTime, 100); // Cap delta

            // Decrement catch cooldown
            if (this.adele.catchCooldown > 0) {
                this.adele.catchCooldown -= dt;
            }

            if (!this.adele.isChasing) {
                // Patrol mode: wander within current room, switch rooms periodically
                this.adele.roomTimer += dt;

                // Switch rooms every ~18 seconds
                if (this.adele.roomTimer > 18000) {
                    this.adele.roomTimer = 0;
                    const rooms = this.adele.patrolRooms;
                    const currentIdx = rooms.indexOf(this.adele.currentRoom);
                    const nextIdx = (currentIdx + 1) % rooms.length;
                    this.adele.currentRoom = rooms[nextIdx];
                    // Reset position for new room
                    this.adele.x = 10;
                    this.adele.y = 8;
                    this.adele.wanderTarget = { x: 8 + Math.random() * 6, y: 6 + Math.random() * 6 };
                }

                // Gentle wandering within room
                this.adele.wanderTimer += dt;
                if (this.adele.wanderTimer > 3000) {
                    this.adele.wanderTimer = 0;
                    this.adele.wanderTarget = {
                        x: 5 + Math.random() * 10,
                        y: 4 + Math.random() * 8
                    };
                }

                // Move toward wander target
                const wdx = this.adele.wanderTarget.x - this.adele.x;
                const wdy = this.adele.wanderTarget.y - this.adele.y;
                const wanderSpeed = 0.03;
                this.adele.x += wdx * wanderSpeed;
                this.adele.y += wdy * wanderSpeed;

                // Update direction
                if (Math.abs(wdx) > Math.abs(wdy)) {
                    this.adele.direction = wdx > 0 ? 'right' : 'left';
                } else if (Math.abs(wdy) > 0.1) {
                    this.adele.direction = wdy > 0 ? 'down' : 'up';
                }

                // Patrol-mode catch: if player enters same room as Adele
                if (this.adele.currentRoom === this.currentScene && this.currentScene !== 'mainRoom') {
                    const pdx = this.player.x - this.adele.x;
                    const pdy = this.player.y - this.adele.y;
                    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                    if (pdist < 2.5 && this.onAdeleCaught && this.adele.catchCooldown <= 0) {
                        this.adele.catchCooldown = 3000;
                        this.onAdeleCaught();
                    }
                }
            } else {
                // Chase mode
                if (this.adele.currentRoom !== this.currentScene) {
                    // Travel to player's room
                    this.adele.roomTimer += dt;
                    if (this.adele.roomTimer > 5000) {
                        this.adele.roomTimer = 0;
                        this.adele.currentRoom = this.currentScene;
                        this.adele.x = 10;
                        this.adele.y = 2;
                    }
                } else {
                    // Same room as player - chase!
                    const dx = this.player.x - this.adele.x;
                    const dy = this.player.y - this.adele.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 0.5) {
                        // Move at 70% player speed
                        const chaseSpeed = this.adele.speed;
                        this.adele.x += (dx / dist) * chaseSpeed * (dt / 16);
                        this.adele.y += (dy / dist) * chaseSpeed * (dt / 16);

                        // Update direction
                        if (Math.abs(dx) > Math.abs(dy)) {
                            this.adele.direction = dx > 0 ? 'right' : 'left';
                        } else {
                            this.adele.direction = dy > 0 ? 'down' : 'up';
                        }
                    }

                    // Caught detection: less than 2 tiles, with cooldown
                    if (dist < 2 && this.onAdeleCaught && this.adele.catchCooldown <= 0) {
                        this.adele.catchCooldown = 3000;
                        this.onAdeleCaught();
                    }
                }
            }

            // Update visibility
            this.adele.visible = this.adele.currentRoom === this.currentScene;
        }

        addCompanion(type) {
            // Remove from furniture if exists
            if (this.room && this.room.furniture) {
                const furnitureIndex = this.room.furniture.findIndex(f => f.type === type);
                if (furnitureIndex !== -1) {
                    const furniture = this.room.furniture[furnitureIndex];
                    // Clear collision map for this furniture
                    for (let y = furniture.y; y < furniture.y + furniture.height; y++) {
                        for (let x = furniture.x; x < furniture.x + furniture.width; x++) {
                            if (x >= 0 && x < this.room.width && y >= 0 && y < this.room.height) {
                                this.room.collisionMap[y][x] = false;
                            }
                        }
                    }
                    this.room.furniture.splice(furnitureIndex, 1);
                }
            }

            // Create companion object
            const companion = {
                type: type,
                x: this.player.x,
                y: this.player.y + 1, // Start slightly behind player
                gridX: this.player.gridX,
                gridY: this.player.gridY + 1,
                direction: 'down'
            };

            this.companions.push(companion);

            // Initialize history with current player position
            if (this.companionHistory.length === 0) {
                for (let i = 0; i < 20; i++) {
                    this.companionHistory.push({ x: this.player.x, y: this.player.y });
                }
            }
        }

        drawClouds() {
            const time = Date.now() * 0.001;
            const cloudColor = "#ffffff";
            const cloudShadow = "#f0f8ff";

            // Moving clouds with wind drift
            const clouds = [
                { baseX: 200, y: 80, size: 1.2, speed: 0.3 },
                { baseX: 500, y: 120, size: 0.8, speed: 0.5 },
                { baseX: 800, y: 60, size: 1.0, speed: 0.2 },
                { baseX: 1200, y: 100, size: 1.5, speed: 0.4 },
                { baseX: 1500, y: 140, size: 0.9, speed: 0.6 },
                { baseX: 300, y: 200, size: 1.1, speed: 0.35 },
                { baseX: 700, y: 180, size: 0.7, speed: 0.45 },
                { baseX: 1000, y: 40, size: 1.3, speed: 0.25 },
                { baseX: 1400, y: 160, size: 1.0, speed: 0.55 },
                { baseX: 100, y: 160, size: 0.8, speed: 0.4 },
            ];

            clouds.forEach((cloud) => {
                // Wind drift + parallax effect
                const windDrift = time * cloud.speed * 20;
                const parallaxX =
                    ((cloud.baseX + windDrift) % (this.canvas.width + 200)) -
                    100 +
                    this.cameraX * 0.1;
                const parallaxY = cloud.y + this.cameraY * 0.05;

                this.drawCloud(
                    parallaxX,
                    parallaxY,
                    cloud.size,
                    cloudColor,
                    cloudShadow,
                );
            });

            // Flying slug in the sky!
            this.drawFlyingSlug(time);
        }

        drawFlyingSlug(time) {
            // Slug follows a figure-8 pattern across the sky
            const slugSpeed = 0.3;
            const centerX = this.canvas.width * 0.6;
            const centerY = this.canvas.height * 0.3;

            // Figure-8 parametric equations
            const t = time * slugSpeed;
            const slugX = centerX + Math.sin(t) * 200 + this.cameraX * 0.05;
            const slugY = centerY + Math.sin(t * 2) * 100 + this.cameraY * 0.03;

            // Slug body colors
            const slugBody = "#8fbc8f";
            const slugBelly = "#98fb98";
            const slugDark = "#556b2f";
            const slugSpot = "#6b8e23";

            // Slug body (elongated oval)
            this.ctx.fillStyle = slugBody;
            this.ctx.fillRect(slugX - 15, slugY - 4, 30, 8);
            this.ctx.fillRect(slugX - 12, slugY - 6, 24, 12);
            this.ctx.fillRect(slugX - 8, slugY - 7, 16, 14);

            // Slug belly
            this.ctx.fillStyle = slugBelly;
            this.ctx.fillRect(slugX - 10, slugY + 2, 20, 4);

            // Slug head (slightly larger front)
            this.ctx.fillStyle = slugBody;
            this.ctx.fillRect(slugX + 8, slugY - 5, 8, 10);
            this.ctx.fillRect(slugX + 12, slugY - 3, 4, 6);

            // Eye stalks (animated)
            const eyeWiggle = Math.sin(time * 4) * 2;
            this.ctx.fillStyle = slugDark;
            this.ctx.fillRect(slugX + 14, slugY - 8 + eyeWiggle, 2, 6);
            this.ctx.fillRect(slugX + 17, slugY - 9 - eyeWiggle, 2, 6);

            // Eyes
            this.ctx.fillStyle = "#000000";
            this.ctx.fillRect(slugX + 14, slugY - 9 + eyeWiggle, 2, 2);
            this.ctx.fillRect(slugX + 17, slugY - 10 - eyeWiggle, 2, 2);

            // Slug spots
            this.ctx.fillStyle = slugSpot;
            this.ctx.fillRect(slugX - 5, slugY - 2, 3, 3);
            this.ctx.fillRect(slugX + 2, slugY - 4, 4, 4);
            this.ctx.fillRect(slugX - 8, slugY + 1, 2, 2);

            // Slug trail (fading slime trail)
            for (let i = 0; i < 10; i++) {
                const trailT = t - i * 0.1;
                const trailX =
                    centerX + Math.sin(trailT) * 200 + this.cameraX * 0.05;
                const trailY =
                    centerY + Math.sin(trailT * 2) * 100 + this.cameraY * 0.03;
                const alpha = ((10 - i) / 10) * 0.3;

                this.ctx.fillStyle = `rgba(144, 238, 144, ${alpha})`;
                this.ctx.fillRect(trailX - 2, trailY + 6, 4, 2);
            }
        }

        drawCloud(x, y, scale, lightColor, shadowColor) {
            const baseSize = 24 * scale;

            // Cloud shadow parts (slightly offset)
            this.ctx.fillStyle = shadowColor;
            this.ctx.fillRect(x + 2, y + 2, baseSize * 1.5, baseSize * 0.8);
            this.ctx.fillRect(
                x + baseSize * 0.3 + 2,
                y - baseSize * 0.2 + 2,
                baseSize,
                baseSize,
            );
            this.ctx.fillRect(
                x + baseSize * 0.8 + 2,
                y + baseSize * 0.1 + 2,
                baseSize * 0.8,
                baseSize * 0.7,
            );
            this.ctx.fillRect(
                x - baseSize * 0.2 + 2,
                y + baseSize * 0.2 + 2,
                baseSize * 0.9,
                baseSize * 0.6,
            );

            // Main cloud body
            this.ctx.fillStyle = lightColor;
            this.ctx.fillRect(x, y, baseSize * 1.5, baseSize * 0.8);
            this.ctx.fillRect(
                x + baseSize * 0.3,
                y - baseSize * 0.2,
                baseSize,
                baseSize,
            );
            this.ctx.fillRect(
                x + baseSize * 0.8,
                y + baseSize * 0.1,
                baseSize * 0.8,
                baseSize * 0.7,
            );
            this.ctx.fillRect(
                x - baseSize * 0.2,
                y + baseSize * 0.2,
                baseSize * 0.9,
                baseSize * 0.6,
            );

            // Cloud highlights
            this.ctx.fillStyle = "#ffffff";
            this.ctx.fillRect(
                x + baseSize * 0.1,
                y - baseSize * 0.1,
                baseSize * 0.4,
                baseSize * 0.3,
            );
            this.ctx.fillRect(
                x + baseSize * 0.6,
                y + baseSize * 0.05,
                baseSize * 0.3,
                baseSize * 0.25,
            );
        }
        drawExitMarkers(ctx, offsetX, offsetY) {
            const markers = this.exitMarkers[this.currentScene];
            if (!markers) return;

            const time = Date.now() * 0.003;
            const pulse = (Math.sin(time) + 1) / 2; // 0 to 1

            markers.forEach(marker => {
                const screenPos = isometricToScreen(marker.x, marker.y);
                const sx = screenPos.x + offsetX;
                const sy = screenPos.y + offsetY;

                // Check proximity to player for glow/highlight
                const pdx = this.player.x - marker.x;
                const pdy = this.player.y - marker.y;
                const dist = Math.sqrt(pdx * pdx + pdy * pdy);
                const nearPlayer = dist < 3;

                const cx = sx + 24; // tile center x
                const cy = sy + 12; // tile center y

                // Floor glow when near
                if (nearPlayer) {
                    const glowAlpha = 0.15 + pulse * 0.15;
                    ctx.fillStyle = `rgba(255, 220, 100, ${glowAlpha})`;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, 20, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                }

                const bright = nearPlayer ? 1.0 : 0.7;

                // Choose between door, stairs, or ladder based on label
                if (marker.label === 'Climb Down' || marker.label === 'Roof') {
                    // Ladder sprite (matches rooftop.js drawLadderAccess size ~16x50)
                    const ladderColor = `rgba(139, 69, 19, ${bright})`;
                    const rungColor = `rgba(190, 150, 70, ${bright})`;
                    // Side rails
                    drawPixelRect(ctx, cx - 8, cy - 40, 4, 50, ladderColor);
                    drawPixelRect(ctx, cx + 4, cy - 40, 4, 50, ladderColor);
                    // Rungs
                    for (let i = 0; i < 5; i++) {
                        drawPixelRect(ctx, cx - 8, cy - 35 + i * 10, 16, 3, rungColor);
                    }
                } else if (marker.direction === 'down' || marker.direction === 'up') {
                    // Stairs sprite (vertical transitions ~36x44)
                    const stoneMain = `rgba(140, 130, 120, ${bright})`;
                    const stoneDark = `rgba(100, 95, 88, ${bright})`;
                    const stoneLight = `rgba(170, 160, 150, ${bright})`;
                    // Draw 4 stair steps
                    for (let i = 0; i < 4; i++) {
                        const stepY = cy - 6 - i * 10;
                        const stepW = 36 - i * 4;
                        const stepX = cx - stepW / 2;
                        drawPixelRect(ctx, stepX, stepY, stepW, 8, stoneMain);
                        drawPixelRect(ctx, stepX, stepY, stepW, 3, stoneLight);
                        drawPixelRect(ctx, stepX, stepY + 5, stepW, 3, stoneDark);
                    }
                    // Railing posts
                    drawPixelRect(ctx, cx - 20, cy - 42, 3, 38, stoneDark);
                    drawPixelRect(ctx, cx + 17, cy - 42, 3, 38, stoneDark);
                } else {
                    // Door frame sprite (matches balcony.js drawDoorFrame size ~45x65)
                    const woodMain = `rgba(74, 55, 40, ${bright})`;
                    const woodDark = `rgba(101, 67, 33, ${bright})`;
                    const woodLight = `rgba(181, 121, 58, ${bright})`;
                    const doorInside = `rgba(42, 42, 42, ${bright * 0.8})`;

                    // Door frame posts
                    drawPixelRect(ctx, cx - 20, cy - 60, 8, 65, woodMain);
                    drawPixelRect(ctx, cx + 12, cy - 60, 8, 65, woodDark);
                    // Top beam
                    drawPixelRect(ctx, cx - 22, cy - 65, 44, 8, woodLight);
                    // Interior (dark opening)
                    drawPixelRect(ctx, cx - 12, cy - 57, 24, 55, doorInside);
                    // Handle
                    drawPixelRect(ctx, cx + 6, cy - 32, 3, 3, nearPlayer ? '#FFD700' : '#B8860B');
                }

                // Pulsing highlight outline when near
                if (nearPlayer) {
                    ctx.strokeStyle = `rgba(255, 220, 100, ${0.3 + pulse * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cx - 24, cy - 68, 48, 72);
                }

                // Label text
                ctx.font = nearPlayer ? 'bold 9px monospace' : '8px monospace';
                ctx.textAlign = 'center';
                const labelAlpha = nearPlayer ? 0.9 : 0.5;
                ctx.fillStyle = `rgba(255, 255, 220, ${labelAlpha})`;
                ctx.fillText(marker.label, cx, cy + 14);
            });
        }

        draw() {
            // Only draw sky and clouds for main room
            if (this.currentScene === "mainRoom") {
                // Clear canvas with baby blue sky
                this.ctx.fillStyle = "#87ceeb";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // Draw sunshine rays from top-right corner
                this.drawSunshine();

                // Draw clouds
                this.drawClouds();
            }

            // Save context state
            this.ctx.save();

            // Apply zoom scaling
            this.ctx.scale(this.zoom, this.zoom);

            // Adjust camera position for zoom, applying screen shake
            const shake = window.Effects ? window.Effects.shakeOffset() : { x: 0, y: 0 };
            const zoomedCameraX = this.cameraX / this.zoom + shake.x;
            const zoomedCameraY = this.cameraY / this.zoom + shake.y;

            // Draw room
            this.room.draw(this.ctx, zoomedCameraX, zoomedCameraY);

            // Draw exit markers on the floor
            this.drawExitMarkers(this.ctx, zoomedCameraX, zoomedCameraY);

            // Floating indicators over nearby interactables
            this.drawInteractableIndicators(this.ctx, zoomedCameraX, zoomedCameraY);

            // Draw companions (behind player)
            this.drawCompanions(this.ctx, zoomedCameraX, zoomedCameraY);

            // Draw Adele NPC
            if (this.adele && this.adele.visible) {
                this.drawAdele(this.ctx, zoomedCameraX, zoomedCameraY);
            }

            // Draw Bush Turkey
            if (this.bushTurkeyVisible && this.currentScene === 'mainRoom') {
                this.drawBushTurkey(this.ctx, zoomedCameraX, zoomedCameraY);
            }

            // Draw Mr Feng
            if (this.mrFengVisible && this.currentScene === 'mainRoom') {
                this.drawMrFeng(this.ctx, zoomedCameraX, zoomedCameraY);
            }

            // Draw player
            this.player.draw(this.ctx, zoomedCameraX, zoomedCameraY);

            // World-space effects (particles, floating text)
            if (window.Effects) window.Effects.drawWorld(this.ctx, zoomedCameraX, zoomedCameraY);

            // Restore context state
            this.ctx.restore();

            // Screen-space post processing (ambient tint, vignette, transition flash)
            this.drawAmbient();
            this.drawVignette();
            if (window.Effects) window.Effects.drawFlash(this.ctx, this.canvas.width, this.canvas.height);

            // Dialog is now handled by React component
        }

        // Per-scene color grade for mood (subtle multiply/overlay tint)
        drawAmbient() {
            const tints = {
                upstairs: 'rgba(255,150,70,0.16)',   // dusk on the balcony
                rooftop: 'rgba(255,110,90,0.20)',    // sunset on the roof
                downstairs: 'rgba(40,40,90,0.22)',   // dim interior
                bedroom: 'rgba(60,40,90,0.16)',
                livingRoom: 'rgba(255,210,140,0.10)',
            };
            const tint = tints[this.currentScene];
            if (!tint) return;
            this.ctx.fillStyle = tint;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Soft vignette to focus the eye toward the centre
        drawVignette() {
            const w = this.canvas.width, h = this.canvas.height;
            const g = this.ctx.createRadialGradient(
                w / 2, h / 2, Math.min(w, h) * 0.35,
                w / 2, h / 2, Math.max(w, h) * 0.75
            );
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,0.35)');
            this.ctx.fillStyle = g;
            this.ctx.fillRect(0, 0, w, h);
        }

        // Bobbing chevron + glow over interactable furniture near the player
        drawInteractableIndicators(ctx, offsetX, offsetY) {
            if (this.frozen) return;
            const interactable = {
                mr_tibbles: 1, hollandia_can: 1, cd_item: 1, ladder: 1, tent: 1,
                compost: 1, beer_pyramid: 1, tiny_clown: 1, xray: 1, kiddy_pool: 1,
                guitar: 1, boxing_ring: 1, tree: 1, beer_bottle: 1, boxing_gloves: 1,
            };
            if (!this.room || !this.room.furniture) return;
            const t = Date.now() * 0.005;
            this.room.furniture.forEach(f => {
                if (!interactable[f.type]) return;
                const cx = f.x + (f.width || 1) / 2;
                const cy = f.y + (f.height || 1) / 2;
                const pdx = this.player.x - cx;
                const pdy = this.player.y - cy;
                if (Math.sqrt(pdx * pdx + pdy * pdy) > 2.6) return;

                const pos = isometricToScreen(cx, cy);
                const sx = pos.x + offsetX;
                const baseY = pos.y + offsetY - 36 - (f.height || 1) * 6;
                const bob = Math.sin(t + cx) * 3;

                // Soft glow on the ground
                ctx.globalAlpha = 0.25 + Math.sin(t * 1.4) * 0.08;
                ctx.fillStyle = '#fff7b0';
                ctx.beginPath();
                ctx.ellipse(pos.x + offsetX, pos.y + offsetY, 16, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

                // Down-chevron marker
                const y = baseY + bob;
                ctx.fillStyle = '#000000';
                ctx.fillRect(sx - 7, y - 1, 14, 14);
                ctx.fillStyle = '#ffe14d';
                ctx.beginPath();
                ctx.moveTo(sx - 6, y);
                ctx.lineTo(sx + 6, y);
                ctx.lineTo(sx, y + 8);
                ctx.closePath();
                ctx.fill();
            });
        }

        drawCompanions(ctx, offsetX, offsetY) {
            this.companions.forEach(companion => {
                if (companion.type === 'mr_tibbles') {
                    this.drawMrTibblesCompanion(ctx, companion, offsetX, offsetY);
                } else if (companion.type === 'tent') {
                    this.drawPossumCompanion(ctx, companion, offsetX, offsetY);
                } else if (companion.type === 'tiny_clown') {
                    this.drawTinyClownCompanion(ctx, companion, offsetX, offsetY);
                } else if (companion.type === 'humunculous') {
                    this.drawHumunculousCompanion(ctx, companion, offsetX, offsetY);
                }
            });
        }

        drawMrTibblesCompanion(ctx, companion, offsetX, offsetY) {
            const screenPos = isometricToScreen(companion.x, companion.y);
            const x = screenPos.x + offsetX - 18;
            const y = screenPos.y + offsetY - 32;

            // Mr Tibbles - a cute white fluffy cat (smaller version for following)
            const white = '#ffffff';
            const lightGray = '#e8e8e8';
            const gray = '#c0c0c0';
            const darkGray = '#808080';
            const pink = '#ffb6c1';
            const black = '#000000';

            // Shadow
            drawPixelRect(ctx, x + 8, y + 28, 20, 4, 'rgba(0,0,0,0.3)');

            // Body - fluffy oval shape
            drawPixelRect(ctx, x + 10, y + 12, 16, 14, white);
            drawPixelRect(ctx, x + 8, y + 14, 20, 10, white);
            drawPixelRect(ctx, x + 12, y + 10, 12, 4, white);

            // Fluffy chest
            drawPixelRect(ctx, x + 14, y + 16, 8, 8, lightGray);

            // Body shading
            drawPixelRect(ctx, x + 24, y + 16, 4, 6, gray);

            // Head - round and fluffy
            drawPixelRect(ctx, x + 6, y - 2, 14, 14, white);
            drawPixelRect(ctx, x + 4, y, 18, 10, white);
            drawPixelRect(ctx, x + 8, y - 4, 10, 4, white);

            // Fluffy cheeks
            drawPixelRect(ctx, x + 2, y + 2, 6, 6, white);
            drawPixelRect(ctx, x + 18, y + 2, 6, 6, white);

            // Ears
            drawPixelRect(ctx, x + 6, y - 8, 4, 6, white);
            drawPixelRect(ctx, x + 8, y - 10, 2, 4, white);
            drawPixelRect(ctx, x + 16, y - 8, 4, 6, white);
            drawPixelRect(ctx, x + 16, y - 10, 2, 4, white);

            // Inner ears - pink
            drawPixelRect(ctx, x + 8, y - 6, 2, 4, pink);
            drawPixelRect(ctx, x + 16, y - 6, 2, 4, pink);

            // Eyes - direction aware
            if (companion.direction === 'left') {
                drawPixelRect(ctx, x + 6, y + 2, 3, 3, black);
                drawPixelRect(ctx, x + 12, y + 2, 3, 3, black);
                drawPixelRect(ctx, x + 7, y + 3, 1, 1, white);
                drawPixelRect(ctx, x + 13, y + 3, 1, 1, white);
            } else if (companion.direction === 'right') {
                drawPixelRect(ctx, x + 10, y + 2, 3, 3, black);
                drawPixelRect(ctx, x + 16, y + 2, 3, 3, black);
                drawPixelRect(ctx, x + 11, y + 3, 1, 1, white);
                drawPixelRect(ctx, x + 17, y + 3, 1, 1, white);
            } else {
                drawPixelRect(ctx, x + 8, y + 2, 3, 3, black);
                drawPixelRect(ctx, x + 14, y + 2, 3, 3, black);
                drawPixelRect(ctx, x + 9, y + 3, 1, 1, white);
                drawPixelRect(ctx, x + 15, y + 3, 1, 1, white);
            }

            // Nose
            drawPixelRect(ctx, x + 12, y + 6, 2, 2, pink);

            // Mouth
            drawPixelRect(ctx, x + 11, y + 9, 2, 1, darkGray);
            drawPixelRect(ctx, x + 14, y + 9, 2, 1, darkGray);

            // Whiskers
            drawPixelRect(ctx, x, y + 4, 4, 1, darkGray);
            drawPixelRect(ctx, x, y + 6, 4, 1, darkGray);
            drawPixelRect(ctx, x + 22, y + 4, 4, 1, darkGray);
            drawPixelRect(ctx, x + 22, y + 6, 4, 1, darkGray);

            // Front paws
            drawPixelRect(ctx, x + 10, y + 24, 4, 4, white);
            drawPixelRect(ctx, x + 20, y + 24, 4, 4, white);

            // Paw pads
            drawPixelRect(ctx, x + 11, y + 25, 2, 2, pink);
            drawPixelRect(ctx, x + 21, y + 25, 2, 2, pink);

            // Tail - fluffy and curved based on direction
            if (companion.direction === 'left') {
                drawPixelRect(ctx, x + 24, y + 14, 4, 4, white);
                drawPixelRect(ctx, x + 26, y + 10, 4, 6, white);
                drawPixelRect(ctx, x + 28, y + 6, 4, 6, white);
            } else if (companion.direction === 'right') {
                drawPixelRect(ctx, x, y + 14, 4, 4, white);
                drawPixelRect(ctx, x - 2, y + 10, 4, 6, white);
                drawPixelRect(ctx, x - 4, y + 6, 4, 6, white);
            } else {
                drawPixelRect(ctx, x + 26, y + 14, 4, 4, white);
                drawPixelRect(ctx, x + 28, y + 10, 4, 6, white);
                drawPixelRect(ctx, x + 30, y + 6, 4, 6, white);
            }
        }

        drawPossumCompanion(ctx, companion, offsetX, offsetY) {
            const screenPos = isometricToScreen(companion.x, companion.y);
            const x = screenPos.x + offsetX - 12;
            const y = screenPos.y + offsetY - 24;

            const furColor = '#808080';
            const furDark = '#606060';
            const furLight = '#a0a0a0';
            const earPink = '#ffb6c1';
            const noseColor = '#ff69b4';
            const eyeColor = '#000000';

            // Shadow
            drawPixelRect(ctx, x + 2, y + 22, 20, 4, 'rgba(0,0,0,0.3)');

            // Body
            drawPixelRect(ctx, x + 4, y + 8, 16, 14, furColor);
            drawPixelRect(ctx, x + 6, y + 10, 12, 10, furLight);

            // Tail - long and curled based on direction
            if (companion.direction === 'left') {
                drawPixelRect(ctx, x + 18, y + 12, 4, 3, furColor);
                drawPixelRect(ctx, x + 20, y + 10, 4, 4, furColor);
                drawPixelRect(ctx, x + 22, y + 6, 3, 6, furColor);
                drawPixelRect(ctx, x + 20, y + 4, 4, 4, furDark);
            } else if (companion.direction === 'right') {
                drawPixelRect(ctx, x + 2, y + 12, 4, 3, furColor);
                drawPixelRect(ctx, x, y + 10, 4, 4, furColor);
                drawPixelRect(ctx, x - 2, y + 6, 3, 6, furColor);
                drawPixelRect(ctx, x - 2, y + 4, 4, 4, furDark);
            } else {
                drawPixelRect(ctx, x + 18, y + 14, 6, 3, furColor);
                drawPixelRect(ctx, x + 22, y + 10, 4, 6, furColor);
                drawPixelRect(ctx, x + 24, y + 6, 3, 6, furDark);
            }

            // Head
            drawPixelRect(ctx, x + 6, y - 2, 12, 12, furColor);
            drawPixelRect(ctx, x + 4, y + 2, 16, 8, furColor);
            drawPixelRect(ctx, x + 8, y, 8, 4, furLight);

            // Snout
            drawPixelRect(ctx, x + 8, y + 4, 8, 5, furLight);

            // Ears
            drawPixelRect(ctx, x + 2, y - 6, 6, 8, furColor);
            drawPixelRect(ctx, x + 16, y - 6, 6, 8, furColor);
            drawPixelRect(ctx, x + 4, y - 4, 4, 6, earPink);
            drawPixelRect(ctx, x + 16, y - 4, 4, 6, earPink);

            // Eyes - direction aware
            if (companion.direction === 'left') {
                drawPixelRect(ctx, x + 6, y + 2, 3, 3, eyeColor);
                drawPixelRect(ctx, x + 12, y + 2, 3, 3, eyeColor);
            } else if (companion.direction === 'right') {
                drawPixelRect(ctx, x + 8, y + 2, 3, 3, eyeColor);
                drawPixelRect(ctx, x + 14, y + 2, 3, 3, eyeColor);
            } else {
                drawPixelRect(ctx, x + 7, y + 2, 3, 3, eyeColor);
                drawPixelRect(ctx, x + 13, y + 2, 3, 3, eyeColor);
            }
            // Eye shine
            drawPixelRect(ctx, x + 8, y + 3, 1, 1, '#ffffff');
            drawPixelRect(ctx, x + 14, y + 3, 1, 1, '#ffffff');

            // Pink nose
            drawPixelRect(ctx, x + 10, y + 6, 4, 3, noseColor);

            // Front paws
            drawPixelRect(ctx, x + 4, y + 18, 5, 4, furColor);
            drawPixelRect(ctx, x + 14, y + 18, 5, 4, furColor);
            drawPixelRect(ctx, x + 5, y + 20, 3, 2, earPink);
            drawPixelRect(ctx, x + 15, y + 20, 3, 2, earPink);
        }

        drawTinyClownCompanion(ctx, companion, offsetX, offsetY) {
            const screenPos = isometricToScreen(companion.x, companion.y);
            const x = screenPos.x + offsetX - 10;
            const y = screenPos.y + offsetY - 20;

            // Shadow
            drawPixelRect(ctx, x + 2, y + 18, 16, 4, 'rgba(0,0,0,0.3)');

            // Big clown shoes
            drawPixelRect(ctx, x - 2, y + 14, 8, 4, '#FF0000');
            drawPixelRect(ctx, x + 14, y + 14, 8, 4, '#FF0000');

            // Body - colorful outfit
            drawPixelRect(ctx, x + 4, y + 2, 12, 14, '#FF6B6B');

            // Polka dots
            drawPixelRect(ctx, x + 6, y + 6, 3, 3, '#4ECDC4');
            drawPixelRect(ctx, x + 11, y + 10, 3, 3, '#4ECDC4');

            // Head
            drawPixelRect(ctx, x + 5, y - 8, 10, 10, '#FFE4C4');

            // Red nose (big!)
            drawPixelRect(ctx, x + 8, y - 4, 4, 4, '#FF0000');

            // Eyes - direction aware
            if (companion.direction === 'left') {
                drawPixelRect(ctx, x + 5, y - 6, 2, 2, '#000000');
                drawPixelRect(ctx, x + 10, y - 6, 2, 2, '#000000');
            } else if (companion.direction === 'right') {
                drawPixelRect(ctx, x + 8, y - 6, 2, 2, '#000000');
                drawPixelRect(ctx, x + 13, y - 6, 2, 2, '#000000');
            } else {
                drawPixelRect(ctx, x + 6, y - 6, 2, 2, '#000000');
                drawPixelRect(ctx, x + 12, y - 6, 2, 2, '#000000');
            }

            // Smile
            drawPixelRect(ctx, x + 7, y - 1, 6, 1, '#FF0000');

            // Rainbow hair puffs
            const hairColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'];
            for (let i = 0; i < 5; i++) {
                drawPixelRect(ctx, x + 3 + i * 3, y - 12, 3, 4, hairColors[i]);
            }

            // Tiny hat
            drawPixelRect(ctx, x + 7, y - 16, 6, 4, '#800080');
            drawPixelRect(ctx, x + 8, y - 18, 4, 2, '#800080');
        }

        drawHumunculousCompanion(ctx, companion, offsetX, offsetY) {
            const screenPos = isometricToScreen(companion.x, companion.y);
            const x = screenPos.x + offsetX - 12;
            const y = screenPos.y + offsetY - 30;

            const boneColor = '#E8E8D0';
            const boneDark = '#C8C8B0';

            // Wobble animation (still missing foot even as companion!)
            const time = Date.now() * 0.004;
            const wobble = Math.sin(time) * 1;

            // Shadow
            drawPixelRect(ctx, x + 4, y + 28, 16, 4, 'rgba(0,0,0,0.3)');

            // Legs
            drawPixelRect(ctx, x + 6, y + 14 + wobble, 3, 14, boneColor);
            drawPixelRect(ctx, x + 4, y + 26 + wobble, 6, 3, boneColor); // foot
            drawPixelRect(ctx, x + 14, y + 14 - wobble, 3, 12, boneColor); // no foot!

            // Pelvis
            drawPixelRect(ctx, x + 4, y + 12, 16, 4, boneColor);

            // Spine
            drawPixelRect(ctx, x + 10, y - 8, 3, 22, boneColor);

            // Ribs
            for (let i = 0; i < 3; i++) {
                drawPixelRect(ctx, x + 5, y - 4 + i * 4, 14, 2, boneColor);
            }

            // Arms
            drawPixelRect(ctx, x + 2, y - 4, 3, 12, boneColor);
            drawPixelRect(ctx, x + 18, y - 4, 3, 12, boneColor);

            // Skull
            drawPixelRect(ctx, x + 6, y - 18, 12, 12, boneColor);
            drawPixelRect(ctx, x + 5, y - 14, 14, 8, boneColor);

            // Eye sockets
            drawPixelRect(ctx, x + 8, y - 14, 3, 3, '#000000');
            drawPixelRect(ctx, x + 13, y - 14, 3, 3, '#000000');

            // Glowing eyes
            drawPixelRect(ctx, x + 9, y - 13, 1, 1, '#FF4444');
            drawPixelRect(ctx, x + 14, y - 13, 1, 1, '#FF4444');

            // Teeth
            drawPixelRect(ctx, x + 8, y - 8, 8, 2, '#FFFFF0');
        }

        drawAdele(ctx, offsetX, offsetY) {
            const screenPos = isometricToScreen(this.adele.x, this.adele.y);
            const x = screenPos.x + offsetX - 14;
            const y = screenPos.y + offsetY - 40;

            const hairColor = '#5C3317';
            const hairDark = '#3B1F0B';
            const suitColor = '#1a1a2e';
            const suitDark = '#0f0f1a';
            const blouseColor = '#f0f0f0';
            const skinColor = '#F5CBA7';
            const skinDark = '#E8B894';
            const clipboardColor = '#C4A35A';
            const clipboardDark = '#A08040';

            // Shadow
            drawPixelRect(ctx, x + 4, y + 38, 20, 4, 'rgba(0,0,0,0.3)');

            // Legs - dark suit pants
            drawPixelRect(ctx, x + 8, y + 28, 4, 10, suitColor);
            drawPixelRect(ctx, x + 16, y + 28, 4, 10, suitColor);

            // Shoes
            drawPixelRect(ctx, x + 6, y + 36, 6, 3, '#2c2c2c');
            drawPixelRect(ctx, x + 16, y + 36, 6, 3, '#2c2c2c');

            // Body - business suit jacket
            drawPixelRect(ctx, x + 6, y + 14, 16, 16, suitColor);
            drawPixelRect(ctx, x + 4, y + 16, 20, 12, suitColor);

            // Suit dark side
            drawPixelRect(ctx, x + 20, y + 16, 4, 10, suitDark);

            // White blouse V-neck
            drawPixelRect(ctx, x + 12, y + 14, 4, 8, blouseColor);
            drawPixelRect(ctx, x + 11, y + 14, 6, 3, blouseColor);

            // Suit lapels
            drawPixelRect(ctx, x + 10, y + 14, 2, 6, suitDark);
            drawPixelRect(ctx, x + 16, y + 14, 2, 6, suitDark);

            // Arms
            drawPixelRect(ctx, x + 2, y + 16, 4, 12, suitColor);
            drawPixelRect(ctx, x + 22, y + 16, 4, 12, suitColor);

            // Clipboard in hand
            drawPixelRect(ctx, x + 22, y + 24, 6, 8, clipboardColor);
            drawPixelRect(ctx, x + 23, y + 25, 4, 6, '#ffffff');
            drawPixelRect(ctx, x + 23, y + 23, 4, 2, clipboardDark);
            // Lines on clipboard
            drawPixelRect(ctx, x + 24, y + 26, 2, 1, '#666');
            drawPixelRect(ctx, x + 24, y + 28, 2, 1, '#666');

            // Head
            drawPixelRect(ctx, x + 7, y - 2, 14, 16, skinColor);
            drawPixelRect(ctx, x + 5, y + 2, 18, 10, skinColor);

            // Cheek shading
            drawPixelRect(ctx, x + 19, y + 6, 4, 4, skinDark);

            // Hair - brown business bob
            drawPixelRect(ctx, x + 5, y - 6, 18, 8, hairColor);
            drawPixelRect(ctx, x + 3, y - 4, 22, 6, hairColor);
            drawPixelRect(ctx, x + 3, y, 4, 10, hairColor);
            drawPixelRect(ctx, x + 21, y, 4, 10, hairColor);

            // Hair top highlight
            drawPixelRect(ctx, x + 9, y - 6, 6, 2, hairDark);

            // Eyes - stern/narrowed, direction aware
            if (this.adele.direction === 'left') {
                drawPixelRect(ctx, x + 7, y + 4, 4, 2, '#000000');
                drawPixelRect(ctx, x + 14, y + 4, 4, 2, '#000000');
                // Angry eyebrows
                drawPixelRect(ctx, x + 7, y + 2, 5, 1, hairColor);
                drawPixelRect(ctx, x + 14, y + 2, 5, 1, hairColor);
            } else if (this.adele.direction === 'right') {
                drawPixelRect(ctx, x + 10, y + 4, 4, 2, '#000000');
                drawPixelRect(ctx, x + 17, y + 4, 4, 2, '#000000');
                drawPixelRect(ctx, x + 9, y + 2, 5, 1, hairColor);
                drawPixelRect(ctx, x + 16, y + 2, 5, 1, hairColor);
            } else {
                drawPixelRect(ctx, x + 9, y + 4, 3, 2, '#000000');
                drawPixelRect(ctx, x + 16, y + 4, 3, 2, '#000000');
                drawPixelRect(ctx, x + 8, y + 2, 5, 1, hairColor);
                drawPixelRect(ctx, x + 15, y + 2, 5, 1, hairColor);
            }

            // Stern mouth - thin line
            drawPixelRect(ctx, x + 11, y + 10, 6, 1, '#CC6666');

            // Chase mode red glow
            if (this.adele.isChasing) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
                ctx.fillRect(x - 2, y - 8, 32, 50);
            }
        }

        drawBushTurkey(ctx, offsetX, offsetY) {
            const screenPos = isometricToScreen(12, 3);
            const x = screenPos.x + offsetX - 16;
            const y = screenPos.y + offsetY - 36;

            const bodyColor = '#6B3A2A';
            const bodyDark = '#4A2818';
            const wattleRed = '#CC2222';
            const wattleDark = '#991111';
            const beakColor = '#DAA520';
            const tailColor = '#8B4513';
            const tailDark = '#5C2D0E';
            const legColor = '#CC9900';

            // Shadow
            drawPixelRect(ctx, x + 4, y + 34, 24, 4, 'rgba(0,0,0,0.3)');

            // Tail feathers - fanned out
            drawPixelRect(ctx, x, y - 2, 6, 16, tailColor);
            drawPixelRect(ctx, x - 2, y, 4, 12, tailDark);
            drawPixelRect(ctx, x + 2, y - 4, 4, 8, tailColor);
            drawPixelRect(ctx, x - 4, y + 2, 4, 8, tailColor);
            drawPixelRect(ctx, x + 4, y - 6, 4, 6, tailDark);

            // Legs
            drawPixelRect(ctx, x + 10, y + 28, 3, 8, legColor);
            drawPixelRect(ctx, x + 20, y + 28, 3, 8, legColor);
            // Feet/claws
            drawPixelRect(ctx, x + 8, y + 34, 7, 2, legColor);
            drawPixelRect(ctx, x + 18, y + 34, 7, 2, legColor);

            // Body - large round shape
            drawPixelRect(ctx, x + 6, y + 8, 20, 20, bodyColor);
            drawPixelRect(ctx, x + 4, y + 12, 24, 14, bodyColor);
            drawPixelRect(ctx, x + 8, y + 6, 16, 4, bodyColor);

            // Body dark shading
            drawPixelRect(ctx, x + 22, y + 14, 6, 10, bodyDark);

            // Breast feathers lighter
            drawPixelRect(ctx, x + 10, y + 16, 10, 10, '#7D4A38');

            // Neck
            drawPixelRect(ctx, x + 14, y, 6, 10, bodyColor);
            drawPixelRect(ctx, x + 12, y + 2, 10, 6, bodyColor);

            // Head
            drawPixelRect(ctx, x + 12, y - 8, 10, 10, bodyColor);
            drawPixelRect(ctx, x + 10, y - 6, 14, 8, bodyColor);

            // Wattle - red hanging bit
            drawPixelRect(ctx, x + 22, y - 6, 4, 8, wattleRed);
            drawPixelRect(ctx, x + 24, y - 4, 3, 6, wattleDark);
            drawPixelRect(ctx, x + 22, y + 0, 6, 4, wattleRed);

            // Beak
            drawPixelRect(ctx, x + 22, y - 4, 6, 3, beakColor);
            drawPixelRect(ctx, x + 26, y - 3, 3, 2, beakColor);

            // Eye - angry
            drawPixelRect(ctx, x + 18, y - 4, 3, 3, '#FFFF00');
            drawPixelRect(ctx, x + 19, y - 3, 1, 1, '#000000');

            // Angry eyebrow
            drawPixelRect(ctx, x + 17, y - 6, 5, 1, '#000000');

            // Wing detail
            drawPixelRect(ctx, x + 4, y + 12, 4, 10, bodyDark);
            drawPixelRect(ctx, x + 6, y + 14, 2, 6, tailColor);
        }

        drawMrFeng(ctx, offsetX, offsetY) {
            const screenPos = isometricToScreen(8, 10);
            const x = screenPos.x + offsetX - 14;
            const y = screenPos.y + offsetY - 38;

            const poloColor = '#2E5984';
            const poloDark = '#1E3A5F';
            const jeansColor = '#4169E1';
            const jeansDark = '#2850B0';
            const skinColor = '#F5CBA7';
            const skinDark = '#E8B894';
            const hairColor = '#1a1a1a';
            const sunglassesColor = '#111111';

            // Shadow
            drawPixelRect(ctx, x + 4, y + 38, 20, 4, 'rgba(0,0,0,0.3)');

            // Legs - jeans
            drawPixelRect(ctx, x + 8, y + 26, 4, 12, jeansColor);
            drawPixelRect(ctx, x + 16, y + 26, 4, 12, jeansColor);
            drawPixelRect(ctx, x + 12, y + 26, 4, 2, jeansDark);

            // Shoes - casual
            drawPixelRect(ctx, x + 6, y + 36, 6, 3, '#ffffff');
            drawPixelRect(ctx, x + 16, y + 36, 6, 3, '#ffffff');
            // Shoe detail
            drawPixelRect(ctx, x + 7, y + 37, 4, 1, '#cccccc');
            drawPixelRect(ctx, x + 17, y + 37, 4, 1, '#cccccc');

            // Body - polo shirt
            drawPixelRect(ctx, x + 6, y + 12, 16, 16, poloColor);
            drawPixelRect(ctx, x + 4, y + 14, 20, 12, poloColor);

            // Polo collar
            drawPixelRect(ctx, x + 10, y + 12, 8, 3, poloDark);
            drawPixelRect(ctx, x + 12, y + 12, 4, 4, skinColor);

            // Polo buttons
            drawPixelRect(ctx, x + 13, y + 16, 2, 1, '#ffffff');
            drawPixelRect(ctx, x + 13, y + 18, 2, 1, '#ffffff');

            // Side shading
            drawPixelRect(ctx, x + 20, y + 14, 4, 10, poloDark);

            // Arms
            drawPixelRect(ctx, x + 2, y + 14, 4, 10, poloColor);
            drawPixelRect(ctx, x + 22, y + 14, 4, 10, poloColor);

            // Hands
            drawPixelRect(ctx, x + 2, y + 22, 4, 4, skinColor);
            drawPixelRect(ctx, x + 22, y + 22, 4, 4, skinColor);

            // Head
            drawPixelRect(ctx, x + 7, y - 4, 14, 16, skinColor);
            drawPixelRect(ctx, x + 5, y, 18, 10, skinColor);

            // Cheek shading
            drawPixelRect(ctx, x + 19, y + 4, 4, 4, skinDark);

            // Hair - dark, neat
            drawPixelRect(ctx, x + 5, y - 8, 18, 6, hairColor);
            drawPixelRect(ctx, x + 3, y - 6, 22, 4, hairColor);
            drawPixelRect(ctx, x + 5, y - 4, 18, 2, hairColor);

            // Sunnies
            drawPixelRect(ctx, x + 7, y + 2, 6, 4, sunglassesColor);
            drawPixelRect(ctx, x + 15, y + 2, 6, 4, sunglassesColor);
            drawPixelRect(ctx, x + 13, y + 3, 2, 1, sunglassesColor);
            // Lens shine
            drawPixelRect(ctx, x + 8, y + 3, 2, 1, '#333333');
            drawPixelRect(ctx, x + 16, y + 3, 2, 1, '#333333');

            // Smile
            drawPixelRect(ctx, x + 11, y + 9, 6, 1, '#CC8866');
            drawPixelRect(ctx, x + 12, y + 10, 4, 1, '#CC8866');
        }

        removeItem(sceneName, furnitureType, furnitureX, furnitureY) {
            if (!this.removedItems[sceneName]) {
                this.removedItems[sceneName] = [];
            }
            this.removedItems[sceneName].push({ type: furnitureType, x: furnitureX, y: furnitureY });
        }

        drawSunshine() {
            const time = Date.now() * 0.001;
            const sunX = this.canvas.width - 100;
            const sunY = 50;

            // Animated sun rays
            const rayCount = 12;
            for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI * 2 + time * 0.5;
                const rayLength = 150 + Math.sin(time * 2 + i) * 30;
                const rayWidth = 8 + Math.sin(time * 3 + i) * 4;

                const endX = sunX + Math.cos(angle) * rayLength;
                const endY = sunY + Math.sin(angle) * rayLength;

                // Create gradient for each ray
                const gradient = this.ctx.createLinearGradient(
                    sunX,
                    sunY,
                    endX,
                    endY,
                );
                gradient.addColorStop(0, "rgba(255, 255, 0, 0.8)");
                gradient.addColorStop(0.5, "rgba(255, 215, 0, 0.4)");
                gradient.addColorStop(1, "rgba(255, 255, 0, 0.1)");

                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = rayWidth;
                this.ctx.lineCap = "round";
                this.ctx.beginPath();
                this.ctx.moveTo(sunX, sunY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }

            // Main sun body
            const sunGradient = this.ctx.createRadialGradient(
                sunX,
                sunY,
                0,
                sunX,
                sunY,
                40,
            );
            sunGradient.addColorStop(0, "#ffff99");
            sunGradient.addColorStop(0.7, "#ffd700");
            sunGradient.addColorStop(1, "#ff8c00");

            this.ctx.fillStyle = sunGradient;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
            this.ctx.fill();

            // Sun highlight
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            this.ctx.beginPath();
            this.ctx.arc(sunX - 8, sunY - 8, 12, 0, Math.PI * 2);
            this.ctx.fill();

            // Warm light overlay on entire scene
            const lightGradient = this.ctx.createRadialGradient(
                sunX,
                sunY,
                0,
                sunX,
                sunY,
                this.canvas.width,
            );
            lightGradient.addColorStop(0, "rgba(255, 255, 0, 0.1)");
            lightGradient.addColorStop(0.3, "rgba(255, 215, 0, 0.05)");
            lightGradient.addColorStop(1, "rgba(255, 255, 0, 0)");

            this.ctx.fillStyle = lightGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        loadScene(sceneName) {
            this.currentScene = sceneName;

            switch (sceneName) {
                case "mainRoom":
                    this.room = new Room();
                    this.player.gridX = 10;
                    this.player.gridY = 7;
                    break;
                case "downstairs":
                    this.room = new DownstairsRoom();
                    this.player.gridX = 10;
                    this.player.gridY = 7;
                    break;
                case "upstairs":
                    this.room = new Balcony();
                    this.player.gridX = 10;
                    this.player.gridY = 7;
                    break;
                case "livingRoom":
                    this.room = new LivingRoom(this);
                    const livingStartPos = this.room.getPlayerStartPosition();
                    this.player.gridX = livingStartPos.x;
                    this.player.gridY = livingStartPos.y;
                    break;
                case "bedroom":
                    this.room = new Bedroom(this);
                    const bedroomStartPos = this.room.getPlayerStartPosition();
                    this.player.gridX = bedroomStartPos.x;
                    this.player.gridY = bedroomStartPos.y;
                    break;
                case "frontPorch":
                    this.room = new FrontPorch(this);
                    const porchStartPos = this.room.getPlayerStartPosition();
                    this.player.gridX = porchStartPos.x;
                    this.player.gridY = porchStartPos.y;
                    break;
                case "rooftop":
                    this.room = new Rooftop(this);
                    const roofStartPos = this.room.getPlayerStartPosition();
                    this.player.gridX = roofStartPos.x;
                    this.player.gridY = roofStartPos.y;
                    break;
                default:
                    console.warn(`Unknown scene: ${sceneName}`);
                    return;
            }

            // Remove previously collected items
            if (this.removedItems[sceneName]) {
                this.removedItems[sceneName].forEach(item => {
                    const idx = this.room.furniture.findIndex(f =>
                        f.type === item.type && f.x === item.x && f.y === item.y
                    );
                    if (idx !== -1) {
                        const furniture = this.room.furniture[idx];
                        // Clear collision map
                        for (let y = furniture.y; y < furniture.y + furniture.height; y++) {
                            for (let x = furniture.x; x < furniture.x + furniture.width; x++) {
                                if (x >= 0 && x < this.room.width && y >= 0 && y < this.room.height) {
                                    this.room.collisionMap[y][x] = false;
                                }
                            }
                        }
                        this.room.furniture.splice(idx, 1);
                    }
                });
            }

            // Remove any companion types from furniture (they follow the player now)
            this.companions.forEach(companion => {
                const furnitureIndex = this.room.furniture.findIndex(f => f.type === companion.type);
                if (furnitureIndex !== -1) {
                    const furniture = this.room.furniture[furnitureIndex];
                    // Clear collision map
                    for (let y = furniture.y; y < furniture.y + furniture.height; y++) {
                        for (let x = furniture.x; x < furniture.x + furniture.width; x++) {
                            if (x >= 0 && x < this.room.width && y >= 0 && y < this.room.height) {
                                this.room.collisionMap[y][x] = false;
                            }
                        }
                    }
                    this.room.furniture.splice(furnitureIndex, 1);
                }
            });

            // Reset player position
            this.player.x = this.player.gridX;
            this.player.y = this.player.gridY;
            this.player.targetX = this.player.gridX;
            this.player.targetY = this.player.gridY;
            this.player.isMoving = false;

            // Reset companion positions to follow player
            this.companions.forEach(companion => {
                companion.x = this.player.x;
                companion.y = this.player.y + 1;
                companion.gridX = this.player.gridX;
                companion.gridY = this.player.gridY + 1;
            });

            // Clear position history and re-initialize
            this.companionHistory = [];
            for (let i = 0; i < 20; i++) {
                this.companionHistory.push({ x: this.player.x, y: this.player.y });
            }

            // Update global room reference
            window.room = this.room;

            // Transition feedback
            if (window.Effects) {
                window.Effects.flashIn('0,0,0');
                window.Effects.sfx('whoosh');
            }
        }

        // Dialog methods will be overridden by React component
        showDialog(characterName, text) {
            // This will be overridden by the React component
            console.log(`Dialog: ${characterName}:`, text);
        }

        hideDialog() {
            // This will be overridden by the React component
        }
    }

    // Make Game available globally
    window.Game = Game;
}
