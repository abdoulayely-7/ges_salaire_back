import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import type { TokenPayload, RoleUtilisateur } from '../interfaces/auth.interface.js';

// Étendre l'interface Request d'Express
declare global {
  namespace Express {
    interface Request {
      utilisateur?: TokenPayload;
    }
  }
}

const authService = new AuthService();

export const authentifier = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Essayer de lire le token depuis les cookies d'abord (HTTP-only)
    let token = req.cookies?.authToken;
    
    // Si pas de cookie, essayer l'en-tête Authorization en fallback
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      res.status(401).json({ message: 'Token d\'authentification manquant' });
      return;
    }

    const payload = authService.verifierToken(token);
    req.utilisateur = payload;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Token invalide', 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
};

export const autoriserRoles = (...rolesAutorises: RoleUtilisateur[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.utilisateur) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    if (!rolesAutorises.includes(req.utilisateur.role)) {
      res.status(403).json({ 
        message: 'Accès refusé - Permissions insuffisantes',
        roleRequis: rolesAutorises,
        roleActuel: req.utilisateur.role
      });
      return;
    }

    next();
  };
};

export const verifierEntreprise = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.utilisateur) {
    res.status(401).json({ message: 'Utilisateur non authentifié' });
    return;
  }

  // Super admin peut accéder à toutes les entreprises
  if (req.utilisateur.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  // Pour les autres rôles, vérifier l'entreprise
  const entrepriseId = req.params.entrepriseId || req.body.entrepriseId;
  
  if (!entrepriseId) {
    res.status(400).json({ message: 'ID entreprise manquant' });
    return;
  }

  // Convertir en number pour la comparaison
  const entrepriseIdNumber = parseInt(entrepriseId);
  
  if (req.utilisateur.entrepriseId !== entrepriseIdNumber) {
    res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
    return;
  }

  next();
};