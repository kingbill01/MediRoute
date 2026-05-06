import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map(e => ({ field: e.type === 'field' ? (e as any).path : e.type, message: e.msg })),
    });
    return;
  }
  next();
};

export const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 }).withMessage('Mot de passe : 8 caractères minimum')
    .matches(/[A-Z]/).withMessage('Mot de passe : au moins une majuscule')
    .matches(/[0-9]/).withMessage('Mot de passe : au moins un chiffre'),
  body('role').isIn(['PATIENT', 'DOCTOR']).withMessage('Rôle invalide'),
  body('profile.firstName').trim().notEmpty().withMessage('Prénom requis').isLength({ max: 100 }),
  body('profile.lastName').trim().notEmpty().withMessage('Nom requis').isLength({ max: 100 }),
  body('profile.phone').trim().notEmpty().withMessage('Téléphone requis'),
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

export const appointmentRules = [
  body('doctorId').isUUID().withMessage('Médecin invalide'),
  body('appointmentDate').isISO8601().withMessage('Date invalide'),
  body('appointmentTime').matches(/^\d{2}:\d{2}$/).withMessage('Heure invalide (HH:MM)'),
  body('reason').trim().notEmpty().withMessage('Motif requis').isLength({ max: 500 }),
  body('type').isIn(['CONSULTATION', 'FOLLOW_UP', 'ROUTINE_CHECKUP']).withMessage('Type invalide'),
];
