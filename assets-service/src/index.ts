import express from 'express';
import multer from 'multer';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import B2 from 'backblaze-b2';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize B2
const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || '',
  applicationKey: process.env.B2_APPLICATION_KEY || ''
});

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Authenticate with B2
    await b2.authorize();

    // Get upload URL
    const { data: { uploadUrl, authorizationToken } } = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID || ''
    });

    // Detect file type
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    if (!fileType) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalExt = path.extname(req.file.originalname);
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${originalExt}`;

    // Upload file to B2
    const { data } = await b2.uploadFile({
      uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: filename,
      data: req.file.buffer,
      contentType: fileType.mime
    });

    res.json({
      success: true,
      url: `${process.env.B2_FILE_URL}/${filename}`,
      fileId: data.fileId
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete file endpoint
app.delete('/files/:fileId', async (req, res) => {
  try {
    await b2.authorize();
    await b2.deleteFileVersion({
      fileId: req.params.fileId,
      fileName: req.query.fileName as string
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Assets service running on port ${PORT}`);
});