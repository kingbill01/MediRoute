import express from 'express';
import { getHospitalBeds, updateBedStatus, createBed } from '../controllers/bedManagement.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);
router.get('/hospital/:hospitalId', getHospitalBeds);
router.post('/', createBed);
router.put('/:id', updateBedStatus);
export default router;
