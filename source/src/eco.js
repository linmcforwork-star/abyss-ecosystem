// ============================================================================
// the reef's animals: who lives where, what each one is doing, day and night, the info card, following an animal
// ============================================================================
// Behaviour is kept simple but true to life: see SPECIES.md for the sources behind every species and behaviour.

// ---------------------------------------------------------------- species
// zh / la: names; len: body length range (m); facts: shown on the card; doing: what each state means for it
const SPC = [
  { zh: '眼斑双锯鱼（小丑鱼）', la: 'Amphiprion ocellaris', len: [0.06, 0.1],
    facts: ['和海葵共生：身上的黏液让它不被海葵的刺细胞蜇伤，海葵的触手又替它挡住捕食者。', '一群里最大的是雌鱼。雌鱼不在了，最大的雄鱼会变成雌鱼。'] },
  { zh: '蓝绿光鳃鱼', la: 'Chromis viridis', len: [0.07, 0.1],
    facts: ['成群停在枝状珊瑚上方，头朝着水流，啄食漂过来的浮游生物。', '一有危险，整群一下子钻进珊瑚枝杈之间。'] },
  { zh: '裂唇鱼（清洁鱼）', la: 'Labroides dimidiatus', len: [0.07, 0.1],
    facts: ['在固定的"清洁站"工作：别的鱼专门游过来摆好姿势，让它啄掉身上的寄生虫和死皮。', '一条清洁鱼一天能接待上千次"顾客"。'] },
  { zh: '鹦嘴鱼', la: 'Chlorurus sordidus', len: [0.25, 0.36],
    facts: ['用像鸟嘴一样的牙齿刮食珊瑚岩上的藻类，啃下的碎石消化后排出，变成细细的白沙。', '晚上会从鳃里分泌黏液，把自己裹在一个"睡袋"里过夜，用来挡住吸血的小寄生虫。'] },
  { zh: '镰鱼（角镰鱼）', la: 'Zanclus cornutus', len: [0.14, 0.2],
    facts: ['常常成对或成小群活动，背鳍拉出一根长长的白色丝。', '主要吃海绵，也啄食藻类和礁石上的小动物。'] },
  { zh: '豹纹鳃棘鲈（东星斑）', la: 'Plectropomus leopardus', len: [0.45, 0.65],
    facts: ['伏击型捕食者：大部分时间静静停在珊瑚旁，看准时机突然冲出去捕食小鱼。', '清晨和黄昏捕猎最积极。'] },
  { zh: '黄尾副刺尾鱼（蓝倒吊）', la: 'Paracanthurus hepatus', len: [0.16, 0.25],
    facts: ['尾柄两侧各藏着一根锋利的"手术刀"棘，受威胁时用来自卫。', '受惊时会钻进珊瑚缝里躲起来。'] },
  { zh: '黑鳍礁鲨', la: 'Carcharhinus melanopterus', len: [1.2, 1.6],
    facts: ['背鳍和尾鳍尖端是醒目的黑色。', '常在浅水礁区巡游，黄昏和夜里更活跃。对人很胆怯，通常会主动避开潜水员。'] },
  { zh: '爪哇裸胸鳝（巨海鳝）', la: 'Gymnothorax javanicus', len: [1.5, 2.2],
    facts: ['白天藏在礁石洞里，只露出头。嘴一张一合不是要咬人，是在让水流过鳃来呼吸。', '夜里出洞觅食。是最大的海鳝之一，体长可超过 2.5 米。'] },
  { zh: '阿氏前口蝠鲼（珊瑚礁蝠鲼）', la: 'Mobula alfredi', len: [3, 3],
    facts: ['张大嘴滤食水里的浮游生物，翼展可达 5 米。', '每条蝠鲼腹部的斑点都不一样，研究者靠它认出每一个个体。'] },
  { zh: '华丽海葵', la: 'Heteractis magnifica', len: [0.8, 0.8],
    facts: ['小丑鱼的家。触手里有成千上万个刺细胞，能蜇伤靠近的小鱼。', '体内住着能光合作用的共生藻，所以喜欢阳光充足的浅水。'] },
];
// states
const S_HOVER = 0, S_HIDE = 1, S_TRAVEL = 2, S_GRAZE = 3, S_POSE = 4, S_CLEAN = 5, S_STALK = 6, S_BURST = 7, S_SLEEP = 8, S_PATROL = 9,
  S_GUARD = 10, S_FORAGE = 11, S_HOLE = 12, S_GONE = 13, S_ATE = 14;
const DOING = {
  0: { [S_HOVER]: '在海葵上方来回游动', [S_HIDE]: '发现危险，躲进了海葵的触手里', [S_GUARD]: '冲向靠近的你：它在保卫自己的海葵', [S_SLEEP]: '在海葵的触手里过夜' },
  1: { [S_HOVER]: '在珊瑚上方啄食浮游生物，头朝着水流', [S_HIDE]: '发现危险，钻进了珊瑚枝杈里', [S_SLEEP]: '躲在珊瑚枝杈里过夜' },
  2: { [S_HOVER]: '在清洁站上来回游动，等"顾客"上门', [S_CLEAN]: '正在给一条 {c} 清理寄生虫', [S_SLEEP]: '藏在礁石缝里睡觉' },
  3: { [S_TRAVEL]: '游向下一块珊瑚岩', [S_GRAZE]: '正在用"鸟嘴"刮食礁石上的藻类', [S_POSE]: '停在清洁站摆好姿势，等清洁鱼来清理', [S_SLEEP]: '裹在自己吐出的黏液"睡袋"里睡觉' },
  4: { [S_TRAVEL]: '和伙伴结伴巡游', [S_GRAZE]: '在礁石上啄食海绵和藻类', [S_POSE]: '停在清洁站让清洁鱼清理', [S_SLEEP]: '在礁石旁休息' },
  5: { [S_HOVER]: '静静停在珊瑚旁，等待伏击的机会', [S_STALK]: '悄悄靠近一群小鱼', [S_BURST]: '突然冲刺扑向小鱼！', [S_ATE]: '刚刚捕到了一条小鱼', [S_POSE]: '停在清洁站让清洁鱼清理', [S_SLEEP]: '在礁石旁休息' },
  6: { [S_TRAVEL]: '在珊瑚礁上方游动觅食', [S_GRAZE]: '在啃食礁石上的藻类', [S_POSE]: '停在清洁站让清洁鱼清理', [S_HIDE]: '受惊后钻进了珊瑚缝里', [S_SLEEP]: '躲在珊瑚缝里过夜' },
  7: { [S_PATROL]: '在礁区里巡游', [S_STALK]: '天色暗了，开始在礁区里觅食' },
  8: { [S_HOLE]: '从洞里探出头，一张一合地呼吸', [S_FORAGE]: '夜里出洞，在礁石间觅食', 15: '天快亮了，游回洞里' },
  9: { [S_PATROL]: '在礁区上方缓缓滑翔' },
  10: { [S_HOVER]: '触手随着水流摆动' },
};

// ---------------------------------------------------------------- time of day
// hours 0-24; daylight hours pass at 1 game hour per 40 s, night hours 2.5x faster. N fast-forwards.
let HOUR = 9, ffwd = 0;
const CUR = new Float64Array(3); // the current: slowly turning, ~0.1 m/s
const crep = () => (HOUR > 5 && HOUR < 7.5) || (HOUR > 16.5 && HOUR < 19); // dawn or dusk
const night = () => DAY < 0.2;

// ---------------------------------------------------------------- the seabed for the animals
const floorH = Wd.floorH;
function floorAt(x, z) {
  let i = x + 191.5, j = z + 191.5; i = i < 0 ? 0 : i > 382.99 ? 382.99 : i; j = j < 0 ? 0 : j > 382.99 ? 382.99 : j;
  const a = i | 0, b = j | 0, u = i - a, v = j - b, o = a + 384 * b;
  return (floorH[o] * (1 - u) + floorH[o + 1] * u) * (1 - v) + (floorH[o + 384] * (1 - u) + floorH[o + 385] * u) * v;
}
// distance to the rock (m, > 0 inside, clamped to ±1), from the collision bricks of main.js
function rockAt(X, Y, Z) {
  const x = (X - OX) / VS - CO, y = (Y - OY) / VS, z = (Z - OZ) / VS - CO;
  if (x < 1 || z < 1 || y < 5 || x > CN * 4 - 2 || z > CN * 4 - 2 || y > NY - 6) return -1;
  const ix = x | 0, iy = y | 0, iz = z | 0, u = x - ix, v = y - iy, a = cv(ix, iy, iz), b = cv(ix, iy + 1, iz), c = cv(ix, iy, iz + 1), d = cv(ix, iy + 1, iz + 1);
  const p = a + (cv(ix + 1, iy, iz) - a) * u, q = b + (cv(ix + 1, iy + 1, iz) - b) * u, r = c + (cv(ix + 1, iy, iz + 1) - c) * u, s = d + (cv(ix + 1, iy + 1, iz + 1) - d) * u;
  const e = p + (q - p) * v; return (e + (r + (s - r) * v - e) * (z - iz)) / 127;
}
const RG = new Float64Array(3);
function rockGrad(x, y, z) {
  const e = 0.4; let gx = rockAt(x + e, y, z) - rockAt(x - e, y, z), gy = rockAt(x, y + e, z) - rockAt(x, y - e, z), gz = rockAt(x, y, z + e) - rockAt(x, y, z - e);
  const l = sqrt(gx * gx + gy * gy + gz * gz); if (l < 1e-5) { RG[0] = 0; RG[1] = 1; RG[2] = 0; return; } RG[0] = gx / l; RG[1] = gy / l; RG[2] = gz / l;
}

// ---------------------------------------------------------------- the animals
const SP = new Int8Array(NA), ST = new Int8Array(NA), HM = new Int16Array(NA), GR = new Int16Array(NA), XI = new Int16Array(NA);
const P = new Float64Array(NA * 3), Vv = new Float64Array(NA * 3), Hd = new Float64Array(NA * 3), TG = new Float64Array(NA * 3), OF = new Float64Array(NA * 3);
const LEN = new Float32Array(NA), PH = new Float32Array(NA), TM = new Float32Array(NA), T2 = new Float32Array(NA), BEAT = new Float32Array(NA);
let nA = 0;
// shown bigger than life so you can tell them apart from the background fish at a glance (the small ones the most)
const SHOW = [1, 3, 3, 1.7, 2.2, 1.3, 2, 1, 1, 1];
const add = (sp, x, y, z, home, grp = -1) => {
  if (nA >= NA) return -1;
  const i = nA++, L = SPC[sp].len;
  SP[i] = sp; HM[i] = home; GR[i] = grp; XI[i] = -1; LEN[i] = rr(L[0], L[1]) * SHOW[sp]; PH[i] = rnd(); TM[i] = rr(0, 3); T2[i] = rr(10, 60);
  P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; TG[i * 3] = x; TG[i * 3 + 1] = y; TG[i * 3 + 2] = z;
  const a = rnd() * TAU; Hd[i * 3] = cos(a); Hd[i * 3 + 2] = sin(a);
  ST[i] = sp === 7 || sp === 9 ? S_PATROL : sp === 8 ? S_HOLE : sp === 3 || sp === 4 || sp === 6 ? S_TRAVEL : S_HOVER;
  return i;
};
const near = (list, x, z, r) => list.filter((p) => hypot(p[0] - x, p[2] - z) < r);
const pick = (list) => list[(rnd() * list.length) | 0];
const ANE = Wd.anemones, STA = Wd.stations, HOL = Wd.holes;
const HEADS = [];                 // chromis homes: coral heads spread over the reef, nearest to the viewpoints first
// groups (parrotfish, tangs, idols): a shared target, state and timer
const NG = 24, GT = new Float64Array(NG * 3), GH = new Float64Array(NG * 3), GS = new Int8Array(NG), GTM = new Float32Array(NG), GST = new Int16Array(NG), GSP = new Int8Array(NG), GN = new Int8Array(NG);
let nG = 0;
{
  rseed(77);
  const all = Wd.heads.slice().sort((a, b) => min(...POSES.map((p) => hypot(a[0] - p[0], a[2] - p[2]))) - min(...POSES.map((p) => hypot(b[0] - p[0], b[2] - p[2]))));
  for (const h of all) if (HEADS.length < 16 && !HEADS.some((q) => hypot(q[0] - h[0], q[2] - h[2]) < 9)) HEADS.push(h);
  if (!HEADS.length) HEADS.push([0, floorAt(0, 0) + 1, 0, 1]);
  // clownfish: a big female, a smaller male, sometimes a juvenile, in every anemone
  ANE.forEach((a, k) => { const n = 2 + (rnd() < 0.5); for (let j = 0; j < n; j++) { const i = add(0, a[0] + rr(-0.3, 0.3), a[1] + 0.35, a[2] + rr(-0.3, 0.3), k); if (i >= 0) LEN[i] = [0.26, 0.2, 0.15][j]; } }); // ~2.5x life size, so you can see them
  // chromis: a cloud over each coral head
  HEADS.forEach((h, k) => { const n = 10 + (rnd() * 10 | 0); for (let j = 0; j < n; j++) add(1, h[0] + rr(-0.5, 0.5), h[1] + rr(0.2, 0.9), h[2] + rr(-0.5, 0.5), k); });
  // cleaner wrasse at every station
  STA.forEach((s, k) => { add(2, s[0], s[1], s[2], k); if (rnd() < 0.4) add(2, s[0] + 0.2, s[1], s[2], k); });
  // coral trout lie in wait beside the chromis heads
  for (let k = 0; k < HEADS.length; k += 2) { const h = HEADS[k], a = rnd() * TAU; add(5, h[0] + cos(a) * 2.5, floorAt(h[0] + cos(a) * 2.5, h[2] + sin(a) * 2.5) + 0.4, h[2] + sin(a) * 2.5, k); }
  // roaming groups: parrotfish in threes, tangs in sixes, idols in pairs, each around its own part of the reef
  const homes = HEADS.length ? HEADS : [[0, -30, 0]];
  const group = (sp, n, h) => {
    if (nG >= NG) return; const g = nG++;
    GSP[g] = sp; GN[g] = n; GS[g] = S_TRAVEL; GTM[g] = rr(5, 15); GST[g] = -1;
    GH[g * 3] = h[0]; GH[g * 3 + 1] = h[1]; GH[g * 3 + 2] = h[2]; GT[g * 3] = h[0]; GT[g * 3 + 1] = h[1] + 2; GT[g * 3 + 2] = h[2];
    for (let j = 0; j < n; j++) { const i = add(sp, h[0] + rr(-2, 2), h[1] + rr(1, 3), h[2] + rr(-2, 2), j, g); if (i >= 0) { OF[i * 3] = rr(-1, 1) * (0.5 + n * 0.15); OF[i * 3 + 1] = rr(-0.4, 0.6); OF[i * 3 + 2] = rr(-1, 1) * (0.5 + n * 0.15); } }
  };
  for (let k = 0; k < 6; k++) group(3, 3, homes[(k * 5 + 1) % homes.length]);
  for (let k = 0; k < 3; k++) group(6, 6, homes[(k * 4 + 2) % homes.length]);
  for (let k = 0; k < 5; k++) group(4, 2, homes[(k * 3) % homes.length]);
  // morays in the wall holes, reef sharks patrolling, the mantas (drawn by main.js; tracked here for the card)
  HOL.slice(0, 10).forEach((h, k) => add(8, h[0], h[1], h[2], k));
  for (let k = 0; k < 3; k++) { const a = rnd() * TAU, R = rr(35, 80); const i = add(7, cos(a) * R, -20, sin(a) * R, k); if (i >= 0) { OF[i * 3] = a; OF[i * 3 + 1] = R; OF[i * 3 + 2] = rr(2.5, 5); } }
  for (let k = 0; k < Wd.mantas.length / 8; k++) { const i = add(9, 0, -20, 0, k); if (i >= 0) LEN[i] = Wd.mantas[k * 8 + 6] * 2; }
}
// anemone instances (static apart from closing at night)
for (let k = 0; k < ANE.length && k < 32; k++) { const a = ANE[k]; AN.set([a[0], a[1], a[2], a[3], a[4], 0, 0, 0], k * 8); }
nAnem = min(ANE.length, 32);

// ---------------------------------------------------------------- movement helpers
const PRED = [];                // indices of the predators (trout, sharks) for the prey's threat checks
for (let i = 0; i < nA; i++) if (SP[i] === 5 || SP[i] === 7) PRED.push(i);
const d2 = (i, x, y, z) => { const dx = P[i * 3] - x, dy = P[i * 3 + 1] - y, dz = P[i * 3 + 2] - z; return dx * dx + dy * dy + dz * dz; };
// how close the nearest threat is (predators, and the diver within `cam` m)
function threat(i, cam) {
  const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; let best = 1e9;
  for (const j of PRED) { const r = SP[j] === 7 ? 5 : ST[j] === S_BURST ? 3.5 : ST[j] === S_STALK ? 1.5 : 0; const q = sqrt(d2(j, x, y, z)); if (q < r && q < best) best = q; }
  if (cam > 0) { const q = sqrt(d2(i, F[CX], F[CY], F[CZ])); if (q < cam && q < best) best = q; }
  return best;
}
// steer toward TG at `speed` (m/s), arriving gently; keep out of the rock and above the seabed
function steer(i, speed, dt, acc = 2.5, minAlt = 0.05, avoid = true) {
  const o = i * 3; let dx = TG[o] - P[o], dy = TG[o + 1] - P[o + 1], dz = TG[o + 2] - P[o + 2];
  const dl = sqrt(dx * dx + dy * dy + dz * dz), s = min(speed, dl * 1.5) / (dl || 1);
  const k = min(1, dt * acc);
  Vv[o] += (dx * s - Vv[o]) * k; Vv[o + 1] += (dy * s - Vv[o + 1]) * k; Vv[o + 2] += (dz * s - Vv[o + 2]) * k;
  P[o] += Vv[o] * dt; P[o + 1] += Vv[o + 1] * dt; P[o + 2] += Vv[o + 2] * dt;
  if (avoid) {
    const m = 0.25 + LEN[i] * 0.3, r = rockAt(P[o], P[o + 1], P[o + 2]);
    if (r > -m) { rockGrad(P[o], P[o + 1], P[o + 2]); P[o] -= RG[0] * (r + m); P[o + 1] -= RG[1] * (r + m); P[o + 2] -= RG[2] * (r + m); const vn = Vv[o] * RG[0] + Vv[o + 1] * RG[1] + Vv[o + 2] * RG[2]; if (vn > 0) { Vv[o] -= RG[0] * vn; Vv[o + 1] -= RG[1] * vn; Vv[o + 2] -= RG[2] * vn; } }
  }
  if (minAlt > 0) { const f = floorAt(P[o], P[o + 2]) + minAlt; if (P[o + 1] < f) { P[o + 1] = f; if (Vv[o + 1] < 0) Vv[o + 1] = 0; } }
  if (P[o + 1] > -1.2) P[o + 1] = -1.2;
}
// turn the heading toward the velocity (or toward hx,hy,hz when given), pitch limited
function face(i, dt, hx = 0, hy = 0, hz = 0, rate = 4) {
  const o = i * 3; let x = hx, y = hy, z = hz;
  if (!x && !y && !z) { const sp = sqrt(Vv[o] * Vv[o] + Vv[o + 1] * Vv[o + 1] + Vv[o + 2] * Vv[o + 2]); if (sp < 0.03) return; x = Vv[o] / sp; y = Vv[o + 1] / sp; z = Vv[o + 2] / sp; }
  const lim = hy ? 0.95 : 0.6; y = y > lim ? lim : y < -lim ? -lim : y;
  const k = min(1, dt * rate); let a = Hd[o] + (x - Hd[o]) * k, b = Hd[o + 1] + (y - Hd[o + 1]) * k, c = Hd[o + 2] + (z - Hd[o + 2]) * k;
  const l = sqrt(a * a + b * b + c * c) || 1; Hd[o] = a / l; Hd[o + 1] = b / l; Hd[o + 2] = c / l;
}
const setT = (i, x, y, z) => { TG[i * 3] = x; TG[i * 3 + 1] = y; TG[i * 3 + 2] = z; };
const speedOf = (i) => sqrt(Vv[i * 3] ** 2 + Vv[i * 3 + 1] ** 2 + Vv[i * 3 + 2] ** 2);

// ---------------------------------------------------------------- one step of every animal
let ecoT = 0, frameN = 0;
function ecoFrame(dtIn) {
  const dt = dtIn;
  ecoT += dt; frameN++;
  HOUR += dt / 40 * (DAY < 0.5 ? 2.5 : 1) * (ffwd ? 30 : 1); if (HOUR >= 24) HOUR -= 24;
  { const s = sstep(5, 7, HOUR) * sstep(19, 17, HOUR); DAY = s; }
  const ca = ecoT * 0.01; CUR[0] = cos(ca) * 0.1; CUR[2] = sin(ca) * 0.1;
  const cx = F[CX], cy = F[CY], cz = F[CZ];
  for (let g = 0; g < nG; g++) groupStep(g, dt);
  for (let i = 0; i < nA; i++) {
    // far from the diver: every 4th frame is enough
    const far = d2(i, cx, cy, cz) > 4900;
    if (far && (frameN + i) % 4) continue;
    const st = far ? dt * 4 : dt;
    switch (SP[i]) {
      case 0: clown(i, st); break; case 1: chromis(i, st); break; case 2: cleaner(i, st); break;
      case 3: case 4: case 6: grouper(i, st); break; case 5: trout(i, st); break; case 7: shark(i, st); break; case 8: moray(i, st); break; case 9: manta(i); break;
    }
    BEAT[i] = min(2, 0.35 + speedOf(i) / LEN[i] * 0.45);
  }
  for (let k = 0; k < nAnem; k++) AN[k * 8 + 5] += ((night() ? 0.7 : 0) - AN[k * 8 + 5]) * min(1, dtIn * 0.3);
  // instances: fish, then sharks, then eels
  let n = 0;
  const put = (i) => {
    const o = n * 8, s = BEAT[i] * (ST[i] === S_SLEEP || ST[i] === S_HOLE ? 0.15 : 1);
    EB[o] = P[i * 3]; EB[o + 1] = P[i * 3 + 1]; EB[o + 2] = P[i * 3 + 2]; EB[o + 3] = LEN[i];
    EB[o + 4] = Hd[i * 3] * s; EB[o + 5] = Hd[i * 3 + 1] * s; EB[o + 6] = Hd[i * 3 + 2] * s;
    EB[o + 7] = SP[i] + (ST[i] === S_SLEEP && SP[i] === 3 ? 16 : 0) + PH[i] * 0.99; n++;
  };
  for (let i = 0; i < nA; i++) if (SP[i] < 7 && ST[i] !== S_GONE) put(i);
  nEcoF = n;
  for (let i = 0; i < nA; i++) if (SP[i] === 7) put(i);
  nEcoS = n - nEcoF;
  for (let i = 0; i < nA; i++) if (SP[i] === 8) put(i);
  nEcoE = n - nEcoF - nEcoS;
  cardStep(dtIn);
  mapStep(); tagStep(); zoneStep(dtIn); cvRender();
}

function clown(i, dt) {
  const a = ANE[HM[i]], ax = a[0], ay = a[1] + 0.1 * a[3], az = a[2], camD = hypot(F[CX] - ax, F[CY] - ay, F[CZ] - az);
  const big = LEN[i] > 0.25, thr = threat(i, 0);
  if (night()) ST[i] = S_SLEEP;
  else if (thr < 4) ST[i] = S_HIDE;
  else if (big && camD < 2.2 && camD > 0.9) ST[i] = S_GUARD;
  else ST[i] = S_HOVER;
  if ((TM[i] -= dt) < 0 || ST[i] === S_GUARD) {
    TM[i] = rr(0.6, 2);
    if (ST[i] === S_HOVER) { const r = rr(0, 0.45) * a[3], t = rnd() * TAU; setT(i, ax + cos(t) * r, ay + rr(0.15, 0.6) * a[3], az + sin(t) * r); }
    else if (ST[i] === S_GUARD) { const k = 0.8 / camD; setT(i, ax + (F[CX] - ax) * k, ay + (F[CY] - ay) * k, az + (F[CZ] - az) * k); }
    else { const r = rr(0, 0.2) * a[3], t = rnd() * TAU; setT(i, ax + cos(t) * r, ay + rr(0.02, 0.1), az + sin(t) * r); }
  }
  steer(i, ST[i] === S_GUARD ? 1.2 : ST[i] === S_HIDE ? 0.8 : 0.35, dt, 3, 0, false);
  face(i, dt, ST[i] === S_GUARD ? F[CX] - P[i * 3] : 0, ST[i] === S_GUARD ? F[CY] - P[i * 3 + 1] : 0, ST[i] === S_GUARD ? F[CZ] - P[i * 3 + 2] : 0);
}
function chromis(i, dt) {
  if (ST[i] === S_GONE) { if ((TM[i] -= dt) < 0 && d2(i, F[CX], F[CY], F[CZ]) > 100) { ST[i] = S_HIDE; TM[i] = 2; } return; }
  const h = HEADS[HM[i]], thr = threat(i, 0.8);
  if (night()) ST[i] = S_SLEEP;
  else if (thr < 1e8) { ST[i] = S_HIDE; T2[i] = 2.5; }
  else if (ST[i] === S_HIDE && (T2[i] -= dt) > 0) { /* stay hidden a little longer */ }
  else ST[i] = S_HOVER;
  if ((TM[i] -= dt) < 0 || (ST[i] !== S_HOVER && TG[i * 3 + 1] > h[1] + 0.1)) {
    TM[i] = rr(0.8, 2.5);
    const t = rnd() * TAU;
    if (ST[i] === S_HOVER) { const r = rr(0, 0.5 + h[3] * 0.45); setT(i, h[0] + cos(t) * r, h[1] + rr(0.25, 1.3), h[2] + sin(t) * r); }
    else { const r = rr(0, 0.35) * h[3]; setT(i, h[0] + cos(t) * r, h[1] - rr(0.15, 0.45), h[2] + sin(t) * r); }
  }
  steer(i, ST[i] === S_HOVER ? 0.25 : 1.3, dt, ST[i] === S_HOVER ? 2 : 5, 0, false);
  if (ST[i] === S_HOVER && speedOf(i) < 0.2) face(i, dt, -CUR[0], 0.05, -CUR[2], 1.5); else face(i, dt, 0, 0, 0, 6);
}
function cleaner(i, dt) {
  const s = STA[HM[i]];
  // a client posing at this station?
  let cl = -1;
  for (let j = 0; j < nA; j++) if (ST[j] === S_POSE && XI[j] === HM[i] && d2(j, s[0], s[1], s[2]) < 2.5) { cl = j; break; }
  if (night()) ST[i] = S_SLEEP; else if (cl >= 0) { ST[i] = S_CLEAN; XI[i] = cl; } else ST[i] = S_HOVER;
  if ((TM[i] -= dt) < 0) {
    TM[i] = rr(0.4, 1.2);
    if (ST[i] === S_CLEAN) {
      const o = cl * 3, L = LEN[cl], u = rr(-0.35, 0.45) * L, side = rnd() < 0.5 ? 1 : -1, sx = -Hd[o + 2], sz = Hd[o];
      setT(i, P[o] + Hd[o] * u + sx * side * L * 0.14, P[o + 1] + Hd[o + 1] * u + rr(-0.05, 0.08) * L, P[o + 2] + Hd[o + 2] * u + sz * side * L * 0.14);
    } else if (ST[i] === S_HOVER) { const t = ecoT * 0.9 + PH[i] * 9; setT(i, s[0] + sin(t) * 0.35, s[1] + rr(-0.05, 0.25), s[2] + sin(t * 2) * 0.2); }
    else setT(i, s[0], s[1] - 0.4, s[2]);
  }
  steer(i, ST[i] === S_CLEAN ? 0.5 : 0.3, dt, 4, 0, false);
  face(i, dt, 0, 0, 0, 6);
}
// group leaders (parrotfish, tangs, idols): wander, graze, visit cleaning stations, sleep at night
function groupStep(g, dt) {
  const o = g * 3;
  if (night()) { if (GS[g] !== S_SLEEP) { GS[g] = S_SLEEP; GT[o] = GH[o] + rr(-3, 3); GT[o + 2] = GH[o + 2] + rr(-3, 3); GT[o + 1] = floorAt(GT[o], GT[o + 2]) + 0.25; } return; }
  if (GS[g] === S_SLEEP) { GS[g] = S_TRAVEL; GTM[g] = 0; }
  if ((GTM[g] -= dt) > 0) return;
  const r = GS[g];
  if (r === S_TRAVEL && rnd() < (GSP[g] === 6 ? 0.35 : 0.75)) { // graze where the group is
    GS[g] = S_GRAZE; GTM[g] = rr(8, 18);
  } else if (r !== S_POSE && STA.length && rnd() < 0.18) { // off to the nearest cleaning station
    let best = -1, bd = 900; for (let k = 0; k < STA.length; k++) { const q = hypot(STA[k][0] - GT[o], STA[k][2] - GT[o + 2]); if (q < bd) { bd = q; best = k; } }
    if (best >= 0) { GS[g] = S_POSE; GST[g] = best; GTM[g] = rr(14, 22); GT[o] = STA[best][0]; GT[o + 1] = STA[best][1] + 0.3; GT[o + 2] = STA[best][2]; return; }
  } else { // travel to a new spot in the home range
    GS[g] = S_TRAVEL; GTM[g] = rr(6, 14);
    const x = GH[o] + rr(-14, 14), z = GH[o + 2] + rr(-14, 14);
    GT[o] = x; GT[o + 2] = z; GT[o + 1] = floorAt(x, z) + (GSP[g] === 6 ? rr(1.5, 3.5) : rr(0.8, 2));
  }
  if (GS[g] === S_GRAZE) { GT[o + 1] = floorAt(GT[o], GT[o + 2]) + 0.3; }
}
function grouper(i, dt) {
  const g = GR[i], o = i * 3, go = g * 3, gs = GS[g], L = LEN[i], lead = HM[i] === 0;
  ST[i] = gs === S_POSE && !lead ? S_TRAVEL : gs;
  if (SP[i] === 6 && gs !== S_SLEEP && threat(i, 1.0) < 1e8) { ST[i] = S_HIDE; T2[i] = 3; }
  else if (ST[i] !== S_SLEEP && T2[i] > 0 && SP[i] === 6 && (T2[i] -= dt) > 0) ST[i] = S_HIDE;
  XI[i] = ST[i] === S_POSE ? GST[g] : -1;
  if ((TM[i] -= dt) < 0) {
    TM[i] = ST[i] === S_GRAZE ? rr(1.2, 2.6) : rr(1.5, 3);
    if (ST[i] === S_GRAZE) { // pick a patch of rock nearby, nose down to it
      const x = GT[go] + OF[o] * 1.6 + rr(-1, 1), z = GT[go + 2] + OF[o + 2] * 1.6 + rr(-1, 1);
      setT(i, x, floorAt(x, z) + L * 0.35, z);
    } else if (ST[i] === S_POSE) setT(i, GT[go] + 0.35, GT[go + 1] + 0.15, GT[go + 2]);
    else if (ST[i] === S_SLEEP) setT(i, GT[go] + OF[o] * 1.5, floorAt(GT[go] + OF[o] * 1.5, GT[go + 2] + OF[o + 2] * 1.5) + 0.2, GT[go + 2] + OF[o + 2] * 1.5);
    else if (ST[i] === S_HIDE) setT(i, P[o] + rr(-0.5, 0.5), floorAt(P[o], P[o + 2]) + 0.2, P[o + 2] + rr(-0.5, 0.5));
    else setT(i, GT[go] + OF[o] * (gs === S_POSE ? 2.5 : 1), GT[go + 1] + OF[o + 1], GT[go + 2] + OF[o + 2] * (gs === S_POSE ? 2.5 : 1));
  }
  const sp = ST[i] === S_TRAVEL ? 0.55 + L : ST[i] === S_HIDE ? 1.4 : ST[i] === S_SLEEP ? 0.2 : 0.3;
  steer(i, sp, dt, 2.5, 0.1);
  const arrived = d2(i, TG[o], TG[o + 1], TG[o + 2]) < 0.09;
  if (ST[i] === S_GRAZE && arrived) { // biting: nose to the rock, a small jerk every bite
    const b = sin(ecoT * 5 + PH[i] * 20) > 0.6 ? 1 : 0;
    face(i, dt, Hd[o] * 0.6, -0.8, Hd[o + 2] * 0.6, 3); P[o + 1] -= b * 0.03 * dt * 10;
  } else if (ST[i] === S_POSE && arrived) face(i, dt, Hd[o], 0.45, Hd[o + 2], 1.5);  // head up, still: "clean me"
  else if (ST[i] === S_SLEEP && arrived) { Vv[o] *= 0.9; Vv[o + 1] *= 0.9; Vv[o + 2] *= 0.9; }
  else face(i, dt);
}
function trout(i, dt) {
  const o = i * 3, h = HEADS[HM[i]] || HEADS[0];
  if (night() && ST[i] !== S_SLEEP) { ST[i] = S_SLEEP; setT(i, P[o], floorAt(P[o], P[o + 2]) + 0.35, P[o + 2]); }
  if (!night() && ST[i] === S_SLEEP) { ST[i] = S_HOVER; TM[i] = rr(5, 15); }
  TM[i] -= dt;
  switch (ST[i]) {
    case S_HOVER: case S_ATE:
      if (TM[i] < 0) {
        // hunts often at dawn and dusk, now and then by day; sometimes visits a cleaning station instead
        if (rnd() < (crep() ? 0.8 : 0.3)) { ST[i] = S_STALK; TM[i] = 25; }
        else if (STA.length && rnd() < 0.3) { let best = 0, bd = 1e9; for (let k = 0; k < STA.length; k++) { const q = d2(i, STA[k][0], STA[k][1], STA[k][2]); if (q < bd) { bd = q; best = k; } } if (bd < 900) { ST[i] = S_POSE; XI[i] = best; TM[i] = rr(12, 20); setT(i, STA[best][0] - 0.4, STA[best][1] + 0.2, STA[best][2]); } }
        else { ST[i] = S_HOVER; TM[i] = rr(8, 20); const a = rnd() * TAU, x = h[0] + cos(a) * rr(1.5, 3), z = h[2] + sin(a) * rr(1.5, 3); setT(i, x, floorAt(x, z) + 0.4, z); }
      }
      steer(i, 0.25, dt, 1.5, 0.15); face(i, dt, 0, 0, 0, 1.5); break;
    case S_POSE:
      steer(i, 0.4, dt, 2, 0.1); if (d2(i, TG[o], TG[o + 1], TG[o + 2]) < 0.1) face(i, dt, Hd[o], 0.4, Hd[o + 2], 1); else face(i, dt);
      if (TM[i] < 0) { ST[i] = S_HOVER; XI[i] = -1; TM[i] = rr(10, 20); setT(i, h[0] + 2, floorAt(h[0] + 2, h[2]) + 0.4, h[2]); } break;
    case S_STALK: {
      // creep toward the nearest visible chromis of its head
      let best = -1, bd = 1e9; for (let j = 0; j < nA; j++) if (SP[j] === 1 && HM[j] === HM[i] && ST[j] === S_HOVER) { const q = d2(i, P[j * 3], P[j * 3 + 1], P[j * 3 + 2]); if (q < bd) { bd = q; best = j; } }
      if (best < 0 || TM[i] < 0) { ST[i] = S_HOVER; TM[i] = rr(15, 30); break; }
      XI[i] = best; const q = sqrt(bd);
      setT(i, P[best * 3] - (P[best * 3] - P[o]) / q * 1.6, P[best * 3 + 1] - 0.3, P[best * 3 + 2] - (P[best * 3 + 2] - P[o + 2]) / q * 1.6);
      steer(i, 0.35, dt, 2, 0.15); face(i, dt, P[best * 3] - P[o], P[best * 3 + 1] - P[o + 1], P[best * 3 + 2] - P[o + 2], 2);
      if (q < 2.2) { ST[i] = S_BURST; TM[i] = 1.1; }
      break;
    }
    case S_BURST: {
      const j = XI[i]; setT(i, P[j * 3], P[j * 3 + 1], P[j * 3 + 2]); steer(i, 4.5, dt, 9, 0.1); face(i, dt, 0, 0, 0, 10);
      if (ST[j] !== S_GONE && d2(i, P[j * 3], P[j * 3 + 1], P[j * 3 + 2]) < 0.12 && ST[j] !== S_SLEEP) {
        if (rnd() < 0.5) { ST[j] = S_GONE; TM[j] = 45; ST[i] = S_ATE; TM[i] = rr(20, 40); } else TM[i] = 0;
      }
      if (TM[i] < 0) { ST[i] = S_HOVER; TM[i] = rr(15, 30); const x = h[0] + rr(-3, 3), z = h[2] + rr(-3, 3); setT(i, x, floorAt(x, z) + 0.4, z); }
      break;
    }
    default: steer(i, 0.2, dt, 1, 0.15); face(i, dt, 0, 0, 0, 1);
  }
}
function shark(i, dt) {
  const o = i * 3, hunting = night() || crep();
  ST[i] = hunting ? S_STALK : S_PATROL;
  const sp = hunting ? 1.5 : 0.95, R = OF[o + 1] + sin(ecoT * 0.03 + PH[i] * 9) * 15;
  OF[o] += dt * sp / max(R, 20) * (PH[i] > 0.5 ? 1 : -1);
  const a = OF[o] + (PH[i] > 0.5 ? 0.25 : -0.25), x = cos(a) * R, z = sin(a) * R;
  let y = max(floorAt(x, z) + OF[o + 2], floorAt(P[o], P[o + 2]) + 1.5); y = min(y, -3);
  // shy of the diver: veer away when close
  const cd = sqrt(d2(i, F[CX], F[CY], F[CZ]));
  if (cd < 5) setT(i, x + (P[o] - F[CX]) / cd * 6, y, z + (P[o + 2] - F[CZ]) / cd * 6); else setT(i, x, y, z);
  steer(i, sp, dt, 0.7, 1.2); face(i, dt, 0, 0, 0, 1.2);
}
function moray(i, dt) {
  const h = HOL[HM[i]], o = i * 3, L = LEN[i];
  if (night()) { if (ST[i] === S_HOLE) { ST[i] = S_FORAGE; TM[i] = 0; } }
  else if (ST[i] === S_FORAGE) { ST[i] = 15; } // heading home
  if (ST[i] === S_HOLE) {
    // head out of the hole along its normal, body back in the rock; slowly in and out
    const e = 0.3 + 0.12 * sin(ecoT * 0.25 + PH[i] * 9), hx = h[3], hz = h[4], hy = 0.28, hl = hypot(hx, hy, hz);
    Hd[o] = hx / hl; Hd[o + 1] = hy / hl; Hd[o + 2] = hz / hl;
    P[o] = h[0] + hx * e - Hd[o] * L * 0.5; P[o + 1] = h[1] + 0.05 - Hd[o + 1] * L * 0.5 + hy * e * 0.3; P[o + 2] = h[2] + hz * e - Hd[o + 2] * L * 0.5;
    Vv[o] = Vv[o + 1] = Vv[o + 2] = 0; return;
  }
  const nearHole = d2(i, h[0], h[1], h[2]) < 4;
  if (ST[i] === S_FORAGE) {
    if ((TM[i] -= dt) < 0) { TM[i] = rr(4, 9); const x = h[0] + h[3] * 3 + rr(-6, 6), z = h[2] + h[4] * 3 + rr(-6, 6); setT(i, x, floorAt(x, z) + 0.15, z); }
    steer(i, 0.35, dt, 1.5, 0.1, !nearHole); face(i, dt, 0, 0, 0, 2);
  } else { // returning
    setT(i, h[0] + h[3] * 0.3 - h[3] * L * 0.5, h[1], h[2] + h[4] * 0.3 - h[4] * L * 0.5);
    steer(i, 0.4, dt, 1.5, 0.1, !nearHole); face(i, dt, 0, 0, 0, 2);
    if (d2(i, TG[o], TG[o + 1], TG[o + 2]) < 0.2) ST[i] = S_HOLE;
  }
}
// mantas: positions follow the same path main.js draws them on (vsManta)
function manta(i) {
  const k = HM[i] * 8, M = Wd.mantas, t = F[TIME], R = M[k + 3], ta = t * M[k + 5] + M[k + 4], o = i * 3;
  P[o] = M[k] + R * cos(ta); P[o + 1] = M[k + 1] + 2.5 * sin(2 * ta + M[k + 7]); P[o + 2] = M[k + 2] + R * 0.75 * sin(ta);
  let hx = -R * sin(ta), hy = 5 * cos(2 * ta + M[k + 7]), hz = R * 0.75 * cos(ta); const l = hypot(hx, hy, hz) * Math.sign(M[k + 5]);
  Hd[o] = hx / l; Hd[o + 1] = hy / l; Hd[o + 2] = hz / l; Vv[o] = Hd[o]; Vv[o + 1] = Hd[o + 1]; Vv[o + 2] = Hd[o + 2];
}

// ---------------------------------------------------------------- the info card: what you are looking at
const cPic = $('cpic'), card = $('cd'), cN = $('cn'), cL = $('cl'), cF = $('cf'), cD = $('cg'), clock = $('ck');
let cardI = -1, candI = -1, candT = 0, lostT = 0, fol = -1, tour = false, tourT = 0, pickX = 0, pickY = 0, pickOn = false;
const ANEB = 1000; // card index for anemone k: ANEB + k
let pkX = 0, pkY = 0, pkZ = 0, pkB = -1, pkS = 1e9;
function pkTest(id, x, y, z, rad) {
  const dx = x - F[CX], dy = y - F[CY], dz = z - F[CZ], al = dx * pkX + dy * pkY + dz * pkZ;
  if (al < 0.3 || al > 18) return;
  const px = dx - pkX * al, py = dy - pkY * al, pz = dz - pkZ * al, off = sqrt(px * px + py * py + pz * pz);
  const tol = rad + al * 0.035; if (off > tol) return;
  const s = off / tol + al * 0.02; if (s < pkS) { pkS = s; pkB = id; }
}
function lookPick() {
  // the ray: the screen centre, or where a finger tapped
  pkX = F[FX]; pkY = F[FY]; pkZ = F[FZ];
  if (pickOn) {
    const nx = (pickX * 2 - 1) * TANH * W / H, ny = (1 - pickY * 2) * TANH;
    pkX = F[FX] + F[RX] * nx + F[UX] * ny; pkY = F[FY] + F[UY] * ny; pkZ = F[FZ] + F[RZ] * nx + F[UZ] * ny;
    const l = hypot(pkX, pkY, pkZ); pkX /= l; pkY /= l; pkZ /= l;
  }
  pkB = -1; pkS = 1e9;
  for (let i = 0; i < nA; i++) if (ST[i] !== S_GONE) {
    const L = LEN[i], o = i * 3;
    // morays: test the head, the part you see
    if (SP[i] === 8) pkTest(i, P[o] + Hd[o] * L * 0.4, P[o + 1] + Hd[o + 1] * L * 0.4, P[o + 2] + Hd[o + 2] * L * 0.4, 0.15);
    else pkTest(i, P[o], P[o + 1], P[o + 2], SP[i] === 9 ? L * 0.5 : L * 0.45);
  }
  for (let k = 0; k < nAnem; k++) pkTest(ANEB + k, AN[k * 8], AN[k * 8 + 1] + 0.15, AN[k * 8 + 2], 0.35 * AN[k * 8 + 3]);
  return pkB;
}
const spOf = (id) => id >= ANEB ? 10 : SP[id];
const stOf = (id) => id >= ANEB ? S_HOVER : ST[id];
function showCard(id) {
  const sp = spOf(id), s = SPC[sp];
  cN.textContent = s.zh; cL.textContent = s.la; cvShow(sp, id); cF.textContent = s.facts.join(' ');
  card.className = 'on'; cardI = id; lastDo = '';
}
let lastDo = '';
function cardStep(dt) {
  // clock
  if (frameN % 20 === 1) { // (a string every 20 frames, not every frame)
    const hh = HOUR | 0, mm = (HOUR - hh) * 60 | 0, ph = DAY > 0.8 ? '白天' : night() ? '夜晚' : HOUR < 12 ? '黎明' : '黄昏';
    const ct = `${ph} ${hh < 10 ? '0' : ''}${hh}:${mm < 10 ? '0' : ''}${mm}${ffwd ? ' ⏩' : ''}${tour ? ' · 导览中' : fol >= 0 ? ' · 跟随中' : ''}`;
    if (clock.textContent !== ct) clock.textContent = ct;
  }
  if (menu) return;
  if (fol >= 0) { if (cardI !== fol) showCard(fol); }
  else if (frameN % 3 === 0) {
    const b = lookPick();
    if (b >= 0 && b === candI) candT += dt * 3; else { candI = b; candT = 0; }
    if (b >= 0 && candT > 0.35 && b !== cardI) showCard(b);
    if (b === cardI && b >= 0) lostT = 0; else if (cardI >= 0 && (lostT += dt * 3) > 3) { card.className = ''; cardI = -1; }
    pickOn = false;
  }
  if (cardI >= 0 && (frameN % 10 === 0 || lastDo === '')) {
    const sp = spOf(cardI), d = (DOING[sp] || {})[stOf(cardI)] || '';
    let txt = d;
    if (d.includes('{c}')) { const c = XI[cardI]; txt = d.replace('{c}', c >= 0 ? SPC[SP[c]].zh.replace(/（.*）/, '') : '鱼'); }
    txt = '正在：' + txt + (fol >= 0 ? '' : '　·　G 跟随');
    if (txt !== lastDo) { cD.textContent = txt; lastDo = txt; }
  }
}
// tap (touch) or click (no pointer lock) on an animal shows its card; a tap on the card follows it
canvas.addEventListener('pointerup', (e) => {
  if (document.pointerLockElement || menu) return;
  const r = canvas.getBoundingClientRect();
  if (rot.matches) { pickX = (e.clientY - r.top) / r.height; pickY = 1 - (e.clientX - r.left) / r.width; } else { pickX = (e.clientX - r.left) / r.width; pickY = (e.clientY - r.top) / r.height; }
  pickOn = true; const b = lookPick(); pickOn = false;
  if (b >= 0) { showCard(b); candI = b; lostT = 0; }
});
card.addEventListener('click', () => { if (cardI >= 0) follow(cardI); });

// ---------------------------------------------------------------- following an animal, the guided tour
function follow(id) { fol = id; tour = false; F[VX] = F[VY] = F[VZ] = 0; showCard(id); }
function unfollow() { fol = -1; tour = false; }
// the tour picks animals that are doing something worth watching
function tourNext() {
  const want = [S_GRAZE, S_CLEAN, S_POSE, S_STALK, S_BURST, S_GUARD, S_FORAGE, S_SLEEP, S_PATROL]; // (morays deep in their holes are hard to see)
  const cands = [];
  for (let i = 0; i < nA; i++) if (ST[i] !== S_GONE && want.includes(ST[i]) && (fol < 0 || SP[i] !== SP[fol])) cands.push(i);
  for (let k = 0; k < nAnem && rnd() < 0.5; k++) cands.push(ANEB + k);
  if (!cands.length) for (let i = 0; i < nA; i++) cands.push(i);
  return cands[(rnd() * cands.length) | 0];
}
const fade = $('fd');
let jumpT = -1;
// moves the camera when following; returns false to leave it to the free camera
function ecoCam(dt) {
  if (tour && !menu) { tourT -= dt; if (tourT < 0 && jumpT < 0) { const n = tourNext(); tourT = 22; jumpT = 0.5; fade.className = 'on'; fol = -2 - n; } }
  if (jumpT >= 0) { if ((jumpT -= dt) < 0) { fol = -2 - fol; showCard(fol); camTo(fol, 1, true); fade.className = ''; } return true; }
  if (fol < 0) return false;
  if (kf || kb || kl || kr || ku || kd || tId >= 0) { unfollow(); return false; }
  camTo(fol, dt, false);
  return true;
}
// the camera looks at the animal from the side and a little above, from the first angle with open water and a clear view
const PHI = [1.15, -1.15, 0.7, -0.7, 1.7, -1.7, 0.2, 2.5, -2.5];
let folPhi = 0, phiT = 0;
const openAt = (x, y, z, cx, cy, cz) => {
  if (rockAt(cx, cy, cz) > -0.45 || cy > -1.5 || cy < floorAt(cx, cz) + 0.4) return false;
  for (let t = 0.2; t < 0.95; t += 0.15) if (rockAt(x + (cx - x) * t, y + (cy - y) * t, z + (cz - z) * t) > -0.05) return false;
  return true;
};
function camTo(id, dt, snap) {
  let x, y, z, hx, hy, hz, L, front = false;
  if (id >= ANEB) { const k = (id - ANEB) * 8; x = AN[k]; y = AN[k + 1] + 0.3; z = AN[k + 2]; hx = 0.7; hy = 0; hz = 0.7; L = 0.45; }
  else { const o = id * 3; L = LEN[id]; x = P[o]; y = P[o + 1]; z = P[o + 2]; hx = Hd[o]; hy = Hd[o + 1]; hz = Hd[o + 2]; front = SP[id] === 8 && ST[id] === S_HOLE; if (SP[id] === 8) { x += hx * L * 0.4; y += hy * L * 0.4; z += hz * L * 0.4; L = 0.45; } }
  const hl = hypot(hx, hz) || 1, bx = (front ? hx : -hx) / hl, bz = (front ? hz : -hz) / hl, sx = -bz, sz = bx;
  const dist = max(1.4, L * (SP[id] === 9 ? 2.4 : 3.4));
  const at = (phi, out) => { const c = cos(phi), s = sin(phi); out[0] = x + (bx * c + sx * s) * dist; out[1] = y + dist * 0.4; out[2] = z + (bz * c + sz * s) * dist; };
  // keep the angle while it works; look for another when it doesn't (or now and then, to come back to the side view)
  phiT -= dt;
  at(folPhi, TGc);
  if (snap || phiT < 0 || !openAt(x, y, z, TGc[0], TGc[1], TGc[2])) {
    phiT = 1.5;
    let found = false;
    for (const ph of front ? [0, 0.5, -0.5, 1, -1] : PHI) { at(ph, TGc); if (openAt(x, y, z, TGc[0], TGc[1], TGc[2])) { folPhi = ph; found = true; break; } }
    if (!found) { folPhi = front ? 0 : PHI[0]; at(folPhi, TGc); TGc[1] = max(TGc[1], y + dist); }
  }
  const tx = TGc[0], ty = TGc[1], tz = TGc[2];
  const k = snap ? 1 : 1 - exp(-dt * 1.6);
  F[VX] = F[VY] = F[VZ] = 0;
  if (snap) { F[CX] = tx; F[CY] = ty; F[CZ] = tz; F[MX] = F[MY] = F[MZ] = 0; }
  else { F[MX] = (tx - F[CX]) * k; F[MY] = (ty - F[CY]) * k; F[MZ] = (tz - F[CZ]) * k; }
  collide();
  const dx = x - F[CX], dy = y - F[CY], dz = z - F[CZ];
  const yaw = atan2(dx, -dz), pitch = atan2(dy, sqrt(dx * dx + dz * dz));
  let dy_ = yaw - F[YAW]; dy_ -= round(dy_ / TAU) * TAU;
  const ka = snap ? 1 : 1 - exp(-dt * 4);
  F[YAW] += dy_ * ka; F[PIT] += (pitch - F[PIT]) * ka;
  mdx = mdy = lkx = lky = l2x = l2y = 0;
}
const TGc = new Float64Array(3);
addEventListener('keydown', (e) => {
  if (menu || e.repeat) return;
  if (e.code === 'KeyG') { if (fol >= 0) unfollow(); else if (cardI >= 0) follow(cardI); }
  else if (e.code === 'KeyT') { if (tour) unfollow(); else { tour = true; tourT = 0; } }
  else if (e.code === 'KeyN') ffwd = 1;
});
addEventListener('keyup', (e) => { if (e.code === 'KeyN') ffwd = 0; });
$('bt').onclick = () => { if (tour) unfollow(); else { tour = true; tourT = 0; } };
$('bn').onclick = () => { HOUR = (HOUR + 3) % 24; };

// ---------------------------------------------------------------- mini map (M): the whole reef from above
// grid A-H (west to east) x 1-8 (north to south), 48 m squares; north (-z) is up
const ZON = Wd.zones;
const mapEl = $('mp'), mc = $('mc'), mx = mc.getContext('2d'), MS = 440, MW = 384, mk = MS / MW;
const mapBg = document.createElement('canvas'); mapBg.width = mapBg.height = MS;
{
  const g = mapBg.getContext('2d'), img = g.createImageData(MW, MW), d = img.data;
  for (let j = 0; j < MW; j++) for (let i = 0; i < MW; i++) {
    const h = floorH[i + MW * j], o = (i + MW * j) * 4;
    // light from the north-west on the seabed height, coloured by depth: sand-turquoise shallow, deep blue below
    const hx = floorH[min(i + 1, MW - 1) + MW * j] - floorH[max(i - 1, 0) + MW * j], hz = floorH[i + MW * min(j + 1, MW - 1)] - floorH[i + MW * max(j - 1, 0)];
    const sh = clamp(0.75 - (hx + hz) * 0.18, 0.35, 1.25), t = clamp((h + 46) / 40, 0, 1);
    const out = hypot(i - 191.5, j - 191.5) > 172;
    d[o] = (20 + 60 * t) * sh; d[o + 1] = (60 + 130 * t) * sh; d[o + 2] = (95 + 120 * t) * sh; d[o + 3] = out ? 90 : 255;
  }
  const t = document.createElement('canvas'); t.width = t.height = MW; t.getContext('2d').putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(t, 0, 0, MS, MS);
  // grid and its labels
  g.strokeStyle = '#ffffff40'; g.lineWidth = 1; g.fillStyle = '#ffffffc0'; g.font = 'bold 15px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 1; k < 8; k++) { const p = k * 48 * mk; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, MS); g.moveTo(0, p); g.lineTo(MS, p); g.stroke(); }
  for (let k = 0; k < 8; k++) { const c = (k + 0.5) * 48 * mk; g.fillText('ABCDEFGH'[k], c, 11); g.fillText(String(k + 1), 10, c); }
  // what lives where
  const dot = (x, z, col, r) => { g.beginPath(); g.arc((x + 192) * mk, (z + 192) * mk, r, 0, TAU); g.fillStyle = col; g.fill(); g.strokeStyle = '#0008'; g.stroke(); };
  for (const z of ZON) { // the exhibits: a ring and the name
    const x = (z.x + 192) * mk, y = (z.z + 192) * mk, r = (z.r + 4) * mk;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#ffd36b33'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffd36b'; g.stroke(); g.lineWidth = 1;
    g.font = 'bold 15px system-ui,sans-serif'; g.lineWidth = 4; g.strokeStyle = '#03131c'; g.strokeText(z.zh, x, y + r + 12); g.fillStyle = '#ffd36b'; g.fillText(z.zh, x, y + r + 12); g.lineWidth = 1;
  }
  for (const a of ANE) dot(a[0], a[2], '#ff8a3d', 4.5);
  for (const s of STA) dot(s[0], s[2], '#7dffb0', 4.5);
  for (const h of HOL.slice(0, 10)) dot(h[0], h[2], '#d9b26a', 4);
  g.font = 'bold 13px system-ui,sans-serif';
  POSES.forEach((p, k) => { const x = (p[0] + 192) * mk, y = (p[2] + 192) * mk; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#03222d'; g.fillText(String(k + 1), x, y + 1); });
}
let mapOn = true; mapEl.className = 'on'; // open from the start; M closes it
const mapToggle = () => { mapOn = !mapOn; mapEl.className = mapOn ? 'on' : ''; };
// where you are, as a grid square, for telling each other places ("C5")
const gridOf = (x, z) => 'ABCDEFGH'[clamp(floor((x + 192) / 48), 0, 7)] + (clamp(floor((z + 192) / 48), 0, 7) + 1);
function mapStep() {
  if (!mapOn || frameN % 3) return;
  mx.drawImage(mapBg, 0, 0);
  const x = (F[CX] + 192) * mk, y = (F[CZ] + 192) * mk;
  // the animal being followed
  if (fol >= 0 && fol < ANEB) { mx.beginPath(); mx.arc((P[fol * 3] + 192) * mk, (P[fol * 3 + 2] + 192) * mk, 6, 0, TAU); mx.strokeStyle = '#ffe08a'; mx.lineWidth = 2.5; mx.stroke(); }
  // you: an arrow pointing where you look
  mx.save(); mx.translate(x, y); mx.rotate(F[YAW]);
  mx.beginPath(); mx.moveTo(0, -13); mx.lineTo(8, 9); mx.lineTo(0, 4); mx.lineTo(-8, 9); mx.closePath();
  mx.fillStyle = '#ff3b5c'; mx.fill(); mx.strokeStyle = '#fff'; mx.lineWidth = 2; mx.stroke(); mx.restore();
  mx.fillStyle = '#03131ccc'; mx.fillRect(MS - 196, MS - 32, 190, 26);
  mx.fillStyle = '#fff'; mx.font = 'bold 15px system-ui,sans-serif'; mx.textAlign = 'center'; mx.textBaseline = 'middle';
  mx.fillText(`你在 ${gridOf(F[CX], F[CZ])} · 水深 ${(-F[CY]).toFixed(0)} 米`, MS - 101, MS - 19);
}
addEventListener('keydown', (e) => { if (!menu && !e.repeat && e.code === 'KeyM') mapToggle(); });

// ---------------------------------------------------------------- name tags and the exhibit banner
// Up close (within ~5 m) the nearest animal of each kind gets a ring and its everyday name, so you know what you are looking at.
const TAGNAME = ['小丑鱼', '蓝绿光鳃鱼', '清洁鱼', '鹦嘴鱼', '镰鱼', '东星斑', '蓝倒吊', '黑鳍礁鲨', '巨海鳝', '蝠鲼', '海葵'];
const TAGR = 5.5, tagEl = $('tg'), TAGN = 10, tags = [];
for (let k = 0; k < TAGN; k++) {
  const d = document.createElement('div'); d.className = 'tag'; d.innerHTML = '<i></i><b></b>'; tagEl.appendChild(d);
  tags.push({ d, ring: d.firstChild, name: d.lastChild, txt: '', on: false, rr: -1 });
}
const tBest = new Float64Array(11), tagId = new Int32Array(11);
function tagCand(id, sp, x, y, z) {
  const d = hypot(x - F[CX], y - F[CY], z - F[CZ]);
  if (d < TAGR && d < tBest[sp]) { tBest[sp] = d; tagId[sp] = id; }
}
// visible: in front, on screen, and not behind rock
function tagPos(x, y, z, out) {
  const dx = x - F[CX], dy = y - F[CY], dz = z - F[CZ], zc = dx * F[FX] + dy * F[FY] + dz * F[FZ];
  if (zc < 0.3) return false;
  const xc = (dx * F[RX] + dz * F[RZ]) / (zc * TANH * W / H), yc = (dx * F[UX] + dy * F[UY] + dz * F[UZ]) / (zc * TANH);
  if (abs(xc) > 0.95 || abs(yc) > 0.95) return false;
  for (const t of [0.35, 0.6, 0.85]) if (rockAt(F[CX] + dx * t, F[CY] + dy * t, F[CZ] + dz * t) > 0.15) return false;
  out[0] = (xc + 1) * 0.5 * canvas.clientWidth; out[1] = (1 - yc) * 0.5 * canvas.clientHeight; out[2] = zc; out[3] = sqrt(dx * dx + dy * dy + dz * dz);
  return true;
}
const TP = new Float64Array(4);
function tagStep() {
  if (frameN % 2) return;
  let n = 0;
  if (!menu && !jumpT_on()) {
    tBest.fill(1e9); tagId.fill(-1);
    for (let i = 0; i < nA; i++) if (ST[i] !== S_GONE) { const o = i * 3, h = SP[i] === 8 ? LEN[i] * 0.4 : 0; tagCand(i, SP[i], P[o] + Hd[o] * h, P[o + 1] + Hd[o + 1] * h, P[o + 2] + Hd[o + 2] * h); }
    for (let k = 0; k < nAnem; k++) tagCand(ANEB + k, 10, AN[k * 8], AN[k * 8 + 1] + 0.2, AN[k * 8 + 2]);
    for (let sp = 0; sp < 11 && n < TAGN; sp++) {
      const id = tagId[sp]; if (id < 0) continue;
      const an = id >= ANEB, o = id * 3, h = sp === 8 ? LEN[id] * 0.4 : 0, L = an ? 0.55 * AN[(id - ANEB) * 8 + 3] : sp === 8 ? 0.18 : LEN[id] * 0.55 + 0.04;
      const x = an ? AN[(id - ANEB) * 8] : P[o] + Hd[o] * h, y = an ? AN[(id - ANEB) * 8 + 1] + 0.2 : P[o + 1] + Hd[o + 1] * h, z = an ? AN[(id - ANEB) * 8 + 2] : P[o + 2] + Hd[o + 2] * h;
      if (!tagPos(x, y, z, TP)) continue;
      const t = tags[n++], r = max(14, L / (TP[2] * TANH) * canvas.clientHeight * 0.5) | 0, a = min(1, (TAGR - TP[3]) / 1.2);
      if (t.txt !== TAGNAME[sp]) { t.txt = TAGNAME[sp]; t.name.textContent = t.txt; }
      if (t.rr !== r) { t.rr = r; t.ring.style.cssText = `width:${2 * r}px;height:${2 * r}px;transform:translate(${-r}px,${-r}px)`; t.name.style.top = `${r + 4}px`; }
      t.d.style.transform = `translate(${TP[0].toFixed(1)}px,${TP[1].toFixed(1)}px)`; t.d.style.opacity = a.toFixed(2);
      if (!t.on) { t.on = true; t.d.style.display = 'block'; }
    }
  }
  for (let k = n; k < TAGN; k++) if (tags[k].on) { tags[k].on = false; tags[k].d.style.display = 'none'; }
}
function jumpT_on() { return jumpT >= 0; }
// arriving at an exhibit shows its name for a few seconds
const znEl = $('zn'), znN = $('znn'), znS = $('zns');
let zIn = -1, znT = 0;
function zoneStep(dt) {
  if (menu) return;
  let k = -1; ZON.forEach((z, j) => { if (hypot(F[CX] - z.x, F[CZ] - z.z) < z.r + 4) k = j; });
  if (k !== zIn) { zIn = k; if (k >= 0) { znN.textContent = ZON[k].zh; znS.textContent = ZON[k].sub; znEl.className = 'on'; znT = 4.5; } }
  if (znT > 0 && (znT -= dt) <= 0) znEl.className = '';
}

// ---------------------------------------------------------------- the card's picture: the animal's own 3D model, side on, turning slowly
// rendered with the scene's shaders into a small canvas, in clear shallow-water daylight, so it always matches the reef
const cvEl = document.createElement('canvas'); cvEl.id = 'cpv'; cvEl.width = 320; cvEl.height = 192; cPic.appendChild(cvEl);
const cvCtx = cvEl.getContext('webgpu'); cvCtx.configure({ device, format: FMT, alphaMode: 'opaque' });
const uboC = device.createBuffer({ size: 272, usage: BU.UNIFORM | BU.COPY_DST }), UC = new Float32Array(68), bgC = mkBG0(uboC, tShadow);
const cvMS = tex(AA > 1 ? 320 : 1, 192, HDR, TU.RENDER_ATTACHMENT, { samples: AA }), cvRes = tex(320, 192, HDR, TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING);
const cvDp = tex(320, 192, DEPTH, TU.RENDER_ATTACHMENT, { samples: AA });
const ibCard = device.createBuffer({ size: 32, usage: BU.VERTEX | BU.COPY_DST }), CVI = new Float32Array(8);
const mCard = device.createShaderModule({ code: /*wgsl*/`
@group(0) @binding(0) var t: texture_2d<f32>;
@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f { return vec4f(f32(i32(i & 1u) * 4 - 1), f32(i32(i >> 1u) * 4 - 1), 0., 1.); }
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let q = fc.xy / vec2f(320., 192.) - .5;
  var c = textureLoad(t, vec2i(fc.xy), 0).rgb * .85 * (1. - dot(q, q) * .8);
  c = clamp((c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14), vec3f(0.), vec3f(1.));
  return vec4f(pow(c, vec3f(1. / 2.2)), 1.);
}` });
const pCard = device.createRenderPipeline({ layout: 'auto', vertex: { module: mCard, entryPoint: 'vs' }, fragment: { module: mCard, entryPoint: 'fs', targets: [{ format: FMT }] } });
const bgCard = device.createBindGroup({ layout: pCard.getBindGroupLayout(0), entries: [{ binding: 0, resource: cvRes.createView() }] });
let cvSp = -1, cvSeed = 0.75;
// the picture is taken high above the anemone garden, in open water
const cvPos = [ZON[0].x, floorAt(ZON[0].x, ZON[0].z) + 9, ZON[0].z];
function cvShow(sp, id) { cvSp = sp === 9 ? -1 : sp; if (sp === 10) cvSeed = AN[(id - ANEB) * 8 + 4]; cvEl.style.display = cvSp < 0 ? 'none' : 'block'; }
function cvRender() {
  if (cvSp < 0 || card.className !== 'on') return;
  const sp = cvSp, an = sp === 10, t = ecoT;
  // the subject: unit length (a smaller anemone), heading +x with a slow swing so it reads as 3D
  const [x, y, z] = cvPos, a = 0.45 * sin(t * 0.5);
  if (an) CVI.set([x, y - 0.25, z, 0.7, cvSeed, 0, 0, 0]);
  else CVI.set([x, y, z, sp === 8 ? 1.3 : 1, cos(a) * 0.5, 0, sin(a) * 0.5, sp + 0.25]);
  Q.writeBuffer(ibCard, 0, CVI);
  // camera: side on (slightly above for the anemone), narrow field of view
  const th = 0.3, asp = 320 / 192, dist = an ? 1.9 : sp === 8 ? 2.4 : 1 / (2 * th * asp) * 1.35;
  const pitch = an ? -0.45 : -0.08, cp = cos(pitch), fy = sin(pitch), fx = 0, fz = -cp, rx = 1, rz = 0;
  const ux = 0, uy = rz * fx - rx * fz, uz = rx * fy;
  const cx = x - fx * dist, cy = y - fy * dist + (an ? 0.1 : 0), cz = z - fz * dist;
  const m = UC; m.set(UB);
  const sx = 1 / (th * asp), sy = 1 / th;
  m[0] = rx * sx; m[4] = 0; m[8] = rz * sx; m[12] = -(rx * cx + rz * cz) * sx;
  m[1] = ux * sy; m[5] = uy * sy; m[9] = uz * sy; m[13] = -(ux * cx + uy * cy + uz * cz) * sy;
  m[2] = 0; m[6] = 0; m[10] = 0; m[14] = 0.05;
  m[3] = fx; m[7] = fy; m[11] = fz; m[15] = -(fx * cx + fy * cy + fz * cz);
  m[32] = cx; m[33] = cy; m[34] = cz; m[35] = t;
  m[36] = rx; m[37] = 0; m[38] = rz; m[39] = th * asp; m[40] = ux; m[41] = uy; m[42] = uz; m[43] = th; m[44] = fx; m[45] = fy; m[46] = fz; m[47] = 0.05;
  m[51] = 0; m[56] = an ? 0.55 : 0.9; m[57] = 0; m[59] = 1; // daylight, no purple zone
  m[60] = cx; m[61] = cy + 0.3; m[62] = cz; m[63] = an ? 0 : 1; m[64] = fx; m[65] = fy; m[66] = fz; // a soft lamp from the camera
  Q.writeBuffer(uboC, 0, UC);
  const e = device.createCommandEncoder();
  let r = e.beginRenderPass({ colorAttachments: [{ view: (AA > 1 ? cvMS : cvRes).createView(), resolveTarget: AA > 1 ? cvRes.createView() : undefined, clearValue: [0.03, 0.16, 0.24, 1], loadOp: 'clear', storeOp: 'store' }],
    depthStencilAttachment: { view: cvDp.createView(), depthClearValue: 0, depthLoadOp: 'clear', depthStoreOp: 'discard' } });
  r.setBindGroup(0, bgC); r.setVertexBuffer(0, vbMesh); r.setIndexBuffer(ibMesh, 'uint32'); r.setVertexBuffer(1, ibCard);
  const M = meshes[an ? 31 : sp === 7 ? 29 : sp === 8 ? 30 : 28];
  r.setPipeline(an ? pAnem : pReef); r.drawIndexed(M.ib.length, 1, M.i0, M.v0, 0); r.end();
  r = e.beginRenderPass({ colorAttachments: [{ view: cvCtx.getCurrentTexture().createView(), loadOp: 'clear', clearValue: [0, 0, 0, 1], storeOp: 'store' }] });
  r.setPipeline(pCard); r.setBindGroup(0, bgCard); r.draw(3); r.end();
  Q.submit([e.finish()]);
}

// ---------------------------------------------------------------- developer mode (hidden): the ` key (left of 1) turns it on and off
// K: day <-> night at once; click the mini map: jump there
let devOn = false;
const devEl = document.createElement('div'); devEl.id = 'dev'; devEl.textContent = '开发者模式 · K 白天/黑夜 · 点小地图瞬移'; document.body.appendChild(devEl);
addEventListener('keydown', (e) => {
  if (menu || e.repeat) return;
  if (e.code === 'Backquote') { devOn = !devOn; devEl.className = devOn ? 'on' : ''; mc.style.cursor = devOn ? 'crosshair' : 'default'; }
  else if (devOn && e.code === 'KeyK') { HOUR = DAY > 0.5 ? 22 : 10; frameN = frameN - (frameN % 20); }
});
mc.addEventListener('click', (e) => {
  if (!devOn) return;
  const r = mc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * MW - 192, z = (e.clientY - r.top) / r.height * MW - 192;
  unfollow(); F[CX] = x; F[CZ] = z; F[CY] = min(floorAt(x, z) + 3, -2); F[VX] = F[VY] = F[VZ] = 0;
});
