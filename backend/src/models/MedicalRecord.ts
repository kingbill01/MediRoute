export interface MedicalRecord {
  id: string;
  patientId: string; // Partition key
  doctorId: string;
  appointmentId?: string;
  recordDate: string;
  recordType: 'consultation' | 'prescription' | 'lab_result' | 'imaging' | 'diagnosis' | 'surgery';
  
  // Diagnostic et observations
  diagnosis?: string;
  symptoms?: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    bmi?: number;
  };
  
  // Prescriptions
  prescription?: {
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
    labTests?: string[];
  };
  
  // Résultats d'analyses
  labResults?: {
    testName: string;
    result: string;
    normalRange?: string;
    date: string;
    attachmentUrl?: string;
  }[];
  
  // Imagerie médicale
  imaging?: {
    type: string;
    description: string;
    imageUrl: string;
    date: string;
  }[];
  
  // Notes et observations
  notes: string;
  
  // Fichiers attachés
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }[];
  
  // Suivi
  followUpRequired: boolean;
  followUpDate?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface MedicalHistory {
  patientId: string;
  allergies: string[];
  chronicConditions: string[];
  surgeries: {
    name: string;
    date: string;
    hospital?: string;
    notes?: string;
  }[];
  vaccinations: {
    name: string;
    date: string;
    nextDueDate?: string;
  }[];
  familyHistory: {
    condition: string;
    relation: string;
    notes?: string;
  }[];
}
