import {
  app,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  ipcMain,
  session,
  shell,
} from 'electron';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createBackendApp } from '../server/app.ts';
import { getDataBaseDir, getDbPath, getUploadsDir, persistDB } from '../server/db.ts';

const currentDir =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let httpServer: http.Server | null = null;
let serverUrl = '';

// Ensure single instance so two windows never contend over detainees.db
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getWritableDataDir(): string {
  if (app.isPackaged) {
    return app.getPath('userData');
  }
  return app.getAppPath();
}

function buildAppMenu() {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const, label: 'حول البرنامج' },
              { type: 'separator' as const },
              { role: 'hide' as const, label: 'إخفاء' },
              { role: 'quit' as const, label: 'خروج' },
            ],
          },
        ]
      : []),
    {
      label: 'ملف',
      submenu: [
        {
          label: 'فتح مجلد قاعدة البيانات والصور',
          click: () => {
            const dir = getDataBaseDir();
            if (fs.existsSync(dir)) {
              shell.openPath(dir);
            }
          },
        },
        {
          label: 'فتح مجلد الصور (uploads/photos)',
          click: () => {
            const dir = getUploadsDir();
            if (fs.existsSync(dir)) {
              shell.openPath(dir);
            }
          },
        },
        { type: 'separator' },
        isMac
          ? { role: 'close', label: 'إغلاق النافذة' }
          : { role: 'quit', label: 'خروج من البرنامج' },
      ],
    },
    {
      label: 'تحرير',
      submenu: [
        { role: 'undo', label: 'تراجع' },
        { role: 'redo', label: 'إعادة' },
        { type: 'separator' },
        { role: 'cut', label: 'قص' },
        { role: 'copy', label: 'نسخ' },
        { role: 'paste', label: 'لصق' },
        { role: 'selectAll', label: 'تحديد الكل' },
      ],
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'reload', label: 'إعادة تحميل' },
        { role: 'forceReload', label: 'تحديث إجباري' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'الحجم الافتراضي' },
        { role: 'zoomIn', label: 'تكبير' },
        { role: 'zoomOut', label: 'تصغير' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ملء الشاشة' },
        ...(!app.isPackaged ? [{ role: 'toggleDevTools' as const, label: 'أدوات المطور' }] : []),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function startEmbeddedBackend(): Promise<string> {
  if (process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL;
  }

  const dataDir = getWritableDataDir();
  const staticDistDir = path.join(app.getAppPath(), 'dist');

  const expressApp = await createBackendApp({
    dataDir,
    staticDistDir,
  });

  return new Promise((resolve, reject) => {
    const server = http.createServer(expressApp);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        httpServer = server;
        const url = `http://127.0.0.1:${address.port}`;
        console.log(`[Electron] Embedded backend & SQLite running at ${url}`);
        console.log(`[Electron] Data directory: ${getDataBaseDir()}`);
        resolve(url);
      } else {
        reject(new Error('Failed to resolve embedded HTTP server port'));
      }
    });
  });
}

function registerIpcHandlers() {
  ipcMain.handle('electron:get-app-info', () => ({
    version: app.getVersion(),
    dataDir: getDataBaseDir(),
    dbPath: getDbPath(),
    uploadsDir: getUploadsDir(),
    isPackaged: app.isPackaged,
    platform: process.platform,
  }));

  ipcMain.handle('electron:open-data-folder', async () => {
    const dir = getDataBaseDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return shell.openPath(dir);
  });

  ipcMain.handle('electron:open-photos-folder', async () => {
    const dir = getUploadsDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return shell.openPath(dir);
  });
}

function setupDownloadHandler() {
  session.defaultSession.on('will-download', (_event, item) => {
    const filename = item.getFilename() || 'download';
    const defaultPath = path.join(app.getPath('downloads'), filename);
    item.setSaveDialogOptions({
      title: 'حفظ الملف',
      defaultPath,
    });
  });
}

function createMainWindow(targetUrl: string) {
  const iconPath = path.join(app.getAppPath(), 'build', 'icon.png');
  const preloadPath = path.join(currentDir, 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    center: true,
    autoHideMenuBar: true,
    title: 'قوى الأمن الداخلي - مركز القيادة والتحكم | نظام إدارة الموقوفين',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#f1f5f9',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Prevent external popup windows
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.loadURL(targetUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('lb.isf.detainees.registry');
  }

  buildAppMenu();
  registerIpcHandlers();
  setupDownloadHandler();

  try {
    serverUrl = await startEmbeddedBackend();
    createMainWindow(serverUrl);
  } catch (err) {
    console.error('[Electron] Failed to initialize application:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverUrl) {
      createMainWindow(serverUrl);
    }
  });
});

app.on('before-quit', () => {
  try {
    persistDB();
  } catch (err) {
    console.error('[Electron] Error persisting DB on quit:', err);
  }

  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
