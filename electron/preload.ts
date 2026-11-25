import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAppInfo {
  version: string;
  dataDir: string;
  dbPath: string;
  uploadsDir: string;
  isPackaged: boolean;
  platform: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  getAppInfo: (): Promise<ElectronAppInfo> => ipcRenderer.invoke('electron:get-app-info'),
  openDataFolder: (): Promise<string> => ipcRenderer.invoke('electron:open-data-folder'),
  openPhotosFolder: (): Promise<string> => ipcRenderer.invoke('electron:open-photos-folder'),
});
