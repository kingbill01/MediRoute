import express from 'express';
import {
  getEmergencyForm,
  getNearbyHospitals,
  submitEmergencyRequest,
  getEmergencyHistory,
  updateEmergencyStatus,
} from '../controllers/emergency-postgres.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.get('/form', getEmergencyForm);
router.get('/hospitals/nearby', getNearbyHospitals);

// Routes semi-publiques / protégées
router.post('/request', submitEmergencyRequest);
router.get('/history', authenticate, getEmergencyHistory);
router.put('/:requestId/status', authenticate, updateEmergencyStatus);

export default router;
