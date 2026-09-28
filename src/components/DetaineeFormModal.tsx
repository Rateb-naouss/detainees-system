import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Calendar, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Scale,
  Shield,
  CheckCircle2,
  ArrowRightLeft,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Detainee, DetaineePhotoIndex } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { normalizeArabic } from '../utils/arabicSearch';

interface DetaineeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (detainee: Detainee) => void;
  detaineeToEdit: Detainee | null;
  existingCells: string[];
  existingDetainees?: Detainee[];
}

export const DetaineeFormModal: React.FC<DetaineeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  detaineeToEdit,
  existingCells,
  existingDetainees = [],
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Form State
  const [formData, setFormData] = useState<{
    detentionDate: string;
    detentionCell: string;
    status: 'موقوف' | 'أخلي سبيله' | 'نقل الى سجن';
    releaseDate: string;
    transferPrison: string;
    transferDate: string;
    detainedForUnit: string;
    crimeType: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    motherName: string;
    placeOfBirth: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    phoneNumber: string;
    previousAddress: string;
    recordDate: string;
    photos: [string, string, string];
    notes: string;
  }>({
    detentionDate: todayStr,
    detentionCell: '',
    status: 'موقوف',
    releaseDate: todayStr,
    transferPrison: '',
    transferDate: todayStr,
    detainedForUnit: '',
    crimeType: '',
    firstName: '',
    fatherName: '',
    lastName: '',
    motherName: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: 'ذكر',
    nationality: 'لبناني',
    phoneNumber: '',
    previousAddress: '',
    recordDate: todayStr,
    photos: ['', '', ''],
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isProcessingImage, setIsProcessingImage] = useState<number | null>(null);
  const [isDuplicateDismissed, setIsDuplicateDismissed] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const lastCheckedPairRef = useRef<string>('');

  // Un-dismiss if the user changes the first or last name
  const currentPair = `${formData.firstName.trim()}|${formData.lastName.trim()}`;
  if (lastCheckedPairRef.current !== currentPair) {
    lastCheckedPairRef.current = currentPair;
    if (isDuplicateDismissed) {
      setIsDuplicateDismissed(false);
    }
  }

  // Find matches where both first name and last name match an existing detainee
  const cleanName = (str: string | null | undefined) => normalizeArabic(str || '').replace(/\s+/g, '');
  const matchingDetainees = React.useMemo(() => {
    const trimmedFirst = formData.firstName.trim();
    const trimmedLast = formData.lastName.trim();
    if (!trimmedFirst || !trimmedLast || trimmedFirst.length < 2 || trimmedLast.length < 2) {
      return [];
    }
    if (!existingDetainees || existingDetainees.length === 0) {
      return [];
    }

    const cleanFirst = cleanName(trimmedFirst);
    const cleanLast = cleanName(trimmedLast);

    return existingDetainees.filter((d) => {
      // Exclude the record currently being edited
      if (detaineeToEdit && d.id === detaineeToEdit.id) {
        return false;
      }
      return cleanName(d.firstName) === cleanFirst && cleanName(d.lastName) === cleanLast;
    });
  }, [formData.firstName, formData.lastName, existingDetainees, detaineeToEdit]);

  const handleSelectExisting = (match: Detainee) => {
    setFormData((prev) => ({
      ...prev,
      firstName: match.firstName || prev.firstName,
      fatherName: match.fatherName || prev.fatherName,
      lastName: match.lastName || prev.lastName,
      motherName: match.motherName || prev.motherName,
      placeOfBirth: match.placeOfBirth || prev.placeOfBirth,
      dateOfBirth: match.dateOfBirth || prev.dateOfBirth,
      gender: match.gender || prev.gender,
      nationality: match.nationality || prev.nationality,
      phoneNumber: match.phoneNumber || prev.phoneNumber,
      previousAddress: match.previousAddress || prev.previousAddress,
      // If current form has no photos, copy from matching record
      photos: prev.photos.some((p) => p && p.trim().length > 0)
        ? prev.photos
        : [match.photos?.[0] || '', match.photos?.[1] || '', match.photos?.[2] || ''],
    }));

    setIsDuplicateDismissed(true);
    setImportNotification(
      `تم استيراد كافة البيانات الشخصية للموقوف (${match.firstName} ${match.fatherName || ''} ${match.lastName}) بنجاح! يمكنك الآن استكمال بيانات التوقيف والنظارة.`
    );
  };

  // File input refs for the 3 slots
  const fileInputRef0 = useRef<HTMLInputElement>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsDuplicateDismissed(false);
    setImportNotification(null);
    lastCheckedPairRef.current = '';

    if (detaineeToEdit) {
      setFormData({
        detentionDate: detaineeToEdit.detentionDate || todayStr,
        detentionCell: detaineeToEdit.detentionCell || '',
        status: detaineeToEdit.status === 'أخلي سبيله' ? 'أخلي سبيله' : detaineeToEdit.status === 'نقل الى سجن' ? 'نقل الى سجن' : 'موقوف',
        releaseDate: detaineeToEdit.releaseDate || todayStr,
        transferPrison: detaineeToEdit.transferPrison || '',
        transferDate: detaineeToEdit.transferDate || todayStr,
        detainedForUnit: detaineeToEdit.detainedForUnit || '',
        crimeType: detaineeToEdit.crimeType || '',
        firstName: detaineeToEdit.firstName || '',
        fatherName: detaineeToEdit.fatherName || '',
        lastName: detaineeToEdit.lastName || '',
        motherName: detaineeToEdit.motherName || '',
        placeOfBirth: detaineeToEdit.placeOfBirth || '',
        dateOfBirth: detaineeToEdit.dateOfBirth || '',
        gender: detaineeToEdit.gender || 'ذكر',
        nationality: detaineeToEdit.nationality || 'لبناني',
        phoneNumber: detaineeToEdit.phoneNumber || '',
        previousAddress: detaineeToEdit.previousAddress || '',
        recordDate: detaineeToEdit.recordDate || todayStr,
        photos: [
          detaineeToEdit.photos?.[0] || '',
          detaineeToEdit.photos?.[1] || '',
          detaineeToEdit.photos?.[2] || ''
        ],
        notes: detaineeToEdit.notes || '',
      });
      setErrors({});
    } else {
      // Reset for new detainee
      setFormData({
        detentionDate: todayStr,
        detentionCell: '',
        status: 'موقوف',
        releaseDate: todayStr,
        transferPrison: '',
        transferDate: todayStr,
        detainedForUnit: '',
        crimeType: '',
        firstName: '',
        fatherName: '',
        lastName: '',
        motherName: '',
        placeOfBirth: '',
        dateOfBirth: '',
        gender: 'ذكر',
        nationality: 'لبناني',
        phoneNumber: '',
        previousAddress: '',
        recordDate: todayStr,
        photos: ['', '', ''],
        notes: '',
      });
      setErrors({});
    }
  }, [detaineeToEdit, isOpen, todayStr]);

  if (!isOpen) return null;

  // Handle Photo Upload
  const handlePhotoUpload = async (index: DetaineePhotoIndex, file: File) => {
    try {
      setIsProcessingImage(index);
      const compressedBase64 = await compressImage(file, 600, 700, 0.78);
      
      setFormData((prev) => {
        const nextPhotos: [string, string, string] = [...prev.photos];
        nextPhotos[index] = compressedBase64;
        return { ...prev, photos: nextPhotos };
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'خطأ في معالجة الصورة');
    } finally {
      setIsProcessingImage(null);
    }
  };

  // Remove Photo
  const handleRemovePhoto = (index: DetaineePhotoIndex) => {
    setFormData((prev) => {
      const nextPhotos: [string, string, string] = [...prev.photos];
      nextPhotos[index] = '';
      return { ...prev, photos: nextPhotos };
    });
  };

  // Form Validation
  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'اسم الموقوف إلزامي';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'الشهرة / اسم العائلة إلزامي';
    }
    if (!formData.detentionCell.trim()) {
      newErrors.detentionCell = 'يرجى تحديد نظارة التوقيف';
    }
    if (!formData.detentionDate) {
      newErrors.detentionDate = 'تاريخ التوقيف إلزامي';
    }
    if (formData.status === 'نقل الى سجن' && !formData.transferPrison.trim()) {
      newErrors.transferPrison = 'يرجى تحديد السجن المنقول إليه';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const now = new Date().toISOString();
    const finalizedDetainee: Detainee = {
      id: detaineeToEdit ? detaineeToEdit.id : `det-${Date.now()}`,
      detentionDate: formData.detentionDate,
      detentionCell: formData.detentionCell.trim(),
      status: formData.status,
      releaseDate: formData.status === 'أخلي سبيله' ? (formData.releaseDate || todayStr) : undefined,
      transferPrison: formData.status === 'نقل الى سجن' ? formData.transferPrison.trim() : undefined,
      transferDate: formData.status === 'نقل الى سجن' ? (formData.transferDate || todayStr) : undefined,
      detainedForUnit: formData.detainedForUnit.trim(),
      crimeType: formData.crimeType.trim(),
      firstName: formData.firstName.trim(),
      fatherName: formData.fatherName.trim(),
      lastName: formData.lastName.trim(),
      motherName: formData.motherName.trim(),
      placeOfBirth: formData.placeOfBirth.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      nationality: formData.nationality.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      previousAddress: formData.previousAddress.trim(),
      recordDate: formData.recordDate || todayStr,
      photos: formData.photos,
      notes: formData.notes.trim(),
      createdAt: detaineeToEdit ? detaineeToEdit.createdAt : now,
      updatedAt: now,
    };

    onSave(finalizedDetainee);
  };

  const photoLabels = [
    { title: 'الصورة الأمامية', sub: '' },
    { title: 'صورة 2', sub: '' },
    { title: 'صورة 3', sub: '' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/70 backdrop-blur-xs no-print">
      <div 
        id="detainee-form-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/80 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {detaineeToEdit ? 'تعديل استمارة الموقوف' : 'تسجيل موقوف جديد في النظارة'}
              </h2>
              
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: بيانات التوقيف والنظارة والوضع القانوني */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>بيانات التوقيف</span>
            </h3>

            {/* Row A: حالة الموقوف - موقوف لصالح - نوع الجرم */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
              {/* حالة الموقوف: موقوف \ أخلي سبيله */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  حالة الموقوف <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'موقوف' })}
                    className={`py-2 px-1.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      formData.status === 'موقوف'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-1 ring-rose-300'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${formData.status === 'موقوف' ? 'bg-rose-600 animate-pulse' : 'bg-slate-400'}`}></span>
                    <span className="truncate">موقوف</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      status: 'أخلي سبيله',
                      releaseDate: formData.releaseDate || todayStr 
                    })}
                    className={`py-2 px-1.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      formData.status === 'أخلي سبيله'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-300'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${formData.status === 'أخلي سبيله' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate">أخلي سبيله</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      status: 'نقل الى سجن',
                      transferDate: formData.transferDate || todayStr 
                    })}
                    className={`py-2 px-1.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      formData.status === 'نقل الى سجن'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-1 ring-blue-300'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowRightLeft className={`w-3.5 h-3.5 shrink-0 ${formData.status === 'نقل الى سجن' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">نقل الى سجن</span>
                  </button>
                </div>

                {/* تاريخ إخلاء السبيل - يظهر فقط عند اختيار أخلي سبيله */}
                {formData.status === 'أخلي سبيله' && (
                  <div className="mt-2.5 p-2.5 bg-emerald-50/90 rounded-lg border border-emerald-300 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>تاريخ إخلاء السبيل</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate || todayStr}
                      onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      className="w-full py-1.5 px-2.5 bg-white border border-emerald-300 rounded-md text-xs sm:text-sm font-medium text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                      required
                    />
                  </div>
                )}

                {/* تفاصيل النقل إلى سجن - تظهر فقط عند اختيار نقل الى سجن */}
                {formData.status === 'نقل الى سجن' && (
                  <div className="mt-2.5 p-2.5 bg-blue-50/90 rounded-lg border border-blue-300 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-700" />
                        <span>تاريخ النقل</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.transferDate || todayStr}
                        onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                        className="w-full py-1.5 px-2.5 bg-white border border-blue-300 rounded-md text-xs sm:text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        <span>السجن المنقول إليه</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        list="prisons-list"
                        value={formData.transferPrison}
                        onChange={(e) => {
                          setFormData({ ...formData, transferPrison: e.target.value });
                          if (errors.transferPrison) {
                            setErrors({ ...errors, transferPrison: '' });
                          }
                        }}
                        placeholder="اختر أو اكتب اسم السجن..."
                        className={`w-full py-1.5 px-2.5 bg-white border rounded-md text-xs sm:text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs ${
                          errors.transferPrison ? 'border-red-500 ring-1 ring-red-400' : 'border-blue-300'
                        }`}
                        required
                      />
                      {errors.transferPrison && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.transferPrison}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <datalist id="prisons-list">
                  <option value="سجن رومية المركزي" />
                  <option value="سجن القبة (طرابلس)" />
                  <option value="سجن زحلة" />
                  <option value="سجن بعبدا" />
                  <option value="سجن صيدا" />
                  <option value="سجن جزين" />
                  <option value="سجن النبطية" />
                  <option value="سجن عاليه" />
                  <option value="سجن أميون" />
                  <option value="سجن البترون" />
                  <option value="سجن حلبا" />
                  <option value="سجن جب جنين" />
                  <option value="سجن راشيا" />
                  <option value="سجن بعلبك" />
                  <option value="سجن ضهر الباشق" />
                  <option value="سجن نساء بعبدا" />
                  <option value="سجن نساء طرابلس" />
                </datalist>
              </div>

              {/* موقوف لصالح: (اختيار اسم القطعة) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  موقوف لصالح (اسم القطعة)
                </label>
                <input
                  type="text"
                  list="units-list"
                  value={formData.detainedForUnit}
                  onChange={(e) => setFormData({ ...formData, detainedForUnit: e.target.value })}
                  placeholder="اختر أو اكتب اسم القطعة..."
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="units-list">
                  <option value="فصيلة أبي سمرا" />
                  <option value="فصيلة المينا" />
                  <option value="فصيلة البداوي" />
                  <option value="فصيلة القبة" />
                  <option value="فصيلة التل" />
                  <option value="فصيلة زغرتا" />
                  <option value="فصيلة أميون" />
                  <option value="فصيلة المنية" />
                  <option value="فصيلة حلبا" />
                  <option value="مخفر مشتى حسن" />
                  <option value="مخفر العبدة" />
                  <option value="نظارة تجمع فصائل طرابلس" />
                  <option value="مفرزة طرابلس القضائية" />
                  <option value="شعبة المعلومات" />
                  <option value="مكتب مكافحة المخدرات الإقليمي" />
                  <option value="مفرزة استقصاء الشمال" />
                  <option value="مفرزة سير طرابلس" />
                  <option value="مفرزة سير حلبا" />
                  <option value="مفرزة سير أميون" />
                  <option value="سرية طرابلس الإقليمية" />
                  <option value="مفرزة سير زغرتا" />
                  <option value="فصيلة مشمش" />
                </datalist>
              </div>

              {/* نوع الجرم: (كتابة الجرم) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع الجرم (كتابة الجرم)
                </label>
                <input
                  type="text"
                  list="crimes-list"
                  value={formData.crimeType}
                  onChange={(e) => setFormData({ ...formData, crimeType: e.target.value })}
                  placeholder="اكتب الجرم (مثال: سرقة، مخدرات، إطلاق نار)..."
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="crimes-list">
                  <option value="سرقة" />
                  <option value="ترويج وتعاطي مخدرات" />
                  <option value="إطلاق نار ونقل سلاح حربي دون ترخيص" />
                  <option value="دخول البلاد خلسة وإقامة غير مشروعة" />
                  <option value="تزوير واستعمال مزور" />
                  <option value="شكوى ضرب وإيذاء" />
                  <option value="نصب واحتيال" />
                  <option value="شيك دون رصيد" />
                  <option value="مخالفة تدابير وقوانين أمنية" />
                  <option value="مذكرة إحضار / توقيف غيابية" />
                  <option value="إشتباه والتحقق من الهوية" />
                  <option value="قتل" />
                </datalist>
              </div>
            </div>

            {/* Row B: تاريخ التوقيف - نظارة التوقيف - تاريخ تدوين المعلومة */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Detention Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ التوقيف <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.detentionDate}
                    onChange={(e) => setFormData({ ...formData, detentionDate: e.target.value })}
                    className={`w-full py-2 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      errors.detentionDate ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.detentionDate && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.detentionDate}</p>
                )}
              </div>

              {/* Detention Cell */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نظارة التوقيف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="cells-list"
                  value={formData.detentionCell}
                  onChange={(e) => setFormData({ ...formData, detentionCell: e.target.value })}
                  placeholder="مثال: نظارة مخفر العبدة"
                  className={`w-full py-2 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    errors.detentionCell ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                <datalist id="cells-list">
                  {existingCells.map((c) => (
                    <option key={c} value={c} />
                  ))}
                  <option value="فصيلة أبي سمرا" />
                  <option value="فصيلة المينا" />
                  <option value="فصيلة البداوي" />
                  <option value="فصيلة القبة" />
                  <option value="نظارة تجمع فصائل طرابلس" />
                  <option value="نظارة النساء - مخفر مشتى حسن" />
                  <option value="نظارة الأحداث - مخفر مشتى حسن" />
                  <option value="مخفر العبدة" />
                </datalist>
                {errors.detentionCell && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.detentionCell}</p>
                )}
              </div>

              {/* Info Recording Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ تدوين المعلومة
                </label>
                <input
                  type="date"
                  value={formData.recordDate}
                  onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: البيانات الشخصية والهوية */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-600" />
              <span>البيانات الشخصية والهوية الرسمية للموقوف</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الموقوف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="الاسم الأول"
                  className={`w-full py-2 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    errors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>

              {/* Father Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الاب
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="اسم الأب"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Last Name / Family */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الشهرة (العائلة) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="الشهرة أو العائلة"
                  className={`w-full py-2 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    errors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>

              {/* Mother Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الام
                </label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="اسم الأم الكامل"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notification Banner when existing detainee data is imported */}
              {importNotification && (
                <div className="col-span-1 sm:col-span-2 md:col-span-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{importNotification}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportNotification(null)}
                    className="text-emerald-700 hover:text-emerald-950 p-1 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Matching Existing Detainee Alert & Selection Widget */}
              {matchingDetainees.length > 0 && !isDuplicateDismissed && (
                <div className="col-span-1 sm:col-span-2 md:col-span-4 p-4 bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-3 border-b border-amber-200">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                          <span>تنبيه: تم العثور على اسم مطابق مسجل سابقاً ({matchingDetainees.length})</span>
                        </h4>
                        <p className="text-xs text-amber-800">
                          الاسم: <strong className="text-amber-950 font-bold">{formData.firstName.trim()} {formData.lastName.trim()}</strong> مسجل مسبقاً في القيود. هل هو نفس الشخص؟
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDuplicateDismissed(true)}
                      className="self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-200 transition cursor-pointer flex items-center gap-1 shrink-0"
                      title="تجاهل والمتابعة كشخص جديد آخر"
                    >
                      <span>شخص جديد آخر (تجاهل)</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pl-1">
                    {matchingDetainees.map((match) => {
                      const photo = match.photos?.[0];
                      return (
                        <div
                          key={match.id}
                          className="bg-white border-2 border-amber-300 hover:border-blue-500 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs transition"
                        >
                          <div className="flex items-center gap-3">
                            {/* Photo thumbnail or avatar */}
                            <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                              {photo ? (
                                <img src={photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-7 h-7 text-slate-400" />
                              )}
                            </div>

                            {/* Personal Details */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-sm font-bold text-slate-900">
                                  {match.firstName} {match.fatherName} {match.lastName}
                                </h5>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  match.status === 'أخلي سبيله'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : match.status === 'نقل الى سجن'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    match.status === 'أخلي سبيله'
                                      ? 'bg-emerald-600'
                                      : match.status === 'نقل الى سجن'
                                      ? 'bg-blue-600'
                                      : 'bg-rose-600'
                                  }`}></span>
                                  {match.status || 'موقوف'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                                <span>اسم الأم: <strong className="text-slate-800 font-semibold">{match.motherName || 'غير مسجل'}</strong></span>
                                <span>•</span>
                                <span>الولادة: <strong className="text-slate-800 font-semibold">{match.placeOfBirth || '---'} {match.dateOfBirth ? `(${match.dateOfBirth})` : ''}</strong></span>
                                <span>•</span>
                                <span>الجنسية: <strong className="text-slate-800 font-semibold">{match.nationality || 'لبناني'}</strong></span>
                                {match.phoneNumber && (
                                  <>
                                    <span>•</span>
                                    <span>الهاتف: <strong className="text-slate-800 font-mono font-semibold" dir="ltr">{match.phoneNumber}</strong></span>
                                  </>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-500">
                                <span>آخر قيد: </span>
                                <span className="font-semibold text-slate-700">{match.detentionCell || 'نظارة غير محددة'}</span>
                                <span> بتاريخ </span>
                                <span className="font-mono text-slate-700">{match.detentionDate || '---'}</span>
                                {match.crimeType && (
                                  <span> - الجرم: <span className="font-semibold text-slate-700">{match.crimeType}</span></span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Select this person button */}
                          <button
                            type="button"
                            onClick={() => handleSelectExisting(match)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition shrink-0 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>نعم، هو نفس الشخص (استيراد كافة بياناته)</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Place of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مكان الولادة
                </label>
                <input
                  type="text"
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                  placeholder="المدينة / المنطقة"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ الولادة
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الجنس
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الجنسية
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="الجنسية"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          </div>

          {/* Section 3: بيانات الاتصال والإقامة */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>بيانات الاتصال والإقامة السابقة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+961 70 123456"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              
              </div>

              {/* Previous Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  العنوان السابق
                </label>
                <input
                  type="text"
                  value={formData.previousAddress}
                  onChange={(e) => setFormData({ ...formData, previousAddress: e.target.value })}
                  placeholder="المحافظة، القضاء، البلدة، الشارع، المبنى"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: صور الموقوف  */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>صور الموقوف</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((slotIdx) => {
                const photoSrc = formData.photos[slotIdx as DetaineePhotoIndex];
                const meta = photoLabels[slotIdx];
                const isProcessing = isProcessingImage === slotIdx;
                const fileRef = slotIdx === 0 ? fileInputRef0 : slotIdx === 1 ? fileInputRef1 : fileInputRef2;

                return (
                  <div 
                    key={slotIdx} 
                    className="border border-slate-200 rounded-xl bg-white p-3 flex flex-col items-center text-center shadow-2xs"
                  >
                    <div className="text-xs font-bold text-slate-800 mb-0.5">{meta.title}</div>
                    <div className="text-[11px] text-slate-400 mb-2">{meta.sub}</div>

                    {/* Image Preview Box */}
                    <div className="relative w-36 h-44 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden group">
                      {photoSrc ? (
                        <>
                          <img 
                            src={photoSrc} 
                            alt={meta.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(slotIdx as DetaineePhotoIndex)}
                            className="absolute top-1.5 left-1.5 p-1.5 bg-red-600 text-white rounded-md opacity-90 hover:opacity-100 shadow-sm transition cursor-pointer"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div 
                          onClick={() => fileRef.current?.click()}
                          className="flex flex-col items-center justify-center p-3 cursor-pointer text-slate-400 hover:text-blue-600 transition"
                        >
                          <Upload className="w-8 h-8 mb-1.5 stroke-1" />
                          <span className="text-xs font-medium">انقر لرفع صورة</span>
                          <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP</span>
                        </div>
                      )}

                      {isProcessing && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-semibold text-blue-600">
                          جاري الضغط والمعالجة...
                        </div>
                      )}
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handlePhotoUpload(slotIdx as DetaineePhotoIndex, file);
                        }
                      }}
                    />

                    {/* Button trigger */}
                    <div className="mt-2 w-full">
                      {photoSrc ? (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="w-full text-xs text-blue-600 hover:text-blue-700 py-1 font-medium transition cursor-pointer"
                        >
                          تغيير الصورة
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="w-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-md font-medium transition cursor-pointer"
                        >
                          اختيار ملف
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: خانة ملاحظات */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>ملاحظات</span>
            </h3>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="اكتب هنا أي تفاصيل، مضبوطات، حالة صحية، توجيهات..."
              className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </form>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-200 text-sm font-medium transition cursor-pointer"
          >
            إلغاء التغييرات
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{detaineeToEdit ? 'تحديث وحفظ البيانات' : 'حفظ بيانات الموقوف'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
