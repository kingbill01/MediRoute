import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  registerFacility, getMyFacility, updateMyFacility,
  getFacilityTypes, updateFacilityStatus, getPendingFacilities,
} from '../controllers/facility-registration.controller';

const router = Router();

// Routes publiques (pas d'auth)
router.get('/types', getFacilityTypes);
router.post('/register', registerFacility);

// Routes authentifiées
router.use(authenticate);

// HOSPITAL_ADMIN
router.get('/my-facility', getMyFacility);
router.put('/my-facility', updateMyFacility);

// ADMIN (vérification dans le controller)
router.get('/pending', getPendingFacilities);
router.put('/:id/status', updateFacilityStatus);

export default router;
