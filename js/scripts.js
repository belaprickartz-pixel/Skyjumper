'use strict';
// ------------------------------------------------------------
//  Geschichte & Skripte. Skripte sind Generatoren, die Befehle
//  "yielden" (Dialog, Auswahl, Warten, Notiz, Zahlenschloss ...).
// ------------------------------------------------------------
const say = (text, opts) => ({ cmd: 'say', text, opts });
const ask = (text, options, opts) => ({ cmd: 'choice', text, options, opts });
const wait = (s) => ({ cmd: 'wait', s });
const showNote = (id) => ({ cmd: 'note', id });

const Story = {
  bellCount() {
    let n = 0;
    ['glocke1', 'glocke2', 'glocke3'].forEach((b) => { if (Game.inv[b]) n++; });
    const a = Game.objState.altar;
    if (a && a.bells) n += a.bells;
    return n;
  },
  pages() { return Game.notes.filter((x) => NOTES[x].kind === 'page'); },
  objectives() {
    const f = Game.flags, inv = Game.inv, n = Game.notes, os = Game.objState;
    const L = [];
    L.push({ text: 'Finde Theo.', done: !!f.ending, main: true });
    if (!f.car_searched) L.push({ text: 'Durchsuche das Auto.', main: true });
    L.push({ text: 'Komm zum Anwesen Grauwald.' + (n.includes('n_weg') && !f.gate_open ? ' Den Torschlüssel hat der Jäger – seine Hütte liegt westlich vom Waldweg.' : ''), done: !!f.gate_open, main: true });
    if (f.gate_open) L.push({ text: 'Finde einen Weg ins Haus.' + (f.tried_front && !f.inside ? ' Vorne ist verriegelt. Vielleicht über die Küche, rechts am Haus?' : ''), done: !!f.inside, main: true });
    if (f.inside) {
      if (f.tried_tuer_keller || inv.kellerschluessel || f.visited_keller) L.push({ text: 'Finde den Kellerschlüssel.', done: !!(os.tuer_keller && os.tuer_keller.unlocked) });
      if (n.includes('n_keller') || f.visited_keller) L.push({ text: 'Stelle im Keller den Strom wieder her (2 Sicherungen).', done: !!f.power });
      if (f.tried_tuer_arbeitszimmer || n.includes('n_klavier')) L.push({ text: 'Komm ins Arbeitszimmer.' + (n.includes('n_klavier') && !f.piano_solved ? ' Das Schlaflied auf dem Klavier...' : ''), done: !!(os.tuer_arbeitszimmer && os.tuer_arbeitszimmer.unlocked) });
      if (f.saw_safe) L.push({ text: 'Öffne den Tresor (vier Ziffern).', done: !!f.safe_open });
      if (f.power && !f.attic_open && f.knows_hatch) L.push({ text: 'Öffne die Dachbodenluke im Obergeschoss.', done: !!f.attic_open });
    }
    if (f.ritual_known) {
      const b = Story.bellCount();
      L.push({ text: 'Finde die drei Glocken (' + b + '/3).', done: b >= 3, main: true });
      L.push({ text: 'Bring die Glocken auf den Altar in der Gruft unter der Kapelle.', done: !!f.ending, main: true });
    }
    const pg = Story.pages().length;
    if (pg > 0 || f.ritual_known) L.push({ text: 'Tagebuchseiten mit ihrem Namen (' + pg + '/4).', done: pg >= 4 });
    const dr = n.filter((x) => NOTES[x].kind === 'drawing').length;
    if (dr > 0) L.push({ text: 'Theos Zeichnungen (' + dr + '/6).', done: dr >= 6 });
    return L;
  },
  useItem(id) {
    const p = Game.player;
    switch (id) {
      case 'batterie':
        if (!p.hasLamp()) return { msg: 'Ich habe keine Lampe dafür.' };
        if (p.battery >= 95) return { msg: 'Die Batterie ist noch fast voll.' };
        Game.take('batterie'); p.battery = 100; p.emptyWarned = false; Sound.play('battery');
        return { msg: 'Batterie gewechselt.' };
      case 'verband':
        if (p.hp >= 100) return { msg: 'Mir fehlt nichts. Noch nicht.' };
        Game.take('verband'); p.hp = Math.min(100, p.hp + 45); Sound.play('page');
        return { msg: 'Verband angelegt. Besser.' };
      case 'tabletten':
        if (p.sanity >= 95) return { msg: 'Ich bin ruhig. Halbwegs.' };
        Game.take('tabletten'); p.sanity = Math.min(100, p.sanity + 40); Sound.play('click');
        return { msg: 'Zwei Dragees. Bitter. Es wird ruhiger.' };
      case 'notenblatt': return { note: 'n_noten' };
      case 'taschenlampe': Game.toggleFlash(); return { msg: p.flashOn ? 'Lampe an.' : 'Lampe aus.' };
      default: return { msg: 'Das kann ich hier nicht einfach benutzen.' };
    }
  },
};

// ------------------------------------------------------------
//  Allgemeine Bausteine
// ------------------------------------------------------------
function* sayAll(t, opts) {
  if (Array.isArray(t)) { for (const l of t) yield say(l, opts); } else if (t) yield say(t, opts);
}
function* readNote(o, id) {
  if (o) o.st.read = true;
  Game.addNote(id);
  yield showNote(id);
}
function* pickup(o) {
  const id = o.p.item, n = o.p.count || 1;
  o.st.taken = true;
  Game.give(id, n);
  const it = ITEMS[id];
  const ART = { taschenlampe: 'die', brecheisen: 'das', notenblatt: 'das', ventilrad: 'das', kurbel: 'die', glocke1: 'die', glocke2: 'die', glocke3: 'die' };
  if (!it.stack) yield say('Ich nehme ' + (ART[id] || 'den') + ' {y}' + it.name + '{/} an mich.');
  else UI.toast('Eingesteckt: {y}' + it.name + '{/}' + (n > 1 ? ' (' + n + ')' : ''));
}
function* warpTo(to) {
  Game.warp(to.map, to.x, to.y, to.dir);
  yield wait(0.5);
}
function defaultText(o) {
  const list = DEFAULT_TEXT[o.type];
  if (!list) return null;
  return list[Math.floor(U.hash(o.x, o.y, 4) * list.length)];
}

function* doorInteract(o) {
  const p = o.p, st = o.st;
  if (p.locked && !st.unlocked) {
    if (Game.has(p.locked)) {
      Sound.play('unlock');
      st.unlocked = true;
      Game.take(p.locked);
      yield say('Ich schließe mit dem {y}' + ITEMS[p.locked].name + '{/} auf.');
      Game.world.invalidateNav();
      if (p.to) { if (p.chainOpen) st.open = true; Sound.play('door'); yield* warpTo(p.to); return; }
      st.open = true; Sound.play('door');
      return;
    }
    Sound.play('locked');
    Game.flags['tried_' + o.id] = true;
    yield say(p.lockText || 'Abgeschlossen.');
    return;
  }
  if (p.to) {
    Sound.play('door');
    yield* warpTo(p.to);
    return;
  }
  const pl = Game.player;
  if (st.open) {
    const [x, y, w, h] = [o.x * TS, o.y * TS, TS, TS];
    if (pl.x + 4 > x && pl.x - 4 < x + w && pl.y > y - 2 && pl.y - 5 < y + h) return; // steht in der Tür
    if (Game.stalker.present(Game.world) && Math.hypot(Game.stalker.x - o.cx, Game.stalker.y - o.cy) < 14) return;
    st.open = false; Sound.play('door');
  } else {
    st.open = true; Sound.play('door');
    Game.noise(o.cx, o.cy, 70);
  }
  Game.world.invalidateNav();
}

function* guestbook(o) {
  const lines = {
    huette_gb: 'Der letzte Eintrag: »Brandt, 17.10. – Hier hört man sie nicht.«',
    gb_halle: 'Die Zeile über meiner ist in Kinderschrift: »theo«. Daneben ein Smiley.',
    gb_og: 'Eine Seite ist voll mit Strichen. Immer zehn. Dann bricht es ab.',
    gb_keller: 'Jemand hat hier unten ein Gästebuch hingelegt. Wer trägt sich im Keller ein?',
    gb_kapelle: 'Die Einträge sind alle von 1952. Lauter Namen aus dem Dorf. Alle haben gesucht.',
  };
  const first = !o.st.used;
  const c = yield ask(first ? 'Ein Gästebuch mit einer Kerze daneben. Hier fühle ich mich ein bisschen sicherer.' : 'Das Gästebuch.', ['Eintragen  (Spiel speichern)', 'Weitergehen']);
  if (c !== 0) return;
  o.st.used = true;
  Game.save();
  Sound.play('save');
  Game.player.sanity = Math.min(100, Game.player.sanity + 15);
  yield say('Ich schreibe meinen Namen ins Buch. {g}(Gespeichert){/}');
  if (first && lines[o.id]) yield say(lines[o.id]);
}

function* lightCandle(o) {
  if (!Game.has('streichhoelzer')) { yield say('Die Kerzen sind aus. Wenn ich nur Streichhölzer hätte.'); return; }
  const c = yield ask('Die Kerzen sind aus. Ein Streichholz opfern?', ['Anzünden', 'Lassen']);
  if (c !== 0) return;
  Game.take('streichhoelzer');
  Sound.play('lighter');
  o.st.lit = true;
  Game.player.sanity = Math.min(100, Game.player.sanity + 10);
  yield say('Die Flamme richtet sich auf. Licht. Wenigstens ein bisschen.');
}

// Standard-Interaktion für jedes Objekt
function* interact(o) {
  const p = o.p, st = o.st, d = o.def;
  if (p.script && Scripts[p.script]) { yield* Scripts[p.script](o); return; }
  if (d.save) { yield* guestbook(o); return; }
  if (o.type === 'door' || o.type === 'bigdoor') { yield* doorInteract(o); return; }
  if ((o.type === 'candle' || o.type === 'candles') && !OBJ.isLit(o)) { yield* lightCandle(o); return; }
  let shown = false;
  if (p.item && !st.taken) {
    if (p.text) yield* sayAll(p.text);
    yield* pickup(o);
    shown = true;
  } else if (st.taken && p.after) { yield say(p.after); shown = true; }
  else if (p.text) { yield* sayAll(p.text); shown = true; }
  if (p.note) {
    if (o.type === 'paper') st.read = true;
    yield* readNote(o, p.note);
    shown = true;
  }
  if (d.hide) {
    const c = yield ask(shown ? null : defaultText(o), [d.hide, 'Lieber nicht']);
    if (c === 0) Game.hide(o);
    return;
  }
  if (!shown) {
    const t = defaultText(o);
    if (t) yield say(t);
  }
}

// ------------------------------------------------------------
//  Einzelne Skripte
// ------------------------------------------------------------
const Scripts = {
  *car(o) {
    if (!Game.flags.car_searched) {
      yield say('Unser alter Passat. Der Motor ist tot. Nur ein Scheinwerfer flackert noch.');
      yield say('Im Handschuhfach...');
      Game.give('taschenlampe');
      Game.player.flashOn = true;
      Sound.play('flashOn');
      yield say('Papas Stablampe. Sie geht noch.  {g}[F] an / aus{/}');
      Game.give('batterie', 1);
      UI.toast('Batterie eingesteckt  ({g}[R] wechseln{/})');
      Game.flags.car_searched = true;
      yield say('Darunter ein alter Zettel von Mama.');
      yield* readNote(o, 'n_weg');
      yield say('Okay. Der Jäger. Westlich vom Weg. Und dann zu Omas Haus.');
    } else {
      const t = ['Kein Netz. Immer noch nicht.', 'Ich drehe den Schlüssel. Nichts. Nicht mal ein Klicken.', 'Auf der Rückbank liegt Theos Gameboy. Ich lasse ihn liegen. Ich bringe lieber Theo mit.'];
      yield say(t[(Game.flags.car_n = ((Game.flags.car_n || 0) + 1)) % t.length]);
    }
  },
  *roadWest() {
    if (Game.flags.road_west) return;
    Game.flags.road_west = true;
    yield say('Hinter mir: nur Straße, Nebel und zwölf Kilometer bis zum nächsten Dorf.');
    yield say('Nein. Theo ist hier irgendwo.');
  },
  *gateWald(o) {
    if (o.st.unlocked) { Sound.play('door'); yield* warpTo({ map: 'hof', x: 27, y: 39, dir: 'up' }); return; }
    if (Game.has('torschluessel')) {
      Game.take('torschluessel');
      Sound.play('unlock');
      o.st.unlocked = true;
      Game.flags.gate_open = true;
      yield say('Das Schloss ist rostig, aber der Schlüssel dreht sich. Die Kette rasselt zu Boden.');
      Sound.play('door');
      yield* warpTo({ map: 'hof', x: 27, y: 39, dir: 'up' });
      return;
    }
    Sound.play('locked');
    yield say('Das Tor ist abgeschlossen. Ein neues Vorhängeschloss an einer alten Kette.');
    if (Game.notes.includes('n_weg')) yield say('Mama hat geschrieben: Den Schlüssel hat der Jäger. Westlich vom Weg.');
  },
  *backpack(o) {
    if (!o.st.read) {
      yield say('Theos Rucksack. Der blaue, mit dem Dino-Anhänger.');
      yield say('Er liegt einfach hier, mitten im Gras. Als hätte er ihn fallen lassen. Oder als sollte ich ihn finden.');
      yield say('Im Vorderfach steckt eine Zeichnung.');
      yield* readNote(o, 'd1');
      Game.player.sanity = Math.max(0, Game.player.sanity - 5);
    } else yield say('Seine Brotdose ist noch drin. Leer. Theo, wo bist du?');
  },
  *shrine(o) {
    if (!o.st.read) {
      yield say('Das Wegkreuz. Eine kleine Madonna unter einem Holzdach. Jemand hat die Kerzen angezündet. Frisch.');
      yield say('Unter dem Bild steckt eine vergilbte Seite, eingeklemmt zwischen zwei Brettern.');
      yield* readNote(o, 'p1');
      Sound.play('whisper');
      yield say('Davor liegen Zuckerwürfel. Ganz frisch, noch nicht mal nass.');
    } else yield say('Die Kerzen brennen noch. Ich bleibe einen Moment im Licht.');
  },
  *scareWald() {
    if (Game.flags.scare_wald) return;
    Game.flags.scare_wald = true;
    Game.fx.push({ type: 'apparition', x: 31 * TS + 8, y: 14 * TS + 12, t: 0, life: 2.4, dir: 'left' });
    Sound.play('whisper');
    setTimeout(() => Sound.play('creak'), 600);
    Game.player.sanity -= 6;
  },
  *scareWindow() {
    if (Game.flags.scare_window) return;
    Game.flags.scare_window = true;
    Game.lightning = 1; Game.lightningT = 14;
    setTimeout(() => Sound.play('thunder'), 300);
    Game.fx.push({ type: 'windowFigure', x: 41 * TS + 8, y: 11 * TS + 13, t: 0, life: 1.1 });
    Game.player.sanity -= 6;
    yield wait(1.2);
    yield say('Da oben. Im Fenster. Da stand jemand. Groß. Viel zu groß.');
  },
  *graveyardWhisper() {
    if (Game.flags.grave_whisper) return;
    Game.flags.grave_whisper = true;
    Sound.play('whisper');
    Game.fxText(10 * TS, 31 * TS, '...hier liege ich nicht...', C.bn1, 2.5);
  },
  *gateHof() {
    const c = yield ask('Zurück in den Wald?', ['Ja', 'Nein'], { cancel: 1 });
    if (c === 0) { Sound.play('door'); yield* warpTo({ map: 'wald', x: 23, y: 1, dir: 'down' }); }
  },
  *frontDoorOut() {
    if (Game.flags.front_unbolted) { Sound.play('door'); yield* warpTo({ map: 'eg', x: 24, y: 31, dir: 'up' }); return; }
    Game.flags.tried_front = true;
    Sound.play('locked');
    yield say('Die Haustür. Sie gibt keinen Millimeter nach. Von innen verriegelt.');
    yield say('Wer hat von innen abgeschlossen, wenn das Haus leer ist?');
  },
  *kitchenDoorOut(o) {
    if (o.st.unboarded) { Sound.play('door'); yield* warpTo({ map: 'eg', x: 42, y: 32, dir: 'up' }); return; }
    if (!Game.has('brecheisen')) {
      Game.flags.tried_front = true;
      yield say('Die Küchentür. Mit Brettern vernagelt, kreuz und quer. Mit bloßen Händen bekomme ich die nicht ab.');
      return;
    }
    yield say('Ich setze das Brecheisen an.');
    for (let i = 0; i < 3; i++) { Sound.play('wood'); Game.shake(2, 0.2); Game.noise(o.cx, o.cy, 120); yield wait(0.5); }
    o.st.unboarded = true;
    yield say('Die Bretter fallen. Die Tür dahinter ist nicht mal abgeschlossen.');
    Sound.play('door');
    yield* warpTo({ map: 'eg', x: 42, y: 32, dir: 'up' });
  },
  *frontDoorIn(o) {
    if (!o.st.unbolted) {
      const c = yield ask('Die Haustür. Ein schwerer Eisenriegel, frisch geölt.', ['Riegel zurückschieben', 'Lassen'], { cancel: 1 });
      if (c !== 0) return;
      o.st.unbolted = true; Game.flags.front_unbolted = true;
      Sound.play('unlock');
      Game.world.invalidateNav();
      yield say('Jetzt komme ich vorne rein und raus.');
      return;
    }
    Sound.play('door');
    yield* warpTo(o.p.to);
  },
  *well() {
    yield say('Ein alter Brunnen. Tief unten schimmert Wasser.');
    yield say('In den Rand ist geritzt: »NICHT HINEINRUFEN«.');
    if (Game.flags.well_called) return;
    const c = yield ask(null, ['Hineinrufen', 'Lieber nicht'], { cancel: 1 });
    if (c !== 0) return;
    Game.flags.well_called = true;
    yield say('»Theo?«');
    yield wait(1.3);
    Sound.play('whisper');
    Game.fxText(36 * TS + 8, 32 * TS, '...theo...', C.bn1, 2.5);
    yield wait(1.4);
    Game.fxText(36 * TS + 8, 32 * TS, '...mara...', C.rd4, 2.5);
    Sound.play('laugh');
    Game.player.sanity -= 10;
    yield wait(1);
    yield say('Das Echo kommt zurück. Zweimal. Beim zweiten Mal hat es meinen Namen gesagt.');
  },
  *graveIlse(o) {
    yield* readNote(o, 'n_grab');
    if (Story.pages().length >= 4) yield say('Ich weiß jetzt, was hier stand. I. L. S. E.');
  },
  *clockFoyer(o) {
    if (!o.st.read) {
      o.st.read = true;
      yield say('Eine Standuhr. Sie ist stehen geblieben.');
      yield say('Die Zeiger stehen auf {y}drei Uhr siebzehn{/}.');
    } else yield say('Drei Uhr siebzehn. Das Pendel bewegt sich nicht. Trotzdem höre ich manchmal ein Ticken.');
    Game.flags.saw_clock = true;
  },
  *safe(o) {
    Game.flags.saw_safe = true;
    if (o.st.open) { yield say(o.st.emptied ? 'Der Tresor ist leer.' : 'Der Tresor steht offen.'); return; }
    if (!o.st.looked) { o.st.looked = true; yield say('Ein Tresor, in die Wand eingelassen. Ein Zahlenrad mit vier Ringen.'); }
    const r = yield { cmd: 'code', title: 'Tresor' };
    if (r === null || r === undefined) return;
    if (r === '0317') {
      Sound.play('unlock');
      o.st.open = true;
      Game.flags.safe_open = true;
      yield say('Klick. Die schwere Tür schwingt auf.');
      Game.give('glocke1'); Game.give('kapellenschluessel');
      o.st.emptied = true;
      Sound.play('pickup');
      yield say('Darin: eine kleine {y}Silberglocke{/}, ein langer {y}Schlüssel mit Kreuz{/} ... und ein Bündel Papiere.');
      yield* readNote(o, 'n_ritual');
      Game.flags.ritual_known = true;
      yield say('Drei Glocken. Eine habe ich. Eine oben unterm Dach. Eine im Wasser bei den Rosen.');
      yield say('Und dann runter in die Gruft unter der Kapelle.');
    } else {
      Sound.play('locked');
      yield say('Nichts. Die Ringe springen zurück auf Null.');
      if (!Game.notes.includes('n_oma') && !Game.flags.saw_clock) yield say('Oma hat sich nie Zahlen gemerkt. Sie hat sie irgendwo hingeschrieben. Oder hingestellt.');
    }
  },
  *piano(o) {
    if (Game.flags.piano_solved) { yield say('Das Klavier. Ich spiele lieber nicht noch einmal.'); return; }
    if (!o.st.looked) {
      o.st.looked = true;
      yield say('Ein altes Klavier. Ein paar Tasten sind vergilbt, auf dem Notenhalter klebt Kerzenwachs.');
      if (!Game.has('notenblatt')) yield say('Oma hat hier immer ein Schlaflied gespielt. Wie ging das noch...');
    }
    const ok = yield { cmd: 'piano' };
    if (!ok) return;
    Game.flags.piano_solved = true;
    yield wait(0.4);
    yield say('Als der letzte Ton verklingt, wird es still. Ganz still. Sogar der Regen klingt weiter weg.');
    Sound.play('click');
    yield say('Im Klavier klackt etwas. Unter dem Deckel liegt ein kleiner {y}Messingschlüssel{/}.');
    Game.give('messingschluessel');
    Game.player.sanity = Math.min(100, Game.player.sanity + 30);
    if (Game.flags.stalker_on) Game.stalker.vanish(70);
  },
  *gramophone(o) {
    if (o.st.playing) { yield say('Die Platte knistert nur noch.'); return; }
    o.st.playing = true;
    Game.playMelody(Sound.LULLABY, 0.75, 'piano', 0.07);
    yield say('Ich setze die Nadel auf. Eine Schellackplatte, verkratzt. Ein Schlaflied.');
    yield say('Ich kenne es. Oma hat es gesummt, wenn sie Kartoffeln geschält hat.');
    Game.player.sanity = Math.min(100, Game.player.sanity + 10);
    setTimeout(() => { o.st.playing = false; }, 7000);
  },
  *placecard() {
    yield say('Ein Gedeck mehr, ganz am Ende. Auf dem Teller: ein einzelner Zuckerwürfel.');
    yield say('Ein Namenskärtchen. Die Tinte ist verwischt. Nur der erste Buchstabe ist lesbar: {r}I{/}.');
  },
  *bookP2(o) {
    if (o.st.taken) { yield say('Die Märchenbücher. Eines steht jetzt richtig herum.'); return; }
    yield say('Ein Buch steht verkehrt herum im Regal. »Kinder- und Hausmärchen«.');
    yield say('Zwischen »Hänsel und Gretel« und »Rotkäppchen« steckt ein herausgerissenes Tagebuchblatt.');
    o.st.taken = true;
    yield* readNote(o, 'p2');
  },
  *scareBooks() {
    if (Game.flags.scare_books) return;
    Game.flags.scare_books = true;
    Sound.play('slam');
    Game.shake(2, 0.3);
    yield wait(0.5);
    yield say('Ein Buch ist aus dem Regal gefallen. Ganz hinten. Von allein.');
  },
  *scarePiano() {
    if (Game.flags.scare_piano) return;
    Game.flags.scare_piano = true;
    Game.playMelody(['A', 'C2', 'H'], 0.6, 'piano', 0.09);
    yield wait(2.2);
    yield say('Das Klavier. Drei Töne. Da sitzt niemand.');
    Game.player.sanity -= 6;
  },
  *theoDesk(o) {
    if (o.st.taken) { yield say('Theos Malstifte. Der schwarze ist fast aufgebraucht.'); return; }
    yield say('Theos Schreibtisch. Malstifte, ein Comic, Kaugummipapier.');
    yield say('Und ein Notenblatt, mit Lineal liniert. Theos Handschrift.');
    o.st.taken = true;
    Game.give('notenblatt');
    Game.addNote('n_noten');
    Sound.play('pickup');
    if (!Game.flags.stalker_on) yield* Scripts.stalkerIntro();
  },
  *stalkerIntro() {
    Game.flags.stalker_on = true;
    Game.flickerT = 3.5;
    Sound.play('stinger');
    yield wait(1.2);
    yield say('{s}»...achtundneunzig...  neunundneunzig...  hundert.«{/}');
    yield say('Die Stimme kommt von nebenan. Tief und heiser, wie durch Erde gesprochen.');
    yield say('{s}»Ich komme.«{/}');
    const big = Game.world.objects.find((x) => x.id === 'grosser_schrank');
    if (big) big.st.empty = true;
    Sound.play('door');
    const s = Game.stalker;
    s.place(Game.world, 41, 16, 'idle');
    s.timer = 2.5;
    s.count = 1;
    s.state = 'idle';
    s.afterIdle = 'investigate';
    s.lastSeen = { x: Game.player.x, y: Game.player.y };
    yield say('Versteck dich. Sofort.  {g}(Schrank oder Bett: [E]){/}');
  },
  *bigWardrobe(o) {
    if (!Game.flags.stalker_on) {
      yield say('Der große Schrank. Von innen kratzt etwas. Ganz leise. Ganz geduldig.');
      yield say('Ich mache ihn nicht auf. Ich mache ihn auf gar keinen Fall auf.');
      Game.player.sanity -= 4;
    } else yield say('Die Türen stehen einen Spalt offen. Drinnen nur Dunkelheit und der Geruch von nasser Erde.');
  },
  *atticHatch(o) {
    if (o.st.open) { Sound.play('creak'); yield* warpTo({ map: 'dachboden', x: 3, y: 12, dir: 'down' }); return; }
    Game.flags.knows_hatch = true;
    if (!Game.has('kurbel')) {
      yield say('In der Decke ist eine Luke. Statt eines Griffs nur eine Öse mit Vierkant.');
      yield say('Da fehlt eine Kurbel.');
      return;
    }
    yield say('Ich stecke die Kurbel in die Öse und drehe.');
    Sound.play('creak'); Game.shake(1, 0.6);
    yield wait(0.8);
    Game.take('kurbel');
    o.st.open = true; Game.flags.attic_open = true;
    yield say('Eine Holzleiter klappt herunter. Oben ist es stockdunkel. Es riecht nach Staub und Milch.');
  },
  *mirrorScare(o) {
    if (o.st.done) { yield say('Ein Spiegel. Ich sehe müde aus. Und alt.'); return; }
    o.st.done = true;
    o.st.scare = Game.time + 0.5;
    Sound.play('stinger');
    Game.shake(2, 0.3);
    Game.player.sanity -= 12;
    yield wait(0.6);
    yield say('Im Spiegel – hinter mir – !');
    yield say('...Nichts. Da ist nichts. Da war nichts.');
  },
  *rockingChair(o) {
    o.st.rock = !o.st.rock;
    yield say(o.st.rock ? 'Ich stoße den Schaukelstuhl an. Er schaukelt. Und schaukelt. Und hört nicht auf.' : 'Ich halte ihn an. Das Holz ist warm.');
  },
  *rockingHorse(o) {
    o.st.rock = true;
    Sound.play('creak');
    yield say('Das Schaukelpferd. Als ich es berühre, fängt es an zu schaukeln. Es wird nicht langsamer.');
  },
  *musicbox(o) {
    o.st.playing = true;
    Game.playMelody(Sound.LULLABY, 0.6, 'musicbox');
    yield say('Die Spieluhr spielt ein Schlaflied. Ich kenne es. Oma hat es gesummt.');
    if (!o.st.heard) { o.st.heard = true; Game.player.sanity = Math.min(100, Game.player.sanity + 10); yield say('Acht Töne. Immer wieder dieselben acht Töne.'); }
    setTimeout(() => { o.st.playing = false; }, 6000);
  },
  *whisperTheo() {
    if (Game.flags.whisper_theo) return;
    Game.flags.whisper_theo = true;
    Sound.play('whisper');
    yield say('»Mara?«', { who: '???', color: '#a3bfd6' });
    yield say('Theo? THEO!');
    yield wait(0.8);
    yield say('Nichts. Nur das Haus, das knarrt.');
  },
  *ballRoll() {
    if (Game.flags.ball_roll || !Game.flags.whisper_theo) return;
    const b = Game.world.objects.find((x) => x.id === 'ball');
    if (!b) return;
    Game.flags.ball_roll = true;
    b.st.rolling = Game.time;
    Sound.play('ball');
  },
  *mannequin(o) {
    if (!o.st.seen) { o.st.seen = true; yield say('Eine Schneiderpuppe ohne Kleid. Sie ist zu mir gedreht.'); }
    else yield say('Stand die nicht eben noch woanders?');
  },
  *fusebox(o) {
    if (o.st.on) { yield say('Der Strom läuft. Das Summen beruhigt mich mehr, als es sollte.'); return; }
    if (!Game.notes.includes('n_keller')) yield* readNote(o, 'n_keller');
    const n = o.st.fuses || 0, have = Game.inv.sicherung || 0;
    if (have > 0 && n < 2) {
      const put = Math.min(have, 2 - n);
      Game.take('sicherung', put);
      o.st.fuses = n + put;
      Sound.play('click');
      yield say(put === 1 ? 'Ich schraube eine Sicherung ein.' : 'Ich schraube beide Sicherungen ein.');
    }
    if ((o.st.fuses || 0) >= 2) {
      const c = yield ask('Beide Sicherungen sitzen. Den Hebel umlegen?', ['Hebel umlegen', 'Noch nicht'], { cancel: 1 });
      if (c !== 0) return;
      o.st.on = true; Game.flags.power = true;
      Sound.play('switchOn');
      Game.flickerT = 1.4;
      yield wait(1.2);
      yield say('Ein tiefes Brummen geht durchs Haus. Überall springen Lampen an.');
      yield say('Das Rolltor zur Werkstatt müsste jetzt aufgehen.');
      Game.noise(o.cx, o.cy, 400);
    } else yield say((o.st.fuses || 0) === 1 ? 'Eine Sicherung fehlt noch.' : 'Zwei Sicherungen fehlen.');
  },
  *shutter(o) {
    if (o.st.open) return;
    if (!Game.flags.power) { yield say('Ein Rolltor. Elektrisch. Ohne Strom bewegt es sich keinen Millimeter.'); return; }
    Sound.play('shutter');
    for (let i = 1; i <= 8; i++) { o.st.lift = i * 2; yield wait(0.15); }
    o.st.open = true;
    Game.world.invalidateNav();
    Game.noise(o.cx, o.cy, 200);
    yield say('Das Rolltor rattert nach oben. Laut. Viel zu laut.');
  },
  *crateWine(o) {
    if (o.st.opened) { yield say('Leer bis auf Holzwolle.'); return; }
    if (!Game.has('brecheisen')) { yield say('Eine große, zugenagelte Kiste. Mit den Fingern bekomme ich den Deckel nicht ab.'); return; }
    yield say('Ich hebele den Deckel auf.');
    Sound.play('wood'); Game.noise(o.cx, o.cy, 110);
    o.st.opened = true;
    Game.give('batterie', 1);
    yield say('Holzwolle, eine Batterie... und zusammengerollt: noch eine Zeichnung von Theo.');
    yield* readNote(o, 'd4');
  },
  *cellarIntro() {
    if (Game.flags.cellar_intro) return;
    Game.flags.cellar_intro = true;
    yield say('Da hinten bewegt sich etwas. Auf allen Vieren.');
    yield say('Es hat keine Augen. Ich glaube... es hört mich.');
    UI.toast('Schleichen: {y}Strg{/} oder {y}C{/} gedrückt halten');
  },
  *atticTrunk(o) {
    if (o.st.opened) { yield say('Kinderkleider. Alle in derselben Größe.'); return; }
    o.st.opened = true;
    yield say('Eine Truhe. Kinderkleider, ein Paar Lackschuhe, ein Taufkleid... und eine Tagebuchseite.');
    yield* readNote(o, 'p3');
  },
  *cradle(o) {
    if (o.st.taken) { yield say('Die Wiege. Sie schaukelt immer noch.'); return; }
    yield say('Eine Wiege. Sie schaukelt ganz leicht, obwohl niemand sie anstößt.');
    yield say('Darin, in ein vergilbtes Taufkleid gewickelt: eine {y}Silberglocke{/}.');
    o.st.taken = true;
    Game.give('glocke2');
    Sound.play('pickup');
    Game.flags.stalker_on = true;
    yield wait(0.5);
    Sound.play('stinger');
    Game.flickerT = 2;
    yield say('{s}»MEINS.«{/}');
    const s = Game.stalker;
    s.place(Game.world, 34, 3, 'idle');
    s.timer = 1.2; s.afterIdle = 'chase'; s.lastSeen = { x: Game.player.x, y: Game.player.y };
    s.speedMul = 0.85;
    yield say('Lauf. LAUF!');
  },
  *valve(o) {
    if (Game.flags.pond_drained) { yield say('Das Ventil ist offen. Das Becken ist leer.'); return; }
    if (!o.st.wheel) {
      if (!Game.has('ventilrad')) { yield say('Ein Ventil am Rohr. Das Handrad fehlt, nur die nackte Spindel ist übrig.'); return; }
      Game.take('ventilrad');
      o.st.wheel = true;
      yield say('Ich setze das Handrad auf die Spindel. Es passt.');
    }
    yield say('Ich drehe. Es quietscht, dann gurgelt es tief im Rohr.');
    Sound.play('water');
    o.st.turned = true;
    const w = Game.world;
    const tiles = [];
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) if (w.tileAt(x, y) === '~') tiles.push([x, y]);
    tiles.sort((a, b) => Math.hypot(b[0] - 14.5, b[1] - 9.5) - Math.hypot(a[0] - 14.5, a[1] - 9.5));
    for (let i = 0; i < tiles.length; i++) { w.setTile(tiles[i][0], tiles[i][1], 'u'); if (i % 4 === 3) yield wait(0.06); }
    Game.flags.pond_drained = true;
    w.buildGrid();
    yield say('Das Wasser ist weg. Auf dem schlammigen Grund glänzt etwas.');
  },
  *greenhouseIntro() {
    if (Game.flags.gh_intro) return;
    Game.flags.gh_intro = true;
    yield say('Es riecht nach Rosen und nach Eisen. Viel zu warm für November.');
  },
  *bellrope() {
    if (Story.bellCount() >= 3) { yield say('Die Glocken gehören nicht mehr hier hoch. Sie gehören nach unten. In die Gruft.'); return; }
    yield say('Die Glockenseile hängen noch. Die Glocken sind weg. Ich ziehe nicht daran.');
  },
  *scareBells() {
    if (Game.flags.scare_bells) return;
    Game.flags.scare_bells = true;
    Sound.play('bell', 220);
    yield wait(1.5);
    yield say('Eine Glocke. Hier hängt doch gar keine mehr.');
    Game.player.sanity -= 5;
  },
  *cryptEnter() {
    if (Game.flags.crypt_enter) return;
    Game.flags.crypt_enter = true;
    Sound.play('breath');
    yield say('Hier unten ist es kalt wie in einem Kühlraum. Und irgendwo atmet jemand. Ganz ruhig. Wie im Schlaf.');
  },
  *nicheP4(o) {
    if (o.st.taken) { yield say('Knochen. Ein kleiner Schädel. Sehr klein.'); return; }
    o.st.taken = true;
    yield say('In der Nische, zwischen Knochen, liegt ein gefaltetes Blatt. Es ist trocken. Jemand hat es hierhergelegt.');
    yield* readNote(o, 'p4');
  },
  *altar(o) {
    const have = ['glocke1', 'glocke2', 'glocke3'].filter((b) => Game.has(b));
    o.st.bells = o.st.bells || 0;
    if (o.st.bells < 3) {
      if (!have.length) {
        yield say('Ein Steinaltar mit drei runden Mulden. Wie gemacht für... Glocken.');
        return;
      }
      for (const b of have) { Game.take(b); o.st.bells++; Sound.play('bell', 280 + o.st.bells * 50); yield wait(0.8); }
      if (o.st.bells < 3) {
        const m = 3 - o.st.bells;
        yield say('Ich stelle ' + (have.length === 1 ? 'die Glocke' : 'die Glocken') + ' in die Mulden. ' + (m === 1 ? 'Eine fehlt noch.' : 'Zwei fehlen noch.'));
        return;
      }
    }
    yield* Scripts.finale(o);
  },
  *finale() {
    Game.flags.finale = true;
    yield say('Drei Glocken. Drei Mulden. Sie passen genau.');
    Sound.play('stinger');
    Game.flickerT = 2.5;
    yield wait(1.2);
    const s = Game.stalker;
    s.place(Game.world, 17, 19, 'scripted');
    s.dir = 'left'; s.count = 90;
    yield say('{s}»...neunzig.«{/}');
    yield say('Sie steht da. Ganz nah. Größer, als ein Mensch sein dürfte. Die Haare hängen ihr bis über die Knie.');
    const theo = Game.world.objects.find((x) => x.id === 'theo_npc');
    if (theo) theo.st.visible = true;
    yield say('Und hinter dem Altar, zusammengerollt auf dem Steinboden, schläft Theo.');
    s.count = 93;
    yield say('{s}»...dreiundneunzig... vierundneunzig...«{/}');
    const pages = Story.pages();
    const letters = pages.map((p) => NOTES[p].letter).sort((a, b) => 'ILSE'.indexOf(a) - 'ILSE'.indexOf(b));
    for (;;) {
      const c = yield ask('Was tue ich?', ['Ihren Namen rufen', 'Bis hundert warten und läuten', 'Theo packen und rennen'], { cancel: -1 });
      if (c === 0) {
        if (pages.length < 4) {
          yield say(letters.length ? 'Ich kenne nur Bruchstücke: ' + letters.join(' · ') + ' ... Das reicht nicht. Ein falscher Name ist schlimmer als keiner.' : 'Ich kenne ihren Namen nicht. Niemand hat ihn mir gesagt.');
          continue;
        }
        yield* Scripts.endGood();
        return;
      }
      if (c === 1) { yield* Scripts.endRing(); return; }
      yield* Scripts.endFlee();
      return;
    }
  },
  *endGood() {
    const s = Game.stalker;
    yield say('Ich hole Luft. Vier Buchstaben. Vier Seiten. Siebzig Jahre.');
    yield say('»{y}ILSE.{/}«');
    s.count = 101;
    Game.flash('#ffffff', 1.2);
    Sound.play('bell', 330);
    yield wait(1.5);
    Game.startEnding('good');
  },
  *endRing() {
    const s = Game.stalker;
    for (let n = 95; n <= 100; n++) { s.count = n; Game.fxText(s.x, s.y - 40, U.numWord(n) + (n < 100 ? '...' : '.'), n === 100 ? C.rd4 : C.bn1, 1.4); Sound.play('count', n); yield wait(0.9); }
    yield say('Hundert.');
    [330, 390, 440].forEach((f, i) => setTimeout(() => Sound.play('bell', f), i * 450));
    Game.flash('#d8d0c0', 1.5);
    yield wait(2);
    Game.startEnding('ring');
  },
  *endFlee() {
    yield say('Ich packe Theo unter den Armen. Er ist so leicht. Ich renne.');
    Sound.play('scream');
    Game.shake(4, 1.2);
    yield wait(1.4);
    Game.startEnding('flee');
  },
};

// Abspann-Texte
const ENDINGS = {
  good: {
    title: 'ENDE 1 VON 3: GEFUNDEN',
    lines: [
      'Das Zählen hört auf.',
      'Zum ersten Mal seit siebzig Jahren ist es im Haus ganz still.',
      'Wo eben noch die lange Gestalt stand, steht ein kleines Mädchen im Nachthemd. Eine Zahnlücke. Zuckerwürfel in der Faust.',
      'Sie sieht mich an, als hätte sie genau auf diesen Moment gewartet.',
      '»Gefunden«, sagt sie. Und lacht. Dann ist sie weg.',
      'Theo wacht auf, als ich ihn hochhebe. »Hast du sie gefunden?«, fragt er. »Ja«, sage ich.',
      'Als wir aus der Kapelle kommen, wird es hell. Die Glocken läuten einmal.',
      'Dann nie wieder.',
    ],
    scene: 'dawn',
  },
  ring: {
    title: 'ENDE 2 VON 3: HUNDERT',
    lines: [
      'Die Glocken läuten. Sie schließt die Augen, mitten im Wort.',
      'Ihre Haare sinken herab wie nasses Laub. Dann steht da niemand mehr.',
      'Theo hustet. Er lebt. Er friert. Ich trage ihn den ganzen Weg bis zur Straße.',
      'Sie schläft. Wie bei Oma. Für eine Weile.',
      'Mama hat das Haus nie verkauft. Ich fahre jeden Herbst hin und spiele das Schlaflied.',
      'Irgendwann werde ich alt sein. Und dann muss jemand anderes spielen.',
    ],
    scene: 'night',
  },
  flee: {
    title: 'ENDE 3 VON 3: WEGGELAUFEN',
    lines: [
      'Hinter uns läuten die Glocken. Dann bricht das Läuten ab, mitten im Schlag.',
      'Wir schaffen es bis zur Straße. Das Auto springt sofort an, als wäre nie etwas gewesen.',
      'Drei Wochen später schläft Theo wieder in seinem eigenen Bett.',
      'Heute Nacht hat er mich geweckt. Er stand im Flur und flüsterte, in seinem Kleiderschrank zähle jemand.',
      'Bei dreiundvierzig habe ich aufgehört zuzuhören.',
    ],
    scene: 'car',
  },
};
