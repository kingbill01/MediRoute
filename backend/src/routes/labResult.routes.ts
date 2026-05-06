import express from 'express';
import { createLabResult, getPatientLabResults, updateLabResult } from '../controllers/labResult.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);
router.post('/', createLabResult);
router.get('/patient/:patientId', getPatientLabResults);
router.put('/:id', updateLabResult);
export default router;
