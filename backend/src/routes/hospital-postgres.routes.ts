import express from 'express';
import {
  getAllHospitals,
  getHospitalById,
  searchHospitals,
  getRegions,
  createHospital,
  updateHospital,
  updateEmergencyCapacity,
} from '../controllers/hospital-postgres.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.get('/', getAllHospitals);
router.get('/regions', getRegions);
router.get('/search', searchHospitals);
router.get('/:id', getHospitalById);

// Routes protégées (admin / hospital_admin)
router.post('/', authenticate, createHospital);
router.put('/:id', authenticate, updateHospital);
router.put('/:id/emergency-capacity', authenticate, updateEmergencyCapacity);

export default router;
