// Prüft alle Karten: Abmessungen, Erreichbarkeit aller Objekte, Ziele von Übergängen.
// Aufruf: node tools/validate-maps.js [--print]
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');
const ctx = { console, Math, document: { createElement: () => ({ getContext: () => ({}) }) }, window: {} };
vm.createContext(ctx);
for (const f of ['js/util.js', 'js/gfx.js', 'js/tiles.js', 'js/objects.js', 'js/data/items.js', 'js/data/notes.js', 'js/data/maps.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8') + '\n;this.__x=1;', ctx, { filename: f });
}
vm.runInContext(`
  this.R = { MAPS, MAP_ORDER, getMapDef, Tiles, OBJ, ITEMS, NOTES, THEMES };
`, ctx);
const { MAP_ORDER, getMapDef, Tiles, OBJ, ITEMS, NOTES, THEMES } = ctx.R;
const print = process.argv.includes('--print');
let errors = 0;
const err = (m) => { errors++; console.log('FEHLER:', m); };

const defs = {};
for (const id of MAP_ORDER) defs[id] = getMapDef(id);

for (const id of MAP_ORDER) {
  const d = defs[id];
  if (!THEMES[d.theme]) err(`${id}: Thema ${d.theme} fehlt`);
  if (d.rows.length !== d.h) err(`${id}: Höhe ${d.rows.length} != ${d.h}`);
  d.rows.forEach((r, y) => { if (r.length !== d.w) err(`${id}: Zeile ${y} Länge ${r.length}`); });
  const W = d.w, H = d.h;
  const tile = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? '#' : d.rows[y][x]);
  // Objekt-Hitboxen
  const objs = d.objects.map((o) => {
    const def = OBJ.T[o.type];
    if (!def) err(`${id}: unbekannter Typ ${o.type} @${o.x},${o.y}`);
    const w = o.w || (def && def.w) || 1, h = o.h || (def && def.h) || 1;
    const hit = o.hit || (def && def.hit) || [0, 0, w * 16, h * 16];
    let solid = def ? def.solid : true;
    if (solid === undefined) solid = true;
    if (typeof solid === 'function') solid = !(o.type === 'door' || o.type === 'bigdoor' || o.type === 'gate' || o.type === 'shutter');
    if (o.hidden) solid = false;
    return { o, def, w, h, box: [o.x * 16 + hit[0], o.y * 16 + hit[1], hit[2], hit[3]], solid };
  });
  if (d.objects.some((o) => o.item && !ITEMS[o.item])) err(`${id}: unbekanntes Item`);
  d.objects.forEach((o) => { if (o.note && !NOTES[o.note]) err(`${id}: unbekannte Notiz ${o.note}`); });
  const free = (x, y) => {
    if (Tiles.isSolid(tile(x, y))) return false;
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const cx = x * 16 + 4, cy = y * 16 + 4;
    for (const b of objs) {
      if (!b.solid) continue;
      const [ox, oy, ow, oh] = b.box;
      if (cx < ox + ow && cx + 8 > ox && cy < oy + oh && cy + 8 > oy) return false;
    }
    return true;
  };
  // BFS ab Spawn
  const seen = new Uint8Array(W * H);
  const q = [[d.spawn.x, d.spawn.y]];
  if (!free(d.spawn.x, d.spawn.y)) err(`${id}: Spawn blockiert`);
  seen[d.spawn.y * W + d.spawn.x] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (seen[ny * W + nx] || !free(nx, ny)) continue;
      seen[ny * W + nx] = 1; q.push([nx, ny]);
    }
  }
  const reach = (x, y) => x >= 0 && y >= 0 && x < W && y < H && seen[y * W + x];
  // Jedes interaktive Objekt erreichbar?
  for (const b of objs) {
    const o = b.o;
    if (['blood', 'debris', 'cobweb', 'chalk', 'pipes', 'bones', 'sheet', 'beam', 'theo', 'railing'].includes(o.type) && !o.text && !o.script) continue;
    if (o.type === 'barrier' || o.type === 'crow' || o.hidden) continue;
    let ok = false;
    for (let j = o.y - 1; j <= o.y + b.h; j++) for (let i = o.x - 1; i <= o.x + b.w; i++) {
      if (reach(i, j)) ok = true;
    }
    if (o.type === 'trigger' || (b.def && b.def.touch) || !b.solid) { if (reach(o.x, o.y)) ok = true; }
    if (b.def && b.def.wall) ok = reach(o.x, o.y + 1) || reach(o.x - 1, o.y + 1) || reach(o.x + 1, o.y + 1);
    if (!ok) err(`${id}: ${o.type}${o.id ? ' ' + o.id : ''} @${o.x},${o.y} nicht erreichbar`);
    if (o.to) {
      const td = defs[o.to.map];
      if (!td) err(`${id}: Ziel ${o.to.map} fehlt`);
      else {
        const ch = td.rows[o.to.y] && td.rows[o.to.y][o.to.x];
        if (!ch || Tiles.isSolid(ch)) err(`${id}: Ziel ${o.to.map} ${o.to.x},${o.to.y} ist '${ch}'`);
        const onWarp = td.objects.some((t) => t.to && t.x <= o.to.x && o.to.x < t.x + (t.w || (OBJ.T[t.type].w || 1)) && t.y <= o.to.y && o.to.y < t.y + (t.h || (OBJ.T[t.type].h || 1)));
        if (onWarp) err(`${id}: Ziel ${o.to.map} ${o.to.x},${o.to.y} liegt auf einem Übergang`);
      }
    }
  }
  if (print) {
    console.log(`\n=== ${id} (${W}x${H}) ===`);
    const g = d.rows.map((r) => r.split(''));
    d.objects.forEach((o) => { if (g[o.y]) g[o.y][o.x] = o.type === 'door' ? 'D' : o.type === 'trigger' ? '!' : o.type[0].toUpperCase(); });
    g.forEach((r, y) => console.log(String(y).padStart(2) + ' ' + r.map((c, x) => (seen[y * W + x] && c === r[x] && !Tiles.isSolid(c) ? c : c)).join('')));
  }
}
console.log(errors ? `\n${errors} Fehler.` : '\nAlle Karten OK.');
process.exit(errors ? 1 : 0);
