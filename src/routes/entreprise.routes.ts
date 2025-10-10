import { Router } from 'express';
import { EntrepriseController } from '../controllers/entreprise.controller.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authentifier, autoriserRoles } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();
const entrepriseController = new EntrepriseController();
const adminController = new AdminController();

// Toutes les routes nécessitent une authentification
router.use(authentifier);

// Routes pour super admin uniquement
router.get('/',
  autoriserRoles("SUPER_ADMIN"),
  entrepriseController.listerTout
);

router.post('/',
  autoriserRoles("SUPER_ADMIN"),
  entrepriseController.creer
);

router.delete('/:id',
  autoriserRoles("SUPER_ADMIN"),
  entrepriseController.supprimer
);

// Routes pour admin, super admin, caissier et vigile
router.get('/:id',
  autoriserRoles("SUPER_ADMIN", "ADMIN", "CAISSIER", "VIGILE"),
  entrepriseController.obtenirParId
);

router.put('/:id',
  autoriserRoles("SUPER_ADMIN", "ADMIN"),
  entrepriseController.modifier
);

router.get('/:id/statistiques',
  autoriserRoles("SUPER_ADMIN", "ADMIN"),
  entrepriseController.obtenirStatistiques
);

// Route pour que les SUPER_ADMIN créent des utilisateurs d'entreprise
router.post('/:id/utilisateurs',
  autoriserRoles("SUPER_ADMIN"),
  adminController.creerUtilisateurPourEntreprise
);

// Route pour lister les utilisateurs d'une entreprise (SUPER_ADMIN seulement)
router.get('/:id/utilisateurs',
  autoriserRoles("SUPER_ADMIN"),
  entrepriseController.listerUtilisateurs
);

// Route pour modifier un utilisateur d'une entreprise (SUPER_ADMIN seulement)
router.put('/:id/utilisateurs/:userId',
  autoriserRoles("SUPER_ADMIN"),
  adminController.modifierUtilisateurPourEntreprise
);

// Route pour supprimer un utilisateur d'une entreprise (SUPER_ADMIN seulement)
router.delete('/:id/utilisateurs/:userId',
  autoriserRoles("SUPER_ADMIN"),
  adminController.supprimerUtilisateurPourEntreprise
);

// Route pour activer/désactiver une entreprise (SUPER_ADMIN seulement)
router.patch('/:id/toggle-statut',
  autoriserRoles("SUPER_ADMIN"),
  entrepriseController.toggleStatut
);

// Route pour upload de logo d'entreprise
router.post('/:id/logo',
  autoriserRoles("SUPER_ADMIN", "ADMIN"),
  upload.single('logo'),
  entrepriseController.uploadLogo
);

export default router;