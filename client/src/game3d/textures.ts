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

// ---------------------------------------------------------------- downstairs
//
// The converted garage is lit almost entirely by lamps and a doorway, so these
// maps are drawn several stops darker than the outdoor set. Anything painted
// mid-grey up here would read as white once a warm point light lands on it.

/** Painted garage slab: patched, stained, saw-cut joints, spilled paint. */
function build_createSlabTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(4404);

  ctx.fillStyle = '#5a564e';
  ctx.fillRect(0, 0, size, size);

  // Broad patches where the slab was poured, ground back or re-sealed
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(108,102,92,0.16)' : 'rgba(58,54,48,0.18)';
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 20 + rand() * 90, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aggregate speckle, the same trick the outdoor concrete uses
  for (let i = 0; i < 34000; i++) {
    ctx.fillStyle =
      rand() > 0.45 ? `rgba(40,37,33,${rand() * 0.3})` : `rgba(150,144,132,${rand() * 0.22})`;
    ctx.fillRect(rand() * size, rand() * size, 1, 1);
  }

  // Saw-cut control joints on a grid, the giveaway that this is a slab
  ctx.strokeStyle = 'rgba(26,24,21,0.55)';
  ctx.lineWidth = 3;
  [size / 2].forEach((p) => {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  });

  // Hairline cracks wandering off the joints
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(30,28,25,0.5)';
  for (let i = 0; i < 14; i++) {
    let x = rand() * size;
    let y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 0; step < 12; step++) {
      x += (rand() - 0.5) * 44;
      y += (rand() - 0.5) * 44;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Oil stains, and paint the last tenants never cleaned up
  for (let i = 0; i < 5; i++) {
    const g = ctx.createRadialGradient(
      rand() * size,
      rand() * size,
      2,
      rand() * size,
      rand() * size,
      30 + rand() * 60,
    );
    g.addColorStop(0, 'rgba(18,16,20,0.45)');
    g.addColorStop(1, 'rgba(18,16,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  const splats = ['#c8442e', '#2f7fa8', '#d8a72c', '#7a3f9c'];
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = splats[Math.floor(rand() * splats.length)];
    ctx.globalAlpha = 0.1 + rand() * 0.25;
    ctx.beginPath();
    ctx.ellipse(
      rand() * size,
      rand() * size,
      2 + rand() * 9,
      2 + rand() * 6,
      rand() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return finish(canvas, 1);
}

/** Painted besser block: coursed rectangles with recessed mortar joints. */
function build_createBesserTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(8181);

  // Four courses of two blocks, so the map tiles seamlessly in both directions
  const rows = 4;
  const cols = 2;
  const blockH = size / rows;
  const blockW = size / cols;

  ctx.fillStyle = '#2e2b28';
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < rows; row++) {
    // Alternate courses are offset half a block, like real blockwork
    const offset = row % 2 === 0 ? 0 : blockW / 2;
    for (let col = -1; col <= cols; col++) {
      const x = col * blockW + offset;
      const y = row * blockH;
      const tone = 0.86 + rand() * 0.28;
      const r = Math.round(122 * tone);
      const g = Math.round(116 * tone);
      const b = Math.round(104 * tone);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 3, y + 3, blockW - 6, blockH - 6);

      // Light catches the top arris, the underside stays in shadow
      ctx.fillStyle = 'rgba(210,202,186,0.18)';
      ctx.fillRect(x + 3, y + 3, blockW - 6, 3);
      ctx.fillStyle = 'rgba(20,18,16,0.3)';
      ctx.fillRect(x + 3, y + blockH - 8, blockW - 6, 5);
    }
  }

  // Open-textured aggregate — besser block is coarse, not smooth render
  for (let i = 0; i < 40000; i++) {
    ctx.fillStyle =
      rand() > 0.5 ? `rgba(28,26,23,${rand() * 0.4})` : `rgba(180,172,158,${rand() * 0.22})`;
    ctx.fillRect(rand() * size, rand() * size, 1, 1);
  }

  // Damp rising up from the slab, plus a few sloppy paint runs
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = `rgba(44,52,40,${0.04 + rand() * 0.1})`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 12 + rand() * 44, 0, Math.PI * 2);
    ctx.fill();
  }

  return finish(canvas, 1);
}

/** Op-shop persian: deep red field, navy border, a medallion in the middle. */
function build_createRugTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(2727);

  ctx.fillStyle = '#7a1f22';
  ctx.fillRect(0, 0, size, size);

  // Nested borders
  const bands: [number, string][] = [
    [0.0, '#1d2a4a'],
    [0.045, '#c9a227'],
    [0.06, '#7a1f22'],
    [0.1, '#1d2a4a'],
    [0.125, '#7a1f22'],
  ];
  bands.forEach(([inset, color]) => {
    ctx.fillStyle = color;
    const p = inset * size;
    ctx.fillRect(p, p, size - p * 2, size - p * 2);
  });

  // Central medallion, built from stacked diamonds
  const cx = size / 2;
  const cy = size / 2;
  const diamond = (radius: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx + radius * 0.62, cy);
    ctx.lineTo(cx, cy + radius);
    ctx.lineTo(cx - radius * 0.62, cy);
    ctx.closePath();
    ctx.fill();
  };
  diamond(140, '#1d2a4a');
  diamond(112, '#c9a227');
  diamond(84, '#7a1f22');
  diamond(46, '#1d2a4a');
  diamond(22, '#d9cbb0');

  // Scattered botanical flecks so the field is not flat
  for (let i = 0; i < 700; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = ['#c9a227', '#d9cbb0', '#1d2a4a', '#3f6b4a'][Math.floor(rand() * 4)];
    ctx.globalAlpha = 0.5 + rand() * 0.4;
    ctx.fillRect(x, y, 3 + rand() * 4, 3 + rand() * 4);
  }
  ctx.globalAlpha = 1;

  // Worn traffic path and general grime
  const wear = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.62);
  wear.addColorStop(0, 'rgba(0,0,0,0.28)');
  wear.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, size, size);

  return finish(canvas, 1);
}

/** The jam-room rug: loud kilim stripes, entirely the wrong colours. */
function build_createKilimTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(5150);

  const palette = ['#d9622b', '#136f63', '#e0b429', '#5c2c4e', '#c8452f', '#2b5f7a'];

  ctx.fillStyle = '#2a1f26';
  ctx.fillRect(0, 0, size, size);

  // Horizontal bands of alternating widths
  let y = 0;
  while (y < size) {
    const h = 14 + rand() * 46;
    ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
    ctx.fillRect(0, y, size, h);

    // Zig-zags and diamonds inside the wider bands
    if (h > 34) {
      ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
      const step = 40;
      for (let x = 0; x < size; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + step / 2, y + 6);
        ctx.lineTo(x + step, y + h / 2);
        ctx.lineTo(x + step / 2, y + h - 6);
        ctx.closePath();
        ctx.fill();
      }
    }
    y += h;
  }

  // Weave grain, then knock the whole thing back with dust
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(rand() * size, rand() * size, 2, 1);
  }
  ctx.fillStyle = 'rgba(30,24,20,0.22)';
  ctx.fillRect(0, 0, size, size);

  return finish(canvas, 1);
}

/** Wall tapestry. A mandala, obviously. */
function build_createTapestryTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(3131);
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#160b26';
  ctx.fillRect(0, 0, size, size);

  const hot = ['#ff2d95', '#ffb02e', '#2ee6d6', '#8a2be2', '#f5f04a', '#ff5a2d'];

  // Concentric petal rings, each ring offset half a petal from the last
  for (let ring = 7; ring >= 1; ring--) {
    const radius = (ring / 7) * size * 0.46;
    const petals = 6 + ring * 2;
    const color = hot[ring % hot.length];
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2 + ring * 0.2;
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * radius * 0.72, cy + Math.sin(angle) * radius * 0.72);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.3, radius * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  // The eye in the middle, because it is that kind of house
  ctx.fillStyle = '#f5f04a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 62, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2ee6d6';
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12061f';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Fabric weave and fade, so it reads as cloth rather than a screen
  for (let i = 0; i < 30000; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.07)';
    ctx.fillRect(rand() * size, rand() * size, 1, 2);
  }

  return finish(canvas, 1);
}

/** Gig posters gaffer-taped to the blockwork. */
function build_createPosterTexture(index: number): THREE.Texture {
  const width = 256;
  const height = 384;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for procedural texture');

  const rand = seededRandom(9000 + index * 77);
  const schemes: [string, string, string][] = [
    ['#1b0f2e', '#ff2d95', '#f5f04a'],
    ['#0d2b1f', '#f0e6d2', '#ff8c1a'],
    ['#2b0d0d', '#ffd23f', '#2ee6d6'],
    ['#101820', '#ff5a2d', '#f0f0f0'],
  ];
  const [bg, ink, accent] = schemes[index % schemes.length];

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Radiating sunburst behind the type
  ctx.save();
  ctx.translate(width / 2, height * 0.42);
  for (let i = 0; i < 24; i++) {
    ctx.rotate(Math.PI / 12);
    ctx.fillStyle = i % 2 === 0 ? accent : bg;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, -60);
    ctx.lineTo(width, 60);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  const lines = [
    ['THE', 'SCRUMPS', 'LIVE'],
    ['HOT', 'SHOT', 'TOUR'],
    ['BASEMENT', 'JAM', 'FRI 8PM'],
    ['FREE', 'ENTRY', 'BYO'],
  ][index % 4];

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = 'bold 54px Impact, sans-serif';
  ctx.fillText(lines[0], width / 2, height * 0.3);
  ctx.font = 'bold 66px Impact, sans-serif';
  ctx.fillText(lines[1], width / 2, height * 0.46);
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Impact, sans-serif';
  ctx.fillText(lines[2], width / 2, height * 0.6);

  ctx.fillStyle = ink;
  ctx.font = '18px monospace';
  ctx.fillText('THE GARAGE · WEST END', width / 2, height * 0.86);

  // Print grain, foxing and a torn-looking edge
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(rand() * width, rand() * height, 1, 1);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// ------------------------------------------------------------------- balcony

/** Hardwood decking: boards running one way, with gaps and weathered grain. */
function build_createDeckingTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(6161);

  // Eight boards across the tile, so the gaps land on exact pixel boundaries
  const boards = 8;
  const boardH = size / boards;

  ctx.fillStyle = '#2a1d13';
  ctx.fillRect(0, 0, size, size);

  for (let b = 0; b < boards; b++) {
    const y = b * boardH;
    const tone = 0.82 + rand() * 0.36;
    ctx.fillStyle = `rgb(${Math.round(148 * tone)},${Math.round(110 * tone)},${Math.round(74 * tone)})`;
    ctx.fillRect(0, y + 3, size, boardH - 6);

    // Grain: long wandering strokes along the board
    for (let i = 0; i < 90; i++) {
      const gy = y + 4 + rand() * (boardH - 9);
      const len = 30 + rand() * 180;
      ctx.strokeStyle =
        rand() > 0.5 ? `rgba(70,48,30,${0.1 + rand() * 0.3})` : `rgba(196,158,114,${rand() * 0.22})`;
      ctx.lineWidth = 0.5 + rand();
      ctx.beginPath();
      ctx.moveTo(rand() * size, gy);
      ctx.lineTo(rand() * size + len, gy + (rand() - 0.5) * 2);
      ctx.stroke();
    }

    // The odd knot
    if (rand() > 0.55) {
      const kx = rand() * size;
      const ky = y + boardH / 2;
      const g = ctx.createRadialGradient(kx, ky, 1, kx, ky, 5 + rand() * 6);
      g.addColorStop(0, 'rgba(52,34,20,0.85)');
      g.addColorStop(1, 'rgba(52,34,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(kx - 14, ky - 14, 28, 28);
    }

    // Highlight along the top arris, shadow into the gap below
    ctx.fillStyle = 'rgba(226,192,148,0.16)';
    ctx.fillRect(0, y + 3, size, 2);
    ctx.fillStyle = 'rgba(24,14,8,0.4)';
    ctx.fillRect(0, y + boardH - 6, size, 3);
  }

  // Fixings, two per board at regular centres
  for (let b = 0; b < boards; b++) {
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 128 + rand() * 8;
      const y = b * boardH + boardH / 2;
      ctx.fillStyle = 'rgba(70,62,54,0.7)';
      ctx.fillRect(x, y - 4, 2, 2);
      ctx.fillRect(x, y + 3, 2, 2);
    }
  }

  // Sun-bleaching and general weather
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(214,186,150,0.05)' : 'rgba(46,32,20,0.07)';
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 20 + rand() * 70, 0, Math.PI * 2);
    ctx.fill();
  }

  return finish(canvas, 1);
}

/** Long, thin, backlit sunset cloud. Alpha-masked billboard. */
function build_createSunsetCloudTexture(): THREE.Texture {
  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for procedural texture');
  const rand = seededRandom(2468);

  // Stacked ellipses, densest through the middle, so the edges wisp out
  for (let i = 0; i < 90; i++) {
    const t = rand();
    const x = width * (0.08 + t * 0.84);
    const edge = 1 - Math.abs(t - 0.5) * 2;
    const y = height / 2 + (rand() - 0.5) * height * 0.34;
    const rx = 18 + rand() * 62;
    const ry = (4 + rand() * 16) * (0.35 + edge);

    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${0.16 + edge * 0.24})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// --------------------------------------------------------------- living room

/** Polished interior floorboards: long, tight-jointed, waxed. */
function build_createFloorboardTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(3344);

  const boards = 6;
  const boardH = size / boards;

  ctx.fillStyle = '#6b4a2c';
  ctx.fillRect(0, 0, size, size);

  for (let b = 0; b < boards; b++) {
    const y = b * boardH;
    const tone = 0.86 + rand() * 0.3;
    ctx.fillStyle = `rgb(${Math.round(160 * tone)},${Math.round(112 * tone)},${Math.round(64 * tone)})`;
    ctx.fillRect(0, y + 1, size, boardH - 2);

    // End joints, staggered board to board
    const jointX = rand() * size;
    ctx.fillStyle = 'rgba(58,36,20,0.5)';
    ctx.fillRect(jointX, y + 1, 2, boardH - 2);

    // Grain, much finer and straighter than exterior decking
    for (let i = 0; i < 130; i++) {
      const gy = y + 2 + rand() * (boardH - 5);
      ctx.strokeStyle =
        rand() > 0.5 ? `rgba(92,58,30,${0.08 + rand() * 0.22})` : `rgba(206,158,104,${rand() * 0.18})`;
      ctx.lineWidth = 0.5 + rand() * 0.8;
      ctx.beginPath();
      ctx.moveTo(rand() * size, gy);
      ctx.lineTo(rand() * size + 60 + rand() * 220, gy + (rand() - 0.5) * 1.6);
      ctx.stroke();
    }

    if (rand() > 0.6) {
      const kx = rand() * size;
      const ky = y + boardH / 2;
      const g = ctx.createRadialGradient(kx, ky, 1, kx, ky, 4 + rand() * 5);
      g.addColorStop(0, 'rgba(62,38,18,0.8)');
      g.addColorStop(1, 'rgba(62,38,18,0)');
      ctx.fillStyle = g;
      ctx.fillRect(kx - 12, ky - 12, 24, 24);
    }

    // Tight shadow line in the joint
    ctx.fillStyle = 'rgba(40,24,12,0.45)';
    ctx.fillRect(0, y + boardH - 2, size, 2);
  }

  // Wax sheen, unevenly worn
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(232,196,148,0.05)' : 'rgba(46,28,14,0.06)';
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 30 + rand() * 90, 0, Math.PI * 2);
    ctx.fill();
  }

  return finish(canvas, 1);
}

/**
 * The banana paintings. Four canvases, each a different take on the subject,
 * because the house's art collection has exactly one theme.
 */
function build_createBananaArtTexture(variant: number): THREE.Texture {
  const size = 384;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(700 + variant * 41);

  const grounds = ['#f2ead4', '#e8dcc0', '#1e2340', '#f0d8b0'];
  ctx.fillStyle = grounds[variant % 4];
  ctx.fillRect(0, 0, size, size);

  // Canvas tooth, so it does not read as flat vector
  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }

  const banana = (cx: number, cy: number, scale: number, angle: number, fill: string) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(-70, 20);
    ctx.quadraticCurveTo(0, -62, 70, 16);
    ctx.quadraticCurveTo(58, 34, 44, 30);
    ctx.quadraticCurveTo(0, -22, -56, 36);
    ctx.closePath();
    ctx.fill();
    // Stem and tip
    ctx.fillStyle = '#6b4a20';
    ctx.fillRect(-78, 14, 14, 10);
    ctx.fillRect(66, 10, 12, 9);
    ctx.restore();
  };

  if (variant === 0) {
    // One banana, centred, reverent
    banana(size / 2, size / 2, 1.15, 0.12, '#ffe135');
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.strokeRect(size * 0.12, size * 0.12, size * 0.76, size * 0.76);
  } else if (variant === 1) {
    // A bunch, overlapping
    banana(size * 0.42, size * 0.44, 0.8, -0.2, '#f5d21e');
    banana(size * 0.56, size * 0.52, 0.8, 0.1, '#ffe135');
    banana(size * 0.5, size * 0.62, 0.8, 0.34, '#e0bc18');
  } else if (variant === 2) {
    // Blue period. Same banana, worse mood.
    for (let i = 0; i < 5; i++) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.5);
      g.addColorStop(0, `rgba(90,120,220,${0.08 - i * 0.012})`);
      g.addColorStop(1, 'rgba(20,26,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    banana(size / 2, size / 2, 1.0, -0.5, '#9fd0f5');
    ctx.fillStyle = '#5a7fd0';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('untitled (sad)', size / 2, size * 0.86);
  } else {
    // Portrait format: one very tall banana
    banana(size / 2, size / 2, 1.0, Math.PI / 2 + 0.05, '#ffd91e');
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.moveTo(rand() * size, 0);
      ctx.lineTo(rand() * size, size);
      ctx.stroke();
    }
  }

  // Brush texture over the whole thing, and a little varnish bloom
  for (let i = 0; i < 240; i++) {
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1 + rand() * 3;
    const x = rand() * size;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 46, y + (rand() - 0.5) * 46);
    ctx.stroke();
  }

  return finish(canvas, 1);
}

/** A shelf of book spines, for the bookcase. */
function build_createBookSpineTexture(): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const rand = seededRandom(1212);

  ctx.fillStyle = '#1a1410';
  ctx.fillRect(0, 0, size, size);

  const colours = ['#8a2f2a', '#2f5c7a', '#3f6b3a', '#c4a24a', '#5c3f7a', '#a85a2a', '#d8cfc0'];
  let x = 0;
  while (x < size) {
    const w = 8 + rand() * 20;
    const lean = rand() > 0.88;
    const top = rand() * 22;

    ctx.save();
    if (lean) {
      ctx.translate(x, size);
      ctx.rotate(-0.12);
      ctx.translate(-x, -size);
    }
    ctx.fillStyle = colours[Math.floor(rand() * colours.length)];
    ctx.fillRect(x, top, w - 2, size - top);

    // Bands and a title block
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, top + 14, w - 2, 3);
    ctx.fillRect(x, size - 26, w - 2, 3);
    ctx.fillStyle = 'rgba(230,214,170,0.65)';
    ctx.fillRect(x + 2, top + 34, w - 6, 22);

    // Shading down the spine so they read as round
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.1)');
    g.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(x, top, w - 2, size - top);
    ctx.restore();

    x += w;
  }

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

export const createFloorboardTexture = (): THREE.Texture =>
  memoize('floorboard', build_createFloorboardTexture);
export const createBananaArtTexture = (variant: number): THREE.Texture =>
  memoize(`bananaArt:${variant}`, () => build_createBananaArtTexture(variant));
export const createBookSpineTexture = (): THREE.Texture =>
  memoize('bookSpine', build_createBookSpineTexture);

export const createDeckingTexture = (): THREE.Texture => memoize('decking', build_createDeckingTexture);
export const createSunsetCloudTexture = (): THREE.Texture =>
  memoize('sunsetCloud', build_createSunsetCloudTexture);

export const createSlabTexture = (): THREE.Texture => memoize('slab', build_createSlabTexture);
export const createBesserTexture = (): THREE.Texture => memoize('besser', build_createBesserTexture);
export const createRugTexture = (): THREE.Texture => memoize('rug', build_createRugTexture);
export const createKilimTexture = (): THREE.Texture => memoize('kilim', build_createKilimTexture);
export const createTapestryTexture = (): THREE.Texture => memoize('tapestry', build_createTapestryTexture);
export const createPosterTexture = (index: number): THREE.Texture =>
  memoize(`poster:${index}`, () => build_createPosterTexture(index));

/**
 * A copy of a memoised map with its own tiling. The clone shares the underlying
 * canvas upload, so this is cheap — it exists because `repeat` lives on the
 * texture, and several surfaces need the same map at different scales.
 */
export function tiled(texture: THREE.Texture, x: number, y: number): THREE.Texture {
  const copy = texture.clone();
  copy.repeat.set(x, y);
  copy.needsUpdate = true;
  return copy;
}
