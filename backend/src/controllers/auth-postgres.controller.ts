import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Types pour les rôles et statuts (remplace les enums Prisma)
const UserRole = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  ADMIN: 'ADMIN',
} as const;

const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

// Générer un token JWT
const generateToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  
  return jwt.sign(
    { userId, email, role },
    secret,
    { expiresIn: '7d' }
  );
};

// Inscription
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, role, profile, doctorInfo, patientInfo } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('Un compte avec cet email existe déjà', 400);
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Créer l'utilisateur avec les informations associées
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: role || 'PATIENT',
      status: 'ACTIVE',
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
      gender: profile.gender?.toUpperCase(),
      street: profile.address?.street,
      city: profile.address?.city || 'Dakar',
      region: profile.address?.region || 'Dakar',
      country: profile.address?.country || 'Sénégal',
      profileImage: profile.profileImage,
      // Créer les infos spécifiques selon le rôle
      ...(role === 'DOCTOR' && doctorInfo && {
        doctorInfo: {
          create: {
            specialization: doctorInfo.specialization,
            licenseNumber: doctorInfo.licenseNumber,
            hospitalAffiliation: doctorInfo.hospitalAffiliation,
            consultationFee: doctorInfo.consultationFee,
            yearsOfExperience: doctorInfo.yearsOfExperience,
            bio: doctorInfo.bio,
            availabilities: {
              create: doctorInfo.availableHours?.map((hour: any) => ({
                dayOfWeek: hour.day,
                startTime: hour.startTime,
                endTime: hour.endTime,
              })) || [],
            },
          },
        },
      }),
      ...(role === 'PATIENT' && patientInfo && {
        patientInfo: {
          create: {
            bloodGroup: patientInfo.bloodGroup || undefined,
            allergies: Array.isArray(patientInfo.allergies) ? patientInfo.allergies.join(', ') : (patientInfo.allergies || undefined),
            chronicConditions: Array.isArray(patientInfo.chronicConditions) ? patientInfo.chronicConditions.join(', ') : (patientInfo.chronicConditions || undefined),
            emergencyContactName: patientInfo.emergencyContact?.name,
            emergencyContactPhone: patientInfo.emergencyContact?.phone,
            emergencyContactRelationship: patientInfo.emergencyContact?.relationship,
          },
        },
      }),
    },
    include: {
      doctorInfo: true,
      patientInfo: true,
    },
  });

  // Générer le token
  const token = generateToken(user.id, user.email, user.role);

  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    data: {
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          city: user.city,
          region: user.region,
        },
        ...(user.doctorInfo && { doctorInfo: user.doctorInfo }),
        ...(user.patientInfo && { patientInfo: user.patientInfo }),
      },
      token,
    },
  });
});

// Connexion
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      doctorInfo: {
        include: {
          availabilities: true,
        },
      },
      patientInfo: true,
    },
  });

  if (!user) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  // Vérifier le statut
 if (user.status !== 'ACTIVE') {
    throw new AppError('Votre compte est désactivé', 403);
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  // Générer le token
  const token = generateToken(user.id, user.email, user.role);

  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          city: user.city,
          region: user.region,
        },
        ...(user.doctorInfo && { 
          doctorInfo: {
            ...user.doctorInfo,
            availableHours: user.doctorInfo.availabilities,
          },
        }),
        ...(user.patientInfo && { patientInfo: user.patientInfo }),
      },
      token,
    },
  });
});

// Obtenir le profil
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      doctorInfo: {
        include: {
          availabilities: true,
        },
      },
      patientInfo: true,
    },
  });

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      userId: user.id,
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        city: user.city,
        region: user.region,
        profileImage: user.profileImage,
      },
      ...(user.doctorInfo && { doctorInfo: user.doctorInfo }),
      ...(user.patientInfo && { patientInfo: user.patientInfo }),
    },
  });
});

// Mettre à jour le profil
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const userRole = role as string;
  const { profile, doctorInfo, patientInfo } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(profile && {
        ...(profile.firstName !== undefined && { firstName: profile.firstName }),
        ...(profile.lastName  !== undefined && { lastName:  profile.lastName  }),
        ...(profile.phone     !== undefined && { phone:     profile.phone     }),
        ...(profile.city      !== undefined && { city:      profile.city      }),
        ...(profile.region    !== undefined && { region:    profile.region    }),
        ...(profile.dateOfBirth && { dateOfBirth: new Date(profile.dateOfBirth) }),
      }),
      ...(userRole === 'DOCTOR' && doctorInfo && {
        doctorInfo: {
          update: {
            ...(doctorInfo.bio                 !== undefined && { bio:                 doctorInfo.bio                 }),
            ...(doctorInfo.consultationFee     !== undefined && { consultationFee:     doctorInfo.consultationFee     }),
            ...(doctorInfo.hospitalAffiliation !== undefined && { hospitalAffiliation: doctorInfo.hospitalAffiliation }),
            ...(doctorInfo.yearsOfExperience   !== undefined && { yearsOfExperience:   doctorInfo.yearsOfExperience   }),
          },
        },
      }),
      ...(userRole === 'PATIENT' && patientInfo && {
        patientInfo: {
          upsert: {
            create: {
              bloodGroup:                    patientInfo.bloodGroup                    || undefined,
              allergies:                     patientInfo.allergies                     || undefined,
              chronicConditions:             patientInfo.chronicConditions             || undefined,
              emergencyContactName:          patientInfo.emergencyContactName          || undefined,
              emergencyContactPhone:         patientInfo.emergencyContactPhone         || undefined,
              emergencyContactRelationship:  patientInfo.emergencyContactRelationship  || undefined,
            },
            update: {
              ...(patientInfo.bloodGroup                   !== undefined && { bloodGroup:                   patientInfo.bloodGroup                   }),
              ...(patientInfo.allergies                    !== undefined && { allergies:                    patientInfo.allergies                    }),
              ...(patientInfo.chronicConditions            !== undefined && { chronicConditions:            patientInfo.chronicConditions            }),
              ...(patientInfo.emergencyContactName         !== undefined && { emergencyContactName:         patientInfo.emergencyContactName         }),
              ...(patientInfo.emergencyContactPhone        !== undefined && { emergencyContactPhone:        patientInfo.emergencyContactPhone        }),
              ...(patientInfo.emergencyContactRelationship !== undefined && { emergencyContactRelationship: patientInfo.emergencyContactRelationship }),
            },
          },
        },
      }),
    },
    include: { doctorInfo: true, patientInfo: true },
  });

  res.status(200).json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      userId: user.id,
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone,
        city:      user.city,
        region:    user.region,
        dateOfBirth: user.dateOfBirth,
        gender:    user.gender,
      },
      ...(user.doctorInfo  && { doctorInfo:  user.doctorInfo  }),
      ...(user.patientInfo && { patientInfo: user.patientInfo }),
    },
  });
});

// Changer le mot de passe
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) throw new AppError('Champs requis manquants', 400);
  if (newPassword.length < 8) throw new AppError('Le nouveau mot de passe doit contenir au moins 8 caractères', 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Utilisateur non trouvé', 404);

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new AppError('Mot de passe actuel incorrect', 401);

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
});
