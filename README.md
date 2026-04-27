# SafeFind Pro

SafeFind Pro est une plateforme web pour la gestion et le suivi des alertes concernant des enfants disparus ou temporairement perdus dans des lieux publics.

Le projet permet de créer une alerte détaillée, d’indiquer la dernière position connue sur une carte, de recevoir des signalements de témoins et de gérer le suivi du cas à travers un espace de discussion et un système de modération.

## Fonctionnalités

- Inscription et connexion des utilisateurs
- Gestion du profil utilisateur
- Création d’alertes avec informations détaillées
- Ajout de photo pour chaque alerte
- Sélection de la position sur une carte interactive
- Récupération de la position GPS actuelle
- Affichage des alertes sur la carte
- Signalement par les témoins
- Ajout d’une photo, d’une description et d’une position dans un signalement
- Forum de discussion pour chaque cas
- Notifications en temps réel
- Gestion des rôles : utilisateur, modérateur et administrateur
- Modération des alertes
- Statistiques générales
- Calcul de scores : priorité, complétude et risque de fausse information
- Service IA séparé pour l’analyse des signalements

## Structure du projet

```text
safefind_fullstack_pro/
│
├── client/          Interface utilisateur
├── server/          Backend et API
├── ai-service/      Service IA
└── docker-compose.yml
```

## Technologies utilisées

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Leaflet
- Socket.io Client

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Socket.io
- Multer
- Cloudinary

### Service IA

- Python
- FastAPI
- DeepFace

### Base de données

- PostgreSQL
- Prisma

## Installation

### Prérequis

- Node.js
- Python
- Docker Desktop
- Git

### Base de données

À la racine du projet :

```bash
docker compose up -d
```

### Backend

```bash
cd server
npm install
copy .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

### Frontend

Dans un autre terminal :

```bash
cd client
npm install
npm run dev
```

### Service IA

Dans un troisième terminal :

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## URLs

```text
Frontend   : http://localhost:5173
Backend    : http://localhost:5000
Service IA : http://localhost:8000
```

## Comptes de test

```text
Admin
Email : admin@safefind.com
Mot de passe : 12345678

Modérateur
Email : moderator@safefind.com
Mot de passe : 12345678

Utilisateur
Email : demo@safefind.com
Mot de passe : 12345678
```

## Configuration Cloudinary

Pour utiliser le stockage cloud des images, ajouter les informations suivantes dans `server/.env` :

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
UPLOAD_MODE=cloudinary
```

Si Cloudinary n’est pas configuré, les images peuvent être stockées localement.

## Scores

Le backend calcule plusieurs scores pour aider au traitement des alertes :

- `completenessScore` : niveau de complétude des informations saisies
- `priorityScore` : priorité de l’alerte
- `falseInfoScore` : risque potentiel de fausse information

Ces scores prennent en compte la présence d’une photo, la précision de la localisation, l’âge de l’enfant, la description, les vêtements, les signes distinctifs et les données du signalement.

## Objectif

SafeFind Pro a pour objectif de faciliter la diffusion rapide des alertes aux personnes proches de la dernière position connue, tout en centralisant les informations, les signalements et les échanges autour de chaque cas.

## État du projet

Le projet contient les éléments principaux nécessaires pour une démonstration :

- Interface utilisateur
- Authentification
- Gestion des rôles
- Création et suivi des alertes
- Carte interactive
- Signalements
- Forum par cas
- Notifications
- Modération
- Statistiques
- Service IA séparé

Certaines parties peuvent encore être améliorées pour une utilisation réelle, notamment la reconnaissance faciale avancée, l’anti-spoofing, la sécurité de production et l’optimisation du filtrage géographique.
