import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Detainee } from '../types';
import { downloadBackupJSON, importBackupJSON, INITIAL_DETAINEES, STORAGE_KEY } from '../utils/storage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  detainees: Detainee[];
  onUpdateDetainees: (newDetainees: Detainee[]) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  detainees,
  onUpdateDetainees,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  // Approximate storage calculation
  const rawStorage = localStorage.getItem(STORAGE_KEY) || '';
  const storageKB = Math.round((rawStorage.length * 2) / 1024);

  const handleExport = () => {
    downloadBackupJSON(detainees);
    setStatusMessage({ text: 'تم تنزيل النسخة الاحتياطية بنجاح بصيغة JSON' });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedRecords = await importBackupJSON(file);
      if (importedRecords.length === 0) {
        setStatusMessage({ text: 'الملف لا يحتوي على أي سجلات موقوفين صالحة', isError: true });
        return;
      }

      onUpdateDetainees(importedRecords);
      setStatusMessage({ text: `تم استعادة وتحديث ${importedRecords.length} سجلاً بنجاح!` });
    } catch (err: unknown) {
      setStatusMessage({ 
        text: err instanceof Error ? err.message : 'فشل استيراد النسخة الاحتياطية', 
        isError: true 
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetToSample = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط السجلات واستعادة البيانات النموذجية الأولية؟')) {
      onUpdateDetainees(INITIAL_DETAINEES);
      setStatusMessage({ text: 'تمت استعادة السجلات النموذجية الافتراضية بنجاح' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">إدارة النسخ الاحتياطي والبيانات</h3>
              <p className="text-xs text-slate-500">حفظ ونقل واسترجاع السجلات المحلية للحاسوب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage status bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>مساحة التخزين المحلية المستخدمة:</span>
            </span>
            <span className="font-mono text-slate-800 font-bold">{storageKB} كيلوبايت</span>
          </div>
          <p className="text-[11px] text-slate-500">
            النظام يعمل بدون إنترنت على متصفح الحاسوب. لحماية بياناتك من الحذف المفاجئ للمتصفح، يُنصح بتصدير نسخة احتياطية بانتظام.
          </p>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div 
            className={`p-3 rounded-lg text-xs font-semibold mb-4 flex items-center gap-2 ${
              statusMessage.isError 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Options */}
        <div className="space-y-3">
          
          {/* Download JSON Backup */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition group cursor-pointer text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">تنزيل نسخة احتياطية كاملة (JSON)</h4>
                <p className="text-[11px] text-slate-500">حفظ كافة السجلات والصور في ملف على القرص الصلب</p>
              </div>
            </div>
            <span className="text-xs font-medium text-blue-600">تصدير</span>
          </button>

          {/* Import JSON Backup */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition group cursor-pointer text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">استرجاع نسخة احتياطية سابقة</h4>
                <p className="text-[11px] text-slate-500">استيراد ملف JSON محفوظ مسبقاً</p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-600">استيراد</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFile}
          />

          {/* Reset to Sample Data */}
          <button
            onClick={handleResetToSample}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition group cursor-pointer text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">إعادة ضبط السجلات للبيانات التجريبية</h4>
                <p className="text-[11px] text-slate-500">استعادة النماذج الأولية المرفقة مع النظام</p>
              </div>
            </div>
            <span className="text-xs font-medium text-amber-600">استعادة</span>
          </button>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
