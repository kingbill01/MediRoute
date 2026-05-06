export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  HOSPITAL_ADMIN = 'hospital_admin',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  userId: string; // Partition key
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: {
      street?: string;
      city: string;
      region: string;
      country: string;
    };
    profileImage?: string;
  };
  // Champs spécifiques aux médecins
  doctorInfo?: {
    specialization: string;
    licenseNumber: string;
    hospitalAffiliation?: string;
    consultationFee?: number;
    availableHours?: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
    bio?: string;
    yearsOfExperience?: number;
  };
  // Champs spécifiques aux patients
  patientInfo?: {
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}
