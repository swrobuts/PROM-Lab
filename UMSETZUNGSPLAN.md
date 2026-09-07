# PROM-Lab · Umsetzungsplan

Interaktive Lernumgebung zur BPMN-Prozessmodellierung für das Modul **Prozessmanagement (PROM)**
der THWS Business School. Stand: 7. September 2026. Status: **Entwurf zur Freigabe**.

Zielbild: Studierende arbeiten sich in zehn Labs von den Grundlagen (Aufgabe, Ereignis,
Sequenzfluss) bis zu Kollaborationen, Teilprozessen, Modellqualität, Redesign und KI-gestützter
Modellierung vor. Jedes Lab erklärt, zeigt Beispiele aus verschiedenen Domänen, lässt üben und
gibt sofort Rückmeldung. Standardwerkzeug außerhalb des Browsers ist **Adonis CE**; jede
Musterlösung liegt als `.bpmn`-Datei zum Import bereit.

Der zugehörige Use-Case-Katalog steht in `USE-CASES.md`; die 24 Modelldateien liegen bereits unter
`modelle/` und `modelle/ki/`.

---

## 1. Leitentscheidungen

| Entscheidung | Festlegung | Begründung |
|---|---|---|
| Plattform | Statische Seite auf GitHub Pages, Repo `swrobuts/PROM-Lab`, kein Build-Schritt, kein Server, keine Anmeldung | Wie DABA und BINT; bewährt, wartbar, datenschutzfrei |
| Formsprache | DABA-Struktur: fixe Kopfleiste, Seitennavigation, Abschnittsblöcke, Hinweiskästen, Übungsboxen mit Prüfung, Fortschritt im `localStorage`, DE/EN-Umschalter | Wiedererkennung über die Lernumgebungen hinweg; `daba.css` wird kopiert und umgefärbt, nicht neu entworfen |
| Leitfarbe | DATEV nutzt zwei Grüntöne: Petrol `#00595C` und Lindgrün `#90D033`. Vorschlag: Lindgrün füllt Flächen (Hero, Badges, Kacheln) mit dunkler Schrift, Petrol trägt Text, Links und Akzentlinien | Gleiche Logik wie in DABA (Bernstein füllt, dunkler Text). Kontraste: Petrol auf Weiß 8,1:1, Dunkelschrift auf Lindgrün 9,0:1, Lindgrün als Textfarbe nur 1,9:1 und deshalb ausgeschlossen |
| BPMN im Browser | **bpmn-js** (bpmn.io, Camunda) mitgeliefert unter `assets/bpmn-js/`: Viewer für Erklärungen, Modeler für Übungen. Lizenz verlangt das sichtbare bpmn.io-Logo; das bleibt | Das ist für PROM, was PGlite für DABA ist: die echte Notation läuft im Browserfenster, nichts wird gezeichnet oder abgebildet |
| Marken-Simulation | Plugin `bpmn-js-token-simulation` (MIT) für „Marke laufen lassen“ in Viewer und Modeler | Gateways werden erst verständlich, wenn man Marken durchlaufen sieht; die Vorlesung führt den Token ein (Folie 175) |
| Modelldateien | Reines BPMN 2.0 mit BPMN-DI, ohne Camunda-/Bizagi-Erweiterungen, erzeugt aus JSON-Quellen durch `tools/gen_bpmn.py` | Importierbar in Adonis CE, Camunda Modeler, bpmn.io, Signavio; eine Quelle für Modell, Prüfmuster und Elementlisten |
| Sprache der Modelle | Deutsch. Oberfläche und Erklärtexte zweisprachig DE/EN wie DABA | Arbeitsauftrag erlaubt DE oder EN; doppelte Modellpflege lohnt nicht. EN-Modelle sind ein möglicher späterer Ausbau |
| Prüfung im Browser | Eigener Regelprüfer `assets/pruefung.js` (kein bpmnlint-Bundle) mit den Regeln aus Abschnitt 4; identische Datei läuft in `tools/verify.mjs` | Die Vorlesungsregeln sind spezifischer als bpmnlint; eine gemeinsame Datei für Web und Kommandozeile wie in DABA |
| Arbeitsauftrag | Die fünf Prozesse des Arbeitsauftrags erscheinen **nicht** als Musterlösung | Prüfungsleistung bleibt Prüfungsleistung; die Labs üben dieselben Muster an anderen Fällen |

---

## 2. Kapitelstruktur

Zehn Labs, geordnet nach Vorlesungsmodul 6 („Modellierung und Analyse von Prozessen“) und
Freund/Rücker. Jedes Lab: Einordnung (Voraussetzung, Ziel, Zeit), Erklärabschnitte mit lebendem
Modell, Symbolkarte (Pendant zur „Befehlskarte“ in DABA), zwei bis vier Use Cases, drei bis sechs
Übungen, Zusammenfassung.

| Lab | Titel | Lernziel (Sie können …) | Use Cases | Übungen | Zeit |
|---|---|---|---|---|---|
| 01 | Warum Prozessmodelle? | erklären, was ein Prozess, eine Instanz und eine Marke sind, wozu BPMN dient und wie eine `.bpmn`-Datei aufgebaut ist; Adonis CE einrichten, importieren, exportieren | UC01 als erstes Modell | 4 (Verständnis, Token-Simulation, Import in Adonis, XML lesen) | 25 min |
| 02 | Aufgaben, Ereignisse, Sequenzfluss | einen linearen Ablauf modellieren und regelkonform benennen | UC01, UC02 | 5 (2 × modellieren, 2 × Benennung korrigieren, 1 × Fehler finden) | 30 min |
| 03 | Entscheidungen: exklusives Gateway | Verzweigungen mit Bedingungen, Standardfluss und Zusammenführung modellieren, Rückschleifen einsetzen | UC03, UC04, UC05 | 6 | 40 min |
| 04 | Nebenläufigkeit: parallel und inklusiv | AND und OR unterscheiden, Blöcke sauber schließen, Deadlocks erkennen | UC06, UC07, UC08 | 6 | 40 min |
| 05 | Ereignisse im Ablauf | Zwischenereignisse (Nachricht, Timer), angeheftete Ereignisse (unterbrechend / nicht), Fehlerereignis, ereignisbasiertes Gateway einsetzen | UC09, UC10, UC11 | 6 | 45 min |
| 06 | Beteiligte: Pools, Bahnen, Nachrichten | Kollaborationen modellieren, Sequenz- und Nachrichtenfluss auseinanderhalten, Black-Box-Pools verwenden | UC12, UC13, UC14 | 6 | 45 min |
| 07 | Struktur: Teilprozesse, Daten, Schleifen | Modelle hierarchisch gliedern, Datenobjekte und -speicher anbinden, Mehrfachinstanzen und Schleifenmarker nutzen | UC15, UC16, UC17 | 5 | 40 min |
| 08 | Modellqualität | die sieben Konventionen anwenden, Fehler in fremden Modellen finden, die fünf Schwachstellenmuster erkennen | UC18, UC19 | 6 (Fehlersuche per Klick, Regelprüfer nutzen) | 40 min |
| 09 | Vom Ist zum Soll | Redesign-Heuristiken anwenden, Ist und Soll unterscheidbar modellieren, Simulationsdaten in Adonis eintragen und die Prozessschrittanalyse lesen | UC20 | 5 (Soll modellieren, Simulation in Adonis, Ergebnis deuten) | 60 min |
| 10 | KI in der Modellierung | ein KI-generiertes Modell abnehmen, Chancen und Grenzen belegen, einen Prompt als Prozessabgrenzung formulieren | UC21 | 5 (KI-Modell prüfen, Prompt schreiben, Ergebnis importieren und prüfen) | 45 min |

Summe: rund 54 Übungen, 24 Modelle, 6,5 Stunden Bearbeitungszeit. Die Labs 01 bis 07 decken den
Arbeitsauftrag vollständig ab; 08 bis 10 führen zur Pflichterweiterung (Adonis-Simulation) und zur
Vorlesungsdiskussion über KI.

---

## 3. Interaktionskonzept

Vier Übungstypen, jede mit sofortiger Rückmeldung. Die Definition liegt wie in DABA nicht im HTML,
sondern in `data/uebungen/lab-XX.json`; die Seite enthält je Übung einen Platzhalter
`<div data-uebung="P03-02"></div>`.

**A · Modell erkunden.** bpmn-js-Viewer zeigt eine Musterlösung. Ein Klick auf ein Element blendet
die Erklärung ein (Symbolname, Regel, Stolperfalle). „Marke starten“ lässt eine Marke laufen; an
Gateways entscheidet die Lernende per Klick. Prüfung: Verständnisfrage mit Auswahl („Wie viele
Marken erreichen das Endereignis?“).

**B · Fehler finden.** Ein absichtlich fehlerhaftes Modell (UC18) im Viewer. Die Lernende markiert
Elemente und wählt die verletzte Regel aus einer Liste. Prüfung: Menge der markierten Elemente
und zugeordneten Regeln gegen die hinterlegte Fehlerliste; Rückmeldung nennt gefundene, fehlende
und falsch zugeordnete Stellen, nie die Lösung selbst.

**C · Selbst modellieren.** bpmn-js-Modeler im Browser mit Palette, optional mit Startgerüst
(z. B. Pool und Bahnen vorgegeben, wie das `start`-Gerüst in DABA). „Prüfen“ läuft in zwei Stufen:

1. **Regelprüfung** (Abschnitt 4): Verstöße werden am Element markiert.
2. **Strukturvergleich** mit der Musterlösung über Prüfmuster aus der Übungsdefinition:
   Anzahl und Typ der Gateways, Zahl der Start- und Endereignisse, erwartete Beschriftungen
   (Stichwortabgleich, Groß-/Kleinschreibung und Umlaute tolerant), erwartete Pools und Bahnen,
   Erreichbarkeit jedes Endereignisses vom Start, Zuordnung von Aufgaben zu Bahnen.
   Es gibt mehrere richtige Modelle; das Muster prüft Eigenschaften, nicht Koordinaten.

Buttons: „Als .bpmn herunterladen“ (für Adonis), „.bpmn importieren“ (aus Adonis zurück, zur
Prüfung), „Musterlösung anzeigen“ (nach Rückfrage, wie in DABA), „Eingabe leeren“ (stellt das
Gerüst wieder her). Der Stand des Editors wird je Übung im `localStorage` gehalten.

**D · Verständnisfragen.** Einfach- und Mehrfachauswahl, kurz, an ein Modell gebunden. Dient den
Labs 01, 09 und 10, in denen Adonis-Arbeit außerhalb des Browsers stattfindet.

**Fortschritt.** Gelöste Übungen unter `prom:fortschritt:<lab>`; Startseite mit Balken je Lab und
„Weiter mit Lab X · Aufgabe Y“. Zwei getrennte Reset-Funktionen wie in DABA: „Modell zurücksetzen“
(nur diese Übung) und „Lernfortschritt zurücksetzen“ (Startseite, mit Rückfrage).

---

## 4. Regelkatalog des Prüfers

Grundlage: Folie 215 („Sieben Regeln für lesbare Diagramme“), Freund/Rücker, Silver, Camunda Best
Practices. Jede Regel hat eine ID, eine Prüfung auf dem XML und eine Erklärung in beiden Sprachen.

| ID | Regel | Prüfung |
|---|---|---|
| R01 | Genau ein Startereignis je Prozess (Ausnahmen in Lab 05 und 07 gekennzeichnet) | Zählung |
| R02 | Jeder Pfad erreicht ein Endereignis; kein Knoten ohne ausgehenden Fluss außer Endereignissen | Graphdurchlauf |
| R03 | Jeder ausgehende Fluss eines XOR/OR-Gateways trägt eine Bedingung oder ist Standardfluss | Attribut `name` / `default` |
| R04 | Gateway hat entweder mehrere Eingänge oder mehrere Ausgänge, nicht beides | Zählung |
| R05 | Verzweigungstyp und Zusammenführungstyp eines Blocks stimmen überein | Blockerkennung über Dominatoren; Warnung, kein Fehler |
| R06 | Sequenzfluss kreuzt keine Poolgrenze; Nachrichtenfluss bleibt nicht innerhalb eines Pools | Zugehörigkeit der Endpunkte |
| R07 | Aufgabenname folgt Substantiv + Verb im Infinitiv; Ereignisname beschreibt einen Zustand | Heuristik: letztes Wort endet auf „-en“ / „-n“ (DE) bzw. Verb am Anfang (EN); Warnung |
| R08 | Jede Aufgabe liegt in genau einer Bahn, wenn Bahnen vorhanden sind | Geometrie der Bounds gegen Bahnen |
| R09 | Nach einem ereignisbasierten Gateway folgen ausschließlich empfangende Ereignisse oder Receive-Tasks | Typprüfung der Nachfolger |
| R10 | Angeheftetes Ereignis hat einen Ausnahmepfad, der nicht in die Aufgabe zurückführt, an der es hängt (siehe UC21-Befund 3) | Graphdurchlauf |
| R11 | Kein Element ohne Beschriftung außer Gateways zur Zusammenführung und unbenannten Zwischenereignissen im Gerüst | Attribut `name` |
| R12 | Sequenzfluss verläuft von links nach rechts; Rücksprünge nur als Schleife markiert | Geometrie: Ziel-x kleiner als Quell-x zählt als Schleife; Warnung ab drei |

Der Prüfer liefert je Verstoß Element-ID, Regel-ID, Schweregrad (Fehler / Warnung) und einen
Erklärtext. Lab 08 nutzt dieselben Regeln als Lerninhalt und lässt sie auf UC18 laufen.

---

## 5. Technische Architektur

```
index.html                       Übersicht, zehn Kacheln, Gesamtfortschritt
lab-01-grundlagen.html … lab-10-ki.html
assets/
  prom.css                       Kopie von daba.css, Farbtoken auf Grün, Elementvorschau-Stile
  prom.js                        Laufzeit: Sprache, LABS-Liste, Übungsboxen, Viewer/Modeler-Einbettung, Fortschritt
  pruefung.js                    Regelprüfer und Strukturvergleich; Web UND tools/verify.mjs
  bpmn-js/                       bpmn-modeler.production.min.js (~1,3 MB), bpmn-js.css, diagram-js.css, bpmn-font/
  bpmn-js-token-simulation/      Plugin + CSS
  symbole/*.svg                  Symbolkarten (aus bpmn-js exportiert, nicht gezeichnet)
data/
  uebungen/lab-XX.json           Übungen: Typ, Auftrag, Hinweis, Gerüst, Modell, Prüfmuster, Fehlerliste
  texte/lab-XX.json              (optional) längere zweisprachige Erklärtexte, falls das HTML zu groß wird
modelle/
  ucNN-*.bpmn                    Musterlösungen (fertig)
  ki/*.bpmn                      unveränderte KI-Rohfassungen (fertig)
  quellen/*.json                 Rasterquellen der Musterlösungen (fertig)
  gerueste/*.bpmn                Startgerüste für Typ-C-Übungen (erzeugt aus den Quellen durch Weglassen)
tools/
  gen_bpmn.py                    Quellen → .bpmn (fertig)
  gen_gerueste.py                Quellen → Startgerüste
  gen_symbole.mjs                Symbolkarten als SVG rendern (headless bpmn-js)
  verify.mjs                     Alle Musterlösungen gegen Regelprüfer und Prüfmuster; Abnahmekriterien wie in DABA
  vorschau.html, alle.html       Entwicklungs-Vorschau (fertig)
  pruefung/audit.js              Bedientest im Browser (aus DABA übernommen und angepasst)
```

**Größe.** bpmn-js Modeler plus Token-Simulation liegen bei rund 1,6 MB unkomprimiert, gzip rund
400 KB. Erster Aufruf unter zwei Sekunden; kein Vergleich zu den 17 MB von PGlite. Kein CDN-Bezug,
damit die Umgebung ohne Netz zum CDN läuft; Fallback auf jsDelivr wie in DABA.

**Lizenzen.** bpmn-js: bpmn.io-Lizenz (Logo bleibt sichtbar), Token-Simulation: MIT. Beide
Hinweise in README und Fußzeile.

**Verify-Lauf.** `node tools/verify.mjs` prüft: jede Musterlösung besteht alle Regeln ohne Fehler
(Ausnahme: absichtlich fehlerhafte Modelle, die genau die hinterlegte Fehlerliste erzeugen müssen);
jede Übung hat einen Platzhalter im HTML; jede Übung liegt in beiden Sprachen vor; die
Übungszahlen in `LABS` stimmen mit den JSON-Dateien überein; jedes referenzierte Modell existiert;
für jede Typ-C-Übung fällt die hinterlegte Gegenprobe (ein bewusst falsches Modell) durch.

---

## 6. Adonis CE: Werkzeuge, Import und Export

**Werkzeugwahl (frei, Empfehlung Adonis CE).** Im Lab 01 wird eine Auswahl genannt, ohne
Werbung: Adonis CE (BOC, kostenfreie Community Edition, browserbasiert, Simulation über die
Prozessschrittanalyse, Standard in PROM), Camunda Modeler (Desktop, kostenfrei, Referenz für
`.bpmn`-Dateien), bpmn.io-Demo (rein im Browser, ohne Konto), SAP Signavio (akademische Lizenz),
draw.io und Lucidchart (Zeichenprogramme mit BPMN-Schablonen, aber ohne Validierung, Simulation
oder `.bpmn`-Export). Die Lernumgebung selbst ist ein weiteres Werkzeug, das die Datei nur zum
Üben und Prüfen erzeugt.

**Import in Adonis CE** (BPMN DI, Doku ADONIS 16): Im Modellkatalog die Zielgruppe mit rechter
Maustaste anklicken, „Import/Export“, „BPMN DI Import“; Datei (`.bpmn` oder `.xml`, alternativ ein
ZIP mit mehreren Dateien direkt auf oberster Ebene) auswählen, „Datei importieren“. Adonis legt
je Datei ein Geschäftsprozessdiagramm an und übernimmt das Layout aus dem DI-Teil.

**Export aus Adonis CE:** Modell im Modellkatalog mit rechter Maustaste anklicken, „Import/Export“,
„BPMN DI Export“. Optionen „Mit Teilprozessen exportieren“ (nur eingebettete Teilprozesse und
Aufrufaktivitäten) und „Rekursion zulassen“. Ergebnis ist eine `.bpmn`-Datei, die sich in der
Lernumgebung per „.bpmn importieren“ prüfen lässt und in Camunda oder bpmn.io öffnet. Für die
Abgabe im Arbeitsauftrag zusätzlich SVG oder PDF über das Grafikexport-Menü des Diagramms.

**Bekannte Eigenheiten, die das Lab erklären muss** (zu verifizieren, siehe offene Punkte):
Adonis führt beim Import eigene Namen für Elementtypen (etwa „Aufgabe“ statt „Task“ mit Untertyp),
verlangt für die Simulation die Ansicht „Standard mit Simulation“, und exportiert Datenobjekte
sowie Anmerkungen je nach Version unterschiedlich. Ein Import-Test aller 24 Dateien in Adonis CE
ist der erste Arbeitsschritt nach der Freigabe.

---

## 7. Gestaltung

Kopie der DABA-Formsprache mit diesen Tokens:

```
--primary:    #90D033   Lindgrün, Flächen (Hero, Badges, Kacheln, Fortschritt) mit dunkler Schrift
--primary-d:  #00595C   Petrol, Text, Links, Akzentlinien (8,1:1 auf Weiß)
--primary-l:  #E8F7D4   aufgehellt, Hinweiskästen
--accent:     #007577   zweite Signalfarbe (5,5:1 auf Weiß); im EN-Modus wechselt sie wie in DABA
--ink:        #10201C   Schrift
```

Favicon: grünes Quadrat mit „P“. Schrift Space Grotesk wie DABA. Modelle im Viewer bleiben in den
bpmn-js-Standardfarben (Schwarz auf Weiß), damit sie aussehen wie in jedem Werkzeug; Hervorhebungen
(Fehler, aktive Marke) nutzen Petrol und die Warnfarbe.

Neue Bausteine gegenüber DABA: `.modell` (Viewer-Rahmen mit Werkzeugleiste: Zoom, Marke, Datei
laden/speichern), `.symbolkarte` (Symbol, Name, Regel, Falle; ersetzt `.befehl`), `.fehlerliste`
(Übungstyp B), `.editor` (Modeler-Rahmen mit Prüfbereich darunter).

---

## 8. Arbeitspakete und Reihenfolge

| Nr. | Arbeitspaket | Ergebnis | Abhängigkeit |
|---|---|---|---|
| 0 | Freigabe dieses Plans; Entscheidung zu Farbe und EN-Umfang | – | – |
| 1 | Import-Test der 24 Modelle in Adonis CE; Eigenheiten dokumentieren; ggf. Generator anpassen | Importprotokoll, Screenshots für Lab 01 | 0 |
| 2 | Repo `PROM-Lab` anlegen (aus `PROM/`), `.nojekyll`, README-Gerüst, bpmn-js und Token-Simulation vendoren, Lizenzhinweise | lauffähiges Grundgerüst | 0 |
| 3 | `prom.css` (aus `daba.css`), `prom.js` (aus `daba.js`: Sprache, LABS, Fortschritt), Startseite mit zehn Kacheln | Startseite | 2 |
| 4 | Viewer-Baustein mit Klick-Erklärung und Token-Simulation; Symbolkarte; Übungstyp A und D | Lab 01 und 02 vollständig | 3 |
| 5 | `pruefung.js` Regelkatalog R01 bis R12; `verify.mjs`; Übungstyp B | Lab 08 (UC18, UC19) | 4 |
| 6 | Modeler-Baustein mit Gerüst, Prüfung, Download/Import; Strukturvergleich; `gen_gerueste.py` | Übungstyp C | 5 |
| 7 | Labs 03 bis 07 (Texte DE, Übungen, Prüfmuster) | fünf Labs | 6 |
| 8 | Lab 09 (Ist/Soll, Adonis-Simulation mit Schrittanleitung und Screenshots) und Lab 10 (KI-Abnahme, Prompt-Übung) | zwei Labs | 7, 1 |
| 9 | Englische Fassung aller Texte; `audit.js`-Lauf bei 390/768/1440 px; Verify-Lauf | Abnahme | 8 |
| 10 | Deployment auf GitHub Pages, Stichprobe der ausgelieferten Dateien, Link in Moodle | veröffentlicht | 9 |

Grobe Aufwandsschätzung in Arbeitssitzungen mit Claude Code: Pakete 1 bis 3 je eine Sitzung, 4 bis
6 je ein bis zwei Sitzungen, 7 zwei bis drei Sitzungen, 8 und 9 je eine bis zwei, 10 eine halbe.
Insgesamt rund zwölf bis fünfzehn Sitzungen; die Modelle und der Generator sind bereits fertig.

Deployment-Befehle (wie DABA):

```bash
gh repo create swrobuts/PROM-Lab --public --source=. --push
gh api repos/swrobuts/PROM-Lab/pages -X POST -f source[branch]=main -f source[path]=/
```

---

## 9. Risiken und offene Punkte

| Punkt | Einschätzung | Umgang |
|---|---|---|
| Adonis-Import verhält sich anders als bpmn-js (Layout, Elementtypen, Datenobjekte) | wahrscheinlich in Details | Paket 1 vor allem anderen; Generator bleibt anpassbar, weil alle Modelle aus Quellen entstehen |
| Automatische Bewertung freier Modelle ist unscharf | sicher | Strukturvergleich prüft Eigenschaften, nicht Formen; Rückmeldung nennt Abweichungsart, nicht die Lösung; Musterlösung bleibt einsehbar |
| Modeler im Browser auf dem Telefon kaum bedienbar | sicher | Typ-C-Übungen ab 1000 px; darunter Hinweis und Download des Gerüsts für Adonis |
| bpmn-js-Lizenz verlangt Logo | sicher | Logo bleibt; Hinweis in README |
| Öffentliches Repo macht Musterlösungen lesbar | sicher | Wie DABA: Selbstlernumgebung, kein Prüfungsinstrument; Arbeitsauftragsprozesse nicht enthalten |
| Layout-Feinschliff der generierten Modelle (einzelne Beschriftungen liegen eng) | bekannt (UC18k, UC19) | Vor Veröffentlichung Durchsicht in Adonis; Generator um Label-Versatz ergänzen |
| Zweisprachigkeit verdoppelt Textpflege | bekannt aus DABA | EN in Paket 9 gebündelt; Modelle bleiben deutsch |
| Farbwahl: Lindgrün/Petrol trifft „DATEV-Grün“ nur, wenn beide Töne gemeint sind | offen | Entscheidung in Paket 0; Alternative: nur Petrol als Leitfarbe mit weißer Schrift auf Flächen (Kontrast 8,1:1) |

---

## 10. Was jetzt schon vorliegt

* `USE-CASES.md`: 21 Use Cases mit Beschreibung, Auftrag, Prüffragen; Fehlerliste zu UC18;
  Schwachstellenzuordnung zu UC19; Simulationsdaten zu UC20; Befund zur KI-Rohfassung UC21.
* `modelle/`: 23 Musterlösungen und `modelle/ki/`: eine unveränderte KI-Rohfassung, alle mit
  bpmn-js 18.19 importiert (0 Warnungen), noch nicht in Adonis getestet.
* `tools/gen_bpmn.py`: Generator mit Strukturprüfung; `tools/vorschau.html`, `tools/alle.html`:
  Entwicklungs-Vorschau.

Nächster Schritt nach Freigabe: Arbeitspaket 1 (Adonis-Importtest), dann Paket 2 (Repo und Gerüst).
