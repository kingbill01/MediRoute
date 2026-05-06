import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const createVitalSigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  if (!['DOCTOR', 'ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { patientId, appointmentId, ...vitals } = req.body;
  if (!patientId) throw new AppError('patientId requis', 400);

  const vs = await prisma.vitalSigns.create({
    data: { patientId, doctorId: userId, appointmentId, ...vitals },
  });

  res.status(201).json({ success: true, data: vs });
});

export const getPatientVitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { patientId } = req.params;

  if ((role as string) === 'PATIENT' && userId !== patientId) throw new AppError('Accès non autorisé', 403);

  const vitals = await prisma.vitalSigns.findMany({
    where: { patientId },
    orderBy: { recordedAt: 'desc' },
    take: 50,
  });

  res.json({ success: true, data: vitals });
});
