import { Request, Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const EMERGENCY_FORM_QUESTIONS = [
  {
    id: 'patient_identity', step: 1,
    section: 'Identité du patient',
    question: 'Informations du patient',
    type: 'patient_info',
    field: null,
  },
  {
    id: 'consciousness', step: 2,
    section: 'État de conscience',
    question: 'Quel est l\'état de conscience du patient ?',
    type: 'single_choice',
    field: 'consciousness',
    options: [
      'Conscient et orienté',
      'Conscient mais confus / désorienté',
      'Répond uniquement à la voix',
      'Répond uniquement à la douleur',
      'Inconscient (ne répond pas)',
    ],
  },
  {
    id: 'breathing', step: 3,
    section: 'Respiration',
    question: 'Comment est la respiration du patient ?',
    type: 'single_choice',
    field: 'breathing',
    options: [
      'Normale',
      'Difficile / haletante',
      'Très rapide',
      'Très lente',
      'Absente (arrêt respiratoire)',
    ],
  },
  {
    id: 'chest_pain', step: 4,
    section: 'Douleur thoracique',
    question: 'Le patient souffre-t-il de douleurs dans la poitrine ?',
    type: 'single_choice',
    field: 'chestPain',
    options: [
      'Non',
      'Oui, légère',
      'Oui, intense',
      'Oui, irradiant vers le bras ou la mâchoire',
    ],
  },
  {
    id: 'injury', step: 5,
    section: 'Blessures & Saignements',
    question: 'Y a-t-il des blessures visibles ou des saignements ?',
    type: 'single_choice',
    field: 'injury',
    options: [
      'Non, aucune blessure',
      'Blessures légères sans saignement',
      'Saignement léger (contrôlable)',
      'Saignement abondant (difficile à contrôler)',
      'Traumatisme grave (fracture suspectée)',
    ],
  },
  {
    id: 'symptoms', step: 6,
    section: 'Symptômes principaux',
    question: 'Quels symptômes présente le patient ? (plusieurs choix possibles)',
    type: 'multiple_choice',
    field: 'symptoms',
    options: [
      'Douleur thoracique',
      'Difficultés respiratoires',
      'Perte de conscience',
      'Convulsions',
      'Douleur abdominale intense',
      'AVC suspecté (paralysie, troubles de la parole)',
      'Traumatisme / chute',
      'Réaction allergique grave',
      'Fièvre très élevée',
      'Vomissements / diarrhée sévère',
      'Saignement',
      'Autre',
    ],
  },
  {
    id: 'duration', step: 7,
    section: 'Durée des symptômes',
    question: 'Depuis combien de temps durent les symptômes ?',
    type: 'single_choice',
    field: 'duration',
    options: [
      'Moins de 30 minutes',
      '30 minutes à 2 heures',
      '2 à 6 heures',
      'Plus de 6 heures',
      'Inconnu',
    ],
  },
  {
    id: 'medical_history', step: 8,
    section: 'Antécédents médicaux',
    question: 'Le patient a-t-il des pathologies chroniques connues ?',
    type: 'multiple_choice',
    field: 'medicalHistory',
    options: [
      'Diabète',
      'Hypertension artérielle',
      'Maladies cardiaques',
      'Asthme / maladies respiratoires',
      'Épilepsie',
      'Grossesse',
      'Drépanocytose',
      'Aucune',
    ],
  },
  {
    id: 'medications', step: 9,
    section: 'Médicaments & Allergies',
    question: 'Médicaments en cours et allergies connues (si applicable)',
    type: 'text',
    field: 'medications',
    placeholder: 'Ex : Metformine 500mg, allergie à la pénicilline…',
  },
  {
    id: 'mobility', step: 10,
    section: 'Mobilité',
    question: 'Le patient peut-il se déplacer ?',
    type: 'single_choice',
    field: 'canMove',
    options: [
      'Oui, marche seul',
      'Oui, avec aide',
      'Non, ne peut pas bouger',
      'Non, immobilisé (fracture suspectée)',
    ],
  },
  {
    id: 'ambulance', step: 11,
    section: 'Transport',
    question: 'Avez-vous besoin d\'une ambulance ?',
    type: 'single_choice',
    field: 'needsAmbulance',
    options: [
      'Oui, d\'urgence',
      'Oui, mais sans extrême urgence',
      'Non, je peux me déplacer',
    ],
  },
  {
    id: 'description', step: 12,
    section: 'Description de la situation',
    question: 'Décrivez brièvement la situation d\'urgence',
    type: 'text',
    field: 'description',
    placeholder: 'Ex : La personne a chuté, elle est consciente mais ne peut pas bouger la jambe droite…',
  },
  {
    id: 'location', step: 13,
    section: 'Localisation',
    question: 'Où se trouve le patient ?',
    type: 'location',
    field: 'location',
  },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcPriorityScore(data: any): number {
  let score = 3;

  // Consciousness (AVPU scale)
  if (data.consciousness?.includes('Inconscient')) score += 4;
  else if (data.consciousness?.includes('douleur')) score += 3;
  else if (data.consciousness?.includes('voix')) score += 2;
  else if (data.consciousness?.includes('confus')) score += 1;
  else if (!data.isConscious) score += 4;

  // Breathing
  if (data.breathing?.includes('Absente')) score += 5;
  else if (data.breathing?.includes('Très lente')) score += 3;
  else if (data.breathing?.includes('Difficile')) score += 2;
  else if (data.breathing?.includes('Très rapide')) score += 1;

  // Injury / Bleeding
  if (data.injury?.includes('abondant') || data.injury?.includes('grave')) score += 3;
  else if (data.injury?.includes('léger')) score += 1;
  else if (data.hasInjury) score += 2;

  // Chest pain
  if (data.chestPain?.includes('irradiant')) score += 3;
  else if (data.chestPain?.includes('intense')) score += 2;
  else if (data.chestPain?.includes('légère')) score += 1;

  // Level override for backward compat
  if (data.level === 'CRITICAL') score = Math.max(score, 9);
  if (data.level === 'URGENT')   score = Math.max(score, 6);

  return Math.min(score, 10);
}

function deriveLevelFromAnswers(data: any): string {
  if (
    data.consciousness?.includes('Inconscient') ||
    data.breathing?.includes('Absente') ||
    data.chestPain?.includes('irradiant') ||
    data.injury?.includes('abondant')
  ) return 'CRITICAL';

  if (
    data.consciousness?.includes('douleur') ||
    data.consciousness?.includes('voix') ||
    data.breathing?.includes('Difficile') ||
    data.breathing?.includes('Très') ||
    data.injury?.includes('grave') ||
    data.chestPain?.includes('intense')
  ) return 'URGENT';

  return 'SEMI_URGENT';
}

export const getEmergencyForm = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: { questions: EMERGENCY_FORM_QUESTIONS } });
});

export const getNearbyHospitals = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = '20' } = req.query;

  if (!latitude || !longitude) {
    throw new AppError('Latitude et longitude requis', 400);
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const maxRadius = parseFloat(radius as string);

  const hospitals = await prisma.hospital.findMany({
    where: { canAcceptEmergency: true },
    orderBy: { waitingTime: 'asc' },
  });

  const nearby = hospitals
    .map((h) => ({
      ...h,
      distance: Math.round(haversineDistance(lat, lng, h.latitude, h.longitude) * 10) / 10,
      estimatedArrival: Math.round((haversineDistance(lat, lng, h.latitude, h.longitude) / 60) * 60 + (h.waitingTime || 0)),
    }))
    .filter((h) => h.distance <= maxRadius)
    .sort((a, b) => a.distance - b.distance);

  res.json({ success: true, data: nearby, total: nearby.length });
});

export const submitEmergencyRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    patientName, patientAge, patientGender, patientPhone, bloodGroup,
    address, city, region, latitude, longitude,
    symptoms, description, hasInjury, isConscious,
    // New detailed fields from updated form
    consciousness, breathing, chestPain, injury, canMove: canMoveRaw,
    needsAmbulance: needsAmbulanceRaw, medicalHistory, medications, duration,
    formResponses,
  } = req.body;

  if (!patientName || !patientPhone || !city || !region || !latitude || !longitude) {
    throw new AppError('Informations patient et localisation requises', 400);
  }

  // Derive boolean fields from rich form answers (fall back to legacy booleans)
  const derivedIsConscious = consciousness
    ? !consciousness.includes('Inconscient')
    : (isConscious !== false);
  const derivedHasInjury = injury
    ? injury !== 'Non, aucune blessure'
    : !!hasInjury;
  const derivedCanMove = canMoveRaw
    ? canMoveRaw === 'Oui, marche seul'
    : true;
  const derivedNeedsAmbulance = needsAmbulanceRaw
    ? needsAmbulanceRaw.startsWith('Oui')
    : false;
  const derivedLevel = deriveLevelFromAnswers({ consciousness, breathing, chestPain, injury });

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  // Trouver l'hôpital le plus proche acceptant les urgences
  const hospitals = await prisma.hospital.findMany({
    where: { canAcceptEmergency: true, emergencyAvailable: true },
  });

  let assignedHospital = null;
  let minDistance = Infinity;

  for (const h of hospitals) {
    const dist = haversineDistance(lat, lng, h.latitude, h.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      assignedHospital = h;
    }
  }

  const priorityScore = calcPriorityScore({
    consciousness, breathing, chestPain, injury,
    isConscious, hasInjury,
  });

  const enrichedFormResponses = {
    ...(typeof formResponses === 'object' ? formResponses : {}),
    consciousness, breathing, chestPain, injury,
    medicalHistory, medications, duration,
  };

  const emergencyRequest = await prisma.emergencyRequest.create({
    data: {
      patientId: req.user?.userId || null,
      patientName,
      patientAge: patientAge ? parseInt(patientAge) : null,
      patientGender: patientGender || null,
      patientPhone,
      bloodGroup: bloodGroup || null,
      address: address || null,
      city,
      region,
      latitude: lat,
      longitude: lng,
      symptoms: Array.isArray(symptoms) ? symptoms.join(',') : (symptoms || ''),
      description: description || '',
      level: derivedLevel,
      hasInjury: derivedHasInjury,
      isConscious: derivedIsConscious,
      canMove: derivedCanMove,
      needsAmbulance: derivedNeedsAmbulance,
      assignedHospitalId: assignedHospital?.id || null,
      distance: assignedHospital ? Math.round(minDistance * 10) / 10 : null,
      estimatedArrival: assignedHospital
        ? Math.round((minDistance / 60) * 60 + (assignedHospital.waitingTime || 0))
        : null,
      status: assignedHospital ? 'ASSIGNED' : 'PENDING',
      priorityScore,
      formResponses: JSON.stringify(enrichedFormResponses),
      timeline: JSON.stringify([{ status: 'CREATED', timestamp: new Date().toISOString() }]),
    },
    include: { assignedHospital: true },
  });

  res.status(201).json({
    success: true,
    message: 'Demande d\'urgence envoyée',
    data: {
      requestId: emergencyRequest.id,
      status: emergencyRequest.status,
      priorityScore: emergencyRequest.priorityScore,
      assignedHospital: emergencyRequest.assignedHospital
        ? {
            name: emergencyRequest.assignedHospital.name,
            address: emergencyRequest.assignedHospital.address,
            phone: emergencyRequest.assignedHospital.emergencyPhone,
            distance: emergencyRequest.distance,
            estimatedArrival: emergencyRequest.estimatedArrival,
          }
        : null,
    },
  });
});

export const getEmergencyHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const isAdmin = (role as string) === 'ADMIN';

  const requests = await prisma.emergencyRequest.findMany({
    where: isAdmin ? {} : { patientId: userId },
    include: { assignedHospital: { select: { name: true, phone: true, address: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ success: true, data: requests, total: requests.length });
});

// ── Urgences prioritaires (souscription requise) ─────────────────────────────
const ACTIVE_EMERGENCY_LIMIT = 4;
const ACTIVE_STATUSES = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'ARRIVED'];

const countActiveEmergencies = async (patientId: string): Promise<number> => {
  return prisma.emergencyRequest.count({
    where: { patientId, status: { in: ACTIVE_STATUSES } },
  });
};

export const getActiveEmergencyCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const active = await countActiveEmergencies(userId);
  res.json({
    success: true,
    data: { active, limit: ACTIVE_EMERGENCY_LIMIT, remaining: Math.max(0, ACTIVE_EMERGENCY_LIMIT - active) },
  });
});

export const submitQuickEmergencyRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const {
    latitude, longitude, address,
    description, needsAmbulance, severity, // severity: CRITICAL | URGENT | SEMI_URGENT
    forDependentName,
  } = req.body;

  if (latitude === undefined || longitude === undefined) {
    throw new AppError('Localisation (latitude, longitude) requise', 400);
  }

  const active = await countActiveEmergencies(userId);
  if (active >= ACTIVE_EMERGENCY_LIMIT) {
    res.status(429).json({
      success: false,
      code: 'EMERGENCY_LIMIT_REACHED',
      message: `Limite de ${ACTIVE_EMERGENCY_LIMIT} urgences actives atteinte. Veuillez attendre la prise en charge des demandes en cours.`,
      data: { active, limit: ACTIVE_EMERGENCY_LIMIT },
    });
    return;
  }

  // Auto-remplir avec le profil patient
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patientInfo: true },
  });
  if (!user) throw new AppError('Utilisateur introuvable', 404);

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const level = ['CRITICAL', 'URGENT', 'SEMI_URGENT'].includes(severity) ? severity : 'URGENT';
  const wantsAmbulance = needsAmbulance !== false;

  // Trouver l'hôpital le plus proche
  const hospitals = await prisma.hospital.findMany({
    where: { canAcceptEmergency: true, emergencyAvailable: true },
  });
  let assignedHospital: any = null;
  let minDistance = Infinity;
  for (const h of hospitals) {
    const d = haversineDistance(lat, lng, h.latitude, h.longitude);
    if (d < minDistance) { minDistance = d; assignedHospital = h; }
  }

  // Score prioritaire : patients souscrits boostés
  const baseScore = level === 'CRITICAL' ? 9 : level === 'URGENT' ? 7 : 5;
  const priorityScore = Math.min(10, baseScore + 1); // +1 priorité abonné

  const patientName = forDependentName
    ? `${user.firstName} ${user.lastName} (pour ${forDependentName})`
    : `${user.firstName} ${user.lastName}`;

  const created = await prisma.emergencyRequest.create({
    data: {
      patientId: userId,
      patientName,
      patientPhone: user.phone,
      bloodGroup: user.patientInfo?.bloodGroup || null,
      address: address || null,
      city: user.city,
      region: user.region,
      latitude: lat,
      longitude: lng,
      symptoms: '',
      description: description || 'Demande prioritaire depuis le profil souscripteur',
      level,
      hasInjury: false,
      isConscious: true,
      canMove: !wantsAmbulance,
      needsAmbulance: wantsAmbulance,
      assignedHospitalId: assignedHospital?.id || null,
      distance: assignedHospital ? Math.round(minDistance * 10) / 10 : null,
      estimatedArrival: assignedHospital
        ? Math.round((minDistance / 60) * 60 + (assignedHospital.waitingTime || 0))
        : null,
      status: assignedHospital ? 'ASSIGNED' : 'PENDING',
      priorityScore,
      formResponses: JSON.stringify({
        source: 'profile_quick',
        subscriber: true,
        allergies: user.patientInfo?.allergies || null,
        chronicConditions: user.patientInfo?.chronicConditions || null,
        emergencyContact: user.patientInfo?.emergencyContactPhone || null,
      }),
      timeline: JSON.stringify([
        { status: 'CREATED', source: 'profile_quick', timestamp: new Date().toISOString() },
      ]),
    },
    include: { assignedHospital: true },
  });

  res.status(201).json({
    success: true,
    message: 'Demande prioritaire envoyée. Prise en charge en cours.',
    data: {
      requestId: created.id,
      status: created.status,
      priorityScore: created.priorityScore,
      level: created.level,
      assignedHospital: created.assignedHospital
        ? {
            name: created.assignedHospital.name,
            address: created.assignedHospital.address,
            phone: created.assignedHospital.emergencyPhone,
            distance: created.distance,
            estimatedArrival: created.estimatedArrival,
          }
        : null,
      active: active + 1,
      limit: ACTIVE_EMERGENCY_LIMIT,
    },
  });
});

export const updateEmergencyStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role as string;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
    throw new AppError('Accès non autorisé', 403);
  }

  const { status } = req.body;
  const existing = await prisma.emergencyRequest.findUnique({ where: { id: req.params.requestId } });
  if (!existing) throw new AppError('Demande non trouvée', 404);

  const currentTimeline = JSON.parse(existing.timeline || '[]');
  currentTimeline.push({ status, timestamp: new Date().toISOString() });

  const updated = await prisma.emergencyRequest.update({
    where: { id: req.params.requestId },
    data: {
      status,
      timeline: JSON.stringify(currentTimeline),
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
    },
  });

  res.json({ success: true, message: 'Statut mis à jour', data: updated });
});
