#!/usr/bin/env python3
"""
gen_bpmn.py - erzeugt BPMN-2.0-Dateien (inkl. BPMN-DI-Layout) aus kompakten
JSON-Quellen in modelle/quellen/*.json.

Aufruf:  python3 tools/gen_bpmn.py            # alle Quellen
         python3 tools/gen_bpmn.py uc03       # nur Quellen, deren Name mit uc03 beginnt

Die Quellen beschreiben ein Modell als Raster: jeder Knoten hat eine Spalte
(col) und eine Zeile (row). Pools und Bahnen belegen Zeilenbaender. Der
Generator berechnet daraus Koordinaten, Kantenverlaeufe und Beschriftungen
und schreibt reines BPMN 2.0 ohne Werkzeug-Erweiterungen, damit die Dateien
in Adonis CE, Camunda Modeler, bpmn.io und Signavio importierbar sind.

Quellformat (Auszug):
{
  "id": "uc03", "name": "Reifenwechsel in der Kfz-Werkstatt",
  "pools": [ {"id": "werkstatt", "name": "Kfz-Werkstatt",
              "lanes": [ {"id": "annahme", "name": "Annahme", "rows": 1},
                         {"id": "halle",   "name": "Werkstatthalle", "rows": 2} ]} ],
  "nodes": [ {"id": "s", "type": "startEvent", "name": "Kunde fährt vor", "col": 0, "row": 0},
             {"id": "t1", "type": "task", "name": "Auftrag aufnehmen", "col": 1, "row": 0}, ... ],
  "flows": [ {"from": "s", "to": "t1"}, {"from": "g1", "to": "t3", "name": "ja"}, ... ],
  "messages": [ {"from": "t1", "to": "e2", "name": "Bestellung"} ],
  "assocs":   [ {"from": "t1", "to": "d1"} ]
}
Ohne "pools" entsteht ein einzelner Prozess ohne Kollaboration.
"""
import json, sys, os, re, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUELLEN = ROOT / "modelle" / "quellen"
ZIEL = ROOT / "modelle"

# ---------------------------------------------------------------- Raster
COLW, ROWH = 190, 130          # Rasterbreite je Spalte, Hoehe je Zeile
X0, Y0 = 40, 40                # linker/oberer Rand
POOL_LABEL = 30                # Breite des Pool-Beschriftungsbands
LANE_LABEL = 30                # Breite des Bahn-Beschriftungsbands
POOL_GAP = 60                  # Abstand zwischen Pools
POOL_PAD_R = 60                # rechter Innenabstand im Pool
SIZES = {
    "task": (120, 80), "userTask": (120, 80), "serviceTask": (120, 80),
    "manualTask": (120, 80), "sendTask": (120, 80), "receiveTask": (120, 80),
    "scriptTask": (120, 80), "businessRuleTask": (120, 80),
    "subProcess": (120, 80), "callActivity": (120, 80),
    "startEvent": (36, 36), "endEvent": (36, 36),
    "intermediateCatchEvent": (36, 36), "intermediateThrowEvent": (36, 36),
    "boundaryEvent": (36, 36),
    "exclusiveGateway": (50, 50), "parallelGateway": (50, 50),
    "inclusiveGateway": (50, 50), "eventBasedGateway": (50, 50),
    "complexGateway": (50, 50),
    "dataObjectReference": (36, 50), "dataStoreReference": (50, 50),
    "textAnnotation": (170, 40),
}
GATEWAYS = {"exclusiveGateway", "parallelGateway", "inclusiveGateway",
            "eventBasedGateway", "complexGateway"}
EVENTS = {"startEvent", "endEvent", "intermediateCatchEvent",
          "intermediateThrowEvent", "boundaryEvent"}
ACTIVITIES = {"task", "userTask", "serviceTask", "manualTask", "sendTask",
              "receiveTask", "scriptTask", "businessRuleTask", "subProcess",
              "callActivity"}
DATA = {"dataObjectReference", "dataStoreReference"}
EVENT_DEFS = {
    "message": "messageEventDefinition", "timer": "timerEventDefinition",
    "error": "errorEventDefinition", "terminate": "terminateEventDefinition",
    "signal": "signalEventDefinition", "escalation": "escalationEventDefinition",
    "conditional": "conditionalEventDefinition", "cancel": "cancelEventDefinition",
    "compensate": "compensateEventDefinition", "link": "linkEventDefinition",
}

def esc(s):
    return html.escape(str(s), quote=True)

def slug(s):
    s = s.lower()
    s = (s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss"))
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

class Box:
    __slots__ = ("x", "y", "w", "h")
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
    @property
    def cx(self): return self.x + self.w / 2
    @property
    def cy(self): return self.y + self.h / 2
    @property
    def r(self): return self.x + self.w
    @property
    def b(self): return self.y + self.h

# ---------------------------------------------------------------- Layout
class Layout:
    def __init__(self, m):
        self.m = m
        self.nodes = {n["id"]: n for n in m["nodes"]}
        for n in m["nodes"]:
            for c in n.get("children", []):
                c["_parent"] = n["id"]
                self.nodes[c["id"]] = c
        self.box = {}
        self.rowy = {}      # Zeilenindex -> y-Mitte
        self.pools = []     # (pool, Box)
        self.lanes = []     # (pool, lane, Box)
        self._rows()
        self._place()

    def _rows(self):
        """Weist jeder Zeile eine y-Koordinate zu; Pools trennen Baender."""
        pools = self.m.get("pools")
        y = Y0
        if not pools:
            maxrow = max(n["row"] for n in self.m["nodes"] if "row" in n)
            for r in range(maxrow + 1):
                self.rowy[r] = y + ROWH / 2
                y += ROWH
            self.height = y
            return
        row = 0
        for p in pools:
            top = y
            lanes = p.get("lanes") or [{"id": None, "name": None, "rows": p.get("rows", 1)}]
            for ln in lanes:
                ltop = y
                for _ in range(ln.get("rows", 1)):
                    self.rowy[row] = y + ROWH / 2
                    row += 1
                    y += ROWH
                ln["_box"] = [ltop, y]
            p["_box"] = [top, y]
            y += POOL_GAP
        self.height = y - POOL_GAP

    def _size(self, n):
        w, h = SIZES[n["type"]]
        if n.get("w"): w = n["w"]
        if n.get("h"): h = n["h"]
        return w, h

    def _place(self):
        m = self.m
        maxcol = 0
        for n in m["nodes"]:
            if n["type"] == "boundaryEvent" or "col" not in n:
                continue
            w, h = self._size(n)
            cx = X0 + POOL_LABEL + LANE_LABEL + n["col"] * COLW + COLW / 2 + n.get("dx", 0)
            cy = self.rowy[n["row"]] + n.get("dy", 0)
            if n["type"] == "subProcess" and n.get("children"):
                self._place_children(n, cx, cy)
                continue
            self.box[n["id"]] = Box(cx - w / 2, cy - h / 2, w, h)
            maxcol = max(maxcol, n["col"])
        for n in m["nodes"]:
            if n["type"] == "boundaryEvent":
                host = self.box[n["attachedTo"]]
                w, h = self._size(n)
                pos = n.get("pos", "bottom-right")
                if pos == "bottom-right":
                    bx, by = host.r - w - 8, host.b - h / 2
                elif pos == "bottom":
                    bx, by = host.cx - w / 2, host.b - h / 2
                elif pos == "top-right":
                    bx, by = host.r - w - 8, host.y - h / 2
                else:
                    bx, by = host.x + 8, host.b - h / 2
                self.box[n["id"]] = Box(bx, by, w, h)
        # Poolbreite
        right = 0
        for b in self.box.values():
            right = max(right, b.r)
        self.width = right + POOL_PAD_R
        self.poolbox = {}
        for p in m.get("pools", []):
            top, bot = p["_box"]
            pb = Box(X0, top, self.width - X0, bot - top)
            self.pools.append((p, pb))
            self.poolbox[p["id"]] = pb
            for ln in p.get("lanes", []):
                lt, lb = ln["_box"]
                self.lanes.append((p, ln, Box(X0 + POOL_LABEL, lt, self.width - X0 - POOL_LABEL, lb - lt)))

    def _place_children(self, sp, cx, cy):
        """Aufgeklappter Teilprozess: Kinder in lokalem Raster, Rahmen umschliessend."""
        kids = sp["children"]
        lc, lr = 150, 100
        maxc = max(k["col"] for k in kids); maxr = max(k["row"] for k in kids)
        w = (maxc + 1) * lc + 40
        h = (maxr + 1) * lr + 40
        x = cx - 60      # linke Kante am Rasterpunkt der Aufgabe ausrichten
        y = cy - h / 2 + sp.get("dyh", 0)
        self.box[sp["id"]] = Box(x, y, w, h)
        for k in kids:
            kw, kh = self._size(k)
            kcx = x + 20 + k["col"] * lc + lc / 2
            kcy = y + 20 + 10 + k["row"] * lr + lr / 2
            self.box[k["id"]] = Box(kcx - kw / 2, kcy - kh / 2, kw, kh)

    # ------------------------------------------------------------ Kanten
    def route_seq(self, f):
        s, t = self.box[f["from"]], self.box[f["to"]]
        sn, tn = self.nodes[f["from"]], self.nodes[f["to"]]
        if f.get("via") == "custom":
            return [tuple(p) for p in f["points"]]
        same_row = abs(s.cy - t.cy) < 1
        if sn["type"] == "boundaryEvent":
            if t.x > s.r and not same_row:
                return [(s.cx, s.b), (s.cx, t.cy), (t.x, t.cy)]
            if t.x > s.r:
                return [(s.cx, s.b), (s.cx, s.b + 30), (t.cx, s.b + 30), (t.cx, t.b)] if False else [(s.cx, s.b), (s.cx, t.cy + 0), (t.x, t.cy)]
            # Rueckwaerts
            yb = max(s.b, t.b) + 40
            return [(s.cx, s.b), (s.cx, yb), (t.cx, yb), (t.cx, t.b)]
        if t.x >= s.r:                      # vorwaerts
            if f.get("via") == "top":       # oben herum, z. B. am Standardfluss vorbei
                yt = min(s.y, t.y) - 45
                return [(s.cx, s.y), (s.cx, yt), (t.cx, yt), (t.cx, t.y)]
            if same_row:
                return [(s.r, s.cy), (t.x, t.cy)]
            if sn["type"] in GATEWAYS and tn["type"] in GATEWAYS:
                if t.cy < s.cy:
                    return [(s.cx, s.y), (s.cx, t.cy), (t.x, t.cy)]
                return [(s.cx, s.b), (s.cx, t.cy), (t.x, t.cy)]
            if sn["type"] in GATEWAYS:
                if t.cy < s.cy:
                    return [(s.cx, s.y), (s.cx, t.cy), (t.x, t.cy)]
                return [(s.cx, s.b), (s.cx, t.cy), (t.x, t.cy)]
            if tn["type"] in GATEWAYS:
                if t.cy < s.cy:
                    return [(s.r, s.cy), (t.cx, s.cy), (t.cx, t.b)]
                return [(s.r, s.cy), (t.cx, s.cy), (t.cx, t.y)]
            mx = s.r + (t.x - s.r) / 2
            return [(s.r, s.cy), (mx, s.cy), (mx, t.cy), (t.x, t.cy)]
        # rueckwaerts: Schleife unten (oder oben bei via=top) herum
        if f.get("via") == "top":
            yb = min(s.y, t.y) - 40
            return [(s.cx, s.y), (s.cx, yb), (t.cx, yb), (t.cx, t.y)]
        yb = max(s.b, t.b) + 40
        if f.get("via") == "left":         # von links wieder in das Ziel einlaufen
            return [(s.cx, s.b), (s.cx, yb), (t.x - 30, yb), (t.x - 30, t.cy), (t.x, t.cy)]
        return [(s.cx, s.b), (s.cx, yb), (t.cx, yb), (t.cx, t.b)]

    def route_msg(self, f):
        if f.get("via") == "custom":
            return [tuple(p) for p in f["points"]]
        # Black-Box-Pool als Quelle oder Ziel: senkrecht zur Poolkante des Gegenuebers
        if f["from"] in self.poolbox:
            pb, t = self.poolbox[f["from"]], self.box[f["to"]]
            tx = t.cx + f.get("tx", 0)
            return [(tx, pb.b), (tx, t.y)] if t.y > pb.b else [(tx, pb.y), (tx, t.b)]
        if f["to"] in self.poolbox:
            s, pb = self.box[f["from"]], self.poolbox[f["to"]]
            sx = s.cx + f.get("sx", 0)
            return [(sx, s.y), (sx, pb.b)] if pb.b < s.y else [(sx, s.b), (sx, pb.y)]
        s, t = self.box[f["from"]], self.box[f["to"]]
        sx = s.cx + f.get("sx", 0); tx = t.cx + f.get("tx", 0)
        if t.y > s.b:                       # Ziel liegt unterhalb
            if abs(sx - tx) < 1:
                return [(sx, s.b), (tx, t.y)]
            my = s.b + (t.y - s.b) / 2 + f.get("my", 0)
            return [(sx, s.b), (sx, my), (tx, my), (tx, t.y)]
        if abs(sx - tx) < 1:
            return [(sx, s.y), (tx, t.b)]
        my = t.b + (s.y - t.b) / 2 + f.get("my", 0)
        return [(sx, s.y), (sx, my), (tx, my), (tx, t.b)]

    def route_assoc(self, f):
        s, t = self.box[f["from"]], self.box[f["to"]]
        if t.cy < s.y:
            return [(s.cx if abs(s.cx - t.cx) < 60 else t.cx, s.y), (t.cx, t.b)]
        if t.cy > s.b:
            return [(t.cx, s.b), (t.cx, t.y)]
        if t.x > s.r:
            return [(s.r, s.cy), (t.x, t.cy)]
        return [(s.x, s.cy), (t.r, t.cy)]

# ---------------------------------------------------------------- XML
def event_def_xml(n):
    kind = n.get("event")
    if not kind or kind == "none":
        return ""
    tag = EVENT_DEFS[kind]
    inner = ""
    if kind == "timer" and n.get("timer"):
        inner = f'<bpmn:timeDuration xsi:type="bpmn:tFormalExpression">{esc(n["timer"])}</bpmn:timeDuration>'
    return f'<bpmn:{tag}>{inner}</bpmn:{tag}>' if inner else f'<bpmn:{tag} />'

def node_xml(n, incoming, outgoing, ind="    "):
    t = n["type"]
    attrs = [f'id="{n["id"]}"']
    if n.get("name"):
        attrs.append(f'name="{esc(n["name"])}"')
    if t == "boundaryEvent":
        attrs.append(f'attachedToRef="{n["attachedTo"]}"')
        if n.get("interrupting") is False:
            attrs.append('cancelActivity="false"')
    if t == "startEvent" and n.get("interrupting") is False:
        attrs.append('isInterrupting="false"')
    if t == "subProcess" and n.get("eventSubProcess"):
        attrs.append('triggeredByEvent="true"')
    if t == "callActivity" and n.get("calledElement"):
        attrs.append(f'calledElement="{esc(n["calledElement"])}"')
    if t in GATEWAYS and n.get("default"):
        attrs.append(f'default="{n["default"]}"')
    if t in ACTIVITIES and n.get("default"):
        attrs.append(f'default="{n["default"]}"')
    if t == "dataObjectReference":
        attrs.append(f'dataObjectRef="{n["id"]}_do"')
    if t == "textAnnotation":
        return (f'{ind}<bpmn:textAnnotation id="{n["id"]}">\n'
                f'{ind}  <bpmn:text>{esc(n.get("text") or n.get("name") or "")}</bpmn:text>\n'
                f'{ind}</bpmn:textAnnotation>\n')
    body = []
    if n.get("doc"):
        body.append(f'{ind}  <bpmn:documentation>{esc(n["doc"])}</bpmn:documentation>')
    for i in incoming:
        body.append(f'{ind}  <bpmn:incoming>{i}</bpmn:incoming>')
    for o in outgoing:
        body.append(f'{ind}  <bpmn:outgoing>{o}</bpmn:outgoing>')
    if n.get("dataIn"):
        for k, d in enumerate(n["dataIn"]):
            body.append(f'{ind}  <bpmn:property id="{n["id"]}_prop{k}" name="__targetRef_placeholder" />')
            body.append(f'{ind}  <bpmn:dataInputAssociation id="{n["id"]}_din{k}">\n'
                        f'{ind}    <bpmn:sourceRef>{d}</bpmn:sourceRef>\n'
                        f'{ind}    <bpmn:targetRef>{n["id"]}_prop{k}</bpmn:targetRef>\n'
                        f'{ind}  </bpmn:dataInputAssociation>')
    if n.get("dataOut"):
        for k, d in enumerate(n["dataOut"]):
            body.append(f'{ind}  <bpmn:dataOutputAssociation id="{n["id"]}_dout{k}">\n'
                        f'{ind}    <bpmn:targetRef>{d}</bpmn:targetRef>\n'
                        f'{ind}  </bpmn:dataOutputAssociation>')
    if t in EVENTS:
        ed = event_def_xml(n)
        if ed:
            body.append(f'{ind}  {ed}')
    if n.get("loop") == "standard":
        body.append(f'{ind}  <bpmn:standardLoopCharacteristics />')
    elif n.get("loop") in ("parallel", "sequential"):
        seq = ' isSequential="true"' if n["loop"] == "sequential" else ""
        body.append(f'{ind}  <bpmn:multiInstanceLoopCharacteristics{seq} />')
    if t == "subProcess" and n.get("children"):
        body.append(process_body(n["children"], n.get("childFlows", []), ind + "  "))
    out = f'{ind}<bpmn:{t} {" ".join(attrs)}'
    if body:
        out += ">\n" + "\n".join(body) + f"\n{ind}</bpmn:{t}>\n"
    else:
        out += " />\n"
    if t == "dataObjectReference":
        out += f'{ind}<bpmn:dataObject id="{n["id"]}_do" />\n'
    return out

def process_body(nodes, flows, ind):
    inc, outg = {}, {}
    for f in flows:
        f.setdefault("id", f'Flow_{f["from"]}_{f["to"]}')
        outg.setdefault(f["from"], []).append(f["id"])
        inc.setdefault(f["to"], []).append(f["id"])
    parts = []
    for n in nodes:
        parts.append(node_xml(n, inc.get(n["id"], []), outg.get(n["id"], []), ind))
    for f in flows:
        attrs = [f'id="{f["id"]}"']
        if f.get("name"):
            attrs.append(f'name="{esc(f["name"])}"')
        attrs.append(f'sourceRef="{f["from"]}"')
        attrs.append(f'targetRef="{f["to"]}"')
        parts.append(f'{ind}<bpmn:sequenceFlow {" ".join(attrs)} />\n')
    return "".join(parts)

def build(m):
    lay = Layout(m)
    pools = m.get("pools")
    nodes = m["nodes"]
    flows = m.get("flows", [])
    msgs = m.get("messages", [])
    assocs = m.get("assocs", [])
    for f in flows:
        f.setdefault("id", f'Flow_{f["from"]}_{f["to"]}')
    for k, f in enumerate(msgs):
        f.setdefault("id", f'Msg_{f["from"]}_{f["to"]}')
    for k, f in enumerate(assocs):
        f.setdefault("id", f'Assoc_{f["from"]}_{f["to"]}')

    # Standardfluesse: "default": true am Fluss -> Attribut am Gateway/Aktivitaet
    for f in flows:
        if f.get("default"):
            lay.nodes[f["from"]]["default"] = f["id"]

    defs_id = f'Definitions_{m["id"]}'
    out = ['<?xml version="1.0" encoding="UTF-8"?>\n',
           f'<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" '
           f'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" '
           f'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" '
           f'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" '
           f'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
           f'id="{defs_id}" targetNamespace="https://thws.de/prom-lab" '
           f'exporter="PROM-Lab gen_bpmn.py" exporterVersion="1.0">\n']
    if m.get("doc"):
        pass

    # Knoten je Pool gruppieren
    def pool_of(n):
        if n["type"] == "boundaryEvent":
            return pool_of(lay.nodes[n["attachedTo"]])
        if n.get("pool"):
            return n["pool"]
        if not pools:
            return None
        if n.get("lane"):
            for p in pools:
                if any(ln["id"] == n["lane"] for ln in p.get("lanes", [])):
                    return p["id"]
        return next(p["id"] for p in pools if not p.get("blackbox"))

    if pools:
        out.append(f'  <bpmn:collaboration id="Collab_{m["id"]}">\n')
        for p in pools:
            pr = f' processRef="Process_{p["id"]}"' if not p.get("blackbox") else ""
            out.append(f'    <bpmn:participant id="Pool_{p["id"]}" name="{esc(p["name"])}"{pr} />\n')
        for f in msgs:
            src = f["from"] if f["from"] not in {p["id"] for p in pools} else f'Pool_{f["from"]}'
            tgt = f["to"] if f["to"] not in {p["id"] for p in pools} else f'Pool_{f["to"]}'
            nm = f' name="{esc(f["name"])}"' if f.get("name") else ""
            out.append(f'    <bpmn:messageFlow id="{f["id"]}"{nm} sourceRef="{src}" targetRef="{tgt}" />\n')
        out.append('  </bpmn:collaboration>\n')

    groups = [(None, nodes)] if not pools else [
        (p, [n for n in nodes if pool_of(n) == p["id"]]) for p in pools if not p.get("blackbox")]
    for p, pn in groups:
        pid = f'Process_{p["id"]}' if p else f'Process_{m["id"]}'
        out.append(f'  <bpmn:process id="{pid}" name="{esc((p or m)["name"])}" isExecutable="false">\n')
        if p and p.get("lanes"):
            out.append(f'    <bpmn:laneSet id="LaneSet_{p["id"]}">\n')
            for ln in p["lanes"]:
                out.append(f'      <bpmn:lane id="Lane_{ln["id"]}" name="{esc(ln["name"])}">\n')
                for n in pn:
                    if n["type"] in ("textAnnotation",) or n["type"] in DATA:
                        continue
                    lane = n.get("lane") or (lay.nodes[n["attachedTo"]].get("lane") if n["type"] == "boundaryEvent" else None)
                    if lane == ln["id"]:
                        out.append(f'        <bpmn:flowNodeRef>{n["id"]}</bpmn:flowNodeRef>\n')
                out.append('      </bpmn:lane>\n')
            out.append('    </bpmn:laneSet>\n')
        ids = {n["id"] for n in pn}
        pf = [f for f in flows if f["from"] in ids]
        out.append(process_body(pn, pf, "    "))
        for f in assocs:
            if f["from"] in ids or f["to"] in ids:
                out.append(f'    <bpmn:association id="{f["id"]}" sourceRef="{f["from"]}" targetRef="{f["to"]}" />\n')
        out.append('  </bpmn:process>\n')

    # ------------------------------------------------------------ DI
    plane_el = f'Collab_{m["id"]}' if pools else f'Process_{m["id"]}'
    out.append(f'  <bpmndi:BPMNDiagram id="Diagram_{m["id"]}">\n')
    out.append(f'    <bpmndi:BPMNPlane id="Plane_{m["id"]}" bpmnElement="{plane_el}">\n')
    def shape(el, b, extra="", label=None):
        s = (f'      <bpmndi:BPMNShape id="{el}_di" bpmnElement="{el}"{extra}>\n'
             f'        <dc:Bounds x="{b.x:.0f}" y="{b.y:.0f}" width="{b.w:.0f}" height="{b.h:.0f}" />\n')
        if label:
            lx, ly, lw, lh = label
            s += (f'        <bpmndi:BPMNLabel>\n          <dc:Bounds x="{lx:.0f}" y="{ly:.0f}" width="{lw:.0f}" height="{lh:.0f}" />\n        </bpmndi:BPMNLabel>\n')
        return s + '      </bpmndi:BPMNShape>\n'
    for p, b in lay.pools:
        out.append(shape(f'Pool_{p["id"]}', b, ' isHorizontal="true"'))
    for p, ln, b in lay.lanes:
        out.append(shape(f'Lane_{ln["id"]}', b, ' isHorizontal="true"'))
    all_nodes = list(lay.nodes.values())
    for n in all_nodes:
        b = lay.box[n["id"]]
        extra = ""
        if n["type"] in GATEWAYS and n["type"] != "parallelGateway" and n["type"] != "eventBasedGateway":
            extra = ' isMarkerVisible="true"'
        if n["type"] == "subProcess":
            extra = ' isExpanded="true"' if n.get("children") else ' isExpanded="false"'
        label = None
        if n["type"] in EVENTS or n["type"] in GATEWAYS or n["type"] in DATA:
            if n.get("name"):
                lw = max(60, min(150, len(n["name"]) * 6.4))
                lh = 14 * (1 + len(n["name"]) // 22)
                if n.get("labelPos") == "top":
                    label = (b.cx - lw / 2, b.y - lh - 6, lw, lh)
                elif n.get("labelPos") == "right":
                    label = (b.r + 6, b.cy - lh / 2, lw, lh)
                elif n.get("labelPos") == "left":
                    label = (b.x - lw - 6, b.cy - lh / 2, lw, lh)
                else:
                    label = (b.cx - lw / 2, b.b + 6, lw, lh)
                if n["type"] == "boundaryEvent" and not n.get("labelPos"):
                    label = (b.cx - lw / 2, b.b + 4, lw, lh)
        out.append(shape(n["id"], b, extra, label))
    def edge(el, pts, name=None):
        s = f'      <bpmndi:BPMNEdge id="{el}_di" bpmnElement="{el}">\n'
        for x, y in pts:
            s += f'        <di:waypoint x="{x:.0f}" y="{y:.0f}" />\n'
        if name:
            (x1, y1), (x2, y2) = pts[0], pts[1]
            lw = max(40, min(120, len(name) * 6.5)); lh = 14
            if abs(x1 - x2) < 1:          # vertikales erstes Segment: Label rechts daneben
                lx, ly = x1 + 6, min(y1, y2) + abs(y2 - y1) / 2 - lh / 2
            else:                          # horizontal: Label darueber
                lx, ly = min(x1, x2) + abs(x2 - x1) / 2 - lw / 2, y1 - lh - 6
                if len(pts) > 2 and abs(x2 - x1) < 60:
                    lx = x2 + 6
            s += (f'        <bpmndi:BPMNLabel>\n          <dc:Bounds x="{lx:.0f}" y="{ly:.0f}" width="{lw:.0f}" height="{lh:.0f}" />\n        </bpmndi:BPMNLabel>\n')
        return s + '      </bpmndi:BPMNEdge>\n'
    allflows = list(flows)
    for n in nodes:
        if n.get("children"):
            allflows += n.get("childFlows", [])
    for f in allflows:
        f.setdefault("id", f'Flow_{f["from"]}_{f["to"]}')
        out.append(edge(f["id"], lay.route_seq(f), f.get("name")))
    for f in msgs:
        out.append(edge(f["id"], lay.route_msg(f), f.get("name")))
    for f in assocs:
        out.append(edge(f["id"], lay.route_assoc(f)))
    # Datenassoziationen (dataIn/dataOut) als Kanten
    for n in all_nodes:
        for k, d in enumerate(n.get("dataIn", [])):
            out.append(edge(f'{n["id"]}_din{k}', lay.route_assoc({"from": d, "to": n["id"]})))
        for k, d in enumerate(n.get("dataOut", [])):
            out.append(edge(f'{n["id"]}_dout{k}', lay.route_assoc({"from": n["id"], "to": d})))
    out.append('    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n</bpmn:definitions>\n')
    return "".join(out)

# ---------------------------------------------------------------- Pruefung
def check(m, xmltext):
    """Strukturpruefung: eindeutige IDs, aufgeloeste Referenzen, Grundregeln."""
    fehler = []
    ids = [n["id"] for n in m["nodes"]] + [c["id"] for n in m["nodes"] for c in n.get("children", [])]
    if len(ids) != len(set(ids)):
        fehler.append("doppelte Knoten-IDs")
    idset = set(ids)
    for f in m.get("flows", []) + [cf for n in m["nodes"] for cf in n.get("childFlows", [])]:
        for k in ("from", "to"):
            if f[k] not in idset:
                fehler.append(f'Fluss verweist auf unbekannten Knoten {f[k]}')
    poolids = {p["id"] for p in m.get("pools", [])}
    for f in m.get("messages", []):
        for k in ("from", "to"):
            if f[k] not in idset and f[k] not in poolids:
                fehler.append(f'Nachrichtenfluss verweist auf unbekannten Knoten {f[k]}')
    # Jeder Flussknoten (ausser Daten/Annotation) haengt an mindestens einem Fluss
    inflow = {}
    for f in m.get("flows", []):
        inflow.setdefault(f["from"], 0); inflow[f["from"]] += 1
        inflow.setdefault(f["to"], 0); inflow[f["to"]] += 1
    for n in m["nodes"]:
        if n["type"] in DATA or n["type"] == "textAnnotation" or n.get("children"):
            continue
        if n["type"] == "boundaryEvent" and n.get("dangling"):
            continue
        if inflow.get(n["id"], 0) == 0 and not m.get("absichtlichFehlerhaft"):
            fehler.append(f'Knoten {n["id"]} ist mit keinem Sequenzfluss verbunden')
    # XML-Wohlgeformtheit
    import xml.dom.minidom
    try:
        xml.dom.minidom.parseString(xmltext.encode("utf-8"))
    except Exception as e:
        fehler.append(f"XML nicht wohlgeformt: {e}")
    return fehler

def main(argv):
    filt = argv[1] if len(argv) > 1 else ""
    quellen = sorted(QUELLEN.glob("*.json"))
    ok = 0
    for q in quellen:
        if filt and not q.name.startswith(filt):
            continue
        m = json.loads(q.read_text(encoding="utf-8"))
        xml = build(m)
        fehler = check(m, xml)
        ziel = ZIEL / f'{q.stem}.bpmn'
        ziel.write_text(xml, encoding="utf-8")
        status = "ok " if not fehler else "FEHLER"
        print(f'{status} {ziel.relative_to(ROOT)}  ({len(m["nodes"])} Knoten, {len(m.get("flows", []))} Flüsse)')
        for f in fehler:
            print(f'      - {f}')
        ok += not fehler
    print(f'{ok}/{len(quellen) if not filt else "?"} Modelle ohne Befund')

if __name__ == "__main__":
    main(sys.argv)
