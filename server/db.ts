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
  migrateExistingPhotoFilenames(dbInstance);
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
 * Sanitizes detainee name into safe filename segment (Arabic & alphanumeric)
 */
export function sanitizeDetaineeNameForFilename(
  firstName: string,
  fatherName?: string,
  lastName?: string
): string {
  const parts = [firstName, fatherName, lastName]
    .map((p) => (p || '').trim())
    .filter(Boolean);

  if (parts.length === 0) return 'موقوف';

  let combined = parts.join('_');

  // Strip characters forbidden or problematic across OS and filesystems
  combined = combined
    .replace(/[/\\?%*:|"<>#$&+`~=!'@^{}[\];,.]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return combined || 'موقوف';
}

/**
 * Checks if a given photo filename in uploads is referenced by a different detainee
 */
export function isFileOwnedByAnotherDetainee(filename: string, currentDetaineeId: string): boolean {
  if (!dbInstance) return false;
  try {
    const relativeUrl = `/uploads/photos/${path.basename(filename)}`;
    const stmt = dbInstance.prepare(`
      SELECT id FROM detainees 
      WHERE (photo_0 = ? OR photo_1 = ? OR photo_2 = ?) AND id != ?
      LIMIT 1
    `);
    stmt.bind([relativeUrl, relativeUrl, relativeUrl, currentDetaineeId]);
    const hasAnotherOwner = stmt.step();
    stmt.free();
    return hasAnotherOwner;
  } catch {
    return false;
  }
}

/**
 * Saves or updates a photo on disk and in database named after the detainee's name
 */
export function savePhotoToDisk(
  detainee: { id: string; firstName: string; fatherName?: string; lastName: string },
  index: number,
  photoInput: string
): string {
  if (!photoInput || typeof photoInput !== 'string' || photoInput.trim() === '') {
    return '';
  }

  const safeName = sanitizeDetaineeNameForFilename(detainee.firstName, detainee.fatherName, detainee.lastName);

  // If it's already an existing uploaded file in /uploads/photos/
  if (photoInput.startsWith('/uploads/photos/')) {
    const oldFilename = path.basename(photoInput);
    const oldFilePath = path.join(UPLOADS_DIR, oldFilename);
    const extMatch = oldFilename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

    // Target clean filename based on detainee name
    let targetFilename = `${safeName}_${index + 1}.${ext}`;
    if (isFileOwnedByAnotherDetainee(targetFilename, detainee.id)) {
      targetFilename = `${safeName}_${detainee.id.slice(-4)}_${index + 1}.${ext}`;
    }

    // If the file exists under old name, rename it to the detainee's name
    if (oldFilename !== targetFilename && fs.existsSync(oldFilePath)) {
      const targetFilePath = path.join(UPLOADS_DIR, targetFilename);
      try {
        if (fs.existsSync(targetFilePath) && oldFilePath !== targetFilePath) {
          fs.unlinkSync(targetFilePath);
        }
        fs.renameSync(oldFilePath, targetFilePath);
        const newUrl = `/uploads/photos/${targetFilename}`;

        if (dbInstance) {
          dbInstance.run(
            `UPDATE detainee_photos SET file_path = ? WHERE detainee_id = ? AND photo_index = ?`,
            [newUrl, detainee.id, index]
          );
        }
        return newUrl;
      } catch (e) {
        console.error(`[Uploads] Error renaming photo file from ${oldFilename} to ${targetFilename}:`, e);
        return photoInput;
      }
    }

    return photoInput;
  }

  // If it's a data URI (e.g. data:image/jpeg;base64,...)
  if (photoInput.startsWith('data:')) {
    const matches = photoInput.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

      let filename = `${safeName}_${index + 1}.${ext}`;
      if (isFileOwnedByAnotherDetainee(filename, detainee.id)) {
        filename = `${safeName}_${detainee.id.slice(-4)}_${index + 1}.${ext}`;
      }

      const filePath = path.join(UPLOADS_DIR, filename);

      try {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        const publicUrl = `/uploads/photos/${filename}`;

        // Also save reference in detainee_photos table
        if (dbInstance) {
          dbInstance.run(
            `INSERT OR REPLACE INTO detainee_photos (detainee_id, photo_index, mime_type, file_path, photo_data, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [detainee.id, index, mimeType, publicUrl, photoInput, new Date().toISOString()]
          );
        }

        return publicUrl;
      } catch (err) {
        console.error(`[Uploads] Error saving photo for ${detainee.id} (${safeName}) [${index}]:`, err);
        return photoInput; // fallback to inline if write failed
      }
    }
  }

  return photoInput;
}

/**
 * Migrates existing photos in uploads/photos that have legacy filenames (e.g. det-...)
 * to be named after the detainee's name
 */
export function migrateExistingPhotoFilenames(db: Database): void {
  try {
    const stmt = db.prepare(`SELECT id, first_name, father_name, last_name, photo_0, photo_1, photo_2 FROM detainees`);
    const updates: Array<{ id: string; photos: [string, string, string] }> = [];

    while (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, unknown>;
      const id = String(row.id || '');
      const firstName = String(row.first_name || '');
      const fatherName = String(row.father_name || '');
      const lastName = String(row.last_name || '');
      const safeName = sanitizeDetaineeNameForFilename(firstName, fatherName, lastName);

      const photos: [string, string, string] = [
        String(row.photo_0 || ''),
        String(row.photo_1 || ''),
        String(row.photo_2 || '')
      ];
      let hasChange = false;

      for (let i = 0; i < 3; i++) {
        const photoUrl = photos[i];
        if (photoUrl && photoUrl.startsWith('/uploads/photos/')) {
          const oldFilename = path.basename(photoUrl);
          const extMatch = oldFilename.match(/\.([a-zA-Z0-9]+)$/);
          const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
          const targetFilename = `${safeName}_${i + 1}.${ext}`;

          if (oldFilename !== targetFilename) {
            const oldPath = path.join(UPLOADS_DIR, oldFilename);
            const targetPath = path.join(UPLOADS_DIR, targetFilename);

            if (fs.existsSync(oldPath)) {
              try {
                if (fs.existsSync(targetPath) && oldPath !== targetPath) {
                  fs.unlinkSync(targetPath);
                }
                fs.renameSync(oldPath, targetPath);
                photos[i] = `/uploads/photos/${targetFilename}`;
                hasChange = true;
                console.log(`[Migration] Renamed photo from ${oldFilename} to ${targetFilename}`);
              } catch (e) {
                console.error(`[Migration] Failed to rename photo ${oldFilename}:`, e);
              }
            }
          }
        }
      }

      if (hasChange) {
        updates.push({ id, photos });
      }
    }
    stmt.free();

    for (const update of updates) {
      db.run(
        `UPDATE detainees SET photo_0 = ?, photo_1 = ?, photo_2 = ? WHERE id = ?`,
        [update.photos[0], update.photos[1], update.photos[2], update.id]
      );
      for (let i = 0; i < 3; i++) {
        if (update.photos[i]) {
          db.run(
            `UPDATE detainee_photos SET file_path = ? WHERE detainee_id = ? AND photo_index = ?`,
            [update.photos[i], update.id, i]
          );
        }
      }
    }

    if (updates.length > 0) {
      persistDB();
      console.log(`[Migration] Updated ${updates.length} detainees with new photo filenames.`);
    }
  } catch (err) {
    console.error('[Migration] Error migrating photo filenames:', err);
  }
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

  // If editing an existing record, check if photos were removed so we can clean up old files
  const existingStmt = db.prepare(`SELECT photo_0, photo_1, photo_2 FROM detainees WHERE id = ?`);
  existingStmt.bind([detainee.id]);
  let oldPhotos: [string, string, string] = ['', '', ''];
  if (existingStmt.step()) {
    const row = existingStmt.getAsObject() as Record<string, unknown>;
    oldPhotos = [
      String(row.photo_0 || ''),
      String(row.photo_1 || ''),
      String(row.photo_2 || '')
    ];
  }
  existingStmt.free();

  // Process and optimize photos (saving base64 or renaming to detainee name)
  const processedPhotos: [string, string, string] = [
    savePhotoToDisk(detainee, 0, detainee.photos?.[0] || ''),
    savePhotoToDisk(detainee, 1, detainee.photos?.[1] || ''),
    savePhotoToDisk(detainee, 2, detainee.photos?.[2] || '')
  ];

  // Clean up any removed photo files
  for (let i = 0; i < 3; i++) {
    const oldP = oldPhotos[i];
    const newP = processedPhotos[i];
    if (oldP && oldP.startsWith('/uploads/photos/') && oldP !== newP && !processedPhotos.includes(oldP)) {
      if (!isFileOwnedByAnotherDetainee(path.basename(oldP), detainee.id)) {
        const localPath = path.join(UPLOADS_DIR, path.basename(oldP));
        if (fs.existsSync(localPath)) {
          try {
            fs.unlinkSync(localPath);
          } catch (e) {
            console.error('Error removing old photo file:', e);
          }
        }
      }
    }
  }

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
