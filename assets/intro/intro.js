(() => {
  const dialog = document.querySelector('#code-intro');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const url = new URL(window.location.href);
  const replay = url.searchParams.get('intro') === '1';
  const visitKey = 'og-portfolio-industrial-intro';
  let seen = false;
  try { seen = sessionStorage.getItem(visitKey) === 'seen'; } catch {}
  const navigation = window.performance?.getEntriesByType?.('navigation')[0];
  const refreshed = navigation ? navigation.type === 'reload' : window.performance?.navigation?.type === 1;
  const fromPortfolio = document.referrer && new URL(document.referrer).origin === url.origin;
  if (!replay && (motion.matches || (!refreshed && (seen || url.hash || fromPortfolio)))) return;

  const lines = [
    'const OG = {',
    '  by: "Orkhan Guliyev",',
    '  work: ["data", "IT"],',
    '  ask: "What if?"',
    '};',
    '',
    'export default OG;'
  ];
  const editor = dialog.querySelector('.intro-code');
  const skip = dialog.querySelector('.intro-skip');
  const glyphs = [];
  const rows = [];

  // Tokenize before playback so a word keeps its color as it is typed.
  lines.forEach((line, index) => {
    const row = document.createElement('div');
    row.className = 'intro-row';
    const content = document.createElement('span');
    content.className = 'intro-row-content';
    row.append(content);
    editor.append(row);
    rows.push(row);

    for (const token of line.match(/"[^"]*"|\w+|[^\w"]/g) || []) {
      const span = document.createElement('span');
      if (token.startsWith('"')) span.dataset.token = 'string';
      if (['const', 'export', 'default'].includes(token)) span.dataset.token = 'keyword';
      if (token === 'OG') span.dataset.token = 'name';
      content.append(span);
      for (const character of token) glyphs.push({character, span, row: index});
    }
    if (index < lines.length - 1) glyphs.push({character: '\n', row: index + 1});
  });

  const timers = new Set();
  function after(delay, callback) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  }
  function stop() {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (dialog.open) dialog.close();
  }
  skip.addEventListener('click', stop);
  dialog.addEventListener('cancel', event => { event.preventDefault(); stop(); });
  window.addEventListener('pagehide', stop, {once: true});
  motion.addEventListener('change', event => { if (event.matches && dialog.open) stop(); });

  dialog.showModal();
  try { sessionStorage.setItem(visitKey, 'seen'); } catch {}
  if (replay) {
    url.searchParams.delete('intro');
    history.replaceState(history.state, '', url);
  }
  let active = 0;
  rows[0].classList.add('is-current');
  function type(glyph) {
    if (glyph.character === '\n') {
      rows[active].classList.remove('is-current');
      active = glyph.row;
      rows[active].classList.add('is-current');
    } else {
      glyph.span.textContent += glyph.character;
    }
  }

  if (motion.matches) {
    glyphs.forEach(type);
    skip.textContent = 'Enter portfolio ↗';
    return;
  }

  let elapsed = 150;
  for (const glyph of glyphs) {
    after(elapsed, () => type(glyph));
    elapsed += glyph.character === '\n' ? 132 : glyph.character === ' ' ? 15 : 27;
  }
  const signatureHold = 320;
  const exitTime = 2300;
  dialog.style.setProperty('--intro-hold-time', signatureHold + 'ms');
  dialog.style.setProperty('--intro-exit-time', exitTime + 'ms');
  after(elapsed, () => {
    rows[active].classList.remove('is-current');
    dialog.classList.add('is-signed');
  });
  after(elapsed + signatureHold, () => {
    if (window.CSS?.registerProperty && window.CSS.supports('mask-image', 'radial-gradient(black, transparent)')) {
      const signature = editor.querySelector('.intro-row:last-child [data-token="name"]').getBoundingClientRect();
      const frame = dialog.getBoundingClientRect();
      const x = (signature.left + signature.width / 2 - frame.left) / frame.width;
      const y = (signature.top + signature.height / 2 - frame.top) / frame.height;
      dialog.style.setProperty('--intro-light-origin', (100 * x) + '% ' + (100 * y) + '%');
      dialog.classList.add('has-light-wave');
    }
    dialog.classList.add('is-leaving');
    after(exitTime, stop);
  });
})();
