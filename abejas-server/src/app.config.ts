import { defineServer, defineRoom } from "colyseus";
import { AbejasRoom } from "./AbejasRoom.js";

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
