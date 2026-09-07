/**
 * Bedientest im Browser: klickt jede Uebung einer Lab-Seite mit der
 * Musterloesung durch und meldet, ob "Richtig" erscheint.
 *
 * In der Entwicklerkonsole einer geoeffneten Lab-Seite:
 *   await (await fetch('tools/pruefung/durchlauf.js')).text().then(eval); await __durchlauf()
 *
 * Voraussetzung: Die Seite ist fertig aufgebaut (alle Modelle geladen).
 */
window.__durchlauf = async function () {
  const warte = (ms) => new Promise(r => setTimeout(r, ms))
  const lab = document.querySelector('script[type=module]').textContent.match(/lab: '([^']+)'/)[1]
  const uebungen = await (await fetch(`data/uebungen/${lab}.json`)).json()
  const modellFuer = (box) => (document.__promModelle || []).find(m => box.contains(m.wrap))
  const ergebnis = []
  for (const u of uebungen) {
    const box = document.getElementById(u.id)
    if (!box) { ergebnis.push(`${u.id}: Box fehlt`); continue }
    const pruefen = box.querySelector('.btn-sm.primary')
    if (u.typ === 'quiz' || u.typ === 'erkunden') {
      u.fragen.forEach((fr, i) => {
        const inputs = box.querySelectorAll(`input[name="${u.id}-${i}"]`)
        inputs.forEach((inp, j) => { inp.checked = fr.richtig.includes(j) })
      })
    }
    if (u.typ === 'fehler') {
      const m = modellFuer(box)
      const reg = m.viewer.get('elementRegistry')
      for (const f of u.fehler) {
        m.viewer.get('eventBus').fire('element.click', { element: reg.get(f.element) })
        await warte(20)
        const li = [...box.querySelectorAll('.fehlerliste li')].pop()
        li.querySelector('select').value = Array.isArray(f.regel) ? f.regel[0] : f.regel
      }
    }
    if (u.typ === 'modell') {
      const m = modellFuer(box)
      const xml = await (await fetch(u.modell)).text()
      await m.lade(xml)
    }
    pruefen.click()
    await warte(300)
    const line = box.querySelector('.sqlbox-status .line')
    const ok = line && line.classList.contains('ok')
    ergebnis.push(`${u.id} (${u.typ}): ${ok ? 'ok' : 'FEHL ' + (line ? line.textContent.slice(0, 160) : 'keine Rückmeldung')}`)
  }
  console.log(ergebnis.join('\n'))
  return ergebnis
}
