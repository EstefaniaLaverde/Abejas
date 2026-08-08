#!/usr/bin/env bash
# Levanta todo lo necesario para jugar Abejas en local: instala dependencias
# si hace falta, compila el motor de reglas, y arranca el servidor y la web
# juntos en esta misma terminal. Ctrl+C detiene los dos.
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Instalando dependencias (primera vez, puede tardar un poco)..."
  npm install
fi

echo "Compilando el motor de reglas (@abejas/game)..."
npm run build -w abejas-game

echo ""
echo "Servidor:  http://localhost:2567"
echo "Web:       http://localhost:5173"
echo "(Ctrl+C para detener ambos)"
echo ""

npm run dev -w abejas-server &
SERVER_PID=$!
npm run dev -w abejas-web &
WEB_PID=$!

trap 'echo ""; echo "Deteniendo..."; kill $SERVER_PID $WEB_PID 2>/dev/null; wait 2>/dev/null; exit 0' INT TERM

wait
