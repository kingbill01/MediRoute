import express from 'express';
import {
  getPatientAppointments,
  getDoctorAppointments,
  getAllAppointments,
  getDoctorAvailability,
  getApprovedDoctors,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from '../controllers/appointment-postgres.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Admin — tous les rendez-vous
router.get('/all', authenticate, getAllAppointments);

// Patient
router.get('/patient', authenticate, getPatientAppointments);

// Doctor
router.get('/doctor', authenticate, getDoctorAppointments);

// Liste des médecins approuvés (pour la prise de RDV)
router.get('/doctors/approved', authenticate, getApprovedDoctors);

// Disponibilité d'un médecin (public)
router.get('/doctor/:doctorId/availability', getDoctorAvailability);

// Créer, modifier, annuler
router.post('/', authenticate, createAppointment);
router.put('/:id', authenticate, updateAppointment);
router.delete('/:id', authenticate, cancelAppointment);

export default router;
