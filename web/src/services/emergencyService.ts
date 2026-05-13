import api from './api';
import { ENDPOINTS } from '../config/constants';

export interface EmergencyFormQuestion {
  id: string;
  step: number;
  section?: string;
  question: string;
  type: string;
  field?: string | null;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface EmergencyRequest {
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  patientPhone: string;
  bloodGroup?: string | null;
  city: string;
  region: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  consciousness?: string | null;
  breathing?: string | null;
  chestPain?: string | null;
  injury?: string | null;
  symptoms?: string[];
  duration?: string | null;
  medicalHistory?: string[];
  medications?: string;
  canMove?: string | null;
  needsAmbulance?: string | null;
  description?: string;
  formResponses?: { question: string; answer: string }[];
}

export interface Hospital {
  hospitalId: string;
  name: string;
  type: string;
  address: string;
  distance: number;
  availableBeds: number;
  emergencyPhone: string;
  services: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

class EmergencyService {
  async getEmergencyForm(): Promise<EmergencyFormQuestion[]> {
    const response = await api.get(ENDPOINTS.EMERGENCY_FORM);
    return response.data.data.questions;
  }

  async submitEmergencyRequest(request: EmergencyRequest): Promise<any> {
    const response = await api.post(ENDPOINTS.EMERGENCY_REQUEST, request);
    return response.data.data;
  }

  async getNearbyHospitals(latitude: number, longitude: number, region: string): Promise<Hospital[]> {
    const response = await api.get(ENDPOINTS.HOSPITALS_NEARBY, {
      params: { latitude, longitude, region },
    });
    return response.data.data.hospitals;
  }

  async getEmergencyHistory(): Promise<any[]> {
    const response = await api.get(ENDPOINTS.EMERGENCY_HISTORY);
    return response.data.data.requests;
  }

  getUserLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });
  }
}

const emergencyService = new EmergencyService();
export default emergencyService;
