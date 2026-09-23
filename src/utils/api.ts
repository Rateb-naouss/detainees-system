import { Detainee } from '../types';

export interface DatabaseInfo {
  success: boolean;
  dbType: string;
  dbFile: string;
  dbPath: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  totalRecords: number;
  totalPhotosOnDisk: number;
}

/**
 * Fetches all detainees directly from SQLite (detainees.db) via Express API
 */
export async function fetchDetaineesFromDB(): Promise<{ success: boolean; data: Detainee[]; error?: string }> {
  try {
    const res = await fetch('/api/detainees');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return { success: true, data: json.data };
    }
    return { success: false, data: [], error: json.error || 'استجابة غير صالحة من السيرفر' };
  } catch (err: unknown) {
    console.warn('[SQLite API] Could not fetch from server, falling back to local memory/storage:', err);
    return { 
      success: false, 
      data: [], 
      error: err instanceof Error ? err.message : 'تعذر الاتصال بقاعدة بيانات SQLite' 
    };
  }
}

/**
 * Saves or updates a detainee in SQLite (detainees.db)
 */
export async function saveDetaineeToDB(detainee: Detainee): Promise<{ success: boolean; data?: Detainee; error?: string }> {
  try {
    const res = await fetch('/api/detainees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(detainee),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'فشل حفظ السجل في SQLite' };
  } catch (err: unknown) {
    console.error('[SQLite API] Error saving to SQLite:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'تعذر الاتصال بقاعدة بيانات SQLite' 
    };
  }
}

/**
 * Deletes a detainee from SQLite (detainees.db) and deletes photos from disk
 */
export async function deleteDetaineeFromDB(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/detainees/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true };
    }
    return { success: false, error: json.error || 'فشل حذف السجل من SQLite' };
  } catch (err: unknown) {
    console.error('[SQLite API] Error deleting from SQLite:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'تعذر الاتصال بالسيرفر لحذف السجل' 
    };
  }
}

/**
 * Fetches database status & file metadata
 */
export async function getDatabaseInfo(): Promise<DatabaseInfo | null> {
  try {
    const res = await fetch('/api/database/info');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Triggers direct download of the real detainees.db file
 */
export function downloadSQLiteDB(): void {
  const downloadLink = document.createElement('a');
  downloadLink.href = '/api/database/download';
  downloadLink.setAttribute('download', `detainees_${new Date().toISOString().slice(0, 10)}.db`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

/**
 * Clears SQLite database (detainees.db) and disk photos completely
 */
export async function resetSQLiteDB(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/database/reset', {
      method: 'POST',
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, message: json.message };
    }
    return { success: false, error: json.error || 'فشل تصفير قاعدة البيانات' };
  } catch (err: unknown) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'تعذر الاتصال بالسيرفر' 
    };
  }
}

/**
 * Imports JSON records into SQLite
 */
export async function importJSONToSQLite(records: Detainee[]): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/database/import-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(records),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, count: json.count, message: json.message };
    }
    return { success: false, error: json.error || 'فشل استيراد السجلات إلى SQLite' };
  } catch (err: unknown) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'تعذر استيراد السجلات' 
    };
  }
}
