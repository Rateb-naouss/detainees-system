/**
 * Data structures and types for the Detainees Management System (نظام إدارة الموقوفين)
 */

export interface Detainee {
  id: string; // Unique identifier
  detentionDate: string; // 1. تاريخ التوقيف (YYYY-MM-DD)
  detentionCell: string; // 2. نظارة التوقيف (Detention Cell / Lockup)
  firstName: string; // 3. اسم الموقوف (First Name)
  fatherName: string; // 4. اسم الاب (Father's Name)
  lastName: string; // 5. الشهرة (Last Name / Family Name)
  motherName: string; // 6. اسم الام (Mother's Full Name)
  placeOfBirth: string; // 7. مكان الولادة (Place of Birth)
  dateOfBirth: string; // 8. تاريخ الولادة (Date of Birth)
  gender: 'ذكر' | 'أنثى' | string; // 9. الجنس (Gender)
  nationality: string; // 10. الجنسية (Nationality)
  phoneNumber: string; // 11. رقم الهاتف (Phone Number)
  previousAddress: string; // 12. العنوان السابق (Previous Address)
  recordDate: string; // 13. تاريخ تدوين المعلومة (Info Recording Date)
  photos: [string, string, string]; // 14. صور الموقوف (3 image upload slots - Base64 strings)
  notes: string; // 15. خانة ملاحظات (Notes)
  createdAt: string; // Timestamp ISO
  updatedAt: string; // Timestamp ISO
}

export type DetaineePhotoIndex = 0 | 1 | 2;

export interface DetaineeFilters {
  searchQuery: string;
  detentionCell: string;
  nationality: string;
  gender: string;
  startDate: string;
  endDate: string;
}

export type SortField = 
  | 'detentionDate' 
  | 'firstName' 
  | 'lastName' 
  | 'detentionCell' 
  | 'nationality' 
  | 'recordDate'
  | 'createdAt';

export type SortDirection = 'asc' | 'desc';
