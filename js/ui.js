'use strict';
// ------------------------------------------------------------
//  Oberfläche: Rahmen, Dialoge, Notizen, Inventar, Tagebuch,
//  Karte, Menüs, Zahlenschloss, Klavier. Alles in Pixelschrift.
// ------------------------------------------------------------
const UI = (function () {
  const R = G.R, P = G.P;
  const COL = { text: '#d8cfb8', dim: '#7d7889', hi: '#e8c46a', red: '#c8323a', ink: '#2a1b13', ink2: '#5a4630', bg: '#0b090e', line: '#3a3442' };
  let toasts = [];
  let banner = null;

  // ---------- Rahmen ----------
  function frame(ctx, x, y, w, h, opts = {}) {
    ctx.fillStyle = opts.bg || 'rgba(9,7,12,0.94)';
    ctx.fillRect(x, y, w, h);
    G.box(ctx, x, y, w, h, '#050407');
    G.box(ctx, x + 1, y + 1, w - 2, h - 2, '#4a4252');
    G.box(ctx, x + 2, y + 2, w - 4, h - 4, '#17131c');
    // Eckornamente
    const orn = opts.orn || '#8d7f66';
    [[x + 3, y + 3, 1, 1], [x + w - 4, y + 3, -1, 1], [x + 3, y + h - 4, 1, -1], [x + w - 4, y + h - 4, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      P(ctx, cx, cy, orn); P(ctx, cx + sx, cy, orn); P(ctx, cx, cy + sy, orn); P(ctx, cx + sx * 2, cy, '#4a4252'); P(ctx, cx, cy + sy * 2, '#4a4252');
    });
    if (opts.title) {
      const tw = Font.width(opts.title) + 12;
      R(ctx, x + 8, y - 5, tw, 11, '#0b090e');
      G.box(ctx, x + 8, y - 5, tw, 11, '#4a4252');
      Font.draw(ctx, opts.title, x + 14, y - 5, COL.hi);
    }
  }
  function paper(ctx, x, y, w, h, seed) {
    R(ctx, x + 3, y + 3, w, h, 'rgba(0,0,0,0.5)');
    R(ctx, x, y, w, h, '#cdc2a3');
    G.speck(ctx, x, y, w, h, '#b9ad8c', Math.floor(w * h / 18), seed || 3);
    G.speck(ctx, x, y, w, h, '#ddd3b6', Math.floor(w * h / 30), (seed || 3) + 1);
    R(ctx, x, y, w, 1, '#e2d9be'); R(ctx, x, y, 1, h, '#e2d9be');
    R(ctx, x + w - 1, y, 1, h, '#9e9376'); R(ctx, x, y + h - 1, w, 1, '#9e9376');
    // Knick und Flecken
    G.dither(ctx, x + Math.floor(w / 2), y + 1, 1, h - 2, '#b0a586');
    G.dither(ctx, x + w - 30, y + 8, 18, 12, 'rgba(120,90,50,0.25)');
    // ausgefranster unterer Rand
    for (let i = 0; i < w; i += 3) if (U.hash(i, seed || 1, 5) < 0.5) R(ctx, x + i, y + h - 1, 2, 2, '#050407');
  }
  function keycap(ctx, x, y, label) {
    const w = Font.width(label) + 5;
    R(ctx, x, y, w, 10, '#2a2530'); R(ctx, x, y + 9, w, 1, '#0b090e'); R(ctx, x, y, w, 1, '#5a5262');
    Font.draw(ctx, label, x + 3, y - 1, COL.hi);
    return w;
  }

  // ---------- Toasts / Banner ----------
  function toast(text) { if (toasts.length && toasts[toasts.length - 1].text === text) return; toasts.push({ text, t: 0 }); }
  function showBanner(text, sub) { banner = { text, sub, t: 0 }; }
  function drawToasts(ctx, dt) {
    if (toasts.length) {
      const tt = toasts[0];
      tt.t += dt;
      const life = 2.6 + Font.len(tt.text) * 0.02;
      const a = tt.t < 0.2 ? tt.t / 0.2 : tt.t > life - 0.4 ? Math.max(0, (life - tt.t) / 0.4) : 1;
      const w = Font.width(tt.text) + 16;
      const x = Math.round(VIEW_W / 2 - w / 2), y = 8;
      ctx.globalAlpha = a;
      R(ctx, x, y, w, 15, 'rgba(8,6,10,0.88)'); G.box(ctx, x, y, w, 15, '#3a3442');
      R(ctx, x + 2, y + 2, 1, 11, COL.hi);
      Font.draw(ctx, tt.text, x + 8, y + 2, COL.text);
      ctx.globalAlpha = 1;
      if (tt.t > life) toasts.shift();
    }
    if (banner) {
      banner.t += dt;
      const b = banner, life = 3.6;
      const a = b.t < 0.8 ? b.t / 0.8 : b.t > life - 1 ? Math.max(0, (life - b.t)) : 1;
      ctx.globalAlpha = a;
      Font.draw(ctx, b.text, VIEW_W / 2, 40, COL.text, { align: 'center', scale: 2, shadow: '#050407' });
      const lw = Font.width(b.text) * 2;
      R(ctx, VIEW_W / 2 - lw / 2, 62, lw, 1, '#5a5060');
      if (b.sub) Font.draw(ctx, b.sub, VIEW_W / 2, 65, COL.dim, { align: 'center' });
      ctx.globalAlpha = 1;
      if (b.t > life) banner = null;
    }
  }

  // ---------- HUD ----------
  const HUD_ICONS = {
    heart: G.fromRows(['.rr.rr.', 'rRRrRRr', 'rRWRRRr', 'rRRRRRr', '.rRRRr.', '..rRr..', '...r...'], { r: C.rd1, R: C.rd4, W: C.rd5 }),
    eye: G.fromRows(['..ppp..', '.p...p.', 'p..W..p', 'p.WkW.p', 'p..W..p', '.p...p.', '..ppp..'], { p: C.pu4, W: C.bn3, k: C.ink }),
    lamp: G.fromRows(['.....yy', '....yYy', 'ggggyYy', 'gGGGyYy', 'ggggyYy', '....yYy', '.....yy'], { g: C.st2, G: C.st4, y: C.yl2, Y: C.yl4 }),
  };
  function bar(ctx, x, y, w, v, col, back) {
    R(ctx, x, y, w + 2, 5, '#050407');
    R(ctx, x + 1, y + 1, w, 3, back || '#1d1a22');
    R(ctx, x + 1, y + 1, Math.round(w * U.clamp(v, 0, 1)), 3, col);
    R(ctx, x + 1, y + 1, Math.round(w * U.clamp(v, 0, 1)), 1, 'rgba(255,255,255,0.2)');
  }
  function hud(ctx, game) {
    const p = game.player;
    const x = 6, y = VIEW_H - 30;
    ctx.globalAlpha = game.hudAlpha;
    R(ctx, x - 2, y - 3, 76, 30, 'rgba(6,5,9,0.55)');
    ctx.drawImage(HUD_ICONS.heart, x, y);
    const hpLow = p.hp < 30 && Math.sin(game.time * 8) > 0;
    bar(ctx, x + 10, y + 1, 50, p.hp / 100, hpLow ? C.rd5 : C.rd3);
    ctx.drawImage(HUD_ICONS.eye, x, y + 9);
    bar(ctx, x + 10, y + 10, 50, p.sanity / 100, C.pu4);
    if (p.hasLamp()) {
      ctx.drawImage(HUD_ICONS.lamp, x, y + 18);
      const segs = Math.ceil(p.battery / 20);
      for (let i = 0; i < 5; i++) R(ctx, x + 11 + i * 7, y + 19, 6, 5, i < segs ? (p.battery < 20 ? C.rd4 : p.flashOn ? C.yl3 : C.yl1) : '#1d1a22');
      const nb = game.inv.batterie || 0;
      if (nb) Font.draw(ctx, 'x' + nb, x + 49, y + 16, COL.dim);
    }
    ctx.globalAlpha = 1;
    // Ausdauer über der Figur
    if (p.stamina < 99 && !p.hidden) {
      const sx = Math.round(p.x - game.cam.x - 8), sy = Math.round(p.y - game.cam.y + 4);
      R(ctx, sx, sy, 16, 3, '#050407');
      R(ctx, sx + 1, sy + 1, Math.round(14 * p.stamina / 100), 1, p.exhausted ? C.rd3 : C.bn2);
    }
  }
  function prompt(ctx, game, obj) {
    const label = obj.prompt();
    const cx = Math.round(obj.cx - game.cam.x);
    let top = obj.y * TS - game.cam.y - 14;
    if (obj.def.wall) top = obj.y * TS - game.cam.y - 10;
    if (obj.h > 1) top = obj.y * TS - game.cam.y - 14;
    const w = Font.width(label) + 20;
    const x = U.clamp(cx - Math.round(w / 2), 2, VIEW_W - w - 2), y = U.clamp(Math.round(top), 2, VIEW_H - 14);
    R(ctx, x, y, w, 12, 'rgba(8,6,10,0.85)'); G.box(ctx, x, y, w, 12, '#3a3442');
    keycap(ctx, x + 2, y + 1, 'E');
    Font.draw(ctx, label, x + 15, y + 1, COL.text);
  }

  // ---------- Overlays ----------
  class Dialog {
    constructor(text, opts = {}) {
      this.who = opts.who || null;
      this.color = opts.color || COL.text;
      this.lines = Font.wrap(text, VIEW_W - 44);
      this.pages = [];
      for (let i = 0; i < this.lines.length; i += 4) this.pages.push(this.lines.slice(i, i + 4));
      this.page = 0; this.chars = 0; this.t = 0; this.blipT = 0;
      this.speed = opts.speed || 48;
    }
    pageLen() { return this.pages[this.page].reduce((a, l) => a + Font.len(l), 0); }
    update(dt) {
      this.t += dt;
      const total = this.pageLen();
      if (this.chars < total) {
        const sp = Input.held('ok') ? this.speed * 3 : this.speed;
        const before = Math.floor(this.chars);
        this.chars = Math.min(total, this.chars + sp * dt);
        if (Math.floor(this.chars) !== before) { this.blipT -= 1; if (this.blipT <= 0) { Sound.play('blip'); this.blipT = 2; } }
        if (Input.hit('ok') && this.t > 0.15) this.chars = total;
      } else if (Input.hit('ok') || Input.hit('back')) {
        if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; Sound.play('ui'); }
        else { this.done = true; }
      }
    }
    draw(ctx) {
      const x = 10, h = 54, y = VIEW_H - h - 6, w = VIEW_W - 20;
      frame(ctx, x, y, w, h, { title: this.who });
      let left = this.chars;
      this.pages[this.page].forEach((l, i) => {
        const n = Math.min(Font.len(l), Math.max(0, Math.floor(left)));
        left -= Font.len(l);
        Font.draw(ctx, l, x + 12, y + 6 + i * Font.LINE, this.color, { max: n });
      });
      if (this.chars >= this.pageLen() && Math.sin(this.t * 6) > 0) Font.draw(ctx, '▼', x + w - 14, y + h - 12, COL.hi);
    }
  }

  class Choice {
    constructor(promptText, options, opts = {}) {
      this.text = promptText; this.options = options; this.sel = 0; this.t = 0;
      this.cancel = opts.cancel !== undefined ? opts.cancel : options.length - 1;
      this.lines = promptText ? Font.wrap(promptText, VIEW_W - 44) : [];
    }
    update(dt) {
      this.t += dt;
      if (Input.nav('up')) { this.sel = (this.sel + this.options.length - 1) % this.options.length; Sound.play('ui'); }
      if (Input.nav('down')) { this.sel = (this.sel + 1) % this.options.length; Sound.play('ui'); }
      if (Input.hit('ok') && this.t > 0.15) { this.result = this.sel; this.done = true; Sound.play('ok'); }
      else if (Input.hit('back') && this.cancel >= 0) { this.result = this.cancel; this.done = true; Sound.play('back'); }
    }
    draw(ctx) {
      const n = this.options.length;
      const h = 12 + (this.lines.length + n) * Font.LINE + (this.lines.length ? 4 : 0);
      const x = 10, y = VIEW_H - h - 6, w = VIEW_W - 20;
      frame(ctx, x, y, w, h);
      this.lines.forEach((l, i) => Font.draw(ctx, l, x + 12, y + 6 + i * Font.LINE, COL.text));
      const oy = y + 6 + this.lines.length * Font.LINE + (this.lines.length ? 4 : 0);
      this.options.forEach((o, i) => {
        const s = i === this.sel;
        if (s) { R(ctx, x + 8, oy + i * Font.LINE, w - 16, 10, 'rgba(232,196,106,0.08)'); if (Math.sin(this.t * 8) > -0.3) Font.draw(ctx, '▶', x + 12, oy + i * Font.LINE, COL.hi); }
        Font.draw(ctx, o, x + 22, oy + i * Font.LINE, s ? COL.hi : COL.dim);
      });
    }
  }

  // Theos Wachsmalbilder
  function crayon(ctx, art, x, y, w, h) {
    R(ctx, x, y, w, h, '#ece6d4');
    G.speck(ctx, x, y, w, h, '#ddd5bf', 60, art);
    const rnd = U.rng(art * 977 + 13);
    const ln = (x0, y0, x1, y1, c, th = 2) => {
      for (let k = 0; k < th; k++) G.line(ctx, x + x0 + (rnd() * 2 - 1), y + y0 + k + (rnd() * 2 - 1), x + x1 + (rnd() * 2 - 1), y + y1 + k + (rnd() * 2 - 1), c);
    };
    const scrib = (cx, cy, rw, rh, c, n = 18) => { for (let i = 0; i < n; i++) ln(cx + (rnd() - 0.5) * rw, cy + (rnd() - 0.5) * rh, cx + (rnd() - 0.5) * rw, cy + (rnd() - 0.5) * rh, c, 1); };
    const stick = (cx, by, c, hh = 22, head = '#e0b896', hair) => {
      G.ring(ctx, x + cx, y + by - hh, 4, head); if (hair) scrib(cx, by - hh - 3, 8, 3, hair, 8);
      ln(cx, by - hh + 4, cx, by - 8, c); ln(cx, by - 8, cx - 4, by, c); ln(cx, by - 8, cx + 4, by, c);
      ln(cx - 6, by - hh + 9, cx + 6, by - hh + 9, c);
    };
    const B = '#1b1820', RD = '#c0302c', GR = '#3f8a3a', BL = '#3d5fa8', YL = '#e2b23a', BR = '#7a4a26', GY = '#7d7b80';
    if (art === 1) {
      for (let i = 0; i < 6; i++) { const tx = 8 + i * 22; ln(tx, 46, tx + 6, 30, GR); ln(tx + 6, 30, tx + 12, 46, GR); ln(tx + 6, 46, tx + 6, 52, BR); }
      ln(10, 14, 120, 14, B, 2); ln(60, 14, 62, 4, B); ln(90, 14, 96, 26, B); ln(40, 14, 34, 26, B);
      R(ctx, x + 20, y + 62, 40, 12, RD); G.ring(ctx, x + 28, y + 75, 3, B); G.ring(ctx, x + 52, y + 75, 3, B);
      stick(78, 78, BL, 18); stick(94, 78, YL, 20, undefined, '#3a2412'); stick(108, 78, BL, 14);
    } else if (art === 2) {
      ln(20, 50, 120, 50, BR, 3); ln(26, 52, 26, 70, BR); ln(114, 52, 114, 70, BR);
      for (let i = 0; i < 4; i++) G.ring(ctx, x + 36 + i * 20, y + 46, 4, GY);
      ln(118, 30, 118, 70, BR); ln(118, 50, 132, 50, BR);
      G.ring(ctx, x + 126, y + 30, 4, '#e0e0e0'); scrib(126, 40, 10, 26, B, 30);
      Font.draw(ctx, 'ihr platz', x + 10, y + 70, RD);
    } else if (art === 3) {
      ln(46, 10, 96, 10, BR, 3); ln(46, 10, 46, 76, BR, 3); ln(96, 10, 96, 76, BR, 3); ln(46, 76, 96, 76, BR, 3); ln(71, 10, 71, 76, BR, 2);
      scrib(71, 40, 4, 50, B, 20);
      R(ctx, x + 68, y + 30, 2, 2, '#f0f0f0'); R(ctx, x + 72, y + 30, 2, 2, '#f0f0f0'); P(ctx, x + 69, y + 31, RD); P(ctx, x + 73, y + 31, RD);
      Font.draw(ctx, 'nicht aufmachen', x + 24, y + 78, RD);
    } else if (art === 4) {
      for (let k = 0; k < 3; k++) {
        const cx = 20 + k * 40, cy = 40 + (k % 2) * 10;
        ln(cx, cy, cx + 22, cy, GY, 2); G.ring(ctx, x + cx + 26, y + cy - 1, 3, GY);
        ln(cx + 2, cy, cx - 2, cy + 10, GY); ln(cx + 8, cy, cx + 10, cy + 10, GY); ln(cx + 16, cy, cx + 14, cy + 10, GY); ln(cx + 22, cy, cx + 24, cy + 10, GY);
      }
      Font.draw(ctx, 'LEISE sein!', x + 30, y + 72, RD, { scale: 1 });
    } else if (art === 5) {
      G.disc(ctx, x + 70, y + 54, 34, 12, '#5a7fc0'); G.disc(ctx, x + 70, y + 54, 26, 8, '#3d5fa8');
      R(ctx, x + 67, y + 48, 6, 2, GY); R(ctx, x + 65, y + 50, 10, 6, GY);
      for (let i = 0; i < 7; i++) { const fx = 10 + i * 19; ln(fx, 40, fx, 26, GR); scrib(fx, 22, 8, 7, RD, 10); }
    } else if (art === 6) {
      stick(40, 74, '#e0e0e0', 22, undefined, B); stick(64, 74, RD, 20, undefined, '#3a2412');
      ln(34, 38, 48, 76, B, 2); ln(48, 38, 34, 76, B, 2);
      ln(48, 58, 56, 58, B);
      for (let j = 0; j < 3; j++) ln(100 + j, 8, 100 + j, 78, B);
      G.ring(ctx, x + 101, y + 8, 4, '#e0e0e0'); scrib(101, 20, 8, 24, B, 18);
      ln(94, 30, 86, 60, B); ln(108, 30, 116, 62, B);
    }
  }

  class NoteView {
    constructor(id) {
      this.id = id; this.n = NOTES[id]; this.page = 0; this.t = 0;
      const drawing = this.n.kind === 'drawing';
      this.lineW = 232;
      const lines = Font.wrap(this.n.text, this.lineW);
      const per = drawing ? 5 : 14;
      this.pages = [];
      for (let i = 0; i < lines.length; i += per) this.pages.push(lines.slice(i, i + per));
      if (!this.pages.length) this.pages.push([]);
      Sound.play('page');
    }
    update(dt) {
      this.t += dt;
      if (Input.nav('right') || (Input.hit('ok') && this.page < this.pages.length - 1)) { if (this.page < this.pages.length - 1) { this.page++; Sound.play('page'); } }
      else if (Input.nav('left')) { if (this.page > 0) { this.page--; Sound.play('page'); } }
      else if ((Input.hit('ok') || Input.hit('back')) && this.t > 0.2) { this.done = true; Sound.play('page'); }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(3,2,5,0.7)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const w = 256, h = 200, x = Math.round(VIEW_W / 2 - w / 2), y = 8;
      paper(ctx, x, y, w, h, this.id.length * 7);
      Font.draw(ctx, this.n.title, x + w / 2, y + 7, COL.ink, { align: 'center' });
      R(ctx, x + 20, y + 19, w - 40, 1, '#9e9376');
      let ty = y + 25;
      if (this.n.kind === 'drawing') { crayon(ctx, this.n.art, x + 56, ty, 144, 90); G.box(ctx, x + 56, ty, 144, 90, '#9e9376'); ty += 96; }
      this.pages[this.page].forEach((l, i) => {
        Font.draw(ctx, l, x + 12, ty + i * Font.LINE, COL.ink);
      });
      if (this.pages.length > 1) {
        Font.draw(ctx, (this.page + 1) + '/' + this.pages.length, x + w - 12, y + h - 13, COL.ink2, { align: 'right' });
        if (this.page < this.pages.length - 1 && Math.sin(this.t * 5) > 0) Font.draw(ctx, '→', x + w - 34, y + h - 13, COL.ink2);
      }
      if (this.n.kind === 'page' && Game.notes.indexOf(this.id) >= 0) {
        Font.draw(ctx, this.n.letter, x + w - 20, y + 4, COL.red, { scale: 2 });
      }
    }
  }

  // Gemeinsame Kopfzeile der Menübildschirme
  function tabs(ctx, active) {
    const items = [['Inventar', 'I'], ['Tagebuch', 'J'], ['Karte', 'M']];
    let x = 18;
    items.forEach(([n, k], i) => {
      const a = i === active;
      const w = Font.width(n) + 26;
      R(ctx, x, 6, w, 14, a ? '#1d1822' : 'rgba(9,7,12,0.9)');
      G.box(ctx, x, 6, w, 14, a ? '#8d7f66' : '#3a3442');
      keycap(ctx, x + 3, 8, k);
      Font.draw(ctx, n, x + 16, 8, a ? COL.hi : COL.dim);
      x += w + 4;
    });
  }
  function menuSwitch(cur) {
    if (Input.hit('inv') && cur !== 'inv') return 'inv';
    if (Input.hit('journal') && cur !== 'journal') return 'journal';
    if (Input.hit('map') && cur !== 'map') return 'map';
    return null;
  }

  class InventoryView {
    constructor() { this.sel = 0; this.t = 0; this.msg = null; this.msgT = 0; }
    items() { return Object.keys(ITEMS).filter((k) => Game.inv[k] > 0); }
    update(dt) {
      this.t += dt; this.msgT -= dt;
      const it = this.items();
      const cols = 5;
      if (Input.nav('right')) { this.sel = Math.min(it.length - 1, this.sel + 1); Sound.play('ui'); }
      if (Input.nav('left')) { this.sel = Math.max(0, this.sel - 1); Sound.play('ui'); }
      if (Input.nav('down')) { this.sel = Math.min(it.length - 1, this.sel + cols); Sound.play('ui'); }
      if (Input.nav('up')) { this.sel = Math.max(0, this.sel - cols); Sound.play('ui'); }
      this.sel = U.clamp(this.sel, 0, Math.max(0, it.length - 1));
      const sw = menuSwitch('inv');
      if (sw) { this.done = true; this.next = sw; return; }
      if (Input.hit('back') || (Input.hit('inv') && this.t > 0.1)) { this.done = true; Sound.play('back'); return; }
      if (Input.hit('ok') && it.length) {
        const id = it[this.sel];
        const r = Story.useItem(id);
        if (r && r.note) { this.done = true; this.next = { note: r.note }; return; }
        if (r && r.msg) { this.msg = r.msg; this.msgT = 2.5; }
      }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(3,2,5,0.82)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      tabs(ctx, 0);
      const x = 16, y = 26, w = VIEW_W - 32, h = VIEW_H - 36;
      frame(ctx, x, y, w, h);
      const it = this.items();
      const cols = 5, cs = 26;
      for (let i = 0; i < 20; i++) {
        const cx = x + 10 + (i % cols) * cs, cy = y + 10 + Math.floor(i / cols) * cs;
        R(ctx, cx, cy, 24, 24, '#120f16'); G.box(ctx, cx, cy, 24, 24, '#2a2530');
        if (i < it.length) {
          ctx.drawImage(Icons.get(ITEMS[it[i]].icon || it[i]), cx + 4, cy + 4);
          if (ITEMS[it[i]].stack && Game.inv[it[i]] > 1) Font.draw(ctx, String(Game.inv[it[i]]), cx + 23, cy + 14, COL.text, { align: 'right', shadow: '#000' });
        }
        if (i === this.sel && it.length) { G.box(ctx, cx - 1, cy - 1, 26, 26, Math.sin(this.t * 6) > 0 ? COL.hi : '#8d7f66'); }
      }
      const px = x + 152, pw = w - 162;
      R(ctx, px - 6, y + 8, 1, h - 16, '#2a2530');
      if (it.length) {
        const d = ITEMS[it[this.sel]];
        Font.draw(ctx, d.name, px, y + 10, COL.hi);
        R(ctx, px, y + 21, Font.width(d.name), 1, '#5a5060');
        Font.wrap(d.desc, pw).forEach((l, i) => Font.draw(ctx, l, px, y + 26 + i * Font.LINE, COL.text));
        const act = d.use || d.read ? 'Benutzen' : 'Ansehen';
        keycap(ctx, px, y + h - 22, 'E'); Font.draw(ctx, act, px + 13, y + h - 23, COL.dim);
      } else Font.draw(ctx, 'Die Taschen sind leer.', px, y + 10, COL.dim);
      if (this.msg && this.msgT > 0) Font.draw(ctx, this.msg, x + 10, y + h - 22, COL.hi);
      // Werte
      const p = Game.player;
      Font.draw(ctx, 'Gesundheit ' + Math.ceil(p.hp) + '%', x + 10, y + 118, COL.dim);
      Font.draw(ctx, 'Verstand ' + Math.ceil(p.sanity) + '%', x + 10, y + 129, COL.dim);
      if (p.hasLamp()) Font.draw(ctx, 'Batterie ' + Math.ceil(p.battery) + '%', x + 10, y + 140, COL.dim);
    }
  }

  class JournalView {
    constructor() { this.col = 0; this.cat = 0; this.sel = 0; this.t = 0; this.scroll = 0; }
    cats() {
      const notes = Game.notes.filter((n) => NOTES[n].kind === 'note');
      const pages = Game.notes.filter((n) => NOTES[n].kind === 'page');
      const draws = Game.notes.filter((n) => NOTES[n].kind === 'drawing');
      return [
        { name: 'Aufgaben', list: null },
        { name: 'Notizen (' + notes.length + ')', list: notes },
        { name: 'Seiten (' + pages.length + '/4)', list: pages },
        { name: 'Bilder (' + draws.length + '/6)', list: draws },
      ];
    }
    update(dt) {
      this.t += dt;
      const cats = this.cats();
      const sw = menuSwitch('journal');
      if (sw) { this.done = true; this.next = sw; return; }
      if (Input.hit('back') || (Input.hit('journal') && this.t > 0.1)) { this.done = true; Sound.play('back'); return; }
      if (this.col === 0) {
        if (Input.nav('up')) { this.cat = (this.cat + cats.length - 1) % cats.length; this.sel = 0; Sound.play('ui'); }
        if (Input.nav('down')) { this.cat = (this.cat + 1) % cats.length; this.sel = 0; Sound.play('ui'); }
        if ((Input.nav('right') || Input.hit('ok')) && cats[this.cat].list && cats[this.cat].list.length) { this.col = 1; Sound.play('ui'); }
      } else {
        const list = cats[this.cat].list;
        if (Input.nav('up')) { this.sel = Math.max(0, this.sel - 1); Sound.play('ui'); }
        if (Input.nav('down')) { this.sel = Math.min(list.length - 1, this.sel + 1); Sound.play('ui'); }
        if (Input.nav('left')) { this.col = 0; Sound.play('ui'); }
        if (Input.hit('ok') && list.length) { this.done = true; this.next = { note: list[this.sel], back: 'journal' }; }
      }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(3,2,5,0.82)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      tabs(ctx, 1);
      const x = 16, y = 26, w = VIEW_W - 32, h = VIEW_H - 36;
      frame(ctx, x, y, w, h);
      const cats = this.cats();
      cats.forEach((c, i) => {
        const s = i === this.cat;
        if (s) R(ctx, x + 6, y + 9 + i * 14, 104, 12, this.col === 0 ? 'rgba(232,196,106,0.12)' : 'rgba(232,196,106,0.05)');
        Font.draw(ctx, c.name, x + 12, y + 10 + i * 14, s ? COL.hi : COL.dim);
      });
      R(ctx, x + 116, y + 8, 1, h - 16, '#2a2530');
      const px = x + 124, pw = w - 134;
      const c = cats[this.cat];
      if (!c.list) {
        const objs = Story.objectives();
        let yy = y + 10;
        objs.forEach((o) => {
          const lines = Font.wrap(o.text, pw - 14);
          R(ctx, px, yy + 2, 7, 7, '#050407'); G.box(ctx, px, yy + 2, 7, 7, o.done ? '#5a5060' : COL.hi);
          if (o.done) { G.line(ctx, px + 1, yy + 5, px + 3, yy + 7, '#8d7f66'); G.line(ctx, px + 3, yy + 7, px + 6, yy + 2, '#8d7f66'); }
          lines.forEach((l, i) => Font.draw(ctx, l, px + 12, yy + i * Font.LINE, o.done ? '#4e4a58' : (o.main ? COL.text : COL.dim)));
          yy += lines.length * Font.LINE + 3;
        });
        Font.draw(ctx, 'Spielzeit ' + U.fmtTime(Game.playTime), x + w - 10, y + h - 14, '#4e4a58', { align: 'right' });
      } else if (!c.list.length) {
        Font.draw(ctx, 'Noch nichts gefunden.', px, y + 10, COL.dim);
      } else {
        const max = 13;
        const start = Math.max(0, Math.min(this.sel - 6, c.list.length - max));
        c.list.slice(start, start + max).forEach((id, k) => {
          const i = start + k;
          const s = i === this.sel && this.col === 1;
          if (s) R(ctx, px - 4, y + 9 + k * 12, pw, 11, 'rgba(232,196,106,0.12)');
          let t = NOTES[id].title;
          if (NOTES[id].kind === 'page') t += '   ' + NOTES[id].letter;
          Font.draw(ctx, t, px, y + 10 + k * 12, s ? COL.hi : COL.text);
        });
      }
    }
  }

  class MapView {
    constructor() { this.t = 0; }
    update(dt) {
      this.t += dt;
      const sw = menuSwitch('map');
      if (sw) { this.done = true; this.next = sw; return; }
      if (Input.hit('back') || Input.hit('ok') || (Input.hit('map') && this.t > 0.1)) { this.done = true; Sound.play('back'); }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(3,2,5,0.86)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      tabs(ctx, 2);
      const x = 16, y = 26, w = VIEW_W - 32, h = VIEW_H - 36;
      frame(ctx, x, y, w, h, { title: Game.world.name });
      const wd = Game.world;
      const s = Math.max(2, Math.min(6, Math.floor(Math.min((w - 20) / wd.w, (h - 30) / wd.h))));
      const ox = Math.round(x + w / 2 - (wd.w * s) / 2), oy = Math.round(y + 12 + (h - 30) / 2 - (wd.h * s) / 2);
      for (let ty = 0; ty < wd.h; ty++) for (let tx = 0; tx < wd.w; tx++) {
        if (!wd.seen[ty * wd.w + tx]) continue;
        const ch = wd.tileAt(tx, ty);
        let c;
        if (Tiles.isWall(ch)) c = '#5a5266';
        else if (ch === '~') c = '#1f3350';
        else if (ch === 'T' || ch === 't' || ch === 'o') c = '#14241a';
        else if (ch === ',' || ch === ';') c = '#1c2a1d';
        else if (ch === 'd') c = '#9a5a26';
        else if (Tiles.isSolid(ch)) c = '#2a2630';
        else c = '#221e2a';
        R(ctx, ox + tx * s, oy + ty * s, s, s, c);
      }
      wd.objects.forEach((o) => {
        if (!o.exists() || !wd.seen[o.y * wd.w + o.x]) return;
        let c = null;
        if (o.type === 'guestbook') c = C.yl4;
        else if (o.type === 'stairs' || o.type === 'ladder' || o.type === 'hatch') c = C.bl5;
        else if (o.type === 'door' && o.p.to) c = C.or4;
        else if (o.type === 'door' && o.p.locked && !o.st.unlocked) c = C.rd4;
        if (c) R(ctx, ox + o.x * s, oy + o.y * s, Math.max(2, s * o.w - 1), Math.max(2, s - 1), c);
      });
      const p = Game.player;
      if (Math.sin(this.t * 8) > -0.2) { R(ctx, ox + (p.x / TS) * s - 2, oy + (p.y / TS) * s - 2, 4, 4, C.rd5); }
      const ly = y + h - 14;
      R(ctx, x + 10, ly + 3, 5, 5, C.rd5); Font.draw(ctx, 'Ich', x + 18, ly, COL.dim);
      R(ctx, x + 44, ly + 3, 5, 5, C.yl4); Font.draw(ctx, 'Gästebuch', x + 52, ly, COL.dim);
      R(ctx, x + 112, ly + 3, 5, 5, C.bl5); Font.draw(ctx, 'Treppe', x + 120, ly, COL.dim);
      R(ctx, x + 162, ly + 3, 5, 5, C.rd4); Font.draw(ctx, 'verschlossen', x + 170, ly, COL.dim);
    }
  }

  class ListMenu {
    constructor(title, items, opts = {}) { this.title = title; this.items = items; this.sel = 0; this.t = 0; this.opts = opts; }
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      if (Input.nav('up')) { this.sel = (this.sel + n - 1) % n; Sound.play('ui'); }
      if (Input.nav('down')) { this.sel = (this.sel + 1) % n; Sound.play('ui'); }
      const it = this.items[this.sel];
      if (it.adjust) {
        if (Input.nav('left')) { it.adjust(-1); Sound.play('ui'); }
        if (Input.nav('right')) { it.adjust(1); Sound.play('ui'); }
      }
      if (Input.hit('ok') && this.t > 0.1) {
        if (it.disabled) { Sound.play('locked'); return; }
        Sound.play('ok');
        if (it.adjust) it.adjust(1);
        else { this.result = it.id; this.done = true; }
      } else if (Input.hit('back') && this.t > 0.1) { this.result = 'back'; this.done = true; Sound.play('back'); }
    }
    draw(ctx) {
      if (!this.opts.noDim) { ctx.fillStyle = 'rgba(3,2,5,0.75)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
      const w = this.opts.w || 180, h = 22 + this.items.length * 14;
      const x = Math.round(VIEW_W / 2 - w / 2), y = this.opts.y || Math.round(VIEW_H / 2 - h / 2);
      frame(ctx, x, y, w, h, { title: this.title });
      this.items.forEach((it, i) => {
        const s = i === this.sel;
        const yy = y + 12 + i * 14;
        if (s) { R(ctx, x + 6, yy - 1, w - 12, 12, 'rgba(232,196,106,0.1)'); if (Math.sin(this.t * 8) > -0.3) Font.draw(ctx, '▶', x + 10, yy, COL.hi); }
        Font.draw(ctx, it.label, x + 20, yy, it.disabled ? '#3e3a46' : s ? COL.hi : COL.text);
        if (it.value) Font.draw(ctx, it.value(), x + w - 12, yy, s ? COL.hi : COL.dim, { align: 'right' });
      });
    }
  }

  class ControlsView {
    constructor() { this.t = 0; }
    update(dt) { this.t += dt; if ((Input.hit('ok') || Input.hit('back')) && this.t > 0.15) { this.done = true; Sound.play('back'); } }
    draw(ctx) {
      ctx.fillStyle = 'rgba(3,2,5,0.85)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const w = 300, h = 184, x = Math.round(VIEW_W / 2 - w / 2), y = 16;
      frame(ctx, x, y, w, h, { title: 'Steuerung' });
      const rows = [
        ['WASD / Pfeile', 'Gehen'], ['Shift', 'Rennen (laut!)'], ['Strg / C', 'Schleichen (leise)'],
        ['E / Leertaste', 'Untersuchen, benutzen, weiter'], ['F', 'Taschenlampe an/aus'], ['R', 'Batterie wechseln'],
        ['I / Tab', 'Inventar'], ['J', 'Tagebuch & Aufgaben'], ['M', 'Karte'], ['Esc', 'Pause'],
      ];
      rows.forEach(([k, v], i) => { Font.draw(ctx, k, x + 14, y + 12 + i * 12, COL.hi); Font.draw(ctx, v, x + 112, y + 12 + i * 12, COL.text); });
      Font.wrap('Licht beruhigt – aber es verrät dich. Wer rennt, wird gehört. In Schränken und unter Betten kann man sich verstecken.', w - 28)
        .forEach((l, i) => Font.draw(ctx, l, x + 14, y + 140 + i * 11, COL.dim));
    }
  }

  class CodeLock {
    constructor(title) { this.title = title || 'Tresor'; this.d = [0, 0, 0, 0]; this.i = 0; this.t = 0; this.shakeT = 0; }
    update(dt) {
      this.t += dt; this.shakeT -= dt;
      if (Input.nav('left')) { this.i = (this.i + 3) % 4; Sound.play('ui'); }
      if (Input.nav('right')) { this.i = (this.i + 1) % 4; Sound.play('ui'); }
      if (Input.nav('up')) { this.d[this.i] = (this.d[this.i] + 1) % 10; Sound.play('click'); }
      if (Input.nav('down')) { this.d[this.i] = (this.d[this.i] + 9) % 10; Sound.play('click'); }
      Input.typed.forEach((ch) => { if (ch >= '0' && ch <= '9') { this.d[this.i] = +ch; this.i = Math.min(3, this.i + 1); Sound.play('click'); } });
      if (Input.hit('back')) { this.result = null; this.done = true; Sound.play('back'); }
      else if (Input.hit('ok') && this.t > 0.15) { this.result = this.d.join(''); this.done = true; }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(3,2,5,0.75)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const w = 200, h = 112, x = Math.round(VIEW_W / 2 - w / 2), y = 40;
      frame(ctx, x, y, w, h, { title: this.title });
      R(ctx, x + 20, y + 16, w - 40, 56, '#1a1c20'); G.box(ctx, x + 20, y + 16, w - 40, 56, '#4a4e56');
      for (let k = 0; k < 4; k++) {
        const cx = x + 34 + k * 34, cy = y + 26;
        R(ctx, cx, cy, 24, 34, '#0b0c0e'); G.box(ctx, cx, cy, 24, 34, k === this.i ? COL.hi : '#3a3e45');
        R(ctx, cx + 1, cy + 1, 22, 3, 'rgba(255,255,255,0.05)');
        Font.draw(ctx, String((this.d[k] + 9) % 10), cx + 12, cy - 1, '#3a3e45', { align: 'center' });
        Font.draw(ctx, String(this.d[k]), cx + 12, cy + 8, '#d8cfb8', { align: 'center', scale: 2 });
        Font.draw(ctx, String((this.d[k] + 1) % 10), cx + 12, cy + 25, '#3a3e45', { align: 'center' });
        if (k === this.i && Math.sin(this.t * 6) > 0) { Font.draw(ctx, '↑', cx + 12, cy - 13, COL.hi, { align: 'center' }); }
      }
      Font.draw(ctx, '↑↓ Ziffer   ←→ Rad   E Öffnen   Esc Zurück', x + w / 2, y + h - 18, COL.dim, { align: 'center' });
    }
  }

  class PianoView {
    constructor(hasSheet) {
      this.keys = ['C', 'D', 'E', 'F', 'G', 'A', 'H', 'C2'];
      this.sel = 5; this.played = []; this.t = 0; this.hasSheet = hasSheet; this.flash = {}; this.solved = false; this.wrongT = 0;
    }
    press(i) {
      const n = this.keys[i];
      Sound.play('piano', n);
      this.flash[i] = 0.25;
      this.played.push(n);
      if (this.played.length > 8) this.played.shift();
      const target = Sound.LULLABY;
      if (this.played.length === 8 && this.played.every((v, k) => v === target[k])) { this.solved = true; this.doneT = 1.6; }
    }
    update(dt) {
      this.t += dt;
      for (const k in this.flash) this.flash[k] -= dt;
      if (this.solved) { this.doneT -= dt; if (this.doneT <= 0) { this.result = true; this.done = true; } return; }
      if (Input.nav('left')) { this.sel = (this.sel + 7) % 8; Sound.play('ui'); }
      if (Input.nav('right')) { this.sel = (this.sel + 1) % 8; Sound.play('ui'); }
      if (Input.hit('ok') && this.t > 0.15) this.press(this.sel);
      Input.typed.forEach((ch) => { if (ch >= '1' && ch <= '8') { this.sel = +ch - 1; this.press(this.sel); } });
      if (Input.hit('back')) { this.result = false; this.done = true; Sound.play('back'); }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(3,2,5,0.78)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const w = 300, h = 170, x = Math.round(VIEW_W / 2 - w / 2), y = 22;
      frame(ctx, x, y, w, h, { title: 'Klavier' });
      const kx = x + 30, ky = y + 46, kw = 30, kh = 74;
      R(ctx, kx - 6, ky - 8, kw * 8 + 12, kh + 14, '#121014');
      R(ctx, kx - 6, ky - 8, kw * 8 + 12, 2, '#3c3644');
      for (let i = 0; i < 8; i++) {
        const fl = this.flash[i] > 0;
        R(ctx, kx + i * kw, ky, kw - 2, kh, fl ? '#f5ecc8' : '#d8d0bc');
        R(ctx, kx + i * kw, ky + kh - 4, kw - 2, 4, '#a89f8a');
        if (i === this.sel) G.box(ctx, kx + i * kw - 1, ky - 1, kw, kh + 2, Math.sin(this.t * 6) > 0 ? COL.hi : '#8d7f66');
        const lbl = this.keys[i] === 'C2' ? 'C' : this.keys[i];
        Font.draw(ctx, lbl, kx + i * kw + kw / 2 - 1, ky + kh - 16, '#3a3632', { align: 'center' });
        Font.draw(ctx, String(i + 1), kx + i * kw + kw / 2 - 1, ky + kh + 4, COL.dim, { align: 'center' });
      }
      [0, 1, 3, 4, 5].forEach((i) => R(ctx, kx + i * kw + kw - 9, ky, 14, 44, '#141216'));
      const seq = this.played.map((n) => (n === 'C2' ? 'C' : n)).join(' ');
      Font.draw(ctx, seq || '...', x + w / 2, y + 14, this.solved ? COL.hi : COL.text, { align: 'center' });
      if (this.hasSheet) Font.draw(ctx, 'Theos Blatt:  a  C(hoch)  h  g  a  e  f  e', x + w / 2, y + 28, COL.dim, { align: 'center' });
      Font.draw(ctx, '←→ Taste   E spielen   1-8 direkt   Esc Zurück', x + w / 2, y + h - 14, COL.dim, { align: 'center' });
    }
  }

  return {
    COL, frame, paper, keycap, toast, showBanner, drawToasts, hud, prompt, crayon,
    Dialog, Choice, NoteView, InventoryView, JournalView, MapView, ListMenu, ControlsView, CodeLock, PianoView,
    clearToasts() { toasts = []; banner = null; },
  };
})();
