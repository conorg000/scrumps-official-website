if (typeof Player === 'undefined') {
class Player {
    constructor(x, y) {
        this.gridX = x;
        this.gridY = y;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.direction = 'down'; // up, down, left, right
        this.moveSpeed = 0.1;
        this.width = 36;
        this.height = 48;
    }

    update() {
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            
            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.gridX = this.targetX;
                this.gridY = this.targetY;
                this.isMoving = false;
            } else {
                this.x += dx * this.moveSpeed * 8;
                this.y += dy * this.moveSpeed * 8;
            }
        }
    }

    moveTo(newX, newY) {
        if (this.isMoving) return false;
        
        if (newX < 0 || newX >= 20 || newY < 0 || newY >= 15) {
            return false;
        }

        if (room.isCollision(newX, newY)) {
            return false;
        }

        this.targetX = newX;
        this.targetY = newY;
        this.isMoving = true;

        // Set direction based on movement
        if (newX > this.gridX) this.direction = 'right';
        else if (newX < this.gridX) this.direction = 'left';
        else if (newY > this.gridY) this.direction = 'down';
        else if (newY < this.gridY) this.direction = 'up';

        return true;
    }

    draw(ctx, offsetX, offsetY) {
        const screenPos = isometricToScreen(this.x, this.y);
        const drawX = screenPos.x + offsetX - this.width / 2;
        const drawY = screenPos.y + offsetY - this.height + 8;

        this.drawBanana(ctx, drawX, drawY);
    }

    drawBanana(ctx, x, y) {
        // Crisp body (wavy chip shape)
        ctx.fillStyle = '#f4d03f'; // Golden crisp color
        
        // Main crisp shape - wavy oval
        ctx.fillRect(x + 8, y + 8, 20, 28);
        ctx.fillRect(x + 6, y + 12, 24, 20);
        ctx.fillRect(x + 10, y + 6, 16, 32);
        
        // Crisp waves/ridges based on direction
        if (this.direction === 'right') {
            ctx.fillRect(x + 12, y + 4, 12, 4);
            ctx.fillRect(x + 16, y + 36, 8, 4);
            // Extra wavy bits
            ctx.fillRect(x + 4, y + 16, 4, 8);
            ctx.fillRect(x + 28, y + 20, 4, 8);
        } else if (this.direction === 'left') {
            ctx.fillRect(x + 12, y + 4, 12, 4);
            ctx.fillRect(x + 12, y + 36, 8, 4);
            // Extra wavy bits
            ctx.fillRect(x + 4, y + 18, 4, 8);
            ctx.fillRect(x + 28, y + 18, 4, 8);
        } else {
            ctx.fillRect(x + 12, y + 4, 12, 4);
            ctx.fillRect(x + 14, y + 36, 8, 4);
            // Extra wavy bits
            ctx.fillRect(x + 4, y + 18, 4, 6);
            ctx.fillRect(x + 28, y + 20, 4, 6);
        }

        // Crisp highlights and texture
        ctx.fillStyle = '#f7dc6f'; // Lighter crisp color
        ctx.fillRect(x + 8, y + 10, 4, 20);
        ctx.fillRect(x + 24, y + 14, 4, 16);
        ctx.fillRect(x + 14, y + 8, 8, 4);
        
        // Crisp darker edges and texture
        ctx.fillStyle = '#d4ac0d'; // Darker crisp color
        ctx.fillRect(x + 26, y + 12, 3, 20);
        ctx.fillRect(x + 10, y + 32, 16, 3);
        
        // Crisp texture spots/bubbles
        ctx.fillStyle = '#f8c471';
        ctx.fillRect(x + 13, y + 14, 2, 2);
        ctx.fillRect(x + 19, y + 18, 2, 2);
        ctx.fillRect(x + 15, y + 24, 2, 2);
        ctx.fillRect(x + 21, y + 28, 2, 2);
        
        // More texture
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(x + 17, y + 16, 1, 1);
        ctx.fillRect(x + 14, y + 22, 1, 1);
        ctx.fillRect(x + 20, y + 26, 1, 1);
        
        // Simple face based on direction
        ctx.fillStyle = COLORS.BLACK;
        
        // Eyes
        if (this.direction === 'right') {
            ctx.fillRect(x + 20, y + 16, 2, 2);
            ctx.fillRect(x + 23, y + 16, 2, 2);
        } else if (this.direction === 'left') {
            ctx.fillRect(x + 11, y + 16, 2, 2);
            ctx.fillRect(x + 14, y + 16, 2, 2);
        } else {
            ctx.fillRect(x + 15, y + 16, 2, 2);
            ctx.fillRect(x + 19, y + 16, 2, 2);
        }
        
        // Simple smile
        ctx.fillRect(x + 16, y + 20, 4, 2);

        // Shadow
        ctx.fillStyle = COLORS.SHADOW;
        ctx.fillRect(x + 6, y + 39, 24, 4);
    }
}

window.Player = Player;
}