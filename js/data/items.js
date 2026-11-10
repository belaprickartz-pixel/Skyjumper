'use strict';
// ------------------------------------------------------------
//  Gegenstände
// ------------------------------------------------------------
const ITEMS = {
  taschenlampe: { name: 'Taschenlampe', icon: 'taschenlampe', desc: 'Papas alte Stablampe aus dem Handschuhfach. Schwer, verbeult, aber sie geht. [F] zum Ein- und Ausschalten.' },
  batterie: { name: 'Batterie', icon: 'batterie', stack: true, desc: 'Eine Monozelle. Damit läuft die Lampe wieder eine Weile. [R] zum Wechseln.', use: 'battery' },
  verband: { name: 'Verband', icon: 'verband', stack: true, desc: 'Eine Mullbinde, noch eingeschweißt. Hilft gegen Schrammen und Schlimmeres.', use: 'heal' },
  tabletten: { name: 'Beruhigungstabletten', icon: 'tabletten', stack: true, desc: 'Ein Röhrchen Baldrian-Dragees. Das Etikett ist von Oma beschriftet: »Für die Nächte«.', use: 'calm' },
  streichhoelzer: { name: 'Streichhölzer', icon: 'streichhoelzer', stack: true, desc: 'Eine Schachtel Streichhölzer. Damit lassen sich Kerzen anzünden – Licht hält die Angst klein.' },
  torschluessel: { name: 'Torschlüssel', icon: 'torschluessel', desc: 'Ein schwerer Eisenschlüssel mit einem Pappschild: »Vogt – Tor«.' },
  brecheisen: { name: 'Brecheisen', icon: 'brecheisen', desc: 'Rot lackiert, an der Spitze verbogen. Gut gegen Nägel und Bretter.' },
  sicherung: { name: 'Sicherung', icon: 'sicherung', stack: true, desc: 'Eine alte Schraubsicherung, 16 Ampere. Passt in den Kasten im Keller.' },
  kellerschluessel: { name: 'Kellerschlüssel', icon: 'kellerschluessel', desc: 'Ein Bartschlüssel, angelaufen. Am Ring hängt ein Zettel: »Keller«.' },
  gewaechshausschluessel: { name: 'Gewächshausschlüssel', icon: 'gewaechshausschluessel', desc: 'Grün angelaufen. Auf dem Anhänger ist eine Rose eingeritzt.' },
  messingschluessel: { name: 'Messingschlüssel', icon: 'messingschluessel', desc: 'Klein und blank. Er lag im Klavier. Gehört wohl zum Arbeitszimmer.' },
  notenblatt: { name: 'Notenblatt', icon: 'notenblatt', desc: 'Theos Abschrift von Omas Schlaflied. Unter jede Note hat er den Buchstaben geschrieben.', read: 'n_noten' },
  kapellenschluessel: { name: 'Kapellenschlüssel', icon: 'kapellenschluessel', desc: 'Ein langer Schlüssel mit einem Kreuz als Griff.' },
  kurbel: { name: 'Kurbel', icon: 'kurbel', desc: 'Eine Handkurbel mit Holzgriff. Für die Dachbodenluke.' },
  ventilrad: { name: 'Ventilrad', icon: 'ventilrad', desc: 'Ein rotes Handrad. Herr Wendt wollte es richten – hat er wohl.' },
  glocke1: { name: 'Silberne Glocke (I)', icon: 'glocke', desc: 'Eine kleine Handglocke aus Silber. Sie klingt nicht, wenn man sie schüttelt.' },
  glocke2: { name: 'Silberne Glocke (II)', icon: 'glocke', desc: 'Sie lag in der Wiege, eingewickelt in ein Taufkleid.' },
  glocke3: { name: 'Silberne Glocke (III)', icon: 'glocke', desc: 'Kalt und nass. Grünspan in den Rillen.' },
};
