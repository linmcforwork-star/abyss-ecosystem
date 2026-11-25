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
function meshAnemone() {
  rseed(232);
  const m = new Mesh(), R = 0.55, top = (r) => 0.03 + 0.13 * (1 - (r / R) ** 2);
  const disc = []; for (let s = 0; s < 20; s++) { const a = s / 20 * TAU; disc.push(m.v(cos(a) * R, 0.02, sin(a) * R, -0.5)); }
  const c = m.v(0, top(0), 0, -0.5); for (let s = 0; s < 20; s++) m.tri(disc[(s + 1) % 20], disc[s], c);
  for (let i = 0; i < 420; i++) {
    const a = i * 2.39996 + rr(-0.15, 0.15), r = R * 0.98 * sqrt((i + 0.5) / 420), y0 = top(r) - 0.02;
    const out = 0.25 + 0.95 * r / R, L = rr(0.2, 0.3) * (1 - 0.25 * r / R), bend = rr(-0.3, 0.3);
    let dx = cos(a + bend) * out, dz = sin(a + bend) * out, dy = 1; const dl = hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
    const pts = []; for (const t of [0, 0.35, 0.7, 0.9, 1]) pts.push([cos(a) * r + dx * L * t + cos(a) * 0.04 * t * t, y0 + dy * L * t - 0.03 * t * t * r / R, sin(a) * r + dz * L * t + sin(a) * 0.04 * t * t]);
    const r0 = rr(0.018, 0.023);
    const sd = i % 25; // each tentacle's own sway: packed with the ring index into the aux byte, (seed * 5 + ring) / 127
    m.tube(pts, (k) => r0 * [1, 0.88, 0.95, 1.25, 0.8][k], 6, true, (k) => (sd * 5 + k) / 127);
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
