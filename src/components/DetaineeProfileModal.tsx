import React, { useRef, useState } from 'react';
import { 
  Printer, 
  X, 
  Edit3, 
  Shield, 
  Download, 
  User, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Detainee } from '../types';
import { downloadElementAsPDF, printElementIsolated } from '../utils/printPdf';
import isfLogo from '../assets/images/isf_logo_1790025317319.jpg';

interface DetaineeProfileModalProps {
  detainee: Detainee | null;
  onClose: () => void;
  onEdit: (detainee: Detainee) => void;
}

export const DetaineeProfileModal: React.FC<DetaineeProfileModalProps> = ({
  detainee,
  onClose,
  onEdit,
}) => {
  const printableContainerRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!detainee) return null;

  const showNotice = (text: string, isError = false) => {
    setNotice({ text, isError });
    setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  // Direct PDF Download handler using html2pdf.js
  const handleDownloadPDF = async () => {
    if (!printableContainerRef.current) return;
    try {
      setIsExportingPdf(true);
      const filename = `بطاقة_موقوف_${detainee.firstName}_${detainee.lastName}_${detainee.id}`;
      await downloadElementAsPDF(printableContainerRef.current, filename);
      showNotice('تم تصدير وتنزيل ملف PDF بنجاح على جهازك!');
    } catch (err: unknown) {
      console.error('PDF export error:', err);
      showNotice('حدث خطأ أثناء تنزيل PDF، يمكنك استخدام زر الطباعة المباشرة', true);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Isolated Print handler
  const handlePrint = () => {
    if (!printableContainerRef.current) {
      window.print();
      return;
    }
    printElementIsolated(printableContainerRef.current);
  };

  const photoLabels = ['الصورة الأمامية', 'الصورة الجانبية (يمين)', 'الصورة الجانبية (يسار)'];
  const todayArabic = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-xs">
      
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 p-1 flex items-center justify-center">
              <img 
                src={isfLogo} 
                alt="شعار" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/isf_logo.jpg';
                }}
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                بطاقة الموقوف: {detainee.firstName} {detainee.fatherName} {detainee.lastName}
              </h2>
              <p className="text-xs text-slate-400">
                قوى الأمن الداخلي - مركز القيادة والتحكم
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            
            {/* Direct PDF Download Button */}
            <button
              id="download-direct-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              title="تنزيل الملف كـ PDF مباشرة إلى جهازك"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التجهيز...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف PDF</span>
                </>
              )}
            </button>

            {/* Direct Print Button */}
            <button
              id="print-pdf-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              title="فتح نافذة الطباعة لاختيار طابعة أو Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية</span>
            </button>

            {/* Edit Button */}
            <button
              onClick={() => {
                onClose();
                onEdit(detainee);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تعديل</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Alert Banner */}
        {notice && (
          <div className={`no-print px-6 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 ${
            notice.isError 
              ? 'bg-red-50 text-red-700 border-b border-red-200' 
              : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {notice.isError ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
            <button 
              onClick={() => setNotice(null)}
              className="text-xs hover:underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Printable Profile Dossier */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0">
          
          <div 
            ref={printableContainerRef}
            id="printable-profile-container" 
            className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 print:border-none print:shadow-none print:p-0"
          >
            
            {/* Official Header with ISF Emblem Logo and "قوى الأمن الداخلي مركز القيادة والتحكم" */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              
              <div className="flex items-center justify-between mb-2">
                {/* Right side info */}
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-800">الجمهورية اللبنانية</p>
                  <p className="text-slate-600">وزارة الداخلية والبلديات</p>
                  <p className="text-slate-600">المديرية العامة لقوى الأمن الداخلي</p>
                  <p className="font-bold text-blue-900 mt-0.5">قيادة منطقة الشمال الإقليمية</p>
                  <p className="font-bold text-blue-900 mt-0.5">مركز القيادة والتحكم</p>
                </div>

                {/* Center ISF Logo & Title */}
                <div className="flex flex-col items-center justify-center text-center px-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mb-1.5 flex items-center justify-center">
                    <img 
                      src={isfLogo} 
                      alt="شعار قوى الأمن الداخلي" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/isf_logo.jpg';
                      }}
                    />
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-wide">
                    ISF
                  </h1>
                  <span className="mt-1 inline-block bg-slate-900 text-white text-[11px] font-bold px-3 py-0.5 rounded-md">
                     بطاقة معلومات موقوف
                  </span>
                </div>

                {/* Left side meta */}
                <div className="text-left text-xs font-mono text-slate-600" dir="ltr">
                  <div>Date: {new Date().toISOString().slice(0, 10)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">ID: {detainee.id}</div>
                </div>
              </div>

            </div>

            {/* Detention Status & Legal Case Banner */}
            <div className="bg-slate-100 rounded-lg p-3.5 mb-6 border border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">حالة الموقوف:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  detainee.status === 'أخلي سبيله'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${detainee.status === 'أخلي سبيله' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                  <span>{detainee.status || 'موقوف'}</span>
                </span>
              </div>

              <div>
                <span className="text-slate-600 font-medium">موقوف لصالح: </span>
                <strong className="text-slate-950 font-bold">{detainee.detainedForUnit || '---'}</strong>
              </div>

              <div>
                <span className="text-slate-600 font-medium">نوع الجرم: </span>
                <strong className="text-slate-950 font-bold">{detainee.crimeType || '---'}</strong>
              </div>

              <div>
                <span className="text-slate-600 font-medium">نظارة التوقيف: </span>
                <strong className="text-slate-950 text-sm">{detainee.detentionCell || 'غير محددة'}</strong>
              </div>

              <div>
                <span className="text-slate-600 font-medium">تاريخ التوقيف: </span>
                <strong className="text-slate-950 font-mono text-sm">{detainee.detentionDate || '---'}</strong>
              </div>

              <div>
                <span className="text-slate-600 font-medium">تاريخ تدوين المعلومة: </span>
                <strong className="text-slate-950 font-mono">{detainee.recordDate || '---'}</strong>
              </div>
            </div>

            {/* 3 Mugshot / Profile Photos Section */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 border-r-4 border-blue-700 pr-2">
                <span>صور الموقوف</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[0, 1, 2].map((idx) => {
                  const photo = detainee.photos?.[idx];
                  return (
                    <div 
                      key={idx} 
                      className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col items-center text-center"
                    >
                      <div className="w-full aspect-3/4 rounded bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300 shadow-2xs">
                        {photo ? (
                          <img
                            src={photo}
                            alt={photoLabels[idx]}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center justify-center p-2">
                            <User className="w-10 h-10 mb-1 stroke-1" />
                            <span className="text-[10px]">لا توجد صورة</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 mt-2">
                        {photoLabels[idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comprehensive 15-Field Record Table */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 border-r-4 border-slate-800 pr-2">
                <span>البيانات الشخصية للموقوف</span>
              </h3>

              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-right border-collapse">
                  <tbody>
                    {/* Legal Status & Crime Row */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 w-1/4 border-l border-slate-200">
                        حالة الموقوف
                      </td>
                      <td className="p-2.5 text-slate-800 w-1/4 border-l border-slate-200">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          detainee.status === 'أخلي سبيله' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${detainee.status === 'أخلي سبيله' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          {detainee.status || 'موقوف'}
                        </span>
                      </td>
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 w-1/4 border-l border-slate-200">
                        موقوف لصالح (القطعة)
                      </td>
                      <td className="p-2.5 text-slate-950 font-bold w-1/4">
                        {detainee.detainedForUnit || 'غير محددة'}
                      </td>
                    </tr>

                    {/* Crime Type Row */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 w-1/4 border-l border-slate-200">
                        نوع الجرم
                      </td>
                      <td className="p-2.5 text-slate-950 font-bold text-sm w-3/4" colSpan={3}>
                        {detainee.crimeType || 'غير مدون'}
                      </td>
                    </tr>

                    {/* Row 1 */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 w-1/4 border-l border-slate-200">
                        اسم الموقوف الكامل
                      </td>
                      <td className="p-2.5 text-slate-950 font-bold text-sm w-3/4" colSpan={3}>
                        {detainee.firstName} {detainee.fatherName} {detainee.lastName}
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 w-1/4 border-l border-slate-200">
                        اسم الأب
                      </td>
                      <td className="p-2.5 text-slate-800 w-1/4 border-l border-slate-200">
                        {detainee.fatherName || 'غير مسجل'}
                      </td>
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 w-1/4 border-l border-slate-200">
                        الشهرة
                      </td>
                      <td className="p-2.5 text-slate-800 w-1/4">
                        {detainee.lastName || 'غير مسجل'}
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200">
                        اسم الأم وشهرتها
                      </td>
                      <td className="p-2.5 text-slate-800 border-l border-slate-200">
                        {detainee.motherName || 'غير مسجل'}
                      </td>
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200">
                        الجنس
                      </td>
                      <td className="p-2.5 text-slate-800">
                        {detainee.gender || 'ذكر'}
                      </td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200">
                        مكان الولادة
                      </td>
                      <td className="p-2.5 text-slate-800 border-l border-slate-200">
                        {detainee.placeOfBirth || 'غير مسجل'}
                      </td>
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200">
                        تاريخ الولادة
                      </td>
                      <td className="p-2.5 text-slate-800 font-mono">
                        {detainee.dateOfBirth || 'غير مسجل'}
                      </td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200">
                        الجنسية
                      </td>
                      <td className="p-2.5 text-slate-800 border-l border-slate-200">
                        {detainee.nationality || 'غير محدد'}
                      </td>
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200">
                        رقم الهاتف
                      </td>
                      <td className="p-2.5 text-slate-800 font-mono" dir="ltr">
                        {detainee.phoneNumber || '---'}
                      </td>
                    </tr>

                    {/* Row 6 */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200">
                        العنوان السابق
                      </td>
                      <td className="p-2.5 text-slate-800" colSpan={3}>
                        {detainee.previousAddress || 'لا يوجد عنوان مدون'}
                      </td>
                    </tr>

                    {/* Row 7: Notes */}
                    <tr>
                      <td className="bg-slate-100 font-bold text-slate-800 p-2.5 border-l border-slate-200 align-top">
                        خانة الملاحظات
                      </td>
                      <td className="p-2.5 text-slate-800 leading-relaxed min-h-16" colSpan={3}>
                        {detainee.notes ? (
                          <div className="whitespace-pre-wrap">{detainee.notes}</div>
                        ) : (
                          <span className="text-slate-400 italic">لا توجد ملاحظات مدونة في هذا السجل</span>
                        )}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Signatures & Verification Area */}
            <div className="mt-8 pt-6 border-t-2 border-slate-300 print-page-break">
              <div className="text-center text-[10px] text-slate-400 mt-4 font-mono">
                قوى الأمن الداخلي - مركز القيادة والتحكم | تم استخراج هذا التقرير بتاريخ {todayArabic}
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Bar */}
        <div className="no-print px-6 py-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            إعداد الملازم الأول نعوس </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
