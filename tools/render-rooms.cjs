// Renders every furniture/prop draw method across the room files so we can
// triage which ones need an art pass.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createCanvas } = require('canvas');

global.window = global;
global.document = { getElementById: () => null, createElement: () => ({ getContext: () => null }), addEventListener: () => {} };
global.requestAnimationFrame = () => {};
global.addEventListener = () => {};

const pub = path.join(__dirname, '..', 'client', 'public');
const load = (f) => vm.runInThisContext(fs.readFileSync(path.join(pub, f), 'utf8'), { filename: f });
['utils.js', 'player.js', 'room.js', 'downstairsRoom.js', 'balcony.js', 'livingRoom.js', 'bedroom.js', 'frontPorch.js', 'rooftop.js', 'game.js'].forEach(load);

const EXCLUDE = new Set(['drawFloor', 'drawWalls', 'drawIsometricTile', 'drawFurniture', 'drawFurnitureAll',
  'drawTrippyBackground', 'drawSunsetBackground', 'drawSunsetClouds', 'drawSunsetCloud', 'drawSunRays',
  'drawFlyingBirds', 'drawEveningSky', 'drawNightSky', 'drawCitySkyline', 'drawHouseFacade', 'drawContactShadow']);

const rooms = [
  ['Downstairs', global.DownstairsRoom],
  ['Balcony', global.Balcony],
  ['LivingRoom', global.LivingRoom],
  ['Bedroom', global.Bedroom],
  ['FrontPorch', global.FrontPorch],
  ['Rooftop', global.Rooftop],
];

const FILTER = process.argv[2]; // optional room-name substring
const items = [];
for (const [rn, cls] of rooms) {
  if (!cls) continue;
  if (FILTER && !rn.toLowerCase().includes(FILTER.toLowerCase())) continue;
  const proto = cls.prototype;
  Object.getOwnPropertyNames(proto)
    .filter((n) => n.startsWith('draw') && !EXCLUDE.has(n) && typeof proto[n] === 'function')
    .forEach((n) => items.push([`${rn}.${n.replace('draw', '')}`, proto, n]));
}

const CELL = FILTER ? 200 : 150, COLS = FILTER ? 4 : 6, S = FILTER ? 3.4 : 2.4;
const rowsN = Math.ceil(items.length / COLS);
const W = COLS * CELL, H = rowsN * CELL;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { ctx.fillStyle = ((x + y) / 16) % 2 ? '#3a3f4b' : '#2e323c'; ctx.fillRect(x, y, 16, 16); }

items.forEach(([label, proto, fn], i) => {
  const col = i % COLS, row = (i / COLS) | 0;
  const ox = col * CELL, oy = row * CELL;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.strokeRect(ox, oy, CELL, CELL);
  ctx.save();
  try {
    ctx.translate(ox + CELL / 2, oy + CELL / 2 + 20);
    ctx.scale(S, S);
    ctx.imageSmoothingEnabled = false;
    proto[fn].call(proto, ctx, 0, 8, 2, 2, {}, 0, 0);
  } catch (e) {
    ctx.restore(); ctx.save();
    ctx.fillStyle = '#ff6b6b'; ctx.font = '9px monospace';
    ctx.fillText('ERR ' + e.message.slice(0, 16), ox + 5, oy + CELL / 2);
  } finally { ctx.restore(); }
  ctx.fillStyle = '#ffe14d'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText(label, ox + CELL / 2, oy + 13); ctx.textAlign = 'left';
});

fs.writeFileSync(path.join(__dirname, 'rooms.png'), canvas.toBuffer('image/png'));
console.log('wrote rooms.png', `${W}x${H}, ${items.length} props`);
