import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = Router();

router.use(optionalAuth);

// Accepts multipart/form-data with 'file' field OR application/json with 'image' (base64)
router.post('/', upload.single('file'), uploadImage);

export default router;

