if (typeof Controls === 'undefined') {
class Controls {
    constructor(player) {
        this.player = player;
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveDelay = 150; // Milliseconds between moves
        
        this.setupKeyboardControls();
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
    }
}

window.Controls = Controls;
}