if (typeof Balcony === 'undefined') {
class Balcony {
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
        
        // More realistic puffy clouds at different heights
        const clouds = [
            { baseX: 100, y: 80, scale: 1.2, speed: 0.2 },
            { baseX: 400, y: 120, scale: 0.8, speed: 0.3 },
            { baseX: 200, y: 160, scale: 1.5, speed: 0.15 },
            { baseX: 600, y: 200, scale: 0.9, speed: 0.4 },
            { baseX: 50, y: 240, scale: 1.1, speed: 0.25 },
            { baseX: 500, y: 100, scale: 0.7, speed: 0.35 },
            { baseX: 300, y: 280, scale: 1.3, speed: 0.18 }
        ];
        
        clouds.forEach(cloud => {
            const windDrift = time * cloud.speed * 15;
            const cloudX = (cloud.baseX + windDrift) % (ctx.canvas.width + 200) - 100;
            
            // Draw realistic puffy cloud using the existing drawCloud method style
            this.drawSunsetCloud(ctx, cloudX, cloud.y, cloud.scale, cloudColor, cloudShadow, cloudHighlight, time);
        });
    }
    
    drawSunsetCloud(ctx, x, y, scale, lightColor, shadowColor, highlightColor, time) {
        const baseSize = 30 * scale;
        const puff = Math.sin(time * 0.5) * 2;
        
        // Cloud shadow parts (slightly offset for depth)
        ctx.fillStyle = shadowColor;
        ctx.fillRect(x + 2, y + 2 + puff, baseSize * 2, baseSize * 0.6);
        ctx.fillRect(x + baseSize * 0.4 + 2, y - baseSize * 0.2 + 2 + puff, baseSize * 1.2, baseSize * 0.8);
        ctx.fillRect(x + baseSize * 1.2 + 2, y + baseSize * 0.1 + 2 + puff, baseSize, baseSize * 0.7);
        ctx.fillRect(x - baseSize * 0.1 + 2, y + baseSize * 0.2 + 2 + puff, baseSize * 0.8, baseSize * 0.5);
        ctx.fillRect(x + baseSize * 1.8 + 2, y - baseSize * 0.1 + 2 + puff, baseSize * 0.6, baseSize * 0.6);
        
        // Main cloud body (multiple overlapping puffs)
        ctx.fillStyle = lightColor;
        ctx.fillRect(x, y + puff, baseSize * 2, baseSize * 0.6);
        ctx.fillRect(x + baseSize * 0.4, y - baseSize * 0.2 + puff, baseSize * 1.2, baseSize * 0.8);
        ctx.fillRect(x + baseSize * 1.2, y + baseSize * 0.1 + puff, baseSize, baseSize * 0.7);
        ctx.fillRect(x - baseSize * 0.1, y + baseSize * 0.2 + puff, baseSize * 0.8, baseSize * 0.5);
        ctx.fillRect(x + baseSize * 1.8, y - baseSize * 0.1 + puff, baseSize * 0.6, baseSize * 0.6);
        
        // Additional puffs for more realistic shape
        ctx.fillRect(x + baseSize * 0.8, y - baseSize * 0.3 + puff, baseSize * 0.8, baseSize * 0.6);
        ctx.fillRect(x + baseSize * 1.5, y + baseSize * 0.3 + puff, baseSize * 0.7, baseSize * 0.5);
        ctx.fillRect(x + baseSize * 0.2, y - baseSize * 0.1 + puff, baseSize * 0.6, baseSize * 0.4);
        
        // Cloud highlights (bright spots where sun hits)
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x + baseSize * 0.1, y - baseSize * 0.1 + puff, baseSize * 0.5, baseSize * 0.3);
        ctx.fillRect(x + baseSize * 0.7, y + baseSize * 0.05 + puff, baseSize * 0.4, baseSize * 0.25);
        ctx.fillRect(x + baseSize * 1.3, y - baseSize * 0.15 + puff, baseSize * 0.3, baseSize * 0.2);
        ctx.fillRect(x + baseSize * 1.6, y + baseSize * 0.1 + puff, baseSize * 0.25, baseSize * 0.15);
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

window.Balcony = Balcony;
}