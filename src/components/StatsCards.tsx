import React from 'react';
import { Users, Building2, CalendarDays, UserCheck, CheckCircle2, UserX } from 'lucide-react';
import { Detainee } from '../types';

interface StatsCardsProps {
  detainees: Detainee[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ detainees }) => {
  const total = detainees.length;

  // Active / Released Status
  const currentlyDetained = detainees.filter(d => d.status !== 'أخلي سبيله').length;
  const releasedCount = detainees.filter(d => d.status === 'أخلي سبيله').length;

  // Males & Females
  const malesCount = detainees.filter(d => d.gender === 'ذكر').length;
  const femalesCount = detainees.filter(d => d.gender === 'أنثى').length;

  // Unique cells
  const uniqueCells = Array.from(new Set(detainees.map(d => d.detentionCell).filter(Boolean)));

  // Detained in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDetainees = detainees.filter(d => {
    if (!d.detentionDate) return false;
    const date = new Date(d.detentionDate);
    return date >= sevenDaysAgo;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
      {/* Total & Current Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            إجمالي السجلات والحالة
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{total}</h3>
            <span className="text-xs text-slate-400">سجل</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              {currentlyDetained} موقوف
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {releasedCount} أخلي سبيله
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            توزيع الجنس
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-800">{malesCount} <span className="text-xs font-normal text-slate-500">ذكور</span></span>
            <span className="text-slate-300">|</span>
            <span className="text-xl font-bold text-slate-800">{femalesCount} <span className="text-xs font-normal text-slate-500">إناث</span></span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            نسبة الذكور {total > 0 ? Math.round((malesCount / total) * 100) : 0}%
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
          <UserCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Active Cells */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            النظارات المشغولة
          </p>
          <h3 className="text-2xl font-bold text-slate-800">{uniqueCells.length}</h3>
          <p className="text-xs text-slate-400 mt-1">نظارة وزنزانة توقيف</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
      </div>

      {/* Recent Detentions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            توقيفات آخر 7 أيام
          </p>
          <h3 className="text-2xl font-bold text-slate-800">{recentDetainees}</h3>
          <p className="text-xs text-slate-400 mt-1">حالات توقيف حديثة</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <CalendarDays className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
