// Front Porch - Entry point with ladder access to roof

if (typeof FrontPorch === 'undefined') {
class FrontPorch {
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

    // Front door
    this.addFurniture({ x: 8, y: 1, width: 4, height: 1, type: 'front_door' });

    // Porch columns
    this.addFurniture({ x: 2, y: 3, width: 1, height: 1, type: 'column' });
    this.addFurniture({ x: 17, y: 3, width: 1, height: 1, type: 'column' });

    // Porch chairs
    this.addFurniture({ x: 4, y: 6, width: 2, height: 2, type: 'porch_chair' });
    this.addFurniture({ x: 14, y: 6, width: 2, height: 2, type: 'porch_chair' });

    // Small table between chairs
    this.addFurniture({ x: 9, y: 7, width: 2, height: 1, type: 'porch_table' });

    // Potted plants
    this.addFurniture({ x: 1, y: 5, width: 1, height: 1, type: 'potplant' });
    this.addFurniture({ x: 18, y: 5, width: 1, height: 1, type: 'potplant' });

    // Welcome mat (no collision)
    this.addFurniture({ x: 9, y: 3, width: 2, height: 1, type: 'welcome_mat', noCollision: true });

    // Steps at the front
    this.addFurniture({ x: 6, y: 12, width: 8, height: 2, type: 'porch_steps' });

    // Ladder placement spot (where player puts ladder to access roof)
    this.addFurniture({ x: 18, y: 2, width: 1, height: 2, type: 'ladder_spot', noCollision: true });

    // Last Hollandia can!
    this.addFurniture({ x: 10, y: 7, width: 1, height: 1, type: 'hollandia_can', noCollision: true });
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
    this.drawEveningSky(ctx);
    this.drawFloor(ctx, offsetX, offsetY);
    this.drawHouseFacade(ctx, offsetX, offsetY);
    this.drawFurnitureAll(ctx, offsetX, offsetY);
  }

  drawEveningSky(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#2C3E50');
    gradient.addColorStop(0.3, '#34495E');
    gradient.addColorStop(0.6, '#5D6D7E');
    gradient.addColorStop(1, '#85929E');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const starX = (i * 137) % ctx.canvas.width;
      const starY = (i * 89) % (ctx.canvas.height * 0.4);
      const starSize = (i % 3) + 1;
      ctx.fillRect(starX, starY, starSize, starSize);
    }
  }

  drawFloor(ctx, offsetX, offsetY) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const screenPos = isometricToScreen(x, y);
        const drawX = screenPos.x + offsetX;
        const drawY = screenPos.y + offsetY;

        const isAlt = x % 2 === 0;
        const lightColor = isAlt ? '#8B7355' : '#7A6548';
        const darkColor = isAlt ? '#6B5344' : '#5A4638';
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

  drawHouseFacade(ctx, offsetX, offsetY) {
    // Back wall of house
    for (let x = 0; x < this.width; x++) {
      const screenPos = isometricToScreen(x, 0);
      const drawX = screenPos.x + offsetX;
      const drawY = screenPos.y + offsetY;

      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + 12);
      ctx.lineTo(drawX, drawY - 65);
      ctx.lineTo(drawX + 24, drawY - 65 - 12);
      ctx.lineTo(drawX + 24, drawY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawFurnitureAll(ctx, offsetX, offsetY) {
    const sortedFurniture = [...this.furniture].sort((a, b) => {
      return (a.y + a.height) - (b.y + b.height);
    });

    for (const item of sortedFurniture) {
      const screenPos = isometricToScreen(item.x, item.y);
      const drawX = screenPos.x + offsetX;
      const drawY = screenPos.y + offsetY;

      switch (item.type) {
        case 'front_door': this.drawFrontDoor(ctx, drawX, drawY); break;
        case 'column': this.drawColumn(ctx, drawX, drawY); break;
        case 'porch_chair': this.drawPorchChair(ctx, drawX, drawY); break;
        case 'porch_table': this.drawPorchTable(ctx, drawX, drawY); break;
        case 'potplant': this.drawPotplant(ctx, drawX, drawY); break;
        case 'welcome_mat': this.drawWelcomeMat(ctx, drawX, drawY); break;
        case 'porch_steps': this.drawPorchSteps(ctx, drawX, drawY, item); break;
        case 'ladder_spot': this.drawLadderSpot(ctx, drawX, drawY); break;
        case 'hollandia_can': this.drawHollandiaCan(ctx, drawX, drawY); break;
      }
    }
  }

  drawFrontDoor(ctx, x, y) {
    // Door frame
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(x + 12, y - 80, 60, 85);

    // Door
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x + 17, y - 75, 50, 75);

    // Door panels
    ctx.strokeStyle = '#6B0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 22, y - 70, 40, 30);
    ctx.strokeRect(x + 22, y - 35, 40, 30);

    // Door handle
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x + 55, y - 40, 4, 0, Math.PI * 2);
    ctx.fill();

    // House number
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('42', x + 35, y - 55);
  }

  drawColumn(ctx, x, y) {
    // Column base
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(x + 14, y, 20, 12);

    // Column shaft
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(x + 16, y - 60, 16, 60);

    // Column highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 18, y - 55, 4, 50);

    // Column capital
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(x + 12, y - 70, 24, 12);
  }

  drawPorchChair(ctx, x, y) {
    // Rocking chair
    ctx.fillStyle = '#8B4513';

    // Seat
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 48, y + 12 - 16);
    ctx.lineTo(x + 48, y - 8);
    ctx.lineTo(x, y - 8 + 16);
    ctx.closePath();
    ctx.fill();

    // Back
    ctx.fillRect(x + 10, y - 35, 35, 25);

    // Rockers
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 24, y + 20, 28, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();

    // Armrests
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x, y - 12, 8, 18);
    ctx.fillRect(x + 40, y - 25, 8, 18);
  }

  drawPorchTable(ctx, x, y) {
    // Small side table
    ctx.fillStyle = '#8B7355';

    // Top
    ctx.beginPath();
    ctx.moveTo(x + 24, y - 15);
    ctx.lineTo(x + 52, y - 15 - 14);
    ctx.lineTo(x + 24, y - 15 - 28);
    ctx.lineTo(x - 4, y - 15 - 14);
    ctx.closePath();
    ctx.fill();

    // Legs
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x + 2, y - 10, 4, 16);
    ctx.fillRect(x + 42, y - 22, 4, 16);

    // Glass of lemonade
    ctx.fillStyle = '#FFFFE0';
    ctx.fillRect(x + 20, y - 40, 8, 12);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 21, y - 38, 6, 8);
  }

  drawPotplant(ctx, x, y) {
    // Terracotta pot
    ctx.fillStyle = '#CD853F';
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 5);
    ctx.lineTo(x + 34, y + 5);
    ctx.lineTo(x + 30, y - 22);
    ctx.lineTo(x + 18, y - 22);
    ctx.closePath();
    ctx.fill();

    // Plant
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI - Math.PI / 2;
      const leafX = x + 24 + Math.cos(angle) * 12;
      const leafY = y - 32 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.ellipse(leafX, leafY, 6, 12, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWelcomeMat(ctx, x, y) {
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(x + 24, y);
    ctx.lineTo(x + 60, y - 18);
    ctx.lineTo(x + 24, y - 36);
    ctx.lineTo(x - 12, y - 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.font = '7px Arial';
    ctx.fillText('WELCOME', x + 5, y - 15);
  }

  drawPorchSteps(ctx, x, y, item) {
    for (let i = 0; i < 3; i++) {
      const stepY = y + 18 - i * 10;
      ctx.fillStyle = i % 2 === 0 ? '#808080' : '#707070';

      ctx.beginPath();
      ctx.moveTo(x - 20 + i * 8, stepY);
      ctx.lineTo(x + item.width * 48 - 20 - i * 8, stepY - item.width * 12 + i * 4);
      ctx.lineTo(x + item.width * 48 - 20 - i * 8, stepY - item.width * 12 + i * 4 - 8);
      ctx.lineTo(x - 20 + i * 8, stepY - 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawLadderSpot(ctx, x, y) {
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x + 14, y - 50, 20, 55);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x + 24, y - 58);
    ctx.lineTo(x + 14, y - 45);
    ctx.lineTo(x + 34, y - 45);
    ctx.closePath();
    ctx.fill();
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

  getPlayerStartPosition() {
    return { x: 10, y: 10 };
  }
}

window.FrontPorch = FrontPorch;
}
