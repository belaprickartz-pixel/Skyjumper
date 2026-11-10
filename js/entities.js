'use strict';
// ------------------------------------------------------------
//  Figuren mit Verhalten: Spielerin, Zählerin, Kriecher, Schemen
// ------------------------------------------------------------
class Player {
  constructor() {
    this.x = 0; this.y = 0; this.dir = 'down'; this.frame = 0; this.animT = 0;
    this.hp = 100; this.sanity = 100; this.stamina = 100; this.battery = 100;
    this.flashOn = false; this.hidden = null;
    this.aim = Math.PI / 2; this.stepT = 0; this.hurtT = 0; this.exhausted = false;
    this.breath = 1; this.kx = 0; this.ky = 0; this.moving = false; this.mode = 'walk';
    this.emptyWarned = false;
  }
  hasLamp() { return !!Game.inv.taschenlampe; }
  flashLit() { return this.flashOn && this.hasLamp() && this.battery > 0 && !this.hidden; }
  blocked(x, y) { return Game.world.rectBlocked(x - 4, y - 4, 8, 5); }
  move(dx, dy) {
    if (dx) {
      const nx = this.x + dx;
      if (!this.blocked(nx, this.y)) this.x = nx;
      else if (!dy) {
        for (let off = 1; off <= 7; off++) {
          let done = false;
          for (const s of [-1, 1]) {
            if (!this.blocked(nx, this.y + off * s) && !this.blocked(this.x, this.y + s)) { this.y += s * Math.min(1, Math.abs(dx) * 1.5); done = true; break; }
          }
          if (done) break;
        }
      }
    }
    if (dy) {
      const ny = this.y + dy;
      if (!this.blocked(this.x, ny)) this.y = ny;
      else if (!dx) {
        for (let off = 1; off <= 7; off++) {
          let done = false;
          for (const s of [-1, 1]) {
            if (!this.blocked(this.x + off * s, ny) && !this.blocked(this.x + s, this.y)) { this.x += s * Math.min(1, Math.abs(dy) * 1.5); done = true; break; }
          }
          if (done) break;
        }
      }
    }
  }
  update(dt, game) {
    this.hurtT = Math.max(0, this.hurtT - dt);
    if (this.hidden) { this.moving = false; this.stamina = Math.min(100, this.stamina + 25 * dt); return; }
    let ix = 0, iy = 0;
    if (game.canControl()) {
      if (Input.held('left')) ix -= 1;
      if (Input.held('right')) ix += 1;
      if (Input.held('up')) iy -= 1;
      if (Input.held('down')) iy += 1;
    }
    const moving = ix !== 0 || iy !== 0;
    const sneak = Input.held('sneak');
    let sprint = Input.held('sprint') && !sneak && !this.exhausted && moving;
    let speed = sneak ? 30 : sprint ? 92 : 55;
    if (this.hp < 30) speed *= 0.85;
    this.mode = !moving ? 'still' : sneak ? 'sneak' : sprint ? 'sprint' : 'walk';
    if (sprint) {
      this.stamina -= 30 * dt;
      if (this.stamina <= 0) { this.stamina = 0; this.exhausted = true; Sound.play('gasp'); }
    } else {
      this.stamina = Math.min(100, this.stamina + (moving ? 16 : 26) * dt);
      if (this.exhausted && this.stamina > 35) this.exhausted = false;
    }
    if (moving) {
      if (ix && iy) {
        const d = U.dirVec(this.dir);
        if (!((d[0] === ix) || (d[1] === iy))) this.dir = ix < 0 ? 'left' : 'right';
      } else if (ix) this.dir = ix < 0 ? 'left' : 'right';
      else this.dir = iy < 0 ? 'up' : 'down';
      const len = Math.hypot(ix, iy);
      this.move((ix / len) * speed * dt, (iy / len) * speed * dt);
      this.animT += dt * speed * 0.13;
      this.frame = Math.floor(this.animT) % 4;
      this.stepT -= dt * speed / 55;
      if (this.stepT <= 0) {
        this.stepT = 0.38;
        const surf = game.world.surfaceAt(this.x, this.y);
        Sound.play('step', surf, sneak ? 0.35 : sprint ? 1.4 : 0.9);
        game.noise(this.x, this.y, sneak ? 0 : sprint ? 150 : 62, 'step');
      }
    } else { this.frame = 0; this.animT = 0.99; }
    if (this.kx || this.ky) {
      this.move(this.kx * dt, this.ky * dt);
      this.kx *= Math.pow(0.02, dt); this.ky *= Math.pow(0.02, dt);
      if (Math.abs(this.kx) < 2 && Math.abs(this.ky) < 2) { this.kx = this.ky = 0; }
    }
    // Lampe zielt weich in Blickrichtung
    const target = U.dirAngle(this.dir) + Math.sin(game.time * 1.7) * 0.03;
    this.aim += U.angDiff(this.aim, target) * Math.min(1, dt * 12);
    if (this.flashLit()) {
      this.battery = Math.max(0, this.battery - 0.45 * dt);
      if (this.battery <= 0 && !this.emptyWarned) {
        this.emptyWarned = true;
        Sound.play('click');
        UI.toast(Game.inv.batterie ? 'Die Batterie ist leer. [R] wechseln.' : 'Die Batterie ist leer.');
      }
    }
  }
  draw(ctx, cam, t) {
    if (this.hidden) return;
    if (this.hurtT > 0 && Math.floor(t * 20) % 2) return;
    Chars.person(ctx, this.x - cam.x, this.y - cam.y, this.dir, this.frame, 'mara');
    // Lampe in der Hand
    if (this.hasLamp()) {
      const [dx, dy] = U.dirVec(this.dir);
      const hx = Math.round(this.x - cam.x + dx * 5 + (this.dir === 'down' ? 4 : this.dir === 'up' ? -4 : 0));
      const hy = Math.round(this.y - cam.y - 7 + dy * 2);
      G.R(ctx, hx, hy, 2, 2, C.st4);
      if (this.flashLit()) G.P(ctx, hx + (dx > 0 ? 1 : 0), hy + (dy > 0 ? 1 : 0), C.yl5);
    }
  }
}

// ------------------------------------------------------------
//  Die Zählerin
// ------------------------------------------------------------
class Stalker {
  constructor() { this.reset(); }
  reset() {
    this.map = null; this.x = 0; this.y = 0; this.dir = 'down'; this.state = 'gone';
    this.path = null; this.pathT = 0; this.target = null; this.timer = 0;
    this.count = 1; this.countT = 0; this.animT = 0; this.frame = 0;
    this.lastSeen = null; this.lostT = 0; this.vanishT = 20; this.relocT = 35;
    this.follow = null; this.followT = 0; this.seenHide = false; this.screamT = 0;
    this.stepT = 0; this.twitch = 0; this.speedMul = 1; this.searchNear = 0;
  }
  present(world) { return this.state !== 'gone' && this.map === world.id; }
  place(world, tx, ty, state) {
    this.map = world.id; this.x = tx * TS + 8; this.y = ty * TS + 12;
    this.state = state || 'wander'; this.path = null; this.timer = 0; this.lostT = 0;
    if (this.state === 'wander') this.count = 1;
  }
  spawnFar(world, player) {
    const p = world.randomFloor({ x: player.x, y: player.y }, 220, true);
    if (p) { this.place(world, p[0], p[1], 'wander'); return true; }
    return false;
  }
  vanish(t) { this.state = 'gone'; this.vanishT = t || U.rand(25, 40); this.path = null; this.follow = null; }
  canSee(game) {
    const p = game.player;
    if (p.hidden) return false;
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    let vis = 92;
    if (p.flashLit()) vis = 190;
    else if (game.world.lightAt(p.x, p.y - 8) > 0.45) vis = 150;
    if (p.mode === 'sneak' && !p.flashLit()) vis *= 0.6;
    if (d > vis) return false;
    // Blickrichtung grob beachten (hinter ihr sieht sie schlechter)
    const [fx, fy] = U.dirVec(this.dir);
    const dot = ((p.x - this.x) * fx + (p.y - this.y) * fy) / (d || 1);
    if (dot < -0.3 && d > 40 && this.state !== 'chase') return false;
    return game.world.los(this.x, this.y - 24, p.x, p.y - 10);
  }
  setPath(world, tx, ty) {
    this.path = world.findPath(Math.floor(this.x / TS), Math.floor(this.y / TS), tx, ty, true);
    this.target = [tx, ty];
  }
  step(world, speed, dt) {
    if (!this.path || !this.path.length) return true;
    const [nx, ny] = this.path[0];
    const gx = nx * TS + 8, gy = ny * TS + 12;
    const dx = gx - this.x, dy = gy - this.y;
    const d = Math.hypot(dx, dy);
    // Türen öffnen
    for (const o of world.grid[ny * world.w + nx]) {
      if ((o.type === 'door') && !o.st.open && !(o.p.locked && !o.st.unlocked) && o.orient !== 'exit') {
        o.st.open = true; world.invalidateNav(); Sound.play('door');
      }
    }
    if (d < 2) { this.path.shift(); return !this.path.length; }
    const m = Math.min(d, speed * dt);
    this.x += (dx / d) * m; this.y += (dy / d) * m;
    this.face(dx, dy);
    return false;
  }
  face(dx, dy) { if (Math.abs(dx) > Math.abs(dy)) this.dir = dx < 0 ? 'left' : 'right'; else if (dy) this.dir = dy < 0 ? 'up' : 'down'; }
  hear(x, y, r) {
    if (this.state === 'chase' || this.state === 'gone' || this.state === 'attack') return;
    if (Math.hypot(x - this.x, y - this.y) < r) {
      this.state = 'investigate'; this.lastSeen = { x, y }; this.path = null; this.timer = 0;
    }
  }
  startChase(game) {
    if (this.state !== 'chase') {
      if (this.screamT <= 0) { Sound.play('scream'); this.screamT = 12; game.fxText(this.x, this.y - 40, 'GEFUNDEN.', C.rd4, 2); game.shake(3, 0.5); }
      game.player.sanity = Math.max(0, game.player.sanity - 8);
    }
    this.state = 'chase'; this.lostT = 0;
  }
  attack(game) {
    const p = game.player;
    const dmg = p.hidden ? 50 : 40;
    if (p.hidden) { game.unhide(true); UI.toast('Sie hat dich aus dem Versteck gezerrt.'); }
    game.damage(dmg, 'stalker', this.x, this.y);
    p.sanity = Math.max(0, p.sanity - 18);
    game.fxText(this.x, this.y - 40, '...eins.', C.bn2, 2.5);
    this.vanish();
  }
  update(dt, game) {
    const w = game.world, p = game.player;
    this.screamT -= dt;
    this.animT += dt * (this.state === 'chase' ? 9 : 4);
    this.frame = Math.floor(this.animT);
    if (Math.random() < dt * 0.6) this.twitch = 0.12;
    this.twitch = Math.max(0, this.twitch - dt);
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    const sees = this.canSee(game);
    // Zählen
    if (this.state !== 'chase' && this.state !== 'scripted') {
      this.countT += dt;
      if (this.countT > 1.25) {
        this.countT = 0;
        if (d < 300) { game.fxText(this.x + U.rand(-6, 6), this.y - 40, U.numWord(this.count) + (this.count < 100 ? '...' : '.'), this.count > 90 ? C.rd4 : C.bn1, 1.6); if (d < 240) Sound.play('count', this.count); }
        this.count++;
        if (this.count > 100) {
          this.count = 1;
          this.state = 'investigate'; this.lastSeen = { x: p.x, y: p.y }; this.path = null;
          game.fxText(this.x, this.y - 48, 'ICH KOMME.', C.rd4, 2.5);
        }
      }
    }
    // Schritte
    this.stepT -= dt;
    if (this.stepT <= 0 && d < 220) { this.stepT = this.state === 'chase' ? 0.32 : 0.62; Sound.play('step', 'wood', U.clamp(1.6 - d / 140, 0.1, 1.4)); }

    if (this.state === 'scripted') return;
    if (sees && this.state !== 'attack' && !(this.state === 'idle' && this.afterIdle)) { this.lastSeen = { x: p.x, y: p.y }; this.startChase(game); }
    const sm = this.speedMul;
    switch (this.state) {
      case 'wander':
      case 'idle': {
        if (this.state === 'idle') {
          this.timer -= dt;
          if (this.timer <= 0) {
            const nx = this.afterIdle || 'wander';
            this.afterIdle = null;
            if (nx === 'chase') { this.lastSeen = { x: p.x, y: p.y }; this.startChase(game); }
            else this.state = nx;
            this.path = null;
          }
          break;
        }
        if (!this.path || !this.path.length) {
          const t = w.randomFloor(null, 0, true);
          if (t) this.setPath(w, t[0], t[1]);
          if (!this.path) { this.state = 'idle'; this.timer = 1; }
        }
        if (this.step(w, 28 * sm, dt)) { this.state = 'idle'; this.timer = U.rand(1, 3); this.path = null; }
        break;
      }
      case 'investigate': {
        this.pathT -= dt;
        if (!this.path || this.pathT <= 0) {
          this.pathT = 1.5;
          if (this.lastSeen) this.setPath(w, Math.floor(this.lastSeen.x / TS), Math.floor(this.lastSeen.y / TS));
        }
        if (!this.path || this.step(w, 44 * sm, dt)) { this.state = 'search'; this.timer = 5; this.path = null; }
        break;
      }
      case 'search': {
        this.timer -= dt;
        if (Math.random() < dt * 1.2) this.dir = U.pick(['up', 'down', 'left', 'right']);
        if (this.timer <= 0) { this.state = 'wander'; this.count = 1; }
        break;
      }
      case 'chase': {
        if (p.hidden) {
          if (this.seenHide) {
            const hb = p.hidden;
            this.pathT -= dt;
            if (!this.path || this.pathT <= 0) { this.pathT = 0.5; this.setPath(w, Math.floor(p.x / TS), Math.floor(p.y / TS)); }
            this.step(w, 64 * sm, dt);
            if (d < 18) { this.attack(game); return; }
            void hb;
          } else {
            this.state = 'investigate'; this.path = null;
          }
          break;
        }
        if (!sees) { this.lostT += dt; if (this.lostT > 2.8) { this.state = 'investigate'; this.path = null; break; } }
        else this.lostT = 0;
        const tx = sees ? p.x : this.lastSeen.x, ty = sees ? p.y : this.lastSeen.y;
        if (sees && w.clearLine(this.x, this.y - 4, tx, ty - 4, 5, true)) {
          const dx = tx - this.x, dy = ty - this.y, dd = Math.hypot(dx, dy) || 1;
          const m = 64 * sm * dt;
          this.x += (dx / dd) * m; this.y += (dy / dd) * m;
          this.face(dx, dy); this.path = null;
        } else {
          this.pathT -= dt;
          if (!this.path || this.pathT <= 0) { this.pathT = 0.35; this.setPath(w, Math.floor(tx / TS), Math.floor(ty / TS)); }
          this.step(w, 64 * sm, dt);
        }
        if (d < 11) this.attack(game);
        break;
      }
    }
  }
  draw(ctx, cam, t) {
    const sx = this.x - cam.x, sy = this.y - cam.y;
    G.disc(ctx, sx, sy, 6, 2, 'rgba(0,0,0,0.5)');
    Chars.counter(ctx, sx, sy, this.dir, this.frame, { raised: this.state === 'chase', twitch: this.twitch > 0, ghost: this.state === 'chase' && Math.sin(t * 13) > 0.6 });
  }
}

// ------------------------------------------------------------
//  Kriecher: blind, reagieren auf Geräusche
// ------------------------------------------------------------
class Crawler {
  constructor(tx, ty, opts) {
    this.hx = tx * TS + 8; this.hy = ty * TS + 12;
    this.x = this.hx; this.y = this.hy;
    this.dir = 'left'; this.state = 'idle'; this.timer = U.rand(1, 3);
    this.path = null; this.target = null; this.hurtCd = 0; this.root = !!(opts && opts.root);
    this.soundT = U.rand(2, 5); this.t = Math.random() * 10; this.pathT = 0;
  }
  setPath(w, tx, ty) { this.path = w.findPath(Math.floor(this.x / TS), Math.floor(this.y / TS), tx, ty, false, 2500); }
  step(w, speed, dt) {
    if (!this.path || !this.path.length) return true;
    const [nx, ny] = this.path[0];
    const gx = nx * TS + 8, gy = ny * TS + 12;
    const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
    if (d < 2) { this.path.shift(); return !this.path.length; }
    const m = Math.min(d, speed * dt);
    this.x += (dx / d) * m; this.y += (dy / d) * m;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx < 0 ? 'left' : 'right'; else this.dir = dy < 0 ? 'up' : 'down';
    return false;
  }
  hear(x, y, r) {
    if (r <= 0 || this.state === 'retreat') return;
    if (Math.hypot(x - this.x, y - this.y) < r) {
      this.state = 'alert'; this.target = [Math.floor(x / TS), Math.floor(y / TS)]; this.pathT = 0;
    }
  }
  update(dt, game) {
    const w = game.world, p = game.player;
    this.t += dt; this.hurtCd -= dt;
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    this.soundT -= dt;
    if (this.soundT <= 0 && d < 170) { this.soundT = U.rand(1.5, 4); Sound.play('crawler'); }
    switch (this.state) {
      case 'idle':
        this.timer -= dt;
        if (this.timer <= 0) {
          const tx = Math.floor(this.hx / TS) + U.randi(-5, 5), ty = Math.floor(this.hy / TS) + U.randi(-4, 4);
          if (w.navFree(tx, ty, false)) { this.setPath(w, tx, ty); this.state = 'wander'; }
          this.timer = U.rand(1, 3);
        }
        break;
      case 'wander':
        if (this.step(w, 15, dt)) { this.state = 'idle'; this.timer = U.rand(1.5, 4); }
        break;
      case 'alert':
        this.pathT -= dt;
        if (this.pathT <= 0 && this.target) { this.pathT = 0.6; this.setPath(w, this.target[0], this.target[1]); }
        if (this.step(w, this.root ? 40 : 50, dt)) { this.state = 'listen'; this.timer = 3; }
        break;
      case 'listen':
        this.timer -= dt;
        if (this.timer <= 0) this.state = 'idle';
        break;
      case 'retreat':
        this.timer -= dt;
        this.step(w, 30, dt);
        if (this.timer <= 0) { this.state = 'idle'; this.timer = 2; }
        break;
    }
    if (d < 12 && this.hurtCd <= 0 && !p.hidden) {
      this.hurtCd = 2.5;
      game.damage(this.root ? 18 : 22, 'crawler', this.x, this.y);
      p.sanity = Math.max(0, p.sanity - 10);
      this.state = 'retreat'; this.timer = 2.5;
      const t = w.randomFloor({ x: p.x, y: p.y }, 80, false);
      if (t) this.setPath(w, t[0], t[1]);
    }
  }
  draw(ctx, cam) {
    Chars.crawler(ctx, this.x - cam.x, this.y - cam.y, this.dir, this.t, { fast: this.state === 'alert', root: this.root });
  }
}

// ------------------------------------------------------------
//  Schemen – Halluzinationen bei wenig Verstand
// ------------------------------------------------------------
class Shade {
  constructor(x, y) { this.x = x; this.y = y; this.life = U.rand(3, 6); this.a = 0; this.fade = false; this.t = 0; }
  update(dt, game) {
    this.t += dt;
    const p = game.player;
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    if (!this.fade) {
      this.a = Math.min(0.85, this.a + dt * 0.8);
      this.life -= dt;
      if (this.life <= 0 || d < 40 || Lighting.inCone(p, this.x, this.y - 12, game.world)) {
        this.fade = true; Sound.play('whisper');
      }
      if (d < 140) p.sanity = Math.max(0, p.sanity - dt * 1.5);
    } else this.a -= dt * 2.5;
    return this.a > 0 || !this.fade;
  }
  draw(ctx, cam, t) { Chars.shade(ctx, Math.round(this.x - cam.x), Math.round(this.y - cam.y), t, Math.max(0, this.a)); }
}
