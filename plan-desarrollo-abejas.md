# Plan de desarrollo: Abejas (versión online)

## 1. Resumen del juego

Abejas es un juego de cartas colombiano para varios jugadores (hasta 6) donde el objetivo es acumular abejas cosechando cultivos. Cada carta representa una fruta o vegetal nativo, con una rareza (número total de cartas en el mazo) y una tabla de conversión a abejas según cuántas cartas de ese tipo se acumulen.

Cada jugador, en su turno, pasa por tres etapas:

1. **Siembra** — la primera carta de la mano (ordenada de izquierda a derecha) se planta obligatoriamente en una de tres parcelas; si las tres están ocupadas, se descarta una parcela completa al compost. La segunda carta es opcional.
2. **Trueque** — se roban dos cartas del mazo y se muestran boca arriba. El jugador puede plantarlas directamente si le sirven, o negociar con el resto (ofrecer cartas de su mano/robadas a cambio de otras). Reglas clave: las cartas intercambiadas deben plantarse de inmediato por ambas partes, las dos cartas robadas deben jugarse sí o sí, y si el trueque falla el jugador está obligado a plantarlas igual.
3. **Toma de cartas** — se roban dos cartas del mazo y se añaden al final de la mano.

Cualquier jugador puede **cosechar** en cualquier momento: retira de una parcela el número exacto de cartas necesario para una cantidad de abejas, se las queda (viradas), y el resto de esa parcela se pierde al compost. Si el jugador cosecha una parcela que no llega al mínimo de cartas para ninguna abeja, pierde toda la parcela (no gana abejas y las cartas van al compost). Importante: cosechar una parcela **no** la descarta por completo si sí alcanzaba el mínimo — solo se pierde el sobrante que no completa la siguiente conversión; esta es también la forma en la que un jugador puede liberar una parcela antes de la siembra obligatoria de la primera carta.

La etapa de trueque es la que necesita un componente en tiempo real: varios jugadores pueden estar negociando ofertas simultáneamente mientras el jugador en turno decide.

### Fin del juego

El juego termina cuando se agota el mazo principal, se reutiliza el compost como un segundo mazo para una segunda ronda, y al agotarse esa segunda ronda el juego se acaba. Justo antes de terminar, hay una **ronda final de trueques** entre todos los jugadores: si se concreta un trueque, las cartas intercambiadas se plantan obligatoriamente. Al cerrar esa ronda, las cartas que le queden a cada jugador en la mano **no se descartan** — se cuentan, porque en caso de empate en abejas gana quien tenga más cartas en mano.

## 2. Alcance del MVP

Para jugar con hasta 6 amigos desde el computador, el MVP debería incluir:

- Crear una sala con un código/enlace que los amigos puedan abrir en el navegador (sin instalar nada).
- Reparto de mazo, parcelas visibles de todos los jugadores, y mazo de compost.
- Turnos con las tres etapas (siembra, trueque, toma de cartas) reflejadas en la interfaz.
- Sistema de ofertas de trueque: proponer, aceptar/rechazar, en tiempo real, visible para todos.
- Cosecha disponible en cualquier momento para cualquier jugador.
- Conteo de abejas, segunda ronda con el compost, ronda final de trueques y desempate por cartas en mano.
- Chat de voz no es necesario si van a usar Discord/llamada aparte; pero conviene un chat de texto mínimo por si acaso.

Fuera del MVP (para después): cuentas de usuario, historial de partidas, estadísticas, modo espectador, mazos personalizados/arte propio.

## 3. Arquitectura técnica recomendada

**Por qué esta combinación:** el juego es por turnos pero necesita sincronizar estado compartido (parcelas de todos, mazo, ofertas de trueque) en tiempo real entre pocos jugadores. Esto encaja con una arquitectura de servidor autoritativo por salas ("rooms"), no con una app puramente estática ni con nada tipo P2P.

- **Backend de tiempo real:** [Colyseus](https://colyseus.io/) (Node.js/TypeScript) — framework diseñado justo para esto: salas con estado sincronizado automáticamente a todos los clientes, buen soporte para juegos por turnos con sub-fases, y librería cliente lista para web. Alternativa más manual: Node.js + Socket.io si prefieres controlar todo a mano.
- **Frontend:** React (Vite) + TypeScript, corriendo en el navegador. Como quieres jugar "desde el computador", una web app evita que tus amigos tengan que instalar algo — solo abren un link.
- **Lógica del juego:** vive en el servidor (autoritativa), para evitar que alguien haga trampa editando el cliente. El servidor valida cada acción (sembrar, ofrecer trueque, cosechar) contra las reglas.
- **Persistencia:** no es necesaria al inicio — el estado de la partida puede vivir en memoria mientras la sala esté activa. Si más adelante quieres historial o reanudar partidas, se agrega una base de datos ligera (SQLite o Postgres).
- **Hosting:** como es un servidor con conexiones WebSocket persistentes (no encaja con "serverless" tradicional), conviene un servicio con proceso persistente y económico: Railway, Fly.io o Render (planes gratuitos o de unos pocos dólares al mes son suficientes para 6 jugadores esporádicos).
- **Autenticación:** ninguna, solo nombre de jugador al entrar a la sala con el código/link. No hace falta más para jugar entre amigos.

## 4. Modelo de datos del juego (borrador)

- `Card`: tipo (fruta/vegetal), id único, ilustración.
- `CardType`: nombre, cartas totales en el mazo, tabla de conversión cantidad→abejas.
- `Player`: nombre, mano (array ordenado), 3 parcelas (cada una es un array de cartas del mismo tipo o vacía), abejas obtenidas.
- `GameState`: mazo restante, pila de compost, ronda actual (principal o segunda ronda con compost), lista de jugadores, turno actual, fase actual (siembra/trueque/toma), ofertas de trueque activas, bandera de "ronda final de trueques".
- `TradeOffer`: jugador que ofrece, cartas ofrecidas, cartas pedidas, jugador(es) destino, estado (pendiente/aceptada/rechazada).

### Tabla de tipos de carta

Formato `[cantidad de cartas : abejas obtenidas]`. Completa — 10 tipos, 150 cartas en total en el mazo principal.

| Tipo | Conversión a abejas | Cartas en el mazo |
|---|---|---|
| Papa bandera | 4→1, 7→2, 10→3, 12→4 | 24 |
| Lulo | 4→1, 7→2, 9→3, 11→4 | 22 |
| Chontaduro | 4→1, 6→2, 8→3, 10→4 | 20 |
| Achiote | 3→1, 6→2, 8→3, 9→4 | 18 |
| Yacón | 3→1, 5→2, 7→3, 8→4 | 16 |
| Yuca brava | 3→1, 5→2, 6→3, 7→4 | 14 |
| Coca | 2→1, 4→2, 6→3, 7→4 | 12 |
| Maíz morado | 2→1, 4→2, 5→3, 6→4 | 10 |
| Chachafruto | 2→1, 3→2, 4→3, 5→4 | 8 |
| Capuchina | 2→2, 3→3 | 6 |

Nota sobre capuchina: confirmado, es intencional que no dé 1 abeja con la cantidad mínima (2 cartas → 2 abejas directo) y que su máximo sea 3 abejas con 3 cartas.

### Reparto y orden de turnos

Cada jugador inicia la partida con 5 cartas en mano. El orden de turno es fijo durante toda la partida: los jugadores están sentados en círculo y el turno avanza hacia la derecha. El primer jugador en tomar el turno se elige al azar al empezar la partida.

## 5. Roadmap de desarrollo

**Fase 1 — Motor de reglas (sin interfaz)**
Implementar la lógica pura del juego en TypeScript: mazo, reparto, siembra obligatoria/opcional, cosecha, validaciones. Probar con tests automatizados simulando partidas completas. Esto es la parte más importante para que el juego "funcione bien" antes de preocuparse por gráficos.

**Fase 2 — Servidor multijugador**
Envolver el motor de reglas en una `Room` de Colyseus. Sincronizar estado a los clientes. Manejar turnos y transición entre fases.

**Fase 3 — Trueque en tiempo real**
Sistema de ofertas: cualquier jugador puede proponer un intercambio en cualquier momento durante la fase de trueque, el resto ve la oferta en vivo y puede aceptar. Aplicar las reglas de obligatoriedad (cartas robadas deben jugarse, etc.).

**Fase 4 — Interfaz web**
React: tablero con las parcelas de todos los jugadores, mano propia, mazo/compost, panel de ofertas de trueque, indicador de turno y fase.

**Fase 5 — Salas y acceso**
Crear/unirse a sala con código, lista de jugadores conectados, empezar partida cuando todos estén listos.

**Fase 6 — Pulido**
Animaciones básicas, sonido opcional, manejo de desconexiones/reconexión, condición de fin de partida y pantalla de resultados.

**Fase 7 — Despliegue**
Desplegar backend en Railway/Fly.io/Render, frontend en Vercel o Netlify, probar con los 6 amigos en una partida real.

## 6. Próximos pasos sugeridos

Las reglas ya están completas. El siguiente paso es empezar la Fase 1 (motor de reglas en TypeScript, sin interfaz) para validar toda la lógica con tests antes de invertir en el servidor multijugador y la interfaz web.

---

*Este plan usa las reglas de Abejas ya guardadas en tu proyecto. Si alguna regla cambió o falta detalle (por ejemplo condición de victoria, número de cartas iniciales en mano, tamaño del mazo por tipo), avísame y ajusto el modelo de datos.*
