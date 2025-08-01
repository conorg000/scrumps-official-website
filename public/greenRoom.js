if (typeof GreenRoom === 'undefined') {
class GreenRoom {
    constructor() {
        this.width = 20;
        this.height = 15;
        this.furniture = [];
        this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));
        
        // No furniture setup for this simple green room
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

                // Green floor tile
                this.drawIsometricTile(ctx, drawX, drawY, '#32cd32', '#228b22');
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
        // No furniture in this simple green room
    }
}

window.GreenRoom = GreenRoom;
}