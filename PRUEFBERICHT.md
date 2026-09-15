# Bugprüfung vom 15. September 2026

Ausgangsstand: `999d259` auf `main`; lokaler Ordner und GitHub waren identisch.

## Behoben

- R02 übersah abgeschlossene Schleifen ohne erreichbares Ende, unverbundene Zyklen,
  isolierte Endereignisse und Fehler innerhalb von Teilprozessen.
- R06 erkannte Sequenzflüsse über Teilprozessgrenzen nicht.
- P07-05 wies eine ausdrücklich erlaubte zusätzliche XOR-Zusammenführung zurück.
- Beschädigte gespeicherte Modelle blockierten den Editor einschließlich Import und Zurücksetzen.
- Modellbeschriftungen konnten in Prüfbefunden als HTML interpretiert werden; sie erscheinen jetzt als Text.
- Beschädigte Fortschrittsdaten konnten den Seitenaufbau abbrechen. Ungültige Einträge werden ignoriert.
- Schnelle Sprachwechsel konnten mehrere Aktionsleisten im Gesamtfortschritt erzeugen.
- Die fehlende ES-Moduldeklaration verhinderte den dokumentierten Prüflauf unter Node.js 20.

## Nachweise

- Acht Regressionstests für Regeln und die erlaubte Modellvariante bestanden.
- Vollständiger bestehender Abnahmelauf für Modelle, Übungsdefinitionen und Prüfmuster bestanden.
- Alle 54 Übungen in Deutsch und Englisch im separaten Edge-Testbrowser gelöst.
- Editor-Wiederherstellung, HTML-ähnliche Beschriftungen, beschädigter Fortschritt,
  schnelle Sprachwechsel und die mobile Editoransicht bei 390 px geprüft.

Die Regelprüfung bleibt eine Analyse der Modellstruktur. Die Ausführung in Adonis CE und
anderen externen Modellierungswerkzeugen war nicht Teil dieses Prüflaufs.
