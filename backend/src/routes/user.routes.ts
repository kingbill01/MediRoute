import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Placeholder pour les routes utilisateurs
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Routes utilisateurs (à implémenter)' });
});

export default router;
