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
        this.addFurniture({ x: 4, y: 8, width: 3, height: 3, type: 'kiddy_pool' });

        // Mr Tibbles - cute white fluffy cat
        this.addFurniture({ x: 8, y: 5, width: 1, height: 1, type: 'mr_tibbles' });

        // Hollandia beer can near boxing ring (collectible)
        this.addFurniture({ x: 13, y: 4, width: 1, height: 1, type: 'hollandia_can', noCollision: true });

        // CD hidden by tree - House of Peterson (collectible)
        this.addFurniture({ x: 2, y: 2, width: 1, height: 1, type: 'cd_item', songName: 'House of Peterson', noCollision: true });

        // Ladder leaning against fence (collectible for roof access later)
        this.addFurniture({ x: 18, y: 12, width: 1, height: 2, type: 'ladder' });
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
                case 'pool_rim':
                    // Don't draw anything for invisible collision boundaries
                    break;
                case 'mr_tibbles':
                    this.drawMrTibbles(ctx, drawX, drawY);
                    break;
                case 'hollandia_can':
                    this.drawHollandiaCan(ctx, drawX, drawY);
                    break;
                case 'cd_item':
                    this.drawCDItem(ctx, drawX, drawY);
                    break;
                case 'ladder':
                    this.drawLadder(ctx, drawX, drawY);
                    break;
            }
        });
    }

    // Pixel-art disc (integer scanlines) — building block for round foliage
    _disc(ctx, cx, cy, r, color) {
        ctx.fillStyle = color;
        for (let yy = -r; yy <= r; yy++) {
            const hw = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)));
            ctx.fillRect(Math.round(cx - hw), Math.round(cy + yy), hw * 2 + 1, 1);
        }
    }

    drawTree(ctx, x, y, width, height) {
        const OUTLINE = '#16331a';
        const dark = '#2c6b2c';
        const base = '#3f8f38';
        const mid = '#5cb048';
        const hi = '#8ad65f';
        const barkOut = '#311e0d';
        const bark = '#7a4a24';
        const barkLo = '#5c3417';
        const barkHi = '#9c6638';

        const cxc = x + 48;     // canopy/trunk centre
        const baseY = y + 26;   // ground line

        drawContactShadow(ctx, cxc, baseY, 34, 8, 0.22);

        // Trunk with bark shading + root flare
        ctx.fillStyle = barkOut;
        ctx.fillRect(cxc - 11, y - 8, 22, baseY - (y - 8));
        ctx.fillRect(cxc - 16, baseY - 6, 32, 6); // roots
        ctx.fillStyle = bark;
        ctx.fillRect(cxc - 9, y - 7, 18, baseY - (y - 7) - 1);
        ctx.fillStyle = barkHi;
        ctx.fillRect(cxc - 8, y - 6, 4, baseY - (y - 6) - 2);
        ctx.fillStyle = barkLo;
        ctx.fillRect(cxc + 4, y - 4, 5, baseY - (y - 4) - 2);
        ctx.fillStyle = barkOut; // bark lines + knot
        ctx.fillRect(cxc - 2, y + 2, 1, 14);
        ctx.fillRect(cxc - 5, baseY - 12, 4, 3);

        // Canopy clumps: [dx, dy, r]
        const clumps = [
            [0, -30, 30], [-22, -22, 20], [22, -24, 22],
            [-6, -46, 20], [-16, -8, 17], [16, -8, 17],
        ];
        // outline pass
        clumps.forEach(([dx, dy, r]) => this._disc(ctx, cxc + dx, y + dy, r + 1, OUTLINE));
        // base fill
        clumps.forEach(([dx, dy, r]) => this._disc(ctx, cxc + dx, y + dy, r, base));
        // dark underside (lower-right clumps)
        this._disc(ctx, cxc + 16, y - 6, 14, dark);
        this._disc(ctx, cxc + 22, y - 22, 16, dark);
        // lit upper-left
        [[0, -30, 22], [-22, -22, 14], [-6, -46, 14], [-16, -8, 11]].forEach(
            ([dx, dy, r]) => this._disc(ctx, cxc + dx - 4, y + dy - 4, r, mid));
        // highlights
        [[-8, -38, 8], [-24, -26, 6], [-14, -12, 5]].forEach(
            ([dx, dy, r]) => this._disc(ctx, cxc + dx, y + dy, r, hi));
        // little leaf flecks
        ctx.fillStyle = hi;
        ctx.fillRect(cxc + 4, y - 30, 2, 2);
        ctx.fillRect(cxc - 2, y - 20, 2, 2);
    }

    drawBush(ctx, x, y) {
        const OUTLINE = '#16331a';
        const dark = '#2c6b2c';
        const base = '#3f8f38';
        const mid = '#5cb048';
        const hi = '#8ad65f';

        const cxc = x + 24;
        const baseY = y + 4;
        drawContactShadow(ctx, cxc, baseY, 22, 6, 0.2);

        const clumps = [[0, -10, 16], [-13, -6, 12], [13, -6, 12], [-2, -18, 12]];
        clumps.forEach(([dx, dy, r]) => this._disc(ctx, cxc + dx, baseY + dy, r + 1, OUTLINE));
        clumps.forEach(([dx, dy, r]) => this._disc(ctx, cxc + dx, baseY + dy, r, base));
        // shade lower-right, light upper-left
        this._disc(ctx, cxc + 13, baseY - 4, 9, dark);
        [[0, -10, 11], [-13, -6, 8], [-2, -18, 8]].forEach(
            ([dx, dy, r]) => this._disc(ctx, cxc + dx - 3, baseY + dy - 3, r, mid));
        this._disc(ctx, cxc - 5, baseY - 14, 5, hi);
        ctx.fillStyle = hi;
        ctx.fillRect(cxc + 2, baseY - 9, 2, 2);
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
        const OUTLINE = '#5a0d0d';
        const base = '#e03030';
        const dark = '#a81d1d';
        const hi = '#ff6a5a';
        const cuff = '#f4f4f4';
        const cuffSh = '#c8c8c8';

        drawContactShadow(ctx, x + 18, y + 4, 17, 4, 0.26);

        const glove = (gx, gy, scale) => {
            const r = Math.round(8 * scale);
            // mitt
            this._disc(ctx, gx, gy, r + 1, OUTLINE);
            this._disc(ctx, gx, gy, r, base);
            // thumb
            this._disc(ctx, gx - r + 1, gy + 2, Math.round(4 * scale) + 1, OUTLINE);
            this._disc(ctx, gx - r + 1, gy + 2, Math.round(4 * scale), base);
            // shading
            this._disc(ctx, gx - 3, gy - 3, Math.round(4 * scale), hi);
            this._disc(ctx, gx + 3, gy + 3, Math.round(3 * scale), dark);
            // cuff
            ctx.fillStyle = OUTLINE;
            ctx.fillRect(gx - r + 1, gy + r - 1, 2 * r - 1, 7);
            ctx.fillStyle = cuff;
            ctx.fillRect(gx - r + 2, gy + r, 2 * r - 3, 5);
            ctx.fillStyle = cuffSh;
            ctx.fillRect(gx - r + 2, gy + r + 3, 2 * r - 3, 2);
            ctx.fillStyle = OUTLINE; // laces
            ctx.fillRect(gx - 1, gy + r, 1, 5);
            ctx.fillRect(gx - 3, gy + r + 1, 5, 1);
        };
        glove(x + 24, y - 4, 0.85); // back glove
        glove(x + 13, y - 7, 1);    // front glove
    }
    
    drawTShirt(ctx, x, y) {
        // A Scrumps band tee, laid out flat
        const OUTLINE = '#16306b';
        const base = '#3b82f6';
        const dark = '#1e4fb0';
        const hi = '#7eb0ff';
        const collar = '#13213b';

        drawContactShadow(ctx, x + 22, y + 3, 20, 4, 0.22);

        // Body + sleeves outline (draw bigger blocks in outline, fill inside)
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 11, y - 17, 26, 22);   // body
        ctx.fillRect(x + 4, y - 15, 10, 11);     // left sleeve
        ctx.fillRect(x + 34, y - 15, 10, 11);    // right sleeve
        ctx.fillStyle = base;
        ctx.fillRect(x + 12, y - 16, 24, 20);
        ctx.fillRect(x + 5, y - 14, 9, 9);
        ctx.fillRect(x + 35, y - 14, 9, 9);
        // shading
        ctx.fillStyle = hi;
        ctx.fillRect(x + 14, y - 15, 4, 17);
        ctx.fillStyle = dark;
        ctx.fillRect(x + 31, y - 14, 5, 17);
        ctx.fillRect(x + 14, y + 1, 22, 3);      // bottom fold
        // collar
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 19, y - 17, 10, 5);
        ctx.fillStyle = collar;
        ctx.fillRect(x + 20, y - 16, 8, 3);
        // tiny band logo: a golden crisp
        ctx.fillStyle = '#ffd95c';
        this._disc(ctx, x + 24, y - 7, 4, '#ffd95c');
        ctx.fillStyle = '#5a3409';
        ctx.fillRect(x + 22, y - 8, 1, 1);
        ctx.fillRect(x + 25, y - 8, 1, 1);
        ctx.fillRect(x + 23, y - 5, 2, 1);
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
        const waterSize = 120; // Maximum water area
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
        
        // Draw floating balls on top of the water
        const balls = [
            { x: centerX - 20, y: centerY - 8, size: 6, color: '#ff4444' },   // Red ball
            { x: centerX + 15, y: centerY - 12, size: 5, color: '#00cccc' },  // Teal ball
            { x: centerX - 8, y: centerY + 10, size: 7, color: '#4444ff' },   // Blue ball
            { x: centerX + 25, y: centerY + 5, size: 5, color: '#44ff44' },   // Green ball
            { x: centerX - 30, y: centerY + 8, size: 8, color: '#ffff44' }    // Yellow ball
        ];
        
        balls.forEach(ball => {
            // Ball shadow (slightly offset)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(ball.x + 1, ball.y + 1, ball.size, ball.size);
            
            // Main ball
            ctx.fillStyle = ball.color;
            ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
            
            // Highlight for glossy effect
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ball.x + 1, ball.y + 1, Math.max(1, ball.size - 3), Math.max(1, ball.size - 3));
        });
    }

    drawMrTibbles(ctx, x, y) {
        // Mr Tibbles - a cute white fluffy cat
        const white = '#ffffff';
        const lightGray = '#e8e8e8';
        const gray = '#c0c0c0';
        const darkGray = '#808080';
        const pink = '#ffb6c1';
        const black = '#000000';

        // Shadow
        drawPixelRect(ctx, x + 12, y + 8, 24, 4, 'rgba(0,0,0,0.3)');

        // Body - fluffy oval shape
        drawPixelRect(ctx, x + 14, y - 8, 20, 16, white);
        drawPixelRect(ctx, x + 12, y - 6, 24, 12, white);
        drawPixelRect(ctx, x + 16, y - 10, 16, 4, white);

        // Fluffy chest
        drawPixelRect(ctx, x + 18, y - 4, 12, 10, lightGray);

        // Body shading
        drawPixelRect(ctx, x + 30, y - 4, 4, 8, gray);

        // Head - round and fluffy
        drawPixelRect(ctx, x + 10, y - 24, 16, 16, white);
        drawPixelRect(ctx, x + 8, y - 22, 20, 12, white);
        drawPixelRect(ctx, x + 12, y - 26, 12, 4, white);

        // Fluffy cheeks
        drawPixelRect(ctx, x + 6, y - 18, 6, 8, white);
        drawPixelRect(ctx, x + 24, y - 18, 6, 8, white);

        // Ears - triangular
        drawPixelRect(ctx, x + 10, y - 30, 4, 6, white);
        drawPixelRect(ctx, x + 12, y - 32, 2, 4, white);
        drawPixelRect(ctx, x + 22, y - 30, 4, 6, white);
        drawPixelRect(ctx, x + 22, y - 32, 2, 4, white);

        // Inner ears - pink
        drawPixelRect(ctx, x + 12, y - 28, 2, 4, pink);
        drawPixelRect(ctx, x + 22, y - 28, 2, 4, pink);

        // Eyes - big and cute
        drawPixelRect(ctx, x + 12, y - 20, 4, 4, black);
        drawPixelRect(ctx, x + 20, y - 20, 4, 4, black);

        // Eye shine
        drawPixelRect(ctx, x + 13, y - 19, 2, 2, white);
        drawPixelRect(ctx, x + 21, y - 19, 2, 2, white);

        // Nose - pink triangle
        drawPixelRect(ctx, x + 16, y - 14, 4, 2, pink);
        drawPixelRect(ctx, x + 17, y - 13, 2, 2, pink);

        // Mouth
        drawPixelRect(ctx, x + 15, y - 11, 2, 2, darkGray);
        drawPixelRect(ctx, x + 19, y - 11, 2, 2, darkGray);

        // Whiskers
        drawPixelRect(ctx, x + 4, y - 16, 6, 1, darkGray);
        drawPixelRect(ctx, x + 4, y - 14, 6, 1, darkGray);
        drawPixelRect(ctx, x + 26, y - 16, 6, 1, darkGray);
        drawPixelRect(ctx, x + 26, y - 14, 6, 1, darkGray);

        // Front paws
        drawPixelRect(ctx, x + 14, y + 2, 6, 6, white);
        drawPixelRect(ctx, x + 26, y + 2, 6, 6, white);

        // Paw pads
        drawPixelRect(ctx, x + 16, y + 4, 2, 2, pink);
        drawPixelRect(ctx, x + 28, y + 4, 2, 2, pink);

        // Tail - fluffy and curved
        drawPixelRect(ctx, x + 32, y - 6, 6, 4, white);
        drawPixelRect(ctx, x + 36, y - 10, 4, 6, white);
        drawPixelRect(ctx, x + 38, y - 14, 4, 6, white);
        drawPixelRect(ctx, x + 36, y - 16, 4, 4, white);
    }

    drawHollandiaCan(ctx, x, y) {
        // Beer can - green Hollandia style
        const canY = y - 20;

        // Can body
        drawPixelRect(ctx, x + 18, canY, 12, 20, '#228B22');

        // Can top
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.ellipse(x + 24, canY, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Label
        drawPixelRect(ctx, x + 19, canY + 5, 10, 8, '#FFD700');

        // "H" on label
        drawPixelRect(ctx, x + 21, canY + 6, 2, 6, '#228B22');
        drawPixelRect(ctx, x + 25, canY + 6, 2, 6, '#228B22');
        drawPixelRect(ctx, x + 23, canY + 8, 2, 2, '#228B22');
    }

    drawCDItem(ctx, x, y) {
        const cdY = y - 15;

        // CD case
        drawPixelRect(ctx, x + 14, cdY, 20, 18, '#333333');

        // CD visible through case
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(x + 24, cdY + 9, 7, 0, Math.PI * 2);
        ctx.fill();

        // CD hole
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(x + 24, cdY + 9, 2, 0, Math.PI * 2);
        ctx.fill();

        // Rainbow sheen
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + 24, cdY + 9, 5, 0, Math.PI * 0.5);
        ctx.stroke();

        ctx.strokeStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(x + 24, cdY + 9, 4, Math.PI * 0.5, Math.PI);
        ctx.stroke();
    }

    drawLadder(ctx, x, y) {
        // Wooden ladder leaning against fence
        const ladderColor = '#8B4513';
        const ladderLight = '#A0522D';

        // Left rail
        drawPixelRect(ctx, x + 12, y - 60, 6, 70, ladderColor);
        drawPixelRect(ctx, x + 14, y - 58, 2, 66, ladderLight);

        // Right rail
        drawPixelRect(ctx, x + 30, y - 60, 6, 70, ladderColor);
        drawPixelRect(ctx, x + 32, y - 58, 2, 66, ladderLight);

        // Rungs
        for (let i = 0; i < 6; i++) {
            const rungY = y - 50 + i * 10;
            drawPixelRect(ctx, x + 18, rungY, 12, 4, ladderColor);
            drawPixelRect(ctx, x + 19, rungY + 1, 10, 2, ladderLight);
        }
    }
}

window.Room = Room;
}