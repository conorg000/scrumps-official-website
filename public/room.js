if (typeof Room === 'undefined') {
class Room {
    constructor() {
        this.width = 20;
        this.height = 15;
        this.furniture = [];
        this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));
        
        this.setupFurniture();
    }

    setupFurniture() {
        // Tree in back-left corner
        this.addFurniture({ x: 0, y: 0, width: 2, height: 2, type: 'tree' });
        
        // Bushes along back wall
        this.addFurniture({ x: 3, y: 0, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 5, y: 0, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 7, y: 0, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 9, y: 0, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 11, y: 0, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 13, y: 0, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 15, y: 0, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 17, y: 0, width: 1, height: 1, type: 'bush' });
        
        // Bushes along left wall
        this.addFurniture({ x: 0, y: 3, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 0, y: 5, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 0, y: 7, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 0, y: 9, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 0, y: 11, width: 1, height: 1, type: 'bush' });
        this.addFurniture({ x: 0, y: 13, width: 1, height: 1, type: 'bush' });
        
        // Boxing ring in right corner
        this.addFurniture({ x: 14, y: 0, width: 6, height: 6, type: 'boxing_ring' });
        
        // Random decorative objects scattered around
        this.addFurniture({ x: 5, y: 3, width: 1, height: 1, type: 'beer_bottle' });
        this.addFurniture({ x: 12, y: 2, width: 1, height: 1, type: 'boxing_gloves' });
        this.addFurniture({ x: 15, y: 9, width: 1, height: 1, type: 'beer_bottle' });
        this.addFurniture({ x: 6, y: 12, width: 1, height: 1, type: 'boxing_gloves' });
        
        // Kiddy pool in open space
        this.addFurniture({ x: 8, y: 8, width: 3, height: 3, type: 'kiddy_pool' });
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

                // Floor tile
                this.drawIsometricTile(ctx, drawX, drawY, COLORS.FLOOR_LIGHT, COLORS.FLOOR_DARK);
            }
        }
    }

    drawWalls(ctx, offsetX, offsetY) {
        // No walls - open outdoor scene
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
                case 'tree':
                    this.drawTree(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
                case 'bush':
                    this.drawBush(ctx, drawX, drawY);
                    break;
                case 'boxing_ring':
                    this.drawBoxingRing(ctx, drawX, drawY, furniture.width, furniture.height, furniture, offsetX, offsetY);
                    break;
                case 'beer_bottle':
                    this.drawBeerBottle(ctx, drawX, drawY);
                    break;
                case 'boxing_gloves':
                    this.drawBoxingGloves(ctx, drawX, drawY);
                    break;
                case 't_shirt':
                    this.drawTShirt(ctx, drawX, drawY);
                    break;
                case 'guitar':
                    this.drawGuitar(ctx, drawX, drawY);
                    break;
                case 'kiddy_pool':
                    this.drawKiddyPool(ctx, drawX, drawY, furniture.width, furniture.height);
                    break;
            }
        });
    }






    drawTree(ctx, x, y, width, height) {
        const treeWidth = width * 48;
        const treeHeight = height * 24;
        
        // Tree trunk
        drawPixelRect(ctx, x + 36, y - 12, 24, 36, '#8b4513');
        drawPixelRect(ctx, x + 54, y + 6, 6, 18, '#654321');
        
        // Tree canopy - large and lush
        const leafColor = '#228b22';
        const darkLeaf = '#006400';
        const lightLeaf = '#32cd32';
        
        // Main canopy shape
        drawPixelRect(ctx, x + 12, y - 60, 72, 48, leafColor);
        drawPixelRect(ctx, x + 6, y - 48, 84, 36, leafColor);
        drawPixelRect(ctx, x + 18, y - 72, 60, 24, leafColor);
        
        // Canopy highlights
        drawPixelRect(ctx, x + 18, y - 66, 24, 18, lightLeaf);
        drawPixelRect(ctx, x + 48, y - 54, 18, 12, lightLeaf);
        drawPixelRect(ctx, x + 24, y - 42, 30, 15, lightLeaf);
        
        // Canopy shadows
        drawPixelRect(ctx, x + 66, y - 48, 18, 36, darkLeaf);
        drawPixelRect(ctx, x + 54, y - 36, 24, 24, darkLeaf);
        drawPixelRect(ctx, x + 12, y - 30, 18, 18, darkLeaf);
        
        // Extra leafy details
        drawPixelRect(ctx, x + 6, y - 54, 12, 12, leafColor);
        drawPixelRect(ctx, x + 78, y - 42, 12, 12, leafColor);
        drawPixelRect(ctx, x + 30, y - 78, 18, 12, leafColor);
        drawPixelRect(ctx, x + 54, y - 75, 15, 9, leafColor);
    }
    
    drawBush(ctx, x, y) {
        // Bush - smaller and rounder than tree
        const leafColor = '#228b22';
        const darkLeaf = '#006400';
        const lightLeaf = '#32cd32';
        
        // Main bush shape
        drawPixelRect(ctx, x + 6, y - 24, 36, 30, leafColor);
        drawPixelRect(ctx, x + 12, y - 30, 24, 18, leafColor);
        drawPixelRect(ctx, x + 3, y - 18, 42, 24, leafColor);
        
        // Bush highlights
        drawPixelRect(ctx, x + 9, y - 27, 12, 9, lightLeaf);
        drawPixelRect(ctx, x + 24, y - 21, 9, 6, lightLeaf);
        
        // Bush shadows
        drawPixelRect(ctx, x + 33, y - 18, 12, 18, darkLeaf);
        drawPixelRect(ctx, x + 27, y - 9, 15, 9, darkLeaf);
        
        // Small stems/twigs
        drawPixelRect(ctx, x + 21, y - 6, 6, 12, '#8b4513');
    }
    
    drawBoxingRing(ctx, x, y, width, height, furnitureData, offsetX, offsetY) {
        // Draw isometric boxing ring that fits the oblique perspective
        const tileWidth = 48;
        const tileHeight = 24;
        
        // Ring floor/mat - isometric diamond shape
        const matColor = '#4169e1'; // Royal blue
        const matDark = '#1e3a8a';
        
        // Draw the ring mat as connected isometric tiles
        for (let ry = 0; ry < height; ry++) {
            for (let rx = 0; rx < width; rx++) {
                const tileX = x + (rx - ry) * (tileWidth / 2);
                const tileY = y + (rx + ry) * (tileHeight / 2);
                this.drawIsometricTile(ctx, tileX, tileY, matColor, matDark);
            }
        }
        
        // Corner posts
        const postColor = '#dc2626'; // Red posts
        const postDark = '#991b1b';
        const postHeight = 60;
        
        // Four corner posts positioned at ring corners
        const corners = [
            { rx: 0, ry: 0 }, // back-left corner
            { rx: width-1, ry: 0 }, // back-right corner
            { rx: 0, ry: height-1 }, // front-left corner
            { rx: width-1, ry: height-1 } // front-right corner
        ];
        
        corners.forEach(corner => {
            // Calculate exact corner position of the ring mat
            const cornerScreenPos = isometricToScreen(furnitureData.x + corner.rx, furnitureData.y + corner.ry);
            const postX = cornerScreenPos.x + offsetX - 6; // Center the post on the corner
            const postY = cornerScreenPos.y + offsetY - postHeight + 12;
            
            // Main post
            drawPixelRect(ctx, postX, postY, 12, postHeight, postColor);
            drawPixelRect(ctx, postX + 6, postY, 6, postHeight, postDark);
        });
        
        // Calculate corner positions once for reuse
        const backLeftPos = isometricToScreen(furnitureData.x + 0, furnitureData.y + 0);
        const backRightPos = isometricToScreen(furnitureData.x + width-1, furnitureData.y + 0);
        const frontLeftPos = isometricToScreen(furnitureData.x + 0, furnitureData.y + height-1);
        const frontRightPos = isometricToScreen(furnitureData.x + width-1, furnitureData.y + height-1);
        
        // Add a single white rope between back-left and back-right posts
        const ropeStartX = backLeftPos.x + offsetX + 6; // Center of left post
        const ropeStartY = backLeftPos.y + offsetY - 30; // Mid-height of post
        const ropeEndX = backRightPos.x + offsetX - 6; // Center of right post
        const ropeEndY = backRightPos.y + offsetY - 30; // Mid-height of post
        
        // Draw white rope
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ropeStartX, ropeStartY);
        ctx.lineTo(ropeEndX, ropeEndY);
        ctx.stroke();
        
        // Add second rope positioned lower
        const lowerRopeStartY = backLeftPos.y + offsetY - 15; // Lower position
        const lowerRopeEndY = backRightPos.y + offsetY - 15; // Lower position
        
        // Draw second white rope
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ropeStartX, lowerRopeStartY);
        ctx.lineTo(ropeEndX, lowerRopeEndY);
        ctx.stroke();
        
        // Add rope between front-left and front-right posts
        const frontRopeStartX = frontLeftPos.x + offsetX + 6; // Center of left post
        const frontRopeStartY = frontLeftPos.y + offsetY - 30; // Mid-height of post
        const frontRopeEndX = frontRightPos.x + offsetX - 6; // Center of right post
        const frontRopeEndY = frontRightPos.y + offsetY - 30; // Mid-height of post
        
        // Draw white rope between front posts
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(frontRopeStartX, frontRopeStartY);
        ctx.lineTo(frontRopeEndX, frontRopeEndY);
        ctx.stroke();
        
        // Add lower rope between front posts
        const lowerFrontRopeStartY = frontLeftPos.y + offsetY - 15; // Lower position
        const lowerFrontRopeEndY = frontRightPos.y + offsetY - 15; // Lower position
        
        // Draw second white rope on front side
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(frontRopeStartX, lowerFrontRopeStartY);
        ctx.lineTo(frontRopeEndX, lowerFrontRopeEndY);
        ctx.stroke();
        
        // Add rope between back-left and front-left posts
        const leftRopeStartX = backLeftPos.x + offsetX + 6; // Center of back-left post
        const leftRopeStartY = backLeftPos.y + offsetY - 30; // Mid-height of post
        const leftRopeEndX = frontLeftPos.x + offsetX + 6; // Center of front-left post
        const leftRopeEndY = frontLeftPos.y + offsetY - 30; // Mid-height of post
        
        // Draw white rope between left posts
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftRopeStartX, leftRopeStartY);
        ctx.lineTo(leftRopeEndX, leftRopeEndY);
        ctx.stroke();
        
        // Add lower rope between back-left and front-left posts
        const lowerLeftRopeStartY = backLeftPos.y + offsetY - 15; // Lower position
        const lowerLeftRopeEndY = frontLeftPos.y + offsetY - 15; // Lower position
        
        // Draw second white rope on left side
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftRopeStartX, lowerLeftRopeStartY);
        ctx.lineTo(leftRopeEndX, lowerLeftRopeEndY);
        ctx.stroke();
        
        // Add rope between back-right and front-right posts
        const rightRopeStartX = backRightPos.x + offsetX - 6; // Center of back-right post
        const rightRopeStartY = backRightPos.y + offsetY - 30; // Mid-height of post
        const rightRopeEndX = frontRightPos.x + offsetX - 6; // Center of front-right post
        const rightRopeEndY = frontRightPos.y + offsetY - 30; // Mid-height of post
        
        // Draw white rope between right posts
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rightRopeStartX, rightRopeStartY);
        ctx.lineTo(rightRopeEndX, rightRopeEndY);
        ctx.stroke();
        
        // Add lower rope between back-right and front-right posts
        const lowerRightRopeStartY = backRightPos.y + offsetY - 15; // Lower position
        const lowerRightRopeEndY = frontRightPos.y + offsetY - 15; // Lower position
        
        // Draw second white rope on right side
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rightRopeStartX, lowerRightRopeStartY);
        ctx.lineTo(rightRopeEndX, lowerRightRopeEndY);
        ctx.stroke();
        
    }
    
    drawBeerBottle(ctx, x, y) {
        const bottleDark = '#5a2e0c';
        const bottleMid = '#8b4513';
        const bottleHighlight = '#a0522d';
        const labelColor = '#f4f4f4';
        const capColor = '#ffd700';
    
        // Shadow
        drawPixelRect(ctx, x + 16, y + 2, 16, 3, COLORS.SHADOW);
    
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
    
    drawBoxingGloves(ctx, x, y) {
        const main = '#dc2626';
        const dark = '#991b1b';
        const mid = '#b91c1c';
        const lace = '#f4f4f4';
        
        // Shadow
        drawPixelRect(ctx, x + 8, y + 4, 24, 3, COLORS.SHADOW);
        
        // Main glove body
        drawPixelRect(ctx, x + 8, y - 10, 12, 10, main);       // Knuckles
        drawPixelRect(ctx, x + 20, y - 8, 6, 8, main);         // Palm
        drawPixelRect(ctx, x + 26, y - 6, 4, 6, dark);         // Wrist
        
        // Thumb bump
        drawPixelRect(ctx, x + 12, y, 6, 4, main);
        
        // Highlight
        drawPixelRect(ctx, x + 10, y - 8, 2, 2, mid);
        
        // Lace/cuff
        drawPixelRect(ctx, x + 27, y - 2, 3, 1, lace);
    }
    
    drawTShirt(ctx, x, y) {
        // T-shirt - casual shirt lying flat
        const shirtColor = '#3b82f6';
        const darkShirt = '#1e40af';
        const neckColor = '#1f2937';
        
        // Main shirt body
        drawPixelRect(ctx, x + 12, y - 16, 24, 20, shirtColor);
        drawPixelRect(ctx, x + 8, y - 12, 32, 12, shirtColor);
        
        // Sleeves
        drawPixelRect(ctx, x + 6, y - 14, 8, 8, shirtColor);
        drawPixelRect(ctx, x + 34, y - 14, 8, 8, shirtColor);
        
        // Neck opening
        drawPixelRect(ctx, x + 20, y - 18, 8, 6, neckColor);
        
        // Shirt shadows/folds
        drawPixelRect(ctx, x + 32, y - 12, 4, 12, darkShirt);
        drawPixelRect(ctx, x + 16, y - 4, 16, 3, darkShirt);
        
        // Shadow
        drawPixelRect(ctx, x + 6, y + 2, 36, 3, COLORS.SHADOW);
    }
    
    drawGuitar(ctx, x, y) {
        // Acoustic guitar - wooden with sound hole
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
        drawPixelRect(ctx, x + 12, y + 6, 28, 3, COLORS.SHADOW);
    }
    
    drawKiddyPool(ctx, x, y, width, height) {
        // Colors for the isometric kiddy pool
        const poolRim = '#ff69b4';      // Pink top surface
        const poolRimSide = '#e05c9e';  // Pink side walls
        const poolBaseColor = '#b2002d'; // Darker red base
        const waterColor = '#00bfff';    // Blue water
        
        // Calculate base coordinates for 3x3 isometric block
        const baseWidth = 3 * 48;  // 3 tiles wide
        const baseHeight = 3 * 24; // 3 tiles deep
        
        // Top surface diamond points (3x3 area)
        const topPoints = [
            { x: x + 72, y: y },           // top point
            { x: x + 144, y: y + 36 },     // right point  
            { x: x + 72, y: y + 72 },      // bottom point
            { x: x, y: y + 36 }            // left point
        ];
        
        // Draw pink top surface
        ctx.fillStyle = poolRim;
        ctx.beginPath();
        ctx.moveTo(topPoints[0].x, topPoints[0].y);
        ctx.lineTo(topPoints[1].x, topPoints[1].y);
        ctx.lineTo(topPoints[2].x, topPoints[2].y);
        ctx.lineTo(topPoints[3].x, topPoints[3].y);
        ctx.closePath();
        ctx.fill();
        
        // Wall heights
        const poolWallHeight = 12;
        const baseWallHeight = 6;
        
        // Draw right side wall (pink)
        ctx.fillStyle = poolRimSide;
        ctx.beginPath();
        ctx.moveTo(topPoints[1].x, topPoints[1].y);           // top-right
        ctx.lineTo(topPoints[2].x, topPoints[2].y);           // bottom-right
        ctx.lineTo(topPoints[2].x, topPoints[2].y + poolWallHeight); // bottom-right + height
        ctx.lineTo(topPoints[1].x, topPoints[1].y + poolWallHeight); // top-right + height
        ctx.closePath();
        ctx.fill();
        
        // Draw left side wall (pink)
        ctx.fillStyle = poolRimSide;
        ctx.beginPath();
        ctx.moveTo(topPoints[2].x, topPoints[2].y);           // bottom
        ctx.lineTo(topPoints[3].x, topPoints[3].y);           // left
        ctx.lineTo(topPoints[3].x, topPoints[3].y + poolWallHeight); // left + height
        ctx.lineTo(topPoints[2].x, topPoints[2].y + poolWallHeight); // bottom + height
        ctx.closePath();
        ctx.fill();
        
        // Draw darker red base walls
        ctx.fillStyle = poolBaseColor;
        
        // Right base wall
        ctx.beginPath();
        ctx.moveTo(topPoints[1].x, topPoints[1].y + poolWallHeight);
        ctx.lineTo(topPoints[2].x, topPoints[2].y + poolWallHeight);
        ctx.lineTo(topPoints[2].x, topPoints[2].y + poolWallHeight + baseWallHeight);
        ctx.lineTo(topPoints[1].x, topPoints[1].y + poolWallHeight + baseWallHeight);
        ctx.closePath();
        ctx.fill();
        
        // Left base wall
        ctx.beginPath();
        ctx.moveTo(topPoints[2].x, topPoints[2].y + poolWallHeight);
        ctx.lineTo(topPoints[3].x, topPoints[3].y + poolWallHeight);
        ctx.lineTo(topPoints[3].x, topPoints[3].y + poolWallHeight + baseWallHeight);
        ctx.lineTo(topPoints[2].x, topPoints[2].y + poolWallHeight + baseWallHeight);
        ctx.closePath();
        ctx.fill();
        
        // Draw blue water surface (centered 2x2 diamond on top)
        const waterSize = 48; // 1 tile equivalent for visual balance
        const centerX = x + 72; // Center of the 3x3 area
        const centerY = y + 36; // Center of the 3x3 area
        
        const waterPoints = [
            { x: centerX, y: centerY - waterSize/4 },         // top
            { x: centerX + waterSize/2, y: centerY },         // right
            { x: centerX, y: centerY + waterSize/4 },         // bottom
            { x: centerX - waterSize/2, y: centerY }          // left
        ];
        
        ctx.fillStyle = waterColor;
        ctx.beginPath();
        ctx.moveTo(waterPoints[0].x, waterPoints[0].y);
        ctx.lineTo(waterPoints[1].x, waterPoints[1].y);
        ctx.lineTo(waterPoints[2].x, waterPoints[2].y);
        ctx.lineTo(waterPoints[3].x, waterPoints[3].y);
        ctx.closePath();
        ctx.fill();
    }
}

window.Room = Room;
}