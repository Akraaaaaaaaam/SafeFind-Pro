# SafeFind Pro

Projet full stack amélioré pour la gestion d’alertes de personnes disparues.

## Ce que cette version ajoute
- **Admin panel** avec rôles `USER`, `MODERATOR`, `ADMIN`
- **PostgreSQL + Prisma**
- **Service IA FastAPI** séparé
- **Reconnaissance faciale assistée** (architecture prête, endpoint prévu, DeepFace en dépendance)
- **Stockage cloud des images** via **Cloudinary** ou fallback local
- **Sélection de position sur carte réelle** + **GPS automatique**
- **Forum par cas** avec messages temps réel
- **Signalement “j’ai vu cette personne”** avec photo, GPS, heure, description
- **Badges** et score de confiance utilisateur
- **Statistiques enrichies** (lieux, heures, rôles, badges)
- **Modération** et clôture du cas

## Architecture
- `client/` : React + Vite + Tailwind + React Router + Leaflet + Socket.io client
- `server/` : Express + Prisma + PostgreSQL + Socket.io + Multer + Cloudinary
- `ai-service/` : FastAPI + DeepFace (fallback inclus)
- `docker-compose.yml` : PostgreSQL

## Processus de traitement d’une alerte
1. **Inscription** : l’utilisateur choisit sa position via GPS ou carte réelle.
2. **Création d’alerte** : formulaire précis (photo, taille, poids, vêtements, signes distinctifs, heure, zone, contacts).
3. **Validation backend** : champs requis + calculs :
   - **completenessScore** : qualité du dossier
   - **falseInfoScore** : risque initial de mauvaise information
   - **priorityScore** : priorité de diffusion
4. **Diffusion** : l’alerte apparaît dans la bannière live, sur la carte et dans les notifications.
5. **Signalements témoins** : ajout d’un lieu, d’une heure, d’une photo et d’un texte.
6. **IA** :
   - `risk/analyze` évalue le risque de mauvaise information à partir du texte et du lieu.
   - `face/verify` compare la photo de référence à la photo témoin.
7. **Forum par cas** : famille, témoins et modération peuvent échanger.
8. **Admin / modération** : un modérateur peut mettre en revue, approuver, archiver ou résoudre un cas.
9. **Statistiques** : agrégation par lieu, heure, rôle, badges et volume d’activité.

## Comment la priorité est calculée
Le backend utilise `server/src/utils/scores.js`.
La priorité augmente surtout quand :
- la disparition est **récente**
- l’enfant est **jeune**
- la localisation est **précise**
- le dossier est **complet**
- le risque de mauvaise information est **bas**

## Comment le risque de mauvaise information est calculé
Le risque baisse quand :
- il y a une **photo**
- le **GPS** est fourni
- la description est **longue et précise**
- taille, poids, vêtements, signes distinctifs sont présents

## Reconnaissance faciale : ce qui se passe
La photo de référence de l’alerte et la photo du signalement sont envoyées au service IA.
Cette version contient l’**architecture** et les **endpoints**. Pour une vraie prod, ajoute :
- téléchargement local des images avant vérification
- **DeepFace** ou **InsightFace** avec modèles installés
- **anti-spoofing**
- pipeline de validation humaine

## Installation complète

### 1) Prérequis
- Node.js 20+
- Python 3.11+
- Docker Desktop

### 2) Base de données PostgreSQL
À la racine du projet :
```bash
npm install -g prisma
```
Puis :
```bash
docker compose up -d
```

### 3) Backend
```bash
cd server
npm install
copy .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```
> Sous PowerShell, si `copy` pose problème, crée `.env` manuellement à partir de `.env.example`.

### 4) Frontend
Dans un autre terminal :
```bash
cd client
npm install
npm run dev
```

### 5) Service IA
Dans un troisième terminal :
```bash
cd ai-service
python -m venv .venv
.venv\Scriptsctivate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## URLs
- Frontend : `http://localhost:5173`
- Backend : `http://localhost:5000`
- IA : `http://localhost:8000`

## Comptes de test
- **Admin** : `admin@safefind.com` / `12345678`
- **Modérateur** : `moderator@safefind.com` / `12345678`
- **Utilisateur** : `demo@safefind.com` / `12345678`

## Cloudinary
Si tu veux le stockage cloud, renseigne dans `server/.env` :
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `UPLOAD_MODE=cloudinary`

## Ce qui est prêt et ce qui reste à brancher
Cette archive est **très avancée et exploitable pour ton projet**, mais quelques parties “vraie prod” restent à finaliser selon ton environnement :
- téléchargement effectif d’images distantes côté IA avant `DeepFace.verify`
- anti-spoofing / liveness
- filtrage géographique côté requête SQL
- stockage cloud sécurisé en prod
- panel admin plus complet (suppression, audit détaillé, logs)

C’est volontaire : ça te donne une base forte, claire et extensible, sans te bloquer avec une installation trop fragile dès le début.
