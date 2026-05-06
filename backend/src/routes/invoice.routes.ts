import express from 'express';
import { createInvoice, getPatientInvoices, updateInvoiceStatus } from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);
router.post('/', createInvoice);
router.get('/patient/:patientId', getPatientInvoices);
router.put('/:id/status', updateInvoiceStatus);
export default router;
