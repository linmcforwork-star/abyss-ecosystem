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
function tank(x = -6, z = 36, cols = [0, 1, 2], s = 1) {
  if (!TANK) TANK = nAnem;
  nAnem = TANK; let c = 0;
  cols.forEach((col, j) => {
    const hx = x + (j - (cols.length - 1) / 2) * 1.9 * s, hz = z + (j % 2) * 0.4, a = [hx, floorAt(hx, hz), hz, s, (col + 0.5) / 6, 0, 0];
    ANE[nAnem] = a; AN.set([a[0], a[1], a[2], a[3], a[4], 0, 0, 0], nAnem * 8);
    for (let i = 0, m = 0; i < nA && m < 2; i++) if (SP[i] === 0 && !(i in tank.used)) { tank.used[i] = 1; HM[i] = nAnem; P[i * 3] = hx; P[i * 3 + 1] = a[1] + 0.4 * s; P[i * 3 + 2] = hz; m++; c++; }
    nAnem++;
  });
  return 'tank at ' + [x, z] + ', ' + cols.length + ' anemones, ' + c + ' clownfish';
}
tank.used = {};
window.__dev = { lookAt, F, POSES, tank, set tankOff(v) { TANK = 0; }, set nearK(v) { NEARK = v; }, set gn(v) { GNITE = v; }, get menu() { return menu; }, go: () => ui(false), setHour: (h) => { HOUR = h; }, P, SP, ST, LEN, Hd, get nA() { return nA; }, follow, camTo, unfollow, get fol() { return fol; }, ANE, HEADS, STA, HOL, AN, get counts() { return [nEcoF, nEcoS, nEcoE, nAnem, nA]; }, floorAt, rockAt };
