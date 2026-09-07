# PROM-Lab · Use-Case-Katalog

Übungsbeispiele für die interaktive BPMN-Lernumgebung zum Modul **Prozessmanagement (PROM)**,
THWS Business School. Jeder Use Case besteht aus einer Prozessbeschreibung in Prosa (so, wie sie
Studierende erhalten), einem Modellierungsauftrag, Prüffragen und einer Musterlösung als
`.bpmn`-Datei (BPMN 2.0 mit Layout, importierbar in Adonis CE, Camunda Modeler, bpmn.io, Signavio).

Die Musterlösungen liegen unter `modelle/`, ihre Quellen (Rasterbeschreibung) unter
`modelle/quellen/`. Erzeugt werden sie mit `python3 tools/gen_bpmn.py`. Alle 24 Dateien wurden mit
bpmn-js 18.19 importiert (0 Warnungen); der Import in Adonis CE ist noch **nicht** geprüft
(siehe Umsetzungsplan, offene Punkte).

**Bewusst nicht enthalten** sind die fünf Prozesse des Arbeitsauftrags (Bestellprozess Notebook,
Materialentnahme, Verkauf, Dienstreise, Bewerbungsprozess). Sie bleiben Prüfungsleistung. Die
Use Cases hier trainieren dieselben Muster an anderen Geschichten.

---

## Übersicht

| ID | Use Case | Domäne | Lab | Neue Elemente | Datei |
|---|---|---|---|---|---|
| UC01 | Kaffee am Kiosk zubereiten | Gastronomie | 02 | Start-/Endereignis, Aufgabe, Sequenzfluss | `uc01-kaffee.bpmn` |
| UC02 | Blutentnahme in der Hausarztpraxis | Medizin | 02 | Benennung Substantiv + Verb | `uc02-blutentnahme.bpmn` |
| UC03 | Reifenwechsel in der Kfz-Werkstatt | Technik | 03 | Exklusives Gateway, Standardfluss, Zusammenführung | `uc03-reifenwechsel.bpmn` |
| UC04 | Triage in der Notaufnahme | Medizin | 03 | XOR mit drei Pfaden | `uc04-triage.bpmn` |
| UC05 | Retoure im Online-Handel | Handel/Logistik | 03 | Nachrichten-Start, Rückschleife, verschachtelte XOR | `uc05-retoure.bpmn` |
| UC06 | Rüsten einer Spritzgießmaschine | Produktion | 04 | Paralleles Gateway | `uc06-maschinenruestung.bpmn` |
| UC07 | Bestellung in der Pizzeria | Gastronomie | 04 | Inklusives Gateway | `uc07-pizzeria.bpmn` |
| UC08 | Stationäre Patientenaufnahme | Gesundheitswesen | 04 | XOR und AND kombiniert | `uc08-patientenaufnahme.bpmn` |
| UC09 | Ersatzteilbestellung mit Fristüberwachung | Logistik | 05 | Ereignisbasiertes Gateway, Timer, Nachricht | `uc09-ersatzteil.bpmn` |
| UC10 | Fertigungsauftrag mit Anlagenstörung | Produktion/Technik | 05 | Angeheftetes Fehlerereignis | `uc10-anlagenstoerung.bpmn` |
| UC11 | Rezeptanfrage in der Apotheke | Gesundheitswesen | 05 | Sendendes Zwischenereignis, nicht unterbrechender Timer | `uc11-rezeptanfrage.bpmn` |
| UC12 | Tischreservierung im Restaurant | Gastronomie | 06 | Zwei Pools, Bahnen, Nachrichtenfluss | `uc12-tischreservierung.bpmn` |
| UC13 | Wareneingang im Logistikzentrum | Logistik | 06 | Drei Bahnen, Black-Box-Pool | `uc13-wareneingang.bpmn` |
| UC14 | Überweisung an den Facharzt | Gesundheitswesen | 06 | Drei Pools, Choreografie über Nachrichten | `uc14-facharztueberweisung.bpmn` |
| UC15 | Instandhaltungsauftrag an einer Abfüllanlage | Technik | 07 | Aufgeklappter Teilprozess, Datenobjekt, Datenspeicher | `uc15-instandhaltung.bpmn` |
| UC16 | Qualitätsprüfung je Fertigungslos | Produktion | 07 | Mehrfachinstanz, Schleife, zugeklappter Teilprozess | `uc16-serienfertigung.bpmn` |
| UC17 | Ärztliche Visite auf der Station | Medizin | 07 | Timer-Start, sequenzielle Mehrfachinstanz, Aufrufaktivität | `uc17-visite.bpmn` |
| UC18 | Gästereklamation (fehlerhaft / korrigiert) | Gastronomie | 08 | Fehlersuche: Konventionen und Token-Semantik | `uc18-reklamation-fehlerhaft.bpmn`, `uc18-reklamation-korrigiert.bpmn` |
| UC19 | Bestellung von Laborbedarf (Ist) | Gesundheitswesen | 08 | Fünf Schwachstellenmuster im Modell | `uc19-laborbedarf-ist.bpmn` |
| UC20 | Auftragsabwicklung im Zerspanungsbetrieb (Ist/Soll) | Produktion | 09 | Redesign, Simulationsdaten für Adonis | `uc20-auftragsabwicklung-ist.bpmn`, `uc20-auftragsabwicklung-soll.bpmn` |
| UC21 | Entlassmanagement im Krankenhaus (KI-Rohfassung / geprüft) | Gesundheitswesen | 10 | Vollständig KI-generiertes Modell und seine Prüfung | `ki/uc21-entlassmanagement-ki-rohfassung.bpmn`, `uc21-entlassmanagement-geprueft.bpmn` |

Domänenverteilung: Gastronomie 4, Medizin/Gesundheitswesen 8, Produktion 5, Technik 3, Logistik/Handel 3
(Mehrfachzählung bei Mischfällen).

---

## Lab 02 · Sequenzfluss und Benennung

### UC01 · Kaffee am Kiosk zubereiten (Gastronomie)

**Beschreibung.** Ein Gast bestellt einen Kaffee. Die Verkäuferin mahlt die Bohnen, brüht den
Kaffee, füllt den Becher und gibt ihn aus. Damit ist der Vorgang beendet.

**Auftrag.** Modellieren Sie den Ablauf mit einem Startereignis, vier Aufgaben und einem Endereignis.
Benennen Sie die Ereignisse als Zustand (Partizip), die Aufgaben als Substantiv + Verb im Infinitiv.

**Prüffragen.** Hat jede Aufgabe genau einen eingehenden und einen ausgehenden Sequenzfluss?
Beschreibt das Startereignis den Auslöser, das Endereignis das Ergebnis?

### UC02 · Blutentnahme in der Hausarztpraxis (Medizin)

**Beschreibung.** Sobald ein Patient aufgerufen wird, prüft die medizinische Fachangestellte seine
Identität, etikettiert die Röhrchen, entnimmt Blut, versorgt die Einstichstelle und verpackt die
Proben für den Laborkurier.

**Auftrag.** Fünf Aufgaben in Folge. Die Übung zielt auf Benennung: „Identität prüfen“ statt
„Identitätsprüfung“, „Blut entnehmen“ statt „Blutentnahme“. Kein Gateway, denn es gibt keine Entscheidung.

**Prüffragen.** Enthält eine Aufgabe zwei Tätigkeiten („etikettieren und entnehmen“)? Dann sind es
zwei Aufgaben.

---

## Lab 03 · Exklusive Gateways

### UC03 · Reifenwechsel in der Kfz-Werkstatt (Technik)

**Beschreibung.** Nach der Fahrzeugannahme fährt der Mechaniker das Auto auf die Hebebühne und
demontiert die Räder. Hat der Kunde eine Einlagerung gebucht, werden die Räder etikettiert und ins
Reifenlager gebracht; andernfalls kommen sie in den Kofferraum. In beiden Fällen montiert der
Mechaniker anschließend die Saisonräder und zieht die Radmuttern mit dem Drehmomentschlüssel an.
Das Fahrzeug ist abholbereit.

**Auftrag.** Ein exklusives Gateway mit zwei beschrifteten Pfaden, davon einer als Standardfluss;
Zusammenführung vor der Montage über ein zweites XOR-Gateway.

**Prüffragen.** Trägt das Gateway eine Frage als Beschriftung? Läuft der Prozess auf genau ein
Endereignis zu? Warum ist die Zusammenführung kein paralleles Gateway?

### UC04 · Triage in der Notaufnahme (Medizin)

**Beschreibung.** Ein Patient trifft ein. Die Pflegekraft erfasst die Vitalparameter und stuft die
Dringlichkeit ein. Bei lebensbedrohlichem Zustand (rot) wird der Schockraum alarmiert, bei dringendem
(gelb) ein Behandlungsplatz zugewiesen, sonst (grün) wird der Patient in den Wartebereich verwiesen.
Danach legt die Aufnahme die Patientenakte an; der Patient befindet sich in Behandlung.

**Auftrag.** XOR-Gateway mit drei Pfaden, „grün“ als Standardfluss, Zusammenführung, ein Endereignis.

**Prüffragen.** Sind die drei Bedingungen vollständig und überschneidungsfrei? Was passiert mit
einer Marke, die keine Bedingung erfüllt, wenn es keinen Standardfluss gibt?

### UC05 · Retoure im Online-Handel (Handel)

**Beschreibung.** Eine Retoure trifft im Lager ein. Ein Mitarbeiter öffnet das Paket und erfasst
den Inhalt. Ist die Rücksendung unvollständig, fordert er die fehlenden Teile beim Kunden an und
wartet auf die Nachlieferung; danach beginnt die Erfassung von vorn. Ist sie vollständig, prüft er
den Zustand: Einwandfreie Ware wird voll erstattet, gebrauchte Ware gemindert und teilweise
erstattet, beschädigte Ware geht an den Kunden zurück. Abschließend wird die Retoure im System
abgeschlossen.

**Auftrag.** Nachrichten-Startereignis, eine Rückschleife über ein Nachrichten-Zwischenereignis,
ein dreifaches XOR, Zusammenführung, ein Endereignis.

**Prüffragen.** Wohin führt die Schleife zurück, und warum nicht zum Startereignis? Wie viele
Endereignisse braucht dieser Prozess?

---

## Lab 04 · Parallele und inklusive Gateways

### UC06 · Rüsten einer Spritzgießmaschine (Produktion)

**Beschreibung.** Steht ein Auftragswechsel an, beendet der Einrichter den laufenden Auftrag.
Anschließend laufen drei Tätigkeiten unabhängig voneinander: Werkzeug wechseln, Material am Trichter
bereitstellen, Steuerungsprogramm laden. Sind alle drei fertig, werden Anfahrteile produziert und
das Erstmuster freigegeben. Die Serienproduktion startet.

**Auftrag.** Paralleles Gateway als Aufspaltung und als Zusammenführung.

**Prüffragen.** Was passiert, wenn die Zusammenführung ein XOR-Gateway wäre (drei Marken laufen
weiter)? Was, wenn die Aufspaltung ein XOR wäre (nur ein Zweig läuft)?

### UC07 · Bestellung in der Pizzeria (Gastronomie)

**Beschreibung.** Ein Gast gibt eine Bestellung auf; sie kann Pizza, Getränk und Dessert in
beliebiger Kombination enthalten. Je nach Bestellung wird die Pizza gebacken, das Getränk
eingeschenkt und/oder das Dessert angerichtet. Sobald alles Bestellte fertig ist, wird serviert
und kassiert.

**Auftrag.** Inklusives Gateway mit drei bedingten Pfaden und inklusiver Zusammenführung.

**Prüffragen.** Warum reicht hier weder XOR noch AND? Wie viele Marken wartet die inklusive
Zusammenführung ab? Welche Pfade müssten Sie modellieren, wenn Sie kein OR-Gateway verwenden dürften
(Antwort: sieben Kombinationen mit XOR oder verschachtelte AND/XOR)?

### UC08 · Stationäre Patientenaufnahme (Gesundheitswesen)

**Beschreibung.** Ein Patient erscheint zur Aufnahme. Die Aufnahmekraft nimmt die Stammdaten auf.
Gesetzlich Versicherte legen die Versichertenkarte vor, bei Privat- oder Selbstzahlern wird die
Kostenübernahme geklärt. Danach laufen parallel: Bett zuweisen, Aufnahmeuntersuchung durchführen,
Patientenarmband ausstellen. Anschließend wird der Patient auf die Station begleitet.

**Auftrag.** XOR-Block gefolgt von AND-Block. Jeder Block wird mit demselben Gatewaytyp
geschlossen, mit dem er geöffnet wurde.

**Prüffragen.** Dürfen XOR-Zusammenführung und AND-Aufspaltung zu einem Gateway verschmolzen werden?
(Nein: ein Gateway hat genau eine Funktion.)

---

## Lab 05 · Ereignisse

### UC09 · Ersatzteilbestellung mit Fristüberwachung (Logistik)

**Beschreibung.** Die Instandhaltung meldet Ersatzteilbedarf. Der Einkauf löst die Bestellung aus.
Nun passiert eines von zwei Dingen: Entweder trifft die Lieferbestätigung ein, dann wird der
Liefertermin hinterlegt; oder drei Werktage vergehen ohne Bestätigung, dann mahnt der Einkauf
telefonisch und fragt einen Ersatzlieferanten an. In beiden Fällen wartet der Einkauf danach auf
die Ware und lagert sie ein.

**Auftrag.** Ereignisbasiertes Gateway mit Nachrichten- und Timer-Zwischenereignis, Zusammenführung,
ein weiteres Nachrichtenereignis für die Ware.

**Prüffragen.** Warum steht nach dem ereignisbasierten Gateway kein Datenobjekt und keine Aufgabe,
sondern ausschließlich Ereignisse? Was unterscheidet das ereignisbasierte vom datenbasierten XOR?

### UC10 · Fertigungsauftrag mit Anlagenstörung (Produktion, Technik)

**Beschreibung.** Nach Freigabe des Fertigungsauftrags rüstet der Maschinenführer die Maschine und
fertigt das Los. Während der Fertigung kann eine Anlagenstörung auftreten; dann wird die
Instandhaltung gerufen und der Auftrag abgebrochen. Ohne Störung geht das Los in die
Qualitätsprüfung und ist fertiggestellt.

**Auftrag.** Angeheftetes (unterbrechendes) Fehlerereignis an „Los fertigen“, eigener Ausnahmepfad
mit eigenem Endereignis.

**Prüffragen.** Warum ist das Fehlerereignis am Rand der Aufgabe und nicht im Sequenzfluss? Was
bedeutet die durchgezogene gegenüber der gestrichelten Umrandung eines Randereignisses?

### UC11 · Rezeptanfrage in der Apotheke (Gesundheitswesen)

**Beschreibung.** Ein Kunde legt ein Rezept vor. Die Apothekerin prüft die Gültigkeit. Ist das
Präparat vorrätig, holt sie es aus dem Lager. Sonst bestellt sie es beim Großhandel, informiert den
Kunden über den Abholtermin und wartet auf die Lieferung. Bleibt die Lieferung zwei Tage aus,
erfragt sie den Lieferstatus, ohne das Warten abzubrechen. Anschließend berät sie den Kunden, gibt
das Präparat ab und rechnet ab.

**Auftrag.** Sendendes Zwischenereignis, nicht unterbrechender Timer am Rand der Warteaufgabe mit
eigenem Endereignis für den Nebenpfad.

**Prüffragen.** Wie viele Marken laufen, nachdem der Timer gefeuert hat? Welche Folge hätte ein
unterbrechender Timer an dieser Stelle?

---

## Lab 06 · Pools, Bahnen, Nachrichtenfluss

### UC12 · Tischreservierung im Restaurant (Gastronomie)

**Beschreibung.** Ein Gast fragt eine Reservierung an. Der Service prüft die Belegung. Ist ein Tisch
frei, bestätigt der Service, deckt den Tisch ein, und die Küche nimmt die Reservierung parallel in
die Tagesplanung auf. Sonst sendet der Service eine Absage. Der Gast entscheidet nach der Antwort,
ob er kommt oder sich eine Alternative sucht.

**Auftrag.** Zwei Pools (Gast, Restaurant), zwei Bahnen im Restaurant (Service, Küche), Nachrichten-
flüsse ausschließlich zwischen Pools, Sequenzflüsse ausschließlich innerhalb.

**Prüffragen.** Kreuzt ein Sequenzfluss eine Poolgrenze? Darf ein Nachrichtenfluss zwischen Service
und Küche verlaufen? (Nein, beide sind Bahnen desselben Pools.)

### UC13 · Wareneingang im Logistikzentrum (Logistik)

**Beschreibung.** Ein Spediteur meldet sich mit Lieferschein an der Pforte. Die Pforte prüft die
Papiere und weist eine Rampe zu. Der Wareneingang entlädt den Lkw und gleicht die Lieferung mit der
Bestellung ab. Bei Abweichung meldet er sie an den Einkauf; der Prozess endet mit angestoßener
Klärung. Ohne Abweichung prüft die Qualitätssicherung eine Stichprobe: bestanden, dann lagert der
Wareneingang die Ware ein; nicht bestanden, dann wird die Ware gesperrt.

**Auftrag.** Ein Pool mit drei Bahnen, der Spediteur als Black-Box-Pool (ohne Inhalt), zwei
Nachrichtenflüsse zur Poolkante.

**Prüffragen.** Wann ist ein Black-Box-Pool angemessen? Liegt jede Aufgabe in genau einer Bahn?

### UC14 · Überweisung an den Facharzt (Gesundheitswesen)

**Beschreibung.** Eine Patientin mit Beschwerden sucht den Hausarzt auf. Dieser erhebt die Anamnese
und stellt eine Überweisung aus. Die Patientin fragt beim Facharzt einen Termin an, die Facharztpraxis
plant ihn ein und teilt ihn mit. Nach der Untersuchung sendet der Facharzt den Befund an den
Hausarzt, der ihn in die Akte ablegt.

**Auftrag.** Drei Pools mit jeweils eigenem Start und Ende; fünf Nachrichtenflüsse; Wartepunkte als
Nachrichten-Zwischenereignisse.

**Prüffragen.** Wo wartet jeder Beteiligte, und ist das Warten als Ereignis sichtbar? Warum hat jeder
Pool ein eigenes Startereignis?

---

## Lab 07 · Teilprozesse, Daten, Schleifen

### UC15 · Instandhaltungsauftrag an einer Abfüllanlage (Technik)

**Beschreibung.** Eine Störmeldung geht ein. Die Instandhaltung legt im Instandhaltungssystem (CMMS)
einen Auftrag an. Dann wird die Störung diagnostiziert: Fehlerspeicher auslesen, Anlage vor Ort
inspizieren, Ursache eingrenzen. Ist ein Ersatzteil nötig, wird es aus dem Lager entnommen. Die
Anlage wird instand gesetzt, ein Probelauf durchgeführt und ein Bericht erstellt.

**Auftrag.** Aufgeklappter Teilprozess „Störung diagnostizieren“ mit eigenem Start und Ende, zwei
Datenobjekte, ein Datenspeicher mit Datenassoziationen.

**Prüffragen.** Was gehört in den Teilprozess, was auf die Hauptebene? Warum kreuzt kein
Sequenzfluss den Rahmen des Teilprozesses?

### UC16 · Qualitätsprüfung je Fertigungslos (Produktion)

**Beschreibung.** Ein Los wird aus der Fertigung gemeldet. Der Prüfer lädt den Prüfplan aus dem MES
und prüft jedes Teil der Stichprobe (die Teile lassen sich parallel prüfen). Er wertet aus. Ist das
Los nicht in Ordnung, wird nachgearbeitet und nachgeprüft, so oft wie nötig. Ein in Ordnung
befundenes Los wird verpackt und etikettiert (eigener, hier zugeklappter Teilprozess) und mit
Freigabeprotokoll für den Versand freigegeben.

**Auftrag.** Parallele Mehrfachinstanz, Standardschleife, zugeklappter Teilprozess, Datenspeicher,
Datenobjekt.

**Prüffragen.** Worin unterscheidet sich die Schleifenmarkierung an der Aufgabe von einer
Rückschleife über ein Gateway? Wann ist welche Darstellung lesbarer?

### UC17 · Ärztliche Visite auf der Station (Medizin)

**Beschreibung.** Täglich um 8 Uhr beginnt die Visite. Die Ärztin ruft die Patientenliste aus dem
Krankenhausinformationssystem ab und visitiert die Patienten nacheinander. Sie trägt Befunde in die
Patientenkurve ein. Ist eine Medikationsänderung nötig, wird der eigenständige Prozess „Medikation
anpassen“ aufgerufen, den auch die Notaufnahme nutzt. Abschließend bespricht sie die Visite mit der
Pflege nach.

**Auftrag.** Timer-Startereignis, sequenzielle Mehrfachinstanz auf einem Teilprozess,
Aufrufaktivität, Datenobjekt und Datenspeicher.

**Prüffragen.** Wann ist eine Aufrufaktivität einem eingebetteten Teilprozess vorzuziehen? Welche
Konsequenz hat ein Timer-Start für die Zahl der Prozessinstanzen?

---

## Lab 08 · Modellqualität

### UC18 · Gästereklamation im Restaurant (Gastronomie)

Das Modell `uc18-reklamation-fehlerhaft.bpmn` ist syntaktisch importierbar, aber absichtlich falsch.
Aufgabe ist, die Fehler zu finden, zu benennen und mit der korrigierten Fassung zu vergleichen.

| Nr. | Eingebauter Fehler | Verletzte Regel |
|---|---|---|
| 1 | Sequenzfluss von „Reklamation“ (Pool Gast) in das Startereignis des Restaurants | Sequenzflüsse bleiben im Pool; über Poolgrenzen nur Nachrichtenflüsse |
| 2 | Aufgabe heißt „Reklamation“ (nur Substantiv), eine andere „Wird geprüft“ (Passiv) | Substantiv + Verb im Infinitiv |
| 3 | XOR-Gateway ohne Frage, drei ausgehende Pfade ohne Bedingung | Jeder ausgehende Pfad trägt eine Bedingung |
| 4 | XOR-Aufspaltung wird mit parallelem Gateway zusammengeführt | Deadlock: die AND-Zusammenführung wartet auf Marken, die nie kommen |
| 5 | „Gutschein ausstellen“ hat keinen ausgehenden Fluss | Jede Aufgabe führt weiter; jeder Pfad erreicht ein Endereignis |
| 6 | Nachrichtenfluss zwischen den Bahnen Service und Küche | Innerhalb eines Pools nur Sequenzfluss |
| 7 | Startereignis im Restaurant ohne Namen und ohne Typ, obwohl eine Nachricht auslöst | Auslöser sichtbar machen |
| 8 | Zweites Endereignis des Gastes ohne Namen, aus dem Restaurant heraus erreicht | Endereignis benennen; siehe 1 |

Die korrigierte Fassung `uc18-reklamation-korrigiert.bpmn` behebt alle acht Punkte und zeigt
zusätzlich einen Standardfluss („nein“) sowie ein Nachrichten-Zwischenereignis beim Gast.

### UC19 · Bestellung von Laborbedarf, Ist-Prozess (Gesundheitswesen)

**Beschreibung.** Die Station stellt Laborbedarf fest, füllt ein Papierformular aus und schickt es
per Hauspost. Der Einkauf tippt das Formular ins Bestellsystem ab, prüft die Artikelnummern und
schickt die Bestellung zur Bestätigung an die Station zurück. Die Station prüft nochmals und
schickt die Bestätigung an den Einkauf. Übersteigt der Wert 500 Euro, fordert der Einkauf eine
Freigabe der Verwaltungsleitung an, die nur in der wöchentlichen Freigaberunde entscheidet. Bei
Ablehnung bittet der Einkauf die Station um Korrektur, und der Prozess beginnt beim Formular von
vorn. Sonst geht die Bestellung an den Lieferanten.

**Auftrag.** Kein Modellieren, sondern Lesen: Ordnen Sie jedem der fünf Schwachstellenmuster der
Vorlesung (Medienbruch, Doppelarbeit, Pingpong-Übergaben, Rückschleifen, Wartestellen) die Stelle im
Modell zu und formulieren Sie die Prüffrage dazu.

| Muster | Stelle im Modell |
|---|---|
| Medienbruch | Papierformular → „Formular ins Bestellsystem abtippen“; zwei Datenobjekte für dieselbe Information |
| Doppelarbeit | „Artikelnummern prüfen“ (Einkauf) und „Bestellung nochmals prüfen“ (Station) |
| Pingpong | Station → Einkauf → Station → Einkauf innerhalb weniger Schritte |
| Rückschleife | „Station um Korrektur bitten“ zurück zum Formular |
| Wartestelle | Timer „Wöchentliche Freigaberunde“ vor der Entscheidung der Verwaltungsleitung |

---

## Lab 09 · Vom Ist zum Soll, Simulation in Adonis

### UC20 · Auftragsabwicklung im Zerspanungsbetrieb (Produktion)

**Ist-Prozess** (`uc20-auftragsabwicklung-ist.bpmn`): Anfrage per Fax oder E-Mail, Eintrag in eine
Excel-Liste, Kalkulation in Excel, Angebot per E-Mail, Warten auf Auftragsbestätigung, Auftrag ins
ERP abtippen; Arbeitsvorbereitung prüft Zeichnung, erstellt Arbeitsplan, bestellt Material und
wartet; Fertigung fräst, entgratet, prüft Maße; Versand prüft Maße nochmals, verpackt, schreibt den
Lieferschein von Hand, übergibt die Sendung. Vier Bahnen, ein Black-Box-Pool Kunde.

**Soll-Prozess** (`uc20-auftragsabwicklung-soll.bpmn`): Anfrage im Kundenportal, Angebot aus
Kalkulationsregeln automatisch erzeugt und nur freigegeben, Auftrag automatisch im ERP angelegt;
Arbeitsplan und Materialprüfung parallel, Bestellung nur bei fehlendem Bestand; Fräsen und
Entgraten zusammengefasst, eine einzige Maßprüfung mit Messprotokoll; Lieferschein aus dem ERP.

**Angewandte Redesign-Heuristiken** (Reijers/Liman Mansar): Automatisierung (Kalkulation, ERP,
Lieferschein), Parallelisierung (Arbeitsplan / Material), Eliminierung von Doppelprüfung und
Medienbrüchen, Zusammenfassung von Aufgaben (Fräsen und Entgraten), bedingte Ausführung
(Materialbestellung nur bei Bedarf). Preis: Investition in Portal und Regelwerk, weniger
Prüfredundanz, Abhängigkeit von Stammdatenqualität.

**Simulationsdaten für die Prozessschrittanalyse in Adonis CE** (Vorschlag; Studierende dürfen
eigene Werte setzen):

| Aufgabe (Ist) | Bearbeitungszeit | Liegezeit | Transportzeit | Kosten |
|---|---|---|---|---|
| Anfrage in Excel-Liste eintragen | 10 min | 2 h | – | 8 € |
| Angebot in Excel kalkulieren | 45 min | 4 h | – | 40 € |
| Angebot per E-Mail senden | 5 min | – | – | 4 € |
| Auftrag ins ERP abtippen | 20 min | 8 h | – | 16 € |
| Zeichnung prüfen | 30 min | 4 h | – | 30 € |
| Arbeitsplan erstellen | 60 min | 8 h | – | 60 € |
| Material bestellen | 15 min | 48 h (Lieferung) | – | 12 € |
| Teile fräsen | 240 min | 16 h | – | 320 € |
| Teile entgraten | 40 min | 2 h | 10 min | 35 € |
| Maße prüfen | 30 min | 1 h | – | 30 € |
| Maße nochmals prüfen | 30 min | 4 h | 15 min | 30 € |
| Teile verpacken | 20 min | 1 h | – | 15 € |
| Lieferschein von Hand schreiben | 15 min | 2 h | – | 12 € |
| Sendung übergeben | 10 min | 8 h | – | 8 € |

Erwartung: Die Ist-Durchlaufzeit wird von Liegezeiten dominiert (rund 100 Stunden bei etwa
10 Stunden Bearbeitung). Im Soll fallen drei Aufgaben weg, zwei werden automatisiert
(Bearbeitungszeit je 1 min), zwei laufen parallel. Die Übung fragt, welche Zeitart der Umbau
tatsächlich senkt.

---

## Lab 10 · KI in der Modellierung

### UC21 · Entlassmanagement im Krankenhaus (Gesundheitswesen)

**Prozessbeschreibung, die der KI vorgelegt wurde.** Die Stationsärztin entscheidet bei der Visite,
dass ein Patient entlassen werden kann. Sie erstellt den Entlassbrief. Parallel dazu prüft die
Pflege, ob der Patient ein Hilfsmittel braucht; falls ja, bestellt der Sozialdienst das Hilfsmittel
beim Sanitätshaus und wartet auf dessen Lieferbestätigung. Trifft die Bestätigung nicht innerhalb
von 24 Stunden ein, fasst der Sozialdienst telefonisch nach. Sobald Entlassbrief und (falls nötig)
Hilfsmittel vorliegen, führt die Ärztin das Entlassgespräch und übergibt Brief und Medikationsplan.
Der Hausarzt erhält den Entlassbrief elektronisch. Die Abrechnung meldet den Fall an die
Krankenkasse. Ist der Patient nicht transportfähig, wird die Entlassung um einen Tag verschoben und
der Prozess beginnt bei der Visite von vorn.

**Versuchsanordnung.** Die Beschreibung wurde ohne weitere Hinweise einem Sprachmodell (Claude
Sonnet, ohne Werkzeuge, ohne Validierung, ein Durchgang) mit der Bitte um eine vollständige
BPMN-2.0-Datei vorgelegt. Das Ergebnis liegt **unverändert** unter
`modelle/ki/uc21-entlassmanagement-ki-rohfassung.bpmn` (55 Elemente, importierbar, 0 Warnungen).

**Befund der Prüfung** (Grundlage für die Lab-Übung „KI-Modell abnehmen“):

| Nr. | Beobachtung | Bewertung |
|---|---|---|
| 1 | Pools für Krankenhaus, Sanitätshaus, Hausarzt, Krankenkasse, Patient; vier Bahnen; Send-/Receive-Tasks; Nachrichtenflüsse zur Poolkante | Notation korrekt, Struktur gut lesbar |
| 2 | „Hilfsmittelbedarf prüfen“ liegt in der Bahn Pflege, „bestellen“ beim Sozialdienst | Zuständigkeiten aus dem Text richtig übernommen |
| 3 | Nicht unterbrechender Timer an „Auf Lieferbestätigung warten“; „Telefonisch nachfassen“ führt per Sequenzfluss **zurück in die Warteaufgabe** | **Semantikfehler.** Der nicht unterbrechende Timer lässt die Warteaufgabe aktiv; der Rückfluss erzeugt eine zweite Marke in derselben Aufgabe. Das XOR danach lässt beide passieren, die parallele Zusammenführung erhält eine Marke zu viel: Prozess läuft zweimal weiter oder blockiert. Korrekt wäre ein ereignisbasiertes Gateway (Nachricht oder 24 h) mit Schleife zum Gateway, wie in der geprüften Fassung |
| 4 | „Patient nicht transportfähig“ führt zurück in die **parallele Aufspaltung** nach dem Start | Der Entlassbrief wird ein zweites Mal erstellt; die Beschreibung sagt „beginnt bei der Visite von vorn“. Die Visite ist im Modell aber kein Schritt, sondern nur der Auslöser. Die geprüfte Fassung beendet die Instanz („Entlassung verschoben“); die Visite am Folgetag startet eine neue |
| 5 | Prüfung der Transportfähigkeit erst nach Brief und Hilfsmittel | Der Text lässt offen, wann geprüft wird; die KI hat still eine Annahme getroffen und sie nirgends gekennzeichnet. Die geprüfte Fassung prüft zu Beginn, weil ein nicht transportfähiger Patient keine Bestellung auslösen sollte |
| 6 | Aufgabe „Entlassgespräch führen, Brief & Medikationsplan übergeben“ | Zwei Tätigkeiten in einer Aufgabe; verletzt die Benennungsregel |
| 7 | Layout mit Koordinaten vorhanden, Bahnen sauber, keine Überlappungen | Brauchbar, in Adonis nur Feinschliff nötig |

**Chancen** (aus dem Versuch): Die Rollen, Aufgaben und Nachrichten wurden vollständig extrahiert,
die Notation ist fehlerfrei, der Zeitaufwand liegt unter fünf Minuten, und die Datei ließ sich
sofort importieren. Als Entwurf, Diskussionsgrundlage oder Ausgangspunkt für eine Erhebung ist das
Modell nützlich.

**Grenzen** (aus dem Versuch): Token-Semantik wird nicht durchgerechnet (Befund 3), Lücken in der
Beschreibung werden ohne Kennzeichnung gefüllt (Befund 5), Wiederanläufe werden falsch als Rücksprung
statt als neue Instanz modelliert (Befund 4), Benennungskonventionen werden nicht durchgehend
eingehalten (Befund 6). Keiner dieser Fehler ist im Bild auffällig; sie zeigen sich erst beim
Durchspielen mit Marken oder in der Simulation. Die Prüfpflicht bleibt beim Menschen; die
Lernumgebung übt genau diese Abnahme.

Die geprüfte Fassung liegt unter `modelle/uc21-entlassmanagement-geprueft.bpmn`.

---

## Wie eine Musterlösung entsteht

Jede Datei entsteht aus einer Rasterbeschreibung (`modelle/quellen/*.json`): Knoten mit Typ,
Beschriftung, Spalte und Zeile; Pools und Bahnen als Zeilenbänder; Flüsse als Paare von Knoten.
`tools/gen_bpmn.py` berechnet Koordinaten, Kantenverläufe und Beschriftungspositionen und schreibt
reines BPMN 2.0 ohne Werkzeug-Erweiterungen. Vorteile gegenüber handgezeichneten Modellen:

* Eine Änderung an der Geschichte ist eine Änderung an einer Textzeile; das Layout folgt.
* Der Generator prüft eindeutige IDs, aufgelöste Referenzen und verwaiste Knoten.
* Dieselbe Quelle liefert später die Elementlisten für die Übungsprüfung in der Lernumgebung
  (welche Gateways, wie viele Endereignisse, welche Bahnen erwartet werden).

Prüfen im Browser (Entwicklung, benötigt den lokalen Server aus `.claude/launch.json`):
`tools/vorschau.html?f=../modelle/<datei>.bpmn` zeigt ein Modell, `tools/alle.html` importiert
alle Dateien aus `tools/manifest.txt` und meldet Warnungen.
