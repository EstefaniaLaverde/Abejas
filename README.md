# Abejas

Juego de cartas colombiano, online, para jugar con amigos desde el computador.

## Estructura del proyecto

- `abejas-game/` — motor de reglas (TypeScript puro, sin dependencias de red). Ver `plan-desarrollo-abejas.md` para las reglas completas.
- `abejas-server/` — servidor multijugador (Colyseus) que expone el motor de reglas por WebSocket.
- `abejas-web/` — interfaz web (React) para jugar desde el navegador.

## Primeros pasos

Desde la raíz del proyecto:

```bash
npm install
npm run build -w abejas-game
```

Después, en **dos terminales separadas**:

```bash
# Terminal 1: servidor
npm run dev:server

# Terminal 2: interfaz web
npm run dev:web
```

El servidor queda en `http://localhost:2567` (con panel de desarrollo en `/playground`), y la interfaz web en `http://localhost:5173`.

Para jugar con amigos en otras computadoras, el servidor tiene que ser accesible desde internet (por ejemplo desplegado en Railway, Fly.io o Render — ver el plan de desarrollo). Mientras tanto, para probar en la misma red local, cada amigo puede abrir `http://localhost:5173` en su propia máquina apuntando al servidor de quien lo esté hosteando (cambiando la URL del servidor en la pantalla de conexión).

## Tests

```bash
npm test -w abejas-game
npm test -w abejas-server
```

## Estado del desarrollo

- ✅ Fase 1 — Motor de reglas
- ✅ Fase 2 — Servidor multijugador
- ✅ Fase 3 — Trueque en tiempo real (cubierta por el motor + sincronización de Colyseus)
- ✅ Fase 4 — Interfaz web
- ⬜ Fase 5 — Salas y acceso (mejoras: enlaces de invitación, reconexión visible en la UI)
- ⬜ Fase 6 — Pulido (animaciones, sonido, ilustraciones de cartas)
- ⬜ Fase 7 — Despliegue (hosting real para jugar fuera de la red local)
