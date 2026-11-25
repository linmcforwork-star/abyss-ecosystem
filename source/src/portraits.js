// ============================================================================
// side-view portraits for the info card (simple drawings, nose to the right), one per species, as SVG
// ============================================================================
const PORT = (() => {
  const S = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><defs>${defs}</defs>${inner}</svg>`;
  // a fish body: an egg shape from the tail stalk (x0) to the nose (x1), centred on y, half height h; fat = where the deepest point is
  const body = (x0, x1, y, h, fat = 0.45, stalk = 0.22) => {
    const L = x1 - x0, xm = x0 + L * (1 - fat), s = h * stalk;
    return `M${x0},${y - s} C${x0 + L * 0.25},${y - s * 1.2} ${xm - L * 0.2},${y - h} ${xm},${y - h} C${xm + L * 0.3},${y - h} ${x1},${y - h * 0.35} ${x1},${y} C${x1},${y + h * 0.4} ${xm + L * 0.3},${y + h} ${xm},${y + h} C${xm - L * 0.2},${y + h} ${x0 + L * 0.25},${y + s * 1.2} ${x0},${y + s} Z`;
  };
  const eye = (x, y, r, ring = '#fff') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ring}"/><circle cx="${x + r * 0.1}" cy="${y}" r="${r * 0.62}" fill="#111"/><circle cx="${x + r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#fff"/>`;
  const clip = (id, d) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
  const P = [];

  { // 0 clownfish
    const b = body(48, 162, 62, 30, 0.5, 0.35);
    P[0] = S(`<path d="M52,50 C40,40 26,34 22,44 C20,54 20,70 22,80 C26,90 40,84 52,74 Z" fill="#ff7a1a" stroke="#111" stroke-width="3"/>
      <path d="M70,36 C85,14 120,14 138,36 Z" fill="#ff7a1a" stroke="#111" stroke-width="3"/>
      <path d="M80,88 C92,104 112,104 120,88 Z" fill="#ff7a1a" stroke="#111" stroke-width="3"/>
      <g clip-path="url(#c0)"><path d="${b}" fill="#ff7a1a"/>
      <path d="M128,20 C122,50 122,80 130,110 L145,110 C137,80 137,50 143,20 Z" fill="#fff" stroke="#111" stroke-width="3"/>
      <path d="M92,20 C98,50 98,80 92,110 L110,110 C116,80 116,50 110,20 Z" fill="#fff" stroke="#111" stroke-width="3"/>
      <path d="M52,20 L60,20 L60,110 L52,110 Z" fill="#fff" stroke="#111" stroke-width="3"/></g>
      <path d="${b}" fill="none" stroke="#111" stroke-width="2"/>
      <path d="M118,70 C126,80 128,90 120,94 C114,88 112,78 118,70 Z" fill="#ff7a1a" stroke="#111" stroke-width="2"/>
      ${eye(150, 55, 6, '#ff9a4a')}`, clip('c0', b));
  }
  { // 1 blue-green chromis
    const b = body(55, 160, 60, 26, 0.5, 0.3);
    P[1] = S(`<path d="M58,54 L22,30 L36,60 L22,90 L58,66 Z" fill="#7fe0d0"/>
      <path d="M72,40 C90,22 120,22 132,38 Z" fill="#8fe6da"/><path d="M78,80 C92,96 112,94 118,82 Z" fill="#8fe6da"/>
      <path d="${b}" fill="url(#g1)"/>${eye(146, 54, 6, '#cfe')}`,
    `<linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fd6a0"/><stop offset=".55" stop-color="#5fc8f0"/><stop offset="1" stop-color="#bff0ff"/></linearGradient>`);
  }
  { // 2 cleaner wrasse
    const b = body(40, 175, 60, 16, 0.55, 0.45);
    P[2] = S(`<path d="M44,54 C34,46 24,46 20,52 L20,68 C24,74 34,74 44,66 Z" fill="#2f5de8"/>
      <path d="M70,46 C100,38 140,40 158,48 Z" fill="#2f5de8" opacity=".8"/>
      <g clip-path="url(#c2)"><path d="${b}" fill="#f0e6b0"/><rect x="40" y="40" width="80" height="40" fill="#3a6cf0" opacity=".85" mask="url(#m2)"/>
      <path d="M40,56 C90,62 140,61 176,58 L176,62 C140,66 90,72 40,72 Z" fill="#111"/>
      <path d="M40,60 C80,52 140,54 176,56 L176,57 C140,58 80,58 40,64 Z" fill="#111"/></g>
      ${eye(162, 56, 4.5, '#f0e6b0')}`,
    clip('c2', b) + `<linearGradient id="gm2" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="m2"><rect x="40" y="40" width="80" height="40" fill="url(#gm2)"/></mask>`);
  }
  { // 3 parrotfish
    const b = body(50, 168, 62, 28, 0.5, 0.33);
    P[3] = S(`<path d="M54,52 C40,38 24,34 18,38 C26,52 26,72 18,86 C24,90 40,86 54,72 Z" fill="#7fc8b0" stroke="#f09a8a" stroke-width="3"/>
      <path d="M66,38 C96,28 140,30 150,40 Z" fill="#5ab0a0" stroke="#f09a8a" stroke-width="2"/><path d="M76,86 C100,94 130,92 138,86 Z" fill="#5ab0a0" stroke="#f09a8a" stroke-width="2"/>
      <g clip-path="url(#c3)"><path d="${b}" fill="#1f8a78"/><rect x="40" y="20" width="140" height="90" fill="url(#p3)"/>
      <path d="M150,30 L170,30 L170,95 L150,95 Z" fill="#9fe0d6"/></g>
      <path d="M160,58 C168,58 170,62 168,66 C164,68 160,66 158,64 Z" fill="#e8f4ee"/>${eye(148, 54, 5.5, '#f6c0a0')}`,
    clip('c3', b) + `<pattern id="p3" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M0,5 Q6,-1 12,5 Q6,11 0,5 Z" fill="none" stroke="#f0a08e" stroke-width="1.4"/></pattern>`);
  }
  { // 4 moorish idol
    const b = 'M60,62 C70,30 96,14 120,16 C140,18 150,34 160,52 L182,58 L182,62 L160,68 C150,88 140,102 120,104 C96,106 70,92 60,62 Z';
    P[4] = S(`<path d="M62,56 L40,46 L44,62 L40,78 L62,68 Z" fill="#111"/>
      <path d="M112,18 C100,10 80,4 40,8 C70,10 92,16 104,24 Z" fill="#f4f0e4"/>
      <g clip-path="url(#c4)"><path d="${b}" fill="#f6dc40"/><path d="M60,10 L150,10 L150,110 L60,110 Z" fill="#fdf6d8" opacity=".55"/>
      <path d="M122,10 C116,40 116,80 122,110 L144,110 C138,80 138,40 144,10 Z" fill="#111"/>
      <path d="M70,10 C78,40 78,80 70,110 L92,110 C100,80 100,40 92,10 Z" fill="#111"/>
      <path d="M148,50 C156,52 162,56 170,58 L170,62 C162,62 156,60 150,62 Z" fill="#ff9a30"/></g>
      ${eye(148, 54, 5, '#fdf6d8')}`, clip('c4', b));
  }
  { // 5 coral trout
    const b = body(40, 172, 60, 22, 0.5, 0.42);
    P[5] = S(`<path d="M44,50 L20,40 L22,80 L44,70 Z" fill="#c8402c"/>
      <path d="M70,40 C90,28 130,28 148,40 Z" fill="#c8402c"/><path d="M80,80 C96,92 116,90 124,80 Z" fill="#c8402c"/>
      <g clip-path="url(#c5)"><path d="${b}" fill="#e0553a"/><rect x="20" y="20" width="160" height="80" fill="url(#p5)"/></g>
      <path d="M150,62 L172,60" stroke="#8a2a1e" stroke-width="2"/>${eye(152, 52, 5, '#f0a080')}`,
    clip('c5', b) + `<pattern id="p5" width="9" height="8" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="#7fd0ff"/><circle cx="7.5" cy="7" r="1.1" fill="#7fd0ff"/></pattern>`);
  }
  { // 6 blue tang
    const b = body(50, 165, 60, 32, 0.5, 0.3);
    P[6] = S(`<path d="M54,52 L22,30 C30,48 30,72 22,90 L54,68 Z" fill="#ffd21a" stroke="#111" stroke-width="3"/>
      <path d="M66,36 C90,18 132,20 150,36 Z" fill="#1f4fd8" stroke="#111" stroke-width="3"/><path d="M70,84 C92,102 128,100 140,86 Z" fill="#1f4fd8" stroke="#111" stroke-width="3"/>
      <g clip-path="url(#c6)"><path d="${b}" fill="#2a62f0"/>
      <path d="M60,40 C90,30 130,30 150,46 C130,40 110,44 100,56 C110,62 120,70 126,84 C110,72 90,66 70,64 C64,58 60,50 60,40 Z" fill="#111"/>
      <path d="M50,52 L66,52 L66,70 L50,70 Z" fill="#ffd21a"/></g>
      ${eye(148, 52, 6, '#2a62f0')}`, clip('c6', b));
  }
  { // 7 blacktip reef shark
    const b = 'M30,58 C50,50 90,44 130,46 C160,48 178,54 186,62 C178,68 160,72 130,72 C90,74 50,70 30,64 Z';
    P[7] = S(`<path d="M34,60 L6,22 L14,58 L20,74 L34,64 Z" fill="#8c98a0"/><path d="M6,22 L12,34 L18,30 Z" fill="#111"/><path d="M20,74 L16,68 L24,70 Z" fill="#111"/>
      <path d="M96,46 L112,14 L124,46 Z" fill="#8c98a0"/><path d="M112,14 L106,28 L116,26 Z" fill="#111"/>
      <path d="M120,70 L96,96 L112,72 Z" fill="#8c98a0"/><path d="M96,96 L100,88 L104,92 Z" fill="#111"/>
      <path d="${b}" fill="#9aa6ae"/><path d="M30,64 C50,70 90,74 130,72 C160,72 178,68 186,62 C170,66 150,66 130,66 C100,66 60,64 30,62 Z" fill="#eef2f2"/>
      <path d="M144,52 L146,62 M150,52 L152,62 M156,53 L158,62" stroke="#6a767e" stroke-width="1.5"/>${eye(168, 57, 3, '#9aa6ae')}`);
  }
  { // 8 giant moray
    P[8] = S(`<path d="M14,80 C40,96 70,100 100,86 C130,72 150,60 168,58 C178,57 188,60 192,66 C188,74 178,78 168,76 C150,76 130,86 104,98 C76,110 40,108 14,92 Z" fill="#a88a3a"/>
      <path d="M14,80 C40,96 70,100 100,86 C130,72 150,60 168,58" fill="none" stroke="#7a6020" stroke-width="5"/>
      <path d="M14,80 C40,96 70,100 100,86 C130,72 150,60 168,58 C178,57 188,60 192,66 C188,74 178,78 168,76 C150,76 130,86 104,98 C76,110 40,108 14,92 Z" fill="url(#p8)"/>
      <path d="M186,64 L196,62 L194,70 Z" fill="#7a2a1e"/>${eye(178, 62, 3.4, '#d8c070')}`,
    `<pattern id="p8" width="14" height="12" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="3" fill="#3a2a10" opacity=".75"/><circle cx="11" cy="9" r="2.2" fill="#3a2a10" opacity=".75"/></pattern>`);
  }
  { // 9 reef manta (seen from above)
    P[9] = S(`<path d="M100,30 C120,30 150,40 194,56 C160,64 130,76 112,84 L104,112 L96,112 L88,84 C70,76 40,64 6,56 C50,40 80,30 100,30 Z" fill="#1c2228"/>
      <path d="M86,40 C70,44 56,50 44,56 C60,56 74,52 88,48 Z M114,40 C130,44 144,50 156,56 C140,56 126,52 112,48 Z" fill="#e8eef0"/>
      <path d="M90,28 L86,16 L94,26 Z M110,28 L114,16 L106,26 Z" fill="#1c2228"/>`);
  }
  { // 10 magnificent anemone with its clownfish
    let t = '';
    for (let i = 0; i < 46; i++) { const x = 30 + i * 3.2 + (i % 3) * 1.2, h = 26 + 12 * Math.sin(i * 0.5) * Math.sin(i * 0.17), lean = (x - 100) * 0.18; t += `<path d="M${x},96 Q${x + lean * 0.3},${96 - h * 0.6} ${x + lean},${96 - h}" stroke="url(#ga)" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="${x + lean}" cy="${96 - h}" r="4.2" fill="#9fb8ff"/>`; }
    P[10] = S(`<ellipse cx="100" cy="102" rx="78" ry="14" fill="#b8306a"/>${t}
      <g transform="translate(112,40) scale(.28)"><path d="${body(48, 162, 62, 30, 0.5, 0.35)}" fill="#ff7a1a" stroke="#111" stroke-width="6"/><path d="M128,32 L144,32 L140,92 L126,92 Z M92,32 L110,32 L110,92 L92,92 Z" fill="#fff"/></g>`,
    `<linearGradient id="ga" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c86a7a"/><stop offset=".6" stop-color="#f2c2a0"/><stop offset="1" stop-color="#ffe0c8"/></linearGradient>`);
  }
  return P;
})();
