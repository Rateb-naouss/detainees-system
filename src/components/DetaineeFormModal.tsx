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
  FileText 
} from 'lucide-react';
import { Detainee, DetaineePhotoIndex } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface DetaineeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (detainee: Detainee) => void;
  detaineeToEdit: Detainee | null;
  existingCells: string[];
}

export const DetaineeFormModal: React.FC<DetaineeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  detaineeToEdit,
  existingCells,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Form State
  const [formData, setFormData] = useState<{
    detentionDate: string;
    detentionCell: string;
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

  // File input refs for the 3 slots
  const fileInputRef0 = useRef<HTMLInputElement>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (detaineeToEdit) {
      setFormData({
        detentionDate: detaineeToEdit.detentionDate || todayStr,
        detentionCell: detaineeToEdit.detentionCell || '',
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
    { title: 'الصورة الأمامية (وجه كامل)', sub: 'صورة رسمية من الأمام' },
    { title: 'الصورة الجانبية اليمنى', sub: 'زاوية 90 درجة يمين' },
    { title: 'الصورة الجانبية اليسرى', sub: 'زاوية 90 درجة يسار' },
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
              <p className="text-xs text-slate-300">
                يرجى ملء الحقول الرسمية بدقة لحفظها في السجل الأمني الموحد
              </p>
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
          
          {/* Section 1: بيانات التوقيف والنظارة */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. بيانات التوقيف والنظارة وتاريخ الإدخال</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Detention Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. تاريخ التوقيف <span className="text-red-500">*</span>
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
                  2. نظارة التوقيف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="cells-list"
                  value={formData.detentionCell}
                  onChange={(e) => setFormData({ ...formData, detentionCell: e.target.value })}
                  placeholder="مثال: نظارة التحقيق المركزية"
                  className={`w-full py-2 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    errors.detentionCell ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                <datalist id="cells-list">
                  {existingCells.map((c) => (
                    <option key={c} value={c} />
                  ))}
                  <option value="نظارة التحقيق المركزية - رقم 1" />
                  <option value="نظارة التحقيق المركزية - رقم 2" />
                  <option value="نظارة التوقيف الاحترازي - جناح أ" />
                  <option value="نظارة التوقيف الاحترازي - جناح ب" />
                  <option value="نظارة النساء - قسم الحراسة الخاصة" />
                  <option value="نظارة الأحداث" />
                </datalist>
                {errors.detentionCell && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.detentionCell}</p>
                )}
              </div>

              {/* Info Recording Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  13. تاريخ تدوين المعلومة
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
              <span>2. البيانات الشخصية والهوية الرسمية للموقوف</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. اسم الموقوف <span className="text-red-500">*</span>
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
                  4. اسم الاب
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
                  5. الشهرة (الكنية / العائلة) <span className="text-red-500">*</span>
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
                  6. اسم الام
                </label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="اسم الأم الكامل"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Place of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  7. مكان الولادة
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
                  8. تاريخ الولادة
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
                  9. الجنس
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
                  10. الجنسية
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
              <span>3. بيانات الاتصال والإقامة السابقة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  11. رقم الهاتف
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
                  12. العنوان السابق
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

          {/* Section 4: صور الموقوف (3 صور إلزامية/اختيارية مع ضغط تلقائي) */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>14. صور الموقوف (3 صور: أمامية، جانبية يمنى، جانبية يسرى)</span>
              </h3>
              <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                يتم ضغط الصور تلقائياً وحفظها بأمان داخل LocalStorage
              </span>
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
              <span>15. خانة ملاحظات</span>
            </h3>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="اكتب هنا أي تفاصيل قانونية، مضبوطات، حالة صحية، توجيهات أمنية، أو ملاحظات خاصة بالموقوف..."
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
