/**
 * PROM-Lab · Laufzeit der Lernumgebung
 *
 * Zustaendig fuer:
 *   - Sprachumschaltung DE/EN (merkt sich die Wahl)
 *   - lebende BPMN-Modelle (bpmn-js Viewer/Modeler, Marken-Simulation, Klick-Erklaerung)
 *   - Aufbau der Uebungsboxen aus data/uebungen/<lab>.json (vier Uebungstypen)
 *   - Fortschrittsanzeige je Lab
 *
 * Ohne Framework, ohne Build-Schritt, ohne fremde Server: Die Seite laesst sich
 * unveraendert auf GitHub Pages legen. Die BPMN-Bibliothek ist mitgeliefert
 * (assets/bpmn/bpmn.mjs) und laeuft vollstaendig im Browser.
 */
import { leseGraph, pruefeRegeln, vergleicheStruktur, REGELN } from './pruefung.js'

/* ------------------------------------------------------------------ Sprache */

const SPRACHSCHLUESSEL = 'prom:sprache'

export function aktuelleSprache () {
  return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'de'
}

function setzeSprache (lang) {
  document.documentElement.setAttribute('data-lang', lang)
  document.documentElement.setAttribute('lang', lang)
  try { localStorage.setItem(SPRACHSCHLUESSEL, lang) } catch { /* Privater Modus */ }
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.classList.toggle('active', b.dataset.langBtn === lang)
    b.setAttribute('aria-pressed', String(b.dataset.langBtn === lang))
  })
  document.querySelectorAll('a[data-lab-link]').forEach(a => {
    const ziel = a.getAttribute('href').split('?')[0]
    a.setAttribute('href', lang === 'en' ? ziel + '?lang=en' : ziel)
  })
  document.dispatchEvent(new CustomEvent('prom:sprache', { detail: { lang } }))
}

export function initSprache () {
  const ausUrl = new URLSearchParams(location.search).get('lang')
  let gespeichert = null
  try { gespeichert = localStorage.getItem(SPRACHSCHLUESSEL) } catch { /* egal */ }
  setzeSprache(ausUrl === 'en' || ausUrl === 'de' ? ausUrl : (gespeichert === 'en' ? 'en' : 'de'))
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.addEventListener('click', () => setzeSprache(b.dataset.langBtn))
  })
}

const txt = (o) => (o == null ? '' : (typeof o === 'string' ? o : (o[aktuelleSprache()] ?? o.de ?? '')))
const menge = (n, formen) => `${n} ${txt(formen)[n === 1 ? 0 : 1]}`

const M = {
  uebung: { de: ['Übung', 'Übungen'], en: ['exercise', 'exercises'] },
  modell: { de: ['Modell', 'Modelle'], en: ['model', 'models'] },
  fehler: { de: ['Fehler', 'Fehler'], en: ['error', 'errors'] }
}

const T = {
  pruefen:     { de: 'Prüfen', en: 'Check' },
  loesung:     { de: 'Musterlösung anzeigen', en: 'Show model solution' },
  loesungZu:   { de: 'Musterlösung ausblenden', en: 'Hide model solution' },
  hinweis:     { de: 'Hinweis', en: 'Hint' },
  leeren:      { de: 'Eingabe leeren', en: 'Clear input' },
  richtig:     { de: 'Richtig.', en: 'Correct.' },
  nochNicht:   { de: 'Noch nicht.', en: 'Not yet.' },
  ok:          { de: 'Erledigt', en: 'Done' },
  fortschritt: { de: 'gelöst', en: 'solved' },
  laden:       { de: 'Modell wird geladen …', en: 'Loading model …' },
  ladeFehler:  { de: 'Das Modell konnte nicht geladen werden.', en: 'The model could not be loaded.' },
  einpassen:   { de: 'Einpassen', en: 'Fit' },
  marke:       { de: 'Marke laufen lassen', en: 'Run a token' },
  markeAus:    { de: 'Simulation beenden', en: 'Stop simulation' },
  gross:       { de: 'Größer', en: 'Larger' },
  klein:       { de: 'Kleiner', en: 'Smaller' },
  klickHilfe:  { de: 'Klicken Sie auf ein Element, um es erklärt zu bekommen.', en: 'Click an element to get it explained.' },
  herunterladen: { de: '.bpmn herunterladen', en: 'Download .bpmn' },
  importieren: { de: '.bpmn importieren', en: 'Import .bpmn' },
  zuklein:     { de: 'Der Editor braucht ein breites Fenster. Laden Sie das Startgerüst als .bpmn herunter und modellieren Sie in Adonis CE, Camunda Modeler oder bpmn.io; die Datei können Sie hier auf einem größeren Bildschirm prüfen.',
                 en: 'The editor needs a wide window. Download the starter as .bpmn and model in Adonis CE, Camunda Modeler or bpmn.io; you can check the file here on a larger screen.' },
  leerenFrage: { de: 'Ihr Modell durch das Startgerüst ersetzen?', en: 'Replace your model with the starter?' },
  loesungFrage:{ de: 'Die Musterlösung anzeigen? Versuchen Sie es vorher noch einmal – es gibt mehrere richtige Modelle.', en: 'Show the model solution? Try once more first – there is more than one correct model.' },
  regeln:      { de: 'Regelprüfung', en: 'Rule check' },
  struktur:    { de: 'Vergleich mit der Aufgabe', en: 'Comparison with the task' },
  keineBefunde:{ de: 'Keine Verstöße gegen die Regeln.', en: 'No rule violations.' },
  fehlerWaehlen: { de: 'Klicken Sie im Modell auf ein Element, das Sie für fehlerhaft halten, und wählen Sie die verletzte Regel.', en: 'Click an element in the model that you consider faulty and choose the violated rule.' },
  regelWaehlen:{ de: 'Regel wählen …', en: 'Choose rule …' },
  gefunden:    { de: 'gefunden', en: 'found' },
  falschMarkiert: { de: 'fälschlich markiert', en: 'wrongly marked' },
  falscheRegel:{ de: 'richtige Stelle, falsche Regel', en: 'right spot, wrong rule' },
  nochOffen:   { de: 'Noch nicht alle Fehler gefunden. Die Zahl oben sagt, wie viele fehlen.', en: 'Not all errors found yet. The number above says how many are missing.' },
  fragenOffen: { de: 'Bitte beantworten Sie alle Fragen.', en: 'Please answer all questions.' },
  weiter:      { de: 'Weiter mit', en: 'Continue with' },
  aufgabe:     { de: 'Aufgabe', en: 'exercise' },
  allesGeloest:{ de: 'Alle Übungen gelöst.', en: 'All exercises solved.' },
  stand:       { de: 'Ihr Stand', en: 'Your progress' },
  loeschen:    { de: 'Lernfortschritt zurücksetzen', en: 'Reset learning progress' },
  loeschenFrage: { de: 'Den vermerkten Lernfortschritt aller Labs löschen? Ihre gespeicherten Modelle im Editor bleiben erhalten.', en: 'Delete the recorded progress of all labs? Your saved editor models remain.' },
  geloescht:   { de: 'Der Lernfortschritt ist gelöscht.', en: 'Learning progress has been deleted.' },
  typ: {
    quiz:     { de: 'Verständnis', en: 'Understanding' },
    erkunden: { de: 'Modell erkunden', en: 'Explore model' },
    fehler:   { de: 'Fehler finden', en: 'Find errors' },
    modell:   { de: 'Selbst modellieren', en: 'Model it yourself' }
  }
}

/* --------------------------------------------------------------------- Labs */

/**
 * Reihenfolge, Umfang, Voraussetzung, Kompetenzziel und Zeitrahmen an einer
 * einzigen Stelle. tools/verify.mjs vergleicht `anzahl` mit den Uebungsdateien.
 */
export const LABS = [
  {
    id: 'lab-01', nr: '01', datei: 'lab-01-grundlagen.html', anzahl: 4,
    titel: { de: 'Warum Prozessmodelle?', en: 'Why process models?' },
    voraussetzung: { de: 'Keine. Dies ist der Anfang.', en: 'None. This is the start.' },
    ziel: { de: 'Sie können erklären, was ein Prozess, eine Instanz und eine Marke sind, wozu BPMN dient und wie eine .bpmn-Datei in Adonis CE hinein- und wieder herauskommt.',
            en: 'You can explain what a process, an instance and a token are, what BPMN is for and how a .bpmn file gets into Adonis CE and out again.' },
    dauer: { de: 'ca. 25 Minuten', en: 'about 25 minutes' }
  },
  {
    id: 'lab-02', nr: '02', datei: 'lab-02-sequenzfluss.html', anzahl: 5,
    titel: { de: 'Aufgaben, Ereignisse, Sequenzfluss', en: 'Activities, events, sequence flow' },
    voraussetzung: { de: 'Lab 01 oder das Wissen, was eine Marke ist.', en: 'Lab 01, or knowing what a token is.' },
    ziel: { de: 'Sie können einen linearen Ablauf modellieren und Aufgaben und Ereignisse regelkonform benennen.',
            en: 'You can model a linear flow and name activities and events according to the conventions.' },
    dauer: { de: 'ca. 30 Minuten', en: 'about 30 minutes' }
  },
  {
    id: 'lab-03', nr: '03', datei: 'lab-03-xor.html', anzahl: 6,
    titel: { de: 'Entscheidungen: das exklusive Gateway', en: 'Decisions: the exclusive gateway' },
    voraussetzung: { de: 'Lab 02. Ein linearer Ablauf sollte Ihnen leicht von der Hand gehen.', en: 'Lab 02. A linear flow should come easily.' },
    ziel: { de: 'Sie können Verzweigungen mit Bedingungen, Standardfluss und Zusammenführung modellieren und Rückschleifen einsetzen.',
            en: 'You can model branches with conditions, default flow and merge, and use loops.' },
    dauer: { de: 'ca. 40 Minuten', en: 'about 40 minutes' }
  },
  {
    id: 'lab-04', nr: '04', datei: 'lab-04-parallel.html', anzahl: 6,
    titel: { de: 'Nebenläufigkeit: parallel und inklusiv', en: 'Concurrency: parallel and inclusive' },
    voraussetzung: { de: 'Lab 03. Das XOR-Gateway sollte sitzen.', en: 'Lab 03. The XOR gateway should be familiar.' },
    ziel: { de: 'Sie können AND- und OR-Gateways unterscheiden, Blöcke sauber schließen und Deadlocks erkennen.',
            en: 'You can tell AND and OR gateways apart, close blocks properly and spot deadlocks.' },
    dauer: { de: 'ca. 40 Minuten', en: 'about 40 minutes' }
  },
  {
    id: 'lab-05', nr: '05', datei: 'lab-05-ereignisse.html', anzahl: 6,
    titel: { de: 'Ereignisse im Ablauf', en: 'Events along the way' },
    voraussetzung: { de: 'Lab 04.', en: 'Lab 04.' },
    ziel: { de: 'Sie können Zwischenereignisse, angeheftete Ereignisse, Fehlerereignisse und das ereignisbasierte Gateway einsetzen.',
            en: 'You can use intermediate events, boundary events, error events and the event-based gateway.' },
    dauer: { de: 'ca. 45 Minuten', en: 'about 45 minutes' }
  },
  {
    id: 'lab-06', nr: '06', datei: 'lab-06-pools.html', anzahl: 6,
    titel: { de: 'Beteiligte: Pools, Bahnen, Nachrichten', en: 'Participants: pools, lanes, messages' },
    voraussetzung: { de: 'Lab 03. Ereignisse aus Lab 05 helfen, sind aber nicht nötig.', en: 'Lab 03. Events from lab 05 help but are not required.' },
    ziel: { de: 'Sie können Kollaborationen modellieren, Sequenz- und Nachrichtenfluss auseinanderhalten und Black-Box-Pools verwenden.',
            en: 'You can model collaborations, separate sequence and message flow and use black-box pools.' },
    dauer: { de: 'ca. 45 Minuten', en: 'about 45 minutes' }
  },
  {
    id: 'lab-07', nr: '07', datei: 'lab-07-struktur.html', anzahl: 5,
    titel: { de: 'Struktur: Teilprozesse, Daten, Schleifen', en: 'Structure: subprocesses, data, loops' },
    voraussetzung: { de: 'Lab 06.', en: 'Lab 06.' },
    ziel: { de: 'Sie können Modelle hierarchisch gliedern, Datenobjekte und Datenspeicher anbinden sowie Mehrfachinstanzen und Schleifen markieren.',
            en: 'You can structure models hierarchically, attach data objects and stores, and mark multi-instances and loops.' },
    dauer: { de: 'ca. 40 Minuten', en: 'about 40 minutes' }
  },
  {
    id: 'lab-08', nr: '08', datei: 'lab-08-qualitaet.html', anzahl: 6,
    titel: { de: 'Modellqualität', en: 'Model quality' },
    voraussetzung: { de: 'Lab 06. Sie sollten Pools und Gateways lesen können.', en: 'Lab 06. You should be able to read pools and gateways.' },
    ziel: { de: 'Sie können die Konventionen anwenden, Fehler in fremden Modellen finden und die fünf Schwachstellenmuster erkennen.',
            en: 'You can apply the conventions, find errors in other people’s models and recognise the five weakness patterns.' },
    dauer: { de: 'ca. 40 Minuten', en: 'about 40 minutes' }
  },
  {
    id: 'lab-09', nr: '09', datei: 'lab-09-ist-soll.html', anzahl: 5,
    titel: { de: 'Vom Ist zum Soll', en: 'From as-is to to-be' },
    voraussetzung: { de: 'Lab 08 und ein Konto für Adonis CE.', en: 'Lab 08 and an Adonis CE account.' },
    ziel: { de: 'Sie können Redesign-Heuristiken anwenden, Ist und Soll unterscheidbar modellieren und die Prozessschrittanalyse in Adonis lesen.',
            en: 'You can apply redesign heuristics, model as-is and to-be distinguishably and read the process step analysis in Adonis.' },
    dauer: { de: 'ca. 60 Minuten', en: 'about 60 minutes' }
  },
  {
    id: 'lab-10', nr: '10', datei: 'lab-10-ki.html', anzahl: 5,
    titel: { de: 'KI in der Modellierung', en: 'AI in modelling' },
    voraussetzung: { de: 'Lab 08. Sie sollten ein Modell prüfen können.', en: 'Lab 08. You should be able to check a model.' },
    ziel: { de: 'Sie können ein KI-generiertes Modell abnehmen, Chancen und Grenzen belegen und einen Prompt als Prozessabgrenzung formulieren.',
            en: 'You can accept an AI-generated model, substantiate chances and limits, and write a prompt as a process scoping.' },
    dauer: { de: 'ca. 45 Minuten', en: 'about 45 minutes' }
  }
]
export const UEBUNGEN_GESAMT = LABS.reduce((n, l) => n + l.anzahl, 0)

/* -------------------------------------------------------------- Fortschritt */

const fortschrittSchluessel = (lab) => `prom:fortschritt:${lab}`

function ladeFortschritt (lab) {
  try { return JSON.parse(localStorage.getItem(fortschrittSchluessel(lab)) || '{}') } catch { return {} }
}
function merkeFortschritt (lab, id) {
  const f = ladeFortschritt(lab)
  f[id] = true
  try { localStorage.setItem(fortschrittSchluessel(lab), JSON.stringify(f)) } catch { /* egal */ }
  document.dispatchEvent(new CustomEvent('prom:fortschritt', { detail: { lab, id } }))
}
function loescheFortschritt () {
  for (const l of LABS) {
    try { localStorage.removeItem(fortschrittSchluessel(l.id)) } catch { /* egal */ }
  }
}

/* -------------------------------------------------------------- Werkzeuge */

const el = (tag, klasse, text) => {
  const n = document.createElement(tag)
  if (klasse) n.className = klasse
  if (text != null) n.textContent = text
  return n
}
const html = (tag, klasse, inhalt) => { const n = el(tag, klasse); n.innerHTML = inhalt; return n }
const basisUrl = new URL('..', import.meta.url)          // Wurzel der Lernumgebung
const url = (pfad) => new URL(pfad, basisUrl).href

let bpmnModul = null
async function ladeBpmn () {
  if (!bpmnModul) bpmnModul = import(url('assets/bpmn/bpmn.mjs')).catch(async e => {
    console.warn('Lokale BPMN-Bibliothek nicht ladbar.', e)
    throw e
  })
  return bpmnModul
}

/* ---------------------------------------------------------- Erklaerungen */

/**
 * Was ein Symbol bedeutet, welche Regel dazugehoert und woran man scheitert.
 * Schluessel: bpmn-Typ, bei Ereignissen mit Ereignisart, bei Fluessen mit
 * "default" fuer den Standardfluss.
 */
const E = {
  'bpmn:Task':      { name: { de: 'Aufgabe', en: 'Task' }, regel: { de: 'Eine Tätigkeit, die jemand oder etwas ausführt. Benennung: Substantiv + Verb im Infinitiv.', en: 'A piece of work someone or something performs. Naming: verb + object.' }, falle: { de: 'Zwei Tätigkeiten in einer Aufgabe („prüfen und buchen“) sind zwei Aufgaben.', en: 'Two activities in one task (“check and book”) are two tasks.' } },
  'bpmn:UserTask':  { name: { de: 'Benutzeraufgabe', en: 'User task' }, regel: { de: 'Eine Aufgabe, die ein Mensch mit Unterstützung eines IT-Systems erledigt.', en: 'A task a person performs with the help of an IT system.' }, falle: { de: 'Die Aufgabentypen sind optional. Ein schlichtes Rechteck ist nie falsch.', en: 'Task types are optional. A plain rectangle is never wrong.' } },
  'bpmn:ServiceTask': { name: { de: 'Serviceaufgabe', en: 'Service task' }, regel: { de: 'Eine Aufgabe, die ein System ohne Menschen ausführt (Zahnrad).', en: 'A task a system performs without a human (cog).' }, falle: { de: 'Automatisiert heißt nicht ohne Verantwortung: Auch eine Serviceaufgabe liegt in einer Bahn.', en: 'Automated does not mean unowned: a service task still lies in a lane.' } },
  'bpmn:ManualTask': { name: { de: 'Manuelle Aufgabe', en: 'Manual task' }, regel: { de: 'Eine Aufgabe ohne jede IT-Unterstützung (Hand).', en: 'A task without any IT support (hand).' }, falle: { de: '', en: '' } },
  'bpmn:SendTask':  { name: { de: 'Sendeaufgabe', en: 'Send task' }, regel: { de: 'Eine Aufgabe, deren Inhalt das Senden einer Nachricht ist (gefüllter Umschlag). Von hier darf ein Nachrichtenfluss ausgehen.', en: 'A task whose content is sending a message (filled envelope). A message flow may leave from here.' }, falle: { de: 'Der Nachrichtenfluss geht zu einem anderen Pool, nie in eine Bahn desselben Pools.', en: 'The message flow goes to another pool, never to a lane of the same pool.' } },
  'bpmn:ReceiveTask': { name: { de: 'Empfangsaufgabe', en: 'Receive task' }, regel: { de: 'Eine Aufgabe, die auf eine Nachricht wartet (leerer Umschlag). Gleichwertig zum eintretenden Nachrichtenereignis.', en: 'A task that waits for a message (empty envelope). Equivalent to a catching message event.' }, falle: { de: 'Ein Rückfluss in eine laufende Empfangsaufgabe erzeugt eine zweite Marke.', en: 'A flow back into a running receive task creates a second token.' } },
  'bpmn:SubProcess': { name: { de: 'Teilprozess', en: 'Subprocess' }, regel: { de: 'Fasst mehrere Schritte zu einem Block zusammen. Aufgeklappt zeigt er seinen Inhalt mit eigenem Start und Ende, zugeklappt nur ein Pluszeichen.', en: 'Groups several steps into one block. Expanded, it shows its content with its own start and end; collapsed, only a plus sign.' }, falle: { de: 'Kein Sequenzfluss kreuzt den Rahmen eines Teilprozesses.', en: 'No sequence flow crosses the frame of a subprocess.' } },
  'bpmn:CallActivity': { name: { de: 'Aufrufaktivität', en: 'Call activity' }, regel: { de: 'Ruft einen eigenständigen, wiederverwendbaren Prozess auf (dicker Rahmen).', en: 'Calls an independent, reusable process (thick border).' }, falle: { de: 'Der aufgerufene Prozess hat ein eigenes Diagramm; hier steht nur sein Name.', en: 'The called process has its own diagram; only its name appears here.' } },
  'bpmn:StartEvent': { name: { de: 'Startereignis', en: 'Start event' }, regel: { de: 'Wo und warum eine Instanz beginnt. Dünner Kreis, benannt als eingetretener Zustand.', en: 'Where and why an instance begins. Thin circle, named as a state that occurred.' }, falle: { de: 'Ein Startereignis hat keinen eingehenden Sequenzfluss.', en: 'A start event has no incoming sequence flow.' } },
  'bpmn:StartEvent:message': { name: { de: 'Nachrichten-Startereignis', en: 'Message start event' }, regel: { de: 'Die Instanz beginnt, weil eine Nachricht von außen eintrifft (Umschlag). Ziel eines Nachrichtenflusses aus einem anderen Pool.', en: 'The instance starts because a message arrives from outside (envelope). Target of a message flow from another pool.' }, falle: { de: 'Ohne Nachrichtenfluss aus einem anderen Pool bleibt der Umschlag eine Behauptung.', en: 'Without a message flow from another pool the envelope is only a claim.' } },
  'bpmn:StartEvent:timer': { name: { de: 'Zeit-Startereignis', en: 'Timer start event' }, regel: { de: 'Die Instanz beginnt zu einem Zeitpunkt oder in einem Rhythmus (Uhr).', en: 'The instance starts at a point in time or on a schedule (clock).' }, falle: { de: 'Ein Rhythmus erzeugt viele Instanzen: täglich um 8 Uhr heißt jeden Tag eine neue.', en: 'A schedule creates many instances: daily at 8 means a new one every day.' } },
  'bpmn:EndEvent':  { name: { de: 'Endereignis', en: 'End event' }, regel: { de: 'Hier endet ein Pfad. Dicker Kreis, benannt als Ergebnis. Mehrere Endereignisse zeigen verschiedene Ausgänge.', en: 'A path ends here. Thick circle, named as a result. Several end events show different outcomes.' }, falle: { de: 'Ein Endereignis beendet nur die Marke, die es erreicht. Andere Marken laufen weiter.', en: 'An end event ends only the token that reaches it. Other tokens keep running.' } },
  'bpmn:EndEvent:message': { name: { de: 'Nachrichten-Endereignis', en: 'Message end event' }, regel: { de: 'Der Pfad endet mit dem Senden einer Nachricht.', en: 'The path ends by sending a message.' }, falle: { de: '', en: '' } },
  'bpmn:EndEvent:terminate': { name: { de: 'Terminierendes Endereignis', en: 'Terminate end event' }, regel: { de: 'Beendet die gesamte Instanz sofort, auch alle anderen Marken (gefüllter Kreis).', en: 'Ends the whole instance immediately, all other tokens included (filled circle).' }, falle: { de: 'Nur nötig, wenn parallel noch etwas läuft, das abgebrochen werden soll.', en: 'Only needed if something is still running in parallel that must be cancelled.' } },
  'bpmn:EndEvent:error': { name: { de: 'Fehler-Endereignis', en: 'Error end event' }, regel: { de: 'Der Pfad endet mit einem Fehler, den ein umgebender Teilprozess an seinem Rand fangen kann.', en: 'The path ends with an error that a surrounding subprocess can catch at its boundary.' }, falle: { de: '', en: '' } },
  'bpmn:IntermediateCatchEvent:message': { name: { de: 'Eintretendes Nachrichtenereignis', en: 'Catching message event' }, regel: { de: 'Die Marke wartet hier, bis eine Nachricht eintrifft (Doppelkreis, leerer Umschlag).', en: 'The token waits here until a message arrives (double circle, empty envelope).' }, falle: { de: 'Wartet die Nachricht nie? Dann bleibt die Instanz für immer stehen. Timer oder ereignisbasiertes Gateway daneben helfen.', en: 'Never arrives? Then the instance waits forever. A timer or an event-based gateway helps.' } },
  'bpmn:IntermediateCatchEvent:timer': { name: { de: 'Zeit-Zwischenereignis', en: 'Timer intermediate event' }, regel: { de: 'Die Marke wartet eine Dauer ab oder bis zu einem Zeitpunkt (Uhr).', en: 'The token waits for a duration or until a point in time (clock).' }, falle: { de: 'Im Ablauf ist es eine Wartestelle und erzeugt Liegezeit; am Rand einer Aufgabe ist es eine Frist.', en: 'In the flow it is a waiting point and creates idle time; on the boundary of a task it is a deadline.' } },
  'bpmn:IntermediateThrowEvent:message': { name: { de: 'Auslösendes Nachrichtenereignis', en: 'Throwing message event' }, regel: { de: 'Die Marke sendet im Vorbeigehen eine Nachricht und läuft sofort weiter (gefüllter Umschlag).', en: 'The token sends a message in passing and continues at once (filled envelope).' }, falle: { de: 'Auslösend (gefüllt) sendet, eintretend (leer) wartet. Die Füllung entscheidet.', en: 'Throwing (filled) sends, catching (empty) waits. The fill decides.' } },
  'bpmn:IntermediateThrowEvent': { name: { de: 'Zwischenereignis', en: 'Intermediate event' }, regel: { de: 'Ein Meilenstein ohne Wirkung auf den Ablauf.', en: 'A milestone without effect on the flow.' }, falle: { de: '', en: '' } },
  'bpmn:BoundaryEvent:error': { name: { de: 'Angeheftetes Fehlerereignis', en: 'Error boundary event' }, regel: { de: 'Tritt während der Aufgabe ein Fehler auf, bricht sie ab und die Marke folgt dem Ausnahmepfad (Blitz, durchgezogener Rand).', en: 'If an error occurs during the task, it is cancelled and the token follows the exception path (lightning, solid border).' }, falle: { de: 'Der Ausnahmepfad braucht ein eigenes Ende oder eine Zusammenführung.', en: 'The exception path needs its own end or a merge.' } },
  'bpmn:BoundaryEvent:timer': { name: { de: 'Angeheftetes Zeitereignis', en: 'Timer boundary event' }, regel: { de: 'Eine Frist an der Aufgabe. Durchgezogen: unterbricht die Aufgabe. Gestrichelt: die Aufgabe läuft weiter, eine zweite Marke startet den Nebenpfad.', en: 'A deadline on the task. Solid: interrupts the task. Dashed: the task keeps running, a second token starts the side path.' }, falle: { de: 'Der Nebenpfad eines nicht unterbrechenden Ereignisses darf nicht in die Aufgabe zurückführen.', en: 'The side path of a non-interrupting event must not lead back into the task.' } },
  'bpmn:BoundaryEvent:message': { name: { de: 'Angeheftetes Nachrichtenereignis', en: 'Message boundary event' }, regel: { de: 'Eine Nachricht, die während der Aufgabe eintreffen kann, etwa eine Stornierung.', en: 'A message that may arrive during the task, such as a cancellation.' }, falle: { de: '', en: '' } },
  'bpmn:BoundaryEvent': { name: { de: 'Angeheftetes Ereignis', en: 'Boundary event' }, regel: { de: 'Ein Ereignis, das während einer Aufgabe eintreten kann.', en: 'An event that may occur during a task.' }, falle: { de: '', en: '' } },
  'bpmn:ExclusiveGateway': { name: { de: 'Exklusives Gateway (XOR)', en: 'Exclusive gateway (XOR)' }, regel: { de: 'Genau ein ausgehender Pfad wird gewählt. Jeder Pfad trägt eine Bedingung; einer kann Standardfluss sein. Als Zusammenführung lässt es jede Marke einzeln passieren.', en: 'Exactly one outgoing path is taken. Every path carries a condition; one may be the default flow. As a merge it lets every token pass on its own.' }, falle: { de: 'Ein Gateway entscheidet nicht, es verteilt. Die Entscheidung fällt in der Aufgabe davor.', en: 'A gateway does not decide, it routes. The decision is made in the task before it.' } },
  'bpmn:ParallelGateway': { name: { de: 'Paralleles Gateway (AND)', en: 'Parallel gateway (AND)' }, regel: { de: 'Alle ausgehenden Pfade werden gleichzeitig beschritten. Als Zusammenführung wartet es, bis auf jedem Pfad eine Marke angekommen ist.', en: 'All outgoing paths are taken at once. As a merge it waits until a token has arrived on every path.' }, falle: { de: 'Eine XOR-Verzweigung mit AND-Zusammenführung wartet ewig (Deadlock).', en: 'An XOR split with an AND join waits forever (deadlock).' } },
  'bpmn:InclusiveGateway': { name: { de: 'Inklusives Gateway (OR)', en: 'Inclusive gateway (OR)' }, regel: { de: 'Ein oder mehrere Pfade, je nach Bedingungen. Die Zusammenführung wartet nur auf die Marken, die tatsächlich unterwegs sind.', en: 'One or more paths, depending on conditions. The merge waits only for the tokens actually on their way.' }, falle: { de: 'Mindestens eine Bedingung muss zutreffen; sonst hilft ein Standardfluss.', en: 'At least one condition must hold; otherwise a default flow helps.' } },
  'bpmn:EventBasedGateway': { name: { de: 'Ereignisbasiertes Gateway', en: 'Event-based gateway' }, regel: { de: 'Der Prozess wartet; das erste eintretende Ereignis der nachfolgenden entscheidet den Weg. Danach stehen nur Ereignisse oder Empfangsaufgaben.', en: 'The process waits; the first of the following events to occur decides the route. Only events or receive tasks follow.' }, falle: { de: 'Keine Bedingungen an den Pfaden: Die Umwelt entscheidet, nicht die Daten.', en: 'No conditions on the paths: the environment decides, not the data.' } },
  'bpmn:SequenceFlow': { name: { de: 'Sequenzfluss', en: 'Sequence flow' }, regel: { de: 'Die Reihenfolge innerhalb eines Pools. Durchgezogene Linie mit gefüllter Spitze.', en: 'The order inside a pool. Solid line with filled arrowhead.' }, falle: { de: 'Ein Sequenzfluss verlässt nie einen Pool.', en: 'A sequence flow never leaves a pool.' } },
  'bpmn:SequenceFlow:default': { name: { de: 'Standardfluss', en: 'Default flow' }, regel: { de: 'Der Pfad, den die Marke nimmt, wenn keine andere Bedingung zutrifft (Schrägstrich am Anfang).', en: 'The path the token takes when no other condition holds (slash at the start).' }, falle: { de: 'Er ersetzt die Bedingung „sonst“, nicht die Frage am Gateway.', en: 'It replaces the condition “otherwise”, not the question at the gateway.' } },
  'bpmn:MessageFlow': { name: { de: 'Nachrichtenfluss', en: 'Message flow' }, regel: { de: 'Ein Austausch zwischen zwei Pools. Gestrichelte Linie, leere Spitze, Kreis am Anfang.', en: 'An exchange between two pools. Dashed line, open arrowhead, circle at the start.' }, falle: { de: 'Nie innerhalb eines Pools, auch nicht zwischen zwei Bahnen.', en: 'Never inside a pool, not even between two lanes.' } },
  'bpmn:Participant': { name: { de: 'Pool', en: 'Pool' }, regel: { de: 'Ein Beteiligter mit eigenem Prozess: Organisation, Rolle, System. Ohne Inhalt ist er eine Black Box.', en: 'A participant with its own process: organisation, role, system. Without content it is a black box.' }, falle: { de: 'Zwei Pools kommunizieren ausschließlich über Nachrichtenflüsse.', en: 'Two pools communicate only via message flows.' } },
  'bpmn:Lane': { name: { de: 'Bahn', en: 'Lane' }, regel: { de: 'Eine Zuständigkeit innerhalb eines Pools. Jede Aufgabe liegt in genau einer Bahn.', en: 'A responsibility inside a pool. Every activity lies in exactly one lane.' }, falle: { de: 'Häufige Bahnwechsel (Pingpong) sind ein Schwachstellenmuster.', en: 'Frequent lane changes (ping-pong) are a weakness pattern.' } },
  'bpmn:DataObjectReference': { name: { de: 'Datenobjekt', en: 'Data object' }, regel: { de: 'Eine Information, die eine Aufgabe braucht oder erzeugt: Formular, Datensatz, Dokument.', en: 'Information a task needs or produces: form, record, document.' }, falle: { de: 'Dieselbe Information als Papier und als Datensatz ist ein Medienbruch.', en: 'The same information as paper and as a record is a media break.' } },
  'bpmn:DataStoreReference': { name: { de: 'Datenspeicher', en: 'Data store' }, regel: { de: 'Ein System, das Daten über die Instanz hinaus aufbewahrt: Datenbank, ERP, Akte.', en: 'A system that keeps data beyond the instance: database, ERP, file.' }, falle: { de: '', en: '' } },
  'bpmn:TextAnnotation': { name: { de: 'Anmerkung', en: 'Annotation' }, regel: { de: 'Freitext ohne Wirkung auf den Ablauf.', en: 'Free text without effect on the flow.' }, falle: { de: '', en: '' } },
  'bpmn:Association': { name: { de: 'Assoziation', en: 'Association' }, regel: { de: 'Verbindet Daten oder Anmerkungen mit Elementen (gepunktet).', en: 'Links data or annotations to elements (dotted).' }, falle: { de: '', en: '' } },
  'bpmn:DataInputAssociation': { name: { de: 'Dateneingabe', en: 'Data input' }, regel: { de: 'Die Aufgabe liest dieses Datenobjekt.', en: 'The task reads this data object.' }, falle: { de: '', en: '' } },
  'bpmn:DataOutputAssociation': { name: { de: 'Datenausgabe', en: 'Data output' }, regel: { de: 'Die Aufgabe erzeugt oder ändert dieses Datenobjekt.', en: 'The task creates or changes this data object.' }, falle: { de: '', en: '' } }
}

function erklaerungFuer (element) {
  const bo = element.businessObject
  let key = element.type
  const ed = bo.eventDefinitions && bo.eventDefinitions[0]
  if (ed) key += ':' + ed.$type.replace('bpmn:', '').replace('EventDefinition', '').toLowerCase()
  if (element.type === 'bpmn:SequenceFlow' && element.source && element.source.businessObject.default === bo) key += ':default'
  const e = E[key] || E[element.type] || null
  const zusatz = []
  if (bo.loopCharacteristics) {
    const mi = bo.loopCharacteristics.$type === 'bpmn:MultiInstanceLoopCharacteristics'
    zusatz.push(mi
      ? (bo.loopCharacteristics.isSequential ? { de: 'Sequenzielle Mehrfachinstanz: je Element der Liste ein Durchlauf, nacheinander (drei waagerechte Striche).', en: 'Sequential multi-instance: one run per list element, one after another (three horizontal bars).' } : { de: 'Parallele Mehrfachinstanz: je Element der Liste ein Durchlauf, gleichzeitig (drei senkrechte Striche).', en: 'Parallel multi-instance: one run per list element, at the same time (three vertical bars).' })
      : { de: 'Schleife: wiederholt sich, bis eine Bedingung erfüllt ist (Pfeil im Kreis).', en: 'Loop: repeats until a condition is met (circular arrow).' })
  }
  if (element.type === 'bpmn:BoundaryEvent' && bo.cancelActivity === false) zusatz.push({ de: 'Nicht unterbrechend (gestrichelt): Die Aufgabe läuft weiter.', en: 'Non-interrupting (dashed): the task keeps running.' })
  const doku = bo.documentation && bo.documentation[0] && bo.documentation[0].text
  return { e, name: bo.name || '', zusatz, doku }
}

/* ------------------------------------------------------------ Modellansicht */

/**
 * Baut ein lebendes Modell: Werkzeugleiste, Diagramm, Erklaerpanel.
 * opts: { datei, xml, name, simulation, hoch, klick, modeler }
 */
export async function baueModell (container, opts = {}) {
  const wrap = el('div', 'modell')
  const leiste = el('div', 'modell-leiste')
  const name = el('span', 'modell-name', opts.name || '')
  const bEin = el('button', 'btn-sm', txt(T.einpassen))
  const bPlus = el('button', 'btn-sm', '+'); bPlus.setAttribute('aria-label', txt(T.gross))
  const bMinus = el('button', 'btn-sm', '−'); bMinus.setAttribute('aria-label', txt(T.klein))
  const bMarke = el('button', 'btn-sm', txt(T.marke))
  leiste.append(name, bEin, bMinus, bPlus)
  if (opts.simulation !== false) leiste.append(bMarke)
  const flaeche = el('div', 'modell-flaeche' + (opts.hoch ? ' hoch' : '') + ' laden')
  flaeche.setAttribute('data-text', txt(T.laden))
  const erkl = el('div', 'modell-erklaerung')
  wrap.append(leiste, flaeche, erkl)
  container.replaceChildren(wrap)

  const M = await ladeBpmn()
  const Klasse = opts.modeler ? M.Modeler : M.NavigatedViewer
  const module = opts.simulation === false ? [] : [opts.modeler ? M.TokenSimulationModule : M.TokenSimulationViewerModule]
  const viewer = new Klasse({ container: flaeche, additionalModules: module })

  const api = { viewer, wrap, flaeche, erkl, xml: null }
  // Das Einpassen scheitert, solange der Rahmen noch keine Groesse hat (etwa
  // waehrend die Seite noch aufgebaut wird). Dann im naechsten Bild erneut.
  api.einpassen = (versuch = 0) => {
    try { viewer.get('canvas').zoom('fit-viewport', 'auto') } catch (e) {
      if (versuch < 5) requestAnimationFrame(() => api.einpassen(versuch + 1))
    }
  }
  api.lade = async (xml) => {
    api.xml = xml
    try {
      await viewer.importXML(xml)
      flaeche.classList.remove('laden', 'fehler')
      api.einpassen()
    } catch (e) {
      flaeche.classList.add('fehler'); flaeche.setAttribute('data-text', txt(T.ladeFehler) + ' ' + e.message)
      throw e
    }
  }
  api.markiere = (id, klasse) => { try { viewer.get('canvas').addMarker(id, klasse) } catch { /* Element fehlt */ } }
  api.entmarkiere = (klasse) => {
    for (const s of viewer.get('elementRegistry').getAll()) { try { viewer.get('canvas').removeMarker(s.id, klasse) } catch { /* egal */ } }
  }
  api.zeige = (id) => { try { viewer.get('canvas').scrollToElement(id) } catch { /* egal */ } }

  bEin.addEventListener('click', () => api.einpassen())
  bPlus.addEventListener('click', () => viewer.get('zoomScroll').stepZoom(1))
  bMinus.addEventListener('click', () => viewer.get('zoomScroll').stepZoom(-1))
  bMarke.addEventListener('click', () => {
    try { viewer.get('toggleMode').toggleMode() } catch (e) { console.warn(e) }
  })
  viewer.on('tokenSimulation.toggleMode', (ev) => {
    const an = ev && ev.active
    bMarke.textContent = txt(an ? T.markeAus : T.marke)
    bMarke.classList.toggle('aktiv', !!an)
  })

  // Klick-Erklaerung
  if (opts.klick !== false) {
    erkl.append(el('div', 'hinweis', txt(T.klickHilfe)))
    const zeige = (element) => {
      if (!element || element.type === 'bpmn:Process' || element.type === 'bpmn:Collaboration' || /label/i.test(element.type)) return
      const { e, name, zusatz, doku } = erklaerungFuer(element)
      erkl.replaceChildren()
      if (!e) { erkl.append(el('div', 'hinweis', element.type.replace('bpmn:', ''))); return }
      erkl.append(el('span', 'symbol', txt(e.name)))
      erkl.append(el('span', 'name', name || '–'))
      erkl.append(el('div', 'regel', txt(e.regel)))
      for (const z of zusatz) erkl.append(el('div', 'regel', txt(z)))
      if (doku) erkl.append(el('div', 'hinweis', doku))
      if (txt(e.falle)) erkl.append(html('div', 'falle', `<strong>${aktuelleSprache() === 'en' ? 'Pitfall:' : 'Stolperfalle:'}</strong> ${txt(e.falle)}`))
      api.entmarkiere('markiert')
      api.markiere(element.id, 'markiert')
      if (opts.onKlick) opts.onKlick(element)
    }
    viewer.on('element.click', (ev) => zeige(ev.element))
  }
  document.addEventListener('prom:sprache', () => {
    bEin.textContent = txt(T.einpassen)
    bMarke.textContent = txt(bMarke.classList.contains('aktiv') ? T.markeAus : T.marke)
    flaeche.setAttribute('data-text', txt(T.laden))
  })

  // Fuer den Bedientest (tools/pruefung/durchlauf.js) von aussen erreichbar.
  api.opts = opts
  ;(document.__promModelle = document.__promModelle || []).push(api)
  if (opts.xml) await api.lade(opts.xml)
  else if (opts.datei) {
    const r = await fetch(url(opts.datei))
    if (!r.ok) { flaeche.classList.add('fehler'); flaeche.setAttribute('data-text', txt(T.ladeFehler)); throw new Error(opts.datei) }
    await api.lade(await r.text())
  }
  return api
}

/** Ersetzt alle `[data-modell]`-Platzhalter einer Seite durch lebende Modelle. */
async function baueModellPlatzhalter () {
  for (const p of document.querySelectorAll('[data-modell]')) {
    const ziel = el('div')
    p.replaceWith(ziel)
    baueModell(ziel, {
      datei: p.dataset.modell, name: p.dataset.name || '', hoch: p.hasAttribute('data-hoch'),
      simulation: !p.hasAttribute('data-ohne-simulation')
    }).catch(e => console.error(e))
  }
}

/* ------------------------------------------------------------- Uebungsbox */

const parseXml = (xml) => new DOMParser().parseFromString(xml, 'application/xml')

function baueFragen (fragen, ziel, uebungId) {
  const bloecke = fragen.map((fr, i) => {
    const block = el('div', 'frage')
    block.append(el('div', 'frage-text', txt(fr.frage)))
    const ul = el('ul', 'optionen')
    const mehrfach = !!fr.mehrfach
    fr.optionen.forEach((o, j) => {
      const li = el('li'); const label = el('label')
      const inp = el('input'); inp.type = mehrfach ? 'checkbox' : 'radio'; inp.name = `${uebungId}-${i}`; inp.value = String(j)
      label.append(inp, el('span', null, txt(o)))
      li.append(label); ul.append(li)
    })
    block.append(ul)
    const erkl = el('div', 'line-hilfe'); erkl.hidden = true
    block.append(erkl)
    ziel.append(block)
    return { fr, block, ul, erkl, mehrfach }
  })
  const aktualisiere = () => {
    bloecke.forEach(({ fr, block, ul }, i) => {
      block.querySelector('.frage-text').textContent = txt(fr.frage)
      ;[...ul.querySelectorAll('label > span')].forEach((s, j) => { s.textContent = txt(fr.optionen[j]) })
    })
  }
  document.addEventListener('prom:sprache', aktualisiere)
  return {
    pruefe () {
      let alleBeantwortet = true; let alleRichtig = true
      for (const { fr, ul, erkl, mehrfach } of bloecke) {
        const gewaehlt = [...ul.querySelectorAll('input:checked')].map(i => +i.value)
        if (!gewaehlt.length) { alleBeantwortet = false; continue }
        const richtig = new Set(fr.richtig)
        const ok = gewaehlt.length === richtig.size && gewaehlt.every(g => richtig.has(g))
        ;[...ul.querySelectorAll('label')].forEach((l, j) => {
          l.classList.toggle('richtig', richtig.has(j) && (ok || gewaehlt.includes(j)))
          l.classList.toggle('falsch', !richtig.has(j) && gewaehlt.includes(j))
        })
        if (!ok) alleRichtig = false
        erkl.hidden = !fr.erklaerung
        erkl.textContent = txt(fr.erklaerung)
        erkl.classList.toggle('falsch-erkl', !ok)
      }
      return { alleBeantwortet, alleRichtig }
    }
  }
}

function status (ziel, art, titel, text) {
  ziel.replaceChildren()
  const line = el('div', 'line ' + art)
  line.append(el('strong', null, titel))
  if (text) line.append(el('span', 'line-hilfe', text))
  ziel.append(line)
  return line
}

function baueBox (uebung, ctx) {
  const box = el('section', 'sqlbox uebung')
  box.id = uebung.id
  box.dataset.typ = uebung.typ
  const head = el('div', 'sqlbox-head')
  head.append(el('span', 'sqlbox-id', uebung.id))
  const titel = el('span', 'sqlbox-title', txt(uebung.titel))
  head.append(titel)
  const typ = el('span', 'uebung-typ', txt(T.typ[uebung.typ]))
  head.append(typ)
  const okMarke = el('span', 'sqlbox-ok'); okMarke.hidden = true
  head.append(okMarke)
  box.append(head)
  const body = el('div', 'sqlbox-body')
  const aufgabe = html('div', 'sqlbox-task', txt(uebung.aufgabe))
  body.append(aufgabe)
  box.append(body)

  const geloestMarkieren = () => {
    okMarke.hidden = false
    okMarke.textContent = '✓ ' + txt(T.ok)
    okMarke.className = 'sqlbox-ok sichtbar'
    merkeFortschritt(ctx.lab, uebung.id)
  }
  if (ladeFortschritt(ctx.lab)[uebung.id]) { okMarke.hidden = false; okMarke.textContent = '✓ ' + txt(T.ok); okMarke.className = 'sqlbox-ok sichtbar' }

  const aktionen = el('div', 'sqlbox-actions')
  const statusZiel = el('div', 'sqlbox-status')
  const bPruefen = el('button', 'btn-sm primary', txt(T.pruefen))

  const hinweis = () => {
    if (!uebung.hinweis) return null
    const d = el('details'); const s = el('summary', null, txt(T.hinweis))
    const p = html('div', 'line-hilfe', txt(uebung.hinweis))
    d.append(s, p)
    document.addEventListener('prom:sprache', () => { s.textContent = txt(T.hinweis); p.innerHTML = txt(uebung.hinweis) })
    return d
  }

  /* ---- Typ D: Verstaendnisfragen, Typ A: Modell + Fragen ---- */
  if (uebung.typ === 'quiz' || uebung.typ === 'erkunden') {
    let modell = null
    if (uebung.typ === 'erkunden' && uebung.modell) {
      const ziel = el('div'); body.append(ziel)
      baueModell(ziel, { datei: uebung.modell, name: uebung.modellName || '', hoch: !!uebung.hoch }).then(m => { modell = m }).catch(e => console.error(e))
    }
    const fragenZiel = el('div'); body.append(fragenZiel)
    const fragen = baueFragen(uebung.fragen || [], fragenZiel, uebung.id)
    aktionen.append(bPruefen)
    body.append(aktionen, statusZiel)
    const h = hinweis(); if (h) body.append(h)
    bPruefen.addEventListener('click', () => {
      const r = fragen.pruefe()
      if (!r.alleBeantwortet) { status(statusZiel, 'note', txt(T.fragenOffen)); return }
      if (r.alleRichtig) { status(statusZiel, 'ok', txt(T.richtig), txt(uebung.rueckmeldung)); geloestMarkieren() } else status(statusZiel, 'fail', txt(T.nochNicht), txt(uebung.hilfe))
    })
  }

  /* ---- Typ B: Fehler finden ---- */
  if (uebung.typ === 'fehler') {
    const ziel = el('div'); body.append(ziel)
    const markierungen = new Map()   // elementId -> { li, select, name }
    const liste = el('ul', 'fehlerliste')
    const leer = el('li', 'leer', txt(T.fehlerWaehlen))
    liste.append(leer)
    let modell = null
    const regelOptionen = (select) => {
      select.replaceChildren()
      const o0 = el('option', null, txt(T.regelWaehlen)); o0.value = ''; select.append(o0)
      for (const r of REGELN) { const o = el('option', null, `${r.id} · ${txt(r)}`); o.value = r.id; select.append(o) }
    }
    baueModell(ziel, {
      datei: uebung.modell, name: uebung.modellName || '', hoch: !!uebung.hoch, simulation: false,
      onKlick: (element) => {
        if (/Flow$/.test(element.type) === false && !['bpmn:Task', 'bpmn:SendTask', 'bpmn:ReceiveTask', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ManualTask', 'bpmn:StartEvent', 'bpmn:EndEvent', 'bpmn:IntermediateCatchEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:BoundaryEvent', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:InclusiveGateway', 'bpmn:EventBasedGateway', 'bpmn:SubProcess', 'bpmn:CallActivity', 'bpmn:Participant', 'bpmn:Lane', 'bpmn:DataObjectReference'].includes(element.type)) return
        if (markierungen.has(element.id)) return
        const li = el('li')
        const name = element.businessObject.name || ''
        const nm = el('span', 'element', name || element.id)
        nm.append(el('small', null, (E[element.type] ? txt(E[element.type].name) : element.type.replace('bpmn:', ''))))
        const select = el('select'); regelOptionen(select)
        const weg = el('button', 'entfernen', '✕'); weg.title = 'entfernen'
        weg.addEventListener('click', () => { li.remove(); markierungen.delete(element.id); modell && modell.entmarkiere('gefunden'); if (modell) { try { modell.viewer.get('canvas').removeMarker(element.id, 'fehler') } catch { /* egal */ } }; leer.hidden = markierungen.size > 0 })
        li.append(nm, select, weg)
        liste.append(li)
        markierungen.set(element.id, { li, select, name })
        leer.hidden = true
        if (modell) modell.markiere(element.id, 'fehler')
      }
    }).then(m => { modell = m }).catch(e => console.error(e))
    body.append(liste)
    const zaehler = el('div', 'fehler-hinweis')
    body.append(zaehler)
    const zaehlerText = () => { zaehler.textContent = `${uebung.fehler.length} ${txt(M.fehler)[1]} · ${aktuelleSprache() === 'en' ? 'find them all' : 'alle finden'}` }
    zaehlerText()
    document.addEventListener('prom:sprache', () => { zaehlerText(); leer.textContent = txt(T.fehlerWaehlen); for (const { select } of markierungen.values()) { const v = select.value; regelOptionen(select); select.value = v } })
    aktionen.append(bPruefen)
    body.append(aktionen, statusZiel)
    const h = hinweis(); if (h) body.append(h)
    bPruefen.addEventListener('click', () => {
      const soll = uebung.fehler   // [{element, regel}]
      let gefunden = 0; let falscheRegel = 0; let falschMarkiert = 0
      const sollIds = new Set(soll.map(f => f.element))
      for (const [id, { select, li }] of markierungen) {
        const treffer = soll.find(f => f.element === id)
        li.classList.remove('richtig', 'falsch')
        if (!treffer) { falschMarkiert++; li.style.borderColor = 'var(--warn)'; continue }
        if (treffer.regel === select.value || (Array.isArray(treffer.regel) && treffer.regel.includes(select.value))) { gefunden++; li.style.borderColor = 'var(--ok)' } else { falscheRegel++; li.style.borderColor = '#C98A00' }
      }
      const fehlt = soll.length - gefunden - falscheRegel
      const text = `${gefunden} / ${soll.length} ${txt(T.gefunden)} · ${falscheRegel} ${txt(T.falscheRegel)} · ${falschMarkiert} ${txt(T.falschMarkiert)}`
      if (gefunden === soll.length && falschMarkiert === 0) { status(statusZiel, 'ok', txt(T.richtig), text + (uebung.rueckmeldung ? ' ' + txt(uebung.rueckmeldung) : '')); geloestMarkieren() } else status(statusZiel, 'fail', txt(T.nochNicht), text + (fehlt > 0 ? ' ' + txt(T.nochOffen) : ''))
      if (modell) for (const id of sollIds) if (markierungen.has(id) && soll.find(f => f.element === id).regel === markierungen.get(id).select.value) modell.markiere(id, 'gefunden')
    })
  }

  /* ---- Typ C: Selbst modellieren ---- */
  if (uebung.typ === 'modell') {
    const editorZiel = el('div'); body.append(editorZiel)
    const zuklein = el('div', 'editor-zuklein', txt(T.zuklein)); body.append(zuklein)
    const speicherKey = `prom:editor:${uebung.id}`
    let editor = null; let geruestXml = null
    const leeresDiagramm = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_${uebung.id}" targetNamespace="https://thws.de/prom-lab">
  <bpmn:process id="Process_${uebung.id}" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_${uebung.id}">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="180" y="160" width="36" height="36" /></bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
    const speichern = async () => {
      if (!editor) return
      try { const { xml } = await editor.viewer.saveXML({ format: false }); localStorage.setItem(speicherKey, xml) } catch { /* egal */ }
    }
    ;(async () => {
      if (uebung.geruest) { const r = await fetch(url(uebung.geruest)); if (r.ok) geruestXml = await r.text() }
      if (!geruestXml) geruestXml = leeresDiagramm
      let start = geruestXml
      try { start = localStorage.getItem(speicherKey) || geruestXml } catch { /* egal */ }
      editor = await baueModell(editorZiel, { xml: start, name: uebung.modellName || '', modeler: true, hoch: true, klick: false })
      editor.wrap.classList.add('editor')
      let timer = null
      editor.viewer.on('commandStack.changed', () => { clearTimeout(timer); timer = setTimeout(speichern, 500) })
    })().catch(e => console.error(e))

    const bDownload = el('button', 'btn-sm', txt(T.herunterladen))
    const bImport = el('button', 'btn-sm', txt(T.importieren))
    const datei = el('input'); datei.type = 'file'; datei.accept = '.bpmn,.xml'; datei.hidden = true
    const bLoesung = el('button', 'btn-sm', txt(T.loesung))
    const bLeeren = el('button', 'btn-sm', txt(T.leeren))
    const spacer = el('span', 'spacer')
    aktionen.append(bPruefen, bDownload, bImport, datei, spacer, bLoesung, bLeeren)
    body.append(aktionen, statusZiel)
    const loesungZiel = el('div'); loesungZiel.hidden = true; body.append(loesungZiel)
    const h = hinweis(); if (h) body.append(h)

    bDownload.addEventListener('click', async () => {
      if (!editor) return
      const { xml } = await editor.viewer.saveXML({ format: true })
      const a = el('a'); a.href = URL.createObjectURL(new Blob([xml], { type: 'application/xml' })); a.download = `${uebung.id}.bpmn`; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    })
    bImport.addEventListener('click', () => datei.click())
    datei.addEventListener('change', async () => {
      const f = datei.files[0]; if (!f || !editor) return
      try { await editor.lade(await f.text()); speichern(); status(statusZiel, 'note', f.name) } catch (e) { status(statusZiel, 'fail', txt(T.ladeFehler), e.message) }
      datei.value = ''
    })
    bLeeren.addEventListener('click', async () => {
      if (!editor || !confirm(txt(T.leerenFrage))) return
      await editor.lade(geruestXml); try { localStorage.removeItem(speicherKey) } catch { /* egal */ }
      statusZiel.replaceChildren()
    })
    let loesungOffen = false
    bLoesung.addEventListener('click', async () => {
      if (loesungOffen) { loesungZiel.hidden = true; loesungOffen = false; bLoesung.textContent = txt(T.loesung); return }
      if (!confirm(txt(T.loesungFrage))) return
      loesungZiel.hidden = false; loesungOffen = true; bLoesung.textContent = txt(T.loesungZu)
      if (!loesungZiel.childElementCount) await baueModell(loesungZiel, { datei: uebung.modell, name: aktuelleSprache() === 'en' ? 'Model solution' : 'Musterlösung', hoch: !!uebung.hoch })
    })
    bPruefen.addEventListener('click', async () => {
      if (!editor) return
      const { xml } = await editor.viewer.saveXML({ format: false })
      const g = leseGraph(parseXml(xml))
      const geruest = new Set(uebung.geruestIds || [])
      const regeln = pruefeRegeln(g, { geruest, ausnahmen: uebung.ausnahmen || [], mehrereStarts: !!uebung.mehrereStarts })
      const struktur = uebung.pruefung ? vergleicheStruktur(g, uebung.pruefung) : []
      editor.entmarkiere('fehler')
      statusZiel.replaceChildren()
      const fehler = regeln.filter(b => b.grad === 'fehler').length + struktur.filter(b => b.grad === 'fehler').length
      const kopf = status(statusZiel, fehler ? 'fail' : 'ok', fehler ? txt(T.nochNicht) : txt(T.richtig), fehler ? '' : txt(uebung.rueckmeldung))
      const listeR = el('ul', 'befunde'); listeR.append(html('li', 'ok', `<strong>${txt(T.regeln)}</strong>`))
      if (!regeln.length) listeR.append(el('li', 'ok', txt(T.keineBefunde)))
      for (const b of regeln) {
        const li = html('li', b.grad === 'fehler' ? 'fehler' : 'warnung', `<span class="regel-id">${b.regel}</span>${txt(b.text)}`)
        if (b.element) { li.addEventListener('click', () => { editor.entmarkiere('fehler'); editor.markiere(b.element, 'fehler'); editor.zeige(b.element) }); editor.markiere(b.element, 'fehler') }
        listeR.append(li)
      }
      statusZiel.append(listeR)
      if (struktur.length) {
        const listeS = el('ul', 'befunde'); listeS.append(html('li', 'ok', `<strong>${txt(T.struktur)}</strong>`))
        for (const b of struktur) listeS.append(el('li', b.grad === 'fehler' ? 'fehler' : 'ok', txt(b.text)))
        statusZiel.append(listeS)
      }
      if (!fehler) geloestMarkieren()
      speichern()
    })
    document.addEventListener('prom:sprache', () => {
      bDownload.textContent = txt(T.herunterladen); bImport.textContent = txt(T.importieren)
      bLoesung.textContent = txt(loesungOffen ? T.loesungZu : T.loesung); bLeeren.textContent = txt(T.leeren)
      zuklein.textContent = txt(T.zuklein)
    })
  }

  document.addEventListener('prom:sprache', () => {
    titel.textContent = txt(uebung.titel); typ.textContent = txt(T.typ[uebung.typ])
    aufgabe.innerHTML = txt(uebung.aufgabe); bPruefen.textContent = txt(T.pruefen)
    if (!okMarke.hidden) okMarke.textContent = '✓ ' + txt(T.ok)
  })
  return box
}

/* ---------------------------------------------------------- Seitenbausteine */

function initTitelUndAlt () {
  const titelDe = document.title
  const meta = document.querySelector('meta[name="prom:titel-en"]')
  const titelEn = meta ? meta.getAttribute('content') : null
  const bilder = [...document.querySelectorAll('img[data-alt-en]')].map(img => ({ img, de: img.getAttribute('alt'), en: img.getAttribute('data-alt-en') }))
  const setzen = () => {
    const en = aktuelleSprache() === 'en'
    if (titelEn) document.title = en ? titelEn : titelDe
    for (const b of bilder) b.img.setAttribute('alt', en ? b.en : b.de)
  }
  document.addEventListener('prom:sprache', setzen)
  setzen()
}

function baueEinordnung (labId) {
  const lab = LABS.find(l => l.id === labId)
  const kopf = document.querySelector('.lab-header')
  if (!lab || !kopf) return
  const dl = el('dl', 'lab-einordnung')
  const felder = () => [
    [{ de: 'Voraussetzung', en: 'Prerequisite' }, txt(lab.voraussetzung)],
    [{ de: 'Sie können danach', en: 'Afterwards you can' }, txt(lab.ziel)],
    [{ de: 'Umfang', en: 'Scope' }, `${menge(lab.anzahl, M.uebung)} · ${txt(lab.dauer)}`]
  ]
  const fuellen = () => {
    dl.replaceChildren()
    for (const [t, w] of felder()) { const z = el('div'); z.append(el('dt', null, txt(t)), el('dd', null, w)); dl.append(z) }
  }
  fuellen()
  document.addEventListener('prom:sprache', fuellen)
  kopf.append(dl)
}

function initSeitennavigation () {
  const links = [...document.querySelectorAll('.sidebar-link[href^="#"]')]
  const abschnitte = links.map(a => ({ link: a, ziel: document.getElementById(a.getAttribute('href').slice(1)) })).filter(e => e.ziel)
  if (!abschnitte.length) return
  const LESEKANTE = 120
  const aktualisieren = () => {
    const amEnde = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
    let treffer = amEnde ? abschnitte[abschnitte.length - 1] : abschnitte[0]
    if (!amEnde) for (const e of abschnitte) if (e.ziel.getBoundingClientRect().top <= LESEKANTE) treffer = e
    for (const e of abschnitte) e.link.classList.toggle('active', e === treffer)
  }
  let geplant = false
  addEventListener('scroll', () => { if (geplant) return; geplant = true; requestAnimationFrame(() => { geplant = false; aktualisieren() }) }, { passive: true })
  addEventListener('resize', aktualisieren, { passive: true })
  aktualisieren()
}

function baueLabNavigation (labId) {
  const i = LABS.findIndex(l => l.id === labId)
  const nav = document.querySelector('.nav-bottom')
  if (i < 0 || !nav) return
  const fuellen = () => {
    nav.replaceChildren()
    const zurueck = i > 0 ? LABS[i - 1] : null; const weiter = i < LABS.length - 1 ? LABS[i + 1] : null
    const a1 = el('a', 'btn', zurueck ? `← Lab ${zurueck.nr} · ${txt(zurueck.titel)}` : (aktuelleSprache() === 'en' ? '← Overview' : '← Zur Übersicht'))
    a1.href = zurueck ? zurueck.datei : 'index.html'; a1.setAttribute('data-lab-link', '')
    const a2 = el('a', 'btn solid', weiter ? `Lab ${weiter.nr} · ${txt(weiter.titel)} →` : (aktuelleSprache() === 'en' ? 'Overview →' : 'Zur Übersicht →'))
    a2.href = weiter ? weiter.datei : 'index.html'; a2.setAttribute('data-lab-link', '')
    if (aktuelleSprache() === 'en') { a1.href += '?lang=en'; a2.href += '?lang=en' }
    nav.append(a1, a2)
  }
  fuellen()
  document.addEventListener('prom:sprache', fuellen)
}

function karteFortschritt () {
  const karten = LABS.map(l => ({ l, karte: document.querySelector(`.lab-card[href^="${l.datei}"]`) })).filter(e => e.karte)
  const fuellen = () => {
    for (const { l, karte } of karten) {
      const geloest = Object.keys(ladeFortschritt(l.id)).length
      let block = karte.querySelector('.lab-fortschritt')
      if (!block) {
        block = el('div', 'lab-fortschritt')
        const balken = el('div', 'balken'); balken.append(el('i'))
        block.append(el('span'), balken)
        const meta = karte.querySelector('.meta')
        if (meta) meta.before(block); else karte.append(block)
      }
      block.querySelector('span').textContent = `${geloest} / ${menge(l.anzahl, M.uebung)} ${txt(T.fortschritt)}`
      const balken = block.querySelector('.balken')
      balken.classList.toggle('voll', geloest === l.anzahl)
      balken.querySelector('i').style.width = Math.round(geloest / l.anzahl * 100) + '%'
      const nummer = karte.querySelector('.lab-num')
      let haken = nummer && nummer.querySelector('.lab-haken')
      if (geloest === l.anzahl && nummer && !haken) { haken = el('span', 'lab-haken', '✓'); haken.setAttribute('aria-hidden', 'true'); nummer.append(haken) } else if (geloest < l.anzahl && haken) haken.remove()
    }
  }
  fuellen()
  document.addEventListener('prom:sprache', fuellen)
  document.addEventListener('prom:fortschritt', fuellen)
}

async function baueGesamtfortschritt (ziel, basis) {
  const panel = el('div', 'fortschritt-panel')
  const fuellen = async () => {
    panel.replaceChildren()
    const gesamt = LABS.reduce((n, l) => n + Object.keys(ladeFortschritt(l.id)).length, 0)
    const kopf = el('div', 'fortschritt-kopf')
    kopf.append(el('span', 'fortschritt-titel', txt(T.stand)))
    const zahl = el('span', 'fortschritt-zahl', `${gesamt} / ${UEBUNGEN_GESAMT} `)
    zahl.append(el('small', null, txt(T.fortschritt)))
    kopf.append(zahl)
    panel.append(kopf)
    const balken = el('div', 'balken'); balken.append(el('i')); balken.querySelector('i').style.width = Math.round(gesamt / UEBUNGEN_GESAMT * 100) + '%'
    balken.classList.toggle('voll', gesamt === UEBUNGEN_GESAMT)
    panel.append(balken)
    const aktionen = el('div', 'fortschritt-aktionen')
    const naechstes = LABS.find(l => Object.keys(ladeFortschritt(l.id)).length < l.anzahl)
    if (naechstes) {
      let anker = ''
      try {
        const r = await fetch(`${basis}/data/uebungen/${naechstes.id}.json`)
        if (r.ok) { const ue = await r.json(); const f = ladeFortschritt(naechstes.id); const offen = ue.find(u => !f[u.id]); if (offen) anker = '#' + offen.id }
      } catch { /* egal */ }
      const a = el('a', 'btn solid', `${txt(T.weiter)} Lab ${naechstes.nr}${anker ? ' · ' + txt(T.aufgabe) + ' ' + anker.slice(1) : ''}`)
      a.href = naechstes.datei + (aktuelleSprache() === 'en' ? '?lang=en' : '') + anker
      aktionen.append(a)
    } else aktionen.append(el('span', null, txt(T.allesGeloest)))
    aktionen.append(el('span', 'spacer'))
    const reset = el('button', 'btn-sm', txt(T.loeschen))
    reset.addEventListener('click', () => {
      if (!confirm(txt(T.loeschenFrage))) return
      loescheFortschritt(); document.dispatchEvent(new CustomEvent('prom:fortschritt')); fuellen()
    })
    aktionen.append(reset)
    panel.append(aktionen)
  }
  await fuellen()
  document.addEventListener('prom:sprache', fuellen)
  ziel.replaceWith(panel)
}

/* ----------------------------------------------------------------- Einstieg */

export async function starteUebersicht ({ basis = '.' } = {}) {
  initSprache()
  initTitelUndAlt()
  karteFortschritt()
  const standPlatz = document.querySelector('[data-fortschritt]')
  if (standPlatz) await baueGesamtfortschritt(standPlatz, basis)
  baueModellPlatzhalter()
}

export async function starteLab ({ lab, basis = '.' }) {
  initSprache()
  initTitelUndAlt()
  baueEinordnung(lab)
  initSeitennavigation()
  baueLabNavigation(lab)
  baueModellPlatzhalter()
  const platzhalter = [...document.querySelectorAll('[data-uebung]')]
  if (!platzhalter.length) return
  let uebungen = []
  try {
    const r = await fetch(`${basis}/data/uebungen/${lab}.json`)
    if (!r.ok) throw new Error(`data/uebungen/${lab}.json fehlt`)
    uebungen = await r.json()
  } catch (e) { console.error(e); return }
  for (const p of platzhalter) {
    const u = uebungen.find(x => x.id === p.dataset.uebung)
    if (!u) { console.warn('Übung nicht definiert:', p.dataset.uebung); continue }
    p.replaceWith(baueBox(u, { lab, basis }))
  }
  // Anker auf eine Uebung erst nach dem Aufbau anspringen
  if (location.hash) { const z = document.querySelector(location.hash); if (z) setTimeout(() => z.scrollIntoView({ block: 'start' }), 80) }
}
