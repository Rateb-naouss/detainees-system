import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to SQLite database file
export const DB_PATH = path.resolve(__dirname, '../detainees.db');
export const UPLOADS_DIR = path.resolve(__dirname, '../uploads/photos');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

/**
 * Initializes the SQLite database (detainees.db)
 */
export async function initDB(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`[SQLite] Loaded existing database from: ${DB_PATH}`);
    } catch (err) {
      console.error('[SQLite] Error reading existing database file, creating fresh one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    console.log(`[SQLite] Creating new database at: ${DB_PATH}`);
    dbInstance = new SQL.Database();
  }

  // Create Schema
  createTables(dbInstance);
  persistDB();

  return dbInstance;
}

/**
 * Creates required tables in SQLite
 */
function createTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS detainees (
      id TEXT PRIMARY KEY,
      detention_date TEXT,
      detention_cell TEXT,
      status TEXT DEFAULT 'موقوف',
      detained_for_unit TEXT,
      crime_type TEXT,
      first_name TEXT NOT NULL,
      father_name TEXT,
      last_name TEXT NOT NULL,
      mother_name TEXT,
      place_of_birth TEXT,
      date_of_birth TEXT,
      gender TEXT DEFAULT 'ذكر',
      nationality TEXT,
      phone_number TEXT,
      previous_address TEXT,
      record_date TEXT,
      notes TEXT,
      photo_0 TEXT,
      photo_1 TEXT,
      photo_2 TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS detainee_photos (
      detainee_id TEXT,
      photo_index INTEGER,
      mime_type TEXT,
      file_path TEXT,
      photo_data TEXT,
      created_at TEXT,
      PRIMARY KEY (detainee_id, photo_index)
    );
  `);
}

/**
 * Saves database state from memory to disk (detainees.db)
 */
export function persistDB(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[SQLite] Failed to persist database to file:', err);
  }
}

/**
 * Type representing Detainee record
 */
export interface DetaineeRecord {
  id: string;
  detentionDate: string;
  detentionCell: string;
  status: 'موقوف' | 'أخلي سبيله';
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Saves or updates a photo on disk and in database
 */
export function savePhotoToDisk(detaineeId: string, index: number, photoInput: string): string {
  if (!photoInput || typeof photoInput !== 'string' || photoInput.trim() === '') {
    return '';
  }

  // If it's already an existing relative / uploaded URL, keep it
  if (photoInput.startsWith('/uploads/photos/')) {
    return photoInput;
  }

  // If it's a data URI (e.g. data:image/jpeg;base64,...)
  if (photoInput.startsWith('data:')) {
    const matches = photoInput.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const filename = `${detaineeId}_photo_${index}_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      try {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        const publicUrl = `/uploads/photos/${filename}`;

        // Also save reference in detainee_photos table
        if (dbInstance) {
          dbInstance.run(
            `INSERT OR REPLACE INTO detainee_photos (detainee_id, photo_index, mime_type, file_path, photo_data, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [detaineeId, index, mimeType, publicUrl, photoInput, new Date().toISOString()]
          );
        }

        return publicUrl;
      } catch (err) {
        console.error(`[Uploads] Error saving photo for ${detaineeId} [${index}]:`, err);
        return photoInput; // fallback to inline if write failed
      }
    }
  }

  return photoInput;
}

/**
 * Fetches all detainees from SQLite
 */
export async function getAllDetainees(): Promise<DetaineeRecord[]> {
  const db = await initDB();
  const stmt = db.prepare(`SELECT * FROM detainees ORDER BY datetime(detention_date) DESC, created_at DESC`);
  const results: DetaineeRecord[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    results.push({
      id: String(row.id || ''),
      detentionDate: String(row.detention_date || ''),
      detentionCell: String(row.detention_cell || ''),
      status: (row.status === 'أخلي سبيله' ? 'أخلي سبيله' : 'موقوف') as 'موقوف' | 'أخلي سبيله',
      detainedForUnit: String(row.detained_for_unit || ''),
      crimeType: String(row.crime_type || ''),
      firstName: String(row.first_name || ''),
      fatherName: String(row.father_name || ''),
      lastName: String(row.last_name || ''),
      motherName: String(row.mother_name || ''),
      placeOfBirth: String(row.place_of_birth || ''),
      dateOfBirth: String(row.date_of_birth || ''),
      gender: String(row.gender || 'ذكر'),
      nationality: String(row.nationality || ''),
      phoneNumber: String(row.phone_number || ''),
      previousAddress: String(row.previous_address || ''),
      recordDate: String(row.record_date || ''),
      notes: String(row.notes || ''),
      photos: [
        String(row.photo_0 || ''),
        String(row.photo_1 || ''),
        String(row.photo_2 || '')
      ],
      createdAt: String(row.created_at || ''),
      updatedAt: String(row.updated_at || '')
    });
  }

  stmt.free();
  return results;
}

/**
 * Inserts or updates a detainee record in SQLite
 */
export async function saveDetaineeRecord(detainee: DetaineeRecord): Promise<DetaineeRecord> {
  const db = await initDB();

  // Process and optimize photos (saving base64 to uploads folder)
  const processedPhotos: [string, string, string] = [
    savePhotoToDisk(detainee.id, 0, detainee.photos?.[0] || ''),
    savePhotoToDisk(detainee.id, 1, detainee.photos?.[1] || ''),
    savePhotoToDisk(detainee.id, 2, detainee.photos?.[2] || '')
  ];

  const now = new Date().toISOString();
  const createdAt = detainee.createdAt || now;
  const updatedAt = now;

  db.run(
    `INSERT OR REPLACE INTO detainees (
      id, detention_date, detention_cell, status, detained_for_unit, crime_type,
      first_name, father_name, last_name, mother_name, place_of_birth, date_of_birth,
      gender, nationality, phone_number, previous_address, record_date, notes,
      photo_0, photo_1, photo_2, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      detainee.id,
      detainee.detentionDate || '',
      detainee.detentionCell || '',
      detainee.status || 'موقوف',
      detainee.detainedForUnit || '',
      detainee.crimeType || '',
      detainee.firstName,
      detainee.fatherName || '',
      detainee.lastName,
      detainee.motherName || '',
      detainee.placeOfBirth || '',
      detainee.dateOfBirth || '',
      detainee.gender || 'ذكر',
      detainee.nationality || '',
      detainee.phoneNumber || '',
      detainee.previousAddress || '',
      detainee.recordDate || '',
      detainee.notes || '',
      processedPhotos[0],
      processedPhotos[1],
      processedPhotos[2],
      createdAt,
      updatedAt
    ]
  );

  persistDB();

  return {
    ...detainee,
    photos: processedPhotos,
    createdAt,
    updatedAt
  };
}

/**
 * Deletes a detainee record from SQLite and cleans up associated files
 */
export async function deleteDetaineeRecord(id: string): Promise<boolean> {
  const db = await initDB();

  // Fetch photos to delete physical files
  const stmt = db.prepare(`SELECT photo_0, photo_1, photo_2 FROM detainees WHERE id = ?`);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    [row.photo_0, row.photo_1, row.photo_2].forEach((photoUrl) => {
      if (typeof photoUrl === 'string' && photoUrl.startsWith('/uploads/photos/')) {
        const localPath = path.join(__dirname, '..', photoUrl);
        if (fs.existsSync(localPath)) {
          try {
            fs.unlinkSync(localPath);
          } catch (e) {
            console.error('Failed to delete photo file:', e);
          }
        }
      }
    });
  }
  stmt.free();

  db.run(`DELETE FROM detainees WHERE id = ?`, [id]);
  db.run(`DELETE FROM detainee_photos WHERE detainee_id = ?`, [id]);
  persistDB();

  return true;
}

/**
 * Clears all data and re-creates empty SQLite tables
 */
export async function resetDatabase(): Promise<void> {
  const db = await initDB();
  db.run(`DELETE FROM detainees;`);
  db.run(`DELETE FROM detainee_photos;`);
  persistDB();

  // Clear uploads directory
  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
      } catch (err) {
        console.error('Error cleaning upload file:', err);
      }
    }
  }
}

/**
 * Imports a batch of detainees into SQLite
 */
export async function batchImportDetainees(records: DetaineeRecord[]): Promise<number> {
  let count = 0;
  for (const record of records) {
    if (record && record.id && record.firstName && record.lastName) {
      await saveDetaineeRecord(record);
      count++;
    }
  }
  return count;
}
