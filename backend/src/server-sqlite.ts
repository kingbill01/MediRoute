import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabasePostgres } from './config/database-postgres';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes pour Prisma/SQLite
import authRoutes from './routes/auth-postgres.routes';

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
    database: 'SQLite via Prisma',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes API
app.use('/api/auth', authRoutes);

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
    // Initialiser la connexion à SQLite via Prisma
    await initializeDatabasePostgres();

    // Démarrer le serveur
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Serveur MediRoute démarré sur le port ${PORT}`);
      logger.info(`🌍 Environnement: ${process.env.NODE_ENV}`);
      logger.info(`🗄️  Base de données: SQLite via Prisma`);
      logger.info(`📱 API disponible sur: http://localhost:${PORT}/api`);
      logger.info(`💊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🎨 Prisma Studio: http://localhost:5555`);
    });
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  logger.info('Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Arrêt du serveur...');
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
