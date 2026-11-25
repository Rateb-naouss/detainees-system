export interface ElectronAppInfo {
  version: string;
  dataDir: string;
  dbPath: string;
  uploadsDir: string;
  isPackaged: boolean;
  platform: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  getAppInfo: () => Promise<ElectronAppInfo>;
  openDataFolder: () => Promise<string>;
  openPhotosFolder: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
