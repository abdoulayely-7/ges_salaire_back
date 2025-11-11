# Backend Gestion des Salaires

API REST back-end complète pour la gestion des ressources humaines et de la paie dans un environnement multi-entreprises, développée avec TypeScript, Express.js et Prisma ORM.

## Description

Ce back-end fournit une API robuste pour gérer :
- Les entreprises et leurs utilisateurs
- Les employés avec différents types de contrats
- Les cycles de paie et bulletins de salaire
- Les paiements avec génération de reçus PDF
- Le système de pointage (présence/absence)
- Les tableaux de bord avec KPIs et statistiques

L'architecture est modulaire avec séparation claire des responsabilités (controllers, services, repositories) et fortement typée avec TypeScript.

## Fonctionnalités Principales

### Gestion des Entreprises
- CRUD complet des entreprises
- Gestion des utilisateurs par entreprise
- Upload de logos
- Configuration des paramètres (devise, période de paie, couleur thème)

### Gestion des Utilisateurs
- Authentification JWT
- Rôles : SUPER_ADMIN, ADMIN, CAISSIER, VIGILE
- Gestion des profils et permissions

### Gestion des Employés
- CRUD des employés
- Types de contrats : Journalier, Fixe, Honoraire
- Activation/désactivation des employés

### Gestion de la Paie
- Cycles de paie (mensuels, hebdomadaires, journaliers)
- Génération automatique des bulletins
- Calculs salariaux avec déductions
- Approbation et clôture des cycles

### Système de Paiements
- Enregistrement des paiements
- Méthodes : Espèces, Virement, Orange Money, Wave
- Génération de reçus PDF
- Suivi des paiements partiels/complets

### Système de Pointage
- Pointage entrée/sortie
- Géolocalisation optionnelle
- Calcul automatique des heures travaillées
- Gestion des retards et absences

### Tableaux de Bord
- KPIs en temps réel
- Évolution de la masse salariale
- Statistiques par entreprise
- Données globales pour les super admins

## Technologies Utilisées

- **Runtime** : Node.js
- **Langage** : TypeScript
- **Framework** : Express.js
- **Base de données** : MySQL avec Prisma ORM
- **Authentification** : JWT (JSON Web Tokens)
- **Validation** : Zod
- **Sécurité** : Helmet, CORS, bcryptjs
- **Génération PDF** : Puppeteer, html-pdf-node
- **Upload de fichiers** : Multer
- **Logging** : Middleware personnalisé

## Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd ges_salaire/back
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   Créer un fichier `.env` à la racine :
   ```env
   DATABASE_URL="pgsql://user:password@localhost:5432/ges_salaire"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3000
   NODE_ENV="development"
   ```

4. **Configuration de la base de données**
   ```bash
   # Générer le client Prisma
   npm run prisma:generate

   # Appliquer les migrations
   npm run prisma:migrate

   # (Optionnel) Alimenter la base avec des données de test
   npm run prisma:seed
   ```

## Scripts Disponibles

- `npm run dev` : Démarre le serveur en mode développement avec rechargement automatique
- `npm run build` : Compile TypeScript vers JavaScript
- `npm start` : Démarre le serveur en production
- `npm run prisma:generate` : Génère le client Prisma
- `npm run prisma:migrate` : Applique les migrations de base de données
- `npm run prisma:studio` : Ouvre Prisma Studio pour explorer la base de données
- `npm run prisma:seed` : Alimente la base avec des données de test

## Démarrage

```bash
# Mode développement
npm run dev

# Le serveur démarre sur http://localhost:3000
# Health check : http://localhost:3000/health
```

## Structure du Projet

```
src/
├── controllers/     # Gestionnaires de routes
├── services/        # Logique métier
├── repositories/    # Accès aux données
├── routes/          # Définition des routes API
├── middleware/      # Middlewares personnalisés
├── interfaces/      # Types TypeScript
├── validators/      # Validation des données
├── types/           # Types globaux
└── index.ts         # Point d'entrée de l'application

prisma/
├── schema.prisma    # Schéma de la base de données
├── migrations/      # Migrations Prisma
└── seed.ts          # Données de test
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion

### Entreprises
- `GET /api/entreprises` - Lister toutes les entreprises
- `POST /api/entreprises` - Créer une entreprise
- `GET /api/entreprises/:id` - Obtenir une entreprise
- `PUT /api/entreprises/:id` - Modifier une entreprise
- `DELETE /api/entreprises/:id` - Supprimer une entreprise

### Employés
- `GET /api/employes` - Lister les employés
- `POST /api/employes` - Créer un employé
- `GET /api/employes/:id` - Obtenir un employé
- `PUT /api/employes/:id` - Modifier un employé
- `DELETE /api/employes/:id` - Supprimer un employé

### Cycles de Paie
- `GET /api/cycles-paie` - Lister les cycles
- `POST /api/cycles-paie` - Créer un cycle
- `PUT /api/cycles-paie/:id/approve` - Approuver un cycle
- `PUT /api/cycles-paie/:id/close` - Clôturer un cycle

### Bulletins de Paie
- `GET /api/bulletins-paie/cycle/:cycleId` - Bulletins d'un cycle
- `GET /api/bulletins-paie/:id/pdf` - Générer PDF du bulletin

### Paiements
- `GET /api/paiements/bulletin/:bulletinId` - Paiements d'un bulletin
- `POST /api/paiements` - Enregistrer un paiement
- `GET /api/paiements/:id/recu-pdf` - Générer reçu PDF

### Pointage
- `GET /api/pointages` - Lister les pointages
- `POST /api/pointages` - Effectuer un pointage
- `GET /api/pointages/stats` - Statistiques de pointage

### Dashboard
- `GET /api/dashboard/kpis` - KPIs du dashboard
- `GET /api/dashboard/evolution` - Évolution masse salariale

## Schéma de Base de Données

Le schéma Prisma définit les entités suivantes :
- `Entreprise` : Informations des entreprises
- `Utilisateur` : Utilisateurs avec rôles
- `Employe` : Données des employés
- `CyclePaie` : Cycles de paie
- `BulletinPaie` : Bulletins de salaire
- `Paiement` : Enregistrements de paiements
- `Pointage` : Système de présence

Voir `prisma/schema.prisma` pour le schéma complet.

## Sécurité

- Authentification JWT avec expiration
- Hashage des mots de passe avec bcryptjs
- Protection contre les attaques XSS et CSRF
- Validation stricte des données d'entrée
- Logs de sécurité et monitoring

## Développement

### Variables d'Environnement
- `DATABASE_URL` : URL de connexion MySQL
- `JWT_SECRET` : Clé secrète pour JWT
- `PORT` : Port du serveur (défaut: 3000)
- `NODE_ENV` : Environnement (development/production)

### Tests
```bash
npm test
```

### Déploiement
1. Builder l'application : `npm run build`
2. Configurer les variables d'environnement en production
3. Démarrer : `npm start`

## Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## Licence

ISC
