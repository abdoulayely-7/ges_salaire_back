import { Router } from 'express';
import { PointageController } from '../controllers/pointage.controller.js';
import { authentifier, autoriserRoles } from '../middleware/auth.middleware.js';

const router = Router();
const pointageController = new PointageController();

// Toutes les routes nécessitent une authentification
router.use(authentifier);

// Routes pour les vigiles (peuvent créer et lire les pointages)
router.post('/entreprises/:entrepriseId/pointages',
  autoriserRoles("VIGILE" as any),
  pointageController.effectuerPointage
);

router.get('/entreprises/:entrepriseId/pointages/jour',
  autoriserRoles("VIGILE" as any, "ADMIN", "SUPER_ADMIN"),
  pointageController.obtenirPointagesJour
);

// Routes pour consulter les pointages (ADMIN et SUPER_ADMIN)
router.get('/entreprises/:entrepriseId/pointages',
  autoriserRoles("ADMIN", "SUPER_ADMIN"),
  pointageController.listerParEntreprise
);

router.get('/employes/:employeId/pointages',
  autoriserRoles("ADMIN", "SUPER_ADMIN"),
  pointageController.listerParEmploye
);

router.get('/pointages/:id',
  autoriserRoles("ADMIN", "SUPER_ADMIN"),
  pointageController.obtenirParId
);

// Routes de modification (ADMIN et SUPER_ADMIN seulement)
router.put('/pointages/:id',
  autoriserRoles("ADMIN", "SUPER_ADMIN"),
  pointageController.modifier
);

router.delete('/pointages/:id',
  autoriserRoles("ADMIN", "SUPER_ADMIN"),
  pointageController.supprimer
);

// Statistiques (ADMIN et SUPER_ADMIN)
router.get('/entreprises/:entrepriseId/pointages/statistiques',
  autoriserRoles("ADMIN", "SUPER_ADMIN"),
  pointageController.obtenirStatistiques
);

export default router;