'use strict';
// ------------------------------------------------------------
//  Figuren: Mara (Spielerin), Theo, die Zählerin, Kriecher,
//  Schemen. Alles prozedural gepixelt + Konturen, gecacht.
// ------------------------------------------------------------
const Chars = (function () {
  const R = G.R, P = G.P;
  const cache = new Map();

  const LOOKS = {
    mara: { hair: '#2a1a14', hairHi: '#3e2a20', skin: C.sk3, skinD: C.sk2, coat: '#c9a227', coatD: '#8a6d17', coatL: '#e8c95a', pants: '#232634', shoes: '#121016' },
    theo: { hair: '#5a3a1e', hairHi: '#76502c', skin: C.sk3, skinD: C.sk2, coat: C.bl3, coatD: C.bl2, coatL: C.bl4, pants: '#3a3a44', shoes: '#16141a', child: true },
    ilse: { hair: '#17110e', hairHi: '#2a201a', skin: '#d8d2c6', skinD: '#aaa294', coat: '#cfc8b6', coatD: '#9e9786', coatL: '#ece6d6', pants: '#cfc8b6', shoes: '#cfc8b6', child: true, dress: true },
  };

  // --- Person (Mara / Theo / Ilse) ---
  function drawPersonRaw(c, dir, frame, L) {
    const ch = L.child;
    const oy = ch ? 4 : 0; // Kinder sind kleiner
    const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    const legL = step === 1 ? 2 : 3, legR = step === -1 ? 2 : 3;
    if (dir === 'down' || dir === 'up') {
      // Beine
      const ly = 16;
      if (!L.dress) {
        R(c, 3, ly, 2, legL, L.pants); R(c, 7, ly, 2, legR, L.pants);
        R(c, 3, ly + legL, 2, 1, L.shoes); R(c, 7, ly + legR, 2, 1, L.shoes);
      } else { R(c, 4, ly, 1, legL + 1, L.skinD); R(c, 7, ly, 1, legR + 1, L.skinD); }
      // Körper
      const bt = ch ? 9 : 8;
      R(c, 2, bt, 8, 16 - bt, L.coat);
      R(c, 9, bt + 1, 1, 15 - bt, L.coatD);
      R(c, 2, 15, 8, 1, L.coatD);
      if (L.dress) { R(c, 1, 13, 10, 3, L.coat); R(c, 1, 15, 10, 1, L.coatD); }
      // Arme
      const aL = step === 1 ? 1 : step === -1 ? -1 : 0;
      R(c, 1, bt + 1 + aL, 1, 6, L.coat); R(c, 10, bt + 1 - aL, 1, 6, L.coatD);
      P(c, 1, bt + 7 + aL, L.skin); P(c, 10, bt + 7 - aL, L.skin);
      if (dir === 'down') {
        R(c, 3, bt, 6, 1, L.coatD);
        if (!ch) { R(c, 6, bt + 1, 1, 6, L.coatD); P(c, 3, 13, L.coatD); P(c, 8, 13, L.coatD); R(c, 2, bt + 1, 1, 1, L.coatL); }
      } else {
        R(c, 3, bt, 6, 2, L.coatD);
        if (!ch) R(c, 4, bt + 2, 4, 1, L.coatD);
      }
      // Kopf
      const hy = ch ? 3 : 0;
      R(c, 5, hy + 7, 2, 1, L.skinD);
      if (dir === 'down') {
        R(c, 3, hy, 6, 1, L.hair); R(c, 2, hy + 1, 8, 3, L.hair);
        R(c, 3, hy + 3, 6, 4, L.skin); R(c, 3, hy + 3, 6, 1, L.hair); P(c, 3, hy + 4, L.hair);
        R(c, 2, hy + 3, 1, ch ? 2 : 5, L.hair); R(c, 9, hy + 3, 1, ch ? 2 : 5, L.hair);
        P(c, 4, hy + 5, C.ink); P(c, 7, hy + 5, C.ink);
        P(c, 3, hy + 2, L.hairHi); P(c, 4, hy + 1, L.hairHi);
      } else {
        R(c, 3, hy, 6, 1, L.hair); R(c, 2, hy + 1, 8, 6, L.hair);
        if (!ch) R(c, 3, hy + 7, 6, 1, L.hair);
        P(c, 4, hy + 1, L.hairHi); P(c, 5, hy + 2, L.hairHi);
      }
    } else {
      // Seitenansicht (rechts)
      const ly = 16;
      const fw = step === 0 ? 0 : 1;
      if (!L.dress) {
        if (step === 0) { R(c, 5, ly, 2, 3, L.pants); R(c, 5, ly + 3, 3, 1, L.shoes); }
        else {
          R(c, 3, ly, 2, 3, L.pants); R(c, 7, ly, 2, 3, L.pants);
          R(c, 2, ly + 3, 3, 1, L.shoes); R(c, 7, ly + 3, 3, 1, L.shoes);
        }
      } else { R(c, 5, ly, 1, 4, L.skinD); if (fw) R(c, 7, ly, 1, 4, L.skinD); }
      const bt = ch ? 9 : 8;
      R(c, 3, bt, 6, 16 - bt, L.coat);
      R(c, 3, bt, 1, 16 - bt, L.coatD); R(c, 8, bt + 1, 1, 15 - bt, L.coatL);
      if (L.dress) { R(c, 2, 13, 8, 3, L.coat); }
      R(c, 3, 15, 6, 1, L.coatD);
      const sw = step === 1 ? 1 : step === -1 ? -1 : 0;
      R(c, 5 + sw, bt + 1, 2, 6, L.coatD); P(c, 5 + sw, bt + 7, L.skin); P(c, 6 + sw, bt + 7, L.skin);
      const hy = ch ? 3 : 0;
      R(c, 5, hy + 7, 2, 1, L.skinD);
      R(c, 4, hy, 5, 1, L.hair); R(c, 3, hy + 1, 7, 3, L.hair);
      R(c, 6, hy + 3, 4, 4, L.skin); R(c, 6, hy + 3, 3, 1, L.hair);
      R(c, 3, hy + 3, 3, ch ? 3 : 5, L.hair);
      P(c, 8, hy + 5, C.ink); P(c, 10, hy + 5, L.skin);
      P(c, 5, hy + 1, L.hairHi);
    }
  }
  function person(ctx, x, y, dir, frame, lookName, alpha) {
    const L = LOOKS[lookName] || LOOKS.mara;
    const key = 'p|' + lookName + '|' + dir + '|' + frame;
    let spr = cache.get(key);
    if (!spr) {
      const d = dir === 'left' ? 'right' : dir;
      const [cv, c] = mkCanvas(12, 20);
      drawPersonRaw(c, d, frame, L);
      let out = G.outline(cv, 'rgba(5,4,8,0.85)');
      if (dir === 'left') out = G.flipX(out);
      spr = out; cache.set(key, spr);
    }
    if (alpha !== undefined) { const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.drawImage(spr, Math.round(x - 7), Math.round(y - 21)); ctx.globalAlpha = a; }
    else ctx.drawImage(spr, Math.round(x - 7), Math.round(y - 21));
  }

  // --- Die Zählerin ---
  function drawCounterRaw(c, dir, frame, raised) {
    const HAIR = '#09070b', HAIR2 = '#1a1620', SKIN = '#a9a59a', SKIND = '#7c786e', DRESS = '#9e988a', DRESSD = '#6f6a5f', DIRT = '#4a3c2e';
    const step = frame % 2 ? 1 : 0;
    if (dir === 'down' || dir === 'up') {
      // Beine
      R(c, 6, 27, 1, 5 - step, SKIND); R(c, 9, 27, 1, 4 + step, SKIND);
      R(c, 5, 32 - step, 2, 1, DIRT); R(c, 9, 31 + step, 2, 1, DIRT);
      // Kleid
      R(c, 4, 13, 8, 14, DRESS); R(c, 3, 18, 10, 9, DRESS);
      R(c, 10, 14, 2, 13, DRESSD); R(c, 3, 22, 1, 5, DRESSD);
      for (let i = 4; i < 13; i += 2) P(c, i, 26 + (i % 4 === 0 ? 1 : 0), DRESSD);
      P(c, 6, 20, DIRT); P(c, 7, 21, DIRT); P(c, 10, 17, DIRT); P(c, 5, 24, DIRT);
      // Arme – sehr lang
      const ar = raised ? -6 : 0;
      R(c, 2, 13, 1, 15 + ar, SKIN); R(c, 13, 13, 1, 15 + ar, SKIND);
      R(c, 1, 27 + ar, 1, 3, SKIND); R(c, 2, 28 + ar, 1, 3, SKIND); R(c, 14, 27 + ar, 1, 3, SKIND); R(c, 13, 28 + ar, 1, 3, SKIND);
      // Hals + Haar
      R(c, 7, 12, 2, 1, SKIN);
      R(c, 4, 0, 8, 2, HAIR); R(c, 3, 2, 10, 11, HAIR);
      R(c, 3, 12, 2, dir === 'up' ? 8 : 6, HAIR); R(c, 11, 12, 2, dir === 'up' ? 8 : 6, HAIR);
      if (dir === 'up') R(c, 4, 12, 8, 6, HAIR);
      for (let i = 4; i < 12; i += 3) R(c, i, 3, 1, 9, HAIR2);
      if (dir === 'down') {
        R(c, 7, 6, 2, 5, SKIN); P(c, 7, 7, '#e8e2d0'); P(c, 8, 9, '#2a0e10'); P(c, 7, 10, '#2a0e10');
      }
    } else {
      // Seite (rechts)
      R(c, 6, 27, 1, 5, SKIND); R(c, 9 - step * 2, 27, 1, 5, SKIND);
      R(c, 5, 32, 2, 1, DIRT); R(c, 8 - step * 2, 32, 2, 1, DIRT);
      R(c, 4, 13, 8, 14, DRESS); R(c, 3, 19, 10, 8, DRESS);
      R(c, 4, 13, 2, 14, DRESSD); P(c, 9, 20, DIRT); P(c, 6, 24, DIRT);
      for (let i = 4; i < 13; i += 2) P(c, i, 26 + (i % 4 === 0 ? 1 : 0), DRESSD);
      const ar = raised ? -1 : 0;
      if (raised) { R(c, 9, 14, 7, 1, SKIN); R(c, 15, 13, 1, 3, SKIND); }
      else { R(c, 9 + ar, 13, 1, 16, SKIN); R(c, 9, 29, 1, 2, SKIND); R(c, 10, 29, 1, 2, SKIND); }
      R(c, 8, 12, 2, 1, SKIN);
      // Kopf leicht nach vorn gebeugt
      R(c, 6, 0, 7, 2, HAIR); R(c, 5, 2, 9, 11, HAIR); R(c, 11, 8, 3, 9, HAIR); R(c, 5, 12, 3, 8, HAIR);
      for (let i = 6; i < 13; i += 3) R(c, i, 3, 1, 10, HAIR2);
      P(c, 12, 6, SKIN); P(c, 13, 6, '#e8e2d0');
    }
  }
  function counter(ctx, x, y, dir, frame, opts = {}) {
    const raised = opts.raised ? 1 : 0;
    const key = 'z|' + dir + '|' + (frame % 2) + '|' + raised;
    let spr = cache.get(key);
    if (!spr) {
      const d = dir === 'left' ? 'right' : dir;
      const [cv, c] = mkCanvas(16, 34);
      drawCounterRaw(c, d, frame, raised);
      let out = G.outline(cv, 'rgba(0,0,0,0.9)');
      if (dir === 'left') out = G.flipX(out);
      spr = out; cache.set(key, spr);
    }
    const a = ctx.globalAlpha;
    const tw = opts.twitch ? (Math.random() < 0.5 ? -1 : 1) : 0;
    if (opts.ghost) {
      let g = cache.get(key + '|g');
      if (!g) { g = G.tint(spr, '#ff0000', 0.6); cache.set(key + '|g', g); }
      ctx.globalAlpha = a * 0.35;
      ctx.drawImage(g, Math.round(x - 9 + 3), Math.round(y - 35));
    }
    ctx.globalAlpha = a * (opts.alpha === undefined ? 1 : opts.alpha);
    ctx.drawImage(spr, Math.round(x - 9 + tw), Math.round(y - 35));
    ctx.globalAlpha = a;
  }

  // --- Kriecher (blind, auf allen Vieren) ---
  function crawler(ctx, x, y, dir, t, opts = {}) {
    const horiz = dir === 'left' || dir === 'right';
    const flip = dir === 'left';
    const k = Math.sin(t * (opts.fast ? 14 : 7));
    const body = opts.root ? '#3a3a26' : '#8d887c', dark = opts.root ? '#22220f' : '#5e5a50', mouth = '#3a0c10';
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    const c = ctx;
    if (horiz) {
      G.disc(c, 0, 1, 10, 3, 'rgba(0,0,0,0.45)');
      // Gliedmaßen
      const l1 = Math.round(k * 3), l2 = -l1;
      G.line(c, -6, -3, -9 + l1, 1, dark); G.line(c, -4, -3, -2 + l2, 1, dark);
      G.line(c, 4, -4, 2 + l2, 1, dark); G.line(c, 6, -4, 9 + l1, 1, dark);
      // Rumpf
      R(c, -7, -7, 13, 4, body); R(c, -6, -8, 10, 1, body); R(c, -7, -7, 13, 1, dark);
      for (let i = -6; i < 6; i += 2) P(c, i, -8, dark);
      // Kopf
      R(c, 6, -8, 5, 4, body); R(c, 9, -5, 3, 2, mouth); P(c, 10, -4, C.bn3);
      if (opts.root) { G.line(c, -7, -6, -11, -9, dark); G.line(c, -3, -8, -5, -12, dark); }
    } else {
      const up = dir === 'up';
      G.disc(c, 0, 1, 6, 3, 'rgba(0,0,0,0.45)');
      const l1 = Math.round(k * 2);
      G.line(c, -3, -8, -7, -10 + l1, dark); G.line(c, 3, -8, 7, -10 - l1, dark);
      G.line(c, -3, -2, -7, 1 - l1, dark); G.line(c, 3, -2, 7, 1 + l1, dark);
      R(c, -3, -12, 6, 12, body); R(c, -3, -12, 1, 12, dark);
      for (let i = -11; i < 0; i += 2) P(c, 0, i, dark);
      if (!up) { R(c, -2, -1, 5, 4, body); R(c, -1, 1, 3, 2, mouth); }
      else { R(c, -2, -15, 5, 4, body); }
    }
    ctx.restore();
  }

  // --- Schemen (Halluzination) ---
  function shade(ctx, x, y, t, alpha) {
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * alpha;
    const c = ctx;
    const wob = (i) => Math.round(Math.sin(t * 5 + i) * 1);
    for (let j = 0; j < 26; j++) {
      const w = j < 6 ? 6 : j < 9 ? 4 : j < 22 ? 8 : 10;
      R(c, x - w / 2 + wob(j), y - 28 + j, w, 1, '#050407');
    }
    P(c, x - 2, y - 24, '#d8d2c0'); P(c, x + 1, y - 24, '#d8d2c0');
    ctx.globalAlpha = a;
  }

  return { person, counter, crawler, shade, LOOKS };
})();
