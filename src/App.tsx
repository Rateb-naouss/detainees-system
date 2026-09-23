import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { DetaineesTable } from './components/DetaineesTable';
import { DetaineeFormModal } from './components/DetaineeFormModal';
import { DetaineeProfileModal } from './components/DetaineeProfileModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { Detainee, DetaineeFilters } from './types';
import { loadDetainees, saveDetainees } from './utils/storage';
import { 
  fetchDetaineesFromDB, 
  saveDetaineeToDB, 
  deleteDetaineeFromDB, 
  getDatabaseInfo 
} from './utils/api';
import { arabicIncludes } from './utils/arabicSearch';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Main State: List of detainees persisted in SQLite (detainees.db)
  const [detainees, setDetainees] = useState<Detainee[]>(() => loadDetainees());
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<DetaineeFilters>({
    searchQuery: '',
    detentionCell: '',
    status: '',
    detainedForUnit: '',
    nationality: '',
    gender: '',
    startDate: '',
    endDate: '',
  });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [detaineeToEdit, setDetaineeToEdit] = useState<Detainee | null>(null);
  const [profileDetainee, setProfileDetainee] = useState<Detainee | null>(null);
  const [detaineeToDelete, setDetaineeToDelete] = useState<Detainee | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Toast / Status banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Load from SQLite on mount
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const res = await fetchDetaineesFromDB();
        if (res.success) {
          setDetainees(res.data);
          saveDetainees(res.data);
        }
      } catch (e) {
        console.warn('SQLite init error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Sync state changes to localStorage as a safety mirror
  const updateAndSaveDetainees = (newDetainees: Detainee[]) => {
    setDetainees(newDetainees);
    saveDetainees(newDetainees);
  };

  // Existing cell names for autocomplete suggestions
  const existingCells = useMemo(() => {
    return Array.from(new Set(detainees.map((d) => d.detentionCell).filter(Boolean)));
  }, [detainees]);

  // Real-time filtering across ANY field with Arabic normalization
  const filteredDetainees = useMemo(() => {
    return detainees.filter((d) => {
      // 1. Universal Search Query across all fields
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery;
        const fullName = `${d.firstName || ''} ${d.fatherName || ''} ${d.lastName || ''}`;
        
        const matchesAnyField =
          arabicIncludes(d.firstName, q) ||
          arabicIncludes(d.fatherName, q) ||
          arabicIncludes(d.lastName, q) ||
          arabicIncludes(fullName, q) ||
          arabicIncludes(d.status, q) ||
          arabicIncludes(d.detainedForUnit, q) ||
          arabicIncludes(d.crimeType, q) ||
          arabicIncludes(d.motherName, q) ||
          arabicIncludes(d.detentionCell, q) ||
          arabicIncludes(d.nationality, q) ||
          arabicIncludes(d.placeOfBirth, q) ||
          arabicIncludes(d.gender, q) ||
          arabicIncludes(d.phoneNumber, q) ||
          arabicIncludes(d.previousAddress, q) ||
          arabicIncludes(d.notes, q) ||
          arabicIncludes(d.detentionDate, q) ||
          arabicIncludes(d.recordDate, q) ||
          arabicIncludes(d.dateOfBirth, q) ||
          arabicIncludes(d.id, q);

        if (!matchesAnyField) return false;
      }

      // 2. Status Filter (موقوف \ أخلي سبيله)
      if (filters.status && d.status !== filters.status) {
        return false;
      }

      // 3. Detained For Unit Filter (موقوف لصالح القطعة)
      if (filters.detainedForUnit && d.detainedForUnit !== filters.detainedForUnit) {
        return false;
      }

      // 4. Detention Cell Filter
      if (filters.detentionCell && d.detentionCell !== filters.detentionCell) {
        return false;
      }

      // 5. Nationality Filter
      if (filters.nationality && d.nationality !== filters.nationality) {
        return false;
      }

      // 6. Gender Filter
      if (filters.gender && d.gender !== filters.gender) {
        return false;
      }

      // 7. Date Range Filter
      if (filters.startDate && d.detentionDate && d.detentionDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && d.detentionDate && d.detentionDate > filters.endDate) {
        return false;
      }

      return true;
    });
  }, [detainees, filters]);

  // Handlers for Add/Edit
  const handleOpenAddModal = () => {
    setDetaineeToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditDetainee = (detainee: Detainee) => {
    setDetaineeToEdit(detainee);
    setIsFormModalOpen(true);
  };

  const handleSaveDetainee = async (finalized: Detainee) => {
    // Save to SQLite backend (which also stores optimized photos)
    const savePromise = saveDetaineeToDB(finalized);

    let nextList: Detainee[];
    const exists = detainees.some((d) => d.id === finalized.id);

    if (exists) {
      nextList = detainees.map((d) => (d.id === finalized.id ? finalized : d));
      showToast(`تم حفظ وتحديث بيانات الموقوف (${finalized.firstName} ${finalized.lastName}) في قاعدة بيانات SQLite`);
    } else {
      nextList = [finalized, ...detainees];
      showToast(`تم تسجيل الموقوف الجديد (${finalized.firstName} ${finalized.lastName}) في قاعدة بيانات SQLite`);
    }

    updateAndSaveDetainees(nextList);
    setIsFormModalOpen(false);
    setDetaineeToEdit(null);

    if (profileDetainee && profileDetainee.id === finalized.id) {
      setProfileDetainee(finalized);
    }

    // Await server response to update with optimized server photo URLs if returned
    try {
      const res = await savePromise;
      if (res.success && res.data) {
        const synced = res.data;
        const updatedList = nextList.map((d) => (d.id === synced.id ? synced : d));
        setDetainees(updatedList);
        saveDetainees(updatedList);
        if (profileDetainee && profileDetainee.id === synced.id) {
          setProfileDetainee(synced);
        }
      }
    } catch (err) {
      console.warn('Backend sync error:', err);
    }
  };

  // Handler for Delete
  const handleDeleteDetainee = (detainee: Detainee) => {
    setDetaineeToDelete(detainee);
  };

  const handleConfirmDelete = async () => {
    if (!detaineeToDelete) return;
    const toDeleteId = detaineeToDelete.id;
    const toDeleteName = `${detaineeToDelete.firstName} ${detaineeToDelete.lastName}`;

    // Delete from SQLite backend
    deleteDetaineeFromDB(toDeleteId);

    const nextList = detainees.filter((d) => d.id !== toDeleteId);
    updateAndSaveDetainees(nextList);
    showToast(`تم حذف سجل الموقوف (${toDeleteName}) من قاعدة بيانات SQLite`);
    setDetaineeToDelete(null);
    if (profileDetainee && profileDetainee.id === toDeleteId) {
      setProfileDetainee(null);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      detentionCell: '',
      status: '',
      detainedForUnit: '',
      nationality: '',
      gender: '',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-60 px-5 py-3 rounded-xl shadow-xl border text-sm font-semibold flex items-center gap-2.5 transition animate-in slide-in-from-top duration-200 no-print ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-300" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        detainees={detainees}
        onOpenAddModal={handleOpenAddModal}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Quick Stats Metrics */}
        <StatsCards detainees={detainees} />

        {/* Search & Advanced Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          detainees={detainees}
          filteredDetainees={filteredDetainees}
        />

        {/* Detainees Table */}
        <DetaineesTable
          detainees={filteredDetainees}
          onViewProfile={(d) => setProfileDetainee(d)}
          onEditDetainee={handleEditDetainee}
          onDeleteDetainee={handleDeleteDetainee}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            سجل الموقوفين - مصمم للعمل محلياً على الحاسوب دون الحاجة لاتصال بالإنترنت (Offline First) - إعداد الملازم الأول نعوس
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-mono text-slate-600 font-medium">
              قاعدة بيانات SQLite مفعلة (detainees.db)
            </span>
          </div>
        </div>
      </footer>

      {/* Add / Edit Form Modal */}
      <DetaineeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setDetaineeToEdit(null);
        }}
        onSave={handleSaveDetainee}
        detaineeToEdit={detaineeToEdit}
        existingCells={existingCells}
      />

      {/* Profile Dossier & PDF Print Export Modal */}
      <DetaineeProfileModal
        detainee={profileDetainee}
        onClose={() => setProfileDetainee(null)}
        onEdit={(d) => {
          setProfileDetainee(null);
          handleEditDetainee(d);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        detainee={detaineeToDelete}
        isOpen={Boolean(detaineeToDelete)}
        onClose={() => setDetaineeToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        detainees={detainees}
        onUpdateDetainees={(newList) => {
          updateAndSaveDetainees(newList);
          showToast('تم تحديث وحفظ بيانات السجل بنجاح');
        }}
      />

    </div>
  );
}
