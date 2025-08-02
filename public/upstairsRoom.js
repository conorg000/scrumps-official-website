if (typeof UpstairsRoom === 'undefined') {
class UpstairsRoom {
    constructor() {
        this.width = 20;
        this.height = 15;
        this.furniture = [];
        this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));
        
        // No furniture setup for this simple upstairs room
    }

    addFurniture(furniture) {
        this.furniture.push(furniture);
        
        // Mark collision map
        for (let y = furniture.y; y < furniture.y + furniture.height; y++) {
            for (let x = furniture.x; x < furniture.x + furniture.width; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    this.collisionMap[y][x] = true;
                }
            }
        }
    }

    isCollision(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true;
        }
        return this.collisionMap[y][x];
    }

    draw(ctx, offsetX, offsetY) {
        this.drawSunsetBackground(ctx);
        
        this.drawFloor(ctx, offsetX, offsetY);
        this.drawWalls(ctx, offsetX, offsetY);
        this.drawFurniture(ctx, offsetX, offsetY);
    }

    drawSunsetBackground(ctx) {
        const time = Date.now() * 0.001;
        
        // Beautiful sunset gradient
        const sunsetGradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        sunsetGradient.addColorStop(0, '#ff6b35');    // Bright orange at top
        sunsetGradient.addColorStop(0.2, '#f7931e');  // Golden orange
        sunsetGradient.addColorStop(0.4, '#ffdc00');  // Bright yellow
        sunsetGradient.addColorStop(0.6, '#ff8c42');  // Warm orange
        sunsetGradient.addColorStop(0.8, '#c73e1d');  // Deep red-orange
        sunsetGradient.addColorStop(1, '#3e2723');    // Dark brown at bottom
        
        ctx.fillStyle = sunsetGradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Add warm glow overlay that pulses gently
        const glowIntensity = 0.1 + Math.sin(time * 0.5) * 0.05;
        const glowGradient = ctx.createRadialGradient(
            ctx.canvas.width * 0.7, ctx.canvas.height * 0.3, 0,
            ctx.canvas.width * 0.7, ctx.canvas.height * 0.3, ctx.canvas.width * 0.8
        );
        glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity})`);
        glowGradient.addColorStop(0.5, `rgba(255, 140, 0, ${glowIntensity * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw long thin clouds that drift slowly
        this.drawSunsetClouds(ctx, time);
        
        // Add some distant birds flying in V formation
        this.drawFlyingBirds(ctx, time);
        
        // Subtle light rays from the sun position
        this.drawSunRays(ctx, time);
    }
    
    drawSunsetClouds(ctx, time) {
        const cloudColor = '#ff8a65';
        const cloudShadow = '#d84315';
        const cloudHighlight = '#ffcc80';
        
        // Long thin clouds at different heights
        const clouds = [
            { baseX: 100, y: 80, length: 300, height: 20, speed: 0.2 },
            { baseX: 400, y: 120, length: 250, height: 15, speed: 0.3 },
            { baseX: 200, y: 160, length: 400, height: 25, speed: 0.15 },
            { baseX: 600, y: 200, length: 200, height: 18, speed: 0.4 },
            { baseX: 50, y: 240, length: 350, height: 22, speed: 0.25 },
            { baseX: 500, y: 100, length: 180, height: 12, speed: 0.35 },
            { baseX: 300, y: 280, length: 280, height: 20, speed: 0.18 }
        ];
        
        clouds.forEach(cloud => {
            const windDrift = time * cloud.speed * 15;
            const cloudX = (cloud.baseX + windDrift) % (ctx.canvas.width + cloud.length) - cloud.length;
            
            // Main cloud body (long and thin)
            ctx.fillStyle = cloudColor;
            ctx.fillRect(cloudX, cloud.y, cloud.length, cloud.height);
            
            // Cloud shadow/depth
            ctx.fillStyle = cloudShadow;
            ctx.fillRect(cloudX, cloud.y + cloud.height - 4, cloud.length, 4);
            
            // Cloud highlights on top
            ctx.fillStyle = cloudHighlight;
            ctx.fillRect(cloudX, cloud.y, cloud.length, 3);
            
            // Wispy edges
            ctx.fillStyle = cloudColor;
            ctx.fillRect(cloudX - 20, cloud.y + 2, 25, cloud.height - 4);
            ctx.fillRect(cloudX + cloud.length - 5, cloud.y + 2, 25, cloud.height - 4);
            
            // Soft cloud variations
            const segments = Math.floor(cloud.length / 40);
            for (let i = 0; i < segments; i++) {
                const segmentX = cloudX + i * 40;
                const puff = Math.sin(time + i) * 3;
                ctx.fillStyle = cloudHighlight;
                ctx.fillRect(segmentX, cloud.y - puff, 30, cloud.height + puff * 2);
            }
        });
    }
    
    drawFlyingBirds(ctx, time) {
        const birdColor = '#2e2e2e';
        
        // V formation of birds
        const birds = [
            { x: 0, y: 0 },    // Lead bird
            { x: -15, y: 8 },  // Left wing
            { x: -25, y: 15 },
            { x: -35, y: 22 },
            { x: 15, y: 8 },   // Right wing
            { x: 25, y: 15 },
            { x: 35, y: 22 }
        ];
        
        const flockX = (time * 30) % (ctx.canvas.width + 200) - 100;
        const flockY = 150 + Math.sin(time * 0.5) * 20;
        
        birds.forEach((bird, index) => {
            const birdX = flockX + bird.x;
            const birdY = flockY + bird.y + Math.sin(time * 2 + index) * 3;
            const wingFlap = Math.sin(time * 8 + index) * 2;
            
            // Simple bird silhouette (V shape)
            ctx.fillStyle = birdColor;
            ctx.fillRect(birdX - 3 + wingFlap, birdY - 1, 6, 2);
            ctx.fillRect(birdX - 2, birdY - 2 + wingFlap, 4, 2);
            ctx.fillRect(birdX - 1, birdY, 2, 1);
        });
    }
    
    drawSunRays(ctx, time) {
        const sunX = ctx.canvas.width * 0.75;
        const sunY = ctx.canvas.height * 0.25;
        
        // Subtle sun rays
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2 + time * 0.3;
            const rayLength = 200 + Math.sin(time + i) * 50;
            const rayOpacity = 0.1 + Math.sin(time * 2 + i) * 0.05;
            
            const endX = sunX + Math.cos(angle) * rayLength;
            const endY = sunY + Math.sin(angle) * rayLength;
            
            const rayGradient = ctx.createLinearGradient(sunX, sunY, endX, endY);
            rayGradient.addColorStop(0, `rgba(255, 215, 0, ${rayOpacity})`);
            rayGradient.addColorStop(0.7, `rgba(255, 140, 0, ${rayOpacity * 0.5})`);
            rayGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            ctx.strokeStyle = rayGradient;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sunX, sunY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // Soft sun glow
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
        sunGradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        sunGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
        sunGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
        ctx.fill();
    }
    drawFloor(ctx, offsetX, offsetY) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const screenPos = isometricToScreen(x, y);
                const drawX = screenPos.x + offsetX;
                const drawY = screenPos.y + offsetY;

                // Purple floor tile
                this.drawIsometricTile(ctx, drawX, drawY, '#9932cc', '#663399');
            }
        }
    }

    drawWalls(ctx, offsetX, offsetY) {
        // No walls - open purple scene
    }

    drawIsometricTile(ctx, x, y, lightColor, darkColor) {
        // Draw diamond-shaped isometric tile
        const points = [
            { x: x + 24, y: y },      // top
            { x: x + 48, y: y + 12 }, // right
            { x: x + 24, y: y + 24 }, // bottom
            { x: x, y: y + 12 }       // left
        ];

        // Light side (top and left)
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.closePath();
        ctx.fill();

        // Dark side (right edge)
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[2].x, points[2].y + 6);
        ctx.lineTo(points[1].x, points[1].y + 6);
        ctx.closePath();
        ctx.fill();
    }

    drawFurniture(ctx, offsetX, offsetY) {
        // No furniture in this simple purple room
    }
}

window.UpstairsRoom = UpstairsRoom;
}