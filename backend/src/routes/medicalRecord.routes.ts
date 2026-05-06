import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Placeholder pour les dossiers médicaux
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Routes dossiers médicaux (à implémenter)' });
});

export default router;
