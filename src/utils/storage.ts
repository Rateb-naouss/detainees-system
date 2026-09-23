import { Detainee } from '../types';

export const STORAGE_KEY = 'detainees_registry_v1';

// Empty initial data as requested by user to start with a clean slate
export const INITIAL_DETAINEES: Detainee[] = [];

/**
 * Loads detainees from LocalStorage, falling back to initial data if empty
 */
export function loadDetainees(): Detainee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDetainees(INITIAL_DETAINEES);
      return INITIAL_DETAINEES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Ensure backwards compatibility with newly added fields
      return parsed.map((item) => ({
        ...item,
        status: item.status === 'أخلي سبيله' ? 'أخلي سبيله' : 'موقوف',
        detainedForUnit: item.detainedForUnit || '',
        crimeType: item.crimeType || '',
      }));
    }
    return INITIAL_DETAINEES;
  } catch (err) {
    console.error('Error loading detainees from localStorage:', err);
    return INITIAL_DETAINEES;
  }
}

/**
 * Saves detainees to LocalStorage
 */
export function saveDetainees(detainees: Detainee[]): { success: boolean; error?: string } {
  try {
    const serialized = JSON.stringify(detainees);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: unknown) {
    console.error('Error saving to localStorage:', err);
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      return { 
        success: false, 
        error: 'مساحة التخزين المحلية ممتلئة! يرجى حذف بعض السجلات القديمة أو تقليل أحجام الصور.' 
      };
    }
    return { success: false, error: 'حدث خطأ غير متوقع أثناء حفظ البيانات محلياً.' };
  }
}

/**
 * Exports all detainees to a downloadable JSON file for offline backup
 */
export function downloadBackupJSON(detainees: Detainee[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(detainees, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `نسخة_احتياطية_سجل_الموقوفين_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Imports detainees from a JSON file
 */
export async function importBackupJSON(file: File): Promise<Detainee[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error('تنسيق الملف غير صالح، يجب أن يحتوي على مصفوفة سجلات');
        }
        // Basic validation of fields
        const validList = parsed.filter(item => item && item.id && item.firstName && item.lastName);
        resolve(validList);
      } catch (err) {
        reject(new Error('فشل استيراد الملف: تأكد من اختيار ملف JSON صالح لسجل الموقوفين'));
      }
    };
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
    reader.readAsText(file);
  });
}
