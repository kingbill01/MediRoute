export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  ROUTINE_CHECKUP = 'routine_checkup',
}

export interface Appointment {
  id: string;
  patientId: string; // Partition key
  doctorId: string;
  hospitalId?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number; // en minutes
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  // Notes du médecin après consultation
  doctorNotes?: string;
  prescription?: {
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
    instructions?: string;
  };
  // Informations de suivi
  reminderSent: boolean;
  confirmationSent: boolean;
  createdAt: string;
  updatedAt: string;
}
