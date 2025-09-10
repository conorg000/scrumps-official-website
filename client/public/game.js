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
            this.controls.update();
            this.player.update();
            this.updateCamera();

            // Dialog is now handled by React component
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

            // Adjust camera position for zoom
            const zoomedCameraX = this.cameraX / this.zoom;
            const zoomedCameraY = this.cameraY / this.zoom;

            // Draw room
            this.room.draw(this.ctx, zoomedCameraX, zoomedCameraY);

            // Draw player
            this.player.draw(this.ctx, zoomedCameraX, zoomedCameraY);

            // Restore context state
            this.ctx.restore();

            // Dialog is now handled by React component
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
                    this.room = new UpstairsRoom();
                    this.player.gridX = 10;
                    this.player.gridY = 7;
                    break;
                default:
                    console.warn(`Unknown scene: ${sceneName}`);
                    return;
            }

            // Reset player position
            this.player.x = this.player.gridX;
            this.player.y = this.player.gridY;
            this.player.targetX = this.player.gridX;
            this.player.targetY = this.player.gridY;
            this.player.isMoving = false;

            // Update global room reference
            window.room = this.room;
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
