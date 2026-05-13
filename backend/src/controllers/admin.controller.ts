import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const requireAdmin = (req: AuthRequest) => {
  if ((req.user?.role as string) !== 'ADMIN') throw new AppError('Accès réservé aux administrateurs', 403);
};

// ─── STATISTIQUES ───────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const [
    totalPatients, totalDoctors, pendingDoctors, totalHospitals,
    totalAppointments, pendingAppointments, totalEmergencies, activeEmergencies,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.user.count({ where: { role: 'DOCTOR' } }),
    prisma.doctorInfo.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.hospital.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.emergencyRequest.count(),
    prisma.emergencyRequest.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_TRANSIT'] } } }),
  ]);

  const appointmentsByStatus = await prisma.appointment.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const emergenciesByLevel = await prisma.emergencyRequest.groupBy({
    by: ['level'],
    _count: { level: true },
  });

  const hospitalsByRegion = await prisma.hospital.groupBy({
    by: ['region'],
    _count: { region: true },
  });

  res.json({
    success: true,
    data: {
      users: { totalPatients, totalDoctors, pendingDoctors },
      hospitals: { total: totalHospitals, byRegion: hospitalsByRegion },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        byStatus: appointmentsByStatus,
      },
      emergencies: {
        total: totalEmergencies,
        active: activeEmergencies,
        byLevel: emergenciesByLevel,
      },
    },
  });
});

// ─── GESTION DES MÉDECINS ────────────────────────────────────────────────────

export const getAllDoctors = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);
  const { status, hospital, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { role: 'DOCTOR' };
  if (hospital) {
    where.doctorInfo = { hospitalAffiliations: { some: { hospitalId: hospital as string } } };
  }

  const doctorInfoWhere: any = {};
  if (status) doctorInfoWhere.verificationStatus = status;

  const [doctors, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        doctorInfo: {
          where: Object.keys(doctorInfoWhere).length ? doctorInfoWhere : undefined,
          include: {
            availabilities: true,
            hospitalAffiliations: { include: { hospital: { select: { id: true, name: true, region: true } } } },
          },
        },
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const filtered = status
    ? doctors.filter((d) => d.doctorInfo?.verificationStatus === status)
    : doctors;

  res.json({
    success: true,
    data: filtered.map((d) => ({
      userId: d.id,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      city: d.city,
      region: d.region,
      status: d.status,
      profileImage: d.profileImage,
      createdAt: d.createdAt,
      doctorInfo: d.doctorInfo,
    })),
    total: filtered.length,
    pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total },
  });
});

export const approveDoctorVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);
  const { doctorId } = req.params;
  const { status, note } = req.body; // APPROVED | REJECTED

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Statut invalide : APPROVED ou REJECTED', 400);
  }

  const doctorInfo = await prisma.doctorInfo.findUnique({ where: { userId: doctorId } });
  if (!doctorInfo) throw new AppError('Médecin non trouvé', 404);

  const updated = await prisma.doctorInfo.update({
    where: { userId: doctorId },
    data: {
      verificationStatus: status,
      verificationNote: note || null,
      verifiedAt: status === 'APPROVED' ? new Date() : null,
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  res.json({
    success: true,
    message: status === 'APPROVED' ? 'Médecin approuvé' : 'Médecin rejeté',
    data: updated,
  });
});

export const affiliateDoctorToHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);
  const { doctorId } = req.params;
  const { hospitalId, role = 'AFFILIATED' } = req.body;

  const [doctorInfo, hospital] = await Promise.all([
    prisma.doctorInfo.findUnique({ where: { userId: doctorId } }),
    prisma.hospital.findUnique({ where: { id: hospitalId } }),
  ]);
  if (!doctorInfo) throw new AppError('Médecin non trouvé', 404);
  if (!hospital) throw new AppError('Hôpital non trouvé', 404);

  const affiliation = await prisma.hospitalDoctor.upsert({
    where: { doctorId_hospitalId: { doctorId: doctorInfo.id, hospitalId } },
    update: { role },
    create: { doctorId: doctorInfo.id, hospitalId, role },
    include: { hospital: { select: { name: true, region: true } } },
  });

  res.json({ success: true, message: 'Affiliation mise à jour', data: affiliation });
});

export const removeAffiliation = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);
  const { doctorId, hospitalId } = req.params;

  const doctorInfo = await prisma.doctorInfo.findUnique({ where: { userId: doctorId } });
  if (!doctorInfo) throw new AppError('Médecin non trouvé', 404);

  await prisma.hospitalDoctor.deleteMany({
    where: { doctorId: doctorInfo.id, hospitalId },
  });

  res.json({ success: true, message: 'Affiliation supprimée' });
});

// ─── GESTION DES PATIENTS ────────────────────────────────────────────────────

export const getAllPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);
  const { region, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { role: 'PATIENT' };
  if (region) where.region = region;

  const [patients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        patientInfo: true,
        _count: { select: { appointmentsAsPatient: true, medicalRecords: true } },
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

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
      status: p.status,
      profileImage: p.profileImage,
      createdAt: p.createdAt,
      patientInfo: p.patientInfo,
      stats: p._count,
    })),
    total,
    pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total },
  });
});

export const getPatientDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);
  const { patientId } = req.params;

  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: {
      patientInfo: true,
      appointmentsAsPatient: {
        include: { doctor: { select: { firstName: true, lastName: true, doctorInfo: { select: { specialization: true } } } } },
        orderBy: { appointmentDate: 'desc' },
        take: 10,
      },
      medicalRecords: { orderBy: { recordDate: 'desc' }, take: 10 },
    },
  });

  if (!patient || patient.role !== 'PATIENT') throw new AppError('Patient non trouvé', 404);

  res.json({ success: true, data: patient });
});

export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);
  const { userId } = req.params;
  const { status } = req.body;

  if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    throw new AppError('Statut invalide', 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, role: true, status: true, firstName: true, lastName: true },
  });

  res.json({ success: true, message: 'Statut utilisateur mis à jour', data: user });
});
