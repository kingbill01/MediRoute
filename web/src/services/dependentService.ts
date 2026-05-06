import api from './api';

export interface Dependent {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  relationship: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  notes?: string;
  age: number;
  lastVisit?: string;
  medicalRecords?: DependentMedicalRecord[];
  createdAt: string;
}

export interface DependentMedicalRecord {
  id: string;
  dependentId: string;
  doctorId?: string;
  recordDate: string;
  recordType: string;
  diagnosis?: string;
  symptoms?: string;
  notes: string;
  weight?: number;
  height?: number;
  temperature?: number;
  vitalSigns?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
}

export interface CreateDependentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  relationship?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  notes?: string;
}

export interface CreateRecordData {
  recordDate: string;
  recordType: string;
  diagnosis?: string;
  symptoms?: string;
  notes: string;
  weight?: number;
  height?: number;
  temperature?: number;
  followUpRequired?: boolean;
  followUpDate?: string;
}

class DependentService {
  async getAll(): Promise<Dependent[]> {
    const res = await api.get('/dependents');
    return res.data.data;
  }

  async getById(id: string): Promise<Dependent> {
    const res = await api.get(`/dependents/${id}`);
    return res.data.data;
  }

  async create(data: CreateDependentData): Promise<Dependent> {
    const res = await api.post('/dependents', data);
    return res.data.data;
  }

  async update(id: string, data: Partial<CreateDependentData>): Promise<Dependent> {
    const res = await api.put(`/dependents/${id}`, data);
    return res.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/dependents/${id}`);
  }

  async getRecords(dependentId: string): Promise<DependentMedicalRecord[]> {
    const res = await api.get(`/dependents/${dependentId}/records`);
    return res.data.data;
  }

  async createRecord(dependentId: string, data: CreateRecordData): Promise<DependentMedicalRecord> {
    const res = await api.post(`/dependents/${dependentId}/records`, data);
    return res.data.data;
  }

  async deleteRecord(dependentId: string, recordId: string): Promise<void> {
    await api.delete(`/dependents/${dependentId}/records/${recordId}`);
  }
}

export default new DependentService();
