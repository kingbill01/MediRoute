# MediRoute — Documentation Complète

> Système d'Information Hospitalier (SIH) pour le Sénégal  
> Version 1.0 · Stack : Node.js / React / Expo / SQLite→PostgreSQL

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Prérequis et installation](#3-prérequis-et-installation)
4. [Configuration](#4-configuration)
5. [Démarrage rapide](#5-démarrage-rapide)
6. [Comptes de test](#6-comptes-de-test)
7. [Interface Web — Espace Patient](#7-interface-web--espace-patient)
8. [Interface Web — Espace Médecin](#8-interface-web--espace-médecin)
9. [Interface Web — Espace Administrateur](#9-interface-web--espace-administrateur)
10. [Application Mobile](#10-application-mobile)
11. [API REST — Référence complète](#11-api-rest--référence-complète)
12. [Base de données — Modèle de données](#12-base-de-données--modèle-de-données)
13. [Déploiement en production](#13-déploiement-en-production)
14. [Dépannage](#14-dépannage)

---

## 1. Vue d'ensemble

MediRoute est une plateforme numérique de santé conçue pour le système de santé sénégalais. Elle connecte **patients**, **médecins** et **administrateurs hospitaliers** au travers d'une application web et d'une application mobile.

### Fonctionnalités principales

| Module | Description |
|--------|-------------|
| **Authentification** | Inscription patient/médecin, connexion JWT, gestion du profil |
| **Rendez-vous** | Prise, confirmation, annulation et suivi des rendez-vous |
| **DPI 360°** | Dossier Patient Informatisé complet (signes vitaux, résultats labo, ordonnances) |
| **Hôpitaux** | Annuaire avec capacité en lits en temps réel et spécialisations |
| **Urgences** | Formulaire d'urgence géolocalisé avec orientation vers les hôpitaux proches |
| **Télémédecine** | Consultation vidéo via Jitsi Meet (sans infrastructure) |
| **Messagerie** | Chat sécurisé médecin ↔ patient avec indicateurs de lecture |
| **Gestion des lits** | Suivi en temps réel par service (disponible / occupé / maintenance) |
| **Inventaire** | Gestion des stocks médicaux avec alertes de stock faible |
| **Facturation** | Suivi des factures patients (DRAFT → PAID) |
| **Administration** | Validation des médecins, gestion des utilisateurs, statistiques |

---

## 2. Architecture technique

```
MediRoute/
├── backend/                    # API REST — Node.js + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma de base de données (21 modèles)
│   │   └── seed.ts             # Données initiales de test
│   ├── src/
│   │   ├── controllers/        # Logique métier par domaine
│   │   ├── routes/             # Définition des routes Express
│   │   ├── middleware/         # Auth JWT, gestion erreurs, rate limiting
│   │   ├── config/             # Connexion BDD, configuration
│   │   └── server-postgres.ts  # Point d'entrée principal
│   └── .env                    # Variables d'environnement
│
├── web/                        # Application React (CRA)
│   └── src/
│       ├── pages/
│       │   ├── Auth/           # Login, Register
│       │   └── Dashboard/
│       │       ├── AdminDashboard.tsx
│       │       ├── DoctorDashboard.tsx
│       │       └── PatientDashboard.tsx
│       ├── services/           # Appels API (axios)
│       └── config/             # Constantes, routes
│
└── mobile/                     # Application Expo (React Native)
    ├── App.tsx                  # Point d'entrée + navigation
    └── src/
        ├── context/            # AuthContext (état global)
        ├── screens/
        │   ├── Auth/           # Login, Register
        │   ├── Patient/        # PatientTabs (4 onglets)
        │   └── Doctor/         # DoctorTabs (4 onglets)
        └── services/           # Appels API
```

### Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime backend | Node.js | 18+ |
| Framework backend | Express.js | 4.x |
| ORM | Prisma | 5.22 |
| Base de données dev | SQLite | (fichier local) |
| Base de données prod | PostgreSQL | 15+ |
| Authentification | JWT (jsonwebtoken) | - |
| Chiffrement | bcrypt | - |
| Frontend web | React + TypeScript | 18 |
| UI web | MUI (Material UI) | v5 |
| Frontend mobile | React Native (Expo) | SDK 50 |
| UI mobile | React Native Paper | v5 |
| Navigation mobile | React Navigation | v6 |
| Vidéo | Jitsi Meet (meet.jit.si) | - |

---

## 3. Prérequis et installation

### 3.1 Prérequis système

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Node.js | 18.x ou 20.x | `node --version` |
| npm | 9.x+ | `npm --version` |
| Git | 2.x | `git --version` |
| Expo CLI | (installé via npm) | `npx expo --version` |

> **SQLite** est utilisé par défaut pour le développement — **aucune installation de base de données n'est requise**.

### 3.2 Cloner le projet

```bash
git clone https://github.com/votre-org/mediroute.git
cd mediroute
```

### 3.3 Installation complète (une seule commande)

```bash
npm run install:all
```

Cette commande installe les dépendances pour **les trois parties** (racine, backend, web, mobile).

### 3.4 Installation manuelle (si nécessaire)

```bash
# Racine
npm install

# Backend
cd backend && npm install

# Web
cd ../web && npm install

# Mobile
cd ../mobile && npm install
```

### 3.5 Initialiser la base de données

```bash
# Depuis la racine du projet
npm run prisma:migrate    # Crée le schéma dans la BDD
npm run prisma:seed       # Insère les données de test (hôpitaux, utilisateurs)
```

---

## 4. Configuration

### 4.1 Variables d'environnement — Backend

Créez ou modifiez le fichier `/backend/.env` :

```env
# ── Base de données ───────────────────────────────
# SQLite (développement — par défaut, aucune installation)
DATABASE_URL="file:./dev.db"
DB_TYPE=sqlite

# PostgreSQL (production)
# DATABASE_URL="postgresql://user:password@localhost:5432/mediroute?schema=public"
# DB_TYPE=postgres

# ── Sécurité ──────────────────────────────────────
JWT_SECRET=changez_cette_valeur_en_production_avec_une_chaine_aleatoire_longue
JWT_EXPIRES_IN=7d

# ── Serveur ───────────────────────────────────────
PORT=5001
NODE_ENV=development

# ── CORS — Origines autorisées ────────────────────
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:19006

# ── Services optionnels ───────────────────────────
AZURE_MAPS_KEY=          # Optionnel — cartographie avancée
```

### 4.2 Configuration de l'URL API — Mobile

Dans `/mobile/src/config/constants.ts`, ajustez `API_BASE_URL` :

```typescript
// Émulateur Android (accès au localhost via alias réseau)
export const API_BASE_URL = 'http://10.0.2.2:5001/api';

// Simulateur iOS (accès direct au localhost)
// export const API_BASE_URL = 'http://localhost:5001/api';

// Appareil physique (remplacez par l'IP de votre machine)
// export const API_BASE_URL = 'http://192.168.1.XX:5001/api';
```

### 4.3 Configuration de l'URL API — Web

Dans `/web/src/config/constants.ts` :

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
```

Ou via un fichier `/web/.env` :

```env
REACT_APP_API_BASE_URL=http://localhost:5001/api
```

---

## 5. Démarrage rapide

### 5.1 Démarrer en développement

Ouvrez **trois terminaux** :

**Terminal 1 — Backend**
```bash
npm run dev:backend:postgres
# Le serveur démarre sur http://localhost:5001
# API disponible sur http://localhost:5001/api
```

**Terminal 2 — Web**
```bash
npm run dev:web
# L'application web démarre sur http://localhost:3000
```

**Terminal 3 — Mobile** *(optionnel)*
```bash
npm run dev:mobile
# QR code affiché — scannez avec l'app Expo Go sur votre téléphone
# Ou pressez 'i' pour iOS simulateur / 'a' pour Android émulateur
```

### 5.2 Vérifier que tout fonctionne

```bash
# Tester l'API
curl http://localhost:5001/api/hospitals

# Réponse attendue : { "success": true, "data": [...], "pagination": {...} }
```

### 5.3 Accéder à Prisma Studio (interface BDD visuelle)

```bash
npm run prisma:studio
# Ouvre http://localhost:5555 — exploration visuelle de la base de données
```

---

## 6. Comptes de test

Après avoir exécuté `npm run prisma:seed` :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Médecin** | dr.diallo@mediroute.sn | Doctor123! |
| **Patient** | patient@mediroute.sn | Patient123! |
| **Administrateur** | *(créer manuellement — voir ci-dessous)* | — |

### Créer un compte administrateur

```bash
# Via Prisma Studio : http://localhost:5555
# Créer un User avec role = "ADMIN"

# Ou via curl :
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "role": "patient",
    "email": "admin@mediroute.sn",
    "password": "Admin123!",
    "profile": { "firstName": "Admin", "lastName": "MediRoute", "phone": "+221700000000", "city": "Dakar", "region": "Dakar" }
  }'
# Puis modifier le role en ADMIN via Prisma Studio
```

---

## 7. Interface Web — Espace Patient

> Accès : http://localhost:3000 · Se connecter avec un compte de rôle `patient`

### 7.1 Inscription

1. Cliquer sur **"S'inscrire"** depuis la page de connexion
2. Choisir **"Patient"** dans le sélecteur de rôle
3. Remplir les informations personnelles :
   - Prénom, Nom
   - Email (identifiant unique)
   - Téléphone
   - Ville et Région
   - Mot de passe (8 caractères minimum)
4. Cliquer sur **"Créer mon compte"**
5. Redirection automatique vers le tableau de bord patient

### 7.2 Onglet Rendez-vous

**Prendre un rendez-vous :**
1. Cliquer sur **"Nouveau rendez-vous"** (bouton bleu en haut à droite)
2. Dans le formulaire :
   - Choisir un médecin depuis la liste déroulante
   - Sélectionner la date (format `AAAA-MM-JJ`)
   - Entrer l'heure souhaitée (`HH:MM`)
   - Choisir le type : `CONSULTATION`, `FOLLOW_UP`, `ROUTINE_CHECKUP`, `TELECONSULTATION`, `EMERGENCY`
   - Rédiger le motif de consultation
3. Cliquer sur **"Confirmer"**

**Consulter ses rendez-vous :**
- Les rendez-vous sont affichés avec leur statut coloré :
  - 🟡 **En attente** — en cours d'examen par le médecin
  - 🟢 **Confirmé** — le médecin a accepté
  - 🔴 **Annulé** — annulé par le médecin ou le patient
  - 🟣 **Terminé** — consultation effectuée

**Annuler un rendez-vous :**
- Cliquer sur le bouton **"Annuler"** sur la carte du rendez-vous (disponible uniquement pour les statuts PENDING et CONFIRMED)

### 7.3 Onglet Dossier médical

Affiche l'ensemble des consultations enregistrées par les médecins :
- Date et type de consultation
- Diagnostic et symptômes
- Signes vitaux enregistrés lors de la consultation
- Notes et prescriptions associées
- Indicateur "Suivi requis" avec date de prochain suivi

### 7.4 Onglet Résultats labo

Affiche tous les résultats d'analyses biologiques :
- Nom et code du test
- Résultat et unité de mesure
- Valeur de référence
- Statut coloré :
  - 🟢 **NORMAL** — valeur dans les limites normales
  - 🟡 **ABNORMAL** — valeur hors normes, à surveiller
  - 🔴 **CRITICAL** — valeur critique, action immédiate requise
  - ⚪ **PENDING** — résultat en attente

### 7.5 Onglet Factures

Tableau récapitulatif de la facturation :
- **Total facturé** et **solde dû** affichés en cartes KPI
- Liste des factures avec :
  - Numéro de facture
  - Date d'émission et d'échéance
  - Montant (en XOF — Francs CFA)
  - Statut : PAID (vert), PENDING (orange), OVERDUE (rouge), CANCELLED (gris)

### 7.6 Onglet Messagerie

**Démarrer une conversation :**
1. Cliquer sur le bouton **"+"** dans le panneau gauche
2. Choisir un médecin parmi ceux avec qui vous avez eu un rendez-vous
3. La conversation s'ouvre dans le panneau droit

**Envoyer un message :**
- Taper le message dans la zone de saisie
- Appuyer sur `Entrée` ou cliquer sur le bouton **Envoyer** (icône avion)
- Les messages envoyés apparaissent à droite (bleu marine), reçus à gauche (gris)
- Un indicateur **"Lu"** ou **"Envoyé"** s'affiche sous chaque message envoyé

**Mise à jour automatique :** les nouveaux messages s'affichent automatiquement toutes les 5 secondes sans recharger la page.

### 7.7 Onglet Mon profil

**Modifier les informations personnelles :**
1. Modifier les champs : Prénom, Nom, Téléphone, Ville, Région
2. Modifier les informations médicales : groupe sanguin, allergies, antécédents, contact d'urgence
3. Cliquer sur **"Enregistrer"**

**Changer le mot de passe :**
1. Entrer l'**ancien mot de passe** (obligatoire pour la sécurité)
2. Entrer le **nouveau mot de passe** (8 caractères minimum)
3. Confirmer le nouveau mot de passe
4. Cliquer sur **"Changer le mot de passe"**
   - Si l'ancien mot de passe est incorrect → message d'erreur rouge
   - Si les mots de passe ne correspondent pas → indication en temps réel

---

## 8. Interface Web — Espace Médecin

> Accès : http://localhost:3000 · Se connecter avec un compte de rôle `doctor`

> **Note :** un médecin nouvellement inscrit a le statut `PENDING` (en attente de validation). Il doit être **approuvé** par un administrateur avant de pouvoir recevoir des rendez-vous.

### 8.1 Inscription médecin

1. Cliquer sur **"S'inscrire"**
2. Choisir **"Médecin"** dans le sélecteur de rôle
3. Remplir les informations personnelles (idem patient)
4. Remplir les **informations professionnelles** :
   - Spécialisation (ex. : Cardiologie, Pédiatrie)
   - Numéro de licence médicale (unique)
   - Hôpital affilié (optionnel)
   - Tarif de consultation (optionnel)
   - Années d'expérience (optionnel)
5. Créer le compte — statut initial : **EN ATTENTE DE VALIDATION**

### 8.2 Onglet Rendez-vous

Affiche tous les rendez-vous du médecin avec filtres :
- **Aujourd'hui** — rendez-vous du jour
- **À venir** — rendez-vous futurs
- **Historique** — consultations passées

**Actions disponibles par statut :**
- PENDING → boutons **Confirmer** / **Annuler**
- CONFIRMED → bouton **Marquer comme terminé** + zone **Notes du médecin**

### 8.3 Onglet DPI Patients (Dossier Patient Informatisé 360°)

Panneau gauche : liste des patients ayant eu un rendez-vous avec le médecin.

Cliquer sur un patient ouvre son DPI complet avec 3 sous-onglets :

**Sous-onglet Dossiers :**
- Historique de toutes les consultations
- Formulaire d'ajout de compte-rendu :
  - Type d'acte, diagnostic, symptômes
  - Notes, suivi requis, date de prochain RDV

**Sous-onglet Vitaux :**
- Historique des mesures : fréquence cardiaque, tension (systolique/diastolique), température, saturation en oxygène, glycémie, poids, taille
- Formulaire d'enregistrement de nouveaux signes vitaux

**Sous-onglet Labo :**
- Historique des résultats de laboratoire du patient
- Formulaire de saisie d'un nouveau résultat (nom du test, valeur, unité, plage de référence, statut NORMAL/ABNORMAL/CRITICAL/PENDING)

### 8.4 Onglet Télémédecine

Filtre les rendez-vous de type `TELECONSULTATION` et permet :

**Créer une session :**
1. Cliquer sur **"Démarrer la session"** sur un rendez-vous de téléconsultation confirmé
2. Un lien Jitsi Meet est généré automatiquement (format `https://meet.jit.si/mediroute-{roomId}`)
3. Cliquer sur **"Rejoindre"** pour ouvrir la visioconférence dans un nouvel onglet
4. Cliquer sur **"Copier le lien"** pour partager l'URL avec le patient

### 8.5 Onglet Messagerie

Identique à l'espace patient. Les contacts disponibles sont les **patients** ayant eu un rendez-vous avec ce médecin.

### 8.6 Onglet Mon profil

- Informations personnelles (nom, téléphone, ville, région)
- **Informations professionnelles** (lecture seule) : spécialisation, numéro de licence
- Bio, hôpital d'affiliation, tarif et années d'expérience (modifiables)
- Changement de mot de passe (avec vérification de l'ancien)

---

## 9. Interface Web — Espace Administrateur

> Accès : http://localhost:3000 · Se connecter avec un compte de rôle `admin`

### 9.1 Onglet Tableau de bord

Vue d'ensemble de la plateforme avec 4 KPIs :
- **Patients** inscrits
- **Médecins approuvés** (+ nombre en attente)
- **Hôpitaux** référencés
- **Rendez-vous** total (+ nombre en attente)

Alerte automatique si des médecins sont en attente de validation.

Tableau de répartition des hôpitaux par région.

### 9.2 Onglet Médecins

**Filtres disponibles :** Tous / En attente / Approuvés / Rejetés

**Valider un médecin :**
1. Localiser le médecin avec le statut **PENDING** (orange)
2. Cliquer sur **"Approuver"** ou **"Rejeter"**
3. Ajouter une note optionnelle
4. Confirmer l'action

Le médecin peut ensuite se connecter et recevoir des rendez-vous (si approuvé).

### 9.3 Onglet Patients

Liste de tous les patients inscrits avec :
- Informations de contact (email, téléphone)
- Localisation (ville, région)
- Statut du compte (ACTIVE / INACTIVE)
- Bouton **Désactiver / Activer** pour gérer l'accès

### 9.4 Onglet Hôpitaux

**Vue KPI en haut :**
- Total hôpitaux, total lits (toutes structures), lits disponibles en temps réel, hôpitaux avec urgences actives

**Filtres :**
- Recherche textuelle (nom ou ville)
- Filtre par région
- Filtre par type (PUBLIC / PRIVATE / CLINIC / SPECIALIST)

**Carte hôpital — informations affichées :**
- Nom, type, ville, région
- Badge **"Urgences"** (vert) si l'hôpital accepte les urgences
- **Barre de capacité** colorée : rouge (occupés) + jaune (maintenance) + violet (réservés) + vert (disponibles)
- Compteurs : `✓ X disponibles · Y occupés / Z total`
- **Spécialisations** (chips teal) et **Services** (chips indigo) parsés depuis les données
- Temps d'attente estimé

**Modifier un hôpital :**
1. Cliquer sur l'icône ✏️ (crayon) sur la carte
2. Modifier dans le dialogue : lits total, lits disponibles, temps d'attente, acceptation des urgences, spécialisations (séparées par virgule), services
3. Cliquer sur **"Enregistrer"**

### 9.5 Onglet Gestion des lits

1. Sélectionner un hôpital dans la liste déroulante
2. **Résumé par service** : cartes KPI avec libres / occupés / maint. / total et barre d'occupation
3. **Grille des lits** par service : chaque lit est une boîte colorée cliquable
   - 🟢 Vert : AVAILABLE
   - 🔴 Rouge : OCCUPIED
   - 🟡 Jaune : MAINTENANCE
   - 🔵 Bleu : RESERVED

**Changer le statut d'un lit :**
1. Cliquer sur le lit voulu
2. Sélectionner le nouveau statut
3. Si OCCUPIED : saisir le nom du patient
4. Ajouter une note (optionnel)
5. Cliquer sur **"Enregistrer"**

**Ajouter un lit :**
- Cliquer sur **"Ajouter un lit"** (bouton bleu)
- Renseigner : numéro de lit, service (ex. Cardiologie), type (STANDARD / ICU / PEDIATRIC / MATERNITY / ISOLATION / EMERGENCY)

### 9.6 Onglet Inventaire

1. Sélectionner un hôpital
2. **Alerte stock faible** : bandeau orange si des articles sont sous le seuil minimum
3. **Tableau des articles** : nom, SKU, catégorie, stock actuel (rouge si faible), seuil minimum

**Ajouter un article :**
- Nom, SKU, catégorie (MEDICATION / EQUIPMENT / CONSUMABLE / OTHER), unité, stock initial, seuil min, stock max

**Enregistrer un mouvement de stock :**
1. Cliquer sur **"Mouvement"** sur la ligne de l'article
2. Type : `IN` (entrée), `OUT` (consommation), `RETURNED` (retour), `ADJUSTED` (inventaire)
3. Quantité et motif
4. Le stock se met à jour automatiquement

### 9.7 Onglet Mon profil

Identique aux autres rôles (infos personnelles, email non-modifiable, changement de mot de passe).

---

## 10. Application Mobile

> Expo SDK 50 · React Native · React Native Paper

### 10.1 Démarrage

```bash
cd mobile
npx expo start

# Options disponibles après démarrage :
# i → simulateur iOS (macOS requis + Xcode)
# a → émulateur Android (Android Studio requis)
# Scan QR → appareil physique via l'app Expo Go
```

**Expo Go** (appareil physique) :
- iOS : App Store → "Expo Go"
- Android : Play Store → "Expo Go"
- Scanner le QR code affiché dans le terminal

### 10.2 Navigation globale

```
App
├── Login (non-connecté)
├── Register (non-connecté)
├── Emergency (non-connecté + connecté patient)
│
├── PatientTabs [rôle PATIENT]
│   ├── Onglet Rendez-vous
│   ├── Onglet Hôpitaux
│   ├── Onglet Messages
│   └── Onglet Profil
│
└── DoctorTabs [rôle DOCTOR]
    ├── Onglet Agenda
    ├── Onglet Patients
    ├── Onglet Messages
    └── Onglet Profil
```

### 10.3 Écran de connexion

- Entrer email et mot de passe
- Bouton **"URGENCE MÉDICALE"** (rouge) — accessible même sans connexion
- Lien vers l'écran d'inscription
- La session est mémorisée (AsyncStorage) — pas besoin de se reconnecter à chaque ouverture

### 10.4 Écran d'inscription

- Sélecteur **Patient** ou **Médecin** (SegmentedButton)
- Formulaire commun : prénom, nom, email, téléphone, ville, région, mot de passe
- Formulaire médecin (si sélectionné) : spécialisation, numéro de licence, hôpital affilié
- Compte créé → connexion automatique

### 10.5 Espace Patient — Onglet Rendez-vous

**Voir ses rendez-vous :**
- Liste avec statut coloré, médecin, type, date/heure, motif

**Prendre un rendez-vous :**
1. Bouton **"Nouveau"** (coin supérieur droit)
2. Faire défiler horizontalement pour choisir le médecin
3. Saisir date (AAAA-MM-JJ), heure (HH:MM)
4. Choisir le type (chips horizontaux)
5. Saisir le motif
6. **"Confirmer le rendez-vous"**

**Urgence médicale :**
Bouton rouge **"Urgence médicale"** en bas de l'écran → ouvre l'écran d'urgence avec formulaire et géolocalisation.

### 10.6 Espace Patient — Onglet Hôpitaux

- Champ de recherche par nom ou ville
- Chips de filtre par région (défilement horizontal)
- Carte par hôpital :
  - Badge **Urgences** (si actif)
  - **Barre de capacité** : rouge (occupés) + vert (disponibles)
  - Compteurs de lits avec légende
  - **Spécialisations** en chips teal
  - Temps d'attente estimé si renseigné

### 10.7 Espace Patient — Onglet Messages

**Liste des conversations :**
- Avatar avec badge rouge pour les messages non lus
- Aperçu du dernier message
- Horodatage
- Section "Médecins disponibles" (ceux avec qui vous avez eu un RDV)

**Dans une conversation :**
- Flèche retour ← pour revenir à la liste
- Bulles de messages (bleu foncé = envoyé, gris = reçu)
- Indicateur Lu / Envoyé
- Zone de saisie + bouton envoyer (teal)
- `Entrée` pour envoyer
- Mise à jour automatique toutes les **5 secondes**

### 10.8 Espace Patient — Onglet Profil

- Photo (initiales) avec nom et email
- Section **Informations personnelles** : prénom, nom, téléphone, ville, région → bouton Enregistrer
- Section **Changer le mot de passe** : ancien mot de passe requis + nouveau + confirmation → bouton Changer
- Bouton **"Urgence médicale"** (rouge)
- Bouton **"Se déconnecter"** (rouge bordure)

### 10.9 Espace Médecin — Onglet Agenda

- Filtres par statut : Tous / En attente / Confirmé / Terminé / Annulé
- Carte par rendez-vous : patient, type, heure, date, motif
- **Actions :**
  - PENDING → **Confirmer** (vert) ou **Annuler** (rouge)
  - CONFIRMED → **Marquer terminé** (violet)

### 10.10 Espace Médecin — Onglet Patients

- Liste des patients uniques ayant eu un rendez-vous avec ce médecin
- Champ de recherche par nom
- Carte patient : avatar, nom, email, date du dernier RDV et type

### 10.11 Écran d'urgence (tous)

Formulaire en étapes :
1. Répondre aux questions de triage (conscience, mobilité, symptômes…)
2. Renseigner la localisation (ville, région)
3. Autoriser la géolocalisation GPS
4. Soumettre → affichage des **hôpitaux les plus proches** triés par distance avec lits disponibles et téléphone urgences

---

## 11. API REST — Référence complète

> Base URL : `http://localhost:5001/api`  
> Authentification : `Authorization: Bearer <token>` (sauf routes publiques)

### 11.1 Authentification — `/api/auth`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/auth/register` | Non | Créer un compte |
| `POST` | `/auth/login` | Non | Se connecter → retourne `token` + `user` |
| `GET` | `/auth/profile` | Oui | Profil de l'utilisateur connecté |
| `PUT` | `/auth/profile` | Oui | Mettre à jour le profil (+ patientInfo/doctorInfo) |
| `PUT` | `/auth/password` | Oui | Changer le mot de passe (currentPassword requis) |

**Body register (patient) :**
```json
{
  "role": "patient",
  "email": "user@example.com",
  "password": "Password123!",
  "profile": {
    "firstName": "Prénom",
    "lastName": "Nom",
    "phone": "+221771234567",
    "city": "Dakar",
    "region": "Dakar"
  },
  "patientInfo": {
    "bloodGroup": "O+",
    "allergies": "Pénicilline",
    "emergencyContactName": "Contact",
    "emergencyContactPhone": "+221771234568"
  }
}
```

**Body register (médecin) :**
```json
{
  "role": "doctor",
  "email": "doctor@example.com",
  "password": "Doctor123!",
  "profile": { ... },
  "doctorInfo": {
    "specialization": "Cardiologie",
    "licenseNumber": "SN-MED-2024-001",
    "hospitalAffiliation": "Hôpital Principal de Dakar",
    "consultationFee": 15000,
    "yearsOfExperience": 10
  }
}
```

### 11.2 Rendez-vous — `/api/appointments`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/appointments` | Oui | Créer un rendez-vous |
| `GET` | `/appointments/patient` | Oui (patient) | Mes rendez-vous (patient) |
| `GET` | `/appointments/doctor` | Oui (médecin) | Mes rendez-vous (médecin) |
| `PUT` | `/appointments/:id/status` | Oui | Changer le statut (CONFIRMED/CANCELLED/COMPLETED) |
| `PUT` | `/appointments/:id/notes` | Oui (médecin) | Ajouter des notes médecin |

**Body créer un rendez-vous :**
```json
{
  "doctorId": "uuid-du-medecin",
  "patientId": "uuid-du-patient",
  "appointmentDate": "2026-05-15",
  "appointmentTime": "09:00",
  "type": "CONSULTATION",
  "reason": "Douleurs thoraciques depuis 3 jours"
}
```

**Types de rendez-vous :** `CONSULTATION`, `FOLLOW_UP`, `EMERGENCY`, `ROUTINE_CHECKUP`, `TELECONSULTATION`

**Statuts :** `PENDING` → `CONFIRMED` → `COMPLETED` | `CANCELLED`

### 11.3 Hôpitaux — `/api/hospitals`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/hospitals` | Non | Liste (avec `liveBedStats`, `occupancyRate`) |
| `GET` | `/hospitals/:id` | Non | Détail d'un hôpital |
| `GET` | `/hospitals/regions` | Non | Liste des régions disponibles |
| `GET` | `/hospitals/search` | Non | Recherche (region, type, service, emergency) |
| `POST` | `/hospitals` | Oui (admin) | Créer un hôpital |
| `PUT` | `/hospitals/:id` | Oui (admin) | Modifier un hôpital |
| `PUT` | `/hospitals/:id/capacity` | Oui (admin) | Mettre à jour la capacité urgences |

**Paramètres de pagination :** `?page=1&limit=50&region=Dakar&type=PUBLIC`

**Réponse `GET /hospitals` :**
```json
{
  "success": true,
  "data": [{
    "id": "...",
    "name": "Hôpital Principal de Dakar",
    "type": "PUBLIC",
    "region": "Dakar",
    "totalBeds": 450,
    "availableBeds": 120,
    "canAcceptEmergency": true,
    "waitingTime": 30,
    "specializations": "Cardiologie,Neurologie,Oncologie",
    "services": "Radiologie,Laboratoire,Pharmacie",
    "liveBedStats": {
      "total": 450,
      "available": 118,
      "occupied": 298,
      "maintenance": 20,
      "reserved": 14
    },
    "occupancyRate": 66
  }],
  "pagination": { "total": 15, "page": 1, "limit": 50 }
}
```

### 11.4 Urgences — `/api/emergency`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/emergency/form` | Non | Questions du formulaire de triage |
| `POST` | `/emergency/request` | Non | Soumettre une demande d'urgence |
| `GET` | `/emergency/hospitals/nearby` | Non | Hôpitaux proches (lat, lng, radius) |

### 11.5 Dossiers médicaux — `/api/medical-records`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/medical-records` | Oui (médecin) | Créer un compte-rendu |
| `GET` | `/medical-records/patient/:patientId` | Oui | Dossiers d'un patient |

### 11.6 Signes vitaux — `/api/vital-signs`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/vital-signs` | Oui (médecin) | Enregistrer des signes vitaux |
| `GET` | `/vital-signs/patient/:patientId` | Oui | Historique signes vitaux |

**Body :**
```json
{
  "patientId": "uuid",
  "heartRate": 72,
  "systolic": 120,
  "diastolic": 80,
  "temperature": 37.2,
  "oxygenSaturation": 98,
  "glucoseLevel": 5.4,
  "weight": 70,
  "height": 175,
  "notes": "État général satisfaisant"
}
```

### 11.7 Résultats de laboratoire — `/api/lab-results`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/lab-results` | Oui (médecin) | Saisir un résultat |
| `GET` | `/lab-results/patient/:patientId` | Oui | Résultats d'un patient |

**Statuts résultat :** `NORMAL`, `ABNORMAL`, `CRITICAL`, `PENDING`

### 11.8 Messagerie — `/api/messages`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/messages/conversations` | Oui | Liste des conversations avec dernier message + non-lus |
| `GET` | `/messages/contacts` | Oui | Contacts disponibles (selon rôle) |
| `GET` | `/messages/unread-count` | Oui | Nombre de messages non lus |
| `GET` | `/messages/:partnerId` | Oui | Historique avec un interlocuteur (marque comme lus) |
| `POST` | `/messages` | Oui | Envoyer un message |

**Body envoyer un message :**
```json
{ "receiverId": "uuid-destinataire", "content": "Bonjour Docteur, comment allez-vous ?" }
```

### 11.9 Télémédecine — `/api/telemedicine`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/telemedicine` | Oui (médecin) | Créer une session vidéo |
| `GET` | `/telemedicine/appointment/:appointmentId` | Oui | Session d'un rendez-vous |
| `PUT` | `/telemedicine/:id/end` | Oui (médecin) | Terminer la session |

**Réponse création :**
```json
{
  "success": true,
  "data": {
    "roomId": "abc123",
    "joinUrlPatient": "https://meet.jit.si/mediroute-abc123",
    "joinUrlDoctor": "https://meet.jit.si/mediroute-abc123"
  }
}
```

### 11.10 Gestion des lits — `/api/beds`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/beds/hospital/:hospitalId` | Oui | Lits + stats par service |
| `POST` | `/beds` | Oui (admin) | Ajouter un lit |
| `PUT` | `/beds/:id` | Oui (admin) | Modifier statut d'un lit |

**Statuts :** `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `RESERVED`  
**Types :** `STANDARD`, `ICU`, `PEDIATRIC`, `MATERNITY`, `ISOLATION`, `EMERGENCY`

### 11.11 Inventaire — `/api/inventory`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/inventory/hospital/:hospitalId` | Oui | Articles + lowStockCount |
| `POST` | `/inventory` | Oui (admin) | Créer un article |
| `POST` | `/inventory/movement` | Oui (admin) | Enregistrer un mouvement |

**Types de mouvement :** `IN`, `OUT`, `RETURNED`, `ADJUSTED`

### 11.12 Facturation — `/api/invoices`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/invoices/patient/:patientId` | Oui | Factures d'un patient |
| `POST` | `/invoices` | Oui (admin) | Créer une facture |
| `PUT` | `/invoices/:id` | Oui (admin) | Modifier une facture |

### 11.13 Administration — `/api/admin`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/admin/stats` | Oui (admin) | Statistiques globales |
| `GET` | `/admin/doctors` | Oui (admin) | Liste médecins (`?status=PENDING`) |
| `PUT` | `/admin/doctors/:userId/verify` | Oui (admin) | Approuver / Rejeter un médecin |
| `GET` | `/admin/patients` | Oui (admin) | Liste patients |
| `PUT` | `/admin/users/:userId/status` | Oui (admin) | Activer / Désactiver un compte |

---

## 12. Base de données — Modèle de données

### 12.1 Modèles principaux

```
User (21 champs)
├── DoctorInfo    (1:1 — spécialisation, licence, vérification)
├── PatientInfo   (1:1 — groupe sanguin, allergies, contact urgence)
├── Appointment[] (rendez-vous en tant que patient)
├── Appointment[] (rendez-vous en tant que médecin)
├── MedicalRecord[]
├── Message[]     (messages envoyés)
└── Message[]     (messages reçus)

Hospital (25+ champs)
├── HospitalBed[]      (lits individuels)
├── InventoryItem[]    (articles en stock)
├── Appointment[]
└── EmergencyRequest[]

Appointment
├── Prescription[]     (ordonnances)
└── TelemedicineSession (1:1 optionnel)

MedicalRecord
├── Attachment[]       (pièces jointes)
└── VitalSigns (via patientId + date)

LabResult             (résultats biologiques)
Invoice
└── InvoiceItem[]

Message               (senderId → receiverId, isRead)
AuditLog              (traçabilité des actions)
```

### 12.2 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `PATIENT` | Ses rendez-vous, son dossier, ses factures, messagerie avec ses médecins |
| `DOCTOR` | Ses rendez-vous, DPI de ses patients, télémédecine, messagerie |
| `HOSPITAL_ADMIN` | Gestion des lits et inventaire de son hôpital |
| `ADMIN` | Accès complet à toute la plateforme |

---

## 13. Déploiement en production

### 13.1 Passer de SQLite à PostgreSQL

1. **Installer PostgreSQL** (ou utiliser un service cloud : Supabase, Railway, Neon)
2. Créer la base de données :
   ```sql
   CREATE DATABASE mediroute;
   CREATE USER mediroute WITH PASSWORD 'motdepasse_securise';
   GRANT ALL PRIVILEGES ON DATABASE mediroute TO mediroute;
   ```
3. Modifier `/backend/.env` :
   ```env
   DATABASE_URL="postgresql://mediroute:motdepasse_securise@localhost:5432/mediroute?schema=public"
   NODE_ENV=production
   JWT_SECRET=chaine_aleatoire_tres_longue_en_production
   ```
4. Modifier `/backend/prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Appliquer les migrations :
   ```bash
   cd backend && npx prisma migrate deploy
   npx prisma db seed
   ```

### 13.2 Build de production

```bash
# Backend
cd backend && npm run build
# Fichiers compilés dans /backend/dist/

# Web
cd web && npm run build
# Fichiers statiques dans /web/build/ — déployer sur Nginx, Vercel, Netlify...

# Démarrer le backend en production
cd backend && node dist/server-postgres.js
```

### 13.3 Variables d'environnement production

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://...
JWT_SECRET=<256-bit random string>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://votre-domaine.com
```

### 13.4 Docker (optionnel)

```bash
# Démarrer PostgreSQL via Docker
npm run docker:up

# Arrêter
npm run docker:down

# Voir les logs
npm run docker:logs
```

### 13.5 Build mobile (APK / IPA)

```bash
cd mobile

# Build Android (APK)
npx expo build:android

# Build iOS (IPA)
npx expo build:ios

# Ou avec EAS Build (recommandé)
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

---

## 14. Dépannage

### Le backend ne démarre pas

```bash
# Vérifier que le port n'est pas déjà utilisé
lsof -i :5001

# Vérifier les variables d'environnement
cat backend/.env

# Régénérer le client Prisma
cd backend && npx prisma generate
```

### Erreur "Cannot find module @prisma/client"

```bash
cd backend && npm install && npx prisma generate
```

### La base de données SQLite est corrompue

```bash
# Supprimer la base et recréer
rm backend/prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

### L'app mobile ne se connecte pas à l'API

1. Vérifier que le backend tourne sur le port 5001
2. Vérifier l'`API_BASE_URL` dans `mobile/src/config/constants.ts` :
   - Émulateur Android : `http://10.0.2.2:5001/api`
   - Simulateur iOS : `http://localhost:5001/api`
   - Appareil physique : `http://[IP-DE-VOTRE-MACHINE]:5001/api`
3. Vérifier que le firewall autorise le port 5001
4. S'assurer que le téléphone et l'ordinateur sont sur le même réseau Wi-Fi

### L'app web affiche une page blanche

```bash
# Vérifier les erreurs dans la console du navigateur (F12)
# Vérifier que le backend est démarré
curl http://localhost:5001/api/hospitals

# Relancer le serveur web
cd web && npm start
```

### Erreur JWT "invalid signature" ou "token expired"

```bash
# Vider le localStorage du navigateur
# Puis se reconnecter

# Si le JWT_SECRET a changé, tous les tokens existants sont invalidés
# C'est normal — les utilisateurs doivent se reconnecter
```

### Médecin ne peut pas se connecter après inscription

Vérifier que son compte a été **approuvé** par un administrateur dans l'onglet **Médecins** du dashboard admin. Un médecin avec le statut `PENDING` ne peut pas effectuer d'actions sur la plateforme.

### Prisma Studio ne s'ouvre pas

```bash
cd backend && npx prisma studio --port 5555
# Accéder à http://localhost:5555
```

---

## Annexe — Structure complète des routes API

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile
PUT    /api/auth/password

POST   /api/appointments
GET    /api/appointments/patient
GET    /api/appointments/doctor
PUT    /api/appointments/:id/status
PUT    /api/appointments/:id/notes

GET    /api/hospitals
GET    /api/hospitals/:id
GET    /api/hospitals/regions
GET    /api/hospitals/search
POST   /api/hospitals
PUT    /api/hospitals/:id
PUT    /api/hospitals/:id/capacity

GET    /api/emergency/form
POST   /api/emergency/request
GET    /api/emergency/hospitals/nearby

GET    /api/medical-records/patient/:patientId
POST   /api/medical-records

GET    /api/vital-signs/patient/:patientId
POST   /api/vital-signs

GET    /api/lab-results/patient/:patientId
POST   /api/lab-results

GET    /api/messages/conversations
GET    /api/messages/contacts
GET    /api/messages/unread-count
GET    /api/messages/:partnerId
POST   /api/messages

POST   /api/telemedicine
GET    /api/telemedicine/appointment/:appointmentId
PUT    /api/telemedicine/:id/end

GET    /api/beds/hospital/:hospitalId
POST   /api/beds
PUT    /api/beds/:id

GET    /api/inventory/hospital/:hospitalId
POST   /api/inventory
POST   /api/inventory/movement

GET    /api/invoices/patient/:patientId
POST   /api/invoices
PUT    /api/invoices/:id

GET    /api/admin/stats
GET    /api/admin/doctors
PUT    /api/admin/doctors/:userId/verify
GET    /api/admin/patients
PUT    /api/admin/users/:userId/status
```

---

*Documentation générée pour MediRoute v1.0 — Mai 2026*
