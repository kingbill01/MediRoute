# MediRoute — Guide de Déploiement Cloud
## Google Cloud Platform · Microsoft Azure · Amazon Web Services

> **Version :** 1.0 — Mai 2026  
> **Stack :** Node.js/Express (backend) · React (web) · Expo React Native (mobile) · Prisma ORM · PostgreSQL

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Prérequis communs](#2-prérequis-communs)
3. [Préparation du projet](#3-préparation-du-projet)
4. [Google Cloud Platform (GCP)](#4-google-cloud-platform-gcp)
5. [Microsoft Azure](#5-microsoft-azure)
6. [Amazon Web Services (AWS)](#6-amazon-web-services-aws)
7. [Application mobile — Build & Distribution](#7-application-mobile--build--distribution)
8. [CI/CD automatisé (GitHub Actions)](#8-cicd-automatisé-github-actions)
9. [Monitoring & Alertes](#9-monitoring--alertes)
10. [Comparatif coûts & recommandations](#10-comparatif-coûts--recommandations)
11. [Checklist de mise en production](#11-checklist-de-mise-en-production)

---

## 1. Vue d'ensemble de l'architecture

### Composants de l'application

```
MediRoute
├── backend/          Node.js + Express + Prisma (API REST + WebSocket)
├── web/              React 18 + Material-UI (SPA)
└── mobile/           Expo React Native (iOS + Android)
```

### Architecture cible (commune aux 3 clouds)

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
└────────────┬────────────────────────┬───────────────────────────┘
             │                        │
    ┌────────▼────────┐      ┌────────▼────────┐
    │   WEB (React)   │      │ MOBILE (Expo)   │
    │  CDN / Hosting  │      │  iOS / Android  │
    └────────┬────────┘      └────────┬────────┘
             │                        │
             │          HTTPS         │
             └──────────┬─────────────┘
                        │
               ┌────────▼────────┐
               │  BACKEND API    │
               │  (Node.js)      │◄─── WebSocket (Socket.io)
               │  Container      │
               └────────┬────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
  ┌───────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
  │  PostgreSQL  │ │ Redis  │ │  Storage   │
  │  (managed)   │ │(cache) │ │  (fichiers)│
  └──────────────┘ └────────┘ └────────────┘
```

### Architecture par cloud

| Composant | Google Cloud | Azure | AWS |
|-----------|-------------|-------|-----|
| Backend API | Cloud Run | Container Apps | ECS Fargate |
| Base de données | Cloud SQL | Azure Database for PostgreSQL | RDS PostgreSQL |
| Frontend web | Firebase Hosting | Static Web Apps | CloudFront + S3 |
| Stockage fichiers | Cloud Storage | Blob Storage | S3 |
| Secrets | Secret Manager | Key Vault | Secrets Manager |
| DNS / CDN | Cloud CDN | Azure CDN | CloudFront |
| Registry Docker | Artifact Registry | Container Registry | ECR |
| CI/CD natif | Cloud Build | Azure DevOps | CodePipeline |

---

## 2. Prérequis communs

### Outils à installer

```bash
# Docker Desktop
# Télécharger sur https://www.docker.com/products/docker-desktop/
docker --version   # vérifier : Docker 24+

# Node.js 20+
node --version     # vérifier : v20+
npm --version      # vérifier : 10+

# Git
git --version

# CLIs des 3 clouds (installer selon le cloud choisi)

# Google Cloud CLI
brew install google-cloud-sdk              # macOS
# ou https://cloud.google.com/sdk/install  # Windows/Linux

# Azure CLI
brew install azure-cli                     # macOS
# ou https://learn.microsoft.com/cli/azure/install-azure-cli

# AWS CLI v2
brew install awscli                        # macOS
# ou https://aws.amazon.com/cli/

# Expo / EAS (pour le mobile)
npm install -g eas-cli
```

### Comptes nécessaires

- **Google Cloud** : compte Google + [console.cloud.google.com](https://console.cloud.google.com)
- **Azure** : compte Microsoft + [portal.azure.com](https://portal.azure.com)
- **AWS** : compte AWS + [console.aws.amazon.com](https://console.aws.amazon.com)
- **Expo** : compte gratuit sur [expo.dev](https://expo.dev) (pour le build mobile)
- **GitHub** : pour le CI/CD automatisé

---

## 3. Préparation du projet

Ces étapes sont **communes aux 3 clouds**. À faire une seule fois.

### 3.1 Migrer de SQLite vers PostgreSQL

Le schéma Prisma actuel utilise SQLite (développement). Il faut le basculer sur PostgreSQL pour la production.

**Modifier `backend/prisma/schema.prisma` :**

```prisma
// AVANT (SQLite)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// APRÈS (PostgreSQL)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Générer les migrations :**

```bash
cd backend

# Créer le fichier .env.production local pour les migrations
cat > .env.production.local << 'EOF'
DATABASE_URL="postgresql://mediroute:mediroute@localhost:5432/mediroute"
EOF

# Démarrer PostgreSQL local pour générer les migrations
docker run -d \
  --name pg-local \
  -e POSTGRES_USER=mediroute \
  -e POSTGRES_PASSWORD=mediroute \
  -e POSTGRES_DB=mediroute \
  -p 5432:5432 \
  postgres:15-alpine

# Attendre 3 secondes que PostgreSQL démarre
sleep 3

# Générer les migrations
DATABASE_URL="postgresql://mediroute:mediroute@localhost:5432/mediroute" \
  npx prisma migrate dev --name init

# Le dossier backend/prisma/migrations/ est créé
# Arrêter le PostgreSQL local
docker stop pg-local && docker rm pg-local
```

### 3.2 Variables d'environnement de production

Créer `backend/.env.example` (référence, ne jamais committer les vraies valeurs) :

```bash
# Base de données PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/mediroute

# JWT
JWT_SECRET=<minimum-64-caracteres-aleatoires>
JWT_EXPIRES_IN=7d

# Serveur
PORT=8080
NODE_ENV=production

# CORS (URLs du frontend web)
CORS_ORIGIN=https://votre-domaine.com,https://www.votre-domaine.com

# Anthropic AI (MediBot)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optionnel
AZURE_MAPS_KEY=
```

### 3.3 Générer un JWT Secret sécurisé

```bash
# Générer un secret de 64 caractères
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# Copier et sauvegarder ce secret
```

### 3.4 Structure Docker finale

Vérifier que les Dockerfiles sont corrects :

**`backend/Dockerfile`** (déjà mis à jour, port 8080 pour les clouds) :
```dockerfile
# Port 8080 — standard pour Cloud Run, Azure Container Apps, ECS
EXPOSE 8080
ENV PORT=8080
```

**`backend/docker-entrypoint.sh`** :
```bash
#!/bin/sh
set -e
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Starting server..."
exec node dist/server-postgres.js
```

---

## 4. Google Cloud Platform (GCP)

### Architecture GCP

```
Firebase Hosting (React SPA)
        │
        ▼ HTTPS
Cloud Run (Node.js API) ──── Cloud SQL (PostgreSQL)
        │                         │
        ▼                         ▼
Cloud Storage (fichiers)    Secret Manager (secrets)
        │
        ▼
Artifact Registry (Docker images)
```

### 4.1 Initialisation du projet

```bash
# Connexion
gcloud auth login
gcloud auth application-default login

# Créer le projet (remplacer par votre ID unique)
export GCP_PROJECT="mediroute-prod-2026"
export GCP_REGION="europe-west1"   # Belgique — le plus proche de l'Afrique de l'Ouest en Europe

gcloud projects create $GCP_PROJECT --name="MediRoute"
gcloud config set project $GCP_PROJECT

# IMPORTANT : Lier un compte de facturation
# → https://console.cloud.google.com/billing
# Sélectionner votre projet et lier un compte de facturation

# Activer les APIs nécessaires
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  firebase.googleapis.com
```

### 4.2 Cloud SQL — PostgreSQL

```bash
# Créer l'instance (db-f1-micro = 1 vCPU, 614 MB RAM — suffisant pour les tests)
gcloud sql instances create mediroute-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$GCP_REGION \
  --storage-size=20GB \
  --storage-type=SSD \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --no-deletion-protection

# Créer la base de données
gcloud sql databases create mediroute --instance=mediroute-db

# Définir le mot de passe postgres
gcloud sql users set-password postgres \
  --instance=mediroute-db \
  --password=$(openssl rand -base64 24)

# Créer l'utilisateur applicatif
export DB_PASSWORD=$(openssl rand -base64 24)
gcloud sql users create mediroute_user \
  --instance=mediroute-db \
  --password=$DB_PASSWORD

# Récupérer le Connection Name
export CONNECTION_NAME=$(gcloud sql instances describe mediroute-db \
  --format="value(connectionName)")
echo "Connection Name: $CONNECTION_NAME"
# ex: mediroute-prod-2026:europe-west1:mediroute-db

# Construire la DATABASE_URL
export DATABASE_URL="postgresql://mediroute_user:${DB_PASSWORD}@localhost/mediroute?host=/cloudsql/${CONNECTION_NAME}"
echo "DATABASE_URL: $DATABASE_URL"
```

### 4.3 Secret Manager — Stocker les secrets

```bash
# DATABASE_URL
echo -n "$DATABASE_URL" | \
  gcloud secrets create DATABASE_URL --data-file=-

# JWT_SECRET
echo -n "$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")" | \
  gcloud secrets create JWT_SECRET --data-file=-

# ANTHROPIC_API_KEY (si disponible)
echo -n "sk-ant-VOTRE_CLE" | \
  gcloud secrets create ANTHROPIC_API_KEY --data-file=-

# Vérifier les secrets créés
gcloud secrets list
```

### 4.4 Artifact Registry — Dépôt Docker

```bash
# Créer le dépôt
gcloud artifacts repositories create mediroute \
  --repository-format=docker \
  --location=$GCP_REGION \
  --description="MediRoute Docker images"

# Configurer Docker
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev

# Tag de l'image
export IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/mediroute/backend"
```

### 4.5 Build et déploiement du Backend

```bash
cd /Users/birane.fall/Downloads/MediRoute

# Build de l'image
docker build -t ${IMAGE}:v1 ./backend

# Push vers Artifact Registry
docker push ${IMAGE}:v1

# Créer le compte de service pour Cloud Run
gcloud iam service-accounts create mediroute-backend \
  --display-name="MediRoute Backend Service Account"

export SA="mediroute-backend@${GCP_PROJECT}.iam.gserviceaccount.com"

# Accorder les permissions
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member="serviceAccount:${SA}" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member="serviceAccount:${SA}" \
  --role="roles/storage.objectAdmin"

# Déployer sur Cloud Run
gcloud run deploy mediroute-backend \
  --image=${IMAGE}:v1 \
  --region=$GCP_REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --service-account=$SA \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-secrets=\
DATABASE_URL=DATABASE_URL:latest,\
JWT_SECRET=JWT_SECRET:latest,\
ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
  --set-env-vars=\
NODE_ENV=production,\
CORS_ORIGIN=https://${GCP_PROJECT}.web.app

# Récupérer l'URL du backend
export BACKEND_URL=$(gcloud run services describe mediroute-backend \
  --region=$GCP_REGION \
  --format="value(status.url)")
echo "Backend URL: $BACKEND_URL"
# ex: https://mediroute-backend-abc123-ew.a.run.app

# Tester
curl ${BACKEND_URL}/health
```

### 4.6 Firebase Hosting — Frontend Web

```bash
cd /Users/birane.fall/Downloads/MediRoute/web

# Connexion Firebase
firebase login

# Initialiser Firebase
firebase use --add
# → Sélectionner votre projet GCP : mediroute-prod-2026
# → Alias : production

# Builder le frontend avec l'URL Cloud Run
REACT_APP_API_BASE_URL="${BACKEND_URL}/api" \
  SKIP_PREFLIGHT_CHECK=true \
  CI=false \
  npm run build

# Déployer
firebase deploy --only hosting

# URL résultante
echo "Web App: https://${GCP_PROJECT}.web.app"
```

### 4.7 Cloud Storage — Fichiers médicaux

```bash
# Créer le bucket
export BUCKET_NAME="${GCP_PROJECT}-medical-files"

gsutil mb -l $GCP_REGION gs://${BUCKET_NAME}

# Configurer les CORS pour les uploads depuis le frontend
cat > cors.json << 'EOF'
[{
  "origin": ["*"],
  "method": ["GET", "POST", "PUT", "DELETE"],
  "maxAgeSeconds": 3600
}]
EOF

gsutil cors set cors.json gs://${BUCKET_NAME}

# Rendre les uploads sécurisés (accès privé)
gsutil iam ch -d allUsers:objectViewer gs://${BUCKET_NAME}
```

### 4.8 Mise à jour du CORS Backend

Après avoir l'URL Firebase, mettre à jour la variable CORS sur Cloud Run :

```bash
gcloud run services update mediroute-backend \
  --region=$GCP_REGION \
  --update-env-vars=\
CORS_ORIGIN="https://${GCP_PROJECT}.web.app,https://www.mediroute.sn"
```

### 4.9 Domaine personnalisé (optionnel)

```bash
# Firebase Hosting — domaine personnalisé
firebase hosting:channel:deploy production

# Ajouter le domaine dans la console Firebase
# → Hosting → Add custom domain → mediroute.sn
# → Ajouter les enregistrements DNS chez votre registrar

# Cloud Run — domaine personnalisé
gcloud run domain-mappings create \
  --service=mediroute-backend \
  --domain=api.mediroute.sn \
  --region=$GCP_REGION
```

---

## 5. Microsoft Azure

### Architecture Azure

```
Azure Static Web Apps (React SPA)
        │
        ▼ HTTPS
Azure Container Apps (Node.js API) ──── Azure Database for PostgreSQL
        │                                        │
        ▼                                        ▼
Azure Blob Storage (fichiers)            Azure Key Vault (secrets)
        │
        ▼
Azure Container Registry (Docker images)
```

### 5.1 Initialisation Azure

```bash
# Connexion
az login

# Variables
export AZ_SUBSCRIPTION="votre-subscription-id"
export AZ_RESOURCE_GROUP="rg-mediroute-prod"
export AZ_LOCATION="francecentral"   # ou westeurope
export AZ_APP_NAME="mediroute"

# Sélectionner la subscription
az account set --subscription $AZ_SUBSCRIPTION

# Créer le Resource Group (conteneur de toutes les ressources)
az group create \
  --name $AZ_RESOURCE_GROUP \
  --location $AZ_LOCATION

# Vérifier
az group show --name $AZ_RESOURCE_GROUP
```

### 5.2 Azure Container Registry — Dépôt Docker

```bash
# Créer le registre (SKU Basic suffisant pour les tests)
export ACR_NAME="mediRouteRegistry"  # Doit être unique globalement, que des lettres/chiffres

az acr create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Connexion au registre
az acr login --name $ACR_NAME

# Récupérer l'URL du registre
export ACR_URL=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
echo "ACR URL: $ACR_URL"
# ex: medirouteregistry.azurecr.io

# Build et push de l'image backend
cd /Users/birane.fall/Downloads/MediRoute

docker build -t ${ACR_URL}/backend:v1 ./backend
docker push ${ACR_URL}/backend:v1
```

### 5.3 Azure Database for PostgreSQL

```bash
# Créer le serveur PostgreSQL flexible (plus économique que le single server)
export DB_SERVER="mediroute-postgres"
export DB_ADMIN="mediAdmin"
export DB_PASSWORD=$(openssl rand -base64 24)

az postgres flexible-server create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name $DB_SERVER \
  --location $AZ_LOCATION \
  --admin-user $DB_ADMIN \
  --admin-password "$DB_PASSWORD" \
  --database-name mediroute \
  --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 15 \
  --tier Burstable \
  --public-access None   # Accès privé seulement

# Récupérer le hostname
export DB_HOST=$(az postgres flexible-server show \
  --resource-group $AZ_RESOURCE_GROUP \
  --name $DB_SERVER \
  --query fullyQualifiedDomainName -o tsv)

export DATABASE_URL="postgresql://${DB_ADMIN}:${DB_PASSWORD}@${DB_HOST}/mediroute?sslmode=require"
echo "DATABASE_URL configurée"
```

### 5.4 Azure Key Vault — Secrets

```bash
# Créer le Key Vault
export VAULT_NAME="mediroute-vault"

az keyvault create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name $VAULT_NAME \
  --location $AZ_LOCATION \
  --sku standard

# Stocker les secrets
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "DATABASE-URL" \
  --value "$DATABASE_URL"

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "JWT-SECRET" \
  --value "$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")"

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "ANTHROPIC-API-KEY" \
  --value "sk-ant-VOTRE_CLE"
```

### 5.5 Azure Container Apps — Backend

```bash
# Créer l'environnement Container Apps
az containerapp env create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-env" \
  --location $AZ_LOCATION

# Créer une Managed Identity pour accéder au Key Vault
az identity create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-identity"

export IDENTITY_ID=$(az identity show \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-identity" \
  --query id -o tsv)

export IDENTITY_PRINCIPAL=$(az identity show \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-identity" \
  --query principalId -o tsv)

# Accorder l'accès au Key Vault
az keyvault set-policy \
  --name $VAULT_NAME \
  --object-id $IDENTITY_PRINCIPAL \
  --secret-permissions get list

# Récupérer les secrets URIs
export DB_SECRET_URI=$(az keyvault secret show \
  --vault-name $VAULT_NAME --name "DATABASE-URL" --query id -o tsv)
export JWT_SECRET_URI=$(az keyvault secret show \
  --vault-name $VAULT_NAME --name "JWT-SECRET" --query id -o tsv)
export AI_SECRET_URI=$(az keyvault secret show \
  --vault-name $VAULT_NAME --name "ANTHROPIC-API-KEY" --query id -o tsv)

# Récupérer les credentials du registre
export ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
export ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Déployer le backend sur Container Apps
az containerapp create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-backend" \
  --environment "mediroute-env" \
  --image "${ACR_URL}/backend:v1" \
  --registry-server $ACR_URL \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --user-assigned $IDENTITY_ID \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --secrets \
    "dburl=keyvaultref:${DB_SECRET_URI},identityref:${IDENTITY_ID}" \
    "jwtsecret=keyvaultref:${JWT_SECRET_URI},identityref:${IDENTITY_ID}" \
    "aikey=keyvaultref:${AI_SECRET_URI},identityref:${IDENTITY_ID}" \
  --env-vars \
    "NODE_ENV=production" \
    "PORT=8080" \
    "DATABASE_URL=secretref:dburl" \
    "JWT_SECRET=secretref:jwtsecret" \
    "ANTHROPIC_API_KEY=secretref:aikey"

# Récupérer l'URL
export BACKEND_URL=$(az containerapp show \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-backend" \
  --query properties.configuration.ingress.fqdn -o tsv)

export BACKEND_URL="https://${BACKEND_URL}"
echo "Backend URL: $BACKEND_URL"

# Tester
curl ${BACKEND_URL}/health
```

### 5.6 Azure Static Web Apps — Frontend Web

```bash
cd /Users/birane.fall/Downloads/MediRoute/web

# Builder avec l'URL du backend Azure
REACT_APP_API_BASE_URL="${BACKEND_URL}/api" \
  SKIP_PREFLIGHT_CHECK=true \
  CI=false \
  npm run build

# Option 1 : Azure Static Web Apps via CLI
npm install -g @azure/static-web-apps-cli

# Créer la Static Web App
az staticwebapp create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-web" \
  --location "westeurope" \
  --sku Free

# Déployer (depuis le dossier web/)
swa deploy ./build \
  --app-name "mediroute-web" \
  --resource-group $AZ_RESOURCE_GROUP \
  --deployment-token $(az staticwebapp secrets list \
    --name "mediroute-web" \
    --query properties.apiKey -o tsv)

# URL résultante
export WEB_URL=$(az staticwebapp show \
  --name "mediroute-web" \
  --resource-group $AZ_RESOURCE_GROUP \
  --query defaultHostname -o tsv)
echo "Web URL: https://${WEB_URL}"
```

### 5.7 Azure Blob Storage — Fichiers médicaux

```bash
# Créer le compte de stockage
export STORAGE_NAME="mediroutestorage"  # unique globalement, min/maj autorisées

az storage account create \
  --resource-group $AZ_RESOURCE_GROUP \
  --name $STORAGE_NAME \
  --location $AZ_LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Créer le conteneur
az storage container create \
  --account-name $STORAGE_NAME \
  --name "medical-files" \
  --public-access off

# Récupérer la clé
export STORAGE_KEY=$(az storage account keys list \
  --resource-group $AZ_RESOURCE_GROUP \
  --account-name $STORAGE_NAME \
  --query [0].value -o tsv)

# Stocker dans Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "STORAGE-KEY" \
  --value "$STORAGE_KEY"
```

### 5.8 Mise à jour CORS

```bash
az containerapp update \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-backend" \
  --set-env-vars "CORS_ORIGIN=https://${WEB_URL},https://www.mediroute.sn"
```

---

## 6. Amazon Web Services (AWS)

### Architecture AWS

```
CloudFront + S3 (React SPA)
        │
        ▼ HTTPS
ECS Fargate (Node.js API) ──── RDS PostgreSQL
        │                           │
        ▼                           ▼
S3 (fichiers médicaux)      Secrets Manager (secrets)
        │
        ▼
ECR (Docker images)

Application Load Balancer ──► ECS Fargate
VPC privé avec subnets public/privé
```

### 6.1 Initialisation AWS

```bash
# Configurer les credentials AWS
aws configure
# → AWS Access Key ID: (depuis IAM → Users → votre utilisateur → Security credentials)
# → AWS Secret Access Key: (même endroit)
# → Default region name: eu-west-1  (Irlande — le plus proche)
# → Default output format: json

# Variables
export AWS_REGION="eu-west-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account ID: $AWS_ACCOUNT_ID"

# Vérifier la connexion
aws sts get-caller-identity
```

### 6.2 ECR — Elastic Container Registry

```bash
# Créer le dépôt
aws ecr create-repository \
  --repository-name mediroute/backend \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true

export ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export IMAGE="${ECR_URL}/mediroute/backend"

# Authentification Docker → ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URL

# Build et push
cd /Users/birane.fall/Downloads/MediRoute

docker build -t ${IMAGE}:v1 ./backend
docker push ${IMAGE}:v1
```

### 6.3 VPC et Réseau

```bash
# Créer un VPC dédié (isolé du réseau public)
export VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --query Vpc.VpcId --output text)

aws ec2 create-tags \
  --resources $VPC_ID \
  --tags Key=Name,Value=mediroute-vpc

# Activer DNS
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Sous-réseaux publics (pour le Load Balancer)
export SUBNET_PUBLIC_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${AWS_REGION}a \
  --query Subnet.SubnetId --output text)

export SUBNET_PUBLIC_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${AWS_REGION}b \
  --query Subnet.SubnetId --output text)

# Sous-réseaux privés (pour ECS + RDS)
export SUBNET_PRIVATE_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.10.0/24 \
  --availability-zone ${AWS_REGION}a \
  --query Subnet.SubnetId --output text)

export SUBNET_PRIVATE_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.11.0/24 \
  --availability-zone ${AWS_REGION}b \
  --query Subnet.SubnetId --output text)

# Internet Gateway
export IGW_ID=$(aws ec2 create-internet-gateway --query InternetGateway.InternetGatewayId --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# Route table pour les subnets publics
export RT_PUBLIC=$(aws ec2 create-route-table --vpc-id $VPC_ID --query RouteTable.RouteTableId --output text)
aws ec2 create-route --route-table-id $RT_PUBLIC --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_1
aws ec2 associate-route-table --route-table-id $RT_PUBLIC --subnet-id $SUBNET_PUBLIC_2
```

### 6.4 RDS PostgreSQL

```bash
# Security Group pour RDS (accès uniquement depuis le VPC)
export SG_RDS=$(aws ec2 create-security-group \
  --group-name "mediroute-rds-sg" \
  --description "MediRoute RDS Security Group" \
  --vpc-id $VPC_ID \
  --query GroupId --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $SG_RDS \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16

# DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name "mediroute-db-subnet" \
  --db-subnet-group-description "MediRoute DB Subnet Group" \
  --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2

# Créer l'instance RDS (db.t3.micro = éligible Free Tier pendant 12 mois)
export DB_PASSWORD=$(openssl rand -base64 24)

aws rds create-db-instance \
  --db-instance-identifier mediroute-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username mediroute_admin \
  --master-user-password "$DB_PASSWORD" \
  --db-name mediroute \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-subnet-group-name "mediroute-db-subnet" \
  --vpc-security-group-ids $SG_RDS \
  --no-publicly-accessible \
  --backup-retention-period 7 \
  --no-multi-az \
  --no-deletion-protection

# Attendre que RDS soit disponible (5-10 minutes)
echo "Attente du démarrage RDS..."
aws rds wait db-instance-available --db-instance-identifier mediroute-db

# Récupérer le hostname
export DB_HOST=$(aws rds describe-db-instances \
  --db-instance-identifier mediroute-db \
  --query "DBInstances[0].Endpoint.Address" --output text)

export DATABASE_URL="postgresql://mediroute_admin:${DB_PASSWORD}@${DB_HOST}:5432/mediroute"
echo "DB Host: $DB_HOST"
```

### 6.5 Secrets Manager

```bash
# Stocker les secrets
aws secretsmanager create-secret \
  --name "mediroute/DATABASE_URL" \
  --secret-string "$DATABASE_URL" \
  --region $AWS_REGION

aws secretsmanager create-secret \
  --name "mediroute/JWT_SECRET" \
  --secret-string "$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")" \
  --region $AWS_REGION

aws secretsmanager create-secret \
  --name "mediroute/ANTHROPIC_API_KEY" \
  --secret-string "sk-ant-VOTRE_CLE" \
  --region $AWS_REGION
```

### 6.6 ECS Fargate — Backend

```bash
# Créer le cluster ECS
aws ecs create-cluster \
  --cluster-name mediroute-cluster \
  --capacity-providers FARGATE \
  --region $AWS_REGION

# IAM Role pour ECS Task
cat > ecs-task-role.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ecs-tasks.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name "mediroute-ecs-task-role" \
  --assume-role-policy-document file://ecs-task-role.json

# Accès aux secrets
aws iam attach-role-policy \
  --role-name "mediroute-ecs-task-role" \
  --policy-arn "arn:aws:iam::aws:policy/SecretsManagerReadWrite"

# Accès S3
aws iam attach-role-policy \
  --role-name "mediroute-ecs-task-role" \
  --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"

# IAM Role pour ECS Execution (pull image ECR)
aws iam create-role \
  --role-name "mediroute-ecs-execution-role" \
  --assume-role-policy-document file://ecs-task-role.json

aws iam attach-role-policy \
  --role-name "mediroute-ecs-execution-role" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

# Récupérer les ARNs des secrets
export DB_SECRET_ARN=$(aws secretsmanager describe-secret \
  --secret-id "mediroute/DATABASE_URL" --query ARN --output text)
export JWT_SECRET_ARN=$(aws secretsmanager describe-secret \
  --secret-id "mediroute/JWT_SECRET" --query ARN --output text)
export AI_SECRET_ARN=$(aws secretsmanager describe-secret \
  --secret-id "mediroute/ANTHROPIC_API_KEY" --query ARN --output text)

# CloudWatch Log Group
aws logs create-log-group \
  --log-group-name "/ecs/mediroute-backend" \
  --region $AWS_REGION

# Task Definition
cat > task-definition.json << EOF
{
  "family": "mediroute-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/mediroute-ecs-execution-role",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/mediroute-ecs-task-role",
  "containerDefinitions": [{
    "name": "backend",
    "image": "${IMAGE}:v1",
    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "PORT", "value": "8080"}
    ],
    "secrets": [
      {"name": "DATABASE_URL", "valueFrom": "${DB_SECRET_ARN}"},
      {"name": "JWT_SECRET", "valueFrom": "${JWT_SECRET_ARN}"},
      {"name": "ANTHROPIC_API_KEY", "valueFrom": "${AI_SECRET_ARN}"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/mediroute-backend",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "wget -qO- http://localhost:8080/health || exit 1"],
      "interval": 30,
      "timeout": 10,
      "retries": 3,
      "startPeriod": 30
    }
  }]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region $AWS_REGION

# Security Group pour ECS
export SG_ECS=$(aws ec2 create-security-group \
  --group-name "mediroute-ecs-sg" \
  --description "MediRoute ECS Security Group" \
  --vpc-id $VPC_ID \
  --query GroupId --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ECS \
  --protocol tcp --port 8080 --cidr 0.0.0.0/0

# Application Load Balancer
export ALB_ARN=$(aws elbv2 create-load-balancer \
  --name mediroute-alb \
  --subnets $SUBNET_PUBLIC_1 $SUBNET_PUBLIC_2 \
  --security-groups $SG_ECS \
  --scheme internet-facing \
  --type application \
  --query "LoadBalancers[0].LoadBalancerArn" --output text)

# Target Group
export TG_ARN=$(aws elbv2 create-target-group \
  --name mediroute-backend-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --query "TargetGroups[0].TargetGroupArn" --output text)

# Listener HTTP
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# URL du Load Balancer
export BACKEND_URL="http://$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" --output text)"
echo "Backend URL: $BACKEND_URL"

# Créer le service ECS
aws ecs create-service \
  --cluster mediroute-cluster \
  --service-name mediroute-backend \
  --task-definition mediroute-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[$SUBNET_PRIVATE_1,$SUBNET_PRIVATE_2],
    securityGroups=[$SG_ECS],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=${TG_ARN},containerName=backend,containerPort=8080" \
  --region $AWS_REGION

echo "Service ECS créé. Attente du démarrage..."
aws ecs wait services-stable \
  --cluster mediroute-cluster \
  --services mediroute-backend

# Test
curl ${BACKEND_URL}/health
```

### 6.7 S3 + CloudFront — Frontend Web

```bash
# Créer le bucket S3 pour le frontend
export S3_BUCKET="mediroute-web-${AWS_ACCOUNT_ID}"

aws s3 mb s3://${S3_BUCKET} --region $AWS_REGION

# Configurer pour l'hébergement web statique
aws s3 website s3://${S3_BUCKET} \
  --index-document index.html \
  --error-document index.html

# Politique publique pour CloudFront
cat > s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
  }]
}
EOF

aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://s3-policy.json
aws s3api delete-public-access-block --bucket $S3_BUCKET

# Builder le frontend
cd /Users/birane.fall/Downloads/MediRoute/web

REACT_APP_API_BASE_URL="${BACKEND_URL}/api" \
  SKIP_PREFLIGHT_CHECK=true \
  CI=false \
  npm run build

# Uploader sur S3
aws s3 sync build/ s3://${S3_BUCKET} \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "index.html"

aws s3 cp build/index.html s3://${S3_BUCKET}/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

# Créer la distribution CloudFront
export CF_DIST=$(aws cloudfront create-distribution \
  --distribution-config "{
    \"CallerReference\": \"mediroute-$(date +%s)\",
    \"Origins\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"Id\": \"S3-mediroute\",
        \"DomainName\": \"${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com\",
        \"S3OriginConfig\": {\"OriginAccessIdentity\": \"\"}
      }]
    },
    \"DefaultCacheBehavior\": {
      \"TargetOriginId\": \"S3-mediroute\",
      \"ViewerProtocolPolicy\": \"redirect-to-https\",
      \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\",
      \"Compress\": true
    },
    \"CustomErrorResponses\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"ErrorCode\": 404,
        \"ResponsePagePath\": \"/index.html\",
        \"ResponseCode\": \"200\",
        \"ErrorCachingMinTTL\": 0
      }]
    },
    \"Comment\": \"MediRoute Web App\",
    \"Enabled\": true,
    \"PriceClass\": \"PriceClass_100\"
  }" \
  --query "Distribution.DomainName" --output text)

echo "Web URL: https://${CF_DIST}"
```

---

## 7. Application mobile — Build & Distribution

Cette étape est **identique pour les 3 clouds**. Seule l'URL du backend change.

### 7.1 Mettre à jour l'URL API

Éditer `mobile/src/config/constants.ts` :

```typescript
// Remplacer par votre URL backend (Cloud Run / Container Apps / ALB)
export const API_BASE_URL = 'https://VOTRE-BACKEND-URL/api';
```

### 7.2 Configurer EAS Build

```bash
cd /Users/birane.fall/Downloads/MediRoute/mobile

# Connexion Expo
eas login

# Initialiser la configuration EAS
eas build:configure
```

Créer `mobile/eas.json` :

```json
{
  "cli": { "version": ">= 5.9.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "android": { "buildType": "aab" },
      "ios": {}
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 7.3 Build Android (APK pour tests)

```bash
# Build APK Android (prend 5-15 minutes sur les serveurs Expo)
eas build --platform android --profile preview

# Résultat : lien de téléchargement vers un .apk
# Partager ce lien aux testeurs — ils peuvent l'installer directement sur Android
```

### 7.4 Build iOS (TestFlight)

> Nécessite un compte Apple Developer (99$/an)

```bash
# Configurer les credentials Apple
eas credentials

# Build iOS
eas build --platform ios --profile preview

# Soumettre sur TestFlight
eas submit --platform ios --profile production
```

### 7.5 Test rapide sans build (Expo Go)

```bash
# Démarrer le serveur Expo
cd /Users/birane.fall/Downloads/MediRoute/mobile
npx expo start --tunnel

# Sur votre téléphone :
# 1. Installer l'app "Expo Go" (iOS App Store / Google Play)
# 2. Scanner le QR code affiché dans le terminal
# 3. L'app se charge directement — idéal pour les tests rapides
```

---

## 8. CI/CD automatisé (GitHub Actions)

Fichier `.github/workflows/deploy.yml` à la racine du projet :

```yaml
name: Deploy MediRoute

on:
  push:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  # ── Test ───────────────────────────────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check backend
        run: cd backend && npx tsc --noEmit --skipLibCheck

      - name: Build web
        run: cd web && SKIP_PREFLIGHT_CHECK=true CI=false npm run build

  # ── Deploy Backend — Google Cloud Run ──────────────────────────────────────
  deploy-backend-gcp:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker europe-west1-docker.pkg.dev

      - name: Build and push image
        run: |
          docker build -t europe-west1-docker.pkg.dev/${{ secrets.GCP_PROJECT }}/mediroute/backend:${{ github.sha }} ./backend
          docker push europe-west1-docker.pkg.dev/${{ secrets.GCP_PROJECT }}/mediroute/backend:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy mediroute-backend \
            --image=europe-west1-docker.pkg.dev/${{ secrets.GCP_PROJECT }}/mediroute/backend:${{ github.sha }} \
            --region=europe-west1 \
            --platform=managed

  # ── Deploy Frontend — Firebase Hosting ────────────────────────────────────
  deploy-web-gcp:
    needs: deploy-backend-gcp
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Build
        run: |
          cd web
          REACT_APP_API_BASE_URL=${{ secrets.BACKEND_URL }}/api \
          SKIP_PREFLIGHT_CHECK=true CI=false \
          npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.GCP_PROJECT }}
          entryPoint: ./web
```

### Secrets GitHub Actions à configurer

Dans GitHub → Settings → Secrets and variables → Actions :

```
GCP_SA_KEY              → JSON du compte de service GCP
GCP_PROJECT             → mediroute-prod-2026
BACKEND_URL             → https://mediroute-backend-xxx-ew.a.run.app
FIREBASE_SERVICE_ACCOUNT→ JSON du compte de service Firebase
```

---

## 9. Monitoring & Alertes

### Google Cloud

```bash
# Uptime check (vérifie que le /health répond toutes les minutes)
gcloud monitoring uptime-check-configs create \
  --display-name="MediRoute API Health" \
  --http-check-path=/health \
  --monitored-resource=uptime_url \
  --hostname=$(echo $BACKEND_URL | sed 's|https://||')

# Alerte sur les erreurs 5xx
gcloud alpha monitoring policies create \
  --notification-channels=VOTRE_CHANNEL_ID \
  --display-name="MediRoute 5xx Errors" \
  --condition-display-name="5xx rate > 5%" \
  --condition-filter='resource.type="cloud_run_revision" metric.type="run.googleapis.com/request_count" metric.labels.response_code_class="5xx"'
```

### Azure

```bash
# Application Insights
az monitor app-insights component create \
  --app mediroute-insights \
  --location $AZ_LOCATION \
  --resource-group $AZ_RESOURCE_GROUP \
  --application-type web

export AI_KEY=$(az monitor app-insights component show \
  --app mediroute-insights \
  --resource-group $AZ_RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Ajouter au Container App
az containerapp update \
  --resource-group $AZ_RESOURCE_GROUP \
  --name "mediroute-backend" \
  --set-env-vars "APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=${AI_KEY}"
```

### AWS

```bash
# CloudWatch Dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "MediRoute" \
  --dashboard-body '{
    "widgets": [{
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count"],
          ["AWS/ApplicationELB", "RequestCount"],
          ["AWS/ECS", "CPUUtilization", "ServiceName", "mediroute-backend"]
        ],
        "period": 300,
        "title": "MediRoute Overview"
      }
    }]
  }'

# Alarme sur les erreurs 5xx
aws cloudwatch put-metric-alarm \
  --alarm-name "MediRoute-5xx-Errors" \
  --alarm-description "5xx errors on MediRoute API" \
  --metric-name HTTPCode_ELB_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:mediroute-alerts
```

---

## 10. Comparatif coûts & recommandations

### Estimation des coûts mensuels (charge légère : ~1000 utilisateurs)

| Composant | Google Cloud | Azure | AWS |
|-----------|:-----------:|:-----:|:---:|
| **Backend (container)** | Cloud Run ~0-2$ | Container Apps ~8$ | ECS Fargate ~12$ |
| **Base de données** | Cloud SQL ~15$ | PostgreSQL Flexible ~12$ | RDS t3.micro ~15$ |
| **Frontend web** | Firebase Hosting ~0$ | Static Web Apps ~0$ | S3+CloudFront ~1$ |
| **Stockage fichiers** | Cloud Storage ~0.5$ | Blob Storage ~0.5$ | S3 ~0.5$ |
| **Secrets** | Secret Manager ~0.1$ | Key Vault ~0.5$ | Secrets Manager ~0.5$ |
| **Monitoring** | Cloud Monitoring ~0$ | App Insights ~0$ | CloudWatch ~2$ |
| **TOTAL estimé** | **~18$/mois** | **~21$/mois** | **~31$/mois** |

> Ces estimations supposent un trafic faible (tests/pilote). En production avec 10 000+ utilisateurs, multiplier par 5-10.

### Avantages et inconvénients

**Google Cloud Platform**
- ✅ Cloud Run très généreux (2M requêtes/mois gratuites) — idéal pour les petits projets
- ✅ Firebase Hosting excellente pour les SPA React — CDN mondial, gratuit jusqu'à 10 GB/mois
- ✅ Intégration native avec le stack Google (Maps, AI, etc.)
- ✅ Interface la plus simple pour débuter
- ❌ Cloud SQL est la ressource la plus chère — pas de tier gratuit permanent
- ❌ Moins de régions en Afrique (pas de région Africa actuellement)

**Microsoft Azure**
- ✅ Container Apps avec scale-to-zero (comme Cloud Run mais avec plus de config)
- ✅ PostgreSQL Flexible Server légèrement moins cher que Cloud SQL
- ✅ Static Web Apps gratuit avec CI/CD GitHub intégré
- ✅ Région South Africa North (Johannesburg) — la plus proche pour le Sénégal
- ❌ Interface plus complexe, courbe d'apprentissage plus longue
- ❌ Pricing moins prévisible

**Amazon Web Services**
- ✅ Service le plus mature et le plus documenté
- ✅ Free Tier généreux la première année (RDS t3.micro 750h/mois gratuit 12 mois)
- ✅ Région eu-west-1 (Irlande) performante
- ✅ Écosystème le plus riche (plus de 200 services)
- ❌ Le plus complexe à configurer (VPC, subnets, security groups...)
- ❌ Le plus cher hors Free Tier
- ❌ Pas de région Afrique de l'Ouest

### Recommandation par cas d'usage

| Cas | Recommandation | Raison |
|-----|---------------|--------|
| **Tests / Pilote** | Google Cloud | Cloud Run gratuit + Firebase gratuit = coût minimal |
| **Production Sénégal** | Azure | Région Johannesburg = latence la plus faible pour l'Afrique |
| **Scale-up rapide** | AWS | Écosystème le plus riche, auto-scaling éprouvé |
| **Budget zéro** | GCP + Neon.tech | Cloud Run + Firebase Hosting + PostgreSQL Neon (gratuit) |

### Option budget zéro : GCP + Neon.tech

```bash
# Neon.tech — PostgreSQL serverless 100% gratuit
# 1. Créer un compte sur https://neon.tech
# 2. Nouveau projet → copier la DATABASE_URL
#    Format: postgresql://user:xxx@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Mettre à jour le secret GCP
echo -n "postgresql://user:xxx@ep-xxx.neon.tech/neondb?sslmode=require" | \
  gcloud secrets versions add DATABASE_URL --data-file=-

# Redéployer Cloud Run (sans Cloud SQL)
gcloud run deploy mediroute-backend \
  --image=${IMAGE}:v1 \
  --region=europe-west1 \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest

# Coût total : 0$/mois ✅
```

---

## 11. Checklist de mise en production

### Sécurité

- [ ] JWT_SECRET de minimum 64 caractères (aléatoire)
- [ ] HTTPS activé sur tous les endpoints (automatique sur Cloud Run / Azure Container Apps / CloudFront)
- [ ] CORS configuré avec les URLs exactes du frontend (pas de `*`)
- [ ] Variables d'environnement stockées dans les secrets managers (jamais en clair)
- [ ] Accès à la base de données restreint au réseau privé (pas d'IP publique)
- [ ] Rate limiting activé (`/api/auth` : 10 req/15min, global : 100 req/min)
- [ ] Headers de sécurité activés (Helmet.js)

### Performance

- [ ] `NODE_ENV=production` défini
- [ ] Images Docker multi-stage (builder + production) pour minimiser la taille
- [ ] Auto-scaling configuré (min 0, max 10 instances)
- [ ] CDN activé pour le frontend (Firebase CDN / Azure CDN / CloudFront)
- [ ] Compression gzip activée (nginx pour le frontend)

### Base de données

- [ ] Migrations Prisma générées et validées (`prisma/migrations/`)
- [ ] `prisma migrate deploy` exécuté au démarrage du container
- [ ] Sauvegardes automatiques configurées (7 jours minimum)
- [ ] Index de performance en place (déjà dans le schema Prisma)
- [ ] Connexions pooling configuré (max 10 connexions pour db.t3.micro/db-f1-micro)

### Mobile

- [ ] `API_BASE_URL` mise à jour avec l'URL de production
- [ ] Build EAS généré et testé sur un appareil physique
- [ ] APK partagé aux testeurs (Expo Go ou APK direct)

### Monitoring

- [ ] Health check `/health` répond en < 2 secondes
- [ ] Logs centralisés (Cloud Logging / Azure Monitor / CloudWatch)
- [ ] Alerte email/SMS configurée si le service tombe
- [ ] Tableau de bord créé (Cloud Monitoring / Azure Dashboard / CloudWatch Dashboard)

### Tests pré-lancement

```bash
# Test de l'API en production
BACKEND_URL="https://votre-backend-url"

# Health check
curl -s ${BACKEND_URL}/health | python3 -m json.tool

# Authentification
curl -s -X POST ${BACKEND_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@mediroute.sn","password":"Patient123!"}' | python3 -m json.tool

# Hôpitaux (route publique)
curl -s ${BACKEND_URL}/api/hospitals | python3 -m json.tool | head -20

# Chatbot IA
TOKEN="votre-token-jwt"
curl -s -X POST ${BACKEND_URL}/api/chatbot/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Bonjour, j ai de la fièvre"}' | python3 -m json.tool
```

---

## Résumé des URLs après déploiement

| Environnement | URL |
|---------------|-----|
| **Backend (GCP)** | `https://mediroute-backend-xxx-ew.a.run.app` |
| **Backend (Azure)** | `https://mediroute-backend.xxx.azurecontainerapps.io` |
| **Backend (AWS)** | `http://mediroute-alb-xxx.eu-west-1.elb.amazonaws.com` |
| **Web (GCP)** | `https://mediroute-prod-2026.web.app` |
| **Web (Azure)** | `https://mediroute-web.azurestaticapps.net` |
| **Web (AWS)** | `https://xxxxx.cloudfront.net` |
| **Mobile (testeurs)** | Lien EAS Build (APK Android) |
| **Mobile (Expo Go)** | QR code (`npx expo start --tunnel`) |

---

*Document généré pour le projet MediRoute — Plateforme médicale Sénégal*  
*Contact technique : biranefall@outlook.fr*
