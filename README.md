# MediRoute 🏥

**Plateforme de gestion médicale pour le Sénégal**

MediRoute est une application web et mobile qui connecte les médecins généralistes avec leurs patients pour la gestion des rendez-vous, dossiers médicaux, et prises en charge médicales. En cas d'urgence, les patients peuvent rapidement trouver les hôpitaux les plus proches avec disponibilités.

## 🎯 Fonctionnalités Principales

### Pour les Patients
- ✅ Inscription et connexion sécurisée
- 📅 Prise de rendez-vous avec médecins généralistes
- 📋 Accès au dossier médical personnel
- 🏥 Localisation des hôpitaux proches en urgence
- ⚡ Formulaire d'urgence rapide et intuitif
- 📱 Notifications de rendez-vous
- 💬 Messagerie avec les médecins

### Pour les Médecins
- 👨‍⚕️ Gestion de l'agenda et disponibilités
- 📊 Accès aux dossiers des patients
- ✍️ Rédaction de prescriptions et ordonnances
- 📈 Statistiques et historique des consultations
- 💬 Communication avec les patients

### Pour les Hôpitaux
- 🏥 Gestion des lits et disponibilités
- 🚑 Gestion des urgences
- 📊 Tableau de bord administratif
- 👥 Gestion du personnel médical

## 🏗️ Architecture Technique

### Backend
- **Node.js** avec **Express.js**
- **Azure Cosmos DB** (NoSQL) pour la flexibilité et la scalabilité
- **JWT** pour l'authentification
- **Socket.io** pour les notifications en temps réel
- **Azure Maps API** pour la géolocalisation

### Frontend Web
- **React** avec **TypeScript**
- **Redux Toolkit** pour la gestion d'état
- **Material-UI** pour l'interface utilisateur
- **React Router** pour la navigation
- **Axios** pour les requêtes API

### Application Mobile
- **React Native** avec **TypeScript**
- **React Navigation** pour la navigation
- **React Native Maps** pour la cartographie
- **Expo** pour le développement rapide

### Infrastructure
- **Azure App Service** pour le déploiement
- **Azure Cosmos DB** pour la base de données
- **Azure Blob Storage** pour les fichiers médicaux
- **Azure Maps** pour la géolocalisation

## 📁 Structure du Projet

```
MediRoute/
├── backend/                 # API Backend Node.js
│   ├── src/
│   │   ├── config/         # Configuration (DB, Auth)
│   │   ├── controllers/    # Logique métier
│   │   ├── models/         # Modèles de données
│   │   ├── routes/         # Routes API
│   │   ├── middleware/     # Middleware (auth, validation)
│   │   ├── services/       # Services (email, maps)
│   │   └── utils/          # Utilitaires
│   └── package.json
│
├── web/                    # Application Web React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── store/          # Redux store
│   │   ├── services/       # Services API
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilitaires
│   └── package.json
│
├── mobile/                 # Application Mobile React Native
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── screens/        # Écrans de l'application
│   │   ├── navigation/     # Configuration navigation
│   │   ├── services/       # Services API
│   │   └── utils/          # Utilitaires
│   └── package.json
│
└── docs/                   # Documentation
    ├── api/                # Documentation API
    ├── architecture/       # Diagrammes d'architecture
    └── deployment/         # Guide de déploiement
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Azure (pour Cosmos DB et Maps)
- React Native CLI (pour mobile)

### Installation Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npm run dev
```

### Installation Web
```bash
cd web
npm install
npm start
```

### Installation Mobile
```bash
cd mobile
npm install
npx expo start
```

## 🌍 Contexte Sénégalais

L'application est spécialement conçue pour le Sénégal avec:
- Interface en français
- Support de la géolocalisation à Dakar et dans toutes les régions
- Adaptation au système de santé sénégalais
- Support des hôpitaux publics et privés
- Coordonnées des centres de santé locaux

## 📱 Captures d'écran

*(À venir)*

## 🤝 Contribution

Les contributions sont les bienvenues! Veuillez consulter CONTRIBUTING.md pour plus de détails.

## 📄 Licence

MIT License - voir LICENSE pour plus de détails.

## 👥 Équipe

Développé avec ❤️ pour améliorer l'accès aux soins au Sénégal.

## 📞 Contact

Pour toute question ou support: contact@mediroute.sn
