import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authentifier } from '../middleware/auth.middleware.js';

const router = Router();
const adminController = new AdminController();

// Routes d'administration - authentification requise
router.post('/utilisateurs', authentifier, adminController.creerUtilisateur);

export default router;