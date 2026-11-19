// Wires the page: pick photos, assign them to the three panels, crop and
// position each, edit the caption, pick a grade and a post size, export the
// cover as a PNG. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js).
import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const caption = document.getElementById('caption');
const subtitle = document.getElementById('subtitle');
const grade = document.getElementById('grade');
const status = document.getElementById('status');
const panelPick = document.getElementById('panelPick');
const panelPhoto = document.getElementById('panelPhoto');
const zoom = document.getElementById('zoom');
const offX = document.getElementById('offX');
const offY = document.getElementById('offY');

const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080', file: 'cover-1080x1080.png' },
  tall: { w: 1080, h: 1350, label: '1080 x 1350', file: 'cover-1080x1350.png' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080', file: 'cover-1920x1080.png' },
};
let sizeKey = 'square';

// One slot per panel: which image it shows and how it is cropped.
const panels = [
  { source: 'pier', img: null, zoom: 1, ox: 0, oy: 30 },
  { source: 'boulevard', img: null, zoom: 1, ox: 0, oy: 25 },
  { source: 'pier', img: null, zoom: 1.15, ox: 0, oy: 25 },
];
const uploads = { A: null, B: null, C: null };
const samples = {};

function state() {
  return {
    panels: panels.map((p) => ({ ...p })),
    caption: caption.value,
    subtitle: subtitle.value,
    grade: grade.value,
  };
}

function redraw() {
  drawCover(canvas, state());
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  samples.pier = await loadImage('samples/pier.jpg');
  samples.boulevard = await loadImage('samples/boulevard.jpg');
  panels[0].img = samples.pier;
  panels[1].img = samples.boulevard;
  panels[2].img = samples.pier;
}

/** Applies the picked panel's photo source to that panel. */
function applyPanelPhoto() {
  const p = panels[Number(panelPick.value)];
  p.source = panelPhoto.value;
  if (p.source === 'none') p.img = null;
  else if (p.source === 'pier' || p.source === 'boulevard') p.img = samples[p.source];
  else p.img = uploads[p.source];
  redraw();
}

/** Shows the picked panel's crop sliders in the controls. */
function syncPanelControls() {
  const p = panels[Number(panelPick.value)];
  panelPhoto.value = p.source;
  zoom.value = p.zoom;
  offX.value = p.ox;
  offY.value = p.oy;
}

function bindUpload(id, key) {
  document.getElementById(id).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploads[key] = await loadImage(URL.createObjectURL(file));
    // Put the new photo straight into the panel being edited.
    const p = panels[Number(panelPick.value)];
    p.source = key;
    p.img = uploads[key];
    syncPanelControls();
    status.textContent = `Photo ${key} loaded — assigned to panel ${Number(panelPick.value) + 1}.`;
    redraw();
  });
}

bindUpload('fileA', 'A');
bindUpload('fileB', 'B');
bindUpload('fileC', 'C');

panelPick.addEventListener('change', syncPanelControls);
panelPhoto.addEventListener('change', applyPanelPhoto);
zoom.addEventListener('input', () => {
  panels[Number(panelPick.value)].zoom = Number(zoom.value);
  redraw();
});
offX.addEventListener('input', () => {
  panels[Number(panelPick.value)].ox = Number(offX.value);
  redraw();
});
offY.addEventListener('input', () => {
  panels[Number(panelPick.value)].oy = Number(offY.value);
  redraw();
});
caption.addEventListener('input', redraw);
subtitle.addEventListener('input', redraw);
grade.addEventListener('change', redraw);

/** Switches the export size and resizes the preview canvas to match. */
function setSize(key) {
  sizeKey = key;
  const s = SIZES[key];
  canvas.width = s.w;
  canvas.height = s.h;
  canvas.classList.toggle('tall', key === 'tall');
  canvas.classList.toggle('wide', key === 'wide');
  for (const [k, id] of [['square', 'sizeSquare'], ['tall', 'sizeTall'], ['wide', 'sizeWide']]) {
    document.getElementById(id).classList.toggle('on', k === key);
  }
  redraw();
}

document.getElementById('sizeSquare').addEventListener('click', () => setSize('square'));
document.getElementById('sizeTall').addEventListener('click', () => setSize('tall'));
document.getElementById('sizeWide').addEventListener('click', () => setSize('wide'));

document.getElementById('export').addEventListener('click', () => {
  const s = SIZES[sizeKey];
  const out = document.createElement('canvas');
  out.width = s.w;
  out.height = s.h;
  drawCover(out, state());
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = s.file;
    a.click();
    status.textContent = `Saved ${s.file} (${s.label}).`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadSamples, samples, panels, setSize, redraw,
    setCaption: (t) => { caption.value = t; },
    setSubtitle: (t) => { subtitle.value = t; },
    setGrade: (g) => { grade.value = g; },
  });
} else {
  loadSamples().then(async () => {
    try { await document.fonts.load('100px Anton'); } catch { /* font fallback */ }
    syncPanelControls();
    redraw();
  });
}
