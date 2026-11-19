// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, full-screen, at the
// export size named by `size` (square, tall or wide). `photo` picks the hero
// sample, `caption` the words, `grade` the colour grade. window.__shotReady
// is set once the cover is painted.
export async function runShot(shot, query, api) {
  const canvas = document.getElementById('cover');
  await api.loadSamples();
  try { await document.fonts.load('100px Anton'); await document.fonts.ready; } catch { /* font fallback */ }

  const caption = query.get('caption') ?? 'Sunset Heist';
  const grade = query.get('grade') ?? 'sunset';
  api.setCaption(caption);
  api.setGrade(grade);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = query.get('size') ?? 'square';
    api.setSize(size);
    const hero = query.get('photo') ?? 'pier';
    const second = query.get('photo2') ?? 'boulevard';
    const third = query.get('photo3') ?? 'pier';
    api.panels[0].img = api.samples[hero];
    api.panels[1].img = api.samples[second];
    api.panels[2].img = api.samples[third];
    api.panels[0].source = hero;
    api.panels[1].source = second;
    api.panels[2].source = third;
    api.redraw();
  } else {
    // Editor scene: sample photo in every panel, caption set, square size.
    api.setSize('square');
    api.panels[0].img = api.samples.pier;
    api.panels[1].img = api.samples.boulevard;
    api.panels[2].img = api.samples.pier;
    api.redraw();
  }

  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    document.documentElement.setAttribute('data-shot-ready', 'true');
  }));
}
