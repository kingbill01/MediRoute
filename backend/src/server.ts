import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import appointmentRoutes from './routes/appointment.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';
import hospitalRoutes from './routes/hospital.routes';
import emergencyRoutes from './routes/emergency.routes';

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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);

// Route 404
app.use((req: Request, res: Response) => {
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
  try {
    // Initialiser la connexion à Cosmos DB
    await initializeDatabase();
    logger.info('✅ Connexion à Azure Cosmos DB établie');

    // Démarrer le serveur
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Serveur MediRoute démarré sur le port ${PORT}`);
      logger.info(`🌍 Environnement: ${process.env.NODE_ENV}`);
      logger.info(`📱 API disponible sur: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

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
