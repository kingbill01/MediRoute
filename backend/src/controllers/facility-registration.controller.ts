import { Response } from 'express';
import bcrypt from 'bcryptjs';
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

// ── GET /api/facilities/:id/managers ───────────────────────────────────────────
// ADMIN : liste les gestionnaires (HOSPITAL_ADMIN) liés à l'établissement
export const listManagers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if ((role as string) !== 'ADMIN') throw new AppError('Accès réservé à l\'administrateur', 403);

  const { id } = req.params;
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      admins: {
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, status: true, createdAt: true,
        },
      },
    },
  });

  if (!hospital) throw new AppError('Établissement introuvable', 404);
  res.json({ success: true, data: hospital.admins });
});

// ── POST /api/facilities/:id/managers ──────────────────────────────────────────
// ADMIN : désigne un gestionnaire (par email existant OU création d'un nouveau compte)
export const assignManager = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if ((role as string) !== 'ADMIN') throw new AppError('Accès réservé à l\'administrateur', 403);

  const { id } = req.params;
  const { email, password, firstName, lastName, phone, mode } = req.body;

  if (!email) throw new AppError('Email requis', 400);

  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) throw new AppError('Établissement introuvable', 404);

  const existing = await prisma.user.findUnique({ where: { email } });

  let userId: string;
  if (mode === 'existing') {
    // Promouvoir un utilisateur existant en HOSPITAL_ADMIN
    if (!existing) throw new AppError('Aucun utilisateur trouvé avec cet email', 404);
    if (existing.hospitalId && existing.hospitalId !== id) {
      throw new AppError('Cet utilisateur gère déjà un autre établissement', 400);
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'HOSPITAL_ADMIN', hospitalId: id, status: 'ACTIVE' },
    });
    userId = updated.id;
  } else {
    // Créer un nouveau compte
    if (existing) throw new AppError('Cet email est déjà utilisé. Utilisez le mode "existing".', 400);
    if (!password || password.length < 8) throw new AppError('Mot de passe requis (8 caractères min)', 400);
    if (!firstName || !lastName || !phone) throw new AppError('Prénom, nom et téléphone requis', 400);

    const hash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        email, password: hash,
        role: 'HOSPITAL_ADMIN', status: 'ACTIVE',
        firstName, lastName, phone,
        city: hospital.city, region: hospital.region, country: 'Sénégal',
        hospitalId: id,
      },
    });
    userId = created.id;
  }

  res.status(201).json({
    success: true,
    message: 'Gestionnaire désigné avec succès',
    data: { userId, hospitalId: id, hospitalName: hospital.name },
  });
});

// ── DELETE /api/facilities/:id/managers/:userId ───────────────────────────────
// ADMIN : retire le rôle de gestionnaire (le compte reste mais perd l'accès à l'établissement)
export const removeManager = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if ((role as string) !== 'ADMIN') throw new AppError('Accès réservé à l\'administrateur', 403);

  const { id, userId } = req.params;
  const user = await prisma.user.findFirst({ where: { id: userId, hospitalId: id } });
  if (!user) throw new AppError('Gestionnaire introuvable pour cet établissement', 404);

  // Détacher : remettre en PATIENT (par défaut) et retirer hospitalId
  await prisma.user.update({
    where: { id: userId },
    data: { hospitalId: null, role: 'PATIENT' },
  });

  res.json({ success: true, message: 'Gestionnaire retiré' });
});

// ── GET /api/facilities/search-users?email=... ─────────────────────────────────
// ADMIN : recherche d'utilisateurs existants pour désignation (par email partiel)
export const searchUsersForManager = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if ((role as string) !== 'ADMIN') throw new AppError('Accès réservé à l\'administrateur', 403);

  const { email } = req.query;
  if (!email || (email as string).length < 3) {
    return res.json({ success: true, data: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      email: { contains: email as string, mode: 'insensitive' },
      role: { in: ['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN'] },
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, role: true, hospitalId: true,
    },
    take: 10,
  });

  res.json({ success: true, data: users });
});
