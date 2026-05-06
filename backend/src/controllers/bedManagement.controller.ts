import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const getHospitalBeds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hospitalId } = req.params;
  const { ward, status } = req.query;

  const beds = await prisma.hospitalBed.findMany({
    where: {
      hospitalId,
      ...(ward && { ward: ward as string }),
      ...(status && { status: status as string }),
    },
    orderBy: [{ ward: 'asc' }, { bedNumber: 'asc' }],
  });

  // Stats per ward
  const allBeds = await prisma.hospitalBed.findMany({ where: { hospitalId } });
  const wardStats = allBeds.reduce((acc: any, b) => {
    if (!acc[b.ward]) acc[b.ward] = { total: 0, available: 0, occupied: 0, maintenance: 0 };
    acc[b.ward].total++;
    const key = b.status.toLowerCase();
    if (acc[b.ward][key] !== undefined) acc[b.ward][key]++;
    return acc;
  }, {});

  res.json({ success: true, data: beds, stats: wardStats });
});

export const updateBedStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { id } = req.params;
  const { status, patientName, admittedAt, expectedDischarge, notes } = req.body;

  const bed = await prisma.hospitalBed.update({
    where: { id },
    data: {
      status,
      patientName: status === 'OCCUPIED' ? patientName : null,
      admittedAt: status === 'OCCUPIED' ? (admittedAt ? new Date(admittedAt) : new Date()) : null,
      expectedDischarge: expectedDischarge ? new Date(expectedDischarge) : null,
      notes,
    },
  });

  // Update hospital's availableBeds count
  const available = await prisma.hospitalBed.count({ where: { hospitalId: bed.hospitalId, status: 'AVAILABLE' } });
  await prisma.hospital.update({ where: { id: bed.hospitalId }, data: { availableBeds: available } });

  res.json({ success: true, data: bed });
});

export const createBed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { hospitalId, bedNumber, ward, bedType } = req.body;
  if (!hospitalId || !bedNumber || !ward) throw new AppError('Champs requis manquants', 400);

  const bed = await prisma.hospitalBed.create({
    data: { hospitalId, bedNumber, ward, bedType: bedType || 'STANDARD' },
  });

  res.status(201).json({ success: true, data: bed });
});
