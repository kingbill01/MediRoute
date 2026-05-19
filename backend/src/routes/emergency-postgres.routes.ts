import express from 'express';
import {
  getEmergencyForm,
  getNearbyHospitals,
  submitEmergencyRequest,
  submitQuickEmergencyRequest,
  getActiveEmergencyCount,
  getEmergencyHistory,
  updateEmergencyStatus,
} from '../controllers/emergency-postgres.controller';
import { authenticate } from '../middleware/auth';
import { requireSubscription } from '../controllers/subscription.controller';

const router = express.Router();

// Routes publiques
router.get('/form', getEmergencyForm);
router.get('/hospitals/nearby', getNearbyHospitals);

// Routes semi-publiques / protégées
router.post('/request', submitEmergencyRequest);
router.get('/history', authenticate, getEmergencyHistory);
router.put('/:requestId/status', authenticate, updateEmergencyStatus);

// Routes prioritaires pour patients souscrits (limite 4 urgences actives)
router.get('/active-count', authenticate, requireSubscription, getActiveEmergencyCount);
router.post('/quick', authenticate, requireSubscription, submitQuickEmergencyRequest);

export default router;
