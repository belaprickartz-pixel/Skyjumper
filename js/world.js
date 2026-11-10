'use strict';
// ------------------------------------------------------------
//  Welt: Karte, Objekte, Kollision, Sichtlinie, Wegfindung
// ------------------------------------------------------------

// Standardtexte, damit jedes Möbelstück etwas zu erzählen hat
const DEFAULT_TEXT = {
  shelf: [
    'Bücher über Ahnenforschung, Kräuterkunde und Jagd.',
    'Alte Gesangbücher. Zwischen zwei Seiten klebt ein gepresstes Gänseblümchen.',
    'Lexika von 1938. Der Band »V« fehlt.',
    'Romane mit Eselsohren. Oma hat Stellen unterstrichen, in denen jemand gesucht wird.',
    'Kinderbücher. »Hänsel und Gretel«. Jemand hat die Hexe mit Bleistift sehr groß gemacht.',
    'Fotoalben. Auf allen Bildern von 1952 fehlt etwas. Ausgeschnitten.',
    'Staub, Bücher, eine tote Motte.',
  ],
  cabinet: ['Schubladen voller Kram. Garn, Knöpfe, Bindfaden.', 'Alte Briefe, mit Gummiband zusammengehalten. Alle ungeöffnet.', 'Tischdecken, gebügelt und gestärkt.', 'Eine Kommode. Die unterste Schublade klemmt. Lieber so.'],
  crate: ['Eine Holzkiste. Leer bis auf Stroh.', 'Alte Zeitungen und Einmachgläser.', 'Die Kiste ist zugenagelt. Nichts Wichtiges, hoffe ich.'],
  barrel: ['Ein Fass. Es riecht sauer.', 'Leer. Bis auf ein Echo.'],
  table: ['Ein Tisch. Staub, in dem Fingerabdrücke sind. Kleine Fingerabdrücke.', 'Ein Tisch mit Kerzenwachs-Flecken.'],
  chair: ['Ein Stuhl. Er ist noch warm.', 'Ein Stuhl, leicht vom Tisch abgerückt. Als wäre gerade jemand aufgestanden.', 'Ein Stuhl.'],
  bed: ['Ein Bett. Frisch bezogen, aber eiskalt.', 'Das Bett ist gemacht. Unter dem Bett könnte ich mich verstecken.'],
  wardrobe: ['Ein Kleiderschrank. Mottenkugeln. Ich passe da rein, wenn es sein muss.', 'Ein alter Schrank. Innen hat jemand Striche gekratzt.'],
  counter: ['Die Arbeitsplatte. Ein Brett mit eingetrockneten Zwiebelschalen.', 'Gläser mit Mehl und Zucker. Die Zuckerdose ist leer.'],
  vase: ['Eine Vase mit vertrockneten Blumen.', 'Ein Blumentopf. Die Erde ist feucht.'],
  grave: ['Ein Grabstein. »Vogt«. Die Jahreszahlen sind verwittert.', 'Ein Grabstein. Moos füllt die Buchstaben.', 'Ein Grabstein. Jemand hat frische Blumen hingelegt. Rosen aus dem Gewächshaus.'],
  statue: ['Eine Steinfigur. Kalt und feucht.'],
  sink: ['Ein Waschbecken. Aus dem Hahn tropft es. Langsam. Im Takt.', 'Im Abfluss: lange, schwarze Haare.'],
  toilet: ['Eine Toilette. Der Deckel ist zu. Ich lasse ihn zu.'],
  lamp: ['Eine Stehlampe.', 'Eine Stehlampe mit Fransenschirm.'],
  bulb: ['Eine nackte Glühbirne.'],
  lantern: ['Eine Laterne.'],
  pew: ['Eine Kirchenbank. In das Holz ist »I + A« geritzt.', 'Eine Kirchenbank. Gesangbücher, aufgeschlagen bei »Weißt du, wieviel Sternlein stehen«.'],
  winerack: ['Weinflaschen. Jahrgang 1951. Danach nichts mehr.', 'Staubige Flaschen. Eine ist zerbrochen.'],
  pantry: ['Eingemachtes. Kirschen, Bohnen, etwas Graues.', 'Gläser mit Etiketten in Omas Schrift.'],
  sofa: ['Ein Samtsofa. In den Polstern stecken Zuckerwürfel.', 'Ein Sofa. Auf einem Kissen ist ein Abdruck, als hätte dort lange jemand gesessen.'],
  coffin: ['Ein Steinsarg. »Vogt«. Der Deckel ist schwer.', 'Ein Sarg. Kratzspuren am Deckelrand. Von innen?'],
  sheetcover: ['Ein Möbelstück unter einem Laken. Ich hebe es nicht an.', 'Ein Laken über etwas Großem. Es bewegt sich leicht. Luftzug. Hoffentlich.'],
  boxes: ['Umzugskartons. »Oma – Kleider«, »Oma – Bücher«.', 'Ein Karton mit der Aufschrift »Nicht öffnen«. In Omas Schrift.'],
  sack: ['Ein Sack Kartoffeln. Sie treiben aus.'],
  coal: ['Ein Haufen Kohle.'],
  beam: ['Ein Dachbalken. Tief eingeritzt: Zählstriche.'],
  doll: ['Eine Puppe mit Glasaugen.'],
  toybox: ['Eine Spielzeugkiste.'],
  candle: ['Ein Kerzenständer.'],
  candles: ['Kerzen auf dem Boden.'],
  clock: ['Eine Standuhr.'],
  fireplace: ['Ein Kamin.'],
  stove: ['Ein alter Herd.'],
  railing: ['Ein Geländer aus dunklem Holz.'],
  rockingchair: ['Ein Schaukelstuhl.'],
  bench: ['Eine Steinbank, nass vom Regen.'],
  well: ['Ein Brunnen.'],
  bike: ['Ein altes Fahrrad.'],
  wheelbarrow: ['Eine Schubkarre.'],
  washtub: ['Ein Waschzuber.'],
  mannequin: ['Eine Schneiderpuppe.'],
  dollhouse: ['Ein Puppenhaus.'],
  coatrack: ['Ein Garderobenständer.'],
  suitcase: ['Ein Koffer.'],
  trunk: ['Eine Truhe.'],
  sewing: ['Eine Nähmaschine.'],
  plant: ['Rosen. Viel zu viele, und viel zu rot für November.', 'Eine Pflanze mit großen, ledrigen Blättern. Sie riecht nach Eisen.', 'Verwelkt. Nur die Dornen sind noch gesund.'],
  bones: ['Knochen. Ich zähle sie nicht.'],
  gramophone: ['Ein Grammophon.'],
  toolbox: ['Ein Werkzeugkasten.'],
  workbench: ['Eine Werkbank.'],
  bathtub: ['Eine Badewanne.'],
  bigwardrobe: ['Ein großer Schrank.'],
  sign: ['Ein Schild.'],
  car: ['Unser Auto.'],
  stump: ['Ein Baumstumpf.'],
  backpack: ['Ein Rucksack.'],
  desk: ['Ein Schreibtisch.'],
  smallaltar: ['Ein Altar.'],
  cradle: ['Eine Wiege.'],
  piano: ['Ein Klavier.'],
  safe: ['Ein Tresor.'],
  musicbox: ['Eine Spieluhr.'],
  rockinghorse: ['Ein Schaukelpferd.'],
};

class Obj {
  constructor(d, world) {
    this.world = world;
    this.type = d.type;
    this.def = OBJ.T[d.type] || {};
    this.x = d.x; this.y = d.y;
    this.w = d.w || this.def.w || 1;
    this.h = d.h || this.def.h || 1;
    this.p = d;
    this.id = d.id || (world.id + ':' + d.type + ':' + d.x + ':' + d.y);
    if (!Game.objState[this.id]) Game.objState[this.id] = {};
    this.st = Game.objState[this.id];
    if (!this.st.i) {
      this.st.i = 1;
      if (d.open) this.st.open = true;
      if (d.lit === false) this.st.lit = false;
      if (d.rock) this.st.rock = true;
    }
    this.jl = this.jr = this.ju = this.jd = false; this.jm = '';
    this.orient = 'h';
  }
  exists() {
    if (this.st.removed) return false;
    if (this.p.hidden && !Game.flags[this.p.hidden]) return false;
    if (this.type === 'pickup' && this.st.taken) return false;
    return true;
  }
  solid() {
    if (!this.exists()) return false;
    const s = this.def.solid;
    if (s === undefined) return true;
    return typeof s === 'function' ? s(this) : s;
  }
  opaque() { const o = this.def.opaque; return o ? o(this) : false; }
  hitbox() {
    const h = this.p.hit || this.def.hit || [0, 0, this.w * TS, this.h * TS];
    return [this.x * TS + h[0], this.y * TS + h[1], h[2], h[3]];
  }
  sortY() {
    if (this.def.flat) return -1e9;
    const hb = this.hitbox();
    return hb[1] + hb[3];
  }
  get cx() { return this.x * TS + this.w * 8; }
  get cy() { return this.y * TS + this.h * 8; }
  // Kann man damit interagieren?
  interactive() {
    if (!this.exists()) return false;
    const d = this.def, p = this.p;
    if (d.invisible && this.type !== 'barrier') return false;
    if (this.type === 'barrier') return !!p.text;
    if (d.trigger || d.touch) return false;
    if (['blood', 'debris', 'cobweb', 'chalk', 'pipes', 'bones', 'sheet', 'ball', 'theo', 'crow'].indexOf(this.type) >= 0) return !!(p.text || p.script);
    return true;
  }
  prompt() {
    if (this.p.prompt) return this.p.prompt;
    if (this.def.hide && !this.p.item && !this.p.note) return 'Untersuchen';
    if (this.def.prompt) return this.def.prompt(this);
    if (this.p.note && !this.p.item) return 'Lesen';
    return 'Untersuchen';
  }
}

class World {
  constructor(id) {
    const def = getMapDef(id);
    this.id = id;
    this.def = def;
    this.name = def.name;
    this.w = def.w; this.h = def.h;
    this.theme = THEMES[def.theme];
    this.t = def.rows.map((r) => r.split(''));
    const mods = Game.tileMods[id];
    if (mods) for (const k in mods) { const [x, y] = k.split(',').map(Number); this.t[y][x] = mods[k]; }
    this.objects = def.objects.map((d) => new Obj(d, this));
    this.computeJoins();
    this.objects.forEach((o) => {
      if (o.type === 'door') {
        const L = Tiles.isWall(this.tileAt(o.x - 1, o.y)), Rr = Tiles.isWall(this.tileAt(o.x + o.w, o.y));
        const Up = Tiles.isWall(this.tileAt(o.x, o.y - 1)), Dn = Tiles.isWall(this.tileAt(o.x, o.y + 1));
        if (o.p.exit && o.y === this.h - 1) o.orient = 'exit';
        else if (L && Rr) o.orient = 'h';
        else if (Up && Dn) o.orient = 'v';
        else o.orient = 'h';
      }
    });
    this.buildGrid();
    this.buildLights();
    if (!Game.seen[id]) Game.seen[id] = new Uint8Array(this.w * this.h);
    this.seen = Game.seen[id];
    Tiles.bake(this);
  }
  tileAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this.theme.outdoor ? 'T' : '#';
    return this.t[y][x];
  }
  setTile(x, y, ch) {
    this.t[y][x] = ch;
    if (!Game.tileMods[this.id]) Game.tileMods[this.id] = {};
    Game.tileMods[this.id][x + ',' + y] = ch;
    Tiles.redraw(this, x, y);
    this.nav = {};
  }
  computeJoins() {
    const map = new Map();
    this.objects.forEach((o) => { if (o.def.join) map.set(o.def.join + ':' + o.x + ',' + o.y, o); });
    this.objects.forEach((o) => {
      if (!o.def.join) return;
      const j = o.def.join;
      o.jl = map.has(j + ':' + (o.x - 1) + ',' + o.y);
      o.jr = map.has(j + ':' + (o.x + 1) + ',' + o.y);
      o.ju = map.has(j + ':' + o.x + ',' + (o.y - 1));
      o.jd = map.has(j + ':' + o.x + ',' + (o.y + 1));
      o.jm = (o.jl ? 'l' : '') + (o.jr ? 'r' : '') + (o.ju ? 'u' : '') + (o.jd ? 'd' : '');
    });
  }
  buildGrid() {
    this.grid = Array.from({ length: this.w * this.h }, () => []);
    this.objects.forEach((o) => {
      if (o.def.solid === false && !o.def.opaque && !o.def.trigger && !o.def.touch) return;
      const [x, y, w, h] = o.hitbox();
      const x0 = Math.max(0, Math.floor(x / TS)), y0 = Math.max(0, Math.floor(y / TS));
      const x1 = Math.min(this.w - 1, Math.floor((x + w - 1) / TS)), y1 = Math.min(this.h - 1, Math.floor((y + h - 1) / TS));
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) this.grid[j * this.w + i].push(o);
    });
    this.nav = {};
  }
  buildLights() {
    this.lights = [];
    this.objects.forEach((o) => {
      const L = o.def.light;
      if (!L) return;
      this.lights.push({ x: o.x * TS + (L.x !== undefined ? L.x : o.w * 8), y: o.y * TS + 8 + (L.y || 0), r: L.r, c: L.c, i: L.i, flicker: L.flicker || 0, obj: o, seed: Math.random() * 10 });
    });
    if (!this.theme.outdoor) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const ch = this.t[y][x];
        if ((ch === '=' || ch === '"') && !Tiles.isWall(this.tileAt(x, y + 1))) {
          const chapel = this.theme.wallA === 'chapel';
          this.lights.push({ x: x * TS + 8, y: (y + 1) * TS + 6, r: chapel ? 56 : 46, c: chapel ? [200, 120, 160] : [110, 140, 200], i: 0.55, flicker: 0, moon: true, seed: 0 });
        }
      }
    }
  }
  lightOn(L) {
    if (!L.obj) return true;
    return L.obj.exists() && OBJ.isLit(L.obj);
  }
  lightAt(px, py) {
    let v = 1 - this.theme.ambient;
    if (this.theme.outdoor) v += Game.lightning * 0.8;
    for (const L of this.lights) {
      if (!this.lightOn(L)) continue;
      const d = Math.hypot(px - L.x, py - L.y);
      if (d < L.r) v += L.i * (1 - d / L.r);
    }
    return U.clamp(v, 0, 1);
  }
  surfaceAt(px, py) {
    const ch = this.tileAt(Math.floor(px / TS), Math.floor(py / TS));
    return Tiles.STEP[ch] || this.theme.step || 'wood';
  }

  // --- Kollision ---
  tileSolid(tx, ty) { return Tiles.isSolid(this.tileAt(tx, ty)); }
  rectBlocked(x, y, w, h, ignore) {
    const x0 = Math.floor(x / TS), y0 = Math.floor(y / TS), x1 = Math.floor((x + w - 1) / TS), y1 = Math.floor((y + h - 1) / TS);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      if (this.tileSolid(i, j)) return true;
      if (i < 0 || j < 0 || i >= this.w || j >= this.h) return true;
      const list = this.grid[j * this.w + i];
      for (const o of list) {
        if (o === ignore || !o.solid()) continue;
        const [ox, oy, ow, oh] = o.hitbox();
        if (x < ox + ow && x + w > ox && y < oy + oh && y + h > oy) return true;
      }
    }
    return false;
  }
  objectsInRect(x, y, w, h) {
    const out = new Set();
    const x0 = Math.max(0, Math.floor(x / TS)), y0 = Math.max(0, Math.floor(y / TS));
    const x1 = Math.min(this.w - 1, Math.floor((x + w - 1) / TS)), y1 = Math.min(this.h - 1, Math.floor((y + h - 1) / TS));
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      for (const o of this.grid[j * this.w + i]) {
        const [ox, oy, ow, oh] = o.hitbox();
        if (x < ox + ow && x + w > ox && y < oy + oh && y + h > oy) out.add(o);
      }
    }
    return out;
  }
  opaqueAt(tx, ty) {
    if (Tiles.isOpaque(this.tileAt(tx, ty))) return true;
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
    const list = this.grid[ty * this.w + tx];
    for (const o of list) if (o.def.opaque && o.exists() && o.opaque()) return true;
    return false;
  }
  // Sichtlinie
  los(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.ceil(d / 4);
    let lt = -1, lty = -1;
    for (let i = 1; i < n; i++) {
      const x = ax + (bx - ax) * (i / n), y = ay + (by - ay) * (i / n);
      const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
      if (tx === lt && ty === lty) continue;
      lt = tx; lty = ty;
      if (this.opaqueAt(tx, ty)) return false;
    }
    return true;
  }
  // Freie Strecke für eine Figur
  clearLine(ax, ay, bx, by, r, ignoreDoors) {
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.ceil(d / 6);
    for (let i = 1; i <= n; i++) {
      const x = ax + (bx - ax) * (i / n), y = ay + (by - ay) * (i / n);
      if (!this.navFree(Math.floor(x / TS), Math.floor(y / TS), ignoreDoors)) return false;
      if (r && (!this.navFree(Math.floor((x - r) / TS), Math.floor(y / TS), ignoreDoors) || !this.navFree(Math.floor((x + r) / TS), Math.floor(y / TS), ignoreDoors))) return false;
    }
    return true;
  }

  // --- Wegfindung ---
  navGrid(doors) {
    const k = doors ? 'd' : 'n';
    if (this.nav[k]) return this.nav[k];
    const g = new Uint8Array(this.w * this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      let ok = !this.tileSolid(x, y);
      if (ok) {
        for (const o of this.grid[y * this.w + x]) {
          if (!o.exists()) continue;
          const isDoor = o.type === 'door' || o.type === 'bigdoor';
          if (isDoor && doors && !(o.p.locked && !o.st.unlocked) && o.orient !== 'exit') continue;
          if (o.def.solid === false) continue;
          if (!o.solid() && !isDoor) continue;
          if (isDoor && o.st.open) continue;
          const [ox, oy, ow, oh] = o.hitbox();
          const cx0 = x * TS + 4, cy0 = y * TS + 4;
          if (cx0 < ox + ow && cx0 + 8 > ox && cy0 < oy + oh && cy0 + 8 > oy) { ok = false; break; }
        }
      }
      g[y * this.w + x] = ok ? 1 : 0;
    }
    this.nav[k] = g;
    return g;
  }
  navFree(tx, ty, doors) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return false;
    return this.navGrid(doors)[ty * this.w + tx] === 1;
  }
  invalidateNav() { this.nav = {}; }
  findPath(sx, sy, gx, gy, doors, maxIter = 6000) {
    const W = this.w, H = this.h;
    const grid = this.navGrid(doors);
    const idx = (x, y) => y * W + x;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return null;
    // Ziel nicht begehbar -> nächstes freies Feld
    if (!grid[idx(gx, gy)]) {
      let best = null, bd = 1e9;
      for (let r = 1; r <= 3 && !best; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        const x = gx + i, y = gy + j;
        if (x < 0 || y < 0 || x >= W || y >= H || !grid[idx(x, y)]) continue;
        const d = i * i + j * j; if (d < bd) { bd = d; best = [x, y]; }
      }
      if (!best) return null;
      gx = best[0]; gy = best[1];
    }
    const N = W * H;
    const gs = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const heap = [];
    const push = (n, f) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const s = idx(sx, sy), goal = idx(gx, gy);
    gs[s] = 0; push(s, 0);
    const hfn = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
    let it = 0;
    while (heap.length && it++ < maxIter) {
      const [, cur] = pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % W, cy = (cur / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = idx(nx, ny);
        if (!grid[n] || closed[n]) continue;
        if (dx && dy && (!grid[idx(cx + dx, cy)] || !grid[idx(cx, cy + dy)])) continue;
        const ng = gs[cur] + (dx && dy ? 1.414 : 1);
        if (ng < gs[n]) { gs[n] = ng; came[n] = cur; push(n, ng + hfn(nx, ny)); }
      }
    }
    if (came[goal] === -1 && goal !== s) return null;
    const path = [];
    let c = goal;
    while (c !== s && c !== -1) { path.push([c % W, (c / W) | 0]); c = came[c]; }
    path.reverse();
    return path;
  }
  randomFloor(minDistFrom, minD, doors) {
    const g = this.navGrid(doors);
    for (let k = 0; k < 400; k++) {
      const x = U.randi(0, this.w - 1), y = U.randi(0, this.h - 1);
      if (!g[y * this.w + x]) continue;
      if (minDistFrom && Math.hypot(x * TS + 8 - minDistFrom.x, y * TS + 8 - minDistFrom.y) < minD) continue;
      return [x, y];
    }
    return null;
  }
  reveal(px, py) {
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    const r = this.theme.outdoor ? 7 : 5;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const x = tx + i, y = ty + j;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
      if (i * i + j * j > r * r + 1) continue;
      const k = y * this.w + x;
      if (this.seen[k]) continue;
      if (this.los(px, py - 6, x * TS + 8, y * TS + 8) || Math.abs(i) + Math.abs(j) <= 1) this.seen[k] = 1;
      else if (Tiles.isWall(this.tileAt(x, y)) && this.los(px, py - 6, x * TS + 8 + Math.sign(-i) * 8, y * TS + 8 + Math.sign(-j) * 8)) this.seen[k] = 1;
    }
  }
}
