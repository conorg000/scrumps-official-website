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
        this.animTime = 0;     // walk-cycle phase
        this.landSquash = 0;   // squash impulse on arrival (0..1)
    }

    update() {
        if (this.isMoving) {
            this.animTime += 0.35;
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;

            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.gridX = this.targetX;
                this.gridY = this.targetY;
                this.isMoving = false;
                this.landSquash = 1; // trigger landing squash
                if (window.Effects) window.Effects.burstDust(this.x, this.y);
            } else {
                this.x += dx * this.moveSpeed * 8;
                this.y += dy * this.moveSpeed * 8;
            }
        } else {
            this.animTime = 0;
        }
        if (this.landSquash > 0) this.landSquash = Math.max(0, this.landSquash - 0.12);
    }

    moveTo(newX, newY) {
        if (this.isMoving) return false;
        
        if (newX < 0 || newX >= 20 || newY < 0 || newY >= 15) {
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

        // Walk bob: gentle vertical hop while moving
        const bob = this.isMoving ? -Math.abs(Math.sin(this.animTime)) * 4 : 0;
        // Squash & stretch: wide+short on landing, slight stretch mid-stride
        const sx = 1 + this.landSquash * 0.25 + (this.isMoving ? Math.sin(this.animTime) * 0.04 : 0);
        const sy = 1 - this.landSquash * 0.22 + (this.isMoving ? Math.abs(Math.sin(this.animTime)) * 0.05 : 0);

        ctx.save();
        const pivotX = drawX + this.width / 2;
        const pivotY = drawY + this.height;
        ctx.translate(pivotX, pivotY + bob);
        ctx.scale(sx, sy);
        ctx.translate(-pivotX, -pivotY);
        this.drawBanana(ctx, drawX, drawY);
        ctx.restore();
    }

    drawBanana(ctx, x, y) {
        const dir = this.direction;
        // Golden crisp palette (light from top-left)
        const OUTLINE = '#5a3409';
        const SHADOW = '#cf9320';
        const BASE = '#f4c63a';
        const LIGHT = '#ffd95c';
        const HI = '#fff3b8';

        const cx = x + 18;      // body centre x
        const cyc = y + 19;     // body centre y
        const rx = 14, ry = 15;

        // Contact shadow
        drawContactShadow(ctx, cx, y + 42, 13, 4, 0.26);

        // --- Build a wavy, bottom-heavy crisp silhouette ---
        const rows = [];
        for (let yy = -ry; yy <= ry; yy++) {
            let hw = Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))) * rx;
            hw += Math.sin(yy * 0.85) * 1.4;          // rippled "crisp" edge
            hw *= 1 + yy / (ry * 3.2);                 // wider toward the bottom
            hw = Math.max(0, hw);
            const w = Math.round(hw * 2);
            if (w <= 1) continue;
            rows.push([cyc + yy, Math.round(cx - hw), w]);
        }

        // Little feet poke out below (bob with the walk animation)
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 10, y + 37, 7, 5);
        ctx.fillRect(x + 19, y + 37, 7, 5);
        ctx.fillStyle = '#caa24a';
        ctx.fillRect(x + 11, y + 38, 5, 2);
        ctx.fillRect(x + 20, y + 38, 5, 2);

        // Stubby arms
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 1, y + 20, 4, 6);
        ctx.fillRect(x + 31, y + 20, 4, 6);
        ctx.fillStyle = BASE;
        ctx.fillRect(x + 1, y + 21, 3, 4);
        ctx.fillRect(x + 32, y + 21, 3, 4);

        // Body: outlined base
        drawBlob(ctx, rows, BASE, OUTLINE);

        // Helper to fill an offset oval (shading), clipped to the body rows
        const shadeOval = (ox, oy, orx, ory, color) => {
            ctx.fillStyle = color;
            for (const [ry_, rx_, w] of rows) {
                const yy = ry_ - (cyc + oy);
                if (Math.abs(yy) > ory) continue;
                let hw = Math.sqrt(Math.max(0, 1 - (yy * yy) / (ory * ory))) * orx;
                const left = Math.max(rx_, Math.round(cx + ox - hw));
                const right = Math.min(rx_ + w, Math.round(cx + ox + hw));
                if (right > left) ctx.fillRect(left, ry_, right - left, 1);
            }
        };

        // Top-left highlight and hot spot
        shadeOval(-3, -3, 10, 10, LIGHT);
        shadeOval(-5, -5, 5, 5, HI);
        // Bottom-right shade
        shadeOval(5, 6, 9, 8, SHADOW);

        // Ridges (sell the "crisp")
        ctx.fillStyle = SHADOW;
        ctx.fillRect(cx - 7, cyc - 6, 1, 16);
        ctx.fillRect(cx - 1, cyc - 9, 1, 20);
        ctx.fillRect(cx + 5, cyc - 6, 1, 15);
        ctx.fillStyle = HI;
        ctx.fillRect(cx - 6, cyc - 6, 1, 14);
        ctx.fillRect(cx, cyc - 8, 1, 17);

        // Salt flecks
        ctx.fillStyle = HI;
        ctx.fillRect(cx - 9, cyc + 1, 1, 1);
        ctx.fillRect(cx + 8, cyc - 2, 1, 1);
        ctx.fillRect(cx + 2, cyc + 7, 1, 1);

        // --- Face ---
        if (dir === 'up') {
            // Back of the crisp: just a cheeky cowlick, no face
            ctx.fillStyle = OUTLINE;
            ctx.fillRect(cx - 1, cyc - 12, 2, 4);
            ctx.fillRect(cx, cyc - 14, 2, 3);
            return;
        }

        let lx = cx - 7, rxe = cx + 2, eyeY = cyc - 3;
        let pupOff = 1; // pupil horizontal offset within eye
        if (dir === 'left') { lx = cx - 8; rxe = cx + 1; pupOff = 0; }
        else if (dir === 'right') { lx = cx - 5; rxe = cx + 4; pupOff = 2; }

        const eye = (ex) => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ex, eyeY, 5, 6);
            ctx.fillRect(ex - 1, eyeY + 1, 7, 4);
            ctx.fillStyle = OUTLINE;            // pupil
            ctx.fillRect(ex + pupOff + 1, eyeY + 1, 2, 4);
            ctx.fillStyle = '#ffffff';          // glint
            ctx.fillRect(ex + pupOff + 1, eyeY + 1, 1, 1);
        };
        eye(lx);
        eye(rxe);

        // Rosy cheeks
        ctx.fillStyle = 'rgba(255,120,90,0.55)';
        ctx.fillRect(lx - 1, eyeY + 6, 3, 2);
        ctx.fillRect(rxe + 3, eyeY + 6, 3, 2);

        // Smile
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(cx - 3, cyc + 6, 6, 1);
        ctx.fillRect(cx - 4, cyc + 5, 1, 1);
        ctx.fillRect(cx + 3, cyc + 5, 1, 1);
    }
}

window.Player = Player;
}