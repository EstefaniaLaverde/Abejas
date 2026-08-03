// Config de PM2 para correr abejas-server en la VM (Oracle Cloud u otro
// VPS). Ver README, sección "Despliegue".
//
// Después de clonar el repo en la VM, edita ALLOWED_ORIGINS con la URL real
// de tu app en Vercel (no hace falta commitear ese cambio, es solo local en
// la VM). Luego:
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup   (sigue las instrucciones que imprime, para que arranque
//                  solo si la VM se reinicia)
module.exports = {
  apps: [
    {
      name: "abejas-server",
      script: "dist/main.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "2567",
        // Reemplaza con la URL real de tu app en Vercel.
        ALLOWED_ORIGINS: "https://REEMPLAZAR-tu-app.vercel.app",
      },
    },
  ],
};
