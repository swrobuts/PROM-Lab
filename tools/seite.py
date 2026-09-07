"""Bausteine, um Lab-Seiten aus Python heraus zu schreiben (Kopf/Fuss wie Lab 02)."""
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
_kopf = (ROOT / "lab-02-sequenzfluss.html").read_text()
KOPF = _kopf[:_kopf.index('<nav class="sidebar"')]
FUSS = _kopf[_kopf.index('<footer class="footer">'):]

def seite(nr, titel_de, titel_en, lab_id, sidebar, header, main):
    k = KOPF.replace("Lab 02 · Aufgaben, Ereignisse, Sequenzfluss · PROM-Lab", f"Lab {nr} · {titel_de} · PROM-Lab").replace("Lab 02 · Activities, events, sequence flow · PROM-Lab", f"Lab {nr} · {titel_en} · PROM-Lab")
    return k + sidebar + header + main + FUSS.replace("lab: 'lab-02'", f"lab: '{lab_id}'")

def sb(items):
    s = '<nav class="sidebar" aria-label="Lab-Navigation">\n  <div class="sidebar-title"><span lang="de">Abschnitte</span><span lang="en">Sections</span></div>\n'
    for anker, de, en in items:
        s += f'  <a class="sidebar-link" href="#{anker}"><span lang="de">{de}</span><span lang="en">{en}</span></a>\n'
    return s + '</nav>\n\n'

def header(nr, de, en, intro_de, intro_en, chips):
    c = "".join(f'    <span class="lernziel-chip"><span lang="de">{a}</span><span lang="en">{b}</span></span>\n' for a, b in chips)
    return f'<div class="lab-header">\n  <div class="lab-num-big">{nr}</div>\n  <h1 class="lab-title">\n    <span lang="de">{de}</span>\n    <span lang="en">{en}</span>\n  </h1>\n  <p class="lab-intro">\n    <span lang="de">{intro_de}</span>\n    <span lang="en">{intro_en}</span>\n  </p>\n  <div class="lernziele">\n{c}  </div>\n</div>\n\n'

def karte(name_de, name_en, was_de, was_en, svg, teile, falle_de, falle_en):
    t = "".join(f'            <li><span><span lang="de">{a}</span><span lang="en">{b}</span></span><span><span lang="de">{c}</span><span lang="en">{d}</span></span></li>\n' for a, b, c, d in teile)
    return f'''    <div class="symbolkarte">
      <div class="symbolkarte-kopf">
        <span class="symbolkarte-name"><span lang="de">{name_de}</span><span lang="en">{name_en}</span></span>
        <span class="symbolkarte-was"><span lang="de">{was_de}</span><span lang="en">{was_en}</span></span>
      </div>
      <div class="symbolkarte-koerper">
        <div class="symbolkarte-bild" aria-hidden="true">{svg}</div>
        <div class="symbolkarte-text">
          <ul class="symbolkarte-teile">
{t}          </ul>
          <p class="symbolkarte-falle"><strong><span lang="de">Stolperfalle:</span><span lang="en">Pitfall:</span></strong>
            <span lang="de">{falle_de}</span>
            <span lang="en">{falle_en}</span></p>
        </div>
      </div>
    </div>
'''

def absatz(de, en):
    return f'    <p>\n      <span lang="de">{de}</span>\n      <span lang="en">{en}</span>\n    </p>\n'

def box(art, titel_de, titel_en, de, en):
    t = f'<strong><span lang="de">{titel_de}</span><span lang="en">{titel_en}</span></strong> ' if titel_de else ''
    return f'    <div class="{art}">\n      <p>{t}<span lang="de">{de}</span><span lang="en">{en}</span></p>\n    </div>\n'

def modell(datei, name, hoch=False):
    return f'    <div data-modell="{datei}" data-name="{name}"{" data-hoch" if hoch else ""}></div>\n'

def abschnitt(anker, de, en, inhalt):
    return f'  <section class="section-block" id="{anker}">\n    <h2><span lang="de">{de}</span><span lang="en">{en}</span></h2>\n{inhalt}  </section>\n\n'

def uebungen(ids, de, en):
    d = "".join(f'    <div data-uebung="{i}"></div>\n' for i in ids)
    return f'  <section class="section-block" id="uebungen">\n    <h2><span lang="de">Übungen</span><span lang="en">Exercises</span></h2>\n    <p><span lang="de">{de}</span><span lang="en">{en}</span></p>\n{d}  </section>\n\n'

def zusammenfassung(punkte):
    li = "".join(f'      <li><span lang="de">{a}</span><span lang="en">{b}</span></li>\n' for a, b in punkte)
    return f'  <section class="section-block" id="zusammenfassung">\n    <h2><span lang="de">Zusammenfassung</span><span lang="en">Summary</span></h2>\n    <ul>\n{li}    </ul>\n    <nav class="nav-bottom"></nav>\n  </section>\n\n</main>\n\n'

def tabelle(kopf, zeilen):
    th = "".join(f'<th><span lang="de">{a}</span><span lang="en">{b}</span></th>' for a, b in kopf)
    def zelle(z):
        if isinstance(z, tuple):
            return f'<td><span lang="de">{z[0]}</span><span lang="en">{z[1]}</span></td>'
        return f'<td>{z}</td>'
    tr = "".join('<tr>' + "".join(zelle(z) for z in zeile) + '</tr>\n' for zeile in zeilen)
    return f'    <table>\n      <thead><tr>{th}</tr></thead>\n      <tbody>\n{tr}      </tbody>\n    </table>\n'

# Symbole
def ereignis(inner, dick=False, doppelt=False, gestrichelt=False):
    r = 'stroke-width="4"' if dick else 'stroke-width="1.5"'
    d = ' stroke-dasharray="4 3"' if gestrichelt else ''
    innen = f'<circle cx="70" cy="45" r="21" fill="none" stroke="#10201C" stroke-width="1.5"{d}/>' if doppelt else ''
    return f'<svg viewBox="0 0 140 90" width="140" height="90"><circle cx="70" cy="45" r="26" fill="#fff" stroke="#10201C" {r}{d}/>{innen}{inner}</svg>'
UMSCHLAG_LEER = '<rect x="60" y="38" width="20" height="14" fill="#fff" stroke="#10201C" stroke-width="1.5"/><path d="M60,38 L70,46 L80,38" fill="none" stroke="#10201C" stroke-width="1.5"/>'
UMSCHLAG_VOLL = '<rect x="60" y="38" width="20" height="14" fill="#10201C"/><path d="M60,38 L70,46 L80,38" fill="none" stroke="#fff" stroke-width="1.5"/>'
UHR = '<circle cx="70" cy="45" r="10" fill="none" stroke="#10201C" stroke-width="1.5"/><path d="M70,38 L70,45 L75,48" fill="none" stroke="#10201C" stroke-width="1.5"/>'
BLITZ = '<path d="M72,34 L64,47 L70,47 L67,57 L76,43 L70,43 Z" fill="none" stroke="#10201C" stroke-width="1.5"/>'
def gateway(marker):
    return f'<svg viewBox="0 0 140 90" width="140" height="90"><polygon points="70,15 100,45 70,75 40,45" fill="#fff" stroke="#10201C" stroke-width="2"/>{marker}</svg>'
XOR = gateway('<path d="M60,35 L80,55 M80,35 L60,55" stroke="#10201C" stroke-width="3" fill="none"/>')
AND = gateway('<path d="M70,30 L70,60 M55,45 L85,45" stroke="#10201C" stroke-width="3" fill="none"/>')
OR = gateway('<circle cx="70" cy="45" r="12" fill="none" stroke="#10201C" stroke-width="2.5"/>')
EREIGNISBASIERT = gateway('<circle cx="70" cy="45" r="13" fill="none" stroke="#10201C" stroke-width="1.5"/><circle cx="70" cy="45" r="10" fill="none" stroke="#10201C" stroke-width="1.5"/><polygon points="70,38 76,43 74,50 66,50 64,43" fill="none" stroke="#10201C" stroke-width="1.5"/>')
