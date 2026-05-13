import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMyAffiliations, updateMyAffiliations,
  getApprovedHospitals, getDoctorsByHospital, getAvailableDoctors,
} from '../controllers/doctor-affiliations.controller';

const router = Router();

// Route publique : liste hôpitaux approuvés pour la sélection à l'inscription
router.get('/approved-hospitals', getApprovedHospitals);

// Routes authentifiées
router.use(authenticate);

// Médecin — gestion de ses propres affiliations
router.get('/my-affiliations', getMyAffiliations);
router.put('/my-affiliations', updateMyAffiliations);

// Patient/public — recherche de médecins
router.get('/hospital/:hospitalId/doctors', getDoctorsByHospital);
router.get('/available-doctors',            getAvailableDoctors);

export default router;
