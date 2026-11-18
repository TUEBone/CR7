# CR7 Challenge

Ein deutschsprachiges Fußballspiel für Desktop und Smartphone. Reines HTML, CSS
und JavaScript mit transparenten PNG-Animationen; kein Backend und keine Anmeldung.

## Spielen und veröffentlichen

Auf GitHub Pages gemeinsam bereitstellen: `index.html`, `style.css`, `js/` und
`assets/`. Alle Pfade sind relativ und funktionieren auch unter
`https://<name>.github.io/CR7/`. Keine Build-Abhängigkeiten, CDNs oder Laufzeit-APIs.

Lokal im Projektordner `python -m http.server 8000` ausführen, dann
`http://localhost:8000` öffnen. Die modulare Projektversion benötigt einen
HTTP-Server, da Browser externe JavaScript-Module unter `file://` einschränken.
Eine separat exportierte Offline-HTML enthält PNGs und Skripte in einer Datei
und lässt sich direkt öffnen.

Offline-Datei selbst erzeugen:
`python scripts/export_offline.py /gewünschter/Pfad/CR7-Challenge-Offline.html`.

## Challenges und Bedienung

- **Dribbeln:** Ronaldo läuft von oben nach unten in Vorderansicht, Gegner
  von unten nach oben in Rückansicht. Fünf Spuren, vier Gegner, eine freie Lücke.
  15 Verteidigerreihen, danach drei Messi-Reihen. Pfeiltasten/Pfeilflächen halten,
  Bildschirmhälften antippen oder wischen. 100 Punkte je Reihe, bei Messi 150.
  Die nächste Öffnung liegt höchstens zwei Spuren von der vorherigen entfernt.
- **Torfinale:** Erst „Ich bin bereit“ antippen. Dann sechs Ballsymbole nacheinander
  direkt im Tor antippen, jeweils innerhalb von 0,5 Sekunden. Alle sechs Treffer
  ergeben ein Tor und 500 Bonuspunkte, ein verpasstes Symbol einen Fehlschuss.
  Pause hält die Frist an. Tastatur: das aktuelle Symbol wird fokussiert; Enter
  aktiviert es. Die Pfeilkombination aus der früheren Version entfällt.
- **Kopfball:** Unter den Ball stellen; Ronaldo köpft automatisch. Pfeiltasten,
  Pfeilflächen, Tippen oder Ziehen auf dem Feld. Nach 15, 30, 45 … Sekunden kommt
  jeweils ein Ball hinzu. Drei Leben; jeder verpasste Ball kostet ein Leben und
  wird ersetzt. 100 Punkte je Kopfball.
- **Elfmeterschießen:** Ronaldo unten links, Tor oben rechts. Immer erst den
  horizontalen und dann den vertikalen Balken stoppen. Wechselnde Positionen,
  Breiten und ein oder zwei grüne Fenster je Achse. Nur **zwei grüne Stopps**
  ergeben ein Tor (100 Punkte). Andernfalls hält der Torwart oder der Ball trifft
  die Latte/geht vorbei. Zehn Schüsse je Runde. Tippen, Aktionsknopf, Space/Enter.

Escape oder „Pause“ pausiert. Bei Tabwechsel/Fokusverlust wird automatisch pausiert.
„Hauptmenü“ während einer Runde bricht sie ab.

## Karriere, Trophäen und Highscores

Jede regulär abgeschlossene Runde zählt, auch eine verlorene. Abbrüche zählen
nicht. Jeweils **fünf Runden in jedem der drei Modi** ergeben einen Karrierepunkt:

```text
Punkte = min(100, floor(min(Dribbelrunden, Kopfballrunden, Elfmeterrunden) / 5))
```

500 Runden je Modus, insgesamt 1.500 Runden, ergeben 100 Punkte und den GOAT-Rang.
Jeder Zehnerschritt schaltet einen Karriereabschnitt und einen Ronaldo-Sticker
frei. Der Trophäenraum im Menü zeigt zehn Sticker, die nächsten Rundenziele,
persönliche Rekorde und die fünf besten Ergebnisse je Spiel. Keine Online-Rangliste.

## Speichern

Abgeschlossene Runden werden automatisch unter `cr7-challenge-save-v1` in
`localStorage` gespeichert. Bei blockiertem Browser-Speicher bleibt das Spiel
spielbar und weist auf die Sicherung per Code hin.

„Speichern & Laden“ exportiert einen kopierbaren `CR7.1.…`-Code mit Rundenzählern,
Bestwerten und Top-5-Ergebnissen samt Datum. Karriere und Sticker werden daraus
abgeleitet. Der Code enthält keine laufende Runde. Er lässt sich auf anderen
Geräten verwenden. Import ersetzt den bisherigen Stand. Beschädigte oder ungültige
Codes verändern ihn nicht; Format, Prüfsumme und Statistikwerte werden geprüft.
Die Prüfsumme dient der Fehlererkennung, nicht als Manipulationsschutz.

Alle Daten bleiben im Browser oder im selbst kopierten Code. Browser-Speicher
gilt jeweils für die aktuelle Adresse/das Browserprofil. Nach Adresswechsel oder
Löschen der Browserdaten kann der Stand über den Code übernommen werden.

## Grafik und Code

- `assets/sprites/`: echte transparente PNG-Sprite-Sheets der Comicfiguren.
  Die frühere Canvas-Zeichnung der Spieler wurde vollständig entfernt.
- `js/sprites.js`: Bildanzahl, Bildgröße, Fußanker, Tempo und Schleifenverhalten.
- `js/renderer.js`: PNG-Laden, Animationen, Comicstadion, Tor, Ballflug und Balken.
- `js/models.js`: Spielregeln, Kollisionen und Reaktionsfristen.
- `js/save.js`: Karriere, Highscores, Codes und Browser-Speicher.
- `js/app.js`: Menüs, Trophäenraum, Eingabe, Pause und Spielablauf.

Neue Posen orientieren sich an den Vorlagen; Details können zwischen Bildern
variieren. Messi verwendet die bereinigten Original-Sprites, da die zusätzliche
Bildgenerierung abgelehnt wurde. Seine vorhandene Vorderansicht hat sieben
Laufbilder; das Laufspiel verwendet die Rückansicht mit acht Originalbildern.
Weitere Richtungen bleiben als Grafikdateien für spätere Anpassungen verfügbar.

## Prüfen

`npm test` verwendet den eingebauten Node-Testläufer ohne zusätzliche Pakete.
Geprüft werden beide Trefferbedingungen, zehn vollständige Schüsse, wechselnde
Fenster, fünfspurige Reihen und der komplette Lauf, Ballzuwachs und Kopfballtreffer,
500-ms-Fristen, sechs Zieltaps, Karriere bis 1.500 Runden, Top-5-Ergebnisse,
Speichercode-Rundlauf, beschädigte Codes und blockierter Browser-Speicher.


## Erweiterung: Zuhause, Torwand und ruhige Musik

Die aktuelle GitHub-Pages-Version startet über `index.html` → `js/game.js`.
`home-images-ac3bf84c8921.js` enthält die bisherigen Zuhause-Grafiken;
`enhancements.css` die neue bildschirmfüllende Oberfläche. Die früheren einzelnen
Module bleiben für die bisherigen Regressionstests erhalten; neue Funktionen
werden gegen den tatsächlich gestarteten Code in `tests/current-game.test.js` geprüft.

- Der Fußball besitzt ein dreidimensional projiziertes Muster aus zwölf Fünf- und
  zwanzig Sechsecken. Er rollt nach vorne beziehungsweise gemäß seitlicher Flugrichtung.
- Kopfball: rote Bälle zerplatzen beim Treffer und Verlassen des Feldes. Zeitlupe
  dauert fünf Sekunden und ist alle 30 Spielsekunden wieder verfügbar. Ballräumen lädt sich ebenfalls nach 30 Spielsekunden wieder auf; anschließend starten neue normale Bälle einzeln mit Abstand oben.
- Unter **Elfmeterschießen** lässt sich **Torwandschießen** wählen: fünf Schüsse,
  zwei zufällige Löcher, internes Zielraster 10 × 8. Diese Runden zählen ebenfalls
  zur Elfmeter-Karriere. Die Balken zeigen keine grünen Zielfenster: Position schätzen.
- Zuhause und Garten nutzen die verfügbare Bildschirmfläche. Objekte im Bild sind
  anklickbar: Schrank, Gartentür, Möbel, Vorräte, Rahmen, Musik und Einkäufe.
  Für einen unverzerrten Eindruck empfiehlt sich das Querformat; Hochformat bleibt bedienbar.
- Hund und Katze bleiben mit ihren Füßen auf Boden/Rasen und zeigen beim vertikalen
  Laufen Vorder- oder Rückansichten. Beim Gassigehen teilen sie Ronaldos Sprungebene.
  Der Sprung ist länger; neue PNG-Posen zeigen erhobene Arme und einen Rutscher.
- Pflege: jede Phase endet nach vollständiger Abdeckung aller Bereiche. Beim
  Abspülen gibt es keine Mindestzeit mehr. Das Tier steht höher vor der Dusche.
- 22 Pflanzensorten, darunter 13 zusätzliche Gemüse-, Obst- und Blumensorten.
  Neue Sorten werden ab 10 bis 125 Anpflanzungen freigeschaltet. Die Anzahl zählt
  tatsächliche bezahlte Pflanzaktionen, keine Klicks auf gesperrtes Saatgut.
  Zusätzliche Futtermenüs werden ebenfalls durch Gartenfortschritt freigeschaltet.
- Sofa und Schrank: jeweils fünf Grundmodelle mit je fünf Material-/Farbvarianten.
  Varianten verwenden die ursprünglichen Bilder mit lokaler Farbumrechnung.
- Freigeschaltete Karrierebilder lassen sich groß öffnen und im Zuhause-Rahmen
  aufhängen. Ein ruhiger Starttitel und zehn weitere eigene Instrumental-Loops
  sind integriert. Jede Trophäe (zehn Karrierepunkte) schaltet einen weiteren Titel
  im Musikspieler frei. Auswahl und Rahmenbild sind Teil des Speichercodes.
  Musik wird lokal über Web Audio erzeugt, ohne Dateien oder Streamingdienste.
- **Statistik** zeigt pro Spiel unter anderem Reihen und deren Durchschnitt,
  rote Kopfbälle, Ballverluste, Hilfen, Spielzeit, Tore und Trefferquote; Torwand
  wird zusätzlich separat ausgewiesen. Detailereignisse werden ab diesem Update
  erfasst. Alte Highscores und Karrierezähler bleiben erhalten; fehlende historische
  Detailwerte können nicht rückwirkend rekonstruiert werden.
- **Einkäufe** im Zuhause setzt wahlweise Trikots, Möbel oder Alltagskleidung zurück.
  Es gibt einen Bestätigungsdialog. Münzen beziehungsweise Trikotwahlen werden
  vollständig zurückgegeben, ohne Karriere, Gesamtpunkte oder Trophäen zu löschen.

Alte Speichercodes werden um die neuen Standardfelder ergänzt. Bitte vor einem
Update trotzdem den eigenen Speichercode sichern. Für GitHub Pages das gesamte
Repository einschließlich `enhancements.css`, `js/game.js` und der neuen Ordner
`assets/home/` und `assets/pets/` bereitstellen. Die exportierte Offline-HTML bündelt
auch diese Ressourcen; ihr Export verwendet jetzt den tatsächlichen Einstiegspunkt.

Zusätzlicher Chromium-Test (lokaler Server auf Port 8000):

```sh
npm install --prefix /tmp/cr7-browser playwright
PLAYWRIGHT_PATH=/tmp/cr7-browser/node_modules/playwright node scripts/browser-check.cjs
```

Der Browsertest prüft Kopfball-Hilfen, fünf Torwandschüsse mit Karriereverbuchung,
Gartenfreischaltungen, Speichercodes, Hoch-/Querformat, Trophäenbild, Musik und
Erstattungsdialog. Er verwendet einen nur im Test injizierten Zugriff auf den
Spielzustand. Chromium wird unter `/usr/bin/chromium` erwartet. Safari/iOS auf echten
Geräten ist weiterhin gesondert zu prüfen. Änderungen werden hier weder automatisch
zu GitHub gepusht noch auf GitHub Pages veröffentlicht.

## Große Siegeranimation

Die vorhandene achtteilige Ronaldo-Jubelpose erscheint als kurze Einblendung über
dem gesamten Bildschirm vor der Auswertung, wenn eine abgeschlossene Runde diese
Bedingung erfüllt:

- Ansturm/Dribbeln: kompletter Lauf und alle drei Tore im Finale.
- Kopfball: mindestens 4.000 Punkte.
- Elfmeterschießen: mindestens acht Tore aus zehn Schüssen.
- Torwandschießen: mindestens vier Treffer aus fünf Schüssen.

Die Einblendung dauert ungefähr 3,2 Sekunden, lässt sich mit „Weiter“/Überspringen
oder Escape beenden und erscheint je Runde nur einmal. Während der Browser im
Hintergrund ist, läuft ihre Zeit nicht weiter. Bei reduzierter Bewegung erscheint
die Siegerpose statisch für eine Sekunde. Das Rundenergebnis ist bereits vor dem
Jubel gespeichert; Rückkehr aus Speichern oder Auswertung spielt ihn nicht erneut.

Browserprüfung: `PLAYWRIGHT_PATH=/tmp/cr7-browser/node_modules/playwright node scripts/victory-browser-check.cjs`.

## Korrektur der Proportionen und Möbelauswahl

- Ronaldos Zuhause verwendet wieder die frühere Paneldarstellung; Zimmer und
  Garten bleiben unverzerrt im Seitenverhältnis 4:3. Die bildschirmfüllende
  Streckung entfällt. Pflege behält die ursprünglichen Canvas- und Figurengrößen;
  das Tier wird nur nach oben vor/in die Wanne versetzt. Pflegezonen und Anzeige
  erhalten denselben Versatz.
- Der Ball rollt im Ansturmlauf und in dessen Torfinale nach unten. Die übrigen
  Spielmodi behalten ihre eigene Rotationsrichtung.
- Der Möbelladen trennt Modell und Farbe: fünf Modellkarten auswählen, danach
  fünf echte Farb-/Materialvarianten ansehen, kaufen oder aufstellen. Die fünf
  Schränke haben klar verschiedene Bauformen; Weiß, Petrol, Walnuss usw. werden
  pixelweise mit Erhalt von Konturen, Textur und Transparenz eingefärbt statt
  mit einem kaum sichtbaren Farbfilter. Gespeicherte Möbel-IDs und Preise bleiben
  kompatibel, ebenso Besitz und Erstattungen.
- Die Statistikansicht zeigt jetzt auch abgeschlossene Pflegerunden, Gassirunden,
  den Gassi-Rekord und Fütterungsrunden. Diese Zähler waren bereits gespeichert;
  frühere Werte werden daher angezeigt. „Tierstatistiken“ öffnet sie direkt im Zuhause.

Browserprüfung dieser Korrekturen:
`PLAYWRIGHT_PATH=/tmp/cr7-browser/node_modules/playwright node scripts/refinement-browser-check.cjs`.


## Torwand und Kopfball-Hilfen: weitere Anpassung

- Torwandschießen zeichnet eine eigene blickdichte Wand ohne Torwart, auch während
  des Ballflugs. Zwei große runde Löcher ersetzen die kleinen eckigen Öffnungen.
  Jedes Loch akzeptiert ein 2 × 2 großes Feldgebiet des unsichtbaren 10 × 8-Rasters.
  Die vier zugehörigen Schusspositionen liegen innerhalb des sichtbaren Kreises.
  Die Öffnungen liegen innerhalb der Wand und überlappen nicht. Fünf Schüsse und
  die Verbuchung zur Elfmeter-Karriere bleiben erhalten.
- Der Torwand-Cursor bewegt sich mit 0,72 statt 1,12 normierten Einheiten pro Sekunde.
  Die Geschwindigkeit im normalen Elfmeterschießen ändert sich nicht.
- Beide Kopfball-Hilfen starten einsatzbereit und laden nach Benutzung in jeweils
  30 Spielsekunden wieder vollständig auf. Die Schaltflächen zeigen dies als
  zunehmende Füllung ohne Countdown. Die Zeitlupe wirkt unverändert fünf Sekunden.
  Ballräumen ist jetzt mehrfach pro Runde möglich, sobald es wieder aufgeladen ist.
- Nach dem Ballräumen erscheint der erste normale Ball nach etwa 0,75 Sekunden,
  jeder weitere mit etwa 1,1 Sekunden Abstand. Rote Bonusbälle werden verschoben,
  damit sie nicht zusammen mit der Rückkehrwelle erscheinen. Pause hält die
  Aufladung und die Rückkehrfristen an.
- Beim Gassigehen wechseln Hund und Katze während Absprung, Flug und Landung ihre
  vorhandenen Sprung-/Laufbilder. Kleine Drehung, Streckung und eine kurze
  Landestauchbewegung ergänzen den bisherigen Sprung, ohne die Trefferlogik zu ändern.

Browserprüfung:
`PLAYWRIGHT_PATH=/tmp/cr7-browser/node_modules/playwright node scripts/arcade-browser-check.cjs`.

## Sichtbarkeit, Zuhause und neue Statistiken (18. November)

- Im Kopfballspiel stehen die beiden aufladbaren Hilfen jetzt unterhalb der
  Spielfläche zwischen den Richtungstasten. Sie verdecken die Figur nicht mehr.
  Die Ruhepose verwendet einen festen gültigen Sprite-Frame und bleibt vor und
  nach einem Kopfball sichtbar. Die Spielfläche berücksichtigt den zusätzlichen
  Bedienbereich auch bei kleineren Bildschirmhöhen.
- Die Torwand ist grün. Der horizontale Balken sitzt unmittelbar unter der Wand
  und ist exakt so breit wie sie. Der vertikale Balken steht links und ist exakt
  so hoch wie sie. Der Ballradius nimmt während des Torwand-Flugs nur um 25 % ab;
  die übrigen Flugbahnen bleiben unverändert.
- Torwand- und Ansturm-Finalschüsse speichern ihre aktuelle und längste Trefferfolge
  schussweise. Eine Serie kann über Rundengrenzen hinausgehen; nur ein Fehlschuss
  setzt die aktuelle Folge zurück. Bereits ausgewertete Schüsse bleiben auch beim
  anschließenden Abbruch erhalten. Fehlende historische Folgen werden nicht erraten.
- Die Gartenstatistik zeigt alle bekannten Aufräumrunden, den bisherigen Rekord
  sowie die ab diesem Update erfasste Gesamtzahl und den Durchschnitt entfernter
  Haufen. Alte Aufräumrunden und Rekorde bleiben erhalten. Gesamtzahl/Durchschnitt
  werden ausdrücklich nur für Runden mit bekanntem Einzelwert angegeben.
- Schrank, Sofa und sitzender Ronaldo sind nach unten auf den Holzboden versetzt.
  Ein gezeichneter Plattenspieler öffnet die Musikauswahl; die Vase ist ebenfalls
  ein eigenes Bild. Das Gartenfenster bleibt anklickbar. Im Garten liegen drei
  größere Beete, deren Pflanzsymbole innerhalb der sichtbaren Erde stehen. Tiere
  und Aufräumziele bleiben unterhalb dieser Beetreihe.
- Pflege zeichnet Hund/Katze mit 45 % der früheren Größe. Die Pflegebereiche werden
  mit exakt derselben Transformation verkleinert und verschoben; die ganze
  Duschgrafik und der Eingabe-Canvas bleiben in ihren bisherigen Proportionen.
  Vollständige Flächenabdeckung bleibt die einzige Voraussetzung für den nächsten
  Schritt, ohne zusätzliche Zehn-Sekunden-Frist.
- Zuhause-Szenen öffnen wieder oben, damit die Raumgrafik beim Zurückkehren nicht
  versehentlich aus dem sichtbaren Bereich gescrollt bleibt.

Zusätzliche Browserprüfung mit echten Pflege-Zeigergesten und gespeichertem
23er-Torwandlauf:
`PLAYWRIGHT_PATH=/tmp/cr7-browser/node_modules/playwright node scripts/nov18-browser-check.cjs`.

## Korrektur: gespeicherte Trikots und Katzenpflege

Der wiederkehrende Unsichtbarkeitsfehler im Kopfballspiel lag im Trikot-Bildcache:
Bei einem gespeicherten anderen Trikot konnte der Menü-Zeichentakt die Ruhepose
vor Abschluss des Bildladens anfordern. Das leere Ergebnis wurde als eingefärbtes
Bild zwischengespeichert und später nicht ersetzt. Kopfballposen wurden erst nach
dem Laden angefordert und blieben deshalb sichtbar. Der Cache speichert jetzt
nur tatsächlich geladene Bilder; vorhandene leere Einträge werden erneut aufgebaut.
Dies ist mit verzögertem Laden und gespeicherten Gold-, Madrid- und blauen Trikots
nach einem Neuladen des Browsers getestet, einschließlich Bewegung und Kopfball.

Der Schrank hat keine sichtbare Schaltflächenfläche und keinen dauerhaften Rahmen
mehr. Er bleibt direkt anklickbar; eine Fokusmarkierung erscheint für die
Tastaturbedienung. Bei der Pflege hat die Katze wieder die frühere volle Größe,
mit entsprechend großen Pflegebereichen. Der Hund bleibt bei der kleineren Größe.
Die neue Nahansicht `assets/home/pet-shower-closeup.png` zeigt eine große Wanne und
Fliesen ohne Brause, Schläuche oder Raumhöhenansicht. Alle vier Katzenschritte sind
mit echten Browser-Zeigergesten geprüft, ohne zusätzliche Mindestzeit.

Gezielter Regressionstest:
`PLAYWRIGHT_PATH=/tmp/cr7-browser/node_modules/playwright node scripts/idle-cache-browser-check.cjs`.

## Präzisionsloch und Gartenwege

Die Torwand enthält jetzt ein großes goldumrandetes 100-Punkte-Loch und ein
kleineres violett umrandetes Präzisionsloch mit 200 Punkten. Dessen Radius beträgt
68 % des normalen Radius; gewertet wird die tatsächliche präzise Zielposition im
Kreis. Das normale Loch behält die großzügige 2 × 2-Treffertoleranz. Die Zahl der
Schüsse, Karriereverbuchung und Trefferfolgen ändern sich nicht.

Der Schrank und der sitzende Ronaldo sind um den Faktor 1,2 vergrößert, jeweils um
ihren unteren Anker. Der Schrank bleibt ohne sichtbare Schaltflächenumrandung.
Im Garten ist die Wiese oberhalb/hinter der Beetreihe wieder erreichbar. Bei einem
Tipp berechnet das ausgewählte Tier einen Weg um die Beete; auch beim Zurücklaufen
überquert es nicht die Erde. Ein Tipp auf einen nicht begehbaren Rand wird auf die
nächste freie Grasfläche versetzt. Tiere erscheinen weiter hinten perspektivisch
kleiner und zeigen weiterhin ihre passenden Bewegungsrichtungen.

Browserprüfung mit echtem 200-Punkte-Schuss und Gartenwegen in beide Richtungen:
`PLAYWRIGHT_PATH=/tmp/cr7-browser/node_modules/playwright node scripts/bonus-garden-browser-check.cjs`.

### Pflege, Gassirunde und feste Vorschauen (18. November 2026)

Hund und Katze sind beim Waschen gegenüber der vorherigen Version doppelt so groß. Pflegezonen, Schaum und Werkzeug folgen derselben Vergrößerung. Bei der Katze verschieben vier Ansichtspfeile den Ausschnitt, damit alle Körperbereiche erreichbar bleiben. Die neue Duschgrafik zeigt den Boden und den Schatten unter der Wanne.

Nach 30 Sekunden endet die Gassirunde mit einer Auslaufphase: Es kommen keine Hindernisse mehr, ein laufender Sprung wird beendet, dann verlassen Ronaldo und Tier gemeinsam rechts das Bild. Erst danach gibt es die Belohnung. Matschpfützen, Felsen, Holzzäune und Äste verwenden transparente Comicgrafiken. Vorschauen im Zuhause bleiben über einem unabhängig scrollbaren Auswahlbereich sichtbar; auch die Fußball-Umkleide hält ihre Figur beim Scrollen fest.

Prüfung: `npm test` (37 Tests) und `PLAYWRIGHT_PATH=/pfad/zu/playwright node scripts/walk-care-browser-check.cjs` (mobile Vorschauen, vier Pflegestufen mit echten Zeigerbewegungen, Auslaufen und Grafikdarstellung).

### Eigene Songs und Stadiontöne

Die ersten fünf Plattenspieler-Titel sind die vom Nutzer gelieferten MP3-Songs, in der angegebenen Reihenfolge. Freischaltungen und gespeicherte Titelauswahl bleiben erhalten. Songs und die späteren Instrumentalstücke laufen ausschließlich in den Zuhause- und Gartenbereichen. Die Gassirunde bleibt ohne Musik oder Stadionkulisse. In allen Fußballspielen und Fußballmenüs läuft die Crowd-Datei in Schleife. Der Schusston ertönt beim Ansturm-Abschluss, beim Kopfballkontakt, beim Elfmeter und bei der Torwand; zur großen Siegerpose ertönt Siiuu. Während des Jubels wird die Crowd abgesenkt.

Der Schalter **Ton an/aus** schaltet Musik, Fans und Effekte gemeinsam. Ton startet nach dem Antippen; beim Verlassen des Browserfensters wird die Wiedergabe pausiert. Lange Songs werden gestreamt, nur die kurzen Effekte werden in Web Audio dekodiert. Relative lokale Dateipfade funktionieren auch unter dem GitHub-Pages-Unterverzeichnis.

Die Dateien in `assets/audio` sind mit gemessener zweistufiger EBU-R128-Normalisierung auf ungefähr −18 LUFS angeglichen; der kurze, stark dynamische Schuss bekommt vorher eine Spitzenbegrenzung. `assets/audio/loudness.json` dokumentiert die Analyse. Reproduzierbar mit `python3 scripts/prepare_audio.py /pfad/zu/den/Uploads`; benötigt FFmpeg. Hintergrundlautstärke: Songs 45 %, Fans 18 %; Effekte 80 %, Fans beim Jubel zusätzlich auf 35 % abgesenkt. Dies sind Mischpegel nach der Dateinormalisierung.

Browserprüfung: `PLAYWRIGHT_PATH=/pfad/zu/playwright node scripts/audio-browser-check.cjs` prüft tatsächliche MP3-Wiedergabe, alle fünf Songs, Garten/Gassi-Wechsel, Schussauslöser in allen vier Fußballmodi, Jubel mit Lautstärkeabsenkung und Stummschaltung.
