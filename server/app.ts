import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import {
  initDB,
  configureDataPaths,
  getDbPath,
  getUploadsDir,
  getAllDetainees,
  saveDetaineeRecord,
  deleteDetaineeRecord,
  resetDatabase,
  batchImportDetainees,
  persistDB,
  DetaineeRecord,
} from './db.ts';

export interface BackendAppOptions {
  dataDir?: string;
  staticDistDir?: string;
}

/**
 * Builds and initializes the Express + SQLite API application.
 * Shared between standalone web server (server.ts) and Electron main process.
 */
export async function createBackendApp(options: BackendAppOptions = {}): Promise<Express> {
  if (options.dataDir) {
    configureDataPaths(options.dataDir);
  }

  // Initialize SQLite database
  await initDB();

  const app = express();

  // Middleware with high body limits for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static directory for optimized photo uploads
  app.use('/uploads/photos', express.static(getUploadsDir()));

  // ======================== API ROUTES ========================

  /**
   * GET /api/detainees - Retrieve all detainees from SQLite
   */
  app.get('/api/detainees', async (_req, res) => {
    try {
      const records = await getAllDetainees();
      res.json({ success: true, data: records });
    } catch (err: unknown) {
      console.error('Error fetching detainees from SQLite:', err);
      res.status(500).json({ success: false, error: 'فشل استرجاع السجلات من قاعدة بيانات SQLite' });
    }
  });

  /**
   * POST /api/detainees - Insert or update detainee in SQLite
   */
  app.post('/api/detainees', async (req, res) => {
    try {
      const detainee = req.body as DetaineeRecord;
      if (!detainee || !detainee.id || !detainee.firstName || !detainee.lastName) {
        return res.status(400).json({ success: false, error: 'البيانات غير مكتملة، الاسم والشهرة مطلوبة' });
      }

      const saved = await saveDetaineeRecord(detainee);
      res.json({ success: true, data: saved });
    } catch (err: unknown) {
      console.error('Error saving detainee to SQLite:', err);
      res.status(500).json({ success: false, error: 'فشل حفظ السجل في قاعدة بيانات SQLite' });
    }
  });

  /**
   * DELETE /api/detainees/:id - Remove detainee from SQLite
   */
  app.delete('/api/detainees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDetaineeRecord(id);
      res.json({ success: true, message: `تم حذف السجل ${id} بنجاح` });
    } catch (err: unknown) {
      console.error('Error deleting detainee from SQLite:', err);
      res.status(500).json({ success: false, error: 'فشل حذف السجل' });
    }
  });

  /**
   * GET /api/database/download - Direct download of the real SQLite detainees.db file
   */
  app.get('/api/database/download', (_req, res) => {
    try {
      persistDB();
      const dbPath = getDbPath();
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ success: false, error: 'ملف قاعدة البيانات غير موجود' });
      }

      const filename = `detainees_${new Date().toISOString().slice(0, 10)}.db`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/x-sqlite3');
      const fileStream = fs.createReadStream(dbPath);
      fileStream.pipe(res);
    } catch (err) {
      console.error('Error downloading SQLite DB:', err);
      res.status(500).json({ success: false, error: 'فشل تنزيل ملف قاعدة البيانات' });
    }
  });

  /**
   * GET /api/database/info - Database status & file size info
   */
  app.get('/api/database/info', async (_req, res) => {
    try {
      persistDB();
      const dbPath = getDbPath();
      const uploadsDir = getUploadsDir();

      let fileSize = 0;
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        fileSize = stats.size;
      }

      let photoCount = 0;
      if (fs.existsSync(uploadsDir)) {
        photoCount = fs.readdirSync(uploadsDir).length;
      }

      const all = await getAllDetainees();

      res.json({
        success: true,
        dbType: 'SQLite 3 (Standard .db format)',
        dbFile: 'detainees.db',
        dbPath,
        fileSizeBytes: fileSize,
        fileSizeFormatted: `${(fileSize / 1024).toFixed(1)} KB`,
        totalRecords: all.length,
        totalPhotosOnDisk: photoCount,
      });
    } catch (err) {
      console.error('Error getting DB info:', err);
      res.status(500).json({ success: false, error: 'فشل استرجاع معلومات قاعدة البيانات' });
    }
  });

  /**
   * POST /api/database/reset - Clears all records and starts fresh
   */
  app.post('/api/database/reset', async (_req, res) => {
    try {
      await resetDatabase();
      res.json({ success: true, message: 'تم تصفير قاعدة بيانات SQLite وحذف كافة السجلات والصور بنجاح' });
    } catch (err) {
      console.error('Error resetting database:', err);
      res.status(500).json({ success: false, error: 'فشل تصفير قاعدة البيانات' });
    }
  });

  /**
   * POST /api/database/import-json - Batch import JSON records into SQLite
   */
  app.post('/api/database/import-json', async (req, res) => {
    try {
      const records = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ success: false, error: 'يجب أن تكون البيانات مصفوفة سجلات' });
      }

      const imported = await batchImportDetainees(records);
      res.json({ success: true, count: imported, message: `تم استيراد ${imported} سجل إلى قاعدة بيانات SQLite بنجاح` });
    } catch (err) {
      console.error('Error importing batch into SQLite:', err);
      res.status(500).json({ success: false, error: 'فشل استيراد السجلات إلى SQLite' });
    }
  });

  // Optional static frontend serving (used in Electron or production)
  if (options.staticDistDir) {
    const distPath = path.resolve(options.staticDistDir);
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return app;
}
