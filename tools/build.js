// Packt das ganze Spiel in eine einzige Datei: grauwald.html
// Aufruf: node tools/build.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) => '<style>\n' + fs.readFileSync(path.join(root, f), 'utf8') + '</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => {
  const js = fs.readFileSync(path.join(root, f), 'utf8');
  if (js.includes('</script')) throw new Error(f + ' enthält </script');
  return '<script>\n// ---- ' + f + ' ----\n' + js + '</script>';
});
fs.writeFileSync(path.join(root, 'grauwald.html'), html);
console.log('grauwald.html geschrieben:', Math.round(html.length / 1024) + ' KB');
