import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../config/database';
import { Appointment, AppointmentStatus, AppointmentType } from '../models/Appointment';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Créer un rendez-vous
export const createAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { doctorId, appointmentDate, appointmentTime, duration, type, reason, notes } = req.body;
  const patientId = req.user!.userId;

  // Vérifier que le médecin existe
  const { resource: doctor } = await dbService.users.item(doctorId, doctorId).read<User>();
  if (!doctor || doctor.role !== UserRole.DOCTOR) {
    throw new AppError('Médecin non trouvé', 404);
  }

  // Vérifier la disponibilité (simplifié, peut être amélioré)
  const checkQuery = `
    SELECT * FROM c 
    WHERE c.doctorId = @doctorId 
    AND c.appointmentDate = @date 
    AND c.appointmentTime = @time
    AND c.status != @cancelled
  `;

  const { resources: existingAppointments } = await dbService.appointments.items
    .query({
      query: checkQuery,
      parameters: [
        { name: '@doctorId', value: doctorId },
        { name: '@date', value: appointmentDate },
        { name: '@time', value: appointmentTime },
        { name: '@cancelled', value: AppointmentStatus.CANCELLED },
      ],
    })
    .fetchAll();

  if (existingAppointments.length > 0) {
    throw new AppError('Ce créneau horaire n\'est pas disponible', 400);
  }

  // Créer le rendez-vous
  const appointmentId = uuidv4();
  const appointment: Appointment = {
    id: appointmentId,
    patientId,
    doctorId,
    appointmentDate,
    appointmentTime,
    duration: duration || 30,
    type: type || AppointmentType.CONSULTATION,
    status: AppointmentStatus.PENDING,
    reason,
    notes,
    reminderSent: false,
    confirmationSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { resource: created } = await dbService.appointments.items.create(appointment);

  // TODO: Envoyer une notification au médecin

  res.status(201).json({
    success: true,
    message: 'Rendez-vous créé avec succès',
    data: created,
  });
});

// Obtenir les rendez-vous d'un patient
export const getPatientAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const patientId = req.user!.userId;
  const { status, startDate, endDate } = req.query;

  let query = `SELECT * FROM c WHERE c.patientId = @patientId`;
  const parameters: any[] = [{ name: '@patientId', value: patientId }];

  if (status) {
    query += ' AND c.status = @status';
    parameters.push({ name: '@status', value: status });
  }

  if (startDate && endDate) {
    query += ' AND c.appointmentDate >= @startDate AND c.appointmentDate <= @endDate';
    parameters.push(
      { name: '@startDate', value: startDate },
      { name: '@endDate', value: endDate }
    );
  }

  query += ' ORDER BY c.appointmentDate DESC, c.appointmentTime DESC';

  const { resources: appointments } = await dbService.appointments.items
    .query({ query, parameters })
    .fetchAll();

  res.status(200).json({
    success: true,
    data: { appointments },
  });
});

// Obtenir les rendez-vous d'un médecin
export const getDoctorAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doctorId = req.user!.userId;
  const { status, date } = req.query;

  let query = `SELECT * FROM c WHERE c.doctorId = @doctorId`;
  const parameters: any[] = [{ name: '@doctorId', value: doctorId }];

  if (status) {
    query += ' AND c.status = @status';
    parameters.push({ name: '@status', value: status });
  }

  if (date) {
    query += ' AND c.appointmentDate = @date';
    parameters.push({ name: '@date', value: date });
  }

  query += ' ORDER BY c.appointmentDate ASC, c.appointmentTime ASC';

  const { resources: appointments } = await dbService.appointments.items
    .query({ query, parameters })
    .fetchAll();

  res.status(200).json({
    success: true,
    data: { appointments },
  });
});

// Obtenir un rendez-vous spécifique
export const getAppointmentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Obtenir le rendez-vous
  const query = `SELECT * FROM c WHERE c.id = @id`;
  const { resources: appointments } = await dbService.appointments.items
    .query({
      query,
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();

  if (appointments.length === 0) {
    throw new AppError('Rendez-vous non trouvé', 404);
  }

  const appointment = appointments[0] as Appointment;

  // Vérifier que l'utilisateur a accès
  if (appointment.patientId !== userId && appointment.doctorId !== userId) {
    throw new AppError('Accès non autorisé', 403);
  }

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

// Mettre à jour le statut d'un rendez-vous
export const updateAppointmentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, doctorNotes, prescription } = req.body;
  const userId = req.user!.userId;

  // Obtenir le rendez-vous
  const query = `SELECT * FROM c WHERE c.id = @id`;
  const { resources: appointments } = await dbService.appointments.items
    .query({
      query,
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();

  if (appointments.length === 0) {
    throw new AppError('Rendez-vous non trouvé', 404);
  }

  const appointment = appointments[0] as Appointment;

  // Vérifier les autorisations
  if (
    appointment.patientId !== userId &&
    appointment.doctorId !== userId &&
    req.user!.role !== UserRole.ADMIN
  ) {
    throw new AppError('Accès non autorisé', 403);
  }

  // Mettre à jour
  const updatedAppointment: Appointment = {
    ...appointment,
    status,
    ...(doctorNotes && { doctorNotes }),
    ...(prescription && { prescription }),
    updatedAt: new Date().toISOString(),
  };

  const { resource: updated } = await dbService.appointments
    .item(appointment.id, appointment.patientId)
    .replace(updatedAppointment);

  res.status(200).json({
    success: true,
    message: 'Rendez-vous mis à jour',
    data: updated,
  });
});

// Annuler un rendez-vous
export const cancelAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const query = `SELECT * FROM c WHERE c.id = @id`;
  const { resources: appointments } = await dbService.appointments.items
    .query({
      query,
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();

  if (appointments.length === 0) {
    throw new AppError('Rendez-vous non trouvé', 404);
  }

  const appointment = appointments[0] as Appointment;

  // Vérifier les autorisations
  if (appointment.patientId !== userId && appointment.doctorId !== userId) {
    throw new AppError('Accès non autorisé', 403);
  }

  // Annuler
  const updatedAppointment: Appointment = {
    ...appointment,
    status: AppointmentStatus.CANCELLED,
    updatedAt: new Date().toISOString(),
  };

  const { resource: updated } = await dbService.appointments
    .item(appointment.id, appointment.patientId)
    .replace(updatedAppointment);

  res.status(200).json({
    success: true,
    message: 'Rendez-vous annulé',
    data: updated,
  });
});

// Obtenir les créneaux disponibles d'un médecin
export const getDoctorAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new AppError('Date requise', 400);
  }

  // Obtenir les informations du médecin
  const { resource: doctor } = await dbService.users.item(doctorId, doctorId).read<User>();
  if (!doctor || doctor.role !== UserRole.DOCTOR) {
    throw new AppError('Médecin non trouvé', 404);
  }

  // Obtenir les rendez-vous existants
  const query = `
    SELECT * FROM c 
    WHERE c.doctorId = @doctorId 
    AND c.appointmentDate = @date
    AND c.status != @cancelled
  `;

  const { resources: appointments } = await dbService.appointments.items
    .query({
      query,
      parameters: [
        { name: '@doctorId', value: doctorId },
        { name: '@date', value: date },
        { name: '@cancelled', value: AppointmentStatus.CANCELLED },
      ],
    })
    .fetchAll();

  // Calculer les créneaux disponibles (simplifié)
  const bookedSlots = (appointments as Appointment[]).map((apt) => apt.appointmentTime);

  res.status(200).json({
    success: true,
    data: {
      doctor: {
        name: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
        specialization: doctor.doctorInfo?.specialization,
        availableHours: doctor.doctorInfo?.availableHours || [],
      },
      bookedSlots,
    },
  });
});
