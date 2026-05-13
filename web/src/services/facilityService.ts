import api from './api';
import { STORAGE_KEYS } from '../config/constants';

export interface FacilityRegistrationPayload {
  facility: {
    name: string;
    type: string;
    region: string;
    city: string;
    address: string;
    phone: string;
    emergencyPhone: string;
    email?: string;
    website?: string;
    description?: string;
    registrationNumber?: string;
    taxNumber?: string;
    latitude?: number;
    longitude?: number;
    services?: string[];
    specializations?: string[];
    facilities?: string[];
    totalBeds?: number;
    ambulanceAvailable?: boolean;
    canAcceptEmergency?: boolean;
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  };
}

export interface FacilityType {
  value: string;
  label: string;
}

class FacilityService {
  async getTypes(): Promise<FacilityType[]> {
    const res = await api.get('/facilities/types');
    return res.data.data;
  }

  async register(payload: FacilityRegistrationPayload): Promise<any> {
    const res = await api.post('/facilities/register', payload);
    if (res.data.success && res.data.data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
        userId: res.data.data.user.userId,
        email:  res.data.data.user.email,
        role:   res.data.data.user.role,
        profile: {
          firstName: res.data.data.user.firstName,
          lastName:  res.data.data.user.lastName,
        },
        hospitalId: res.data.data.facility.id,
      }));
    }
    return res.data;
  }

  async getMyFacility(): Promise<any> {
    const res = await api.get('/facilities/my-facility');
    return res.data.data;
  }

  async updateMyFacility(updates: any): Promise<any> {
    const res = await api.put('/facilities/my-facility', updates);
    return res.data.data;
  }

  async getPending(): Promise<any[]> {
    const res = await api.get('/facilities/pending');
    return res.data.data;
  }

  async updateStatus(id: string, status: string, note?: string): Promise<any> {
    const res = await api.put(`/facilities/${id}/status`, { status, note });
    return res.data.data;
  }
}

const facilityService = new FacilityService();
export default facilityService;
