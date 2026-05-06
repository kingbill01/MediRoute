import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../config/database';
import { User, UserRole, UserStatus } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Générer un token JWT
const generateToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || '',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Inscription
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, role, profile, doctorInfo, patientInfo } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUserQuery = `SELECT * FROM c WHERE c.email = @email`;
  const { resources: existingUsers } = await dbService.users.items
    .query({
      query: existingUserQuery,
      parameters: [{ name: '@email', value: email }],
    })
    .fetchAll();

  if (existingUsers.length > 0) {
    throw new AppError('Un compte avec cet email existe déjà', 400);
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Créer l'utilisateur
  const userId = uuidv4();
  const newUser: User = {
    id: userId,
    userId,
    email,
    password: hashedPassword,
    role: role || UserRole.PATIENT,
    status: UserStatus.ACTIVE,
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      address: profile.address,
    },
    ...(role === UserRole.DOCTOR && doctorInfo && { doctorInfo }),
    ...(role === UserRole.PATIENT && patientInfo && { patientInfo }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { resource: createdUser } = await dbService.users.items.create(newUser);

  // Générer le token
  const token = generateToken(userId, email, newUser.role);

  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    data: {
      user: {
        userId: createdUser!.userId,
        email: createdUser!.email,
        role: createdUser!.role,
        profile: createdUser!.profile,
      },
      token,
    },
  });
});

// Connexion
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Trouver l'utilisateur
  const query = `SELECT * FROM c WHERE c.email = @email`;
  const { resources: users } = await dbService.users.items
    .query({
      query,
      parameters: [{ name: '@email', value: email }],
    })
    .fetchAll();

  if (users.length === 0) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const user = users[0] as User;

  // Vérifier le statut
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError('Votre compte est désactivé', 403);
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  // Générer le token
  const token = generateToken(user.userId, user.email, user.role);

  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        profile: user.profile,
        ...(user.role === UserRole.DOCTOR && { doctorInfo: user.doctorInfo }),
        ...(user.role === UserRole.PATIENT && { patientInfo: user.patientInfo }),
      },
      token,
    },
  });
});

// Obtenir le profil de l'utilisateur connecté
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;

  const { resource: user } = await dbService.users.item(userId, userId).read<User>();

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      userId: user.userId,
      email: user.email,
      role: user.role,
      profile: user.profile,
      ...(user.role === UserRole.DOCTOR && { doctorInfo: user.doctorInfo }),
      ...(user.role === UserRole.PATIENT && { patientInfo: user.patientInfo }),
    },
  });
});

// Mettre à jour le profil
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const updates = req.body;

  const { resource: user } = await dbService.users.item(userId, userId).read<User>();

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  // Mettre à jour les champs autorisés
  const updatedUser: User = {
    ...user,
    ...(updates.profile && { profile: { ...user.profile, ...updates.profile } }),
    ...(updates.doctorInfo && user.role === UserRole.DOCTOR && {
      doctorInfo: { ...user.doctorInfo, ...updates.doctorInfo },
    }),
    ...(updates.patientInfo && user.role === UserRole.PATIENT && {
      patientInfo: { ...user.patientInfo, ...updates.patientInfo },
    }),
    updatedAt: new Date().toISOString(),
  };

  const { resource: updated } = await dbService.users
    .item(userId, userId)
    .replace(updatedUser);

  res.status(200).json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      userId: updated!.userId,
      email: updated!.email,
      role: updated!.role,
      profile: updated!.profile,
    },
  });
});
