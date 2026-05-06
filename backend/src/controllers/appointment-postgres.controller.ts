import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const getPatientAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const isAdmin = (role as string) === 'ADMIN';
  const targetId = isAdmin && req.query.patientId ? (req.query.patientId as string) : userId;

  const appointments = await prisma.appointment.findMany({
    where: { patientId: targetId },
    include: {
      doctor: {
        select: {
          firstName: true, lastName: true, email: true,
          doctorInfo: { select: { specialization: true, consultationFee: true } },
        },
      },
      hospital: { select: { name: true, address: true } },
      prescriptions: true,
    },
    orderBy: { appointmentDate: 'desc' },
  });

  res.json({ success: true, data: appointments, total: appointments.length });
});

export const getDoctorAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const isAdmin = (role as string) === 'ADMIN';
  const targetId = isAdmin && req.query.doctorId ? (req.query.doctorId as string) : userId;

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: targetId },
    include: {
      patient: {
        select: {
          firstName: true, lastName: true, phone: true,
          patientInfo: { select: { bloodGroup: true, allergies: true } },
        },
      },
      hospital: { select: { name: true, address: true } },
      prescriptions: true,
    },
    orderBy: { appointmentDate: 'desc' },
  });

  res.json({ success: true, data: appointments, total: appointments.length });
});

export const getAllAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (role !== 'ADMIN') throw new AppError('Accès non autorisé', 403);

  const { status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (status) where.status = status;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { firstName: true, lastName: true, doctorInfo: { select: { specialization: true } } } },
        hospital: { select: { name: true } },
      },
      orderBy: { appointmentDate: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({ success: true, data: appointments, total, page: parseInt(page as string) });
});

export const getDoctorAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { doctorInfo: { include: { availabilities: true } } },
  });

  if (!doctor || doctor.role !== 'DOCTOR') throw new AppError('Médecin non trouvé', 404);

  // Récupérer les créneaux déjà pris pour ce jour
  const bookedSlots = date
    ? await prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: new Date(date as string),
          status: { notIn: ['CANCELLED'] },
        },
        select: { appointmentTime: true },
      })
    : [];

  const bookedTimes = new Set(bookedSlots.map((a) => a.appointmentTime));

  res.json({
    success: true,
    data: {
      doctor: {
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        doctorInfo: doctor.doctorInfo,
      },
      availabilities: doctor.doctorInfo?.availabilities || [],
      bookedSlots: Array.from(bookedTimes),
    },
  });
});

export const createAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { doctorId, appointmentDate, appointmentTime, duration, type, reason, notes, hospitalId } =
    req.body;

  if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
    throw new AppError('Médecin, date, heure et motif requis', 400);
  }

  const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.role !== 'DOCTOR') throw new AppError('Médecin non trouvé', 404);

  // Vérifier que le créneau est libre
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { notIn: ['CANCELLED'] },
    },
  });

  if (conflict) throw new AppError('Ce créneau est déjà réservé', 409);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: userId,
      doctorId,
      hospitalId: hospitalId || null,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      duration: duration || 30,
      type: type || 'CONSULTATION',
      reason,
      notes: notes || null,
      status: 'PENDING',
    },
    include: {
      doctor: { select: { firstName: true, lastName: true, doctorInfo: { select: { specialization: true } } } },
      hospital: { select: { name: true, address: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Rendez-vous créé avec succès',
    data: appointment,
  });
});

export const updateAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError('Rendez-vous non trouvé', 404);

  const roleStr = role as string;
  const isOwner = appointment.patientId === userId || appointment.doctorId === userId;
  if (!isOwner && roleStr !== 'ADMIN') throw new AppError('Accès non autorisé', 403);

  const allowedFields: any = {};
  const { status, notes, doctorNotes } = req.body;

  if (roleStr === 'DOCTOR' || roleStr === 'ADMIN') {
    if (status) allowedFields.status = status;
    if (doctorNotes !== undefined) allowedFields.doctorNotes = doctorNotes;
  }
  if (roleStr === 'PATIENT' && status === 'CANCELLED') {
    allowedFields.status = 'CANCELLED';
  }
  if (notes !== undefined) allowedFields.notes = notes;

  const updated = await prisma.appointment.update({ where: { id }, data: allowedFields });
  res.json({ success: true, message: 'Rendez-vous mis à jour', data: updated });
});

export const getApprovedDoctors = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
      status: 'ACTIVE',
      doctorInfo: { is: { verificationStatus: 'APPROVED' } },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      city: true,
      region: true,
      doctorInfo: {
        select: {
          id: true,
          specialization: true,
          consultationFee: true,
          yearsOfExperience: true,
          bio: true,
        },
      },
    },
    orderBy: { firstName: 'asc' },
  });

  const formatted = doctors.map(d => ({
    userId: d.id,
    firstName: d.firstName,
    lastName: d.lastName,
    city: d.city,
    region: d.region,
    doctorInfo: d.doctorInfo,
  }));

  res.json({ success: true, data: formatted });
});

export const cancelAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError('Rendez-vous non trouvé', 404);

  const isOwner = appointment.patientId === userId || appointment.doctorId === userId;
  if (!isOwner && (role as string) !== 'ADMIN') throw new AppError('Accès non autorisé', 403);

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true, message: 'Rendez-vous annulé', data: updated });
});
