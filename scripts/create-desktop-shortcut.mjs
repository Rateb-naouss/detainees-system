import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureElectronInstalled } from './ensure-electron.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const APP_TITLE = 'نظام إدارة الموقوفين';

function escapePsSingleQuoted(value) {
  return value.replace(/'/g, "''");
}

function createWindowsShortcuts(electronExePath) {
  const iconPath = path.join(rootDir, 'build', 'icon.ico');
  const tmpScript = path.join(os.tmpdir(), `create-isf-shortcut-${Date.now()}.ps1`);

  const psContent = `
$ErrorActionPreference = 'Stop'
$WshShell = New-Object -ComObject WScript.Shell
$DesktopDir = [Environment]::GetFolderPath('Desktop')
$StartMenuDir = Join-Path ([Environment]::GetFolderPath('Programs')) '${APP_TITLE}'

if (!(Test-Path $StartMenuDir)) {
  New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
}

$Targets = @(
  (Join-Path $DesktopDir '${APP_TITLE}.lnk'),
  (Join-Path $StartMenuDir '${APP_TITLE}.lnk')
)

foreach ($ShortcutPath in $Targets) {
  $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
  $Shortcut.TargetPath = '${escapePsSingleQuoted(electronExePath)}'
  $Shortcut.Arguments = '.'
  $Shortcut.WorkingDirectory = '${escapePsSingleQuoted(rootDir)}'
  $Shortcut.Description = 'قوى الأمن الداخلي - مركز القيادة والتحكم | نظام إدارة الموقوفين'
  if (Test-Path '${escapePsSingleQuoted(iconPath)}') {
    $Shortcut.IconLocation = '${escapePsSingleQuoted(iconPath)}, 0'
  }
  $Shortcut.WindowStyle = 1
  $Shortcut.Save()
}

Write-Output "DESKTOP_SHORTCUT=$(Join-Path $DesktopDir '${APP_TITLE}.lnk')"
Write-Output "STARTMENU_SHORTCUT=$(Join-Path $StartMenuDir '${APP_TITLE}.lnk')"
`;

  // UTF-8 with BOM ensures Windows PowerShell reads Arabic shortcut names accurately
  const utf8Bom = Buffer.from('\uFEFF' + psContent, 'utf8');
  fs.writeFileSync(tmpScript, utf8Bom);

  try {
    const res = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpScript],
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );

    if (res.status !== 0) {
      throw new Error(res.stderr || res.stdout || 'PowerShell shortcut creation failed');
    }

    if (res.stdout) {
      process.stdout.write(res.stdout);
    }
  } finally {
    if (fs.existsSync(tmpScript)) {
      fs.unlinkSync(tmpScript);
    }
  }
}

function createLinuxDesktopEntry(electronExePath) {
  const desktopDir = path.join(os.homedir(), 'Desktop');
  const applicationsDir = path.join(os.homedir(), '.local', 'share', 'applications');
  const iconPath = path.join(rootDir, 'build', 'icon.png');

  const content = `[Desktop Entry]
Version=1.0
Type=Application
Name=${APP_TITLE}
Comment=قوى الأمن الداخلي - مركز القيادة والتحكم | نظام إدارة الموقوفين
Exec="${electronExePath}" "${rootDir}"
Path=${rootDir}
Icon=${iconPath}
Terminal=false
Categories=Office;
`;

  fs.mkdirSync(applicationsDir, { recursive: true });
  const appEntry = path.join(applicationsDir, 'isf-detainees-registry.desktop');
  fs.writeFileSync(appEntry, content, { mode: 0o755 });

  if (fs.existsSync(desktopDir)) {
    const desktopEntry = path.join(desktopDir, 'isf-detainees-registry.desktop');
    fs.writeFileSync(desktopEntry, content, { mode: 0o755 });
    console.log(`DESKTOP_SHORTCUT=${desktopEntry}`);
  }
  console.log(`APPLICATIONS_SHORTCUT=${appEntry}`);
}

async function main() {
  const electronExePath = await ensureElectronInstalled();

  if (process.platform === 'win32') {
    createWindowsShortcuts(electronExePath);
  } else if (process.platform === 'linux') {
    createLinuxDesktopEntry(electronExePath);
  } else {
    console.log('استخدم npm run electron:dist لإنشاء حزمة .dmg على macOS.');
    return;
  }

  console.log('\n[Shortcut] تم إنشاء أيقونة البرنامج على سطح المكتب وقائمة ابدأ بنجاح!');
  console.log('[Shortcut] يمكنك الآن إغلاق CMD نهائياً وفتح البرنامج مباشرة عبر الأيقونة.');
}

main().catch((err) => {
  console.error('[Shortcut] فشل إنشاء الأيقونة:', err instanceof Error ? err.message : err);
  process.exit(1);
});
