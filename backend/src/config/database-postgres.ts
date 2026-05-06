import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export const initializeDatabasePostgres = async () => {
  try {
    // Tester la connexion
    await prisma.$connect();
    logger.info('✅ Connexion à PostgreSQL établie');
    
    // Vérifier que les tables existent
    const userCount = await prisma.user.count();
    logger.info(`📊 Base de données prête (${userCount} utilisateurs)`);
  } catch (error) {
    logger.error('❌ Erreur lors de la connexion à PostgreSQL:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Déconnexion de PostgreSQL');
};

export { prisma };
