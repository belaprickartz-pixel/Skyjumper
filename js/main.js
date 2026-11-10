'use strict';
// ------------------------------------------------------------
//  GRAUWALD – Hauptschleife, Zustände, Kamera, Speichern
// ------------------------------------------------------------
const SAVE_KEY = 'grauwald_save_v1';
const OPT_KEY = 'grauwald_opts_v1';
const END_KEY = 'grauwald_endings_v1';

const Game = {
  flags: {}, inv: {}, notes: [], objState: {}, tileMods: {}, seen: {},
  world: null, player: null, stalker: null, crawlers: [], shades: [], fx: [], overlays: [], script: null,
  time: 0, playTime: 0, cam: { x: 0, y: 0 }, state: 'boot',
  lightning: 0, lightningT: 9, flickerT: 0, hudAlpha: 1, danger: 0,
  shakeT: 0, shakeAmt: 0, flashT: 0, flashDur: 1, flashCol: '#fff',
  warping: null, justWarped: false, deaths: 0, halluT: 8, revealT: 0, fakeCountT: 10,
  settings: { master: 8, music: 7, sfx: 8, bright: 1, grain: true, shake: true },

  // ---------- Start ----------
  init() {
    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    [this.buf, this.bctx] = mkCanvas(VIEW_W, VIEW_H);
    Lighting.init();
    Input.init();
    this.loadSettings();
    this.buildFx();
    this.player = new Player();
    this.stalker = new Stalker();
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.rain = Array.from({ length: 140 }, () => ({ x: Math.random() * VIEW_W, y: Math.random() * VIEW_H, s: 0.7 + Math.random() * 0.6 }));
    let last = performance.now();
    const loop = (ts) => {
      const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
      last = ts;
      try { this.update(dt); this.draw(); } catch (e) { console.error(e); }
      Input.endFrame();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  resize() {
    const s0 = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    const s = s0 >= 2 ? Math.floor(s0) : Math.max(1, s0);
    this.canvas.style.width = Math.floor(VIEW_W * s) + 'px';
    this.canvas.style.height = Math.floor(VIEW_H * s) + 'px';
  },
  buildFx() {
    this.grain = [];
    for (let k = 0; k < 4; k++) {
      const [c, x] = mkCanvas(VIEW_W, VIEW_H);
      const img = x.createImageData(VIEW_W, VIEW_H);
      for (let i = 0; i < img.data.length; i += 4) {
        const r = Math.random();
        if (r < 0.05) { img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = 14; }
        else if (r < 0.12) { img.data[i + 3] = 26; }
      }
      x.putImageData(img, 0, 0);
      this.grain.push(c);
    }
    const [v, vx] = mkCanvas(VIEW_W, VIEW_H);
    const g = vx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
    vx.fillStyle = g; vx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.vignette = v;
    const [rv, rx] = mkCanvas(VIEW_W, VIEW_H);
    const g2 = rx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.3, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.6);
    g2.addColorStop(0, 'rgba(120,0,0,0)'); g2.addColorStop(1, 'rgba(120,0,0,0.75)');
    rx.fillStyle = g2; rx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.redVignette = rv;
    const [f, fx] = mkCanvas(192, 108);
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * 192, y = Math.random() * 108, r = 14 + Math.random() * 28;
      const gg = fx.createRadialGradient(x, y, 0, x, y, r);
      gg.addColorStop(0, 'rgba(110,120,140,0.3)'); gg.addColorStop(1, 'rgba(110,120,140,0)');
      fx.fillStyle = gg; fx.fillRect(0, 0, 192, 108);
    }
    this.fog = f;
  },

  // ---------- Einstellungen ----------
  loadSettings() {
    try { const s = JSON.parse(localStorage.getItem(OPT_KEY)); if (s) Object.assign(this.settings, s); } catch (e) { /* */ }
    this.applySettings();
  },
  saveSettings() { try { localStorage.setItem(OPT_KEY, JSON.stringify(this.settings)); } catch (e) { /* */ } this.applySettings(); },
  applySettings() {
    const s = this.settings;
    Sound.setVolumes({ master: s.master / 10, music: s.music / 10, sfx: s.sfx / 10 });
  },
  optionsMenu() {
    const s = this.settings;
    const lv = (k) => () => '◀ ' + s[k] + ' ▶'.replace('◀', '');
    const adj = (k, a, b) => (d) => { s[k] = U.clamp(s[k] + d, a, b); this.saveSettings(); };
    const brightNames = { 1.08: 'dunkel', 1: 'normal', 0.92: 'hell', 0.84: 'sehr hell' };
    const brights = [1.08, 1, 0.92, 0.84];
    return new UI.ListMenu('Optionen', [
      { label: 'Gesamtlautstärke', value: () => s.master + '/10', adjust: adj('master', 0, 10) },
      { label: 'Atmosphäre & Musik', value: () => s.music + '/10', adjust: adj('music', 0, 10) },
      { label: 'Geräusche', value: () => s.sfx + '/10', adjust: adj('sfx', 0, 10) },
      { label: 'Helligkeit', value: () => brightNames[s.bright] || 'normal', adjust: (d) => { const i = U.clamp(brights.indexOf(s.bright) + d, 0, 3); s.bright = brights[i < 0 ? 1 : i]; this.saveSettings(); } },
      { label: 'Filmkorn', value: () => (s.grain ? 'an' : 'aus'), adjust: () => { s.grain = !s.grain; this.saveSettings(); } },
      { label: 'Bildschirmwackeln', value: () => (s.shake ? 'an' : 'aus'), adjust: () => { s.shake = !s.shake; this.saveSettings(); } },
      { label: 'Vollbild', value: () => (document.fullscreenElement ? 'an' : 'aus'), adjust: () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* */ } } },
      { id: 'back', label: 'Zurück' },
    ], { w: 240 });
    void lv;
  },

  // ---------- Overlays & Skripte ----------
  push(ov, cb) { ov.cb = cb; this.overlays.push(ov); },
  updateOverlays(dt) {
    const top = this.overlays[this.overlays.length - 1];
    top.update(dt);
    if (!top.done) return;
    this.overlays.pop();
    const nx = top.next;
    if (nx === 'inv') this.push(new UI.InventoryView(), top.cb);
    else if (nx === 'journal') this.push(new UI.JournalView(), top.cb);
    else if (nx === 'map') this.push(new UI.MapView(), top.cb);
    else if (nx && nx.note) {
      this.push(new UI.NoteView(nx.note), () => { if (nx.back === 'journal') { const j = new UI.JournalView(); this.push(j, top.cb); } else if (top.cb) top.cb(); });
    } else if (top.cb) top.cb(top.result);
  },
  runScript(gen, arg) {
    if (this.script) return;
    this.script = { it: gen(arg) };
    this.stepScript();
  },
  stepScript(v) {
    while (this.script) {
      let r;
      try { r = this.script.it.next(v); } catch (e) { console.error(e); this.script = null; break; }
      v = undefined;
      if (r.done) { this.script = null; break; }
      const c = r.value;
      if (!c) continue;
      switch (c.cmd) {
        case 'say': this.push(new UI.Dialog(c.text, c.opts || {}), () => this.stepScript()); return;
        case 'choice': { const ch = new UI.Choice(c.text, c.options, c.opts || {}); this.push(ch, (res) => this.stepScript(res)); return; }
        case 'note': this.push(new UI.NoteView(c.id), () => this.stepScript()); return;
        case 'code': this.push(new UI.CodeLock(c.title), (res) => this.stepScript(res)); return;
        case 'piano': this.push(new UI.PianoView(this.has('notenblatt')), (res) => this.stepScript(res)); return;
        case 'wait': this.script.wait = c.s; return;
        default: break;
      }
    }
  },
  canControl() { return !this.script && !this.overlays.length && !this.warping && this.state === 'play'; },

  // ---------- Inventar ----------
  has(id) { return (this.inv[id] || 0) > 0; },
  give(id, n = 1, silent) {
    this.inv[id] = (this.inv[id] || 0) + n;
    if (!silent) Sound.play('pickup');
  },
  take(id, n = 1) { this.inv[id] = Math.max(0, (this.inv[id] || 0) - n); if (!this.inv[id]) delete this.inv[id]; },
  addNote(id) {
    if (this.notes.indexOf(id) >= 0) return;
    this.notes.push(id);
    this.flags['read_' + id] = true;
    const n = NOTES[id];
    if (n.kind === 'page') UI.toast('Tagebuchseite gefunden  (' + Story.pages().length + '/4)');
    else if (n.kind === 'drawing') UI.toast('Theos Zeichnung gefunden  (' + this.notes.filter((x) => NOTES[x].kind === 'drawing').length + '/6)');
    else UI.toast('Neu im Tagebuch: {y}' + n.title + '{/}');
  },
  toggleFlash() {
    const p = this.player;
    if (!p.hasLamp()) { UI.toast('Ich habe keine Lampe.'); return; }
    p.flashOn = !p.flashOn;
    Sound.play('flashOn');
    if (p.flashOn && p.battery <= 0) UI.toast(this.has('batterie') ? 'Die Batterie ist leer. [R] wechseln.' : 'Die Batterie ist leer.');
  },

  // ---------- Effekte ----------
  shake(a, t) { if (!this.settings.shake) return; this.shakeAmt = Math.max(this.shakeAmt, a); this.shakeT = Math.max(this.shakeT, t); },
  flash(col, t) { this.flashCol = col; this.flashT = t; this.flashDur = t; },
  fxText(x, y, str, col, life) { this.fx.push({ type: 'text', x, y, str, col, t: 0, life: life || 2 }); },
  playMelody(notes, iv, kind, vol) {
    notes.forEach((n, i) => setTimeout(() => Sound.play(kind === 'musicbox' ? 'musicbox' : 'piano', n, vol), i * iv * 1000));
  },
  noise(x, y, r) {
    if (r <= 0) return;
    this.crawlers.forEach((c) => c.hear(x, y, r));
    if (this.flags.stalker_on && this.stalker.present(this.world)) this.stalker.hear(x, y, r);
  },
  damage(amount, cause, sx, sy) {
    const p = this.player;
    if (p.hurtT > 0 || this.state !== 'play') return;
    p.hp -= amount; p.hurtT = 1.3;
    const a = Math.atan2(p.y - sy, p.x - sx);
    p.kx = Math.cos(a) * 150; p.ky = Math.sin(a) * 150;
    Sound.play('hurt');
    this.flash('#8a0f14', 0.6); this.shake(4, 0.4);
    if (p.hp <= 0) { p.hp = 0; this.gameOver(cause); }
  },
  hide(o) {
    const p = this.player, s = this.stalker, w = this.world;
    p.hidden = o; p.breath = 1; this.hideRisk = 0;
    Sound.play('creak');
    s.seenHide = false;
    if (this.flags.stalker_on && s.present(w) && s.state === 'chase') {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      s.seenHide = d < 130 && w.los(s.x, s.y - 24, p.x, p.y - 10);
      if (!s.seenHide) { s.state = 'investigate'; s.lastSeen = { x: p.x, y: p.y }; s.path = null; }
    }
  },
  unhide() {
    const p = this.player;
    if (!p.hidden) return;
    p.hidden = null;
    Sound.play('creak');
  },

  // ---------- Karten ----------
  warp(map, tx, ty, dir) {
    if (this.warping) return;
    this.warping = { map, tx, ty, dir, t: 0, loaded: false };
    Sound.play('step', 'wood', 0.5);
  },
  loadMap(id, tx, ty, dir, opts = {}) {
    const prev = this.world ? this.world.id : null;
    const s = this.stalker;
    const chasing = this.flags.stalker_on && s.state === 'chase' && s.map === prev;
    this.world = new World(id);
    const p = this.player;
    p.x = tx * TS + 8; p.y = ty * TS + 12; p.dir = dir || 'down'; p.hidden = null; p.kx = p.ky = 0;
    p.aim = U.dirAngle(p.dir);
    const def = this.world.def;
    this.crawlers = (def.crawlers || []).map((c) => new Crawler(c.x, c.y, c));
    this.shades = []; this.fx = [];
    this.snapCam();
    this.justWarped = true;
    Sound.setAmbience(this.world.theme.amb);
    if (!this.flags['visited_' + id]) { this.flags['visited_' + id] = true; UI.showBanner(this.world.name); }
    if (id === 'eg') this.flags.inside = true;
    if (this.flags.stalker_on && !opts.fromLoad) {
      if (chasing && def.stalker) { s.follow = { map: id, tx, ty }; s.followT = 3.2; s.state = 'following'; s.map = null; }
      else if (s.map === id && s.state !== 'gone') { if (!s.spawnFar(this.world, p)) s.vanish(15); }
      else if (s.state === 'following') { s.vanish(20); }
      s.relocT = U.rand(25, 50);
    }
    if (!opts.noSave) this.save(true);
  },
  snapCam() {
    const t = this.camTarget();
    this.cam.x = t.x; this.cam.y = t.y;
  },
  camTarget() {
    const p = this.player, w = this.world;
    const [dx, dy] = U.dirVec(p.dir);
    let x = p.x + dx * 14 - VIEW_W / 2, y = p.y - 12 + dy * 10 - VIEW_H / 2;
    const mw = w.w * TS, mh = w.h * TS;
    x = mw <= VIEW_W ? (mw - VIEW_W) / 2 : U.clamp(x, 0, mw - VIEW_W);
    y = mh <= VIEW_H ? (mh - VIEW_H) / 2 : U.clamp(y, 0, mh - VIEW_H);
    return { x, y };
  },

  // ---------- Speichern ----------
  encodeSeen() {
    const out = {};
    for (const id in this.seen) {
      const a = this.seen[id];
      const runs = [];
      let cur = 0, n = 0;
      for (let i = 0; i < a.length; i++) { if (a[i] === cur) n++; else { runs.push(n); cur = a[i]; n = 1; } }
      runs.push(n);
      out[id] = a.length + ':' + runs.join('.');
    }
    return out;
  },
  decodeSeen(obj) {
    const out = {};
    for (const id in obj) {
      const [len, r] = obj[id].split(':');
      const a = new Uint8Array(+len);
      let i = 0, v = 0;
      r.split('.').forEach((n) => { n = +n; if (v) a.fill(1, i, i + n); i += n; v = 1 - v; });
      out[id] = a;
    }
    return out;
  },
  save() {
    if (!this.world || this.state !== 'play') return;
    const p = this.player;
    const data = {
      v: 1, map: this.world.id, x: p.x, y: p.y, dir: p.dir, hp: p.hp, sanity: p.sanity, battery: p.battery, flashOn: p.flashOn,
      inv: this.inv, notes: this.notes, flags: this.flags, objState: this.objState, tileMods: this.tileMods,
      seen: this.encodeSeen(), playTime: this.playTime, deaths: this.deaths,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* */ }
  },
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
  resetState() {
    this.flags = {}; this.inv = {}; this.notes = []; this.objState = {}; this.tileMods = {}; this.seen = {};
    this.overlays = []; this.script = null; this.fx = []; this.shades = []; this.crawlers = [];
    this.player = new Player(); this.stalker = new Stalker();
    this.playTime = 0; this.deaths = 0; this.warping = null; this.flickerT = 0; this.flashT = 0; this.lightning = 0;
    UI.clearToasts();
  },
  load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { data = null; }
    if (!data) { this.newGame(); return; }
    this.resetState();
    this.inv = data.inv || {}; this.notes = data.notes || []; this.flags = data.flags || {};
    this.objState = data.objState || {}; this.tileMods = data.tileMods || {};
    this.seen = this.decodeSeen(data.seen || {});
    this.playTime = data.playTime || 0; this.deaths = data.deaths || 0;
    const p = this.player;
    p.hp = Math.max(35, data.hp); p.sanity = Math.max(45, data.sanity); p.battery = data.battery; p.flashOn = data.flashOn;
    this.stalker.vanishT = 18;
    this.state = 'play';
    this.loadMap(data.map, 0, 0, data.dir, { noSave: true, fromLoad: true });
    p.x = data.x; p.y = data.y; this.snapCam();
    document.body.classList.add('playing');
  },
  newGame() {
    this.resetState();
    this.state = 'intro';
    this.intro = new IntroView();
    Sound.stopMusic();
    Sound.setAmbience('silence');
  },
  beginPlay() {
    this.state = 'play';
    document.body.classList.add('playing');
    const d = getMapDef('wald');
    this.loadMap('wald', d.spawn.x, d.spawn.y, d.spawn.dir, { noSave: true });
    this.runScript(function* () {
      yield wait(1.2);
      yield say('Kein Netz. Natürlich.');
      yield say('Der Motor ist einfach ausgegangen. Zehn Minuten vor Omas Haus.');
      yield say('Im Auto müsste noch Papas Taschenlampe sein.');
      UI.toast('{y}WASD{/} gehen   {y}E{/} untersuchen   {y}Esc{/} Pause');
    });
  },
  gameOver(cause) {
    this.state = 'gameover';
    this.deaths++;
    this.overlays = []; this.script = null; this.warping = null;
    Sound.play('death');
    this.goView = new GameOverView(cause);
    document.body.classList.remove('playing');
  },
  startEnding(id) {
    this.flags.ending = id;
    let list = [];
    try { list = JSON.parse(localStorage.getItem(END_KEY)) || []; } catch (e) { list = []; }
    if (list.indexOf(id) < 0) list.push(id);
    try { localStorage.setItem(END_KEY, JSON.stringify(list)); localStorage.removeItem(SAVE_KEY); } catch (e) { /* */ }
    this.overlays = []; this.script = null;
    this.state = 'ending';
    this.endView = new EndingView(id);
    Sound.setAmbience(id === 'good' ? 'silence' : 'title');
    document.body.classList.remove('playing');
  },
  toTitle() {
    this.state = 'title';
    this.title = new TitleScreen();
    this.overlays = []; this.script = null;
    document.body.classList.remove('playing');
    Sound.setAmbience('title');
    Sound.startMusic();
  },

  // ---------- Update ----------
  update(dt) {
    this.time += dt;
    switch (this.state) {
      case 'boot':
        if (Input.any || Input.click) { Sound.init(); this.applySettings(); Sound.resume(); this.toTitle(); }
        return;
      case 'title': this.title.update(dt); this.updateRain(dt); this.updateLightning(dt, true); return;
      case 'intro': this.intro.update(dt); return;
      case 'gameover': this.goView.update(dt); return;
      case 'ending': this.endView.update(dt); return;
    }
    // --- Spiel ---
    this.updateEffects(dt);
    if (this.warping) {
      const wp = this.warping;
      wp.t += dt;
      if (!wp.loaded && wp.t >= 0.35) { wp.loaded = true; this.loadMap(wp.map, wp.tx, wp.ty, wp.dir); }
      if (wp.t >= 0.75) this.warping = null;
      return;
    }
    if (this.overlays.length) { this.updateOverlays(dt); return; }
    if (this.script) {
      if (this.script.wait !== undefined) {
        this.script.wait -= dt;
        if (this.script.wait <= 0) { this.script.wait = undefined; this.stepScript(); }
      }
      this.updateCam(dt);
      return;
    }
    this.playTime += dt;
    const p = this.player;
    if (Input.hit('pause')) { this.openPause(); return; }
    if (Input.hit('inv')) { Sound.play('ui'); this.push(new UI.InventoryView()); return; }
    if (Input.hit('journal')) { Sound.play('ui'); this.push(new UI.JournalView()); return; }
    if (Input.hit('map')) { Sound.play('ui'); this.push(new UI.MapView()); return; }
    if (Input.hit('flash')) this.toggleFlash();
    if (Input.hit('reload')) { const r = Story.useItem('batterie'); if (r && r.msg) UI.toast(r.msg); }
    if (p.hidden) this.updateHidden(dt);
    p.update(dt, this);
    this.target = p.hidden ? null : this.findTarget();
    if (!p.hidden && Input.hit('ok') && this.target) { this.runScript(interact, this.target); return; }
    this.checkTouch();
    if (this.state !== 'play') return;
    this.updateStalker(dt);
    this.crawlers.forEach((c) => c.update(dt, this));
    this.shades = this.shades.filter((s) => s.update(dt, this));
    this.updateSanity(dt);
    this.updateWorldBits(dt);
    this.updateCam(dt);
    Sound.update(dt, this.danger, this.world.theme.amb);
  },
  updateCam(dt) {
    const t = this.camTarget();
    this.cam.x += (t.x - this.cam.x) * Math.min(1, dt * 6);
    this.cam.y += (t.y - this.cam.y) * Math.min(1, dt * 6);
  },
  updateEffects(dt) {
    this.shakeT = Math.max(0, this.shakeT - dt); if (!this.shakeT) this.shakeAmt = 0;
    this.flashT = Math.max(0, this.flashT - dt);
    this.flickerT = Math.max(0, this.flickerT - dt);
    this.fx = this.fx.filter((f) => { f.t += dt; return f.t < f.life; });
    if (this.world && this.world.theme.outdoor) this.updateLightning(dt, false);
    else this.lightning = Math.max(0, this.lightning - dt * 3);
    this.updateRain(dt);
  },
  updateLightning(dt, title) {
    this.lightning = Math.max(0, this.lightning - dt * 2.8);
    this.lightningT -= dt;
    if (this.lightningT <= 0) {
      this.lightningT = U.rand(9, 22);
      this.lightning = 1;
      const d = U.rand(0.3, 1.8);
      setTimeout(() => Sound.play('thunder'), d * 1000);
      if (title) this.titleFlashFig = Math.random() < 0.5;
    }
  },
  updateRain(dt) {
    this.rain.forEach((r) => {
      r.y += 300 * r.s * dt; r.x -= 60 * r.s * dt;
      if (r.y > VIEW_H) { r.y = -5; r.x = Math.random() * (VIEW_W + 60); }
      if (r.x < -5) r.x += VIEW_W + 10;
    });
  },
  openPause() {
    Sound.play('ui');
    const m = new UI.ListMenu('Pause', [
      { id: 'resume', label: 'Weiter' },
      { id: 'inv', label: 'Inventar' },
      { id: 'journal', label: 'Tagebuch' },
      { id: 'map', label: 'Karte' },
      { id: 'opts', label: 'Optionen' },
      { id: 'ctrl', label: 'Steuerung' },
      { id: 'title', label: 'Hauptmenü' },
    ]);
    this.push(m, (r) => {
      if (r === 'inv') this.push(new UI.InventoryView());
      else if (r === 'journal') this.push(new UI.JournalView());
      else if (r === 'map') this.push(new UI.MapView());
      else if (r === 'opts') this.push(this.optionsMenu(), () => this.openPause());
      else if (r === 'ctrl') this.push(new UI.ControlsView(), () => this.openPause());
      else if (r === 'title') {
        this.push(new UI.Choice('Zurück ins Hauptmenü? Nicht gespeicherter Fortschritt geht verloren. (Zuletzt gespeichert: beim letzten Gästebuch oder Raumwechsel.)', ['Ja, zum Hauptmenü', 'Nein'], { cancel: 1 }), (c) => { if (c === 0) this.toTitle(); });
      }
    });
  },
  findTarget() {
    const p = this.player, w = this.world;
    const [dx, dy] = U.dirVec(p.dir);
    const px = p.x + dx * 11, py = p.y - 5 + dy * 11;
    let best = null, bd = 1e9;
    for (const o of w.objects) {
      if (!o.interactive()) continue;
      let box;
      if (o.def.wall || o.def.solid === false || o.def.flat) box = [o.x * TS, o.y * TS, o.w * TS, o.h * TS];
      else { const h = o.hitbox(); box = [h[0] - 2, h[1] - 2, h[2] + 4, h[3] + 4]; }
      const cx = U.clamp(px, box[0], box[0] + box[2]), cy = U.clamp(py, box[1], box[1] + box[3]);
      const d = Math.hypot(px - cx, py - cy) + (o.p.script || o.p.item || o.p.note || o.type === 'door' ? 0 : 0.5);
      if (d < 7 && d < bd) { bd = d; best = o; }
    }
    return best;
  },
  checkTouch() {
    const p = this.player;
    if (p.hidden) return;
    const bx = p.x - 4, by = p.y - 4, bw = 8, bh = 5;
    let onWarp = false;
    for (const o of this.world.objects) {
      if (!o.exists()) continue;
      const d = o.def;
      const exitDoor = o.type === 'door' && o.orient === 'exit' && o.p.to;
      if (!d.trigger && !d.touch && !exitDoor) continue;
      const [hx, hy, hw, hh] = o.hitbox();
      if (!(bx < hx + hw && bx + bw > hx && by < hy + hh && by + bh > hy)) continue;
      if (d.trigger) {
        if (o.p.script && Scripts[o.p.script] && !this.script) { this.runScript(Scripts[o.p.script], o); if (this.script) return; }
        continue;
      }
      if (exitDoor && ((o.p.bolted && !o.st.unbolted) || (o.p.locked && !o.st.unlocked) || (o.p.boarded && !o.st.unboarded))) continue;
      if (!o.p.to) continue;
      onWarp = true;
      if (!this.justWarped) { Sound.play(o.type === 'stairs' || o.type === 'ladder' ? 'creak' : 'door'); this.warp(o.p.to.map, o.p.to.x, o.p.to.y, o.p.to.dir); return; }
    }
    if (!onWarp) this.justWarped = false;
  },
  updateHidden(dt) {
    const p = this.player, s = this.stalker, w = this.world;
    if (Input.key('KeyE') || Input.key('Enter')) { this.unhide(); return; }
    const near = this.flags.stalker_on && s.present(w) && s.state !== 'scripted' && Math.hypot(s.x - p.x, s.y - p.y) < 62 && !(s.state === 'chase' && s.seenHide);
    this.hideDanger = near;
    if (near) {
      if (Input.held('hold')) {
        p.breath -= dt / 4.5;
        if (p.breath <= 0) { p.breath = 0; Sound.play('gasp'); s.attack(this); }
      } else {
        p.breath = Math.min(1, p.breath + dt / 3);
        this.hideRisk = (this.hideRisk || 0) + dt;
        if (this.hideRisk > 1) { this.hideRisk = 0; if (Math.random() < 0.33) { Sound.play('gasp'); s.attack(this); } }
      }
    } else { p.breath = Math.min(1, p.breath + dt / 2); this.hideRisk = 0; }
  },
  updateStalker(dt) {
    if (!this.flags.stalker_on) return;
    const s = this.stalker, w = this.world, p = this.player;
    if (s.state === 'following') {
      if (s.follow && s.follow.map === w.id) {
        s.followT -= dt;
        if (s.followT <= 0) {
          s.place(w, s.follow.tx, s.follow.ty, 'chase');
          s.lastSeen = { x: p.x, y: p.y }; s.follow = null; s.lostT = 0;
          Sound.play('door'); this.fxText(s.x, s.y - 40, '...gefunden...', C.rd4, 2);
        }
      } else s.vanish(20);
      return;
    }
    if (s.state === 'gone') {
      s.vanishT -= dt;
      if (s.vanishT <= 0 && w.def.stalker) s.spawnFar(w, p);
      return;
    }
    if (s.map !== w.id) {
      if (w.def.stalker) { s.relocT -= dt; if (s.relocT <= 0) { s.spawnFar(w, p); s.relocT = U.rand(40, 70); } }
      return;
    }
    s.update(dt, this);
  },
  updateSanity(dt) {
    const p = this.player, w = this.world, s = this.stalker;
    const L = w.lightAt(p.x, p.y - 8);
    let ds = 0;
    if (p.hidden) ds -= 0.3;
    else if (L < 0.2) ds -= p.flashLit() ? 0.3 : 1.25;
    else if (L > 0.38) ds += 1.5;
    let danger = 0;
    if (this.flags.stalker_on && s.present(w) && s.state !== 'scripted') {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < 170 && w.los(p.x, p.y - 10, s.x, s.y - 20)) ds -= 3.5;
      danger = s.state === 'chase' ? 1 : U.clamp(1 - d / 240, 0, 0.8);
    }
    for (const c of this.crawlers) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < 110) ds -= 1.4;
      danger = Math.max(danger, U.clamp(1 - d / 150, 0, 0.75));
    }
    if (p.hp < 30) danger = Math.max(danger, 0.35);
    this.danger = danger;
    p.sanity = U.clamp(p.sanity + ds * dt, 0, 100);
    if (p.sanity <= 0) {
      p.hp -= 1.6 * dt;
      if (!this.flags.insane_warn) { this.flags.insane_warn = true; UI.toast('Ich verliere den Verstand... Ich brauche Licht.'); }
      if (p.hp <= 0) { p.hp = 0; this.gameOver('sanity'); return; }
    } else if (p.sanity > 20) this.flags.insane_warn = false;
    // Halluzinationen
    if (p.sanity < 45) {
      this.halluT -= dt;
      if (this.halluT <= 0) {
        this.halluT = U.rand(5, 11) * (p.sanity / 45 + 0.35);
        for (let k = 0; k < 12; k++) {
          const a = Math.random() * TAU, r = U.rand(70, 150);
          const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
          const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
          if (!w.navFree(tx, ty, true) || w.lightAt(x, y) > 0.3) continue;
          this.shades.push(new Shade(tx * TS + 8, ty * TS + 12));
          break;
        }
      }
    }
    if (p.sanity < 28) {
      this.fakeCountT -= dt;
      if (this.fakeCountT <= 0) {
        this.fakeCountT = U.rand(4, 9);
        const a = Math.random() * TAU;
        this.fxText(p.x + Math.cos(a) * 60, p.y - 20 + Math.sin(a) * 40, U.numWord(U.randi(60, 99)) + '...', C.pu4, 1.8);
        Sound.play('whisper');
      }
    }
  },
  updateWorldBits(dt) {
    const p = this.player, w = this.world;
    for (const o of w.objects) {
      if (o.type === 'crow' && !o.st.flown && Math.hypot(o.cx - p.x, o.cy - p.y) < 50) { o.st.flown = this.time; Sound.play('flap'); Sound.play('crow'); }
    }
    this.revealT -= dt;
    if (this.revealT <= 0) { this.revealT = 0.25; w.reveal(p.x, p.y); }
  },

  // ---------- Zeichnen ----------
  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    switch (this.state) {
      case 'boot': this.drawBoot(ctx); return;
      case 'title': this.title.draw(ctx); this.drawGrain(ctx); return;
      case 'intro': this.intro.draw(ctx); this.drawGrain(ctx); return;
      case 'gameover': this.goView.draw(ctx); this.drawGrain(ctx); return;
      case 'ending': this.endView.draw(ctx); this.drawGrain(ctx); return;
    }
    this.drawPlay(ctx);
  },
  drawBoot(ctx) {
    ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    Font.draw(ctx, 'GRAUWALD', VIEW_W / 2, 70, '#8d8676', { align: 'center', scale: 3 });
    if (Math.sin(this.time * 3) > -0.3) Font.draw(ctx, 'Klicken oder Taste drücken', VIEW_W / 2, 130, '#7d7889', { align: 'center' });
    Font.draw(ctx, 'Mit Kopfhörern. Im Dunkeln.', VIEW_W / 2, 190, '#3e3a46', { align: 'center' });
  },
  drawObj(ctx, o, cam) {
    const d = o.def;
    if (!d.draw) return;
    const x = o.x * TS - cam.x, y = o.y * TS - cam.y;
    if (d.cache) {
      const [ox, oy, cw, ch] = d.cache;
      const key = o.type + '|' + (d.ckey ? d.ckey(o) : '');
      const spr = Spr.get(key, cw, ch, (c) => { c.translate(-ox, -oy); d.draw(c, o, 0); });
      ctx.drawImage(spr, x + ox, y + oy);
    } else {
      ctx.save(); ctx.translate(x, y); d.draw(ctx, o, this.time); ctx.restore();
    }
  },
  drawPlay(ctx) {
    const w = this.world, p = this.player;
    if (!w) return;
    let sx = 0, sy = 0;
    if (this.shakeT > 0) { sx = Math.round((Math.random() - 0.5) * 2 * this.shakeAmt); sy = Math.round((Math.random() - 0.5) * 2 * this.shakeAmt); }
    const cam = { x: Math.round(this.cam.x) + sx, y: Math.round(this.cam.y) + sy };
    ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(w.baseCanvas, -cam.x, -cam.y);
    Tiles.drawWaterFx(ctx, w, cam, this.time);
    const flats = [], tops = [], ents = [];
    for (const o of w.objects) {
      if (!o.exists() || o.def.invisible || !o.def.draw) continue;
      const ox = o.x * TS - cam.x, oy = o.y * TS - cam.y;
      if (ox < -70 || oy < -60 || ox > VIEW_W + 70 || oy > VIEW_H + 90) continue;
      if (o.def.top) tops.push(o);
      else if (o.def.flat || o.def.wall) flats.push(o);
      else ents.push({ y: o.sortY(), o });
    }
    flats.forEach((o) => this.drawObj(ctx, o, cam));
    ents.push({ y: p.y, f: () => p.draw(ctx, cam, this.time) });
    const s = this.stalker;
    if (this.flags.stalker_on && s.present(w)) ents.push({ y: s.y, f: () => s.draw(ctx, cam, this.time) });
    this.crawlers.forEach((c) => ents.push({ y: c.y, f: () => c.draw(ctx, cam) }));
    this.shades.forEach((sh) => ents.push({ y: sh.y, f: () => sh.draw(ctx, cam, this.time) }));
    this.fx.forEach((f) => {
      if (f.type === 'apparition') ents.push({ y: f.y, f: () => { const a = Math.min(1, f.t * 3, (f.life - f.t) * 2) * (Math.random() < 0.15 ? 0.3 : 0.85); Chars.counter(ctx, f.x - cam.x, f.y - cam.y, f.dir || 'down', 0, { alpha: a }); } });
    });
    ents.sort((a, b) => a.y - b.y);
    ents.forEach((e) => (e.f ? e.f() : this.drawObj(ctx, e.o, cam)));
    ctx.drawImage(w.overCanvas, -cam.x, -cam.y);
    tops.forEach((o) => this.drawObj(ctx, o, cam));
    this.fx.forEach((f) => {
      if (f.type === 'windowFigure') {
        const x = f.x - cam.x, y = f.y - cam.y;
        G.R(ctx, x - 2, y - 8, 4, 8, '#020103'); G.R(ctx, x - 1, y - 9, 2, 1, '#020103'); G.P(ctx, x, y - 7, '#e8e2d0');
      }
    });
    // Wetter
    if (w.theme.outdoor || w.theme.moon) this.drawWeather(ctx, cam, w.theme.outdoor);
    // Licht
    const extra = [];
    Lighting.render(ctx, w, cam, p, this.time, {
      brightness: this.settings.bright * (this.devBright ? 0.3 : 1),
      flicker: this.flickerT > 0 ? 0.5 : 0,
      darkBoost: this.flickerT > 0 ? 0.03 : 0,
      extra,
    });
    // Umriss der Zählerin im Dunkeln – blasse Augen
    if (this.flags.stalker_on && s.present(w) && s.state !== 'gone') {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < 200) {
        const a = 0.06 + 0.2 * (1 - d / 200);
        Chars.counter(ctx, s.x - cam.x, s.y - cam.y, s.dir, s.frame, { alpha: a });
        if (s.dir !== 'up' && Math.sin(this.time * 2.3) > -0.9) { G.P(ctx, s.x - cam.x - 1, s.y - cam.y - 28, 'rgba(232,226,208,' + (0.3 + a) + ')'); }
      }
    }
    if (w.theme.outdoor && this.lightning > 0.05) { ctx.fillStyle = 'rgba(200,210,240,' + (this.lightning * 0.25).toFixed(3) + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    // schwebende Worte
    this.fx.forEach((f) => {
      if (f.type !== 'text') return;
      const a = Math.min(1, f.t * 4, (f.life - f.t) * 1.5);
      Font.draw(ctx, f.str, f.x - cam.x, f.y - cam.y - f.t * 6, f.col, { align: 'center', alpha: a, shadow: '#000', jitter: f.col === C.rd4 ? 1 : 0 });
    });
    this.drawPost(ctx);
    if (p.hidden) this.drawHidden(ctx);
    if (this.state === 'play') {
      if (this.canControl() && this.target) UI.prompt(ctx, this, this.target);
      UI.hud(ctx, this);
    }
    UI.drawToasts(ctx, 1 / 60);
    this.overlays.forEach((o) => o.draw(ctx));
    if (this.warping) {
      const t = this.warping.t;
      const a = t < 0.35 ? t / 0.35 : Math.max(0, 1 - (t - 0.35) / 0.4);
      ctx.fillStyle = 'rgba(5,4,7,' + U.clamp(a, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  },
  drawWeather(ctx, cam, rain) {
    const t = this.time;
    if (rain) {
      ctx.fillStyle = 'rgba(140,160,190,0.35)';
      this.rain.forEach((r) => { ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, 3 + Math.round(r.s * 2)); });
      for (let i = 0; i < 6; i++) { const x = (U.hash(Math.floor(t * 8), i, 1) * VIEW_W) | 0, y = (U.hash(Math.floor(t * 8), i, 2) * VIEW_H) | 0; G.P(ctx, x, y, 'rgba(160,180,210,0.4)'); G.P(ctx, x - 1, y, 'rgba(160,180,210,0.25)'); G.P(ctx, x + 1, y, 'rgba(160,180,210,0.25)'); }
    }
    const fx = (-(cam.x * 0.5) - t * 6) % (VIEW_W * 2), fy = (-(cam.y * 0.5)) % (VIEW_H * 2);
    ctx.globalAlpha = rain ? 0.32 : 0.2;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) ctx.drawImage(this.fog, fx + i * VIEW_W * 2, fy + j * VIEW_H * 2, VIEW_W * 2, VIEW_H * 2);
    ctx.globalAlpha = 1;
  },
  drawPost(ctx) {
    const p = this.player;
    if (p.sanity < 35) {
      this.bctx.clearRect(0, 0, VIEW_W, VIEW_H);
      this.bctx.drawImage(this.canvas, 0, 0);
      const k = 1 - p.sanity / 35;
      if (p.sanity < 20) {
        ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        for (let y = 0; y < VIEW_H; y += 2) {
          const off = Math.round(Math.sin(this.time * 2.2 + y * 0.06) * k * 3);
          ctx.drawImage(this.buf, 0, y, VIEW_W, 2, off, y, VIEW_W, 2);
        }
      }
      ctx.globalAlpha = 0.18 + k * 0.18;
      ctx.drawImage(this.buf, Math.round(Math.sin(this.time * 1.3) * 3 * k) + 2, 0);
      ctx.globalAlpha = 1;
    }
    const va = 0.55 + (1 - p.sanity / 100) * 0.45;
    ctx.globalAlpha = va; ctx.drawImage(this.vignette, 0, 0); ctx.globalAlpha = 1;
    if (p.hp < 35) { ctx.globalAlpha = (0.35 + Math.sin(this.time * 5) * 0.2) * (1 - p.hp / 35); ctx.drawImage(this.redVignette, 0, 0); ctx.globalAlpha = 1; }
    if (this.flashT > 0) { ctx.globalAlpha = (this.flashT / this.flashDur) * 0.6; ctx.fillStyle = this.flashCol; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1; }
    this.drawGrain(ctx);
  },
  drawGrain(ctx) {
    if (!this.settings.grain || !this.grain) return;
    ctx.drawImage(this.grain[Math.floor(this.time * 24) % this.grain.length], 0, 0);
  },
  drawHidden(ctx) {
    const p = this.player, bed = p.hidden && p.hidden.type === 'bed';
    const t = this.time;
    if (bed) {
      const y0 = Math.round(VIEW_H / 2 + 18);
      G.R(ctx, 0, 0, VIEW_W, y0, '#030204'); G.R(ctx, 0, y0 + 14, VIEW_W, VIEW_H - y0 - 14, '#030204');
      G.R(ctx, 0, y0 - 3, VIEW_W, 3, '#1a110d'); G.R(ctx, 0, y0 + 14, VIEW_W, 2, '#1a110d');
      for (let i = 0; i < VIEW_W; i += 22) G.R(ctx, i, y0 - 6, 4, 3, '#2a1b13');
    } else {
      const sw = 14 + Math.round(Math.sin(t * 0.8) * 1);
      const x0 = Math.round(VIEW_W / 2 - sw / 2);
      G.R(ctx, 0, 0, x0, VIEW_H, '#030204'); G.R(ctx, x0 + sw, 0, VIEW_W - x0 - sw, VIEW_H, '#030204');
      for (let y = 0; y < VIEW_H; y += 4) { G.R(ctx, x0 - 6, y, 6, 3, '#1a110d'); G.R(ctx, x0 + sw, y, 6, 3, '#1a110d'); }
      G.R(ctx, x0 - 1, 0, 1, VIEW_H, '#2a1b13'); G.R(ctx, x0 + sw, 0, 1, VIEW_H, '#2a1b13');
    }
    Font.draw(ctx, '[E] Herauskommen', VIEW_W - 8, VIEW_H - 14, '#5a5262', { align: 'right' });
    if (this.hideDanger) {
      const held = Input.held('hold');
      Font.draw(ctx, held ? 'Atem anhalten...' : 'Sie ist ganz nah. [Leertaste] halten: Atem anhalten', VIEW_W / 2, 20, held ? '#a3bfd6' : '#c8323a', { align: 'center', jitter: held ? 0 : 1 });
      G.R(ctx, VIEW_W / 2 - 41, 34, 82, 6, '#050407');
      G.R(ctx, VIEW_W / 2 - 40, 35, Math.round(80 * p.breath), 4, p.breath < 0.3 ? C.rd4 : C.bl5);
    }
  },
};

// ------------------------------------------------------------
//  Titelbild
// ------------------------------------------------------------
class TitleScreen {
  constructor() {
    this.t = 0;
    this.build();
  }
  build() {
    const hasSave = Game.hasSave();
    this.menu = new UI.ListMenu(null, [
      { id: 'new', label: 'Neues Spiel' },
      { id: 'cont', label: 'Fortsetzen', disabled: !hasSave },
      { id: 'opts', label: 'Optionen' },
      { id: 'ctrl', label: 'Steuerung' },
    ], { w: 150, y: 128, noDim: true });
    if (hasSave) this.menu.sel = 1;
    this.sub = null;
  }
  update(dt) {
    this.t += dt;
    if (this.sub) {
      this.sub.update(dt);
      if (this.sub.done) {
        const s = this.sub; this.sub = null;
        if (s.kind === 'confirm' && s.result === 0) { Sound.stopMusic(); Game.newGame(); }
      }
      return;
    }
    this.menu.update(dt);
    if (this.menu.done) {
      const r = this.menu.result;
      this.menu.done = false;
      if (r === 'new') {
        if (Game.hasSave()) { this.sub = new UI.Choice('Ein neues Spiel überschreibt den alten Spielstand.', ['Neues Spiel beginnen', 'Abbrechen'], { cancel: 1 }); this.sub.kind = 'confirm'; }
        else { Sound.stopMusic(); Game.newGame(); }
      } else if (r === 'cont') { Sound.stopMusic(); Game.load(); }
      else if (r === 'opts') this.sub = Game.optionsMenu();
      else if (r === 'ctrl') this.sub = new UI.ControlsView();
    }
  }
  draw(ctx) {
    const t = this.t;
    // Himmel in Bändern
    const bands = ['#07060c', '#0a0912', '#0d0c17', '#11101c', '#151422', '#191828'];
    for (let i = 0; i < bands.length; i++) { G.R(ctx, 0, i * 22, VIEW_W, 22, bands[i]); G.dither(ctx, 0, i * 22 + 20, VIEW_W, 2, bands[Math.min(bands.length - 1, i + 1)]); }
    G.R(ctx, 0, bands.length * 22, VIEW_W, VIEW_H, '#191828');
    // Mond
    G.disc(ctx, 344, 30, 13, 13, '#2a2a3a'); G.disc(ctx, 344, 30, 11, 11, '#c9c4b4'); G.disc(ctx, 348, 27, 9, 9, '#2a2a3a');
    // Haus-Silhouette
    const H = '#040306';
    G.R(ctx, 120, 70, 150, 90, H);
    for (let i = 0; i < 30; i++) G.R(ctx, 112 + i * 2, 70 - i, 166 - i * 4, 1, H);
    G.R(ctx, 150, 30, 12, 30, H); G.R(ctx, 236, 36, 10, 26, H);
    G.R(ctx, 270, 100, 40, 60, H); for (let i = 0; i < 14; i++) G.R(ctx, 266 + i, 100 - i, 48 - i * 2, 1, H);
    const win = [[134, 90], [158, 90], [182, 90], [206, 90], [230, 90], [254, 90], [134, 118], [182, 118], [230, 118], [254, 118], [282, 116]];
    win.forEach(([x, y], i) => {
      const lit = i === 4 ? (Math.sin(t * 7) + Math.sin(t * 13) > -0.6) : false;
      G.R(ctx, x, y, 8, 11, lit ? '#c39a3f' : '#0d0f18');
      if (lit) { G.R(ctx, x + 3, y, 1, 11, '#5e4a1f'); G.R(ctx, x, y + 5, 8, 1, '#5e4a1f'); }
    });
    // Gestalt beim Blitz
    if (Game.lightning > 0.4 && Game.titleFlashFig) { G.R(ctx, 92, 112, 4, 40, H); G.R(ctx, 91, 106, 6, 8, H); G.R(ctx, 89, 114, 1, 26, H); G.R(ctx, 98, 114, 1, 26, H); }
    // Bäume
    for (let i = 0; i < 9; i++) {
      const bx = i < 4 ? i * 26 - 10 : 300 + (i - 4) * 22, bh = 60 + (i * 37) % 40;
      G.R(ctx, bx + 10, VIEW_H - bh, 4, bh, H);
      for (let k = 0; k < 6; k++) G.disc(ctx, bx + 12 + ((k * 13) % 9) - 4, VIEW_H - bh + k * 8, 12 - k, 7, H);
    }
    G.R(ctx, 0, 158, VIEW_W, 60, H);
    // Regen + Nebel
    ctx.fillStyle = 'rgba(120,140,170,0.3)';
    Game.rain.forEach((r) => ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, 4));
    ctx.globalAlpha = 0.35;
    ctx.drawImage(Game.fog, (-t * 8) % (VIEW_W * 2), 90, VIEW_W * 2, VIEW_H * 1.2);
    ctx.drawImage(Game.fog, (-t * 8) % (VIEW_W * 2) + VIEW_W * 2, 90, VIEW_W * 2, VIEW_H * 1.2);
    ctx.globalAlpha = 1;
    if (Game.lightning > 0.05) { ctx.fillStyle = 'rgba(210,215,240,' + (Game.lightning * 0.35).toFixed(3) + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    // Titel
    const title = 'GRAUWALD';
    const sc = 4;
    const tw = Font.width(title) * sc;
    const tx = Math.round(VIEW_W / 2 - tw / 2), ty = 30;
    Font.draw(ctx, title, tx + 2, ty + 2, '#000', { scale: sc });
    Font.draw(ctx, title, tx, ty, '#b9b19d', { scale: sc });
    G.R(ctx, tx, ty + 4, tw, 4, 'rgba(255,255,255,0.06)');
    // tropfende Pixel
    for (let i = 0; i < 7; i++) {
      const dx = tx + 6 + ((i * 53) % (tw - 10));
      const ph = (t * 0.6 + i * 0.37) % 1;
      const len = Math.floor(ph * 18);
      G.R(ctx, dx, ty + 28, 2, Math.min(len, 6) + 1, '#7e1d24');
      if (len > 6) G.R(ctx, dx, ty + 28 + len, 2, 2, '#a52a2f');
    }
    Font.draw(ctx, 'Sie zählt bis hundert.', VIEW_W / 2, ty + 42, '#7d7889', { align: 'center' });
    this.menu.draw(ctx);
    let ends = [];
    try { ends = JSON.parse(localStorage.getItem(END_KEY)) || []; } catch (e) { /* */ }
    Font.draw(ctx, 'Enden: ' + ends.length + '/3', 8, VIEW_H - 13, '#4e4a58');
    Font.draw(ctx, 'v1.0', VIEW_W - 8, VIEW_H - 13, '#3e3a46', { align: 'right' });
    if (this.sub) this.sub.draw(ctx);
  }
}

// ------------------------------------------------------------
//  Vorspann
// ------------------------------------------------------------
class IntroView {
  constructor() {
    this.lines = [
      'Drei Tage ist es her, dass Theo verschwunden ist.',
      'Die Polizei sagt, Zehnjährige laufen manchmal weg. Mama sagt gar nichts mehr.',
      'Heute Nacht um 2:14 hat mein Handy geklingelt. Unbekannte Nummer. Nur Rauschen.',
      'Dann Theos Stimme, ganz leise:',
      '{b}»Mara... sie zählt. Ich hab mich bei Oma versteckt. Sie findet mich nicht. Komm schnell.«{/}',
      'Omas Haus steht seit ihrer Beerdigung leer. Grauwald. Zwei Stunden Fahrt.',
      'Ich bin sofort losgefahren.',
    ];
    this.i = 0; this.chars = 0; this.t = 0; this.out = 0;
  }
  update(dt) {
    this.t += dt;
    if (this.out > 0) { this.out += dt; if (this.out > 1.2) Game.beginPlay(); return; }
    if (Input.hit('back')) { this.out = 0.01; return; }
    const l = this.lines[this.i];
    const len = Font.len(l);
    if (this.chars < len) {
      const before = Math.floor(this.chars);
      this.chars = Math.min(len, this.chars + dt * 34);
      if (Math.floor(this.chars) !== before && before % 2 === 0) Sound.play('blip');
      if (Input.hit('ok')) this.chars = len;
    } else if (Input.hit('ok')) {
      Sound.play('ui');
      this.i++; this.chars = 0;
      if (this.i === 4) Sound.play('whisper');
      if (this.i >= this.lines.length) { this.i = this.lines.length - 1; this.chars = len; this.out = 0.01; }
    }
  }
  draw(ctx) {
    ctx.fillStyle = '#040306'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.i >= 2 && this.i <= 4) for (let k = 0; k < 40; k++) G.P(ctx, Math.random() * VIEW_W, Math.random() * VIEW_H, 'rgba(120,120,140,0.15)');
    for (let k = 0; k < this.i; k++) {
      const ls = Font.wrap(this.lines[k], 300);
      void ls;
    }
    const l = this.lines[this.i];
    const lines = Font.wrap(l, 300);
    let left = this.chars;
    const y0 = Math.round(VIEW_H / 2 - (lines.length * Font.LINE) / 2);
    lines.forEach((ln, k) => {
      const n = Math.min(Font.len(ln), Math.max(0, Math.floor(left)));
      left -= Font.len(ln) + 1;
      Font.draw(ctx, ln, VIEW_W / 2 - 150, y0 + k * Font.LINE, '#cfc6b0', { max: n });
    });
    if (this.chars >= Font.len(l) && Math.sin(this.t * 6) > 0 && !this.out) Font.draw(ctx, '▼', VIEW_W / 2 + 150, y0 + lines.length * Font.LINE + 4, '#e8c46a');
    Font.draw(ctx, 'Esc überspringen', VIEW_W - 8, VIEW_H - 13, '#2e2b37', { align: 'right' });
    if (this.out > 0) { ctx.fillStyle = 'rgba(4,3,6,' + U.clamp(this.out / 1.2, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }
}

// ------------------------------------------------------------
//  Spielende (Tod)
// ------------------------------------------------------------
class GameOverView {
  constructor(cause) {
    this.t = 0;
    this.text = cause === 'crawler' ? 'ES HAT DICH GEHÖRT.' : cause === 'sanity' ? 'DEIN VERSTAND IST ZERBROCHEN.' : 'SIE HAT DICH GEFUNDEN.';
    this.sub = cause === 'crawler' ? 'Wer schleicht, kommt vorbei.' : cause === 'sanity' ? 'Licht hilft. Kerzen, Lampen, Gästebücher.' : 'Licht verrät dich. Schränke und Betten verstecken dich.';
    this.menu = new UI.ListMenu(null, [{ id: 'load', label: 'Letzter Speicherstand', disabled: !Game.hasSave() }, { id: 'title', label: 'Hauptmenü' }], { w: 170, y: 140, noDim: true });
    if (!Game.hasSave()) this.menu.sel = 1;
  }
  update(dt) {
    this.t += dt;
    if (this.t < 2) return;
    this.menu.update(dt);
    if (this.menu.done) {
      this.menu.done = false;
      if (this.menu.result === 'load') Game.load();
      else if (this.menu.result === 'title') Game.toTitle();
    }
  }
  draw(ctx) {
    const a = U.clamp(this.t / 1.5, 0, 1);
    ctx.fillStyle = '#050304'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = a * 0.5;
    ctx.drawImage(Game.redVignette, 0, 0);
    ctx.globalAlpha = 1;
    if (this.t > 0.6) {
      Font.draw(ctx, this.text, VIEW_W / 2, 64, '#a52a2f', { align: 'center', scale: 2, jitter: this.t < 2.5 ? 1 : 0, alpha: U.clamp((this.t - 0.6) * 2, 0, 1) });
      Font.draw(ctx, this.sub, VIEW_W / 2, 98, '#7d7889', { align: 'center', alpha: U.clamp(this.t - 1.2, 0, 1) });
    }
    if (this.t > 1.2 && this.t < 3.5) Chars.counter(ctx, VIEW_W / 2, 196, 'down', 0, { alpha: Math.max(0, 0.5 - (this.t - 1.2) * 0.2) });
    if (this.t >= 2) this.menu.draw(ctx);
  }
}

// ------------------------------------------------------------
//  Abspann
// ------------------------------------------------------------
class EndingView {
  constructor(id) {
    this.id = id; this.e = ENDINGS[id]; this.i = 0; this.chars = 0; this.t = 0; this.phase = 'lines'; this.pt = 0;
  }
  update(dt) {
    this.t += dt; this.pt += dt;
    if (this.phase === 'lines') {
      const l = this.e.lines[this.i];
      if (this.chars < Font.len(l)) { this.chars = Math.min(Font.len(l), this.chars + dt * 30); if (Input.hit('ok')) this.chars = Font.len(l); }
      else if (Input.hit('ok')) {
        Sound.play('ui');
        this.i++; this.chars = 0;
        if (this.i >= this.e.lines.length) { this.phase = 'title'; this.pt = 0; Sound.play('bell', 330); }
      }
    } else if (this.phase === 'title') {
      if (this.pt > 2 && Input.hit('ok')) { this.phase = 'credits'; this.pt = 0; }
    } else if (this.phase === 'credits') {
      if (this.pt > 16 || (this.pt > 1 && Input.hit('ok'))) Game.toTitle();
    }
  }
  scene(ctx) {
    const t = this.t, H = '#040306';
    const sc = this.e.scene;
    if (sc === 'dawn') {
      const cols = ['#2a2238', '#3d2c44', '#5a3a4a', '#7a4e4e', '#9c6a56', '#b88a62'];
      cols.forEach((c, i) => { G.R(ctx, 0, i * 18, VIEW_W, 18, c); G.dither(ctx, 0, i * 18 + 16, VIEW_W, 2, cols[Math.min(5, i + 1)]); });
      G.disc(ctx, 290, 104, 18, 10, '#e8c46a');
    } else if (sc === 'night') {
      G.R(ctx, 0, 0, VIEW_W, 110, '#0b0a14'); G.dither(ctx, 0, 80, VIEW_W, 30, '#141322');
    } else {
      G.R(ctx, 0, 0, VIEW_W, 110, '#0a0a12');
    }
    G.R(ctx, 120, 50, 120, 60, H); for (let i = 0; i < 22; i++) G.R(ctx, 114 + i * 2, 50 - i, 132 - i * 4, 1, H);
    if (sc === 'night') G.R(ctx, 196, 66, 7, 9, (Math.sin(t * 5) > -0.8) ? '#c39a3f' : '#5e4a1f');
    for (let i = 0; i < 10; i++) { const bx = i * 40 - 10, bh = 40 + (i * 29) % 30; G.R(ctx, bx + 10, 110 - bh, 4, bh, H); for (let k = 0; k < 4; k++) G.disc(ctx, bx + 12, 110 - bh + k * 8, 10 - k, 6, H); }
    G.R(ctx, 0, 108, VIEW_W, 4, H);
    if (sc === 'dawn') { Chars.person(ctx, 180 + Math.min(40, t * 3), 106, 'right', Math.floor(t * 4) % 4, 'mara'); Chars.person(ctx, 168 + Math.min(40, t * 3), 106, 'right', Math.floor(t * 4 + 2) % 4, 'theo'); }
    if (sc === 'car') { G.R(ctx, 0, 100, VIEW_W, 10, '#121218'); G.R(ctx, 160 + ((t * 30) % 300) - 150, 92, 28, 10, '#4a1418'); }
    if (sc !== 'dawn') { ctx.fillStyle = 'rgba(120,140,170,0.3)'; Game.rain.forEach((r) => { if (r.y < 110) ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, 3); }); Game.updateRain(1 / 60); }
  }
  draw(ctx) {
    ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.phase === 'credits') {
      const lines = [
        'GRAUWALD', '', 'Ein Horrorspiel in Pixeln.', '', 'Für alle, die beim Versteckspiel',
        'zu gut versteckt waren.', '', 'Danke fürs Suchen.', '', '', '',
        'Spielzeit: ' + U.fmtTime(Game.playTime), 'Tode: ' + Game.deaths,
        'Tagebuchseiten: ' + Story.pages().length + '/4',
        'Zeichnungen: ' + Game.notes.filter((x) => NOTES[x].kind === 'drawing').length + '/6',
      ];
      const y0 = VIEW_H - this.pt * 18;
      lines.forEach((l, i) => Font.draw(ctx, l, VIEW_W / 2, y0 + i * 14, i === 0 ? '#e8c46a' : '#b9b19d', { align: 'center', scale: i === 0 ? 2 : 1 }));
      return;
    }
    this.scene(ctx);
    ctx.fillStyle = 'rgba(5,4,7,0.0)';
    G.R(ctx, 0, 112, VIEW_W, VIEW_H - 112, '#050407');
    if (this.phase === 'lines') {
      const l = this.e.lines[this.i];
      const ls = Font.wrap(l, 330);
      let left = this.chars;
      ls.forEach((ln, k) => { const n = Math.min(Font.len(ln), Math.max(0, Math.floor(left))); left -= Font.len(ln) + 1; Font.draw(ctx, ln, 27, 132 + k * Font.LINE, '#d8cfb8', { max: n }); });
      if (this.chars >= Font.len(l) && Math.sin(this.t * 6) > 0) Font.draw(ctx, '▼', VIEW_W - 24, VIEW_H - 18, '#e8c46a');
    } else {
      const a = U.clamp(this.pt / 1.5, 0, 1);
      Font.draw(ctx, this.e.title, VIEW_W / 2, 140, '#e8c46a', { align: 'center', scale: 2, alpha: a });
      if (this.pt > 2 && Math.sin(this.t * 4) > 0) Font.draw(ctx, '▼', VIEW_W / 2, 186, '#7d7889', { align: 'center' });
    }
  }
}

window.addEventListener('load', () => Game.init());

// Entwickler-Helfer (Konsole): Game.dev.warp('eg', 24, 20)
Game.dev = {
  warp(map, x, y) { const d = getMapDef(map); Game.loadMap(map, x === undefined ? d.spawn.x : x, y === undefined ? d.spawn.y : y, 'down', { noSave: true }); },
  give(id, n) { Game.give(id, n || 1, true); },
  all() { ['taschenlampe', 'brecheisen', 'kellerschluessel', 'gewaechshausschluessel', 'messingschluessel', 'kapellenschluessel', 'kurbel', 'ventilrad', 'notenblatt'].forEach((i) => Game.give(i, 1, true)); Game.give('batterie', 5, true); Game.give('sicherung', 2, true); Game.player.flashOn = true; },
  power() { Game.flags.power = true; },
  bright(v) { Game.devBright = v !== false; },
};
