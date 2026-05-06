export const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator → localhost
// Pour iOS simulateur ou device physique, utiliser l'IP locale ex: http://192.168.1.x:5000/api

export const ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/password',
  APPOINTMENTS: '/appointments',
  APPOINTMENTS_PATIENT: '/appointments/patient',
  APPOINTMENTS_DOCTOR: '/appointments/doctor',
  HOSPITALS: '/hospitals',
  HOSPITALS_REGIONS: '/hospitals/regions',
  EMERGENCY_FORM: '/emergency/form',
  EMERGENCY_REQUEST: '/emergency/request',
  HOSPITALS_NEARBY: '/emergency/hospitals/nearby',
  MESSAGES: '/messages',
  MESSAGES_CONVERSATIONS: '/messages/conversations',
  MESSAGES_CONTACTS: '/messages/contacts',
  SUBSCRIPTION_ME: '/subscriptions/me',
  SUBSCRIPTION_SUBSCRIBE: '/subscriptions/subscribe',
  SUBSCRIPTION_CANCEL: '/subscriptions/cancel',
};

export const STORAGE_KEYS = {
  TOKEN: '@mediroute_token',
  USER: '@mediroute_user',
};

export const SENEGAL_REGIONS = [
  'Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack',
  'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou',
  'Tambacounda', 'Kaffrine', 'Kédougou', 'Ziguinchor',
];
