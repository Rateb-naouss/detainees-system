import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBackendApp } from './server/app.ts';
import { getDbPath } from './server/db.ts';

const currentDir =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  const app = await createBackendApp();

  // ======================== FRONTEND VITE INTEGRATION ========================
  if (!isProd) {
    // Dev Mode: Dynamically import Vite only when needed so production/Electron stays lean
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Prod Mode: Serve compiled dist folder
    const distPath = path.resolve(currentDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ISF Detainees System] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[SQLite] Database stored at: ${getDbPath()}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

