import express from 'express';
import {
  getStats,
  getAllDoctors,
  approveDoctorVerification,
  affiliateDoctorToHospital,
  removeAffiliation,
  getAllPatients,
  getPatientDetails,
  updateUserStatus,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN' as any), apiLimiter);

router.get('/stats', getStats);

router.get('/doctors', getAllDoctors);
router.put('/doctors/:doctorId/verify', approveDoctorVerification);
router.post('/doctors/:doctorId/hospitals', affiliateDoctorToHospital);
router.delete('/doctors/:doctorId/hospitals/:hospitalId', removeAffiliation);

router.get('/patients', getAllPatients);
router.get('/patients/:patientId', getPatientDetails);

router.put('/users/:userId/status', updateUserStatus);

export default router;
