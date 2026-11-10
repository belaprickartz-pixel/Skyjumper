# GRAUWALD

*Sie zählt bis hundert.*

Ein 2D-Pixel-Horrorspiel für den Browser. Kein Framework, keine Downloads, keine Bild- oder Tondateien:
Grafik, Schrift und Klang werden komplett im Code erzeugt.

## Starten

**`grauwald.html`** herunterladen und im Browser öffnen – fertig. Das ist das komplette Spiel in einer einzigen Datei
(PC mit Tastatur oder Handy/Tablet mit Touch-Steuerung). Am besten mit Kopfhörern und im Dunkeln.

Für die Entwicklung: `index.html` lädt die einzelnen Dateien aus `js/`. `node tools/build.js` erzeugt daraus neu `grauwald.html`.

## Worum es geht

Theo, Maras zehnjähriger Bruder, ist seit drei Tagen verschwunden. Nachts ruft er an: *„Sie zählt. Ich hab mich bei Oma versteckt.“*
Mara fährt zum leerstehenden Anwesen der Großmutter – und das Auto bleibt zehn Minuten vor dem Ziel im Wald stehen.

## Umfang

- **11 Gebiete:** Wald, Jägerhütte, Hof mit Friedhof und Brunnen, Gartenschuppen, Erdgeschoss, Obergeschoss, Keller, Dachboden, Gewächshaus, Kapelle, Gruft
- **Die Zählerin:** verfolgt dich durchs Haus, hört Geräusche, sieht Licht, öffnet Türen, folgt dir über Treppen – und zählt laut bis hundert
- **Kriecher im Keller:** blind, reagieren nur auf Geräusche. Schleichen rettet Leben
- **Verstecken** in Schränken und unter Betten, mit Atem-anhalten-Mechanik
- **Verstand:** Dunkelheit und Begegnungen zehren daran → Halluzinationen, Doppelbilder, Flüstern. Licht, Kerzen und Gästebücher helfen
- **Taschenlampe** mit Batterie und echten Schatten (Raycasting)
- **Rätsel:** Klavier-Melodie, Zahlenschloss, Sicherungskasten, Ventil, Glocken-Ritual
- **Sammeln:** über 20 Notizen und Briefe, 4 Tagebuchseiten (der Name!), 6 Kinderzeichnungen
- **3 Enden**, Aufgabenliste, automatische Karte, Inventar, Tagebuch, Speichern an Gästebüchern und beim Raumwechsel
- **Eigene Pixelschrift** mit Umlauten (handgesetzt in `js/font.js`)

## Steuerung

| Taste | Aktion |
|---|---|
| WASD / Pfeile | Gehen |
| Shift | Rennen (laut!) |
| Strg / C | Schleichen |
| E / Leertaste | Untersuchen, benutzen, weiter |
| F | Taschenlampe |
| R | Batterie wechseln |
| I / Tab | Inventar |
| J | Tagebuch & Aufgaben |
| M | Karte |
| Esc | Pause |

## Aufbau

```
js/font.js      Pixelschrift
js/audio.js     prozeduraler Klang (WebAudio)
js/gfx.js       Palette, Zeichenhelfer, Icons
js/tiles.js     Böden, Wände, Natur
js/objects.js   über 80 Objekttypen
js/chars.js     Figuren
js/data/        Gegenstände, Texte, Karten
js/world.js     Kollision, Sichtlinie, Wegfindung (A*)
js/lighting.js  gerastertes Licht + Taschenlampe
js/entities.js  Spielerin, Zählerin, Kriecher, Schemen
js/ui.js        Dialoge, Menüs, Rätsel-Oberflächen
js/scripts.js   Geschichte, Ereignisse, Enden
js/main.js      Hauptschleife, Speichern
```

`node tools/validate-maps.js` prüft alle Karten auf Erreichbarkeit.
