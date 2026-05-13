import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabasePostgres, disconnectDatabase } from './config/database-postgres';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { apiLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth-postgres.routes';
import appointmentRoutes from './routes/appointment-postgres.routes';
import hospitalRoutes from './routes/hospital-postgres.routes';
import emergencyRoutes from './routes/emergency-postgres.routes';
import adminRoutes from './routes/admin.routes';
import medicalRecordRoutes from './routes/medicalRecord-postgres.routes';
import vitalSignsRoutes from './routes/vitalSigns.routes';
import labResultRoutes from './routes/labResult.routes';
import bedManagementRoutes from './routes/bedManagement.routes';
import inventoryRoutes from './routes/inventory.routes';
import invoiceRoutes from './routes/invoice.routes';
import telemedicineRoutes from './routes/telemedicine.routes';
import messageRoutes from './routes/message.routes';
import subscriptionRoutes from './routes/subscription.routes';
import dependentRoutes from './routes/dependent.routes';
import chatbotRoutes from './routes/chatbot.routes';
import facilityRoutes from './routes/facility-registration.routes';
import doctorAffiliationsRoutes from './routes/doctor-affiliations.routes';

// Charger les variables d'environnement
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware de sécurité
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting global sur toutes les routes /api
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/vital-signs', vitalSignsRoutes);
app.use('/api/lab-results', labResultRoutes);
app.use('/api/beds', bedManagementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/dependents',    dependentRoutes);
app.use('/api/chatbot',       chatbotRoutes);
app.use('/api/facilities',          facilityRoutes);
app.use('/api/doctor-affiliations', doctorAffiliationsRoutes);

// Route 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Socket.io pour les notifications en temps réel
io.on('connection', (socket) => {
  logger.info(`Client connecté: ${socket.id}`);

  socket.on('join_room', (userId: string) => {
    socket.join(`user_${userId}`);
    logger.info(`Utilisateur ${userId} a rejoint sa room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client déconnecté: ${socket.id}`);
  });
});

// Rendre io accessible globalement
app.set('io', io);

// Initialisation de la base de données et démarrage du serveur
const startServer = async () => {
  // Vérification des variables d'environnement critiques
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    logger.error('❌ JWT_SECRET manquant ou trop court (32 caractères minimum requis)');
    process.exit(1);
  }

  try {
    // Initialiser la connexion à PostgreSQL
    await initializeDatabasePostgres();

    // Démarrer le serveur
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Serveur MediRoute démarré sur le port ${PORT}`);
      logger.info(`🌍 Environnement: ${process.env.NODE_ENV}`);
      logger.info(`🐘 Base de données: PostgreSQL`);
      logger.info(`📱 API disponible sur: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  logger.info('Arrêt du serveur...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Arrêt du serveur...');
  await disconnectDatabase();
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export { io };
