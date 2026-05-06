import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDependents, getDependentById, createDependent,
  updateDependent, deleteDependent,
  getDependentRecords, createDependentRecord, deleteDependentRecord,
} from '../controllers/dependent.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('PATIENT'));

router.get('/',    getDependents);
router.post('/',   createDependent);
router.get('/:id',    getDependentById);
router.put('/:id',    updateDependent);
router.delete('/:id', deleteDependent);

router.get('/:id/records',    getDependentRecords);
router.post('/:id/records',   createDependentRecord);
router.delete('/:id/records/:recordId', deleteDependentRecord);

export default router;
