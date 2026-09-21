import * as XLSX from 'xlsx';
import { Detainee } from '../types';

/**
 * Exports a list of detainees to a beautifully formatted Excel (.xlsx) file
 * with full Arabic headers and RTL orientation.
 */
export function exportDetaineesToExcel(detainees: Detainee[], filenamePrefix = 'سجل_الموقوفين'): void {
  if (!detainees || detainees.length === 0) {
    alert('لا توجد بيانات لتصديرها');
    return;
  }

  // Format records with proper Arabic column names matching the system specification
  const formattedData = detainees.map((d, index) => {
    // Count attached photos
    const photoCount = d.photos ? d.photos.filter(p => p && p.trim().length > 0).length : 0;

    return {
      'ت': index + 1,
      'تاريخ التوقيف': d.detentionDate || '',
      'نظارة التوقيف': d.detentionCell || '',
      'اسم الموقوف': d.firstName || '',
      'اسم الاب': d.fatherName || '',
      'الشهرة': d.lastName || '',
      'الاسم الكامل': `${d.firstName || ''} ${d.fatherName || ''} ${d.lastName || ''}`.trim(),
      'اسم الام': d.motherName || '',
      'مكان الولادة': d.placeOfBirth || '',
      'تاريخ الولادة': d.dateOfBirth || '',
      'الجنس': d.gender || '',
      'الجنسية': d.nationality || '',
      'رقم الهاتف': d.phoneNumber || '',
      'العنوان السابق': d.previousAddress || '',
      'تاريخ تدوين المعلومة': d.recordDate || '',
      'عدد الصور المرفقة': `${photoCount} من 3`,
      'خانة ملاحظات': d.notes || '',
      'معرف السجل': d.id,
      'تاريخ الإدخال': d.createdAt ? new Date(d.createdAt).toLocaleString('ar-EG') : ''
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // ت
    { wch: 14 }, // تاريخ التوقيف
    { wch: 28 }, // نظارة التوقيف
    { wch: 16 }, // اسم الموقوف
    { wch: 16 }, // اسم الاب
    { wch: 16 }, // الشهرة
    { wch: 24 }, // الاسم الكامل
    { wch: 20 }, // اسم الام
    { wch: 16 }, // مكان الولادة
    { wch: 14 }, // تاريخ الولادة
    { wch: 10 }, // الجنس
    { wch: 14 }, // الجنسية
    { wch: 16 }, // رقم الهاتف
    { wch: 32 }, // العنوان السابق
    { wch: 18 }, // تاريخ تدوين المعلومة
    { wch: 14 }, // عدد الصور
    { wch: 40 }, // ملاحظات
    { wch: 12 }, // معرف السجل
    { wch: 20 }  // تاريخ الإدخال
  ];
  worksheet['!cols'] = colWidths;

  // Set Right-to-Left sheet view for Arabic Excel
  if (!worksheet['!views']) {
    worksheet['!views'] = [];
  }
  worksheet['!views'].push({ rightToLeft: true });

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الموقوفين');

  // Generate file name with current date
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = `${filenamePrefix}_${dateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, fileName);
}
