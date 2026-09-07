# PROM-Lab

**Live:** [swrobuts.github.io/PROM-Lab](https://swrobuts.github.io/PROM-Lab/)

Interaktive Lernumgebung zur BPMN-Prozessmodellierung für das Modul **Prozessmanagement (PROM)**
der THWS Business School.

Zehn Labs führen von Aufgabe, Ereignis und Sequenzfluss über Gateways, Ereignisse, Pools und
Teilprozesse bis zu Modellqualität, Redesign mit Simulation in Adonis CE und KI-gestützter
Modellierung. **54 Übungen** in vier Formen, jede mit sofortiger Rückmeldung; **21 Use Cases**
aus Gastronomie, Medizin, Gesundheitswesen, Produktion, Technik, Logistik und Handel; **28
Modelle** als `.bpmn`-Datei zum Import in Adonis CE, Camunda Modeler, bpmn.io oder Signavio.

Die Umgebung ist zweisprachig (Deutsch / Englisch) und läuft als statische Seite auf GitHub
Pages: ohne Build-Schritt, ohne Server, ohne Anmeldung. Schwesterprojekte: DABA-Lab
(Datenbanken) und BINT (Business Intelligence).

---

## Wie die Notation in den Browser kommt

Jedes Diagramm ist ein lebendes BPMN-Modell, gezeichnet von **bpmn-js** (bpmn.io, Camunda),
derselben Bibliothek, die auch der Camunda Modeler verwendet. Dazu kommt die
**Marken-Simulation** (bpmn-js-token-simulation). Beides ist unter `assets/bpmn/` als ein
ESM-Bündel mitgeliefert (650 KB, gzip rund 180 KB), damit die Umgebung nicht von einem CDN
abhängt. Das bpmn.io-Logo unten rechts in jedem Diagramm gehört zur Lizenz und bleibt.

Das ist für PROM, was PGlite für DABA ist: die echte Notation im Browserfenster, nichts wird
gezeichnet oder abgebildet. Ein Klick auf ein Symbol erklärt es (Name, Regel, Stolperfalle);
„Marke laufen lassen“ zeigt, was ein Gateway wirklich tut; im Editor modellieren Studierende
selbst und lassen prüfen.

---

## Aufbau

```
index.html                    Übersicht mit den zehn Lab-Kacheln und dem Gesamtfortschritt
lab-01-grundlagen.html        Warum Prozessmodelle? Prozess, Instanz, Marke, Werkzeuge, Adonis  (4 Übungen)
lab-02-sequenzfluss.html      Aufgaben, Ereignisse, Sequenzfluss, Benennung                   (5)
lab-03-xor.html               Exklusives Gateway, Bedingungen, Standardfluss, Rückschleife   (6)
lab-04-parallel.html          Paralleles und inklusives Gateway, Blöcke, Deadlock             (6)
lab-05-ereignisse.html        Zwischen-, Rand-, Fehlerereignis, ereignisbasiertes Gateway     (6)
lab-06-pools.html             Pools, Bahnen, Nachrichtenfluss, Black Box                      (6)
lab-07-struktur.html          Teilprozesse, Aufrufaktivität, Daten, Mehrfachinstanz           (5)
lab-08-qualitaet.html         Zwölf Regeln, Fehlersuche, fünf Schwachstellenmuster            (6)
lab-09-ist-soll.html          Redesign-Heuristiken, Simulation in Adonis CE                   (5)
lab-10-ki.html                KI-Rohfassung abnehmen, Chancen und Grenzen, Prompt             (5)

assets/
  prom.css                    Gemeinsames Stylesheet: Petrol #00595C, Lindgrün #90D033 (aus daba.css)
  prom.js                     Laufzeit: Sprache, LABS, Modelle, Übungsboxen, Fortschritt
  pruefung.js                 Regelprüfer R01–R12 und Strukturvergleich; Webseite UND Prüfwerkzeug
  bpmn/                       bpmn-js 18.19 + Token-Simulation 0.40 als ESM-Bündel, CSS, Font, Lizenzen

data/uebungen/lab-XX.json     Übungen: Typ, Auftrag, Hinweis, Modell, Fragen, Fehlerliste, Prüfmuster

modelle/
  ucNN-*.bpmn                 Musterlösungen und absichtlich fehlerhafte Übungsmodelle (27)
  ki/*.bpmn                   Unveränderte KI-Rohfassung (1)
  quellen/*.json              Rasterquellen, aus denen die Modelle erzeugt werden

tools/
  gen_bpmn.py                 Quellen → .bpmn (Layout, Kanten, Beschriftungen, Strukturprüfung)
  seite.py, gen_lab_08_10.py  Bausteine, um Lab-Seiten aus Python zu erzeugen
  verify.mjs                  Abnahmekriterien (Regeln, Platzhalter, Sprachen, Prüfmuster)
  pruefung/durchlauf.js       Bedientest im Browser: löst jede Übung mit der Musterlösung
  vorschau.html, alle.html    Entwicklungs-Vorschau einzelner Modelle bzw. aller Modelle

UMSETZUNGSPLAN.md             Plan und Leitentscheidungen
USE-CASES.md                  Die 21 Use Cases mit Beschreibung, Auftrag, Prüffragen, Befunden
```

---

## Vier Übungstypen

| Typ | Was Studierende tun | Wie geprüft wird |
|---|---|---|
| **Verständnis** (`quiz`) | Fragen mit Einfach- oder Mehrfachauswahl beantworten | Vergleich mit `richtig`; Erklärung nach der Prüfung |
| **Modell erkunden** (`erkunden`) | Ein lebendes Modell anklicken, Marken laufen lassen, dann Fragen | wie `quiz` |
| **Fehler finden** (`fehler`) | Elemente eines absichtlich fehlerhaften Modells anklicken und die verletzte Regel wählen | Menge (Element, Regel) gegen die hinterlegte Fehlerliste; Rückmeldung nennt gefunden, falsch markiert, falsche Regel |
| **Selbst modellieren** (`modell`) | Im bpmn-js-Editor modellieren (leer oder aus einem Gerüst), `.bpmn` laden und speichern | Regelprüfer R01–R12 plus Strukturvergleich mit dem Prüfmuster; Befunde sind anklickbar und markieren das Element |

Der Strukturvergleich prüft Eigenschaften, nicht Formen: Zahl der Start- und Endereignisse,
Gateways je Typ, Ereignisse je Art, Pools, Bahnen, Nachrichtenflüsse, Stichworte in Aufgaben und
Bedingungen, Erreichbarkeit. Es gibt mehrere richtige Modelle. Die Musterlösung ist nach Rückfrage
einsehbar.

Eine Übung sieht so aus (Auszug, Typ `modell`):

```jsonc
{
  "id": "P03-05", "typ": "modell",
  "modell": "modelle/uc04-triage.bpmn",          // Musterlösung
  "geruest": "modelle/....bpmn",                  // optional: Startzustand des Editors
  "titel": { "de": "…", "en": "…" },
  "aufgabe": { "de": "<p>…</p>", "en": "<p>…</p>" },
  "pruefung": { "starts": 1, "enden": 1, "gateways": { "exclusiveGateway": 2 },
                "bedingungen": ["rot", "gelb", "grün"], "aufgaben": ["Vitalparameter", "einstufen"] },
  "hinweis": { "de": "…", "en": "…" }, "rueckmeldung": { "de": "…", "en": "…" }
}
```

Die HTML-Seite enthält je Übung nur `<div data-uebung="P03-05"></div>`; lebende Modelle im
Erklärtext stehen als `<div data-modell="modelle/uc04-triage.bpmn" data-name="…"></div>`.

---

## Der Regelprüfer

`assets/pruefung.js` liest ein BPMN-XML in einen schlanken Graphen und prüft zwölf Konventionen
(Folie „Sieben Regeln für lesbare Diagramme“ der Vorlesung, Freund/Rücker, Silver, Camunda):

| ID | Regel | Stufe |
|---|---|---|
| R01 | Genau ein Startereignis je Prozess | Fehler / Warnung |
| R02 | Jeder Pfad erreicht ein Endereignis; kein Element unverbunden | Fehler |
| R03 | Jeder XOR/OR-Pfad trägt eine Bedingung oder ist Standardfluss | Fehler |
| R04 | Ein Gateway verzweigt oder führt zusammen | Warnung |
| R05 | Verzweigung und Zusammenführung eines Blocks haben denselben Typ | Fehler (Deadlock) / Warnung |
| R06 | Sequenzfluss im Pool, Nachrichtenfluss zwischen Pools | Fehler |
| R07 | Aufgabe Substantiv + Verb, Ereignis als Zustand | Warnung (Heuristik) |
| R08 | Jede Aufgabe in genau einer Bahn | Fehler |
| R09 | Nach ereignisbasiertem Gateway nur eintretende Ereignisse | Fehler |
| R10 | Ausnahmepfad eines Randereignisses führt nicht in seine Aufgabe zurück | Fehler (nicht unterbrechend) / Warnung |
| R11 | Elemente beschriftet | Warnung |
| R12 | Rücksprünge selten | Warnung |

Dieselbe Datei läuft im Browser (DOMParser) und in `tools/verify.mjs` (@xmldom/xmldom). Was auf
der Kommandozeile besteht, besteht auch im Browser.

---

## Modelle erzeugen

Kein Modell ist von Hand gezeichnet. Jede Datei entsteht aus einer Rasterquelle in
`modelle/quellen/`: Knoten mit Typ, Beschriftung, Spalte und Zeile; Pools und Bahnen als
Zeilenbänder; Flüsse als Paare. Der Generator berechnet Koordinaten, Kantenverläufe und
Beschriftungspositionen und schreibt reines BPMN 2.0 mit BPMN-DI, ohne Werkzeug-Erweiterungen.

```bash
python3 tools/gen_bpmn.py            # alle Quellen
python3 tools/gen_bpmn.py uc03       # nur Quellen, deren Name mit uc03 beginnt
```

Eine Änderung an der Geschichte ist eine Änderung an einer Textzeile; das Layout folgt.
Absichtlich fehlerhafte Modelle tragen `"absichtlichFehlerhaft": true` in der Quelle und
`-fehlerhaft` im Namen; `verify.mjs` erwartet von ihnen Fehler.

---

## Nach jeder Änderung prüfen

```bash
cd tools && npm install && cd ..     # einmalig: @xmldom/xmldom
node tools/verify.mjs
```

Der Lauf prüft: jede Musterlösung besteht alle Regeln ohne Fehler; jede Übung hat einen
Platzhalter im HTML und jeder Platzhalter eine Übung; Titel, Auftrag und Hinweis in beiden
Sprachen; die Übungszahlen in `LABS` (`assets/prom.js`) stimmen mit den JSON-Dateien überein;
referenzierte Modelle existieren; jede Fehlerliste wird vom Prüfer tatsächlich gefunden; jedes
Prüfmuster wird von seiner Musterlösung erfüllt.

Bedientest im Browser (Entwicklerkonsole einer geöffneten Lab-Seite):

```js
await (await fetch('tools/pruefung/durchlauf.js')).text().then(eval); await __durchlauf()
```

Löst jede Übung der Seite mit der Musterlösung und meldet, ob „Richtig“ erscheint. Für die
Entwicklung dient `.claude/launch.json` im Elternordner (Python-Server auf Port 8777).

---

## Fortschritt

Gelöste Übungen liegen im `localStorage` unter `prom:fortschritt:<lab>`, der Stand des Editors je
Übung unter `prom:editor:<id>`. Beides verlässt das Gerät nicht. Die Startseite zeigt den
Gesamtstand, je Lab einen Balken und „Weiter mit Lab X · Aufgabe Y“. „Lernfortschritt
zurücksetzen“ fragt nach und lässt die Editormodelle stehen.

---

## Adonis CE

Import: Modellkatalog, Rechtsklick auf die Modellgruppe, Import/Export, BPMN DI Import, Datei
(`.bpmn`, `.xml` oder ZIP) wählen. Export: Rechtsklick auf das Modell, Import/Export, BPMN DI
Export. Lab 01 beschreibt beides mit Schritten; Lab 09 die Simulation über die
Prozessschrittanalyse. Ein Import-Test aller Modelle in Adonis CE steht noch aus (siehe
Umsetzungsplan, Arbeitspaket 1).

---

## Veröffentlichen

```bash
gh repo create swrobuts/PROM-Lab --public --source=. --push
gh api repos/swrobuts/PROM-Lab/pages -X POST -f source[branch]=main -f source[path]=/
```

Die Seite läuft unter <https://swrobuts.github.io/PROM-Lab/>. `.nojekyll` liegt bei. Nach der Veröffentlichung stichprobenartig prüfen, ob die ausgelieferten
Dateien (`assets/bpmn/bpmn.mjs`, ein Modell, eine Übungsdatei) dem lokalen Stand entsprechen.

> Ein öffentliches Repository macht auch die Musterlösungen lesbar. Für eine Selbstlernumgebung
> ist das unproblematisch; als Prüfungsinstrument ist der Aufbau nicht geeignet. Die fünf
> Prozesse des Arbeitsauftrags sind bewusst nicht enthalten.

---

## Herkunft der Inhalte

Die Labs folgen dem Modul „Modellierung und Analyse von Prozessen“ der Vorlesung PROM
(Wintersemester 2026/27): Basiselemente der BPMN 2.0, die Modellierungskonventionen, die fünf
Schwachstellenmuster nach Dumas et al., die Redesign-Heuristiken nach Reijers und Liman Mansar,
die Simulation in Adonis CE und das Fallbeispiel zur KI-gestützten Modellierung. Die Use Cases
sind eigens für diese Umgebung entworfen; alle Modelle und die KI-Rohfassung wurden mit Claude
erzeugt und vom Regelprüfer und in bpmn-js geprüft.

Lizenzen der mitgelieferten Bibliotheken: bpmn-js (bpmn.io-Lizenz), bpmn-js-token-simulation
(MIT); siehe `assets/bpmn/`.

---

THWS Business School · Prof. Dr. Robert Butscher
