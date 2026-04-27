import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/', requireAuth, getAnalytics);
export default router;
