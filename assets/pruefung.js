/**
 * PROM-Lab · Regelpruefer und Strukturvergleich fuer BPMN-Modelle
 *
 * Wird von der Webseite (assets/prom.js) UND vom Pruefwerkzeug
 * (tools/verify.mjs) benutzt. Deshalb kommt die Datei ohne Browser-APIs aus:
 * Sie erwartet ein bereits geparstes XML-Dokument (DOM) und arbeitet auf
 * einem daraus gewonnenen, schlanken Graphen.
 *
 * Regelkatalog (Folie 215 der Vorlesung, Freund/Rücker, Silver):
 *   R01 genau ein Startereignis je Prozess
 *   R02 jeder Pfad erreicht ein Endereignis; kein offenes Ende
 *   R03 jeder ausgehende Fluss eines XOR/OR-Gateways traegt eine Bedingung oder ist Standardfluss
 *   R04 ein Gateway verzweigt ODER fuehrt zusammen, nicht beides
 *   R05 Verzweigung und Zusammenfuehrung eines Blocks haben denselben Typ (Warnung)
 *   R06 Sequenzfluss bleibt im Pool; Nachrichtenfluss verbindet verschiedene Pools
 *   R07 Aufgabe = Substantiv + Verb im Infinitiv; Ereignis = Zustand (Warnung)
 *   R08 jede Aufgabe liegt in genau einer Bahn, wenn es Bahnen gibt
 *   R09 nach einem ereignisbasierten Gateway folgen nur empfangende Ereignisse oder Receive-Tasks
 *   R10 der Ausnahmepfad eines Randereignisses fuehrt nicht in seine Aufgabe zurueck
 *   R11 Elemente sind beschriftet (Warnung; Zusammenfuehrungen und Gerueste ausgenommen)
 *   R12 Rueckspruenge sind selten (Warnung ab drei)
 */

const BPMN = 'http://www.omg.org/spec/BPMN/20100524/MODEL'
const DI = 'http://www.omg.org/spec/BPMN/20100524/DI'
const DC = 'http://www.omg.org/spec/DD/20100524/DC'

const AKTIVITAETEN = new Set(['task', 'userTask', 'serviceTask', 'manualTask', 'sendTask', 'receiveTask',
  'scriptTask', 'businessRuleTask', 'subProcess', 'callActivity', 'adHocSubProcess', 'transaction'])
const GATEWAYS = new Set(['exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway', 'complexGateway'])
const EREIGNISSE = new Set(['startEvent', 'endEvent', 'intermediateCatchEvent', 'intermediateThrowEvent', 'boundaryEvent'])
const FLUSSKNOTEN = new Set([...AKTIVITAETEN, ...GATEWAYS, ...EREIGNISSE])

const kinder = (el, name) => [...el.childNodes].filter(c => c.nodeType === 1 && c.localName === name && c.namespaceURI === BPMN)
const alle = (el, name) => [...el.getElementsByTagNameNS(BPMN, name)]

/** Liest aus einem BPMN-DOM einen Graphen: Knoten, Fluesse, Pools, Bahnen, Geometrie. */
export function leseGraph (doc) {
  const g = { knoten: new Map(), fluesse: [], nachrichten: [], pools: [], bahnen: [], prozesse: [] }
  const defs = doc.documentElement

  for (const p of alle(defs, 'participant')) {
    g.pools.push({ id: p.getAttribute('id'), name: p.getAttribute('name') || '', prozess: p.getAttribute('processRef') })
  }
  for (const m of alle(defs, 'messageFlow')) {
    g.nachrichten.push({ id: m.getAttribute('id'), name: m.getAttribute('name') || '', von: m.getAttribute('sourceRef'), nach: m.getAttribute('targetRef') })
  }

  const leseProzess = (proc, prozessId, teilprozessVon) => {
    for (const c of [...proc.childNodes].filter(c => c.nodeType === 1 && c.namespaceURI === BPMN)) {
      const typ = c.localName
      if (typ === 'sequenceFlow') {
        g.fluesse.push({ id: c.getAttribute('id'), name: c.getAttribute('name') || '', von: c.getAttribute('sourceRef'), nach: c.getAttribute('targetRef'), prozess: prozessId })
        continue
      }
      if (typ === 'laneSet') {
        for (const lane of alle(c, 'lane')) {
          g.bahnen.push({
            id: lane.getAttribute('id'), name: lane.getAttribute('name') || '', prozess: prozessId,
            knoten: kinder(lane, 'flowNodeRef').map(r => r.textContent.trim())
          })
        }
        continue
      }
      if (!FLUSSKNOTEN.has(typ) && !['dataObjectReference', 'dataStoreReference', 'textAnnotation'].includes(typ)) continue
      const k = {
        id: c.getAttribute('id'), typ, name: c.getAttribute('name') || '', prozess: prozessId,
        teilprozessVon, ein: [], aus: [],
        standard: c.getAttribute('default') || null,
        haengtAn: c.getAttribute('attachedToRef') || null,
        unterbrechend: c.getAttribute('cancelActivity') !== 'false',
        ereignis: null
      }
      for (const ed of [...c.childNodes].filter(x => x.nodeType === 1 && /EventDefinition$/.test(x.localName))) {
        k.ereignis = ed.localName.replace('EventDefinition', '')
      }
      k.schleife = [...c.childNodes].some(x => x.nodeType === 1 && /LoopCharacteristics$/.test(x.localName))
      g.knoten.set(k.id, k)
      if (typ === 'subProcess') leseProzess(c, prozessId, k.id)
    }
  }
  for (const proc of alle(defs, 'process')) {
    const id = proc.getAttribute('id')
    g.prozesse.push({ id, name: proc.getAttribute('name') || '' })
    leseProzess(proc, id, null)
  }
  for (const f of g.fluesse) {
    const v = g.knoten.get(f.von); const n = g.knoten.get(f.nach)
    if (v) v.aus.push(f)
    if (n) n.ein.push(f)
  }
  // Geometrie aus dem DI-Teil
  for (const s of [...defs.getElementsByTagNameNS(DI, 'BPMNShape')]) {
    const b = s.getElementsByTagNameNS(DC, 'Bounds')[0]
    const ziel = g.knoten.get(s.getAttribute('bpmnElement')) ||
      g.bahnen.find(l => l.id === s.getAttribute('bpmnElement')) ||
      g.pools.find(p => p.id === s.getAttribute('bpmnElement'))
    if (ziel && b) ziel.box = { x: +b.getAttribute('x'), y: +b.getAttribute('y'), w: +b.getAttribute('width'), h: +b.getAttribute('height') }
  }
  return g
}

const istAktivitaet = k => AKTIVITAETEN.has(k.typ)
const istGateway = k => GATEWAYS.has(k.typ)
const poolVon = (g, k) => g.pools.find(p => p.prozess === k.prozess)

/** Verb im Infinitiv am Ende (DE) oder am Anfang (EN)? Heuristik, deshalb nur Warnung. */
function benennungAufgabeOk (name) {
  const w = name.trim().split(/\s+/)
  if (w.length < 2) return false
  const letztes = w[w.length - 1].toLowerCase()
  const erstes = w[0].toLowerCase()
  if (/(en|ern|eln|n)$/.test(letztes) && !/^(wird|werden|ist|sind)$/.test(erstes)) return true   // DE: "... prüfen"
  if (/^(check|create|send|receive|review|prepare|assign|record|verify|order|ship|pay|inform|process|approve|reject|call|load|book|pack|test|plan|collect|enter|print|update|open|close|deliver|schedule|notify|issue|confirm|cancel|register|forward|file|repair|install|start|stop|run|clean|cook|bake|serve|fill|grind|brew|hand|take|put|store|label|draw|weigh|examine|treat|admit|discharge|escalate|dispatch|unload|inspect|release|block)$/.test(erstes)) return true
  return false
}
function benennungEreignisOk (name) {
  const n = name.trim()
  if (!n) return true
  if (/[:\d]/.test(n)) return true
  if (/\s(in|im|auf|zur|zum|bei)\s|steht an$|liegt vor$|ist da$/i.test(n)) return true   // Zustandsangabe: „Patient in Behandlung“
  return /(t|en|ed|ar|ig|os|ich|frei|da|kalt|bereit|möglich|verfügbar|abgelaufen|verstrichen|erhalten|eingegangen|received|arrived|done|due|expired|elapsed|ready|available|reached|passed|placed|opened|closed)$/i.test(n)
}

/**
 * Prueft einen Graphen gegen den Regelkatalog.
 * @param {object} g Graph aus leseGraph
 * @param {object} opt { geruest: Set<id> (unbeschriftet erlaubt), mehrereStarts: bool, ausnahmen: string[] }
 * @returns {Array<{regel, grad:'fehler'|'warnung', element, text:{de,en}}>}
 */
export function pruefeRegeln (g, opt = {}) {
  const b = []
  const aus = new Set(opt.ausnahmen || [])
  const melde = (regel, grad, element, de, en) => { if (!aus.has(regel)) b.push({ regel, grad, element, text: { de, en } }) }
  const knoten = [...g.knoten.values()]
  const fluss = knoten.filter(k => FLUSSKNOTEN.has(k.typ))

  // R01 Startereignisse je Prozess (Teilprozesse getrennt)
  const gruppen = new Map()
  for (const k of fluss) {
    const key = k.teilprozessVon || k.prozess
    if (!gruppen.has(key)) gruppen.set(key, [])
    gruppen.get(key).push(k)
  }
  for (const [key, ks] of gruppen) {
    const starts = ks.filter(k => k.typ === 'startEvent')
    if (ks.length && starts.length === 0) melde('R01', 'fehler', null, `Der Prozess „${key}“ hat kein Startereignis.`, `Process “${key}” has no start event.`)
    if (starts.length > 1 && !opt.mehrereStarts) melde('R01', 'warnung', starts[1].id, `Mehrere Startereignisse in „${key}“. Erlaubt, aber nur sinnvoll, wenn verschiedene Auslöser denselben Prozess starten.`, `Several start events in “${key}”. Allowed, but only meaningful if different triggers start the same process.`)
    const enden = ks.filter(k => k.typ === 'endEvent')
    if (ks.length && enden.length === 0) melde('R02', 'fehler', null, `Der Prozess „${key}“ hat kein Endereignis.`, `Process “${key}” has no end event.`)
  }

  // R02 offene Enden und unerreichbare Knoten
  for (const k of fluss) {
    if (k.typ === 'endEvent' || k.teilprozessVon) continue
    if (k.aus.length === 0 && !(k.typ === 'boundaryEvent' && !k.unterbrechend && opt.randOhneAusgang)) {
      melde('R02', 'fehler', k.id, `„${k.name || k.typ}“ hat keinen ausgehenden Sequenzfluss. Jeder Pfad muss ein Endereignis erreichen.`, `“${k.name || k.typ}” has no outgoing sequence flow. Every path must reach an end event.`)
    }
    if (k.ein.length === 0 && k.typ !== 'startEvent' && k.typ !== 'boundaryEvent') {
      melde('R02', 'fehler', k.id, `„${k.name || k.typ}“ hat keinen eingehenden Sequenzfluss und wird nie erreicht.`, `“${k.name || k.typ}” has no incoming sequence flow and is never reached.`)
    }
  }

  // R03 Bedingungen an XOR/OR
  for (const k of fluss) {
    if ((k.typ === 'exclusiveGateway' || k.typ === 'inclusiveGateway') && k.aus.length > 1) {
      for (const f of k.aus) {
        if (!f.name.trim() && k.standard !== f.id) {
          melde('R03', 'fehler', f.id, `Ein ausgehender Pfad des Gateways „${k.name || k.id}“ trägt keine Bedingung.`, `An outgoing path of gateway “${k.name || k.id}” carries no condition.`)
        }
      }
    }
  }

  // R04 Gateway verzweigt oder fuehrt zusammen
  for (const k of fluss) {
    if (istGateway(k) && k.ein.length > 1 && k.aus.length > 1) {
      melde('R04', 'warnung', k.id, `Das Gateway „${k.name || k.id}“ führt zusammen und verzweigt zugleich. Lesbarer sind zwei Gateways.`, `Gateway “${k.name || k.id}” both merges and splits. Two gateways read better.`)
    }
  }

  // R05 Blocktyp: Verzweigung X, Zusammenfuehrung Y (einfache Heuristik: naechstes Gateway, in das alle Pfade muenden)
  for (const k of fluss) {
    if (!istGateway(k) || k.aus.length < 2 || k.typ === 'eventBasedGateway') continue
    const treff = new Map()
    for (const f of k.aus) {
      let cur = g.knoten.get(f.nach); let n = 0
      while (cur && n < 12) {
        if (istGateway(cur) && cur.ein.length > 1) { treff.set(cur.id, (treff.get(cur.id) || 0) + 1); break }
        if (cur.aus.length !== 1) break
        cur = g.knoten.get(cur.aus[0].nach); n++
      }
    }
    for (const [id, n] of treff) {
      const z = g.knoten.get(id)
      if (n === k.aus.length && z.typ !== k.typ && !(k.typ === 'exclusiveGateway' && z.typ === 'exclusiveGateway')) {
        const de = k.typ === 'exclusiveGateway' && z.typ === 'parallelGateway'
          ? `Die Verzweigung „${k.name || k.id}“ ist exklusiv, die Zusammenführung „${z.id}“ parallel: Sie wartet auf Marken, die nie kommen (Deadlock).`
          : k.typ === 'parallelGateway' && z.typ === 'exclusiveGateway'
            ? `Die Verzweigung „${k.name || k.id}“ ist parallel, die Zusammenführung „${z.id}“ exklusiv: Jede Marke läuft einzeln weiter, der Rest des Prozesses läuft mehrfach.`
            : `Verzweigung „${k.name || k.id}“ (${k.typ}) und Zusammenführung „${z.id}“ (${z.typ}) haben verschiedene Typen.`
        const en = k.typ === 'exclusiveGateway' && z.typ === 'parallelGateway'
          ? `Split “${k.name || k.id}” is exclusive, join “${z.id}” is parallel: it waits for tokens that never arrive (deadlock).`
          : k.typ === 'parallelGateway' && z.typ === 'exclusiveGateway'
            ? `Split “${k.name || k.id}” is parallel, join “${z.id}” is exclusive: every token continues on its own, the rest of the process runs several times.`
            : `Split “${k.name || k.id}” (${k.typ}) and join “${z.id}” (${z.typ}) differ in type.`
        melde('R05', k.typ === 'inclusiveGateway' || z.typ === 'inclusiveGateway' ? 'warnung' : 'fehler', z.id, de, en)
      }
    }
  }

  // R06 Fluesse und Pools
  for (const f of g.fluesse) {
    const v = g.knoten.get(f.von); const n = g.knoten.get(f.nach)
    if (v && n && v.prozess !== n.prozess) {
      melde('R06', 'fehler', f.id, `Der Sequenzfluss von „${v.name || v.id}“ nach „${n.name || n.id}“ überquert eine Poolgrenze. Zwischen Pools gibt es nur Nachrichtenflüsse.`, `The sequence flow from “${v.name || v.id}” to “${n.name || n.id}” crosses a pool boundary. Between pools there are only message flows.`)
    }
  }
  for (const m of g.nachrichten) {
    const v = g.knoten.get(m.von); const n = g.knoten.get(m.nach)
    const pv = v ? poolVon(g, v) : g.pools.find(p => p.id === m.von)
    const pn = n ? poolVon(g, n) : g.pools.find(p => p.id === m.nach)
    if (pv && pn && pv.id === pn.id) {
      melde('R06', 'fehler', m.id, `Der Nachrichtenfluss „${m.name || m.id}“ verläuft innerhalb des Pools „${pv.name}“. Innerhalb eines Pools gibt es nur Sequenzflüsse.`, `Message flow “${m.name || m.id}” runs inside pool “${pv.name}”. Inside a pool there are only sequence flows.`)
    }
  }

  // R07 Benennung
  for (const k of fluss) {
    if (opt.geruest && opt.geruest.has(k.id)) continue
    if (istAktivitaet(k) && k.name.trim() && !benennungAufgabeOk(k.name)) {
      melde('R07', 'warnung', k.id, `„${k.name}“: Aufgaben heißen Substantiv + Verb im Infinitiv, etwa „Rechnung prüfen“.`, `“${k.name}”: activities are named verb + object, e.g. “check invoice”.`)
    }
    if (EREIGNISSE.has(k.typ) && k.name.trim() && !benennungEreignisOk(k.name)) {
      melde('R07', 'warnung', k.id, `„${k.name}“: Ereignisse beschreiben einen eingetretenen Zustand, etwa „Bestellung eingegangen“.`, `“${k.name}”: events describe a state that has occurred, e.g. “order received”.`)
    }
  }

  // R08 Bahnen: jede Aktivitaet in genau einer Bahn (ueber flowNodeRef ODER Geometrie)
  for (const proz of g.prozesse) {
    const bahnen = g.bahnen.filter(l => l.prozess === proz.id)
    if (!bahnen.length) continue
    for (const k of fluss.filter(k => k.prozess === proz.id && !k.teilprozessVon && k.typ !== 'boundaryEvent')) {
      const perRef = bahnen.filter(l => l.knoten.includes(k.id)).length
      let perGeo = 0
      if (k.box) {
        const cx = k.box.x + k.box.w / 2; const cy = k.box.y + k.box.h / 2
        perGeo = bahnen.filter(l => l.box && cx >= l.box.x && cx <= l.box.x + l.box.w && cy >= l.box.y && cy <= l.box.y + l.box.h).length
      }
      if (perRef === 0 && perGeo === 0) melde('R08', 'fehler', k.id, `„${k.name || k.id}“ liegt in keiner Bahn.`, `“${k.name || k.id}” lies in no lane.`)
      if (perRef > 1) melde('R08', 'fehler', k.id, `„${k.name || k.id}“ ist mehreren Bahnen zugeordnet.`, `“${k.name || k.id}” is assigned to several lanes.`)
    }
  }

  // R09 ereignisbasiertes Gateway
  for (const k of fluss) {
    if (k.typ !== 'eventBasedGateway') continue
    for (const f of k.aus) {
      const n = g.knoten.get(f.nach)
      if (n && !(n.typ === 'intermediateCatchEvent' || n.typ === 'receiveTask')) {
        melde('R09', 'fehler', n.id, `Nach dem ereignisbasierten Gateway folgt „${n.name || n.typ}“. Dort dürfen nur eintretende Ereignisse oder empfangende Aufgaben stehen.`, `After the event-based gateway comes “${n.name || n.typ}”. Only catching events or receive tasks may follow.`)
      }
    }
  }

  // R10 Randereignis fuehrt nicht in seine Aufgabe zurueck (Marken-Verdopplung bei nicht unterbrechend)
  for (const k of fluss) {
    if (k.typ !== 'boundaryEvent') continue
    const gesehen = new Set(); const stapel = k.aus.map(f => f.nach); let n = 0
    while (stapel.length && n++ < 200) {
      const id = stapel.pop()
      if (gesehen.has(id)) continue
      gesehen.add(id)
      if (id === k.haengtAn) {
        melde('R10', k.unterbrechend ? 'warnung' : 'fehler', k.id, `Der Ausnahmepfad des Randereignisses „${k.name || k.id}“ führt in die Aufgabe zurück, an der es hängt.${k.unterbrechend ? '' : ' Da es nicht unterbricht, läuft die Aufgabe weiter und erhält eine zweite Marke.'}`, `The exception path of boundary event “${k.name || k.id}” leads back into the activity it is attached to.${k.unterbrechend ? '' : ' Since it is non-interrupting, the activity keeps running and receives a second token.'}`)
        break
      }
      const z = g.knoten.get(id)
      if (z && z.typ !== 'endEvent') for (const f of z.aus) stapel.push(f.nach)
    }
  }

  // R11 Beschriftung
  for (const k of fluss) {
    if (opt.geruest && opt.geruest.has(k.id)) continue
    if (k.name.trim()) continue
    if (istGateway(k) && k.aus.length <= 1) continue           // Zusammenfuehrung
    if (istGateway(k) && k.typ === 'parallelGateway') continue  // AND braucht keine Frage
    if (istGateway(k) && k.typ === 'eventBasedGateway') continue
    if (k.typ === 'intermediateThrowEvent' && !k.ereignis) continue
    melde('R11', 'warnung', k.id, `Ein Element vom Typ ${k.typ} ist nicht beschriftet.`, `An element of type ${k.typ} is unlabelled.`)
  }

  // R12 Rueckspruenge
  let rueck = 0
  for (const f of g.fluesse) {
    const v = g.knoten.get(f.von); const n = g.knoten.get(f.nach)
    if (v && n && v.box && n.box && n.box.x + n.box.w / 2 < v.box.x) rueck++
  }
  if (rueck >= 3) melde('R12', 'warnung', null, `${rueck} Sequenzflüsse laufen nach links zurück. Prüfen Sie, ob jede Schleife nötig ist.`, `${rueck} sequence flows run back to the left. Check whether every loop is needed.`)

  return b
}

/* ------------------------------------------------------ Strukturvergleich */

const norm = s => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * Vergleicht einen Graphen mit einem Pruefmuster aus der Uebungsdefinition.
 * Muster (alle Felder optional):
 *   starts: n, enden: n | [min,max], gateways: {exclusiveGateway: n, ...} (n oder [min,max]),
 *   aufgaben: ['Räder demontieren', ...] (Stichworte, jedes muss in einer Aufgabe vorkommen),
 *   minAufgaben: n, pools: ['Gast', ...], bahnen: ['Service', ...], ereignisse: {message: n, timer: n, error: n},
 *   nachrichten: n, randereignisse: n, teilprozesse: n, bedingungen: ['ja','nein'] (Stichworte an Fluessen)
 * Rueckgabe: Liste von Befunden {grad:'fehler'|'ok', text:{de,en}}
 */
export function vergleicheStruktur (g, muster) {
  const b = []
  const ok = (de, en) => b.push({ grad: 'ok', text: { de, en } })
  const nein = (de, en) => b.push({ grad: 'fehler', text: { de, en } })
  const knoten = [...g.knoten.values()].filter(k => FLUSSKNOTEN.has(k.typ))
  const inSpanne = (n, soll) => Array.isArray(soll) ? n >= soll[0] && n <= soll[1] : n === soll
  const spanneText = soll => Array.isArray(soll) ? `${soll[0]}–${soll[1]}` : String(soll)

  if (muster.starts != null) {
    const n = knoten.filter(k => k.typ === 'startEvent').length
    inSpanne(n, muster.starts) ? ok(`Startereignisse: ${n}`, `Start events: ${n}`) : nein(`Erwartet werden ${spanneText(muster.starts)} Startereignisse, gefunden ${n}.`, `Expected ${spanneText(muster.starts)} start events, found ${n}.`)
  }
  if (muster.enden != null) {
    const n = knoten.filter(k => k.typ === 'endEvent').length
    inSpanne(n, muster.enden) ? ok(`Endereignisse: ${n}`, `End events: ${n}`) : nein(`Erwartet werden ${spanneText(muster.enden)} Endereignisse, gefunden ${n}.`, `Expected ${spanneText(muster.enden)} end events, found ${n}.`)
  }
  for (const [typ, soll] of Object.entries(muster.gateways || {})) {
    const n = knoten.filter(k => k.typ === typ).length
    const namen = { exclusiveGateway: ['exklusive Gateways', 'exclusive gateways'], parallelGateway: ['parallele Gateways', 'parallel gateways'], inclusiveGateway: ['inklusive Gateways', 'inclusive gateways'], eventBasedGateway: ['ereignisbasierte Gateways', 'event-based gateways'] }[typ] || [typ, typ]
    inSpanne(n, soll) ? ok(`${namen[0]}: ${n}`, `${namen[1]}: ${n}`) : nein(`Erwartet werden ${spanneText(soll)} ${namen[0]}, gefunden ${n}.`, `Expected ${spanneText(soll)} ${namen[1]}, found ${n}.`)
  }
  if (muster.minAufgaben != null) {
    const n = knoten.filter(istAktivitaet).length
    n >= muster.minAufgaben ? ok(`Aufgaben: ${n}`, `Activities: ${n}`) : nein(`Erwartet werden mindestens ${muster.minAufgaben} Aufgaben, gefunden ${n}.`, `Expected at least ${muster.minAufgaben} activities, found ${n}.`)
  }
  if (muster.maxAufgaben != null) {
    const n = knoten.filter(istAktivitaet).length
    n <= muster.maxAufgaben ? ok(`Höchstens ${muster.maxAufgaben} Aufgaben: ${n}`, `At most ${muster.maxAufgaben} activities: ${n}`) : nein(`Erwartet werden höchstens ${muster.maxAufgaben} Aufgaben, gefunden ${n}. Was lässt sich streichen oder zusammenfassen?`, `Expected at most ${muster.maxAufgaben} activities, found ${n}. What can be dropped or merged?`)
  }
  for (const stichwort of muster.aufgaben || []) {
    const treffer = knoten.filter(istAktivitaet).some(k => norm(k.name).includes(norm(stichwort)))
    treffer ? ok(`Aufgabe „${stichwort}“ vorhanden`, `Activity “${stichwort}” present`) : nein(`Keine Aufgabe enthält „${stichwort}“. Fehlt ein Schritt, oder heißt er anders als in der Beschreibung?`, `No activity contains “${stichwort}”. Is a step missing, or named differently from the description?`)
  }
  for (const stichwort of muster.bedingungen || []) {
    const treffer = g.fluesse.some(f => norm(f.name).includes(norm(stichwort)))
    treffer ? ok(`Bedingung „${stichwort}“ vorhanden`, `Condition “${stichwort}” present`) : nein(`Kein Sequenzfluss trägt die Bedingung „${stichwort}“.`, `No sequence flow carries the condition “${stichwort}”.`)
  }
  for (const [art, soll] of Object.entries(muster.ereignisse || {})) {
    const n = knoten.filter(k => EREIGNISSE.has(k.typ) && k.ereignis === art).length
    const namen = { message: ['Nachrichtenereignisse', 'message events'], timer: ['Zeitereignisse', 'timer events'], error: ['Fehlerereignisse', 'error events'], terminate: ['terminierende Endereignisse', 'terminate end events'] }[art] || [art, art]
    inSpanne(n, soll) ? ok(`${namen[0]}: ${n}`, `${namen[1]}: ${n}`) : nein(`Erwartet werden ${spanneText(soll)} ${namen[0]}, gefunden ${n}.`, `Expected ${spanneText(soll)} ${namen[1]}, found ${n}.`)
  }
  if (muster.randereignisse != null) {
    const n = knoten.filter(k => k.typ === 'boundaryEvent').length
    inSpanne(n, muster.randereignisse) ? ok(`Angeheftete Ereignisse: ${n}`, `Boundary events: ${n}`) : nein(`Erwartet werden ${spanneText(muster.randereignisse)} angeheftete Ereignisse, gefunden ${n}.`, `Expected ${spanneText(muster.randereignisse)} boundary events, found ${n}.`)
  }
  if (muster.teilprozesse != null) {
    const n = knoten.filter(k => k.typ === 'subProcess' || k.typ === 'callActivity').length
    inSpanne(n, muster.teilprozesse) ? ok(`Teilprozesse: ${n}`, `Subprocesses: ${n}`) : nein(`Erwartet werden ${spanneText(muster.teilprozesse)} Teilprozesse oder Aufrufaktivitäten, gefunden ${n}.`, `Expected ${spanneText(muster.teilprozesse)} subprocesses or call activities, found ${n}.`)
  }
  if (muster.mehrfachinstanz != null) {
    const n = knoten.filter(k => k.schleife).length
    inSpanne(n, muster.mehrfachinstanz) ? ok(`Schleifen- oder Mehrfachinstanzmarker: ${n}`, `Loop or multi-instance markers: ${n}`) : nein(`Erwartet werden ${spanneText(muster.mehrfachinstanz)} Elemente mit Schleifen- oder Mehrfachinstanzmarker, gefunden ${n}.`, `Expected ${spanneText(muster.mehrfachinstanz)} elements with loop or multi-instance marker, found ${n}.`)
  }
  if (muster.daten != null) {
    const n = [...g.knoten.values()].filter(k => k.typ === 'dataObjectReference' || k.typ === 'dataStoreReference').length
    inSpanne(n, muster.daten) ? ok(`Datenobjekte und -speicher: ${n}`, `Data objects and stores: ${n}`) : nein(`Erwartet werden ${spanneText(muster.daten)} Datenobjekte oder Datenspeicher, gefunden ${n}.`, `Expected ${spanneText(muster.daten)} data objects or stores, found ${n}.`)
  }
  for (const name of muster.pools || []) {
    const treffer = g.pools.some(p => norm(p.name).includes(norm(name)))
    treffer ? ok(`Pool „${name}“ vorhanden`, `Pool “${name}” present`) : nein(`Es fehlt ein Pool „${name}“.`, `A pool “${name}” is missing.`)
  }
  for (const name of muster.bahnen || []) {
    const treffer = g.bahnen.some(l => norm(l.name).includes(norm(name)))
    treffer ? ok(`Bahn „${name}“ vorhanden`, `Lane “${name}” present`) : nein(`Es fehlt eine Bahn „${name}“.`, `A lane “${name}” is missing.`)
  }
  if (muster.nachrichten != null) {
    const n = g.nachrichten.length
    inSpanne(n, muster.nachrichten) ? ok(`Nachrichtenflüsse: ${n}`, `Message flows: ${n}`) : nein(`Erwartet werden ${spanneText(muster.nachrichten)} Nachrichtenflüsse, gefunden ${n}.`, `Expected ${spanneText(muster.nachrichten)} message flows, found ${n}.`)
  }
  // Erreichbarkeit: jedes Endereignis von einem Start aus erreichbar
  const starts = knoten.filter(k => k.typ === 'startEvent')
  const erreichbar = new Set()
  const stapel = starts.map(s => s.id)
  while (stapel.length) {
    const id = stapel.pop()
    if (erreichbar.has(id)) continue
    erreichbar.add(id)
    const k = g.knoten.get(id)
    if (!k) continue
    for (const f of k.aus) stapel.push(f.nach)
    for (const r of knoten.filter(x => x.haengtAn === id)) stapel.push(r.id)
  }
  const nichtErreicht = knoten.filter(k => k.typ !== 'startEvent' && !k.teilprozessVon && !erreichbar.has(k.id))
  if (starts.length && nichtErreicht.length) {
    nein(`${nichtErreicht.length} Element(e) sind vom Start aus nicht erreichbar, zuerst „${nichtErreicht[0].name || nichtErreicht[0].typ}“.`, `${nichtErreicht.length} element(s) cannot be reached from the start, first “${nichtErreicht[0].name || nichtErreicht[0].typ}”.`)
  } else if (starts.length) {
    ok('Alle Elemente sind vom Start aus erreichbar', 'All elements are reachable from the start')
  }
  return b
}

/** Kurzfassung der Regeln fuer die Anzeige (Lab 08 und Erklaerpanel). */
export const REGELN = [
  { id: 'R01', de: 'Genau ein Startereignis je Prozess', en: 'Exactly one start event per process' },
  { id: 'R02', de: 'Jeder Pfad erreicht ein Endereignis, kein Element bleibt unverbunden', en: 'Every path reaches an end event, no element is left unconnected' },
  { id: 'R03', de: 'Jeder ausgehende Pfad eines XOR/OR-Gateways trägt eine Bedingung oder ist Standardfluss', en: 'Every outgoing path of an XOR/OR gateway carries a condition or is the default flow' },
  { id: 'R04', de: 'Ein Gateway verzweigt oder führt zusammen, nicht beides', en: 'A gateway splits or merges, not both' },
  { id: 'R05', de: 'Verzweigung und Zusammenführung eines Blocks haben denselben Typ', en: 'Split and join of a block have the same type' },
  { id: 'R06', de: 'Sequenzfluss bleibt im Pool, Nachrichtenfluss verbindet Pools', en: 'Sequence flow stays inside a pool, message flow connects pools' },
  { id: 'R07', de: 'Aufgabe: Substantiv + Verb im Infinitiv. Ereignis: eingetretener Zustand', en: 'Activity: verb + object. Event: a state that has occurred' },
  { id: 'R08', de: 'Jede Aufgabe liegt in genau einer Bahn', en: 'Every activity lies in exactly one lane' },
  { id: 'R09', de: 'Nach einem ereignisbasierten Gateway folgen nur eintretende Ereignisse', en: 'Only catching events follow an event-based gateway' },
  { id: 'R10', de: 'Der Ausnahmepfad eines Randereignisses führt nicht in seine Aufgabe zurück', en: 'The exception path of a boundary event does not lead back into its activity' },
  { id: 'R11', de: 'Elemente sind beschriftet', en: 'Elements are labelled' },
  { id: 'R12', de: 'Der Fluss läuft von links nach rechts, Rücksprünge sind selten', en: 'Flow runs left to right, jumps back are rare' }
]
