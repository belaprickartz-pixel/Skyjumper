module.exports = async (page, shot) => {
  const key = async (k, ms = 120) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
  await key('Enter', 600); await key('Escape', 2500);
  await page.waitForTimeout(1500);
  for (let i = 0; i < 8; i++) await key('Enter', 400);
  if (process.env.BRIGHT) await page.evaluate(() => Game.dev.bright());
  await page.evaluate(() => { Game.dev.all(); });
  const spots = [
    ['wald', 14, 29], ['wald', 23, 12], ['wald', 8, 20], ['huette', 7, 6], ['hof', 27, 20], ['hof', 45, 28], ['schuppen', 6, 5],
    ['eg', 24, 20], ['eg', 7, 18], ['eg', 25, 8], ['eg', 41, 28], ['og', 24, 18], ['og', 41, 6], ['og', 7, 28],
    ['keller', 21, 11], ['keller', 8, 20], ['dachboden', 16, 8], ['gewaechshaus', 14, 14], ['kapelle', 10, 10], ['gruft', 12, 16],
  ];
  for (const [m, x, y] of spots) {
    await page.evaluate(([m, x, y]) => { Game.dev.warp(m, x, y); UI.clearToasts(); }, [m, x, y]);
    await page.waitForTimeout(700);
    await shot('map_' + m + '_' + x + '_' + y);
  }
  await page.evaluate(() => { Game.dev.power(); Game.dev.warp('eg', 24, 20); UI.clearToasts(); });
  await page.waitForTimeout(700);
  await shot('map_eg_power');
};
