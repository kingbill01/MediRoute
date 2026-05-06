import { CosmosClient, Database, Container } from '@azure/cosmos';
import { logger } from '../utils/logger';

// Configuration Cosmos DB
const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseId = process.env.COSMOS_DATABASE_ID || 'mediroute';

// Containers
const containersConfig = {
  users: {
    id: process.env.COSMOS_CONTAINER_USERS || 'users',
    partitionKey: '/userId',
  },
  appointments: {
    id: process.env.COSMOS_CONTAINER_APPOINTMENTS || 'appointments',
    partitionKey: '/patientId',
  },
  medicalRecords: {
    id: process.env.COSMOS_CONTAINER_MEDICAL_RECORDS || 'medical_records',
    partitionKey: '/patientId',
  },
  hospitals: {
    id: process.env.COSMOS_CONTAINER_HOSPITALS || 'hospitals',
    partitionKey: '/region',
  },
  emergencyRequests: {
    id: process.env.COSMOS_CONTAINER_EMERGENCY || 'emergency_requests',
    partitionKey: '/patientId',
  },
};

class DatabaseService {
  private client: CosmosClient;
  private database!: Database;
  public users!: Container;
  public appointments!: Container;
  public medicalRecords!: Container;
  public hospitals!: Container;
  public emergencyRequests!: Container;

  constructor() {
    this.client = new CosmosClient({ endpoint, key });
  }

  async initialize() {
    try {
      // Créer ou obtenir la base de données
      const { database } = await this.client.databases.createIfNotExists({
        id: databaseId,
      });
      this.database = database;
      logger.info(`Base de données "${databaseId}" prête`);

      // Créer ou obtenir les containers
      await this.createContainer('users', containersConfig.users);
      await this.createContainer('appointments', containersConfig.appointments);
      await this.createContainer('medicalRecords', containersConfig.medicalRecords);
      await this.createContainer('hospitals', containersConfig.hospitals);
      await this.createContainer('emergencyRequests', containersConfig.emergencyRequests);

      logger.info('✅ Tous les containers Cosmos DB sont prêts');
    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation de Cosmos DB:', error);
      throw error;
    }
  }

  private async createContainer(
    name: keyof typeof containersConfig,
    config: { id: string; partitionKey: string }
  ) {
    const { container } = await this.database.containers.createIfNotExists({
      id: config.id,
      partitionKey: {
        paths: [config.partitionKey],
        version: 2, // Utiliser Hierarchical Partition Keys (HPK)
      },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [{ path: '/*' }],
        excludedPaths: [{ path: '/"_etag"/?' }],
      },
    });

    this[name] = container;
    logger.info(`Container "${config.id}" prêt`);
  }

  // Méthode utilitaire pour obtenir un container
  getContainer(containerName: keyof typeof containersConfig): Container {
    return this[containerName];
  }
}

const dbService = new DatabaseService();

export const initializeDatabase = async () => {
  await dbService.initialize();
};

export { dbService };
