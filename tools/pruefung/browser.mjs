// Optional: npm install --no-save playwright (in tools/), npx playwright install chromium.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, extname, sep } from 'node:path'
import { LABS } from '../../assets/prom.js'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const root = fileURLToPath(new URL('../../', import.meta.url))
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html'))
    if (!path.startsWith(resolve(root) + sep)) throw new Error('Outside root')
    const body = await readFile(path)
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  const ready = async lab => {
    await page.waitForFunction(n => document.querySelectorAll('.uebung').length === n &&
      [...document.querySelectorAll('.modell-flaeche')].every(e => !e.classList.contains('laden')) &&
      [...document.querySelectorAll('.uebung[data-typ="modell"]')].every(e => e.querySelector('.modell.editor')), lab.anzahl)
  }
  for (const lang of ['de', 'en']) {
    for (const lab of LABS) {
      await page.goto(`${base}/${lab.datei}?lang=${lang}`)
      await ready(lab)
      await page.addScriptTag({ url: `${base}/tools/pruefung/durchlauf.js` })
      const result = await page.evaluate(() => window.__durchlauf())
      assert(result.every(s => s.endsWith(': ok')), result.join('\n'))
      console.log(`${lang} ${lab.id}: ${result.length} exercises OK`)
    }
  }
  assert.deepEqual(errors, [])
  if (process.env.BASELINE_ONLY) process.exitCode = 0
  else {
    // A broken stored model must leave import/reset/check usable.
    await page.evaluate(() => {
      localStorage.setItem('prom:editor:P02-05', '<broken>')
      localStorage.setItem('prom:fortschritt:lab-02', 'null')
    })
    await page.goto(`${base}/lab-02-sequenzfluss.html`)
    await ready(LABS[1])
    assert.equal(await page.locator('#P02-05 .modell.editor').count(), 1)
    await page.locator('#P02-05 .btn-sm.primary').click()
    await page.waitForSelector('#P02-05 .sqlbox-status .line.fail')

    // Imported labels must be displayed as text, including markup-like labels.
    await page.evaluate(async () => {
      const m = document.__promModelle.find(m => m.wrap.closest('#P02-05'))
      const xml = await (await fetch('modelle/uc02-blutentnahme.bpmn')).text()
      await m.lade(xml.replace(/(<bpmn:task[^>]*name=")[^"]*/, '$1&lt;img src=x onerror=alert(1)&gt;'))
    })
    await page.locator('#P02-05 .btn-sm.primary').click()
    await page.waitForSelector('#P02-05 .befunde')
    assert.equal(await page.locator('#P02-05 .befunde img').count(), 0)

    // Concurrent language changes must not append outdated action bars.
    await page.goto(`${base}/index.html`)
    await page.waitForSelector('.fortschritt-aktionen')
    await page.route('**/data/uebungen/*.json', async route => {
      await new Promise(r => setTimeout(r, 150))
      await route.continue()
    })
    await page.evaluate(() => {
      for (const lang of ['en', 'de', 'en']) document.querySelector(`[data-lang-btn="${lang}"]`).click()
    })
    await page.waitForSelector('.fortschritt-aktionen')
    await page.waitForTimeout(350)
    assert.equal(await page.locator('.fortschritt-aktionen').count(), 1)
    assert.equal(await page.locator('.fortschritt-aktionen button').textContent(), 'Reset learning progress')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${base}/lab-02-sequenzfluss.html`)
    await ready(LABS[1])
    assert.equal(await page.locator('#P02-05 .modell-flaeche').isVisible(), false)
    assert.equal(await page.locator('#P02-05 .editor-zuklein').isVisible(), true)
    assert.deepEqual(errors, [])
    console.log('Editor recovery, safe labels, storage, language race and mobile checks OK')
  }
} finally {
  await browser.close()
  await new Promise(r => server.close(r))
}
