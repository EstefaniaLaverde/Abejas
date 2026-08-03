import server from "./app.config.js";

const port = parseInt(process.env.PORT ?? "2567", 10);

server.listen(port);
console.log(`[Abejas] Servidor escuchando en el puerto ${port}`);
if (process.env.NODE_ENV !== "production") {
  console.log(`[Abejas] Playground: http://localhost:${port}/playground`);
}
