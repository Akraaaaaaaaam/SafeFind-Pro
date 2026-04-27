import { Router } from 'express';
import { createReport, getReportById } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/:id', requireAuth, getReportById);
router.post('/', requireAuth, upload.single('photo'), createReport);

export default router;