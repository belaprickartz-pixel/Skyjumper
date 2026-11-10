module.exports = async (page, shot) => {
  const key = async (k, ms = 80) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
  await key('Enter', 600); await key('Escape', 2600); await page.waitForTimeout(1500);
  for (let i = 0; i < 8; i++) await key('Enter', 300);
  await page.evaluate(() => { Game.dev.all(); Game.flags.stalker_on = true; Game.dev.warp('og', 24, 26); Game.save(); });
  await page.evaluate(() => { Game.stalker.place(Game.world, 28, 26, 'wander'); });
  await page.waitForTimeout(800); await shot('save_silhouette');
  await page.evaluate(() => Game.gameOver('stalker')); await page.waitForTimeout(2600); await shot('save_gameover');
  await key('Enter', 800);
  console.log('nach Laden', JSON.stringify(await page.evaluate(() => ({ st: Game.state, map: Game.world.id, inv: Object.keys(Game.inv).length }))));
  await page.evaluate(() => Game.toTitle()); await page.waitForTimeout(500); await shot('save_title');
};
