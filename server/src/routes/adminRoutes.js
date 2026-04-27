import { Router } from 'express';
import { getDashboard, reviewAlert } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', requireAuth, requireRole('ADMIN', 'MODERATOR'), getDashboard);
router.post('/alerts/:id/review', requireAuth, requireRole('ADMIN', 'MODERATOR'), reviewAlert);

export default router;