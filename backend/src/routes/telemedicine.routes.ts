import express from 'express';
import { createSession, getSession, endSession } from '../controllers/telemedicine.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);
router.post('/', createSession);
router.get('/appointment/:appointmentId', getSession);
router.put('/:id/end', endSession);
export default router;
