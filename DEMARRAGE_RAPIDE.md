# 🚀 Démarrage Rapide - MediRoute avec PostgreSQL

## Option 1: Avec Docker (Recommandé)

### 1. Démarrer Docker Desktop
Ouvrez l'application Docker Desktop sur votre Mac et attendez qu'elle soit prête.

### 2. Démarrer PostgreSQL
```bash
npm run docker:up
```

### 3. Initialiser la base de données
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Démarrer le serveur
```bash
npm run dev:backend:postgres
```

---

## Option 2: Avec PostgreSQL installé localement

### 1. Installer PostgreSQL avec Homebrew
```bash
brew install postgresql@16
brew services start postgresql@16
```

### 2. Créer la base de données
```bash
createdb mediroute
```

### 3. Créer l'utilisateur
```bash
psql postgres -c "CREATE USER mediroute WITH PASSWORD 'mediroute';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE mediroute TO mediroute;"
```

### 4. Initialiser et démarrer
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:backend:postgres
```

---

## 🧪 Tester l'API

```bash
# Health check
curl http://localhost:5000/health

# Connexion patient
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@mediroute.sn","password":"Patient123!"}'
```

## 🎯 Comptes de Test

**Patient:**
- Email: patient@mediroute.sn
- Password: Patient123!

**Médecin:**
- Email: dr.diallo@mediroute.sn
- Password: Doctor123!

## 📊 Explorer la Base de Données

```bash
# Prisma Studio (interface graphique)
npm run prisma:studio
```

Ouvrira http://localhost:5555

## 🔧 Commandes Utiles

```bash
# Voir les scripts disponibles
npm run

# Logs Docker
npm run docker:logs

# Arrêter Docker
npm run docker:down

# Réinitialiser la base de données
npm run db:reset
```

## ❌ Dépannage

### Docker ne démarre pas
- Assurez-vous que Docker Desktop est ouvert et prêt
- Attendez quelques secondes après l'ouverture

### Port 5432 déjà utilisé
Vous avez déjà PostgreSQL installé. Utilisez l'Option 2 ou arrêtez votre PostgreSQL local:
```bash
brew services stop postgresql@16
```

### Erreur de connexion
Vérifiez que PostgreSQL est démarré:
```bash
# Avec Docker
docker ps | grep postgres

# Avec Homebrew
brew services list | grep postgresql
```
