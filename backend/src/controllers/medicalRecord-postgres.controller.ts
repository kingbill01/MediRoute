import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const getPatientRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { patientId } = req.params;
  const roleStr = role as string;

  const isAdmin = roleStr === 'ADMIN';
  const isDoctor = roleStr === 'DOCTOR';
  const isOwnRecord = userId === patientId;

  if (!isAdmin && !isDoctor && !isOwnRecord) {
    throw new AppError('Accès non autorisé', 403);
  }

  const records = await prisma.medicalRecord.findMany({
    where: { patientId },
    include: { attachments: true },
    orderBy: { recordDate: 'desc' },
  });

  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    select: { firstName: true, lastName: true, patientInfo: true },
  });

  res.json({ success: true, data: records, patient, total: records.length });
});

export const createRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const roleStr = role as string;

  if (!['DOCTOR', 'ADMIN'].includes(roleStr)) {
    throw new AppError('Seuls les médecins peuvent créer des dossiers médicaux', 403);
  }

  const {
    patientId, appointmentId, recordType, diagnosis,
    symptoms, vitalSigns, notes, followUpRequired, followUpDate,
  } = req.body;

  if (!patientId || !recordType || !notes) {
    throw new AppError('Patient, type de dossier et notes requis', 400);
  }

  const record = await prisma.medicalRecord.create({
    data: {
      patientId,
      doctorId: userId,
      appointmentId: appointmentId || null,
      recordDate: new Date(),
      recordType,
      diagnosis: diagnosis || null,
      symptoms: Array.isArray(symptoms) ? symptoms.join(',') : (symptoms || null),
      vitalSigns: vitalSigns ? JSON.stringify(vitalSigns) : null,
      notes,
      followUpRequired: !!followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
    include: { attachments: true },
  });

  res.status(201).json({ success: true, message: 'Dossier médical créé', data: record });
});

export const getRecordById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const roleStr = role as string;

  const record = await prisma.medicalRecord.findUnique({
    where: { id: req.params.id },
    include: { attachments: true },
  });

  if (!record) throw new AppError('Dossier non trouvé', 404);

  const isOwner = record.patientId === userId || record.doctorId === userId;
  if (!isOwner && !['ADMIN'].includes(roleStr)) throw new AppError('Accès non autorisé', 403);

  res.json({ success: true, data: record });
});

export const updateRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const roleStr = role as string;

  const record = await prisma.medicalRecord.findUnique({ where: { id: req.params.id } });
  if (!record) throw new AppError('Dossier non trouvé', 404);

  if (record.doctorId !== userId && roleStr !== 'ADMIN') {
    throw new AppError('Seul le médecin auteur peut modifier ce dossier', 403);
  }

  const { diagnosis, symptoms, vitalSigns, notes, followUpRequired, followUpDate } = req.body;

  const updated = await prisma.medicalRecord.update({
    where: { id: req.params.id },
    data: {
      ...(diagnosis !== undefined && { diagnosis }),
      ...(symptoms !== undefined && { symptoms: Array.isArray(symptoms) ? symptoms.join(',') : symptoms }),
      ...(vitalSigns !== undefined && { vitalSigns: JSON.stringify(vitalSigns) }),
      ...(notes !== undefined && { notes }),
      ...(followUpRequired !== undefined && { followUpRequired }),
      ...(followUpDate !== undefined && { followUpDate: new Date(followUpDate) }),
    },
    include: { attachments: true },
  });

  res.json({ success: true, message: 'Dossier mis à jour', data: updated });
});

export const getDoctorPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const roleStr = role as string;

  if (!['DOCTOR', 'ADMIN'].includes(roleStr)) throw new AppError('Accès non autorisé', 403);

  const doctorId = roleStr === 'ADMIN' && req.query.doctorId
    ? (req.query.doctorId as string)
    : userId;

  const records = await prisma.medicalRecord.findMany({
    where: { doctorId },
    select: { patientId: true },
    distinct: ['patientId'],
  });

  const patientIds = records.map((r) => r.patientId);

  const patients = await prisma.user.findMany({
    where: { id: { in: patientIds } },
    include: {
      patientInfo: true,
      _count: {
        select: {
          appointmentsAsPatient: true,
          medicalRecords: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: patients.map((p) => ({
      userId: p.id,
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      city: p.city,
      region: p.region,
      patientInfo: p.patientInfo,
      stats: p._count,
    })),
    total: patients.length,
  });
});
