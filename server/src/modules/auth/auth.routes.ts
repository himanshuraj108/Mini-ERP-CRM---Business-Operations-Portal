import { Router } from 'express';
import { login, refresh, logout, getMe } from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { loginSchema } from './auth.schema';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
