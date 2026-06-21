if (typeof Controls === 'undefined') {
class Controls {
    constructor(player) {
        this.player = player;
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveDelay = 150; // Milliseconds between moves
        this.moveTarget = null; // tap-to-move destination tile

        this.setupKeyboardControls();
    }

    setMoveTarget(x, y) {
        this.moveTarget = { x: Math.round(x), y: Math.round(y) };
    }

    isWalkable(x, y) {
        if (x < 0 || x >= 20 || y < 0 || y >= 15) return false;
        const room = window.room;
        if (room && room.collisionMap && room.collisionMap[y]) {
            return !room.collisionMap[y][x];
        }
        return true;
    }

    // Step one tile toward the tapped destination (4-directional, avoids walls)
    handleAutoPath() {
        if (!this.moveTarget || this.player.isMoving) return;
        const tx = this.moveTarget.x, ty = this.moveTarget.y;
        if (this.player.gridX === tx && this.player.gridY === ty) {
            this.moveTarget = null;
            return;
        }
        const dx = tx - this.player.gridX;
        const dy = ty - this.player.gridY;
        const steps = [];
        if (Math.abs(dx) >= Math.abs(dy)) {
            if (dx !== 0) steps.push([this.player.gridX + Math.sign(dx), this.player.gridY]);
            if (dy !== 0) steps.push([this.player.gridX, this.player.gridY + Math.sign(dy)]);
        } else {
            if (dy !== 0) steps.push([this.player.gridX, this.player.gridY + Math.sign(dy)]);
            if (dx !== 0) steps.push([this.player.gridX + Math.sign(dx), this.player.gridY]);
        }
        for (const [nx, ny] of steps) {
            if (this.isWalkable(nx, ny) && this.player.moveTo(nx, ny)) {
                this.lastMoveTime = Date.now();
                return;
            }
        }
        this.moveTarget = null; // stuck — give up
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // Prevent arrow keys from scrolling the page
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
            
            this.keys[e.code] = true;
            this.handleMovement();
        });

        document.addEventListener('keyup', (e) => {
            // Prevent arrow keys from scrolling the page
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
            
            this.keys[e.code] = false;
        });
    }

    handleMovement() {
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveDelay) {
            return;
        }

        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.movePlayer('up');
        } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.movePlayer('down');
        } else if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.movePlayer('left');
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.movePlayer('right');
        }
    }

    movePlayer(direction) {
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveDelay) {
            return;
        }

        this.moveTarget = null; // manual input cancels tap-to-move

        let newX = this.player.gridX;
        let newY = this.player.gridY;

        switch (direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }

        if (this.player.moveTo(newX, newY)) {
            this.lastMoveTime = currentTime;
        }
    }

    update() {
        this.handleMovement();
        this.handleAutoPath();
    }
}

window.Controls = Controls;
}