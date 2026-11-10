// Screenshots per Playwright: node tools/shot.js <outdir> [script]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '.';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.join(__dirname, '..', process.env.PAGE || 'index.html'));
  await page.waitForTimeout(500);
  const shot = async (n) => { await page.screenshot({ path: path.join(out, n + '.png') }); };
  await shot('00_boot');
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  await shot('01_title');
  const steps = require(path.resolve(process.argv[3] || path.join(__dirname, 'shot-steps.js')));
  await steps(page, shot);
  console.log(errs.length ? errs.join('\n') : 'Keine Fehler.');
  await browser.close();
})();
