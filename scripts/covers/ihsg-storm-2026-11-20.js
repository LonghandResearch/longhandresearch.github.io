'use strict';
// "Storm over the pit": cover for the Longhand IHSG weekly of 16 to 20 November 2026, drawn with the dry-media
// engine of the Moonlit beach wallpaper: soft pastel, charcoal, graphite and chalk on warm grey paper.
// A storm rolls in from the left and rain falls on a terraced gold and copper pit, where a haul truck works with
// its lights on. Far off on the right the clouds break, and late sun falls on a city with twin towers.
// The week in one picture: the world's sell-off broke over the miners, and the big banks stood in the light.
// No lettering. Layout in 1024 x 1536 design units, rendered at ART_W x ART_H (2048 x 3072 by default).
process.env.ART_W = process.env.ART_W || '2048';
process.env.ART_H = process.env.ART_H || '3072';
const E = require('./pastel-engine');
const { W: RW, H: RH, N, R, rnd, clamp, lerp, sstep, hex, mix, grad, vn, vn1, fbm1, fbm2, blur, Rb, Gb, Bb, PR, PG, PB, line2, dirStroke, arcPts } = E;
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const W = 1024, H = 1536, K = RW / W;

const t0 = Date.now();
const lap = (m) => console.log(m.padEnd(18), ((Date.now() - t0) / 1000).toFixed(1) + 's');

E.seedRng(2011);
E.makePaper('#2b2830');
const { PASTEL, CHARCOAL, PENCIL, CHALK, SMUDGE, LIFT } = E.tools();
const T = E.T;

// ---------------------------------------------------------------- scaling layer
function so(o) {
  const r = { ...o, w: o.w * K };
  if (o.wob) r.wob = o.wob * K;
  if (o.trem) r.trem = o.trem * K;
  if (o.spacing) r.spacing = o.spacing * K;
  if (o.sfreq) r.sfreq = o.sfreq / K;
  if (o.pfreq) r.pfreq = o.pfreq * K;
  if (o.clip) { const c = o.clip; r.clip = (x, y) => c(x / K, y / K); }
  if (o.colFn) { const f = o.colFn; r.colFn = (x, y) => f(x / K, y / K); }
  return r;
}
const stroke = (ctrl, o) => E.stroke(ctrl.map(([x, y]) => [x * K, y * K]), so(o));
const dot = (x, y, r, P, col, o) => E.dot(x * K, y * K, r * K, P, col, o);
const prepSmudge = (sx, sy) => E.prepSmudge(sx * K, sy * K);
function eachPx(x0, x1, y0, y1, fn) {
  const X0 = Math.max(0, Math.floor(x0 * K)), X1 = Math.min(RW - 1, Math.ceil(x1 * K));
  const Y0 = Math.max(0, Math.floor(y0 * K)), Y1 = Math.min(RH - 1, Math.ceil(y1 * K));
  for (let y = Y0; y <= Y1; y++) { const vy = y / K; for (let x = X0; x <= X1; x++) fn(x / K, vy, y * RW + x); }
}
const pxAt = (x, y) => clamp((y * K) | 0, 0, RH - 1) * RW + clamp((x * K) | 0, 0, RW - 1);

// ---------------------------------------------------------------- composition and palette
const HY = 990;                       // far horizon
const SX = 860, SY = 690;             // where the sun breaks through
const PX = 330, PY0 = 1340, NB = 9;   // the pit: centre x, rim centre y, benches
const C = {
  stormTop: hex('#1b1f2e'), storm: hex('#2c3045'), stormLow: hex('#454860'), slate: hex('#5d6580'),
  clear: hex('#7f8fb0'), gold: hex('#f2b45c'), goldHi: hex('#ffd99a'), peach: hex('#e8956c'), rose: hex('#c77a7c'),
  rimLit: hex('#f7c98a'), rain: hex('#aab6cf'), charcoal: hex('#0c0d14'), ink: hex('#15161f'),
  cityShade: hex('#3a3d58'), cityLit: hex('#e2a768'), winWarm: hex('#ffd89c'),
  field: hex('#4d5a4c'), fieldLit: hex('#9c9a5c'),
  rust: hex('#8a4f3b'), ochre: hex('#a67c4e'), umber: hex('#5e4636'), sand: hex('#b8946a'), face: hex('#2e2229'),
  puddle: hex('#6f8a96'), truck: hex('#f0b42a'), lamp: hex('#fff0c4'),
};
// cloud density: heavy on the left and top, opening toward the sun on the right
function cloudD(x, y) {
  const n = fbm2(x / 230, y / 140, 41, 5);
  const left = 1 - sstep(0.45, 0.95, x / W);
  const open = Math.exp(-(((x - SX) / 210) ** 2 + ((y - SY) / 170) ** 2));
  const env = sstep(HY - 40, HY - 360, y) * 0.55 + 0.45;
  return clamp((n - 0.42) * 2.2 + left * 0.55 * env + 0.2 - open * 1.4, 0, 1);
}
function skyCol(x, y) {
  const v = clamp(y / HY, 0, 1);
  let clear = grad([[0, C.storm], [0.5, C.slate], [0.8, C.clear], [1, C.peach]], v);
  clear = mix(clear, mix(C.gold, C.goldHi, 0.4), 0.85 * Math.exp(-((Math.hypot(x - SX, y - SY) / 170) ** 2)));
  clear = mix(clear, C.peach, 0.45 * sstep(0.7, 1, v) * sstep(0.4, 1, x / W));
  const d = cloudD(x, y);
  let cloud = grad([[0, C.stormTop], [0.6, C.storm], [1, C.stormLow]], v);
  const rim = Math.exp(-((Math.hypot(x - SX, y - SY) / 300) ** 2)) * sstep(0.2, 0.55, d) * (1 - sstep(0.55, 0.95, d));
  cloud = mix(cloud, C.rimLit, 0.75 * rim);
  return mix(clear, cloud, sstep(0.15, 0.85, d));
}

// ================================================================ 1. SKY: rubbed ground, broad bands, smudge, billows
eachPx(0, W, 0, HY + 20, (x, y, i) => {
  const c = skyCol(x, y), al = clamp(0.62 + 1.1 * (T[i] - 0.35), 0, 0.97);
  Rb[i] = lerp(PR[i], c[0], al); Gb[i] = lerp(PG[i], c[1], al); Bb[i] = lerp(PB[i], c[2], al);
});
for (let y = -20; y < HY + 20; y += R(11, 16)) for (let x = -120; x < W + 120;) {
  const len = R(140, 320);
  stroke(dirStroke(x + len / 2, y + R(-5, 5), R(-0.16, 0.06), len, R(-14, 14)), { ...PASTEL, w: R(28, 46), p: R(0.78, 0.92), opac: 0.55, colFn: skyCol, jit: 0.02 });
  x += len * R(0.45, 0.7);
}
prepSmudge(12, 7);
for (let k = 0; k < 900; k++) { const x = R(-60, W + 60), y = R(-20, HY); stroke(dirStroke(x, y, R(-0.3, 0.2), R(90, 240), R(-14, 14)), { ...SMUDGE, w: R(40, 70), p: 0.9, opac: R(0.35, 0.55) }); }
// billows: curled strokes, lit on top near the sun, dark underneath
for (let k = 0; k < 1100; k++) {
  const x = R(-40, W + 40), y = R(-10, HY - 60), d = cloudD(x, y);
  if (d < 0.25 || rnd() > d) continue;
  const r = R(34, 96), a0 = R(Math.PI * 1.05, Math.PI * 1.55), lit = Math.exp(-((Math.hypot(x - SX, y - SY) / 360) ** 2));
  const top = mix(mix(C.storm, C.stormLow, 0.6), C.rimLit, 0.85 * lit), under = mix(C.stormTop, C.ink, 0.3);
  stroke(arcPts(x, y, r, a0, a0 + R(0.9, 1.6), 10), { ...PASTEL, w: R(14, 30), p: R(0.3, 0.5) * (0.6 + 0.4 * lit), opac: 0.45, col: rnd() < 0.55 ? top : under, jit: 0.015 });
}
prepSmudge(9, 9);
for (let k = 0; k < 1400; k++) { const x = R(0, W), y = R(0, HY); if (cloudD(x, y) < 0.2) continue; const a0 = R(0, Math.PI * 2); stroke(arcPts(x, y, R(24, 70), a0, a0 + R(0.8, 1.8), 10), { ...SMUDGE, w: R(28, 52), p: 0.9, opac: 0.55 }); }
// the bright break: a warm glow, a sun half hidden by cloud, and lit cloud edges
for (let k = 0; k < 220; k++) {
  const r = 20 + 230 * Math.pow(rnd(), 1.4), a0 = R(0, Math.PI * 2);
  stroke(arcPts(SX, SY, r, a0, a0 + R(0.4, 1.3), 6), { ...PASTEL, w: 12 + r * 0.1, p: 0.18 + 0.55 * Math.exp(-r / 120), opac: 0.42, col: r < 70 ? C.goldHi : mix(C.gold, C.peach, 0.4), jit: 0.015, streak: 0.4 });
}
prepSmudge(14, 14);
for (let k = 0; k < 140; k++) { const r = 10 + 220 * Math.pow(rnd(), 1.3), a0 = R(0, Math.PI * 2); stroke(arcPts(SX, SY, r, a0, a0 + R(0.8, 2), 10), { ...SMUDGE, w: 30 + r * 0.12, p: 0.95, opac: 0.6 }); }
for (let k = 0; k < 260; k++) {
  const a = R(0, Math.PI * 2), rr = 26 * Math.sqrt(rnd()), x = SX + Math.cos(a) * rr, y = SY + Math.sin(a) * rr;
  if (cloudD(x, y) > 0.45) continue;
  stroke(dirStroke(x, y, R(0, Math.PI), R(8, 22), 0), { ...CHALK, w: R(5, 10), p: 0.95, opac: 0.8, col: mix(C.goldHi, hex('#fff6e2'), 0.6) });
}
for (let k = 0; k < 700; k++) {
  const x = R(SX - 380, SX + 220), y = R(SY - 300, SY + 220), d = cloudD(x, y);
  if (d < 0.3 || d > 0.7) continue;
  const lit = Math.exp(-((Math.hypot(x - SX, y - SY) / 260) ** 2));
  stroke(dirStroke(x, y, R(-0.4, 0.3), R(10, 30), R(-3, 3)), { ...CHALK, w: R(2, 5), p: R(0.35, 0.7) * lit, opac: 0.6, col: mix(C.rimLit, C.goldHi, 0.5) });
}
lap('sky');

// rays: wide soft bands from the break down to the city, lighter where they fall
for (let k = 0; k < 9; k++) {
  const ang = R(1.95, 2.55), len = R(260, 420), w0 = R(18, 40);
  for (let s = 0; s < 6; s++) {
    const d0 = 30 + s * len / 6, d1 = d0 + len / 6;
    stroke([[SX + Math.cos(ang) * d0, SY + Math.sin(ang) * d0], [SX + Math.cos(ang) * d1, SY + Math.sin(ang) * d1]], { ...PASTEL, w: w0 * (1 + s * 0.35), p: 0.22 * (1 - s / 7), opac: 0.35, col: mix(C.goldHi, C.peach, 0.3), streak: 0.2, wob: 1, trem: 0.3 });
  }
}
prepSmudge(10, 10);
for (let k = 0; k < 120; k++) { const ang = R(1.95, 2.55), d = R(40, 420); stroke(dirStroke(SX + Math.cos(ang) * d, SY + Math.sin(ang) * d, ang, R(60, 140), 0), { ...SMUDGE, w: R(20, 40), p: 0.9, opac: 0.45 }); }
lap('rays');

// ================================================================ 2. FAR LAND AND THE CITY IN THE SUN
eachPx(0, W, HY - 6, HY + 44, (x, y, i) => {
  const lit = sstep(0.35, 0.85, x / W), c = mix(mix(C.field, hex('#3a4140'), 0.5), C.fieldLit, 0.55 * lit * sstep(HY + 60, HY, y));
  const al = clamp(0.6 + 1.1 * (T[i] - 0.35), 0, 0.96);
  Rb[i] = lerp(PR[i], c[0], al); Gb[i] = lerp(PG[i], c[1], al); Bb[i] = lerp(PB[i], c[2], al);
});
for (let y = HY - 4; y < HY + 44; y += 4) for (let x = -40; x < W + 40;) { const len = R(60, 160); stroke(dirStroke(x + len / 2, y, R(-0.03, 0.03), len, R(-2, 2)), { ...PASTEL, w: R(6, 10), p: R(0.55, 0.8), opac: 0.5, col: mix(mix(C.field, hex('#3a4140'), 0.4), C.fieldLit, 0.6 * sstep(0.35, 0.85, (x + len / 2) / W)), jit: 0.03 }); x += len * R(0.6, 0.9); }
for (let x = -10; x < W + 10; x += R(3, 7)) {
  const lit = sstep(0.4, 0.9, x / W), h = R(4, 12) * (x < 500 ? 1 : 0.7);
  for (let k = 0; k < 3; k++) dot(x + R(-3, 3), HY + 2 - R(0, h), R(3, 6), R(0.6, 0.85), jit(mix(hex('#233028'), hex('#7d7a46'), 0.6 * lit), 0.03), PASTEL);
}
const blds = [];
for (let x = 520; x < 960;) { const w = R(16, 36), top = HY - R(40, 110) * (1 - Math.abs(x - 720) / 420); blds.push([x, top, x + w]); x += w + R(-2, 3); }
const TOWERS = [[650, 806, 694], [706, 814, 750]];
function building(x0, top, x1, dark) {
  const lit = (x) => sstep(x0 + (x1 - x0) * 0.4, x1, x);
  const colFn = (x, y) => mix(mix(C.cityShade, C.cityLit, 0.85 * lit(x)), C.charcoal, 0.25 * sstep(top, HY + 6, y));
  const clip = (x, y) => (x >= x0 && x <= x1 && y >= top && y <= HY + 6 ? 1 : 0);
  for (let x = x0 - 1; x < x1 + 1; x += 1.6) stroke(line2(x, top - 2, x + R(-0.5, 0.5), HY + 6, 0), { ...PASTEL, w: R(3, 4.5), p: R(0.86, 0.98), opac: 0.62, colFn, clip, jit: 0.01 });
  stroke(line2(x1, top + 1, x1, HY, 0), { ...CHALK, w: 1.4, p: 0.55, opac: 0.6, col: C.goldHi });
  stroke(line2(x0, top, x1, top, 0), { ...PENCIL, w: 1.1, p: 0.5, opac: 0.55, col: mix(C.cityLit, C.goldHi, 0.5) });
  for (let y = top + 6; y < HY - 3; y += dark ? 7.5 : 9) for (let x = x0 + 3.5; x < x1 - 2.5; x += dark ? 5.5 : 6.5) if (rnd() < (x > (x0 + x1) / 2 ? 0.45 : 0.18)) dot(x, y, R(0.9, 1.3), R(0.7, 0.9), x > (x0 + x1) / 2 ? C.goldHi : C.winWarm, CHALK);
}
for (const [x0, top, x1] of blds) building(x0, top, x1, false);
for (const [x0, top, x1] of TOWERS) building(x0, top, x1, true);
building(692, 900, 708, false);
lap('city');

// ================================================================ 3. THE PIT, under the rain
const benches = [];
for (let i = 0; i <= NB; i++) { const rx = 540 - i * 46 - (i % 3) * 4; benches.push({ rx, ry: rx * 0.38, cy: PY0 + i * 13 }); }
const inB = (x, y, b, pad = 0) => { const dx = (x - PX) / (b.rx + pad), dy = (y - b.cy) / (b.ry + pad * 0.4); return dx * dx + dy * dy <= 1; };
// ground around the pit (near rim), wet and dark, catching some gold on the right
eachPx(0, W, HY + 36, H, (x, y, i) => {
  const lit = sstep(0.45, 1, x / W) * 0.6, c = mix(mix(C.umber, hex('#38323a'), 0.4), C.ochre, lit * sstep(HY + 80, H, y) * 0.5);
  const al = clamp(0.6 + 1.1 * (T[i] - 0.35), 0, 0.96);
  Rb[i] = lerp(PR[i], c[0], al); Gb[i] = lerp(PG[i], c[1], al); Bb[i] = lerp(PB[i], c[2], al);
});
for (let y = HY + 36; y < H + 10; y += R(5, 8)) for (let x = -60; x < W + 60;) { const len = R(80, 200); const lit = sstep(0.45, 1, (x + len / 2) / W); stroke(dirStroke(x + len / 2, y, R(-0.04, 0.04), len, R(-3, 3)), { ...PASTEL, w: R(8, 14), p: R(0.55, 0.78), opac: 0.5, col: jit(mix(mix(C.umber, hex('#3b3440'), 0.35), C.ochre, 0.45 * lit), 0.03) }); x += len * R(0.6, 0.9); }
function jit(c, j) { return E.jit(c, j); }
// broad patches of wet earth, rust and grey, so the ground is not one flat colour
for (let k = 0; k < 260; k++) {
  const x = R(-40, W + 40), y = R(HY + 50, H + 10), lit = sstep(0.45, 1, x / W);
  const col = [C.rust, C.ochre, hex('#4a4652'), C.umber, hex('#6b5a4a')][(rnd() * 5) | 0];
  stroke(dirStroke(x, y, R(-0.06, 0.06), R(80, 220), R(-4, 4)), { ...PASTEL, w: R(18, 40), p: R(0.28, 0.45), opac: 0.45, col: jit(mix(col, C.gold, 0.25 * lit), 0.03) });
}
prepSmudge(10, 4);
for (let k = 0; k < 220; k++) { const x = R(-40, W + 40), y = R(HY + 50, H); stroke(dirStroke(x, y, R(-0.05, 0.05), R(100, 260), 0), { ...SMUDGE, w: R(20, 40), p: 0.9, opac: 0.4 }); }
// tyre tracks curving in from the lower right toward the pit's rim road
for (const off of [-9, 9]) {
  const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) pts.push([lerp(1010, 640, t) + off * 0.3, lerp(1500, 1170, Math.pow(t, 0.8)) + off]);
  stroke(pts, { ...CHARCOAL, tooth: T, w: 3.2, p: 0.55, opac: 0.5, col: hex('#241c22'), wob: 1.2 });
  stroke(pts.map(([x, y]) => [x, y - 2.5]), { ...CHALK, w: 1.2, p: 0.35, opac: 0.5, col: mix(C.goldHi, C.rain, 0.4), wob: 1.2 });
}
// a site shed with a lit window and a lamp post near the rim
{
  const x0 = 700, y0 = 1118, x1 = 760, y1 = 1150;
  for (let y = y0; y < y1; y += 2) stroke(line2(x0, y, x1, y, 0), { ...PASTEL, w: 3.5, p: 0.85, opac: 0.7, col: jit(mix(hex('#6e7486'), C.gold, 0.35 * (y - y0) / (y1 - y0)), 0.02), clip: (x, yy) => (x >= x0 && x <= x1 && yy >= y0 && yy <= y1 ? 1 : 0) });
  for (let y = y0 - 9; y < y0; y += 2) stroke(line2(x0 - 4 + (y0 - y) * 0.3, y, x1 + 4 - (y0 - y) * 0.3, y, 0), { ...PASTEL, w: 3, p: 0.8, opac: 0.7, col: hex('#3a3442') });
  dot(718, 1132, 4.5, 0.95, C.winWarm, CHALK); dot(742, 1132, 4.5, 0.95, C.winWarm, CHALK);
  stroke(line2(790, 1152, 790, 1090, 0), { ...PENCIL, w: 1.6, p: 0.7, opac: 0.7, col: C.ink });
  for (let r = 22; r > 0; r -= 3) dot(790, 1088, r, 0.1, C.lamp, PASTEL);
  dot(790, 1088, 2.4, 0.98, C.lamp, CHALK);
}
const topCols = [C.sand, C.ochre, C.rust, C.ochre, C.umber, C.rust, C.ochre, C.umber, C.rust];
for (let i = 0; i < NB; i++) {
  const b = benches[i], nb = benches[i + 1], col = topCols[i];
  const clip = (x, y) => (inB(x, y, b) && !inB(x, y, nb) ? 1 : 0);
  const colFn = (x, y) => { const lit = sstep(PX - b.rx * 0.2, PX + b.rx, x) * 0.55; return mix(mix(mix(col, hex('#4c4d5e'), 0.2), hex('#241f2a'), 0.5 * i / NB), C.gold, 0.36 * lit * (1 - 0.5 * i / NB)); };
  for (let k = 0; k < 560; k++) {
    const a = R(Math.PI * 0.97, Math.PI * 2.03), rr = R(0.55, 1.02), x = PX + Math.cos(a) * b.rx * rr, y = b.cy + Math.sin(a) * b.ry * rr;
    stroke(dirStroke(x, y, Math.atan2(Math.cos(a) * b.ry, -Math.sin(a) * b.rx), R(22, 50), R(-2, 2)), { ...PASTEL, w: R(6, 10), p: R(0.6, 0.82), opac: 0.55, colFn, clip, jit: 0.025 });
  }
  const faceClip = (x, y) => (y < nb.cy + nb.ry * 0.2 && inB(x, y, nb, 15) && !inB(x, y, nb) ? 1 : 0);
  for (let k = 0; k < 260; k++) {
    const a = R(Math.PI, Math.PI * 2), x = PX + Math.cos(a) * (nb.rx + 7), y = nb.cy + Math.sin(a) * (nb.ry + 3);
    stroke(dirStroke(x, y, Math.atan2(Math.cos(a) * nb.ry, -Math.sin(a) * nb.rx), R(16, 38), 0), { ...CHARCOAL, tooth: T, w: R(6, 10), p: R(0.55, 0.8), opac: 0.6, col: jit(C.face, 0.03), clip: faceClip });
  }
  // wet edge: a thin warm highlight on the lip of each bench, stronger on the side toward the light
  for (let a = Math.PI * 1.02; a < Math.PI * 1.98; a += R(0.02, 0.05)) {
    const lit = sstep(Math.PI * 1.3, Math.PI * 1.95, a);
    if (rnd() > 0.25 + 0.6 * lit) continue;
    const x = PX + Math.cos(a) * (nb.rx + 15), y = nb.cy + Math.sin(a) * (nb.ry + 6);
    stroke(dirStroke(x, y, Math.atan2(Math.cos(a) * nb.ry, -Math.sin(a) * nb.rx), R(8, 22), 0), { ...CHALK, w: R(1.2, 2.2), p: R(0.3, 0.6) * (0.4 + lit), opac: 0.6, col: mix(C.goldHi, C.rain, 0.3 * (1 - lit)) });
  }
}
// the near wall: foreshortened and in shadow, with only faint bench hints, then the lit near rim
{
  const b0 = benches[0];
  const nearClip = (x, y) => (inB(x, y, b0) && y > b0.cy - 2 && !inB(x, y, benches[NB], 6) ? 1 : 0);
  for (let k = 0; k < 900; k++) {
    const a = R(0.02, Math.PI * 0.98), rr = R(0.2, 1.0), x = PX + Math.cos(a) * b0.rx * rr, y = b0.cy + Math.sin(a) * b0.ry * rr;
    stroke(dirStroke(x, y, Math.atan2(Math.cos(a) * b0.ry, -Math.sin(a) * b0.rx) + R(-0.1, 0.1), R(30, 70), R(-2, 2)), { ...PASTEL, w: R(8, 14), p: R(0.7, 0.9), opac: 0.6, col: jit(mix(hex('#2a2230'), C.umber, rnd() * 0.35), 0.02), clip: nearClip });
  }
  prepSmudge(6, 3);
  for (let k = 0; k < 260; k++) { const a = R(0.05, Math.PI * 0.95), rr = R(0.3, 1.0); stroke(dirStroke(PX + Math.cos(a) * b0.rx * rr, b0.cy + Math.sin(a) * b0.ry * rr, Math.atan2(Math.cos(a) * b0.ry, -Math.sin(a) * b0.rx), R(40, 90), 0), { ...SMUDGE, w: R(14, 26), p: 0.9, opac: 0.5, clip: nearClip }); }
  for (let a = 0.05; a < Math.PI * 0.95; a += R(0.012, 0.03)) {
    const lit = sstep(Math.PI * 0.75, 0.05, a), x = PX + Math.cos(a) * (b0.rx + 2), y = b0.cy + Math.sin(a) * (b0.ry + 2);
    stroke(dirStroke(x, y, Math.atan2(Math.cos(a) * b0.ry, -Math.sin(a) * b0.rx), R(10, 24), 0), { ...CHALK, w: R(1.6, 3), p: R(0.35, 0.65) * (0.35 + 0.65 * lit), opac: 0.6, col: mix(C.goldHi, C.rain, 0.5 * (1 - lit)) });
  }
}
// a pool of rainwater on the pit floor, reflecting the storm and a streak of gold
const fl = benches[NB];
eachPx(PX - fl.rx, PX + fl.rx, fl.cy - fl.ry, fl.cy + fl.ry, (x, y, i) => {
  if (!inB(x, y, fl)) return;
  const c = mix(mix(C.puddle, C.storm, 0.35), C.goldHi, 0.25 * Math.exp(-(((x - (PX + fl.rx * 0.35)) / 18) ** 2)));
  const al = clamp(0.6 + 1.0 * (T[i] - 0.35), 0, 0.95);
  Rb[i] = lerp(Rb[i], c[0], al); Gb[i] = lerp(Gb[i], c[1], al); Bb[i] = lerp(Bb[i], c[2], al);
});
for (let k = 0; k < 60; k++) { const x = PX + R(-fl.rx * 0.8, fl.rx * 0.8), y = fl.cy + R(-fl.ry * 0.6, fl.ry * 0.6); if (!inB(x, y, fl)) continue; stroke(dirStroke(x, y, 0, R(10, 26), 0), { ...CHALK, w: R(1.2, 2), p: 0.45, opac: 0.55, col: mix(C.rain, C.goldHi, rnd() * 0.5) }); }
// gold and copper glints on the benches, few and small in the rain
for (let k = 0; k < 220; k++) {
  const i = (rnd() * NB) | 0, b = benches[i], a = R(Math.PI * 1.02, Math.PI * 1.98), rr = R(0.8, 0.98);
  dot(PX + Math.cos(a) * b.rx * rr, b.cy + Math.sin(a) * b.ry * rr, R(0.6, 1.3), R(0.65, 0.9), rnd() < 0.6 ? C.gold : hex('#d9875a'), CHALK);
}
for (let k = 0; k < 46; k++) {
  const x = R(560, W - 20), y = R(HY + 70, H - 60), w = R(26, 80), h = w * 0.16, lit = sstep(560, W, x);
  if (inB(x, y, benches[0], 30)) continue;
  for (let j = 0; j < 7; j++) { const yy = y + R(-h, h) * 0.6; stroke(dirStroke(x + R(-w, w) * 0.3, yy, 0, w * R(0.6, 1), 0), { ...PASTEL, w: R(3, 6), p: R(0.55, 0.8), opac: 0.55, col: jit(mix(mix(C.slate, C.storm, 0.4), C.goldHi, 0.55 * lit * rnd()), 0.02) }); }
}
for (let k = 0; k < 90; k++) {
  const x = R(620, W + 20), y = R(HY + 70, H - 40), lit = sstep(620, W, x);
  if (inB(x, y, benches[0], 20)) continue;
  stroke(dirStroke(x, y, R(-0.03, 0.03), R(10, 46), 0), { ...CHALK, w: R(1.4, 3), p: R(0.3, 0.6) * lit, opac: 0.55, col: mix(C.goldHi, C.rain, rnd() * 0.4) });
}
lap('pit');

// the haul truck on the road up the left wall, lights on
{
  const b = benches[2], a = Math.PI * 1.34, tx = PX + Math.cos(a) * (b.rx - 14), ty = b.cy + Math.sin(a) * (b.ry - 8) - 14;
  const box = (x0, y0, x1, y1, col) => { for (let y = y0; y < y1; y += 2) stroke(line2(x0, y, x1, y, 0), { ...PASTEL, w: 3.5, p: 0.85, opac: 0.7, col: jit(col, 0.02), clip: (x, yy) => (x >= x0 && x <= x1 && yy >= y0 && yy <= y1 ? 1 : 0) }); };
  stroke(line2(tx - 4, ty + 21, tx + 58, ty + 21, 0), { ...CHARCOAL, tooth: T, w: 8, p: 0.55, opac: 0.45, col: C.ink });
  box(tx, ty, tx + 40, ty + 16, C.truck);
  box(tx + 41, ty - 7, tx + 56, ty + 16, mix(C.truck, C.gold, 0.3));
  stroke(line2(tx + 44, ty - 3, tx + 53, ty - 3, 0), { ...PENCIL, w: 3, p: 0.6, col: hex('#8fb0c4') });
  for (const wx of [tx + 9, tx + 31, tx + 50]) { dot(wx, ty + 18, 5, 0.95, C.ink, CHALK); dot(wx, ty + 18, 1.8, 0.9, hex('#77777d'), CHALK); }
  for (let k = 0; k < 26; k++) dot(tx + R(4, 36), ty - R(1, 8), R(1.4, 2.6), 0.9, rnd() < 0.55 ? C.gold : hex('#c9734a'), CHALK);
  // headlights: two small lamps and soft cones into the rain
  for (const ly of [ty + 5, ty + 11]) { dot(tx + 57, ly, 1.8, 0.98, C.lamp, CHALK); for (let s = 0; s < 14; s++) stroke(line2(tx + 58, ly, tx + 58 + R(60, 110), ly + R(-16, 22), 0), { ...PASTEL, w: R(5, 12), p: 0.12, opac: 0.35, col: C.lamp, tin: 0.05, tout: 0.6 }); }
}
lap('truck');

// ================================================================ 4. RAIN: a curtain under the heavy cloud, falling onto the pit
for (let k = 0; k < 4200; k++) {
  const x = R(-60, W * 0.72), yTop = R(380, 900), d = cloudD(x, yTop - 60);
  if (rnd() > d * 1.1) continue;
  const len = R(80, 260), ang = 1.38 + R(-0.03, 0.03);
  stroke(dirStroke(x + Math.cos(ang) * len / 2, yTop + Math.sin(ang) * len / 2, ang, len, R(-1, 1)), { ...(rnd() < 0.5 ? PENCIL : CHALK), w: R(0.9, 1.8), p: R(0.26, 0.46), opac: 0.5, col: mix(C.rain, C.slate, rnd() * 0.35), tin: 0.25, tout: 0.25 });
}
prepSmudge(2, 6);
for (let k = 0; k < 500; k++) { const x = R(-40, W * 0.7), y = R(420, 1250); stroke(dirStroke(x, y, 1.38, R(80, 200), 0), { ...SMUDGE, w: R(16, 30), p: 0.9, opac: 0.25 }); }
// splashes on the benches
for (let k = 0; k < 500; k++) {
  const i = (rnd() * NB) | 0, b = benches[i], a = R(Math.PI * 1.02, Math.PI * 1.7), rr = R(0.8, 1.0);
  const x = PX + Math.cos(a) * b.rx * rr, y = b.cy + Math.sin(a) * b.ry * rr;
  stroke(dirStroke(x, y, 0, R(2, 6), 0), { ...CHALK, w: 1, p: 0.4, opac: 0.5, col: C.rain });
}
lap('rain');

// ================================================================ 5. FRAMING, crumbs, paper relief, output
for (let k = 0; k < 900; k++) {
  const side = (rnd() * 4) | 0, depth = Math.pow(rnd(), 1.8) * 70;
  let x, y, ang;
  if (side === 0) { x = R(0, W); y = depth; ang = R(-0.25, 0.25); } else if (side === 1) { x = R(0, W); y = H - depth; ang = R(-0.25, 0.25); }
  else if (side === 2) { x = depth; y = R(0, H); ang = Math.PI / 2 + R(-0.25, 0.25); } else { x = W - depth; y = R(0, H); ang = Math.PI / 2 + R(-0.25, 0.25); }
  stroke(dirStroke(x, y, ang, R(30, 100), R(-4, 4)), { ...CHARCOAL, tooth: T, w: R(7, 17), p: R(0.14, 0.28) * (1 - depth / 90), opac: 0.38, col: mix(C.charcoal, C.stormTop, 0.5) });
}
prepSmudge(6, 6);
for (let k = 0; k < 160; k++) {
  const side = (rnd() * 4) | 0, depth = R(0, 22);
  const [x, y] = side === 0 ? [R(0, W), depth] : side === 1 ? [R(0, W), H - depth] : side === 2 ? [depth, R(0, H)] : [W - depth, R(0, H)];
  stroke(dirStroke(x, y, side < 2 ? 0 : Math.PI / 2, R(50, 130), R(-5, 5)), { ...SMUDGE, w: R(10, 20), p: 0.9, opac: 0.35 });
}
for (let k = 0; k < 1400; k++) {
  const x = R(0, W), y = R(0, H), i = pxAt(x, y);
  dot(x, y, R(0.4, 0.9), R(0.4, 0.75), [clamp(Rb[i] * 1.3 + 0.03, 0, 1), clamp(Gb[i] * 1.3 + 0.03, 0, 1), clamp(Bb[i] * 1.3 + 0.03, 0, 1)], CHALK);
}
lap('framing');
const out = new Uint8ClampedArray(N * 4);
for (let y = 0, i = 0; y < RH; y++) for (let x = 0; x < RW; x++, i++) {
  const a = T[Math.max(0, i - RW - 1)], b = T[Math.min(N - 1, i + RW + 1)];
  const k = (1 + 0.16 * (a - b) + 0.035 * (T[i] - 0.5)) * (1 + (vn(x * 0.9, y * 0.9, 401) - 0.5) * 0.03);
  out[i * 4] = Math.round(clamp(Rb[i] * k, 0, 1) * 255); out[i * 4 + 1] = Math.round(clamp(Gb[i] * k, 0, 1) * 255); out[i * 4 + 2] = Math.round(clamp(Bb[i] * k, 0, 1) * 255); out[i * 4 + 3] = 255;
}
(async () => {
  const cv = createCanvas(RW, RH), ctx = cv.getContext('2d');
  const img = ctx.createImageData(RW, RH); img.data.set(out); ctx.putImageData(img, 0, 0);
  const name = process.argv[2] || 'ihsg-storm';
  fs.writeFileSync(name + '.png', await cv.encode('png'));
  console.log(RW + 'x' + RH + ' written to ' + name + '.png');
  lap('done');
})();
