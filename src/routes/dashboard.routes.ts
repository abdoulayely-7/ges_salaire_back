import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authentifier, autoriserRoles, verifierEntreprise } from '../middleware/auth.middleware.js';

const router = Router();
const dashboardController = new DashboardController();

// Toutes les routes nécessitent une authentification
router.use(authentifier);

// Routes pour le dashboard d'une entreprise
// GET /entreprises/:entrepriseId/dashboard/kpis - KPIs
router.get('/entreprises/:entrepriseId/dashboard/kpis',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  verifierEntreprise,
  (req, res, next) => dashboardController.obtenirKPIs(req, res, next)
);

// GET /entreprises/:entrepriseId/dashboard/evolution-masse-salariale - Évolution masse salariale
router.get('/entreprises/:entrepriseId/dashboard/evolution-masse-salariale',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  verifierEntreprise,
  (req, res, next) => dashboardController.obtenirEvolutionMasseSalariale(req, res, next)
);

// GET /entreprises/:entrepriseId/dashboard/prochains-paiements - Prochains paiements
router.get('/entreprises/:entrepriseId/dashboard/prochains-paiements',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  verifierEntreprise,
  (req, res, next) => dashboardController.obtenirProchainsPaiements(req, res, next)
);

// GET /entreprises/:entrepriseId/dashboard/all-data - Toutes les données
router.get('/entreprises/:entrepriseId/dashboard/all-data',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  verifierEntreprise,
  (req, res, next) => dashboardController.obtenirToutesDonnees(req, res, next)
);

// GET /entreprises/:entrepriseId/dashboard/check-data - Vérifier si des données existent
router.get('/entreprises/:entrepriseId/dashboard/check-data',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  verifierEntreprise,
  (req, res, next) => dashboardController.verifierDonnees(req, res, next)
);

// POST /dashboard/initialize - Initialiser les données
router.post('/dashboard/initialize',
  autoriserRoles("SUPER_ADMIN", "ADMIN"),
  (req, res, next) => dashboardController.initialiserDonnees(req, res, next)
);

// Routes pour le dashboard super admin (global)
router.get('/global/stats',
  autoriserRoles("SUPER_ADMIN"),
  (req, res, next) => dashboardController.obtenirStatsGlobales(req, res, next)
);

router.get('/global/evolution-masse-salariale',
  autoriserRoles("SUPER_ADMIN"),
  (req, res, next) => dashboardController.obtenirEvolutionMasseSalarialeGlobale(req, res, next)
);

router.get('/global/repartition-employes',
  autoriserRoles("SUPER_ADMIN"),
  (req, res, next) => dashboardController.obtenirRepartitionEmployesParEntreprise(req, res, next)
);

router.get('/global/all-data',
  autoriserRoles("SUPER_ADMIN"),
  (req, res, next) => dashboardController.obtenirToutesDonneesGlobales(req, res, next)
);

export default router;