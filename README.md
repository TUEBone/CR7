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
