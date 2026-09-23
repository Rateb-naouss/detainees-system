import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDB,
  DB_PATH,
  UPLOADS_DIR,
  getAllDetainees,
  saveDetaineeRecord,
  deleteDetaineeRecord,
  resetDatabase,
  batchImportDetainees,
  persistDB,
  DetaineeRecord,
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize SQLite database
  await initDB();

  // Middleware with high body limits for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static directory for optimized photo uploads
  app.use('/uploads/photos', express.static(UPLOADS_DIR));

  // ======================== API ROUTES ========================

  /**
   * GET /api/detainees - Retrieve all detainees from SQLite
   */
  app.get('/api/detainees', async (req, res) => {
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
  app.get('/api/database/download', (req, res) => {
    try {
      persistDB();
      if (!fs.existsSync(DB_PATH)) {
        return res.status(404).json({ success: false, error: 'ملف قاعدة البيانات غير موجود' });
      }

      const filename = `detainees_${new Date().toISOString().slice(0, 10)}.db`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/x-sqlite3');
      const fileStream = fs.createReadStream(DB_PATH);
      fileStream.pipe(res);
    } catch (err) {
      console.error('Error downloading SQLite DB:', err);
      res.status(500).json({ success: false, error: 'فشل تنزيل ملف قاعدة البيانات' });
    }
  });

  /**
   * GET /api/database/info - Database status & file size info
   */
  app.get('/api/database/info', async (req, res) => {
    try {
      persistDB();
      let fileSize = 0;
      if (fs.existsSync(DB_PATH)) {
        const stats = fs.statSync(DB_PATH);
        fileSize = stats.size;
      }

      let photoCount = 0;
      if (fs.existsSync(UPLOADS_DIR)) {
        photoCount = fs.readdirSync(UPLOADS_DIR).length;
      }

      const all = await getAllDetainees();

      res.json({
        success: true,
        dbType: 'SQLite 3 (Standard .db format)',
        dbFile: 'detainees.db',
        dbPath: DB_PATH,
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
  app.post('/api/database/reset', async (req, res) => {
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

  // ======================== FRONTEND VITE INTEGRATION ========================

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Dev Mode: Mount Vite as middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Prod Mode: Serve compiled dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ISF Detainees System] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[SQLite] Database stored at: ${DB_PATH}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
