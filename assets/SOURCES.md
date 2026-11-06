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
