if (typeof DownstairsRoom === 'undefined') {
class DownstairsRoom {
    constructor() {
        this.width = 20;
        this.height = 15;
        this.furniture = [];
        this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));
        
        this.setupFurniture();
    }

    setupFurniture() {
        // Living room furniture
        this.addFurniture({ x: 1, y: 1, width: 4, height: 2, type: 'couch' });
        this.addFurniture({ x: 8, y: 9, width: 1, height: 1, type: 'chair' });
        this.addFurniture({ x: 5, y: 6, width: 2, height: 1, type: 'coffee_table' });
        
        // Musical instruments corner - moved to front right corner
        this.addFurniture({ x: 16, y: 11, width: 1, height: 1, type: 'guitar' });
        this.addFurniture({ x: 17, y: 12, width: 2, height: 2, type: 'drum_kit' });
        this.addFurniture({ x: 15, y: 13, width: 1, height: 1, type: 'microphone' });
        this.addFurniture({ x: 18, y: 10, width: 1, height: 1, type: 'keyboard' });
        
        // Some decorative items
        this.addFurniture({ x: 6, y: 6, width: 1, height: 1, type: 'beer_bottle' });
        this.addFurniture({ x: 2, y: 12, width: 1, height: 1, type: 'plant' });
        this.addFurniture({ x: 12, y: 3, width: 1, height: 1, type: 'amp' });
        
        // Epic beer pyramid in the corner
        this.addFurniture({ x: 10, y: 8, width: 3, height: 3, type: 'beer_pyramid' });
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
        this.drawTrippyBackground(ctx);
        this.drawFloor(ctx, offsetX, offsetY);
        this.drawWalls(ctx, offsetX, offsetY);
        this.drawFurniture(ctx, offsetX, offsetY);
    }

    drawTrippyBackground(ctx) {
        // Fill canvas with base gradient
        const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
        gradient.addColorStop(0, '#ff00ff');    // Magenta
        gradient.addColorStop(0.2, '#00ffff');  // Cyan
        gradient.addColorStop(0.4, '#ffff00');  // Yellow
        gradient.addColorStop(0.6, '#ff8000');  // Orange
        gradient.addColorStop(0.8, '#8000ff');  // Purple
        gradient.addColorStop(1, '#ff0080');    // Pink
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Add animated psychedelic patterns
        const time = Date.now() * 0.001;
        
        // Swirling circles
        for (let i = 0; i < 20; i++) {
            const angle = time + i * 0.5;
            const x = ctx.canvas.width / 2 + Math.cos(angle) * (100 + i * 20);
            const y = ctx.canvas.height / 2 + Math.sin(angle * 1.3) * (80 + i * 15);
            const radius = 30 + Math.sin(time * 2 + i) * 20;
            
            const circleGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            circleGradient.addColorStop(0, `hsla(${(time * 50 + i * 30) % 360}, 100%, 50%, 0.3)`);
            circleGradient.addColorStop(1, `hsla(${(time * 50 + i * 30 + 180) % 360}, 100%, 50%, 0.1)`);
            
            ctx.fillStyle = circleGradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Wavy lines
        for (let i = 0; i < 10; i++) {
            ctx.strokeStyle = `hsla(${(time * 100 + i * 36) % 360}, 100%, 50%, 0.4)`;
            ctx.lineWidth = 3 + Math.sin(time + i) * 2;
            ctx.beginPath();
            
            for (let x = 0; x < ctx.canvas.width; x += 5) {
                const y = ctx.canvas.height / 2 + 
                         Math.sin((x + time * 100) * 0.01 + i) * (50 + i * 10) +
                         Math.cos((x + time * 80) * 0.008 + i * 0.5) * (30 + i * 5);
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Floating geometric shapes
        for (let i = 0; i < 15; i++) {
            const shapeTime = time + i * 0.3;
            const x = (ctx.canvas.width * 0.2) + (Math.sin(shapeTime * 0.5) * ctx.canvas.width * 0.6);
            const y = (ctx.canvas.height * 0.2) + (Math.cos(shapeTime * 0.7) * ctx.canvas.height * 0.6);
            const size = 20 + Math.sin(shapeTime * 2) * 15;
            const rotation = shapeTime;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            
            ctx.fillStyle = `hsla(${(shapeTime * 80) % 360}, 80%, 60%, 0.6)`;
            
            if (i % 3 === 0) {
                // Triangle
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(-size * 0.866, size * 0.5);
                ctx.lineTo(size * 0.866, size * 0.5);
                ctx.closePath();
                ctx.fill();
            } else if (i % 3 === 1) {
                // Square
                ctx.fillRect(-size/2, -size/2, size, size);
            } else {
                // Circle
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Pulsing overlay
        const pulseAlpha = 0.1 + Math.sin(time * 3) * 0.05;
        const pulseGradient = ctx.createRadialGradient(
            ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
            ctx.canvas.width / 2, ctx.canvas.height / 2, Math.max(ctx.canvas.width, ctx.canvas.height)
        );
        pulseGradient.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha})`);
        pulseGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = pulseGradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    drawFloor(ctx, offsetX, offsetY) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const screenPos = isometricToScreen(x, y);
                const drawX = screenPos.x + offsetX;
                const drawY = screenPos.y + offsetY;

                // Dark grey floor tile
                this.drawIsometricTile(ctx, drawX, drawY, '#696969', '#2f2f2f');
            }
        }
    }

    drawWalls(ctx, offsetX, offsetY) {
        // No walls - open green scene
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
                case 'couch':
                    this.drawCouch(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
                case 'chair':
                    this.drawChair(ctx, drawX, drawY);
                    break;
                case 'coffee_table':
                    this.drawCoffeeTable(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
                case 'guitar':
                    this.drawGuitar(ctx, drawX, drawY);
                    break;
                case 'drum_kit':
                    this.drawDrumKit(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
                case 'microphone':
                    this.drawMicrophone(ctx, drawX, drawY);
                    break;
                case 'keyboard':
                    this.drawKeyboard(ctx, drawX, drawY);
                    break;
                case 'beer_bottle':
                    this.drawBeerBottle(ctx, drawX, drawY);
                    break;
                case 'plant':
                    this.drawPlant(ctx, drawX, drawY);
                    break;
                case 'amp':
                    this.drawAmp(ctx, drawX, drawY);
                    break;
                case 'beer_pyramid':
                    this.drawBeerPyramid(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
            }
        });
    }

    drawCouch(ctx, x, y, width, height) {
        const couchColor = '#8b4513';
        const couchDark = '#654321';
        const cushionColor = '#a0522d';
        const couchMain = '#8b4513';
        const cushionMain = '#a0522d';
        const cushionDark = '#654321';
        const fabricTexture = '#cd853f';
        const couchLight = '#deb887';
        
        // Draw couch base spanning multiple tiles
        for (let cy = 0; cy < height; cy++) {
            for (let cx = 0; cx < width; cx++) {
                const tileX = x + (cx - cy) * 24;
                const tileY = y + (cx + cy) * 12;
                
                // Couch base
                drawPixelRect(ctx, tileX + 6, tileY - 8, 36, 20, couchColor);
                drawPixelRect(ctx, tileX + 36, tileY - 4, 6, 16, couchDark);
                
                // Cushions
                drawPixelRect(ctx, tileX + 8, tileY - 6, 32, 8, cushionColor);
                
                // Armrests on ends
                if (cx === 0) {
                    drawPixelRect(ctx, tileX + 2, tileY - 12, 8, 24, couchColor);
                }
                if (cx === width - 1) {
                    drawPixelRect(ctx, tileX + 38, tileY - 12, 8, 24, couchColor);
                }
            }
        }
        
        // Shadow
        drawPixelRect(ctx, x + 4, y + 16, width * 40, 4, 'rgba(0,0,0,0.3)');
        // Calculate the full couch dimensions in isometric space
        const couchWidth = width * 48;  // 4 tiles wide
        const couchDepth = height * 24; // 2 tiles deep
        
        // Main couch base (seat level)
        drawPixelRect(ctx, x + 12, y - 8, couchWidth - 24, couchDepth + 16, couchMain);
        drawPixelRect(ctx, x + couchWidth - 18, y - 4, 6, couchDepth + 12, couchDark);
        drawPixelRect(ctx, x + 12, y + couchDepth + 4, couchWidth - 24, 4, couchDark);
        
        // Backrest - runs along the back edge
        drawPixelRect(ctx, x + 18, y - 32, couchWidth - 36, 24, couchMain);
        drawPixelRect(ctx, x + couchWidth - 24, y - 28, 6, 20, couchDark);
        drawPixelRect(ctx, x + 18, y - 12, couchWidth - 36, 4, couchDark);
        
        // Left armrest
        drawPixelRect(ctx, x + 6, y - 24, 18, couchDepth + 20, couchMain);
        drawPixelRect(ctx, x + 18, y - 20, 6, couchDepth + 16, couchDark);
        drawPixelRect(ctx, x + 6, y + couchDepth - 8, 18, 4, couchDark);
        
        // Right armrest
        drawPixelRect(ctx, x + couchWidth - 18, y - 24, 18, couchDepth + 20, couchMain);
        drawPixelRect(ctx, x + couchWidth - 6, y - 20, 6, couchDepth + 16, couchDark);
        drawPixelRect(ctx, x + couchWidth - 18, y + couchDepth - 8, 18, 4, couchDark);
        
        // Seat cushions - 3 individual cushions
        const cushionWidth = (couchWidth - 60) / 3;
        for (let i = 0; i < 3; i++) {
            const cushionX = x + 30 + i * (cushionWidth + 4);
            drawPixelRect(ctx, cushionX, y - 6, cushionWidth, couchDepth - 4, cushionMain);
            drawPixelRect(ctx, cushionX + cushionWidth - 4, y - 2, 4, couchDepth - 8, cushionDark);
            
            // Cushion button/tuft in center
            drawPixelRect(ctx, cushionX + cushionWidth/2 - 1, y + couchDepth/2 - 1, 2, 2, cushionDark);
        }
        
        // Back cushions
        for (let i = 0; i < 3; i++) {
            const backCushionX = x + 30 + i * (cushionWidth + 4);
            drawPixelRect(ctx, backCushionX, y - 28, cushionWidth, 16, cushionMain);
            drawPixelRect(ctx, backCushionX + cushionWidth - 4, y - 24, 4, 12, cushionDark);
            
            // Back cushion button/tuft
            drawPixelRect(ctx, backCushionX + cushionWidth/2 - 1, y - 20, 2, 2, cushionDark);
        }
        
        // Couch legs - visible at front corners
        drawPixelRect(ctx, x + 18, y + couchDepth + 8, 6, 8, '#654321');
        drawPixelRect(ctx, x + couchWidth - 30, y + couchDepth + 8, 6, 8, '#654321');
        
        // Fabric texture details
        drawPixelRect(ctx, x + 24, y - 4, couchWidth - 48, 1, fabricTexture);
        drawPixelRect(ctx, x + 24, y - 26, couchWidth - 48, 1, fabricTexture);
        
        // Enhanced shadow
        drawPixelRect(ctx, x + 4, y + couchDepth + 12, couchWidth - 8, 6, 'rgba(0,0,0,0.4)');
    }

    drawChair(ctx, x, y) {
        const chairMain = '#8b4513';
        const chairDark = '#654321';
        const chairLight = '#cd853f';
        const seatPad = '#dc143c';
        
        // Chair legs (front two visible)
        drawPixelRect(ctx, x + 14, y + 8, 4, 12, chairDark);
        drawPixelRect(ctx, x + 30, y + 8, 4, 12, chairDark);
        drawPixelRect(ctx, x + 18, y + 12, 4, 8, chairDark);
        drawPixelRect(ctx, x + 26, y + 12, 4, 8, chairDark);
        
        // Chair seat with padding
        drawPixelRect(ctx, x + 10, y - 2, 28, 18, chairMain);
        drawPixelRect(ctx, x + 32, y + 2, 6, 14, chairDark);
        drawPixelRect(ctx, x + 12, y, 24, 12, seatPad);
        drawPixelRect(ctx, x + 30, y + 4, 6, 8, '#8b0000');
        
        // Chair backrest with slats
        drawPixelRect(ctx, x + 12, y - 28, 24, 26, chairMain);
        drawPixelRect(ctx, x + 30, y - 24, 6, 22, chairDark);
        
        // Backrest slats for detail
        drawPixelRect(ctx, x + 16, y - 24, 2, 18, chairLight);
        drawPixelRect(ctx, x + 20, y - 24, 2, 18, chairLight);
        drawPixelRect(ctx, x + 24, y - 24, 2, 18, chairLight);
        drawPixelRect(ctx, x + 28, y - 24, 2, 18, chairLight);
        
        // Chair frame highlights
        drawPixelRect(ctx, x + 12, y - 26, 20, 2, chairLight);
        drawPixelRect(ctx, x + 12, y - 2, 20, 2, chairLight);
        
        // Enhanced shadow
        drawPixelRect(ctx, x + 8, y + 18, 32, 4, 'rgba(0,0,0,0.4)');
    }


    drawCoffeeTable(ctx, x, y, width, height) {
        const tableTop = '#deb887';
        const tableEdge = '#cd853f';
        const tableDark = '#8b7355';
        const legColor = '#654321';
        
        // Draw enhanced table spanning multiple tiles
        for (let ty = 0; ty < height; ty++) {
            for (let tx = 0; tx < width; tx++) {
                const tileX = x + (tx - ty) * 24;
                const tileY = y + (tx + ty) * 12;
                
                // Table top with wood grain effect
                drawPixelRect(ctx, tileX + 2, tileY - 8, 44, 24, tableTop);
                drawPixelRect(ctx, tileX + 40, tileY - 4, 6, 20, tableDark);
                drawPixelRect(ctx, tileX + 2, tileY + 12, 44, 4, tableDark);
                
                // Table edge/rim
                drawPixelRect(ctx, tileX + 2, tileY - 8, 44, 3, tableEdge);
                drawPixelRect(ctx, tileX + 2, tileY + 13, 44, 3, tableEdge);
                
                // Wood grain lines
                drawPixelRect(ctx, tileX + 6, tileY - 4, 36, 1, '#f5deb3');
                drawPixelRect(ctx, tileX + 8, tileY + 2, 32, 1, '#f5deb3');
                drawPixelRect(ctx, tileX + 10, tileY + 8, 28, 1, '#f5deb3');
                
                // Table legs (only on corners)
                if ((tx === 0 || tx === width - 1) && (ty === 0 || ty === height - 1)) {
                    drawPixelRect(ctx, tileX + 8, tileY + 16, 6, 12, legColor);
                    drawPixelRect(ctx, tileX + 32, tileY + 16, 6, 12, legColor);
                    // Leg shadows
                    drawPixelRect(ctx, tileX + 12, tileY + 20, 2, 8, '#4a2c17');
                    drawPixelRect(ctx, tileX + 36, tileY + 20, 2, 8, '#4a2c17');
                }
            }
        }
        
        // Enhanced shadow
        drawPixelRect(ctx, x, y + 24, width * 48, 6, 'rgba(0,0,0,0.4)');
    }

    drawGuitar(ctx, x, y) {
        const bodyWood = '#deb887';
        const neckWood = '#8b7355';
        const darkWood = '#654321';
        const soundHole = '#2d1810';
        const stringColor = '#c0c0c0';
        const fretColor = '#silver';
        const tuningPeg = '#b8860b';
        
        // Guitar body (acoustic shape)
        drawPixelRect(ctx, x + 12, y - 28, 24, 36, bodyWood);
        drawPixelRect(ctx, x + 14, y - 24, 20, 28, bodyWood);
        drawPixelRect(ctx, x + 16, y - 20, 16, 20, bodyWood);
        
        // Body curves and shaping
        drawPixelRect(ctx, x + 18, y - 16, 12, 12, bodyWood);
        drawPixelRect(ctx, x + 20, y - 12, 8, 8, bodyWood);
        
        // Body edge and binding
        drawPixelRect(ctx, x + 12, y - 28, 24, 2, darkWood);
        drawPixelRect(ctx, x + 12, y + 6, 24, 2, darkWood);
        drawPixelRect(ctx, x + 12, y - 26, 2, 32, darkWood);
        drawPixelRect(ctx, x + 34, y - 26, 2, 32, darkWood);
        
        // Guitar neck with proper proportions
        drawPixelRect(ctx, x + 20, y - 40, 8, 16, neckWood);
        drawPixelRect(ctx, x + 22, y - 36, 4, 12, neckWood);
        
        // Fretboard
        drawPixelRect(ctx, x + 21, y - 38, 6, 14, darkWood);
        
        // Frets
        drawPixelRect(ctx, x + 21, y - 35, 6, 1, fretColor);
        drawPixelRect(ctx, x + 21, y - 32, 6, 1, fretColor);
        drawPixelRect(ctx, x + 21, y - 29, 6, 1, fretColor);
        drawPixelRect(ctx, x + 21, y - 26, 6, 1, fretColor);
        
        // Headstock
        drawPixelRect(ctx, x + 19, y - 44, 10, 8, neckWood);
        drawPixelRect(ctx, x + 27, y - 42, 2, 4, darkWood);
        
        // Tuning pegs
        drawPixelRect(ctx, x + 17, y - 42, 2, 2, tuningPeg);
        drawPixelRect(ctx, x + 17, y - 39, 2, 2, tuningPeg);
        drawPixelRect(ctx, x + 29, y - 42, 2, 2, tuningPeg);
        drawPixelRect(ctx, x + 29, y - 39, 2, 2, tuningPeg);
        
        // Sound hole
        drawPixelRect(ctx, x + 20, y - 14, 8, 8, soundHole);
        drawPixelRect(ctx, x + 22, y - 12, 4, 4, '#000000');
        
        // Sound hole rosette
        drawPixelRect(ctx, x + 19, y - 15, 10, 1, darkWood);
        drawPixelRect(ctx, x + 19, y - 7, 10, 1, darkWood);
        drawPixelRect(ctx, x + 19, y - 14, 1, 8, darkWood);
        drawPixelRect(ctx, x + 28, y - 14, 1, 8, darkWood);
        
        // Guitar strings
        for (let i = 0; i < 6; i++) {
            drawPixelRect(ctx, x + 22 + i, y - 38, 1, 44, stringColor);
        }
        
        // Bridge
        drawPixelRect(ctx, x + 20, y - 2, 8, 3, darkWood);
        
        // Wood grain and highlights
        drawPixelRect(ctx, x + 15, y - 22, 2, 26, '#f5deb3');
        drawPixelRect(ctx, x + 31, y - 18, 2, 18, darkWood);
        drawPixelRect(ctx, x + 18, y - 8, 12, 1, '#f5deb3');
        
        // Enhanced shadow
        drawPixelRect(ctx, x + 10, y + 8, 32, 4, 'rgba(0,0,0,0.4)');
    }

    drawDrumKit(ctx, x, y, width, height) {
        const bassDrumColor = '#dc143c';
        const snareDrumColor = '#f5f5f5';
        const tomColor = '#4169e1';
        const drumDark = '#8b0000';
        const snareRim = '#c0c0c0';
        const metalColor = '#c0c0c0';
        const standColor = '#2f2f2f';
        
        // Draw enhanced drum kit spanning multiple tiles
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = x + (dx - dy) * 24;
                const tileY = y + (dx + dy) * 12;
                
                // Bass drum (center) - larger and more detailed
                if (dx === 0 && dy === 1) {
                    drawPixelRect(ctx, tileX + 4, tileY - 20, 40, 32, bassDrumColor);
                    drawPixelRect(ctx, tileX + 36, tileY - 16, 8, 28, drumDark);
                    drawPixelRect(ctx, tileX + 4, tileY + 8, 40, 4, drumDark);
                    
                    // Bass drum hoops
                    drawPixelRect(ctx, tileX + 4, tileY - 20, 40, 3, metalColor);
                    drawPixelRect(ctx, tileX + 4, tileY + 9, 40, 3, metalColor);
                    
                    // Bass drum logo area
                    drawPixelRect(ctx, tileX + 16, tileY - 8, 16, 8, '#ffffff');
                    drawPixelRect(ctx, tileX + 18, tileY - 6, 12, 4, bassDrumColor);
                }
                
                // Snare drum (front) - white with snares
                if (dx === 1 && dy === 0) {
                    drawPixelRect(ctx, tileX + 10, tileY - 16, 28, 20, snareDrumColor);
                    drawPixelRect(ctx, tileX + 32, tileY - 12, 6, 16, '#d3d3d3');
                    drawPixelRect(ctx, tileX + 10, tileY + 0, 28, 4, '#d3d3d3');
                    
                    // Snare drum rim
                    drawPixelRect(ctx, tileX + 10, tileY - 16, 28, 2, snareRim);
                    drawPixelRect(ctx, tileX + 10, tileY + 2, 28, 2, snareRim);
                    
                    // Snare wires (visible on side)
                    for (let i = 0; i < 8; i++) {
                        drawPixelRect(ctx, tileX + 32, tileY - 10 + i * 2, 4, 1, metalColor);
                    }
                    
                    // Snare stand
                    drawPixelRect(ctx, tileX + 20, tileY + 4, 8, 12, standColor);
                    drawPixelRect(ctx, tileX + 16, tileY + 12, 16, 4, standColor);
                }
                
                // Hi-hat (corner) - two cymbals on stand
                if (dx === 0 && dy === 0) {
                    // Hi-hat stand
                    drawPixelRect(ctx, tileX + 22, tileY - 32, 4, 24, standColor);
                    drawPixelRect(ctx, tileX + 18, tileY - 12, 12, 4, standColor);
                    
                    // Top cymbal
                    drawPixelRect(ctx, tileX + 16, tileY - 36, 16, 4, metalColor);
                    drawPixelRect(ctx, tileX + 18, tileY - 34, 12, 2, '#ffd700');
                    
                    // Bottom cymbal (slightly offset)
                    drawPixelRect(ctx, tileX + 17, tileY - 32, 14, 3, metalColor);
                    drawPixelRect(ctx, tileX + 19, tileY - 30, 10, 2, '#ffd700');
                }
                
                // Floor tom (back corner) - blue tom with legs
                if (dx === 1 && dy === 1) {
                    drawPixelRect(ctx, tileX + 8, tileY - 18, 32, 24, tomColor);
                    drawPixelRect(ctx, tileX + 32, tileY - 14, 8, 20, '#1e3a8a');
                    drawPixelRect(ctx, tileX + 8, tileY + 2, 32, 4, '#1e3a8a');
                    
                    // Tom hoops
                    drawPixelRect(ctx, tileX + 8, tileY - 18, 32, 2, metalColor);
                    drawPixelRect(ctx, tileX + 8, tileY + 4, 32, 2, metalColor);
                    
                    // Floor tom legs
                    drawPixelRect(ctx, tileX + 12, tileY + 6, 4, 12, standColor);
                    drawPixelRect(ctx, tileX + 32, tileY + 6, 4, 12, standColor);
                    drawPixelRect(ctx, tileX + 22, tileY + 6, 4, 12, standColor);
                }
            }
        }
        
        // Crash cymbal (separate from grid)
        const crashX = x + 60;
        const crashY = y - 40;
        drawPixelRect(ctx, crashX, crashY, 20, 4, metalColor);
        drawPixelRect(ctx, crashX + 2, crashY + 2, 16, 2, '#ffd700');
        drawPixelRect(ctx, crashX + 8, crashY + 4, 4, 20, standColor);
        
        // Enhanced shadow
        drawPixelRect(ctx, x + 4, y + 24, width * 40, 6, 'rgba(0,0,0,0.4)');
    }

    drawMicrophone(ctx, x, y) {
        const micHead = '#2f2f2f';
        const micGrill = '#c0c0c0';
        const standColor = '#c0c0c0';
        const baseColor = '#1a1a1a';
        
        // Mic stand base (tripod)
        drawPixelRect(ctx, x + 16, y + 8, 16, 4, baseColor);
        drawPixelRect(ctx, x + 12, y + 6, 8, 2, baseColor);
        drawPixelRect(ctx, x + 28, y + 6, 8, 2, baseColor);
        drawPixelRect(ctx, x + 20, y + 4, 8, 2, baseColor);
        
        // Main stand pole
        drawPixelRect(ctx, x + 22, y - 36, 4, 44, standColor);
        drawPixelRect(ctx, x + 24, y - 32, 2, 40, '#a0a0a0');
        
        // Boom arm
        drawPixelRect(ctx, x + 26, y - 32, 12, 3, standColor);
        drawPixelRect(ctx, x + 26, y - 30, 12, 1, '#a0a0a0');
        
        // Microphone head (larger and more detailed)
        drawPixelRect(ctx, x + 34, y - 40, 12, 16, micHead);
        drawPixelRect(ctx, x + 36, y - 38, 8, 12, micGrill);
        
        // Mic grill pattern
        for (let i = 0; i < 6; i++) {
            drawPixelRect(ctx, x + 37, y - 36 + i * 2, 6, 1, '#808080');
        }
        
        // Mic clip/shock mount
        drawPixelRect(ctx, x + 32, y - 34, 4, 8, standColor);
        drawPixelRect(ctx, x + 46, y - 34, 4, 8, standColor);
        
        // Cable
        drawPixelRect(ctx, x + 38, y - 24, 2, 32, '#000000');
        
        // Enhanced shadow
        drawPixelRect(ctx, x + 10, y + 10, 40, 4, 'rgba(0,0,0,0.4)');
    }

    drawKeyboard(ctx, x, y) {
        const keyboardBody = '#2f2f2f';
        const keyboardTop = '#1a1a1a';
        const whiteKeys = '#ffffff';
        const blackKeys = '#000000';
        const standColor = '#c0c0c0';
        const controlColor = '#ff0000';
        
        // Keyboard stand
        drawPixelRect(ctx, x + 4, y + 8, 8, 12, standColor);
        drawPixelRect(ctx, x + 36, y + 8, 8, 12, standColor);
        drawPixelRect(ctx, x + 4, y + 16, 40, 4, standColor);
        
        // Keyboard body (larger and more detailed)
        drawPixelRect(ctx, x + 2, y - 12, 44, 20, keyboardBody);
        drawPixelRect(ctx, x + 40, y - 8, 6, 16, keyboardTop);
        drawPixelRect(ctx, x + 2, y + 4, 44, 4, keyboardTop);
        
        // Control panel
        drawPixelRect(ctx, x + 4, y - 10, 36, 4, keyboardTop);
        
        // Control knobs and buttons
        drawPixelRect(ctx, x + 6, y - 9, 2, 2, controlColor);
        drawPixelRect(ctx, x + 10, y - 9, 2, 2, '#00ff00');
        drawPixelRect(ctx, x + 14, y - 9, 2, 2, '#0000ff');
        drawPixelRect(ctx, x + 18, y - 9, 2, 2, '#ffff00');
        
        // Display screen
        drawPixelRect(ctx, x + 24, y - 10, 12, 4, '#000080');
        drawPixelRect(ctx, x + 26, y - 9, 8, 2, '#00ffff');
        
        // White keys (more realistic proportions)
        for (let i = 0; i < 10; i++) {
            drawPixelRect(ctx, x + 4 + i * 4, y - 6, 3, 10, whiteKeys);
            drawPixelRect(ctx, x + 4 + i * 4, y + 2, 3, 2, '#f0f0f0');
        }
        
        // Black keys (proper piano layout)
        const blackKeyPositions = [1, 2, 4, 5, 6, 8, 9]; // Skip positions 3 and 7 (E-F and B-C gaps)
        blackKeyPositions.forEach(pos => {
            if (pos < 10) {
                drawPixelRect(ctx, x + 2 + pos * 4, y - 6, 2, 6, blackKeys);
            }
        });
        
        // Brand logo
        drawPixelRect(ctx, x + 38, y - 10, 6, 2, whiteKeys);
        
        // Enhanced shadow
        drawPixelRect(ctx, x, y + 18, 48, 4, 'rgba(0,0,0,0.4)');
    }

    drawBeerBottle(ctx, x, y) {
        const bottleGlass = '#2d5016';
        const bottleHighlight = '#4a7c59';
        const bottleShadow = '#1a3009';
        const labelColor = '#ffffff';
        const labelText = '#000080';
        const capColor = '#ffd700';
        const capShadow = '#b8860b';
    
        // Enhanced shadow
        drawPixelRect(ctx, x + 18, y + 4, 14, 4, 'rgba(0,0,0,0.4)');
    
        // Bottle base (more realistic)
        drawPixelRect(ctx, x + 16, y + 2, 16, 4, bottleGlass);
        drawPixelRect(ctx, x + 18, y, 12, 2, bottleGlass);
    
        // Main bottle body
        drawPixelRect(ctx, x + 18, y - 16, 12, 18, bottleGlass);
        drawPixelRect(ctx, x + 28, y - 12, 2, 14, bottleShadow);
    
        // Bottle shoulders (gradual taper)
        drawPixelRect(ctx, x + 19, y - 18, 10, 2, bottleGlass);
        drawPixelRect(ctx, x + 20, y - 20, 8, 2, bottleGlass);
        drawPixelRect(ctx, x + 21, y - 22, 6, 2, bottleGlass);
    
        // Bottle neck
        drawPixelRect(ctx, x + 21, y - 26, 6, 4, bottleGlass);
        drawPixelRect(ctx, x + 25, y - 24, 2, 2, bottleShadow);
    
        // Bottle cap (more detailed)
        drawPixelRect(ctx, x + 20, y - 30, 8, 4, capColor);
        drawPixelRect(ctx, x + 26, y - 28, 2, 2, capShadow);
        drawPixelRect(ctx, x + 20, y - 30, 8, 1, '#ffff99'); // cap highlight
        
        // Cap ridges
        for (let i = 0; i < 3; i++) {
            drawPixelRect(ctx, x + 20, y - 29 + i, 8, 1, capShadow);
        }
    
        // Beer label (larger and more detailed)
        drawPixelRect(ctx, x + 17, y - 10, 14, 8, labelColor);
        drawPixelRect(ctx, x + 29, y - 8, 2, 6, '#e0e0e0');
        
        // Label text/design
        drawPixelRect(ctx, x + 19, y - 8, 10, 1, labelText);
        drawPixelRect(ctx, x + 21, y - 6, 6, 1, labelText);
        drawPixelRect(ctx, x + 23, y - 4, 2, 1, labelText);
    
        // Glass highlights (to show transparency)
        drawPixelRect(ctx, x + 19, y - 14, 1, 14, bottleHighlight);
        drawPixelRect(ctx, x + 20, y - 8, 8, 1, bottleHighlight);
    
        // Liquid level indicator
        drawPixelRect(ctx, x + 20, y - 12, 8, 8, '#ffb347');
        drawPixelRect(ctx, x + 26, y - 10, 2, 6, '#ff8c00');
    }

    drawPlant(ctx, x, y) {
        const potColor = '#cd853f';
        const potRim = '#deb887';
        const potShadow = '#8b4513';
        const soilColor = '#654321';
        const leafGreen = '#228b22';
        const darkLeaf = '#006400';
        const lightLeaf = '#32cd32';
        const stemColor = '#8b4513';
        
        // Enhanced pot with 3D appearance
        drawPixelRect(ctx, x + 14, y - 6, 20, 16, potColor);
        drawPixelRect(ctx, x + 30, y - 2, 4, 12, potShadow);
        drawPixelRect(ctx, x + 14, y + 6, 20, 4, potShadow);
        
        // Pot rim
        drawPixelRect(ctx, x + 12, y - 8, 24, 4, potRim);
        drawPixelRect(ctx, x + 32, y - 6, 4, 2, potShadow);
        
        // Soil surface
        drawPixelRect(ctx, x + 16, y - 4, 16, 3, soilColor);
        drawPixelRect(ctx, x + 18, y - 2, 12, 1, '#4a2c17');
        
        // Multiple plant stems
        drawPixelRect(ctx, x + 20, y - 20, 2, 16, stemColor);
        drawPixelRect(ctx, x + 24, y - 18, 2, 14, stemColor);
        drawPixelRect(ctx, x + 28, y - 16, 2, 12, stemColor);
        
        // Large leaves with more detail
        drawPixelRect(ctx, x + 14, y - 26, 12, 8, leafGreen);
        drawPixelRect(ctx, x + 22, y - 24, 10, 6, leafGreen);
        drawPixelRect(ctx, x + 26, y - 22, 8, 6, leafGreen);
        drawPixelRect(ctx, x + 30, y - 20, 6, 4, darkLeaf);
        
        // Leaf highlights and veins
        drawPixelRect(ctx, x + 16, y - 24, 6, 2, lightLeaf);
        drawPixelRect(ctx, x + 24, y - 22, 4, 2, lightLeaf);
        drawPixelRect(ctx, x + 28, y - 20, 4, 2, lightLeaf);
        
        // Leaf veins
        drawPixelRect(ctx, x + 18, y - 22, 4, 1, darkLeaf);
        drawPixelRect(ctx, x + 26, y - 20, 3, 1, darkLeaf);
        
        // Additional smaller leaves
        drawPixelRect(ctx, x + 12, y - 18, 6, 4, leafGreen);
        drawPixelRect(ctx, x + 32, y - 18, 4, 3, leafGreen);
        
        // Enhanced shadow
        drawPixelRect(ctx, x + 12, y + 8, 24, 4, 'rgba(0,0,0,0.4)');
    }

    drawAmp(ctx, x, y) {
        const ampBody = '#2f2f2f';
        const ampTop = '#1a1a1a';
        const speakerCone = '#8b4513';
        const grillMetal = '#c0c0c0';
        const controlKnob = '#ff0000';
        const logo = '#ffffff';
        
        // Enhanced amp body with 3D appearance
        drawPixelRect(ctx, x + 8, y - 20, 32, 32, ampBody);
        drawPixelRect(ctx, x + 34, y - 16, 6, 28, ampTop);
        drawPixelRect(ctx, x + 8, y + 8, 32, 4, ampTop);
        
        // Amp corners and edges
        drawPixelRect(ctx, x + 8, y - 20, 32, 2, '#404040');
        drawPixelRect(ctx, x + 8, y - 18, 2, 28, '#404040');
        
        // Speaker area (larger)
        drawPixelRect(ctx, x + 12, y - 16, 24, 20, ampTop);
        
        // Speaker cone
        drawPixelRect(ctx, x + 18, y - 12, 12, 12, speakerCone);
        drawPixelRect(ctx, x + 20, y - 10, 8, 8, '#654321');
        drawPixelRect(ctx, x + 22, y - 8, 4, 4, '#4a2c17');
        
        // Speaker grill (more detailed mesh pattern)
        for (let i = 0; i < 6; i++) {
            drawPixelRect(ctx, x + 14 + i * 3, y - 14, 1, 16, grillMetal);
        }
        for (let i = 0; i < 5; i++) {
            drawPixelRect(ctx, x + 14, y - 12 + i * 3, 18, 1, grillMetal);
        }
        
        // Control panel
        drawPixelRect(ctx, x + 10, y - 18, 28, 4, ampTop);
        
        // Control knobs (more detailed)
        drawPixelRect(ctx, x + 12, y - 17, 3, 3, controlKnob);
        drawPixelRect(ctx, x + 17, y - 17, 3, 3, '#00ff00');
        drawPixelRect(ctx, x + 22, y - 17, 3, 3, '#0000ff');
        drawPixelRect(ctx, x + 27, y - 17, 3, 3, '#ffff00');
        drawPixelRect(ctx, x + 32, y - 17, 3, 3, '#ff00ff');
        
        // Knob indicators
        drawPixelRect(ctx, x + 13, y - 16, 1, 1, '#ffffff');
        drawPixelRect(ctx, x + 18, y - 16, 1, 1, '#ffffff');
        drawPixelRect(ctx, x + 23, y - 16, 1, 1, '#ffffff');
        drawPixelRect(ctx, x + 28, y - 16, 1, 1, '#ffffff');
        drawPixelRect(ctx, x + 33, y - 16, 1, 1, '#ffffff');
        
        // Brand logo
        drawPixelRect(ctx, x + 14, y + 2, 20, 4, logo);
        drawPixelRect(ctx, x + 16, y + 3, 16, 2, ampBody);
        
        // Handle on top
        drawPixelRect(ctx, x + 20, y - 22, 8, 2, grillMetal);
        drawPixelRect(ctx, x + 18, y - 21, 2, 1, grillMetal);
        drawPixelRect(ctx, x + 28, y - 21, 2, 1, grillMetal);
        
        // Enhanced shadow
        drawPixelRect(ctx, x + 6, y + 10, 36, 4, 'rgba(0,0,0,0.4)');
    }

    drawBeerPyramid(ctx, x, y, width, height) {
        // Load and cache the beer pyramid image
        if (!this.beerPyramidImage) {
            this.beerPyramidImage = new Image();
            this.beerPyramidImage.src = '/beer-pyramid.png';
        }
        
        // Only draw if the image has loaded
        if (this.beerPyramidImage.complete && this.beerPyramidImage.naturalHeight !== 0) {
            // Calculate drawing position and size - maintain aspect ratio for new image
            const imageWidth = 90; // Adjusted for taller pyramid image
            const imageHeight = 120; // Maintains roughly 3:4 aspect ratio
            
            // Center the image in the furniture space
            const drawX = x - (imageWidth / 2) + (width * 24);
            const drawY = y - imageHeight + 20;
            
            // Draw the image with pixelated rendering
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.beerPyramidImage, drawX, drawY, imageWidth, imageHeight);
            
            // Add shadow underneath
            drawPixelRect(ctx, drawX + 10, y + 25, imageWidth - 20, 6, 'rgba(0,0,0,0.4)');
        }
    }
}

window.DownstairsRoom = DownstairsRoom;
}