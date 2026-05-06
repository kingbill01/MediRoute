import express from 'express';
import {
  getPatientRecords,
  createRecord,
  getRecordById,
  updateRecord,
  getDoctorPatients,
} from '../controllers/medicalRecord-postgres.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/my-patients', getDoctorPatients);
router.get('/patient/:patientId', getPatientRecords);
router.get('/:id', getRecordById);
router.post('/', createRecord);
router.put('/:id', updateRecord);

export default router;
