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
        this.addFurniture({ x: 3, y: 8, width: 4, height: 2, type: 'couch' });
        this.addFurniture({ x: 8, y: 9, width: 1, height: 1, type: 'chair' });
        this.addFurniture({ x: 5, y: 6, width: 2, height: 1, type: 'coffee_table' });
        
        // Musical instruments corner (top-right)
        this.addFurniture({ x: 16, y: 2, width: 1, height: 1, type: 'guitar' });
        this.addFurniture({ x: 17, y: 3, width: 2, height: 2, type: 'drum_kit' });
        this.addFurniture({ x: 15, y: 4, width: 1, height: 1, type: 'microphone' });
        this.addFurniture({ x: 18, y: 1, width: 1, height: 1, type: 'keyboard' });
        
        // Some decorative items
        this.addFurniture({ x: 6, y: 6, width: 1, height: 1, type: 'beer_bottle' });
        this.addFurniture({ x: 2, y: 12, width: 1, height: 1, type: 'plant' });
        this.addFurniture({ x: 12, y: 3, width: 1, height: 1, type: 'amp' });
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
        this.drawFloor(ctx, offsetX, offsetY);
        this.drawWalls(ctx, offsetX, offsetY);
        this.drawFurniture(ctx, offsetX, offsetY);
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
            }
        });
    }

    drawCouch(ctx, x, y, width, height) {
        const couchColor = '#8b4513';
        const couchDark = '#654321';
        const cushionColor = '#a0522d';
        
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
    }

    drawChair(ctx, x, y) {
        const chairColor = '#654321';
        const chairDark = '#4a2c17';
        
        // Chair seat
        drawPixelRect(ctx, x + 12, y - 4, 24, 16, chairColor);
        drawPixelRect(ctx, x + 30, y, 6, 12, chairDark);
        
        // Chair back
        drawPixelRect(ctx, x + 14, y - 20, 20, 16, chairColor);
        drawPixelRect(ctx, x + 28, y - 16, 6, 12, chairDark);
        
        // Chair legs
        drawPixelRect(ctx, x + 14, y + 8, 4, 8, chairColor);
        drawPixelRect(ctx, x + 30, y + 8, 4, 8, chairColor);
        
        // Shadow
        drawPixelRect(ctx, x + 10, y + 14, 28, 3, 'rgba(0,0,0,0.3)');
    }

    drawCoffeeTable(ctx, x, y, width, height) {
        const tableColor = '#8b7355';
        const tableDark = '#5d4c37';
        
        // Draw table spanning multiple tiles
        for (let ty = 0; ty < height; ty++) {
            for (let tx = 0; tx < width; tx++) {
                const tileX = x + (tx - ty) * 24;
                const tileY = y + (tx + ty) * 12;
                
                // Table top
                drawPixelRect(ctx, tileX + 4, tileY - 6, 40, 20, tableColor);
                drawPixelRect(ctx, tileX + 36, tileY - 2, 8, 16, tableDark);
                
                // Table legs (only on corners)
                if ((tx === 0 || tx === width - 1) && (ty === 0 || ty === height - 1)) {
                    drawPixelRect(ctx, tileX + 8, tileY + 10, 4, 8, tableDark);
                    drawPixelRect(ctx, tileX + 32, tileY + 10, 4, 8, tableDark);
                }
            }
        }
        
        // Shadow
        drawPixelRect(ctx, x + 2, y + 16, width * 42, 4, 'rgba(0,0,0,0.3)');
    }

    drawGuitar(ctx, x, y) {
        const woodColor = '#deb887';
        const darkWood = '#8b7355';
        const soundHole = '#2d1810';
        const stringColor = '#c0c0c0';
        
        // Guitar body
        drawPixelRect(ctx, x + 14, y - 24, 20, 32, woodColor);
        drawPixelRect(ctx, x + 16, y - 20, 16, 24, woodColor);
        drawPixelRect(ctx, x + 18, y - 16, 12, 16, woodColor);
        
        // Guitar neck
        drawPixelRect(ctx, x + 22, y - 32, 4, 20, darkWood);
        
        // Sound hole
        drawPixelRect(ctx, x + 20, y - 12, 8, 8, soundHole);
        
        // Guitar strings
        for (let i = 0; i < 6; i++) {
            drawPixelRect(ctx, x + 23 + i, y - 30, 1, 36, stringColor);
        }
        
        // Wood grain/highlights
        drawPixelRect(ctx, x + 15, y - 20, 2, 24, '#f5deb3');
        drawPixelRect(ctx, x + 30, y - 16, 2, 16, darkWood);
        
        // Shadow
        drawPixelRect(ctx, x + 12, y + 6, 28, 3, 'rgba(0,0,0,0.3)');
    }

    drawDrumKit(ctx, x, y, width, height) {
        const drumColor = '#dc143c';
        const drumDark = '#8b0000';
        const metalColor = '#c0c0c0';
        
        // Draw drum kit spanning multiple tiles
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = x + (dx - dy) * 24;
                const tileY = y + (dx + dy) * 12;
                
                // Bass drum (center)
                if (dx === 0 && dy === 1) {
                    drawPixelRect(ctx, tileX + 8, tileY - 16, 32, 24, drumColor);
                    drawPixelRect(ctx, tileX + 32, tileY - 12, 8, 20, drumDark);
                }
                
                // Snare drum (front)
                if (dx === 1 && dy === 0) {
                    drawPixelRect(ctx, tileX + 12, tileY - 12, 24, 16, drumColor);
                    drawPixelRect(ctx, tileX + 30, tileY - 8, 6, 12, drumDark);
                }
                
                // Hi-hat (corner)
                if (dx === 0 && dy === 0) {
                    drawPixelRect(ctx, tileX + 20, tileY - 24, 8, 4, metalColor);
                    drawPixelRect(ctx, tileX + 22, tileY - 20, 4, 16, metalColor);
                }
                
                // Floor tom (back corner)
                if (dx === 1 && dy === 1) {
                    drawPixelRect(ctx, tileX + 10, tileY - 14, 28, 20, drumColor);
                    drawPixelRect(ctx, tileX + 30, tileY - 10, 8, 16, drumDark);
                }
            }
        }
        
        // Shadow
        drawPixelRect(ctx, x + 6, y + 20, width * 36, 4, 'rgba(0,0,0,0.3)');
    }

    drawMicrophone(ctx, x, y) {
        const micColor = '#2f2f2f';
        const standColor = '#c0c0c0';
        
        // Mic stand
        drawPixelRect(ctx, x + 22, y - 32, 4, 40, standColor);
        
        // Mic head
        drawPixelRect(ctx, x + 18, y - 36, 12, 8, micColor);
        drawPixelRect(ctx, x + 20, y - 34, 8, 4, '#4f4f4f');
        
        // Stand base
        drawPixelRect(ctx, x + 16, y + 4, 16, 4, standColor);
        
        // Shadow
        drawPixelRect(ctx, x + 14, y + 6, 20, 3, 'rgba(0,0,0,0.3)');
    }

    drawKeyboard(ctx, x, y) {
        const keyboardColor = '#2f2f2f';
        const whiteKeys = '#ffffff';
        const blackKeys = '#000000';
        
        // Keyboard body
        drawPixelRect(ctx, x + 8, y - 8, 32, 16, keyboardColor);
        drawPixelRect(ctx, x + 32, y - 4, 8, 12, '#1f1f1f');
        
        // White keys
        for (let i = 0; i < 7; i++) {
            drawPixelRect(ctx, x + 10 + i * 4, y - 6, 3, 8, whiteKeys);
        }
        
        // Black keys
        for (let i = 0; i < 5; i++) {
            if (i !== 2) { // Skip the gap between E and F
                drawPixelRect(ctx, x + 12 + i * 4, y - 6, 2, 4, blackKeys);
            }
        }
        
        // Stand legs
        drawPixelRect(ctx, x + 12, y + 4, 4, 8, keyboardColor);
        drawPixelRect(ctx, x + 32, y + 4, 4, 8, keyboardColor);
        
        // Shadow
        drawPixelRect(ctx, x + 6, y + 10, 36, 3, 'rgba(0,0,0,0.3)');
    }

    drawBeerBottle(ctx, x, y) {
        const bottleDark = '#5a2e0c';
        const bottleMid = '#8b4513';
        const bottleHighlight = '#a0522d';
        const labelColor = '#f4f4f4';
        const capColor = '#ffd700';
    
        // Shadow
        drawPixelRect(ctx, x + 16, y + 2, 16, 3, 'rgba(0,0,0,0.3)');
    
        // Base (slightly wider)
        drawPixelRect(ctx, x + 17, y + 6, 14, 2, bottleDark);
    
        // Body
        drawPixelRect(ctx, x + 18, y - 12, 12, 18, bottleMid);
    
        // Shoulders (taper inwards)
        drawPixelRect(ctx, x + 19, y - 14, 10, 2, bottleMid);
        drawPixelRect(ctx, x + 20, y - 16, 8, 2, bottleMid);
    
        // Neck
        drawPixelRect(ctx, x + 21, y - 20, 6, 4, bottleMid);
    
        // Cap (gold)
        drawPixelRect(ctx, x + 21, y - 24, 6, 4, capColor);
        drawPixelRect(ctx, x + 21, y - 24, 6, 1, '#e6c200'); // cap rim
    
        // Label
        drawPixelRect(ctx, x + 19, y - 6, 10, 6, labelColor);
    
        // Highlight stripe
        drawPixelRect(ctx, x + 19, y - 10, 1, 16, bottleHighlight);
    
        // Shadowed side
        drawPixelRect(ctx, x + 28, y - 10, 1, 16, bottleDark);
    }

    drawPlant(ctx, x, y) {
        const potColor = '#8b4513';
        const leafColor = '#228b22';
        const darkLeaf = '#006400';
        
        // Pot
        drawPixelRect(ctx, x + 16, y - 4, 16, 12, potColor);
        drawPixelRect(ctx, x + 28, y, 4, 8, '#654321');
        
        // Plant stems
        drawPixelRect(ctx, x + 22, y - 16, 2, 12, '#8b4513');
        drawPixelRect(ctx, x + 26, y - 14, 2, 10, '#8b4513');
        
        // Leaves
        drawPixelRect(ctx, x + 18, y - 20, 8, 6, leafColor);
        drawPixelRect(ctx, x + 24, y - 18, 6, 4, leafColor);
        drawPixelRect(ctx, x + 28, y - 16, 4, 4, darkLeaf);
        
        // Shadow
        drawPixelRect(ctx, x + 14, y + 6, 20, 3, 'rgba(0,0,0,0.3)');
    }

    drawAmp(ctx, x, y) {
        const ampColor = '#2f2f2f';
        const speakerColor = '#1a1a1a';
        const grillColor = '#4f4f4f';
        
        // Amp body
        drawPixelRect(ctx, x + 12, y - 16, 24, 24, ampColor);
        drawPixelRect(ctx, x + 30, y - 12, 6, 20, '#1f1f1f');
        
        // Speaker
        drawPixelRect(ctx, x + 16, y - 12, 16, 16, speakerColor);
        
        // Speaker grill
        for (let i = 0; i < 4; i++) {
            drawPixelRect(ctx, x + 18 + i * 3, y - 10, 1, 12, grillColor);
        }
        
        // Control knobs
        drawPixelRect(ctx, x + 14, y - 14, 2, 2, grillColor);
        drawPixelRect(ctx, x + 18, y - 14, 2, 2, grillColor);
        drawPixelRect(ctx, x + 22, y - 14, 2, 2, grillColor);
        
        // Shadow
        drawPixelRect(ctx, x + 10, y + 6, 28, 3, 'rgba(0,0,0,0.3)');
    }
}

window.DownstairsRoom = DownstairsRoom;
}