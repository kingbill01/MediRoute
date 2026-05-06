import express from 'express';
import { createVitalSigns, getPatientVitals } from '../controllers/vitalSigns.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);
router.post('/', createVitalSigns);
router.get('/patient/:patientId', getPatientVitals);
export default router;
