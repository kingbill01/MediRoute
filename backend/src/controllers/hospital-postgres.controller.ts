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

const FACILITY_TYPES = [
  'HOPITAL_PUBLIC', 'HOPITAL_PRIVE', 'CLINIQUE',
  'CENTRE_DE_SANTE', 'DISTRICT_SANITAIRE', 'POSTE_DE_SANTE',
  // Legacy values
  'PUBLIC', 'PRIVATE', 'CLINIC', 'HEALTH_CENTER',
];

const normalizeArrayField = (val: any): string | undefined => {
  if (val === undefined) return undefined;
  return Array.isArray(val) ? val.join(',') : String(val);
};

export const createHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
    throw new AppError('Accès non autorisé', 403);
  }

  const b = req.body;
  if (!b.name || !b.type || !b.region || !b.city || !b.address || !b.phone || !b.emergencyPhone) {
    throw new AppError('Champs obligatoires manquants', 400);
  }
  if (!FACILITY_TYPES.includes(b.type)) {
    throw new AppError(`Type invalide. Valeurs : ${FACILITY_TYPES.slice(0, 6).join(', ')}`, 400);
  }

  const hospital = await prisma.hospital.create({
    data: {
      name: b.name, type: b.type, region: b.region, city: b.city, address: b.address,
      phone: b.phone, emergencyPhone: b.emergencyPhone,
      email: b.email, website: b.website, description: b.description,
      latitude: b.latitude ?? 0, longitude: b.longitude ?? 0,
      registrationNumber: b.registrationNumber, taxNumber: b.taxNumber,
      services:        normalizeArrayField(b.services)        ?? '',
      specializations: normalizeArrayField(b.specializations) ?? '',
      facilities:      normalizeArrayField(b.facilities)      ?? '',
      totalBeds: b.totalBeds ?? 0,
      availableBeds: b.availableBeds ?? b.totalBeds ?? 0,
      emergencyAvailable: b.emergencyAvailable ?? true,
      ambulanceAvailable: b.ambulanceAvailable ?? false,
      canAcceptEmergency: b.canAcceptEmergency ?? true,
      openingHours: JSON.stringify(b.openingHours ?? { mode: '24/7' }),
      registrationStatus: role === 'ADMIN' ? 'APPROVED' : 'PENDING',
      verified: role === 'ADMIN',
    },
  });
  res.status(201).json({ success: true, message: 'Établissement créé', data: hospital });
});

export const updateHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
    throw new AppError('Accès non autorisé', 403);
  }

  const existing = await prisma.hospital.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Hôpital non trouvé', 404);

  const b = req.body;
  if (b.type && !FACILITY_TYPES.includes(b.type)) {
    throw new AppError(`Type invalide`, 400);
  }

  // Normaliser les champs tableau si fournis
  const data: any = {};
  for (const key of ['name', 'type', 'region', 'city', 'address', 'phone', 'emergencyPhone',
                      'email', 'website', 'description', 'latitude', 'longitude',
                      'registrationNumber', 'taxNumber', 'totalBeds', 'availableBeds',
                      'ambulanceAvailable', 'canAcceptEmergency', 'emergencyAvailable',
                      'registrationStatus', 'verified', 'waitingTime']) {
    if (b[key] !== undefined) data[key] = b[key];
  }
  for (const key of ['services', 'specializations', 'facilities']) {
    if (b[key] !== undefined) data[key] = normalizeArrayField(b[key]);
  }
  if (b.openingHours !== undefined) {
    data.openingHours = typeof b.openingHours === 'string' ? b.openingHours : JSON.stringify(b.openingHours);
  }

  const hospital = await prisma.hospital.update({ where: { id: req.params.id }, data });
  res.json({ success: true, message: 'Hôpital mis à jour', data: hospital });
});

export const deleteHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (role !== 'ADMIN') {
    throw new AppError('Seul un administrateur peut supprimer un établissement', 403);
  }

  const existing = await prisma.hospital.findUnique({
    where: { id: req.params.id },
    include: { admins: true, beds: true, inventory: true, appointments: true },
  });
  if (!existing) throw new AppError('Hôpital non trouvé', 404);

  // Détacher les admins HOSPITAL_ADMIN (ne pas supprimer leur compte)
  if (existing.admins.length > 0) {
    await prisma.user.updateMany({
      where: { hospitalId: req.params.id },
      data: { hospitalId: null },
    });
  }

  await prisma.hospital.delete({ where: { id: req.params.id } });
  res.json({
    success: true,
    message: `Établissement supprimé (${existing.admins.length} admin(s) détaché(s), ${existing.beds.length} lit(s), ${existing.inventory.length} item(s) inventaire)`,
  });
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
