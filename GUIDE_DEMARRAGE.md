# ✅ Guide de Démarrage - Med iRoute avec SQLite

Votre base de données **SQLite est configurée et prête!** ✨

## 📊 Ce qui est installé

✅ Base de données SQLite créée (`backend/dev.db`)  
✅ 5 hôpitaux sénégalais chargés  
✅ 2 comptes de test créés (médecin + patient)  
✅ Prisma Studio disponible

## 🚀 Démarrer l'Application

### 1. Dans un premier terminal: Prisma Studio

```bash
cd /Users/birane.fall/Downloads/MediRoute/backend
npm run prisma:studio
```

➜ Ouvre http://localhost:5555 pour voir les données

### 2. Dans un deuxième terminal: Backend API 

```bash
cd /Users/birane.fall/Downloads/MediRoute/backend
npm run dev:sqlite
```

➜ API disponible sur http://localhost:5000

### 3. Tester que ça fonctionne

```bash
# Health check
curl http://localhost:5000/health

# Devrait afficher:
# {"status":"OK","database":"SQLite via Prisma","timestamp":"...","uptime":5.123}
```

### 4. Tester la connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@mediroute.sn",
    "password": "Patient123!"
  }'
```

## 🎯 Comptes de Test

### Patient
- **Email:** patient@mediroute.sn
- **Password:** Patient123!

### Médecin
- **Email:** dr.diallo@mediroute.sn
- **Password:** Doctor123!

## 📱 D émarrer l'Application Web

Dans un troisième terminal:

```bash
cd /Users/birane.fall/Downloads/MediRoute/web
npm install  # Si pas encore fait
npm start
```

➜ L'application web s'ouvrira sur http://localhost:3000

## 🔍 Voir les Données

### Prisma Studio (Interface Graphique)

```bash
npm run prisma:studio
```

- ➜ http://localhost:5555
- Voir/éditer toutes les tables
- Interface moderne et intuitive

### Command Line (SQLite)

```bash
cd backend
npx prisma studio
# OU avec sqlite3
sqlite3 dev.db "SELECT * FROM User"
```

## ❌ Dépannage

### Port 5000 déjà utilisé

```bash
# Trouver le processus
lsof -ti:5000

# Le tuer
lsof -ti:5000 | xargs kill -9

# Ou tuer tous les Node
killall node

# Redémarrer
npm run dev:sqlite
```

### Erreur "Cannot find module"

```bash
cd backend
npm install
npm run prisma:generate
```

### Réinitialiser la base de données

```bash
cd backend
rm dev.db
npm run prisma:migrate
npm run prisma:seed
```

## 📂 Fichiers Importants

- `backend/dev.db` - Base de données SQLite
- `backend/prisma/schema.prisma` - Schéma de la BDD
- `backend/prisma/seed.ts` - Données de test
- `backend/.env` - Configuration

## 🎨 URLs de l'Application

| Service | URL | Description |
|---------|-----|-------------|
| API Health | http://localhost:5000/health | Vérifier que l'API fonctionne |
| API Auth | http://localhost:5000/api/auth | Authentification |
| Prisma Studio | http://localhost:5555 | Interface BDD |
| Web App | http://localhost:3000 | Application web |

## 🔄 Commandes Utiles

```bash
# Backend
npm run dev:sqlite      # Démarrer avec SQLite
npm run prisma:studio   # Ouvrir Prisma Studio
npm run prisma:seed     # Recharger les données
npm run db:reset        # Réinitialiser la BDD

# Web
npm start               # Démarrer l'app web
npm run build           # Construire pour production

# Mobile
npm run dev:mobile      # Démarrer Expo
```

## ✨ Prochaines Étapes

1. **Tester les endpoints** - Utilisez Postman ou curl
2. **Explorer Prisma Studio** - Voir les données en temps réel  
3. **Développer les features** - Les contrôleurs sont prêts
4. **Ajouter plus d'hôpitaux** - Éditez `prisma/seed.ts`

## 💡 Astuce

Gardez 3 terminaux ouverts simultanément:
1. **Terminal 1**: Prisma Studio (port 5555)
2. **Terminal 2**: Backend API (port 5000)
3. **Terminal 3**: Web App (port 3000)

---

**🎉 Votre environnement de développement est prêt!**
