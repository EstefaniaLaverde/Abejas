# Imagen de producción del servidor multijugador (abejas-server), pensada
# para desplegarse en Koyeb (build desde Dockerfile). Se construye desde la
# raíz del monorepo porque abejas-server depende del workspace @abejas/game.
FROM node:22-slim

WORKDIR /app

# Copiamos todo el repo (node_modules/dist quedan fuera por .dockerignore).
COPY . .

RUN npm ci

# Solo se necesita compilar el motor de reglas y el servidor; la interfaz
# web (abejas-web) se despliega aparte, en Vercel.
RUN npm run build -w abejas-game
RUN npm run build -w abejas-server

ENV NODE_ENV=production

# Koyeb inyecta la variable PORT (por defecto 8080) y espera que la app
# escuche en ese puerto; main.ts ya lee process.env.PORT.
EXPOSE 8080

CMD ["node", "abejas-server/dist/main.js"]
