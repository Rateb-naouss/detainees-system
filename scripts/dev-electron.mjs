import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEV_URL = 'http://localhost:3000';
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(`${url}/api/database/info`, (res) => {
          res.resume();
          resolve();
        })
        .on('error', () => {
          if (Date.now() - startedAt > timeoutMs) {
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
  // 1. Build Electron main & preload first
  await new Promise((resolve, reject) => {
    const buildProc = spawn(process.execPath, [path.join(rootDir, 'scripts', 'build-electron.mjs')], {
      cwd: rootDir,
      stdio: 'inherit',
    });
    buildProc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build-electron exited with code ${code}`));
    });
  });

  // 2. Start Express + Vite dev server
  const serverProc = spawn(npxCmd, ['tsx', 'server.ts'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWin,
  });

  const cleanup = () => {
    if (!serverProc.killed) {
      serverProc.kill();
    }
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  await waitForServer(DEV_URL);

  // 3. Launch Electron pointing to the dev server
  const electronProc = spawn(npxCmd, ['electron', '.'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWin,
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: DEV_URL,
    },
  });

  electronProc.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[Electron Dev] Error:', err);
  process.exit(1);
});
