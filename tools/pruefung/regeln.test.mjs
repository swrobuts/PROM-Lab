import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DOMParser } from '@xmldom/xmldom'
import { leseGraph, pruefeRegeln, vergleicheStruktur } from '../../assets/pruefung.js'

const graph = body => leseGraph(new DOMParser().parseFromString(
  `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"><process id="p">${body}</process></definitions>`, 'application/xml'))
const flow = (a, b) => `<sequenceFlow id="${a}_${b}" sourceRef="${a}" targetRef="${b}" name="ja"/>`
const basic = '<startEvent id="s"/><task id="t" name="Auftrag prüfen"/><endEvent id="e"/>' + flow('s', 't') + flow('t', 'e')
const errors = g => pruefeRegeln(g).filter(b => b.grad === 'fehler')

test('a reachable cycle without an exit is rejected', () => {
  const g = graph(basic + '<task id="loop" name="Auftrag wiederholen"/>' + flow('s', 'loop') + flow('loop', 'loop'))
  assert(errors(g).some(b => b.regel === 'R02' && b.element === 'loop'))
})
test('a retry loop with an exit remains valid', () => {
  assert.equal(errors(graph(basic + flow('t', 't'))).length, 0)
})
test('a disconnected cycle is rejected by the rule checker', () => {
  const g = graph(basic + '<task id="loop" name="Auftrag wiederholen"/>' + flow('loop', 'loop'))
  assert(errors(g).some(b => b.regel === 'R02' && b.element === 'loop'))
})
test('an isolated end event is rejected', () => {
  assert(errors(graph(basic + '<endEvent id="isolated"/>')).some(b => b.regel === 'R02' && b.element === 'isolated'))
})
test('subprocess contents are checked for disconnected elements', () => {
  const g = graph(basic + '<subProcess id="sub">' + basic.replaceAll('id="', 'id="i_').replaceAll('Ref="', 'Ref="i_') +
    '<task id="lost" name="Auftrag suchen"/></subProcess>' + flow('t', 'sub') + flow('sub', 'e'))
  assert(errors(g).some(b => b.regel === 'R02' && b.element === 'lost'))
  assert(vergleicheStruktur(g, {}).some(b => b.grad === 'fehler'))
})
test('a boundary path is reachable from its attached task', () => {
  const g = graph(basic + '<boundaryEvent id="b" attachedToRef="t"><timerEventDefinition/></boundaryEvent>' + flow('b', 'e'))
  assert.equal(errors(g).length, 0)
})
test('sequence flows cannot cross a subprocess boundary', () => {
  const g = graph(basic + '<subProcess id="sub"><startEvent id="inner_s"/><endEvent id="inner_e"/>' + flow('inner_s', 'inner_e') +
    '</subProcess>' + flow('t', 'sub') + flow('sub', 'e') + flow('t', 'inner_e'))
  assert(errors(g).some(b => b.regel === 'R06' && b.element === 't_inner_e'))
})

test('P07-05 accepts the optional XOR merge described by its hint', () => {
  const u = JSON.parse(readFileSync(new URL('../../data/uebungen/lab-07.json', import.meta.url))).find(u => u.id === 'P07-05')
  const xml = readFileSync(new URL('../../' + u.modell, import.meta.url), 'utf8')
    .replaceAll('targetRef="sp1"', 'targetRef="merge"')
    .replace('</bpmn:process>', '<bpmn:exclusiveGateway id="merge"/><bpmn:sequenceFlow id="merge_sp1" sourceRef="merge" targetRef="sp1"/></bpmn:process>')
  const g = leseGraph(new DOMParser().parseFromString(xml, 'application/xml'))
  assert.equal(errors(g).length, 0)
  assert.equal(vergleicheStruktur(g, u.pruefung).filter(b => b.grad === 'fehler').length, 0)
})
