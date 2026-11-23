'use strict';
// Dry-media engine: toned paper with real tooth, and tools that deposit pigment
// only where the paper's peaks catch it (pressure decides how deep it reaches).

const W = +process.env.ART_W || 2560, H = +process.env.ART_H || 1440, N = W * H;   // portrait pieces set ART_W/ART_H

// ---------------------------------------------------------------- random + math
let _s = 20261116 | 0;
function seedRng(s) { _s = s | 0; }
function rnd() {
  _s = (_s + 0x6D2B79F5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const R = (a, b) => a + (b - a) * rnd();
function gauss() { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
function sstep(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function grad(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      return mix(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return stops[stops.length - 1][1];
}
function jit(c, j) {
  const d = (rnd() - 0.5) * 2 * j;
  return [clamp(c[0] + d + (rnd() - 0.5) * j * 0.7, 0, 1), clamp(c[1] + d + (rnd() - 0.5) * j * 0.7, 0, 1), clamp(c[2] + d + (rnd() - 0.5) * j * 0.7, 0, 1)];
}

function hash2(ix, iy, s) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vn(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
const vn1 = (x, s) => vn(x, 0.37, s);
function fbm1(x, s, oct, ridged) {
  let v = 0, a = 1, f = 1, t = 0;
  for (let o = 0; o < oct; o++) {
    let n = vn1(x * f, s + o * 31);
    n = n * (1 - ridged) + (1 - Math.abs(2 * n - 1)) * ridged;
    v += a * n; t += a; a *= 0.52; f *= 2.03;
  }
  return v / t;
}
function fbm2(x, y, s, oct) {
  let v = 0, a = 1, f = 1, t = 0;
  for (let o = 0; o < oct; o++) { v += a * vn(x * f, y * f, s + o * 17); t += a; a *= 0.5; f *= 2; }
  return v / t;
}

// ---------------------------------------------------------------- blur
function boxH(src, dst, r) {
  const inv = 1 / (2 * r + 1);
  for (let y = 0; y < H; y++) {
    const o = y * W; let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[o + clamp(k, 0, W - 1)];
    for (let x = 0; x < W; x++) {
      dst[o + x] = acc * inv;
      const xa = x + r + 1, xr = x - r;
      acc += src[o + (xa > W - 1 ? W - 1 : xa)] - src[o + (xr < 0 ? 0 : xr)];
    }
  }
}
function boxV(src, dst, r) {
  const inv = 1 / (2 * r + 1);
  for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[clamp(k, 0, H - 1) * W + x];
    for (let y = 0; y < H; y++) {
      dst[y * W + x] = acc * inv;
      const ya = y + r + 1, yr = y - r;
      acc += src[(ya > H - 1 ? H - 1 : ya) * W + x] - src[(yr < 0 ? 0 : yr) * W + x];
    }
  }
}
function smallKernel(src, dst, s, horiz) {
  const rad = Math.max(1, Math.ceil(s * 3)), k = [];
  let sum = 0;
  for (let i = -rad; i <= rad; i++) { const v = Math.exp(-(i * i) / (2 * s * s)); k.push(v); sum += v; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let i = -rad; i <= rad; i++) {
      const xx = horiz ? clamp(x + i, 0, W - 1) : x, yy = horiz ? y : clamp(y + i, 0, H - 1);
      acc += src[yy * W + xx] * k[i + rad];
    }
    dst[y * W + x] = acc;
  }
}
function blur(src, sx, sy) {
  let a = Float32Array.from(src), b = new Float32Array(N);
  const pass = (s, horiz) => {
    if (s <= 0.25) return;
    if (s < 2.5) { smallKernel(a, b, s, horiz); [a, b] = [b, a]; return; }
    const r = Math.max(1, Math.round((Math.sqrt(4 * s * s + 1) - 1) / 2));
    for (let p = 0; p < 3; p++) { horiz ? boxH(a, b, r) : boxV(a, b, r); [a, b] = [b, a]; }
  };
  pass(sx, true); pass(sy, false);
  return a;
}
function normalize(a) {
  let m = 0; for (let i = 0; i < N; i++) m += a[i]; m /= N;
  let v = 0; for (let i = 0; i < N; i++) v += (a[i] - m) ** 2; v = Math.sqrt(v / N) || 1;
  for (let i = 0; i < N; i++) a[i] = (a[i] - m) / v;
  return a;
}

// ---------------------------------------------------------------- canvas state
const Rb = new Float32Array(N), Gb = new Float32Array(N), Bb = new Float32Array(N);
const PR = new Float32Array(N), PG = new Float32Array(N), PB = new Float32Array(N);
let T = null, Tc = null;              // fine tooth, coarse tooth (charcoal)
let SR = null, SG = null, SB = null;  // smudge source (blurred copy)

function makePaper(hexBase) {
  const t0 = Date.now();
  const white = () => { const a = new Float32Array(N); for (let i = 0; i < N; i++) a[i] = rnd(); return a; };
  const n1 = normalize(blur(white(), 0.65, 0.65));
  const n2 = normalize(blur(white(), 1.7, 1.7));
  const n3 = normalize(blur(white(), 4.5, 4.5));
  // fibres: short curled strands pressed into the sheet
  const F = new Float32Array(N);
  for (let f = 0, nf = Math.round(9000 * N / 3686400); f < nf; f++) {   // same fibre density at any size
    let x = R(0, W), y = R(0, H), a = R(0, Math.PI * 2);
    const len = R(5, 34), v = rnd() < 0.7 ? -1 : 0.7, curl = R(-0.12, 0.12);
    for (let s = 0; s < len; s += 0.7) {
      const xi = x | 0, yi = y | 0;
      if (xi >= 0 && xi < W && yi >= 0 && yi < H) F[yi * W + xi] += v;
      x += Math.cos(a) * 0.7; y += Math.sin(a) * 0.7; a += curl;
    }
  }
  const Fb = blur(F, 0.6, 0.6);
  T = new Float32Array(N);
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
    const laid = Math.sin((y + 3 * vn(x / 160, y / 160, 9)) * (2 * Math.PI / 6.3));   // laid lines (Ingres-like)
    const chain = Math.exp(-((((x + 40) % 94) - 47) ** 2) / 10);                         // faint chain lines
    T[i] = 0.52 * n1[i] + 0.36 * n2[i] + 0.22 * n3[i] + 0.55 * Fb[i] + 0.20 * laid - 0.12 * chain;
  }
  normalize(T);
  for (let i = 0; i < N; i++) T[i] = clamp(0.5 + 0.18 * T[i], 0, 1);
  Tc = normalize(blur(T, 1.4, 1.4));
  for (let i = 0; i < N; i++) Tc[i] = clamp(0.5 + 0.19 * Tc[i], 0, 1);
  // paper colour with mottling
  const base = hex(hexBase);
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
    const m = fbm2(x / 380, y / 380, 3, 3) - 0.5, m2 = fbm2(x / 60, y / 60, 5, 2) - 0.5;
    const k = 1 + 0.10 * m + 0.04 * m2 + 0.05 * (T[i] - 0.5);
    PR[i] = base[0] * k; PG[i] = base[1] * k * (1 + 0.02 * m); PB[i] = base[2] * k;
    Rb[i] = PR[i]; Gb[i] = PG[i]; Bb[i] = PB[i];
  }
  console.log('paper', Date.now() - t0, 'ms');
}

function prepSmudge(sx, sy) { SR = blur(Rb, sx, sy); SG = blur(Gb, sx, sy); SB = blur(Bb, sx, sy); }

// ---------------------------------------------------------------- stamping
// mode 0: deposit colour through the tooth; 1: smudge toward blurred copy; 2: lift toward paper
function stamp(cx, cy, tx, ty, hl, hw, P, cr, cg, cb, o, streak, smax) {
  const ex = Math.abs(tx) * hl + Math.abs(ty) * hw, ey = Math.abs(ty) * hl + Math.abs(tx) * hw;
  const x0 = Math.max(0, Math.floor(cx - ex)), x1 = Math.min(W - 1, Math.ceil(cx + ex));
  const y0 = Math.max(0, Math.floor(cy - ey)), y1 = Math.min(H - 1, Math.ceil(cy + ey));
  if (x0 > x1 || y0 > y1) return;
  const tooth = o.tooth, tw = o.tw, inv2w = 1 / (2 * tw), opac = o.opac, edge = o.edge, ie = 1 / (1 - edge + 1e-6);
  const mode = o.mode | 0, top = o.top, topOff = o.topOff || 0, bot = o.bot, botOff = o.botOff || 0, clip = o.clip, mask = o.mask;
  const ihl = 1 / hl, ihw = 1 / hw;
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const a = dx * tx + dy * ty; if (a > hl || a < -hl) continue;
      const b = -dx * ty + dy * tx; if (b > hw || b < -hw) continue;
      let fa = a * ihl; fa = 1 - fa * fa;
      const fb = (b < 0 ? -b : b) * ihw;
      let pb = 1; if (fb > edge) { const t = 1 - (fb - edge) * ie; pb = t * t * (3 - 2 * t); }
      let p = P * fa * pb;
      if (streak) p *= streak[(b + smax) | 0];
      if (top) { const d = top[x] + topOff - y; if (d > 0) { if (d >= 1.3) continue; p *= 1 - d / 1.3; } }
      if (bot) { const d = y - (bot[x] + botOff); if (d > 0) { if (d >= 1.3) continue; p *= 1 - d / 1.3; } }
      if (clip) { const c = clip(x, y); if (c <= 0) continue; p *= c; }
      const i = y * W + x;
      if (mask) p *= mask[i];
      if (p <= 0.004) continue;
      let al;
      if (mode === 0) {
        let h = (tooth[i] - (1 - p)) * inv2w + 0.5;
        if (h <= 0) continue;
        h = h >= 1 ? 1 : h * h * (3 - 2 * h);
        al = h * opac;
        Rb[i] += (cr - Rb[i]) * al; Gb[i] += (cg - Gb[i]) * al; Bb[i] += (cb - Bb[i]) * al;
      } else if (mode === 1) {
        al = p * opac;
        Rb[i] += (SR[i] - Rb[i]) * al; Gb[i] += (SG[i] - Gb[i]) * al; Bb[i] += (SB[i] - Bb[i]) * al;
      } else {
        al = p * opac * (0.55 + 0.9 * (tooth[i] - 0.5));   // kneaded eraser lifts the peaks first
        if (al <= 0) continue;
        Rb[i] += (PR[i] - Rb[i]) * al; Gb[i] += (PG[i] - Gb[i]) * al; Bb[i] += (PB[i] - Bb[i]) * al;
      }
    }
  }
}

function dot(cx, cy, r, P, col, o) {
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
  const tooth = o.tooth, inv2w = 1 / (2 * o.tw), ir2 = 1 / (r * r);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d2 = ((x - cx) ** 2 + (y - cy) ** 2) * ir2; if (d2 > 1) continue;
    const p = P * (1 - d2), i = y * W + x;
    let h = (tooth[i] - (1 - p)) * inv2w + 0.5; if (h <= 0) continue;
    h = h >= 1 ? 1 : h * h * (3 - 2 * h);
    const al = h * o.opac;
    Rb[i] += (col[0] - Rb[i]) * al; Gb[i] += (col[1] - Gb[i]) * al; Bb[i] += (col[2] - Bb[i]) * al;
  }
}

// ---------------------------------------------------------------- strokes
function spline(ctrl) {
  const out = [], n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(2, Math.ceil(L / 3));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(ctrl[n - 1]);
  return out;
}

function stroke(ctrl, o) {
  const pts = spline(ctrl);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1];
  if (L < 0.5) return;
  const w = o.w, sp = o.spacing || Math.max(0.7, w * 0.26);
  const seed = (rnd() * 1e6) | 0;
  const smax = Math.ceil(w * 0.8) + 2;
  let streak = null;
  if (o.streak > 0) {
    streak = new Float32Array(2 * smax + 3);
    for (let k = 0; k < streak.length; k++) {
      const v = 0.6 * vn1(k * o.sfreq, seed) + 0.4 * vn1(k * o.sfreq * 3.1, seed + 1);
      streak[k] = clamp(1 - o.streak * (1 - v * 1.5), 0, 1);
    }
  }
  const jc = o.jit ? [(rnd() - 0.5) * 2 * o.jit, (rnd() - 0.5) * 2 * o.jit, (rnd() - 0.5) * 2 * o.jit] : [0, 0, 0];
  const jl = o.jit ? (rnd() - 0.5) * 2 * o.jit : 0;
  const wob = o.wob || 0, trem = o.trem || 0, pv = o.pv || 0, pf = o.pfreq || 40;
  const tin = o.tin || 0.08, tout = o.tout || 0.1, wEnd = o.wEnd == null ? 1 : o.wEnd;
  let idx = 0;
  for (let s = 0; s <= L; s += sp) {
    while (idx < cum.length - 2 && cum[idx + 1] < s) idx++;
    const seg = cum[idx + 1] - cum[idx] || 1, f = (s - cum[idx]) / seg;
    let x = lerp(pts[idx][0], pts[idx + 1][0], f), y = lerp(pts[idx][1], pts[idx + 1][1], f);
    let tx = pts[idx + 1][0] - pts[idx][0], ty = pts[idx + 1][1] - pts[idx][1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const u = s / L;
    const d = wob * (vn1(s / 70, seed + 7) - 0.5) * 2 + trem * (vn1(s / 5.5, seed + 9) - 0.5) * 2;
    x += -ty * d; y += tx * d;
    const taper = sstep(0, tin, u) * sstep(0, tout, 1 - u);
    let P = o.p * lerp(o.attack ? 1.15 : 1, 1, u) * lerp(0.35, 1, taper) * (1 - pv + pv * 2 * vn1(s / pf, seed + 3));
    let wd = w * lerp(0.55, 1, taper) * (0.86 + 0.28 * vn1(s / 45, seed + 5)) * lerp(1, wEnd, u);
    if (wd < 0.6) wd = 0.6;
    let c = o.colFn ? o.colFn(x, y) : o.col;
    if (!c) c = [0, 0, 0];
    const cr = clamp(c[0] + jc[0] + jl, 0, 1), cg = clamp(c[1] + jc[1] + jl, 0, 1), cb = clamp(c[2] + jc[2] + jl, 0, 1);
    stamp(x, y, tx, ty, sp * 0.85 + 0.45, wd / 2, P, cr, cg, cb, o, streak, smax);
  }
}

function line2(x0, y0, x1, y1, bend) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, l = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / l, ny = (x1 - x0) / l;
  return [[x0, y0], [mx + nx * bend, my + ny * bend], [x1, y1]];
}
function dirStroke(cx, cy, ang, len, bend) {
  const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
  return line2(cx - dx, cy - dy, cx + dx, cy + dy, bend);
}
function arcPts(cx, cy, r, a0, a1, n) {
  const p = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p;
}

// ---------------------------------------------------------------- tools (the chosen dry media)
const tools = () => ({
  PASTEL:   { mode: 0, tooth: T,  tw: 0.12, opac: 0.50, edge: 0.45, streak: 0.55, sfreq: 0.32, wob: 3,   trem: 0.6,  pv: 0.30, pfreq: 45, tin: 0.10, tout: 0.14 },
  CHARCOAL: { mode: 0, tooth: Tc, tw: 0.09, opac: 0.58, edge: 0.30, streak: 0.80, sfreq: 0.55, wob: 2.5, trem: 0.8,  pv: 0.40, pfreq: 30, tin: 0.06, tout: 0.18 },
  PENCIL:   { mode: 0, tooth: T,  tw: 0.15, opac: 0.55, edge: 0.15, streak: 0,    wob: 1.4, trem: 0.45, pv: 0.45, pfreq: 22, tin: 0.05, tout: 0.18 },
  CHALK:    { mode: 0, tooth: T,  tw: 0.07, opac: 0.80, edge: 0.35, streak: 0.45, sfreq: 0.5,  wob: 1.8, trem: 0.5,  pv: 0.35, pfreq: 30, tin: 0.06, tout: 0.12 },
  SMUDGE:   { mode: 1, tooth: T,  tw: 0.1,  opac: 0.45, edge: 0.20, streak: 0.25, sfreq: 0.2,  wob: 4,   trem: 0.3,  pv: 0.30, pfreq: 60, tin: 0.15, tout: 0.2 },
  LIFT:     { mode: 2, tooth: T,  tw: 0.1,  opac: 0.35, edge: 0.30, streak: 0.4,  sfreq: 0.4,  wob: 2,   trem: 0.3,  pv: 0.30, pfreq: 40, tin: 0.1,  tout: 0.15 },
});

module.exports = {
  W, H, N, seedRng, rnd, R, gauss, clamp, lerp, sstep, hex, mix, grad, jit, vn, vn1, fbm1, fbm2, blur, normalize,
  Rb, Gb, Bb, PR, PG, PB, makePaper, prepSmudge, stamp, dot, stroke, line2, dirStroke, arcPts, tools,
  get T() { return T; }, get Tc() { return Tc; },
};
