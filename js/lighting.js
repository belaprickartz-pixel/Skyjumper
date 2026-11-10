'use strict';
// ------------------------------------------------------------
//  Licht: Dunkelheit in halber Auflösung, Bayer-gerastert
//  (pixelige Lichtkegel), Taschenlampe mit Raycast-Schatten.
// ------------------------------------------------------------
const Lighting = (function () {
  const LW = VIEW_W / 2, LH = VIEW_H / 2;
  let cv, ctx;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const LEVELS = 7;
  const DARK = [4, 4, 11];

  function init() { [cv, ctx] = mkCanvas(LW, LH, true); }

  function flashPoly(world, ox, oy, ang, half, len) {
    const pts = [];
    const n = 44;
    for (let i = 0; i <= n; i++) {
      const a = ang - half + (2 * half * i) / n;
      const dx = Math.cos(a), dy = Math.sin(a);
      let d = 0, hit = false, extra = 0;
      while (d < len) {
        d += 3;
        const x = ox + dx * d, y = oy + dy * d;
        if (!hit && world.opaqueAt(Math.floor(x / TS), Math.floor(y / TS))) { hit = true; }
        if (hit) { extra += 3; if (extra > 12) break; }
      }
      pts.push([ox + dx * Math.min(d, len), oy + dy * Math.min(d, len)]);
    }
    return pts;
  }

  function render(main, world, cam, player, t, opts) {
    const amb0 = world.theme.ambient;
    let amb = U.clamp(amb0 + (opts.darkBoost || 0), 0, 0.995) * (opts.brightness || 1);
    if (world.theme.outdoor) amb *= 1 - Game.lightning * 0.85;
    amb = U.clamp(amb, 0, 1);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, LW, LH);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LW, LH);
    ctx.globalCompositeOperation = 'destination-out';
    const flick = opts.flicker || 0;
    for (const L of world.lights) {
      if (!world.lightOn(L)) continue;
      let f = 1;
      if (L.flicker) f += (Math.sin(t * 9 + L.seed) + Math.sin(t * 23 + L.seed * 2)) * 0.5 * L.flicker;
      if (flick && L.obj && L.obj.def.light && L.obj.def.light.power) f *= (Math.random() < flick ? 0.1 : 1);
      const r = (L.r * f) / 2;
      const sx = (L.x - cam.x) / 2, sy = (L.y - cam.y) / 2;
      if (sx < -r || sy < -r || sx > LW + r || sy > LH + r || r <= 0) continue;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,' + L.i + ')');
      g.addColorStop(0.5, 'rgba(0,0,0,' + (L.i * 0.6).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
    }
    // Zusatzlichter (Effekte, Streichholz)
    (opts.extra || []).forEach((L) => {
      const sx = (L.x - cam.x) / 2, sy = (L.y - cam.y) / 2, r = L.r / 2;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,' + L.i + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
    });
    let poly = null;
    if (player && !player.hidden) {
      // eigene Aura
      const px = (player.x - cam.x) / 2, py = (player.y - 8 - cam.y) / 2;
      const ga = ctx.createRadialGradient(px, py, 0, px, py, 15);
      ga.addColorStop(0, 'rgba(0,0,0,0.42)'); ga.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ga; ctx.beginPath(); ctx.arc(px, py, 15, 0, TAU); ctx.fill();
      if (player.flashLit()) {
        const ox = player.x + Math.cos(player.aim) * 4, oy = player.y - 7 + Math.sin(player.aim) * 3;
        let len = 132, inten = 1;
        if (player.battery < 15) { len = 100; if (Math.random() < 0.12) inten = 0.25; }
        if (player.battery < 5) { len = 75; if (Math.random() < 0.3) inten = 0.1; }
        poly = flashPoly(world, ox, oy, player.aim, 0.42, len);
        const cx = (ox - cam.x) / 2, cy = (oy - cam.y) / 2;
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, len / 2);
        g.addColorStop(0, 'rgba(0,0,0,' + inten + ')');
        g.addColorStop(0.7, 'rgba(0,0,0,' + (0.85 * inten).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        poly.forEach(([x, y]) => ctx.lineTo((x - cam.x) / 2, (y - cam.y) / 2));
        ctx.closePath(); ctx.fill();
      }
    }
    // Rastern
    const img = ctx.getImageData(0, 0, LW, LH);
    const d = img.data;
    for (let y = 0; y < LH; y++) {
      for (let x = 0; x < LW; x++) {
        const i = (y * LW + x) * 4;
        const a = (d[i + 3] / 255) * amb;
        const q = Math.min(LEVELS, Math.floor(a * LEVELS + BAYER[((y & 3) << 2) | (x & 3)])) / LEVELS;
        d[i] = DARK[0]; d[i + 1] = DARK[1]; d[i + 2] = DARK[2];
        d[i + 3] = q * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    main.drawImage(cv, 0, 0, VIEW_W, VIEW_H);

    // Warmes Leuchten (additiv)
    main.save();
    main.globalCompositeOperation = 'lighter';
    for (const L of world.lights) {
      if (L.moon || !world.lightOn(L)) continue;
      const sx = L.x - cam.x, sy = L.y - cam.y;
      const r = L.r * 0.8;
      if (sx < -r || sy < -r || sx > VIEW_W + r || sy > VIEW_H + r) continue;
      const f = L.flicker ? 1 + Math.sin(t * 11 + L.seed) * L.flicker : 1;
      const g = main.createRadialGradient(sx, sy, 0, sx, sy, r * f);
      const [cr, cg, cb] = L.c;
      g.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.13 * L.i).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
      main.fillStyle = g;
      main.beginPath(); main.arc(sx, sy, r * f, 0, TAU); main.fill();
    }
    if (poly) {
      const ox = player.x - cam.x, oy = player.y - 7 - cam.y;
      const g = main.createRadialGradient(ox, oy, 0, ox, oy, 120);
      g.addColorStop(0, 'rgba(255,230,170,0.10)'); g.addColorStop(1, 'rgba(255,230,170,0)');
      main.fillStyle = g;
      main.beginPath(); main.moveTo(ox, oy);
      poly.forEach(([x, y]) => main.lineTo(x - cam.x, y - cam.y));
      main.closePath(); main.fill();
    }
    main.restore();
    return poly;
  }

  // Liegt ein Punkt im Lichtkegel?
  function inCone(player, x, y, world) {
    if (!player.flashLit()) return false;
    const ox = player.x, oy = player.y - 7;
    const d = Math.hypot(x - ox, y - oy);
    if (d > 128) return false;
    const a = Math.atan2(y - oy, x - ox);
    if (Math.abs(U.angDiff(player.aim, a)) > 0.45) return false;
    return world.los(ox, oy, x, y);
  }

  return { init, render, inCone };
})();
