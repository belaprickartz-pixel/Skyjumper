'use strict';
// ------------------------------------------------------------
//  Handgesetzte Pixelschrift "Grauwald" – 5x7 Versalien,
//  Unterlängen, deutsche Umlaute, kleine Eigenheiten mit Absicht.
//  '#' = Pixel. Jede Glyphe beginnt in Zeile 1 (Zeile 0 = Akzentzeile).
// ------------------------------------------------------------
const Font = (function () {
  const RAW = {
    'A': '.###./#...#/#...#/#####/#...#/#...#/#...#',
    'B': '####./#...#/#...#/####./#...#/#...#/####.',
    'C': '.###./#...#/#..../#..../#..../#...#/.###.',
    'D': '###../#..#./#...#/#...#/#...#/#..#./###..',
    'E': '#####/#..../#..../####./#..../#..../#####',
    'F': '#####/#..../#..../####./#..../#..../#....',
    'G': '.###./#...#/#..../#.###/#...#/#...#/.###.',
    'H': '#...#/#...#/#...#/#####/#...#/#...#/#...#',
    'I': '###/.#./.#./.#./.#./.#./###',
    'J': '..###/...#./...#./...#./#..#./#..#./.##..',
    'K': '#...#/#..#./#.#../##.../#.#../#..#./#...#',
    'L': '#..../#..../#..../#..../#..../#..../#####',
    'M': '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
    'N': '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
    'O': '.###./#...#/#...#/#...#/#...#/#...#/.###.',
    'P': '####./#...#/#...#/####./#..../#..../#....',
    'Q': '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
    'R': '####./#...#/#...#/####./#.#../#..#./#...#',
    'S': '.####/#..../#..../.###./....#/....#/####.',
    'T': '#####/..#../..#../..#../..#../..#../..#..',
    'U': '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
    'V': '#...#/#...#/#...#/#...#/.#.#./.#.#./..#..',
    'W': '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
    'X': '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    'Y': '#...#/#...#/.#.#./..#../..#../..#../..#..',
    'Z': '#####/....#/...#./..#../.#.../#..../#####',
    'Ä': '#...#/.###./#...#/#####/#...#/#...#/#...#',
    'Ö': '#...#/.###./#...#/#...#/#...#/#...#/.###.',
    'Ü': '#...#/...../#...#/#...#/#...#/#...#/.###.',

    'a': '...../...../.###./....#/.####/#...#/.####',
    'b': '#..../#..../####./#...#/#...#/#...#/####.',
    'c': '..../..../.###/#.../#.../#.../.###',
    'd': '....#/....#/.####/#...#/#...#/#...#/.####',
    'e': '...../...../.###./#...#/#####/#..../.###.',
    'f': '..##/.#../####/.#../.#../.#../.#..',
    'g': '...../...../.####/#...#/#...#/#...#/.####/....#/.###.',
    'h': '#..../#..../####./#...#/#...#/#...#/#...#',
    'i': '#/./#/#/#/#/#',
    'j': '..#/.../..#/..#/..#/..#/..#/#.#/.#.',
    'k': '#.../#.../#..#/#.#./##../#.#./#..#',
    'l': '#./#./#./#./#./#./.#',
    'm': '...../...../##.#./#.#.#/#.#.#/#.#.#/#...#',
    'n': '..../..../###./#..#/#..#/#..#/#..#',
    'o': '...../...../.###./#...#/#...#/#...#/.###.',
    'p': '..../..../###./#..#/#..#/#..#/###./#.../#...',
    'q': '..../..../.###/#..#/#..#/#..#/.###/...#/...#',
    'r': '..../..../#.##/##../#.../#.../#...',
    's': '..../..../.###/#.../.##./...#/###.',
    't': '.#../.#../####/.#../.#../.#../..##',
    'u': '..../..../#..#/#..#/#..#/#..#/.###',
    'v': '...../...../#...#/#...#/#...#/.#.#./..#..',
    'w': '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.',
    'x': '...../...../#...#/.#.#./..#../.#.#./#...#',
    'y': '..../..../#..#/#..#/#..#/#..#/.###/...#/###.',
    'z': '..../..../####/...#/..#./.#../####',
    'ä': '.#.#./...../.###./....#/.####/#...#/.####',
    'ö': '.#.#./...../.###./#...#/#...#/#...#/.###.',
    'ü': '.#.#/..../#..#/#..#/#..#/#..#/.###',
    'ß': '.##./#..#/#..#/#.#./#..#/#..#/#.#./#...',

    '0': '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
    '1': '..#../.##../..#../..#../..#../..#../.###.',
    '2': '.###./#...#/....#/...#./..#../.#.../#####',
    '3': '####./....#/....#/.###./....#/....#/####.',
    '4': '...#./..##./.#.#./#..#./#####/...#./...#.',
    '5': '#####/#..../####./....#/....#/#...#/.###.',
    '6': '..##./.#.../#..../####./#...#/#...#/.###.',
    '7': '#####/....#/...#./..#../.#.../.#.../.#...',
    '8': '.###./#...#/#...#/.###./#...#/#...#/.###.',
    '9': '.###./#...#/#...#/.####/....#/...#./.##..',

    '.': '././././././#',
    ',': '../../../../../../.#/#.',
    '!': '#/#/#/#/#/./#',
    '?': '.###./#...#/....#/...#./..#../...../..#..',
    ':': './././#/././#',
    ';': '../../../.#/../../.#/#.',
    '-': '.../.../.../###',
    '–': '..../..../..../####',
    '+': '.../.../.#./###/.#.',
    '=': '..../..../####/..../####',
    "'": '#/#',
    '"': '#.#/#.#',
    '(': '.#/#./#./#./#./#./.#',
    ')': '#./.#/.#/.#/.#/.#/#.',
    '[': '##/#./#./#./#./#./##',
    ']': '##/.#/.#/.#/.#/.#/##',
    '/': '....#/...#./...#./..#../.#.../.#.../#....',
    '%': '##..#/##.#./...#./..#../.#.../.#.##/#..##',
    '*': '.../#.#/.#./#.#',
    '<': '.../..#/.#./#../.#./..#',
    '>': '.../#../.#./..#/.#./#..',
    '_': '..../..../..../..../..../..../..../####',
    '»': '..../..../#.#./.#.#/#.#.',
    '«': '..../..../.#.#/#.#./.#.#',
    '#': '.#.#./#####/.#.#./#####/.#.#.',
    '·': './././#',
    '°': '###/#.#/###',
    '&': '.##../#..#./.##../.#..#/#.##./#..#./.##.#',
    // Sondersymbole (Private Use)
    '♥': '.#.#./#####/#####/.###./..#..',          // Herz
    '▼': '...../...../#####/.###./..#..',          // Weiter-Pfeil
    '▶': '#.../##../###./##../#...',               // Cursor
    '↑': '..#../.###./#.#.#/..#../..#../..#..',
    '↓': '..#../..#../..#../#.#.#/.###./..#..',
    '←': '...../..#../.#.../#####/.#.../..#..',
    '→': '...../..#../...#./#####/...#./..#..',
  };
  const H = 10;            // Zellenhöhe
  const LINE = 11;         // Zeilenabstand
  const SPACE = 3;
  const glyphs = {};
  for (const ch in RAW) {
    const rows = RAW[ch].split('/');
    let w = 0;
    rows.forEach((r) => { w = Math.max(w, r.length); });
    const px = [];
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) if (r[x] === '#') px.push([x, y + 1]);
    });
    glyphs[ch] = { w, px };
  }
  glyphs[' '] = { w: SPACE, px: [] };

  // Atlas je Farbe
  const order = Object.keys(glyphs);
  const pos = {};
  let atlasW = 0;
  order.forEach((ch) => { pos[ch] = atlasW; atlasW += glyphs[ch].w + 1; });
  const atlases = {};
  function atlas(color) {
    let a = atlases[color];
    if (a) return a;
    a = document.createElement('canvas');
    a.width = atlasW; a.height = H;
    const c = a.getContext('2d');
    c.fillStyle = color;
    order.forEach((ch) => {
      const g = glyphs[ch], ox = pos[ch];
      g.px.forEach(([x, y]) => c.fillRect(ox + x, y, 1, 1));
    });
    atlases[color] = a;
    return a;
  }

  // Inline-Farbcodes: {y}gelb{/}  {r}rot  {b}blau  {g}grau  {w}weiß  {s}zitternd rot
  const CODES = {
    y: '#e8c46a', r: '#c8323a', b: '#8fb0cc', g: '#7d7889', w: '#efe9d8', p: '#a07cc0', o: '#d8873a', k: '#2a1b13',
  };
  function tokens(str) {
    const out = [];
    let color = null, shake = false, i = 0;
    while (i < str.length) {
      const c = str[i];
      if (c === '{') {
        const j = str.indexOf('}', i);
        if (j > i) {
          const code = str.slice(i + 1, j);
          if (code === '/') { color = null; shake = false; } else if (code === 's') { shake = true; color = CODES.r; } else if (CODES[code]) color = CODES[code];
          i = j + 1;
          continue;
        }
      }
      out.push({ ch: c, color, shake });
      i++;
    }
    return out;
  }
  function gw(ch) { const g = glyphs[ch] || glyphs['?']; return g.w; }
  function strip(str) { return str.replace(/\{[^}]*\}/g, ''); }
  function width(str, scale = 1) {
    const s = strip(str);
    let w = 0;
    for (let i = 0; i < s.length; i++) w += gw(s[i]) + (i < s.length - 1 ? 1 : 0);
    return w * scale;
  }

  /**
   * draw(ctx, text, x, y, color, opts)
   * opts: scale, align ('left'|'center'|'right'), shadow (Farbe), max (Anzahl sichtbarer Zeichen),
   *       wave (Amplitude), jitter (Amplitude), t (Zeit), alpha
   */
  function draw(ctx, str, x, y, color, opts = {}) {
    const scale = opts.scale || 1;
    const toks = tokens(String(str));
    let w = 0;
    toks.forEach((t, i) => { w += gw(t.ch) + (i < toks.length - 1 ? 1 : 0); });
    w *= scale;
    let cx = Math.round(x);
    if (opts.align === 'center') cx = Math.round(x - w / 2);
    else if (opts.align === 'right') cx = Math.round(x - w);
    const cy = Math.round(y);
    const t = opts.t || 0;
    const max = opts.max === undefined ? 1e9 : opts.max;
    const pa = ctx.globalAlpha;
    if (opts.alpha !== undefined) ctx.globalAlpha = pa * opts.alpha;
    for (let i = 0; i < toks.length && i < max; i++) {
      const tk = toks[i];
      const ch = glyphs[tk.ch] ? tk.ch : '?';
      const g = glyphs[ch];
      let dx = 0, dy = 0;
      if (opts.wave) dy += Math.round(Math.sin(t * 6 + i * 0.7) * opts.wave);
      if (opts.jitter || tk.shake) {
        const j = opts.jitter || 1;
        if (Math.random() < 0.35) { dx += Math.round((Math.random() - 0.5) * 2 * j); dy += Math.round((Math.random() - 0.5) * 2 * j); }
      }
      if (g.w > 0 && ch !== ' ') {
        if (opts.shadow) {
          ctx.drawImage(atlas(opts.shadow), pos[ch], 0, g.w, H, cx + dx + scale, cy + dy + scale, g.w * scale, H * scale);
        }
        ctx.drawImage(atlas(tk.color || color), pos[ch], 0, g.w, H, cx + dx, cy + dy, g.w * scale, H * scale);
      }
      cx += (g.w + 1) * scale;
    }
    ctx.globalAlpha = pa;
    return w;
  }

  // Zeilenumbruch nach Pixelbreite; erhält Farbcodes
  function wrap(str, maxW) {
    const lines = [];
    String(str).split('\n').forEach((para) => {
      if (para === '') { lines.push(''); return; }
      const words = para.split(' ');
      let line = '';
      let open = '';
      words.forEach((wd) => {
        const test = line ? line + ' ' + wd : wd;
        if (width(test) > maxW && line) {
          lines.push(line);
          line = open + wd;
        } else line = test;
        // offene Farbcodes über Umbrüche mitnehmen
        const m = wd.match(/\{[^}]*\}/g);
        if (m) {
          const last = m[m.length - 1];
          open = last === '{/}' ? '' : last;
        }
      });
      lines.push(line);
    });
    return lines;
  }
  function len(str) { return strip(str).length; }

  return { draw, width, wrap, len, strip, LINE, H, CODES };
})();
