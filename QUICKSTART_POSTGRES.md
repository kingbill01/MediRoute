# 🐘 Guide de Démarrage Rapide avec PostgreSQL

Ce guide vous permet de tester MediRoute localement avec PostgreSQL au lieu d'Azure Cosmos DB.

## 🚀 Installation Ultra-Rapide (2 minutes)

### 1. Démarrer PostgreSQL avec Docker

```bash
cd MediRoute

# Démarrer PostgreSQL et pgAdmin
docker-compose up -d

# Vérifier que PostgreSQL est démarré
docker-compose ps
```

PostgreSQL sera accessible sur:
- **Database**: `localhost:5432`
- **pgAdmin**: http://localhost:5050
  - Email: admin@mediroute.sn
  - Password: admin

### 2. Configurer le Backend

```bash
cd backend

# Copier le fichier de configuration
cp .env.example .env
```

Éditez `.env` pour utiliser PostgreSQL:

```env
# Configuration PostgreSQL (locale)
DATABASE_URL="postgresql://mediroute:mediroute@localhost:5432/mediroute?schema=public"
DB_TYPE=postgres

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# Serveur
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Azure Maps (optionnel pour le développement)
AZURE_MAPS_KEY=votre-cle-ici
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Créer la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate

# Charger les données de test
npm run prisma:seed
```

Vous verrez:
```
✅ 5 hôpitaux créés
✅ Médecin de test créé: dr.diallo@mediroute.sn
✅ Patient de test créé: patient@mediroute.sn
```

### 5. Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur: http://localhost:5000

### 6. Tester l'API

```bash
# Health check
curl http://localhost:5000/health

# Résultat:
# {
#   "status": "OK",
#   "database": "PostgreSQL",
#   "timestamp": "2026-03-10T...",
#   "uptime": 5.123
# }

# Connexion avec le compte patient de test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@mediroute.sn",
    "password": "Patient123!"
  }'
```

### 7. Démarrer l'Application Web

Dans un nouveau terminal:

```bash
cd web
npm install
npm start
```

L'application s'ouvre sur: http://localhost:3000

## 🧪 Tester l'Application

### Comptes de Test

**Patient:**
- Email: `patient@mediroute.sn`
- Password: `Patient123!`

**Médecin:**
- Email: `dr.diallo@mediroute.sn`
- Password: `Doctor123!`

### Scénarios de Test

#### 1. Connexion Patient
1. Ouvrez http://localhost:3000
2. Connectez-vous avec le compte patient
3. Explorez le tableau de bord

#### 2. Test d'Urgence
1. Sur la page de connexion, cliquez sur "🚨 URGENCE MÉDICALE"
2. Répondez aux questions
3. Vous verrez les 5 hôpitaux du Sénégal chargés

#### 3. Inscription
1. Créez un nouveau compte
2. Remplissez le formulaire
3. Vérifiez dans la base de données

## 🔧 Commandes Utiles

### Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer une nouvelle migration
npm run prisma:migrate

# Réinitialiser la base de données
npm run db:reset

# Voir la base de données via Prisma Studio
npm run prisma:studio
```

Le Studio Prisma s'ouvre sur: http://localhost:5555

### Docker

```bash
# Démarrer PostgreSQL
docker-compose up -d

# Arrêter PostgreSQL
docker-compose down

# Voir les logs
docker-compose logs -f postgres

# Arrêter et supprimer les données
docker-compose down -v
```

### Base de données

```bash
# Se connecter à PostgreSQL
docker exec -it mediroute-postgres psql -U mediroute -d mediroute

# Commandes PostgreSQL utiles
\dt              # Liste des tables
\d users         # Structure de la table users
SELECT COUNT(*) FROM users;
SELECT * FROM hospitals;
\q               # Quitter
```

## 📊 Explorer la Base de Données

### Option 1: Prisma Studio (Recommandé)

```bash
npm run prisma:studio
```

Interface graphique moderne sur http://localhost:5555

### Option 2: pgAdmin

1. Ouvrez http://localhost:5050
2. Connectez-vous:
   - Email: admin@mediroute.sn
   - Password: admin
3. Ajoutez un serveur:
   - Host: postgres (ou localhost)
   - Port: 5432
   - Database: mediroute
   - Username: mediroute
   - Password: mediroute

### Option 3: Ligne de commande

```bash
# Connexion directe
psql postgresql://mediroute:mediroute@localhost:5432/mediroute

# Requêtes
SELECT email, role, "firstName", "lastName" FROM users;
SELECT name, region, "emergencyAvailable" FROM hospitals;
```

## 🗂️ Structure de la Base de Données

```
mediroute/
├── users                 # Utilisateurs (patients, médecins, admins)
├── doctor_info           # Informations médecins
├── doctor_availability   # Disponibilités médecins
├── patient_info          # Informations patients
├── appointments          # Rendez-vous
├── prescriptions         # Ordonnances
├── medical_records       # Dossiers médicaux
├── attachments           # Fichiers attachés
├── hospitals             # Hôpitaux
└── emergency_requests    # Demandes d'urgence
```

## 🔄 Ajouter des Données de Test

### Ajouter un hôpital

```bash
psql postgresql://mediroute:mediroute@localhost:5432/mediroute -c "
INSERT INTO hospitals (id, name, type, region, phone, \"emergencyPhone\", address, city, latitude, longitude, services, specializations, facilities, \"totalBeds\", \"availableBeds\", \"emergencyAvailable\", \"ambulanceAvailable\", \"openingHours\", \"canAcceptEmergency\", \"waitingTime\", verified, rating, \"createdAt\", \"updatedAt\", \"capacityUpdatedAt\")
VALUES (gen_random_uuid(), 'Hôpital de Saint-Louis', 'PUBLIC', 'Saint-Louis', '+221 33 961 10 10', '+221 33 961 10 00', 'Avenue du Général de Gaulle', 'Saint-Louis', 16.0181, -16.4897, ARRAY['Urgences', 'Chirurgie', 'Maternité'], ARRAY['Médecine générale', 'Chirurgie'], ARRAY['Laboratoire', 'Radiologie'], 150, 50, true, true, '{\"all\": \"24/7\"}', true, 20, true, 4.3, NOW(), NOW(), NOW());
"
```

### Modifier le script seed.ts

Éditez `backend/prisma/seed.ts` et relancez:

```bash
npm run prisma:seed
```

## 🐛 Dépannage

### Erreur: "Cannot connect to PostgreSQL"

```bash
# Vérifier que Docker est démarré
docker ps

# Redémarrer PostgreSQL
docker-compose restart postgres

# Voir les logs
docker-compose logs postgres
```

### Erreur: "Port 5432 already in use"

Vous avez déjà PostgreSQL installé localement. Options:

1. Arrêtez votre PostgreSQL local
2. Changez le port dans `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"
   ```
   Et dans `.env`:
   ```
   DATABASE_URL="postgresql://mediroute:mediroute@localhost:5433/mediroute"
   ```

### Réinitialiser complètement

```bash
# Arrêter et supprimer les données
docker-compose down -v

# Redémarrer
docker-compose up -d

# Recréer la base
cd backend
npm run db:reset
npm run prisma:seed
```

## 📈 Avantages de PostgreSQL pour le Développement

✅ **Installation facile** avec Docker  
✅ **Pas de compte Azure** nécessaire  
✅ **Gratuit** pour le développement  
✅ **Outils puissants** (Prisma Studio, pgAdmin)  
✅ **Performances** excellentes  
✅ **Migrations** automatiques avec Prisma  
✅ **SQL standard** facile à debugger  

## 🚀 Migration vers Cosmos DB en Production

Quand vous êtes prêt pour la production:

1. Créez un compte Azure Cosmos DB
2. Changez `DB_TYPE=cosmos` dans `.env`
3. Utilisez les contrôleurs avec Cosmos DB
4. Déployez sur Azure

Les deux systèmes coexistent dans le code!

## 📚 Ressources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

## 💬 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. Vérifiez les logs: `docker-compose logs -f`
2. Consultez Prisma Studio: `npm run prisma:studio`
3. Vérifiez la connexion: `docker exec -it mediroute-postgres psql -U mediroute -c "\l"`

---

**Profitez du développement local rapide avec PostgreSQL! 🐘✨**
