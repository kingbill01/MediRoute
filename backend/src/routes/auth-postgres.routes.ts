import express from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/auth-postgres.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate, registerRules, loginRules } from '../middleware/validate';

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;
