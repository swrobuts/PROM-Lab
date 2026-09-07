#!/usr/bin/env node
/**
 * verify.mjs - prueft die Lernumgebung, bevor sie veroeffentlicht wird.
 *
 *   node tools/verify.mjs
 *
 * Abnahmekriterien:
 *   1. Jede Musterloesung besteht den Regelpruefer ohne Fehler (Warnungen sind erlaubt);
 *      absichtlich fehlerhafte Modelle (Uebungstyp "fehler") erzeugen genau die hinterlegten Befunde.
 *   2. Jede Uebung hat einen Platzhalter data-uebung im zugehoerigen HTML, und jeder Platzhalter eine Uebung.
 *   3. Titel und Auftrag jeder Uebung liegen in beiden Sprachen vor; Fragen haben Optionen und richtige Antworten.
 *   4. Die Uebungszahlen in LABS (assets/prom.js) stimmen mit den JSON-Dateien ueberein.
 *   5. Jedes referenzierte Modell und Geruest existiert.
 *   6. Jedes Pruefmuster (Uebungstyp "modell") wird von der Musterloesung erfuellt.
 *
 * Benoetigt: npm install (im Ordner tools/) fuer @xmldom/xmldom.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HIER = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HIER, '..')
let DOMParser
try { ({ DOMParser } = await import('@xmldom/xmldom')) } catch {
  console.error('Bitte zuerst im Ordner tools/ "npm install" ausführen (@xmldom/xmldom fehlt).')
  process.exit(2)
}
const { leseGraph, pruefeRegeln, vergleicheStruktur } = await import('../assets/pruefung.js')
const { LABS } = await import('../assets/prom.js').catch(() => ({ LABS: null }))

let fehler = 0
const meld = (ok, text) => { console.log((ok ? '  ok   ' : '  FEHL ') + text); if (!ok) fehler++ }
const graph = (pfad) => leseGraph(new DOMParser().parseFromString(readFileSync(join(ROOT, pfad), 'utf8'), 'application/xml'))

// 1. Musterloesungen
console.log('Modelle')
const modelle = readdirSync(join(ROOT, 'modelle')).filter(f => f.endsWith('.bpmn'))
for (const f of modelle) {
  const b = pruefeRegeln(graph('modelle/' + f))
  const fe = b.filter(x => x.grad === 'fehler')
  const absichtlich = /fehlerhaft/.test(f)
  if (absichtlich) meld(fe.length > 0, `${f}: absichtlich fehlerhaft, ${fe.length} Fehler, ${b.length - fe.length} Warnungen`)
  else meld(fe.length === 0, `${f}: ${fe.length} Fehler, ${b.length - fe.length} Warnungen` + (fe.length ? ' :: ' + fe.map(x => x.regel + ' ' + x.text.de).join(' | ') : ''))
}

// 2.-6. Uebungen
console.log('Übungen')
const labs = readdirSync(join(ROOT, 'data', 'uebungen')).filter(f => /^lab-\d\d\.json$/.test(f)).sort()
for (const datei of labs) {
  const labId = datei.replace('.json', '')
  const uebungen = JSON.parse(readFileSync(join(ROOT, 'data', 'uebungen', datei), 'utf8'))
  const lab = LABS && LABS.find(l => l.id === labId)
  if (!lab) { meld(false, `${labId}: fehlt in LABS`); continue }
  const html = existsSync(join(ROOT, lab.datei)) ? readFileSync(join(ROOT, lab.datei), 'utf8') : ''
  meld(!!html, `${labId}: ${lab.datei} vorhanden`)
  meld(lab.anzahl === uebungen.length, `${labId}: LABS.anzahl ${lab.anzahl} = ${uebungen.length} Übungen`)
  const platzhalter = [...html.matchAll(/data-uebung="([^"]+)"/g)].map(m => m[1])
  for (const u of uebungen) {
    meld(platzhalter.includes(u.id), `${u.id}: Platzhalter im HTML`)
    meld(u.titel && u.titel.de && u.titel.en && u.aufgabe && u.aufgabe.de && u.aufgabe.en, `${u.id}: Titel und Auftrag in DE und EN`)
    if (u.hinweis) meld(u.hinweis.de && u.hinweis.en, `${u.id}: Hinweis in DE und EN`)
    if (u.modell) meld(existsSync(join(ROOT, u.modell)), `${u.id}: Modell ${u.modell} existiert`)
    if (u.geruest) meld(existsSync(join(ROOT, u.geruest)), `${u.id}: Gerüst ${u.geruest} existiert`)
    if (u.typ === 'quiz' || u.typ === 'erkunden') {
      meld(Array.isArray(u.fragen) && u.fragen.length > 0, `${u.id}: hat Fragen`)
      for (const [i, fr] of (u.fragen || []).entries()) {
        meld(fr.frage && fr.frage.de && fr.frage.en && fr.optionen.every(o => o.de && o.en), `${u.id} Frage ${i + 1}: zweisprachig`)
        meld(Array.isArray(fr.richtig) && fr.richtig.length > 0 && fr.richtig.every(r => r < fr.optionen.length), `${u.id} Frage ${i + 1}: richtige Antworten gültig`)
        if (!fr.mehrfach) meld(fr.richtig.length === 1, `${u.id} Frage ${i + 1}: Einfachauswahl mit genau einer richtigen Antwort`)
      }
    }
    if (u.typ === 'fehler') {
      const g = graph(u.modell)
      const b = pruefeRegeln(g)
      for (const f of u.fehler) {
        const regeln = Array.isArray(f.regel) ? f.regel : [f.regel]
        const treffer = b.some(x => x.element === f.element && regeln.includes(x.regel))
        meld(g.knoten.has(f.element) || g.fluesse.some(x => x.id === f.element) || g.nachrichten.some(x => x.id === f.element), `${u.id}: Element ${f.element} existiert im Modell`)
        meld(treffer, `${u.id}: Prüfer findet ${f.regel} an ${f.element}`)
      }
    }
    if (u.typ === 'modell' && u.pruefung) {
      const g = graph(u.modell)
      const s = vergleicheStruktur(g, u.pruefung)
      const fe = s.filter(x => x.grad === 'fehler')
      meld(fe.length === 0, `${u.id}: Musterlösung erfüllt das Prüfmuster` + (fe.length ? ' :: ' + fe.map(x => x.text.de).join(' | ') : ''))
    }
  }
  for (const p of platzhalter) meld(uebungen.some(u => u.id === p), `${p}: Platzhalter hat eine Übungsdefinition`)
}

console.log(fehler ? `\n${fehler} Befund(e).` : '\nAlles in Ordnung.')
process.exit(fehler ? 1 : 0)
