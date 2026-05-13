import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ── GET /api/doctor-affiliations/my-affiliations ──────────────────────────────
// Le médecin connecté récupère ses affiliations
export const getMyAffiliations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  if ((role as string) !== 'DOCTOR') throw new AppError('Accès réservé aux médecins', 403);

  const doctorInfo = await prisma.doctorInfo.findUnique({
    where: { userId },
    include: {
      hospitalAffiliations: {
        include: {
          hospital: {
            select: {
              id: true, name: true, type: true, region: true, city: true,
              address: true, phone: true, emergencyPhone: true,
              registrationStatus: true, verified: true,
            },
          },
        },
      },
    },
  });

  if (!doctorInfo) throw new AppError('Profil médecin introuvable', 404);

  res.json({
    success: true,
    data: doctorInfo.hospitalAffiliations.map(a => ({
      id: a.id,
      role: a.role,
      joinedAt: a.joinedAt,
      hospital: a.hospital,
    })),
  });
});

// ── PUT /api/doctor-affiliations/my-affiliations ──────────────────────────────
// Le médecin remplace sa liste d'affiliations (array de hospitalIds)
export const updateMyAffiliations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  if ((role as string) !== 'DOCTOR') throw new AppError('Accès réservé aux médecins', 403);

  const { hospitalIds } = req.body;
  if (!Array.isArray(hospitalIds)) throw new AppError('hospitalIds doit être un tableau', 400);

  const doctorInfo = await prisma.doctorInfo.findUnique({ where: { userId } });
  if (!doctorInfo) throw new AppError('Profil médecin introuvable', 404);

  // Vérifier que tous les hôpitaux existent et sont approuvés
  const validHospitals = await prisma.hospital.findMany({
    where: { id: { in: hospitalIds }, registrationStatus: 'APPROVED' },
    select: { id: true, name: true },
  });
  const validIds = new Set(validHospitals.map(h => h.id));

  await prisma.$transaction(async (tx) => {
    // Supprimer toutes les affiliations existantes
    await tx.hospitalDoctor.deleteMany({ where: { doctorId: doctorInfo.id } });
    // Recréer les nouvelles
    for (const hid of hospitalIds.filter(id => validIds.has(id))) {
      await tx.hospitalDoctor.create({
        data: { doctorId: doctorInfo.id, hospitalId: hid, role: 'AFFILIATED' },
      });
    }
  });

  res.json({
    success: true,
    message: `${validIds.size} affiliation(s) enregistrée(s)`,
    data: { count: validIds.size, hospitals: validHospitals },
  });
});

// ── GET /api/doctor-affiliations/approved-hospitals ───────────────────────────
// Liste publique des hôpitaux approuvés (pour la sélection à l'inscription/profil)
export const getApprovedHospitals = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const hospitals = await prisma.hospital.findMany({
    where: { registrationStatus: 'APPROVED' },
    select: {
      id: true, name: true, type: true, region: true, city: true,
      specializations: true, services: true,
    },
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
  });

  res.json({
    success: true,
    data: hospitals.map(h => ({
      ...h,
      specializations: h.specializations?.split(',').filter(Boolean) ?? [],
      services: h.services?.split(',').filter(Boolean) ?? [],
    })),
  });
});

// ── GET /api/doctor-affiliations/hospital/:hospitalId/doctors ─────────────────
// Patient/public : liste des médecins approuvés d'un hôpital donné
export const getDoctorsByHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hospitalId } = req.params;
  const { specialization } = req.query;

  const where: any = { hospitalId };

  const affiliations = await prisma.hospitalDoctor.findMany({
    where,
    include: {
      doctor: {
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              phone: true, profileImage: true, status: true,
            },
          },
        },
      },
    },
  });

  const filtered = affiliations.filter(a =>
    a.doctor.verificationStatus === 'APPROVED' &&
    a.doctor.user.status === 'ACTIVE' &&
    (!specialization || a.doctor.specialization === specialization)
  );

  res.json({
    success: true,
    data: filtered.map(a => ({
      affiliationId: a.id,
      role: a.role,
      joinedAt: a.joinedAt,
      doctor: {
        userId: a.doctor.user.id,
        firstName: a.doctor.user.firstName,
        lastName: a.doctor.user.lastName,
        profileImage: a.doctor.user.profileImage,
        specialization: a.doctor.specialization,
        yearsOfExperience: a.doctor.yearsOfExperience,
        consultationFee: a.doctor.consultationFee,
        bio: a.doctor.bio,
      },
    })),
  });
});

// ── GET /api/doctor-affiliations/available-doctors ─────────────────────────────
// Patient : recherche transverse des médecins disponibles avec leurs affiliations
export const getAvailableDoctors = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { specialization, region, hospitalId } = req.query;

  const where: any = {
    role: 'DOCTOR',
    status: 'ACTIVE',
    doctorInfo: { verificationStatus: 'APPROVED' },
  };
  if (region) where.region = region;
  if (specialization) where.doctorInfo.specialization = specialization;

  const doctors = await prisma.user.findMany({
    where,
    include: {
      doctorInfo: {
        include: {
          hospitalAffiliations: {
            include: {
              hospital: {
                select: { id: true, name: true, type: true, region: true, city: true },
              },
            },
          },
          availabilities: true,
        },
      },
    },
    orderBy: [{ doctorInfo: { yearsOfExperience: 'desc' } }, { firstName: 'asc' }],
  });

  // Filtrer par hôpital si demandé
  const filtered = hospitalId
    ? doctors.filter(d => d.doctorInfo?.hospitalAffiliations.some(a => a.hospitalId === hospitalId))
    : doctors;

  res.json({
    success: true,
    data: filtered.map(d => ({
      userId: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      profileImage: d.profileImage,
      city: d.city,
      region: d.region,
      doctorInfo: {
        specialization: d.doctorInfo?.specialization,
        yearsOfExperience: d.doctorInfo?.yearsOfExperience,
        consultationFee: d.doctorInfo?.consultationFee,
        bio: d.doctorInfo?.bio,
      },
      hospitals: d.doctorInfo?.hospitalAffiliations.map(a => ({
        affiliationId: a.id,
        role: a.role,
        ...a.hospital,
      })) ?? [],
      availabilities: d.doctorInfo?.availabilities ?? [],
    })),
  });
});
