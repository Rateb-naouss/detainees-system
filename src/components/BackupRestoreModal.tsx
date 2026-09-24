import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import { Detainee } from '../types';
import { downloadBackupJSON, importBackupJSON } from '../utils/storage';
import { 
  downloadSQLiteDB, 
  getDatabaseInfo, 
  importJSONToSQLite, 
  DatabaseInfo 
} from '../utils/api';

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
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      getDatabaseInfo().then((info) => {
        if (info) setDbInfo(info);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadSQLite = () => {
    downloadSQLiteDB();
    setStatusMessage({ text: 'جاري تنزيل ملف قاعدة بيانات SQLite الحقيقي (detainees.db)...' });
  };

  const handleExportJSON = () => {
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

      // Also persist to SQLite backend
      await importJSONToSQLite(importedRecords);
      onUpdateDetainees(importedRecords);
      setStatusMessage({ text: `تم استعادة وتحديث ${importedRecords.length} سجلاً في قاعدة بيانات SQLite بنجاح!` });
      getDatabaseInfo().then(setDbInfo);
    } catch (err: unknown) {
      setStatusMessage({ 
        text: err instanceof Error ? err.message : 'فشل استيراد النسخة الاحتياطية', 
        isError: true 
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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
              <h3 className="text-base font-bold text-slate-900">إدارة قاعدة البيانات (SQLite) والنسخ الاحتياطي</h3>
              <p className="text-xs text-slate-500">حفظ ونقل وتحميل ملف قاعدة البيانات detainees.db</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SQLite Database status card */}
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-800">
            <span className="font-semibold flex items-center gap-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              قاعدة بيانات: SQLite 3 النشطة
            </span>
            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              {dbInfo?.dbFile || 'detainees.db'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">حجم ملف قاعدة البيانات:</span>
              <span className="font-mono font-bold text-slate-200">
                {dbInfo?.fileSizeFormatted || 'نشط'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">عدد السجلات المحفوظة:</span>
              <span className="font-mono font-bold text-slate-200">
                {detainees.length} سجل موقوف
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-relaxed">
            يتم تخزين السجلات في ملف حقيقي <code className="text-emerald-400 font-mono">detainees.db</code> وتخزين الصور المحسّنة في مجلد التخزين المخصص <code className="text-emerald-400 font-mono">uploads/photos</code> دون التأثير على سرعة الاستعلامات.
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
        <div className="space-y-2.5">
          
          {/* Download SQLite Database file detainees.db */}
          <button
            onClick={handleDownloadSQLite}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/40 hover:bg-emerald-100/50 hover:border-emerald-600 transition group cursor-pointer text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition shadow-sm">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>تحميل ملف قاعدة البيانات الحقيقي (detainees.db)</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">SQLite .db</span>
                </h4>
                <p className="text-[11px] text-slate-600">تنزيل نسخة مطابقة من ملف SQLite لنسخه أو نقله أو فتحه ببرامج SQLite</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700">تحميل</span>
          </button>

          {/* Download JSON Backup */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition group cursor-pointer text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">تنزيل نسخة احتياطية (JSON)</h4>
                <p className="text-[11px] text-slate-500">حفظ كافة السجلات في ملف نصي مهيكل</p>
              </div>
            </div>
            <span className="text-xs font-medium text-blue-600">تصدير</span>
          </button>

          {/* Import JSON Backup */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition group cursor-pointer text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">استرجاع أو استيراد نسخة احتياطية</h4>
                <p className="text-[11px] text-slate-500">استيراد ملف JSON محفوظ مسبقاً وتخزينه في SQLite</p>
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

        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
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

