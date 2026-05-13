import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMyFacility, updateMyFacility,
  getFacilityTypes, updateFacilityStatus, getPendingFacilities,
  assignManager, removeManager, listManagers, searchUsersForManager,
} from '../controllers/facility-registration.controller';

const router = Router();

// Routes publiques (pas d'auth) — uniquement la liste des types
router.get('/types', getFacilityTypes);
// NOTE: l'inscription publique /register a été supprimée.
// Seuls les ADMIN peuvent créer un établissement et désigner ses gestionnaires.

// Routes authentifiées
router.use(authenticate);

// HOSPITAL_ADMIN (sa propre structure)
router.get('/my-facility', getMyFacility);
router.put('/my-facility', updateMyFacility);

// ADMIN — gestion des établissements et des gestionnaires
router.get('/pending',                  getPendingFacilities);
router.put('/:id/status',               updateFacilityStatus);
router.get('/:id/managers',             listManagers);
router.post('/:id/managers',            assignManager);
router.delete('/:id/managers/:userId',  removeManager);
router.get('/search-users',             searchUsersForManager);

export default router;
