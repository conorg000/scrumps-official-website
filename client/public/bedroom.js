// Bedroom - Messy room with x-ray and collectibles

if (typeof Bedroom === 'undefined') {
class Bedroom {
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

    // Bed - unmade, messy
    this.addFurniture({ x: 2, y: 2, width: 4, height: 3, type: 'bed' });

    // Dresser with mirror
    this.addFurniture({ x: 14, y: 2, width: 3, height: 2, type: 'dresser' });

    // Desk with computer
    this.addFurniture({ x: 8, y: 3, width: 3, height: 2, type: 'desk' });

    // Wardrobe
    this.addFurniture({ x: 17, y: 5, width: 2, height: 3, type: 'wardrobe' });

    // Nightstand
    this.addFurniture({ x: 6, y: 3, width: 1, height: 1, type: 'nightstand' });

    // Clothes on floor (decorative, no collision)
    this.addFurniture({ x: 10, y: 8, width: 1, height: 1, type: 'clothes_pile', noCollision: true });
    this.addFurniture({ x: 4, y: 10, width: 1, height: 1, type: 'clothes_pile', noCollision: true });
    this.addFurniture({ x: 12, y: 12, width: 1, height: 1, type: 'clothes_pile', noCollision: true });

    // Posters on wall (decorative)
    this.addFurniture({ x: 5, y: 1, width: 2, height: 1, type: 'poster', noCollision: true });
    this.addFurniture({ x: 11, y: 1, width: 2, height: 1, type: 'poster', noCollision: true });

    // Rug
    this.addFurniture({ x: 7, y: 8, width: 4, height: 3, type: 'rug', noCollision: true });

    // X-RAY - the important item!
    this.addFurniture({ x: 15, y: 4, width: 1, height: 1, type: 'xray', noCollision: true });

    // Hollandia can on dresser (collectible)
    this.addFurniture({ x: 14, y: 3, width: 1, height: 1, type: 'hollandia_can', noCollision: true });

    // CD on desk - Middle of the Night (collectible)
    this.addFurniture({ x: 9, y: 4, width: 1, height: 1, type: 'cd_item', songName: 'Middle of the Night', noCollision: true });

    // Laundry basket
    this.addFurniture({ x: 2, y: 10, width: 1, height: 1, type: 'laundry_basket' });

    // Small bookshelf
    this.addFurniture({ x: 16, y: 10, width: 2, height: 2, type: 'small_bookshelf' });
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
    // Clear with dim bedroom color
    ctx.fillStyle = '#2A2A35';
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

        const isAlt = (x + y) % 2 === 0;
        const lightColor = isAlt ? '#4A4A5A' : '#454555';
        const darkColor = isAlt ? '#3A3A4A' : '#353545';
        this.drawIsometricTile(ctx, drawX, drawY, lightColor, darkColor);
      }
    }
  }

  drawIsometricTile(ctx, x, y, lightColor, darkColor) {
    const points = [
      { x: x + 24, y: y },
      { x: x + 48, y: y + 12 },
      { x: x + 24, y: y + 24 },
      { x: x, y: y + 12 }
    ];

    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    ctx.fill();

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
    // Back wall
    for (let x = 0; x < this.width; x++) {
      const screenPos = isometricToScreen(x, 0);
      const drawX = screenPos.x + offsetX;
      const drawY = screenPos.y + offsetY;

      ctx.fillStyle = '#6A6A7A';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + 12);
      ctx.lineTo(drawX, drawY - 55);
      ctx.lineTo(drawX + 24, drawY - 55 - 12);
      ctx.lineTo(drawX + 24, drawY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5A5A6A';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Left wall
    for (let y = 0; y < this.height; y++) {
      const screenPos = isometricToScreen(0, y);
      const drawX = screenPos.x + offsetX;
      const drawY = screenPos.y + offsetY;

      ctx.fillStyle = '#5A5A6A';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + 12);
      ctx.lineTo(drawX, drawY - 55 + 12);
      ctx.lineTo(drawX + 24, drawY - 55);
      ctx.lineTo(drawX + 24, drawY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4A4A5A';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawFurnitureAll(ctx, offsetX, offsetY) {
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
        case 'bed': this.drawBed(ctx, drawX, drawY); break;
        case 'dresser': this.drawDresser(ctx, drawX, drawY); break;
        case 'desk': this.drawDesk(ctx, drawX, drawY); break;
        case 'wardrobe': this.drawWardrobe(ctx, drawX, drawY); break;
        case 'nightstand': this.drawNightstand(ctx, drawX, drawY); break;
        case 'clothes_pile': this.drawClothesPile(ctx, drawX, drawY); break;
        case 'poster': this.drawPoster(ctx, drawX, drawY); break;
        case 'rug': this.drawRug(ctx, drawX, drawY, item); break;
        case 'xray': this.drawXray(ctx, drawX, drawY); break;
        case 'hollandia_can': this.drawHollandiaCan(ctx, drawX, drawY); break;
        case 'cd_item': this.drawCDItem(ctx, drawX, drawY); break;
        case 'laundry_basket': this.drawLaundryBasket(ctx, drawX, drawY); break;
        case 'small_bookshelf': this.drawSmallBookshelf(ctx, drawX, drawY); break;
      }
    });
  }

  drawBed(ctx, x, y) {
    // Bed frame
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 96, y + 12 - 36);
    ctx.lineTo(x + 96, y - 30);
    ctx.lineTo(x, y - 30 + 36);
    ctx.closePath();
    ctx.fill();

    // Mattress
    ctx.fillStyle = '#E8E8E8';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8);
    ctx.lineTo(x + 91, y + 8 - 34);
    ctx.lineTo(x + 91, y - 25);
    ctx.lineTo(x + 5, y - 25 + 34);
    ctx.closePath();
    ctx.fill();

    // Messy blanket
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 5);
    ctx.lineTo(x + 60, y + 5 - 20);
    ctx.lineTo(x + 70, y - 25);
    ctx.lineTo(x + 20, y - 25 + 20);
    ctx.closePath();
    ctx.fill();

    // Pillow
    ctx.fillStyle = '#F5F5F5';
    ctx.beginPath();
    ctx.moveTo(x + 70, y - 20);
    ctx.lineTo(x + 88, y - 28);
    ctx.lineTo(x + 85, y - 38);
    ctx.lineTo(x + 67, y - 30);
    ctx.closePath();
    ctx.fill();

    // Headboard
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(x + 75, y - 55, 25, 25);
  }

  drawDresser(ctx, x, y) {
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 72, y + 12 - 24);
    ctx.lineTo(x + 72, y - 45);
    ctx.lineTo(x, y - 45 + 24);
    ctx.closePath();
    ctx.fill();

    // Drawers
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 5 - i * 12);
      ctx.lineTo(x + 67, y + 5 - 22 - i * 12);
      ctx.stroke();
    }

    // Mirror
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(x + 15, y - 85, 42, 38);
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 18, y - 82, 36, 32);
  }

  drawDesk(ctx, x, y) {
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x + 72, y - 15 - 24);
    ctx.lineTo(x + 72, y - 25);
    ctx.lineTo(x, y - 25 + 24);
    ctx.closePath();
    ctx.fill();

    // Legs
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x + 5, y - 10, 5, 18);
    ctx.fillRect(x + 62, y - 32, 5, 18);

    // Monitor
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 25, y - 55, 25, 20);
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(x + 27, y - 53, 21, 16);

    // Monitor stand
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 33, y - 35, 10, 5);

    // Keyboard
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + 20, y - 28, 22, 7);
  }

  drawWardrobe(ctx, x, y) {
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 12);
    ctx.lineTo(x + 58, y + 12 - 16);
    ctx.lineTo(x + 58, y - 65);
    ctx.lineTo(x + 10, y - 65 + 16);
    ctx.closePath();
    ctx.fill();

    // Door line
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 34, y + 4);
    ctx.lineTo(x + 34, y - 57);
    ctx.stroke();

    // Handles
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x + 28, y - 30, 3, 8);
    ctx.fillRect(x + 37, y - 33, 3, 8);
  }

  drawNightstand(ctx, x, y) {
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 8);
    ctx.lineTo(x + 36, y + 8 - 8);
    ctx.lineTo(x + 36, y - 22);
    ctx.lineTo(x + 12, y - 22 + 8);
    ctx.closePath();
    ctx.fill();

    // Top
    ctx.fillStyle = '#9C8565';
    ctx.beginPath();
    ctx.moveTo(x + 24, y - 14);
    ctx.lineTo(x + 38, y - 22);
    ctx.lineTo(x + 24, y - 30);
    ctx.lineTo(x + 10, y - 22);
    ctx.closePath();
    ctx.fill();

    // Lamp
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x + 21, y - 42, 6, 12);
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.moveTo(x + 16, y - 42);
    ctx.lineTo(x + 32, y - 42);
    ctx.lineTo(x + 29, y - 55);
    ctx.lineTo(x + 19, y - 55);
    ctx.closePath();
    ctx.fill();
  }

  drawClothesPile(ctx, x, y) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      const ox = (i % 2) * 8 - 4;
      const oy = Math.floor(i / 2) * 5;
      ctx.fillRect(x + 15 + ox, y - 5 + oy, 12, 6);
    }
  }

  drawPoster(ctx, x, y) {
    const posterY = y - 60;
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 10, posterY, 35, 42);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 12, posterY + 2, 31, 38);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 14, posterY + 5, 27, 7);
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(x + 17, posterY + 16, 7, 12);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(x + 25, posterY + 18, 7, 10);
    ctx.fillStyle = '#45B7D1';
    ctx.fillRect(x + 33, posterY + 14, 7, 14);
  }

  drawRug(ctx, x, y, item) {
    const rugWidth = item.width * 48;
    const rugHeight = item.height * 24;

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(x + 24, y);
    ctx.lineTo(x + 24 + rugWidth / 2, y + rugHeight / 2);
    ctx.lineTo(x + 24, y + rugHeight);
    ctx.lineTo(x + 24 - rugWidth / 2, y + rugHeight / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 15);
    ctx.lineTo(x + 24 + rugWidth / 2 - 15, y + rugHeight / 2);
    ctx.lineTo(x + 24, y + rugHeight - 15);
    ctx.lineTo(x + 24 - rugWidth / 2 + 15, y + rugHeight / 2);
    ctx.closePath();
    ctx.stroke();
  }

  drawXray(ctx, x, y) {
    const xrayY = y - 20;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 14, xrayY, 20, 26);

    // Foot bones
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(x + 17, xrayY + 4, 14, 4);
    ctx.fillRect(x + 18, xrayY + 9, 3, 7);
    ctx.fillRect(x + 22, xrayY + 9, 3, 7);
    ctx.fillRect(x + 26, xrayY + 9, 3, 6);
    ctx.fillRect(x + 21, xrayY + 17, 5, 6);

    ctx.fillStyle = 'rgba(135, 206, 250, 0.2)';
    ctx.fillRect(x + 12, xrayY - 2, 24, 30);
  }

  drawHollandiaCan(ctx, x, y) {
    const canY = y - 35;
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x + 19, canY, 10, 16);
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.ellipse(x + 24, canY, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 20, canY + 4, 8, 6);
    ctx.fillStyle = '#228B22';
    ctx.font = '5px Arial';
    ctx.fillText('H', x + 22, canY + 9);
  }

  drawCDItem(ctx, x, y) {
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

  drawLaundryBasket(ctx, x, y) {
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 8);
    ctx.lineTo(x + 36, y + 8 - 8);
    ctx.lineTo(x + 33, y - 18);
    ctx.lineTo(x + 15, y - 18 + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 13, y + 3 - i * 6);
      ctx.lineTo(x + 35, y + 3 - 7 - i * 6);
      ctx.stroke();
    }

    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(x + 17, y - 22, 7, 4);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(x + 26, y - 24, 6, 5);
  }

  drawSmallBookshelf(ctx, x, y) {
    ctx.fillStyle = '#654321';
    ctx.fillRect(x + 5, y - 45, 45, 55);

    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x + 7, y - 42, 41, 4);
    ctx.fillRect(x + 7, y - 22, 41, 4);
    ctx.fillRect(x + 7, y - 2, 41, 4);

    const bookColors = ['#8B0000', '#006400', '#00008B', '#4B0082', '#8B4513'];
    for (let shelf = 0; shelf < 2; shelf++) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = bookColors[(shelf * 5 + i) % bookColors.length];
        const bookX = x + 9 + i * 8;
        const bookY = shelf === 0 ? y - 40 : y - 20;
        ctx.fillRect(bookX, bookY, 6, 16);
      }
    }
  }

  getPlayerStartPosition() {
    return { x: 3, y: 12 };
  }
}

window.Bedroom = Bedroom;
}
