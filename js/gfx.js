'use strict';
// ------------------------------------------------------------
//  Palette, Zeichenhelfer, Sprite-Cache, Inventar-Icons
// ------------------------------------------------------------
const C = {
  void: '#07060a', ink: '#0e0c12', ink2: '#16131c',
  st0: '#17151c', st1: '#211f28', st2: '#2e2b37', st3: '#3e3a48', st4: '#555064', st5: '#736d83', st6: '#9a93a6', st7: '#c4bdcc',
  wd0: '#1a110d', wd1: '#2a1b13', wd2: '#3b271b', wd3: '#4f3524', wd4: '#68472f', wd5: '#86603f', wd6: '#a67d52',
  gr0: '#0b120d', gr1: '#132016', gr2: '#1b2b1d', gr3: '#253b26', gr4: '#334e30', gr5: '#4a6741', gr6: '#6b8a55',
  rd0: '#22080b', rd1: '#3d0e13', rd2: '#5c151b', rd3: '#7e1d24', rd4: '#a52a2f', rd5: '#cc4a43',
  bl0: '#0a0f17', bl1: '#111a27', bl2: '#1a283b', bl3: '#283d55', bl4: '#3f5d7a', bl5: '#6a8cab', bl6: '#a3bfd6',
  yl0: '#3a2d12', yl1: '#5e4a1f', yl2: '#8c6d2c', yl3: '#c39a3f', yl4: '#e8c46a', yl5: '#fbe8a6',
  sk1: '#6b4e44', sk2: '#9c7a68', sk3: '#c8a38c', sk4: '#e0c0a6',
  bn0: '#5d574d', bn1: '#8d8676', bn2: '#b9b19d', bn3: '#ddd5bf', bn4: '#f0ead8',
  pu0: '#140e1a', pu1: '#1d1424', pu2: '#2d1d38', pu3: '#46305a', pu4: '#6a4c84',
  or2: '#7a3d14', or3: '#b8601f', or4: '#e8913a', or5: '#ffc56a',
  cy2: '#1d3a3f', cy3: '#2f5d63', cy4: '#5a9198',
};

function mkCanvas(w, h, read) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
  const x = c.getContext('2d', read ? { willReadFrequently: true } : undefined);
  x.imageSmoothingEnabled = false;
  return [c, x];
}

const G = {
  R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); },
  P(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); },
  // Rahmen (1px)
  box(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h); },
  // Pixel-Linie (Bresenham)
  line(ctx, x0, y0, x1, y1, c) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    ctx.fillStyle = c;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 500; i++) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },
  // gefüllter Pixelkreis / Ellipse
  disc(ctx, cx, cy, rx, ry, c) {
    ctx.fillStyle = c;
    ry = ry === undefined ? rx : ry;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
      ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  },
  ring(ctx, cx, cy, r, c) {
    ctx.fillStyle = c;
    for (let a = 0; a < 64; a++) {
      const t = (a / 64) * TAU;
      ctx.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 1, 1);
    }
  },
  // Schachbrett-Dither über ein Rechteck
  dither(ctx, x, y, w, h, c, phase = 0) {
    ctx.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((i + j + phase) & 1) === 0) ctx.fillRect(x + i, y + j, 1, 1);
  },
  // Streupixel deterministisch
  speck(ctx, x, y, w, h, c, n, seed) {
    ctx.fillStyle = c;
    for (let i = 0; i < n; i++) {
      const px = Math.floor(U.hash(seed, i, 3) * w), py = Math.floor(U.hash(seed, i, 7) * h);
      ctx.fillRect(x + px, y + py, 1, 1);
    }
  },
  // Kontur um ein Sprite-Canvas legen
  outline(src, color) {
    const [c, x] = mkCanvas(src.width + 2, src.height + 2);
    const [m, mx] = mkCanvas(src.width, src.height);
    mx.drawImage(src, 0, 0);
    mx.globalCompositeOperation = 'source-in';
    mx.fillStyle = color; mx.fillRect(0, 0, src.width, src.height);
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(m, dx, dy);
    x.drawImage(src, 1, 1);
    return c;
  },
  flipX(src) {
    const [c, x] = mkCanvas(src.width, src.height);
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  },
  tint(src, color, a) {
    const [c, x] = mkCanvas(src.width, src.height);
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = a; x.fillStyle = color; x.fillRect(0, 0, src.width, src.height);
    return c;
  },
  // Sprite aus Textzeilen (Palette als Objekt)
  fromRows(rows, pal) {
    const h = rows.length, w = rows[0].length;
    const [c, x] = mkCanvas(w, h);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const k = rows[j][i];
        if (k !== '.' && pal[k]) { x.fillStyle = pal[k]; x.fillRect(i, j, 1, 1); }
      }
    }
    return c;
  },
};

// Sprite-Cache
const Spr = {
  cache: new Map(),
  get(key, w, h, fn) {
    let c = this.cache.get(key);
    if (!c) {
      const [cv, x] = mkCanvas(w, h);
      fn(x, cv);
      c = cv;
      this.cache.set(key, c);
    }
    return c;
  },
};

// ------------------------------------------------------------
//  Inventar-Icons (16x16), von Hand gepixelt
// ------------------------------------------------------------
const Icons = (function () {
  const base = { k: C.void, w: C.bn3, W: C.bn4, g: C.st4, G: C.st6, d: C.st2, D: C.st3 };
  const defs = {
    taschenlampe: {
      pal: { y: C.yl4, Y: C.yl5, o: C.yl2, r: C.rd3 },
      rows: [
        '................',
        '..........kkk...',
        '.........kYYYk..',
        '........kYyyyYk.',
        '.......kyyyyyyk.',
        '......kGkyyyyk..',
        '.....kGGGkyyk...',
        '....kDGGGGkk....',
        '...kDDGGGk......',
        '..kDDDGGk.......',
        '.kdDDDGk........',
        '.kddDrk.........',
        '.kdddk..........',
        '..kdk...........',
        '...k............',
        '................',
      ],
    },
    batterie: {
      pal: { r: C.rd3, R: C.rd4, y: C.yl3, Y: C.yl4 },
      rows: [
        '................',
        '......kkkk......',
        '......kGGk......',
        '....kkkkkkkk....',
        '....kRRRRRrk....',
        '....kRWRRRrk....',
        '....kRWRRRrk....',
        '....kRRRRRrk....',
        '....kYYYYYyk....',
        '....kYwYYYyk....',
        '....kYYYYYyk....',
        '....kYYYYYyk....',
        '....kYYYYYyk....',
        '....kyyyyyyk....',
        '....kkkkkkkk....',
        '................',
      ],
    },
    verband: {
      pal: { r: C.rd4, b: C.bn2 },
      rows: [
        '................',
        '................',
        '....kkkkkkk.....',
        '...kWWWWWWWk....',
        '..kWwwwwwwwWk...',
        '..kWwbbbbbwWk...',
        '..kWbkkkkkbWk...',
        '..kWbk...kbWk...',
        '..kWbkkkkkbWk...',
        '..kWwbbbbbwWkkkk',
        '..kWWwwwwwWWWWWk',
        '...kWWrWWWWwwwwk',
        '....kkrkkkkkkkkk',
        '......r.........',
        '................',
        '................',
      ],
    },
    tabletten: {
      pal: { o: C.or3, O: C.or4, l: C.bn2 },
      rows: [
        '................',
        '.....kkkkkk.....',
        '.....kWWWWk.....',
        '.....kwwwwk.....',
        '.....kkkkkk.....',
        '....kOOOOOok....',
        '....kOWWWWok....',
        '....kOWllWok....',
        '....kOWllWok....',
        '....kOWWWWok....',
        '....kOOOOOok....',
        '....kOOOOOok....',
        '....kOOOOOok....',
        '....kooooook....',
        '.....kkkkkk.....',
        '................',
      ],
    },
    streichhoelzer: {
      pal: { r: C.rd4, b: C.bl3, B: C.bl4, y: C.yl3, t: C.wd5 },
      rows: [
        '................',
        '............r...',
        '...........rk...',
        '..........tk....',
        '.........tk.....',
        '........tk......',
        '..kkkkkkkkkkkk..',
        '..kBBBBBBBBBBk..',
        '..kByyyyyyyyBk..',
        '..kBy.rrrr.yBk..',
        '..kBy.rkkr.yBk..',
        '..kByyyyyyyyBk..',
        '..kbbbbbbbbbbk..',
        '..kkkkkkkkkkkk..',
        '................',
        '................',
      ],
    },
    schluessel: {
      pal: { y: C.yl3, Y: C.yl4, o: C.yl1 },
      rows: [
        '................',
        '................',
        '................',
        '...kkkk.........',
        '..kYYYYk........',
        '.kYyookYk.......',
        '.kYok.kYkkkkkkk.',
        '.kYok.kYYYYYYYYk',
        '.kyyookyyyyyyyyk',
        '..kyyyykkkkykykk',
        '...kkkk....kyk..',
        '...........kk...',
        '................',
        '................',
        '................',
        '................',
      ],
    },
    brecheisen: {
      pal: { r: C.rd3, R: C.rd4 },
      rows: [
        '.............kk.',
        '............kRk.',
        '...........kRrk.',
        '..........kRrk..',
        '.........kRrk...',
        '........kRrk....',
        '.......kRrk.....',
        '......kRrk......',
        '.....kRrk.......',
        '....kRrk........',
        '...kRrk.........',
        '..kRrk..........',
        '.kRrk...........',
        '.kRk............',
        'kRRrkk..........',
        '.kkkk...........',
      ],
    },
    sicherung: {
      pal: { c: C.bl4, C: C.bl5, y: C.yl4 },
      rows: [
        '................',
        '................',
        '.....kkkkkk.....',
        '....kGGGGGGk....',
        '....kgggggGk....',
        '....kkkkkkkk....',
        '.....kCCCck.....',
        '.....kCwyck.....',
        '.....kCwyck.....',
        '.....kCwyck.....',
        '.....kCCCck.....',
        '....kkkkkkkk....',
        '....kGGGGGGk....',
        '....kggggggk....',
        '.....kkkkkk.....',
        '................',
      ],
    },
    notenblatt: {
      pal: { p: C.bn2, P: C.bn3, n: C.ink },
      rows: [
        '................',
        '..kkkkkkkkkkk...',
        '..kPPPPPPPPPPk..',
        '..kPdddddddddk..',
        '..kPPPPPnPPPPk..',
        '..kPdddnndddPk..',
        '..kPPnPPnPPPPk..',
        '..kPdnnddddnPk..',
        '..kPnnPPPPnnPk..',
        '..kPdddddnnddk..',
        '..kPPPPPPPPPPk..',
        '..kPdddddddddk..',
        '..kPPPPPPPPPpk..',
        '..kpPPPPPPPppk..',
        '..kkkkkkkkkkk...',
        '................',
      ],
    },
    kurbel: {
      pal: { r: C.wd4, R: C.wd5 },
      rows: [
        '................',
        '...kkk..........',
        '..kRRrk.........',
        '..kRRrk.........',
        '..kRrrk.........',
        '..kkGkk.........',
        '....kGk.........',
        '....kGk.........',
        '....kGkkkkkkk...',
        '....kGGGGGGGGk..',
        '....kgggggggGk..',
        '.....kkkkkkkGk..',
        '...........kGk..',
        '..........kGGGk.',
        '..........kgggk.',
        '...........kkk..',
      ],
    },
    ventilrad: {
      pal: { r: C.rd3, R: C.rd4 },
      rows: [
        '................',
        '.....kkkkkk.....',
        '...kkRRRRRRkk...',
        '..kRrkkRRkkrRk..',
        '..kRk..kk..kRk..',
        '.kRk...kk...kRk.',
        '.kRkk..kk..kkRk.',
        '.kRRRkkGGkkRRRk.',
        '.kRRRkkGGkkRRRk.',
        '.kRkk..kk..kkRk.',
        '.kRk...kk...kRk.',
        '..kRk..kk..kRk..',
        '..kRrkkRRkkrRk..',
        '...kkrrrrrrkk...',
        '.....kkkkkk.....',
        '................',
      ],
    },
    glocke: {
      pal: { s: C.st5, S: C.st7, b: C.wd3 },
      rows: [
        '.......kk.......',
        '......kbbk......',
        '......kkkk......',
        '.....kSSSSk.....',
        '....kSSWSSsk....',
        '....kSSWSSsk....',
        '....kSSSSSsk....',
        '...kSSSSSSssk...',
        '...kSSSSSSssk...',
        '..kSSSSSSSsssk..',
        '..kSSSSSSSsssk..',
        '.kSSSSSSSSssssk.',
        '.kkkkkkkkkkkkkk.',
        '.......kGk......',
        '........k.......',
        '................',
      ],
    },
    seite: {
      pal: { p: C.bn1, P: C.bn2, r: C.rd3, l: C.st5 },
      rows: [
        '................',
        '...kkkkkkkkkk...',
        '...kPPPPPPPPPk..',
        '...kPllllllPPk..',
        '...kPPPPPPPPPk..',
        '...kPlllllllPk..',
        '...kPPPPPPPPPk..',
        '...kPllllPPPPk..',
        '...kPPPPPPPPPk..',
        '...kPPPrrrPPPk..',
        '...kPPrPPPrPPk..',
        '...kPPPrrrPPPk..',
        '...kPPPPPPPPpk..',
        '...kpPPPPPPppk..',
        '...kkkkkkkkkk...',
        '................',
      ],
    },
    zeichnung: {
      pal: { p: C.bn3, b: C.bl4, r: C.rd4, y: C.yl4, g: C.gr5 },
      rows: [
        '................',
        '..kkkkkkkkkkkk..',
        '..kppppppppppk..',
        '..kpyyppppbbpk..',
        '..kpyyppppbbpk..',
        '..kpppprrpppbk..',
        '..kpppprrppppk..',
        '..kppprrrrpppk..',
        '..kpppprrppppk..',
        '..kppprpprpppk..',
        '..kppppppppppk..',
        '..kggggggggggk..',
        '..kggggggggggk..',
        '..kkkkkkkkkkkk..',
        '................',
        '................',
      ],
    },
  };
  const cache = {};
  const keyColors = {
    torschluessel: { y: C.st5, Y: C.st6, o: C.st3 },
    messingschluessel: { y: C.yl3, Y: C.yl4, o: C.yl1 },
    gewaechshausschluessel: { y: C.gr5, Y: C.gr6, o: C.gr3 },
    kapellenschluessel: { y: C.st6, Y: C.bn3, o: C.st4 },
    kellerschluessel: { y: C.wd5, Y: C.wd6, o: C.wd3 },
  };
  function get(id) {
    if (cache[id]) return cache[id];
    let def = defs[id];
    let pal;
    if (!def && keyColors[id]) { def = defs.schluessel; pal = Object.assign({}, base, def.pal, keyColors[id]); }
    if (!def && id.startsWith('glocke')) def = defs.glocke;
    if (!def) def = defs.seite;
    if (!pal) pal = Object.assign({}, base, def.pal);
    const c = G.fromRows(def.rows, pal);
    cache[id] = c;
    return c;
  }
  return { get };
})();
