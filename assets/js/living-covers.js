/* Living covers. Parts of a cover's own artwork move a little: clouds drift,
   water flows and glints, trees sway, lights breathe, the balance pans swing.
   Nothing is added to a picture. A cover wakes on hover (Library, Home), in
   the middle of the screen on touch devices, and while visible on a report
   page. Reduced motion and Save-Data keep every cover still. Assets load
   only when a cover first wakes. Data: living-covers-data.js. */
(function () {
  'use strict';
  const DATA = window.LonghandLiving || {};
  const script = document.currentScript.src;
  const livingDir = new URL('../../assets/img/research/living/', script);
  const coverDir = new URL('../../assets/img/research/covers/', script);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (navigator.connection && navigator.connection.saveData) return;
  const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reportPage = document.body.classList.contains('page-report');
  const W = 640, H = 960, MIN_WIDTH = 100, FRAME_MS = 66;
  const cq = (v) => `${(v / W * 100).toFixed(3)}cqw`;
  const pct = (v, of) => `${(v / of * 100).toFixed(3)}%`;

  const SIN = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) SIN[i] = Math.sin((i / 4096) * Math.PI * 2);
  const sin = (a) => SIN[((a * 651.8986) | 0) & 4095];

  const pixels = (src) => new Promise((resolve, reject) => {
    const im = new Image();
    im.src = src;
    im.decode().then(() => {
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0);
      resolve(g.getImageData(0, 0, c.width, c.height).data);
    }, reject);
  });

  // A canvas over one moving part. Each frame a pixel of that part copies a nearby
  // pixel of the same part, so only that part moves and nothing is painted over others.
  function warp(layer, dir, spec) {
    const [x, y, w, h] = spec.box;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    Object.assign(canvas.style, { left: pct(x, W), top: pct(y, H), width: pct(w, W), height: pct(h, H) });
    layer.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const out = ctx.createImageData(w, h);
    let st = null;
    const type = spec.type;
    const files = type === 'track' ? [pixels(`${dir}track.webp`)]
      : [pixels(`${dir}${type}.webp`), pixels(`${dir}${type}-data.png`), type === 'sway' ? pixels(`${dir}sway-bg.webp`) : null];
    Promise.all(files).then(([src, data, bg]) => {
      if (type === 'track') {
        const [ox, oy] = spec.origin, [ux, uy] = spec.dir, nx = -uy, ny = ux, L = spec.length, [c0, c1] = spec.across;
        const cells = [];
        for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
          const px = c - ox, py = r - oy, along = px * ux + py * uy, across = px * nx + py * ny;
          if (along < 0 || along > L || across < c0 || across > c1) continue;
          cells.push(r * w + c, along, across, Math.min(1, along / 10, (L - along) / 10) * Math.min(1, (across - c0) / 1.5, (c1 - across) / 1.5));
        }
        st = { src, cells: Float32Array.from(cells), ox, oy, ux, uy, nx, ny, L };
        return;
      }
      const channel = type === 'twinkle' ? 0 : 2, active = [];
      for (let i = 0; i < w * h; i++) if (data[i * 4 + channel] > 128) active.push(i);
      st = { src, data, bg: bg || src, active: Int32Array.from(active), col: new Float32Array(w), row: new Float32Array(h) };
    }).catch(() => {});

    function frame(t) {
      if (!st) return;
      const o = out.data, s = st, A = spec.amp;
      o.fill(0);
      if (type === 'track') {
        const shift = (t * spec.speed) % s.L;
        for (let c = 0; c < s.cells.length; c += 4) {
          const a = ((s.cells[c + 1] - shift) % s.L + s.L) % s.L, across = s.cells[c + 2];
          const sx = Math.round(s.ox + a * s.ux + across * s.nx), sy = Math.round(s.oy + a * s.uy + across * s.ny);
          if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
          const k = s.cells[c] * 4, m = (sy * w + sx) * 4;
          o[k] = s.src[m]; o[k + 1] = s.src[m + 1]; o[k + 2] = s.src[m + 2]; o[k + 3] = 255 * s.cells[c + 3];
        }
      } else if (type === 'twinkle') {
        // Lights breathe slowly, each on its own beat. Glints on water flash briefly.
        for (const i of s.active) {
          const k = i * 4, ph = s.data[k + 1] / 40.7, light = s.data[k + 2] > 200;
          let g;
          if (light) g = 1 + 0.5 * sin(t * (0.9 + (s.data[k + 1] % 7) * 0.22) + ph);
          else {
            const f = Math.max(0, sin(t * (2.4 + (s.data[k + 1] % 5) * 0.3) + ph));
            if (f < 0.35) continue;
            g = 1 + 1.3 * f * f * f * f;
          }
          o[k] = Math.min(255, s.src[k] * g); o[k + 1] = Math.min(255, s.src[k + 1] * g); o[k + 2] = Math.min(255, s.src[k + 2] * (light ? g * 0.92 : g)); o[k + 3] = 255;
        }
      } else if (type === 'sway') {
        // Roots stay, crowns move, in gusts that travel across the picture.
        for (let c = 0; c < w; c++) {
          const gust = 0.55 + 0.45 * sin(t * 0.5 - (c + x) * 0.009);
          s.col[c] = A * gust * (0.75 * sin(t * 2.1 - (c + x) * 0.05) + 0.25 * sin(t * 3.6 - (c + x) * 0.13));
        }
        for (const i of s.active) {
          const c = i % w, d = s.col[c] * (s.data[i * 4 + 1] / 255);
          const j = i - c + Math.max(0, Math.min(w - 1, Math.round(c - d)));
          const own = s.data[j * 4] > 128, m = (own ? j : i) * 4, from = own ? s.src : s.bg, k = i * 4;
          o[k] = from[m]; o[k + 1] = from[m + 1]; o[k + 2] = from[m + 2]; o[k + 3] = 255;
        }
      } else {
        // Water: ripples travel down the frame, larger nearer the viewer.
        for (let c = 0; c < w; c++) s.col[c] = 1.8 * sin((c + x) * 0.021 + t * 0.6);
        for (let r = 0; r < h; r++) s.row[r] = (r + y) * 0.3 - t * 1.9;
        for (const i of s.active) {
          const c = i % w, r = (i - c) / w;
          const sc = Math.round(c - A * (s.data[i * 4 + 1] / 255) * sin(s.row[r] + s.col[c]));
          const j = sc >= 0 && sc < w && s.data[(i - c + sc) * 4] > 128 ? i - c + sc : i;
          const k = i * 4, m = j * 4;
          o[k] = s.src[m]; o[k + 1] = s.src[m + 1]; o[k + 2] = s.src[m + 2]; o[k + 3] = 255;
        }
      }
      ctx.putImageData(out, 0, 0);
    }
    return frame;
  }

  function build(fig, d) {
    const dir = `${livingDir}${d.id}/`;
    const layer = document.createElement('div');
    layer.className = 'living';
    layer.setAttribute('aria-hidden', 'true');
    const picture = d.base ? `${dir}base.webp` : `${coverDir}${d.id}-art-640.webp`;
    if (d.base) layer.insertAdjacentHTML('beforeend', `<img class="living-base" src="${picture}" alt="" width="640" height="960">`);
    if (d.sky) {
      const sky = document.createElement('div');
      sky.className = 'living-sky';
      sky.style.webkitMaskImage = sky.style.maskImage = `url(${dir}sky.png)`;
      sky.style.setProperty('--amp', `${d.sky}%`);
      sky.style.setProperty('--period', `${22 + (d.id.length % 7) * 2}s`);
      sky.innerHTML = `<img src="${picture}" alt="" width="640" height="960">`;
      layer.appendChild(sky);
    }
    const frames = d.warps.map((spec) => warp(layer, dir, spec));
    const front = document.createElement('div');
    front.className = 'living-front';
    front.setAttribute('aria-hidden', 'true');
    for (const sp of d.sprites) {
      const [x, y, w, h] = sp.box;
      const img = new Image();
      img.className = 'living-swing';
      img.src = `${dir}sprite-${sp.name}.webp`;
      img.alt = '';
      Object.assign(img.style, { left: pct(x, W), top: pct(y, H), width: pct(w, W), height: pct(h, H), transformOrigin: `${sp.origin[0] * 100}% ${sp.origin[1] * 100}%` });
      img.style.setProperty('--swing', `${sp.swing}deg`);
      img.style.setProperty('--period', `${sp.period / 2}s`);
      img.style.setProperty('--delay', `${-sp.phase * sp.period}s`);
      front.appendChild(img);
    }
    if (d.hoist) {
      // The crane lifts and lowers its load on a cable that shortens and lengthens.
      const hz = d.hoist, [px, py] = hz.pivot, [lx, ly, lw, lh] = hz.load, drop = ly - py;
      front.insertAdjacentHTML('beforeend', `<div class="living-hoist" style="left:${pct(px, W)};top:${pct(py, H)};--swing:${hz.swing}deg;--l0:${cq(drop)};--l1:${cq(drop - hz.lift)};--rise:${cq(-hz.lift)};--period:${hz.period}s">
        <span class="living-cable"></span><img src="${dir}sprite-load.webp" alt="" style="left:${cq(lx - px)};top:${cq(drop)};width:${cq(lw)};height:${cq(lh)}"></div>`);
    }
    fig.querySelector(':scope > img')?.after(layer);
    fig.appendChild(front);
    return frames;
  }

  const covers = new Map();
  const awake = new Set();
  function wake(fig) {
    const c = covers.get(fig);
    if (!c || reduced.matches || fig.clientWidth < MIN_WIDTH) return;
    if (!c.frames) c.frames = build(fig, c.data);
    fig.classList.add('is-living');
    awake.add(c);
  }
  function sleep(fig) {
    const c = covers.get(fig);
    if (!c) return;
    fig.classList.remove('is-living');
    awake.delete(c);
  }

  let last = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!awake.size || document.hidden || now - last < FRAME_MS) return;
    last = now;
    const t = now / 1000;
    for (const c of awake) c.frames.forEach((f) => f(t));
  }
  requestAnimationFrame(tick);

  // Report page: alive while on screen. Touch devices: alive in the middle of the screen.
  const ambient = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? wake : sleep)(e.target)), { threshold: 0.25 });
  const middle = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? wake : sleep)(e.target)), { rootMargin: '-30% 0px -30% 0px' });

  function attach(fig) {
    if (covers.has(fig)) return;
    const data = DATA[fig.dataset.reportCover];
    if (!data) return;
    covers.set(fig, { data, frames: null });
    if (reportPage) ambient.observe(fig);
    else if (hover) {
      const target = fig.closest('li, .reading-jacket, a') || fig;
      target.addEventListener('pointerenter', () => wake(fig));
      target.addEventListener('pointerleave', () => sleep(fig));
    } else middle.observe(fig);
  }
  const scan = () => document.querySelectorAll('.research-cover[data-report-cover]').forEach(attach);
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
  reduced.addEventListener?.('change', () => { if (reduced.matches) [...covers.keys()].forEach(sleep); });
})();
