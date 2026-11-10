module.exports = async (page, shot) => {
  const key = async (k, ms = 80) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
  await key('Enter', 600); await key('Escape', 2600); await page.waitForTimeout(1500);
  for (let i = 0; i < 8; i++) await key('Enter', 300);
  await page.evaluate(() => { Game.dev.all(); Game.flags.stalker_on = true; Game.dev.warp('og', 24, 26); Game.player.flashOn = true; });
  await page.waitForTimeout(300);
  await page.evaluate(() => { Game.stalker.place(Game.world, 30, 26, 'wander'); });
  const st = () => page.evaluate(() => ({ s: Game.stalker.state, d: Math.round(Math.hypot(Game.stalker.x - Game.player.x, Game.stalker.y - Game.player.y)), hp: Math.round(Game.player.hp), gs: Game.state }));
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(500); console.log('t' + i, JSON.stringify(await st())); if (i === 1) await shot('ai_chase'); }
  // Frame-Zeit messen
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
  console.log('fps', fps);
  const cost = await page.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 60; i++) { Game.update(1 / 60); Game.draw(); } return (performance.now() - t0) / 60; });
  console.log('ms/frame (update+draw)', cost.toFixed(2));
  // Verstecken
  await page.evaluate(() => { if (Game.state !== 'play') Game.load(); });
  await page.evaluate(() => { Game.stalker.vanish(999); Game.player.hp = 100; Game.dev.warp('og', 40, 4); const w = Game.world.objects.find((o) => o.id === 'theo_schrank'); Game.hide(w); Game.stalker.place(Game.world, 44, 6, 'search'); Game.stalker.timer = 6; });
  await page.waitForTimeout(400);
  await page.keyboard.down('Space'); await page.waitForTimeout(1200);
  await shot('ai_hidden');
  await page.keyboard.up('Space');
  console.log('hidden', JSON.stringify(await page.evaluate(() => ({ hid: !!Game.player.hidden, breath: Game.player.breath.toFixed(2), danger: Game.hideDanger }))));
  // Kriecher
  await page.evaluate(() => { Game.stalker.vanish(999); Game.unhide(); Game.player.hp = 100; Game.dev.warp('keller', 8, 17); });
  await page.waitForTimeout(300);
  await page.keyboard.down('ShiftLeft'); await page.keyboard.down('ArrowDown'); await page.waitForTimeout(500); await page.keyboard.up('ArrowDown'); await page.keyboard.up('ShiftLeft');
  await page.waitForTimeout(1500);
  console.log('crawler', JSON.stringify(await page.evaluate(() => Game.crawlers.map((c) => c.state + ':' + Math.round(Math.hypot(c.x - Game.player.x, c.y - Game.player.y))))));
  await shot('ai_crawler');
};
