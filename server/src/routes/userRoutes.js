import { Router } from 'express';
import { me, updateMe } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me', requireAuth, me);
router.put('/me', requireAuth, updateMe);

export default router;