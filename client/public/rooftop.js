// Rooftop - Final escape location with 10 subletters

if (typeof Rooftop === 'undefined') {
class Rooftop {
  constructor(game) {
    this.game = game;
    this.width = 24;
    this.height = 16;
    this.furniture = [];
    this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));

    this.setupFurniture();
  }

  setupFurniture() {
    this.furniture = [];
    this.collisionMap = Array(this.height).fill().map(() => Array(this.width).fill(false));

    // Roof edge railings
    for (let i = 0; i < this.width; i++) {
      this.addFurniture({ x: i, y: 0, width: 1, height: 1, type: 'roof_edge' });
    }
    for (let i = 1; i < this.height; i++) {
      this.addFurniture({ x: 0, y: i, width: 1, height: 1, type: 'roof_edge' });
      this.addFurniture({ x: this.width - 1, y: i, width: 1, height: 1, type: 'roof_edge' });
    }

    // Chimney
    this.addFurniture({ x: 3, y: 2, width: 2, height: 2, type: 'chimney' });

    // AC unit
    this.addFurniture({ x: 18, y: 3, width: 3, height: 2, type: 'ac_unit' });

    // Satellite dish
    this.addFurniture({ x: 10, y: 2, width: 2, height: 2, type: 'satellite_dish' });

    // Cooler (for party vibes)
    this.addFurniture({ x: 15, y: 8, width: 2, height: 1, type: 'cooler' });

    // Lawn chairs for subletters
    this.addFurniture({ x: 5, y: 6, width: 1, height: 1, type: 'lawn_chair' });
    this.addFurniture({ x: 8, y: 5, width: 1, height: 1, type: 'lawn_chair' });
    this.addFurniture({ x: 12, y: 7, width: 1, height: 1, type: 'lawn_chair' });

    // The 10 subletters! Various characters
    this.addFurniture({ x: 4, y: 5, width: 1, height: 1, type: 'subletter_bathrobe' });
    this.addFurniture({ x: 7, y: 4, width: 1, height: 1, type: 'subletter_tattoo' });
    this.addFurniture({ x: 9, y: 6, width: 1, height: 1, type: 'subletter_guitar' });
    this.addFurniture({ x: 11, y: 5, width: 1, height: 1, type: 'subletter_headphones' });
    this.addFurniture({ x: 14, y: 6, width: 1, height: 1, type: 'subletter_cereal' });
    this.addFurniture({ x: 16, y: 5, width: 1, height: 1, type: 'subletter_mascot' });
    this.addFurniture({ x: 6, y: 8, width: 1, height: 1, type: 'subletter_skater' });
    this.addFurniture({ x: 13, y: 9, width: 1, height: 1, type: 'subletter_meditating' });
    this.addFurniture({ x: 18, y: 8, width: 1, height: 1, type: 'subletter_phone' });
    this.addFurniture({ x: 20, y: 6, width: 1, height: 1, type: 'subletter_sleeping' });

    // Ladder access point (where player enters)
    this.addFurniture({ x: 22, y: 12, width: 1, height: 2, type: 'ladder_access', noCollision: true });
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
    this.drawNightSky(ctx);
    this.drawFloor(ctx, offsetX, offsetY);
    this.drawFurnitureAll(ctx, offsetX, offsetY);
  }

  drawFloor(ctx, offsetX, offsetY) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const screenPos = isometricToScreen(x, y);
        const drawX = screenPos.x + offsetX;
        const drawY = screenPos.y + offsetY;

        const isAlt = (x + y) % 2 === 0;
        const lightColor = isAlt ? '#4A4A4A' : '#3A3A3A';
        const darkColor = isAlt ? '#3A3A3A' : '#2A2A2A';
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

  drawNightSky(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.4, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#1f4068');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 100; i++) {
      const starX = (i * 137 + 50) % ctx.canvas.width;
      const starY = (i * 89 + 30) % (ctx.canvas.height * 0.5);
      const starSize = (i % 3) + 1;
      const twinkle = Math.sin(Date.now() * 0.002 + i) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(starX, starY, starSize, starSize);
    }
    ctx.globalAlpha = 1;

    // Moon
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.arc(ctx.canvas.width - 150, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    // Moon craters
    ctx.fillStyle = '#E8E8C8';
    ctx.beginPath();
    ctx.arc(ctx.canvas.width - 160, 70, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ctx.canvas.width - 140, 90, 5, 0, Math.PI * 2);
    ctx.fill();

    this.drawCitySkyline(ctx);
  }

  drawCitySkyline(ctx) {
    const baseY = ctx.canvas.height * 0.6;

    const glowGradient = ctx.createLinearGradient(0, baseY - 100, 0, baseY + 50);
    glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0)');
    glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0.1)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, baseY - 100, ctx.canvas.width, 150);

    const buildings = [
      { x: 50, width: 40, height: 80 },
      { x: 100, width: 30, height: 120 },
      { x: 140, width: 50, height: 90 },
      { x: 200, width: 35, height: 150 },
      { x: 250, width: 45, height: 100 },
      { x: 310, width: 30, height: 180 },
      { x: 350, width: 55, height: 110 },
      { x: 420, width: 40, height: 140 },
      { x: 480, width: 35, height: 95 },
      { x: 530, width: 50, height: 160 },
    ];

    buildings.forEach(building => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(building.x, baseY - building.height, building.width, building.height);

      ctx.fillStyle = '#FFD700';
      for (let row = 0; row < Math.floor(building.height / 15); row++) {
        for (let col = 0; col < Math.floor(building.width / 10); col++) {
          if (Math.random() > 0.6) {
            ctx.fillRect(
              building.x + 3 + col * 10,
              baseY - building.height + 5 + row * 15,
              5, 8
            );
          }
        }
      }
    });
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
        case 'roof_edge': this.drawRoofEdge(ctx, drawX, drawY); break;
        case 'chimney': this.drawChimney(ctx, drawX, drawY); break;
        case 'ac_unit': this.drawACUnit(ctx, drawX, drawY); break;
        case 'satellite_dish': this.drawSatelliteDish(ctx, drawX, drawY); break;
        case 'cooler': this.drawCooler(ctx, drawX, drawY); break;
        case 'lawn_chair': this.drawLawnChair(ctx, drawX, drawY); break;
        case 'ladder_access': this.drawLadderAccess(ctx, drawX, drawY); break;
        default:
          if (item.type.startsWith('subletter_')) {
            this.drawSubletter(ctx, drawX, drawY, item.type);
          }
      }
    }
  }

  drawRoofEdge(ctx, x, y) {
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + 10, y - 10, 28, 22);
    ctx.fillStyle = '#1F1F1F';
    ctx.fillRect(x + 10, y + 8, 28, 6);
  }

  drawChimney(ctx, x, y) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 15, y - 50, 35, 55);

    ctx.fillStyle = '#654321';
    ctx.fillRect(x + 15, y - 55, 35, 8);

    // Smoke
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    const time = Date.now() * 0.001;
    for (let i = 0; i < 3; i++) {
      const smokeY = y - 60 - i * 15 - Math.sin(time + i) * 5;
      const smokeX = x + 32 + Math.sin(time * 0.5 + i) * 8;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 8 + i * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawACUnit(ctx, x, y) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 10, y - 25, 60, 35);

    ctx.fillStyle = '#606060';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(x + 15 + i * 7, y - 20, 4, 25);
    }

    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.arc(x + 55, y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSatelliteDish(ctx, x, y) {
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.ellipse(x + 30, y - 25, 25, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.ellipse(x + 30, y - 25, 18, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#404040';
    ctx.fillRect(x + 28, y - 10, 4, 15);
  }

  drawCooler(ctx, x, y) {
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x + 10, y - 18, 45, 25);

    ctx.fillStyle = '#1976D2';
    ctx.fillRect(x + 10, y - 18, 45, 5);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px Arial';
    ctx.fillText('COLD', x + 20, y - 5);
  }

  drawLawnChair(ctx, x, y) {
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 8);
    ctx.lineTo(x + 38, y + 8 - 10);
    ctx.lineTo(x + 38, y - 20);
    ctx.lineTo(x + 10, y - 20 + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#006400';
    ctx.fillRect(x + 8, y + 5, 4, 12);
    ctx.fillRect(x + 36, y - 5, 4, 12);
  }

  drawLadderAccess(ctx, x, y) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 18, y - 40, 4, 50);
    ctx.fillRect(x + 30, y - 40, 4, 50);

    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + 18, y - 35 + i * 10, 16, 3);
    }
  }

  drawSubletter(ctx, x, y, type) {
    // Base body for all subletters
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(x + 24, y - 25, 8, 0, Math.PI * 2);
    ctx.fill();

    // Different outfits/accessories based on type
    switch (type) {
      case 'subletter_bathrobe':
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(x + 16, y - 15, 16, 22);
        ctx.fillStyle = '#FFE4C4';
        ctx.fillRect(x + 20, y - 14, 8, 5);
        break;
      case 'subletter_tattoo':
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(x + 16, y - 15, 16, 20);
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(x + 30, y - 12, 6, 8);
        break;
      case 'subletter_guitar':
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 16, y - 15, 16, 20);
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.ellipse(x + 38, y - 5, 8, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'subletter_headphones':
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 16, y - 15, 16, 20);
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + 16, y - 28, 5, 0, Math.PI * 2);
        ctx.arc(x + 32, y - 28, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'subletter_cereal':
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(x + 16, y - 15, 16, 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 34, y - 15, 10, 14);
        break;
      case 'subletter_mascot':
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + 24, y - 25, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + 20, y - 27, 2, 0, Math.PI * 2);
        ctx.arc(x + 28, y - 27, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'subletter_skater':
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(x + 16, y - 15, 16, 20);
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(x + 14, y + 5, 20, 4);
        break;
      case 'subletter_meditating':
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(x + 12, y - 10, 24, 15);
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x + 24, y - 22, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'subletter_phone':
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(x + 16, y - 15, 16, 20);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 32, y - 20, 6, 10);
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(x + 33, y - 19, 4, 7);
        break;
      case 'subletter_sleeping':
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, y - 5, 28, 12);
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x + 16, y - 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px Arial';
        ctx.fillText('zzz', x + 30, y - 15);
        break;
    }
  }

  getPlayerStartPosition() {
    return { x: 21, y: 12 };
  }
}

window.Rooftop = Rooftop;
}
