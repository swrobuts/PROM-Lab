"""Erzeugt lab-08-qualitaet.html, lab-09-ist-soll.html und lab-10-ki.html."""
import sys; sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from seite import *
# ---------------------------------------------------------------- Lab 08
regeln = [
 ("R01","Genau ein Startereignis je Prozess","Exactly one start event per process"),
 ("R02","Jeder Pfad erreicht ein Endereignis; kein Element bleibt unverbunden","Every path reaches an end event; no element is left unconnected"),
 ("R03","Jeder ausgehende Pfad eines XOR/OR trägt eine Bedingung oder ist Standardfluss","Every outgoing XOR/OR path carries a condition or is the default flow"),
 ("R04","Ein Gateway verzweigt oder führt zusammen, nicht beides","A gateway splits or merges, not both"),
 ("R05","Verzweigung und Zusammenführung eines Blocks haben denselben Typ","Split and join of a block have the same type"),
 ("R06","Sequenzfluss bleibt im Pool, Nachrichtenfluss verbindet Pools","Sequence flow stays inside a pool, message flow connects pools"),
 ("R07","Aufgabe: Substantiv + Verb. Ereignis: eingetretener Zustand","Task: verb + object. Event: a state that has occurred"),
 ("R08","Jede Aufgabe liegt in genau einer Bahn","Every task lies in exactly one lane"),
 ("R09","Nach einem ereignisbasierten Gateway folgen nur eintretende Ereignisse","Only catching events follow an event-based gateway"),
 ("R10","Der Ausnahmepfad eines Randereignisses führt nicht in seine Aufgabe zurück","The exception path of a boundary event does not lead back into its task"),
 ("R11","Elemente sind beschriftet","Elements are labelled"),
 ("R12","Der Fluss läuft von links nach rechts, Rücksprünge sind selten","Flow runs left to right, jumps back are rare"),
]
def stufe(r):
    if r in ("R02","R03","R06","R09","R10"): return ("Fehler","Error")
    if r in ("R01","R05","R08"): return ("Fehler oder Warnung","Error or warning")
    return ("Warnung","Warning")
main = '<main class="main-content">\n\n'
main += abschnitt("regeln", "Zwölf Regeln", "Twelve rules",
  absatz("Ein Diagramm kann jede Regel der Spezifikation einhalten und trotzdem unlesbar sein. Die Spezifikation legt fest, welche Symbole es gibt und wie Marken durch sie laufen; wie ein Modell benannt, gerichtet und gegliedert wird, regelt sie nicht. Dafür haben sich Konventionen durchgesetzt (Freund/Rücker, Silver, Camunda). Die Labs 02 bis 07 haben sie nebenbei eingeführt; hier stehen sie als Katalog, und der Prüfer dieser Umgebung wendet genau diesen Katalog an.",
          "A diagram can follow every rule of the specification and still be unreadable. The specification defines which symbols exist and how tokens run through them; how a model is named, directed and structured it does not regulate. Conventions have established themselves for that (Freund/Rücker, Silver, Camunda). Labs 02 to 07 introduced them along the way; here they stand as a catalogue, and the checker of this environment applies exactly this catalogue.")
  + '    <table class="regeln">\n' + tabelle([("ID","ID"),("Regel","Rule"),("Stufe","Level")], [(r[0], (r[1], r[2]), stufe(r[0])) for r in regeln]).split("<table>",1)[1]
  + box("info-box", "Drei Ebenen.", "Three levels.",
        "<em>Syntax</em>: Was die Spezifikation verbietet (ein Sequenzfluss aus einem Endereignis heraus); das Werkzeug verhindert es meist. <em>Konvention</em>: Was dieser Katalog verlangt; das Werkzeug lässt es zu, der Prüfer meldet es. <em>Prozessqualität</em>: Ob der Prozess gut ist; das sieht kein Prüfer, das ist Ihre Analyse (nächster Abschnitt).",
        "<em>Syntax</em>: what the specification forbids (a sequence flow out of an end event); the tool usually prevents it. <em>Convention</em>: what this catalogue requires; the tool allows it, the checker reports it. <em>Process quality</em>: whether the process is good; no checker sees that, that is your analysis (next section).")
)
main += abschnitt("fehlersuche", "Fehler in fremden Modellen finden", "Finding errors in other people's models",
  absatz("Die realistischste Prozessarbeit ist das Lesen fremder Modelle: Abgaben, Altbestände, KI-Entwürfe. Die Reklamation unten ist syntaktisch importierbar und in acht Punkten falsch. Erst finden, dann reparieren.",
          "The most realistic process work is reading other people's models: submissions, legacy stock, AI drafts. The complaint below imports syntactically and is wrong in eight points. Find first, then repair.")
  + modell("modelle/uc18-reklamation-fehlerhaft.bpmn", "UC18 · Gästereklamation (fehlerhaft)", hoch=True)
)
muster = [
 (("Medienbruch","Media break"),("Ein Datenobjekt taucht zweimal auf, einmal als Formular, einmal als Datensatz; Aufgaben heißen „erfassen“, „abtippen“, „scannen“.","A data object appears twice, once as form, once as record; tasks are called “enter”, “retype”, “scan”."),("Wird eine Information mehr als einmal eingegeben?","Is a piece of information entered more than once?")),
 (("Doppelarbeit","Double work"),("Dieselbe Prüfung oder Freigabe in zwei Bahnen, ohne dass die zweite ein anderes Ergebnis liefern könnte.","The same check or approval in two lanes without the second being able to yield a different result."),("Welche Prüfung hat je einen Fehler gefunden?","Which check has ever found an error?")),
 (("Pingpong-Übergaben","Ping-pong handovers"),("Der Sequenzfluss wechselt mehrfach zwischen zwei Bahnen hin und her; jeder Wechsel kostet Transport- und Rüstzeit.","The sequence flow switches back and forth between two lanes several times; every switch costs transport and set-up time."),("Wie oft wechselt ein Fall den Bearbeiter?","How often does a case change handler?")),
 (("Rückschleifen","Loops"),("Ein exklusives Gateway führt zu einer früheren Aufgabe zurück: Nacharbeit, weil Unterlagen fehlten oder eine Prüfung scheiterte.","An exclusive gateway leads back to an earlier task: rework because documents were missing or a check failed."),("Wie viele Fälle laufen die Schleife, und warum?","How many cases run the loop, and why?")),
 (("Wartestellen","Waiting points"),("Ein Zwischenereignis (Timer, Nachricht) oder eine Bahn mit einer einzigen Ressource hält den Fall an; hier entsteht Liegezeit.","An intermediate event (timer, message) or a lane with a single resource holds the case; idle time arises here."),("Wie lange liegt ein Fall im Mittel vor dieser Stelle?","How long does a case rest on average before this point?")),
]
main += abschnitt("muster", "Fünf Schwachstellenmuster", "Five weakness patterns",
  absatz("Ein Prozessmodell zeigt Schwachstellen, bevor eine einzige Zahl erhoben ist (Dumas et al., Kapitel 6). Die Muster sind wiederkehrend, und jedes hat eine Prüffrage, die sich am Modell beantworten lässt.",
          "A process model shows weaknesses before a single number is collected (Dumas et al., chapter 6). The patterns recur, and each has a test question that can be answered from the model.")
  + tabelle([("Muster","Pattern"),("Woran man es erkennt","How to recognise it"),("Prüffrage","Test question")], muster)
  + absatz("Die Bestellung von Laborbedarf hält alle zwölf Regeln ein und enthält alle fünf Muster. Lassen Sie eine Marke laufen und zählen Sie, wie oft sie die Bahn wechselt.",
          "The lab supplies order follows all twelve rules and contains all five patterns. Run a token and count how often it changes lane.")
  + modell("modelle/uc19-laborbedarf-ist.bpmn", "UC19 · Bestellung von Laborbedarf (Ist)", hoch=True)
)
main += uebungen(["P08-01","P08-02","P08-03","P08-04","P08-05","P08-06"],
  "Sechs Übungen: Regeln zuordnen, acht Fehler finden, die Korrektur lesen, fünf Muster suchen, Muster erkennen und zuletzt das fehlerhafte Modell im Editor reparieren, bis der Prüfer schweigt.",
  "Six exercises: assign rules, find eight errors, read the correction, look for five patterns, recognise patterns and finally repair the faulty model in the editor until the checker is silent.")
main += zusammenfassung([
  ("Syntax verhindert das Werkzeug, Konventionen prüft der Katalog, Prozessqualität prüfen Sie.", "Syntax is prevented by the tool, conventions are checked by the catalogue, process quality is checked by you."),
  ("Die häufigsten Verstöße: Flüsse an der falschen Stelle (R06), Pfade ohne Bedingung (R03), falsch geschlossene Blöcke (R05), Benennung (R07).", "The most frequent violations: flows in the wrong place (R06), paths without condition (R03), wrongly closed blocks (R05), naming (R07)."),
  ("Medienbruch, Doppelarbeit, Pingpong, Rückschleife, Wartestelle: fünf Muster mit je einer Prüffrage.", "Media break, double work, ping-pong, loop, waiting point: five patterns with one test question each."),
  ("Ein regelkonformes Modell kann einen schlechten Prozess zeigen; genau das ist sein Zweck.", "A rule-compliant model can show a bad process; that is exactly its purpose."),
])
Path(ROOT / "lab-08-qualitaet.html").write_text(seite("08", "Modellqualität", "Model quality", "lab-08",
  sb([("regeln","Zwölf Regeln","Twelve rules"),("fehlersuche","Fehler finden","Finding errors"),("muster","Fünf Schwachstellenmuster","Five weakness patterns"),("uebungen","Übungen","Exercises"),("zusammenfassung","Zusammenfassung","Summary")]),
  header("08", "Modellqualität", "Model quality",
    "Bis hierher ging es darum, Modelle zu bauen. Jetzt geht es darum, sie zu beurteilen: Hält ein Modell die Konventionen ein, die es für andere lesbar machen? Und zeigt es, regelkonform oder nicht, einen guten oder einen schlechten Prozess? Das Lab stellt den Regelkatalog des Prüfers vor, lässt Sie acht Fehler in einer Gästereklamation finden und fünf Schwachstellenmuster in einer Klinikbestellung.",
    "Up to here it was about building models. Now it is about judging them: does a model follow the conventions that make it readable for others? And does it show, rule-compliant or not, a good or a bad process? The lab presents the checker's rule catalogue, lets you find eight errors in a guest complaint and five weakness patterns in a hospital order.",
    [("Zwölf Regeln","Twelve rules"),("Fehlersuche","Error hunt"),("Medienbruch · Doppelarbeit","Media break · double work"),("Pingpong · Rückschleife","Ping-pong · loop"),("Wartestelle","Waiting point")]),
  main))

# ---------------------------------------------------------------- Lab 09
heur = [
 (("Eliminierung","Elimination"),("Aufgabe streichen, die keinen Wert schafft (zweite Prüfung, Weiterleitung).","Drop a task that creates no value (second check, forwarding)."),("Zeit, Kosten ↓ · Qualitätsrisiko ↑","Time, cost ↓ · quality risk ↑")),
 (("Zusammenfassung","Composition"),("Kleine Aufgaben zu einer zusammenlegen, ein Bearbeiter.","Merge small tasks into one, one handler."),("Übergaben ↓ · Spezialisierung ↓","Handovers ↓ · specialisation ↓")),
 (("Parallelisierung","Parallelisation"),("Unabhängige Aufgaben gleichzeitig ausführen.","Execute independent tasks at the same time."),("Durchlaufzeit ↓ · Koordination ↑","Lead time ↓ · coordination ↑")),
 (("Bedingte Ausführung","Conditional execution"),("Aufgabe nur, wenn nötig (Material nur bestellen, wenn nicht vorrätig).","Task only if needed (order material only if not in stock)."),("Aufwand ↓ · Gateway und Datenbasis nötig","Effort ↓ · gateway and data basis needed")),
 (("Triage","Triage"),("Fälle nach Aufwand trennen: Standardfall schnell, Sonderfall gründlich.","Separate cases by effort: standard case fast, special case thorough."),("Zeit ↓ · zwei Varianten zu pflegen","Time ↓ · two variants to maintain")),
 (("Automatisierung","Automation"),("Regelbasierte Aufgaben einem System übertragen (Zahnrad-Aufgabe).","Hand rule-based tasks to a system (cog task)."),("Zeit, Kosten ↓ · Investition, Flexibilität ↓","Time, cost ↓ · investment, flexibility ↓")),
 (("Zentralisierung","Centralisation"),("Eine Stelle für alle Fälle statt vieler; oder umgekehrt Dezentralisierung nahe am Kunden.","One unit for all cases instead of many; or conversely decentralisation close to the customer."),("Kosten ↓ · Nähe, Flexibilität ↓","Cost ↓ · proximity, flexibility ↓")),
]
sim = [
 ("Anfrage in Excel-Liste eintragen","10 min","2 h","–","8 €"),("Angebot in Excel kalkulieren","45 min","4 h","–","40 €"),("Angebot per E-Mail senden","5 min","–","–","4 €"),
 ("Auftrag ins ERP abtippen","20 min","8 h","–","16 €"),("Zeichnung prüfen","30 min","4 h","–","30 €"),("Arbeitsplan erstellen","60 min","8 h","–","60 €"),
 ("Material bestellen","15 min","48 h","–","12 €"),("Teile fräsen","240 min","16 h","–","320 €"),("Teile entgraten","40 min","2 h","10 min","35 €"),
 ("Maße prüfen","30 min","1 h","–","30 €"),("Maße nochmals prüfen","30 min","4 h","15 min","30 €"),("Teile verpacken","20 min","1 h","–","15 €"),
 ("Lieferschein von Hand schreiben","15 min","2 h","–","12 €"),("Sendung übergeben","10 min","8 h","–","8 €"),
]
main = '<main class="main-content">\n\n'
main += abschnitt("ist", "Das Ist-Modell", "The as-is model",
  absatz("Der Arbeitsauftrag verlangt ein Ist- und ein Soll-Modell, klar unterscheidbar, mit begründeten Verbesserungen. Das Ist beschreibt, wie heute gearbeitet wird, ohne zu beschönigen: mit dem Fax, der Excel-Liste, der doppelten Prüfung. Es ist die Grundlage der Analyse, nicht ihr Ergebnis.",
          "The assignment requires an as-is and a to-be model, clearly distinguishable, with justified improvements. The as-is describes how work is done today, without embellishment: with the fax, the Excel list, the double check. It is the basis of the analysis, not its result.")
  + modell("modelle/uc20-auftragsabwicklung-ist.bpmn", "UC20 · Auftragsabwicklung im Zerspanungsbetrieb (Ist)", hoch=True)
)
main += abschnitt("heuristiken", "Sieben Umbauvarianten und ihr Preis", "Seven redesign options and their price",
  absatz("Ein erkannter Befund braucht eine Umbauvariante. Reijers und Liman Mansar haben 29 wiederkehrende Eingriffe gesammelt; sieben decken den größten Teil der Praxis ab. Jeder Eingriff verbessert mindestens eine der Zielgrößen Zeit, Kosten, Qualität, Flexibilität und verschlechtert in der Regel eine andere. Diese Wechselwirkung, das Teufelsquadrat, ist der Grund, warum ein Redesign eine Entscheidung ist und keine Optimierung.",
          "A recognised finding needs a redesign option. Reijers and Liman Mansar collected 29 recurring interventions; seven cover most of practice. Every intervention improves at least one of the targets time, cost, quality, flexibility and usually worsens another. This interaction, the devil's quadrangle, is why a redesign is a decision and not an optimisation.")
  + tabelle([("Heuristik","Heuristic"),("Eingriff","Intervention"),("Wirkung und Preis","Effect and price")], heur)
)
main += abschnitt("soll", "Das Soll-Modell", "The to-be model",
  absatz("Das Soll wendet vier Heuristiken an: Automatisierung (Angebot, ERP, Lieferschein), Parallelisierung (Arbeitsplan und Material), bedingte Ausführung (Bestellung nur bei fehlendem Bestand) und Eliminierung (zweite Maßprüfung, Medienbrüche). Es bleibt regelkonform: Blöcke geschlossen, Bedingungen beschriftet, jede Aufgabe in einer Bahn. Und es ist auf den ersten Blick vom Ist unterscheidbar.",
          "The to-be applies four heuristics: automation (offer, ERP, delivery note), parallelisation (work plan and material), conditional execution (order only when stock is missing) and elimination (second measurement, media breaks). It stays rule-compliant: blocks closed, conditions labelled, every task in a lane. And it is distinguishable from the as-is at first glance.")
  + modell("modelle/uc20-auftragsabwicklung-soll.bpmn", "UC20 · Auftragsabwicklung im Zerspanungsbetrieb (Soll)", hoch=True)
)
schritte = [
  ("Ist-Modell in Adonis importieren (Lab 01) und öffnen.","Import the as-is model into Adonis (lab 01) and open it."),
  ("Doppelklick auf eine Aufgabe; die Ansicht von „Kompakt“ auf „Standard mit Simulation“ stellen.","Double-click a task; switch the view from “Compact” to “Standard with simulation”."),
  ("Unter „Simulationsdaten“ Bearbeitungszeit, Liegezeit, Transportzeit und Kosten eintragen; für alle Aufgaben wiederholen.","Under “simulation data” enter processing time, resting time, transport time and cost; repeat for all tasks."),
  ("Rechts oben im Menü mit den drei Punkten „Prozessschrittanalyse“ wählen und mit dem Play-Knopf starten.","Choose “Process step analysis” in the three-dot menu top right and start with the play button."),
  ("An jedem XOR-Gateway den Standardfall wählen (Material vorrätig, Angebot angenommen).","At every XOR gateway choose the standard case (material in stock, offer accepted)."),
  ("Ergebnis nach Excel exportieren; dasselbe für das Soll wiederholen und die Durchlaufzeiten vergleichen.","Export the result to Excel; repeat the same for the to-be and compare the cycle times."),
]
main += abschnitt("simulation", "Simulation in Adonis CE", "Simulation in Adonis CE",
  absatz("Ob der Umbau hält, was er verspricht, zeigt die Simulation. Adonis CE rechnet mit vier Zeitanteilen je Aufgabe (Bearbeitung, Warten, Liegen, Transport) und den Kosten. Die Prozessschrittanalyse läuft einen Pfad durch das Modell und summiert. Die Werte unten sind ein Vorschlag für das Ist; für das Soll setzen Sie automatisierte Aufgaben auf eine Minute und lassen die gestrichenen weg.",
          "Whether the redesign delivers what it promises is shown by the simulation. Adonis CE calculates with four time components per task (processing, waiting, resting, transport) and the cost. The process step analysis runs one path through the model and sums up. The values below are a suggestion for the as-is; for the to-be set automated tasks to one minute and leave out the dropped ones.")
  + '    <div class="table-scroll">\n' + tabelle([("Aufgabe (Ist)","Task (as-is)"),("Bearbeitung","Processing"),("Liegezeit","Resting"),("Transport","Transport"),("Kosten","Cost")], sim) + '    </div>\n'
  + '    <ol class="schritte">\n' + "".join(f'      <li><span lang="de">{a}</span><span lang="en">{b}</span></li>\n' for a,b in schritte) + '    </ol>\n'
  + box("warn-box", "Was die Simulation nicht sagt.", "What the simulation does not say.",
        "Die Prozessschrittanalyse rechnet einen Pfad mit festen Werten. Sie kennt keine Auslastung, keine Warteschlange vor einer knappen Ressource und keine Streuung. Ein Engpass, der erst bei zehn gleichzeitigen Aufträgen entsteht, bleibt unsichtbar. Dafür braucht es eine ereignisdiskrete Simulation (Signavio-Beispiel der Vorlesung) oder echte Ereignisdaten (Process Mining).",
        "The process step analysis calculates one path with fixed values. It knows no utilisation, no queue in front of a scarce resource and no variance. A bottleneck that only arises with ten simultaneous orders stays invisible. That needs a discrete-event simulation (the lecture's Signavio example) or real event data (process mining).")
)
main += uebungen(["P09-01","P09-02","P09-03","P09-04","P09-05"],
  "Fünf Übungen: Ist lesen, Heuristiken zuordnen, Soll lesen, in Adonis simulieren und zuletzt ein eigenes Soll aus dem Ist bauen. Die Adonis-Übung findet außerhalb des Browsers statt; die Fragen prüfen, was Sie dort gesehen haben.",
  "Five exercises: read as-is, assign heuristics, read to-be, simulate in Adonis and finally build your own to-be from the as-is. The Adonis exercise takes place outside the browser; the questions check what you saw there.")
main += zusammenfassung([
  ("Das Ist beschreibt ohne Beschönigung; das Soll wendet begründete Heuristiken an und bleibt regelkonform.", "The as-is describes without embellishment; the to-be applies justified heuristics and stays rule-compliant."),
  ("Jede Heuristik hat einen Preis (Teufelsquadrat); Redesign ist eine Entscheidung.", "Every heuristic has a price (devil's quadrangle); redesign is a decision."),
  ("Die Durchlaufzeit wird von Liege- und Wartezeiten dominiert; dort greift der Umbau.", "Cycle time is dominated by resting and waiting times; that is where the redesign takes effect."),
  ("Die Prozessschrittanalyse in Adonis belegt den Unterschied mit Zahlen, kennt aber keine Auslastung.", "The process step analysis in Adonis substantiates the difference with numbers but knows no utilisation."),
])
Path(ROOT / "lab-09-ist-soll.html").write_text(seite("09", "Vom Ist zum Soll", "From as-is to to-be", "lab-09",
  sb([("ist","Das Ist-Modell","The as-is model"),("heuristiken","Sieben Umbauvarianten","Seven redesign options"),("soll","Das Soll-Modell","The to-be model"),("simulation","Simulation in Adonis CE","Simulation in Adonis CE"),("uebungen","Übungen","Exercises"),("zusammenfassung","Zusammenfassung","Summary")]),
  header("09", "Vom Ist zum Soll", "From as-is to to-be",
    "Ein Ist-Modell ist erst dann fertig, wenn daraus ein Soll geworden ist. Dieses Lab zeigt an der Auftragsabwicklung eines Zerspanungsbetriebs, wie aus den Befunden aus Lab 08 ein begründeter Umbau wird: sieben Heuristiken nach Reijers und Liman Mansar, ihr Preis im Teufelsquadrat, und die Simulation in Adonis CE, mit der sich die Wirkung beziffern lässt. Genau das verlangt der Arbeitsauftrag.",
    "An as-is model is only finished when it has become a to-be. This lab shows, with the order processing of a machining shop, how the findings from lab 08 turn into a justified redesign: seven heuristics after Reijers and Liman Mansar, their price in the devil's quadrangle, and the simulation in Adonis CE with which the effect can be quantified. That is exactly what the assignment requires.",
    [("Ist · Soll","As-is · to-be"),("Sieben Heuristiken","Seven heuristics"),("Teufelsquadrat","Devil's quadrangle"),("Prozessschrittanalyse","Process step analysis"),("Adonis CE","Adonis CE")]),
  main))

# ---------------------------------------------------------------- Lab 10
befund = [
 ("1",("Pools für Krankenhaus, Sanitätshaus, Hausarzt, Krankenkasse, Patient; vier Bahnen; Send-/Receive-Tasks; Nachrichtenflüsse zur Poolkante","Pools for hospital, medical supplier, family doctor, insurer, patient; four lanes; send/receive tasks; message flows to pool edges"),("Notation korrekt, Struktur lesbar","Notation correct, structure readable")),
 ("2",("„Hilfsmittelbedarf prüfen“ in der Bahn Pflege, „bestellen“ beim Sozialdienst","“Hilfsmittelbedarf prüfen” in lane nursing, “bestellen” with social service"),("Zuständigkeiten richtig übernommen","Responsibilities taken over correctly")),
 ("3",("Nicht unterbrechender Timer, Rückfluss in die Warteaufgabe","Non-interrupting timer, flow back into the waiting task"),("<strong>Semantikfehler</strong>: zweite Marke, Prozess läuft doppelt oder blockiert (R10)","<strong>Semantic error</strong>: second token, process runs twice or blocks (R10)")),
 ("4",("„Nicht transportfähig“ springt in die parallele Verzweigung zurück","“Not transportable” jumps back into the parallel split"),("Entlassbrief wird zweimal erstellt; „von vorn“ heißt neue Instanz, nicht Rücksprung","Discharge letter created twice; “from the beginning” means new instance, not jump back")),
 ("5",("Transportfähigkeit erst nach Brief und Hilfsmittel geprüft","Transportability checked only after letter and aid"),("Stille Annahme; der Text lässt es offen, das Modell kennzeichnet es nicht","Silent assumption; the text leaves it open, the model does not flag it")),
 ("6",("„Entlassgespräch führen, Brief &amp; Medikationsplan übergeben“","“Conduct discharge talk, hand over letter &amp; medication plan”"),("Zwei Tätigkeiten in einer Aufgabe (R07)","Two activities in one task (R07)")),
 ("7",("Layout mit Koordinaten, saubere Bahnen","Layout with coordinates, clean lanes"),("Brauchbar; in Adonis nur Feinschliff","Usable; only polish in Adonis")),
]
def liste(punkte):
    return "".join(f'        <li><span lang="de">{a}</span><span lang="en">{b}</span></li>\n' for a,b in punkte)
main = '<main class="main-content">\n\n'
main += abschnitt("versuch", "Der Versuch", "The experiment",
  absatz("Die folgende Prozessbeschreibung wurde ohne weitere Hinweise einem Sprachmodell vorgelegt, mit der Bitte um eine vollständige BPMN-2.0-Datei. Ein Durchgang, keine Rückfragen, keine Validierung. Das Ergebnis liegt unverändert vor und importiert ohne Warnung.",
          "The following process description was given to a language model without further hints, asking for a complete BPMN 2.0 file. One pass, no questions, no validation. The result is available unchanged and imports without warning.")
  + box("concept-box", "Prozessbeschreibung Entlassmanagement.", "Process description discharge management.",
        "Die Stationsärztin entscheidet bei der Visite, dass ein Patient entlassen werden kann. Sie erstellt den Entlassbrief. Parallel dazu prüft die Pflege, ob der Patient ein Hilfsmittel (z. B. Rollator) braucht; falls ja, bestellt der Sozialdienst das Hilfsmittel beim Sanitätshaus und wartet auf dessen Lieferbestätigung. Trifft die Bestätigung nicht innerhalb von 24 Stunden ein, wird der Sozialdienst telefonisch nachfassen. Sobald Entlassbrief und (falls nötig) Hilfsmittel vorliegen, führt die Ärztin das Entlassgespräch mit dem Patienten und übergibt Brief und Medikationsplan. Der Hausarzt erhält den Entlassbrief elektronisch. Die Abrechnung meldet den Fall an die Krankenkasse. Ist der Patient nicht transportfähig, wird stattdessen die Entlassung um einen Tag verschoben und der Prozess beginnt bei der Visite von vorn.",
        "The ward physician decides during the ward round that a patient can be discharged. She writes the discharge letter. In parallel, nursing checks whether the patient needs an aid (e.g. a walker); if so, the social service orders the aid from the medical supplier and waits for its delivery confirmation. If the confirmation does not arrive within 24 hours, the social service follows up by phone. As soon as discharge letter and (if needed) aid are available, the physician conducts the discharge talk with the patient and hands over letter and medication plan. The family doctor receives the discharge letter electronically. Billing reports the case to the health insurer. If the patient is not transportable, the discharge is instead postponed by one day and the process starts over at the ward round.")
  + modell("modelle/ki/uc21-entlassmanagement-ki-rohfassung.bpmn", "UC21 · KI-Rohfassung (unverändert)", hoch=True)
)
main += abschnitt("befund", "Der Befund", "The finding",
  absatz("Sieben Beobachtungen, drei davon Fehler. Keiner der drei ist im Bild auffällig; sie zeigen sich beim Durchspielen mit Marken, im Regelprüfer und in der Frage, welche Annahme das Modell trifft, die im Text nicht steht.",
          "Seven observations, three of them errors. None of the three is conspicuous in the picture; they show when playing through with tokens, in the rule checker and in the question which assumption the model makes that is not in the text.")
  + tabelle([("Nr.","No."),("Beobachtung","Observation"),("Bewertung","Assessment")], befund)
  + absatz("So sieht die geprüfte Fassung aus: Transportfähigkeit zuerst, Verschiebung als eigenes Ende, ereignisbasiertes Gateway für die Lieferbestätigung, eine Tätigkeit je Aufgabe.",
          "This is what the checked version looks like: transportability first, postponement as its own end, event-based gateway for the delivery confirmation, one activity per task.")
  + modell("modelle/uc21-entlassmanagement-geprueft.bpmn", "UC21 · Entlassmanagement (geprüfte Fassung)", hoch=True)
)
main += abschnitt("chancen", "Chancen und Grenzen", "Chances and limits",
  '    <div class="labs-grid" style="grid-template-columns: 1fr 1fr">\n'
  + '      <div class="challenge-box"><h3><span lang="de">Chancen</span><span lang="en">Chances</span></h3><ul>\n' + liste([
      ("Rollen, Aufgaben und Nachrichten vollständig aus dem Text extrahiert.","Roles, tasks and messages fully extracted from the text."),
      ("Notation fehlerfrei; Datei sofort importierbar; Layout brauchbar.","Notation flawless; file imports at once; layout usable."),
      ("Unter fünf Minuten von der Beschreibung zum Entwurf.","Under five minutes from description to draft."),
      ("Als Diskussionsgrundlage für die Erhebung mit den Beteiligten und als Prüfliste nützlich.","Useful as a discussion basis for elicitation with the participants and as a checklist."),
  ]) + '      </ul></div>\n'
  + '      <div class="warn-box"><h3><span lang="de">Grenzen</span><span lang="en">Limits</span></h3><ul>\n' + liste([
      ("Marken-Semantik nicht durchgerechnet: nicht unterbrechender Timer mit Rückfluss.","Token semantics not worked through: non-interrupting timer with flow back."),
      ("Lücken der Beschreibung ohne Kennzeichnung gefüllt: Zeitpunkt der Transportprüfung.","Gaps in the description filled without flagging: timing of the transport check."),
      ("Wiederanlauf als Rücksprung statt als neue Instanz modelliert.","Restart modelled as jump back instead of new instance."),
      ("Benennungskonvention nicht durchgehend eingehalten.","Naming convention not followed throughout."),
      ("Keiner dieser Fehler ist im Bild sichtbar. Die Prüfpflicht bleibt beim Menschen.","None of these errors is visible in the picture. The duty to check stays with the human."),
  ]) + '      </ul></div>\n    </div>\n'
  + box("tip-box", "Das Spektrum der Zusammenarbeit.", "The spectrum of collaboration.",
        "Die Vorlesung ordnet KI-Einsatz zwischen Assistenz und Autonomie ein. Der Versuch zeigt, wo die Grenze heute liegt: Die KI erweitert die Reichweite (Extraktion, Notation, Tempo), der Mensch setzt die Grenzen (Abgrenzung, Annahmen, Abnahme) und trägt die Verantwortung. Der bessere Prompt ist deshalb kein Trick, sondern eine Prozessabgrenzung: Auslöser, Ende, Beteiligte, Grenzen der Organisation, Konventionen und der Auftrag, jede Annahme zu nennen.",
        "The lecture places AI use between assistance and autonomy. The experiment shows where the line lies today: AI extends the reach (extraction, notation, speed), the human sets the limits (scoping, assumptions, acceptance) and bears the responsibility. The better prompt is therefore not a trick but a process scoping: trigger, end, participants, boundaries of the organisation, conventions and the instruction to name every assumption.")
)
main += uebungen(["P10-01","P10-02","P10-03","P10-04","P10-05"],
  "Fünf Übungen: das KI-Modell erkunden, es mit dem Prüfer abnehmen, Chancen und Grenzen belegen, einen eigenen KI-Versuch importieren und reparieren, und einen Prompt als Prozessabgrenzung formulieren.",
  "Five exercises: explore the AI model, accept it with the checker, substantiate chances and limits, import and repair your own AI attempt, and formulate a prompt as a process scoping.")
main += zusammenfassung([
  ("Ein Sprachmodell liefert aus einer Beschreibung ein importierbares, notationskorrektes Modell in Minuten.", "A language model delivers an importable, notation-correct model from a description in minutes."),
  ("Die Fehler liegen in der Semantik: Marken, Wiederanlauf, stille Annahmen. Im Bild sind sie unsichtbar.", "The errors lie in the semantics: tokens, restart, silent assumptions. They are invisible in the picture."),
  ("Abnahme heißt: Marken laufen lassen, Regeln prüfen, Annahmen klären, Verantwortung übernehmen.", "Acceptance means: run tokens, check rules, clarify assumptions, take responsibility."),
  ("Der bessere Prompt ist eine Prozessabgrenzung, mit oder ohne KI.", "The better prompt is a process scoping, with or without AI."),
])
Path(ROOT / "lab-10-ki.html").write_text(seite("10", "KI in der Modellierung", "AI in modelling", "lab-10",
  sb([("versuch","Der Versuch","The experiment"),("befund","Der Befund","The finding"),("chancen","Chancen und Grenzen","Chances and limits"),("uebungen","Übungen","Exercises"),("zusammenfassung","Zusammenfassung","Summary")]),
  header("10", "KI in der Modellierung", "AI in modelling",
    "Kann eine KI die Modellierung komplett übernehmen? Dieses Lab macht den Versuch: Eine Prozessbeschreibung aus dem Entlassmanagement eines Krankenhauses geht ohne weitere Hinweise an ein Sprachmodell, und das Ergebnis wird so abgenommen, wie Sie es in Lab 08 gelernt haben. Die Notation ist fehlerfrei. Die Semantik nicht. Was daraus für Chancen, Grenzen und den besseren Prompt folgt, ist der Inhalt dieses Labs.",
    "Can an AI take over modelling completely? This lab makes the attempt: a process description from a hospital's discharge management goes to a language model without further hints, and the result is accepted the way you learned in lab 08. The notation is flawless. The semantics are not. What follows for chances, limits and the better prompt is the content of this lab.",
    [("KI-Rohfassung","AI raw version"),("Abnahme","Acceptance"),("Chancen · Grenzen","Chances · limits"),("Prompt als Abgrenzung","Prompt as scoping"),("Assistenz statt Autonomie","Assistance instead of autonomy")]),
  main))
print("Labs 08, 09, 10 geschrieben")
