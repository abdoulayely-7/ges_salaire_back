import { Router } from 'express';
import { PaiementController } from '../controllers/paiement.controller.js';
import { authentifier, autoriserRoles, verifierEntreprise } from '../middleware/auth.middleware.js';

const router = Router();
const paiementController = new PaiementController();

// Toutes les routes nécessitent une authentification
router.use(authentifier);

// Route pour lister tous les paiements avec filtres
// GET /paiements - Lister tous les paiements avec filtres
router.get('/paiements',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  (req, res, next) => paiementController.listerTous(req, res, next)
);

// Routes pour les paiements d'un bulletin
// GET /bulletins/:bulletinId/paiements - Lister les paiements d'un bulletin
router.get('/bulletins/:bulletinId/paiements',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  (req, res, next) => paiementController.listerParBulletin(req, res, next)
);

// POST /bulletins/:bulletinId/paiements - Créer un paiement
router.post('/bulletins/:bulletinId/paiements',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  (req, res, next) => paiementController.creer(req, res, next)
);

// Routes pour un paiement spécifique
// GET /paiements/:id - Obtenir un paiement par ID
router.get('/paiements/:id',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  (req, res, next) => paiementController.obtenirParId(req, res, next)
);

// PUT /paiements/:id - Modifier un paiement (ADMIN seulement)
router.put('/paiements/:id',
  autoriserRoles("SUPER_ADMIN", "ADMIN"),
  (req, res, next) => paiementController.modifier(req, res, next)
);

// DELETE /paiements/:id - Supprimer un paiement
router.delete('/paiements/:id',
  autoriserRoles("SUPER_ADMIN", "ADMIN"),
  (req, res, next) => paiementController.supprimer(req, res, next)
);

// Routes PDF
// GET /paiements/:id/pdf - Générer le reçu PDF d'un paiement
router.get('/paiements/:id/pdf',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER"),
  (req, res, next) => paiementController.genererRecuPDF(req, res, next)
);

// GET /entreprises/:entrepriseId/paiements/:periode/pdf - Générer la liste des paiements PDF
router.get('/entreprises/:entrepriseId/paiements/:periode/pdf',
  autoriserRoles("SUPER_ADMIN", "ADMIN"),
  verifierEntreprise,
  (req, res, next) => paiementController.genererListePaiementsPDF(req, res, next)
);

export default router;