// ============================================================================
// world layout + procedural content generation (load-time only)
// ============================================================================

// designed rock masses: ax, az, bx, bz, radius, top, overhang, waist
const MESAS = [
  [-37, -42, -33, -22, 9, -7, 3.5, 2], [-29, -15, -33, 5, 12, -14, 3, 2], [-36, 11, -30, 27, 9, -5, 4, 2],   // west wall of the main canyon
  [30, -45, 35, -27, 9, -9, 4, 2], [37, -20, 31, -3, 11, -16, 3, 2], [32, 5, 35, 9, 7, -8, 4, 2],          // east wall
  [19, -15, 19, -15, 4.4, -6, 2, 1.5],   // pillar with window
  [6, -88, 6, -88, 10, -34, 0, 0],       // mound in the kelp basin
  [0, -106, 0, -106, 8, 3, 2, 2],        // pillar reaching the surface
  [44, 6, 47, -8, 7, -17, 3, 1],         // ship supports
  [33, 29, 37, 12, 9, -19, -6.5, 0],     // sloped sunlit wall beside the wreck
  [74, 14, 74, 14, 8, -15, 3, 1],
  [-84, -34, -80, -12, 10, -7, 6, 2], [-78, -6, -83, 12, 12, -13, 5, 2], [-82, 18, -79, 32, 9, -8, 6, 2],   // sponge canyon west wall
  [-17, 62, -19, 78, 10, -6, 9, 3], [-21, 84, -18, 100, 11, -9, 8, 3],     // grotto overhang cliff
  [22, 67, 24, 80, 7, -11, 6, 2],        // grotto coral rock
  [-16, 122, 34, 122, 9, -27, 3, 2],     // grotto far wall
];
// vertical ring arches: cx, cy, cz, yaw, major radius, minor radius, y squash
const ARCHES = [
  [-23, -9.5, -16, 0.3, 4.2, 1.4, 1.2],
  [0, -45, -34, 1.57, 14, 2.7, 1.2],
  [-40, -45, 44, 1.57, 10, 2.2, 1.3],
];
// carved tunnels: ax, ay, az, radius, bx, by, bz
const HOLES = [
  [19, -21, -23, 2.5, 19, -21, -7],
  [9, -37, 108, 4.2, 9, -34, 136],
];
// regions kept free of random mesas: ax, az, bx, bz, radius, softness
const CLEARS = [
  [0, -45, 0, 35, 22, 10], [0, -86, 0, -86, 46, 12], [42, 24, 74, 6, 22, 10], [72, -26, 72, -26, 26, 10],
  [-60, -36, -60, 36, 13, 8], [-60, 42, -18, 46, 12, 8], [4, 58, 8, 100, 24, 10], [-34, -74, -56, -46, 11, 8],
];
const PURPLE = [6, 84];
const zoneP = (x, z) => sstep(44, 26, hypot(x - PURPLE[0], z - PURPLE[1])); // the original's purple grotto (an artistic touch, kept for its dreamy look)
const MAGENTA = [[14, 6, 13], [-4, 20, 9], [6, 84, 30], [-58, 8, 10], [50, 30, 12], [8, -70, 10], [-12, -98, 9], [-36, 44, 9], [-46, -60, 9], [24, 42, 8], [-56, 26, 9], [-44, 38, 8], [-10, 44, 8], [12, 24, 8], [-50, -45, 8]];
const magAt = (x, z) => { // the original's magenta patches (also artistic)
  let m = sstep(0.54, 0.66, fbm(x * 0.03, 7, z * 0.03, 3)) * 0.9;
  for (const p of MAGENTA) m = max(m, sstep(p[2], p[2] * 0.45, hypot(x - p[0], z - p[1])));
  return m * sstep(0.3, 0.55, fbm(x * 0.17, 1, z * 0.17, 2) + m * 0.25);
};

function primBuffer() {
  const a = [];
  for (const m of MESAS) a.push(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7]);
  for (const m of ARCHES) a.push(m[0], m[1], m[2], m[3], m[4], m[5], m[6], 0);
  for (const m of HOLES) a.push(m[0], m[1], m[2], m[3], m[4], m[5], m[6], 0);
  for (const m of CLEARS) a.push(m[0], m[1], m[2], m[3], m[4], m[5], 0, 0);
  return new Float32Array(a);
}

// ---------------------------------------------------------------- terrain mesh from the density grid
const HOMEP = [-40, 44]; // the clownfish home: at the third ring arch (ARCHES[2]), minimap C/D x 5/6
function buildTerrain(D) {
  const sn = surfaceNets(D, NX, NY, NZ), nv = sn.nv, gp = sn.pos;
  const smp = sampler3(D, NX, NY, NZ);
  const vb = new ArrayBuffer(nv * 16), vf = new Float32Array(vb), v8 = new Int8Array(vb);
  const wp = new Float32Array(nv * 3), wn = new Float32Array(nv * 3);
  for (let k = 0; k < nv; k++) {
    const x = gp[k * 3], y = gp[k * 3 + 1], z = gp[k * 3 + 2], e = 0.8;
    let nx = smp(x - e, y, z) - smp(x + e, y, z), ny = smp(x, y - e, z) - smp(x, y + e, z), nz = smp(x, y, z - e) - smp(x, y, z + e);
    const l = hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const X = OX + x * VS, Y = OY + y * VS, Z = OZ + z * VS;
    wp[k * 3] = vf[k * 4] = X; wp[k * 3 + 1] = vf[k * 4 + 1] = Y; wp[k * 3 + 2] = vf[k * 4 + 2] = Z;
    wn[k * 3] = nx; wn[k * 3 + 1] = ny; wn[k * 3 + 2] = nz;
    v8[k * 16 + 12] = round(nx * 127); v8[k * 16 + 13] = round(ny * 127); v8[k * 16 + 14] = round(nz * 127); v8[k * 16 + 15] = 127;
  }
  // bucket quads into the XZ culling grid
  const nq = sn.ni / 6, key = new Uint8Array(nq), cnt = new Uint32Array(CELLS * CELLS + 1);
  const lo = new Float32Array(CELLS * CELLS).fill(1e9), hi = new Float32Array(CELLS * CELLS).fill(-1e9);
  for (let q = 0; q < nq; q++) {
    const a = sn.idx[q * 6] * 3;
    const c = clamp(floor((wp[a] - OX) / CELLW), 0, CELLS - 1) + CELLS * clamp(floor((wp[a + 2] - OZ) / CELLW), 0, CELLS - 1);
    key[q] = c; cnt[c + 1]++;
    for (let j = 0; j < 6; j++) { const y = wp[sn.idx[q * 6 + j] * 3 + 1]; if (y < lo[c]) lo[c] = y; if (y > hi[c]) hi[c] = y; }
  }
  for (let c = 0; c < CELLS * CELLS; c++) cnt[c + 1] += cnt[c];
  const ib = new Uint32Array(sn.ni), fill = cnt.slice();
  for (let q = 0; q < nq; q++) { const o = fill[key[q]]++ * 6; for (let j = 0; j < 6; j++) ib[o + j] = sn.idx[q * 6 + j]; }
  return { vb, ib, nv, wp, wn, smp, start: cnt, lo, hi };
}

// ---------------------------------------------------------------- instance stores
function makeWorld(D, T, flyPts, POSES) {
  const gi = (x, y, z) => x + NX * (y + NY * z);
  const smp = T.smp;
  const Dw = (x, y, z) => smp((x - OX) / VS, (y - OY) / VS, (z - OZ) / VS);
  const nCells = CELLS * CELLS;
  const cellOf = (x, z) => clamp(floor((x - OX) / CELLW), 0, CELLS - 1) + CELLS * clamp(floor((z - OZ) / CELLW), 0, CELLS - 1);
  const big = Array.from({ length: nCells }, () => []), small = Array.from({ length: nCells }, () => []);
  // Medium and Low keep every 2nd / 4th leaf (but every kelp stem), made wider; the random stream is the same
  let nth = 0;
  const leaf = (L, x, y, z, len, yaw, tilt, wid, hA, type, s1, s2, bend) => { if (type === 1 || !(nth++ % THIN)) L[cellOf(x, z)].push(x, y, z, len, yaw, tilt, type === 1 ? wid : wid * (1 + LV / 2), hA, type, s1, s2, bend); };
  const glint = (...a) => { nth++ % THIN || glints.push(...a); };
  const solids = []; // per mesh id: arrays of 12 floats
  const props = Array.from({ length: 15 }, () => Array.from({ length: nCells }, () => []));
  // prop groups: 0-5 meshes 4-9, 6 brain 26, 7 table 27, then the growth-form variants (main.js PM): 8, 9 staghorn open /
  // compact, 10 tiered tables, 11 broken table, 12 lobed brain, 13 encrusting brain, 14 fused barrel pair. The form comes
  // from the instance seed (not the random stream, so the rest of the world stays where it was)
  // solid(): corals get a log-normal size (real reefs: many small colonies, few big ones), some half sunk in the sand
  const propGroup = (mesh, seed) => {
    const f = fract(seed * 7.77 + 0.13);
    if (mesh === 7) return f < 0.4 ? 3 : f < 0.7 ? 8 : 9;
    if (mesh === 27) return f < 0.45 ? 7 : f < 0.75 ? 10 : 11;
    if (mesh === 26) return f < 0.4 ? 6 : f < 0.7 ? 12 : 13;
    if (mesh === 4 || mesh === 9) return f < 0.18 ? 14 : mesh - 4;
    return mesh > 3 && mesh < 10 ? mesh - 4 : -1;
  };
  const SEAFAN = false; // the sea fan did not pass review (owner 2026-11-27): its spots get a staghorn thicket until it is redone
  const MATOF = { 4: 4, 5: 9, 6: 9, 7: 5, 8: 8, 9: 4 };   // the coral species decide their own material (barrel sponge 4, leather 9, staghorn 5, sea fan 8)
  const solid = (mesh, x, y, z, sc, q, mat, seed, ts = 1, bob = 0) => { if (mesh === 8 && !SEAFAN) { mesh = 5 + (fract(seed * 4.3) < 0.5 ? 0 : 1); sc *= 0.6; } if (mesh === 7) sc = min(sc, 2.2); if (MATOF[mesh]) mat = MATOF[mesh]; const g = propGroup(mesh, seed); if (g >= 0 && fract(seed * 23.9) < [0, 0.25, 0.45][LV]) return; /* Medium/Low: fewer corals */ if (g >= 0) { const gs = sqrt(-2 * Math.log(0.001 + 0.998 * fract(seed * 3.71 + 0.5))) * cos(TAU * fract(seed * 5.13 + 0.2)); sc *= clamp(exp(0.35 * gs - 0.06), 0.45, 1.6); y -= sc * 0.08 * fract(seed * 9.1); } (g >= 0 ? props[g][cellOf(x, z)] : (solids[mesh] ||= [])).push(x, y, z, sc, q[0], q[1], q[2], q[3], mat, seed, ts, bob); };
  const chunks = Array.from({ length: NCHUNK }, () => Array.from({ length: nCells }, () => []));
  const glints = [];
  const rel = (i, f, r) => { const p = POSES[i]; let fx = p[3] - p[0], fz = p[5] - p[2]; const l = hypot(fx, fz); fx /= l; fz /= l; return [p[0] + fx * f - fz * r, p[2] + fz * f + fx * r]; };
  const bubbles = [], kelpAbs = new Float32Array((NX / 2) * (NY / 2) * (NZ / 2));

  // --- surface queries
  const fl = [];
  const floorsAt = (x, z) => {
    const ix = clamp(round((x - OX) / VS), 1, NX - 2), iz = clamp(round((z - OZ) / VS), 1, NZ - 2);
    fl.length = 0; let ceil = 3;
    for (let gy = NY - 2; gy >= 0; gy--) {
      const d = D[gi(ix, gy, iz)], da = D[gi(ix, gy + 1, iz)];
      if (da <= 0 && d > 0) { const y = OY + (gy + d / (d - da)) * VS; fl.push(y, min(ceil, 0) - y); } else if (da > 0 && d <= 0) ceil = OY + (gy + 0.5) * VS;
    }
    return fl;
  };
  const grad = (x, y, z) => {
    const e = 0.6; let nx = Dw(x - e, y, z) - Dw(x + e, y, z), ny = Dw(x, y - e, z) - Dw(x, y + e, z), nz = Dw(x, y, z - e) - Dw(x, y, z + e);
    const l = hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l];
  };
  // march from outside along -n to the surface
  const snap = (x, y, z, n) => {
    let px = x + n[0] * 2.5, py = y + n[1] * 2.5, pz = z + n[2] * 2.5, prev = Dw(px, py, pz);
    if (prev > 0) return null;
    for (let i = 0; i < 24; i++) {
      const qx = px - n[0] * 0.25, qy = py - n[1] * 0.25, qz = pz - n[2] * 0.25, d = Dw(qx, qy, qz);
      if (d > 0) { const t = prev / (prev - d); const p = [mix(px, qx, t), mix(py, qy, t), mix(pz, qz, t)]; return p.concat(grad(p[0], p[1], p[2])); }
      px = qx; py = qy; pz = qz; prev = d;
    }
    return null;
  };
  const pickV = () => ((rnd() * T.nv) | 0) * 3;
  const tangent = (n) => { let t = abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0]; const l = hypot(...t); t = t.map((v) => v / l); return [t, [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]]]; };
  const nearFly = (x, y, z, r) => { for (const p of flyPts) if (hypot(x - p[0], z - p[2]) < r && y < p[1] + 3 && y > p[1] - 13) return true; return false; };
  // the exhibits: small themed areas on open sand, kept clear of the generic scatter and dressed by hand below
  const ZONES = [{ zh: '小丑鱼之家', sub: '石拱门边的海葵和住在里面的小丑鱼', x: HOMEP[0], z: HOMEP[1], r: 10, box: [HOMEP[0] - 9, HOMEP[0] + 18, HOMEP[1] - 12, HOMEP[1] + 12] }]; // box: the arch and the sand east of it, kept free of other props
  const inZone = (x, z, pad = 0) => { for (const { box: b } of ZONES) if (x > b[0] - pad && x < b[1] + pad && z > b[2] - pad && z < b[3] + pad) return true; return false; };
  const nearPose = (x, z, r = 3) => { for (const p of POSES) if (hypot(x - p[0], z - p[2]) < r) return true; return false; };
  // --- kelp columns
  const column = (x, y, z, H, kind, dens = 1) => {
    const strands = 2 + (rnd() < 0.6) + (rnd() < 0.3), ph = rnd() * TAU, tw = rr(0.1, 0.28), sr = rr(0.2, 0.55), sc = rr(0.75, 1.25);
    const la = rnd() * TAU, lm = rr(0, 0.11), full = rr(0.55, 1.3) * dens;
    const stem = (s, h) => { const a = ph + s * TAU / strands + h * tw, r = sr * (1 - 0.6 * h / H), ln = lm * h * h / H; return [x + cos(a) * r + cos(la) * ln, z + sin(a) * r + sin(la) * ln, a]; };
    for (let s = 0; s < strands; s++) for (let h = 0; h < H - 1; h += 1.7) { const p = stem(s, h); leaf(big, p[0], y + h, p[1], 2.1, p[2] + PI / 2, 0.1, 0.17, h, 1, rnd(), rnd(), 0.3); }
    const n = floor(H * 30 * full);
    for (let i = 0; i < n; i++) {
      const t = pow(rnd(), 0.9), h = t * H, p = stem((rnd() * strands) | 0, h);
      const L = ((0.55 + 0.75 * rnd() * rnd()) * (1 - 0.5 * t * t) * sc + 0.25) * (kind === 1 ? 1.25 : 1.15);
      const tilt = mix(rr(0.4, 1.0), rr(0.15, 0.45), t);
      const type = kind === 1 ? (rnd() < 0.8 ? 3 : 4) : kind === 2 ? (rnd() < 0.5 ? 4 : 0) : 0;
      leaf(big, p[0], y + h, p[1], L, rnd() * TAU, tilt, L * (kind === 1 ? rr(0.09, 0.13) : rr(0.15, 0.21)) + 0.03, h, type, rnd(), rnd(), rr(0.38, 0.95));
    }
    for (let i = floor(H * (kind === 1 ? 16 : 13)); i > 0; i--) { const h = rnd() * H, a = rnd() * TAU, r = rr(0.15, 0.8) * (1 - 0.5 * h / H), ln = lm * h * h / H; glint(x + cos(a) * r + cos(la) * ln, y + h, z + sin(a) * r + sin(la) * ln, h, rnd(), kind === 1 ? rnd() : rnd() * 0.6, rr(0.018, 0.05), 0); }
    // light absorption footprint for the skylight bake
    const hx = round((x - OX) / VS / 2), hz = round((z - OZ) / VS / 2);
    for (let hy = floor((y - OY) / VS / 2); hy <= floor((y + H - OY) / VS / 2); hy++) {
      if (hy >= 0 && hy < NY / 2 && hx > 0 && hx < NX / 2 - 1 && hz > 0 && hz < NZ / 2 - 1) kelpAbs[hx + NX / 2 * (hy + NY / 2 * hz)] += 0.17;
    }
  };
  const KELPZ = [[-32, -5, 13, 0.85], [0, -86, 46, 1], [72, -26, 27, 0.9], [-60, -4, 11, 0.8], [0, -36, 12, 0.55], [-17, -8, 6, 0.8], [15, -8, 6, 0.8], [-4, 120, 20, 0.4], [-45, -63, 15, 0.9], [62, -26, 12, 0.9], [-100, 70, 30, 0.8], [100, 60, 30, 0.8], [-95, -90, 32, 0.8], [105, -85, 30, 0.7]];
  const NOKELP = [[-5, -106.5, 8], [4.6, -109.4, 10], [14.2, -112.3, 12], [-26, -100, 6], [-20.5, -101.7, 4.5], [-14.8, -104.5, 6], [-7.5, -107.8, 7], [4, 112, 11], [2, 4, 15], [42, 22, 12], [6, 78, 19], [-58, -16, 8], [9, -66, 9], [8, -76, 8]];
  const kelpDens = (x, z) => {
    for (const p of NOKELP) if (hypot(x - p[0], z - p[1]) < p[2]) return 0;
    let d = sstep(0.52, 0.64, fbm(x * 0.022, 4, z * 0.022, 3)) * 0.5;
    for (const p of KELPZ) d = max(d, p[3] * sstep(p[2], p[2] * 0.75, hypot(x - p[0], z - p[1])));
    return d;
  };
  const occ = new Set();
  rseed(1);
  // kelp is a cold-water plant, not a coral-reef one: switched back on (owner's request, 2026-11-27) to judge the look;
  // KELP = false removes it again. It keeps clear of the anemone sites, and the corals under it go (see the end).
  const KELP = true;
  const KELPFREE = [[HOMEP[0], HOMEP[1], 24], [ARCHES[1][0], ARCHES[1][2], 24], [HOLES[1][0], HOLES[1][2], 14], [HOLES[1][4], HOLES[1][6], 14]];
  const kelpCols = [];
  const tryColumn = (x, z, kind, force, dens = 1) => {
    if (!KELP || KELPFREE.some((p) => hypot(x - p[0], z - p[1]) < p[2])) return;
    const key = floor(x / 2.3) * 4096 + floor(z / 2.3);
    if (occ.has(key)) return;
    const f = floorsAt(x, z); const c = [];
    for (let i = 0; i < f.length; i += 2) if (f[i + 1] > 9) c.push(i);
    if (!c.length) return;
    const i = c[(rnd() * c.length) | 0], y = f[i];
    if (grad(x, y, z)[1] < 0.55) return;
    if (!force && flyPts.some((p) => hypot(x - p[0], z - p[2]) < 5)) return;
    occ.add(key); kelpCols.push(x, z);
    column(x, y - 0.3, z, min(f[i + 1] - rr(0.8, 5), force ? rr(30, 42) : rr(15, 40)), kind, dens);
  };
  // hand-placed columns framing the viewpoints: x, z, kind, density
  for (const p of [[...rel(0, 11, -8.5), 0], [...rel(0, 16, -10.5), 0], [...rel(0, 21, -9), 0], [...rel(0, 9, 7), 0], [...rel(0, 14, 9.5), 0], [...rel(0, 19, 8), 0], [...rel(0, 26, 6), 0],
    [...rel(5, 6.5, 5.2), 1], [...rel(5, 12, 7), 1], [...rel(5, 15, -8), 0], [...rel(5, 22, -5), 1], [...rel(3, 12, -5.5), 0], [...rel(3, 16, 5.5), 0], [...rel(3, 20, -4.5), 0], [...rel(3, 25, 6), 0], [...rel(3, 13, 8), 0], [...rel(3, 30, -7), 0], [24, 62, 1], [-6, 96, 1], [20, 96, 2], [-10, 70, 0], [16, 52, 1],
    [...rel(4, 15, -9), 0, 1.2], [...rel(4, 19, -13), 0, 1.2], [...rel(4, 23, -8.5), 0, 1.2], [...rel(4, 25, -15), 0, 1.2],
    [...rel(4, 25, 0.5), 2, 1.2], [...rel(4, 27, -3), 2, 1.2], [...rel(4, 28, 3.5), 2, 1.2], [...rel(4, 31, 0), 0, 1.3], [...rel(4, 33, -5), 0, 1.3], [...rel(4, 33, 5), 0, 1.3], [...rel(4, 21, 9), 0, 1.2], [...rel(4, 27, 11), 0, 1.2],
    [...rel(2, 6.5, -5.5), 0, 1.5], [...rel(2, 9.5, -8), 0, 1.3], [...rel(2, 8, 6), 0, 1.4], [...rel(2, 12, 3.6), 0, 1.3], [...rel(2, 17, -2.5), 0, 1.2], [...rel(2, 21, 4), 0, 1.2], [...rel(2, 12, -4.5), 2, 1.2], [...rel(2, 27, -9), 0, 1.2], [...rel(2, 30, 8.5), 0, 1.2], [...rel(2, 37, -3), 0, 1.1],
    [...rel(2, 13.5, 6.5), 0, 1.3], [...rel(2, 14.5, -7), 0, 1.3], [...rel(2, 6.5, 6.5), 0, 1.3], [...rel(2, 9, -8), 2, 1.3]]) tryColumn(p[0], p[1], p[2], true, p[3]);
  // random columns across the world
  rseed(2);
  for (let i = 0; i < 15000; i++) {
    const a = rnd() * TAU, r = sqrt(rnd()) * 170, x = cos(a) * r, z = sin(a) * r;
    if (rnd() < kelpDens(x, z)) tryColumn(x, z, zoneP(x, z) > 0.5 && rnd() < 0.5 ? 1 : rnd() < 0.03 ? 2 : 0);
  }

  // --- clusters of ribbon leaves on the ground
  const cluster = (x, y, z, n, type, lmin, lmax, wmin, wmax, tmax, sway) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, r = rnd() * 0.5, L = rr(lmin, lmax);
      leaf(big, x + cos(a) * r, y - 0.15, z + sin(a) * r, L, a, rr(0.05, tmax), rr(wmin, wmax), sway, type, rnd(), rnd(), rr(0.3, 0.8));
    }
  };
  const HOT = [[0, 5, 30], [42, 30, 24], [6, 82, 34], [-58, 10, 24], [4, -88, 30], [-36, 44, 18], [-46, -60, 20]];
  const hot = (x, z) => { let h = 0.4; for (const p of HOT) h = max(h, sstep(p[2], p[2] * 0.4, hypot(x - p[0], z - p[1]))); return h; };
  rseed(3);
  for (let i = 0; i < 40000; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
    if (hypot(x, z) > 172 || y > -6) continue;
    const h = hot(x, z), zp = zoneP(x, z), u = rnd();
    if (nearFly(x, y, z, 4) || hypot(x + 1, z - 2) < 9 || nearPose(x, z, 8) || inZone(x, z, 3)) continue;
    if (ny > 0.75 && u < 0.10 * h) cluster(x, y, z, 8 + rnd() * 14 | 0, 2, 1.0, 3.0, 0.13, 0.26, 0.6, 2.5);
    else if (ny > 0.6 && u < 0.10 * h + 0.07 * max(zp, h * 0.4)) cluster(x, y, z, 10 + rnd() * 18 | 0, rnd() < 0.8 ? 3 : 4, 0.9, 2.6, 0.14, 0.28, 0.9, 1.5);
    else if (ny < -0.35 && u < 0.5 * max(zp, 0.2)) { // hanging fronds
      const n = 12 + rnd() * 20 | 0;
      for (let j = 0; j < n; j++) leaf(big, x + rr(-0.6, 0.6), y + 0.2, z + rr(-0.6, 0.6), rr(0.8, 3.2), rnd() * TAU, PI - rr(0, 0.4), rr(0.08, 0.18), 0, zp > 0.3 || rnd() < 0.5 ? 6 : 0, rnd(), rnd(), rr(0.3, 0.6));
    } else if (ny > -0.2 && ny < 0.8 && u < 0.07) { // wall tufts
      const yaw = atan2(T.wn[k + 2], T.wn[k]), n = 5 + rnd() * 7 | 0;
      for (let j = 0; j < n; j++) leaf(big, x, y, z, rr(0.5, 1.4), yaw + rr(-0.9, 0.9), rr(0.3, 1.1), rr(0.06, 0.12), 0.5, zp > 0.4 && rnd() < 0.6 ? 3 : 0, rnd(), rnd(), rr(0.2, 0.6));
    }
  }
  // --- ground cover: dense carpets of small tufts in the magenta patches
  rseed(4);
  for (const p of MAGENTA) for (let i = p[2] * p[2] * PI * 45; i > 0; i--) {
    const a = rnd() * TAU, r = sqrt(rnd()) * p[2], x = p[0] + cos(a) * r, z = p[1] + sin(a) * r;
    if (rnd() > magAt(x, z) + 0.12 || nearPose(x, z) || inZone(x, z, 1)) continue;
    const f = floorsAt(x, z); if (!f.length) continue;
    const y = f[f.length - 2]; if (grad(x, y, z)[1] < 0.7) continue;
    const nl = 2 + (rnd() * 3 | 0), yw = rnd() * TAU;
    for (let j = 0; j < nl; j++) leaf(small, x, y - 0.03, z, rr(0.08, 0.26), yw + j * TAU / nl + rr(-0.4, 0.4), rr(0.15, 0.85), rr(0.035, 0.07), 0, 5, rnd(), rnd(), rr(0.3, 0.7));
    if (rnd() < 0.3) for (let j = 0; j < 2; j++) leaf(small, x + rr(-0.2, 0.2), y - 0.04, z + rr(-0.2, 0.2), rr(0.2, 0.55), rnd() * TAU, rr(0.05, 0.6), rr(0.03, 0.06), 0, 7, rnd(), rnd(), rr(0.3, 0.8));
    if (rnd() < 0.3) glint(x, y + rr(0.08, 0.22), z, 0, rnd(), 0.82 + rnd() * 0.18, rr(0.01, 0.02), 0);
  }
  rseed(5);
  for (let i = 0; i < 620000; i++) {
    const k = pickV(), ny = T.wn[k + 1];
    if (ny < 0.72) continue;
    const x = T.wp[k] + rr(-0.45, 0.45), z = T.wp[k + 2] + rr(-0.45, 0.45), y = T.wp[k + 1];
    if (hypot(x, z) > 170 || nearPose(x, z) || inZone(x, z, 0)) continue;
    const m = magAt(x, z), zp = zoneP(x, z), u = rnd();
    if (m > 0.3 && u < m * 0.9) for (let j = 0; j < 4; j++) leaf(small, x + rr(-0.1, 0.1), y - 0.05, z + rr(-0.1, 0.1), rr(0.12, 0.34), rnd() * TAU, rr(0.05, 0.75), rr(0.04, 0.08), 0, 5, rnd(), rnd(), rr(0.3, 0.7));
    else if (u < m * 0.9 + 0.5 * max(zp, hot(x, z)) * sstep(0.42, 0.6, fbm(x * 0.09, 9, z * 0.09, 2))) for (let j = 0; j < 3; j++) leaf(small, x + rr(-0.1, 0.1), y - 0.05, z + rr(-0.1, 0.1), rr(0.25, 0.7), rnd() * TAU, rr(0.1, 0.8), rr(0.05, 0.1), 0, 7, rnd(), rnd(), rr(0.3, 0.8));
  }

  // --- sponges and coral (clustered on rock)
  const spots = [];
  const ZS = [[-58, 8, 30, 1], [0, 0, 30, 0.7], [6, 84, 36, 0.9], [4, -88, 22, 0.6], [44, 20, 24, 0.5]];
  const zw = (x, z) => { let h = 0.45; for (const p of ZS) h = max(h, p[3] * sstep(p[2], p[2] * 0.4, hypot(x - p[0], z - p[1]))); return h; };
  rseed(6);
  for (let i = 0; i < 13000; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2];
    if (hypot(x, z) > 170 || y > -8 || T.wn[k + 1] < -0.15 || rnd() > zw(x, z) || nearFly(x, y, z, 3) || inZone(x, z, 3)) continue;
    const n0 = [T.wn[k], T.wn[k + 1], T.wn[k + 2]], [t1, t2] = tangent(n0), coral = T.wn[k + 1] > 0.85 || rnd() < 0.35, cnt = coral ? 2 + rnd() * 5 | 0 : 3 + rnd() * 9 | 0, sd = rnd();
    for (let j = 0; j < cnt; j++) {
      const a = rr(-1, 1) * (0.5 + cnt * 0.13), b = rr(-1, 1) * (0.5 + cnt * 0.13);
      const s = snap(x + t1[0] * a + t2[0] * b, y + t1[1] * a + t2[1] * b, z + t1[2] * a + t2[2] * b, n0);
      if (!s) continue;
      let ux = s[3], uy = s[4] + (coral ? 0.9 : 1.1), uz = s[5]; const l = hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
      const q = qMul(qFromY(ux, uy, uz), qAxis(0, 1, 0, rnd() * TAU)), sc = coral ? rr(0.5, 1.5) : rr(0.35, 0.9) * (rnd() < 0.1 ? 1.6 : 1);
      solid(coral ? 7 + (rnd() * 3 | 0) : 4 + (rnd() * 3 | 0), s[0] - ux * 0.12 * sc, s[1] - uy * 0.12 * sc, s[2] - uz * 0.12 * sc, sc, q, coral ? 5 : 4, fract(sd + rr(-0.03, 0.03)), 1, 0);
    }
    if (!coral && rnd() < 0.3) spots.push([x + n0[0], y + n0[1] + 0.5, z + n0[2]]);
  }

  // dense sponge / coral gardens: x, z, radius, count
  rseed(7);
  for (const g of [[-68, -6, 9, 260], [-66, 6, 7, 160], [16, 72, 7, 200], [-6, 74, 6, 120], [-13, -2, 6, 80], [8, -88, 8, 160], [44, 12, 7, 120], [-62, 22, 6, 140], [-47, 40, 6, 140], [-30, 47, 6, 120], [-12, 48, 5, 100], [14, 28, 6, 140], [28, 45, 6, 120], [-36, -76, 6, 130], [-49, -58, 6, 130], [-58, -38, 6, 120]]) {
    let made = 0;
    for (let i = 0; i < 400000 && made < g[3]; i++) {
      const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2];
      if (hypot(x - g[0], z - g[1]) > g[2] || y > -14 || T.wn[k + 1] < -0.1 || nearFly(x, y, z, 2.2) || inZone(x, z, 2)) continue;
      made++;
      const coral = T.wn[k + 1] > 0.85 || rnd() < 0.3, nx = T.wn[k], ny = T.wn[k + 1] + (coral ? 0.9 : 1.1), nz = T.wn[k + 2], l = hypot(nx, ny, nz);
      const sc = coral ? rr(0.5, 1.4) : rr(0.35, 0.9) * (rnd() < 0.15 ? 1.7 : 1);
      solid(coral ? 7 + (rnd() * 3 | 0) : 4 + (rnd() * 3 | 0), x - nx / l * 0.1 * sc, y - ny / l * 0.1 * sc, z - nz / l * 0.1 * sc, sc, qMul(qFromY(nx / l, ny / l, nz / l), qAxis(0, 1, 0, rnd() * TAU)), coral ? 5 : 4, rnd(), 1, 0);
    }
  }
  // --- the reef: coral colonies over every up-facing surface in the reef zones, and the sites the animals live at
  // mesh 26 brain (massive) coral, 27 table coral, 7 branching coral, 8 sea fan, 4-6 sponges, 9 tube sponges
  const reefAt = (x, y, z) => sstep(0.22, 0.55, fbm(x * 0.035, 5, z * 0.035, 3) + 0.25 * sstep(-40, -12, y)) * sstep(-3, -6, y);
  const heads = [], anemones = [], holes = [], stations = [];
  rseed(15);
  // (only a sparse background now: real reefs are patches of coral between sand and rubble, and the showpieces are the exhibits)
  for (let i = 0, made = 0; i < 1500000 && made < [2400, 1600, 1000][LV]; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
    if (ny < 0.1 || hypot(x, z) > 166 || y > -4 || nearFly(x, y, z, 2.2) || nearPose(x, z, 2.5) || inZone(x, z, 4)) continue;
    const ra = reefAt(x, y, z); if (rnd() > ra * ra * 0.8 || (ny < 0.45 && rnd() < 0.4)) continue;
    made++;
    const u = rnd(), flat = ny > 0.82;
    const kind = !flat ? (u < 0.45 ? 8 : u < 0.75 ? 4 + (rnd() * 3 | 0) : 7) : u < 0.1 ? 26 : u < 0.18 && y > -26 ? 27 : u < 0.6 ? 7 : u < 0.75 ? 9 : u < 0.85 ? 8 : 4 + (rnd() * 3 | 0);
    const lean = kind === 26 || kind === 27 ? 2.5 : kind === 8 ? 0.4 : 1;
    const nx = T.wn[k], nz = T.wn[k + 2], uy = ny + lean, l = hypot(nx, uy, nz);
    const sc = kind === 26 ? rr(0.35, 1.5) * (rnd() < 0.08 ? 1.8 : 1) : kind === 27 ? rr(0.6, 1.8) : kind === 7 ? rr(0.4, 1.15) : kind === 8 ? rr(0.7, 1.6) : kind === 9 ? rr(0.5, 1) : rr(0.35, 0.8);
    const mat = kind === 26 ? 6 : kind === 27 ? 7 : kind === 7 || kind === 8 ? 5 : 4;
    const sink = kind === 26 ? 0.25 : 0.1;
    solid(kind, x - nx / l * sink * sc, y - uy / l * sink * sc, z - nz / l * sink * sc, sc, qMul(qFromY(nx / l, uy / l, nz / l), qAxis(0, 1, 0, rnd() * TAU)), mat, rnd(), 1, 0);
    if (kind === 7 && flat && sc > 0.8 && y < -8) heads.push([x, y + sc * 0.6, z, sc]);
  }
  // sea anemones (with clownfish) on open sunny ground, cleaning stations on top of big coral heads,
  // moray holes in the steep rock walls
  rseed(16);
  // --- exhibit 1, the anemone garden: the whole start basin (~40 x 50 m, floor at ~43 m). Size layers so it never reads
  // as empty: a tall coral pinnacle in the middle (landmark), carpets of anemones packed together (one colour each) with
  // sand between, big sponges and sea fans (1-3 m) between the carpets, anemone walls on the sunlit rock (after a Red Sea
  // photo), fans and sponges on the other walls. Clownfish live in some of the anemones (eco.js).
  {
    const g = { ...ZONES[0], x: 3, z: 18, r: 12 }, top = (x, z) => { const f = floorsAt(x, z); return f.length ? f[0] : -45; };
    const q = (n = 0.2) => qMul(qFromY(rr(-n, n), 1, rr(-n, n)), qAxis(0, 1, 0, rnd() * TAU));
    const floorY = top(g.x, g.z), onFloor = (x, z) => top(x, z) < floorY + 3; // the basin floor, not the walls' tops
    // anemone: [x, y, z, scale, kind + colour (see meshAnem), normal x, normal z]
    const HOME = true; // no basin-wide garden (false = the old one, anemones spread over the basin floor)
    const ARCH = true; // the clownfish home is at the stone arch (HOMEP; user 2026-11-26), not on the pinnacle
    const PINH = HOME && !ARCH; // (the pinnacle as the clownfish home: fewer props on it, anemones on its ledges)
    const ane = (x, y, z, sc, kind, col, nx = 0, nz = 0) => anemones.push([x, y, z, sc, kind + (col + 0.5) / 6, nx, nz]);
    // the pinnacle (the garden's landmark): magnificent anemones on top, bubble-tip clusters on its ledges, fans at its foot
    { const x = g.x, z = g.z; let h = floorY; const ledges = [];
      // a reef-rock outcrop (rough rock chunks crusted with pink coralline algae), its foot sunk into the sand, with a few
      // boulder corals growing on its ledges; a lower spur beside it
      for (const [m, sc, dx, dz] of [[3, 5, 0, 0], [2, 4.2, 0.7, -0.5], [1, 3.4, -0.6, 0.6], [0, 2.6, 0.3, 0.2]]) {
        const y = h + sc * 0.25; solid(m, x + dx, y, z + dz, sc, q(0.5), 1, rnd(), 1, 0); h = y + sc * 0.5; ledges.push([x + dx, h, z + dz, sc]);
      }
      let h2 = floorY;
      for (const [m, sc, dx, dz] of [[2, 3.2, 4.8, 2.6], [0, 2.2, 5.3, 3.1]]) { const y = h2 + sc * 0.3; solid(m, x + dx, y, z + dz, sc, q(0.5), 1, rnd(), 1, 0); h2 = y + sc * 0.5; }
      // growth over the rock: boulder and branching corals, sponges and sea fans round each tier's shoulder, so the landmark
      // reads as a living bommie, not bare stone
      ledges.forEach(([lx, ly, lz, sc]) => {
        for (let k = 0; k < (PINH ? 4 : 16); k++) { // (fewer with the clownfish home, to leave the ledges to the anemones)
          const a = k / 16 * TAU * 2 + rr(-0.3, 0.3), dy = rr(-0.3, 0.55), r0 = sc * (0.95 - 0.5 * max(0, dy) ** 2), px = lx + cos(a) * r0, pz = lz + sin(a) * r0, py = ly - sc * 0.5 + sc * dy * 0.8, u = rnd();
          const up = qMul(qFromY(cos(a) * 0.35, 1, sin(a) * 0.35), qAxis(0, 1, 0, rnd() * TAU));
          if (u < 0.25) solid(26, px, py, pz, rr(0.9, 1.6), q(0.4), 6, rnd(), 1, 0);
          else if (u < 0.45) solid(7, px, py, pz, rr(0.8, 1.4), up, 5, rnd(), 1, 0);
          else if (u < 0.6) { if (!PINH || ly < floorY + 4) solid(27, px, py, pz, rr(0.9, 1.5), q(0.15), 7, rnd(), 1, 0); } // (home: no table corals roofing the anemones on the upper tiers)
          else if (u < 0.85) solid(rnd() < 0.2 ? 4 : 5 + (rnd() * 2 | 0), px, py, pz, rr(0.6, 1.2), up, 4, rnd(), 1, 0);   // (sponges kept rare: they read big and dark)
          else solid(8, px, py, pz, rr(1.2, 2), up, 5, rnd(), 1, 0);
        }
      });
      for (let j = 0; j < (PINH ? 4 : 9); j++) { const a = rnd() * TAU, r0 = rr(3.5, 6); solid(rnd() < 0.5 ? 26 : 7, x + cos(a) * r0, floorY - 0.3, z + sin(a) * r0, PINH ? rr(0.8, 1.4) : rr(1.2, 2.4), q(0.4), rnd() < 0.5 ? 6 : 5, rnd(), 1, 0); }
      if (!HOME) for (let j = 0; j < 3; j++) ane(x + rr(-0.8, 0.8), h - 0.3, z + rr(-0.8, 0.8), rr(1.4, 1.8), 0, 3);
      if (!ARCH) ane(x + 5, h2 - 0.25, z + 2.8, 1.6, 0, 5);
      if (!HOME) ledges.slice(0, 3).forEach(([lx, ly, lz, sc], j) => { const a = rnd() * TAU, r0 = sc * 0.3; for (let k = 0; k < 7; k++) ane(lx + cos(a) * r0 + rr(-0.5, 0.5), ly - 0.15 + rr(-0.1, 0.1), lz + sin(a) * r0 + rr(-0.5, 0.5), rr(1.1, 1.5), 2, [1, 4, 2][j], cos(a) * 0.3, sin(a) * 0.3); });
      for (let j = 0; j < (PINH ? 3 : 6); j++) { const a = j / (PINH ? 3 : 6) * TAU + rr(-0.3, 0.3), r0 = PINH ? rr(7, 8.5) : rr(4.5, 6); solid(8, x + cos(a) * r0, floorY - 0.1, z + sin(a) * r0, rr(2, 3.2), qMul(qFromY(cos(a) * 0.25, 1, sin(a) * 0.25), qAxis(0, 1, 0, a)), 5, rnd(), 1, 0); }
      heads.push([x + 4, floorY + 4, z, 1.3]);
      // clownfish home (user 2026-11-26): the anemones are gathered here instead of spread over the basin floor. A few
      // magnificent clumps on the ledges, carpet anemones in the sand pockets at the foot, bubble-tips in the crevices
      if (PINH) {
        // each tier is a rough rock about sc wide and sc tall (centre at top - sc/2); the next tier sits on it, so the
        // free shelf is the part of the tier's shoulder outside the next tier. Clumps go there, on the rounded top
        // (height from an ellipsoid), leaning outward. kinds: 0 magnificent, 1 carpet, 2 bubble-tip
        const shelf = (k, n, kind, col, lo, hi) => {
          const [cx, ty, cz, sc] = ledges[k], cy = ty - sc / 2, nx = ledges[k + 1];
          for (let i = 0; i < 400; i++) {
            const a = rnd() * TAU, f = rr(0.25, 0.42), px = cx + cos(a) * sc * f, pz = cz + sin(a) * sc * f;
            if (nx && hypot(px - nx[0], pz - nx[2]) < nx[3] * 0.5 + 0.5) continue;
            for (let m = 0; m < n; m++) { const b = a + rr(-0.25, 0.25), g = f + rr(-0.06, 0.04), qx = cx + cos(b) * sc * g, qz = cz + sin(b) * sc * g, rr2 = min(0.95, g / 0.5);
              ane(qx, cy + sc * 0.5 * Math.sqrt(1 - rr2 * rr2) + 0.02, qz, rr(lo, hi), kind, col, cos(b) * rr2 * 0.7, sin(b) * rr2 * 0.7); }
            return;
          }
        };
        shelf(3, 3, 0, 2, 1.4, 1.7);                     // the summit: a clump of magnificent anemones (violet-pink)
        shelf(2, 2, 0, 1, 1.3, 1.6); shelf(1, 3, 0, 0, 1.3, 1.6); shelf(0, 2, 0, 3, 1.4, 1.7);
        // what already stands round the foot (rocks, fans, sponges), so nothing below is placed inside it
        const blocked = (px, pz, r) => {
          for (const arr of solids) if (arr) for (let i = 0; i < arr.length; i += 12) if (hypot(arr[i] - px, arr[i + 2] - pz) < arr[i + 3] * 0.55 + r) return true;
          const c0 = cellOf(px, pz);
          for (const pr of props) for (const dc of [0, -1, 1, -CELLS, CELLS, -CELLS - 1, -CELLS + 1, CELLS - 1, CELLS + 1]) { const arr = pr[c0 + dc]; if (arr) for (let i = 0; i < arr.length; i += 12) if (hypot(arr[i] - px, arr[i + 2] - pz) < arr[i + 3] * 0.5 + r) return true; }
          return false;
        };
        // bubble-tips in small groups at the foot of the rock, nestled against it (in the real reef: in the cracks)
        for (const [col, a0] of [[1, 0.9], [4, 2.6], [2, 4.4], [1, 5.6]]) {
          for (let i = 0, m = 0; i < 300 && m < 4; i++) { const a = a0 + rr(-0.35, 0.35), r0 = rr(2.6, 3.6), ax = x + cos(a) * r0, az = z + sin(a) * r0;
            if (blocked(ax, az, 0.25) || !onFloor(ax, az)) continue; m++; ane(ax, top(ax, az) - 0.02, az, rr(1.0, 1.3), 2, col, -cos(a) * 0.15, -sin(a) * 0.15); } }
        for (let j = 0; j < 3; j++) { const a = 1.2 + j * 2.1 + rr(-0.3, 0.3), r0 = rr(3.8, 4.6), ax = x + cos(a) * r0, az = z + sin(a) * r0; ane(ax, top(ax, az) - 0.03, az, rr(2.4, 2.9), 1, [0, 2, 1][j]); } // carpets in the sand at the foot
        // on the open sand a little further out (user 2026-11-26: all five kinds in the home): long-tentacle anemones
        // alone or in pairs, a small group of tube anemones; kept clear of the rocks round the foot
        { const sand = [], ok = (px, pz, r) => !sand.some((p) => hypot(p[0] - px, p[1] - pz) < r) && hypot(px - x, pz - z) > 4.6 && !blocked(px, pz, 0.5) && top(px, pz) < floorY + 0.6;
          for (const [kind, n, lo2, hi2, gap, a0] of [[3, 3, 1.2, 1.5, 1.6, 0.2], [4, 3, 0.8, 1.0, 1.1, 3.4]]) {
            for (let i = 0, m = 0; i < 800 && m < n; i++) { const a = a0 + rr(-0.9, 0.9), r0 = rr(5, 8), ax = x + cos(a) * r0, az = z + sin(a) * r0;
              if (!ok(ax, az, gap)) continue; sand.push([ax, az]); m++; ane(ax, top(ax, az) - 0.02, az, rr(lo2, hi2), kind, 1); } } }
      }
    }
    // three parts from south to north: a sand flat by the entrance (tube and long-tentacle anemones, sparse), the main
    // exhibit round the pinnacle (magnificent and carpet anemones in loose drifts, the brightest colours), and the rocky
    // north end (bubble-tip clusters at the foot of the rock, an anemone wall on the sunlit face). Nothing is placed near
    // the basin's edge, so no carpet traces the walls; most of the floor stays open sand.
    const [bx0, bx1, bz0, bz1] = g.box;
    const inner = (x, z, m) => { for (const [dx, dz] of [[m, 0], [-m, 0], [0, m], [0, -m], [0, 0]]) if (!onFloor(x + dx, z + dz)) return false; return x > bx0 + 2 && x < bx1 - 2 && z > bz0 + 2 && z < bz1 - 2; };
    const taken = []; // [x, z, r] already used by a group
    const free = (x, z, r) => !taken.some((p) => hypot(p[0] - x, p[1] - z) < p[2] + r);
    // a drift: anemones scattered along a short wandering line, denser in the middle, so a group never looks like a square
    const drift = (cx, cz, n, len, kind, col, lo, hi, gap) => {
      const put = [], dir = rnd() * TAU;
      for (let i = 0; i < 300 && put.length < n; i++) {
        const t = rr(-1, 1) * abs(rr(-1, 1)), a = dir + 0.6 * sin(t * 3), x = cx + cos(a) * t * len + rr(-0.8, 0.8), z = cz + sin(a) * t * len + rr(-0.8, 0.8);
        if (!inner(x, z, 1.5) || put.some((p) => hypot(p[0] - x, p[1] - z) < gap)) continue;
        put.push([x, z]); const s = rr(lo, hi), y = top(x, z);
        if (kind === 0) { solid(rnd() * 3 | 0, x, y - 0.3 * s, z, s * 0.45, q(0.5), 1, rnd(), 1, 0); ane(x, y + 0.08 * s, z, s, kind, col); } // on a dark rubble rock
        else ane(x, y - 0.03, z, s, kind, col);
      }
      taken.push([cx, cz, len + 1.5]);
    };
    // a clump: loosely round, uneven spacing
    const clump = (cx, cz, n, rad, kind, col, lo, hi, gap) => {
      const put = [];
      for (let i = 0; i < 300 && put.length < n; i++) {
        const a = rnd() * TAU, r = rad * sqrt(rnd()), x = cx + cos(a) * r, z = cz + sin(a) * r;
        if (!inner(x, z, 1.5) || put.some((p) => hypot(p[0] - x, p[1] - z) < gap * rr(1, 1.6))) continue;
        put.push([x, z]); ane(x, top(x, z) - 0.03, z, rr(lo, hi), kind, rnd() < 0.35 ? (col + 3) % 6 : col);
      }
      taken.push([cx, cz, rad + 1.5]);
    };
    taken.push([g.x, g.z, 4.5]); // the pinnacle's foot
    const site = (z0, z1, r, minD, maxD) => {
      for (let i = 0; i < 4000; i++) {
        const x = rr(bx0 + 3, bx1 - 3), z = rr(z0, z1), d = hypot(x - g.x, z - g.z);
        if (d < minD || d > maxD || !inner(x, z, 2.5) || !free(x, z, r)) continue;
        return [x, z];
      }
      return null;
    };
    if (!HOME) { // (the old spread-out garden, kept switchable)
    // main exhibit: 5 drifts round the pinnacle, big and bright
    for (const [kind, col, n, len, lo, hi, gap] of [[0, 0, 7, 4, 1.9, 2.6, 1.9], [1, 0, 3, 3, 2.5, 3.1, 2.6], [0, 1, 6, 3.5, 1.9, 2.5, 1.9], [1, 2, 3, 2.5, 2.5, 3, 2.6], [0, 2, 6, 3.5, 1.8, 2.4, 1.9], [1, 1, 2, 2, 2.4, 2.9, 2.6]]) {
      const p = site(6, 32, len + 0.5, 5.5, 12); if (p) drift(p[0], p[1], n, len, kind, col, lo, hi, gap);
    }
    // south sand flat: two small groups of tube anemones, long-tentacle anemones alone on the sand
    for (const [col, z0] of [[4, 36], [0, 30], [4, 32]]) { const p = site(z0, bz1 - 3, 3.5, 14, 40); if (p) clump(p[0], p[1], 5, 2.2, 4, col, 1.6, 2.7, 1.1); }
    for (let i = 0, k = 0; i < 2000 && k < 5; i++) { const x = rr(bx0 + 3, bx1 - 3), z = rr(28, bz1 - 3); if (!inner(x, z, 1.5) || !free(x, z, 1.5)) continue; taken.push([x, z, 3]); k++; ane(x, top(x, z) - 0.02, z, rr(1.1, 1.7), 3, [2, 5, 0, 1, 4][k % 5]); }
    // north rocky end: bubble-tip clusters on low rocks
    for (const col of [4, 2, 1]) {
      const p = site(bz0 + 2, 4, 2.5, 12, 40); if (!p) continue;
      const [x, z] = p, y = top(x, z), sc = rr(1.6, 2.4);
      solid(26, x, y - sc * 0.3, z, sc, q(0.3), 6, rnd(), 1, 0);
      for (let k = 0; k < 12; k++) { const a = rnd() * TAU, r0 = rr(0.2, 0.75) * sc; ane(x + cos(a) * r0, y + sc * 0.3 * (1 - (r0 / sc) ** 2) + 0.1, z + sin(a) * r0, rr(1.1, 1.5), 2, col, cos(a) * 0.35 * r0 / sc, sin(a) * 0.35 * r0 / sc); }
      taken.push([x, z, 3]);
    }
    } // !HOME
    if (!ARCH) { // (arch home: nothing tall in front of the anemones)
    // between the groups: a few giant sponges and sea fans (1-3 m), small growth underfoot, all kept off the open sand
    const grp = []; for (let i = 0; i < 4000 && grp.length < 5; i++) { const x = rr(bx0 + 2, bx1 - 2), z = rr(bz0 + 2, bz1 - 2); if (onFloor(x, z) && !inner(x, z, 3) && free(x, z, 2) && !grp.some((p) => hypot(p[0] - x, p[1] - z) < 10)) grp.push([x, z]); }
    if (!grp.length) grp.push([g.x + 8, g.z]);
    for (let i = 0, made = 0; i < 20000 && made < 16; i++) {
      const [gx, gz] = grp[i % grp.length], x = gx + rr(-3, 3), z = gz + rr(-3, 3);
      if (!onFloor(x, z) || !free(x, z, 1)) continue;
      made++; taken.push([x, z, 1.2]);
      const y = top(x, z), u = rnd();
      if (u < 0.15) solid(9, x, y - 0.1, z, rr(1, 1.5), q(), 4, rnd(), 1, 0);
      else if (u < 0.35) solid(5 + (rnd() * 2 | 0), x, y - 0.05, z, rr(1.4, 2.2), q(0.1), 9, rnd(), 1, 0);
      else if (u < 0.6) solid(8, x, y - 0.05, z, rr(2, 3.2), q(0.1), 5, rnd(), 1, 0);
      else if (u < 0.8) solid(6, x, y - 0.1, z, rr(1.6, 2.6), q(0.1), 4, rnd(), 1, 0);
      else { const sc = rr(1.4, 2.2); solid(7, x, y - 0.1, z, sc, q(), 5, rnd(), 1, 0); heads.push([x, y + sc * 0.6, z, sc]); }
    }
    for (let i = 0, made = 0; i < 20000 && made < 50; i++) {
      const [gx, gz] = grp[i % grp.length], x = gx + rr(-4.5, 4.5), z = gz + rr(-4.5, 4.5);
      if (!onFloor(x, z) || !free(x, z, 0.3)) continue;
      made++; const y = top(x, z);
      solid(rnd() < 0.5 ? 7 : 4 + (rnd() * 3 | 0), x, y - 0.05, z, rr(0.3, 0.8), q(), rnd() < 0.5 ? 5 : 4, rnd(), 1, 0);
    }
    }
    // one anemone wall on the sunlit rock at the north end (facing +x / -z, toward the sun), after the Red Sea photo
    // --- the clownfish home at the stone arch (user 2026-11-26): anemones grow on the arch's sides and the rock wall
    // beside it and on the sand beneath, never hanging upside down. Placed on the real terrain surface (its points and
    // normals), so nothing ends up inside the rock. By habit: magnificent in clumps on the steep, exposed rock;
    // bubble-tips crowded in a clonal patch at the foot of the wall; carpet, long-tentacle and tube anemones on the sand.
    // an anemone site: clumps seeded on the real rock and sand round (hx, hz), each by its habit (see the calls below)
    const aSite = (hx, hz, R, fn) => { const V = [];
      for (let k = 0; k < T.nv * 3; k += 3) if (abs(T.wp[k] - hx) < R && abs(T.wp[k + 2] - hz) < R) V.push(k);
      let fl = 1e9; for (const k of V) if (T.wn[k + 1] > 0.85 && abs(T.wp[k] - hx) < 12 && abs(T.wp[k + 2] - hz) < 12) fl = min(fl, T.wp[k + 1]);
      const used = [], free3 = (k, r) => !used.some((p) => hypot(p[0] - T.wp[k], p[1] - T.wp[k + 1], p[2] - T.wp[k + 2]) < p[3] + r);
      const wall = (k) => { const ny = T.wn[k + 1], y = T.wp[k + 1]; return ny > -0.15 && ny < 0.55 && y > fl + 0.8 && y < fl + 9; };
      const foot = (k) => { const ny = T.wn[k + 1], y = T.wp[k + 1]; return ny > 0.3 && ny < 0.88 && y < fl + 2.5; };
      const sand = (k) => T.wn[k + 1] > 0.88 && T.wp[k + 1] < fl + 0.6;
      const put = (k, sc, kind, col) => { const x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], nx = T.wn[k], ny = T.wn[k + 1], nz = T.wn[k + 2], l = hypot(nx, ny, nz) || 1, m = hypot(nx, nz) / l, c = min(1, 0.97 / max(m, 1e-3));
        ane(x - nx / l * 0.04, y - ny / l * 0.04, z - nz / l * 0.04, sc, kind, col, nx / l * c, nz / l * c); used.push([x, y, z, sc * 0.3]); };
      // seed each clump at the free vertex nearest a chosen spot on the arch, then fill nearby surface that passes the habitat test
      const cluster = (n, kind, col, lo, hi, test, spread, at) => {
        let s0 = -1, bd = 1e9;
        for (const k of V) { if (!test(k)) continue; const d = hypot(T.wp[k] - at[0], (T.wp[k + 1] - (at[1] ?? T.wp[k + 1])) * 1.5, T.wp[k + 2] - at[2]); if (d < bd && free3(k, 1)) { bd = d; s0 = k; } }
        if (s0 < 0) return 0;
        const near = V.filter((k) => hypot(T.wp[k] - T.wp[s0], T.wp[k + 1] - T.wp[s0 + 1], T.wp[k + 2] - T.wp[s0 + 2]) < spread && test(k));
        let m = 0; for (let i = 0; i < 4000 && m < n && near.length; i++) { const k = near[(rnd() * near.length) | 0], sc = rr(lo, hi); if (!free3(k, sc * 0.34)) continue; put(k, sc, kind, col); m++; }
        return m;
      };
      fn(cluster, wall, foot, sand, fl);
    };
    if (ARCH) aSite(HOMEP[0], HOMEP[1], 16, (cluster, wall, foot, sand, fl) => { const [hx, hz] = HOMEP;
      // arch: ring in the y-z plane at x=hx, legs near z=hz-10 and z=hz+10, opening faces east (+x, toward spawn) and west
      const seen = (test) => (k) => test(k) && T.wn[k] * (-27 - T.wp[k]) + T.wn[k + 2] * (46 - T.wp[k + 2]) > 0; // faces the visitor coming from spawn
      cluster(14, 0, 2, 1.0, 1.4, seen(wall), 2.8, [hx + 2.6, fl + 3, hz + 9]);  // magnificent clump on the south leg's east face
      cluster(12, 0, 1, 1.0, 1.4, seen(wall), 2.6, [hx + 2.4, fl + 3.5, hz - 9]); // and on the north leg's east face
      cluster(6, 0, 2, 1.0, 1.3, wall, 1.4, [hx, fl + 2.5, hz + 7.8]);          // a few on the inner face of the south leg, under the arch
      cluster(12, 0, 5, 1.0, 1.4, seen(wall), 2.6, [hx + 6, fl + 4, hz - 12]);   // the rock wall to the right (north): a rose-red clump
      cluster(10, 0, 2, 1.0, 1.4, seen(wall), 2.4, [hx + 10, fl + 3, hz - 13]);  // and a second, further along
      cluster(8, 2, 1, 0.7, 1.0, seen(wall), 1.3, [hx + 8, fl + 2, hz - 12]);    // bubble-tips tucked into the same wall
      cluster(12, 2, 1, 0.8, 1.1, seen(foot), 1.5, [hx + 3.5, fl + 1, hz + 6.5]);     // bubble-tip patch at the south leg's foot
      cluster(10, 2, 1, 0.8, 1.1, seen(foot), 1.4, [hx + 3.5, fl + 1, hz - 6.5]);     // and the north leg's foot
      // the wall to the left (south) of the arch and the legs' far faces
      cluster(10, 0, 2, 1.0, 1.4, seen(wall), 2.4, [hx + 5, fl + 3, hz + 13]);
      cluster(8, 2, 1, 0.8, 1.1, seen(wall), 1.3, [hx + 3, fl + 2, hz + 12]);
      cluster(8, 0, 1, 1.0, 1.3, wall, 2, [hx - 2.6, fl + 3, hz + 9]);
      cluster(8, 0, 5, 1.0, 1.3, wall, 2, [hx - 2.6, fl + 3, hz - 9]);
      // the reviewer's macro pass (2026-11-27): the doorway is the focal point, so the densest, brightest group sits under the
      // arch (both legs' inner faces and their feet, a long-tentacle group on the sand between), a crown on top of the arch
      // gives it a silhouette from afar, and a few stragglers further out make the edge of the sight fade instead of stopping
      cluster(8, 0, 1, 1.0, 1.3, wall, 1.6, [hx, fl + 2.5, hz - 7.8]);                 // inner face of the north leg
      cluster(8, 2, 1, 0.8, 1.1, foot, 1.3, [hx, fl + 0.8, hz + 7]);                  // bubble-tips at both legs' inner feet
      cluster(8, 2, 1, 0.8, 1.1, foot, 1.3, [hx, fl + 0.8, hz - 7]);
      cluster(6, 3, 1, 1.5, 1.9, sand, 1.8, [hx - 0.5, fl, hz + 1]);                  // long-tentacles in the doorway
      const top = (k) => T.wn[k + 1] > 0.55 && T.wp[k + 1] > fl + 9;
      // a continuous crown along the whole top of the arch (rose-red and pink alternating), outlining it from afar
      [[-7, 5], [-4, 2], [-1, 5], [2, 2], [5, 5], [7.5, 2]].forEach(([dz, c]) => cluster(6, 0, c, 1.0, 1.4, (k) => T.wn[k + 1] > 0.35 && T.wp[k + 1] > fl + 8, 2, [hx, fl + 14, hz + dz]));
      // bands climbing both legs' visitor-facing faces up to the crown, so colour runs right round the doorframe
      for (const [h, dz] of [[6, 9.5], [9, 8.5], [6, -9.5], [9, -8.5]]) cluster(6, 0, dz > 0 ? 2 : 5, 1.0, 1.3, seen(wall), 1.8, [hx + 1.5, fl + h, hz + dz]);
      // the centrepiece in the doorway, a little behind the middle: carpets (cyan-blue, a colour of its own here) ringed by
      // long-tentacles and a tube patch, so the arch frames one rich group instead of an empty floor
      for (const [dx, dz] of [[0.8, 0], [-0.6, -2], [-0.6, 2]]) cluster(1, 1, 0, 2.0, 2.3, sand, 0.6, [hx + dx, fl, hz + dz]); // (a tight trio, right where the torch lands)
      cluster(10, 3, 1, 1.4, 1.8, sand, 2.4, [hx - 2.5, fl, hz]);
      cluster(12, 4, 1, 0.8, 1.0, sand, 2.2, [hx + 2.5, fl, hz + 3.5]);
      cluster(8, 4, 1, 0.8, 1.0, sand, 1.8, [hx + 2.5, fl, hz - 3.5]);
      // the crown runs on over the north shoulder into the right leg's band (the frame in one unbroken line)
      for (const [h, dz] of [[11, -7], [12.5, -5.5], [10, -8.2]]) cluster(5, 0, 5, 1.0, 1.3, (k) => wall(k) || T.wn[k + 1] > 0.35, 1.6, [hx + 1, fl + h, hz + dz]);
      for (const [dx, dz, kd] of [[14, 8, 3], [15, -8, 2], [-9, 10, 3], [13, 12, 4], [-8, -11, 4]]) cluster(kd === 2 ? 3 : 2, kd, 1, kd === 3 ? 1.4 : 0.8, kd === 3 ? 1.8 : 1.05, kd === 2 ? foot : sand, 1.2, [hx + dx, fl + (kd === 2 ? 1 : 0), hz + dz]);
      // carpets: big and solitary, so a "carpet beach" on the sand in front of the arch, each with room around it
      for (const [dx, dz] of [[1, 2], [4, -1.5], [7, -3], [6.5, 3.5], [9.5, 0.5], [3, 5], [10, -4], [-5, 4]]) cluster(1, 1, 0, 1.3, 1.6, sand, 0.6, [hx + dx, fl, hz + dz]);
      // long-tentacle: solitary in nature but often several in one sandy patch; three loose groups
      for (const [dx, dz] of [[5, 6], [12, 1], [2, -5]]) cluster(7, 3, 1, 1.5, 2.0, sand, 2.2, [hx + dx, fl, hz + dz]);
      // tube anemones: "tube anemone fields" on soft bottom; three patches
      for (const [dx, dz] of [[8, -1], [11, 5], [-4, -2]]) cluster(8, 4, 1, 0.8, 1.05, sand, 2, [hx + dx, fl, hz + dz]);
      // lodgers: porcelain crabs in pairs on the carpets, anemone shrimps on carpets and bubble-tips (sitting on the tentacles,
      // along the host's own up direction)
      const onTop = (a, r, h, kind, n) => { const nx = a[5] || 0, nz = a[6] || 0, ny = Math.sqrt(max(0, 1 - nx * nx - nz * nz)); for (let j = 0; j < n; j++) {
        const an = (j === 0 ? (onTop.a0 = rnd() * TAU) : onTop.a0 + PI * j / n * 2 + rr(-0.4, 0.4)), ox = cos(an) * r * a[3], oz = sin(an) * r * a[3]; ane(a[0] + ox + nx * h * a[3], a[1] + ny * h * a[3] - (nx * ox + nz * oz), a[2] + oz + nz * h * a[3], (kind === 8 ? 1.9 : 1.4) * rr(0.9, 1.1), kind, 0, nx, nz); } }; // (the shrimp larger still: it must read from a few metres)
      const near = (kd) => anemones.filter((a) => (a[4] | 0) === kd && hypot(a[0] - hx, a[2] - hz) < 16);
      near(1).slice(0, 5).forEach((a) => onTop(a, 0.14, 0.15, 9, 2));
      near(1).slice(0, 6).forEach((a, j) => onTop(a, 0.34, 0.13, 8, 1 + (j % 2))); // (further out than the crabs, so they never overlap)
      near(2).filter((a, j) => j % 4 === 0).forEach((a) => onTop(a, 0.05, 0.26, 8, 1));
    });
    // two more anemone spots the owner picked (daylight, no clearing): the big ring arch between 4 and D/E on the map, and
    // the small tunnel near 7E; magnificent clumps on the rock, bubble-tips at the feet and in the tunnel mouths
    if (ARCH) aSite(ARCHES[1][0], ARCHES[1][2], 18, (cluster, wall, foot, sand, fl) => { const hx = ARCHES[1][0], hz = ARCHES[1][2];
      cluster(10, 0, 2, 1.0, 1.4, wall, 2.4, [hx + 3, fl + 3, hz + 13]); cluster(9, 0, 5, 1.0, 1.4, wall, 2.4, [hx - 3, fl + 3, hz - 13]);
      cluster(8, 0, 1, 1.0, 1.3, wall, 2.2, [hx + 3, fl + 3.5, hz - 13]); cluster(6, 0, 2, 1.0, 1.3, wall, 2, [hx - 3, fl + 2.5, hz + 13]);
      cluster(9, 2, 1, 0.8, 1.1, foot, 1.4, [hx + 4, fl + 1, hz + 10]); cluster(8, 2, 1, 0.8, 1.1, foot, 1.4, [hx - 4, fl + 1, hz - 10]);
      cluster(6, 3, 1, 1.5, 2.0, sand, 2.2, [hx + 6, fl, hz]); for (const dz of [-4, 3]) cluster(1, 1, 0, 1.3, 1.6, sand, 0.6, [hx - 5, fl, hz + dz]);
    });
    for (const [ex, ey, ez] of [[HOLES[1][0], HOLES[1][1], HOLES[1][2]], [HOLES[1][4], HOLES[1][5], HOLES[1][6]]]) if (ARCH) aSite(ex, ez, 10, (cluster, wall, foot) => {
      cluster(10, 2, 1, 0.8, 1.1, wall, 1.8, [ex + 3, ey - 1, ez]); cluster(8, 2, 1, 0.8, 1.1, wall, 1.6, [ex - 3, ey - 1, ez]); // bubble-tips in the tunnel's mouth
      cluster(7, 0, 2, 1.0, 1.3, wall, 2, [ex + 4, ey + 2, ez + (ez < 120 ? -2 : 2)]); cluster(5, 2, 1, 0.8, 1.1, foot, 1.3, [ex, ey - 3, ez + (ez < 120 ? -3 : 3)]);
    });
    const walls = [];
    for (let i = 0; i < 600000 && walls.length < (ARCH ? 0 : 1); i++) {
      const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
      const nl = hypot(T.wn[k], T.wn[k + 2]) || 1, sunny = (T.wn[k] * 0.27 - T.wn[k + 2] * 0.24) / nl / 0.36;
      if (HOME ? (hypot(x - g.x, z - g.z) < 9 || hypot(x - g.x, z - g.z) > 16 || abs(ny) > 0.3 || y < floorY + 2 || y > floorY + 8) : (x < bx0 - 4 || x > bx1 + 4 || z < bz0 - 4 || z > 10 || abs(ny) > 0.3 || sunny < 0.3 || y < floorY + 3 || y > floorY + 12)) continue;
      walls.push([x, y, z]);
    }
    walls.forEach(([sx, sy, sz], w) => {
      const placed = [];
      for (let i = 0; i < 400000 && placed.length < (HOME ? 9 : 24); i++) {
        const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
        if (hypot(x - sx, y - sy, z - sz) > (HOME ? 2.5 : 5.5) || ny < -0.2 || ny > 0.75 || placed.some((p) => hypot(p[0] - x, p[1] - y, p[2] - z) < 0.9)) continue;
        const nx = T.wn[k], nz = T.wn[k + 2], l = hypot(nx, ny, nz), m = hypot(nx, nz) / l, c = min(1, 0.97 / max(m, 1e-3));
        placed.push([x, y, z]); const bub = placed.length % 3 === 0; ane(x - nx / l * 0.05, y, z - nz / l * 0.05, bub ? rr(0.8, 1.5) : rr(1, 2.1), bub ? 2 : 0, bub ? 4 : [3, 5, 1][placed.length % 3], nx / l * c, nz / l * c);
      }
    });
    // the other walls: fans and sponges
    for (let i = 0, made = 0; i < 300000 && made < 300; i++) {
      const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
      if (hypot(x - g.x, z - g.z) > g.r + 12 || abs(ny) > 0.6 || y > -6 || y < floorY + 1) continue;
      made++;
      const nx = T.wn[k], nz = T.wn[k + 2], l = hypot(nx, ny + 0.4, nz), fan = rnd() < 0.5;
      solid(fan ? 8 : 4 + (rnd() * 3 | 0), x - nx * 0.1, y, z - nz * 0.1, fan ? rr(1.2, 2.6) : rr(0.6, 1.4), qMul(qFromY(nx / l, (ny + 0.4) / l, nz / l), qAxis(0, 1, 0, rnd() * TAU)), fan ? 5 : 4, rnd(), 1, 0);
    }
  }
  for (let i = 0; i < 400000 && holes.length < 18; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
    if (abs(ny) > 0.25 || y > -8 || y < -40 || hypot(x, z) > 140 || holes.some((a) => hypot(a[0] - x, a[2] - z) < 12)) continue;
    const nx = T.wn[k], nz = T.wn[k + 2], l = hypot(nx, nz);
    holes.push([x - nx / l * 0.15, y, z - nz / l * 0.15, nx / l, nz / l]);
  }
  for (const h of heads) if (stations.length < 10 && !stations.some((a) => hypot(a[0] - h[0], a[2] - h[2]) < 20)) stations.push([h[0], h[1] + 0.5, h[2]]);

  // --- rocks: floating boulder clusters + scattered ground rocks
  const BOULD = [[-11, -11, -105, 14, 5], [-56, -19, -18, 18, 6], [10, -13, -88, 22, 7], [24, -15, -24, 22, 7], [-18, -12, 4, 14, 6], [30, -14, 30, 16, 6], [36, -12, -70, 22, 8], [-30, -13, -84, 16, 7], [-58, -14, 0, 14, 6], [19, -13, 98, 18, 6], [62, -9, 34, 14, 6]];
  rseed(8);
  for (let i = 0; i < 9; i++) { const a = rnd() * TAU, r = rr(60, 150); BOULD.push([cos(a) * r, rr(-20, -9), sin(a) * r, 10 + rnd() * 12 | 0, rr(5, 9)]); }
  if (0) for (const b of BOULD) for (let i = 0; i < b[3]; i++) {
    const sc = rnd() < 0.12 ? rr(1.8, 3.2) : rr(0.35, 1.5);
    const x = b[0] + rr(-1, 1) * b[4], y = b[1] + rr(-1, 1) * b[4] * 0.6, z = b[2] + rr(-1, 1) * b[4];
    if (Dw(x, y, z) > -sc) continue;
    const bob = rr(0.12, 0.4), sd = rnd();
    solid(rnd() * 4 | 0, x, min(y, -2 - sc), z, sc, qRand(), 1, sd, 1, bob);
    if (sc > 1.1) for (let j = 0; j < 7; j++) solid(rnd() * 4 | 0, x + rr(-1.6, 1.6) * sc, min(y, -2 - sc) + rr(-1.4, 1) * sc, z + rr(-1.6, 1.6) * sc, rr(0.1, 0.35), qRand(), 1, sd, 1, bob);
  }
  rseed(9);
  for (let i = 0; i < 2600; i++) {
    const k = pickV(); if (T.wn[k + 1] < 0.7 || hypot(T.wp[k], T.wp[k + 2]) > 170 || nearFly(T.wp[k], T.wp[k + 1], T.wp[k + 2], 6) || inZone(T.wp[k], T.wp[k + 2], 4)) continue;
    const sc = rr(0.25, 1.3) * (rnd() < 0.1 ? 2 : 1);
    solid(rnd() * 4 | 0, T.wp[k], T.wp[k + 1] + sc * 0.2, T.wp[k + 2], sc, qRand(), 1, rnd(), 1, 0);
  }

  rseed(10);
  for (let i = 0; i < 60000; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
    if (hypot(x, z) > 172 || y > -3 || (ny > 0.8 && rnd() < 0.6) || nearFly(x, y, z, 3.5) || inZone(x, z, 4)) continue;
    const sc = (0.35 + 2.1 * pow(rnd(), 2.6)) * (ny > 0.8 ? 0.5 : 1), q = qRand();
    chunks[(sc > 1.15 ? 3 : 0) + (rnd() * 3 | 0)][cellOf(x, z)].push(x - T.wn[k] * sc * 0.3, y - ny * sc * 0.3, z - T.wn[k + 2] * sc * 0.3, sc, q[0], q[1], q[2], q[3], 1, rnd(), sc > 1.15 ? 0 : 96, 0);
  }
  rseed(11);
  for (let i = 0; i < 170000; i++) { // pebbles and rubble on the sea floor
    const k = pickV(), x = T.wp[k] + rr(-0.4, 0.4), z = T.wp[k + 2] + rr(-0.4, 0.4), y = T.wp[k + 1];
    if (T.wn[k + 1] < 0.8 || hypot(x, z) > 170 || nearFly(x, y, z, 1.3)) continue;
    const sc = 0.05 + 0.3 * pow(rnd(), 2), q = qRand();
    nth++ % THIN || chunks[6][cellOf(x, z)].push(x, y - sc * 0.25, z, sc, q[0], q[1], q[2], q[3], 1, rnd(), 44, 0);
  }
  // --- set pieces
  const gy = (x, z) => { const f = floorsAt(x, z); return f.length ? f[f.length - 2] : -45; };
  if (0) solid(10, -5, gy(-5, -4) - 0.6, -4, 1, qMul(qAxis(0, 1, 0, 1.2), qMul(qAxis(0, 0, 1, 0.16), qAxis(1, 0, 0, -0.3))), 2, 0.3, 1, 0);          // whale fluke
  solid(11, 59.5, -23, 6, 1, qMul(qAxis(0, 1, 0, -PI / 2), qMul(qAxis(0, 0, 1, -0.1), qAxis(1, 0, 0, 0.32))), 3, 0.5, 1, 0); // ship hull
  // barrel sponges in front of viewpoint 4, small sponges around the fluke base
  rseed(12);
  for (const b of [[7, 3.2, 1.3, 4], [8.4, 4.6, 1.0, 6], [9.6, 2.6, 1.5, 4], [11, 5, 1.1, 5], [8, -3.6, 1.2, 4], [12.5, 2, 1.2, 6], [9, 3.9, 0.8, 4]]) { const p = rel(3, b[0], b[1]), c = POSES[3]; let ux = (c[0] - p[0]) * 0.07, uz = (c[2] - p[1]) * 0.07; const l = hypot(ux, 1, uz); solid(b[3], p[0], gy(p[0], p[1]) - 0.1, p[1], b[2], qFromY(ux / l, 1 / l, uz / l), 4, rnd(), 1, 0); }
  if (0) for (let i = 0; i < 9; i++) { const a = rnd() * TAU; const x = -5 + cos(a) * rr(1.2, 2.6), z = -4 + sin(a) * rr(1.5, 4); solid(6, x, gy(x, z) + 0.05, z, rr(0.4, 0.9), qAxis(0, 1, 0, rnd() * 6), 4, rnd(), 1, 0); }

  // --- bubbles
  const VENTS = [[4, -44, -3], [4.5, -44, -3.5], [-1, -44, 2], [2, -44, -1], [5.5, -44, -7], [3, -44, -9], [6, -44, -90], [8, -44, -84], [4, -44, -93], [-9, -44, 3], [5, -35, -86], [9, -37, -92], [40, -44, 20], [-56, -44, 12], [10, -44, 80], [-2, -44, 30], [0, -44, -30], [12, -44, 2], [6, -44, -2], [46, -44, 30], [-20, -44, -103], [-52, -44, -12], [4, -44, 70], [9, -44, -74], [4, -44, -78], [14, -44, 26], [26, -44, 40], [-45, -44, -64], [-55, -44, -40], [-58, -44, 22], [-40, -44, 40], [-14, -44, 45], [-1, -44, -9], [-7, -44, -6]];
  rseed(13);
  for (const s of spots) if (rnd() < 0.28) VENTS.push(s);
  for (const v of VENTS) {
    const n = 90 + rnd() * 70 | 0, y0 = v[1] === -44 ? gy(v[0], v[2]) : v[1];
    for (let i = 0; i < n; i++) {
      const sz = rnd() < 0.24 ? rr(0.1, 0.3) : rr(0.025, 0.08);
      bubbles.push(v[0] + rr(-0.3, 0.3), y0, v[2] + rr(-0.3, 0.3), sz, rnd(), rr(1.1, 2.4) * (0.6 + sz * 3), -y0 - 0.2, rr(0.05, 0.16));
    }
  }

  // --- top of the seabed on a 1 m grid (the animals stay above it)
  const floorH = new Float32Array(384 * 384);
  for (let j = 0; j < 384; j++) for (let i = 0; i < 384; i++) { const f = floorsAt(i - 191.5, j - 191.5); floorH[i + 384 * j] = f.length ? f[0] : -52; }

  // --- pack leaves (36 bytes: 8 floats + 4 unorm8), sorted by culling cell
  const pack = (L, step = 1, wm = 1) => {
    let n = 0; const start = new Uint32Array(nCells + 1);
    for (let c = 0; c < nCells; c++) { start[c] = n; n += Math.ceil(L[c].length / 12 / step); }
    start[nCells] = n;
    const buf = new ArrayBuffer(n * 36), f = new Float32Array(buf), u8 = new Uint8Array(buf), lo = new Float32Array(nCells).fill(1e9), hi = new Float32Array(nCells).fill(-1e9);
    let k = 0;
    for (let c = 0; c < nCells; c++) { const a = L[c]; for (let i = 0; i < a.length; i += 12 * step, k++) {
      for (let j = 0; j < 8; j++) f[k * 9 + j] = a[i + j];
      f[k * 9 + 6] *= wm;
      u8[k * 36 + 32] = a[i + 8]; u8[k * 36 + 33] = a[i + 9] * 255; u8[k * 36 + 34] = a[i + 10] * 255; u8[k * 36 + 35] = a[i + 11] * 255;
      const y = a[i + 1], l = a[i + 3]; if (y - l < lo[c]) lo[c] = y - l; if (y + l > hi[c]) hi[c] = y + l;
    } }
    return { buf, n, start, lo, hi };
  };

  // --- half-res volume: r = openness, g = skylight
  const hx = NX / 2, hy = NY / 2, hz = NZ / 2, volD = new Uint8Array(hx * hy * hz * 2);
  let Lp = new Float32Array(hx * hz).fill(1), Ln = new Float32Array(hx * hz), tmp = new Float32Array(hx * hz);
  for (let y = hy - 1; y >= 0; y--) {
    for (let z = 0; z < hz; z++) for (let x = 0; x < hx; x++) { const i = x + hx * z; tmp[i] = (Lp[x > 0 ? i - 1 : i] + 2 * Lp[i] + Lp[x < hx - 1 ? i + 1 : i]) * 0.25; }
    for (let z = 0; z < hz; z++) for (let x = 0; x < hx; x++) {
      const i = x + hx * z, b = (tmp[z > 0 ? i - hx : i] + 2 * tmp[i] + tmp[z < hz - 1 ? i + hx : i]) * 0.25;
      const g0 = gi(x * 2, y * 2, z * 2);
      const d = (D[g0] + D[g0 + 1] + D[g0 + NX] + D[g0 + NX + 1] + D[g0 + NX * NY] + D[g0 + NX * NY + 1] + D[g0 + NX * NY + NX] + D[g0 + NX * NY + NX + 1]) * 0.125;
      const o = x + hx * (y + hy * z);
      const l = b * clamp(0.5 - d / 1.5, 0, 1) * (1 - min(kelpAbs[o], 0.5));
      Ln[i] = l;
      volD[o * 2] = clamp(0.5 - d / 12, 0, 1) * 255; volD[o * 2 + 1] = min(1, b) * 255;
    }
    const t = Lp; Lp = Ln; Ln = t;
  }

  // --- ground map: r magenta cover, b purple zone, a sand
  // a pale sand patch under each carpet anemone, so the blue carpet stands out at night instead of melting into the dark floor
  const CARP = anemones.filter((a) => (a[4] | 0) === 1 && hypot(a[0] - HOMEP[0], a[2] - HOMEP[1]) < 16);
  const carpetSand = (x, z) => { let m = 1; for (const a of CARP) m = min(m, sstep(1.2, 3, hypot(x - a[0], z - a[2]))); return m; };
  const gm = new Uint8Array(512 * 512 * 4);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
    const x = (i + 0.5) / 512 * 384 - 192, z = (j + 0.5) / 512 * 384 - 192, o = (i + 512 * j) * 4;
    gm[o] = (inZone(x, z, -1) ? 0 : magAt(x, z)) * 255; gm[o + 1] = sstep(18, 12, hypot(x - HOMEP[0], z - HOMEP[1])) * carpetSand(x, z) * 255; // g: darker garden floor so anemones glow against it
    gm[o + 2] = zoneP(x, z) * 255; gm[o + 3] = sstep(0.42, 0.6, fbm(x * 0.04, 3, z * 0.04, 3)) * carpetSand(x, z) * 255; // (no magenta ground in the anemone garden: it fought the anemones)
  }

  // --- fish schools + mantas
  const fish = [];
  rseed(14);
  const SCH = [[-2, -36, -10, 15, 520, 0.3, 1, 0.945], [8, -30, -70, 22, 420, 0.32, -1], [48, -30, 14, 18, 360, 0.3, 1], [-58, -30, -8, 11, 420, 0.28, -1, 0.3], [8, -36, 84, 16, 320, 0.28, 1],
    [-90, -28, -70, 25, 300, 0.3, 1], [95, -30, 70, 25, 300, 0.3, -1], [0, -22, 20, 30, 380, 0.34, -1], [-30, -30, -100, 18, 300, 0.3, 1], [16, -36, 30, 12, 300, 0.3, 1], [-48, -34, -58, 12, 300, 0.3, -1], [-45, -35, 38, 14, 320, 0.3, 1]];
  for (const s of SCH) { const ss = s[7] === undefined ? rnd() : s[7]; for (let i = 0; i < s[4]; i++) fish.push(s[0], s[1], s[2], s[3], rnd(), s[6] * 1.9 / s[3], s[5], ss); }
  const mantas = [];
  for (const m of [[1, -28, 3.5, 14, 3.012, 0.085, 3.6, 0.1], [49, -31, 24.5, 5, 0.029, -0.08, 3.7, 0.4], [0, -14, -80, 34, 0.3, 0.06, 5.2, 0.7], [-50, -18, 20, 26, 5, -0.075, 3.8, 0.55], [10, -16, 86, 26, 2.2, 0.07, 4.4, 0.85], [20, -11, -20, 46, 4.2, -0.045, 5.6, 0.25]]) mantas.push(...m);

  // --- drifting particles
  const snow = new Float32Array(9000 * 4);
  for (let i = 0; i < snow.length; i++) snow[i] = rnd();

  // --- keep every anemone in view: no fixed object (coral, sponge, fan, rock, rubble, kelp) may overlap one or stand right in
  // front of it (along the way it faces, or beside it and taller on open ground). Fish swim off, so they don't count.
  {
    const AQ = anemones.filter((a) => (a[4] | 0) < 8).map((a) => { const nx = a[5] || 0, nz = a[6] || 0; return [a[0], a[1], a[2], 0.35 * a[3], nx, Math.sqrt(max(0, 1 - nx * nx - nz * nz)), nz]; });
    const G = new Map(); for (const a of AQ) { const k = ((a[0] / 6) | 0) + ',' + ((a[2] / 6) | 0); (G.get(k) || G.set(k, []).get(k)).push(a); }
    const blocks = (x, y, z, so) => {
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const a of G.get((((x / 6) | 0) + i) + ',' + (((z / 6) | 0) + j)) || []) {
        const dx = x - a[0], dy = y - a[1], dz = z - a[2];
        if (dy < -1.2 || dy > 2.5) continue;
        if (hypot(dx, dy, dz) < a[3] + 0.4 * so) return true;                                         // overlaps it
        const al = dx * a[4] + dy * a[5] + dz * a[6], lx = dx - a[4] * al, ly = dy - a[5] * al, lz = dz - a[6] * al;
        if (al > -0.2 && al < 2.2 && hypot(lx, ly, lz) < a[3] + 0.35 * so + 0.2) return true;          // in front of it, the way it faces
        if (a[5] > 0.8 && hypot(dx, dz) < a[3] + 0.5 + 0.3 * so && dy + so > 0.3) return true;       // beside it on open ground, and taller
      }
      return false;
    };
    let cut = 0;
    const sweep = (L, sMul = 1) => { for (let c = 0; c < L.length; c++) { const a = L[c], o = []; for (let i = 0; i < a.length; i += 12) { if (blocks(a[i], a[i + 1], a[i + 2], a[i + 3] * sMul)) { cut++; continue; } for (let j = 0; j < 12; j++) o.push(a[i + j]); } L[c] = o; } };
    for (const P of props) sweep(P);
    for (const C of chunks) sweep(C);
    sweep(big, 0.5);                                         // (a leaf's 4th value is its length)
    for (let m = 0; m < 10; m++) if (solids[m]) { const o = [solids[m]]; sweep(o); solids[m] = o[0]; } // (10, 11: the whale fluke and the ship hull stay)
    if (typeof window !== 'undefined') window.__cleared = cut; // (dev: how many objects made way)
  }
  // --- under the kelp: no coral (a kelp bed is rock and sand); everything within 1.6 m of a stem and in the dense beds goes
  // young colonies of the same species round some big ones (they settle near their parent)
  { const add = [];
    props.forEach((P, g) => { for (const c of P) for (let i = 0; i < c.length; i += 12) {
      const x = c[i], y = c[i + 1], z = c[i + 2], sc = c[i + 3], sd = c[i + 9];
      if (sc < 1.1 || fract(sd * 13.3) > [0.5, 0.25, 0][LV]) continue;
      const n = 1 + (fract(sd * 17.7) * 3 | 0);
      for (let k = 0; k < n; k++) {
        const a = TAU * fract(sd * 23.1 + k * 0.37), r = sc * (0.7 + 0.9 * fract(sd * 31.7 + k * 0.53)), x2 = x + cos(a) * r, z2 = z + sin(a) * r, y2 = gy(x2, z2);
        if (abs(y2 - y) > 0.6 || KELPFREE.some((p) => hypot(x2 - p[0], z2 - p[1]) < p[2])) continue;
        const q = qAxis(0, 1, 0, a * 3), s2 = fract(sd * 41.3 + k * 0.29);
        add.push(g, x2, y2 - 0.04, z2, sc * (0.25 + 0.2 * s2), q[0], q[1], q[2], q[3], c[i + 8], fract(sd + 0.31 * (k + 1)), c[i + 10], 0);
      }
    } });
    for (let i = 0; i < add.length; i += 13) { const cl = props[add[i]][cellOf(add[i + 1], add[i + 3])]; if (cl) cl.push(...add.slice(i + 1, i + 13)); else if (!makeWorld.warned) { makeWorld.warned = 1; console.error('juvenile off grid ' + JSON.stringify(add.slice(i, i + 13))); } }
  }
  if (kelpCols.length) {
    const KG = new Map(); for (let i = 0; i < kelpCols.length; i += 2) { const k = ((kelpCols[i] / 4) | 0) + ',' + ((kelpCols[i + 1] / 4) | 0); (KG.get(k) || KG.set(k, []).get(k)).push(kelpCols[i], kelpCols[i + 1]); }
    const underKelp = (x, z) => {
      if (kelpDens(x, z) > 0.55) return true;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const c = KG.get((((x / 4) | 0) + i) + ',' + (((z / 4) | 0) + j)) || []; for (let k = 0; k < c.length; k += 2) if (hypot(x - c[k], z - c[k + 1]) < 1.6) return true; }
      return false;
    };
    const keep = (a) => { const o = []; for (let i = 0; i < a.length; i += 12) if (!underKelp(a[i], a[i + 2])) for (let j = 0; j < 12; j++) o.push(a[i + j]); return o; };
    for (const P of props) for (let c = 0; c < P.length; c++) P[c] = keep(P[c]);
  }
  // dev.html?corals: eight of each coral species in rows on open sand around (5..22, 22..34), for reviewing their variety
  if (typeof location !== 'undefined' && /corals/.test(location.search)) {
    const inBox = (a) => { const o = []; for (let i = 0; i < a.length; i += 12) if (!(a[i] > 2 && a[i] < 25 && a[i + 2] > 19 && a[i + 2] < 37)) for (let j = 0; j < 12; j++) o.push(a[i + j]); return o; };
    for (const P of props) for (let c = 0; c < P.length; c++) P[c] = inBox(P[c]);
    [[4, 0.9], [9, 1], [5, 1.1], [7, 1], [26, 1.3], [27, 1.3]].forEach(([m, sc], r) => {
      for (let k = 0; k < 8; k++) {
        const x = 5 + k * 2.2, z = 22 + r * 2.4, rot = qAxis(0, 1, 0, k * 0.9);
        solid(m, x, gy(x, z) - 0.05, z, sc * (0.8 + 0.06 * k), rot, m === 26 ? 6 : m === 27 ? 7 : 4, (k * 0.137 + r * 0.31) % 1, 1, 0);
      }
    });
  }
  const sol = { data: [], ranges: [] }; let si = 0;
  for (let m = 0; m < 12; m++) { const a = solids[m] || []; sol.ranges.push([si, a.length / 12]); si += a.length / 12; for (let i = 0; i < a.length; i++) sol.data.push(a[i]); }
  const packC = (L) => {
    let n = 0; const start = new Uint32Array(nCells + 1);
    for (let c = 0; c < nCells; c++) { start[c] = n; n += L[c].length / 12; }
    start[nCells] = n;
    const data = new Float32Array(n * 12), lo = new Float32Array(nCells).fill(1e9), hi = new Float32Array(nCells).fill(-1e9);
    let k = 0;
    for (let c = 0; c < nCells; c++) { const a = L[c]; for (let i = 0; i < a.length; i += 12) { for (let j = 0; j < 12; j++) data[k++] = a[i + j]; lo[c] = min(lo[c], a[i + 1] - 3); hi[c] = max(hi[c], a[i + 1] + 3); } }
    return { data, n, start, lo, hi };
  };
  // the corals and sponges, for aiming at them (eco.js): x, y, z, scale, mesh
  const corals = [];
  const GM = [4, 5, 6, 7, 8, 9, 26, 27, 7, 7, 27, 27, 26, 26, 4];
  props.forEach((P, g) => { const m = GM[g]; for (const c of P) for (let i = 0; i < c.length; i += 12) corals.push(c[i], c[i + 1], c[i + 2], c[i + 3], m); });
  return { gy, glints: new Float32Array(glints), chunks: chunks.map(packC), props: props.map(packC), big: pack(big), bigF: pack(big, 2, 1.5), small: pack(small), solids: { data: new Float32Array(sol.data), ranges: sol.ranges }, bubbles: new Float32Array(bubbles), volD, gm, fish: new Float32Array(fish), mantas: new Float32Array(mantas), snow, floorH, heads, anemones, holes, stations, zones: ZONES, corals: new Float32Array(corals) };
}
const fract = (x) => x - floor(x);

// ---------------------------------------------------------------- procedural meshes
function meshChunk(sd, sub = 2, det = sub > 2) {
  if (LV > 1 && sub > 1) sub--; // Low: a quarter of the triangles
  rseed(100 + sd);
  const pl = []; for (let i = 0; i < 4; i++) { const q = qRand(); pl.push([q[0], q[1], q[2], rr(0.8, 0.98)]); const l = hypot(q[0], q[1], q[2]) || 1; pl[i][0] /= l; pl[i][1] /= l; pl[i][2] /= l; }
  return icosphere(sub, (x, y, z) => {
    let r = 1 + (fbm(x * 1.6 + sd, y * 1.6, z * 1.6, 2) - 0.5) * 0.9 + (det ? (fbm(x * 4 + sd, y * 4, z * 4, 2) - 0.5) * 0.25 : 0);
    let px = x * r, py = y * r * 0.8, pz = z * r;
    for (const p of pl) { const d = px * p[0] + py * p[1] + pz * p[2] - p[3]; if (d > 0) { px -= p[0] * d; py -= p[1] * d; pz -= p[2] * d; } }
    return [px, py, pz];
  });
}
function meshLathe(prof, seg, lump, ribs = 0) {
  const m = new Mesh(), rings = [];
  for (const [r, h, ao] of prof) { const ring = []; for (let s = 0; s < seg; s++) { const a = s / seg * TAU, rl = r * (1 + lump * (fbm(cos(a) * 1.5 + h * 2, h * 3, sin(a) * 1.5, 2) - 0.5) + 0.07 * cos(ribs * a + h * 1.5)); ring.push(m.v(cos(a) * rl, h, sin(a) * rl, ao)); } rings.push(ring); }
  for (let k = 0; k < rings.length - 1; k++) for (let s = 0; s < seg; s++) { const s2 = (s + 1) % seg; m.quad(rings[k][s], rings[k + 1][s], rings[k + 1][s2], rings[k][s2]); }
  return m;
}
// append mesh b to a, its points mapped by f([x, y, z]) -> [x, y, z]
function meshMerge(a, b, f) {
  const o = a.p.length / 3;
  for (let i = 0; i < b.p.length; i += 3) { const q = f([b.p[i], b.p[i + 1], b.p[i + 2]]); a.p.push(q[0], q[1], q[2]); }
  a.aux.push(...b.aux); for (const k of b.i) a.i.push(k + o);
  return a;
}
const mXf = (dx, dy, dz, s, yaw = 0, tilt = 0) => ([x, y, z]) => {
  const c = cos(yaw), sn = sin(yaw); let X = x * c - z * sn, Z = x * sn + z * c, Y = y; const ct = cos(tilt), st = sin(tilt); const X2 = X * ct - Y * st; Y = X * st + Y * ct;
  return [X2 * s + dx, Y * s + dy, Z * s + dz];
};
// the coral growth-form variants (owner 2026-11-27: the same species must not look copy-pasted). 0 tiered tables: a big
// plate with a smaller one above and beside it; 1 a table with a broken-off bite; 2 a lobed brain coral (three domes
// grown together); 3 a flat encrusting brain coral; 4 a fused pair of barrel sponges, the small one leaning out
function meshVariant(k) {
  if (k === 0) return meshMerge(meshTable(), meshTable(1), mXf(0.75, 0.28, 0.35, 0.62, 1.3));
  if (k === 1) return meshTable(2);
  if (k === 2) { const m = meshBrain(); meshMerge(m, meshBrain(1), mXf(0.62, -0.08, 0.18, 0.72, 2)); return meshMerge(m, meshBrain(2), mXf(-0.1, -0.1, 0.66, 0.6, 4)); }
  if (k === 3) return meshMerge(new Mesh(), meshBrain(3), ([x, y, z]) => [x * 1.5, y * 0.3, z * 1.3]);
  return meshMerge(meshBarrel(1.1, 0.5, 213), meshBarrel(0.75, 0.38, 214), mXf(0.62, -0.02, 0.15, 1, 0.8, -0.28));
}
// coral and sponge meshes, each a real species (refs: /mnt/project-files/coral-window/refs/corals/LOOKS.md).
// mesh 7: staghorn Acropora (A. muricata): an open thicket of knobbly, slightly tapering branches that start oblique at
// the base and curve upward, branching irregularly; swollen pale tips (aux 1 at a tip, low near the base for shading).
// mesh 8: giant sea fan (Annella mollis): one flat, slightly curved net in the x-y plane, a short trunk, a few main
// branches and an irregular fused mesh of fine twigs (no grid). lo: the far versions
// form (staghorn only): 0 a dense thicket, 1 an open colony of fewer, longer branches, 2 a low compact clump
function meshCoral(fan, lo = LV > 1, form = 0) {
  rseed(200 + fan + form * 17);
  const m = new Mesh();
  const nrm = (v) => { const l = hypot(...v) || 1; return v.map((c) => c / l); };
  if (!fan) {
    // the far version (lo) is the same colony, branch for branch (same random stream), only with every other point of
    // each branch and three-sided tubes: no visible pop when it swaps at the LOD distance
    const sides = lo ? 3 : 4, seg = 4;
    const branch = (p, d, r, len, depth) => {
      const pts = [p]; let q = p;
      for (let i = 0; i < seg; i++) { d = nrm([d[0] + rr(-0.18, 0.18), d[1] + rr(0.02, 0.22), d[2] + rr(-0.18, 0.18)]); q = [q[0] + d[0] * len / seg, q[1] + d[1] * len / seg, q[2] + d[2] * len / seg]; pts.push(q); }
      const knob = pts.map(() => rr(0.85, 1.15)), st = lo ? 2 : 1, tp = pts.filter((_, k) => k % st === 0), ns = tp.length - 1;
      m.tube(tp, (k) => r * (1 - 0.25 * k / ns) * (k === ns ? 1.15 : knob[k * st]), sides, 'round', (k) => clamp(0.3 + 0.7 * (1 - depth / 3) * (k / ns) + (k === ns ? 0.3 : 0), 0, 1));
      if (depth > 0) { const n = 1 + (rnd() < 0.6) + (rnd() < 0.3); for (let i = 0; i < n; i++) { const at = pts[1 + ((rnd() * (seg - 1)) | 0)]; branch(at, nrm([d[0] + rr(-0.9, 0.9), d[1] + rr(0, 0.6), d[2] + rr(-0.9, 0.9)]), r * 0.85, len * rr(0.55, 0.8), depth - 1); } }
    };
    const n0 = [22, 11, 24][form], L0 = [0.4, 0.75, 0.24][form], L1 = [0.65, 1.05, 0.4][form], up = [[0.5, 1.1], [0.7, 1.3], [0.2, 0.6]][form];
    for (let i = 0; i < n0; i++) { const a = i / n0 * TAU + rr(-0.3, 0.3); branch([cos(a) * rr(0.05, 0.6), 0, sin(a) * rr(0.05, 0.6)], nrm([cos(a) * rr(0.6, 1.2), rr(up[0], up[1]), sin(a) * rr(0.6, 1.2)]), form === 1 ? 0.036 : 0.042, rr(L0, L1), 2); }
    return m;
  }
  // sea fan: thick trunk and main branches, then an irregular net of fine twigs between scattered points of the fan's outline
  const W = 1.25, H = 0.9, curve = (x) => 0.06 * x * x; // (a gentle bow across the current)
  const P3 = (x, y) => [x, y, curve(x)];
  const main = [[0, 0]], mains = [];
  for (let i = 0; i < 4; i++) { const a = PI / 2 + (i - 1.5) * 0.62 + rr(-0.1, 0.1), pts = [[0, 0.08]]; for (let k = 1; k <= 4; k++) pts.push([cos(a) * k * 0.2 * rr(0.9, 1.1), 0.08 + sin(a) * k * 0.2]); mains.push(pts); }
  m.tube([P3(0, -0.02), P3(0, 0.1)], 0.035, lo ? 4 : 6, false, () => 0.3);
  for (const ps of mains) m.tube(ps.map((q) => P3(q[0], q[1])), (k) => 0.022 * (1 - 0.15 * k), lo ? 3 : 5, false, (k) => 0.35 + 0.1 * k);
  // side branches off the mains (the visible skeleton), then a thin bowed membrane whose fine net of twigs is cut out
  // in the shader (mat 8, aux > 0.93): real Annella meshes are ~1-3 cm, far too fine for geometry
  for (const ps of mains) for (let k = 1; k < ps.length; k++) {
    const n = lo ? 1 : 3;
    for (let j = 0; j < n; j++) {
      const [x0, y0] = ps[k], sgn = j ? 1 : -1, a = atan2(y0, x0) + sgn * rr(0.5, 0.9), L = rr(0.16, 0.3) * (1.2 - k * 0.12);
      const q = [[x0, y0], [x0 + cos(a) * L * 0.5, y0 + sin(a) * L * 0.5], [x0 + cos(a + sgn * 0.2) * L, y0 + sin(a + sgn * 0.2) * L]];
      m.tube(q.map((t) => P3(t[0], t[1])), (i) => 0.011 * (1 - 0.3 * i), 3, false, () => 0.6);
    }
  }
  const GX = lo ? 10 : 20, GY = lo ? 5 : 10, grid = [];
  for (let j = 0; j <= GY; j++) {
    const y = 0.1 + (H - 0.1) * j / GY, row = [];
    for (let i = 0; i <= GX; i++) {
      const hw = W * sqrt(max(0, 1 - ((y - 0.08) / (H - 0.05)) ** 2)) * (0.92 + 0.08 * sin(i * 1.7 + j)), x = (i / GX * 2 - 1) * hw;
      row.push(m.v(x, y, curve(x), 0.97));
    }
    grid.push(row);
  }
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) m.quad(grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]);
  return m;
}
// mesh 9: a tall barrel sponge; mesh 4 (main.js): a squat one. Xestospongia testudinaria: a thick-walled barrel with dense,
// knife-edged, wavy vertical lamellae that fork and merge, a thick irregular rim and a deep dark cavity (aux low inside)
function meshBarrel(h = 1.3, w = 0.55, seed = 210, lo = LV > 1) {
  rseed(seed);
  const m = new Mesh(), seg = lo ? 40 : 102, rows = lo ? 7 : 16, rings = [];   // (~6 vertices per lamella: fewer alias them away)
  const prof = (t) => w * (0.62 + 0.45 * sin(PI * (0.08 + 0.78 * t)) - 0.06 * sstep(0.9, 1, t));   // bulging, widest a little below the middle, the mouth drawn in
  const ph = [rr(0, 9), rr(0, 9)];
  for (let r = 0; r <= rows; r++) {
    const t = r / rows, ring = [];
    for (let s = 0; s < seg; s++) { const a = s / seg * TAU, wav = a * 17 + sin(t * 5 + ph[0] + a * 3) * 0.9 + sin(a * 5 + ph[1]) * 0.6, lam = pow(1 - abs(sin(wav)), 3); // knife-edged ridges that wander, fork and merge
      const rr0 = prof(t) * (1 + 0.13 * lam * sstep(0.03, 0.15, t)) * (1 + 0.06 * (fbm(cos(a) * 2, t * 3, sin(a) * 2, 2) - 0.5)); ring.push(m.v(cos(a) * rr0, t * h, sin(a) * rr0, 0.45 + 0.55 * lam)); }
    rings.push(ring);
  }
  // the rim, then down the inside wall into the dark cavity
  const inner = []; for (const [t, k, ao] of [[1.01, 0.8, 0.5], [0.85, 0.7, 0.15], [0.4, 0.6, 0.03]]) { const ring = []; for (let s = 0; s < seg; s++) { const a = s / seg * TAU, r0 = prof(1) * k; ring.push(m.v(cos(a) * r0, t * h, sin(a) * r0, ao)); } inner.push(ring); }
  const all = [...rings, ...inner];
  for (let k = 0; k < all.length - 1; k++) for (let s = 0; s < seg; s++) { const s2 = (s + 1) % seg; m.quad(all[k][s], all[k + 1][s], all[k + 1][s2], all[k][s2]); }
  return m;
}
function meshTubes() { return meshBarrel(1.15, 0.5, 211); }
// meshes 5, 6: leather coral (Sarcophyton), a "toadstool": a smooth pale stalk under a broad soft cap. v 0: S. glaucum, a
// wide wavy cap whose margin folds into flaring ruffles; v 1: S. trocheliophorum, flatter with radial lobes ("elephant
// ear"). aux .15 stalk, .5 underside, 1 the cap's top (the shader paints the polyp fuzz there)
function meshLeather(v, lo = LV > 1) {
  rseed(240 + v);
  const m = new Mesh(), seg = lo ? 18 : 40, nr = lo ? 4 : 9, R = v ? 0.6 : 0.52, nf = v ? 4 : 5, fd = v ? 0.1 : 0.15, ph = rnd() * 9;
  const stalk = [[0.28, 0], [0.24, 0.12], [0.22, 0.32], [0.27, 0.48]];
  const fold = (a, t) => fd * t * t * (sin(nf * a + ph + sin(a * 3) * 0.8) + 0.4 * sin(nf * 2.3 * a + ph * 2)) * (v ? 1 : 1.2);
  const cap = (t, a) => { const r = 0.25 + (R - 0.25) * t * (1 + (v ? 0.12 * sin(5 * a + ph) : 0)); return [cos(a) * r, 0.48 + 0.1 * sin(PI * t * 0.75) + fold(a, t) - (v ? 0.02 : 0.05) * t * t, sin(a) * r]; };
  const rings = [];
  for (const [r, h] of stalk) { const ring = []; for (let s = 0; s < seg; s++) { const a = s / seg * TAU; ring.push(m.v(cos(a) * r, h, sin(a) * r, 0.15)); } rings.push(ring); }
  const under = [], top = [];
  for (let k = 1; k <= nr; k++) { const t = k / nr, ru = [], rt = []; for (let s = 0; s < seg; s++) { const a = s / seg * TAU, q = cap(t, a); ru.push(m.v(q[0], q[1] - 0.06 * (1 - t * 0.4), q[2], 0.5)); rt.push(m.v(q[0], q[1], q[2], 1)); } under.push(ru); top.push(rt); }
  const all = [...rings, ...under];
  for (let k = 0; k < all.length - 1; k++) for (let s = 0; s < seg; s++) { const s2 = (s + 1) % seg; m.quad(all[k][s], all[k + 1][s], all[k + 1][s2], all[k][s2]); }
  const lastU = under[under.length - 1], lastT = top[top.length - 1];
  for (let s = 0; s < seg; s++) { const s2 = (s + 1) % seg; m.quad(lastU[s], lastT[s], lastT[s2], lastU[s2]); } // the rim
  for (let k = top.length - 1; k > 0; k--) for (let s = 0; s < seg; s++) { const s2 = (s + 1) % seg; m.quad(top[k][s], top[k - 1][s], top[k - 1][s2], top[k][s2]); }
  const c = m.v(0, 0.56, 0, 1); for (let s = 0; s < seg; s++) m.tri(top[0][(s + 1) % seg], top[0][s], c);
  return m;
}
// stone whale fluke: SDF of tapered capsules -> surface nets
function meshFluke() {
  const C = [];
  const chain = (pts, zs) => { for (let i = 0; i < pts.length - 1; i++) C.push([...pts[i], ...pts[i + 1], zs]); };
  chain([[0, -1.6, 3.7, 1.2], [0, 1.8, 2.35, 0.98], [0, 4.6, 1.0, 0.76], [0, 6.9, 0.1, 0.6]], 0.8);
  chain([[0, 6.6, 0.1, 0.72], [1.9, 7.9, 0, 0.98], [3.9, 8.8, -0.1, 0.9], [5.7, 9.8, -0.25, 0.64], [7.0, 11.2, -0.4, 0.38], [7.7, 12.8, -0.55, 0.2], [7.9, 14.1, -0.65, 0.1]], 0.18);
  chain([[0, 6.6, 0.1, 0.72], [-1.7, 8.3, 0.05, 0.96], [-3.3, 9.7, -0.05, 0.88], [-4.7, 11.2, -0.2, 0.64], [-5.6, 12.9, -0.4, 0.38], [-6.0, 14.6, -0.5, 0.2], [-5.9, 15.9, -0.6, 0.1]], 0.18);
  const sdf = (x, y, z) => {
    let d = 1e9;
    for (const c of C) {
      const zs = c[8], pz = z / zs, az = c[2] / zs, bz = c[6] / zs;
      const bax = c[4] - c[0], bay = c[5] - c[1], baz = bz - az, pax = x - c[0], pay = y - c[1], paz = pz - az;
      const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
      const e = (hypot(pax - bax * h, pay - bay * h, paz - baz * h) - mix(c[3], c[7], h)) * zs;
      const k = 0.45, hh = max(k - abs(d - e), 0) / k;
      d = min(d, e) - hh * hh * k * 0.25;
    }
    return d;
  };
  const vs = 0.09, ox = -7.6, oy = -2.6, oz = -2.2, nx = 186, ny = 216, nz = 76, D = new Float32Array(nx * ny * nz);
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) D[x + nx * (y + ny * z)] = -sdf(ox + x * vs, oy + y * vs, oz + z * vs);
  const sn = surfaceNets(D, nx, ny, nz), smp = sampler3(D, nx, ny, nz);
  const vb = new ArrayBuffer(sn.nv * 16), f = new Float32Array(vb), s = new Int8Array(vb);
  for (let k = 0; k < sn.nv; k++) {
    const x = sn.pos[k * 3], y = sn.pos[k * 3 + 1], z = sn.pos[k * 3 + 2], e = 0.7;
    let ax = smp(x - e, y, z) - smp(x + e, y, z), ay = smp(x, y - e, z) - smp(x, y + e, z), az = smp(x, y, z - e) - smp(x, y, z + e);
    const l = hypot(ax, ay, az) || 1;
    f[k * 4] = ox + x * vs; f[k * 4 + 1] = oy + y * vs; f[k * 4 + 2] = oz + z * vs;
    s[k * 16 + 12] = round(ax / l * 127); s[k * 16 + 13] = round(ay / l * 127); s[k * 16 + 14] = round(az / l * 127); s[k * 16 + 15] = 127;
  }
  return { vb, ib: new Uint32Array(sn.idx), nv: sn.nv };
}
// sunken ship (bow at +x): keel with stem and stern posts, curved ribs, hull planking with a breach,
// raised stern castle with transom, deck remnants, two masts with yards, bowsprit
function meshShip() {
  rseed(220);
  const m = new Mesh(), Lh = 17, B = 5.6, Dp = 7.6;
  const hb = (x) => B * pow(max(1 - pow(abs(x / Lh), x < 0 ? 3.6 : 2.6), 0), 0.5);
  const dp = (x) => Dp * (1 - 0.36 * pow(abs(x / Lh), 2.5));
  const sheer = (x) => 0.5 + (x > 0 ? 3.0 : 3.8) * pow(abs(x / Lh), 2.2);
  const pt = (x, ph, off = 0) => { const b = hb(x) + off, d = dp(x) + off, s = sheer(x); return [x, s - (d + s) * pow(max(cos(ph), 0), 0.66), b * Math.sign(ph) * pow(abs(sin(ph)), 0.8)]; };
  const out = (p) => { const l = hypot(p[1] + 0.5, p[2] * 1.3) || 1; return [0, (p[1] + 0.5) / l, p[2] * 1.3 / l]; };
  const up = () => [0, 1, 0];
  const keel = [];
  for (let i = 0; i <= 44; i++) { const x = mix(-Lh - 1.0, Lh + 2.4, i / 44), e = max(abs(x) / Lh - 0.78, 0) * 4.2; keel.push([x, -dp(clamp(x, -Lh, Lh)) - 0.3 + e * e * e * 4.2, 0]); }
  m.sweep(keel, 0.55, 0.95, up);
  for (let x = -Lh + 0.7; x < Lh - 0.3; x += 0.8) {
    const a0 = rnd() < 0.1 ? rr(-0.9, -0.2) : -PI / 2, a1 = rnd() < 0.1 ? rr(0.2, 0.9) : PI / 2, pts = [];
    for (let i = 0; i <= 16; i++) pts.push(pt(x, mix(a0, a1, i / 16)));
    m.sweep(pts, 0.24, 0.3, out);
  }
  const holeX = rr(-6, 2), holeS = rnd() < 0.5 ? 1 : -1;
  const BR = [[holeX, holeS * 0.8, 3.2, 0.42], [7, -holeS * 0.95, 2.4, 0.34], [12, holeS * 0.5, 1.7, 0.28], [-11, -holeS * 0.55, 2.1, 0.3]];
  const holed = (x, ph) => { for (const h of BR) { const a = (x - h[0]) / h[2], b = (ph - h[1]) / h[3]; if (a * a + b * b < 1 + 0.45 * sin(x * 3.1 + ph * 9)) return true; } return false; };
  const NS = 14, xs = []; for (let x = -Lh + 0.35; x <= Lh - 0.3; x += 0.85) xs.push(x);
  for (let j = 0; j < NS; j++) {
    const p0 = mix(-1.5, 1.5, j / NS), p1 = mix(-1.5, 1.5, (j + 1) / NS), sg = p0 + p1 < 0 ? -1 : 1, lo = sg < 0 ? p1 : p0, hi = sg < 0 ? p0 : p1;
    let pv = null;
    for (const x of xs) {
      const cu = [m.v(...pt(x, lo, 0.27)), m.v(...pt(x, hi, 0.14)), m.v(...pt(x, lo, 0.1)), m.v(...pt(x, hi, 0.1))];
      if (pv && !holed(x - 0.42, (p0 + p1) / 2)) {
        if (sg > 0) { m.quad(pv[0], pv[1], cu[1], cu[0]); m.quad(pv[2], cu[2], cu[3], pv[3]); }
        else { m.quad(pv[0], cu[0], cu[1], pv[1]); m.quad(pv[2], pv[3], cu[3], cu[2]); }
      }
      pv = cu;
    }
  }
  for (const sgn of [-1, 1]) {
    let pts = []; for (let x = -Lh + 0.6; x <= Lh - 0.6; x += 1) pts.push(pt(x, sgn * PI / 2, 0.2)); m.sweep(pts, 0.3, 0.28, up);
    // stern castle bulwarks
    for (let j = 0; j < 3; j++) { pts = []; for (let x = -Lh + 0.4; x <= -Lh + 8.5 - j; x += 0.9) pts.push([x, sheer(x) + 0.55 + j * 0.86, sgn * (max(hb(x), 2.6) + 0.15)]); m.sweep(pts, 0.82, 0.09, () => [0, 0, sgn]); }
  }
  // transom
  for (let y = -3; y < sheer(-Lh) + 3; y += 0.86) { const w = max(1.2, 2.9 * sstep(-4.5, 1.5, y)); if (rnd() < 0.9) m.sweep([[-Lh + 0.35, y, -w], [-Lh + 0.35, y, w]], 0.82, 0.1, () => [1, 0, 0]); }
  for (let x = -Lh + 2; x < Lh - 2; x += rr(1.8, 3.2)) m.sweep([[x, sheer(x) - 0.25, -hb(x)], [x, sheer(x) - 0.2, 0], [x, sheer(x) - 0.25, hb(x)]], 0.26, 0.26, up);
  for (let z = -3.9; z <= 3.9; z += 0.62) { let x = -Lh + rr(1, 5); while (x < Lh - 4) { const x1 = min(x + rr(3, 9), Lh - 3.5); if (rnd() < 0.6) { const pts = []; for (let xx = x; xx <= x1; xx += 1) if (hb(xx) > abs(z) + 0.3) pts.push([xx, sheer(xx) - 0.05, z]); if (pts.length > 1) m.sweep(pts, 0.56, 0.07, up); } x = x1 + rr(0.5, 3); } }
  // foremast with yard, broken main mast, bowsprit
  m.sweep([[7, -Dp + 0.6, 0], [7.1, 1, 0], [7.4, 8, 0.3], [7.8, 15, 0.8]], (k) => 0.62 - k * 0.1, (k) => 0.62 - k * 0.1, () => [1, 0, 0]);
  m.sweep([[7.5, 9.5, -5.2], [7.5, 9.6, 0.3], [7.5, 9.2, 5.6]], 0.26, 0.26, up);
  m.sweep([[7.7, 13.2, -3.2], [7.7, 13.3, 3.6]], 0.2, 0.2, up);
  m.sweep([[-3, -Dp + 0.6, 0], [-3.2, 1, 0.2], [-3.9, 6, 1.0], [-5.2, 9.5, 2.6]], (k) => 0.74 - k * 0.1, (k) => 0.74 - k * 0.1, () => [1, 0, 0]);
  m.sweep([[Lh + 1.4, 2.6, 0], [Lh + 8, 5.2, 0.2]], 0.34, 0.34, up);
  return m;
}
// manta ray: span along x (half span = 1), nose +z; aux = span coordinate for the flap animation
function meshManta() {
  const m = new Mesh(), NU = 72, M = 22, rings = [];
  for (let j = 0; j <= NU; j++) {
    const u = j / NU * 2 - 1, au = abs(u);
    let zl = 0.52 - 0.74 * pow(au, 1.35) + 0.07 * exp(-pow((au - 0.13) / 0.05, 2)) - 0.05 * exp(-pow(au / 0.05, 2)) - 0.08 * pow(au, 5);
    const zt = -0.5 + 0.3 * pow(au, 0.8) + 0.02 - 0.08 * pow(au, 5);
    if (zl < zt + 0.004) zl = zt + 0.004;
    const th = 0.08 * pow(1 - au, 1.15) + 0.004 + 0.12 * exp(-pow(u / 0.2, 2)), ring = [];
    for (let k = 0; k < M; k++) { const a = k / M * TAU; ring.push(m.v(u, th * sin(a) * (0.62 + 0.38 * cos(a)), mix(zt, zl, 0.5 + 0.5 * cos(a)), u)); }
    rings.push(ring);
  }
  for (let j = 0; j < NU; j++) for (let k = 0; k < M; k++) { const k2 = (k + 1) % M; m.quad(rings[j][k], rings[j + 1][k], rings[j + 1][k2], rings[j][k2]); }
  const tail = []; for (let i = 0; i <= 8; i++) tail.push([0, 0, -0.42 - i * 0.19]);
  const n0 = m.p.length / 3;
  m.tube(tail, (k) => 0.016 * (1 - k / 9), 4, true);
  for (let k = n0; k < m.aux.length; k++) m.aux[k] = 0;
  for (const sx of [-1, 1]) { // cephalic fins
    const n1 = m.p.length / 3;
    m.tube([[sx * 0.12, -0.02, 0.48], [sx * 0.135, -0.05, 0.6], [sx * 0.115, -0.09, 0.69], [sx * 0.085, -0.125, 0.74]], (k) => 0.045 * (1 - k / 4.4), 6, true);
    for (let k = n1; k < m.aux.length; k++) m.aux[k] = sx * 0.1;
  }
  return m;
}
function meshFish() {
  const m = new Mesh();
  const X = [0.5, 0.3, 0.05, -0.22, -0.34], H = [0.01, 0.13, 0.17, 0.09, 0.035], Wd = [0.01, 0.05, 0.065, 0.03, 0.012], rings = [];
  for (let i = 0; i < 5; i++) { const r = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; r.push(m.v(X[i], sin(a) * H[i], cos(a) * Wd[i])); } rings.push(r); }
  for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; m.quad(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k2]); }
  const a = m.v(-0.33, 0, 0), b = m.v(-0.56, 0.2, 0), c = m.v(-0.47, 0, 0), d = m.v(-0.56, -0.2, 0);
  m.tri(a, b, c); m.tri(a, c, d);
  return m;
}
