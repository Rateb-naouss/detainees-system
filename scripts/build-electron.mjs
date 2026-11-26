import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist-electron');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  // Bundle Electron main process + Express/SQLite server into CommonJS
  await build({
    entryPoints: [path.join(rootDir, 'electron', 'main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: ['electron'],
    minify: true,
    define: { 'import.meta.url': '""' },
    outfile: path.join(outDir, 'main.cjs'),
    sourcemap: false,
  });

  // Bundle Electron preload script into CommonJS
  await build({
    entryPoints: [path.join(rootDir, 'electron', 'preload.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: ['electron'],
    outfile: path.join(outDir, 'preload.cjs'),
    sourcemap: false,
  });

  // Copy sql-wasm.wasm next to main.cjs for reliable loading in packaged ASAR
  const wasmSrc = path.join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const wasmDest = path.join(outDir, 'sql-wasm.wasm');
  if (fs.existsSync(wasmSrc)) {
    fs.copyFileSync(wasmSrc, wasmDest);
  }

  console.log('[Electron Build] Built dist-electron/main.cjs, preload.cjs, and sql-wasm.wasm');
}

run().catch((err) => {
  console.error('[Electron Build] Failed:', err);
  process.exit(1);
});
