/**
 * Procedurally generated textures.
 *
 * Everything is drawn to an offscreen canvas at load time so the 3D scene stays
 * a zero-asset build, exactly like the original pixel-art renderer.
 */

import * as THREE from 'three';

/**
 * Textures are expensive to rasterise and never change, so each generator is
 * memoised. Re-entering the backyard reuses the same GPU uploads.
 */
const cache = new Map<string, THREE.Texture>();
function memoize(key: string, create: () => THREE.Texture): THREE.Texture {
  const existing = cache.get(key);
  if (existing) return existing;
  const created = create();
  cache.set(key, created);
  return created;
}

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for procedural texture');
  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement, repeat: number, srgb = true): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Deterministic value noise so the world looks identical on every load. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Lawn: mottled greens with scattered blades and dry patches. */
function build_createGrassTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(1337);

  ctx.fillStyle = '#5d8447';
  ctx.fillRect(0, 0, size, size);

  // Broad tonal patches
  for (let i = 0; i < 220; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 20 + rand() * 70;
    const tone = rand();
    ctx.fillStyle =
      tone > 0.7 ? 'rgba(126,166,86,0.35)' : tone > 0.35 ? 'rgba(63,99,56,0.30)' : 'rgba(148,158,80,0.22)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Individual blades
  for (let i = 0; i < 5200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 3 + rand() * 7;
    const lean = (rand() - 0.5) * 4;
    const shade = rand();
    ctx.strokeStyle =
      shade > 0.72
        ? `rgba(150,196,102,${0.5 + rand() * 0.4})`
        : shade > 0.3
          ? `rgba(84,124,60,${0.5 + rand() * 0.4})`
          : `rgba(48,78,44,${0.4 + rand() * 0.4})`;
    ctx.lineWidth = 0.8 + rand() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + lean, y - len);
    ctx.stroke();
  }

  return finish(canvas, 14);
}

/** Roughness companion to the grass map so the lawn is not uniformly matte. */
function build_createGrassRoughness(): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(99);
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 4 + rand() * 26;
    const v = Math.floor(150 + rand() * 90);
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(canvas, 14, false);
}

/** Weathered timber for the fence palings and the ladder. */
function build_createWoodTexture(): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(4242);

  ctx.fillStyle = '#9c7449';
  ctx.fillRect(0, 0, size, size);

  // Vertical grain
  for (let i = 0; i < 260; i++) {
    const x = rand() * size;
    const w = 0.6 + rand() * 2.6;
    const dark = rand() > 0.5;
    ctx.fillStyle = dark ? `rgba(88,62,38,${0.10 + rand() * 0.28})` : `rgba(196,158,110,${0.08 + rand() * 0.22})`;
    ctx.fillRect(x, 0, w, size);
  }

  // Knots
  for (let i = 0; i < 7; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 3 + rand() * 6;
    for (let k = 4; k > 0; k--) {
      ctx.strokeStyle = `rgba(74,50,30,${0.16 * k})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x, y, r * k * 0.45, r * k * 0.3, rand() * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Weathering streaks
  for (let i = 0; i < 60; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = `rgba(60,44,28,${0.05 + rand() * 0.10})`;
    ctx.fillRect(x, y, 1 + rand() * 3, 20 + rand() * 80);
  }

  return finish(canvas, 1);
}

/** Canvas mat for the boxing ring. */
function build_createRingMatTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(77);

  ctx.fillStyle = '#3f5fd0';
  ctx.fillRect(0, 0, size, size);

  // Canvas weave
  for (let i = 0; i < size; i += 3) {
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(i, 0, 1, size);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, i, size, 1);
  }

  // Scuffs and stains from many, many poultry title fights
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = `rgba(20,30,90,${0.05 + rand() * 0.18})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + rand() * 34, 4 + rand() * 20, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Centre logo ring
  ctx.strokeStyle = 'rgba(255,215,64,0.55)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,215,64,0.75)';
  ctx.font = 'bold 74px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCRUMPS', size / 2, size / 2);

  return finish(canvas, 1);
}

/** Moulded plastic for the kiddy pool shell. */
function build_createPoolTexture(): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(555);

  ctx.fillStyle = '#f25ba6';
  ctx.fillRect(0, 0, size, size);

  // Sun-bleached streaks
  for (let i = 0; i < 120; i++) {
    const y = rand() * size;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,190,220,0.16)' : 'rgba(170,20,90,0.14)';
    ctx.fillRect(0, y, size, 1 + rand() * 3);
  }

  // Faded cartoon fish, because of course
  for (let i = 0; i < 10; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = `rgba(255,255,255,${0.10 + rand() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + 24, y - 8);
    ctx.lineTo(x + 24, y + 8);
    ctx.closePath();
    ctx.fill();
  }

  return finish(canvas, 1);
}

/** Rendered-concrete stucco for the house walls. Yellow, sun-bleached, patchy. */
function build_createStuccoTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(20240817);

  ctx.fillStyle = '#e9c55c';
  ctx.fillRect(0, 0, size, size);

  // Broad patches where the render has weathered unevenly
  for (let i = 0; i < 150; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 25 + rand() * 110;
    const tone = rand();
    // Kept subtle: strong patches tile into obvious circles across a big wall
    ctx.fillStyle =
      tone > 0.6 ? 'rgba(246,220,140,0.12)' : tone > 0.3 ? 'rgba(198,158,60,0.09)' : 'rgba(224,196,110,0.10)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine aggregate speckle
  for (let i = 0; i < 9000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const dark = rand() > 0.5;
    ctx.fillStyle = dark ? `rgba(150,116,40,${rand() * 0.22})` : `rgba(255,240,190,${rand() * 0.22})`;
    ctx.fillRect(x, y, 1 + rand(), 1 + rand());
  }

  // Rain streaks running down the wall
  for (let i = 0; i < 70; i++) {
    const x = rand() * size;
    ctx.fillStyle = `rgba(140,110,50,${0.03 + rand() * 0.07})`;
    ctx.fillRect(x, rand() * size, 1 + rand() * 3, 40 + rand() * 180);
  }

  // A few hairline cracks
  for (let i = 0; i < 5; i++) {
    let x = rand() * size;
    let y = rand() * size;
    ctx.strokeStyle = 'rgba(120,92,36,0.35)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 14; s++) {
      x += (rand() - 0.5) * 22;
      y += rand() * 18;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return finish(canvas, 1);
}

/** Plain poured concrete, for the staircase and balcony slab. */
function build_createConcreteTexture(): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(606);

  ctx.fillStyle = '#b8b3a8';
  ctx.fillRect(0, 0, size, size);

  // Kept low-contrast on purpose: box UVs stretch this map across faces of very
  // different sizes, and strong blotches read as marble rather than concrete.
  for (let i = 0; i < 200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 26;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(202,198,188,0.08)' : 'rgba(146,142,134,0.07)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aggregate carries most of the detail
  for (let i = 0; i < 26000; i++) {
    const dark = rand() > 0.45;
    ctx.fillStyle = dark
      ? `rgba(96,94,88,${rand() * 0.28})`
      : `rgba(226,222,212,${rand() * 0.26})`;
    ctx.fillRect(rand() * size, rand() * size, 1, 1);
  }

  // Occasional pour lines and chips
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(120,116,108,${0.05 + rand() * 0.08})`;
    ctx.fillRect(rand() * size, rand() * size, 20 + rand() * 90, 1);
  }

  return finish(canvas, 3);
}

/** Soft radial alpha used for cloud billboards and shadow blobs. */
function build_createPuffTexture(): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.75, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Single grass blade alpha card for the instanced ground cover. */
function build_createBladeTexture(): THREE.Texture {
  const w = 64;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for blade texture');

  ctx.clearRect(0, 0, w, h);
  const gradient = ctx.createLinearGradient(0, h, 0, 0);
  gradient.addColorStop(0, '#3c6b34');
  gradient.addColorStop(0.55, '#6ea34e');
  gradient.addColorStop(1, '#a8cf6a');
  ctx.fillStyle = gradient;

  // Tapered blade silhouette
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h);
  ctx.quadraticCurveTo(w * 0.18, h * 0.45, w * 0.46, 0);
  ctx.quadraticCurveTo(w * 0.74, h * 0.45, w * 0.72, h);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Album art for the collectible CD, labelled with the track it carries. */
function build_createCDArtTexture(songName: string): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(songName.length * 977 + songName.charCodeAt(0));

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2b1b52');
  gradient.addColorStop(0.5, '#c33a6a');
  gradient.addColorStop(1, '#f2a341');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.12})`;
    ctx.fillRect(rand() * size, rand() * size, rand() * 60, 2);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('THE SCRUMPS', size / 2, size * 0.42);

  ctx.font = '16px monospace';
  const words = songName.toUpperCase().split(' ');
  words.forEach((word, i) => {
    ctx.fillText(word, size / 2, size * 0.56 + i * 20);
  });

  return finish(canvas, 1);
}

export const createGrassTexture = (): THREE.Texture => memoize('grass', build_createGrassTexture);

export const createGrassRoughness = (): THREE.Texture => memoize('grassRoughness', build_createGrassRoughness);

export const createWoodTexture = (): THREE.Texture => memoize('wood', build_createWoodTexture);

export const createRingMatTexture = (): THREE.Texture => memoize('ringMat', build_createRingMatTexture);

export const createPoolTexture = (): THREE.Texture => memoize('pool', build_createPoolTexture);

export const createPuffTexture = (): THREE.Texture => memoize('puff', build_createPuffTexture);

export const createBladeTexture = (): THREE.Texture => memoize('blade', build_createBladeTexture);

export const createCDArtTexture = (songName: string): THREE.Texture =>
  memoize(`cdArt:${songName}`, () => build_createCDArtTexture(songName));

export const createStuccoTexture = (): THREE.Texture => memoize('stucco', build_createStuccoTexture);
export const createConcreteTexture = (): THREE.Texture => memoize('concrete', build_createConcreteTexture);
