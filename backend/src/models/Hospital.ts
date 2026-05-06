export enum HospitalType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  CLINIC = 'clinic',
  HEALTH_CENTER = 'health_center',
}

export interface Hospital {
  id: string;
  region: string; // Partition key (ex: "Dakar", "Thiès", etc.)
  name: string;
  type: HospitalType;
  
  // Coordonnées
  contact: {
    phone: string;
    email?: string;
    emergencyPhone: string;
  };
  
  // Localisation
  location: {
    address: string;
    city: string;
    region: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Services disponibles
  services: string[];
  specializations: string[];
  
  // Disponibilités
  availability: {
    totalBeds: number;
    availableBeds: number;
    emergencyAvailable: boolean;
    ambulanceAvailable: boolean;
  };
  
  // Heures d'ouverture
  openingHours: {
    day: string;
    openTime: string;
    closeTime: string;
    is24Hours: boolean;
  }[];
  
  // Personnel
  staff?: {
    doctors: number;
    nurses: number;
    specialists: {
      specialization: string;
      count: number;
    }[];
  };
  
  // Équipements
  facilities: string[];
  
  // Informations additionnelles
  rating?: number;
  insuranceAccepted?: string[];
  website?: string;
  description?: string;
  images?: string[];
  
  // Gestion des urgences
  emergencyCapacity: {
    canAcceptEmergency: boolean;
    waitingTime?: number; // en minutes
    lastUpdated: string;
  };
  
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}
