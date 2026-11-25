import { spawn } from 'child_process';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureElectronInstalled } from './ensure-electron.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '0.0.0.0');
  });
}

async function findFreePort(startPort = 3100) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '0.0.0.0', () => {
      const address = srv.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url, serverProc, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    let settled = false;

    const onEarlyExit = (code) => {
      if (!settled) {
        settled = true;
        reject(new Error(`Dev server exited early with code ${code}`));
      }
    };
    serverProc.once('exit', onEarlyExit);

    const check = () => {
      if (settled) return;
      http
        .get(`${url}/api/database/info`, (res) => {
          res.resume();
          if (!settled) {
            settled = true;
            serverProc.off('exit', onEarlyExit);
            resolve();
          }
        })
        .on('error', () => {
          if (settled) return;
          if (Date.now() - startedAt > timeoutMs) {
            settled = true;
            serverProc.off('exit', onEarlyExit);
            reject(new Error('Timed out waiting for dev server'));
          } else {
            setTimeout(check, 400);
          }
        });
    };
    check();
  });
}

async function main() {
  // 1. Ensure Electron desktop binary is ready before launching backend
  const electronExePath = await ensureElectronInstalled();

  // 2. Build Electron main & preload bundles
  await new Promise((resolve, reject) => {
    const buildProc = spawn(
      process.execPath,
      [path.join(rootDir, 'scripts', 'build-electron.mjs')],
      {
        cwd: rootDir,
        stdio: 'inherit',
      }
    );
    buildProc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build-electron exited with code ${code}`));
    });
  });

  // 3. Pick a guaranteed free port so we never collide with port 3000 (EADDRINUSE)
  const devPort = await findFreePort(3100);
  const devUrl = `http://127.0.0.1:${devPort}`;

  // 4. Start Express + Vite dev server without shell:true (avoids DEP0190)
  const tsxCli = path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const serverProc = spawn(process.execPath, [tsxCli, 'server.ts'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(devPort),
    },
  });

  const cleanup = () => {
    if (!serverProc.killed) {
      serverProc.kill();
    }
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  await waitForServer(devUrl, serverProc);

  // 5. Launch native Electron desktop window pointing to the dev server
  const electronProc = spawn(electronExePath, ['.'], {
    cwd: rootDir,
    stdio: 'inherit',
    windowsHide: false,
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: devUrl,
    },
  });

  electronProc.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('\n[Electron Dev] تعذر تشغيل نافذة Electron:\n', err instanceof Error ? err.message : err);
  process.exit(1);
});
