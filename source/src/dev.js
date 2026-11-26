// ============================================================================
// development tools: only in dev.html (npm run build:dev), never in index.html
// ============================================================================
//   F    fly the camera along the scripted path (FLY in main.js), one minute through the whole world
//   B    the same flight as a benchmark: the resolution stays fixed, every frame is timed, the result is shown at the end
//   F, B or 1-6 during a flight stop it
{
  const LOGN = 1 << 16, logFrame = new Float32Array(LOGN), logGpu = new Float32Array(LOGN);
  let flying = false, bench = false, last = 0, nFrame = 0, nGpu = 0;
  const stop = () => { flying = bench = false; dynT = 0; };
  const report = () => {
    const st = (a, n) => { const s = Array.from(a.subarray(0, n)).sort((x, y) => x - y); let sum = 0; for (const v of s) sum += v; return { n, avg: sum / n, p99: s[min(n - 1, floor(n * 0.99))], max: s[n - 1] }; };
    const fm = (o) => `avg ${o.avg.toFixed(2)}  p99 ${o.p99.toFixed(2)}  max ${o.max.toFixed(2)} ms`;
    const f = st(logFrame, nFrame);
    info.textContent = `Fly-through ${W}x${H}, ${f.n} frames\nframe  ${fm(f)}\nGPU    ${nGpu ? fm(st(logGpu, nGpu)) : 'timestamp-query unavailable'}`;
  };
  // frame() moves the free camera and then calls render(): step in between and put the camera on the path instead
  const draw = render;
  render = () => {
    if (flying) {
      const dtr = F[LAST] - last; last = F[LAST];
      F[FLT] += min(dtr / 1000, 0.1); flyAt();
      if (bench) { if (nFrame < LOGN) logFrame[nFrame++] = dtr; if (F[GPU] > 0 && nGpu < LOGN) logGpu[nGpu++] = F[GPU]; }
      if (F[FLT] >= FLYT) { if (bench) report(); stop(); }
    }
    draw();
  };
  addEventListener('keydown', (e) => {
    if (menu || e.repeat) return;
    if (e.code === 'KeyF' || e.code === 'KeyB') {
      if (flying) stop();
      else {
        flying = true; bench = e.code === 'KeyB'; F[FLT] = 0; last = F[LAST]; nFrame = nGpu = 0;
        // a benchmark hides the stats line and holds the resolution: dynT at -Infinity keeps frame() from tuning it
        if (bench) { hud = false; info.textContent = ''; dynT = -Infinity; }
      }
    } else if (/Digit[1-6]/.test(e.code)) stop();
  });
}
// test hook: lets automated screenshot scripts move the camera, set the time and frame an animal (dev.html only)
// test tank (dev only): three hero anemones side by side on bare sand, two clownfish each; everything else is hidden,
// so a close-up renders fast. Same meshes and shaders as the garden.
function tank(x = 3, z = 31, cols = [[0, 2, 1], [1, 0, 0.8], [2, 1, 1.6], [3, 1, 1.6], [4, 1, 1.6]], s = 0.8) { // [kind, colour, size]
  if (!TANK) TANK = nAnem;
  nAnem = TANK; let c = 0;
  cols.forEach(([kd, col, sz], j) => {
    const hx = x + (j - (cols.length - 1) / 2) * 1.9 * s, hz = z + (j % 2) * 0.4, a = [hx, floorAt(hx, hz), hz, s * sz, kd + (col + 0.5) / 6, 0, 0];
    ANE[nAnem] = a; AN.set([a[0], a[1], a[2], a[3], a[4], 0, 0, 0], nAnem * 8);
    for (let i = 0, m = kd > 2 ? 2 : 0; i < nA && m < 2; i++) if (SP[i] === 0 && !FROZ[i] && !(i in tank.used)) { tank.used[i] = 1; HM[i] = nAnem; setClown(i, a, m); P[i * 3] = hx; P[i * 3 + 1] = a[1] + 0.4 * s; P[i * 3 + 2] = hz; m++; c++; }
    if (kd === 0) for (let i = 0, m = 0; i < nA && m < 5; i++) if (SP[i] === 0 && !FROZ[i] && !(i in tank.used)) { tank.used[i] = 1; HM[i] = nAnem; setDasc(i); P[i * 3] = TG[i * 3] = hx + rr(-0.45, 0.45) * a[3]; P[i * 3 + 1] = TG[i * 3 + 1] = a[1] + (0.6 + rr(0.05, 0.3)) * a[3]; P[i * 3 + 2] = TG[i * 3 + 2] = hz + rr(-0.45, 0.45) * a[3]; m++; } // already in place: the headless renders run too few frames for them to swim there
    nAnem++;
  });
  // in front: the newest sample, a beaded sea anemone (kind 7) with a pair of Clark's clownfish
  // (the parked Mediterranean beadlets, kinds 5/6: tank.extra = [[5, 1.5, -0.35, -1.3], [6, 1.3, 0.3, -1.3]])
  (tank.extra || []).forEach(([kd, sz, dx, dz]) => { const hx = x + dx * s, hz = z + dz * s, a = [hx, floorAt(hx, hz), hz, s * sz, kd + 0.5 / 6, 0, 0]; ANE[nAnem] = a; AN.set([a[0], a[1], a[2], a[3], a[4], 0, 0, 0], nAnem * 8);
    if (kd === 7) for (let i = 0, m = 0; i < nA && m < 2; i++) if (SP[i] === 0 && !FROZ[i] && !(i in tank.used)) { tank.used[i] = 1; HM[i] = nAnem; setClown(i, a, m); P[i * 3] = TG[i * 3] = hx + rr(-0.2, 0.2); P[i * 3 + 1] = TG[i * 3 + 1] = a[1] + 0.15 * s; P[i * 3 + 2] = TG[i * 3 + 2] = hz + rr(-0.2, 0.2); m++; }
    nAnem++; });
  return 'tank at ' + [x, z] + ', ' + cols.length + ' anemones, ' + c + ' clownfish';
}
tank.used = {};
// dev: a still line-up of fish for side-on portraits: one of each clownfish (VR 0-3) in a row, facing +x
function lineup(x, y, z, vrs = [0, 1, 2, 3], gap = 0.9) {
  const ids = [];
  for (let i = 0, k = 0; i < nA && k < vrs.length; i++) if (SP[i] === 0 && !FROZ[i] && !(i in tank.used)) { FROZ[i] = 1; VR[i] = vrs[k]; LEN[i] = vrs[k] === 4 ? 0.2 : 0.3 * (vrs[k] === 3 ? 1.2 : vrs[k] === 1 ? 0.92 : 1); P[i * 3] = x + (k - (vrs.length - 1) / 2) * gap; P[i * 3 + 1] = y; P[i * 3 + 2] = z; Hd[i * 3] = 1; Hd[i * 3 + 1] = 0; Hd[i * 3 + 2] = 0; ids.push(i); k++; }
  return ids;
}
window.__dev = { lookAt, F, POSES, tank, VR, lineup, TG, HM, set tankOff(v) { TANK = 0; }, set nearK(v) { NEARK = v; }, set gn(v) { GNITE = v; }, get menu() { return menu; }, go: () => ui(false), setHour: (h) => { HOUR = h; }, P, SP, ST, LEN, Hd, get nA() { return nA; }, follow, camTo, unfollow, get fol() { return fol; }, ANE, HEADS, STA, HOL, AN, get counts() { return [nEcoF, nEcoS, nEcoE, nAnem, nA]; }, floorAt, rockAt };
// dev.html?tank opens straight at the five clownfish-home anemones in a row (test tank), for reviewing the look
if (/tank/.test(location.search)) { const tw = setInterval(() => { if (!nAnem || !window.__dev) return; clearInterval(tw);
  NEARK = 1; tank(); const k = nAnem - 3, h = [AN[k * 8], AN[k * 8 + 1], AN[k * 8 + 2]];
  lookAt(h[0], h[1] + 1.6, h[2] - 3.8, h[0], h[1] + 0.2, h[2] + 0.2);
}, 500); }
