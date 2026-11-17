# Guía de presenter — Quantum Feature Mapping Lab

Guion breve para la experiencia vigente. Los números de Results proceden de
`src/data/kipuCloudModel.json`; no se recalculan durante la presentación.

## Antes de abrir la demo

1. Ejecuta `npm run dev` y abre `http://localhost:5173/`.
2. Confirma que el navegador carga sin conexión remota.
3. Mantén el ESP32 desconectado salvo que se quiera demostrar el adaptador.
4. Usa `Reset` entre sesiones.

## Recorrido principal

### 1. Welcome → Menu

Pulsa **Touch to explore**. En el menú explica que hay dos caminos:
**Discover the technology** y **Enter the lab**.

### 2. Challenge

Selecciona un punto de sensor y luego **Case #36**. Los casos curados apuntan
a un registro guardado exacto (distancia 0). La pantalla distingue:

- lectura solicitada;
- lectura efectiva del caso guardado;
- distancia de matching (distinta de 0 solo cuando se usan sliders o ESP32);
- label del dataset sintético.

Aclara que el diagrama es conceptual y no representa un activo de cliente.

### 3. Method

Recorre las cuatro escenas: inputs, encoding Hamiltoniano, evolución
counterdiabática y medición. Son explicaciones conceptuales; no hay gates,
topología ni solver ejecutándose en vivo.

### 4. Features

Muestra Matrices, Scatter, Fisher y Dimensions. Recalca que las matrices y
correlaciones se calculan o leen desde datos guardados, que el scatter cuántico
es una proyección de dos variables y que Fisher no es SHAP ni causalidad.

### 5. Results

Explica los tres brazos, todos con el mismo detector (regresión logística):

| Brazo | AP |
|---|---:|
| Classical, 4 sensores | 34.5% |
| Quantum, 7 observables | 68.1% |
| Hybrid, 4 + 7 features | 72.8% |

El mensaje correcto es **+38.3 puntos porcentuales de AP para hybrid − raw
bajo el mismo detector**, confirmado estadísticamente en 15 folds
emparejados. Di siempre "con el mismo detector": es lo que el experimento
prueba. P@R90 se muestra por separado (+12.9 pp).

Para audiencia ejecutiva, una frase basta: *el escenario sintético esconde la
señal de alerta en una interacción entre sensores, justo el tipo de patrón que
un detector simple no ve; el método la hace visible*. Para audiencia técnica:
ese diseño del dataset explica buena parte del lift; no es una medición de
desempeño en campo.

Abre un PNG original para mostrar la evidencia. No llames a esas curvas
scores del registro activo del Lab.

### 6. Lab

Mueve los cuatro sliders o selecciona un caso. Verifica que máquina, matching,
los siete observables, scatter y scores muestran el mismo `activeRecordId`.
Usa **Case #36** para la demostración curada.

El Lab no genera features nuevas: muestra los siete valores precomputados del
caso emparejado.

Nota para preguntas técnicas: los umbrales de alerta por caso son un punto de
operación ilustrativo, ajustado sobre los mismos 1.000 casos guardados para
detectar ~90% de las desviaciones etiquetadas; la evidencia validada está en
Results. En el caso #36 el score clásico queda justo debajo de su umbral
(0.2127 frente a 0.2144): es un caso límite, no una falla grosera del modelo
clásico. El panel de scores muestra ambos valores.

## Respuestas rápidas si preguntan

La pantalla ya no repite estas aclaraciones; el expositor las da de palabra
cuando alguien pregunta.

- **¿Los datos son reales?** No: es un escenario industrial sintético de una
  pala eléctrica. El diagrama de la máquina es ilustrativo, no un activo de
  un cliente.
- **¿Se está ejecutando algo cuántico ahora?** No. Kipu ejecutó el Quantum
  Feature Mapping (DQFM) con su servicio Rimay antes de la demo, sobre el
  simulador `ibm_aer`. La demo consulta esos resultados guardados.
- **Diagramas de encoding y evolución (Method):** explican el método del
  paper. La topología exacta de acoplamientos, los coeficientes y las
  compuertas de esta PoC son de Kipu y no se muestran.
- **Matrices de Features:** son correlaciones entre features, no los
  acoplamientos del Hamiltoniano. Un ⟨ZᵢZⱼ⟩ alto no prueba entrelazamiento.
- **Scatter cuántico:** es una proyección de dos observables, no una imagen
  del espacio de Hilbert.
- **Fisher:** mide separabilidad de cada observable por separado; no es SHAP
  ni importancia causal.
- **Dimensiones 4 → 7 → 11:** describen la forma de cada representación; más
  dimensiones no implican mejor desempeño.
- **Distancia en el Lab:** es la distancia geométrica al caso guardado más
  cercano, no una probabilidad ni una confianza.
- **ESP32:** es opcional y solo envía lecturas; no ejecuta ningún modelo ni
  envía datos a Kipu.
- **¿Y frente a modelos clásicos no lineales (gradient boosting, kernels)?**
  La pregunta de esta PoC fue si las features cuánticas mejoran un detector
  lineal fijo e interpretable, y la respuesta es sí. La comparación contra
  modelos no lineales sobre las features híbridas queda fuera de este
  experimento y es el siguiente paso natural (el paper de Kipu usa gradient
  boosting sobre features combinadas). No afirmar que el híbrido supera a
  cualquier modelo clásico.

## Mensajes que no deben decirse

- No decir “quantum advantage proven”.
- No decir “real-time quantum solver” ni “IBM hardware”.
- No presentar el dataset sintético como telemetría real de un cliente.
- No llamar confianza a la distancia normalizada.
- No afirmar reducción de downtime sin un KPI medido.
- No describir `quantumSimulator.js` como el mapeo activo.

## Fallback de conferencia

Si no hay Wi-Fi, ESP32 o WebSocket, usar el recorrido completo con sliders y
casos guardados. Si el navegador pierde el estado, recargar `/` y volver al
menú. Si un PNG no carga, continuar con las barras y métricas JSON; no
reemplazarlo con una figura inventada.
