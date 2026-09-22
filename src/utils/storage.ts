import { Detainee } from '../types';

export const STORAGE_KEY = 'detainees_registry_v1';

// Sample initial data to provide an immediate working view
export const INITIAL_DETAINEES: Detainee[] = [
  {
    id: 'det-1001',
    detentionDate: '2026-09-18',
    detentionCell: 'نظارة تجمع فصائل طرابلس',
    status: 'موقوف',
    detainedForUnit: 'فصيلة أبي سمرا',
    crimeType: 'إشتباه بسرقة موصوفة',
    firstName: 'أحمد',
    fatherName: 'محمود',
    lastName: 'الخالد',
    motherName: 'فاطمة العلي',
    placeOfBirth: 'دمشق',
    dateOfBirth: '1989-04-12',
    gender: 'ذكر',
    nationality: 'سوري',
    phoneNumber: '0501234567',
    previousAddress: 'شارع الجلاء، حي الميدان، البناية 14',
    recordDate: '2026-09-18',
    photos: [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23e2e8f0"/><circle cx="150" cy="130" r="50" fill="%2394a3b8"/><path d="M70 290 C70 200, 230 200, 230 290 Z" fill="%2394a3b8"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23475569" text-anchor="middle">صورة أمامية</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23e2e8f0"/><ellipse cx="140" cy="130" rx="42" ry="50" fill="%2394a3b8"/><path d="M60 290 C60 210, 210 205, 230 290 Z" fill="%2394a3b8"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23475569" text-anchor="middle">جانبية يمنى</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23e2e8f0"/><ellipse cx="160" cy="130" rx="42" ry="50" fill="%2394a3b8"/><path d="M70 290 C90 205, 240 210, 240 290 Z" fill="%2394a3b8"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23475569" text-anchor="middle">جانبية يسرى</text></svg>'
    ],
    notes: 'تم توقيفه بموجب مذكرة إحضار أمنية. خضع للكشف الطبي الأولي عند الدخول ولا يعاني من أمراض مزمنة. المضبوطات أودعت بالأمانات.',
    createdAt: '2026-09-18T10:15:00Z',
    updatedAt: '2026-09-18T10:15:00Z'
  },
  {
    id: 'det-1002',
    detentionDate: '2026-09-20',
    detentionCell: 'فصيلة المينا',
    status: 'موقوف',
    detainedForUnit: 'مفرزة طرابلس القضائية',
    crimeType: 'سرقة مركبة ونقل سلاح دون ترخيص',
    firstName: 'كريم',
    fatherName: 'سامي',
    lastName: 'المنصور',
    motherName: 'هدى الصباغ',
    placeOfBirth: 'بيروت',
    dateOfBirth: '1995-11-23',
    gender: 'ذكر',
    nationality: 'لبناني',
    phoneNumber: '03789456',
    previousAddress: 'طريق المطار، مجمع النرجس، الطابق الثاني',
    recordDate: '2026-09-20',
    photos: [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23e2e8f0"/><circle cx="150" cy="130" r="50" fill="%2364748b"/><path d="M70 290 C70 200, 230 200, 230 290 Z" fill="%2364748b"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23334155" text-anchor="middle">صورة أمامية</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23e2e8f0"/><ellipse cx="140" cy="130" rx="42" ry="50" fill="%2364748b"/><path d="M60 290 C60 210, 210 205, 230 290 Z" fill="%2364748b"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23334155" text-anchor="middle">جانبية يمنى</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23e2e8f0"/><ellipse cx="160" cy="130" rx="42" ry="50" fill="%2364748b"/><path d="M70 290 C90 205, 240 210, 240 290 Z" fill="%2364748b"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23334155" text-anchor="middle">جانبية يسرى</text></svg>'
    ],
    notes: 'إشتباه في قضية سرقة مركبة. طلب التواصل مع محاميه الخاص. بانتظار استكمال التحقيقات الصباحية.',
    createdAt: '2026-09-20T14:40:00Z',
    updatedAt: '2026-09-20T14:40:00Z'
  },
  {
    id: 'det-1003',
    detentionDate: '2026-09-21',
    detentionCell: 'نظارة النساء - مخفر مشتى حسن',
    status: 'أخلي سبيله',
    detainedForUnit: 'شعبة المعلومات',
    crimeType: 'التحقق من هوية وأوراق ثبوتية',
    firstName: 'مريم',
    fatherName: 'حسين',
    lastName: 'النجار',
    motherName: 'زينب الشامي',
    placeOfBirth: 'طرابلس',
    dateOfBirth: '1992-08-05',
    gender: 'أنثى',
    nationality: 'لبنانية',
    phoneNumber: '71556677',
    previousAddress: 'الميناء، شارع الكورنيش، بناية السلام',
    recordDate: '2026-09-21',
    photos: [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23fce7f3"/><circle cx="150" cy="130" r="50" fill="%23f472b6"/><path d="M70 290 C70 200, 230 200, 230 290 Z" fill="%23f472b6"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%239d174d" text-anchor="middle">صورة أمامية</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23fce7f3"/><ellipse cx="140" cy="130" rx="42" ry="50" fill="%23f472b6"/><path d="M60 290 C60 210, 210 205, 230 290 Z" fill="%23f472b6"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%239d174d" text-anchor="middle">جانبية يمنى</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360" fill="%23f1f5f9"><rect width="300" height="360" fill="%23fce7f3"/><ellipse cx="160" cy="130" rx="42" ry="50" fill="%23f472b6"/><path d="M70 290 C90 205, 240 210, 240 290 Z" fill="%23f472b6"/><text x="150" y="325" font-family="sans-serif" font-size="16" font-weight="bold" fill="%239d174d" text-anchor="middle">جانبية يسرى</text></svg>'
    ],
    notes: 'موقوفة للتحقق من هوية وأوراق ثبوتية. تم إخلاء سبيلها بسند إقامة بناءً لإشارة النيابة العامة الاستئنافية.',
    createdAt: '2026-09-21T09:30:00Z',
    updatedAt: '2026-09-21T09:30:00Z'
  }
];

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
