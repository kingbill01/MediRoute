# Documentation API MediRoute

Version: 1.0.0  
Base URL: `https://api.mediroute.sn/api` (production)  
Base URL: `http://localhost:5000/api` (développement)

## Table des Matières

1. [Authentification](#authentification)
2. [Utilisateurs](#utilisateurs)
3. [Rendez-vous](#rendez-vous)
4. [Hôpitaux](#hôpitaux)
5. [Urgences](#urgences)
6. [Dossiers Médicaux](#dossiers-médicaux)

---

## Authentification

### Inscription

**POST** `/auth/register`

```json
{
  "email": "patient@example.com",
  "password": "securePassword123",
  "role": "patient",
  "profile": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+221771234567",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "address": {
      "city": "Dakar",
      "region": "Dakar",
      "country": "Sénégal"
    }
  },
  "patientInfo": {
    "bloodGroup": "A+",
    "allergies": ["Pénicilline"],
    "emergencyContact": {
      "name": "Marie Dupont",
      "phone": "+221779876543",
      "relationship": "Épouse"
    }
  }
}
```

**Réponse** (201 Created):
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "user": {
      "userId": "uuid-here",
      "email": "patient@example.com",
      "role": "patient",
      "profile": { ... }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Connexion

**POST** `/auth/login`

```json
{
  "email": "patient@example.com",
  "password": "securePassword123"
}
```

**Réponse** (200 OK):
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Obtenir le Profil

**GET** `/auth/profile`

Headers:
```
Authorization: Bearer <token>
```

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "patient@example.com",
    "role": "patient",
    "profile": { ... },
    "patientInfo": { ... }
  }
}
```

---

## Rendez-vous

### Créer un Rendez-vous

**POST** `/appointments`

Headers:
```
Authorization: Bearer <token>
```

```json
{
  "doctorId": "doctor-uuid",
  "appointmentDate": "2026-04-15",
  "appointmentTime": "14:30",
  "duration": 30,
  "type": "consultation",
  "reason": "Consultation de suivi",
  "notes": "Douleurs persistantes"
}
```

**Réponse** (201 Created):
```json
{
  "success": true,
  "message": "Rendez-vous créé avec succès",
  "data": {
    "id": "appointment-uuid",
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid",
    "appointmentDate": "2026-04-15",
    "appointmentTime": "14:30",
    "status": "pending",
    ...
  }
}
```

### Obtenir les Rendez-vous d'un Patient

**GET** `/appointments/patient?status=pending&startDate=2026-04-01&endDate=2026-04-30`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "doctorId": "doctor-uuid",
        "appointmentDate": "2026-04-15",
        "appointmentTime": "14:30",
        "status": "pending",
        "reason": "Consultation de suivi"
      }
    ]
  }
}
```

### Obtenir les Rendez-vous d'un Médecin

**GET** `/appointments/doctor?date=2026-04-15`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "appointments": [ ... ]
  }
}
```

### Annuler un Rendez-vous

**DELETE** `/appointments/:id`

**Réponse** (200 OK):
```json
{
  "success": true,
  "message": "Rendez-vous annulé",
  "data": { ... }
}
```

### Obtenir la Disponibilité d'un Médecin

**GET** `/appointments/doctor/:doctorId/availability?date=2026-04-15`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "doctor": {
      "name": "Dr. Amadou Diallo",
      "specialization": "Médecine générale",
      "availableHours": [
        {
          "day": "Monday",
          "startTime": "08:00",
          "endTime": "17:00"
        }
      ]
    },
    "bookedSlots": ["09:00", "10:30", "14:00"]
  }
}
```

---

## Hôpitaux

### Obtenir Tous les Hôpitaux

**GET** `/hospitals?region=Dakar&type=public&emergencyAvailable=true&page=1&limit=20`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "hospitals": [
      {
        "id": "hospital-uuid",
        "name": "Hôpital Principal de Dakar",
        "type": "public",
        "region": "Dakar",
        "location": {
          "address": "1 Avenue Nelson Mandela",
          "city": "Dakar",
          "region": "Dakar",
          "coordinates": {
            "latitude": 14.6937,
            "longitude": -17.4441
          }
        },
        "contact": {
          "phone": "+221 33 839 50 50",
          "emergencyPhone": "+221 33 839 50 00"
        },
        "availability": {
          "totalBeds": 500,
          "availableBeds": 120,
          "emergencyAvailable": true
        },
        "services": ["Urgences", "Chirurgie", "Maternité"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Obtenir un Hôpital par ID

**GET** `/hospitals/:id`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": { ... }
}
```

### Rechercher des Hôpitaux

**GET** `/hospitals/search?query=principal&region=Dakar&services=Urgences,Maternité`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "hospitals": [ ... ]
  }
}
```

### Créer un Hôpital (Admin uniquement)

**POST** `/hospitals`

Headers:
```
Authorization: Bearer <admin-token>
```

```json
{
  "name": "Clinique Internationale de Dakar",
  "type": "private",
  "location": {
    "address": "Route de Ouakam",
    "city": "Dakar",
    "region": "Dakar",
    "coordinates": {
      "latitude": 14.7167,
      "longitude": -17.4677
    }
  },
  "contact": {
    "phone": "+221 33 860 30 30",
    "emergencyPhone": "+221 33 860 30 00",
    "email": "contact@clinique-dakar.sn"
  },
  "services": ["Cardiologie", "Neurologie", "Urgences"],
  "specializations": ["Cardiologie", "Neurologie"],
  "availability": {
    "totalBeds": 100,
    "availableBeds": 45,
    "emergencyAvailable": true,
    "ambulanceAvailable": true
  },
  "openingHours": [
    {
      "day": "Monday",
      "openTime": "00:00",
      "closeTime": "23:59",
      "is24Hours": true
    }
  ],
  "facilities": ["Scanner", "IRM", "Laboratoire"],
  "emergencyCapacity": {
    "canAcceptEmergency": true,
    "waitingTime": 15
  }
}
```

### Mettre à Jour la Capacité d'Urgence

**PUT** `/hospitals/:id/emergency-capacity`

```json
{
  "canAcceptEmergency": true,
  "waitingTime": 20,
  "availableBeds": 38
}
```

### Obtenir les Régions

**GET** `/hospitals/regions`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "regions": [
      "Dakar",
      "Thiès",
      "Diourbel",
      ...
    ]
  }
}
```

---

## Urgences

### Obtenir le Formulaire d'Urgence

**GET** `/emergency/form`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "symptoms",
        "step": 1,
        "question": "Quels sont les symptômes actuels?",
        "type": "multiple_choice",
        "required": true,
        "options": [
          "Douleur thoracique",
          "Difficulté à respirer",
          "Saignement important",
          ...
        ]
      },
      ...
    ]
  }
}
```

### Soumettre une Demande d'Urgence

**POST** `/emergency/request`

```json
{
  "patientInfo": {
    "name": "Jean Dupont",
    "age": 35,
    "gender": "male",
    "phone": "+221771234567",
    "bloodGroup": "A+"
  },
  "location": {
    "address": "Plateau, près de la Place de l'Indépendance",
    "city": "Dakar",
    "region": "Dakar",
    "coordinates": {
      "latitude": 14.6928,
      "longitude": -17.4467
    }
  },
  "emergencyDetails": {
    "symptoms": ["Douleur thoracique", "Difficulté à respirer"],
    "description": "Douleur thoracique sévère depuis 30 minutes",
    "hasInjury": false,
    "isConscious": true,
    "canMove": false,
    "needsAmbulance": true
  },
  "formResponses": [
    {
      "question": "Quels sont les symptômes actuels?",
      "answer": "Douleur thoracique, Difficulté à respirer"
    },
    ...
  ]
}
```

**Réponse** (201 Created):
```json
{
  "success": true,
  "message": "Demande d'urgence enregistrée",
  "data": {
    "requestId": "emergency-uuid",
    "priorityScore": 9,
    "level": "critical",
    "nearbyHospitals": [
      {
        "hospitalId": "hospital-uuid",
        "name": "Hôpital Principal de Dakar",
        "type": "public",
        "address": "1 Avenue Nelson Mandela",
        "distance": 1.2,
        "availableBeds": 120,
        "emergencyPhone": "+221 33 839 50 00",
        "services": ["Urgences", "Cardiologie"],
        "estimatedWaitTime": 10,
        "coordinates": {
          "latitude": 14.6937,
          "longitude": -17.4441
        }
      },
      ...
    ]
  }
}
```

### Obtenir les Hôpitaux Proches

**GET** `/emergency/hospitals/nearby?latitude=14.6928&longitude=-17.4467&region=Dakar`

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "hospitals": [ ... ]
  }
}
```

### Obtenir l'Historique des Urgences

**GET** `/emergency/history`

Headers:
```
Authorization: Bearer <token>
```

**Réponse** (200 OK):
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "emergency-uuid",
        "status": "completed",
        "level": "critical",
        "createdAt": "2026-03-10T14:30:00Z",
        "assignedHospital": { ... }
      }
    ]
  }
}
```

---

## Codes d'Erreur

| Code | Signification |
|------|---------------|
| 200  | Succès |
| 201  | Créé |
| 400  | Requête invalide |
| 401  | Non authentifié |
| 403  | Accès interdit |
| 404  | Non trouvé |
| 500  | Erreur serveur |

## Format des Erreurs

```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

## Rate Limiting

- 100 requêtes par 15 minutes par IP
- 1000 requêtes par heure pour les utilisateurs authentifiés

## Webhooks (à venir)

Les webhooks permettront de recevoir des notifications pour:
- Nouveaux rendez-vous
- Demandes d'urgence
- Mises à jour de statut

---

Pour plus d'informations: contact@mediroute.sn
