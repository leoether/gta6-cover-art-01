// Draws the multi-panel GTA-style cover: a Vice City sunset sky with a retro
// slatted sun, skyline and palm silhouettes, three photo panels with a colour
// grade, and a big Anton caption banner along the foot. All original art,
// drawn with the canvas 2D API — no Rockstar artwork, logo or font.

/** Colour grades: sky stops, sun colours, panel tint and caption accent. */
export const GRADES = {
  sunset: {
    sky: ['#2b1055', '#7597de', '#ff7a3d', '#ff2e88'],
    sun: '#ffd166', sunCore: '#fff3b0', tint: '255, 90, 60', accent: '#ffb347',
  },
  neon: {
    sky: ['#12082b', '#3b0f66', '#e83e8c', '#22d3ee'],
    sun: '#ff5da2', sunCore: '#ffe3f1', tint: '232, 62, 140', accent: '#22d3ee',
  },
  noir: {
    sky: ['#0b1e26', '#123a44', '#2e6f7e', '#7fb3b0'],
    sun: '#e8f1f2', sunCore: '#ffffff', tint: '40, 110, 125', accent: '#9fd8d2',
  },
  bubblegum: {
    sky: ['#3d0a4e', '#8b2bbf', '#ff6fb5', '#ffc2e2'],
    sun: '#fff06a', sunCore: '#fffbe0', tint: '255, 111, 181', accent: '#fff06a',
  },
};

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a, b, t) {
  const ca = hexRgb(a);
  const cb = hexRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Vertical sunset sky over the whole canvas. */
export function drawSky(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.45, grade.sky[1]);
  sky.addColorStop(0.75, grade.sky[2]);
  sky.addColorStop(1, grade.sky[3]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

/** Retro sun with horizontal slats cut across its lower half. */
export function drawRetroSun(ctx, w, h, grade) {
  const cx = w * 0.74;
  const cy = h * 0.17;
  const r = Math.min(w, h) * 0.13;
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sun.addColorStop(0, grade.sunCore);
  sun.addColorStop(1, grade.sun);
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slats: sky-coloured bars, thicker toward the bottom of the disc.
  let y = cy + r * 0.05;
  let gap = r * 0.07;
  let thick = r * 0.03;
  while (y < cy + r) {
    const t = (y / h);
    ctx.fillStyle = lerpColor(grade.sky[1], grade.sky[2], Math.min(1, t * 1.4));
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, thick);
    y += gap + thick;
    gap *= 1.25;
    thick *= 1.3;
  }
}

/** Dark skyline silhouette with a few lit windows, along a baseline. */
export function drawSkyline(ctx, w, h, grade, baseY) {
  ctx.fillStyle = '#1a0b2e';
  const base = baseY;
  let x = 0;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < w) {
    const bw = w * (0.05 + rnd() * 0.06);
    const bh = h * (0.02 + rnd() * 0.055);
    ctx.fillRect(x, base - bh, bw, bh);
    if (rnd() > 0.5) { // rooftop antenna
      ctx.fillRect(x + bw / 2 - 1, base - bh - h * 0.015, 2, h * 0.015);
    }
    x += bw + w * 0.004;
  }
  // Lit windows.
  ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
  seed = 11;
  for (let i = 0; i < 46; i++) {
    const wx = rnd() * w;
    const wy = base - h * 0.005 - rnd() * h * 0.06;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.003), Math.max(2, h * 0.002));
  }
}

/** One palm silhouette: a leaning trunk and arcing fronds. */
export function drawPalm(ctx, x, baseY, s, lean) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(s, s);
  ctx.strokeStyle = '#160826';
  ctx.fillStyle = '#160826';
  ctx.lineCap = 'round';
  // Trunk, leaning.
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 14, -70, lean * 30, -118);
  ctx.stroke();
  // Fronds from the crown.
  const cx = lean * 30;
  const cy = -118;
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 26) * (Math.PI / 180);
    const len = 62 - Math.abs(i - 3) * 7;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.55 - 14,
      cx + Math.cos(a) * len, cy + Math.sin(a) * len + 16,
    );
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(cx - 6, cy + 8, 5, 0, Math.PI * 2);
  ctx.arc(cx + 6, cy + 9, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** One photo panel: cover-fit photo with zoom/offset, grade wash, white frame. */
export function drawPhotoPanel(ctx, rect, photo, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#241533';
  ctx.fillRect(x, y, w, h);
  if (photo && photo.img) {
    const img = photo.img;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = base * (photo.zoom || 1);
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const dx = x + (w - pw) / 2 + ((photo.ox || 0) / 100) * w;
    const dy = y + (h - ph) / 2 + ((photo.oy || 0) / 100) * h;
    try { ctx.filter = 'saturate(1.25) contrast(1.08)'; } catch { /* older canvas */ }
    ctx.drawImage(img, dx, dy, pw, ph);
    try { ctx.filter = 'none'; } catch { /* older canvas */ }
  }
  // Sunset wash, stronger at the foot of the panel.
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, `rgba(${grade.tint},0)`);
  wash.addColorStop(0.62, `rgba(${grade.tint},0.10)`);
  wash.addColorStop(1, `rgba(${grade.tint},0.38)`);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  // Diagonal shine.
  const shine = ctx.createLinearGradient(x, y, x + w, y + h);
  shine.addColorStop(0, 'rgba(255,255,255,0.10)');
  shine.addColorStop(0.35, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // White frame + drop shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.max(8, w * 0.02);
  ctx.shadowOffsetY = Math.max(4, h * 0.012);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, w * 0.012);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** Big Anton caption with a black outline, slightly tilted, over a band. */
export function drawCaptionBanner(ctx, w, h, caption, subtitle, grade) {
  const bandY = h * 0.845;
  const bandH = h * 0.135;
  // Band: dark translucent strip so lettering reads on any sky.
  ctx.fillStyle = 'rgba(16, 6, 28, 0.55)';
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));
  ctx.fillRect(0, bandY + bandH - Math.max(3, h * 0.004), w, Math.max(3, h * 0.004));

  const text = (caption || '').trim().toUpperCase();
  if (text) {
    let size = h * 0.078;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    while (ctx.measureText(text).width > w * 0.9 && size > 14) {
      size -= 2;
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    }
    ctx.save();
    ctx.translate(w / 2, bandY + bandH * 0.44);
    ctx.rotate(-0.02);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#14081f';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = Math.max(11, h * 0.016);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, w * 0.004)}px`; } catch { /* no letterSpacing */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, w / 2, bandY + bandH * 0.88);
    try { ctx.letterSpacing = '0px'; } catch { /* no letterSpacing */ }
  }
}

/**
 * Draws the whole cover onto the canvas at its own size.
 * state: { panels: [{img, zoom, ox, oy}] x3, caption, subtitle, grade }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = state.panels || [];

  drawSky(ctx, w, h, grade);
  drawRetroSun(ctx, w, h, grade);
  drawSkyline(ctx, w, h, grade, h * 0.30);
  drawPalm(ctx, w * 0.03, h * 0.30, Math.min(w, h) / 900, 1);
  drawPalm(ctx, w * 0.97, h * 0.30, Math.min(w, h) / 1100, -1);

  const gap = w * 0.02;
  const hero = { x: w * 0.04, y: h * 0.315, w: w * 0.92, h: h * 0.305 };
  const bw = (w * 0.92 - gap) / 2;
  const low = { x: w * 0.04, y: h * 0.64, w: bw, h: h * 0.185 };
  const lowR = { x: w * 0.04 + bw + gap, y: h * 0.64, w: bw, h: h * 0.185 };
  drawPhotoPanel(ctx, hero, panels[0], grade);
  drawPhotoPanel(ctx, low, panels[1], grade);
  drawPhotoPanel(ctx, lowR, panels[2], grade);

  drawCaptionBanner(ctx, w, h, state.caption, state.subtitle, grade);

  // Outer frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.strokeRect(w * 0.008, h * 0.008, w * 0.984, h * 0.984);
}
