import express from 'express';
import {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  updateEmergencyCapacity,
  searchHospitals,
  getRegions,
} from '../controllers/hospital.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Routes publiques
router.get('/', getAllHospitals);
router.get('/regions', getRegions);
router.get('/search', searchHospitals);
router.get('/:id', getHospitalById);

// Routes protégées (admin uniquement)
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), createHospital);
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), updateHospital);
router.put(
  '/:id/emergency-capacity',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  updateEmergencyCapacity
);

export default router;
