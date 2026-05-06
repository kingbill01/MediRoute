import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../config/database';
import { Hospital, HospitalType } from '../models/Hospital';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Obtenir tous les hôpitaux
export const getAllHospitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { region, type, emergencyAvailable, page = '1', limit = '20' } = req.query;

  let query = 'SELECT * FROM c WHERE 1=1';
  const parameters: any[] = [];

  if (region) {
    query += ' AND c.region = @region';
    parameters.push({ name: '@region', value: region });
  }

  if (type) {
    query += ' AND c.type = @type';
    parameters.push({ name: '@type', value: type });
  }

  if (emergencyAvailable === 'true') {
    query += ' AND c.emergencyCapacity.canAcceptEmergency = true';
  }

  const { resources: hospitals } = await dbService.hospitals.items
    .query({ query, parameters })
    .fetchAll();

  // Pagination simple
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedHospitals = hospitals.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: {
      hospitals: paginatedHospitals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: hospitals.length,
        pages: Math.ceil(hospitals.length / limitNum),
      },
    },
  });
});

// Obtenir un hôpital par ID
export const getHospitalById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const query = `SELECT * FROM c WHERE c.id = @id`;
  const { resources: hospitals } = await dbService.hospitals.items
    .query({
      query,
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();

  if (hospitals.length === 0) {
    throw new AppError('Hôpital non trouvé', 404);
  }

  res.status(200).json({
    success: true,
    data: hospitals[0],
  });
});

// Créer un hôpital (admin uniquement)
export const createHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const hospitalData = req.body;

  const hospitalId = uuidv4();
  const hospital: Hospital = {
    id: hospitalId,
    region: hospitalData.location.region,
    name: hospitalData.name,
    type: hospitalData.type,
    contact: hospitalData.contact,
    location: hospitalData.location,
    services: hospitalData.services || [],
    specializations: hospitalData.specializations || [],
    availability: hospitalData.availability,
    openingHours: hospitalData.openingHours || [],
    facilities: hospitalData.facilities || [],
    emergencyCapacity: {
      canAcceptEmergency: hospitalData.emergencyCapacity?.canAcceptEmergency || false,
      waitingTime: hospitalData.emergencyCapacity?.waitingTime,
      lastUpdated: new Date().toISOString(),
    },
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(hospitalData.staff && { staff: hospitalData.staff }),
    ...(hospitalData.website && { website: hospitalData.website }),
    ...(hospitalData.description && { description: hospitalData.description }),
  };

  const { resource: created } = await dbService.hospitals.items.create(hospital);

  res.status(201).json({
    success: true,
    message: 'Hôpital créé avec succès',
    data: created,
  });
});

// Mettre à jour un hôpital
export const updateHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Obtenir l'hôpital existant
  const query = `SELECT * FROM c WHERE c.id = @id`;
  const { resources: hospitals } = await dbService.hospitals.items
    .query({
      query,
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();

  if (hospitals.length === 0) {
    throw new AppError('Hôpital non trouvé', 404);
  }

  const hospital = hospitals[0] as Hospital;

  // Mettre à jour
  const updatedHospital: Hospital = {
    ...hospital,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const { resource: updated } = await dbService.hospitals
    .item(hospital.id, hospital.region)
    .replace(updatedHospital);

  res.status(200).json({
    success: true,
    message: 'Hôpital mis à jour',
    data: updated,
  });
});

// Mettre à jour la capacité d'urgence
export const updateEmergencyCapacity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { canAcceptEmergency, waitingTime, availableBeds } = req.body;

  // Obtenir l'hôpital
  const query = `SELECT * FROM c WHERE c.id = @id`;
  const { resources: hospitals } = await dbService.hospitals.items
    .query({
      query,
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();

  if (hospitals.length === 0) {
    throw new AppError('Hôpital non trouvé', 404);
  }

  const hospital = hospitals[0] as Hospital;

  // Mettre à jour
  const updatedHospital: Hospital = {
    ...hospital,
    emergencyCapacity: {
      canAcceptEmergency: canAcceptEmergency ?? hospital.emergencyCapacity.canAcceptEmergency,
      waitingTime,
      lastUpdated: new Date().toISOString(),
    },
    availability: {
      ...hospital.availability,
      ...(availableBeds !== undefined && { availableBeds }),
    },
    updatedAt: new Date().toISOString(),
  };

  const { resource: updated } = await dbService.hospitals
    .item(hospital.id, hospital.region)
    .replace(updatedHospital);

  res.status(200).json({
    success: true,
    message: 'Capacité d\'urgence mise à jour',
    data: updated,
  });
});

// Rechercher des hôpitaux
export const searchHospitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { query: searchQuery, region, services } = req.query;

  let query = 'SELECT * FROM c WHERE 1=1';
  const parameters: any[] = [];

  if (searchQuery) {
    query += ' AND (CONTAINS(LOWER(c.name), LOWER(@search)) OR CONTAINS(LOWER(c.description), LOWER(@search)))';
    parameters.push({ name: '@search', value: searchQuery });
  }

  if (region) {
    query += ' AND c.region = @region';
    parameters.push({ name: '@region', value: region });
  }

  const { resources: hospitals } = await dbService.hospitals.items
    .query({ query, parameters })
    .fetchAll();

  // Filtrer par services si nécessaire
  let filteredHospitals = hospitals;
  if (services) {
    const serviceList = (services as string).split(',');
    filteredHospitals = (hospitals as Hospital[]).filter((hospital) =>
      serviceList.some((service) => hospital.services.includes(service.trim()))
    );
  }

  res.status(200).json({
    success: true,
    data: { hospitals: filteredHospitals },
  });
});

// Obtenir les régions disponibles
export const getRegions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const regions = [
    'Dakar',
    'Thiès',
    'Diourbel',
    'Fatick',
    'Kaolack',
    'Kolda',
    'Louga',
    'Matam',
    'Saint-Louis',
    'Sédhiou',
    'Tambacounda',
    'Kaffrine',
    'Kédougou',
    'Ziguinchor',
  ];

  res.status(200).json({
    success: true,
    data: { regions },
  });
});
