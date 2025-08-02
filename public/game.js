if (typeof Game === 'undefined') {
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            // If no canvas found, create one (for React integration)
            this.canvas = document.createElement('canvas');
        }
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Set canvas to full screen
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game objects
        this.player = new Player(10, 7);
        this.room = new Room();
        this.currentScene = 'mainRoom';
        window.room = this.room; // Make room global for collision checking
        this.controls = new Controls(this.player);
        
        // Camera follows player
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraSmoothing = 0.1;
        
        // Dialog system
        this.dialog = null; // Will be handled by React component
        
        // Start dialog after a brief delay to ensure game is visible
        setTimeout(() => {
            if (this.showDialog) {
                this.showDialog("Scrump", [
                    "Where am I? What the fuck happened here?",
                    "Hm, seems I am a scrump. That's cool.",
                    "I better figure out what's going on.",
                    "Is that a boxing ring?"
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
        const playerScreenPos = isometricToScreen(this.player.x, this.player.y);
        
        // Calculate where camera should be to center player
        const targetCameraX = this.canvas.width / 2 - playerScreenPos.x;
        const targetCameraY = this.canvas.height / 2 - playerScreenPos.y;
        
        // Smooth camera movement
        this.cameraX += (targetCameraX - this.cameraX) * this.cameraSmoothing;
        this.cameraY += (targetCameraY - this.cameraY) * this.cameraSmoothing;
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
        const cloudColor = '#ffffff';
        const cloudShadow = '#f0f8ff';
        
        // Static clouds that move slightly with camera for parallax effect
        const clouds = [
            { x: 200, y: 80, size: 1.2 },
            { x: 500, y: 120, size: 0.8 },
            { x: 800, y: 60, size: 1.0 },
            { x: 1200, y: 100, size: 1.5 },
            { x: 1500, y: 140, size: 0.9 },
            { x: 300, y: 200, size: 1.1 },
            { x: 700, y: 180, size: 0.7 },
            { x: 1000, y: 40, size: 1.3 },
            { x: 1400, y: 160, size: 1.0 },
            { x: 100, y: 160, size: 0.8 }
        ];
        
        clouds.forEach(cloud => {
            // Parallax effect - clouds move slower than camera
            const parallaxX = cloud.x + this.cameraX * 0.1;
            const parallaxY = cloud.y + this.cameraY * 0.05;
            
            this.drawCloud(parallaxX, parallaxY, cloud.size, cloudColor, cloudShadow);
        });
    }
    
    drawCloud(x, y, scale, lightColor, shadowColor) {
        const baseSize = 24 * scale;
        
        // Cloud shadow parts (slightly offset)
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(x + 2, y + 2, baseSize * 1.5, baseSize * 0.8);
        this.ctx.fillRect(x + baseSize * 0.3 + 2, y - baseSize * 0.2 + 2, baseSize, baseSize);
        this.ctx.fillRect(x + baseSize * 0.8 + 2, y + baseSize * 0.1 + 2, baseSize * 0.8, baseSize * 0.7);
        this.ctx.fillRect(x - baseSize * 0.2 + 2, y + baseSize * 0.2 + 2, baseSize * 0.9, baseSize * 0.6);
        
        // Main cloud body
        this.ctx.fillStyle = lightColor;
        this.ctx.fillRect(x, y, baseSize * 1.5, baseSize * 0.8);
        this.ctx.fillRect(x + baseSize * 0.3, y - baseSize * 0.2, baseSize, baseSize);
        this.ctx.fillRect(x + baseSize * 0.8, y + baseSize * 0.1, baseSize * 0.8, baseSize * 0.7);
        this.ctx.fillRect(x - baseSize * 0.2, y + baseSize * 0.2, baseSize * 0.9, baseSize * 0.6);
        
        // Cloud highlights
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x + baseSize * 0.1, y - baseSize * 0.1, baseSize * 0.4, baseSize * 0.3);
        this.ctx.fillRect(x + baseSize * 0.6, y + baseSize * 0.05, baseSize * 0.3, baseSize * 0.25);
    }
    draw() {
        // Only draw sky and clouds for main room
        if (this.currentScene === 'mainRoom') {
            // Clear canvas with baby blue sky
            this.ctx.fillStyle = '#87ceeb';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw clouds
            this.drawClouds();
        }

        // Draw room
        this.room.draw(this.ctx, this.cameraX, this.cameraY);
        
        // Draw player
        this.player.draw(this.ctx, this.cameraX, this.cameraY);
        
        // Dialog is now handled by React component
    }
    
    loadScene(sceneName) {
        this.currentScene = sceneName;
        
        switch (sceneName) {
            case 'mainRoom':
                this.room = new Room();
                this.player.gridX = 10;
                this.player.gridY = 7;
                break;
            case 'downstairs':
                this.room = new DownstairsRoom();
                this.player.gridX = 10;
                this.player.gridY = 7;
                break;
            case 'upstairs':
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