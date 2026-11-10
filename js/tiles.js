'use strict';
// ------------------------------------------------------------
//  Kacheln: Böden, Wände (3/4-Ansicht), Natur. Wird pro Karte
//  einmal in ein großes Canvas "gebacken".
// ------------------------------------------------------------
const THEMES = {
  forest: { outdoor: true, rain: true, fog: true, ambient: 0.8, floor: ',', wallA: 'hutExt', wallB: 'woodExt', amb: 'forest', step: 'grass', name: 'Wald' },
  hof: { outdoor: true, rain: true, fog: true, ambient: 0.79, floor: 'g', wallA: 'stoneExt', wallB: 'woodExt', amb: 'hof', step: 'gravel' },
  hut: { ambient: 0.9, floor: 'w', wallA: 'logs', wallB: 'logs', amb: 'hut', woodTone: 1 },
  shed: { ambient: 0.93, floor: 'w', wallA: 'planks', wallB: 'planks', amb: 'hut', woodTone: 2 },
  manor: { ambient: 0.94, floor: 'w', wallA: 'paperGreen', wallB: 'paperRed', amb: 'manor', woodTone: 0 },
  upper: { ambient: 0.95, floor: 'w', wallA: 'paperRed', wallB: 'paperGreen', amb: 'upper', woodTone: 0 },
  cellar: { ambient: 0.97, floor: 's', wallA: 'brick', wallB: 'brick', amb: 'cellar' },
  attic: { ambient: 0.97, floor: 'w', wallA: 'planks', wallB: 'planks', amb: 'attic', woodTone: 2 },
  greenhouse: { ambient: 0.84, floor: 's', wallA: 'glass', wallB: 'glass', amb: 'greenhouse', moon: true },
  chapel: { ambient: 0.93, floor: 's', wallA: 'chapel', wallB: 'chapel', amb: 'chapel' },
  crypt: { ambient: 0.975, floor: 's', wallA: 'crypt', wallB: 'crypt', amb: 'crypt' },
};

const Tiles = (function () {
  const WALLS = '#%$="h';
  const SOLID = '#%$="hTtorfix~_v';
  const OPAQUE = '#%$="_';
  const isWall = (ch) => WALLS.indexOf(ch) >= 0;
  const isSolid = (ch) => SOLID.indexOf(ch) >= 0;
  const isOpaque = (ch) => OPAQUE.indexOf(ch) >= 0;

  const STEP = { w: 'wood', d: 'wood', c: 'wood', k: 'tile', m: 'stone', s: 'stone', ',': 'grass', ';': 'grass', ':': 'dirt', g: 'gravel', a: 'stone', e: 'dirt', u: 'mud', p: 'water' };

  // Holztöne je Thema
  const WOOD = [
    ['#35241a', '#3a281c', '#312118', '#1d130e'],   // Herrenhaus: dunkel
    ['#4a3324', '#503828', '#45301f', '#2a1b13'],   // Hütte: wärmer
    ['#302a25', '#352e29', '#2b2522', '#1a1614'],   // Dachboden/Schuppen: grau
  ];

  // ---------- Böden ----------
  function floorWood(x, ctx, px, py, tx, ty, tone) {
    const W = WOOD[tone || 0];
    const PL = 40; // Dielenlänge in Pixeln
    for (let r = 0; r < 4; r++) {
      const gr = ty * 4 + r;
      const yy = py + r * 4;
      const off = Math.floor(U.hash(gr, 11, 3) * PL);
      let i = 0;
      while (i < 16) {
        const wx = tx * 16 + i + off;
        const plank = Math.floor(wx / PL);
        const end = Math.min(16, i + (PL - (wx % PL)));
        G.R(ctx, px + i, yy, end - i, 4, W[Math.floor(U.hash(plank, gr, 1) * 3)]);
        if (wx % PL === 0) G.R(ctx, px + i, yy, 1, 3, W[3]);
        i = end;
      }
      G.R(ctx, px, yy + 3, 16, 1, W[3]);
      G.R(ctx, px, yy, 16, 1, 'rgba(255,235,200,0.04)');
      for (let k = 0; k < 2; k++) {
        const gx = Math.floor(U.hash(tx, gr, 20 + k) * 13);
        G.R(ctx, px + gx, yy + 1 + k, 3, 1, k ? 'rgba(0,0,0,0.18)' : 'rgba(255,230,200,0.05)');
      }
      if (U.hash(tx, gr, 5) < 0.08) G.P(ctx, px + Math.floor(U.hash(tx, gr, 6) * 15), yy + 1, 'rgba(0,0,0,0.5)');
    }
    if (U.hash(tx, ty, 77) < 0.05) G.dither(ctx, px + 3, py + 4, 9, 7, 'rgba(0,0,0,0.25)', tx);
  }
  function floorStone(ctx, px, py, tx, ty, theme) {
    const outdoor = theme.outdoor;
    const cols = outdoor ? [C.st2, C.st3, '#353240'] : [C.st1, C.st2, '#26232d'];
    G.R(ctx, px, py, 16, 16, C.st0);
    for (let r = 0; r < 2; r++) {
      const off = (r + ty) % 2 ? 4 : 0;
      for (let k = -1; k < 2; k++) {
        const sx = px + off + k * 8;
        const c = cols[Math.floor(U.hash(tx * 2 + k, ty * 2 + r, 2) * 3)];
        const x0 = Math.max(px, sx + 1), x1 = Math.min(px + 16, sx + 8);
        if (x1 > x0) {
          G.R(ctx, x0, py + r * 8 + 1, x1 - x0, 7, c);
          G.R(ctx, x0, py + r * 8 + 1, x1 - x0, 1, 'rgba(255,255,255,0.05)');
        }
      }
    }
    G.speck(ctx, px, py, 16, 16, 'rgba(0,0,0,0.35)', 6, tx * 31 + ty);
    if (theme.wallA === 'brick' || theme.wallA === 'crypt') {
      if (U.hash(tx, ty, 9) < 0.3) G.speck(ctx, px, py, 16, 16, C.gr2, 5, tx + ty * 17);
      if (U.hash(tx, ty, 10) < 0.08) { G.R(ctx, px + 4, py + 9, 7, 3, 'rgba(20,30,40,0.6)'); G.R(ctx, px + 5, py + 9, 4, 1, 'rgba(120,150,170,0.25)'); }
    }
    if (U.hash(tx, ty, 13) < 0.07) G.line(ctx, px + 2, py + 3, px + 9, py + 12, 'rgba(0,0,0,0.5)');
  }
  function floorMarble(ctx, px, py, tx, ty) {
    const base = (tx + ty) % 2 ? '#2b2933' : '#24222b';
    G.R(ctx, px, py, 16, 16, base);
    G.R(ctx, px, py, 16, 1, '#1a1820'); G.R(ctx, px, py, 1, 16, '#1a1820');
    G.R(ctx, px + 1, py + 1, 15, 1, 'rgba(255,255,255,0.05)');
    const v = U.hash(tx, ty, 3);
    if (v < 0.6) {
      let x = px + 2 + Math.floor(v * 10), y = py + 2;
      for (let i = 0; i < 10; i++) { G.P(ctx, x, y, 'rgba(200,190,210,0.12)'); x += U.hash(tx, ty, i) < 0.5 ? 1 : 0; y++; }
    }
  }
  function floorCarpet(ctx, px, py, tx, ty, w, color) {
    const same = (dx, dy) => w.tileAt(tx + dx, ty + dy) === 'c';
    const R1 = color || C.rd1, R2 = C.rd2, R0 = C.rd0;
    G.R(ctx, px, py, 16, 16, R1);
    // Muster
    for (let j = 0; j < 16; j += 8) for (let i = 0; i < 16; i += 8) {
      G.P(ctx, px + i + 4, py + j + 2, R2); G.P(ctx, px + i + 3, py + j + 3, R2); G.P(ctx, px + i + 5, py + j + 3, R2);
      G.P(ctx, px + i + 2, py + j + 4, R2); G.P(ctx, px + i + 6, py + j + 4, R2); G.P(ctx, px + i + 4, py + j + 4, C.yl1);
      G.P(ctx, px + i + 3, py + j + 5, R2); G.P(ctx, px + i + 5, py + j + 5, R2); G.P(ctx, px + i + 4, py + j + 6, R2);
    }
    const B = C.yl1, B2 = '#2a1608';
    if (!same(0, -1)) { G.R(ctx, px, py, 16, 2, B2); G.R(ctx, px, py + 2, 16, 1, B); }
    if (!same(0, 1)) { G.R(ctx, px, py + 14, 16, 2, B2); G.R(ctx, px, py + 13, 16, 1, B); for (let i = 1; i < 16; i += 2) G.P(ctx, px + i, py + 15, C.bn1); }
    if (!same(-1, 0)) { G.R(ctx, px, py, 2, 16, B2); G.R(ctx, px + 2, py, 1, 16, B); }
    if (!same(1, 0)) { G.R(ctx, px + 14, py, 2, 16, B2); G.R(ctx, px + 13, py, 1, 16, B); }
    if (U.hash(tx, ty, 4) < 0.2) G.dither(ctx, px + 3, py + 4, 8, 6, R0, tx);
  }
  function floorChecker(ctx, px, py, tx, ty) {
    const A = '#6e6a5e', B = '#1f1d24';
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      G.R(ctx, px + i * 8, py + j * 8, 8, 8, (i + j + tx + ty) % 2 ? A : B);
    }
    G.speck(ctx, px, py, 16, 16, 'rgba(40,30,20,0.5)', 10, tx * 13 + ty * 7);
    if (U.hash(tx, ty, 2) < 0.15) G.line(ctx, px + 1, py + 10, px + 7, py + 15, 'rgba(0,0,0,0.6)');
    if (U.hash(tx, ty, 3) < 0.12) G.R(ctx, px + 9, py + 3, 4, 3, 'rgba(70,20,20,0.5)');
  }
  function floorGrass(ctx, px, py, tx, ty, tall) {
    const base = [C.gr1, '#152218', '#17251a'][Math.floor(U.hash(tx, ty, 1) * 3)];
    G.R(ctx, px, py, 16, 16, base);
    for (let i = 0; i < 14; i++) {
      const gx = Math.floor(U.hash(tx, ty, i * 2) * 16), gy = Math.floor(U.hash(tx, ty, i * 2 + 1) * 15);
      G.P(ctx, px + gx, py + gy, i % 3 === 0 ? C.gr0 : C.gr3);
      if (i % 4 === 0) G.P(ctx, px + gx, py + gy + 1, C.gr2);
    }
    const r = U.hash(tx, ty, 40);
    if (r < 0.05) { G.P(ctx, px + 5, py + 6, C.bn2); G.P(ctx, px + 4, py + 7, C.bn1); G.P(ctx, px + 6, py + 7, C.bn1); }
    else if (r < 0.08) { G.R(ctx, px + 9, py + 9, 3, 1, C.rd2); G.P(ctx, px + 10, py + 10, C.bn1); } // Pilz
    else if (r < 0.1) { G.R(ctx, px + 3, py + 11, 3, 1, C.st3); G.P(ctx, px + 4, py + 10, C.st4); }  // Stein
    if (tall) {
      for (let i = 0; i < 6; i++) {
        const gx = 1 + Math.floor(U.hash(tx, ty, 60 + i) * 14), gy = 5 + Math.floor(U.hash(tx, ty, 70 + i) * 9);
        G.R(ctx, px + gx, py + gy - 3, 1, 4, i % 2 ? C.gr3 : C.gr4);
        G.P(ctx, px + gx + 1, py + gy - 4, C.gr3);
      }
    }
  }
  function floorDirt(ctx, px, py, tx, ty, w, mud) {
    G.R(ctx, px, py, 16, 16, mud ? '#1f1a14' : '#2b2118');
    G.speck(ctx, px, py, 16, 16, mud ? '#14110d' : '#3a2d20', 12, tx * 7 + ty * 13);
    G.speck(ctx, px, py, 16, 16, '#1d1610', 8, tx * 3 + ty * 19);
    if (mud) { G.speck(ctx, px, py, 16, 16, 'rgba(110,140,160,0.18)', 4, tx + ty); return; }
    // Übergang zu Gras
    const g = (dx, dy) => { const c = w.tileAt(tx + dx, ty + dy); return c === ',' || c === ';' || c === 'T' || c === 'o'; };
    const edge = (x0, y0, ww, hh, seed) => {
      for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) if (U.hash(px + x0 + i, py + y0 + j, seed) < 0.55 - (ww > hh ? j : i) * 0.15) G.P(ctx, px + x0 + i, py + y0 + j, C.gr1);
    };
    if (g(0, -1)) edge(0, 0, 16, 3, 1);
    if (g(-1, 0)) edge(0, 0, 3, 16, 2);
    if (g(1, 0)) for (let j = 0; j < 16; j++) for (let i = 0; i < 3; i++) if (U.hash(px + i, py + j, 3) < 0.55 - (2 - i) * 0.15) G.P(ctx, px + 13 + i, py + j, C.gr1);
    if (g(0, 1)) for (let j = 0; j < 3; j++) for (let i = 0; i < 16; i++) if (U.hash(px + i, py + j, 4) < 0.55 - (2 - j) * 0.15) G.P(ctx, px + i, py + 13 + j, C.gr1);
    // Fahrspuren
    if (U.hash(tx, ty, 5) < 0.3) G.R(ctx, px + 4, py, 1, 16, '#241b13');
  }
  function floorGravel(ctx, px, py, tx, ty) {
    G.R(ctx, px, py, 16, 16, '#2c2a2b');
    G.speck(ctx, px, py, 16, 16, '#3c3a3b', 26, tx * 11 + ty * 3);
    G.speck(ctx, px, py, 16, 16, '#1d1c1f', 18, tx * 5 + ty * 23);
    G.speck(ctx, px, py, 16, 16, '#4c4846', 6, tx * 17 + ty * 2);
    if (U.hash(tx, ty, 8) < 0.15) { G.R(ctx, px + 6, py + 7, 5, 3, 'rgba(30,45,60,0.7)'); G.R(ctx, px + 7, py + 7, 2, 1, 'rgba(140,170,200,0.25)'); }
  }
  function floorAsphalt(ctx, px, py, tx, ty, w) {
    G.R(ctx, px, py, 16, 16, '#1b1b20');
    G.speck(ctx, px, py, 16, 16, '#25252b', 20, tx * 9 + ty);
    G.speck(ctx, px, py, 16, 16, '#121215', 10, tx + ty * 9);
    const up = w.tileAt(tx, ty - 1) === 'a', dn = w.tileAt(tx, ty + 1) === 'a';
    if (up && dn && tx % 3 !== 0) G.R(ctx, px, py + 7, 10, 2, '#6d6240');
    if (!up) G.R(ctx, px, py, 16, 1, '#3a3a40');
    if (!dn) G.R(ctx, px, py + 15, 16, 1, '#3a3a40');
    if (U.hash(tx, ty, 3) < 0.15) G.line(ctx, px + 2, py + 2, px + 12, py + 6, '#0d0d10');
  }
  function floorSoil(ctx, px, py, tx, ty) {
    G.R(ctx, px, py, 16, 16, '#22180f');
    for (let j = 1; j < 16; j += 4) G.R(ctx, px, py + j, 16, 1, '#1a120b');
    G.speck(ctx, px, py, 16, 16, '#30231a', 10, tx * 3 + ty * 7);
    if (U.hash(tx, ty, 2) < 0.4) { G.P(ctx, px + 4, py + 6, C.gr4); G.P(ctx, px + 5, py + 5, C.gr3); }
  }
  function floorWater(ctx, px, py, tx, ty, w) {
    G.R(ctx, px, py, 16, 16, '#0c1620');
    G.speck(ctx, px, py, 16, 16, '#101e2b', 10, tx + ty * 5);
    const land = (dx, dy) => w.tileAt(tx + dx, ty + dy) !== '~';
    if (land(0, -1)) { G.R(ctx, px, py, 16, 2, '#1c1813'); G.R(ctx, px, py + 2, 16, 1, '#2a3a44'); }
    if (land(0, 1)) G.R(ctx, px, py + 15, 16, 1, '#1c1813');
    if (land(-1, 0)) G.R(ctx, px, py, 1, 16, '#1c1813');
    if (land(1, 0)) G.R(ctx, px + 15, py, 1, 16, '#1c1813');
  }

  // ---------- Wände ----------
  // Dachoberseite / Mauerkrone
  function wallTop(ctx, px, py, tx, ty, style, w) {
    const wall = (dx, dy) => isWall(w.tileAt(tx + dx, ty + dy));
    const ext = style === 'stoneExt' || style === 'woodExt' || style === 'hutExt';
    if (style === 'glass') {
      G.R(ctx, px, py, 16, 16, '#14201f');
      G.R(ctx, px, py, 16, 1, '#2e3d38'); G.R(ctx, px, py, 1, 16, '#2e3d38'); G.R(ctx, px + 8, py, 1, 16, '#24302c');
      G.P(ctx, px + 3, py + 3, 'rgba(160,200,210,0.25)'); G.P(ctx, px + 4, py + 2, 'rgba(160,200,210,0.25)');
    } else if (style === 'hedge') {
      G.R(ctx, px, py, 16, 16, C.gr2);
      G.speck(ctx, px, py, 16, 16, C.gr3, 20, tx * 5 + ty);
      G.speck(ctx, px, py, 16, 16, C.gr1, 14, tx + ty * 5);
    } else if (ext) {
      // Dachschindeln
      const roof = style === 'stoneExt' ? ['#1f1c27', '#29253a', '#16141d'] : ['#2a1c17', '#36241c', '#1a110d'];
      G.R(ctx, px, py, 16, 16, roof[0]);
      for (let r = 0; r < 4; r++) {
        const off = (r + ty) % 2 ? 2 : 6;
        for (let k = -1; k < 3; k++) {
          const sx = px + off + k * 6;
          G.R(ctx, Math.max(px, sx), py + r * 4, Math.min(5, px + 16 - sx), 3, roof[1]);
          G.R(ctx, Math.max(px, sx), py + r * 4 + 3, Math.min(5, px + 16 - sx), 1, roof[2]);
        }
      }
      if (U.hash(tx, ty, 5) < 0.15) G.speck(ctx, px, py, 16, 16, C.gr2, 6, tx * 3 + ty);
    } else {
      const top = { brick: '#141112', crypt: '#0f0d10', planks: '#120e0c', logs: '#17100b', chapel: '#18161a' }[style] || '#141018';
      G.R(ctx, px, py, 16, 16, top);
      G.speck(ctx, px, py, 16, 16, 'rgba(255,255,255,0.025)', 8, tx * 7 + ty * 3);
    }
    // Kanten zu begehbaren Flächen
    const rim = ext ? 'rgba(170,160,190,0.22)' : 'rgba(150,130,120,0.22)';
    const dark = 'rgba(0,0,0,0.5)';
    if (!wall(0, -1) && ty > 0) { G.R(ctx, px, py, 16, 1, rim); G.R(ctx, px, py + 1, 16, 1, dark); }
    if (!wall(-1, 0)) { G.R(ctx, px, py, 1, 16, rim); }
    if (!wall(1, 0)) { G.R(ctx, px + 15, py, 1, 16, dark); }
    if (ext && !wall(0, 1)) G.R(ctx, px, py + 15, 16, 1, '#0a0809');
  }

  function wallFace(ctx, px, py, tx, ty, style, ch, w) {
    const win = ch === '=' || ch === '"';
    switch (style) {
      case 'paperGreen': case 'paperRed': {
        const red = style === 'paperRed';
        const P1 = red ? '#3a1c24' : '#22322a', P2 = red ? '#4a2430' : '#2b3f33', P3 = red ? '#2a141b' : '#18241e';
        G.R(ctx, px, py, 16, 11, P1);
        for (let i = 0; i < 16; i += 4) G.R(ctx, px + i, py, 1, 11, P3);
        for (let j = 1; j < 10; j += 4) for (let i = 2; i < 16; i += 4) {
          const o = (j % 8 === 1) ? 0 : 2;
          G.P(ctx, px + ((i + o) % 16), py + j, P2); G.P(ctx, px + ((i + o) % 16), py + j + 1, P2);
        }
        // Flecken, abgelöste Tapete
        if (U.hash(tx, ty, 3) < 0.3) G.dither(ctx, px + 2, py + 5, 6, 5, 'rgba(10,8,6,0.55)', tx);
        if (U.hash(tx, ty, 4) < 0.15) { G.R(ctx, px + 9, py + 1, 4, 3, '#4b3f33'); G.R(ctx, px + 9, py + 4, 2, 1, '#4b3f33'); }
        // Vertäfelung
        G.R(ctx, px, py + 11, 16, 1, C.wd4);
        G.R(ctx, px, py + 12, 16, 3, C.wd2);
        G.R(ctx, px + 2, py + 12, 5, 2, C.wd1); G.R(ctx, px + 9, py + 12, 5, 2, C.wd1);
        G.R(ctx, px, py + 15, 16, 1, '#0d0907');
        break;
      }
      case 'brick': case 'crypt': {
        const crypt = style === 'crypt';
        G.R(ctx, px, py, 16, 16, crypt ? '#141216' : '#1b1615');
        for (let r = 0; r < 4; r++) {
          const off = r % 2 ? 4 : 0;
          for (let k = -1; k < 3; k++) {
            const bx = px + off + k * 8;
            const c = crypt ? ['#2a2730', '#24212a', '#312d37'][Math.floor(U.hash(tx * 3 + k, ty * 4 + r, 1) * 3)]
              : ['#3b3029', '#33291f', '#45362c'][Math.floor(U.hash(tx * 3 + k, ty * 4 + r, 1) * 3)];
            const x0 = Math.max(px, bx), x1 = Math.min(px + 16, bx + 7);
            if (x1 > x0) { G.R(ctx, x0, py + r * 4, x1 - x0, 3, c); G.R(ctx, x0, py + r * 4, x1 - x0, 1, 'rgba(255,255,255,0.05)'); }
          }
        }
        if (U.hash(tx, ty, 6) < 0.4) G.dither(ctx, px, py + 10, 16, 6, 'rgba(10,20,10,0.5)', 1);
        if (U.hash(tx, ty, 7) < 0.3) G.speck(ctx, px, py + 9, 16, 7, C.gr2, 6, tx + ty);
        if (crypt && U.hash(tx, ty, 8) < 0.22) { // Grabnische mit Schädel
          G.R(ctx, px + 4, py + 4, 8, 7, '#08070a'); G.R(ctx, px + 5, py + 3, 6, 1, '#08070a');
          G.R(ctx, px + 6, py + 6, 4, 3, C.bn1); G.P(ctx, px + 6, py + 7, '#08070a'); G.P(ctx, px + 9, py + 7, '#08070a'); G.R(ctx, px + 7, py + 9, 2, 1, C.bn0);
        }
        G.R(ctx, px, py + 15, 16, 1, '#0a0809');
        break;
      }
      case 'planks': {
        G.R(ctx, px, py, 16, 16, '#2c241f');
        for (let i = 0; i < 16; i += 4) {
          G.R(ctx, px + i, py, 4, 16, ['#2c241f', '#332a24', '#271f1a'][Math.floor(U.hash(tx * 4 + i, ty, 2) * 3)]);
          G.R(ctx, px + i, py, 1, 16, '#16110e');
          if (U.hash(tx * 4 + i, ty, 3) < 0.5) G.P(ctx, px + i + 2, py + 3, '#0e0b09');
        }
        G.R(ctx, px, py + 15, 16, 1, '#0a0807');
        break;
      }
      case 'logs': {
        for (let r = 0; r < 4; r++) {
          G.R(ctx, px, py + r * 4, 16, 4, C.wd3);
          G.R(ctx, px, py + r * 4, 16, 1, C.wd4);
          G.R(ctx, px, py + r * 4 + 3, 16, 1, C.wd1);
          if (U.hash(tx, ty * 4 + r, 2) < 0.3) G.R(ctx, px + 5, py + r * 4 + 1, 3, 1, C.wd2);
        }
        break;
      }
      case 'stoneExt': {
        G.R(ctx, px, py, 16, 16, '#24212b');
        for (let r = 0; r < 3; r++) {
          const off = r % 2 ? 5 : 0;
          for (let k = -1; k < 3; k++) {
            const bx = px + off + k * 10;
            const c = ['#3c3846', '#35313f', '#433f4e'][Math.floor(U.hash(tx * 3 + k, ty * 3 + r, 1) * 3)];
            const x0 = Math.max(px, bx), x1 = Math.min(px + 16, bx + 9);
            if (x1 > x0) { G.R(ctx, x0, py + r * 5, x1 - x0, 4, c); G.R(ctx, x0, py + r * 5, x1 - x0, 1, 'rgba(255,255,255,0.06)'); }
          }
        }
        G.R(ctx, px, py + 15, 16, 1, '#141218');
        if (U.hash(tx, ty, 9) < 0.35) { // Efeu
          for (let i = 0; i < 18; i++) {
            const ix = Math.floor(U.hash(tx, ty, 100 + i) * 16), iy = Math.floor(U.hash(tx, ty, 200 + i) * (6 + i));
            G.P(ctx, px + ix, py + Math.min(15, iy), i % 3 ? C.gr3 : C.gr4);
          }
        }
        break;
      }
      case 'woodExt': case 'hutExt': {
        const hut = style === 'hutExt';
        if (hut) {
          for (let r = 0; r < 4; r++) {
            G.R(ctx, px, py + r * 4, 16, 4, C.wd2);
            G.R(ctx, px, py + r * 4, 16, 1, C.wd3);
            G.R(ctx, px, py + r * 4 + 3, 16, 1, C.wd0);
          }
        } else {
          for (let i = 0; i < 16; i += 4) {
            G.R(ctx, px + i, py, 4, 16, ['#2e2019', '#35251c', '#281b15'][Math.floor(U.hash(tx * 4 + i, ty, 2) * 3)]);
            G.R(ctx, px + i, py, 1, 16, '#140d0a');
          }
        }
        G.R(ctx, px, py + 15, 16, 1, '#0a0706');
        break;
      }
      case 'glass': {
        G.R(ctx, px, py, 16, 16, '#18282a');
        G.R(ctx, px, py, 16, 1, '#3a4a42'); G.R(ctx, px, py, 1, 16, '#3a4a42'); G.R(ctx, px + 8, py, 1, 16, '#3a4a42');
        G.R(ctx, px, py + 8, 16, 1, '#3a4a42');
        G.line(ctx, px + 2, py + 6, px + 6, py + 2, 'rgba(170,210,220,0.25)');
        G.line(ctx, px + 10, py + 14, px + 14, py + 10, 'rgba(170,210,220,0.2)');
        if (U.hash(tx, ty, 2) < 0.4) G.speck(ctx, px, py, 16, 16, C.gr3, 8, tx + ty);
        if (U.hash(tx, ty, 3) < 0.15) { G.line(ctx, px + 9, py + 1, px + 15, py + 7, '#0b1010'); } // Sprung
        G.R(ctx, px, py + 14, 16, 2, '#2c2a2a');
        return;
      }
      case 'chapel': {
        G.R(ctx, px, py, 16, 16, '#2a2730');
        for (let r = 0; r < 4; r++) {
          const off = r % 2 ? 4 : 0;
          for (let k = -1; k < 3; k++) {
            const bx = px + off + k * 8;
            const x0 = Math.max(px, bx), x1 = Math.min(px + 16, bx + 7);
            if (x1 > x0) G.R(ctx, x0, py + r * 4, x1 - x0, 3, ['#403b44', '#38343d', '#47414a'][Math.floor(U.hash(tx * 3 + k, ty * 4 + r, 1) * 3)]);
          }
        }
        G.R(ctx, px, py + 15, 16, 1, '#100e12');
        break;
      }
      case 'hedge': {
        G.R(ctx, px, py, 16, 16, C.gr1);
        G.speck(ctx, px, py, 16, 16, C.gr2, 30, tx * 3 + ty);
        G.speck(ctx, px, py, 16, 16, C.gr3, 12, tx + ty * 3);
        G.R(ctx, px, py + 15, 16, 1, C.gr0);
        return;
      }
      default:
        G.R(ctx, px, py, 16, 16, C.st2);
    }
    if (win) drawWindow(ctx, px, py, tx, ty, style);
  }

  function drawWindow(ctx, px, py, tx, ty, style) {
    if (style === 'chapel') {
      // Spitzbogenfenster mit Buntglas
      G.R(ctx, px + 4, py + 3, 8, 11, '#120f16');
      G.R(ctx, px + 5, py + 2, 6, 1, '#120f16'); G.R(ctx, px + 6, py + 1, 4, 1, '#120f16');
      const cols = [C.rd3, C.bl4, C.yl3, C.gr4, C.pu3];
      for (let j = 0; j < 10; j++) for (let i = 0; i < 6; i++) {
        if (j < 1 && (i < 1 || i > 4)) continue;
        G.P(ctx, px + 5 + i, py + 3 + j, cols[Math.floor(U.hash(tx * 6 + i, ty * 10 + j, 4) * 5)]);
      }
      G.R(ctx, px + 7, py + 2, 1, 12, '#120f16'); G.R(ctx, px + 5, py + 8, 6, 1, '#120f16');
      return;
    }
    if (style === 'glass') return;
    const ext = style === 'stoneExt' || style === 'woodExt' || style === 'hutExt';
    const fr = ext ? '#1a1418' : C.wd1;
    G.R(ctx, px + 2, py + 1, 12, 11, fr);
    G.R(ctx, px + 3, py + 2, 10, 9, '#0f1828');
    G.R(ctx, px + 3, py + 2, 10, 3, '#16243a');
    G.P(ctx, px + 4, py + 3, C.bl5); G.P(ctx, px + 5, py + 3, C.bl4); G.P(ctx, px + 4, py + 4, C.bl4);
    if (U.hash(tx, ty, 9) < 0.3) G.line(ctx, px + 9, py + 2, px + 12, py + 6, '#4c6680'); // Sprung im Glas
    G.R(ctx, px + 7, py + 2, 1, 9, fr); G.R(ctx, px + 3, py + 6, 10, 1, fr);
    G.R(ctx, px + 1, py + 11, 14, 1, ext ? '#3e3a46' : C.wd4);
    if (!ext) { // Vorhänge
      G.R(ctx, px + 1, py, 2, 12, C.rd2); G.R(ctx, px + 13, py, 2, 12, C.rd2);
      G.P(ctx, px + 2, py + 3, C.rd1); G.P(ctx, px + 13, py + 6, C.rd1);
      G.R(ctx, px + 1, py, 14, 1, C.yl1);
    }
  }

  // ---------- Natur ----------
  function natureBase(ctx, px, py, tx, ty, ch, w, theme) {
    const under = theme.outdoor ? ',' : theme.floor;
    drawFloor(ctx, under, px, py, tx, ty, w, theme);
    switch (ch) {
      case 'T': case 't':
        G.disc(ctx, px + 8, py + 13, 7, 3, 'rgba(0,0,0,0.45)');
        G.R(ctx, px + 6, py + 4, 4, 11, ch === 'T' ? '#24180f' : '#2c2622');
        G.R(ctx, px + 6, py + 4, 1, 11, ch === 'T' ? '#35241a' : '#3c352f');
        G.R(ctx, px + 4, py + 13, 2, 2, '#24180f'); G.R(ctx, px + 10, py + 13, 3, 2, '#24180f');
        break;
      case 'o':
        G.disc(ctx, px + 8, py + 12, 7, 3, 'rgba(0,0,0,0.45)');
        G.disc(ctx, px + 8, py + 8, 7, 6, C.gr1);
        G.disc(ctx, px + 6, py + 7, 4, 4, C.gr2);
        G.disc(ctx, px + 10, py + 6, 4, 3, C.gr2);
        G.speck(ctx, px + 2, py + 3, 12, 9, C.gr3, 10, tx * 5 + ty);
        if (U.hash(tx, ty, 1) < 0.3) { G.P(ctx, px + 5, py + 8, C.rd3); G.P(ctx, px + 9, py + 5, C.rd3); }
        break;
      case 'r':
        G.disc(ctx, px + 8, py + 12, 7, 3, 'rgba(0,0,0,0.5)');
        G.disc(ctx, px + 8, py + 9, 7, 5, C.st2);
        G.disc(ctx, px + 7, py + 8, 5, 3, C.st3);
        G.R(ctx, px + 5, py + 6, 3, 1, C.st4);
        G.speck(ctx, px + 2, py + 5, 12, 6, C.gr2, 5, tx + ty * 9);
        break;
      case 'f': {
        const h = w.tileAt(tx - 1, ty) === 'f' || w.tileAt(tx + 1, ty) === 'f';
        if (h || !(w.tileAt(tx, ty - 1) === 'f' || w.tileAt(tx, ty + 1) === 'f')) {
          G.R(ctx, px, py + 6, 16, 2, C.wd3); G.R(ctx, px, py + 10, 16, 2, C.wd3);
          G.R(ctx, px, py + 6, 16, 1, C.wd4);
          G.R(ctx, px + 2, py + 3, 3, 11, C.wd2); G.R(ctx, px + 2, py + 3, 3, 1, C.wd4);
          G.R(ctx, px + 2, py + 14, 3, 1, 'rgba(0,0,0,0.5)');
        } else {
          G.R(ctx, px + 7, py, 2, 16, C.wd3); G.R(ctx, px + 6, py + 4, 4, 4, C.wd2);
        }
        break;
      }
      case 'i': {
        const left = w.tileAt(tx - 1, ty) === 'i' || w.tileAt(tx + 1, ty) === 'i';
        if (left || !(w.tileAt(tx, ty - 1) === 'i')) {
          G.R(ctx, px, py + 3, 16, 1, '#1b1a20'); G.R(ctx, px, py + 12, 16, 1, '#1b1a20');
          for (let i = 1; i < 16; i += 3) {
            G.R(ctx, px + i, py + 2, 1, 13, '#26252d');
            G.P(ctx, px + i, py + 1, '#3a3944'); G.P(ctx, px + i, py, '#4a4955');
          }
          G.R(ctx, px, py + 14, 16, 1, 'rgba(0,0,0,0.45)');
        } else {
          G.R(ctx, px + 7, py, 2, 16, '#26252d'); G.R(ctx, px + 6, py, 4, 2, '#3a3944');
        }
        break;
      }
      case 'x':
        G.disc(ctx, px + 8, py + 10, 7, 5, '#24201d');
        G.R(ctx, px + 2, py + 7, 6, 3, '#3b302a'); G.R(ctx, px + 8, py + 9, 6, 3, '#4a3a2f');
        G.R(ctx, px + 4, py + 4, 8, 2, C.wd3); G.line(ctx, px + 1, py + 12, px + 14, py + 3, C.wd2);
        G.speck(ctx, px + 1, py + 4, 14, 10, C.st4, 8, tx + ty);
        break;
      case 'v':
        G.R(ctx, px, py, 16, 16, '#030204');
        if (w.tileAt(tx, ty - 1) !== 'v') G.R(ctx, px, py, 16, 2, '#1a1418');
        break;
      case '_':
        G.R(ctx, px, py, 16, 16, '#050407');
        break;
      case '~':
        floorWater(ctx, px, py, tx, ty, w);
        break;
    }
  }

  function drawFloor(ctx, ch, px, py, tx, ty, w, theme) {
    switch (ch) {
      case 'w': case '.': if (ch === '.' && theme.floor !== 'w') return drawFloor(ctx, theme.floor, px, py, tx, ty, w, theme); floorWood(null, ctx, px, py, tx, ty, theme.woodTone); break;
      case 'd': // Türschwelle
        if (theme.floor === 's' || theme.outdoor) floorStone(ctx, px, py, tx, ty, theme); else floorWood(null, ctx, px, py, tx, ty, theme.woodTone);
        G.R(ctx, px, py, 16, 16, 'rgba(0,0,0,0.25)');
        break;
      case 's': floorStone(ctx, px, py, tx, ty, theme); break;
      case 'm': floorMarble(ctx, px, py, tx, ty); break;
      case 'c': floorCarpet(ctx, px, py, tx, ty, w); break;
      case 'k': floorChecker(ctx, px, py, tx, ty); break;
      case ',': floorGrass(ctx, px, py, tx, ty, false); break;
      case ';': floorGrass(ctx, px, py, tx, ty, true); break;
      case ':': floorDirt(ctx, px, py, tx, ty, w, false); break;
      case 'u': floorDirt(ctx, px, py, tx, ty, w, true); break;
      case 'g': floorGravel(ctx, px, py, tx, ty); break;
      case 'a': floorAsphalt(ctx, px, py, tx, ty, w); break;
      case 'e': floorSoil(ctx, px, py, tx, ty); break;
      default: G.R(ctx, px, py, 16, 16, '#000');
    }
  }

  function styleFor(ch, theme) {
    if (ch === '$') return 'glass';
    if (ch === 'h') return 'hedge';
    if (ch === '%' || ch === '"') return theme.wallB;
    return theme.wallA;
  }

  // Baumkronen (Overlay über Figuren)
  function canopy(ctx, px, py, tx, ty, dead) {
    if (dead) {
      const c = '#2c2622';
      G.line(ctx, px + 8, py + 4, px + 2, py - 8, c);
      G.line(ctx, px + 8, py + 4, px + 14, py - 6, c);
      G.line(ctx, px + 8, py + 2, px + 8, py - 12, c);
      G.line(ctx, px + 4, py - 4, px - 1, py - 6, c);
      G.line(ctx, px + 12, py - 2, px + 17, py - 3, c);
      G.line(ctx, px + 8, py - 8, px + 11, py - 14, c);
      return;
    }
    const s = U.hash(tx, ty, 50);
    const cx = px + 8 + Math.round((s - 0.5) * 4), cy = py - 2;
    G.disc(ctx, cx, cy + 2, 13, 11, '#0a120b');
    G.disc(ctx, cx - 4, cy + 1, 8, 7, C.gr1);
    G.disc(ctx, cx + 5, cy - 1, 8, 7, C.gr1);
    G.disc(ctx, cx, cy - 4, 8, 6, '#17261a');
    G.disc(ctx, cx - 3, cy - 5, 4, 3, C.gr2);
    G.disc(ctx, cx + 4, cy - 3, 4, 3, C.gr2);
    for (let i = 0; i < 16; i++) {
      const a = U.hash(tx, ty, 300 + i) * TAU, r = 4 + U.hash(tx, ty, 400 + i) * 8;
      G.P(ctx, cx + Math.cos(a) * r, cy - 3 + Math.sin(a) * r * 0.8, i % 2 ? C.gr3 : '#0d170f');
    }
  }

  // ---------- Backen ----------
  function bake(w) {
    const theme = w.theme;
    const [base, bx] = mkCanvas(w.w * TS, w.h * TS);
    const [over, ox] = mkCanvas(w.w * TS, w.h * TS + 16);
    for (let ty = 0; ty < w.h; ty++) {
      for (let tx = 0; tx < w.w; tx++) {
        drawTile(bx, w, tx, ty, theme);
      }
    }
    // Wandschatten auf Böden
    for (let ty = 0; ty < w.h; ty++) for (let tx = 0; tx < w.w; tx++) {
      const ch = w.tileAt(tx, ty);
      if (isSolid(ch) && ch !== '~') continue;
      const px = tx * TS, py = ty * TS;
      if (isWall(w.tileAt(tx, ty - 1))) { G.R(bx, px, py, 16, 3, 'rgba(0,0,0,0.35)'); G.R(bx, px, py, 16, 1, 'rgba(0,0,0,0.35)'); }
      if (isWall(w.tileAt(tx - 1, ty))) G.R(bx, px, py, 2, 16, 'rgba(0,0,0,0.25)');
      if (isWall(w.tileAt(tx + 1, ty))) G.R(bx, px + 14, py, 2, 16, 'rgba(0,0,0,0.2)');
    }
    // Baumkronen
    for (let ty = 0; ty < w.h; ty++) for (let tx = 0; tx < w.w; tx++) {
      const ch = w.tileAt(tx, ty);
      if (ch === 'T' || ch === 't') canopy(ox, tx * TS, ty * TS + 16, tx, ty, ch === 't');
    }
    w.baseCanvas = base;
    w.overCanvas = over;
  }
  function drawTile(bx, w, tx, ty, theme) {
    const ch = w.tileAt(tx, ty);
    const px = tx * TS, py = ty * TS;
    if (isWall(ch)) {
      const style = styleFor(ch, theme);
      const below = w.tileAt(tx, ty + 1);
      if (!isWall(below) && ty < w.h - 1) wallFace(bx, px, py, tx, ty, style, ch, w);
      else wallTop(bx, px, py, tx, ty, style, w);
    } else if ('Ttorfix~_v'.indexOf(ch) >= 0) {
      natureBase(bx, px, py, tx, ty, ch, w, theme);
    } else {
      drawFloor(bx, ch, px, py, tx, ty, w, theme);
    }
  }
  // einzelne Kachel neu zeichnen (z.B. abgelassener Teich)
  function redraw(w, tx, ty) {
    const ctx = w.baseCanvas.getContext('2d');
    for (let j = ty - 1; j <= ty + 1; j++) for (let i = tx - 1; i <= tx + 1; i++) {
      if (i < 0 || j < 0 || i >= w.w || j >= w.h) continue;
      drawTile(ctx, w, i, j, w.theme);
    }
  }

  // Wasser animiert (pro Frame)
  function drawWaterFx(ctx, w, cam, t) {
    const x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS));
    const x1 = Math.min(w.w - 1, Math.ceil((cam.x + VIEW_W) / TS)), y1 = Math.min(w.h - 1, Math.ceil((cam.y + VIEW_H) / TS));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (w.tileAt(tx, ty) !== '~') continue;
      const px = tx * TS - cam.x, py = ty * TS - cam.y;
      for (let i = 0; i < 3; i++) {
        const ph = t * 0.8 + U.hash(tx, ty, i) * 10;
        const lx = Math.floor((Math.sin(ph) * 0.5 + 0.5) * 10) + 2;
        const ly = 3 + i * 5;
        const a = 0.12 + 0.1 * Math.sin(ph * 1.7);
        G.R(ctx, px + lx, py + ly, 3, 1, `rgba(120,150,180,${a.toFixed(2)})`);
      }
    }
  }

  return { bake, redraw, isWall, isSolid, isOpaque, STEP, drawWaterFx, drawFloor };
})();
