import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'node_modules', 'electron');
const require = createRequire(import.meta.url);

export function getElectronExecutablePath() {
  const pathFile = path.join(electronDir, 'path.txt');
  if (!fs.existsSync(pathFile)) return null;

  const relExe = fs.readFileSync(pathFile, 'utf-8').trim();
  if (!relExe) return null;

  const baseDist = process.env.ELECTRON_OVERRIDE_DIST_PATH || path.join(electronDir, 'dist');
  const fullPath = path.join(baseDist, relExe);
  return fs.existsSync(fullPath) ? fullPath : null;
}

function runElectronInstall(extraEnv = {}) {
  const installScript = path.join(electronDir, 'install.js');
  if (!fs.existsSync(installScript)) return false;

  const result = spawnSync(
    process.execPath,
    ['--dns-result-order=ipv4first', installScript],
    {
      cwd: electronDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...extraEnv,
      },
    }
  );
  return result.status === 0 && getElectronExecutablePath() !== null;
}

function getExpectedExeRelativePath(platform) {
  if (platform === 'darwin' || platform === 'mas') {
    return 'Electron.app/Contents/MacOS/Electron';
  }
  if (platform === 'win32') {
    return 'electron.exe';
  }
  return 'electron';
}

async function tryCurlFallbackDownload() {
  const pkgPath = path.join(electronDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;

  const { version } = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const platform = process.env.ELECTRON_INSTALL_PLATFORM || process.platform;
  const arch = process.env.ELECTRON_INSTALL_ARCH || process.arch;
  const zipName = `electron-v${version}-${platform}-${arch}.zip`;

  const urls = [
    `https://github.com/electron/electron/releases/download/v${version}/${zipName}`,
    `https://npmmirror.com/mirrors/electron/v${version}/${zipName}`,
  ];

  const tmpZip = path.join(os.tmpdir(), `${zipName}.${Date.now()}.zip`);
  const distDir = path.join(electronDir, 'dist');

  try {
    for (const url of urls) {
      console.log(`[Electron Setup] Trying curl download: ${url}`);
      const curlRes = spawnSync(
        'curl',
        ['-fL', '--retry', '2', '--connect-timeout', '20', '-o', tmpZip, url],
        { stdio: 'inherit' }
      );
      if (curlRes.status === 0 && fs.existsSync(tmpZip) && fs.statSync(tmpZip).size > 1024 * 1024) {
        const extractZipPath = require.resolve('@electron-internal/extract-zip', {
          paths: [electronDir, rootDir],
        });
        const { extract } = require(extractZipPath);
        fs.mkdirSync(distDir, { recursive: true });
        await extract(tmpZip, { dir: distDir });

        const exeRel = getExpectedExeRelativePath(platform);
        fs.writeFileSync(path.join(electronDir, 'path.txt'), exeRel, 'utf-8');
        if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip);
        return getElectronExecutablePath() !== null;
      }
      if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip);
    }
  } catch (err) {
    console.warn('[Electron Setup] curl fallback failed:', err instanceof Error ? err.message : err);
    if (fs.existsSync(tmpZip)) {
      try {
        fs.unlinkSync(tmpZip);
      } catch {
        // ignore cleanup error
      }
    }
  }
  return false;
}

export async function ensureElectronInstalled() {
  const existing = getElectronExecutablePath();
  if (existing) {
    return existing;
  }

  if (!fs.existsSync(electronDir)) {
    throw new Error(
      'مجلد node_modules/electron غير موجود. يرجى تشغيل الأمر npm install أولاً.'
    );
  }

  console.log('[Electron Setup] ملف تشغيل Electron غير مكتمل، جاري تنزيله تلقائياً...');

  // Attempt 1: Official GitHub via IPv4-first DNS
  if (runElectronInstall()) {
    return getElectronExecutablePath();
  }

  // Attempt 2: Mirror fallback via IPv4-first DNS
  console.log('[Electron Setup] تعذر التنزيل من المصدر الرئيسي، جاري تجربة الخادم البديل...');
  if (
    runElectronInstall({
      ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
    })
  ) {
    return getElectronExecutablePath();
  }

  // Attempt 3: Native curl fallback + extract-zip (bypasses Node fetch/undici issues on Windows)
  if (await tryCurlFallbackDownload()) {
    return getElectronExecutablePath();
  }

  throw new Error(
    [
      'تعذر تنزيل ملف التشغيل الثنائي لـ Electron (electron.exe) بسبب انقطاع الإنترنت أو حظر الاتصال بـ GitHub.',
      'الحل: تأكد من توفر اتصال بالإنترنت ثم نفّذ الأمر التالي داخل مجلد المشروع:',
      '  npm rebuild electron',
      'أو إذا كان لديك بروكسي/انترنت محدود:',
      '  set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ && node node_modules/electron/install.js',
    ].join('\n')
  );
}

// Allow direct CLI execution: node scripts/ensure-electron.mjs
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  ensureElectronInstalled()
    .then((exePath) => {
      console.log(`[Electron Setup] Electron ready: ${exePath}`);
    })
    .catch((err) => {
      console.error('\n[Electron Setup] خطأ:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
