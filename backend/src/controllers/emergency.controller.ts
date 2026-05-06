import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../config/database';
import {
  EmergencyRequest,
  EmergencyStatus,
  EmergencyLevel,
  emergencyFormQuestions,
} from '../models/Emergency';
import { Hospital } from '../models/Hospital';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Récupérer les questions du formulaire d'urgence
export const getEmergencyForm = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      questions: emergencyFormQuestions,
    },
  });
});

// Calculer le score de priorité basé sur les réponses
const calculatePriorityScore = (responses: { question: string; answer: string }[]): number => {
  let score = 0;
  
  responses.forEach((response) => {
    const question = emergencyFormQuestions.find((q) => q.question === response.question);
    if (question && question.scoringWeight) {
      const weight = question.scoringWeight[response.answer];
      if (weight) {
        score += weight;
      }
    }
  });

  return Math.min(score, 10); // Score maximum de 10
};

// Déterminer le niveau d'urgence basé sur le score
const determineEmergencyLevel = (score: number): EmergencyLevel => {
  if (score >= 9) return EmergencyLevel.CRITICAL;
  if (score >= 7) return EmergencyLevel.URGENT;
  if (score >= 4) return EmergencyLevel.SEMI_URGENT;
  return EmergencyLevel.NON_URGENT;
};

// Calculer la distance entre deux points (formule de Haversine)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Soumettre une demande d'urgence
export const submitEmergencyRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { patientInfo, location, emergencyDetails, formResponses } = req.body;
    const patientId = req.user?.userId || 'anonymous';

    // Calculer le score de priorité
    const priorityScore = calculatePriorityScore(formResponses);
    const level = determineEmergencyLevel(priorityScore);

    // Créer la demande d'urgence
    const requestId = uuidv4();
    const emergencyRequest: EmergencyRequest = {
      id: requestId,
      patientId,
      patientInfo,
      location,
      emergencyDetails: {
        ...emergencyDetails,
        level,
      },
      status: EmergencyStatus.PENDING,
      priorityScore,
      formResponses,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          event: 'Demande d\'urgence créée',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.emergencyRequests.items.create(emergencyRequest);

    // Trouver les hôpitaux disponibles proches
    const nearbyHospitals = await findNearbyHospitals(
      location.coordinates.latitude,
      location.coordinates.longitude,
      location.region
    );

    res.status(201).json({
      success: true,
      message: 'Demande d\'urgence enregistrée',
      data: {
        requestId,
        priorityScore,
        level,
        nearbyHospitals,
      },
    });
  }
);

// Trouver les hôpitaux proches
export const findNearbyHospitals = async (
  latitude: number,
  longitude: number,
  region: string
): Promise<any[]> => {
  // Récupérer les hôpitaux de la région
  const query = `
    SELECT * FROM c 
    WHERE c.region = @region 
    AND c.emergencyCapacity.canAcceptEmergency = true
  `;

  const { resources: hospitals } = await dbService.hospitals.items
    .query({
      query,
      parameters: [{ name: '@region', value: region }],
    })
    .fetchAll();

  // Calculer la distance et trier
  const hospitalsWithDistance = (hospitals as Hospital[]).map((hospital) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      hospital.location.coordinates.latitude,
      hospital.location.coordinates.longitude
    );

    return {
      hospitalId: hospital.id,
      name: hospital.name,
      type: hospital.type,
      address: hospital.location.address,
      distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
      availableBeds: hospital.availability.availableBeds,
      emergencyPhone: hospital.contact.emergencyPhone,
      services: hospital.services,
      estimatedWaitTime: hospital.emergencyCapacity.waitingTime,
      coordinates: hospital.location.coordinates,
    };
  });

  // Trier par distance
  return hospitalsWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 10);
};

// Obtenir les hôpitaux proches (endpoint public)
export const getNearbyHospitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { latitude, longitude, region } = req.query;

  if (!latitude || !longitude || !region) {
    throw new AppError('Coordonnées et région requis', 400);
  }

  const hospitals = await findNearbyHospitals(
    parseFloat(latitude as string),
    parseFloat(longitude as string),
    region as string
  );

  res.status(200).json({
    success: true,
    data: { hospitals },
  });
});

// Obtenir l'historique des demandes d'urgence d'un patient
export const getEmergencyHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const patientId = req.user!.userId;

  const query = `SELECT * FROM c WHERE c.patientId = @patientId ORDER BY c.createdAt DESC`;
  const { resources: requests } = await dbService.emergencyRequests.items
    .query({
      query,
      parameters: [{ name: '@patientId', value: patientId }],
    })
    .fetchAll();

  res.status(200).json({
    success: true,
    data: { requests },
  });
});

// Mettre à jour le statut d'une demande d'urgence
export const updateEmergencyStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const { status, assignedHospital, notes } = req.body;
  const patientId = req.user!.userId;

  const { resource: request } = await dbService.emergencyRequests
    .item(requestId, patientId)
    .read<EmergencyRequest>();

  if (!request) {
    throw new AppError('Demande non trouvée', 404);
  }

  const updatedRequest: EmergencyRequest = {
    ...request,
    status,
    ...(assignedHospital && { assignedHospital }),
    timeline: [
      ...request.timeline,
      {
        timestamp: new Date().toISOString(),
        event: `Statut changé en ${status}`,
        notes,
      },
    ],
    updatedAt: new Date().toISOString(),
    ...(status === EmergencyStatus.COMPLETED && {
      completedAt: new Date().toISOString(),
    }),
  };

  const { resource: updated } = await dbService.emergencyRequests
    .item(requestId, patientId)
    .replace(updatedRequest);

  res.status(200).json({
    success: true,
    message: 'Statut mis à jour',
    data: updated,
  });
});
