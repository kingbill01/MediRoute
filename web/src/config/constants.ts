export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENTS_PATIENT: '/appointments/patient',
  APPOINTMENTS_DOCTOR: '/appointments/doctor',
  DOCTOR_AVAILABILITY: '/appointments/doctor/:doctorId/availability',
  
  // Hospitals
  HOSPITALS: '/hospitals',
  HOSPITALS_SEARCH: '/hospitals/search',
  HOSPITALS_REGIONS: '/hospitals/regions',
  HOSPITALS_NEARBY: '/emergency/hospitals/nearby',
  
  // Emergency
  EMERGENCY_FORM: '/emergency/form',
  EMERGENCY_REQUEST: '/emergency/request',
  EMERGENCY_HISTORY: '/emergency/history',
  
  // Medical Records
  MEDICAL_RECORDS: '/medical-records',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  MEDICAL_RECORDS: '/medical-records',
  EMERGENCY: '/emergency',
  HOSPITALS: '/hospitals',
  PROFILE: '/profile',
};

export const STORAGE_KEYS = {
  TOKEN: 'mediroute_token',
  USER: 'mediroute_user',
};
