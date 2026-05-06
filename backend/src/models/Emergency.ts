export enum EmergencyLevel {
  CRITICAL = 'critical',      // Danger immédiat de mort
  URGENT = 'urgent',          // Nécessite soins rapides
  SEMI_URGENT = 'semi_urgent', // Peut attendre quelques heures
  NON_URGENT = 'non_urgent',  // Consultation normale possible
}

export enum EmergencyStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface EmergencyRequest {
  id: string;
  patientId: string; // Partition key
  
  // Informations patient
  patientInfo: {
    name: string;
    age?: number;
    gender?: string;
    phone: string;
    bloodGroup?: string;
  };
  
  // Localisation
  location: {
    address?: string;
    city: string;
    region: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Description de l'urgence
  emergencyDetails: {
    symptoms: string[];
    description: string;
    level: EmergencyLevel;
    hasInjury: boolean;
    isConscious: boolean;
    canMove: boolean;
    needsAmbulance: boolean;
  };
  
  // Hôpital assigné
  assignedHospital?: {
    hospitalId: string;
    hospitalName: string;
    distance: number; // en km
    estimatedArrivalTime?: number; // en minutes
  };
  
  // Statut et suivi
  status: EmergencyStatus;
  priorityScore: number; // 1-10 basé sur les réponses
  
  // Réponses au formulaire d'urgence
  formResponses: {
    question: string;
    answer: string;
  }[];
  
  // Suivi
  timeline: {
    timestamp: string;
    event: string;
    notes?: string;
  }[];
  
  // Ambulance (si applicable)
  ambulance?: {
    vehicleId: string;
    driverName: string;
    driverPhone: string;
    estimatedArrival: string;
  };
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Questions du formulaire d'urgence progressif
export interface EmergencyFormQuestion {
  id: string;
  step: number;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'location';
  options?: string[];
  required: boolean;
  // Logique conditionnelle
  showIf?: {
    questionId: string;
    answer: string;
  };
  // Poids pour calculer le score de priorité
  scoringWeight?: {
    [answer: string]: number;
  };
}

export const emergencyFormQuestions: EmergencyFormQuestion[] = [
  {
    id: 'symptoms',
    step: 1,
    question: 'Quels sont les symptômes actuels?',
    type: 'multiple_choice',
    required: true,
    options: [
      'Douleur thoracique',
      'Difficulté à respirer',
      'Saignement important',
      'Perte de conscience',
      'Fièvre élevée',
      'Douleur abdominale sévère',
      'Traumatisme/Accident',
      'Autre',
    ],
    scoringWeight: {
      'Douleur thoracique': 9,
      'Difficulté à respirer': 10,
      'Saignement important': 9,
      'Perte de conscience': 10,
      'Fièvre élevée': 5,
      'Douleur abdominale sévère': 7,
      'Traumatisme/Accident': 8,
      'Autre': 3,
    },
  },
  {
    id: 'consciousness',
    step: 2,
    question: 'La personne est-elle consciente?',
    type: 'single_choice',
    required: true,
    options: ['Oui, complètement réactive', 'Oui, mais confuse', 'Non, inconsciente'],
    scoringWeight: {
      'Oui, complètement réactive': 2,
      'Oui, mais confuse': 7,
      'Non, inconsciente': 10,
    },
  },
  {
    id: 'breathing',
    step: 3,
    question: 'La respiration est-elle normale?',
    type: 'single_choice',
    required: true,
    options: ['Oui, normale', 'Difficile ou rapide', 'Très difficile', 'Ne respire pas'],
    scoringWeight: {
      'Oui, normale': 1,
      'Difficile ou rapide': 6,
      'Très difficile': 9,
      'Ne respire pas': 10,
    },
  },
  {
    id: 'mobility',
    step: 4,
    question: 'La personne peut-elle se déplacer?',
    type: 'single_choice',
    required: true,
    options: ['Oui, sans aide', 'Avec aide', 'Non, ne peut pas bouger'],
    scoringWeight: {
      'Oui, sans aide': 1,
      'Avec aide': 4,
      'Non, ne peut pas bouger': 8,
    },
  },
  {
    id: 'description',
    step: 5,
    question: 'Décrivez brièvement la situation',
    type: 'text',
    required: true,
  },
  {
    id: 'location',
    step: 6,
    question: 'Où vous trouvez-vous actuellement?',
    type: 'location',
    required: true,
  },
];
