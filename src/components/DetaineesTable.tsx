import React, { useState } from 'react';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Printer, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Building2, 
  Calendar, 
  Image as ImageIcon 
} from 'lucide-react';
import { Detainee, SortField, SortDirection } from '../types';

interface DetaineesTableProps {
  detainees: Detainee[];
  onViewProfile: (detainee: Detainee) => void;
  onEditDetainee: (detainee: Detainee) => void;
  onDeleteDetainee: (detainee: Detainee) => void;
}

export const DetaineesTable: React.FC<DetaineesTableProps> = ({
  detainees,
  onViewProfile,
  onEditDetainee,
  onDeleteDetainee,
}) => {
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('detentionDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDetainees = [...detainees].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (sortField === 'firstName') {
      aVal = `${a.firstName} ${a.fatherName} ${a.lastName}`;
      bVal = `${b.firstName} ${b.fatherName} ${b.lastName}`;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(sortedDetainees.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * pageSize;
  const paginatedDetainees = sortedDetainees.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
      
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="py-3.5 px-4 w-12 text-center">ت</th>
              <th className="py-3.5 px-4 w-16 text-center">الصورة</th>
              <th 
                onClick={() => handleSort('firstName')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>اسم الموقوف والشهرة</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('detentionCell')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>نظارة التوقيف</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('detentionDate')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>تاريخ التوقيف</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">اسم الأم</th>
              <th 
                onClick={() => handleSort('nationality')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>الجنسية / الجنس</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">رقم الهاتف</th>
              <th className="py-3.5 px-4 text-center w-36">الإجراءات والخيارات</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
            {paginatedDetainees.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="w-10 h-10 text-slate-300" />
                    <p className="text-base font-medium text-slate-600">لم يتم العثور على أي سجلات موقوفين مطابقة</p>
                    <p className="text-xs text-slate-400">جرب تعديل معايير البحث أو إضافة موقوف جديد للنظام</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDetainees.map((d, index) => {
                const globalIndex = startIndex + index + 1;
                // Count valid photos
                const photoCount = d.photos ? d.photos.filter((p) => p && p.trim().length > 0).length : 0;
                const primaryPhoto = d.photos && d.photos[0] ? d.photos[0] : null;

                return (
                  <tr 
                    key={d.id} 
                    className="hover:bg-blue-50/40 transition group"
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                      {globalIndex}
                    </td>

                    {/* Photo Thumbnail */}
                    <td className="py-3 px-4 text-center">
                      <div 
                        onClick={() => onViewProfile(d)}
                        className="relative w-11 h-13 mx-auto rounded-md overflow-hidden bg-slate-100 border border-slate-300 shadow-2xs cursor-pointer group-hover:ring-2 group-hover:ring-blue-500 transition"
                        title="انقر لعرض الملف والطباعة"
                      >
                        {primaryPhoto ? (
                          <img 
                            src={primaryPhoto} 
                            alt={d.firstName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        {photoCount > 0 && (
                          <span className="absolute bottom-0 right-0 left-0 bg-slate-900/80 text-[10px] text-white py-0.2 text-center font-mono">
                            {photoCount}/3
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Full Name & Birth Info */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {d.firstName} {d.fatherName} {d.lastName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>ولادة: {d.placeOfBirth || 'غير محدد'}</span>
                        {d.dateOfBirth && <span>({d.dateOfBirth})</span>}
                      </div>
                    </td>

                    {/* Detention Cell */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{d.detentionCell || 'غير محددة'}</span>
                      </div>
                    </td>

                    {/* Detention Date */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.detentionDate || '---'}</span>
                      </div>
                    </td>

                    {/* Mother's Name */}
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {d.motherName || 'غير مسجل'}
                    </td>

                    {/* Nationality & Gender */}
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-slate-800">
                        {d.nationality || 'غير محدد'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {d.gender || 'ذكر'}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 text-xs font-mono text-slate-700" dir="ltr">
                      {d.phoneNumber ? d.phoneNumber : '---'}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* View Profile & PDF Export */}
                        <button
                          onClick={() => onViewProfile(d)}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 transition cursor-pointer"
                          title="عرض البطاقة الأمنية الكاملة وتصدير PDF / طباعة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditDetainee(d)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 transition cursor-pointer"
                          title="تعديل بيانات الموقوف"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteDetainee(d)}
                          className="p-1.5 rounded-lg text-red-600 hover:text-white hover:bg-red-600 bg-red-50 transition cursor-pointer"
                          title="حذف السجل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="py-3.5 px-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span>عدد السجلات بالصفحة:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="py-1 px-2 bg-white border border-slate-300 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-400 mr-2">
            عرض {detainees.length > 0 ? startIndex + 1 : 0} إلى {Math.min(startIndex + pageSize, detainees.length)} من {detainees.length}
          </span>
        </div>

        {/* Navigation pagination */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={effectivePage <= 1}
            className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <span className="px-3 py-1 font-semibold text-slate-800">
            صفحة {effectivePage} من {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={effectivePage >= totalPages}
            className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="الصفحة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
