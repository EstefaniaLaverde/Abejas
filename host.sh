#!/usr/bin/env bash
# Levanta el servidor de Abejas y lo expone a internet con un túnel rápido de
# Cloudflare, solo mientras estés jugando — nada queda prendido de fondo.
# Corre esto (en tu Mac o en la Raspberry Pi, donde prefieras) justo antes de
# jugar con tus amigos; Ctrl+C apaga el servidor y el túnel al terminar.
#
# Requiere cloudflared instalado:
#   Mac:  brew install cloudflared
#   Pi:   ver el README, sección "Alternativa: usar tu propia Raspberry Pi"
#
# Antes de la primera vez, reemplaza ALLOWED_ORIGINS abajo con la URL real de
# tu app en Vercel (el CORS del servidor solo deja pasar peticiones desde ahí).
ALLOWED_ORIGINS="https://abejas-abejas-web-1kwq.vercel.app/"

set -e
cd "$(dirname "$0")"

if ! command -v cloudflared &> /dev/null; then
  echo "Falta cloudflared. Instálalo con: brew install cloudflared"
  echo "(o ver el README si esto corre en la Raspberry Pi)"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Instalando dependencias (primera vez, puede tardar un poco)..."
  npm install
fi

echo "Compilando el motor de reglas y el servidor..."
npm run build -w abejas-game
npm run build -w abejas-server

echo ""
echo "Arrancando el servidor..."
(cd abejas-server && ALLOWED_ORIGINS="$ALLOWED_ORIGINS" node dist/main.js) &
SERVER_PID=$!

sleep 2

TUNNEL_LOG=$(mktemp)
echo "Abriendo el túnel público..."
cloudflared tunnel --url http://localhost:2567 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

echo "Esperando la URL pública..."
URL=""
for i in $(seq 1 30); do
  URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)
  if [ -n "$URL" ]; then
    break
  fi
  sleep 1
done

echo ""
echo "=================================================="
if [ -n "$URL" ]; then
  echo "  Servidor listo en: $URL"
  echo ""
  echo "  Ponla en 'Opciones avanzadas' al conectarte desde"
  echo "  la web de Vercel, o compártela con tus amigos para"
  echo "  que la peguen ellos."
else
  echo "  No se detectó la URL automáticamente."
  echo "  Revisa el log: $TUNNEL_LOG"
fi
echo "=================================================="
echo ""
echo "(Ctrl+C para apagar el servidor y el túnel)"

trap 'echo ""; echo "Apagando..."; kill $SERVER_PID $TUNNEL_PID 2>/dev/null; wait 2>/dev/null; rm -f "$TUNNEL_LOG"; exit 0' INT TERM

wait
