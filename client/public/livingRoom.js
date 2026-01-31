// Living Room - Eccentric art gallery with banana paintings and Tiny Clown

if (typeof LivingRoom === 'undefined') {
class LivingRoom {
  constructor(game) {
    this.game = game;
    this.width = 20;
    this.height = 16;
    this.furniture = [];
    this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));

    this.setupFurniture();
  }

  setupFurniture() {
    this.furniture = [];
    this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));

    // Banana paintings on walls (decorative, no collision)
    this.addFurniture({ x: 3, y: 1, width: 2, height: 1, type: 'banana_painting_1', noCollision: true });
    this.addFurniture({ x: 8, y: 1, width: 2, height: 1, type: 'banana_painting_2', noCollision: true });
    this.addFurniture({ x: 13, y: 1, width: 2, height: 1, type: 'banana_painting_3', noCollision: true });
    this.addFurniture({ x: 17, y: 3, width: 1, height: 2, type: 'banana_painting_4', noCollision: true });

    // Big comfy couch
    this.addFurniture({ x: 5, y: 6, width: 4, height: 2, type: 'living_couch' });

    // Coffee table
    this.addFurniture({ x: 6, y: 9, width: 2, height: 1, type: 'coffee_table' });

    // Hollandia can on coffee table (collectible)
    this.addFurniture({ x: 7, y: 9, width: 1, height: 1, type: 'hollandia_can', noCollision: true });

    // CD on shelf (collectible)
    this.addFurniture({ x: 16, y: 2, width: 1, height: 1, type: 'cd_item', songName: 'She Knows', noCollision: true });

    // Bookshelf with stuff
    this.addFurniture({ x: 15, y: 2, width: 2, height: 3, type: 'bookshelf' });

    // Armchair
    this.addFurniture({ x: 11, y: 7, width: 2, height: 2, type: 'armchair' });

    // Floor lamp
    this.addFurniture({ x: 4, y: 5, width: 1, height: 1, type: 'floor_lamp' });

    // Rug under furniture (decorative)
    this.addFurniture({ x: 5, y: 7, width: 5, height: 4, type: 'rug', noCollision: true });

    // Tiny Clown with beer pyramid!
    this.addFurniture({ x: 14, y: 10, width: 2, height: 2, type: 'tiny_clown' });

    // Side table
    this.addFurniture({ x: 3, y: 10, width: 1, height: 1, type: 'side_table' });

    // Potted plant
    this.addFurniture({ x: 2, y: 4, width: 1, height: 1, type: 'potplant' });
  }

  addFurniture(item) {
    this.furniture.push(item);
    if (!item.noCollision) {
      for (let y = item.y; y < item.y + item.height; y++) {
        for (let x = item.x; x < item.x + item.width; x++) {
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
    // Draw warm interior background
    ctx.fillStyle = '#2D2D2D';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.drawFloor(ctx, offsetX, offsetY);
    this.drawWalls(ctx, offsetX, offsetY);
    this.drawFurnitureAll(ctx, offsetX, offsetY);
  }

  drawFloor(ctx, offsetX, offsetY) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const screenPos = isometricToScreen(x, y);
        const drawX = screenPos.x + offsetX;
        const drawY = screenPos.y + offsetY;

        // Alternating wood tones
        const isAlt = (x + y) % 2 === 0;
        const lightColor = isAlt ? '#8B7355' : '#9C8565';
        const darkColor = isAlt ? '#6B5344' : '#7A6348';
        this.drawIsometricTile(ctx, drawX, drawY, lightColor, darkColor);
      }
    }
  }

  drawIsometricTile(ctx, x, y, lightColor, darkColor) {
    // Draw diamond-shaped isometric tile (same as room.js)
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
    ctx.lineTo(points[2].x, points[2].y + 4);
    ctx.lineTo(points[1].x, points[1].y + 4);
    ctx.closePath();
    ctx.fill();
  }

  drawWalls(ctx, offsetX, offsetY) {
    // Back wall (top edge)
    for (let x = 0; x < this.width; x++) {
      const screenPos = isometricToScreen(x, 0);
      const drawX = screenPos.x + offsetX;
      const drawY = screenPos.y + offsetY;

      ctx.fillStyle = '#E8DCC8';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + 12);
      ctx.lineTo(drawX, drawY - 50);
      ctx.lineTo(drawX + 24, drawY - 50 - 12);
      ctx.lineTo(drawX + 24, drawY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#D4C8B4';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Left wall
    for (let y = 0; y < this.height; y++) {
      const screenPos = isometricToScreen(0, y);
      const drawX = screenPos.x + offsetX;
      const drawY = screenPos.y + offsetY;

      ctx.fillStyle = '#DED2BE';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + 12);
      ctx.lineTo(drawX, drawY - 50 + 12);
      ctx.lineTo(drawX + 24, drawY - 50);
      ctx.lineTo(drawX + 24, drawY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#D4C8B4';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawFurnitureAll(ctx, offsetX, offsetY) {
    // Sort furniture by y position for proper layering
    const sortedFurniture = [...this.furniture].sort((a, b) => {
      if (a.type === 'rug') return -1;
      if (b.type === 'rug') return 1;
      return (a.y + a.height) - (b.y + b.height);
    });

    sortedFurniture.forEach(item => {
      const screenPos = isometricToScreen(item.x, item.y);
      const drawX = screenPos.x + offsetX;
      const drawY = screenPos.y + offsetY;

      switch (item.type) {
        case 'banana_painting_1':
        case 'banana_painting_2':
        case 'banana_painting_3':
        case 'banana_painting_4':
          this.drawBananaPainting(ctx, drawX, drawY, item.type);
          break;
        case 'living_couch':
          this.drawLivingCouch(ctx, drawX, drawY);
          break;
        case 'coffee_table':
          this.drawCoffeeTable(ctx, drawX, drawY);
          break;
        case 'hollandia_can':
          this.drawHollandiaCan(ctx, drawX, drawY);
          break;
        case 'cd_item':
          this.drawCD(ctx, drawX, drawY);
          break;
        case 'bookshelf':
          this.drawBookshelf(ctx, drawX, drawY);
          break;
        case 'armchair':
          this.drawArmchair(ctx, drawX, drawY);
          break;
        case 'floor_lamp':
          this.drawFloorLamp(ctx, drawX, drawY);
          break;
        case 'rug':
          this.drawRug(ctx, drawX, drawY, item);
          break;
        case 'tiny_clown':
          this.drawTinyClown(ctx, drawX, drawY);
          break;
        case 'side_table':
          this.drawSideTable(ctx, drawX, drawY);
          break;
        case 'potplant':
          this.drawPotplant(ctx, drawX, drawY);
          break;
      }
    });
  }

  drawBananaPainting(ctx, x, y, type) {
    // Frame on wall
    const frameY = y - 60;
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(x + 10, frameY, 40, 35);

    // Canvas background
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(x + 13, frameY + 3, 34, 29);

    // Banana! Each painting slightly different
    ctx.fillStyle = '#FFE135';
    ctx.beginPath();

    const centerX = x + 30;
    if (type === 'banana_painting_1') {
      ctx.ellipse(centerX, frameY + 17, 12, 5, 0.3, 0, Math.PI * 2);
    } else if (type === 'banana_painting_2') {
      ctx.ellipse(centerX - 4, frameY + 15, 10, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX + 4, frameY + 19, 10, 4, -0.2, 0, Math.PI * 2);
    } else if (type === 'banana_painting_3') {
      ctx.moveTo(centerX - 12, frameY + 22);
      ctx.quadraticCurveTo(centerX, frameY + 10, centerX + 12, frameY + 22);
      ctx.quadraticCurveTo(centerX, frameY + 26, centerX - 12, frameY + 22);
    } else {
      ctx.ellipse(centerX, frameY + 17, 4, 12, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawLivingCouch(ctx, x, y) {
    // Couch base
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 96, y + 12 - 32);
    ctx.lineTo(x + 96, y - 30);
    ctx.lineTo(x, y - 30 + 32);
    ctx.closePath();
    ctx.fill();

    // Cushions
    ctx.fillStyle = '#CD853F';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8);
    ctx.lineTo(x + 91, y + 8 - 32);
    ctx.lineTo(x + 91, y - 20);
    ctx.lineTo(x + 5, y - 20 + 32);
    ctx.closePath();
    ctx.fill();

    // Back cushions
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 32 - 30);
    ctx.lineTo(x + 91, y - 30);
    ctx.lineTo(x + 91, y - 45);
    ctx.lineTo(x + 5, y + 32 - 45);
    ctx.closePath();
    ctx.fill();
  }

  drawCoffeeTable(ctx, x, y) {
    // Table top
    ctx.fillStyle = '#5C4033';
    ctx.beginPath();
    ctx.moveTo(x + 24, y - 10);
    ctx.lineTo(x + 60, y - 10 - 18);
    ctx.lineTo(x + 24, y - 10 - 36);
    ctx.lineTo(x - 12, y - 10 - 18);
    ctx.closePath();
    ctx.fill();

    // Table legs
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(x - 5, y - 15, 4, 12);
    ctx.fillRect(x + 50, y - 30, 4, 12);
  }

  drawHollandiaCan(ctx, x, y) {
    const canY = y - 25;
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x + 20, canY, 10, 16);
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.ellipse(x + 25, canY, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 21, canY + 4, 8, 6);
    ctx.fillStyle = '#228B22';
    ctx.font = '5px Arial';
    ctx.fillText('H', x + 23, canY + 9);
  }

  drawCD(ctx, x, y) {
    const cdY = y - 30;
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 15, cdY, 18, 16);
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.arc(x + 24, cdY + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(x + 24, cdY + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + 24, cdY + 8, 4, 0, Math.PI * 0.5);
    ctx.stroke();
  }

  drawBookshelf(ctx, x, y) {
    ctx.fillStyle = '#654321';
    ctx.fillRect(x + 10, y - 80, 50, 80);
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x + 12, y - 75, 46, 4);
    ctx.fillRect(x + 12, y - 50, 46, 4);
    ctx.fillRect(x + 12, y - 25, 46, 4);

    const bookColors = ['#8B0000', '#006400', '#00008B', '#4B0082', '#8B4513'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = bookColors[i];
      ctx.fillRect(x + 14 + i * 8, y - 73, 6, 20);
      ctx.fillRect(x + 14 + i * 8, y - 48, 6, 20);
    }
  }

  drawArmchair(ctx, x, y) {
    ctx.fillStyle = '#556B2F';
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 48, y + 12 - 20);
    ctx.lineTo(x + 48, y - 30);
    ctx.lineTo(x, y - 30 + 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6B8E23';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8);
    ctx.lineTo(x + 43, y + 8 - 16);
    ctx.lineTo(x + 43, y - 15);
    ctx.lineTo(x + 5, y - 15 + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#556B2F';
    ctx.fillRect(x + 10, y - 40, 35, 20);
  }

  drawFloorLamp(ctx, x, y) {
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(x + 24, y + 8, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x + 22, y - 55, 4, 60);
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 55);
    ctx.lineTo(x + 40, y - 55);
    ctx.lineTo(x + 35, y - 75);
    ctx.lineTo(x + 13, y - 75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 24, y - 45, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRug(ctx, x, y, item) {
    const rugWidth = item.width * 48;
    const rugHeight = item.height * 24;

    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(x + 24, y);
    ctx.lineTo(x + 24 + rugWidth / 2, y + rugHeight / 2);
    ctx.lineTo(x + 24, y + rugHeight);
    ctx.lineTo(x + 24 - rugWidth / 2, y + rugHeight / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 10);
    ctx.lineTo(x + 24 + rugWidth / 2 - 12, y + rugHeight / 2);
    ctx.lineTo(x + 24, y + rugHeight - 10);
    ctx.lineTo(x + 24 - rugWidth / 2 + 12, y + rugHeight / 2);
    ctx.closePath();
    ctx.stroke();
  }

  drawTinyClown(ctx, x, y) {
    this.drawBeerPyramid(ctx, x, y);

    const clownX = x + 10;
    const clownY = y - 15;

    // Body
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.moveTo(clownX, clownY);
    ctx.lineTo(clownX + 12, clownY);
    ctx.lineTo(clownX + 10, clownY + 16);
    ctx.lineTo(clownX + 2, clownY + 16);
    ctx.closePath();
    ctx.fill();

    // Polka dots
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.arc(clownX + 4, clownY + 5, 2, 0, Math.PI * 2);
    ctx.arc(clownX + 8, clownY + 10, 2, 0, Math.PI * 2);
    ctx.fill();

    // Shoes
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.ellipse(clownX, clownY + 18, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(clownX + 12, clownY + 18, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(clownX + 6, clownY - 5, 7, 0, Math.PI * 2);
    ctx.fill();

    // Red nose
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(clownX + 6, clownY - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(clownX + 3, clownY - 7, 1.5, 0, Math.PI * 2);
    ctx.arc(clownX + 9, clownY - 7, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Rainbow hair
    const hairColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = hairColors[i];
      ctx.beginPath();
      ctx.arc(clownX + i * 3, clownY - 11, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hat
    ctx.fillStyle = '#800080';
    ctx.beginPath();
    ctx.moveTo(clownX + 6, clownY - 18);
    ctx.lineTo(clownX + 12, clownY - 11);
    ctx.lineTo(clownX, clownY - 11);
    ctx.closePath();
    ctx.fill();
  }

  drawBeerPyramid(ctx, x, y) {
    const cansGiven = this.game?.tinyClownCans || 0;
    const baseY = y;

    for (let i = 0; i < Math.min(cansGiven, 3); i++) {
      this.drawPyramidCan(ctx, x + 35 + i * 12, baseY);
    }
    if (cansGiven >= 4) {
      this.drawPyramidCan(ctx, x + 41, baseY - 14);
    }
    if (cansGiven >= 5) {
      this.drawPyramidCan(ctx, x + 53, baseY - 14);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(x + 47, baseY - 32);
      ctx.lineTo(x + 42, baseY - 22);
      ctx.lineTo(x + 52, baseY - 22);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawPyramidCan(ctx, x, y) {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 4, y, 8, 12);
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSideTable(ctx, x, y) {
    ctx.fillStyle = '#5C4033';
    ctx.beginPath();
    ctx.moveTo(x + 24, y - 12);
    ctx.lineTo(x + 42, y - 12 - 9);
    ctx.lineTo(x + 24, y - 12 - 18);
    ctx.lineTo(x + 6, y - 12 - 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(x + 10, y - 10, 3, 16);
    ctx.fillRect(x + 35, y - 18, 3, 16);
  }

  drawPotplant(ctx, x, y) {
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 5);
    ctx.lineTo(x + 34, y + 5);
    ctx.lineTo(x + 30, y - 18);
    ctx.lineTo(x + 18, y - 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3D2817';
    ctx.beginPath();
    ctx.ellipse(x + 24, y - 18, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(x + 18, y - 32, 5, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 30, y - 32, 5, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 24, y - 36, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  getPlayerStartPosition() {
    return { x: 17, y: 3 };
  }

  getFurnitureAt(x, y) {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    for (const item of this.furniture) {
      if (gridX >= item.x && gridX < item.x + item.width &&
          gridY >= item.y && gridY < item.y + item.height) {
        return item;
      }
    }
    return null;
  }

  getNearbyInteractable(playerX, playerY, radius = 2) {
    for (const item of this.furniture) {
      const centerX = item.x + item.width / 2;
      const centerY = item.y + item.height / 2;
      const distance = Math.sqrt(
        Math.pow(playerX - centerX, 2) +
        Math.pow(playerY - centerY, 2)
      );
      if (distance <= radius) {
        if (['tiny_clown', 'hollandia_can', 'cd_item', 'banana_painting_1', 'banana_painting_2', 'banana_painting_3', 'banana_painting_4'].includes(item.type)) {
          return item;
        }
      }
    }
    return null;
  }
}

window.LivingRoom = LivingRoom;
}
