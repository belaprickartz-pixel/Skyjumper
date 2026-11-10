module.exports = async (page, shot) => {
  const key = async (k, ms = 120) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
  await key('Enter', 600);           // Neues Spiel
  await shot('02_intro');
  await key('Escape', 1800);
  await page.waitForTimeout(1500);
  await shot('03_forest_start');
  for (let i = 0; i < 4; i++) await key('Enter', 400);
  await shot('04_forest_dialog_done');
};
