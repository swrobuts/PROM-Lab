# Mitgelieferte BPMN-Bibliotheken

`bpmn.mjs` ist ein mit esbuild erzeugtes ESM-Bündel aus

* bpmn-js 18.19.0 (Modeler und NavigatedViewer), Lizenz: bpmn.io-Lizenz (`LICENSE-bpmn-js.txt`).
  Das bpmn.io-Logo unten rechts in jedem Diagramm darf nicht entfernt werden.
* bpmn-js-token-simulation 0.40.0 (Marken-Simulation), Lizenz MIT (`LICENSE-token-simulation.txt`).

Neu erzeugen:

```bash
npm i bpmn-js@18.19.0 bpmn-js-token-simulation@0.40.0 esbuild
cat > entry.js <<'X'
export { default as Modeler } from 'bpmn-js/lib/Modeler'
export { default as NavigatedViewer } from 'bpmn-js/lib/NavigatedViewer'
export { default as TokenSimulationModule } from 'bpmn-js-token-simulation'
export { default as TokenSimulationViewerModule } from 'bpmn-js-token-simulation/lib/viewer'
X
npx esbuild entry.js --bundle --format=esm --minify --outfile=bpmn.mjs
```

Die CSS-Dateien und der Symbolfont stammen unverändert aus `bpmn-js/dist/assets` und
`bpmn-js-token-simulation/assets/css`.
