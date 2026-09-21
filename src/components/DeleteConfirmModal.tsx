import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Detainee } from '../types';

interface DeleteConfirmModalProps {
  detainee: Detainee | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  detainee,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !detainee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">تأكيد حذف سجل الموقوف</h3>
            <p className="text-xs text-slate-500">عملية الحذف نهائية من قاعدة البيانات المحلية</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-5 text-xs text-slate-700 space-y-1.5">
          <p>
            هل أنت متأكد من رغبتك في حذف سجل الموقوف:
          </p>
          <p className="text-sm font-bold text-slate-900">
            {detainee.firstName} {detainee.fatherName} {detainee.lastName}
          </p>
          <p className="text-slate-500 text-[11px]">
            نظارة التوقيف: {detainee.detentionCell} | تاريخ التوقيف: {detainee.detentionDate}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            إلغاء
          </button>
          
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، حذف السجل نهائياً</span>
          </button>
        </div>

      </div>
    </div>
  );
};
