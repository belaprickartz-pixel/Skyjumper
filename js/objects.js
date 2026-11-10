'use strict';
// ------------------------------------------------------------
//  Objekt-Katalog: Möbel, Türen, Requisiten. Jedes Objekt wird
//  von Hand in Pixeln gezeichnet (Ursprung = linke obere Ecke
//  der Grundfläche).
// ------------------------------------------------------------
const OBJ = (function () {
  const R = G.R, P = G.P;
  const vr = (o, k = 0) => U.hash(o.x * 7 + k, o.y * 13 + k * 3, 99);
  const flame = (c, x, y, t, s = 0) => {
    const f = Math.sin(t * 13 + s * 7) + Math.sin(t * 23 + s * 3);
    const h = f > 0.6 ? 3 : 2;
    R(c, x, y - h, 1, h, C.or4); P(c, x, y - h - 1, f > 0 ? C.yl5 : C.or5);
    if (f > -0.5) P(c, x + (f > 1 ? 1 : -1), y - 1, C.or3);
    P(c, x, y - 1, C.yl5);
  };
  const BOOKS = [C.rd2, C.bl3, C.gr3, C.yl1, C.wd3, C.pu3, C.bn0, C.rd1, C.cy2, '#3a2f1e'];

  const T = {};

  // ---------- Türen ----------
  T.door = {
    solid: (o) => !o.st.open, opaque: (o) => !o.st.open,
    prompt: (o) => (o.p.to && o.orient === 'exit') ? 'Gehen' : (o.st.open ? 'Schließen' : 'Öffnen'),
    draw(c, o, t) {
      const open = o.st.open;
      const locked = (o.p.locked && !o.st.unlocked) || (o.p.bolted && !o.st.unbolted);
      if (o.orient === 'v') {
        R(c, 5, -4, 6, 2, C.wd0); R(c, 5, 14, 6, 2, C.wd0);
        if (!open) {
          R(c, 6, -3, 4, 19, C.wd3); R(c, 6, -3, 1, 19, C.wd4); R(c, 9, -3, 1, 19, C.wd1);
          R(c, 7, 1, 2, 4, C.wd2); R(c, 7, 8, 2, 4, C.wd2);
          P(c, 9, 6, C.yl3); if (locked) P(c, 9, 8, C.void);
        } else {
          R(c, 8, -3, 14, 3, C.wd3); R(c, 8, -3, 14, 1, C.wd4);
        }
        return;
      }
      if (o.orient === 'exit') {
        const W = o.w * 16;
        if (open || !locked) {
          R(c, 2, 0, W - 4, 16, '#050407');
          R(c, 3, 2, W - 6, 5, C.rd2); R(c, 3, 2, W - 6, 1, C.rd3);
          for (let i = 3; i < W - 3; i += 2) P(c, i, 7, C.bn1);
          G.dither(c, 2, 9, W - 4, 7, 'rgba(70,90,130,0.25)');
        } else {
          R(c, 0, 2, W, 12, C.wd2); R(c, 0, 2, W, 1, C.wd3); R(c, W / 2, 2, 1, 12, C.wd0);
          R(c, 1, 3, W / 2 - 2, 10, C.wd1); R(c, W / 2 + 1, 3, W / 2 - 2, 10, C.wd1);
          if (o.p.bolted && !o.st.unbolted) { R(c, W / 2 - 5, 7, 11, 2, C.st4); R(c, W / 2 - 5, 7, 11, 1, C.st6); }
          if (o.p.boarded && !o.st.unboarded) { R(c, -1, 4, W + 2, 3, C.wd4); R(c, -1, 9, W + 2, 3, C.wd4); }
        }
        return;
      }
      // Tür in Wandansicht
      R(c, 1, -3, 14, 19, o.p.ext ? '#1c1a22' : C.wd0);
      if (!open) {
        const col = o.p.ext ? C.wd2 : C.wd3;
        R(c, 2, -2, 12, 18, col); R(c, 2, -2, 12, 1, C.wd4);
        R(c, 4, 0, 8, 5, C.wd2); R(c, 4, 8, 8, 6, C.wd2);
        R(c, 4, 0, 8, 1, C.wd1); R(c, 4, 8, 8, 1, C.wd1);
        P(c, 11, 7, C.yl3);
        if (locked) { R(c, 10, 8, 3, 4, C.st4); P(c, 11, 10, C.void); }
        if (o.p.boarded && !o.st.unboarded) {
          R(c, 0, 0, 16, 3, C.wd4); R(c, 0, 0, 16, 1, C.wd5); R(c, 0, 7, 16, 3, C.wd5); R(c, 0, 12, 16, 3, C.wd4);
          P(c, 1, 1, C.st6); P(c, 14, 1, C.st6); P(c, 1, 8, C.st6); P(c, 14, 8, C.st6);
        }
        if (o.p.chain) { G.line(c, 2, 2, 14, 12, C.st5); G.line(c, 14, 2, 2, 12, C.st5); R(c, 6, 6, 4, 4, C.st6); }
      } else {
        R(c, 2, -2, 12, 18, '#050407');
        G.dither(c, 2, 10, 12, 6, 'rgba(60,50,40,0.35)');
        R(c, 2, -2, 2, 18, C.wd3);
      }
    },
  };
  T.bigdoor = {
    w: 2, solid: (o) => !o.st.open, opaque: (o) => !o.st.open, prompt: () => 'Öffnen',
    draw(c, o) {
      R(c, 0, -6, 32, 22, '#1d1b23'); R(c, 1, -7, 30, 2, '#46424f');
      R(c, 2, 16, 28, 2, C.st3);
      if (o.st.open) { R(c, 3, -4, 26, 20, '#050407'); return; }
      R(c, 3, -4, 13, 20, C.wd2); R(c, 16, -4, 13, 20, C.wd2);
      R(c, 3, -4, 26, 1, C.wd3); R(c, 15, -4, 2, 20, C.wd0);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { P(c, 6 + i * 4, -1 + j * 5, C.st5); P(c, 21 + i * 4, -1 + j * 5, C.st5); }
      R(c, 12, 5, 2, 3, C.yl2); R(c, 18, 5, 2, 3, C.yl2);
      if (o.p.chain) { G.line(c, 4, 0, 28, 12, C.st5); G.line(c, 28, 0, 4, 12, C.st5); R(c, 14, 4, 4, 5, C.st6); }
    },
  };
  T.gate = {
    w: 2, solid: (o) => !o.st.open, prompt: () => 'Tor',
    draw(c, o) {
      R(c, -2, -10, 3, 26, '#26252d'); R(c, 31, -10, 3, 26, '#26252d');
      R(c, -3, -12, 5, 3, '#3a3944'); R(c, 30, -12, 5, 3, '#3a3944');
      if (o.st.open) {
        for (let i = 0; i < 3; i++) R(c, 2 + i * 2, -6, 1, 20, '#1d1c23');
        for (let i = 0; i < 3; i++) R(c, 25 + i * 2, -6, 1, 20, '#1d1c23');
        return;
      }
      R(c, 0, -4, 32, 1, '#1b1a20'); R(c, 0, 4, 32, 1, '#1b1a20'); R(c, 0, 12, 32, 1, '#1b1a20');
      for (let i = 1; i < 32; i += 3) { R(c, i, -8, 1, 22, '#2b2a33'); P(c, i, -9, '#4a4955'); }
      R(c, 13, 2, 6, 6, '#1b1a20'); G.ring(c, 16, 5, 2, C.st5);
      if (o.p.locked && !o.st.unlocked) { R(c, 14, 7, 4, 4, C.st4); P(c, 16, 9, C.void); }
    },
  };

  // ---------- Treppen / Übergänge ----------
  T.stairs = {
    solid: false, touch: true,
    draw(c, o) {
      const W = o.w * 16, H = o.h * 16;
      const up = o.p.dir !== 'down';
      if (up) {
        R(c, 0, 0, W, H, C.st0);
        const n = Math.floor(H / 4);
        for (let i = 0; i < n; i++) {
          const k = i / n;
          const col = k < 0.3 ? C.wd1 : k < 0.6 ? C.wd2 : C.wd3;
          R(c, 3, i * 4, W - 6, 4, col); R(c, 3, i * 4 + 3, W - 6, 1, C.wd0);
          if (o.p.carpet) { R(c, W / 2 - 8, i * 4, 16, 3, k < 0.4 ? C.rd1 : C.rd2); }
        }
        R(c, 0, 0, 3, H, C.wd1); R(c, W - 3, 0, 3, H, C.wd1);
        R(c, 0, H - 4, 4, 6, C.wd3); R(c, W - 4, H - 4, 4, 6, C.wd3);
        P(c, 1, H - 5, C.wd5); P(c, W - 3, H - 5, C.wd5);
        G.dither(c, 0, 0, W, 6, '#050407'); R(c, 0, 0, W, 2, '#050407');
      } else {
        R(c, 0, 0, W, H, '#050407');
        const n = Math.floor(H / 4);
        const cols = [C.st3, C.st2, C.st1, C.st0, '#0c0a0f', '#08070a', '#050407', '#050407'];
        for (let i = 0; i < n; i++) {
          R(c, 2, i * 4, W - 4, 3, cols[Math.min(cols.length - 1, i)]);
        }
        R(c, 0, 0, 2, H, C.wd2); R(c, W - 2, 0, 2, H, C.wd2);
        R(c, 0, 0, W, 1, C.st4);
      }
    },
  };
  T.hatch = {
    solid: false, prompt: (o) => (o.st.open ? 'Hochklettern' : 'Untersuchen'),
    draw(c, o, t) {
      G.dither(c, 1, 1, 14, 14, 'rgba(0,0,0,0.5)');
      R(c, 2, 2, 12, 12, 'rgba(0,0,0,0.35)');
      if (o.st.open) {
        R(c, 3, -18, 2, 34, C.wd3); R(c, 11, -18, 2, 34, C.wd3);
        for (let j = -16; j < 16; j += 4) R(c, 3, j, 10, 1, C.wd4);
        R(c, 2, -20, 12, 3, '#050407');
      } else {
        const sw = Math.round(Math.sin(t * 1.3) * 1);
        R(c, 8 + sw, -14, 1, 18, C.bn1); R(c, 7 + sw, 4, 3, 2, C.wd4);
      }
    },
  };
  T.ladder = {
    solid: false, touch: true,
    draw(c) {
      R(c, 1, 1, 14, 14, '#050407');
      R(c, 3, 0, 2, 16, C.wd3); R(c, 11, 0, 2, 16, C.wd3);
      for (let j = 2; j < 16; j += 4) R(c, 3, j, 10, 1, C.wd4);
      R(c, 0, 0, 16, 1, C.wd2);
    },
  };
  T.warp = { solid: false, touch: true, invisible: true };
  T.trigger = { solid: false, invisible: true, trigger: true };
  T.barrier = { solid: true, invisible: true };

  // ---------- Möbel ----------
  T.bed = {
    h: 2, hide: 'Unters Bett kriechen', hit: [0, -2, 16, 34],
    cache: [-1, -7, 18, 40], ckey: (o) => (o.p.kind || '') + (o.st.made ? 1 : 0),
    draw(c, o) {
      const k = o.p.kind;
      const frame = k === 'iron' ? C.st3 : C.wd2, frameHi = k === 'iron' ? C.st5 : C.wd3;
      const blanket = k === 'child' ? C.bl3 : k === 'iron' ? C.bn1 : k === 'grand' ? C.rd2 : C.gr3;
      const bd = k === 'child' ? C.bl2 : k === 'iron' ? C.bn0 : k === 'grand' ? C.rd1 : C.gr2;
      R(c, 0, -5, 16, 7, frame); R(c, 0, -6, 16, 1, frameHi); R(c, 0, -6, 2, 9, frameHi); R(c, 14, -6, 2, 9, frameHi);
      if (k === 'iron') { for (let i = 3; i < 14; i += 3) R(c, i, -4, 1, 5, C.st2); }
      R(c, 1, 2, 14, 28, C.bn1);
      R(c, 2, 3, 12, 6, C.bn3); R(c, 2, 8, 12, 1, C.bn1); R(c, 3, 4, 3, 1, C.bn4);
      R(c, 1, 9, 14, 21, blanket); R(c, 1, 9, 14, 2, C.bn2);
      for (let j = 14; j < 30; j += 5) R(c, 2 + (j % 3), j, 10, 1, bd);
      R(c, 14, 10, 1, 20, bd);
      if (k === 'child') { R(c, 9, 4, 4, 4, C.wd4); P(c, 9, 4, C.wd5); P(c, 12, 4, C.wd5); P(c, 10, 6, C.ink); P(c, 11, 6, C.ink); }
      if (k === 'blood') { G.disc(c, 9, 18, 3, 2, C.rd2); P(c, 6, 21, C.rd2); }
      R(c, 0, 29, 16, 4, frame); R(c, 0, 29, 16, 1, frameHi);
      R(c, 0, 33, 16, 1, 'rgba(0,0,0,0.6)');
    },
  };
  T.wardrobe = {
    hide: 'Im Schrank verstecken', hit: [0, 4, 16, 12],
    cache: [-2, -15, 20, 32], ckey: (o) => (o.p.kind || '') + (o.p.ajar ? 'a' : ''),
    draw(c, o) {
      const dark = o.p.kind === 'white' ? C.bn0 : C.wd1, mid = o.p.kind === 'white' ? C.bn1 : C.wd2, hi = o.p.kind === 'white' ? C.bn2 : C.wd3;
      R(c, 0, -12, 16, 28, dark);
      R(c, -1, -14, 18, 3, hi); R(c, -1, -14, 18, 1, o.p.kind === 'white' ? C.bn3 : C.wd4);
      R(c, 1, -10, 7, 24, mid); R(c, 8, -10, 7, 24, mid);
      R(c, 2, -8, 5, 9, dark); R(c, 9, -8, 5, 9, dark); R(c, 2, 3, 5, 9, dark); R(c, 9, 3, 5, 9, dark);
      R(c, 2, -8, 5, 1, hi); R(c, 9, -8, 5, 1, hi);
      R(c, 8, -10, 1, 24, C.wd0);
      P(c, 7, 1, C.yl3); P(c, 9, 1, C.yl3);
      if (o.p.ajar) { R(c, 8, -10, 2, 24, '#030204'); P(c, 9, -3, C.bn4); }
      R(c, 0, 14, 2, 2, C.wd0); R(c, 14, 14, 2, 2, C.wd0);
    },
  };
  T.bigwardrobe = {
    w: 2, hit: [0, 2, 32, 14],
    draw(c, o, t) {
      R(c, 0, -20, 32, 36, C.wd1);
      R(c, -1, -23, 34, 4, C.wd3); R(c, -1, -23, 34, 1, C.wd4); R(c, 12, -26, 8, 3, C.wd3);
      R(c, 2, -17, 13, 31, C.wd2); R(c, 17, -17, 13, 31, C.wd2);
      for (let j = 0; j < 3; j++) { R(c, 4, -15 + j * 10, 9, 8, C.wd1); R(c, 19, -15 + j * 10, 9, 8, C.wd1); }
      R(c, 15, -17, 2, 31, '#020103');
      const blink = (t % 7) < 6.85;
      if (blink && !o.st.empty) { P(c, 15, -6, C.bn4); P(c, 16, -6, C.rd4); }
      R(c, 13, 0, 1, 3, C.yl2); R(c, 18, 0, 1, 3, C.yl2);
      G.line(c, 3, 5, 9, 12, C.wd0); G.line(c, 20, -10, 27, -4, C.wd0); // Kratzer
    },
  };
  T.shelf = {
    hit: [0, 4, 16, 12], cache: [-1, -13, 18, 30], ckey: (o) => Math.floor(vr(o) * 8) + (o.p.kind || ''),
    draw(c, o) {
      R(c, 0, -10, 16, 26, C.wd1);
      R(c, -1, -12, 18, 2, C.wd3); R(c, -1, -12, 18, 1, C.wd4);
      R(c, 1, -9, 14, 23, '#0d0907');
      for (let s = 0; s < 3; s++) {
        const by = -2 + s * 8;
        R(c, 1, by, 14, 2, C.wd2); R(c, 1, by, 14, 1, C.wd3);
        let x = 2;
        let i = 0;
        while (x < 14) {
          const r1 = U.hash(o.x * 31 + s, o.y * 17 + i, 5);
          const bw = 1 + Math.floor(r1 * 2.5);
          const bh = 4 + Math.floor(U.hash(o.x, o.y + s * 9 + i, 6) * 3);
          if (r1 < 0.08 && o.p.kind !== 'full') { x += 2; i++; continue; }
          if (x + bw > 14) break;
          if (o.p.kind === 'jars') {
            R(c, x, by - 4, 2, 4, [C.gr4, C.rd3, C.yl2, C.or3][i % 4]); P(c, x, by - 5, C.st5); x += 3;
          } else {
            const col = BOOKS[Math.floor(U.hash(o.x, o.y * 3 + i + s * 40, 7) * BOOKS.length)];
            R(c, x, by - bh, bw, bh, col);
            P(c, x, by - bh + 1, 'rgba(255,240,200,0.18)');
            x += bw;
          }
          i++;
        }
        if (U.hash(o.x, o.y, 40 + s) < 0.12) { R(c, 10, by - 3, 3, 3, C.bn2); P(c, 10, by - 2, C.ink); P(c, 12, by - 2, C.ink); }
      }
      G.line(c, 1, -9, 5, -9, 'rgba(200,200,210,0.25)'); G.line(c, 1, -9, 1, -5, 'rgba(200,200,210,0.25)'); G.line(c, 1, -9, 4, -6, 'rgba(200,200,210,0.2)');
      R(c, 0, 15, 16, 1, '#000');
    },
  };
  T.cabinet = {
    hit: [0, 2, 16, 14], cache: [-1, -10, 18, 27], ckey: (o) => Math.floor(vr(o) * 5) + (o.p.kind || ''),
    draw(c, o) {
      const small = o.p.kind === 'night';
      const x0 = small ? 3 : 0, w = small ? 10 : 16;
      R(c, x0, -2, w, 16, C.wd2); R(c, x0, -3, w, 2, C.wd3); R(c, x0, -3, w, 1, C.wd4);
      const nd = small ? 2 : 3;
      for (let i = 0; i < nd; i++) {
        R(c, x0 + 1, 0 + i * 5, w - 2, 4, C.wd3); R(c, x0 + 1, 3 + i * 5, w - 2, 1, C.wd1);
        P(c, x0 + w / 2, 1 + i * 5, C.yl3);
      }
      R(c, x0, 14, w, 1, '#000');
      const it = Math.floor(vr(o) * 5);
      if (it === 0) { R(c, x0 + 3, -9, 2, 6, C.bn3); P(c, x0 + 3, -10, C.or4); }
      else if (it === 1) { R(c, x0 + 5, -8, 5, 6, C.yl1); R(c, x0 + 6, -7, 3, 4, C.bn2); P(c, x0 + 7, -6, C.sk2); }
      else if (it === 2) { R(c, x0 + 4, -7, 4, 5, C.bl3); R(c, x0 + 5, -10, 2, 3, C.gr4); }
      else if (it === 3) { R(c, x0 + 2, -5, 8, 2, C.bn1); }
    },
  };
  T.table = {
    hit: [0, 0, 16, 16], join: 'table', cache: [0, -6, 16, 23], ckey: (o) => o.jm + '|' + (o.p.items || '') + Math.floor(vr(o) * 6),
    draw(c, o) {
      const L = o.jl, Rr = o.jr, Up = o.ju, Dn = o.jd;
      R(c, 0, 0, 16, 13, C.wd3);
      for (let j = 2; j < 13; j += 4) R(c, 0, j, 16, 1, C.wd2);
      if (!Up) R(c, 0, 0, 16, 1, C.wd5);
      if (!L) R(c, 0, 0, 1, 13, C.wd4);
      if (!Rr) R(c, 15, 0, 1, 13, C.wd1);
      if (!Dn) { R(c, 0, 13, 16, 3, C.wd1); if (!L) R(c, 1, 15, 2, 2, C.wd0); if (!Rr) R(c, 13, 15, 2, 2, C.wd0); }
      if (o.p.cloth) { R(c, 0, 2, 16, 9, C.bn1); R(c, 0, 10, 16, 1, C.bn0); }
      const items = o.p.items || 'house';
      const r = vr(o);
      if (items === 'feast') {
        G.disc(c, 8, 6, 4, 3, C.bn2); G.disc(c, 8, 6, 2, 1, r < 0.5 ? C.rd2 : C.wd4);
        P(c, 2, 4, C.st6); R(c, 2, 5, 1, 4, C.st5); P(c, 14, 4, C.st6); R(c, 14, 5, 1, 4, C.st5);
        if (r < 0.3) { R(c, 11, 1, 2, 4, C.gr3); P(c, 11, 0, C.gr4); }
        if (r > 0.75) { R(c, 3, 9, 3, 2, C.gr2); P(c, 4, 9, C.gr3); }
      } else if (items === 'kitchen') {
        if (r < 0.4) { R(c, 3, 3, 6, 4, C.st3); R(c, 4, 3, 4, 1, C.st5); }
        if (r > 0.5) { R(c, 9, 5, 5, 1, C.st6); R(c, 9, 5, 2, 1, C.wd1); }
        if (r > 0.7) G.disc(c, 6, 8, 2, 2, C.rd2);
      } else if (items === 'pots') {
        R(c, 2, 3, 4, 4, C.or2); R(c, 2, 2, 4, 1, C.or3); P(c, 3, 1, C.gr4); P(c, 4, 0, C.gr5);
        R(c, 9, 5, 5, 4, C.or2); R(c, 9, 4, 5, 1, C.or3);
        if (r < 0.5) { R(c, 7, 9, 6, 1, C.st5); }
      } else if (items === 'papers') {
        R(c, 2, 2, 6, 7, C.bn2); R(c, 3, 3, 4, 1, C.st4); R(c, 3, 5, 4, 1, C.st4);
        R(c, 8, 4, 6, 6, C.bn1); P(c, 12, 2, C.ink); R(c, 12, 3, 1, 3, C.wd0);
      } else if (items === 'house') {
        if (r < 0.35) { R(c, 6, 4, 2, 5, C.bn3); R(c, 5, 9, 4, 1, C.yl2); }
        else if (r < 0.55) { G.disc(c, 8, 6, 3, 2, C.bn1); }
        else if (r < 0.7) { R(c, 4, 5, 7, 4, C.rd1); R(c, 4, 5, 7, 1, C.rd2); }
      }
    },
  };
  T.chair = {
    hit: [4, 6, 8, 8], cache: [0, -6, 16, 22], ckey: (o) => o.p.face || 'down',
    draw(c, o) {
      const face = o.p.face || 'down';
      if (face === 'down') {
        R(c, 4, -4, 8, 10, C.wd2); R(c, 4, -4, 8, 1, C.wd4); R(c, 5, -3, 6, 6, C.wd1);
        R(c, 3, 5, 10, 6, C.wd3); R(c, 4, 6, 8, 4, C.rd2);
        R(c, 3, 11, 2, 3, C.wd1); R(c, 11, 11, 2, 3, C.wd1);
      } else if (face === 'up') {
        R(c, 3, 3, 10, 7, C.wd3); R(c, 4, 4, 8, 5, C.rd2);
        R(c, 4, 9, 8, 6, C.wd2); R(c, 4, 9, 8, 1, C.wd4);
        R(c, 3, 14, 2, 2, C.wd1); R(c, 11, 14, 2, 2, C.wd1);
      } else {
        const l = face === 'left';
        R(c, 3, 4, 10, 7, C.wd3); R(c, 4, 5, 8, 5, C.rd2);
        R(c, l ? 11 : 3, -3, 2, 14, C.wd2); R(c, l ? 11 : 3, -3, 2, 1, C.wd4);
        R(c, 3, 11, 2, 3, C.wd1); R(c, 11, 11, 2, 3, C.wd1);
      }
    },
  };
  T.rockingchair = {
    hit: [3, 4, 10, 10],
    draw(c, o, t) {
      const rk = o.st.rock ? Math.round(Math.sin(t * 3)) : 0;
      R(c, 4, -6 + rk, 8, 11, C.wd2); R(c, 4, -6 + rk, 8, 1, C.wd4);
      for (let i = 5; i < 12; i += 2) R(c, i, -5 + rk, 1, 9, C.wd1);
      R(c, 3, 5, 10, 6, C.wd3);
      R(c, 1, 13 - rk, 14, 1, C.wd2); R(c, 0, 12, 2, 1, C.wd2); R(c, 14, 12, 2, 1, C.wd2);
      R(c, 4, 4, 8, 3, C.pu2);
    },
  };
  T.counter = {
    hit: [0, 0, 16, 16], join: 'counter', cache: [0, -8, 16, 25], ckey: (o) => o.jm + Math.floor(vr(o) * 6),
    draw(c, o) {
      R(c, 0, 0, 16, 9, '#4a4640'); R(c, 0, 0, 16, 1, '#6a655c');
      G.speck(c, 0, 1, 16, 8, '#3a3632', 6, o.x * 3 + o.y);
      R(c, 0, 9, 16, 7, C.wd2); R(c, 0, 9, 16, 1, C.wd1);
      if (!o.jl) R(c, 0, 0, 1, 16, '#2a2622');
      R(c, 2, 11, 5, 4, C.wd3); R(c, 9, 11, 5, 4, C.wd3); P(c, 6, 12, C.yl2); P(c, 9, 12, C.yl2);
      const r = vr(o);
      if (r < 0.25) { R(c, 3, -4, 4, 5, C.gr2); R(c, 3, -5, 4, 1, C.st5); R(c, 4, -3, 2, 2, C.gr4); }
      else if (r < 0.45) { R(c, 8, -2, 6, 3, C.st3); R(c, 8, -3, 6, 1, C.st5); R(c, 14, -2, 2, 1, C.st2); }
      else if (r < 0.6) { R(c, 4, 2, 6, 1, C.st6); R(c, 4, 2, 2, 1, C.wd1); }
      else if (r < 0.7) { R(c, 2, -6, 2, 7, C.yl1); R(c, 6, -5, 2, 6, C.rd2); R(c, 10, -7, 2, 8, C.gr3); }
    },
  };

  // ---------- Licht ----------
  T.candle = {
    hit: [5, 9, 6, 6], light: { r: 64, c: [255, 170, 80], i: 0.9, flicker: 0.12, y: -2 },
    lit: (o) => o.st.lit !== false && o.p.lit !== false || o.st.lit === true,
    prompt: (o) => (OBJ.isLit(o) ? 'Untersuchen' : 'Anzünden'),
    draw(c, o, t) {
      const lit = OBJ.isLit(o);
      R(c, 5, 13, 6, 2, C.yl1); R(c, 6, 12, 4, 1, C.yl2);
      R(c, 7, 2, 2, 10, C.yl2); R(c, 7, 2, 1, 10, C.yl3);
      R(c, 3, 2, 10, 1, C.yl2); R(c, 3, 0, 1, 2, C.yl2); R(c, 12, 0, 1, 2, C.yl2);
      R(c, 3, -3, 2, 4, C.bn3); R(c, 7, -4, 2, 6, C.bn3); R(c, 11, -3, 2, 4, C.bn3);
      P(c, 3, 1, C.bn2); P(c, 8, 1, C.bn2);
      if (lit) { flame(c, 3, -3, t, 1); flame(c, 8, -4, t, 2); flame(c, 12, -3, t, 3); }
      else { P(c, 3, -4, C.st2); P(c, 8, -5, C.st2); P(c, 12, -4, C.st2); }
    },
  };
  T.candles = { // Kerzen auf dem Boden
    solid: false, light: { r: 46, c: [255, 160, 70], i: 0.75, flicker: 0.15, y: 0 },
    prompt: (o) => (OBJ.isLit(o) ? 'Untersuchen' : 'Anzünden'),
    draw(c, o, t) {
      const lit = OBJ.isLit(o);
      const pos = [[3, 9, 5], [7, 11, 7], [11, 8, 4], [9, 13, 3]];
      pos.forEach(([x, y, h], i) => {
        R(c, x, y - h, 2, h, C.bn3); P(c, x, y - h, C.bn4); R(c, x - 1, y, 4, 1, C.bn1);
        if (lit) flame(c, x, y - h, t, i); else P(c, x, y - h - 1, C.st2);
      });
    },
  };
  T.lamp = {
    hit: [5, 10, 6, 5], light: { r: 76, c: [255, 210, 140], i: 0.9, flicker: 0.04, y: -8, power: true },
    draw(c, o, t) {
      const on = OBJ.isLit(o);
      R(c, 5, 13, 6, 2, C.st2); R(c, 7, -4, 2, 17, C.st3); R(c, 7, -4, 1, 17, C.st4);
      R(c, 3, -11, 10, 7, on ? C.yl3 : C.yl0); R(c, 4, -12, 8, 1, on ? C.yl2 : '#2a210e');
      R(c, 3, -5, 10, 1, on ? C.yl4 : C.yl1);
      if (on) { G.dither(c, 4, -10, 8, 4, C.yl4); }
    },
  };
  T.bulb = {
    solid: false, flat: true, light: { r: 70, c: [255, 220, 170], i: 0.85, flicker: 0.05, y: 0, power: true },
    draw(c, o, t) {
      const on = OBJ.isLit(o);
      R(c, 7, -12, 1, 12, C.st2);
      R(c, 6, 0, 3, 1, C.st3);
      R(c, 6, 1, 3, 3, on ? C.yl5 : C.bn0); if (on) G.disc(c, 7, 2, 4, 3, 'rgba(255,230,160,0.18)');
    },
  };
  T.lantern = {
    hit: [6, 10, 4, 5], light: { r: 80, c: [255, 190, 110], i: 0.85, flicker: 0.1, y: -14 },
    draw(c, o, t) {
      const on = OBJ.isLit(o);
      R(c, 5, 13, 6, 2, '#1b1a20'); R(c, 7, -12, 2, 25, '#1d1c23'); R(c, 7, -12, 1, 25, '#2e2d36');
      R(c, 4, -20, 8, 1, '#2e2d36'); R(c, 5, -21, 6, 1, '#2e2d36');
      R(c, 4, -19, 8, 7, '#16151b');
      R(c, 5, -18, 6, 5, on ? (Math.sin(t * 9) > 0.92 ? C.yl3 : C.yl4) : '#151a22');
      if (on) R(c, 7, -17, 2, 3, C.yl5);
      R(c, 4, -12, 8, 1, '#2e2d36');
    },
  };
  T.guestbook = {
    hit: [2, 6, 12, 9], save: true, prompt: () => 'Gästebuch',
    light: { r: 52, c: [255, 175, 90], i: 0.8, flicker: 0.12, y: -6 },
    draw(c, o, t) {
      R(c, 6, 4, 4, 10, C.wd2); R(c, 3, 13, 10, 2, C.wd1);
      R(c, 1, -3, 14, 8, C.wd3); R(c, 1, -3, 14, 1, C.wd4);
      R(c, 2, -2, 6, 5, C.bn3); R(c, 8, -2, 5, 5, C.bn2);
      for (let j = -1; j < 3; j += 2) { R(c, 3, j, 4, 1, C.st4); R(c, 9, j, 3, 1, C.st4); }
      R(c, 7, -2, 1, 5, C.bn0);
      R(c, 13, -7, 2, 4, C.bn3); flame(c, 13, -7, t, 5);
      R(c, 2, 3, 1, 4, C.rd3); // Lesebändchen
    },
  };
  T.clock = {
    hit: [2, 6, 12, 10],
    draw(c, o, t) {
      R(c, 2, -18, 12, 34, C.wd1); R(c, 1, -20, 14, 3, C.wd3); R(c, 6, -22, 4, 2, C.wd3);
      R(c, 3, -17, 10, 32, C.wd2);
      G.disc(c, 8, -11, 4, 4, C.bn2); G.ring(c, 8, -11, 4, C.yl2);
      let hh, mm;
      if (o.p.stopped) { hh = 3; mm = 17; } else { const d = new Date(); hh = d.getHours() % 12; mm = d.getMinutes(); }
      const am = (mm / 60) * TAU - Math.PI / 2, ah = ((hh + mm / 60) / 12) * TAU - Math.PI / 2;
      G.line(c, 8, -11, 8 + Math.round(Math.cos(am) * 3), -11 + Math.round(Math.sin(am) * 3), C.ink);
      G.line(c, 8, -11, 8 + Math.round(Math.cos(ah) * 2), -11 + Math.round(Math.sin(ah) * 2), C.rd2);
      R(c, 5, -4, 6, 13, '#0b0806'); R(c, 5, -4, 6, 1, C.yl1);
      const sw = o.p.stopped ? 0 : Math.round(Math.sin(t * Math.PI) * 2);
      R(c, 8 + Math.round(sw / 2), -3, 1, 7, C.yl2); G.disc(c, 8 + sw, 5, 1, 1, C.yl3);
      R(c, 2, 15, 12, 1, '#000');
    },
  };
  T.fireplace = {
    w: 2, hit: [0, 2, 32, 14], light: { r: 90, c: [255, 120, 50], i: 0.95, flicker: 0.18, y: 0 },
    draw(c, o, t) {
      const lit = OBJ.isLit(o);
      R(c, 0, -8, 32, 24, C.st2);
      for (let j = -8; j < 16; j += 4) for (let i = (j / 4) % 2 ? 0 : 4; i < 32; i += 8) R(c, i, j, 7, 3, C.st3);
      R(c, -1, -10, 34, 3, C.st4); R(c, -1, -10, 34, 1, C.st5);
      R(c, 6, -3, 20, 18, '#0a0605'); R(c, 7, -4, 18, 1, '#0a0605');
      R(c, 9, 11, 14, 2, C.wd2); R(c, 11, 10, 10, 1, C.wd3);
      if (lit) {
        for (let i = 0; i < 12; i++) {
          const fx = 9 + i, h = 3 + Math.floor((Math.sin(t * 11 + i * 1.7) + Math.sin(t * 7 + i)) * 2 + 4);
          R(c, fx, 10 - h, 1, h, i % 3 ? C.or3 : C.or4);
          if (h > 6) P(c, fx, 10 - h, C.yl4);
        }
        R(c, 12, 7, 8, 3, C.yl4);
        for (let i = 0; i < 3; i++) P(c, 10 + ((t * 20 + i * 7) % 12), 13, C.or4);
      } else {
        G.speck(c, 9, 9, 14, 4, C.st3, 6, 9);
        P(c, 14, 10, C.rd2); P(c, 17, 11, C.rd3);
      }
      R(c, 3, -15, 2, 5, C.bn3); R(c, 27, -15, 2, 5, C.bn3);
      R(c, 13, -16, 6, 6, C.yl1); R(c, 14, -15, 4, 4, C.bn1); P(c, 15, -14, C.sk2);
    },
  };
  T.crate = {
    hit: [1, 2, 14, 14], cache: [0, -3, 16, 20], ckey: (o) => (o.st.opened ? 'o' : '') + (o.p.big ? 'b' : ''),
    draw(c, o) {
      R(c, 1, -2, 14, 5, C.wd4); R(c, 1, 3, 14, 12, C.wd3);
      for (let j = 6; j < 15; j += 4) R(c, 1, j, 14, 1, C.wd2);
      G.line(c, 2, 4, 13, 14, C.wd2); R(c, 1, -2, 14, 1, C.wd5);
      R(c, 1, 3, 14, 1, C.wd1); P(c, 2, 4, C.st5); P(c, 13, 4, C.st5); P(c, 2, 13, C.st5); P(c, 13, 13, C.st5);
      if (o.st.opened) { R(c, 2, -1, 12, 4, '#0b0806'); R(c, -2, 8, 6, 2, C.wd4); }
      R(c, 1, 15, 14, 1, 'rgba(0,0,0,0.6)');
    },
  };
  T.barrel = {
    hit: [2, 3, 12, 12],
    draw(c) {
      R(c, 3, -2, 10, 17, C.wd3); R(c, 2, 0, 12, 13, C.wd3);
      R(c, 3, -2, 10, 3, C.wd4); G.disc(c, 8, -1, 4, 1, C.wd2);
      R(c, 2, 2, 12, 1, C.st3); R(c, 2, 10, 12, 1, C.st3);
      R(c, 5, 0, 1, 14, C.wd2); R(c, 10, 0, 1, 14, C.wd2); R(c, 3, 0, 1, 14, C.wd4);
      R(c, 3, 15, 10, 1, 'rgba(0,0,0,0.6)');
    },
  };
  T.vase = {
    hit: [4, 8, 8, 7],
    draw(c, o) {
      const r = vr(o);
      R(c, 5, 7, 6, 8, C.or2); R(c, 4, 7, 8, 1, C.or3); R(c, 5, 8, 1, 6, C.or3);
      if (r < 0.5) { // vertrocknet
        G.line(c, 8, 7, 5, -2, C.wd3); G.line(c, 8, 7, 11, -1, C.wd3); G.line(c, 8, 7, 8, -4, C.wd4);
        P(c, 5, -2, C.wd4); P(c, 11, -1, C.wd2);
      } else {
        G.disc(c, 8, 2, 5, 4, C.gr2); G.disc(c, 7, 1, 3, 2, C.gr3); P(c, 10, 0, C.gr4);
      }
    },
  };
  T.grave = {
    hit: [2, 4, 12, 10], cache: [0, -9, 16, 26], ckey: (o) => (o.p.kind || '') + Math.floor(vr(o) * 4),
    draw(c, o) {
      const r = vr(o);
      if (o.p.kind === 'cross') {
        R(c, 7, -7, 3, 18, C.st3); R(c, 3, -3, 11, 3, C.st3); R(c, 7, -7, 1, 18, C.st4); R(c, 3, -3, 11, 1, C.st4);
      } else {
        const tilt = r < 0.3 ? 1 : 0;
        R(c, 3 + tilt, -4, 10, 14, C.st3); R(c, 4 + tilt, -6, 8, 2, C.st3); R(c, 5 + tilt, -7, 6, 1, C.st3);
        R(c, 3 + tilt, -4, 1, 14, C.st4); R(c, 4 + tilt, -6, 8, 1, C.st4);
        R(c, 5 + tilt, -2, 6, 1, C.st1); R(c, 5 + tilt, 1, 6, 1, C.st1); R(c, 6 + tilt, 3, 4, 1, C.st1);
        if (r > 0.5) G.speck(c, 3, 0, 10, 10, C.gr3, 7, o.x + o.y);
        if (r > 0.8) G.line(c, 6, -5, 9, 4, C.st1);
      }
      R(c, 2, 10, 13, 4, '#2a2018'); R(c, 3, 10, 11, 1, '#3a2c20');
      if (r < 0.4) { P(c, 4, 11, C.rd3); P(c, 5, 10, C.gr4); }
    },
  };
  T.statue = {
    hit: [2, 6, 12, 10], cache: [-1, -24, 18, 41], ckey: (o) => (o.p.kind || ''),
    draw(c, o) {
      R(c, 2, 4, 12, 12, C.st3); R(c, 1, 3, 14, 2, C.st4); R(c, 2, 15, 12, 1, '#000');
      if (o.p.kind === 'child') {
        R(c, 5, -8, 6, 12, C.st4); G.disc(c, 8, -11, 3, 3, C.st4); R(c, 5, -8, 1, 12, C.st5);
        P(c, 7, -11, C.ink); P(c, 9, -11, C.ink); R(c, 3, -6, 2, 6, C.st4); R(c, 11, -6, 2, 6, C.st4);
        return;
      }
      R(c, 5, -12, 6, 16, C.st4); R(c, 4, -2, 8, 6, C.st4); R(c, 5, -12, 1, 16, C.st5);
      G.disc(c, 8, -15, 3, 3, C.st4); P(c, 7, -15, C.ink); P(c, 9, -15, C.ink);
      R(c, 7, -14, 1, 4, 'rgba(10,10,15,0.6)');
      R(c, 0, -14, 4, 12, C.st3); R(c, 12, -14, 4, 12, C.st3); R(c, 0, -14, 1, 12, C.st4); R(c, 15, -14, 1, 12, C.st2);
      R(c, -1, -16, 3, 3, C.st3); R(c, 14, -16, 3, 3, C.st3);
      G.line(c, 5, -6, 10, 2, C.st2);
      R(c, 6, -9, 4, 2, C.st5);
    },
  };
  T.stove = {
    hit: [0, 2, 16, 14],
    draw(c, o, t) {
      R(c, 11, -18, 3, 16, C.st2); R(c, 11, -18, 1, 16, C.st3);
      R(c, 0, -2, 16, 17, '#1d1b20'); R(c, 0, -3, 16, 2, '#35323a');
      G.ring(c, 4, 1, 2, C.st3); G.ring(c, 11, 1, 2, C.st3);
      R(c, 2, 6, 12, 7, '#121014'); R(c, 3, 7, 10, 5, '#0a090c'); R(c, 5, 9, 6, 1, C.st3);
      R(c, 2, -6, 5, 4, C.st3); R(c, 2, -7, 5, 1, C.st5);
      R(c, 0, 15, 16, 1, '#000');
    },
  };
  T.bathtub = {
    w: 2, hit: [0, 1, 32, 14],
    draw(c, o, t) {
      R(c, 1, 0, 30, 14, C.bn1); R(c, 2, -1, 28, 1, C.bn3); R(c, 1, 0, 1, 14, C.bn2);
      R(c, 3, 2, 26, 9, '#1d1310');
      const ph = Math.sin(t * 0.7);
      R(c, 6 + Math.round(ph * 3), 4, 8, 1, 'rgba(120,40,40,0.35)');
      R(c, 4, 3, 24, 1, '#2a1a15');
      R(c, 27, -4, 2, 5, C.st5); R(c, 25, -4, 4, 1, C.st6);
      R(c, 3, 14, 3, 2, C.yl2); R(c, 26, 14, 3, 2, C.yl2);
      G.speck(c, 2, 0, 28, 13, '#6d6656', 12, 4);
    },
  };
  T.toilet = {
    hit: [3, 2, 10, 12],
    draw(c) {
      R(c, 3, -5, 10, 7, C.bn2); R(c, 3, -5, 10, 1, C.bn3);
      G.disc(c, 8, 7, 5, 5, C.bn2); G.disc(c, 8, 7, 3, 3, '#2a2420'); R(c, 6, 13, 4, 2, C.bn1);
      P(c, 12, -3, C.st5);
    },
  };
  T.sink = {
    hit: [2, 2, 12, 12],
    draw(c) {
      R(c, 6, 4, 4, 11, C.bn1); R(c, 6, 4, 1, 11, C.bn2);
      R(c, 1, -2, 14, 7, C.bn2); R(c, 1, -2, 14, 1, C.bn3); R(c, 3, -1, 10, 4, '#3a3632');
      R(c, 7, -5, 2, 4, C.st5); P(c, 8, 1, C.rd3); P(c, 8, 2, C.rd2);
    },
  };
  T.pew = {
    hit: [0, 2, 16, 12], join: 'pew', cache: [0, -6, 16, 23], ckey: (o) => o.jm,
    draw(c, o) {
      R(c, 0, -4, 16, 6, C.wd2); R(c, 0, -4, 16, 1, C.wd4);
      R(c, 0, 4, 16, 6, C.wd3); R(c, 0, 4, 16, 1, C.wd4);
      R(c, 0, 10, 16, 1, C.wd1);
      if (!o.jl) { R(c, 0, -6, 2, 18, C.wd1); R(c, 0, -6, 2, 1, C.wd4); }
      if (!o.jr) { R(c, 14, -6, 2, 18, C.wd1); R(c, 14, -6, 2, 1, C.wd4); }
      R(c, 0, 13, 16, 1, 'rgba(0,0,0,0.5)');
    },
  };
  T.winerack = {
    hit: [0, 4, 16, 12], join: 'winerack', cache: [0, -10, 16, 27], ckey: (o) => o.jm + Math.floor(vr(o) * 4),
    draw(c, o) {
      R(c, 0, -8, 16, 24, C.wd1); R(c, 0, -9, 16, 1, C.wd3);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) {
        const has = U.hash(o.x * 4 + i, o.y * 5 + j, 2) > 0.2;
        const bx = 1 + i * 4, by = -7 + j * 4;
        R(c, bx, by, 3, 3, '#0a0706');
        if (has) { G.disc(c, bx + 1, by + 1, 1, 1, U.hash(o.x + i, o.y + j, 3) < 0.6 ? '#1c2a1a' : '#3a1218'); P(c, bx + 1, by + 1, '#5a6a50'); }
      }
      if (!o.jl) R(c, 0, -8, 1, 24, C.wd3);
      R(c, 0, 15, 16, 1, '#000');
    },
  };
  T.pantry = {
    hit: [0, 4, 16, 12], join: 'pantry', cache: [0, -11, 16, 28], ckey: (o) => o.jm + Math.floor(vr(o) * 4),
    draw(c, o) {
      R(c, 0, -9, 16, 25, C.wd1); R(c, 0, -10, 16, 1, C.wd3);
      for (let s = 0; s < 3; s++) {
        const by = -2 + s * 7;
        R(c, 0, by, 16, 1, C.wd3);
        for (let i = 0; i < 4; i++) {
          if (U.hash(o.x * 4 + i, o.y + s, 8) < 0.25) continue;
          const col = [C.gr4, C.rd3, C.yl2, C.or3, '#4a2a3a', C.bn1][Math.floor(U.hash(o.x + i, o.y * 3 + s, 9) * 6)];
          R(c, 1 + i * 4, by - 5, 3, 5, col); R(c, 1 + i * 4, by - 6, 3, 1, C.st5); P(c, 1 + i * 4, by - 4, 'rgba(255,255,255,0.3)');
        }
      }
      R(c, 0, 15, 16, 1, '#000');
    },
  };
  T.sofa = {
    hit: [0, 0, 16, 14], join: 'sofa', cache: [0, -8, 16, 24], ckey: (o) => o.jm,
    draw(c, o) {
      R(c, 0, -6, 16, 9, C.rd2); R(c, 0, -6, 16, 1, C.rd3);
      for (let i = 3; i < 16; i += 5) P(c, i, -2, C.rd1);
      R(c, 0, 3, 16, 9, C.rd3); R(c, 0, 3, 16, 1, C.rd4); R(c, 0, 11, 16, 2, C.rd1);
      if (!o.jl) { R(c, 0, -4, 3, 15, C.rd2); R(c, 0, -4, 3, 1, C.rd4); }
      if (!o.jr) { R(c, 13, -4, 3, 15, C.rd1); R(c, 13, -4, 3, 1, C.rd3); }
      R(c, 1, 13, 2, 2, C.wd1); R(c, 13, 13, 2, 2, C.wd1);
    },
  };
  T.railing = {
    join: 'railing', hit: [0, 4, 16, 8],
    draw(c, o) {
      const horiz = o.jl || o.jr || !(o.ju || o.jd);
      if (horiz) {
        R(c, 0, 0, 16, 2, C.wd3); R(c, 0, 0, 16, 1, C.wd5);
        for (let i = 1; i < 16; i += 4) R(c, i, 2, 2, 9, C.wd2);
        R(c, 0, 11, 16, 1, C.wd1);
      } else {
        R(c, 6, 0, 4, 16, C.wd3); R(c, 6, 0, 1, 16, C.wd5);
        for (let j = 2; j < 16; j += 4) R(c, 5, j, 6, 1, C.wd2);
      }
    },
  };

  // ---------- Kleinkram ----------
  T.blood = {
    solid: false, flat: true,
    draw(c, o) {
      const n = 3 + Math.floor(vr(o) * 4);
      for (let i = 0; i < n; i++) {
        const x = 3 + U.hash(o.x, o.y, i * 2) * 10, y = 3 + U.hash(o.x, o.y, i * 2 + 1) * 10;
        G.disc(c, x, y, 1 + (i === 0 ? 3 : U.hash(o.x, i, 4) * 2), 1 + (i === 0 ? 2 : 1), i === 0 ? C.rd1 : C.rd2);
      }
      if (o.p.trail) for (let i = 0; i < 6; i++) G.disc(c, 2 + i * 3, 8 + Math.sin(i) * 2, 1, 1, C.rd1);
      if (o.p.hand) { R(c, 5, 5, 5, 5, C.rd1); for (let i = 0; i < 4; i++) R(c, 5 + i, 1 + (i % 2), 1, 4, C.rd1); R(c, 10, 6, 2, 1, C.rd1); }
    },
  };
  T.debris = {
    solid: false, flat: true,
    draw(c, o) {
      const r = vr(o);
      R(c, 2, 9, 7, 2, C.wd3); R(c, 2, 9, 7, 1, C.wd4);
      G.speck(c, 1, 3, 14, 12, C.st3, 8, o.x * 5 + o.y);
      if (r < 0.5) { R(c, 9, 4, 4, 3, C.bn1); R(c, 10, 5, 2, 1, C.st4); }
      if (r > 0.6) { R(c, 7, 12, 3, 2, C.bn2); P(c, 8, 12, C.st3); }
    },
  };
  T.cobweb = {
    solid: false, flat: true, top: true,
    draw(c, o) {
      const col = 'rgba(200,200,215,0.28)';
      const fx = o.p.flip ? 15 : 0, sx = o.p.flip ? -1 : 1;
      for (let i = 0; i < 4; i++) G.line(c, fx, 0, fx + sx * (12 - i * 3), i * 4, col);
      for (let k = 3; k < 12; k += 4) { G.line(c, fx + sx * k, 0, fx, k, col); }
    },
  };
  T.bones = {
    solid: false, flat: true,
    draw(c, o) {
      R(c, 3, 6, 4, 4, C.bn2); P(c, 4, 7, C.ink); P(c, 6, 7, C.ink); R(c, 4, 10, 2, 1, C.bn1);
      G.line(c, 8, 9, 14, 6, C.bn1); G.line(c, 9, 12, 13, 13, C.bn2); P(c, 14, 5, C.bn2); P(c, 8, 10, C.bn2);
    },
  };
  T.chalk = {
    solid: false, flat: true,
    draw(c, o) {
      const col = 'rgba(220,215,200,0.45)';
      G.box(c, 1, 1, 14, 7, col); G.box(c, 1, 8, 14, 7, col); R(c, 8, 1, 1, 7, col);
      P(c, 4, 4, col); P(c, 11, 4, col); P(c, 7, 11, col); P(c, 8, 11, col);
    },
  };
  T.paper = {
    solid: false, prompt: () => 'Lesen',
    draw(c, o, t) {
      const read = o.st.read;
      R(c, 4, 5, 8, 7, read ? C.bn1 : C.bn3); R(c, 4, 11, 8, 1, C.bn0);
      R(c, 5, 6, 5, 1, C.st4); R(c, 5, 8, 6, 1, C.st4); R(c, 5, 10, 3, 1, C.st4);
      if (!read && Math.sin(t * 3 + o.x) > 0.85) P(c, 11, 5, C.bn4);
    },
  };
  T.pickup = {
    solid: false, prompt: () => 'Aufheben',
    draw(c, o, t) {
      if (o.st.taken) return;
      const it = o.p.item || '';
      const bob = 0;
      if (it === 'batterie') { R(c, 6, 6, 4, 7, C.yl3); R(c, 6, 6, 4, 2, C.rd3); R(c, 7, 5, 2, 1, C.st5); }
      else if (it === 'verband') { G.disc(c, 8, 9, 3, 3, C.bn3); G.disc(c, 8, 9, 1, 1, C.bn0); R(c, 10, 11, 4, 2, C.bn2); }
      else if (it === 'tabletten') { R(c, 6, 6, 4, 7, C.or3); R(c, 6, 5, 4, 1, C.bn3); R(c, 7, 8, 2, 2, C.bn3); }
      else if (it === 'streichhoelzer') { R(c, 4, 8, 8, 5, C.bl3); R(c, 5, 9, 6, 3, C.yl3); }
      else if (it.indexOf('glocke') === 0) { R(c, 6, 4, 4, 2, C.st6); R(c, 5, 6, 6, 4, C.st6); R(c, 4, 10, 8, 2, C.st7); P(c, 6, 6, C.bn4); }
      else if (it.indexOf('schluessel') >= 0) { G.ring(c, 5, 9, 2, C.yl3); R(c, 7, 9, 6, 1, C.yl3); P(c, 11, 10, C.yl3); P(c, 12, 10, C.yl3); }
      else { R(c, 5, 6, 6, 6, C.st5); R(c, 6, 7, 4, 4, C.st6); }
      const s = (t * 1.5 + o.x * 0.37) % 3;
      if (s < 0.3) { P(c, 11, 4 + bob, C.bn4); P(c, 10, 4, C.yl4); P(c, 12, 4, C.yl4); P(c, 11, 3, C.yl4); P(c, 11, 5, C.yl4); }
    },
  };
  T.hook = {
    solid: false, wall: true, prompt: () => 'Untersuchen',
    draw(c, o) {
      R(c, 3, 4, 10, 3, C.wd3); R(c, 3, 4, 10, 1, C.wd4);
      for (let i = 4; i < 13; i += 3) { P(c, i, 7, C.st5); P(c, i, 8, C.st5); }
      if (!o.st.taken) { G.ring(c, 7, 11, 2, C.st6); R(c, 7, 13, 1, 3, C.st6); P(c, 8, 15, C.st6); }
      R(c, 9, 8, 2, 6, C.wd2);
    },
  };
  T.painting = {
    solid: false, wall: true, prompt: () => 'Betrachten',
    draw(c, o, t) {
      const art = o.p.art || 'land';
      R(c, 2, 0, 12, 11, C.yl1); R(c, 2, 0, 12, 1, C.yl2); R(c, 3, 1, 10, 9, '#0d0b10');
      if (art === 'oma') {
        R(c, 3, 1, 10, 9, '#1a1420'); G.disc(c, 8, 4, 2, 2, C.sk3); R(c, 6, 1, 4, 2, C.st5); R(c, 5, 7, 6, 3, C.ink2); P(c, 7, 4, C.ink); P(c, 9, 4, C.ink);
      } else if (art === 'girl') {
        R(c, 3, 1, 10, 9, '#24202a'); R(c, 6, 2, 4, 5, C.ink); G.disc(c, 8, 4, 1, 2, C.sk3); R(c, 6, 7, 4, 3, C.bn2);
        G.line(c, 6, 3, 10, 6, C.rd3); G.line(c, 10, 3, 6, 6, C.rd3);
      } else if (art === 'figure') {
        R(c, 3, 1, 10, 9, '#2a2a33'); R(c, 7, 2, 2, 8, C.ink); P(c, 8, 1, C.ink);
        if (Math.sin(t * 0.5 + o.x) > 0.97) P(c, 8, 3, C.rd4);
      } else if (art === 'family') {
        R(c, 3, 1, 10, 9, '#2b2620'); for (let i = 0; i < 4; i++) { G.disc(c, 4 + i * 2 + (i > 1 ? 1 : 0), 4 + (i > 1 ? 1 : 0), 1, 1, C.sk2); R(c, 4 + i * 2 + (i > 1 ? 1 : 0), 6, 1, 3, C.ink); }
        R(c, 11, 5, 1, 4, 'rgba(255,255,255,0.15)');
      } else if (art === 'house') {
        R(c, 3, 1, 10, 9, C.bl1); R(c, 3, 7, 10, 3, C.gr1); R(c, 6, 4, 5, 4, C.st2); R(c, 5, 3, 7, 1, C.st1); P(c, 8, 5, C.yl4);
      } else {
        R(c, 3, 1, 10, 9, '#1c2433'); R(c, 3, 6, 10, 4, C.gr1); P(c, 5, 5, C.gr2); P(c, 10, 4, C.gr2); P(c, 11, 2, C.bn2);
      }
      R(c, 2, 10, 12, 1, C.yl0);
    },
  };
  T.mirror = {
    solid: false, wall: true, prompt: () => 'Spiegel',
    draw(c, o, t) {
      R(c, 3, 0, 10, 13, C.yl1); R(c, 4, 1, 8, 11, '#2a3440');
      R(c, 4, 1, 8, 2, '#3c4a58'); G.line(c, 5, 6, 8, 3, '#55697c');
      if (o.st.scare && o.st.scare > t) { R(c, 6, 3, 4, 8, C.ink); R(c, 7, 4, 1, 1, C.bn4); }
      if (o.p.broken) { G.line(c, 5, 2, 11, 10, '#11161c'); G.line(c, 10, 2, 6, 11, '#11161c'); }
    },
  };
  T.poster = {
    solid: false, wall: true, prompt: () => 'Betrachten',
    draw(c, o) {
      R(c, 3, 1, 10, 10, C.bn2); R(c, 3, 1, 10, 1, C.bn3);
      if (o.p.art === 'dino') { R(c, 5, 5, 5, 3, C.gr4); R(c, 9, 3, 2, 3, C.gr4); R(c, 4, 7, 2, 1, C.gr4); R(c, 6, 8, 1, 2, C.gr4); R(c, 8, 8, 1, 2, C.gr4); P(c, 10, 3, C.ink); }
      else { R(c, 5, 3, 6, 6, C.bl3); G.disc(c, 8, 6, 2, 2, C.yl4); }
    },
  };
  T.tally = {
    solid: false, wall: true, prompt: () => 'Betrachten',
    draw(c) {
      const col = 'rgba(210,200,190,0.55)';
      for (let g = 0; g < 2; g++) for (let i = 0; i < 4; i++) R(c, 2 + g * 7 + i, 2, 1, 6, col);
      G.line(c, 1, 7, 7, 3, col); G.line(c, 8, 7, 14, 3, col);
      for (let i = 0; i < 3; i++) R(c, 3 + i * 2, 10, 1, 4, col);
    },
  };
  T.gunrack = {
    solid: false, wall: true, prompt: () => 'Betrachten',
    draw(c) {
      R(c, 1, 2, 14, 2, C.wd3); R(c, 1, 10, 14, 2, C.wd3);
      G.line(c, 3, 1, 13, 1, C.st3); R(c, 2, 1, 3, 2, C.wd4);
      G.line(c, 3, 8, 13, 8, C.st3); R(c, 2, 8, 3, 2, C.wd4);
    },
  };
  T.trophy = {
    solid: false, wall: true, prompt: () => 'Betrachten',
    draw(c) {
      R(c, 5, 4, 6, 7, C.wd3); R(c, 6, 9, 4, 3, C.wd4); P(c, 6, 6, C.ink); P(c, 9, 6, C.ink);
      G.line(c, 5, 4, 1, 0, C.bn1); G.line(c, 3, 2, 2, -1, C.bn1); G.line(c, 10, 4, 14, 0, C.bn1); G.line(c, 12, 2, 13, -1, C.bn1);
    },
  };
  T.toolwall = {
    solid: false, wall: true, prompt: () => 'Betrachten',
    draw(c) {
      R(c, 1, 1, 14, 12, C.wd2); G.speck(c, 2, 2, 12, 10, C.wd0, 20, 3);
      R(c, 3, 3, 1, 7, C.st5); R(c, 2, 3, 3, 2, C.st4);
      R(c, 7, 3, 1, 8, C.wd4); R(c, 6, 2, 3, 2, C.st5);
      G.disc(c, 12, 6, 2, 2, C.st4); R(c, 12, 8, 1, 4, C.wd4);
    },
  };
  T.pipes = {
    solid: false, wall: true, flat: true,
    draw(c) {
      R(c, 0, 4, 16, 3, C.st3); R(c, 0, 4, 16, 1, C.st5); R(c, 0, 10, 16, 2, '#4a3a2a'); R(c, 0, 10, 16, 1, '#6a523a');
      R(c, 6, 3, 3, 5, C.st2); P(c, 7, 2, C.rd3);
    },
  };
  T.fusebox = {
    solid: false, wall: true, prompt: () => 'Sicherungskasten',
    draw(c, o, t) {
      R(c, 2, 0, 12, 14, '#3a3f44'); R(c, 2, 0, 12, 1, '#5a6066'); R(c, 3, 1, 10, 12, '#2a2e33');
      const n = o.st.fuses || 0;
      for (let i = 0; i < 2; i++) {
        R(c, 4 + i * 5, 3, 3, 5, '#141618');
        if (n > i) { R(c, 4 + i * 5, 3, 3, 5, C.bl4); P(c, 5 + i * 5, 4, C.yl4); }
      }
      R(c, 4, 10, 8, 1, C.st2);
      const on = o.st.on;
      R(c, on ? 11 : 9, 9, 2, 3, C.rd3);
      P(c, 12, 2, on ? (Math.sin(t * 4) > 0 ? '#5f5' : '#3a3') : '#311');
      G.line(c, 8, 14, 8, 16, C.st2);
    },
  };
  T.shutter = {
    w: 2, solid: (o) => !o.st.open, opaque: (o) => !o.st.open, prompt: () => 'Rolltor',
    draw(c, o, t) {
      R(c, 0, -4, 32, 20, '#16181b');
      const lift = o.st.open ? 18 : (o.st.lift || 0);
      R(c, 1, -6, 30, 3, C.st4);
      for (let j = -3; j < 16 - lift; j += 2) { R(c, 1, j, 30, 1, '#4c5157'); R(c, 1, j + 1, 30, 1, '#363a3f'); }
      if (lift < 16) { R(c, 14, 14 - lift, 4, 1, C.yl2); }
      G.speck(c, 1, -3, 30, 18 - lift, '#5a3a22', 10, 7);
    },
  };
  T.boiler = {
    w: 2, hit: [2, 2, 28, 14], light: { r: 40, c: [255, 90, 40], i: 0.6, flicker: 0.2, y: 4, power: true },
    draw(c, o, t) {
      const on = OBJ.isLit(o);
      R(c, 6, -24, 3, 14, C.st3); R(c, 22, -22, 3, 12, '#4a3a2a');
      R(c, 3, -12, 26, 27, C.st2); R(c, 2, -10, 28, 23, C.st2); R(c, 3, -12, 26, 2, C.st3); R(c, 2, -10, 1, 23, C.st3);
      for (let j = -6; j < 12; j += 6) R(c, 2, j, 28, 1, C.st1);
      G.disc(c, 23, -5, 3, 3, C.bn1); G.ring(c, 23, -5, 3, C.st4); G.line(c, 23, -5, 24 + Math.round(Math.sin(t) * 1), -7, C.rd3);
      R(c, 8, 4, 10, 7, '#0e0b0b');
      for (let i = 9; i < 18; i += 2) R(c, i, 4, 1, 7, on ? (Math.sin(t * 6 + i) > 0 ? C.or4 : C.or3) : '#1c1616');
      R(c, 2, 15, 28, 1, '#000');
    },
  };
  T.valve = {
    solid: false, wall: true, prompt: () => 'Ventil',
    draw(c, o, t) {
      R(c, 7, 0, 3, 16, C.st3); R(c, 7, 0, 1, 16, C.st5); R(c, 6, 6, 5, 4, C.st2);
      if (o.st.wheel) {
        const a = o.st.turned ? t * 0 + 0.8 : 0;
        G.ring(c, 8, 8, 5, C.rd3); G.ring(c, 8, 8, 4, C.rd2);
        for (let i = 0; i < 4; i++) G.line(c, 8, 8, 8 + Math.round(Math.cos(a + i * Math.PI / 2) * 4), 8 + Math.round(Math.sin(a + i * Math.PI / 2) * 4), C.rd3);
      } else { R(c, 8, 4, 1, 4, C.st6); }
    },
  };
  T.safe = {
    hit: [1, 2, 14, 14], prompt: () => 'Tresor',
    draw(c, o) {
      R(c, 1, -4, 14, 19, '#25272c'); R(c, 1, -4, 14, 1, '#4a4e56'); R(c, 1, -4, 1, 19, '#3a3e45');
      if (o.st.open) {
        R(c, 3, -2, 10, 15, '#08080a'); R(c, -6, -2, 8, 15, '#2c2f35'); R(c, -6, -2, 8, 1, '#4a4e56');
        if (!o.st.emptied) { R(c, 5, 8, 5, 4, C.bn2); R(c, 7, 2, 3, 4, C.st6); }
      } else {
        R(c, 3, -2, 10, 15, '#2e3137');
        G.disc(c, 8, 4, 3, 3, '#1a1c20'); G.ring(c, 8, 4, 3, C.st5); P(c, 8, 1, C.yl3);
        R(c, 11, 8, 1, 4, C.st6);
      }
      R(c, 1, 15, 14, 1, '#000');
    },
  };
  T.desk = {
    w: 2, hit: [0, 2, 32, 14], cache: [0, -10, 32, 27], ckey: (o) => (o.p.lamp ? 'l' : '') + (o.st.taken ? 't' : ''),
    draw(c, o) {
      R(c, 0, -1, 32, 11, C.wd3); R(c, 0, -2, 32, 1, C.wd5); R(c, 0, 10, 32, 5, C.wd1);
      R(c, 2, 11, 8, 3, C.wd2); R(c, 22, 11, 8, 3, C.wd2); P(c, 6, 12, C.yl3); P(c, 26, 12, C.yl3);
      R(c, 4, 1, 9, 7, C.bn2); R(c, 6, 2, 7, 7, C.bn3); for (let j = 3; j < 8; j += 2) R(c, 7, j, 5, 1, C.st4);
      R(c, 16, 3, 3, 3, C.ink); P(c, 17, 2, C.ink); G.line(c, 19, 1, 23, 5, C.bn1);
      if (o.p.lamp !== false) { R(c, 26, -2, 3, 6, C.st3); R(c, 24, -7, 7, 5, C.gr3); R(c, 24, -7, 7, 1, C.gr4); }
    },
  };
  T.workbench = {
    w: 2, hit: [0, 2, 32, 14],
    draw(c, o) {
      R(c, 0, 0, 32, 10, C.wd4); R(c, 0, 0, 32, 1, C.wd5); R(c, 0, 10, 32, 3, C.wd2);
      R(c, 1, 13, 2, 3, C.wd1); R(c, 29, 13, 2, 3, C.wd1);
      G.speck(c, 1, 1, 30, 8, C.wd6, 12, 5);
      R(c, 2, 2, 6, 4, C.st3); R(c, 3, 1, 4, 1, C.st5);
      if (!o.st.taken) {
        if (o.p.item === 'brecheisen') { G.line(c, 12, 7, 26, 3, C.rd3); P(c, 26, 2, C.rd3); }
        else if (o.p.item === 'kurbel') { R(c, 14, 3, 8, 2, C.st5); R(c, 21, 3, 2, 6, C.st5); R(c, 13, 2, 2, 4, C.wd4); }
      }
      R(c, 24, 6, 5, 2, C.st4);
    },
  };
  T.toolbox = {
    hit: [2, 6, 12, 9],
    draw(c, o) {
      R(c, 2, 6, 12, 8, C.rd3); R(c, 2, 6, 12, 1, C.rd4); R(c, 2, 9, 12, 1, C.rd1);
      R(c, 5, 3, 6, 1, C.st4); R(c, 5, 3, 1, 3, C.st4); R(c, 10, 3, 1, 3, C.st4);
      P(c, 8, 10, C.yl3); R(c, 2, 14, 12, 1, '#000');
    },
  };
  T.piano = {
    w: 2, hit: [0, 2, 32, 14], prompt: () => 'Klavier',
    draw(c, o, t) {
      R(c, 0, -10, 32, 24, '#121014'); R(c, 0, -11, 32, 2, '#2a2630'); R(c, 0, -11, 32, 1, '#3c3644');
      R(c, 1, -6, 30, 8, '#1a171d');
      R(c, 10, -9, 12, 7, C.bn1); for (let j = -8; j < -2; j += 2) R(c, 11, j, 10, 1, C.st4);
      R(c, 2, 3, 28, 5, C.bn3); for (let i = 3; i < 30; i += 3) { R(c, i, 3, 1, 5, C.bn1); if (i % 7 !== 0) R(c, i + 1, 3, 1, 3, C.ink); }
      R(c, 0, 8, 32, 2, '#1d1a20'); R(c, 2, 10, 2, 4, '#121014'); R(c, 28, 10, 2, 4, '#121014');
      R(c, 3, -15, 2, 4, C.bn3); flame(c, 3, -15, t, 8); R(c, 27, -15, 2, 4, C.bn3); flame(c, 27, -15, t, 9);
    },
    light: { r: 48, c: [255, 170, 90], i: 0.6, flicker: 0.14, y: -14 },
  };
  T.gramophone = {
    hit: [3, 6, 10, 9], prompt: () => 'Grammophon',
    draw(c, o, t) {
      R(c, 2, 4, 12, 9, C.wd2); R(c, 2, 4, 12, 1, C.wd4); R(c, 3, 13, 2, 3, C.wd1); R(c, 11, 13, 2, 3, C.wd1);
      G.disc(c, 6, 3, 4, 2, C.ink);
      R(c, 10, -2, 2, 6, C.yl2); G.disc(c, 12, -6, 5, 4, C.yl2); G.disc(c, 12, -6, 3, 2, C.yl0);
      if (o.st.playing) P(c, 6 + Math.round(Math.cos(t * 8) * 3), 3 + Math.round(Math.sin(t * 8)), C.bn2);
    },
  };
  T.washtub = {
    hit: [1, 3, 14, 12],
    draw(c) {
      G.disc(c, 8, 9, 7, 6, C.wd3); G.disc(c, 8, 8, 5, 4, '#1c2026'); R(c, 1, 9, 14, 1, C.st3);
      R(c, 10, 0, 5, 10, C.wd4); for (let j = 1; j < 9; j += 2) R(c, 11, j, 3, 1, C.st4);
    },
  };
  T.sheet = {
    solid: false,
    draw(c, o, t) {
      const sw = Math.sin(t * 1.4 + o.x) * 1.5;
      R(c, -2, -14, 20, 1, C.st3);
      for (let i = 0; i < 14; i++) {
        const dx = Math.round(sw * (i / 14));
        R(c, 1 + dx, -13 + i, 14, 1, i % 4 === 0 ? C.bn1 : C.bn2);
      }
      R(c, 1 + Math.round(sw), 1, 14, 1, C.bn0);
      P(c, 1, -14, C.wd4); P(c, 14, -14, C.wd4);
    },
  };
  T.stump = {
    hit: [2, 6, 12, 9],
    draw(c) {
      G.disc(c, 8, 11, 6, 3, '#24180f'); G.disc(c, 8, 9, 6, 3, C.wd4); G.ring(c, 8, 9, 3, C.wd3);
      R(c, 2, 9, 12, 4, C.wd2); G.disc(c, 8, 9, 5, 2, C.wd5); P(c, 8, 9, C.wd3);
      G.line(c, 9, 8, 13, 0, C.wd5); R(c, 11, -1, 4, 3, C.st5); P(c, 14, 0, C.st7);
    },
  };
  T.shrine = {
    hit: [5, 8, 6, 7], light: { r: 50, c: [255, 160, 70], i: 0.75, flicker: 0.16, y: 6 },
    draw(c, o, t) {
      R(c, 7, -10, 2, 25, C.wd2); R(c, 7, -10, 1, 25, C.wd3);
      R(c, 3, -16, 10, 7, C.wd2); R(c, 2, -18, 12, 2, C.wd1); R(c, 4, -19, 8, 1, C.wd1);
      R(c, 4, -15, 8, 5, '#0d0a0e'); G.disc(c, 8, -13, 1, 1, C.bn2); R(c, 7, -12, 3, 2, C.bl3);
      R(c, 3, 13, 2, 3, C.bn3); R(c, 11, 12, 2, 3, C.bn3);
      if (OBJ.isLit(o)) { flame(c, 3, 13, t, 1); flame(c, 11, 12, t, 2); }
      P(c, 5, 14, C.rd2); P(c, 6, 13, C.rd3); P(c, 10, 14, C.wd4);
    },
  };
  T.backpack = {
    hit: [3, 6, 10, 9], prompt: () => 'Rucksack',
    draw(c) {
      R(c, 3, 4, 10, 10, C.bl3); R(c, 3, 4, 10, 1, C.bl4); R(c, 4, 9, 8, 4, C.bl2); R(c, 6, 10, 4, 1, C.yl3);
      R(c, 5, 2, 6, 2, C.bl2); R(c, 2, 13, 12, 1, 'rgba(0,0,0,0.5)'); P(c, 11, 6, C.rd3); P(c, 12, 6, C.yl4);
    },
  };
  T.car = {
    w: 2, hit: [0, 0, 32, 14], light: { r: 34, c: [255, 220, 150], i: 0.5, flicker: 0.3, x: 34, y: 6 },
    draw(c, o, t) {
      G.disc(c, 16, 14, 16, 3, 'rgba(0,0,0,0.45)');
      R(c, 1, -3, 30, 17, '#4a1418'); R(c, 0, -1, 32, 13, '#4a1418');
      R(c, 1, -3, 30, 1, '#6e2228'); R(c, 0, 11, 32, 2, '#2a0a0e');
      R(c, 9, -2, 15, 12, '#3a1014'); R(c, 9, -2, 15, 1, '#5c1a20');
      R(c, 22, -1, 4, 10, '#1a2636'); R(c, 23, 0, 1, 3, C.bl5);
      R(c, 7, -1, 2, 10, '#1a2636');
      R(c, 2, -3, 4, 2, C.ink); R(c, 26, -3, 4, 2, C.ink); R(c, 2, 12, 4, 2, C.ink); R(c, 26, 12, 4, 2, C.ink);
      const on = Math.sin(t * 7) + Math.sin(t * 17) > -0.8;
      R(c, 31, 0, 1, 3, on ? C.yl5 : C.yl1); R(c, 31, 8, 1, 3, C.yl0);
      R(c, 0, 1, 1, 2, C.rd4); R(c, 0, 8, 1, 2, C.rd4);
      R(c, 15, 10, 1, 1, C.st6);
      if (Math.sin(t * 2) > 0) P(c, 12, 3, 'rgba(150,180,210,0.5)');
    },
  };
  T.fallentree = {
    w: 2, h: 3, hit: [0, 0, 32, 48], cache: [-14, -14, 60, 70], ckey: () => '',
    draw(c) {
      for (let i = 0; i <= 20; i++) {
        const x = 2 + i * 1.4, y = -4 + i * 2.6;
        G.disc(c, x, y, 5, 4, '#24180f');
        G.disc(c, x - 1, y - 1, 3, 2, '#35241a');
      }
      G.disc(c, 0, -8, 9, 7, '#2b2017'); G.speck(c, -8, -14, 16, 12, '#4a3a2a', 20, 4);
      for (let i = 0; i < 5; i++) G.line(c, -4 + i * 2, -12, -9 + i * 4, -18 + (i % 2) * 3, '#1d140d');
      [[28, 40], [36, 30], [14, 26], [38, 46]].forEach(([x, y], k) => {
        G.disc(c, x, y, 7, 5, C.gr1); G.disc(c, x - 2, y - 1, 4, 3, C.gr2); G.speck(c, x - 6, y - 4, 12, 8, C.gr3, 8, k);
      });
      G.line(c, 18, 20, 30, 14, '#24180f'); G.line(c, 24, 30, 14, 40, '#24180f');
    },
  };
  T.sign = {
    hit: [6, 10, 4, 5], prompt: () => 'Lesen',
    draw(c) {
      R(c, 7, -4, 2, 19, C.wd2);
      R(c, 0, -12, 16, 9, C.wd3); R(c, 0, -12, 16, 1, C.wd4); R(c, 0, -4, 16, 1, C.wd1);
      R(c, 2, -10, 9, 1, C.bn1); R(c, 2, -8, 11, 1, C.bn1); R(c, 2, -6, 6, 1, C.bn1);
    },
  };
  T.fountain = {
    w: 2, h: 2, hit: [2, 4, 28, 26],
    draw(c, o, t) {
      G.disc(c, 16, 18, 15, 11, C.st3); G.disc(c, 16, 17, 13, 9, C.st2); G.disc(c, 16, 18, 12, 8, '#0c141c');
      for (let i = 0; i < 3; i++) { const r = ((t * 4 + i * 4) % 12); G.ring(c, 16, 18, r, 'rgba(120,150,180,0.12)'); }
      R(c, 14, 4, 4, 14, C.st4); R(c, 14, 4, 1, 14, C.st5); G.disc(c, 16, 3, 3, 2, C.st4);
      R(c, 12, -6, 8, 9, C.st4); G.disc(c, 16, -9, 3, 3, C.st4); P(c, 15, -9, C.ink); P(c, 17, -9, C.ink);
      R(c, 15, -6, 1, 5, 'rgba(10,10,15,0.5)');
    },
  };
  T.well = {
    hit: [1, 4, 14, 12],
    draw(c) {
      G.disc(c, 8, 10, 7, 5, C.st3); G.disc(c, 8, 9, 5, 3, '#040306'); R(c, 1, 10, 14, 4, C.st2);
      for (let i = 1; i < 15; i += 4) R(c, i, 10, 3, 2, C.st4);
      R(c, 1, -12, 2, 21, C.wd2); R(c, 13, -12, 2, 21, C.wd2);
      R(c, -1, -15, 18, 3, C.wd3); R(c, -1, -15, 18, 1, C.wd4);
      R(c, 3, -9, 10, 2, C.wd4); R(c, 8, -7, 1, 9, C.bn1); R(c, 6, 0, 4, 3, C.wd3);
    },
  };
  T.bench = {
    hit: [0, 4, 16, 8],
    draw(c) {
      R(c, 0, 2, 16, 4, C.st3); R(c, 0, 2, 16, 1, C.st4); R(c, 1, 6, 3, 6, C.st2); R(c, 12, 6, 3, 6, C.st2);
      G.speck(c, 0, 2, 16, 4, C.gr3, 4, 1);
    },
  };
  T.altar = {
    w: 3, hit: [0, 2, 48, 14], prompt: () => 'Altar',
    light: { r: 70, c: [255, 160, 80], i: 0.85, flicker: 0.14, y: -8, x: 24 },
    draw(c, o, t) {
      R(c, 0, -6, 48, 22, C.st3); R(c, 0, -7, 48, 2, C.st4); R(c, 0, -7, 48, 1, C.st5);
      R(c, 18, -6, 12, 22, C.rd1); R(c, 18, -6, 12, 1, C.rd2); for (let j = -4; j < 16; j += 4) P(c, 24, j, C.yl1);
      for (let i = 0; i < 3; i++) {
        const sx = 6 + i * 16 + (i === 1 ? 0 : 0);
        const bx = i === 0 ? 8 : i === 1 ? 24 : 40;
        G.disc(c, bx, 3, 4, 3, '#121015'); G.ring(c, bx, 3, 4, C.st5);
        if ((o.st.bells || 0) > i) { R(c, bx - 2, -3, 4, 2, C.st6); R(c, bx - 3, -1, 6, 4, C.st6); R(c, bx - 4, 3, 8, 2, C.st7); P(c, bx - 1, -1, C.bn4); }
        void sx;
      }
      G.line(c, 2, 10, 14, 10, C.st2); G.line(c, 34, 10, 46, 10, C.st2);
      R(c, 1, -12, 2, 5, C.bn3); flame(c, 1, -12, t, 1); R(c, 45, -12, 2, 5, C.bn3); flame(c, 45, -12, t, 2);
      R(c, 14, -11, 2, 4, C.bn3); flame(c, 14, -11, t, 3); R(c, 32, -11, 2, 4, C.bn3); flame(c, 32, -11, t, 4);
    },
  };
  T.smallaltar = {
    w: 2, hit: [0, 2, 32, 14], light: { r: 56, c: [255, 170, 90], i: 0.8, flicker: 0.12, y: -6, x: 16 },
    draw(c, o, t) {
      R(c, 0, -2, 32, 16, C.st3); R(c, 0, -3, 32, 2, C.st5);
      R(c, 2, -3, 28, 8, C.bn2); R(c, 2, 5, 28, 1, C.bn0); R(c, 14, -3, 4, 17, C.rd2);
      R(c, 15, -16, 2, 12, C.yl2); R(c, 12, -12, 8, 2, C.yl2);
      R(c, 4, -8, 2, 5, C.bn3); flame(c, 4, -8, t, 5); R(c, 26, -8, 2, 5, C.bn3); flame(c, 26, -8, t, 6);
    },
  };
  T.coffin = {
    h: 2, hit: [1, 0, 14, 32], cache: [0, -3, 16, 37], ckey: (o) => (o.p.kind || '') + (o.st.open ? 'o' : ''),
    draw(c, o) {
      const stone = o.p.kind !== 'wood';
      const A = stone ? C.st3 : C.wd2, B = stone ? C.st4 : C.wd3, D = stone ? C.st2 : C.wd1;
      R(c, 1, -2, 14, 34, D); R(c, 2, -2, 12, 32, A); R(c, 2, -2, 12, 1, B);
      if (o.st.open) { R(c, 4, 1, 8, 26, '#060508'); R(c, 6, 3, 4, 4, C.bn1); P(c, 7, 4, C.ink); P(c, 9, 4, C.ink); }
      else { R(c, 7, 4, 2, 18, B); R(c, 4, 9, 8, 2, B); }
      if (stone) G.speck(c, 2, 0, 12, 30, C.gr2, 8, o.x + o.y);
      R(c, 1, 32, 14, 1, '#000');
    },
  };
  T.cradle = {
    hit: [1, 4, 14, 11], prompt: () => 'Wiege',
    draw(c, o, t) {
      const rk = Math.round(Math.sin(t * 1.5) * (o.st.taken ? 0.4 : 1));
      R(c, 2, 2 + rk, 12, 9, C.wd3); R(c, 2, 2 + rk, 12, 1, C.wd4);
      for (let i = 3; i < 14; i += 2) R(c, i, 0 + rk, 1, 3, C.wd3);
      R(c, 3, 4 + rk, 10, 5, C.bn1); R(c, 3, 4 + rk, 10, 1, C.bn2);
      if (!o.st.taken) { R(c, 7, 4 + rk, 3, 3, C.st6); P(c, 7, 4 + rk, C.bn4); }
      G.line(c, 0, 13, 4, 11, C.wd2); G.line(c, 16, 13, 12, 11, C.wd2); R(c, 3, 11, 10, 1, C.wd2);
    },
  };
  T.doll = {
    hit: [4, 8, 8, 7], prompt: () => 'Puppe',
    draw(c, o, t) {
      const k = Math.floor(vr(o) * 3);
      const dress = [C.rd3, C.bl3, C.bn1][k];
      R(c, 5, 6, 6, 6, dress); R(c, 4, 11, 8, 2, dress); R(c, 4, 6, 1, 4, C.bn3); R(c, 11, 6, 1, 4, C.bn3);
      G.disc(c, 8, 3, 3, 3, C.bn3); R(c, 5, 0, 6, 2, k === 1 ? C.yl3 : C.wd3); R(c, 4, 1, 1, 4, k === 1 ? C.yl3 : C.wd3); R(c, 11, 1, 1, 4, k === 1 ? C.yl3 : C.wd3);
      P(c, 7, 3, C.ink); P(c, 9, 3, C.ink); P(c, 8, 5, C.rd3);
      if (k === 2) G.line(c, 7, 1, 9, 5, C.st3); // Sprung im Porzellan
      R(c, 5, 13, 2, 1, C.ink); R(c, 9, 13, 2, 1, C.ink);
    },
  };
  T.rockinghorse = {
    hit: [1, 6, 14, 9],
    draw(c, o, t) {
      const rk = o.st.rock ? Math.sin(t * 4) : Math.sin(t * 0.3) * 0.2;
      const d = Math.round(rk * 1.5);
      G.line(c, 0, 13 - d, 15, 13 + d, C.rd2); G.line(c, 0, 14 - d, 15, 14 + d, C.rd1);
      R(c, 4, 6, 2, 7, C.wd3); R(c, 10, 6, 2, 7, C.wd3);
      R(c, 3, 2 + Math.round(d / 2), 10, 5, C.bn2); R(c, 3, 2, 10, 1, C.bn3);
      R(c, 11, -3 + d, 3, 6, C.bn2); R(c, 12, -4 + d, 4, 3, C.bn2); P(c, 14, -3 + d, C.ink);
      R(c, 10, -3 + d, 1, 6, C.wd2); R(c, 2, 2, 2, 4, C.wd2);
      R(c, 6, 1, 4, 2, C.rd3);
    },
  };
  T.dollhouse = {
    hit: [0, 4, 16, 12], cache: [0, -12, 16, 28], ckey: () => '',
    draw(c) {
      R(c, 1, -4, 14, 19, C.bn1); for (let j = -9; j < -3; j++) R(c, 8 - (j + 10), j, (j + 10) * 2, 1, C.rd2);
      R(c, 3, -2, 4, 4, '#0d0b10'); R(c, 9, -2, 4, 4, '#0d0b10'); R(c, 3, 5, 4, 4, '#0d0b10'); R(c, 9, 5, 4, 7, C.wd2);
      P(c, 4, -1, C.yl4); P(c, 5, 6, C.bn4);
      R(c, 1, 15, 14, 1, '#000');
    },
  };
  T.toybox = {
    hit: [1, 3, 14, 12],
    draw(c) {
      R(c, 1, 3, 14, 11, C.bl2); R(c, 1, 3, 14, 1, C.bl3); R(c, 1, -4, 14, 3, C.bl3);
      R(c, 3, 0, 3, 4, C.rd3); G.disc(c, 10, 2, 2, 2, C.yl3); R(c, 7, -2, 2, 5, C.gr4);
      R(c, 5, 7, 6, 2, C.yl2); R(c, 1, 14, 14, 1, '#000');
    },
  };
  T.musicbox = {
    hit: [3, 6, 10, 9], prompt: () => 'Spieluhr',
    draw(c, o, t) {
      R(c, 4, 6, 8, 7, C.wd3); R(c, 4, 6, 8, 1, C.wd5); R(c, 5, 12, 6, 3, C.wd2);
      R(c, 4, 1, 8, 5, C.wd2); R(c, 5, 2, 6, 3, C.rd2);
      const sp = o.st.playing ? t * 4 : 0;
      R(c, 7 + Math.round(Math.sin(sp)), 2, 1, 4, C.bn3); P(c, 7 + Math.round(Math.sin(sp)), 1, C.bn4);
    },
  };
  T.sheetcover = {
    hit: [0, 4, 16, 12], cache: [-1, -16, 18, 33], ckey: (o) => (o.p.kind || 'chair'),
    draw(c, o) {
      const k = o.p.kind || 'chair';
      const top = k === 'tall' ? -14 : k === 'cab' ? -6 : -2;
      R(c, 1, top + 2, 14, 15 - top, C.bn1);
      R(c, 2, top, 12, 3, C.bn2); R(c, 3, top - 1, 10, 1, C.bn2);
      for (let i = 3; i < 15; i += 4) R(c, i, top + 4, 1, 12 - top, C.bn0);
      R(c, 0, 14, 16, 2, C.bn0); for (let i = 0; i < 16; i += 3) P(c, i, 15, C.bn1);
      G.speck(c, 1, top + 2, 14, 12 - top, '#6e685a', 8, o.x * 3 + o.y);
    },
  };
  T.crow = {
    solid: false,
    draw(c, o, t) {
      if (o.st.flown) {
        const k = U.clamp((t - o.st.flown) * 1.4, 0, 1);
        if (k >= 1) return;
        const dx = Math.round(k * 60), dy = Math.round(-k * 80);
        const f = Math.sin(t * 30) > 0;
        R(c, 6 + dx, 6 + dy, 4, 2, C.ink); R(c, 3 + dx, f ? 4 + dy : 7 + dy, 3, 1, C.ink); R(c, 10 + dx, f ? 4 + dy : 7 + dy, 3, 1, C.ink);
        return;
      }
      const peck = Math.sin(t * 3 + o.x) > 0.8 ? 1 : 0;
      R(c, 5, 8, 6, 4, C.ink); R(c, 9, 6 + peck, 3, 3, C.ink); P(c, 12, 7 + peck, C.st4); P(c, 10, 7 + peck, C.bn3);
      R(c, 3, 9, 2, 2, C.ink); R(c, 6, 12, 1, 2, C.st3); R(c, 9, 12, 1, 2, C.st3);
    },
  };
  T.plant = {
    hit: [1, 4, 14, 11], cache: [-3, -12, 22, 29], ckey: (o) => (o.p.kind || '') + Math.floor(vr(o) * 3),
    draw(c, o) {
      const k = o.p.kind || 'leaf';
      G.disc(c, 8, 13, 7, 2, 'rgba(0,0,0,0.4)');
      if (k === 'rose') {
        G.disc(c, 8, 4, 8, 8, C.gr1); G.disc(c, 6, 2, 5, 5, C.gr2); G.speck(c, 0, -4, 16, 16, C.gr3, 14, o.x + o.y);
        for (let i = 0; i < 6; i++) { const x = 2 + U.hash(o.x, o.y, i) * 12, y = -3 + U.hash(o.x, o.y, i + 9) * 12; R(c, x, y, 2, 2, C.rd3); P(c, x, y, C.rd5); }
      } else if (k === 'dead') {
        for (let i = 0; i < 6; i++) G.line(c, 8, 12, 2 + i * 2.4, -6 + (i % 3) * 3, i % 2 ? C.wd3 : C.wd2);
        G.speck(c, 0, -6, 16, 14, C.yl1, 6, o.x);
      } else {
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.45;
          const ex = 8 + Math.cos(a) * 10, ey = 10 + Math.sin(a) * 13;
          G.line(c, 8, 12, ex, ey, C.gr2);
          G.disc(c, ex, ey, 3, 2, i % 2 ? C.gr3 : C.gr2);
          P(c, ex - 1, ey - 1, C.gr4);
        }
        if (k === 'flower') { P(c, 4, -1, C.pu4); P(c, 12, 0, C.pu4); P(c, 8, -3, C.bn3); }
      }
    },
  };
  T.mannequin = {
    hit: [4, 8, 8, 7],
    draw(c, o, t) {
      R(c, 7, 4, 2, 10, C.wd2); R(c, 4, 13, 8, 2, C.wd2);
      R(c, 4, -10, 8, 15, o.p.cloth ? C.rd2 : C.bn1); R(c, 5, -12, 6, 2, C.bn1); R(c, 7, -15, 2, 3, C.wd3);
      R(c, 4, -10, 1, 15, o.p.cloth ? C.rd3 : C.bn2);
      if (o.p.cloth) { R(c, 3, -2, 10, 6, C.rd2); for (let i = 4; i < 13; i += 2) P(c, i, 3, C.rd1); }
      P(c, 6, -6, C.st4); P(c, 10, -6, C.st4);
    },
  };
  T.sewing = {
    hit: [0, 2, 16, 14],
    draw(c) {
      R(c, 0, 0, 16, 10, C.wd3); R(c, 0, 0, 16, 1, C.wd5); R(c, 1, 10, 2, 5, C.wd1); R(c, 13, 10, 2, 5, C.wd1);
      R(c, 3, -5, 10, 7, C.ink2); R(c, 3, -5, 10, 1, C.st3); R(c, 10, -3, 2, 6, C.ink2); R(c, 4, -3, 3, 1, C.yl2);
      R(c, 2, 4, 6, 3, C.rd2); P(c, 12, 5, C.st6);
    },
  };
  T.trunk = {
    hit: [0, 3, 16, 12], prompt: () => 'Truhe',
    draw(c, o) {
      R(c, 0, 2, 16, 12, C.wd2); R(c, 0, -2, 16, 5, C.wd3); R(c, 0, -2, 16, 1, C.wd4);
      R(c, 3, -2, 2, 16, C.st3); R(c, 11, -2, 2, 16, C.st3); R(c, 7, 3, 2, 3, C.yl2);
      if (o.st.opened) { R(c, 1, -6, 14, 4, C.wd3); R(c, 1, -1, 14, 3, '#0a0706'); }
      R(c, 0, 14, 16, 1, '#000');
    },
  };
  T.coatrack = {
    hit: [5, 10, 6, 5],
    draw(c) {
      R(c, 7, -14, 2, 28, C.wd2); R(c, 4, 13, 8, 2, C.wd2);
      R(c, 3, -12, 10, 12, C.ink2); R(c, 4, -13, 8, 2, C.ink2); R(c, 5, -16, 6, 3, '#1a1420');
      R(c, 3, -12, 1, 12, C.st1);
    },
  };
  T.suitcase = {
    hit: [1, 6, 14, 9],
    draw(c) {
      R(c, 1, 5, 14, 9, C.wd4); R(c, 1, 5, 14, 1, C.wd5); R(c, 6, 3, 4, 2, C.wd1);
      R(c, 3, 5, 1, 9, C.wd2); R(c, 12, 5, 1, 9, C.wd2); R(c, 6, 9, 4, 1, C.yl2);
      R(c, 1, 14, 14, 1, '#000');
    },
  };
  T.boxes = {
    hit: [0, 2, 16, 14], cache: [0, -10, 16, 27], ckey: (o) => Math.floor(vr(o) * 3),
    draw(c, o) {
      R(c, 0, 2, 16, 12, '#5a4630'); R(c, 0, 2, 16, 1, '#7a6040'); R(c, 7, 2, 2, 12, '#a08a60');
      R(c, 2, 8, 6, 2, C.ink2);
      if (vr(o) < 0.6) { R(c, 2, -8, 12, 10, '#4e3c28'); R(c, 2, -8, 12, 1, '#6e5638'); R(c, 7, -8, 2, 10, '#a08a60'); }
      R(c, 0, 14, 16, 1, '#000');
    },
  };
  T.sack = {
    hit: [2, 5, 12, 10],
    draw(c) {
      G.disc(c, 8, 9, 6, 6, '#6a5a3e'); R(c, 6, 1, 4, 3, '#6a5a3e'); R(c, 5, 3, 6, 1, '#4a3e2a');
      G.speck(c, 3, 4, 10, 10, '#4a3e2a', 10, 2);
    },
  };
  T.coal = {
    hit: [1, 6, 14, 9],
    draw(c) {
      G.disc(c, 8, 11, 7, 5, '#0d0c0e'); G.speck(c, 1, 6, 14, 9, '#2a2830', 18, 3); G.speck(c, 1, 6, 14, 9, '#05050a', 10, 4);
    },
  };
  T.bike = {
    hit: [0, 6, 16, 8],
    draw(c) {
      G.ring(c, 3, 10, 3, C.st4); G.ring(c, 13, 10, 3, C.st4);
      G.line(c, 3, 10, 8, 6, C.rd3); G.line(c, 8, 6, 13, 10, C.rd3); G.line(c, 6, 10, 8, 6, C.rd3); G.line(c, 8, 6, 12, 5, C.rd3);
      R(c, 5, 5, 3, 1, C.ink); R(c, 11, 4, 3, 1, C.st5);
    },
  };
  T.wheelbarrow = {
    hit: [0, 4, 16, 10],
    draw(c) {
      G.ring(c, 13, 11, 2, C.st3); R(c, 1, 3, 11, 7, C.st3); R(c, 2, 4, 9, 4, '#1e1813'); R(c, 0, 9, 3, 1, C.wd3); R(c, 2, 10, 1, 4, C.st2);
    },
  };
  T.niche = {
    solid: false, wall: true, prompt: () => 'Nische',
    draw(c, o) {
      R(c, 3, 2, 10, 12, '#060508'); R(c, 4, 1, 8, 1, '#060508');
      G.box(c, 2, 1, 12, 14, C.st3);
      R(c, 5, 8, 4, 3, C.bn1); P(c, 6, 9, C.ink); P(c, 8, 9, C.ink);
      if (!o.st.taken && o.p.note) { R(c, 9, 10, 4, 3, C.bn3); }
    },
  };
  T.ball = {
    solid: false,
    draw(c, o, t) {
      let dx = 0;
      if (o.st.rolling) dx = Math.min(90, (t - o.st.rolling) * 40);
      G.disc(c, 8 + dx, 11, 3, 3, C.rd3); P(c, 7 + dx, 10, C.rd5); R(c, 6 + dx, 11, 5, 1, C.bn2);
    },
  };
  T.theo = {
    solid: false,
    draw(c, o, t) {
      if (!o.st.visible) return;
      const br = Math.sin(t * 1.5) > 0 ? 1 : 0;
      R(c, 2, 8, 12, 5 + br, C.bl3); R(c, 2, 8, 12, 1, C.bl4);
      G.disc(c, 4, 7, 3, 3, C.sk3); R(c, 1, 4, 6, 2, '#5a3a1e'); R(c, 1, 5, 2, 4, '#5a3a1e');
      R(c, 12, 12, 4, 2, '#3a3a44');
    },
  };
  T.bellrope = {
    solid: false, prompt: () => 'Glockenseil',
    draw(c, o, t) {
      const sw = Math.round(Math.sin(t * 0.8 + o.x) * 1);
      R(c, 7 + sw, -30, 1, 40, C.wd4); R(c, 6 + sw, 8, 3, 5, C.rd2); P(c, 7 + sw, 13, C.yl2);
    },
  };

  T.beam = {
    hit: [5, 8, 6, 8],
    draw(c) {
      R(c, 5, -30, 6, 46, C.wd2); R(c, 5, -30, 1, 46, C.wd3); R(c, 10, -30, 1, 46, C.wd1);
      G.line(c, 6, -20, 9, -18, C.wd1); P(c, 7, 2, C.st5);
      R(c, 4, 14, 8, 2, 'rgba(0,0,0,0.5)');
    },
  };
  T.plaque = {
    solid: false, wall: true, prompt: () => 'Lesen',
    draw(c) {
      R(c, 3, 3, 10, 7, C.yl1); R(c, 4, 4, 8, 5, C.yl2); R(c, 3, 3, 10, 1, C.yl3);
      R(c, 5, 5, 6, 1, C.yl0); R(c, 5, 7, 5, 1, C.yl0);
    },
  };

  // ---------- Hilfen ----------
  function isLit(o) {
    const d = o.def;
    if (d.light && d.light.power) return !!(Game.flags.power) && o.st.lit !== false && o.p.lit !== false;
    if (o.st.lit !== undefined) return o.st.lit;
    return o.p.lit !== false;
  }

  return { T, isLit };
})();
