import express from 'express';
import {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getDoctorAvailability,
} from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Routes protégées
router.post('/', authenticate, authorize(UserRole.PATIENT), createAppointment);
router.get('/patient', authenticate, authorize(UserRole.PATIENT), getPatientAppointments);
router.get('/doctor', authenticate, authorize(UserRole.DOCTOR), getDoctorAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.put('/:id/status', authenticate, updateAppointmentStatus);
router.delete('/:id', authenticate, cancelAppointment);

// Obtenir la disponibilité d'un médecin
router.get('/doctor/:doctorId/availability', authenticate, getDoctorAvailability);

export default router;
