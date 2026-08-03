import { defineServer, defineRoom, matchMaker } from "colyseus";
import { AbejasRoom } from "./AbejasRoom.js";

/**
 * Orígenes permitidos para las peticiones del matchmaking (el cliente de
 * Colyseus hace un POST antes de subir a WebSocket). En local, por defecto,
 * se permite la interfaz web corriendo con `npm run dev:web`. En producción
 * se configura con la variable de entorno `ALLOWED_ORIGINS` (separada por
 * comas), por ejemplo el dominio de Vercel.
 *
 * Colyseus maneja el CORS de las rutas de matchmaking a su propio nivel (no
 * a través de middleware de Express) y por defecto refleja cualquier origen
 * (`Access-Control-Allow-Origin: *`, ver `matchMaker.controller`). Por eso
 * se restringe sobreescribiendo `getCorsHeaders`, tal como documenta
 * Colyseus, en vez de usar el paquete `cors` de Express.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

matchMaker.controller.getCorsHeaders = (headers: Headers) => {
  const origin = headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "",
  };
};

/**
 * Configuración compartida del servidor. Separada de `main.ts` para poder
 * arrancarla también desde los tests de integración (`@colyseus/testing`)
 * sin necesidad de un puerto real.
 */
const server = defineServer({
  rooms: {
    abejas: defineRoom(AbejasRoom),
  },
  express: (app) => {
    app.get("/", (_req: unknown, res: { json: (body: unknown) => void }) => {
      res.json({ ok: true, game: "Abejas" });
    });

    if (process.env.NODE_ENV !== "production") {
      // Panel de desarrollo: http://localhost:2567/playground
      // No lo montamos en producción (expone acceso completo a las salas).
      import("@colyseus/playground").then(({ playground }) => {
        app.use("/playground", playground());
      });
    }
  },
});

export default server;
