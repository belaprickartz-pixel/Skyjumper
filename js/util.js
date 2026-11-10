'use strict';
// ------------------------------------------------------------
//  Kleine Helfer, Zufall, Eingabe
// ------------------------------------------------------------
const TAU = Math.PI * 2;
const VIEW_W = 384, VIEW_H = 216, TS = 16;

const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
  rand: (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  chance: (p) => Math.random() < p,
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  approach(v, t, d) { return v < t ? Math.min(v + d, t) : Math.max(v - d, t); },
  // deterministisches Rauschen pro Kachel
  hash(x, y, s = 0) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  },
  hstr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },
  rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  },
  dirVec(dir) {
    switch (dir) {
      case 'up': return [0, -1];
      case 'down': return [0, 1];
      case 'left': return [-1, 0];
      default: return [1, 0];
    }
  },
  dirAngle(dir) {
    switch (dir) {
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
      case 'left': return Math.PI;
      default: return 0;
    }
  },
  angleToDir(a) {
    const d = Math.round(a / (Math.PI / 2));
    return ['right', 'down', 'left', 'up'][((d % 4) + 4) % 4];
  },
  angDiff(a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  },
  fmtTime(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const p = (n) => (n < 10 ? '0' : '') + n;
    return (h > 0 ? h + ':' : '') + p(m) + ':' + p(s);
  },
};

// Deutsche Zahlwörter (1..100) – für das Zählen
U.numWord = (function () {
  const ones = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
    'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
  return function (n) {
    if (n >= 100) return 'hundert';
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10), o = n % 10;
    if (o === 0) return tens[t];
    return (o === 1 ? 'ein' : ones[o]) + 'und' + tens[t];
  };
})();

// ------------------------------------------------------------
//  Eingabe
// ------------------------------------------------------------
const Input = {
  keys: {},
  hitK: {},
  navK: {},
  typed: [],
  bind: {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    ok: ['KeyE', 'Space', 'Enter', 'NumpadEnter'],
    back: ['Escape', 'Backspace'],
    pause: ['Escape', 'KeyP'],
    flash: ['KeyF'],
    reload: ['KeyR'],
    inv: ['KeyI', 'Tab'],
    journal: ['KeyJ'],
    map: ['KeyM'],
    sprint: ['ShiftLeft', 'ShiftRight'],
    sneak: ['ControlLeft', 'ControlRight', 'KeyC'],
    hold: ['Space'],
  },
  init() {
    const block = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace']);
    window.addEventListener('keydown', (e) => {
      if (block.has(e.code) || (e.ctrlKey && e.code !== 'ControlLeft' && e.code !== 'ControlRight')) e.preventDefault();
      if (!e.repeat) { this.hitK[e.code] = true; this.any = true; }
      this.navK[e.code] = true;
      this.keys[e.code] = true;
      if (e.key && e.key.length === 1) this.typed.push(e.key);
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('mousedown', () => { this.any = true; this.click = true; });
  },
  held(a) { return this.bind[a].some((k) => this.keys[k]); },
  hit(a) { return this.bind[a].some((k) => this.hitK[k]); },
  nav(a) { return this.bind[a].some((k) => this.navK[k]); },
  key(code) { return !!this.hitK[code]; },
  consume(a) { this.bind[a].forEach((k) => { this.hitK[k] = false; this.navK[k] = false; }); },
  endFrame() { this.hitK = {}; this.navK = {}; this.typed = []; this.any = false; this.click = false; },
};
