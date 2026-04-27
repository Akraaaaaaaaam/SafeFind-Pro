import { Router } from 'express';
import {
  createAlert,
  getAlertById,
  getAlerts,
  resolveAlert,
  updateAlert,
} from '../controllers/alertController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', requireAuth, getAlerts);
router.get('/:id', requireAuth, getAlertById);
router.post('/', requireAuth, upload.single('photo'), createAlert);
router.put('/:id', requireAuth, upload.single('photo'), updateAlert);
router.post('/:id/resolve', requireAuth, resolveAlert);

export default router;