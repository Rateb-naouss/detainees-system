import React from 'react';
import { Search, X, Filter, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { DetaineeFilters, Detainee } from '../types';
import { exportDetaineesToExcel } from '../utils/exportExcel';

interface FilterBarProps {
  filters: DetaineeFilters;
  onFilterChange: (filters: DetaineeFilters) => void;
  onResetFilters: () => void;
  detainees: Detainee[];
  filteredDetainees: Detainee[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  detainees,
  filteredDetainees,
}) => {
  // Extract unique cell names, units, and nationalities for dropdown suggestions
  const cellOptions = Array.from(
    new Set(detainees.map((d) => d.detentionCell).filter(Boolean))
  ).sort();

  const unitOptions = Array.from(
    new Set(detainees.map((d) => d.detainedForUnit).filter(Boolean))
  ).sort();

  const nationalityOptions = Array.from(
    new Set(detainees.map((d) => d.nationality).filter(Boolean))
  ).sort();

  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.detentionCell !== '' ||
    filters.status !== '' ||
    filters.detainedForUnit !== '' ||
    filters.nationality !== '' ||
    filters.gender !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6 no-print">
      {/* Top row: Main Search bar & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        
        {/* Universal Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="global-search-input"
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            placeholder="بحث فوري في كافة الحقول (الاسم، الأب، الشهرة، النظارة، الجنسية، الهاتف، الملاحظات، التواريخ)..."
            className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Export filtered & Reset buttons */}
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              id="reset-filters-btn"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition border border-slate-200 cursor-pointer"
              title="إعادة تعيين كافة الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}

          <button
            id="export-filtered-excel-btn"
            onClick={() => exportDetaineesToExcel(filteredDetainees, 'الموقوفين_المصفاة')}
            disabled={filteredDetainees.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير النتائج (Excel)</span>
          </button>
        </div>
      </div>

      {/* Second row: Granular Filter Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
        
        {/* Status Filter: موقوف \ أخلي سبيله */}
        <div>
          <label htmlFor="filter-status" className="block text-xs font-medium text-slate-600 mb-1">
            حالة الموقوف:
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value })
            }
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">جميع الحالات</option>
            <option value="موقوف">موقوف</option>
            <option value="أخلي سبيله">أخلي سبيله</option>
          </select>
        </div>

        {/* Detained For Unit: موقوف لصالح */}
        <div>
          <label htmlFor="filter-detained-for" className="block text-xs font-medium text-slate-600 mb-1">
            موقوف لصالح (القطعة):
          </label>
          <select
            id="filter-detained-for"
            value={filters.detainedForUnit}
            onChange={(e) =>
              onFilterChange({ ...filters, detainedForUnit: e.target.value })
            }
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">جميع القطع</option>
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        {/* Cell Filter */}
        <div>
          <label htmlFor="filter-cell" className="block text-xs font-medium text-slate-600 mb-1">
            نظارة التوقيف:
          </label>
          <select
            id="filter-cell"
            value={filters.detentionCell}
            onChange={(e) =>
              onFilterChange({ ...filters, detentionCell: e.target.value })
            }
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">جميع النظارات</option>
            {cellOptions.map((cell) => (
              <option key={cell} value={cell}>
                {cell}
              </option>
            ))}
          </select>
        </div>

        {/* Nationality Filter */}
        <div>
          <label htmlFor="filter-nationality" className="block text-xs font-medium text-slate-600 mb-1">
            الجنسية:
          </label>
          <select
            id="filter-nationality"
            value={filters.nationality}
            onChange={(e) =>
              onFilterChange({ ...filters, nationality: e.target.value })
            }
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">جميع الجنسيات</option>
            {nationalityOptions.map((nat) => (
              <option key={nat} value={nat}>
                {nat}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <label htmlFor="filter-gender" className="block text-xs font-medium text-slate-600 mb-1">
            الجنس:
          </label>
          <select
            id="filter-gender"
            value={filters.gender}
            onChange={(e) =>
              onFilterChange({ ...filters, gender: e.target.value })
            }
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">الكل (ذكور وإناث)</option>
            <option value="ذكر">ذكر</option>
            <option value="أنثى">أنثى</option>
          </select>
        </div>

        {/* Date Filter Range */}
        <div>
          <label htmlFor="filter-start-date" className="block text-xs font-medium text-slate-600 mb-1">
            تاريخ التوقيف (من - إلى):
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              id="filter-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                onFilterChange({ ...filters, startDate: e.target.value })
              }
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title="من تاريخ"
            />
            <input
              id="filter-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                onFilterChange({ ...filters, endDate: e.target.value })
              }
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title="إلى تاريخ"
            />
          </div>
        </div>

      </div>

      {/* Match count indicator bar */}
      <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>
            يتم عرض <strong className="text-slate-800 font-bold">{filteredDetainees.length}</strong> موقوف
            {detainees.length !== filteredDetainees.length && (
              <span> (من أصل <strong className="text-slate-800 font-bold">{detainees.length}</strong> مسجل)</span>
            )}
          </span>
        </div>
        {isFiltered && (
          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
            عوامل التصفية نشطة
          </span>
        )}
      </div>

    </div>
  );
};
