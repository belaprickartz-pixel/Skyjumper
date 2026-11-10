'use strict';
// ------------------------------------------------------------
//  Karten. Gebaut mit einem kleinen Baukasten (Rechtecke,
//  Türen, Objekte) – jede Koordinate ist eine Kachel (16px).
//
//  Kachelzeichen:
//   #  Wand A (Thema)   %  Wand B    $  Glas    =  Fenster (Wand A)   "  Fenster (Wand B)
//   w  Holzboden  s Stein  m Marmor  c Teppich  k Fliesen  , Gras  ; hohes Gras
//   :  Erdweg  g Kies  a Asphalt  e Beet  u Schlamm  d Schwelle
//   T Baum  t toter Baum  o Busch  r Fels  f Holzzaun  i Eisenzaun  x Schutt  ~ Wasser  _ Leere
// ------------------------------------------------------------
class MapBuilder {
  constructor(id, w, h, fill) {
    this.id = id; this.w = w; this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill(fill));
    this.objs = [];
    this.rnd = U.rng(U.hstr(id) + 7);
  }
  set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c; return this; }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.g[y][x] : '#'; }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); return this; }
  frame(x, y, w, h, c) { for (let i = x; i < x + w; i++) { this.set(i, y, c); this.set(i, y + h - 1, c); } for (let j = y; j < y + h; j++) { this.set(x, j, c); this.set(x + w - 1, j, c); } return this; }
  scatter(x, y, w, h, c, p, on) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (on && on.indexOf(this.get(i, j)) < 0) continue;
      if (this.rnd() < p) this.set(i, j, c);
    }
    return this;
  }
  o(type, x, y, props) { this.objs.push(Object.assign({ type, x, y }, props || {})); return this; }
  os(type, list, props) { list.forEach(([x, y]) => this.o(type, x, y, props)); return this; }
  row(type, x, y, n, props) { for (let i = 0; i < n; i++) this.o(type, x + i, y, props); return this; }
  // Tür in waagrechter (2-reihiger) Wand: y = Ansichtsreihe
  hdoor(x, y, props) { this.set(x, y, 'd'); this.set(x, y - 1, 'd'); return this.o('door', x, y, props); }
  // Tür in senkrechter Wand
  vdoor(x, y, props) { this.set(x, y, 'd'); return this.o('door', x, y, props); }
  // Ausgang in der unteren Außenwand / Gebäudetür
  exit(x, y, props) {
    const w = (props && props.w) || 1;
    for (let i = 0; i < w; i++) this.set(x + i, y, 'd');
    return this.o('door', x, y, Object.assign({ exit: true }, props));
  }
  done(info) {
    return Object.assign({ id: this.id, w: this.w, h: this.h, rows: this.g.map((r) => r.join('')), objects: this.objs }, info);
  }
}

const MAPS = {};

// ============================================================
//  WALD
// ============================================================
MAPS.wald = function () {
  const m = new MapBuilder('wald', 48, 36, 'T');
  m.rect(0, 27, 48, 1, ',').rect(0, 31, 48, 1, ',');
  m.scatter(0, 27, 48, 1, 'T', 0.35, [',']).scatter(0, 31, 48, 1, 'T', 0.35, [',']);
  m.rect(0, 28, 48, 3, 'a');
  // Lichtungen
  m.rect(19, 1, 10, 7, ',');
  m.rect(20, 8, 8, 20, ',');
  m.rect(2, 11, 17, 13, ',');
  m.rect(8, 19, 16, 4, ',');
  m.rect(29, 5, 17, 12, ',');
  m.rect(25, 9, 5, 4, ',');
  m.scatter(2, 11, 17, 13, 't', 0.05, [',']);
  m.scatter(2, 11, 17, 13, 'o', 0.04, [',']);
  m.scatter(29, 5, 17, 12, ';', 0.15, [',']);
  m.scatter(29, 5, 17, 12, 'r', 0.04, [',']);
  m.scatter(19, 1, 10, 27, ';', 0.08, [',']);
  m.scatter(20, 8, 8, 20, 'o', 0.04, [',', ';']);
  // See
  m.rect(35, 7, 7, 5, '~').rect(36, 6, 5, 1, '~').rect(36, 12, 5, 1, '~').rect(34, 8, 1, 3, '~').rect(42, 8, 1, 3, '~');
  // Wege
  m.rect(23, 1, 2, 27, ':');
  m.rect(9, 20, 14, 2, ':');
  m.rect(8, 18, 2, 2, ':');
  m.rect(25, 10, 9, 2, ':');
  m.rect(19, 0, 10, 1, 'i');
  m.set(23, 0, ':').set(24, 0, ':');
  m.o('gate', 23, 0, { id: 'tor_wald', locked: 'torschluessel', script: 'gateWald' });
  m.o('lantern', 21, 1, { lit: false, text: 'Eine alte Gaslaterne. Das Glas ist gesprungen. Kalt.' });
  m.o('lantern', 26, 1, { text: 'Die Laterne brennt. Wer zündet die hier draußen an?' });
  m.set(26, 4, ',');
  m.o('sign', 26, 4, { text: ['Ein Holzschild, die Schrift halb abgeblättert:', '»GRAUWALD 3 – PRIVATBESITZ. BETRETEN AUF EIGENE GEFAHR.«', 'Jemand hat mit Kreide darunter geschrieben: »NICHT RUFEN«.'] });
  // Hütte
  m.rect(4, 12, 8, 6, '#');
  m.set(5, 17, '=').set(10, 17, '=');
  m.exit(8, 17, { id: 'huette_tuer', to: { map: 'huette', x: 7, y: 8, dir: 'up' }, ext: true, text: null, prompt: 'Hütte' });
  m.set(12, 16, ','); m.set(13, 16, ','); m.set(3, 17, ',');
  m.o('barrel', 12, 16, { text: 'Ein Regenfass. Das Wasser darin ist schwarz und riecht nach Laub.' });
  m.o('stump', 13, 17, { text: 'Ein Hackklotz mit einer Axt drin. Sie steckt fest, als hätte jemand mitten im Schlag aufgehört.' });
  m.o('crate', 3, 17, { text: 'Gestapeltes Brennholz unter einer Plane.' });
  // Auto & Straße
  m.o('car', 12, 28, { id: 'auto', script: 'car' });
  m.o('fallentree', 33, 27, { hit: [0, 0, 32, 64], text: ['Eine umgestürzte Fichte liegt quer über der Straße.', 'Die Wurzeln ragen in die Luft. Der Boden ist aufgerissen, als hätte jemand den Baum herausgezogen.', 'Da komm ich nicht drüber.'] });
  m.rect(33, 31, 2, 1, 'T');
  m.o('barrier', 0, 28, { h: 3, text: ['Hinter mir nur Nebel und Straße.', 'Zurück? Ohne Auto, ohne Theo? Nein.'] });
  m.os('trigger', [[3, 28], [3, 29], [3, 30]], { script: 'roadWest' });
  // Theos Rucksack
  m.set(21, 16, ',');
  m.o('backpack', 21, 16, { id: 'rucksack', script: 'backpack' });
  // Wegkreuz
  m.set(44, 8, ','); m.set(44, 9, ',');
  m.o('shrine', 44, 8, { id: 'wegkreuz', script: 'shrine' });
  // Schreck-Auslöser
  for (let x = 20; x < 28; x++) m.o('trigger', x, 12, { script: 'scareWald' });
  // Krähen
  m.set(19, 27, ','); m.set(28, 27, ','); m.set(15, 14, ',');
  m.os('crow', [[19, 27], [28, 27], [15, 14], [31, 15]]);
  return m.done({ theme: 'forest', name: 'Wald bei Grauwald', spawn: { x: 14, y: 29, dir: 'left' } });
};

// ============================================================
//  JÄGERHÜTTE
// ============================================================
MAPS.huette = function () {
  const m = new MapBuilder('huette', 16, 10, '#');
  m.rect(1, 2, 14, 7, 'w');
  m.set(3, 1, '=').set(11, 1, '=');
  m.exit(7, 9, { to: { map: 'wald', x: 8, y: 18, dir: 'down' } });
  m.o('fireplace', 6, 2, { text: ['Im Kamin glimmt noch Glut. Jemand war vor Kurzem hier.', 'Herr Brandt? ... Keine Antwort.'] });
  m.os('shelf', [[1, 2], [2, 2]], {});
  m.o('hook', 4, 1, { id: 'haken_tor', item: 'torschluessel', text: 'Ein Schlüsselbrett. Ein großer Eisenschlüssel hängt daran, mit Pappschild.', after: 'Ein leeres Schlüsselbrett.' });
  m.o('gunrack', 9, 1, { text: 'Ein Gewehrständer. Beide Halterungen sind leer.' });
  m.o('trophy', 13, 1, { text: 'Ein Hirschgeweih. Jemand hat ihm mit Kreide ein Kreuz auf die Stirn gemalt.' });
  m.o('wardrobe', 14, 2, { item: 'batterie', count: 1, text: 'Ein Spind. Jacken, Stiefel... und eine Batterie in einer Manteltasche.', after: 'Jacken, die nach Rauch riechen.' });
  m.o('candle', 10, 2, {});
  m.os('table', [[3, 5], [3, 6], [4, 6]], { items: 'house' });
  m.o('table', 4, 5, { items: 'papers', note: 'n_jaeger1' });
  m.o('chair', 5, 6, { face: 'left' });
  m.o('chair', 2, 5, { face: 'right' });
  m.o('bed', 12, 5, { text: 'Ein Feldbett. Die Decke ist zurückgeschlagen. Kalt.' });
  m.o('cabinet', 13, 5, { kind: 'night', note: 'n_jaeger2' });
  m.o('toolbox', 1, 8, { item: 'sicherung', count: 1, text: 'Ein Werkzeugkasten. Zangen, Draht... und eine alte Schraubsicherung.', after: 'Werkzeug. Nichts Brauchbares mehr.' });
  m.o('crate', 14, 8, {}); m.o('barrel', 14, 7, {});
  m.o('blood', 9, 6, {}); m.o('debris', 8, 7, {});
  m.o('guestbook', 1, 3, {});
  m.o('cobweb', 1, 2, {}); m.o('cobweb', 14, 2, { flip: true });
  return m.done({ theme: 'hut', name: 'Brandts Jägerhütte', spawn: { x: 7, y: 8, dir: 'up' } });
};

// ============================================================
//  HOF
// ============================================================
MAPS.hof = function () {
  const m = new MapBuilder('hof', 56, 44, ',');
  m.rect(0, 0, 56, 2, 'T').rect(0, 0, 3, 44, 'T').rect(53, 0, 3, 44, 'T').rect(0, 41, 56, 3, 'T');
  m.scatter(3, 2, 50, 39, 'T', 0.035, [',']);
  m.scatter(3, 2, 50, 39, 'o', 0.03, [',']);
  m.scatter(3, 2, 50, 39, ';', 0.06, [',']);
  m.rect(3, 40, 50, 1, 'i');
  // Herrenhaus
  m.rect(10, 2, 36, 10, '#');
  m.rect(46, 2, 6, 14, '#');
  [12, 14, 17, 20, 23, 32, 35, 38, 41, 44].forEach((x) => m.set(x, 11, '='));
  m.set(47, 15, '=').set(50, 15, '=');
  m.rect(17, 12, 22, 6, 'g');
  m.rect(26, 12, 4, 28, 'g');
  m.rect(38, 16, 14, 3, 'g');
  m.rect(26, 12, 4, 1, 's');
  m.set(27, 11, 'd').set(28, 11, 'd');
  m.o('bigdoor', 27, 11, { id: 'haustuer_aussen', script: 'frontDoorOut' });
  m.set(48, 15, 'd');
  m.o('door', 48, 15, { id: 'kuechentuer_aussen', boarded: true, ext: true, script: 'kitchenDoorOut' });
  m.o('fountain', 27, 14, { text: ['Ein Brunnen mit einer Kinderfigur aus Stein. Das Becken ist voll mit schwarzem Laub.', 'Die Figur hält die Hände vors Gesicht. Wie beim Zählen.'] });
  m.o('statue', 19, 13, { text: 'Ein Steinengel. Moos wächst ihm aus den Augen.' });
  m.o('statue', 36, 13, { text: 'Ein Steinengel. Sein Kopf ist leicht zur Haustür gedreht. War das vorhin auch so?' });
  m.o('bench', 22, 16, {}); m.o('bench', 33, 16, {});
  m.o('lantern', 25, 20, {}); m.o('lantern', 30, 20, {});
  m.o('lantern', 25, 31, { lit: false, text: 'Diese Laterne ist aus.' }); m.o('lantern', 30, 31, {});
  m.set(25, 20, ',').set(30, 20, ',').set(25, 31, ',').set(30, 31, ',');
  // Schuppen
  m.rect(5, 18, 7, 4, '%');
  m.set(6, 21, '"');
  m.exit(9, 21, { to: { map: 'schuppen', x: 6, y: 7, dir: 'up' }, ext: true, prompt: 'Schuppen' });
  m.rect(9, 22, 2, 3, ':').rect(9, 24, 17, 2, ':');
  // Friedhof
  m.rect(4, 28, 15, 11, ',');
  m.frame(4, 28, 15, 11, 'i');
  m.set(10, 28, ':').set(11, 28, ':');
  m.rect(10, 26, 2, 2, ':');
  m.os('grave', [[6, 30], [9, 30], [13, 30], [16, 30], [6, 33], [13, 33], [16, 33], [6, 36], [9, 36], [16, 36]], {});
  m.o('grave', 9, 33, { kind: 'cross', text: 'Ein Eisenkreuz. »Heinrich Vogt, 1890–1951. Er ruhe in Frieden.«' });
  m.o('grave', 13, 36, { id: 'grab_ilse', note: 'n_grab', script: 'graveIlse' });
  m.set(7, 35, 't').set(16, 32, 't');
  m.o('trigger', 10, 29, { script: 'graveyardWhisper' });
  // Gewächshaus
  m.rect(40, 20, 11, 6, '$');
  m.exit(45, 25, { id: 'gewaechshaus_tuer', to: { map: 'gewaechshaus', x: 14, y: 17, dir: 'up' }, locked: 'gewaechshausschluessel', ext: true, prompt: 'Gewächshaus' });
  m.rect(44, 26, 3, 2, 'g');
  m.rect(30, 27, 17, 2, 'g');
  // Kapelle
  m.rect(41, 31, 9, 7, '#');
  m.set(42, 37, '=').set(48, 37, '=');
  m.exit(45, 37, { id: 'kapelle_tuer', to: { map: 'kapelle', x: 10, y: 15, dir: 'up' }, locked: 'kapellenschluessel', ext: true, prompt: 'Kapelle' });
  m.rect(44, 38, 3, 2, 'g').rect(30, 38, 14, 2, 'g');
  m.set(45, 30, ',');
  m.o('grave', 45, 30, { kind: 'cross', text: 'Ein Steinkreuz vor der Kapelle. Darunter liegen vertrocknete Rosen.' });
  // Brunnen
  m.set(36, 33, ',');
  m.o('well', 36, 33, { script: 'well' });
  // Tor zurück
  m.set(27, 40, 'g').set(28, 40, 'g');
  m.o('gate', 27, 40, { id: 'tor_hof', open: true, script: 'gateHof' });
  // Krähen, Schreck
  m.set(20, 22, ',').set(34, 35, ',');
  m.os('crow', [[20, 22], [34, 35], [14, 25]]);
  for (let x = 26; x < 30; x++) m.o('trigger', x, 23, { script: 'scareWindow' });
  return m.done({ theme: 'hof', name: 'Anwesen Grauwald', spawn: { x: 27, y: 39, dir: 'up' } });
};

// ============================================================
//  SCHUPPEN
// ============================================================
MAPS.schuppen = function () {
  const m = new MapBuilder('schuppen', 14, 9, '#');
  m.rect(1, 2, 12, 6, 'w');
  m.set(4, 1, '=');
  m.exit(6, 8, { to: { map: 'hof', x: 9, y: 22, dir: 'down' } });
  m.o('workbench', 1, 2, { item: 'brecheisen', text: 'Eine Werkbank. Darauf liegt ein rotes Brecheisen.', after: 'Hobelspäne und ein Schraubstock.' });
  m.o('paper', 3, 3, { note: 'n_gaertner' });
  m.o('toolwall', 6, 1, { text: 'Gartenwerkzeug an einer Lochwand. Die Umrisse sind mit Farbe nachgemalt. Eine Sichel fehlt.' });
  m.o('shelf', 8, 2, { kind: 'jars', text: 'Einmachgläser mit Saatgut. Auf einem steht »Rosen – nicht gießen nach 18 Uhr«.' });
  m.o('cabinet', 10, 2, { item: 'verband', count: 1, text: 'Ein Verbandskasten in der Schublade. Eine Binde ist noch drin.', after: 'Leere Schubladen.' });
  m.o('wardrobe', 12, 2, { text: 'Ein Spind mit Gummistiefeln und einer Regenjacke. Hier passt man rein.' });
  m.o('crate', 12, 7, { item: 'streichhoelzer', count: 5, text: 'In der Kiste: Kerzenstummel und eine Schachtel Streichhölzer.', after: 'Kerzenstummel.' });
  m.o('sack', 1, 7, {}); m.o('barrel', 2, 7, {});
  m.o('wheelbarrow', 9, 6, { text: 'Eine Schubkarre mit Erde. In der Erde steckt eine kleine Kinderschaufel.' });
  m.o('debris', 6, 4, {});
  m.o('cobweb', 1, 2, {}); m.o('cobweb', 12, 2, { flip: true });
  return m.done({ theme: 'shed', name: 'Gartenschuppen', spawn: { x: 6, y: 7, dir: 'up' } });
};

// ============================================================
//  ERDGESCHOSS
// ============================================================
MAPS.eg = function () {
  const m = new MapBuilder('eg', 50, 34, '#');
  m.rect(1, 2, 14, 9, 'w').rect(4, 5, 8, 4, 'c');       // Arbeitszimmer
  m.rect(1, 13, 14, 9, 'w');                             // Bibliothek
  m.rect(1, 24, 14, 9, 'w').rect(4, 27, 8, 4, 'c');     // Salon
  m.rect(16, 2, 18, 9, 'w').rect(19, 4, 12, 5, 'c');    // Esszimmer
  m.rect(16, 13, 18, 20, 'm').rect(24, 16, 2, 17, 'c'); // Halle
  m.rect(35, 2, 7, 9, 'k');                              // Waschküche
  m.rect(43, 2, 6, 9, 'w');                              // Mädchenkammer
  m.rect(35, 13, 7, 9, 'w');                             // Speisekammer
  m.rect(43, 13, 6, 9, 's');                             // Kellerabgang
  m.rect(35, 24, 14, 9, 'k');                            // Küche
  [4, 11, 18, 22, 27, 31, 38, 46].forEach((x) => m.set(x, 1, '='));
  // Türen
  m.hdoor(7, 12, { id: 'tuer_arbeitszimmer', locked: 'messingschluessel', lockText: 'Abgeschlossen. Ein kleines Messingschloss.' });
  m.hdoor(7, 23, {});
  m.vdoor(15, 17, {}); m.vdoor(15, 28, {});
  m.hdoor(19, 12, {}); m.hdoor(30, 12, {});
  m.vdoor(34, 6, {}); m.vdoor(42, 6, {});
  m.hdoor(38, 23, {});
  m.hdoor(45, 23, { id: 'tuer_keller', locked: 'kellerschluessel', lockText: 'Die Kellertür. Abgeschlossen. Dahinter zieht es kalt herauf.' });
  m.vdoor(34, 28, {});
  m.exit(42, 33, { id: 'kuechentuer_innen', to: { map: 'hof', x: 48, y: 16, dir: 'down' }, prompt: 'Hinaus' });
  m.exit(24, 33, { id: 'haustuer_innen', w: 2, bolted: true, to: { map: 'hof', x: 27, y: 12, dir: 'down' }, script: 'frontDoorIn', prompt: 'Haustür' });
  m.o('stairs', 23, 13, { w: 4, h: 3, carpet: true, dir: 'up', to: { map: 'og', x: 24, y: 18, dir: 'up' } });
  m.o('stairs', 45, 14, { w: 2, h: 2, dir: 'down', to: { map: 'keller', x: 21, y: 5, dir: 'down' } });

  // --- Arbeitszimmer ---
  m.os('shelf', [[1, 2], [2, 2], [3, 2], [9, 2], [10, 2], [14, 2]], {});
  m.o('fireplace', 5, 2, { lit: false, text: 'Kalte Asche. Darin ein halb verbranntes Foto: zwei Mädchen vor dem Haus. Das Gesicht der Kleineren ist verkohlt.' });
  m.o('painting', 8, 1, { art: 'oma', text: ['Ein Porträt von Oma, jünger, vielleicht fünfzig.', 'Sie sieht nicht in die Kamera. Sie sieht zur Seite, als hätte gerade jemand ihren Namen gerufen.'] });
  m.o('safe', 13, 2, { id: 'tresor', script: 'safe' });
  m.o('desk', 6, 5, { text: ['Omas Schreibtisch. Rechnungen, Kerzenwachs, ein Füller ohne Kappe.', 'In die Schreibunterlage sind Striche gekratzt. Sehr viele. Immer in Zehnergruppen.'] });
  m.o('chair', 7, 4, { face: 'down' });
  m.o('chair', 11, 7, { face: 'left' });
  m.o('candle', 1, 9, {}); m.o('candle', 14, 9, { lit: false });
  m.o('vase', 13, 10, {});
  m.o('debris', 9, 8, {});
  m.o('cobweb', 1, 2, {});

  // --- Bibliothek ---
  m.os('shelf', [[1, 13], [2, 13], [3, 13], [4, 13], [5, 13], [6, 13], [8, 13], [9, 13], [10, 13], [12, 13], [13, 13], [14, 13]], {});
  m.o('shelf', 11, 13, { id: 'buch_p2', script: 'bookP2' });
  m.os('shelf', [[2, 16], [3, 16], [4, 16], [5, 16], [9, 16], [10, 16], [11, 16], [12, 16]], {});
  m.os('table', [[5, 19], [7, 19], [8, 19]], { items: 'house' });
  m.o('table', 6, 19, { items: 'papers', note: 'n_zeitung' });
  m.o('chair', 6, 18, { face: 'down' }); m.o('chair', 7, 20, { face: 'up' });
  m.o('desk', 12, 20, { lamp: true, item: 'gewaechshausschluessel', text: 'Ein Sekretär. In der obersten Schublade liegt ein grün angelaufener Schlüssel mit Rosen-Anhänger.', after: 'Briefpapier mit Trauerrand.' });
  m.o('candle', 1, 21, {}); m.o('lamp', 14, 21, {});
  m.o('debris', 3, 18, {});
  m.os('trigger', [[14, 16], [14, 17], [14, 18]], { script: 'scareBooks' });

  // --- Salon ---
  m.o('piano', 2, 24, { id: 'klavier', script: 'piano' });
  m.o('fireplace', 10, 24, { text: 'Das Feuer brennt. Hell und warm. Niemand hat es angezündet. Jedenfalls niemand, den ich kenne.' });
  m.o('gramophone', 13, 24, { id: 'grammophon', script: 'gramophone' });
  m.os('sofa', [[5, 29], [6, 29], [7, 29]], {});
  m.o('chair', 4, 27, { face: 'right' }); m.o('chair', 9, 27, { face: 'left' });
  m.o('table', 6, 27, { items: 'house', note: 'n_klavier' });
  m.o('table', 7, 27, { items: 'house' });
  m.o('candle', 1, 32, {}); m.o('candle', 14, 32, { lit: false });
  m.o('lamp', 1, 26, {});
  m.o('painting', 5, 23, { art: 'family', text: 'Ein Familienfoto im Goldrahmen. Vier Menschen. Zwischen den beiden Mädchen ist eine Lücke, als hätte man jemanden herausgeschnitten.' });
  m.o('painting', 12, 23, { art: 'figure', text: 'Ein dunkles Ölbild. Eine sehr lange, schmale Gestalt zwischen Bäumen. Je länger ich hinsehe, desto näher kommt sie mir vor.' });
  m.os('trigger', [[7, 24], [14, 28]], { script: 'scarePiano' });

  // --- Esszimmer ---
  for (let x = 20; x < 30; x++) { m.o('table', x, 5, { items: 'feast', cloth: true }); m.o('table', x, 6, { items: 'feast', cloth: true }); }
  m.objs = m.objs.filter((o) => !(o.type === 'table' && o.x === 25 && o.y === 5));
  m.o('table', 25, 5, { items: 'feast', cloth: true, script: 'placecard' });
  [20, 22, 24, 26, 28].forEach((x) => m.o('chair', x, 4, { face: 'down' }));
  [21, 23, 25, 27, 29].forEach((x) => m.o('chair', x, 7, { face: 'up' }));
  m.o('chair', 19, 5, { face: 'right' }); m.o('chair', 30, 6, { face: 'left' });
  m.o('cabinet', 16, 2, {});
  m.o('cabinet', 17, 2, { item: 'streichhoelzer', count: 4, text: 'Eine Anrichte. In der Schublade: Servietten, Kerzen und Streichhölzer.', after: 'Servietten mit gesticktem »V«.' });
  m.o('cabinet', 32, 2, {}); m.o('cabinet', 33, 2, {});
  m.o('painting', 25, 1, { art: 'house', text: 'Ein Bild vom Haus, gemalt bei Nacht. In einem Fenster oben brennt Licht.' });
  m.o('lamp', 16, 10, {}); m.o('lamp', 33, 10, {});
  m.o('paper', 32, 9, { note: 'd2' });

  // --- Halle ---
  m.o('clock', 17, 13, { id: 'standuhr', stopped: true, script: 'clockFoyer' });
  m.o('statue', 21, 14, { text: 'Eine Marmorbüste auf einem Sockel. Jemand hat ihr ein Kinderhaarband umgebunden.' });
  m.o('statue', 28, 14, { text: 'Ein Steinengel. Die Flügel sind abgeschlagen.' });
  m.o('guestbook', 32, 14, { id: 'gb_halle' });
  m.o('painting', 17, 12, { art: 'land', text: 'Eine Landschaft. Der Wald um Grauwald, im Herbst. Sehr friedlich. Sehr falsch.' });
  m.o('painting', 27, 12, { art: 'figure', text: 'Die lange Gestalt wieder. Diesmal in einem Flur. Diesem Flur.' });
  m.o('painting', 32, 12, { art: 'house', text: 'Das Haus bei Nacht.' });
  m.os('lamp', [[17, 18], [32, 18], [17, 27], [32, 27]], {});
  m.os('vase', [[17, 31], [32, 31]], {});
  m.o('coatrack', 31, 30, { text: 'Ein Garderobenständer. Ein langer, nasser Mantel hängt daran. Er tropft.' });
  m.o('table', 32, 22, { items: 'house', item: 'batterie', count: 1, text: 'Ein Beistelltisch. Auf dem Spitzendeckchen liegt eine Batterie.', after: 'Ein Spitzendeckchen.' });
  m.o('debris', 29, 25, {});
  // --- Waschküche ---
  m.o('washtub', 36, 2, { text: 'Ein Waschzuber. Graues Wasser, darin ein Kinderhemd. Theos? Nein. Viel zu alt.' });
  m.o('sink', 38, 2, {});
  m.o('cabinet', 40, 2, { item: 'tabletten', count: 1, text: 'Ein Hängeschrank. Waschpulver, Bürsten und Omas Baldrian-Röhrchen.', after: 'Waschpulver und Bürsten.' });
  m.os('sheet', [[36, 6], [37, 6], [38, 6], [39, 6]], {});
  m.o('wardrobe', 41, 9, { kind: 'white', text: 'Der Wäscheschrank. Er riecht nach Lavendel und nasser Erde.' });
  m.o('sack', 35, 10, {});
  // --- Mädchenkammer ---
  m.o('bed', 46, 2, { kind: 'iron' });
  m.o('cabinet', 45, 2, { kind: 'night', item: 'kellerschluessel', note: 'n_magd', text: 'Auf dem Nachttisch liegt ein Schlüssel auf einem gefalteten Brief.', after: 'Ein leerer Nachttisch.' });
  m.o('wardrobe', 43, 2, {});
  m.o('table', 47, 7, {}); m.o('chair', 46, 7, { face: 'right' });
  m.o('candle', 48, 10, { lit: false });
  m.o('suitcase', 44, 9, { text: 'Ein gepackter Koffer. Frau Hartl hat ihn nie mitgenommen.' });
  // --- Speisekammer ---
  m.os('pantry', [[35, 13], [36, 13], [37, 13], [38, 13], [40, 13], [41, 13]], {});
  m.o('pantry', 39, 13, { item: 'batterie', count: 1, text: 'Zwischen den Einmachgläsern liegt eine Batterie.', after: 'Eingemachte Birnen. Die Deckel sind gewölbt.' });
  m.os('barrel', [[35, 20], [35, 21]], {});
  m.os('sack', [[41, 21], [40, 21]], {});
  m.o('crate', 41, 17, {});
  m.o('blood', 37, 17, { trail: true });
  // --- Kellerabgang ---
  m.os('crate', [[43, 20], [48, 20], [48, 21]], {});
  m.o('bulb', 44, 17, {});
  m.o('cobweb', 43, 13, {});
  // --- Küche ---
  m.os('counter', [[35, 24], [37, 24], [39, 24], [40, 24], [42, 24], [44, 24], [46, 24], [47, 24], [48, 24]], {});
  m.o('counter', 36, 24, { note: 'n_koechin' });
  m.o('stove', 41, 24, { text: 'Ein Kohleherd. Auf der Platte steht ein Topf. Ich will nicht wissen, was drin ist. ... Ich sehe trotzdem nach. Nur Wasser.' });
  m.o('sink', 43, 24, {});
  m.os('table', [[39, 28], [40, 28], [41, 28], [39, 29], [40, 29], [41, 29]], { items: 'kitchen' });
  m.o('chair', 38, 28, { face: 'right' }); m.o('chair', 42, 29, { face: 'left' }); m.o('chair', 40, 30, { face: 'up' });
  m.o('cabinet', 48, 31, { item: 'verband', count: 1, text: 'Ein Erste-Hilfe-Schrank. Ein Verband ist noch da.', after: 'Leer bis auf eine Pinzette.' });
  m.os('barrel', [[35, 31], [35, 32]], {});
  m.o('lamp', 35, 27, {});
  m.o('crate', 47, 32, {});
  m.o('blood', 44, 30, {});
  return m.done({ theme: 'manor', name: 'Erdgeschoss', spawn: { x: 42, y: 32, dir: 'up' }, stalker: true });
};

// ============================================================
//  OBERGESCHOSS
// ============================================================
MAPS.og = function () {
  const m = new MapBuilder('og', 50, 34, '#');
  m.rect(1, 2, 14, 9, 'w').rect(3, 5, 9, 4, 'c');   // Omas Schlafzimmer
  m.rect(1, 13, 14, 9, 'w');                         // Gästezimmer
  m.rect(1, 24, 14, 9, 'w');                         // Kinderzimmer (alt)
  m.rect(16, 2, 9, 9, 'k');                          // Bad
  m.rect(26, 2, 8, 9, 'w');                          // Abstellkammer
  m.rect(16, 13, 18, 20, 'w').rect(18, 14, 14, 3, 'c'); // Galerie
  m.rect(35, 2, 14, 9, 'w').rect(41, 5, 5, 3, 'c');  // Theos Zimmer
  m.rect(35, 13, 14, 9, 'w');                        // Schrankzimmer
  m.rect(35, 24, 14, 9, 'w');                        // Nähzimmer
  [3, 9, 20, 29, 38, 45].forEach((x) => m.set(x, 1, '='));
  m.hdoor(7, 12, {}); m.vdoor(15, 6, {}); m.vdoor(15, 17, {}); m.vdoor(15, 28, {});
  m.hdoor(20, 12, {}); m.hdoor(29, 12, {});
  m.vdoor(34, 6, {}); m.hdoor(42, 12, {}); m.vdoor(34, 17, {}); m.vdoor(34, 28, {});
  // Treppe + Geländer
  m.o('stairs', 23, 20, { w: 4, h: 3, dir: 'down', to: { map: 'eg', x: 24, y: 17, dir: 'down' } });
  m.os('railing', [[22, 20], [22, 21], [22, 22], [27, 20], [27, 21], [27, 22], [22, 23], [23, 23], [24, 23], [25, 23], [26, 23], [27, 23]], {});
  m.o('hatch', 29, 30, { id: 'dachluke', script: 'atticHatch' });
  m.o('guestbook', 32, 14, { id: 'gb_og' });
  m.os('lamp', [[17, 16], [32, 20], [17, 30], [32, 30]], {});
  m.o('painting', 17, 12, { art: 'girl', text: ['Ein Kinderporträt. Ein Mädchen mit dunklen Haaren, vielleicht sieben.', 'Jemand hat ihr Gesicht mit rotem Stift durchgekreuzt. Immer wieder.'] });
  m.o('painting', 23, 12, { art: 'land', text: 'Der See im Wald, mit dem Wegkreuz.' });
  m.o('painting', 26, 12, { art: 'figure', text: 'Wieder die lange Gestalt. Sie steht am Fuß einer Treppe. Dieser Treppe.' });
  m.o('painting', 32, 12, { art: 'family', text: 'Ein Hochzeitsfoto. Oma und Opa. Im Hintergrund, unscharf, eine sehr große Frau im Nachthemd.' });
  m.os('vase', [[16, 32], [33, 32]], {});
  m.o('ball', 30, 16, { id: 'ball' });
  m.os('trigger', [[24, 17], [25, 17]], { script: 'whisperTheo' });
  m.os('trigger', [[19, 18], [19, 19], [30, 18], [30, 19]], { script: 'ballRoll' });
  m.o('blood', 21, 27, {}); m.o('debris', 30, 25, {});
  m.o('sofa', 17, 25, {}); m.o('sofa', 18, 25, {});
  // --- Omas Schlafzimmer ---
  m.o('bed', 5, 2, { kind: 'grand' }); m.o('bed', 6, 2, { kind: 'grand' });
  m.o('cabinet', 4, 2, { kind: 'night', note: 'n_oma' });
  m.o('cabinet', 7, 2, { kind: 'night', item: 'tabletten', count: 1, text: 'In der Schublade: Lesebrille, Rosenkranz, Baldrian.', after: 'Lesebrille und Rosenkranz.' });
  m.o('wardrobe', 13, 2, {});
  m.o('mirror', 11, 1, { id: 'spiegel_oma', script: 'mirrorScare' });
  m.o('rockingchair', 2, 8, { id: 'schaukelstuhl', script: 'rockingChair' });
  m.o('candle', 14, 9, {}); m.o('vase', 1, 10, {});
  m.o('cabinet', 1, 3, {});
  m.o('painting', 8, 1, { art: 'house', text: 'Ein gesticktes Bild: »Wer suchet, der findet.«' });
  // --- Bad ---
  m.o('bathtub', 16, 2, { text: ['Die Wanne ist voll. Das Wasser ist braun-rot und völlig still.', 'Ich ziehe den Stöpsel nicht. Ich will nicht sehen, was auf dem Grund liegt.'] });
  m.o('toilet', 19, 2, {});
  m.o('sink', 22, 2, {});
  m.o('mirror', 22, 1, { id: 'spiegelschrank', item: 'sicherung', count: 1, prompt: 'Spiegelschrank', text: 'Ein Spiegelschrank. Zwischen Zahnbürsten und Pillendosen liegt eine Schraubsicherung.', after: 'Zahnbürsten. Drei Stück. Oma hat allein gelebt.' });
  m.o('cabinet', 24, 2, { item: 'verband', count: 1, text: 'Handtücher und ein Verband.', after: 'Handtücher.' });
  m.o('blood', 20, 8, { hand: true });
  // --- Abstellkammer ---
  m.os('boxes', [[26, 2], [27, 2], [33, 2], [33, 4]], {});
  m.os('shelf', [[29, 2], [30, 2]], {});
  m.o('sheetcover', 31, 7, { kind: 'tall' }); m.o('sheetcover', 27, 8, { kind: 'cab' });
  m.o('crate', 32, 9, { item: 'batterie', count: 1, text: 'Eine Kiste mit Weihnachtsschmuck. Ganz unten: eine Batterie.', after: 'Weihnachtsschmuck. Ein Engel ohne Gesicht.' });
  m.o('debris', 29, 6, {});
  // --- Theos Zimmer ---
  m.o('bed', 47, 2, { kind: 'child', text: ['Theos Bett. Er hat seine Decke mitgenommen.', 'Auf dem Kissen liegt ein langes, schwarzes Haar. Viel zu lang.'] });
  m.o('desk', 36, 2, { id: 'theo_tisch', item: 'notenblatt', script: 'theoDesk', lamp: false });
  m.o('chair', 37, 3, { face: 'up' });
  m.o('paper', 44, 4, { note: 'n_theo' });
  m.o('paper', 46, 8, { note: 'd3' });
  m.o('wardrobe', 40, 2, { id: 'theo_schrank', text: 'Theos Schrank. Seine Sachen riechen noch nach ihm.' });
  m.o('toybox', 35, 9, { text: 'Spielzeug: Dinos, Murmeln, ein Walkie-Talkie ohne Batterien.' });
  m.o('poster', 42, 1, { art: 'dino', text: 'Ein Dinosaurier-Poster. Theo hat einen Pfeil dazugemalt: »ich«.' });
  m.o('lamp', 48, 9, {});
  // --- Gästezimmer ---
  m.o('bed', 2, 13, {});
  m.o('cabinet', 1, 13, { kind: 'night', item: 'batterie', count: 1, text: 'Mamas Nachttisch. Eine Batterie für ihren Wecker.', after: 'Mamas Wecker. Stehen geblieben.' });
  m.o('wardrobe', 13, 13, {});
  m.o('suitcase', 4, 19, { text: 'Mamas Koffer. Halb ausgepackt. Sie ist Hals über Kopf abgereist, als Theo verschwand.' });
  m.o('paper', 6, 18, { note: 'n_mama' });
  m.o('table', 10, 18, {}); m.o('chair', 10, 19, { face: 'up' });
  m.o('lamp', 14, 21, {});
  // --- altes Kinderzimmer ---
  m.o('bed', 2, 24, { kind: 'iron', text: 'Ein kleines Eisenbett. Die Matratze hat eine Kuhle, als läge noch jemand drin.' });
  m.os('doll', [[5, 27], [8, 26], [9, 29], [5, 30]], { text: 'Eine Porzellanpuppe. Sie sitzt mit dem Gesicht zur Mitte. Alle tun das.' });
  m.o('rockinghorse', 11, 25, { id: 'schaukelpferd', script: 'rockingHorse' });
  m.o('musicbox', 13, 24, { id: 'spieluhr', script: 'musicbox' });
  m.o('dollhouse', 1, 30, { text: 'Ein Puppenhaus, das genauso aussieht wie dieses Haus. In einem Zimmer oben sitzt eine winzige, lange Figur im Schrank.' });
  m.o('wardrobe', 14, 26, { kind: 'white' });
  m.os('chalk', [[7, 30], [8, 30]], {});
  m.o('tally', 5, 23, { text: 'Zählstriche in der Tapete. Hunderte. Dazwischen in Kinderschrift: »97, 98, 99...«' });
  m.o('tally', 6, 23, { text: 'Noch mehr Striche.' });
  m.o('painting', 10, 23, { art: 'girl', text: 'Das gleiche Mädchen wie im Flur. Hier ist ihr Gesicht unversehrt. Sie lächelt. Sie hat eine Zahnlücke.' });
  m.o('candle', 14, 32, {});
  // --- Schrankzimmer ---
  m.o('bigwardrobe', 41, 13, { id: 'grosser_schrank', script: 'bigWardrobe' });
  m.o('wardrobe', 35, 13, { kind: 'white' }); m.o('wardrobe', 48, 13, {});
  m.os('boxes', [[36, 20], [47, 20]], {});
  m.o('mirror', 38, 12, { broken: true, text: 'Ein zerbrochener Spiegel. In jedem Splitter bin ich – und in einem nicht.' });
  m.o('sheetcover', 44, 18, { kind: 'tall' });
  m.o('coatrack', 46, 16, { text: 'Ein Kleiderständer mit Omas Mänteln. Einen Moment lang dachte ich, da steht jemand.' });
  // --- Nähzimmer ---
  m.o('mannequin', 37, 26, { cloth: true, text: 'Eine Schneiderpuppe mit einem halb fertigen Kleid. Kindergröße.' });
  m.o('mannequin', 40, 28, { id: 'puppe_wandert', script: 'mannequin' });
  m.o('mannequin', 45, 25, { cloth: true, text: 'Noch eine Schneiderpuppe. Sie ist zu groß. Viel zu groß für Oma.' });
  m.o('sewing', 43, 24, { text: 'Eine Nähmaschine. Im Fuß steckt ein Faden aus schwarzem Haar.' });
  m.o('table', 46, 29, { items: 'papers', text: 'Schnittmuster. Auf allen steht dieselbe Größe: »7 Jahre«.' });
  m.o('cabinet', 48, 24, { item: 'verband', count: 1, text: 'Nähzeug, Stoffreste und ein Verband.', after: 'Nähzeug und Stoffreste.' });
  m.o('shelf', 35, 24, {});
  m.o('boxes', 35, 31, {});
  m.o('candle', 48, 32, { lit: false });
  return m.done({ theme: 'upper', name: 'Obergeschoss', spawn: { x: 24, y: 18, dir: 'up' }, stalker: true });
};

// ============================================================
//  KELLER
// ============================================================
MAPS.keller = function () {
  const m = new MapBuilder('keller', 44, 30, '#');
  m.rect(17, 2, 10, 6, 's');   // Treppenabsatz
  m.rect(2, 2, 11, 6, 's');    // Technik
  m.rect(30, 2, 12, 6, 's');   // Heizung
  m.rect(2, 10, 40, 3, 's');   // Gang
  m.rect(2, 15, 12, 13, 's');  // Weinkeller
  m.rect(16, 15, 12, 13, 's'); // Lager
  m.rect(30, 15, 12, 13, 's'); // Werkstatt
  m.rect(21, 8, 2, 2, 's');
  m.rect(17, 22, 10, 5, '~');
  m.rect(19, 21, 6, 1, '~');
  m.hdoor(7, 9, {}); m.hdoor(35, 9, {});
  m.hdoor(7, 14, {}); m.hdoor(21, 14, {});
  m.set(35, 14, 'd').set(36, 14, 'd').set(35, 13, 'd').set(36, 13, 'd');
  m.o('shutter', 35, 14, { id: 'rolltor', script: 'shutter' });
  m.o('stairs', 21, 2, { w: 2, h: 2, dir: 'up', to: { map: 'eg', x: 45, y: 17, dir: 'down' } });
  // Absatz
  m.o('guestbook', 25, 3, { id: 'gb_keller' });
  m.o('bulb', 19, 5, {});
  m.os('crate', [[17, 7], [26, 7]], {});
  m.o('cobweb', 17, 2, {});
  // Technik
  m.o('fusebox', 6, 1, { id: 'sicherungskasten', script: 'fusebox' });
  m.os('pipes', [[3, 1], [4, 1], [9, 1], [10, 1]], {});
  m.o('boxes', 2, 6, {});
  m.o('crate', 12, 6, { item: 'tabletten', count: 1, text: 'Eine Kiste mit alten Medikamenten. Ein Röhrchen Baldrian ist noch zu.', after: 'Abgelaufene Medikamente.' });
  m.o('bulb', 7, 4, {});
  // Heizung
  m.o('boiler', 34, 2, { text: 'Der Heizkessel. Er ist kalt. Durch das Gitter sieht es aus, als hätte jemand Fingernägel an der Innenseite gelassen.' });
  m.os('coal', [[30, 6], [31, 6]], {});
  m.os('pipes', [[37, 1], [38, 1], [39, 1], [40, 1]], {});
  m.o('cabinet', 41, 2, { item: 'verband', count: 1, text: 'Ein Blechschrank mit Arbeitshandschuhen und einem Verband.', after: 'Arbeitshandschuhe.' });
  m.o('bulb', 36, 5, {});
  // Gang
  m.os('bulb', [[10, 11], [28, 11], [38, 11]], {});
  [2, 3, 4, 5, 10, 11, 12, 13, 15, 16, 17, 18, 24, 25, 26, 27, 28, 29, 31, 32, 33, 38, 39, 40, 41].forEach((x) => m.o('pipes', x, 9, {}));
  m.o('blood', 25, 11, { trail: true });
  m.o('trigger', 14, 11, { script: 'cellarIntro' }); m.o('trigger', 14, 10, { script: 'cellarIntro' }); m.o('trigger', 14, 12, { script: 'cellarIntro' });
  // Weinkeller
  [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13].forEach((x) => m.o('winerack', x, 15, {}));
  [3, 4, 5, 6, 9, 10, 11, 12].forEach((x) => { m.o('winerack', x, 19, {}); m.o('winerack', x, 23, {}); });
  m.o('crate', 12, 26, { id: 'weinkiste', big: true, script: 'crateWine' });
  m.os('barrel', [[2, 27], [3, 27], [2, 26]], {});
  m.o('candles', 7, 21, { lit: false });
  // Lager (überflutet)
  m.os('boxes', [[16, 15], [17, 15], [27, 15]], {});
  m.o('sheetcover', 26, 16, { kind: 'cab' });
  m.o('bike', 25, 19, { text: 'Ein Kinderfahrrad, verrostet. Am Lenker ein Wimpel: »Ilse«— nein. Der Stoff ist zerrissen. Nur ein »I« ist übrig.' });
  m.o('paper', 16, 20, { text: ['Ein einzelner Kinderschuh, Größe 28. Lackleder, sehr alt.', 'Nicht Theos. Gott sei Dank. Aber wessen dann?'], prompt: 'Untersuchen' });
  m.o('pickup', 27, 27, { item: 'tabletten', count: 1 });
  m.o('pickup', 16, 27, { item: 'batterie', count: 1 });
  m.o('bulb', 22, 17, {});
  // Werkstatt
  m.o('workbench', 31, 15, { item: 'kurbel', text: 'Auf der Werkbank liegt eine Handkurbel mit Holzgriff.', after: 'Sägemehl und Schrauben.' });
  m.o('cabinet', 40, 15, { item: 'ventilrad', text: 'Im Werkzeugschrank hängt ein rotes Handrad mit einem Zettel: »Gewächshaus – gerichtet«.', after: 'Schraubenschlüssel in allen Größen.' });
  m.os('toolwall', [[33, 14], [38, 14]], {});
  m.o('table', 36, 18, { items: 'papers', note: 'n_werkstatt' }); m.o('table', 37, 18, { items: 'papers' });
  m.o('pickup', 41, 27, { item: 'batterie', count: 1 });
  m.o('bulb', 35, 21, {});
  m.os('crate', [[30, 27], [31, 27]], {});
  return m.done({
    theme: 'cellar', name: 'Keller', spawn: { x: 21, y: 5, dir: 'down' },
    crawlers: [{ x: 8, y: 21 }, { x: 21, y: 18 }, { x: 37, y: 11 }],
  });
};

// ============================================================
//  DACHBODEN
// ============================================================
MAPS.dachboden = function () {
  const m = new MapBuilder('dachboden', 36, 18, '#');
  m.rect(1, 2, 34, 14, 'w');
  m.set(8, 1, '=').set(27, 1, '=');
  m.o('ladder', 3, 14, { to: { map: 'og', x: 29, y: 31, dir: 'down' } });
  m.os('beam', [[10, 5], [10, 11], [18, 5], [18, 11], [26, 5], [26, 11]], {});
  m.o('sheetcover', 5, 3, { kind: 'tall' }); m.o('sheetcover', 6, 3, { kind: 'cab' });
  m.o('sheetcover', 13, 3, {}); m.o('sheetcover', 14, 9, { kind: 'cab' });
  m.o('sheetcover', 21, 3, { kind: 'tall' }); m.o('sheetcover', 22, 14, {});
  m.os('boxes', [[1, 2], [2, 2], [31, 14], [32, 14], [33, 14]], {});
  m.o('trunk', 16, 14, { id: 'truhe', script: 'atticTrunk', note: 'p3' });
  m.os('doll', [[13, 7], [15, 8], [13, 9], [15, 10]], { text: 'Eine Puppe. Sie sitzt im Kreis mit den anderen. Als würden sie auf jemanden warten.' });
  m.o('dollhouse', 30, 3, { text: 'Noch ein Puppenhaus. Hier fehlt das Dach. Ganz oben liegt ein winziges Bett, leer.' });
  m.o('rockingchair', 24, 8, { rock: true, text: 'Ein Schaukelstuhl. Er schaukelt. Hier oben geht kein Wind.' });
  m.o('cradle', 32, 8, { id: 'wiege', script: 'cradle' });
  m.o('bones', 30, 10, {}); m.o('blood', 31, 9, {});
  m.o('candles', 31, 7, {}); m.o('candles', 33, 7, {});
  m.o('paper', 28, 13, { note: 'd6' });
  m.o('tally', 20, 1, { text: 'Zählstriche, mit Fingernägeln in das Holz gekratzt.' });
  m.o('tally', 21, 1, { text: 'Sie hören bei neunundneunzig auf.' });
  m.o('cobweb', 1, 2, {}); m.o('cobweb', 34, 2, { flip: true });
  return m.done({ theme: 'attic', name: 'Dachboden', spawn: { x: 3, y: 12, dir: 'down' } });
};

// ============================================================
//  GEWÄCHSHAUS
// ============================================================
MAPS.gewaechshaus = function () {
  const m = new MapBuilder('gewaechshaus', 30, 19, '$');
  m.rect(1, 2, 28, 16, 's');
  m.rect(2, 3, 6, 4, 'e').rect(22, 3, 6, 4, 'e').rect(2, 13, 6, 4, 'e').rect(22, 13, 6, 4, 'e');
  m.rect(11, 7, 8, 6, '~');
  m.exit(14, 18, { to: { map: 'hof', x: 45, y: 26, dir: 'down' } });
  m.o('valve', 15, 1, { id: 'ventil', script: 'valve' });
  m.os('plant', [[3, 4], [5, 4], [23, 4], [26, 5], [3, 14], [6, 15], [23, 14], [26, 15]], { kind: 'rose' });
  m.os('plant', [[1, 9], [28, 9], [9, 3], [20, 3], [9, 12], [20, 12]], { kind: 'leaf' });
  m.os('plant', [[4, 10], [25, 10], [6, 5]], { kind: 'dead' });
  m.os('plant', [[24, 6], [4, 16]], { kind: 'flower' });
  m.os('table', [[9, 15], [10, 15], [19, 15]], { items: 'pots' });
  m.o('table', 20, 15, { items: 'pots', note: 'd5' });
  m.o('wheelbarrow', 8, 9, {});
  m.o('bench', 13, 15, {});
  m.o('pickup', 14, 9, { id: 'glocke3_obj', item: 'glocke3', hidden: 'pond_drained' });
  m.o('trigger', 14, 14, { script: 'greenhouseIntro' }); m.o('trigger', 15, 14, { script: 'greenhouseIntro' });
  return m.done({ theme: 'greenhouse', name: 'Gewächshaus', spawn: { x: 14, y: 17, dir: 'up' }, crawlers: [{ x: 24, y: 9, root: true }] });
};

// ============================================================
//  KAPELLE
// ============================================================
MAPS.kapelle = function () {
  const m = new MapBuilder('kapelle', 22, 17, '#');
  m.rect(1, 2, 20, 14, 's');
  m.rect(9, 5, 3, 11, 'c');
  [4, 9, 12, 17].forEach((x) => m.set(x, 1, '='));
  m.exit(10, 16, { to: { map: 'hof', x: 45, y: 38, dir: 'down' } });
  m.o('smallaltar', 9, 3, { text: ['Der Altar. Eine weiße Decke, zwei Kerzen. Die Kerzen sind frisch.', 'Darauf liegt eine Kinderhandvoll Zuckerwürfel.'] });
  [7, 9, 11, 13].forEach((y) => { for (let x = 2; x < 8; x++) m.o('pew', x, y, {}); for (let x = 13; x < 19; x++) m.o('pew', x, y, {}); });
  m.o('statue', 2, 3, { text: 'Ein Heiliger mit einer Glocke in der Hand. Die Glocke ist abgebrochen.' });
  m.o('statue', 19, 3, { text: 'Eine Madonna. Jemand hat ihr die Augen verbunden.' });
  m.o('stairs', 13, 3, { w: 2, h: 2, dir: 'down', to: { map: 'gruft', x: 12, y: 5, dir: 'down' } });
  m.o('bellrope', 17, 4, { id: 'glockenseil', script: 'bellrope' });
  m.o('plaque', 6, 1, { note: 'n_kapelle' });
  m.o('candles', 2, 14, {}); m.o('candles', 19, 14, {});
  m.o('guestbook', 20, 15, { id: 'gb_kapelle' });
  m.o('cobweb', 1, 2, {}); m.o('cobweb', 20, 2, { flip: true });
  m.os('trigger', [[9, 10], [10, 10], [11, 10]], { script: 'scareBells' });
  return m.done({ theme: 'chapel', name: 'Kapelle', spawn: { x: 10, y: 15, dir: 'up' } });
};

// ============================================================
//  GRUFT
// ============================================================
MAPS.gruft = function () {
  const m = new MapBuilder('gruft', 26, 24, '#');
  m.rect(9, 2, 8, 5, 's');
  m.rect(11, 7, 4, 10, 's');
  m.rect(2, 9, 7, 6, 's'); m.rect(17, 9, 7, 6, 's');
  m.rect(9, 11, 2, 2, 's'); m.rect(15, 11, 2, 2, 's');
  m.rect(5, 17, 16, 5, 's');
  m.o('stairs', 12, 2, { w: 2, h: 2, dir: 'up', to: { map: 'kapelle', x: 13, y: 6, dir: 'down' } });
  m.o('plaque', 15, 1, { note: 'n_gruft' });
  m.os('coffin', [[3, 10], [5, 10], [7, 10], [18, 10], [20, 10], [22, 10]], {});
  m.o('niche', 5, 8, { id: 'nische_p4', note: 'p4', script: 'nicheP4' });
  m.o('niche', 20, 8, { text: 'Eine Grabnische. Ein Schädel, sauber, fast poliert. Daneben ein Zuckerwürfel.' });
  m.os('bones', [[2, 13], [23, 12], [12, 9]], {});
  m.o('candles', 11, 8, { lit: false }); m.o('candles', 14, 12, { lit: false });
  m.o('altar', 11, 18, { id: 'altar', script: 'altar' });
  m.o('theo', 12, 20, { id: 'theo_npc' });
  m.o('candles', 6, 20, {}); m.o('candles', 19, 20, {});
  m.o('statue', 7, 17, { kind: 'child', text: 'Eine kleine Steinfigur. Ein Mädchen, das sich die Augen zuhält.' });
  m.o('statue', 18, 17, { kind: 'child', text: 'Noch eine. Diese hier blinzelt durch die Finger.' });
  m.o('cobweb', 9, 2, {}); m.o('cobweb', 16, 2, { flip: true });
  m.o('trigger', 12, 15, { script: 'cryptEnter' }); m.o('trigger', 13, 15, { script: 'cryptEnter' });
  return m.done({ theme: 'crypt', name: 'Gruft', spawn: { x: 12, y: 5, dir: 'down' } });
};

const MAP_ORDER = ['wald', 'huette', 'hof', 'schuppen', 'eg', 'og', 'keller', 'dachboden', 'gewaechshaus', 'kapelle', 'gruft'];
const MAP_DEFS = {};
function getMapDef(id) {
  if (!MAP_DEFS[id]) MAP_DEFS[id] = MAPS[id]();
  return MAP_DEFS[id];
}
