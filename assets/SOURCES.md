# Spielfiguren

Grundlage sind die vom Nutzer bereitgestellten Pakete
`CR7-Sprites-Kopfball-korrigiert.zip` und
`CR7-Gegner-Torwart-Sprites-Korrigiert.zip`.

Die v2-Posen für Ronaldo, Verteidiger und Torwart wurden anhand dieser Bilder
erzeugt, freigestellt und als PNG-Sheets mit acht Bildern pro Folge aufbereitet.
Messi nutzt weiterhin bereinigte Originalbilder aus dem Upload. Neu erzeugte
Posen können in Gesicht, Trikotdetails und Körperproportionen leicht abweichen.

Die Bilddateien werden zur Laufzeit direkt geladen und mit `drawImage` animiert.
Stadion, Spielfeld, Tore und Bälle werden als Comicgrafik auf dem Canvas gezeichnet;
die Spielfiguren selbst bestehen vollständig aus den PNGs.

## Neue Zuhause-Animationen und Park

`pets/directions.png`: anhand der vorhandenen Hund-/Katzenvorlagen generierte
Vorder- und Rückansichten, zwei Schritte je Richtung, vier Spalten und zwei Reihen.
`home/walk-poses.png`: neu generierte Sprung-/Rutschposen anhand der vorhandenen
Ronaldo-Alltagskleidung; zwei Spalten und drei Kleidungsreihen.
`home/park.png`: neu generierter gezeichneter Parkhintergrund.
Die drei Dateien wurden mit dem Bildwerkzeug erstellt und liegen lokal im Projekt.
Die beruhigenden Instrumental-Loops sind eigene prozedurale Web-Audio-Kompositionen.

`home/wardrobes.png`: neu anhand der vorhandenen Schrankgrafiken generierter
transparenter Atlas mit fünf unterschiedlichen Schrankbauformen (Dreitürer,
Schiebetüren, Bogen, Regal-Kombination, Landhaus). Der Renderer verwendet die
fünf einzelnen Motivbereiche und erzeugt die Materialfarben lokal zur Laufzeit.

`home/garden-beds.png`: anhand der ursprünglichen Gartenansicht generierte Fassung
mit drei größeren leeren Beeten; Pflanzsymbole werden auf deren Erde positioniert.
`home/decor.png`: anhand des vorhandenen Raumstils generierter transparenter Atlas
mit Plattenspieler und Vase; der Code trennt die beiden Motive an der Atlasmitte
und entfernt die transparenten Ränder beim Laden.
