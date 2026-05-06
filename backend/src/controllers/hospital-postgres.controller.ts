import { Request, Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const getAllHospitals = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50', region, type } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (region) where.region = region;
  if (type) where.type = type;

  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({ where, skip, take: parseInt(limit as string), orderBy: { name: 'asc' } }),
    prisma.hospital.count({ where }),
  ]);

  // Statistiques de lits en temps réel depuis HospitalBed
  const bedStats = await prisma.hospitalBed.groupBy({
    by: ['hospitalId', 'status'],
    where: { hospitalId: { in: hospitals.map(h => h.id) } },
    _count: { _all: true },
  });

  const bedMap: Record<string, any> = {};
  for (const s of bedStats) {
    if (!bedMap[s.hospitalId]) bedMap[s.hospitalId] = { total: 0, available: 0, occupied: 0, maintenance: 0, reserved: 0 };
    bedMap[s.hospitalId].total += s._count._all;
    bedMap[s.hospitalId][s.status.toLowerCase()] = s._count._all;
  }

  const enriched = hospitals.map(h => ({
    ...h,
    liveBedStats: bedMap[h.id] ?? null,
    occupancyRate: bedMap[h.id]?.total
      ? Math.round((bedMap[h.id].occupied / bedMap[h.id].total) * 100)
      : (h.totalBeds ? Math.round(((h.totalBeds - h.availableBeds) / h.totalBeds) * 100) : null),
  }));

  res.json({ success: true, data: enriched, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
});

export const getHospitalById = asyncHandler(async (req: Request, res: Response) => {
  const hospital = await prisma.hospital.findUnique({ where: { id: req.params.id } });
  if (!hospital) throw new AppError('Hôpital non trouvé', 404);
  res.json({ success: true, data: hospital });
});

export const searchHospitals = asyncHandler(async (req: Request, res: Response) => {
  const { region, type, service, emergency } = req.query;

  const where: any = {};
  if (region) where.region = { contains: region as string };
  if (type) where.type = type;
  if (emergency === 'true') where.canAcceptEmergency = true;
  if (service) where.services = { contains: service as string };

  const hospitals = await prisma.hospital.findMany({
    where,
    orderBy: [{ canAcceptEmergency: 'desc' }, { rating: 'desc' }],
  });

  res.json({ success: true, data: hospitals, total: hospitals.length });
});

export const getRegions = asyncHandler(async (req: Request, res: Response) => {
  const regions = await prisma.hospital.findMany({
    select: { region: true },
    distinct: ['region'],
    orderBy: { region: 'asc' },
  });
  res.json({ success: true, data: regions.map((r) => r.region) });
});

export const createHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
    throw new AppError('Accès non autorisé', 403);
  }

  const hospital = await prisma.hospital.create({ data: req.body });
  res.status(201).json({ success: true, message: 'Hôpital créé', data: hospital });
});

export const updateHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
    throw new AppError('Accès non autorisé', 403);
  }

  const existing = await prisma.hospital.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Hôpital non trouvé', 404);

  const hospital = await prisma.hospital.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, message: 'Hôpital mis à jour', data: hospital });
});

export const updateEmergencyCapacity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
    throw new AppError('Accès non autorisé', 403);
  }

  const { availableBeds, canAcceptEmergency, waitingTime, ambulanceAvailable } = req.body;

  const hospital = await prisma.hospital.update({
    where: { id: req.params.id },
    data: {
      ...(availableBeds !== undefined && { availableBeds }),
      ...(canAcceptEmergency !== undefined && { canAcceptEmergency }),
      ...(waitingTime !== undefined && { waitingTime }),
      ...(ambulanceAvailable !== undefined && { ambulanceAvailable }),
      capacityUpdatedAt: new Date(),
    },
  });

  res.json({ success: true, message: 'Capacité mise à jour', data: hospital });
});
