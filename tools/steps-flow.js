// Spielt die Hauptkette per Skript-Aufrufen durch und prüft Zustände.
module.exports = async (page, shot) => {
  const key = async (k, ms = 80) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
  const drain = async (max = 60) => {
    for (let i = 0; i < max; i++) {
      const busy = await page.evaluate(() => Game.overlays.length > 0 || !!Game.script || !!Game.warping);
      if (!busy) return;
      const top = await page.evaluate(() => { const o = Game.overlays[Game.overlays.length - 1]; return o ? o.constructor.name : (Game.script ? 'script' : 'warp'); });
      if (top === 'CodeLock') { for (const d of '0317') await key('Digit' + d, 60); await key('Enter', 200); continue; }
      if (top === 'PianoView') { for (const d of '68756343') await key('Digit' + d, 120); await page.waitForTimeout(2200); continue; }
      if (top === 'script' || top === 'warp') { await page.waitForTimeout(250); continue; }
      await key('Enter', 90); await key('Enter', 90);
    }
  };
  const use = async (id, label) => {
    const ok = await page.evaluate((id) => {
      const o = Game.world.objects.find((x) => x.id === id);
      if (!o) return false;
      Game.player.x = o.cx; Game.player.y = (o.y + o.h) * 16 + 10; Game.player.dir = 'up';
      Game.runScript(interact, o); return true;
    }, id);
    if (!ok) console.log('!! Objekt fehlt:', id);
    await drain();
    if (label) await shot(label);
  };
  const state = async (label) => console.log(label, JSON.stringify(await page.evaluate(() => ({ map: Game.world.id, inv: Game.inv, st: Game.state, hp: Math.round(Game.player.hp) }))));
  const warp = async (m, x, y) => { await page.evaluate(([m, x, y]) => Game.dev.warp(m, x, y), [m, x, y]); await page.waitForTimeout(300); await drain(); };

  await key('Enter', 600); await key('Escape', 2600); await page.waitForTimeout(1500); await drain();
  await use('auto'); await state('nach Auto');
  await warp('huette', 7, 6);
  await use('haken_tor'); await state('Hütte');
  await page.evaluate(() => { const o = Game.world.objects.find((x) => x.type === 'toolbox'); Game.runScript(interact, o); }); await drain();
  await warp('wald', 23, 2); await use('tor_wald'); await state('nach Tor');
  await warp('schuppen', 6, 5);
  await page.evaluate(() => { const o = Game.world.objects.find((x) => x.type === 'workbench'); Game.runScript(interact, o); }); await drain();
  await warp('hof', 48, 17); await use('kuechentuer_aussen', 'flow_kitchen'); await state('Küche');
  await warp('og', 41, 6); await use('theo_tisch'); await page.waitForTimeout(400); await shot('flow_stalker_intro'); await state('Stalker');
  await page.evaluate(() => { Game.stalker.vanish(999); });
  await warp('eg', 4, 26); await use('klavier', 'flow_piano'); await state('Klavier');
  await warp('eg', 7, 14); await use('tuer_arbeitszimmer'); await warp('eg', 13, 4); await use('tresor', 'flow_safe'); await state('Tresor');
  await page.evaluate(() => Game.give('kellerschluessel', 1, true));
  await warp('og', 22, 4); await use('spiegelschrank'); await state('Bad');
  await warp('keller', 6, 3); await use('sicherungskasten', 'flow_power'); await state('Strom');
  await warp('keller', 35, 12); await use('rolltor'); await warp('keller', 32, 17);
  await page.evaluate(() => { for (const t of ['workbench']) { const o = Game.world.objects.find((x) => x.type === t); Game.runScript(interact, o); } }); await drain();
  await page.evaluate(() => { const o = Game.world.objects.find((x) => x.type === 'cabinet' && x.p.item === 'ventilrad'); Game.runScript(interact, o); }); await drain();
  await state('Werkstatt');
  await warp('og', 29, 31); await use('dachluke'); await use('dachluke'); await state('Dachboden');
  await page.evaluate(() => { Game.player.x = 32 * 16 + 8; Game.player.y = 10 * 16 + 4; Game.runScript(interact, Game.world.objects.find((x) => x.id === 'wiege')); }); await drain();
  await page.waitForTimeout(1500); await shot('flow_attic_chase'); await state('Wiege');
  await page.evaluate(() => { Game.stalker.vanish(999); Game.player.hp = 100; });
  await warp('hof', 45, 26); await page.evaluate(() => Game.give('gewaechshausschluessel', 1, true)); await use('gewaechshaus_tuer'); await state('Gewächshaus');
  await use('ventil'); await page.evaluate(() => { const o = Game.world.objects.find((x) => x.id === 'glocke3_obj'); Game.player.x = o.cx; Game.player.y = o.cy + 6; Game.runScript(interact, o); }); await drain();
  await shot('flow_pond'); await state('Teich');
  await warp('hof', 45, 38); await use('kapelle_tuer'); await state('Kapelle');
  await page.evaluate(() => ['p1', 'p2', 'p3', 'p4'].forEach((p) => Game.addNote(p)));
  await warp('gruft', 12, 16);
  await page.evaluate(() => { const o = Game.world.objects.find((x) => x.id === 'altar'); Game.player.x = o.cx; Game.player.y = (o.y + 1) * 16 + 12; Game.runScript(interact, o); });
  for (let i = 0; i < 14; i++) { await key('Enter', 250); }
  await shot('flow_finale');
  await page.waitForTimeout(2500); await drain(); await state('Ende');
  for (let i = 0; i < 10; i++) await key('Enter', 400);
  await shot('flow_ending');
};
