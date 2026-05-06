import { Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appointmentId } = req.body;
  if (!appointmentId) throw new AppError('appointmentId requis', 400);

  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new AppError('Rendez-vous non trouvé', 404);
  if (appt.type !== 'TELECONSULTATION') throw new AppError("Ce rendez-vous n'est pas une téléconsultation", 400);

  const roomId = randomUUID();
  const baseUrl = process.env.TELEMEDICINE_BASE_URL || 'https://meet.mediroute.sn';

  const session = await prisma.telemedicineSession.create({
    data: {
      appointmentId,
      roomId,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      scheduledAt: new Date(`${appt.appointmentDate.toISOString().split('T')[0]}T${appt.appointmentTime}:00`),
      joinUrlPatient: `${baseUrl}/room/${roomId}?role=patient`,
      joinUrlDoctor: `${baseUrl}/room/${roomId}?role=doctor`,
    },
  });

  res.status(201).json({ success: true, data: session });
});

export const getSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appointmentId } = req.params;
  const session = await prisma.telemedicineSession.findUnique({ where: { appointmentId } });
  if (!session) throw new AppError('Session non trouvée', 404);
  res.json({ success: true, data: session });
});

export const endSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { summary } = req.body;

  const session = await prisma.telemedicineSession.update({
    where: { id },
    data: { status: 'COMPLETED', endedAt: new Date(), summary },
  });

  res.json({ success: true, data: session });
});
