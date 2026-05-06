# Guide de Démarrage Rapide - MediRoute

Bienvenue sur MediRoute! Ce guide vous aidera à démarrer rapidement avec le développement local.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé:

- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **npm** ou **yarn**
- **Git**
- **Un compte Azure** (pour Cosmos DB) - ou utilisez l'émulateur local

## 🚀 Installation Rapide (5 minutes)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-org/mediroute.git
cd MediRoute
```

### 2. Installer toutes les dépendances

```bash
npm run install:all
```

Ou manuellement pour chaque projet:

```bash
# Backend
cd backend
npm install

# Web
cd ../web
npm install

# Mobile
cd ../mobile
npm install
```

### 3. Configuration de la base de données

#### Option A: Azure Cosmos DB (Recommandé pour la production)

1. Créez un compte Azure Cosmos DB
2. Copiez le fichier de configuration:

```bash
cd backend
cp .env.example .env
```

3. Éditez `.env` avec vos informations:

```env
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key
COSMOS_DATABASE_ID=mediroute
JWT_SECRET=votre-secret-unique-ici
```

#### Option B: Émulateur Cosmos DB Local (Pour le développement)

```bash
# macOS avec Docker
docker pull mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
docker run -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 \
  -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 \
  -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator

# Ou télécharger l'émulateur Windows
# https://learn.microsoft.com/azure/cosmos-db/local-emulator
```

Configuration pour l'émulateur dans `.env`:

```env
COSMOS_ENDPOINT=https://localhost:8081/
COSMOS_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
COSMOS_DATABASE_ID=mediroute
JWT_SECRET=dev-secret-change-in-production
```

### 4. Démarrer le Backend

```bash
cd backend
npm run dev
```

Le serveur démarre sur http://localhost:5000

Vérifiez: http://localhost:5000/health

### 5. Démarrer l'Application Web

Dans un nouveau terminal:

```bash
cd web
npm start
```

L'application web s'ouvre sur http://localhost:3000

### 6. Démarrer l'Application Mobile (Optionnel)

```bash
cd mobile
npm start
```

Scannez le QR code avec l'app Expo Go sur votre téléphone.

## 🎯 Tester l'Application

### Test 1: Créer un compte

1. Ouvrez http://localhost:3000
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire
4. Connectez-vous

### Test 2: Tester le Formulaire d'Urgence

1. Sur la page de connexion, cliquez sur "🚨 URGENCE MÉDICALE"
2. Répondez aux questions
3. Autorisez la géolocalisation
4. Soumettez le formulaire

Vous verrez les hôpitaux proches (même si la base est vide pour le moment).

### Test 3: Utiliser l'API directement

```bash
# Test de santé
curl http://localhost:5000/health

# Inscription
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "role": "patient",
    "profile": {
      "firstName": "Test",
      "lastName": "User",
      "phone": "+221771234567",
      "address": {
        "city": "Dakar",
        "region": "Dakar"
      }
    }
  }'
```

## 📊 Ajouter des Données de Test

### Créer un script de seed

Créez `backend/scripts/seed.ts`:

```typescript
import { dbService, initializeDatabase } from '../src/config/database';
import { Hospital, HospitalType } from '../src/models/Hospital';

async function seed() {
  await initializeDatabase();

  // Ajouter un hôpital de test
  const hospital: Hospital = {
    id: 'hospital-1',
    region: 'Dakar',
    name: 'Hôpital Principal de Dakar',
    type: HospitalType.PUBLIC,
    contact: {
      phone: '+221 33 839 50 50',
      emergencyPhone: '+221 33 839 50 00',
    },
    location: {
      address: '1 Avenue Nelson Mandela',
      city: 'Dakar',
      region: 'Dakar',
      coordinates: {
        latitude: 14.6937,
        longitude: -17.4441,
      },
    },
    services: ['Urgences', 'Chirurgie', 'Maternité'],
    specializations: ['Médecine générale', 'Chirurgie'],
    availability: {
      totalBeds: 500,
      availableBeds: 120,
      emergencyAvailable: true,
      ambulanceAvailable: true,
    },
    openingHours: [],
    facilities: ['Scanner', 'Laboratoire'],
    emergencyCapacity: {
      canAcceptEmergency: true,
      waitingTime: 15,
      lastUpdated: new Date().toISOString(),
    },
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dbService.hospitals.items.create(hospital);
  console.log('✅ Hôpital créé!');
}

seed().catch(console.error);
```

Ajoutez dans `package.json`:

```json
{
  "scripts": {
    "seed": "ts-node scripts/seed.ts"
  }
}
```

Exécutez:

```bash
npm run seed
```

## 🔧 Commandes Utiles

### Backend

```bash
npm run dev          # Démarrer en mode développement
npm run build        # Compiler TypeScript
npm start           # Démarrer en production
npm run lint        # Vérifier le code
npm test            # Lancer les tests
```

### Web

```bash
npm start           # Démarrer le serveur de développement
npm run build       # Build de production
npm test            # Lancer les tests
```

### Mobile

```bash
npm start           # Démarrer Expo
npm run android     # Ouvrir sur Android
npm run ios         # Ouvrir sur iOS
```

## 📱 Tester sur Mobile

### Android

1. Installez [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) sur votre téléphone
2. Lancez `npm start` dans le dossier mobile
3. Scannez le QR code avec Expo Go

### iOS

1. Installez [Expo Go](https://apps.apple.com/app/expo-go/id982107779) sur votre iPhone
2. Lancez `npm start` dans le dossier mobile
3. Scannez le QR code avec l'appareil photo

## 🐛 Dépannage

### Erreur: "Cannot connect to Cosmos DB"

- Vérifiez que l'émulateur est démarré
- Vérifiez les variables dans `.env`
- Désactivez le firewall temporairement

### Erreur: "Port 5000 already in use"

```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Ou changez le port dans .env
PORT=5001
```

### Erreur: "Module not found"

```bash
# Réinstallez les dépendances
rm -rf node_modules package-lock.json
npm install
```

### L'app mobile ne se connecte pas au backend

1. Sur l'émulateur: utilisez `localhost`
2. Sur un vrai appareil: utilisez l'IP de votre ordinateur

```typescript
// mobile/src/config/constants.ts
export const API_BASE_URL = 'http://192.168.1.X:5000/api'; // Votre IP locale
```

## 📚 Ressources

- [Documentation complète](./docs/)
- [Guide utilisateur](./docs/USER_GUIDE.md)
- [Documentation API](./docs/api/API_DOCUMENTATION.md)
- [Guide de déploiement](./docs/deployment/DEPLOYMENT_GUIDE.md)

## 🎓 Prochaines Étapes

1. ✅ Explorez le code source
2. 📖 Lisez la documentation API
3. 🏥 Ajoutez plus d'hôpitaux du Sénégal
4. 👨‍⚕️ Testez les fonctionnalités médecin
5. 🚀 Déployez sur Azure

## 💬 Besoin d'Aide?

- 📧 Email: dev@mediroute.sn
- 💬 Slack: #mediroute-dev
- 📝 Issues: GitHub Issues

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

---

**Bon développement! 🚀**

Pour toute question, consultez la documentation ou contactez l'équipe.
