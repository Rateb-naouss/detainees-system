import React from 'react';
import { Shield, UserPlus, HardDrive, FileSpreadsheet, Database, RefreshCw } from 'lucide-react';
import { Detainee } from '../types';
import { exportDetaineesToExcel } from '../utils/exportExcel';
import isfLogo from '../assets/images/isf_logo_1790025317319.jpg';

interface NavbarProps {
  detainees: Detainee[];
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  detainees,
  onOpenAddModal,
  onOpenBackupModal,
}) => {
  const currentDateStr = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <header id="main-navbar" className="bg-slate-900 text-white shadow-lg border-b border-slate-800 no-print sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & System Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-xl bg-slate-800 p-1 border border-slate-700 shadow-md flex items-center justify-center overflow-hidden">
              <img 
                src={isfLogo} 
                alt="شعار قوى الأمن الداخلي" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to public asset if needed
                  (e.target as HTMLImageElement).src = '/assets/isf_logo.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">قوى الأمن الداخلي - مركز القيادة والتحكم</h1>
               
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                 سجلات   الموقوفين في النظارات
              </p>
            </div>
          </div>

          {/* Quick Date Display & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end text-xs text-slate-400 ml-4 pl-4 border-l border-slate-700/60">
              <span className="text-slate-300 font-medium">{currentDateStr}</span>
              <span className="text-slate-500">إجمالي السجلات: {detainees.length} موقوف</span>
            </div>

            {/* Export all to Excel */}
            <button
              id="export-all-excel-btn"
              onClick={() => exportDetaineesToExcel(detainees, 'كافة_سجلات_الموقوفين')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition shadow-sm cursor-pointer"
              title="تصدير جميع السجلات إلى جدول إكسل"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">تصدير إكسل</span>
            </button>

            {/* Backup & Restore */}
            <button
              id="backup-restore-btn"
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition shadow-sm cursor-pointer"
              title="النسخ الاحتياطي واستعادة البيانات"
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">النسخ الاحتياطي</span>
            </button>

            {/* Add Detainee Button */}
            <button
              id="add-detainee-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موقوف جديد</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
