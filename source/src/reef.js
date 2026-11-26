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
// sea anemones, seven kinds, each a near (lo = 0) and a far (lo = 1, few fat tentacles) version.
// aux: -0.5 for the disc / column, tentacles (seed * 5 + ring) / 127 so each sways on its own (vsAnem). Every tentacle has
// 5 points (ring 0 at the base .. 4 at the tip). Kinds: 0 magnificent (Heteractis), 1 carpet (Stichodactyla), 2 bubble-tip
// (Entacmaea), 3 long-tentacle sand anemone (Macrodactyla), 4 tube-dwelling anemone (Cerianthus, a tall tube),
// 5 Mediterranean beadlet anemone (Actinia) open, 6 the same shut into a red dome (both parked for a future
// Mediterranean zone), 7 beaded sea anemone (Heteractis aurora)
function meshAnem(kind, lo) {
  rseed(232 + kind * 7);
  const m = new Mesh();
  const tent = (n, place, rad, sides) => {
    // aux = (seed * 16 + 15 * position along the tentacle) / 127; rad: per-point array, or a function of that position
    for (let i = 0; i < n; i++) { const t = place(i, n); if (!t) continue; const np = t.pts.length, sd = i % 7, u = (k) => k / (np - 1);
      m.tube(t.pts, (k) => t.r * (Array.isArray(rad) ? rad[k] : rad(u(k))), sides, 'round', (k) => (sd * 16 + Math.round(u(k) * 15)) / 127); }
  };
  const lobe = (a) => 0.6 * sin(a * 9 + 0.7) + 0.4 * sin(a * 13 + 2.1) + 0.3 * sin(a * 4);
  // a flat disc of rings (wavy rim for the carpet)
  const disc = (R, y0, h, wav, nr = 4, ns = 24, hf = null) => {
    const rows = [];
    for (let r = 0; r <= nr; r++) { const row = [], f = r / nr; for (let s = 0; s < ns; s++) { const a = s / ns * TAU, rr0 = R * f * (1 + wav * f * lobe(a * 1.8) * 0.5);
      row.push(m.v(cos(a) * rr0, y0 + h * (1 - f * f) + wav * f * f * 0.25 * lobe(a * 1.8 + 0.4) * R + (hf ? hf(cos(a) * rr0, sin(a) * rr0) : 0), sin(a) * rr0, -0.5)); } rows.push(row); }
    for (let r = 0; r < nr; r++) for (let s = 0; s < ns; s++) { const s2 = (s + 1) % ns; m.quad(rows[r][s2], rows[r][s], rows[r + 1][s], rows[r + 1][s2]); }
  };
  const spiral = (i, n, R) => [i * 2.39996 + rr(-0.15, 0.15), R * 0.98 * sqrt((i + 0.5) / n)];
  const F = lo ? 4 : 1, S = lo ? 4 : 6; // far: a quarter of the tentacles, fatter
  if (kind === 0) {
    // magnificent (the violet hero): a short column whose rim carries thick, soft tentacles that rise and open outward
    // like a vase, with an open hollow in the middle where the clownfish sit
    // magnificent anemone (refs: anatomy/heteractis-magnifica): a smooth, satiny, strongly coloured column like a
    // rounded drum, about half as tall as wide; on top a disc with a few broad waves whose rim turns up; finger tentacles
    // cover the disc, the inner ones stand up, the rim ones lean out and droop over the column's edge
    const R = 0.4, H = 0.38, WV = 0.35;
    m.tube([[0, -0.04, 0], [0, H * 0.3, 0], [0, H * 0.65, 0], [0, H * 0.9, 0], [0, H, 0]], (k) => R * [0.7, 0.98, 1.08, 1.02, 0.94][k], lo ? 10 : 28, false, () => -0.5);
    const top = (a, f) => H + 0.02 + 0.05 * f * f * f * (1 + sin(a * 5 + 0.6)) ;   // the rim turns up in 5 broad waves
    { const nr = lo ? 4 : 6, ns = lo ? 20 : 56, rows = [];
      for (let r = 0; r <= nr; r++) { const row = [], f = r / nr; for (let k = 0; k < ns; k++) { const a = k / ns * TAU, rq = R * 0.95 * f; row.push(m.v(cos(a) * rq, top(a, f), sin(a) * rq, -0.4)); } rows.push(row); }
      for (let r = 0; r < nr; r++) for (let k = 0; k < ns; k++) { const k2 = (k + 1) % ns; m.quad(rows[r][k2], rows[r][k], rows[r + 1][k], rows[r + 1][k2]); } }
    const TP = lo ? [0, 0.5, 1] : [0, 0.35, 0.68, 1];
    tent(lo ? 150 : 660, (i, n) => {
      const a = i * 2.39996 + rr(-0.1, 0.1), f = min(1, 0.15 + 0.85 * sqrt((i + 0.5) / n)), rq = R * 0.95 * f, x = cos(a) * rq, z = sin(a) * rq, y = top(a, f);
      const tilt = 0.05 + 1.1 * Math.pow(f, 2) + rr(-0.1, 0.1), L = rr(0.18, 0.26) * (1.35 - 0.45 * f), ph = rr(0, 6.3), w = rr(0.02, 0.04), droop = 0.9 * Math.pow(f, 3), bend = rr(0.4, 1.0) * (0.4 + 0.6 * f);
      const ox = cos(a), oz = sin(a), tx = -oz, tz = ox;
      return { r: rr(0.0115, 0.015) * (lo ? 1.4 : 1), pts: TP.map((t) => { const o = sin(tilt) * L * t + 0.5 * bend * cos(tilt) * L * t * t, h = cos(tilt) * L * t - 0.5 * bend * sin(tilt) * L * t * t - droop * L * t * t, c = w * sin(t * 3.5 + ph) * t, ld = 0.1 * L * t * t;
        return [x + ox * o + tx * c + ld, y + h, z + oz * o + tz * c + 0.4 * ld]; }) };
    }, (t) => 1 - 0.12 * t + 0.08 * Math.exp(-(((t - 0.9) / 0.08) ** 2)), lo ? 3 : 5); // fingers of even thickness, blunt round ends
  } else if (kind === 1) {
    // carpet (the blue hero): a broad, gently waved mat packed with short tentacles that end in small round beads
    // giant carpet anemone (refs: anatomy/stichodactyla-gigantea): a broad saucer whose rim rises and is thrown into
    // 9 deep folds that roll up and over like waves; the centre dips to a pale mouth; the whole disc, rim included, is
    // a dense pile of very short tentacles standing out from the surface
    const R = 0.62, NF = 9, PH = 0.7;
    // folds: broad rounded crests, narrow deep troughs (|cos|^0.5), a fold every 40 degrees, slightly irregular
    const surf = (a, f) => { const w = 2 * Math.pow(Math.abs(cos((a * NF + PH + 0.35 * sin(a * 3)) * 0.5)), 0.5) - 1, rim = f * f * f;
      return [R * f * (1 + 0.14 * rim * w), 0.04 + 0.08 * f * f + 0.17 * rim * w]; };          // [radius, height]
    { const nr = 12, ns = lo ? 72 : 144, rows = [];
      for (let r = 0; r <= nr; r++) { const row = [], f = r / nr; for (let k = 0; k < ns; k++) { const a = k / ns * TAU, [rq, h] = surf(a, f); row.push(m.v(cos(a) * rq, h, sin(a) * rq, -0.5)); } rows.push(row); }
      for (let r = 0; r < nr; r++) for (let k = 0; k < ns; k++) { const k2 = (k + 1) % ns; m.quad(rows[r][k2], rows[r][k], rows[r + 1][k], rows[r + 1][k2]); }
      // the rim's underside down to the sand, so the folds read as solid, not a floating sheet
      const lip = []; for (let k = 0; k < ns; k++) { const a = k / ns * TAU, [rq] = surf(a, 1); lip.push(m.v(cos(a) * rq * 0.93, -0.02, sin(a) * rq * 0.93, -0.5)); }
      for (let k = 0; k < ns; k++) { const k2 = (k + 1) % ns; m.quad(rows[nr][k], rows[nr][k2], lip[k2], lip[k]); } }
    tent(lo ? 900 : 2200, (i, n) => {
      let a = i * 2.39996 + rr(-0.15, 0.15);
      if (i % 2 === 0) { // the outer wall of the rolled-over rim is just as densely covered: tentacles stand out from the wall
        for (let k = 0; k < 8; k++) { a = rnd() * TAU; if (rnd() * 0.31 < surf(a, 1)[1] + 0.02) break; } // more where the wall is tall (the crests)
        const [rq, y] = surf(a, 1), u = Math.sqrt(rnd()) * 0.95, x = cos(a) * rq * (1 - 0.07 * u), z = sin(a) * rq * (1 - 0.07 * u), yy = mix(y, -0.02, u), L = rr(0.035, 0.055) * (lo ? 1.3 : 1);
        const ox = cos(a) * 0.85, oy = 0.5 - 0.3 * u, ol = Math.hypot(ox, oy, 0.85 * sin(a)) || 1;
        return { r: rr(0.005, 0.0062) * (lo ? 2 : 1), pts: (lo ? [0, 0.5, 1] : [0, 0.4, 0.75, 1]).map((t) => [x + ox / ol * L * t, yy + (oy / ol + 0.3 * t) * L * t, z + 0.85 * sin(a) / ol * L * t]) };
      }
      const f = min(1, 0.12 + 0.9 * sqrt((i + 0.5) / n)), [rq, y] = surf(a, f), x = cos(a) * rq, z = sin(a) * rq;
      const [r2, y2] = surf(a, min(1, f + 0.02)), [r3, y3] = surf(a + 0.02, f);                     // surface normal from two tangents
      const t1 = [cos(a) * r2 - x, y2 - y, sin(a) * r2 - z], t2 = [cos(a + 0.02) * r3 - x, y3 - y, sin(a + 0.02) * r3 - z];
      let nx = t1[1] * t2[2] - t1[2] * t2[1], ny = t1[2] * t2[0] - t1[0] * t2[2], nz = t1[0] * t2[1] - t1[1] * t2[0]; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const L = rr(0.035, 0.055) * (lo ? 1.3 : 1), sw = sin(x * 9 + 1) + cos(z * 7);
      return { r: rr(0.005, 0.0062) * (lo ? 2 : 1), pts: (lo ? [0, 0.5, 1] : [0, 0.4, 0.75, 1]).map((t) => [x + (nx + cos(sw) * 0.25) * L * t, y - 0.004 + ny * L * t, z + (nz + sin(sw) * 0.25) * L * t]) };
    }, (t) => 1 - 0.2 * t + 0.5 * Math.exp(-(((t - 0.93) / 0.07) ** 2)), lo ? 4 : 6);
  } else if (kind === 2) {
    // bubble-tip (Entacmaea quadricolor; refs: anatomy/entacmaea-quadricolor, fluorescent/peach-anemone-clown): the body hidden
    // in a hole, only a low cupped disc shows; from it a loose upright bouquet (height ~ 2/3 of width, not a koosh ball) of
    // tentacles leaning up and out, each a stalk, then a swollen bulb (~1.7x) just below a short nipple tip; about a
    // quarter are long and stringy with no bulb. Peach (fsAnem). ~20k triangles near
    const Rd = 0.15; disc(Rd, 0.0, 0.04, 0, 3, lo ? 10 : 20);
    // (aquarium form, like the owner's reference: bulbs only half inflated) long soft tentacles that rise, arch out and
    // droop, each only gently swollen just below its pale tip
    const TB = lo ? [0, 0.4, 0.75, 1] : [0, 0.2, 0.4, 0.58, 0.74, 0.86, 0.94, 1];
    const BR = lo ? [1, 0.95, 1.15, 0.7] : [1, 0.95, 0.9, 0.88, 1.05, 1.35, 1.3, 0.7];
    tent(lo ? 45 : 140, (i, n) => {
      const [a, r] = spiral(i, n, Rd * 0.95), f = r / Rd, ox = cos(a), oz = sin(a), tx = -oz, tz = ox;
      const L = rr(0.2, 0.28) * (1.1 - 0.25 * f), tilt = 0.15 + 0.9 * f + rr(-0.15, 0.15), bend = rr(0.5, 1.0) * (0.4 + 0.8 * f), w = rr(-0.3, 0.3), ph = rr(0, 6.3);
      return { r: rr(0.0065, 0.008) * (lo ? 1.5 : 1), pts: TB.map((t) => { const o = sin(tilt) * L * t + 0.5 * bend * cos(tilt) * L * t * t, h = cos(tilt) * L * t - 0.5 * bend * sin(tilt) * L * t * t * 1.4, c = (w * t * t + 0.04 * sin(ph + t * 4) * t) * L;
        return [ox * (r + o) + tx * c, 0.03 * (1 - f * f) + max(h, 0.01 - 0.03 * (1 - f * f)), oz * (r + o) + tz * c]; }) };
    }, BR, lo ? 4 : 6);
  } else if (kind === 3) {
    // long-tentacle sand anemone (Radianthus/Macrodactyla doreensis; refs: scratchpad long/, Anilao photos): the column is
    // buried, only a small disc shows; from it rises a dense round bouquet of smooth, glossy tentacles of even thickness.
    // The inner ones stand up and curl over into loops at the end; the outer ring spreads flat like a skirt, then droops
    // onto the sand and curls under. Yellow-green (fsAnem). ~22k triangles near
    const R = 0.11, NP = lo ? 6 : 11;
    disc(R, 0.005, 0.02, 0, 2, lo ? 10 : 20);
    const rv = (v, k, a) => { const c = cos(a), s2 = sin(a), d = v[0] * k[0] + v[1] * k[1] + v[2] * k[2];
      return [v[0] * c + (k[1] * v[2] - k[2] * v[1]) * s2 + k[0] * d * (1 - c), v[1] * c + (k[2] * v[0] - k[0] * v[2]) * s2 + k[1] * d * (1 - c), v[2] * c + (k[0] * v[1] - k[1] * v[0]) * s2 + k[2] * d * (1 - c)]; };
    tent(lo ? 45 : 180, (i, n) => {
      const [a, r] = spiral(i, n, R), f = r / R, ox = cos(a), oz = sin(a), sk = f > 0.7; // outer ring: the skirt
      // core: a near-upright vase (height ~ width), only the last quarter curls into an open loop on about half of them;
      // skirt: spreads flat and wide over the sand, the ends drooping down
      const L = sk ? rr(0.2, 0.26) : rr(0.3, 0.38) * (1.05 - 0.15 * f), tilt = sk ? rr(0.7, 0.9) : 0.05 + 0.2 * f / 0.7;
      const k0 = [-oz, 0, ox]; // curl axis: sideways, so every tentacle stays in its own radial plane (no crossing); loops roll outward and down
      const curl = sk ? rr(1.3, 1.7) : (rr(0, 1) < 0.65 ? rr(2.7, 3.3) : rr(0.4, 0.9)), c0 = sk ? 0.35 : 0.7;
      let p = [ox * r, 0.01, oz * r], d = [ox * sin(tilt), cos(tilt), oz * sin(tilt)]; const pts = [p.slice()];
      const tt = (k) => 1 - Math.pow(1 - k / (NP - 1), 1.7); // points crowd toward the end, where the loop is
      for (let k = 1; k < NP; k++) { const t0 = tt(k - 1), t1 = tt(k), st = L * (t1 - t0);
        d = rv(d, k0, curl * max(0, t1 - max(t0, c0)) / (1 - c0) + (!sk && t1 > 0.55 && t0 < c0 ? 0.12 : 0));
        p = [p[0] + d[0] * st, max(p[1] + d[1] * st, 0.008), p[2] + d[2] * st]; pts.push(p.slice()); }
      return { r: rr(0.0045, 0.0055) * (lo ? 1.6 : 1), pts };
    }, (u) => (1 - 0.25 * u) * (1 - 0.4 * sstep(0.8, 1, u)), lo ? 3 : 4); // even thickness, the tips narrowing to ~45%
  } else if (kind === 5) {
    // Mediterranean beadlet anemone, open (refs: new-anemone/LOOKS.md): a short, smooth, glossy wine-red column like a vase
    // on a wide foot that hugs the rock, a little waist, then a crown of ~190 pink tentacles in rings: inner ones long and
    // rising, outer ones shorter, leaning out and drooping over the rim
    const R = 0.12, H = 0.13;
    m.tube([[0, -0.03, 0], [0, 0.004, 0], [0, H * 0.3, 0], [0, H * 0.65, 0], [0, H * 0.92, 0], [0, H, 0]], (k) => R * [1.22, 1.18, 0.95, 0.88, 0.96, 1.0][k], lo ? 12 : 26, false, () => -0.5);
    disc(R * 1.0, H - 0.005, 0.012, 0, 3, lo ? 12 : 26);
    const TP = lo ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
    tent(lo ? 50 : 190, (i, n) => {
      const ring = i % 6, f = 0.3 + 0.7 * (1 - ring / 5), a = i * 2.39996 + rr(-0.08, 0.08), rq = R * 0.95 * f, x = cos(a) * rq, z = sin(a) * rq, y = H + 0.01 * (1 - f);
      const L = rr(0.13, 0.17) * (1.45 - 0.6 * f), tilt = 0.25 + 1.15 * f * f + rr(-0.12, 0.12), bend = rr(0.5, 1.2) * (0.3 + 0.7 * f), droop = 0.7 * f * f * f, ph = rr(0, 6.3), w = rr(0.01, 0.03);
      const ox = cos(a), oz = sin(a), tx = -oz, tz = ox;
      return { r: rr(0.0055, 0.007) * (lo ? 1.6 : 1), pts: TP.map((t) => { const o = sin(tilt) * L * t + 0.5 * bend * cos(tilt) * L * t * t, h = cos(tilt) * L * t - 0.5 * bend * sin(tilt) * L * t * t - droop * L * t * t, c = w * sin(t * 3 + ph) * t;
        return [x + ox * o + tx * c, y + h, z + oz * o + tz * c]; }) };
    }, (t) => 1 - 0.55 * t, lo ? 4 : 6); // tapering to a slim, blunt tip
  } else if (kind === 6) {
    // the same anemone shut (touched, or low tide): a smooth glossy red dome, "a tomato", on its wide foot, the top
    // pulled in to a small pucker; the blue beads (acrorhagi) ring the top (painted, fsAnem)
    const R = 0.13;
    m.tube([[0, -0.03, 0], [0, 0.003, 0], [0, 0.03, 0], [0, 0.06, 0], [0, 0.085, 0], [0, 0.1, 0], [0, 0.108, 0]], (k) => R * [1.2, 1.16, 1.06, 0.98, 0.8, 0.45, 0.12][k], lo ? 12 : 28, false, () => -0.5);
    disc(R * 0.12, 0.108, -0.01, 0, 1, lo ? 12 : 28);
  } else if (kind === 7) {
    // beaded sea anemone (Heteractis aurora; refs: beaded-anemone/LOOKS.md, au03/au06 side by side with renders): the column
    // buried in sand, only a flat purple disc shows, packed with tentacles that rise, taper to a fine tip and curl over into
    // hooks and loops at the end; each is ringed with many small beads (painted, fsAnem). ~25k triangles near (budget, F)
    const R = 0.3;
    disc(R * 1.05, -0.005, -0.03, 0.08, 4, lo ? 16 : 32);
    const NP = lo ? 5 : 9;
    const rot = (v, k, a) => { const c = cos(a), s2 = sin(a), d = v[0] * k[0] + v[1] * k[1] + v[2] * k[2];   // Rodrigues: v about unit axis k
      return [v[0] * c + (k[1] * v[2] - k[2] * v[1]) * s2 + k[0] * d * (1 - c), v[1] * c + (k[2] * v[0] - k[0] * v[2]) * s2 + k[1] * d * (1 - c), v[2] * c + (k[0] * v[1] - k[1] * v[0]) * s2 + k[2] * d * (1 - c)]; };
    tent(lo ? 60 : 200, (i, n) => {
      const [a, r] = spiral(i, n, R * 0.95), f = r / R, ox = cos(a), oz = sin(a);
      const L = rr(0.1, 0.17) * (0.9 + 0.2 * f), tilt = 0.05 + 0.5 * f + rr(-0.15, 0.15), curl = rr(6, 9.5), tw = rr(-1, 1);
      // curl axis: mostly the sideways axis (hook over outward), turned a random amount toward the outward axis (sideways loops)
      const sx = -oz, sz = ox, k0 = [sx * cos(tw) + ox * sin(tw), 0, sz * cos(tw) + oz * sin(tw)];
      let p = [ox * r, -0.03 * (1 - f * f) + 0.004, oz * r], d = [ox * sin(tilt), cos(tilt), oz * sin(tilt)]; const pts = [p.slice()];
      for (let k = 1; k < NP; k++) { const t = k / (NP - 1); d = rot(d, k0, curl * 4 * max(0, t - 0.75) / (NP - 1) * (lo ? 1.6 : 1)); p = [p[0] + d[0] * L / (NP - 1), max(p[1] + d[1] * L / (NP - 1), -0.01), p[2] + d[2] * L / (NP - 1)]; pts.push(p.slice()); }
      return { r: rr(0.008, 0.01) * (lo ? 1.6 : 1), pts };
    }, (t) => 1 - 0.5 * t, lo ? 4 : 5); // tapering to a fine tip
  } else {
    // tube-dwelling anemone (Cerianthidae; refs: tube-anemone photos): the felt-like tube is almost all buried, only a short
    // collar shows; from it a big spray of long, very fine tentacles rises, arches out and droops, curling a little at the
    // ends; a short inner ring stands up round the dark mouth. Fluorescent cyan-green at night (fsAnem). ~14k triangles near
    const H = 0.12, Rt = 0.07, ns = lo ? 8 : 14;
    m.tube([[0, -0.05, 0], [0, H * 0.55, 0], [0, H, 0]], (k) => Rt * [1.2, 1.1, 1.08][k], ns, false, () => -0.5); // felt collar, a little flared
    disc(Rt * 1.0, H, -0.01, 0, 2, ns);
    const NP = lo ? 5 : 12;
    tent(lo ? 30 : 84, (i, n) => { // outer crown: each tentacle rises, arches out and droops, waving sideways and curling at the end
      const a = i * 2.39996 + rr(-0.1, 0.1), ring = i % 2, r = Rt * (0.8 + 0.12 * ring), L = rr(0.5, 0.7) * (1 - 0.15 * ring);
      const th0 = rr(0.1, 0.35) + 0.25 * ring, th1 = rr(1.8, 2.6), wv = rr(0.12, 0.3) * (rr(0, 1) < 0.5 ? -1 : 1), ph = rr(0, 6.3), cu = rr(0.4, 0.9) * (rr(0, 1) < 0.5 ? -1 : 1);
      const ox = cos(a), oz = sin(a), tx = -oz, tz = ox;
      let p = [ox * r, H, oz * r]; const pts = [p.slice()];
      for (let k = 1; k < NP; k++) { const t = k / (NP - 1), th = th0 + (th1 - th0) * t * t, yaw = wv * sin(t * 2.2 + ph) + cu * sstep(0.45, 1, t);
        const hx = sin(th) * cos(yaw), hs = sin(th) * sin(yaw), st = L / (NP - 1);
        p = [p[0] + (ox * hx + tx * hs) * st, max(p[1] + cos(th) * st, 0.012), p[2] + (oz * hx + tz * hs) * st]; pts.push(p.slice()); }
      return { r: rr(0.0095, 0.012) * (lo ? 1.4 : 1), pts };
    }, (t) => 1 - 0.72 * t, lo ? 3 : 5);
    tent(lo ? 0 : 28, (i, n) => { // inner ring round the dark mouth: short, rising then curling in over it
      const a = i / n * TAU + rr(-0.05, 0.05), r = Rt * 0.5, L = rr(0.08, 0.12), ox = cos(a), oz = sin(a), c = rr(1.6, 2.4);
      let p = [ox * r, H, oz * r]; const pts = [p.slice()];
      for (let k = 1; k < 5; k++) { const t = k / 4, th = -0.15 - c * t * t * 0.6; p = [p[0] + ox * sin(th) * L / 4, p[1] + cos(th) * L / 4, p[2] + oz * sin(th) * L / 4]; pts.push(p.slice()); }
      return { r: 0.0065, pts };
    }, (t) => 1 - 0.6 * t, 4);
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
