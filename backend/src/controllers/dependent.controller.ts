import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ── Calcule l'âge en années ───────────────────────────────────────────────────
const calcAge = (dob: Date): number => {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

// ── GET /api/dependents ───────────────────────────────────────────────────────
export const getDependents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;

  const dependents = await prisma.dependent.findMany({
    where: { patientId: userId },
    include: { medicalRecords: { orderBy: { recordDate: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'asc' },
  });

  const enriched = dependents.map(d => ({
    ...d,
    age: calcAge(d.dateOfBirth),
    lastVisit: d.medicalRecords[0]?.recordDate ?? null,
  }));

  res.json({ success: true, data: enriched });
});

// ── GET /api/dependents/:id ───────────────────────────────────────────────────
export const getDependentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { id } = req.params;

  const dep = await prisma.dependent.findFirst({
    where: { id, patientId: userId },
    include: {
      medicalRecords: { orderBy: { recordDate: 'desc' } },
    },
  });

  if (!dep) throw new AppError('Dépendant introuvable', 404);
  res.json({ success: true, data: { ...dep, age: calcAge(dep.dateOfBirth) } });
});

// ── POST /api/dependents ──────────────────────────────────────────────────────
export const createDependent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const {
    firstName, lastName, dateOfBirth, gender, relationship = 'CHILD',
    bloodGroup, allergies, chronicConditions, notes,
  } = req.body;

  if (!firstName || !lastName || !dateOfBirth) {
    throw new AppError('Prénom, nom et date de naissance requis', 400);
  }

  const dob = new Date(dateOfBirth);
  const age = calcAge(dob);

  if (age < 0 || age > 15) {
    throw new AppError('Le dépendant doit avoir entre 0 et 15 ans', 400);
  }

  const dep = await prisma.dependent.create({
    data: {
      patientId: userId,
      firstName, lastName,
      dateOfBirth: dob,
      gender: gender?.toUpperCase(),
      relationship,
      bloodGroup,
      allergies,
      chronicConditions,
      notes,
    },
  });

  res.status(201).json({ success: true, data: { ...dep, age } });
});

// ── PUT /api/dependents/:id ───────────────────────────────────────────────────
export const updateDependent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { id } = req.params;

  const existing = await prisma.dependent.findFirst({ where: { id, patientId: userId } });
  if (!existing) throw new AppError('Dépendant introuvable', 404);

  const {
    firstName, lastName, dateOfBirth, gender, relationship,
    bloodGroup, allergies, chronicConditions, notes,
  } = req.body;

  let dob = existing.dateOfBirth;
  if (dateOfBirth) {
    dob = new Date(dateOfBirth);
    const age = calcAge(dob);
    if (age < 0 || age > 15) throw new AppError('Le dépendant doit avoir entre 0 et 15 ans', 400);
  }

  const dep = await prisma.dependent.update({
    where: { id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(dateOfBirth && { dateOfBirth: dob }),
      ...(gender && { gender: gender.toUpperCase() }),
      ...(relationship && { relationship }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(allergies !== undefined && { allergies }),
      ...(chronicConditions !== undefined && { chronicConditions }),
      ...(notes !== undefined && { notes }),
    },
  });

  res.json({ success: true, data: { ...dep, age: calcAge(dep.dateOfBirth) } });
});

// ── DELETE /api/dependents/:id ────────────────────────────────────────────────
export const deleteDependent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { id } = req.params;

  const existing = await prisma.dependent.findFirst({ where: { id, patientId: userId } });
  if (!existing) throw new AppError('Dépendant introuvable', 404);

  await prisma.dependent.delete({ where: { id } });
  res.json({ success: true, message: 'Dépendant supprimé' });
});

// ── GET /api/dependents/:id/records ──────────────────────────────────────────
export const getDependentRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { id } = req.params;

  const dep = await prisma.dependent.findFirst({ where: { id, patientId: userId } });
  if (!dep) throw new AppError('Dépendant introuvable', 404);

  const records = await prisma.dependentMedicalRecord.findMany({
    where: { dependentId: id },
    orderBy: { recordDate: 'desc' },
  });

  res.json({ success: true, data: records });
});

// ── POST /api/dependents/:id/records ─────────────────────────────────────────
export const createDependentRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { id } = req.params;
  const {
    recordDate, recordType, diagnosis, symptoms, notes,
    weight, height, temperature, followUpRequired, followUpDate,
    vitalSigns,
  } = req.body;

  if (!notes || !recordType || !recordDate) {
    throw new AppError('Notes, type et date du dossier requis', 400);
  }

  const dep = await prisma.dependent.findFirst({ where: { id, patientId: userId } });
  if (!dep) throw new AppError('Dépendant introuvable', 404);

  const record = await prisma.dependentMedicalRecord.create({
    data: {
      dependentId: id,
      doctorId: userId,
      recordDate: new Date(recordDate),
      recordType,
      diagnosis,
      symptoms,
      notes,
      vitalSigns: vitalSigns ? JSON.stringify(vitalSigns) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      followUpRequired: !!followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
  });

  res.status(201).json({ success: true, data: record });
});

// ── DELETE /api/dependents/:id/records/:recordId ──────────────────────────────
export const deleteDependentRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { id, recordId } = req.params;

  const dep = await prisma.dependent.findFirst({ where: { id, patientId: userId } });
  if (!dep) throw new AppError('Dépendant introuvable', 404);

  await prisma.dependentMedicalRecord.deleteMany({ where: { id: recordId, dependentId: id } });
  res.json({ success: true, message: 'Dossier supprimé' });
});
