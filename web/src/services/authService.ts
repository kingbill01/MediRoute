import api from './api';
import { ENDPOINTS, STORAGE_KEYS } from '../config/constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    address?: {
      city: string;
      region: string;
    };
  };
  doctorInfo?: any;
  patientInfo?: any;
}

export interface User {
  userId: string;
  email: string;
  role: string;
  status?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    city?: string;
    region?: string;
  };
  patientInfo?: {
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
  };
  doctorInfo?: {
    specialization?: string;
    licenseNumber?: string;
    hospital?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(ENDPOINTS.LOGIN, credentials);
    
    if (response.data.success) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(ENDPOINTS.REGISTER, data);
    
    if (response.data.success) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get(ENDPOINTS.PROFILE);
    return response.data.data;
  }

  async updateProfile(updates: any): Promise<User> {
    const response = await api.put(ENDPOINTS.PROFILE, updates);
    
    if (response.data.success) {
      const updatedUser = response.data.data;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
    
    return response.data.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', { currentPassword, newPassword });
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }
}

const authService = new AuthService();
export default authService;
