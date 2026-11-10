'use strict';
// ------------------------------------------------------------
//  Notizen, Tagebuchseiten, Theos Zeichnungen
//  kind: 'note' | 'page' | 'drawing'
// ------------------------------------------------------------
const NOTES = {
  n_weg: {
    kind: 'note', title: 'Zettel von Mama',
    text: 'Gelber Klebezettel, Kuli, total verknittert.\n\nGrauwald 3\n– nach dem Wegkreuz rechts in den Waldweg\n– das Tor ist zu. Den Schlüssel hat Herr Brandt, der Jäger. Seine Hütte liegt westlich vom Weg, man sieht sie kaum.\n– Oma will, dass wir vor der Dunkelheit wieder weg sind. Frag nicht. Sie ist halt so.\n\nKuss, Mama\n\n{g}(Den Zettel hat sie mir vor Jahren geschrieben. Ich hab ihn nie weggeworfen.){/}',
  },
  n_jaeger1: {
    kind: 'note', title: 'Brandts Notizbuch',
    text: '12.10. – Wieder was am Zaun bei Vogts. Keine Wildspur. Zu lang und zu schmal für ein Reh. Fünf Zehen.\n\n14.10. – Agathe ist jetzt ein Jahr tot. Die Familie räumt das Haus aus. Hab ihnen gesagt, sie sollen vor der Dämmerung fertig sein.\n\n16.10. – Der Kleine von den Vogts ist weg. Polizei war da, Hunde auch. Die Hunde wollten nicht ins Haus. Keiner von denen.\n\n17.10. – Torschlüssel hängt am Haken. Ersatzsicherung für Agathes alten Kasten liegt im Werkzeugkasten. Ich geh da nicht nochmal hin.',
  },
  n_jaeger2: {
    kind: 'note', title: 'Brief an Herrn Brandt',
    text: 'Ein alter Brief, sehr sorgfältig gefaltet. Saubere Schreibschrift.\n\nLieber Herr Brandt,\nbitte klopfen Sie nach Sonnenuntergang nicht mehr bei mir. Auch nicht, wenn Licht brennt. Besonders dann nicht.\nWenn Sie jemanden zählen hören, gehen Sie einfach weiter. Drehen Sie sich nicht um.\nEs tut mir leid, dass ich Ihnen das nicht besser erklären kann.\n\nMit Dank für das Holz,\nA. Vogt',
  },
  n_gaertner: {
    kind: 'note', title: 'Zettel an der Werkbank',
    text: 'Bleistift, dicke Buchstaben.\n\nFrau Vogt,\ndie Hintertür zur Küche hab ich wie gewünscht zugenagelt. Vorne haben Sie ja den Riegel.\nDas Brecheisen lass ich hier, falls doch mal wer rein muss.\nDas Becken im Gewächshaus läuft nicht mehr ab, das Ventilrad hab ich zum Richten in die Kellerwerkstatt gebracht.\n\nK. Wendt\n\nPS: Ich komm nicht mehr. Nehmen Sie\'s mir nicht übel.',
  },
  n_koechin: {
    kind: 'note', title: 'Einkaufszettel',
    text: 'Mit Fettflecken.\n\n– Mehl, 2 kg\n– Eier\n– Kerzen (VIELE)\n– Streichhölzer\n– Zuckerwürfel für die Kleine\n\nFrau V. will wieder ein Gedeck mehr. Für wen, sagt sie nicht. Ich deck es und frag nicht.\nWer isst hier eigentlich die Zuckerwürfel? Die Dose ist jeden Morgen leer.',
  },
  n_zeitung: {
    kind: 'note', title: 'Zeitungsausschnitt',
    text: 'Grauwalder Bote, 3. November 1952\n\nKIND IN GRAUWALD VERMISST\nSeit Sonntagabend wird die siebenjährige Tochter der Familie Vogt vermisst. Das Mädchen spielte mit seiner älteren Schwester Verstecken im Haus der Familie. Trotz tagelanger Suche fehlt von ihr jede Spur.\n\n{g}Wo der Name stand, ist das Papier herausgerissen. Am Rand, mit Bleistift:{/}\n»nicht aufhören zu suchen«',
  },
  n_klavier: {
    kind: 'note', title: 'Zettel am Klavier',
    text: 'Omas Schrift.\n\nDas Schlaflied, das Mutter uns vorgesungen hat. Wenn ich es spiele, wird es still im Haus. Für eine Weile.\nTheo hat es letzten Sommer abgeschrieben, als ich es ihm beigebracht habe. Er hat ein gutes Gehör, der Junge. Sein Blatt liegt bestimmt oben in seinem Zimmer.\nIm Klavier bewahre ich nichts mehr auf. Nur den kleinen Schlüssel.',
  },
  n_noten: {
    kind: 'note', title: 'Theos Notenblatt',
    text: 'Fünf schiefe Linien, mit Lineal gezogen. Darüber dicke Notenköpfe, darunter Theos Buchstaben:\n\n{y}a  –  C  –  h  –  g  –  a  –  e  –  f  –  e{/}\n\n»das C ist das hohe, ganz rechts!!«\n»oma sagt das lied macht sie müde«\n\n{g}Das Klavier im Salon hat acht weiße Tasten: C D E F G A H C.{/}',
  },
  n_theo: {
    kind: 'note', title: 'Theos Heftseite',
    text: 'Aus einem Schulheft gerissen. Theos krakelige Schrift.\n\ndie lange frau wohnt im großen schrank. sie zählt immer. sie ist nicht böse glaub ich. sie ist nur allein und keiner findet sie.\noma sagt man darf nicht mitspielen.\nich hab mir ein gutes versteck gesucht. wenn ich ganz leise bin findet sie mich nicht.\nnicht mal mara.',
  },
  n_oma: {
    kind: 'note', title: 'Brief an Ruth',
    text: 'Nie abgeschickt. Die Tinte ist an einer Stelle verlaufen.\n\nLiebe Ruth,\nich habe die große Standuhr unten in der Halle nie wieder aufgezogen. Sie steht noch auf der Zeit, in der sie damals zum ersten Mal zurückkam.\nAlles, was ich verstecken muss, habe ich hinter dieser Zeit verschlossen. Vier Ziffern, wie auf der Uhr.\nWenn mir etwas passiert, kommt nicht hierher. Verkauft das Haus nicht. Lasst es einfach stehen.\n\nDeine Mutter',
  },
  n_magd: {
    kind: 'note', title: 'Kündigung',
    text: 'Zittrige Handschrift.\n\nFrau Vogt,\nhiermit kündige ich zum Monatsende. Nein, sofort.\nGestern Abend hat jemand im Wäscheschrank gezählt. Ganz langsam, bis neunzig. Ich hab die Tür aufgemacht, da war nur Wäsche.\nBei neunundneunzig bin ich rausgerannt.\nDen Kellerschlüssel lege ich hier hin. Gehen Sie nicht alleine runter.\n\nM. Hartl',
  },
  n_mama: {
    kind: 'note', title: 'Mamas Liste',
    text: 'Mamas Schrift, mit grünem Filzstift.\n\nHAUS AUSRÄUMEN\n– Bücher Bibliothek: spenden?\n– Omas Kleider: Kleiderkammer\n– Dachboden: NICHT. (Frau Hartl sagt, da oben ist noch Zeug von Tante ...)\n– Keller: Strom ist hin, Elektriker anrufen\n– Klavier: behalten!!\n– THEO NICHT ALLEIN LASSEN\n\n{g}Der Name der Tante ist dick durchgestrichen.{/}',
  },
  n_keller: {
    kind: 'note', title: 'Zettel am Sicherungskasten',
    text: 'ACHTUNG – 2 Sicherungen fehlen (durchgebrannt).\nOhne Strom keine Beleuchtung, und das Rolltor zur Werkstatt geht nicht auf.\nErsatz: eine hat Brandt, die andere hat Frau V. im Bad oben (Spiegelschrank).\n\nUnd Leute: Licht anlassen. Da unten ist was. Es hört einen.',
  },
  n_werkstatt: {
    kind: 'note', title: 'Werkstattbuch',
    text: 'Ventilrad Gewächshaus – gerichtet. Gewinde nachgeschnitten. Passt wieder.\nKurbel Dachluke – Frau V. will sie hier unten haben. »Damit keiner hochgeht.«\n\nUnten drunter, andere Schrift:\nDie im Keller sind blind. Die hören dich. Wenn du schleichst, kommst du vorbei.',
  },
  n_ritual: {
    kind: 'note', title: 'Omas Aufzeichnungen',
    text: 'Mehrere Seiten, mit Faden zusammengebunden. Omas Schrift, sehr klein.\n\nSie war meine Schwester. Ich war beim Verstecken dran mit dem Suchen. Ich habe bis hundert gezählt und sie nie gefunden. Seitdem zählt sie. Sie sucht jemanden, der sich versteckt.\n\nDie drei Glocken aus der Kapelle halten sie. Ich habe sie verteilt, damit sie nicht alle an einem Ort sind:\n– eine bei mir, hier im Tresor.\n– eine bei ihr, oben unterm Dach, in ihrer alten Wiege.\n– eine im Wasser, im Becken bei den Rosen.\n\nWer sie zurück auf den Altar in der Gruft legt und läutet, wenn sie bei hundert ist, legt sie wieder schlafen. Für eine Weile.\n\nEs gibt noch einen anderen Weg. Man müsste sie beim Namen rufen. Ich habe mich in siebzig Jahren nicht getraut. Ich habe ihren Namen auf vier Seiten verteilt, damit ich ihn nicht aus Versehen sage.',
  },
  n_gruft: {
    kind: 'note', title: 'Steintafel',
    text: 'In den Stein gehauen, kaum lesbar:\n\nHIER RUHEN DIE VOGTS VON GRAUWALD\n1788 –\n\nDarunter, viel neuer, mit einem Nagel eingeritzt:\n»nicht zählen. nicht mitspielen. nicht verstecken.«',
  },
  n_kapelle: {
    kind: 'note', title: 'Messingschild',
    text: 'Die Glocken dieser Kapelle wurden 1952 auf Wunsch der Familie Vogt abgenommen.\nMöge Ruhe sein.',
  },
  n_grab: {
    kind: 'note', title: 'Kleiner Grabstein',
    text: 'Der Stein ist kleiner als die anderen. Moos in den Buchstaben.\n\nI · · ·   V O G T\n1945 – 1952\n\n»Wir suchen dich noch.«\n\n{g}Der Vorname ist weggekratzt. Mit Absicht, so sieht es aus.{/}',
  },

  // --- Tagebuchseiten (der Name) ---
  p1: {
    kind: 'page', title: 'Tagebuchseite (1952)', letter: 'I',
    text: 'Kinderschrift, Bleistift. 1. Nov. 1952\n\nHeute war Allerheiligen und wir waren am Wegkreuz Blumen hinstellen. Meine Schwester hat die ganze Zeit Zuckerwürfel aus der Manteltasche gegessen und gekichert. Sie ist sieben und darf alles.\nMorgen spielen wir Verstecken im großen Haus, das hab ich ihr versprochen. Ich such, sie versteckt sich. Sie ist darin die Beste.\n\nUnten auf der Seite ist ein Buchstabe dick eingekreist:  {r}I{/}',
  },
  p2: {
    kind: 'page', title: 'Tagebuchseite (1952)', letter: 'L',
    text: '2. Nov. 1952\n\nWir haben Verstecken gespielt. Ich hab gezählt. Ganz ehrlich bis hundert, ohne zu schummeln, mit dem Gesicht an der Wand.\nIch hab überall gesucht. Im Keller, oben, in jedem Schrank, unterm Dach.\nMama hat geweint. Papa hat die Leute aus dem Dorf geholt. Sie haben mit Lampen bis morgens gesucht.\n\nEingekreist:  {r}L{/}',
  },
  p3: {
    kind: 'page', title: 'Tagebuchseite (1952)', letter: 'S',
    text: '9. Nov. 1952\n\nHeute Nacht hat jemand gezählt. In meinem Schrank. Mit ihrer Stimme, aber tiefer, so als wäre sie viel größer geworden.\nIch hab mich unter der Decke versteckt, bis es hell war.\nDer Pfarrer hat Glocken gebracht. Er sagt, wir dürfen ihren Namen nicht mehr sagen, damit sie nicht herkommt. Mama hat alle Fotos verbrannt.\n\nEingekreist:  {r}S{/}',
  },
  p4: {
    kind: 'page', title: 'Tagebuchseite (später)', letter: 'E',
    text: 'Ohne Datum. Die Schrift ist alt und zittrig.\n\nIch bin jetzt eine alte Frau und habe sie nie gefunden.\nVielleicht wollte sie nie gefangen werden. Vielleicht wollte sie nur, dass jemand weitersucht.\nWenn du das liest: Ich glaube, sie hört erst auf, wenn jemand sie findet und beim Namen ruft. Nicht ich. Ich war zu feige.\n\nEingekreist:  {r}E{/}',
  },

  // --- Theos Zeichnungen ---
  d1: { kind: 'drawing', art: 1, title: 'Zeichnung: Unser Auto', text: 'Unser Auto, Mama, Mara und ich. Über dem Wald hat Theo einen schwarzen Strich gemalt. Sehr lang. Mit Armen.' },
  d2: { kind: 'drawing', art: 2, title: 'Zeichnung: Der Tisch', text: 'Ein Tisch mit vielen Tellern. Auf einem Stuhl sitzt jemand mit sehr langen Haaren. Darunter: »ihr platz«.' },
  d3: { kind: 'drawing', art: 3, title: 'Zeichnung: Der Schrank', text: 'Ein großer Schrank. Im Spalt zwischen den Türen zwei Augen. Darunter: »nicht aufmachen«.' },
  d4: { kind: 'drawing', art: 4, title: 'Zeichnung: Keller', text: 'Strichmännchen auf allen Vieren, ohne Augen. Darunter: »die im keller sind blind. LEISE sein!«' },
  d5: { kind: 'drawing', art: 5, title: 'Zeichnung: Rosen', text: 'Rote Blumen und ein blaues Becken. Im Becken eine kleine graue Glocke.' },
  d6: { kind: 'drawing', art: 6, title: 'Zeichnung: Zwei Mädchen', text: 'Zwei Mädchen, die sich an den Händen halten. Eine ist durchgestrichen und daneben neu gemalt, ganz lang.' },
};
