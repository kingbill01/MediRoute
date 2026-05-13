import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Types autorisés pour l'établissement
const FACILITY_TYPES = [
  'HOPITAL_PUBLIC',
  'HOPITAL_PRIVE',
  'CLINIQUE',
  'CENTRE_DE_SANTE',
  'DISTRICT_SANITAIRE',
  'POSTE_DE_SANTE',
];

const generateToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ userId, email, role }, secret, { expiresIn: '7d' });
};

// ── POST /api/facilities/register ─────────────────────────────────────────────
// Inscription publique : crée à la fois l'établissement et le compte admin
export const registerFacility = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { facility, admin } = req.body;

  // Validation des champs obligatoires
  if (!facility?.name || !facility?.type || !facility?.region || !facility?.city ||
      !facility?.address || !facility?.phone || !facility?.emergencyPhone) {
    throw new AppError('Informations établissement incomplètes (nom, type, région, ville, adresse, téléphones)', 400);
  }
  if (!admin?.email || !admin?.password || !admin?.firstName || !admin?.lastName || !admin?.phone) {
    throw new AppError('Informations administrateur incomplètes', 400);
  }
  if (!FACILITY_TYPES.includes(facility.type)) {
    throw new AppError(`Type invalide. Valeurs autorisées : ${FACILITY_TYPES.join(', ')}`, 400);
  }
  if (admin.password.length < 8) {
    throw new AppError('Le mot de passe doit faire au moins 8 caractères', 400);
  }

  // Vérifier que l'email admin n'est pas déjà utilisé
  const existing = await prisma.user.findUnique({ where: { email: admin.email } });
  if (existing) throw new AppError('Cet email est déjà utilisé', 400);

  // Vérifier que le numéro d'enregistrement n'est pas déjà pris
  if (facility.registrationNumber) {
    const existingFacility = await prisma.hospital.findUnique({
      where: { registrationNumber: facility.registrationNumber },
    });
    if (existingFacility) throw new AppError('Ce numéro d\'enregistrement est déjà utilisé', 400);
  }

  const hashedPassword = await bcrypt.hash(admin.password, 10);

  // Création atomique : Hospital + User (HOSPITAL_ADMIN) lié à l'établissement
  const result = await prisma.$transaction(async (tx) => {
    const hospital = await tx.hospital.create({
      data: {
        name:               facility.name,
        type:               facility.type,
        region:             facility.region,
        city:               facility.city,
        address:            facility.address,
        latitude:           facility.latitude  ?? 0,
        longitude:          facility.longitude ?? 0,
        phone:              facility.phone,
        emergencyPhone:     facility.emergencyPhone,
        email:              facility.email,
        website:            facility.website,
        description:        facility.description,
        registrationNumber: facility.registrationNumber,
        taxNumber:          facility.taxNumber,
        services:           Array.isArray(facility.services)        ? facility.services.join(',')        : (facility.services        ?? ''),
        specializations:    Array.isArray(facility.specializations) ? facility.specializations.join(',') : (facility.specializations ?? ''),
        facilities:         Array.isArray(facility.facilities)      ? facility.facilities.join(',')      : (facility.facilities      ?? ''),
        totalBeds:          facility.totalBeds ?? 0,
        availableBeds:      facility.availableBeds ?? facility.totalBeds ?? 0,
        emergencyAvailable: facility.emergencyAvailable ?? true,
        ambulanceAvailable: facility.ambulanceAvailable ?? false,
        canAcceptEmergency: facility.canAcceptEmergency ?? true,
        openingHours:       JSON.stringify(facility.openingHours ?? { mode: '24/7' }),
        registrationStatus: 'PENDING',  // L'admin du système doit approuver
        verified:           false,
      },
    });

    const user = await tx.user.create({
      data: {
        email:        admin.email,
        password:     hashedPassword,
        role:         'HOSPITAL_ADMIN',
        status:       'ACTIVE',
        firstName:    admin.firstName,
        lastName:     admin.lastName,
        phone:        admin.phone,
        city:         facility.city,
        region:       facility.region,
        country:      'Sénégal',
        hospitalId:   hospital.id,
      },
    });

    return { hospital, user };
  });

  const token = generateToken(result.user.id, result.user.email, result.user.role);

  res.status(201).json({
    success: true,
    message: 'Inscription réussie. En attente de validation par l\'administrateur.',
    data: {
      facility: {
        id:                 result.hospital.id,
        name:               result.hospital.name,
        type:               result.hospital.type,
        registrationStatus: result.hospital.registrationStatus,
      },
      user: {
        userId:    result.user.id,
        email:     result.user.email,
        role:      result.user.role,
        firstName: result.user.firstName,
        lastName:  result.user.lastName,
      },
      token,
    },
  });
});

// ── GET /api/facilities/my-facility ────────────────────────────────────────────
// HOSPITAL_ADMIN récupère sa propre structure
export const getMyFacility = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;

  if ((role as string) !== 'HOSPITAL_ADMIN') {
    throw new AppError('Accès réservé aux administrateurs d\'établissement', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { managedHospital: { include: { beds: true, inventory: true, doctorAffiliations: true } } },
  });

  if (!user?.managedHospital) throw new AppError('Aucun établissement lié à ce compte', 404);

  const h = user.managedHospital;
  res.json({
    success: true,
    data: {
      ...h,
      services:        h.services?.split(',').filter(Boolean) ?? [],
      specializations: h.specializations?.split(',').filter(Boolean) ?? [],
      facilities:      h.facilities?.split(',').filter(Boolean) ?? [],
      stats: {
        totalBeds:      h.beds.length || h.totalBeds,
        availableBeds:  h.beds.filter(b => b.status === 'AVAILABLE').length,
        occupiedBeds:   h.beds.filter(b => b.status === 'OCCUPIED').length,
        inventoryCount: h.inventory.length,
        affiliatedDoctors: h.doctorAffiliations.length,
      },
    },
  });
});

// ── PUT /api/facilities/my-facility ────────────────────────────────────────────
// HOSPITAL_ADMIN met à jour les infos de son établissement
export const updateMyFacility = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;

  if ((role as string) !== 'HOSPITAL_ADMIN') {
    throw new AppError('Accès réservé aux administrateurs d\'établissement', 403);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.hospitalId) throw new AppError('Aucun établissement lié', 404);

  const {
    name, phone, emergencyPhone, email, website, description, address,
    latitude, longitude, services, specializations, facilities,
    totalBeds, ambulanceAvailable, canAcceptEmergency,
  } = req.body;

  const updated = await prisma.hospital.update({
    where: { id: user.hospitalId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(emergencyPhone && { emergencyPhone }),
      ...(email !== undefined && { email }),
      ...(website !== undefined && { website }),
      ...(description !== undefined && { description }),
      ...(address && { address }),
      ...(latitude  !== undefined && { latitude  }),
      ...(longitude !== undefined && { longitude }),
      ...(services        && { services:        Array.isArray(services)        ? services.join(',')        : services }),
      ...(specializations && { specializations: Array.isArray(specializations) ? specializations.join(',') : specializations }),
      ...(facilities      && { facilities:      Array.isArray(facilities)      ? facilities.join(',')      : facilities }),
      ...(totalBeds !== undefined && { totalBeds }),
      ...(ambulanceAvailable !== undefined && { ambulanceAvailable }),
      ...(canAcceptEmergency !== undefined && { canAcceptEmergency }),
    },
  });

  res.json({ success: true, message: 'Établissement mis à jour', data: updated });
});

// ── GET /api/facilities/types ──────────────────────────────────────────────────
// Public : liste des types d'établissements supportés
export const getFacilityTypes = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: [
      { value: 'HOPITAL_PUBLIC',     label: 'Hôpital Public' },
      { value: 'HOPITAL_PRIVE',      label: 'Hôpital Privé' },
      { value: 'CLINIQUE',           label: 'Clinique' },
      { value: 'CENTRE_DE_SANTE',    label: 'Centre de Santé' },
      { value: 'DISTRICT_SANITAIRE', label: 'District Sanitaire' },
      { value: 'POSTE_DE_SANTE',     label: 'Poste de Santé' },
    ],
  });
});

// ── PUT /api/facilities/:id/approve ────────────────────────────────────────────
// ADMIN approuve/rejette/suspend l'enregistrement d'un établissement
export const updateFacilityStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if ((role as string) !== 'ADMIN') throw new AppError('Accès réservé à l\'administrateur', 403);

  const { id } = req.params;
  const { status, note } = req.body;

  if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
    throw new AppError('Statut invalide', 400);
  }

  const updated = await prisma.hospital.update({
    where: { id },
    data: {
      registrationStatus: status,
      verified: status === 'APPROVED',
      ...(note && { description: note }),
    },
  });

  res.json({ success: true, message: 'Statut mis à jour', data: updated });
});

// ── GET /api/facilities/pending ────────────────────────────────────────────────
// ADMIN liste les établissements en attente
export const getPendingFacilities = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if ((role as string) !== 'ADMIN') throw new AppError('Accès réservé à l\'administrateur', 403);

  const facilities = await prisma.hospital.findMany({
    where: { registrationStatus: { in: ['PENDING', 'REJECTED', 'SUSPENDED'] } },
    include: { admins: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: facilities });
});
