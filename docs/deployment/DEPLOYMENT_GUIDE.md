# Guide de Déploiement MediRoute

## 📋 Prérequis

### Comptes nécessaires
- Compte Azure (pour Cosmos DB, App Service, Maps)
- Compte GitHub (pour le code source)
- Node.js 18+ installé localement

### Services Azure à créer
1. **Azure Cosmos DB**
   - Type: NoSQL (API Core SQL)
   - Région: West Europe ou proche du Sénégal
   - Mode de capacité: Provisionnée ou Serverless (pour démarrer)

2. **Azure App Service**
   - Plan: B1 ou supérieur
   - Runtime: Node.js 18 LTS

3. **Azure Maps** (pour la géolocalisation)

4. **Azure Blob Storage** (pour les fichiers médicaux)

## 🚀 Déploiement Backend

### 1. Configuration Azure Cosmos DB

```bash
# Créer un compte Cosmos DB
az cosmosdb create \
  --name mediroute-cosmos \
  --resource-group mediroute-rg \
  --default-consistency-level Session \
  --locations regionName=WestEurope

# Récupérer les clés
az cosmosdb keys list \
  --name mediroute-cosmos \
  --resource-group mediroute-rg
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` dans le dossier `backend/`:

```env
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key
COSMOS_DATABASE_ID=mediroute
JWT_SECRET=your-secret-key-here
AZURE_MAPS_KEY=your-maps-key
NODE_ENV=production
PORT=5000
```

### 3. Déployer sur Azure App Service

```bash
# Se connecter à Azure
az login

# Créer un App Service Plan
az appservice plan create \
  --name mediroute-plan \
  --resource-group mediroute-rg \
  --sku B1 \
  --is-linux

# Créer une Web App
az webapp create \
  --resource-group mediroute-rg \
  --plan mediroute-plan \
  --name mediroute-api \
  --runtime "NODE|18-lts"

# Configurer les variables d'environnement
az webapp config appsettings set \
  --resource-group mediroute-rg \
  --name mediroute-api \
  --settings @appsettings.json

# Déployer le code
cd backend
npm run build
az webapp deployment source config-zip \
  --resource-group mediroute-rg \
  --name mediroute-api \
  --src dist.zip
```

## 🌐 Déploiement Frontend Web

### Option 1: Azure Static Web Apps

```bash
# Installer Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Se connecter et déployer
cd web
npm run build
swa deploy ./build --app-name mediroute-web
```

### Option 2: Vercel (alternative)

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
cd web
vercel --prod
```

## 📱 Déploiement Mobile

### Android

1. Configurer `app.json` avec les bonnes clés
2. Build de production:

```bash
cd mobile
eas build --platform android
```

3. Télécharger l'APK et le soumettre au Google Play Store

### iOS

1. Configurer le provisioning profile
2. Build de production:

```bash
cd mobile
eas build --platform ios
```

3. Soumettre à l'App Store via Xcode

## 🗄️ Initialisation de la Base de Données

### Créer des données de test

```bash
# Se connecter au backend
cd backend

# Exécuter les scripts de seed
npm run seed
```

### Ajouter des hôpitaux du Sénégal

Créer un script `backend/scripts/seedHospitals.ts`:

```typescript
import { dbService } from '../src/config/database';
import { Hospital, HospitalType } from '../src/models/Hospital';

const hospitals: Partial<Hospital>[] = [
  {
    name: "Hôpital Principal de Dakar",
    type: HospitalType.PUBLIC,
    region: "Dakar",
    location: {
      address: "1 Avenue Nelson Mandela",
      city: "Dakar",
      region: "Dakar",
      coordinates: {
        latitude: 14.6937,
        longitude: -17.4441
      }
    },
    contact: {
      phone: "+221 33 839 50 50",
      emergencyPhone: "+221 33 839 50 00"
    },
    // ... autres champs
  },
  // Ajouter d'autres hôpitaux
];
```

## 🔒 Sécurité

### Configuration SSL/TLS
- Utiliser Azure App Service avec HTTPS automatique
- Forcer HTTPS uniquement

### Secrets
- Utiliser Azure Key Vault pour stocker les secrets
- Ne jamais committer les fichiers `.env`

### CORS
Configurer CORS pour autoriser uniquement vos domaines:

```typescript
app.use(cors({
  origin: ['https://mediroute.com', 'https://app.mediroute.com'],
  credentials: true
}));
```

## 📊 Monitoring

### Application Insights

```bash
# Installer
npm install applicationinsights

# Configurer dans server.ts
import * as appInsights from 'applicationinsights';
appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING)
  .start();
```

### Logs
- Les logs sont automatiquement envoyés à Azure Monitor
- Consulter via le portail Azure

## 🔄 CI/CD avec GitHub Actions

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Build
        run: |
          cd backend
          npm run build
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: mediroute-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./backend/dist
```

## 🧪 Tests avant Production

### Tests de charge
```bash
# Utiliser Artillery
npm install -g artillery
artillery quick --count 100 --num 10 https://mediroute-api.azurewebsites.net/health
```

### Tests de sécurité
```bash
# Scanner avec OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://mediroute-api.azurewebsites.net
```

## 📱 Distribution des Apps

### Android
1. Générer un keystore
2. Signer l'APK
3. Télécharger sur Google Play Console

### iOS
1. Configurer Apple Developer Account
2. Créer un App ID
3. Soumettre via App Store Connect

## 🔧 Maintenance

### Mises à jour
- Planifier des mises à jour mensuelles
- Tester en staging avant production
- Utiliser des slots de déploiement Azure

### Backups
- Activer les backups automatiques de Cosmos DB
- Conserver 30 jours d'historique minimum

### Scaling
- Monitorer les métriques RU de Cosmos DB
- Augmenter le plan App Service si nécessaire

## 📞 Support

En cas de problème:
1. Consulter les logs Azure
2. Vérifier Application Insights
3. Contacter l'équipe technique

## ✅ Checklist de Déploiement

- [ ] Cosmos DB créé et configuré
- [ ] Variables d'environnement configurées
- [ ] Backend déployé et accessible
- [ ] Frontend déployé
- [ ] Applications mobile buildées
- [ ] Données de test créées
- [ ] SSL/HTTPS activé
- [ ] Monitoring configuré
- [ ] Backups activés
- [ ] Documentation à jour
