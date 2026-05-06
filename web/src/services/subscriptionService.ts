import api from './api';

export const PLANS = {
  PATIENT: { amount: 5000,  label: 'Patient', currency: 'FCFA' },
  DOCTOR:  { amount: 15000, label: 'Médecin', currency: 'FCFA' },
};

export const PAYMENT_METHODS = [
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: '🟠', color: '#FF6600' },
  { value: 'WAVE',         label: 'Wave',         icon: '🔵', color: '#1877F2' },
  { value: 'CARD',         label: 'Carte bancaire',icon: '💳', color: '#0F2D52' },
  { value: 'APPLE_PAY',    label: 'Apple Pay',    icon: '🍎', color: '#000000' },
  { value: 'GOOGLE_PAY',   label: 'Google Pay',   icon: '🔴', color: '#4285F4' },
];

export interface Subscription {
  id: string;
  userId: string;
  plan: 'PATIENT' | 'DOCTOR';
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  subscriptionNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string;
  paymentStatus: string;
  startDate?: string;
  endDate?: string;
  autoRenew: boolean;
  isActive?: boolean;
  daysLeft?: number;
  createdAt: string;
}

const subscriptionService = {
  getMySubscription: async (): Promise<{ data: Subscription | null; plans: typeof PLANS }> => {
    const r = await api.get('/subscriptions/me');
    return r.data;
  },

  subscribe: async (payload: {
    paymentMethod: string;
    paymentReference?: string;
    autoRenew?: boolean;
  }): Promise<any> => {
    const r = await api.post('/subscriptions/subscribe', payload);
    return r.data;
  },

  cancel: async (): Promise<void> => {
    await api.post('/subscriptions/cancel');
  },

  checkUser: async (userId: string): Promise<{ isActive: boolean; status: string }> => {
    const r = await api.get(`/subscriptions/check/${userId}`);
    return r.data.data;
  },

  // Admin
  getAll: async (params?: Record<string, any>): Promise<any> => {
    const r = await api.get('/subscriptions', { params });
    return r.data;
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.put(`/subscriptions/${id}/status`, { status });
  },
};

export default subscriptionService;
