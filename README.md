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

Para jugar con amigos en otras computadoras, el servidor tiene que ser accesible desde internet — ver [Despliegue](#despliegue) más abajo. Mientras tanto, para probar en la misma red local, cada amigo puede abrir `http://localhost:5173` en su propia máquina apuntando al servidor de quien lo esté hosteando (cambiando la URL del servidor en la pantalla de conexión).

## Despliegue

El servidor (`abejas-server`) se despliega en [Koyeb](https://www.koyeb.com) (nivel gratis, soporta WebSocket sin apagarse mientras haya alguien conectado) y la interfaz web (`abejas-web`) en [Vercel](https://vercel.com) (nivel gratis para sitios estáticos).

### Servidor en Koyeb

1. Crea una cuenta en [Koyeb](https://app.koyeb.com) (gratis, sin tarjeta) y conecta tu cuenta de GitHub.
2. **Create Web Service** → **GitHub** → elige este repositorio.
3. En **Build options**, elige **Dockerfile** (usa el `Dockerfile` en la raíz del repo — no hace falta tocar el "Work directory", se queda en la raíz).
4. Agrega las variables de entorno:
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = la URL de tu sitio en Vercel (por ejemplo `https://abejas-tuusuario.vercel.app`). Se puede dejar vacío en el primer deploy y completarlo después de desplegar el frontend (hay que volver a desplegar el servicio para que tome el cambio).
5. Click **Deploy**. Cuando termine, copia la URL pública (algo como `https://abejas-server-tuorg.koyeb.app`).

### Interfaz web en Vercel

1. Crea una cuenta en [Vercel](https://vercel.com) (gratis) y conecta tu cuenta de GitHub.
2. **Add New** → **Project** → elige este repositorio. Vercel detecta el `vercel.json` de la raíz automáticamente (no hace falta cambiar el "Root Directory": se queda en la raíz del repo).
3. Antes de desplegar, agrega la variable de entorno:
   - `VITE_ABEJAS_SERVER_URL` = la URL de Koyeb del paso anterior (por ejemplo `https://abejas-server-tuorg.koyeb.app`).
4. Click **Deploy**. Cuando termine, copia la URL pública (algo como `https://abejas-tuusuario.vercel.app`).
5. Vuelve a Koyeb y actualiza `ALLOWED_ORIGINS` con esta URL de Vercel, y vuelve a desplegar el servicio del servidor.

Listo: comparte la URL de Vercel con tus amigos para que jueguen, cada quien desde su casa.

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
- 🟡 Fase 7 — Despliegue (configuración lista: Dockerfile, `vercel.json`, CORS; falta crear las cuentas en Koyeb/Vercel y desplegar — ver [Despliegue](#despliegue))
