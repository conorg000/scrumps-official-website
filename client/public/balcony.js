if (typeof Balcony === 'undefined') {
class Balcony {
    constructor() {
        this.width = 20;
        this.height = 15;
        this.furniture = [];
        this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));

        this.setupFurniture();
    }

    setupFurniture() {
        // Railings along the edges (right and bottom edges for balcony feel)
        for (let i = 0; i < this.width; i++) {
            this.addFurniture({ x: i, y: 0, width: 1, height: 1, type: 'railing' });
        }
        for (let i = 1; i < this.height; i++) {
            this.addFurniture({ x: 0, y: i, width: 1, height: 1, type: 'railing' });
        }

        // BBQ in the corner
        this.addFurniture({ x: 16, y: 2, width: 2, height: 2, type: 'bbq' });

        // Outdoor couch/sofa
        this.addFurniture({ x: 3, y: 3, width: 3, height: 2, type: 'outdoor_couch' });

        // Outdoor chairs
        this.addFurniture({ x: 8, y: 4, width: 1, height: 1, type: 'outdoor_chair' });
        this.addFurniture({ x: 10, y: 5, width: 1, height: 1, type: 'outdoor_chair' });

        // Potplants scattered around
        this.addFurniture({ x: 2, y: 6, width: 1, height: 1, type: 'potplant' });
        this.addFurniture({ x: 14, y: 3, width: 1, height: 1, type: 'potplant' });
        this.addFurniture({ x: 17, y: 8, width: 1, height: 1, type: 'potplant_large' });
        this.addFurniture({ x: 5, y: 10, width: 1, height: 1, type: 'potplant' });

        // Small table
        this.addFurniture({ x: 7, y: 3, width: 1, height: 1, type: 'outdoor_table' });

        // COMPOST BIN - the important collectible!
        this.addFurniture({ x: 12, y: 8, width: 1, height: 1, type: 'compost' });

        // String lights decoration (no collision)
        this.addFurniture({ x: 4, y: 1, width: 1, height: 1, type: 'string_lights', noCollision: true });
    }

    addFurniture(furniture) {
        this.furniture.push(furniture);

        // Mark collision map (unless noCollision flag is set)
        if (!furniture.noCollision) {
            for (let y = furniture.y; y < furniture.y + furniture.height; y++) {
                for (let x = furniture.x; x < furniture.x + furniture.width; x++) {
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        this.collisionMap[y][x] = true;
                    }
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

                // Wooden deck tiles - alternating shades for plank effect
                const isAlt = (x + y) % 2 === 0;
                const lightColor = isAlt ? '#8B7355' : '#7A6348';
                const darkColor = isAlt ? '#6B5344' : '#5A4638';
                this.drawIsometricTile(ctx, drawX, drawY, lightColor, darkColor);

                // Add wood grain lines
                ctx.fillStyle = isAlt ? '#9B8365' : '#8A7358';
                ctx.fillRect(drawX + 12, drawY + 6, 24, 1);
                ctx.fillRect(drawX + 16, drawY + 12, 16, 1);
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
        this.furniture.forEach(furniture => {
            const screenPos = isometricToScreen(furniture.x, furniture.y);
            const drawX = screenPos.x + offsetX;
            const drawY = screenPos.y + offsetY;

            switch (furniture.type) {
                case 'railing':
                    this.drawRailing(ctx, drawX, drawY);
                    break;
                case 'bbq':
                    this.drawBBQ(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
                case 'outdoor_couch':
                    this.drawOutdoorCouch(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
                case 'outdoor_chair':
                    this.drawOutdoorChair(ctx, drawX, drawY);
                    break;
                case 'potplant':
                    this.drawPotplant(ctx, drawX, drawY);
                    break;
                case 'potplant_large':
                    this.drawPotplantLarge(ctx, drawX, drawY);
                    break;
                case 'outdoor_table':
                    this.drawOutdoorTable(ctx, drawX, drawY);
                    break;
                case 'compost':
                    this.drawCompost(ctx, drawX, drawY);
                    break;
                case 'string_lights':
                    this.drawStringLights(ctx, drawX, drawY);
                    break;
            }
        });
    }

    drawRailing(ctx, x, y) {
        const metalColor = '#4a4a4a';
        const metalLight = '#6a6a6a';
        const metalDark = '#2a2a2a';

        // Vertical posts
        drawPixelRect(ctx, x + 10, y - 24, 4, 28, metalColor);
        drawPixelRect(ctx, x + 34, y - 24, 4, 28, metalColor);

        // Horizontal rail
        drawPixelRect(ctx, x + 8, y - 20, 32, 4, metalLight);
        drawPixelRect(ctx, x + 8, y - 18, 32, 2, metalDark);

        // Bottom rail
        drawPixelRect(ctx, x + 8, y - 4, 32, 3, metalColor);

        // Vertical bars
        drawPixelRect(ctx, x + 18, y - 16, 2, 12, metalColor);
        drawPixelRect(ctx, x + 26, y - 16, 2, 12, metalColor);
    }

    drawBBQ(ctx, x, y, width, height) {
        const bodyColor = '#1a1a1a';
        const grillColor = '#4a4a4a';
        const handleColor = '#8B4513';
        const fireColor = '#ff4500';

        // BBQ body
        drawPixelRect(ctx, x + 8, y - 16, 48, 28, bodyColor);
        drawPixelRect(ctx, x + 52, y - 12, 4, 24, '#0a0a0a');

        // Lid (slightly open)
        drawPixelRect(ctx, x + 6, y - 28, 52, 14, '#2a2a2a');
        drawPixelRect(ctx, x + 6, y - 28, 52, 3, '#3a3a3a');

        // Grill grates
        for (let i = 0; i < 6; i++) {
            drawPixelRect(ctx, x + 12 + i * 7, y - 14, 2, 20, grillColor);
        }

        // Fire/coals glow
        drawPixelRect(ctx, x + 14, y - 6, 36, 6, '#8B0000');
        drawPixelRect(ctx, x + 18, y - 4, 8, 3, fireColor);
        drawPixelRect(ctx, x + 32, y - 4, 6, 3, fireColor);

        // Legs
        drawPixelRect(ctx, x + 12, y + 10, 4, 12, bodyColor);
        drawPixelRect(ctx, x + 48, y + 10, 4, 12, bodyColor);

        // Wheels
        drawPixelRect(ctx, x + 10, y + 18, 8, 8, '#2a2a2a');
        drawPixelRect(ctx, x + 46, y + 18, 8, 8, '#2a2a2a');

        // Handle
        drawPixelRect(ctx, x + 56, y - 22, 8, 4, handleColor);

        // Side shelf
        drawPixelRect(ctx, x - 8, y - 8, 16, 16, '#3a3a3a');
        drawPixelRect(ctx, x - 6, y + 6, 4, 16, bodyColor);

        // Shadow
        drawPixelRect(ctx, x + 4, y + 24, 56, 4, 'rgba(0,0,0,0.3)');
    }

    drawOutdoorCouch(ctx, x, y, width, height) {
        const frameColor = '#5D4E37';
        const frameDark = '#3D2E17';
        const cushionColor = '#E8DCC8';
        const cushionDark = '#D8CCB8';

        // Wooden frame base
        for (let cy = 0; cy < height; cy++) {
            for (let cx = 0; cx < width; cx++) {
                const tileX = x + (cx - cy) * 24;
                const tileY = y + (cx + cy) * 12;

                // Frame
                drawPixelRect(ctx, tileX + 4, tileY - 4, 40, 20, frameColor);
                drawPixelRect(ctx, tileX + 38, tileY, 6, 16, frameDark);
            }
        }

        // Cushions
        const cushionWidth = width * 30;
        drawPixelRect(ctx, x + 8, y - 12, cushionWidth, 24, cushionColor);
        drawPixelRect(ctx, x + cushionWidth + 2, y - 8, 6, 20, cushionDark);

        // Back cushions
        drawPixelRect(ctx, x + 10, y - 32, cushionWidth - 4, 20, cushionColor);
        drawPixelRect(ctx, x + cushionWidth, y - 28, 6, 16, cushionDark);

        // Armrests
        drawPixelRect(ctx, x + 2, y - 20, 10, 28, frameColor);
        drawPixelRect(ctx, x + cushionWidth + 8, y - 20, 10, 28, frameColor);

        // Shadow
        drawPixelRect(ctx, x, y + 16, cushionWidth + 20, 4, 'rgba(0,0,0,0.3)');
    }

    drawOutdoorChair(ctx, x, y) {
        const frameColor = '#5D4E37';
        const frameDark = '#3D2E17';
        const cushionColor = '#87CEEB';
        const cushionDark = '#5F9EA0';

        // Chair legs
        drawPixelRect(ctx, x + 10, y + 4, 4, 12, frameColor);
        drawPixelRect(ctx, x + 32, y + 4, 4, 12, frameColor);
        drawPixelRect(ctx, x + 14, y + 8, 4, 8, frameColor);
        drawPixelRect(ctx, x + 28, y + 8, 4, 8, frameColor);

        // Seat frame
        drawPixelRect(ctx, x + 8, y - 8, 32, 16, frameColor);
        drawPixelRect(ctx, x + 34, y - 4, 6, 12, frameDark);

        // Seat cushion
        drawPixelRect(ctx, x + 10, y - 6, 26, 10, cushionColor);
        drawPixelRect(ctx, x + 30, y - 2, 6, 6, cushionDark);

        // Backrest
        drawPixelRect(ctx, x + 8, y - 28, 32, 20, frameColor);
        drawPixelRect(ctx, x + 34, y - 24, 6, 16, frameDark);

        // Back cushion
        drawPixelRect(ctx, x + 12, y - 24, 22, 14, cushionColor);
        drawPixelRect(ctx, x + 28, y - 20, 6, 10, cushionDark);

        // Shadow
        drawPixelRect(ctx, x + 6, y + 14, 36, 4, 'rgba(0,0,0,0.3)');
    }

    drawPotplant(ctx, x, y) {
        const potColor = '#B87333';
        const potDark = '#8B5A2B';
        const soilColor = '#3D2914';
        const leafColor = '#228B22';
        const leafDark = '#006400';

        // Pot
        drawPixelRect(ctx, x + 14, y - 4, 20, 16, potColor);
        drawPixelRect(ctx, x + 30, y, 4, 12, potDark);
        drawPixelRect(ctx, x + 12, y - 6, 24, 4, potColor);

        // Soil
        drawPixelRect(ctx, x + 16, y - 2, 16, 4, soilColor);

        // Plant leaves
        drawPixelRect(ctx, x + 18, y - 16, 12, 14, leafColor);
        drawPixelRect(ctx, x + 14, y - 12, 8, 8, leafColor);
        drawPixelRect(ctx, x + 26, y - 14, 8, 10, leafColor);
        drawPixelRect(ctx, x + 20, y - 20, 8, 6, leafColor);

        // Leaf highlights
        drawPixelRect(ctx, x + 16, y - 10, 4, 4, leafDark);
        drawPixelRect(ctx, x + 24, y - 14, 4, 4, '#32CD32');

        // Shadow
        drawPixelRect(ctx, x + 12, y + 10, 24, 4, 'rgba(0,0,0,0.3)');
    }

    drawPotplantLarge(ctx, x, y) {
        const potColor = '#CD853F';
        const potDark = '#8B5A2B';
        const soilColor = '#3D2914';
        const leafColor = '#228B22';
        const leafLight = '#32CD32';

        // Large decorative pot
        drawPixelRect(ctx, x + 10, y - 8, 28, 24, potColor);
        drawPixelRect(ctx, x + 34, y - 4, 4, 20, potDark);
        drawPixelRect(ctx, x + 8, y - 10, 32, 4, potColor);
        drawPixelRect(ctx, x + 12, y + 12, 24, 4, potDark);

        // Pot pattern
        drawPixelRect(ctx, x + 14, y, 20, 2, '#DEB887');

        // Soil
        drawPixelRect(ctx, x + 14, y - 6, 20, 4, soilColor);

        // Large palm-like plant
        drawPixelRect(ctx, x + 20, y - 36, 8, 30, '#006400');

        // Fronds
        drawPixelRect(ctx, x + 8, y - 40, 16, 8, leafColor);
        drawPixelRect(ctx, x + 24, y - 44, 16, 8, leafColor);
        drawPixelRect(ctx, x + 12, y - 48, 12, 8, leafColor);
        drawPixelRect(ctx, x + 20, y - 52, 8, 6, leafLight);

        drawPixelRect(ctx, x + 4, y - 32, 12, 6, leafColor);
        drawPixelRect(ctx, x + 32, y - 36, 12, 6, leafColor);

        // Shadow
        drawPixelRect(ctx, x + 6, y + 14, 36, 4, 'rgba(0,0,0,0.3)');
    }

    drawOutdoorTable(ctx, x, y) {
        const tableTop = '#8B7355';
        const tableDark = '#6B5344';
        const legColor = '#5D4E37';

        // Table top
        drawPixelRect(ctx, x + 6, y - 8, 36, 20, tableTop);
        drawPixelRect(ctx, x + 36, y - 4, 6, 16, tableDark);

        // Wood grain
        drawPixelRect(ctx, x + 10, y - 4, 28, 1, '#9B8365');
        drawPixelRect(ctx, x + 12, y + 2, 24, 1, '#9B8365');

        // Legs
        drawPixelRect(ctx, x + 10, y + 10, 4, 10, legColor);
        drawPixelRect(ctx, x + 32, y + 10, 4, 10, legColor);

        // Shadow
        drawPixelRect(ctx, x + 4, y + 18, 40, 4, 'rgba(0,0,0,0.3)');
    }

    drawCompost(ctx, x, y) {
        const binColor = '#2F4F2F';
        const binDark = '#1F3F1F';
        const binLight = '#3F5F3F';
        const compostColor = '#4A3728';
        const labelColor = '#90EE90';

        // Compost bin body
        drawPixelRect(ctx, x + 8, y - 20, 32, 32, binColor);
        drawPixelRect(ctx, x + 34, y - 16, 6, 28, binDark);

        // Bin lid
        drawPixelRect(ctx, x + 6, y - 24, 36, 6, binLight);
        drawPixelRect(ctx, x + 36, y - 22, 6, 4, binColor);

        // Lid handle
        drawPixelRect(ctx, x + 20, y - 28, 8, 4, '#4a4a4a');

        // Bin texture/slats
        drawPixelRect(ctx, x + 10, y - 14, 28, 2, binDark);
        drawPixelRect(ctx, x + 10, y - 4, 28, 2, binDark);
        drawPixelRect(ctx, x + 10, y + 6, 28, 2, binDark);

        // Compost label/recycling symbol
        drawPixelRect(ctx, x + 16, y - 10, 16, 12, labelColor);
        drawPixelRect(ctx, x + 20, y - 8, 8, 8, binColor);
        drawPixelRect(ctx, x + 22, y - 6, 4, 4, labelColor);

        // Some compost visible at top
        drawPixelRect(ctx, x + 12, y - 20, 24, 4, compostColor);
        drawPixelRect(ctx, x + 16, y - 22, 6, 2, '#5A4738');
        drawPixelRect(ctx, x + 26, y - 21, 4, 2, '#3A2718');

        // Shadow
        drawPixelRect(ctx, x + 4, y + 10, 40, 4, 'rgba(0,0,0,0.3)');
    }

    drawStringLights(ctx, x, y) {
        const wireColor = '#2a2a2a';
        const time = Date.now() * 0.003;

        // Wire
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 30);
        ctx.quadraticCurveTo(x + 200, y - 20, x + 400, y - 30);
        ctx.stroke();

        // Lights with gentle twinkle
        const lightColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        for (let i = 0; i < 12; i++) {
            const lx = x + 20 + i * 32;
            const ly = y - 28 + Math.sin(i * 0.5) * 4;
            const brightness = 0.7 + Math.sin(time + i) * 0.3;
            const color = lightColors[i % lightColors.length];

            // Glow
            ctx.fillStyle = color + '40';
            ctx.fillRect(lx - 2, ly - 2, 8, 8);

            // Bulb
            ctx.fillStyle = color;
            ctx.globalAlpha = brightness;
            ctx.fillRect(lx, ly, 4, 4);
            ctx.globalAlpha = 1;
        }
    }
}

window.Balcony = Balcony;
}