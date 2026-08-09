# Abejas

Juego de cartas colombiano, online, para jugar con amigos desde el computador.

## Estructura del proyecto

- `abejas-game/` — motor de reglas (TypeScript puro, sin dependencias de red). Ver `plan-desarrollo-abejas.md` para las reglas completas.
- `abejas-server/` — servidor multijugador (Colyseus) que expone el motor de reglas por WebSocket.
- `abejas-web/` — interfaz web (React) para jugar desde el navegador.

## Primeros pasos

La forma más simple: desde la raíz del proyecto, un solo comando levanta todo (instala dependencias si hace falta, compila el motor de reglas, y arranca servidor + web juntos en la misma terminal; `Ctrl+C` detiene ambos):

```bash
./dev.sh
# o, equivalente:
npm run dev
```

El servidor queda en `http://localhost:2567` (con panel de desarrollo en `/playground`), y la interfaz web en `http://localhost:5173`.

<details>
<summary>Manualmente, paso a paso (si prefieres dos terminales separadas)</summary>

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

</details>

Para jugar con amigos en otras computadoras, el servidor tiene que ser accesible desde internet — ver [Despliegue](#despliegue) más abajo. Mientras tanto, para probar en la misma red local, cada amigo puede abrir `http://localhost:5173` en su propia máquina apuntando al servidor de quien lo esté hosteando (cambiando la URL del servidor en la pantalla de conexión).

## Despliegue

El servidor (`abejas-server`) se despliega en una VM gratis para siempre del ["Always Free" de Oracle Cloud](https://www.oracle.com/cloud/free/) (no se apaga por inactividad, a diferencia de la mayoría de los "free tier" de plataformas tipo Railway/Render/Koyeb). La interfaz web (`abejas-web`) se despliega en [Vercel](https://vercel.com) (gratis para sitios estáticos).

Nota: esta ruta requiere más pasos manuales que un Railway/Vercel típico porque es una VM real, no una plataforma administrada. A cambio, no depende de que una startup mantenga su nivel gratis (ver la sección de Koyeb más abajo — cerró el registro de cuentas nuevas en 2026).

<details>
<summary><strong>Alternativa: usar tu propia Raspberry Pi en vez de Oracle Cloud</strong></summary>

Si tienes una Raspberry Pi en casa, es una alternativa mejor que cualquier "nivel gratis" de la nube: es tuya, no depende de que una empresa cambie sus términos (como pasó con Koyeb y con los límites de Oracle Always Free), y el consumo eléctrico es mínimo. Reemplaza los pasos 1-4 de abajo por estos:

**1. Preparar la tarjeta SD**

Con el [Raspberry Pi Imager](https://www.raspberrypi.com/software/) en tu Mac: elige **Raspberry Pi OS Lite (64-bit)** (no hace falta el escritorio, es un servidor headless). Antes de escribir la tarjeta, click en el ícono de engranaje (⚙️) para configurar de una vez: habilitar SSH, usuario/contraseña, y tu WiFi si no vas a conectarla por cable. Escribe la tarjeta, métela en la Pi, y préndela.

**2. Conectarte por SSH**

Busca la IP de la Pi en tu red (desde el router, o con `ping raspberrypi.local` si le dejaste ese nombre) y conéctate:

```bash
ssh tu-usuario@IP-DE-LA-PI
```

**3. Instalar lo necesario**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential python3 git

# Node.js 22 LTS (mismo comando que en la VM de Oracle, también sirve en ARM)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
```

**4. Descargar, compilar y correr el servidor**

```bash
git clone https://github.com/TU-USUARIO/Abejas.git
cd Abejas
npm install
npm run build -w abejas-game
npm run build -w abejas-server
```

Edita `abejas-server/ecosystem.config.cjs` (`nano abejas-server/ecosystem.config.cjs`) y reemplaza `ALLOWED_ORIGINS` por la URL real de tu app en Vercel (puedes dejarlo con un valor de ejemplo por ahora y editarlo después, una vez tengas esa URL — solo hay que correr `pm2 restart abejas-server` cuando lo cambies).

```bash
cd abejas-server
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # sigue la instrucción que imprime, para que arranque solo si la Pi se reinicia
```

**5. Exponerlo a internet con Cloudflare Tunnel (sin abrir puertos en tu router)**

En vez de nginx + certbot + IP pública fija (que en una casa normalmente no tienes), usamos [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/): un programita que "llama" hacia Cloudflare desde adentro de tu red, sin necesidad de configurar el router, y Cloudflare se encarga del HTTPS.

```bash
# Instalar cloudflared (build para ARM)
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb

# Túnel rápido: da una URL pública al instante, sin cuenta ni dominio
pm2 start cloudflared --name abejas-tunnel -- tunnel --url http://localhost:2567
pm2 save
```

Mira la URL que te dio en `pm2 logs abejas-tunnel` (algo como `https://palabras-random.trycloudflare.com`). Esa es la URL de tu servidor — pégala en `VITE_ABEJAS_SERVER_URL` en Vercel, o compártela directamente con tus amigos para que la pongan en "Opciones avanzadas" al conectarse.

Ojo: como el túnel no tiene cuenta ni dominio propio, la URL cambia si el proceso se reinicia (por ejemplo si la Pi se reinicia). Mientras la Pi y pm2 sigan corriendo sin interrupciones, la URL se mantiene igual. Si en algún momento cambia, revisa `pm2 logs abejas-tunnel` para ver la nueva y actualízala en Vercel.

Si prefieres una URL que nunca cambie, existe la opción de un "túnel con nombre" comprando un dominio bien barato (~$10-15/año) y conectándolo a una cuenta gratuita de Cloudflare — pregúntame si quieres esa variante.

Después de esto, sigue directo con el paso 5 de abajo ("Interfaz web en Vercel"), usando tu URL de `trycloudflare.com` en vez de la de sslip.io.

</details>

<details>
<summary><strong>Alternativa: modo "bajo demanda" (sin dejar nada prendido)</strong></summary>

Si no quieres tener un servidor corriendo todo el tiempo (ni en una VM ni en la Pi dejada prendida), usa `host.sh`: levanta el servidor y un túnel público de Cloudflare solo mientras estés jugando, y con `Ctrl+C` apaga todo al terminar. Corre en tu Mac o en la Raspberry Pi, donde prefieras tenerlo en el momento.

```bash
# Una sola vez: instalar cloudflared
brew install cloudflared   # en Mac; en la Pi ver la sección de arriba

# Antes de la primera vez: edita host.sh y reemplaza ALLOWED_ORIGINS
# con la URL real de tu app en Vercel.

./host.sh
```

Te va a imprimir una URL pública (`https://palabras-random.trycloudflare.com`) — ponla en "Opciones avanzadas" al conectarte, o compártela con tus amigos. Cuando terminen de jugar, `Ctrl+C` y listo, nada queda corriendo de fondo.

(La interfaz web sigue siempre desplegada en Vercel — lo único "bajo demanda" es el servidor del juego.)

</details>

### 1. Crear la VM en Oracle Cloud

1. Crea una cuenta en [Oracle Cloud](https://www.oracle.com/cloud/free/) (pide verificación de identidad y a veces tarjeta, pero los recursos "Always Free" no cobran).
2. En la consola: **Networking → Virtual Cloud Networks → Start VCN Wizard → Create VCN with Internet Connectivity**. Deja los valores por defecto y créala (esto ya abre el puerto 22 para SSH).
3. En esa misma VCN, entra a la **Security List** pública (la que creó el wizard) y agrega dos reglas de entrada (**Ingress Rules**): puerto **80** y puerto **443**, ambas con "Source CIDR" `0.0.0.0/0`. Esto es aparte del firewall del sistema operativo (paso 5).
4. **Compute → Instances → Create Instance**:
   - Imagen: **Ubuntu 24.04 LTS** (o la LTS más reciente disponible).
   - Shape: click **Change shape** → pestaña **Ampere** → **VM.Standard.A1.Flex** (marcada como "Always Free eligible"). 1 OCPU / 6 GB de RAM sobra para este juego.
   - En "Add SSH keys", sube tu llave pública. Si no tienes una, en tu Mac corre `ssh-keygen -t ed25519` (Enter en todo) y sube el archivo `~/.ssh/id_ed25519.pub`.
   - Click **Create**. Anota la **IP pública** que le asigna.

### 2. Configurar la VM por SSH

Conéctate desde tu Mac (reemplaza la IP):

```bash
ssh ubuntu@TU_IP_PUBLICA
```

Ya adentro, arregla el firewall interno de Ubuntu en Oracle Cloud (bloquea tráfico por defecto aunque el Security List ya lo permita) e instala lo necesario:

```bash
sudo apt update && sudo apt upgrade -y
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo apt install -y iptables-persistent nginx git
sudo netfilter-persistent save

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2

# Certbot para HTTPS (via snap, forma recomendada por certbot)
sudo apt install -y snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 3. Descargar y correr abejas-server

```bash
git clone https://github.com/TU-USUARIO/Abejas.git
cd Abejas
npm install
npm run build -w abejas-game
npm run build -w abejas-server
```

Edita `abejas-server/ecosystem.config.cjs` (`nano abejas-server/ecosystem.config.cjs`) y reemplaza `ALLOWED_ORIGINS` por la URL real de tu app en Vercel (puedes dejarlo con un valor de ejemplo por ahora y editarlo después, una vez tengas esa URL — solo hay que correr `pm2 restart abejas-server` cuando lo cambies).

```bash
cd abejas-server
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # sigue la instrucción que imprime (un comando para copiar y pegar)
```

### 4. HTTPS con un dominio gratis (sslip.io)

El navegador exige conexiones seguras (`wss://`) desde un sitio HTTPS como Vercel, y Let's Encrypt no emite certificados para IPs sueltas — por eso se usa [sslip.io](https://sslip.io), un servicio gratis que convierte tu IP en un dominio real. Si tu IP pública es, por ejemplo, `10.20.30.40`, tu dominio es `10-20-30-40.sslip.io` (con guiones en vez de puntos).

```bash
sudo cp ~/Abejas/deploy/nginx-abejas.conf /etc/nginx/sites-available/abejas
sudo sed -i 's/TU-DOMINIO-AQUI/10-20-30-40.sslip.io/' /etc/nginx/sites-available/abejas   # con tu IP real
sudo ln -s /etc/nginx/sites-available/abejas /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d 10-20-30-40.sslip.io   # con tu IP real; pide tu email y acepta términos
```

Al terminar, tu servidor queda accesible en `https://10-20-30-40.sslip.io` (con tu IP real). Pruébalo abriendo esa URL en el navegador — debe responder `{"ok":true,"game":"Abejas"}`.

### 5. Interfaz web en Vercel

1. Crea una cuenta en [Vercel](https://vercel.com) (gratis) y conecta tu cuenta de GitHub.
2. **Add New** → **Project** → elige este repositorio. Vercel detecta el `vercel.json` de la raíz automáticamente (no hace falta cambiar el "Root Directory": se queda en la raíz del repo).
3. Antes de desplegar, agrega la variable de entorno:
   - `VITE_ABEJAS_SERVER_URL` = tu dominio de sslip.io del paso anterior (por ejemplo `https://10-20-30-40.sslip.io`).
4. Click **Deploy**. Cuando termine, copia la URL pública (algo como `https://abejas-tuusuario.vercel.app`).
5. Vuelve a la VM y actualiza `ALLOWED_ORIGINS` en `abejas-server/ecosystem.config.cjs` con esa URL de Vercel, luego:
   ```bash
   pm2 restart abejas-server
   ```

Listo: comparte la URL de Vercel con tus amigos para que jueguen, cada quien desde su casa.

<details>
<summary>Error "No workspaces found: --workspace=abejas-game" en el build de Vercel</summary>

Pasa cuando el **Root Directory** del proyecto en Vercel quedó apuntando a `abejas-web` en vez de la raíz del repo (el asistente de "Add New Project" a veces lo sugiere solo, al detectar el `vite.config` ahí adentro). Con eso, `npm install` y el build corren dentro de `abejas-web/`, que no tiene el `workspaces` del monorepo — de ahí el error.

Arreglo: en el proyecto de Vercel, **Settings → General → Root Directory**, bórralo (o ponlo en `./`) para que quede en la raíz del repo, guarda, y vuelve a desplegar (**Deployments → ⋯ → Redeploy**). El `vercel.json` de la raíz ya trae el `buildCommand`/`installCommand`/`outputDirectory` correctos para el monorepo.

</details>

<details>
<summary>¿Por qué no Koyeb/Railway/Render?</summary>

Koyeb era la primera opción recomendada, pero cerró el registro de cuentas nuevas gratis en 2026 tras ser comprada por Mistral AI. Railway cobra desde $5/mes para un servicio siempre activo. Render sí es gratis, pero apaga el servicio a los 15 minutos sin tráfico, lo que cortaría partidas en curso y perdería el estado del juego (vive en memoria). Oracle Cloud Always Free es más manual de configurar, pero no se apaga y es una oferta estable de una empresa grande, no de una startup que puede cambiar de plan.

</details>

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
- 🟡 Fase 7 — Despliegue (configuración lista: nginx, pm2, `vercel.json`, CORS; falta crear la VM en Oracle Cloud y la cuenta en Vercel — ver [Despliegue](#despliegue))
