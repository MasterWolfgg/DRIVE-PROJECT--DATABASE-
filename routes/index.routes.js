const express = require('express');
const router = express.Router();

const upload          = require('../config/multer.config');
const fileModel       = require('../models/files.models');
const authMiddleware  = require('../middlewares/authe');

const { getStorage }  = require('firebase-admin/storage');   // << same admin SDK

/* ───────────────────────── ROOT PAGE ───────────────────────── */
router.get('/', (req, res) => {
  res.render('index');
});

/* ───────────────────────── HOME PAGE (SELF‑HEALING) ───────────────────────── */
router.get('/home', authMiddleware, async (req, res) => {
  try {
    const bucket = getStorage().bucket();

    // 1️⃣  Fetch all DB file records belonging to the user
    const dbFiles = await fileModel.find({ user: req.user.userId });

    const validFiles = [];

    // 2️⃣  Verify each record still exists in Firebase Storage
    for (const f of dbFiles) {
      const [exists] = await bucket.file(f.path).exists();

      if (exists) {
        validFiles.push(f);        // keep if present
      } else {
        await fileModel.deleteOne({ _id: f._id });  // remove stale DB row
        console.warn(`🗑️ Removed stale DB entry: ${f.originalname}`);
      }
    }

    // 3️⃣  Render home with only valid files
    res.render('home', { files: validFiles });
  } catch (err) {
    console.error('Error in /home:', err);
    res.status(500).send('Server error loading home page.');
  }
});

/* ───────────────────────── FILE UPLOAD ───────────────────────── */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const newFile = await fileModel.create({
      path:         req.file.path,
      originalname: req.file.originalname,
      user:         req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully!',
      file:    { name: newFile.originalname, path: newFile.path }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

/* ───────────────────────── FILE DOWNLOAD ───────────────────────── */
router.get('/download/:path', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const path   = req.params.path;

  const fileDoc = await fileModel.findOne({ user: userId, path });

  if (!fileDoc) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const bucket      = getStorage().bucket();
  const firebaseFile = bucket.file(path);

  const [exists] = await firebaseFile.exists();

  if (!exists) {
    // Remove missing file from DB and notify user
    await fileModel.deleteOne({ _id: fileDoc._id });
    return res.status(404).send(`
      <html>
        <body style="font-family:sans-serif; padding:2rem; text-align:center;">
          <h2>⚠️ File not found in storage</h2>
          <p>The file might have been deleted or expired. It has been removed from your account.</p>
          <a href="/home" style="display:inline-block;margin-top:1rem;padding:0.5rem 1rem;background:#007bff;color:#fff;border-radius:5px;text-decoration:none;">Go Back</a>
        </body>
      </html>
    `);
  }

  // Stream file to browser with download headers
  const [metadata] = await firebaseFile.getMetadata();
  res.setHeader('Content-Type',        metadata.contentType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.originalname}"`);

  firebaseFile.createReadStream()
    .on('error', err => {
      console.error('Stream error:', err);
      res.status(500).send('Error downloading file.');
    })
    .pipe(res);
});

/* ───────────────────────── LOG‑OUT ───────────────────────── */
router.get('/logout', (req, res) => {
  // destroy session or token on real app
  res.render('index');
});

/* ───────────────────────── EXPORT ───────────────────────── */
module.exports = router;
