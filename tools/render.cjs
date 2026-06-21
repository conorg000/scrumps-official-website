// Headless renderer: loads the game's vanilla-JS draw code under node-canvas
// and produces a labeled contact sheet so we can actually SEE the procedural art.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createCanvas } = require('canvas');

// --- Shim a browser-ish global so the game files eval cleanly ---
global.window = global;
global.document = {
  getElementById: () => null,
  createElement: () => ({ getContext: () => null }),
  addEventListener: () => {},
};
global.requestAnimationFrame = () => {};
global.addEventListener = () => {};

const pub = path.join(__dirname, '..', 'client', 'public');
function load(file) { vm.runInThisContext(fs.readFileSync(path.join(pub, file), 'utf8'), { filename: file }); }
load('utils.js');
load('player.js');
load('room.js');
load('downstairsRoom.js');
load('balcony.js');
load('livingRoom.js');
load('bedroom.js');
load('frontPorch.js');
load('rooftop.js');
load('game.js');

const Player = global.Player;
const G = global.Game.prototype;
const R = global.Room.prototype;

// Fake `this` for NPC draws that read this.adele etc.
function npcThis(dir) {
  return {
    adele: { x: 0, y: 0, direction: dir },
    bushTurkey: { x: 0, y: 0, direction: dir },
    player: { x: 0, y: 0, direction: dir },
    currentScene: 'mainRoom',
  };
}

// Sprites to render: [label, drawFn(ctx, cx, cy)]
const sprites = [];

// Player (Scrump) — 4 directions
['down', 'left', 'right', 'up'].forEach((dir) => {
  sprites.push([`Scrump ${dir}`, (ctx, cx, cy) => {
    const p = new Player(0, 0);
    p.direction = dir;
    p.drawBanana(ctx, cx - 18, cy - 40);
  }]);
});

// Companions take (ctx, companion, offsetX, offsetY)
const companionDraws = [
  ['Mr Tibbles', 'drawMrTibblesCompanion'],
  ['Possum', 'drawPossumCompanion'],
  ['Tiny Clown', 'drawTinyClownCompanion'],
  ['Humunculous', 'drawHumunculousCompanion'],
];
companionDraws.forEach(([label, fn]) => {
  sprites.push([label, (ctx, cx, cy) => {
    G[fn].call(npcThis('down'), ctx, { x: 0, y: 0, direction: 'down' }, cx, cy);
  }]);
});

// Standalone-ish NPCs. Some draw at a fixed world tile; offset to re-centre them.
const iso = global.isometricToScreen;
const npcs = [
  ['Adele', 'drawAdele', { x: 0, y: 0 }],
  ['Bush Turkey', 'drawBushTurkey', iso(12, 3)],
  ['Mr Feng', 'drawMrFeng', iso(8, 10)],
];
npcs.forEach(([label, fn, anchor]) => {
  sprites.push([label, (ctx, cx, cy) => {
    G[fn].call(npcThis('down'), ctx, cx - anchor.x, cy - anchor.y);
  }]);
});

// Furniture / props from Room
const furniture = [
  ['Tree', (ctx, cx, cy) => R.drawTree.call(R, ctx, cx - 48, cy - 20, 2, 2)],
  ['Bush', (ctx, cx, cy) => R.drawBush.call(R, ctx, cx - 24, cy)],
  ['Beer bottle', (ctx, cx, cy) => R.drawBeerBottle.call(R, ctx, cx - 24, cy)],
  ['Boxing gloves', (ctx, cx, cy) => R.drawBoxingGloves.call(R, ctx, cx - 18, cy)],
  ['T-shirt', (ctx, cx, cy) => R.drawTShirt.call(R, ctx, cx - 24, cy)],
  ['Guitar', (ctx, cx, cy) => R.drawGuitar.call(R, ctx, cx - 24, cy)],
  ['Hollandia can', (ctx, cx, cy) => R.drawHollandiaCan.call(R, ctx, cx - 24, cy)],
  ['CD', (ctx, cx, cy) => R.drawCDItem.call(R, ctx, cx - 24, cy)],
  ['Ladder', (ctx, cx, cy) => R.drawLadder.call(R, ctx, cx - 24, cy)],
  ['Mr Tibbles (idle)', (ctx, cx, cy) => R.drawMrTibbles.call(R, ctx, cx - 24, cy)],
];

const all = process.env.CHARS ? sprites : sprites.concat(furniture);

// --- Lay out a contact sheet ---
const CELL = 175, COLS = 5;
const rows = Math.ceil(all.length / COLS);
const W = COLS * CELL, H = rows * CELL;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// checker bg
for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) {
  ctx.fillStyle = ((x + y) / 16) % 2 ? '#3a3f4b' : '#2e323c';
  ctx.fillRect(x, y, 16, 16);
}

const S = 3; // zoom factor for legibility
all.forEach(([label, draw], i) => {
  const col = i % COLS, row = (i / COLS) | 0;
  const ox = col * CELL, oy = row * CELL;
  const cx = ox + CELL / 2;
  const cy = oy + CELL / 2 + 24;
  // cell border
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(ox, oy, CELL, CELL);
  ctx.save();
  try {
    // zoom around the cell centre
    ctx.translate(cx, cy);
    ctx.scale(S, S);
    ctx.imageSmoothingEnabled = false;
    draw(ctx, 0, 0);
  } catch (e) {
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#ff5555';
    ctx.font = '10px monospace';
    ctx.fillText('ERR: ' + e.message.slice(0, 22), ox + 6, cy);
  } finally {
    ctx.restore();
  }
  ctx.fillStyle = '#ffe14d';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, oy + 16);
  ctx.textAlign = 'left';
});

const out = path.join(__dirname, 'sprites.png');
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log('wrote', out, `(${W}x${H}, ${all.length} sprites)`);
