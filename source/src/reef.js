// ============================================================================
// reef meshes: massive and table corals, sea anemone, reef fish, reef shark, moray eel
// ============================================================================

// brain coral: a low lumpy dome; the meandering grooves are drawn by the shader (material 6)
function meshBrain() {
  rseed(230);
  return meshLathe([[0, 0, 0.3], [0.5, 0, 0.45], [0.72, 0.1, 0.75], [0.8, 0.28, 1], [0.74, 0.46, 1], [0.58, 0.62, 1], [0.34, 0.73, 1], [0.12, 0.77, 1], [0, 0.775, 1]], 26, 0.22);
}
// table coral (Acropora): a short stalk under a wide, thin, slightly dished plate (material 7)
function meshTable() {
  rseed(231);
  return meshLathe([[0, 0, 0.25], [0.11, 0, 0.35], [0.09, 0.22, 0.5], [0.13, 0.36, 0.7], [0.45, 0.43, 0.85], [0.85, 0.5, 1], [1.05, 0.56, 1], [1.08, 0.6, 1], [1.02, 0.63, 1], [0.7, 0.58, 1], [0.3, 0.55, 0.9], [0, 0.56, 0.9]], 32, 0.3);
}
// sea anemone (Heteractis magnifica): a low mound packed with ~420 short, fat tentacles with rounded tips, like a thick carpet;
// aux = (tentacle seed * 5 + ring along it) / 127, -0.5 the oral disc
// sea anemones, five kinds, each a near (lo = 0) and a far (lo = 1, few fat tentacles) version.
// aux: -0.5 for the disc / column, tentacles (seed * 5 + ring) / 127 so each sways on its own (vsAnem). Every tentacle has
// 5 points (ring 0 at the base .. 4 at the tip). Kinds: 0 magnificent (Heteractis), 1 carpet (Stichodactyla), 2 bubble-tip
// (Entacmaea), 3 long-tentacle sand anemone (Macrodactyla), 4 tube-dwelling anemone (Cerianthus, a tall tube)
function meshAnem(kind, lo) {
  rseed(232 + kind * 7);
  const m = new Mesh();
  const tent = (n, place, rad, sides) => {
    for (let i = 0; i < n; i++) { const t = place(i, n); if (t) m.tube(t.pts, (k) => t.r * rad[k], sides, true, ((sd) => (k) => (sd * 5 + k) / 127)(i % 25)); }
  };
  const lobe = (a) => 0.6 * sin(a * 9 + 0.7) + 0.4 * sin(a * 13 + 2.1) + 0.3 * sin(a * 4);
  // a flat disc of rings (wavy rim for the carpet)
  const disc = (R, y0, h, wav, nr = 4, ns = 24) => {
    const rows = [];
    for (let r = 0; r <= nr; r++) { const row = [], f = r / nr; for (let s = 0; s < ns; s++) { const a = s / ns * TAU, rr0 = R * f * (1 + wav * f * lobe(a) * 0.5);
      row.push(m.v(cos(a) * rr0, y0 + h * (1 - f * f) + wav * f * f * 0.25 * lobe(a + 0.4) * R, sin(a) * rr0, -0.5)); } rows.push(row); }
    for (let r = 0; r < nr; r++) for (let s = 0; s < ns; s++) { const s2 = (s + 1) % ns; m.quad(rows[r][s2], rows[r][s], rows[r + 1][s], rows[r + 1][s2]); }
  };
  const spiral = (i, n, R) => [i * 2.39996 + rr(-0.15, 0.15), R * 0.98 * sqrt((i + 0.5) / n)];
  const F = lo ? 4 : 1, S = lo ? 4 : 6; // far: a quarter of the tentacles, fatter
  if (kind === 0) {
    // magnificent (the violet hero): a short column whose rim carries thick, soft tentacles that rise and open outward
    // like a vase, with an open hollow in the middle where the clownfish sit
    const R = 0.42, H = 0.14;
    m.tube([[0, -0.03, 0], [0, H * 0.5, 0], [0, H, 0]], (k) => R * [0.95, 0.9, 1][k], lo ? 10 : 18, false, () => -0.5);
    disc(R, H, 0.03, 0, 2, lo ? 10 : 18);
    tent(lo ? 70 : 300, (i, n) => {
      const a = i * 2.39996 + rr(-0.1, 0.1), f = sqrt((i + 0.5) / n), r = 0.12 + 0.3 * f, tilt = 0.12 + 0.5 * f, L = rr(0.28, 0.42) * (1.1 - 0.25 * f), ph = rr(0, 6.3), w = rr(0.02, 0.04);
      const ox = cos(a), oz = sin(a), tx = -oz, tz = ox;
      return { r: rr(0.02, 0.026) * (lo ? 1.8 : 1), pts: [0, 0.3, 0.6, 0.85, 1].map((t) => { const o = sin(tilt) * L * t + 0.06 * t * t * f, h = cos(tilt) * L * t, c = w * sin(t * 4 + ph) * t;
        return [ox * (r + o) + tx * c, H + h, oz * (r + o) + tz * c]; }) };
    }, [1.05, 0.95, 0.9, 1, 0.85], lo ? 4 : 7);
  } else if (kind === 1) {
    // carpet (the blue hero): a broad, gently waved mat packed with short tentacles that end in small round beads
    const R = 0.62; disc(R, 0.03, 0.12, 0.45, 5, 64);
    tent(lo ? 200 : 800, (i, n) => {
      const [a, r] = spiral(i, n, R * 1.02), f = r / R, rr0 = r * (1 + 0.45 * f * lobe(a) * 0.5), y = 0.03 + 0.12 * (1 - f * f) + 0.45 * f * f * 0.25 * lobe(a + 0.4) * R;
      const L = rr(0.08, 0.12) * (lo ? 1.2 : 1), x = cos(a) * rr0, z = sin(a) * rr0, ph = rr(0, 6.3);
      return { r: rr(0.011, 0.013) * (lo ? 2 : 1), pts: [0, 0.3, 0.6, 0.85, 1].map((t) => [x + cos(a) * L * t * 0.35 + 0.012 * sin(ph + t * 3) * t, y + L * t, z + sin(a) * L * t * 0.35 + 0.012 * cos(ph + t * 3) * t]) };
    }, [1, 0.9, 0.85, 1.15, 0.95], lo ? 3 : 5);
  } else if (kind === 2) {
    // bubble-tip (the peach hero): a crown of long tentacles rising from the mouth, then bending over, each swollen
    // into a bulb just below its tip
    const R = 0.2; disc(R, 0.02, 0.06, 0, 2, 16);
    tent(lo ? 40 : 160, (i, n) => {
      const a = i * 2.39996 + rr(-0.1, 0.1), f = sqrt((i + 0.5) / n), r = 0.04 + 0.16 * f, L = rr(0.3, 0.42), sp = 0.35 + 0.55 * f, ph = rr(0, 6.3);
      const ox = cos(a), oz = sin(a), tx = -oz, tz = ox;
      return { r: rr(0.018, 0.022) * (lo ? 1.8 : 1), pts: [0, 0.3, 0.6, 0.85, 1].map((t) => { const q = t * 1.35, o = L * sp * (1 - cos(q)) * 0.9, h = L * sin(q) * 0.85, c = 0.03 * sin(ph + t * 3) * t;
        return [ox * (r + o) + tx * c, 0.05 + h, oz * (r + o) + tz * c]; }) };
    }, [1, 0.85, 1, 1.35, 0.95], lo ? 4 : 7);
  } else if (kind === 3) {
    // long-tentacle: the column buried in sand, long thin tentacles arching out and lying over the sand
    const R = 0.22; disc(R, 0.01, 0.05, 0, 2, 18);
    tent(lo ? 30 : 110, (i, n) => {
      const [a, r] = spiral(i, n, R), L = rr(0.45, 0.65), up = rr(0.6, 1.1);
      return { r: rr(0.011, 0.014) * (lo ? 1.7 : 1), pts: [0, 0.25, 0.5, 0.75, 1].map((t) => [cos(a) * (r + L * t * 0.9), 0.04 + up * L * t * (1 - t) * 0.9 + 0.02 * t, sin(a) * (r + L * t * 0.9)]) };
    }, [1, 0.85, 0.7, 0.55, 0.35], lo ? 3 : 4);
  } else {
    // tube-dwelling: a tall leathery tube, an outer crown of long drooping tentacles and an inner ring of short ones
    const H = 0.55, Rt = 0.065, ns = lo ? 8 : 12;
    m.tube([[0, -0.05, 0], [0.01, H * 0.4, 0], [-0.01, H * 0.8, 0.01], [0, H, 0]], (k) => Rt * [1.15, 1, 1, 1.05][k], ns, false, () => -0.5);
    disc(Rt * 1.05, H, 0.02, 0, 1, ns);
    tent(lo ? 30 : 120, (i, n) => {
      const a = i / n * TAU * 3.1 + rr(-0.05, 0.05), inner = i % 3 === 0, r = Rt * (inner ? 0.5 : 0.95), L = inner ? rr(0.1, 0.14) : rr(0.28, 0.4), up = inner ? 1 : rr(0.35, 0.6);
      return { r: (inner ? 0.01 : 0.014) * (lo ? 1.8 : 1), pts: [0, 0.25, 0.5, 0.75, 1].map((t) => [cos(a) * (r + L * t * (inner ? 0.25 : 0.9)), H + L * t * up - (inner ? 0 : L * t * t * 0.9), sin(a) * (r + L * t * (inner ? 0.25 : 0.9))]) };
    }, [1, 0.85, 0.7, 0.55, 0.3], 3);
  }
  return m;
}

// reef fish, unit length along x (nose +x), side view in xy. aux: 1 body, .6 dorsal fin, .55 anal fin, .3 tail, .8 pectoral
function meshReefFish() {
  const m = new Mesh();
  const X = [0.5, 0.47, 0.42, 0.34, 0.24, 0.12, 0, -0.12, -0.22, -0.3, -0.35];
  const H = [0.006, 0.05, 0.095, 0.14, 0.175, 0.19, 0.185, 0.155, 0.105, 0.06, 0.042];
  const S = 12, rings = [];
  for (let i = 0; i < X.length; i++) {
    const r = []; for (let k = 0; k < S; k++) { const a = k / S * TAU, w = H[i] * 0.42 * (i ? 1 : 1); r.push(m.v(X[i], sin(a) * H[i] * (sin(a) < 0 ? 0.92 : 1), cos(a) * w * (0.75 + 0.25 * abs(cos(a))), 1)); }
    rings.push(r);
  }
  for (let i = 0; i < X.length - 1; i++) for (let k = 0; k < S; k++) { const k2 = (k + 1) % S; m.quad(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k2]); }
  const hAt = (x) => { for (let i = 0; i < X.length - 1; i++) if (x <= X[i] && x >= X[i + 1]) return mix(H[i], H[i + 1], (X[i] - x) / (X[i] - X[i + 1])); return 0.04; };
  // a flat fin as a strip between a base line and an outer edge (both sides share it, the shader lights both faces)
  const fin = (xs, base, edge, aux) => {
    let p = null;
    for (const x of xs) { const q = [m.v(x, base(x), 0, aux), m.v(x + edge(x)[0], edge(x)[1], 0, aux)]; if (p) m.quad(p[0], q[0], q[1], p[1]); p = q; }
  };
  const dx = [0.2, 0.12, 0.04, -0.04, -0.12, -0.2, -0.27, -0.31];
  fin(dx, (x) => hAt(x) * 0.92, (x) => [-0.04, hAt(x) + 0.09 * sin(PI * (0.2 - x) / 0.52) + 0.015], 0.6);
  const ax = [-0.02, -0.1, -0.18, -0.25, -0.31];
  fin(ax, (x) => -hAt(x) * 0.85, (x) => [-0.04, -hAt(x) - 0.075 * sin(PI * (0.0 - x) / 0.32) - 0.01], 0.55);
  // tail: a fan with a shallow fork
  const T0 = -0.34, tl = [[-0.5, 0.17], [-0.45, 0.06], [-0.43, 0], [-0.45, -0.06], [-0.5, -0.17]];
  const tb = [m.v(T0, 0.04, 0, 0.3), m.v(T0, 0, 0, 0.3), m.v(T0, -0.04, 0, 0.3)], te = tl.map((p) => m.v(p[0], p[1], 0, 0.3));
  m.quad(tb[0], te[0], te[1], tb[1]); m.tri(tb[1], te[1], te[2]); m.tri(tb[1], te[2], te[3]); m.quad(tb[1], te[3], te[4], tb[2]);
  // pectoral fins
  for (const sz of [-1, 1]) {
    const a = m.v(0.22, -0.03, sz * 0.07, 0.8), b = m.v(0.22, 0.03, sz * 0.07, 0.8), c = m.v(0.08, 0.0, sz * 0.13, 0.8), d = m.v(0.1, -0.06, sz * 0.11, 0.8);
    m.quad(a, b, c, d);
  }
  return m;
}
// reef shark: round torpedo, tall first dorsal, broad pectorals, upper tail lobe longer (heterocercal)
function meshShark() {
  const m = new Mesh();
  const X = [0.5, 0.47, 0.42, 0.34, 0.24, 0.12, 0, -0.12, -0.22, -0.3, -0.36];
  const H = [0.004, 0.03, 0.055, 0.075, 0.088, 0.09, 0.083, 0.066, 0.046, 0.03, 0.022];
  const S = 14, rings = [];
  for (let i = 0; i < X.length; i++) {
    const r = []; for (let k = 0; k < S; k++) { const a = k / S * TAU, y = sin(a) * H[i]; r.push(m.v(X[i], y * (y < 0 ? 0.8 : 1) + (i < 3 ? -0.01 : 0), cos(a) * H[i] * 1.1, 1)); }
    rings.push(r);
  }
  for (let i = 0; i < X.length - 1; i++) for (let k = 0; k < S; k++) { const k2 = (k + 1) % S; m.quad(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k2]); }
  const tri = (a, b, c, aux) => m.tri(m.v(...a, aux), m.v(...b, aux), m.v(...c, aux));
  tri([0.12, 0.08, 0], [-0.02, 0.075, 0], [-0.02, 0.2, 0], 0.6);            // first dorsal (black tip in the shader)
  tri([-0.02, 0.2, 0], [-0.02, 0.075, 0], [-0.06, 0.07, 0], 0.6);
  tri([-0.2, 0.045, 0], [-0.25, 0.04, 0], [-0.26, 0.085, 0], 0.6);          // second dorsal
  tri([-0.2, -0.04, 0], [-0.25, -0.035, 0], [-0.27, -0.07, 0], 0.55);       // anal
  tri([-0.34, 0.025, 0], [-0.36, -0.02, 0], [-0.56, 0.2, 0], 0.3);          // upper tail lobe
  tri([-0.36, -0.02, 0], [-0.52, 0.16, 0], [-0.46, 0.05, 0], 0.3);
  tri([-0.35, -0.015, 0], [-0.38, 0.0, 0], [-0.47, -0.12, 0], 0.3);         // lower lobe
  for (const sz of [-1, 1]) { tri([0.2, -0.05, sz * 0.07], [0.12, -0.06, sz * 0.08], [0.02, -0.11, sz * 0.27], 0.8); tri([-0.12, -0.05, sz * 0.05], [-0.16, -0.05, sz * 0.05], [-0.18, -0.08, sz * 0.12], 0.8); }
  return m;
}
// moray eel: a long compressed tube with a low continuous fin; aux = 1 body, .6 fin; x from +0.5 (snout) back
function meshEel() {
  const m = new Mesh(), N = 30, S = 10, rings = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = 0.5 - t, h = t < 0.06 ? 0.012 + 0.3 * t : 0.03 * (1 - 0.75 * pow(t, 2.2)) + 0.002, r = [];
    for (let k = 0; k < S; k++) { const a = k / S * TAU; r.push(m.v(x, sin(a) * h, cos(a) * h * 0.8, 1)); }
    rings.push(r);
  }
  for (let i = 0; i < N; i++) for (let k = 0; k < S; k++) { const k2 = (k + 1) % S; m.quad(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k2]); }
  let p = null;
  for (let i = 3; i <= N; i++) { const t = i / N, x = 0.5 - t, h = 0.03 * (1 - 0.75 * pow(t, 2.2)), q = [m.v(x, h * 0.8, 0, 0.6), m.v(x, h + 0.014, 0, 0.6)]; if (p) m.quad(p[0], q[0], q[1], p[1]); p = q; }
  p = null;
  for (let i = 14; i <= N; i++) { const t = i / N, x = 0.5 - t, h = 0.03 * (1 - 0.75 * pow(t, 2.2)), q = [m.v(x, -h * 0.8, 0, 0.55), m.v(x, -h - 0.01, 0, 0.55)]; if (p) m.quad(p[0], q[0], q[1], p[1]); p = q; }
  return m;
}
