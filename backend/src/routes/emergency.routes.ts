import express from 'express';
import {
  getEmergencyForm,
  submitEmergencyRequest,
  getNearbyHospitals,
  getEmergencyHistory,
  updateEmergencyStatus,
} from '../controllers/emergency.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.get('/form', getEmergencyForm);
router.get('/hospitals/nearby', getNearbyHospitals);

// Routes protégées
router.post('/request', submitEmergencyRequest); // Peut être utilisé avec ou sans auth
router.get('/history', authenticate, getEmergencyHistory);
router.put('/:requestId/status', authenticate, updateEmergencyStatus);

export default router;
