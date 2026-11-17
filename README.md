# Quantum Feature Mapping Lab

Demo React/Vite de NTT DATA × Kipu Quantum para explorar quantum feature mapping
sobre telemetría industrial sintética. La experiencia actual es una secuencia
de escenas guiadas con un laboratorio local; no ejecuta un solver remoto ni
requiere conexión a internet para mostrar los resultados guardados.

## Ejecutar

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint
npm test
npm run build     # genera dist/
npm run preview   # sirve dist/ localmente
```

La demo funciona sin ESP32. El WebSocket es opcional y solo aporta lecturas
físicas que se emparejan determinísticamente con un caso guardado.

## Rutas de la experiencia

1. `/` — bienvenida.
2. `/experience` — menú con recorrido guiado o acceso directo al Lab.
3. `/challenge` — cuatro señales, presets y casos guardados.
4. `/method` — explicación conceptual del encoding, evolución y readout.
5. `/features` — matrices, scatter, Fisher y dimensionalidad.
6. `/results` — benchmark precomputado y evidencia científica original.
7. `/lab` — sliders, presets, selector de registro, readout y ESP32 opcional.

El estado de `activeRecordId`, la lectura solicitada, el matching, los ejes y
el modo se centraliza en `ExperienceProvider`.

## Contrato de datos

- `src/data/realCases.json`: 1.000 casos guardados, cuatro sensores, siete
  observables `q0..q3`, `corr_0_1`, `corr_1_2`, `corr_1_3`, labels y scores por
  caso.
- `src/data/kipuCloudModel.json`: métricas agregadas del benchmark de 15 folds,
  AP, P@R90 y Fisher.
- `public/cloud_artifacts/`: PNG originales del benchmark.
- Los resultados Kipu fueron precomputados offline con backend `ibm_aer`.
  `ibm_aer` identifica un simulador, no hardware IBM en vivo.

El Lab no interpola features ni inventa scores: un slider o una lectura ESP32
se normaliza y se empareja con el vecino más cercano entre los 1.000 casos.
Siempre se distinguen `requested reading`, `matched saved record`, distancia y
origen. La distancia no es una probabilidad de confianza.

## Evidencia y límites

Results muestra tres brazos desde JSON, todos con el mismo detector lineal
(regresión logística): raw, quantum e hybrid. El lift de hybrid frente a raw
(+38.3 pp de AP, confirmado estadísticamente en 15 folds emparejados) se
comunica siempre acotado a ese detector. No se afirma quantum advantage.

El dataset es sintético y fue diseñado para que la señal relevante esté en
una interacción entre sensores; el backend es precomputado y existe un
presupuesto finito de shots. Consulta [docs/demo-guide.md](docs/demo-guide.md)
para el guion de presentación.

Método: Digitized Counterdiabatic Quantum Feature Mapping (DQFM) de Kipu
Quantum, ejecutado con su servicio Rimay. Referencia científica: A. Simen et
al., arXiv:2510.13807 (2025), publicado con el título *Digitized
Counterdiabatic Quantum Feature Extraction*.

## Código legado

`src/utils/quantumSimulator.js` pertenece a una arquitectura anterior. Produce
14 observables mediante un simulador local, pero no es el camino activo de la
experiencia actual. El flujo vigente lee los siete observables precomputados de
`realCases.json`; no se debe describir el simulador legado como Rimay DQFM ni
como un solver que corre durante la demo.

Los scripts `kipu-submit`, `kipu-sync`, `kipu-datapool` y similares son
herramientas offline/build-time y no se ejecutan desde la UI.

## ESP32 opcional

La pestaña WebSocket del Lab acepta payloads con `hoistLoad`, `crowdVib`,
`driveTemp`, `cableTension` y opcionalmente `mode`. Los rangos se validan en
el navegador; un payload inválido o una desconexión se muestran como error sin
bloquear los sliders simulados.

Para probar un mock local:

```bash
npm run mock-board
```

No se envían muestras a Kipu desde el navegador.
