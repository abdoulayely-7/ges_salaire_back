
import type { Request, Response, NextFunction } from 'express';
import { AuthService, authService as singletonAuthService } from '../services/auth.service.js';
import { connexionSchema,inscriptionSchema } from '../validator/auth.validator.js';
import { error } from 'console';
export class AuthController {
  private service: AuthService;

  constructor() {
    // Use the singleton to keep cookie/token behavior consistent
    this.service = singletonAuthService;
  }

  public connexion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verif=connexionSchema.safeParse(req.body)
      if(!verif.success)return res.json({
        errors:verif.error.format()
      })


      const { email, motDePasse } = req.body as { email: string; motDePasse: string };
      const resultat = await this.service.seConnecter(email, motDePasse);

      if (!resultat) {
        res.status(401).json({ message: ' email ou passe incorrect' });
        return;
      }

      this.service.setCookieToken(res, resultat.token);
      res.json(resultat);
    } catch (error) {
      next(error);
    }
  };

public inscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const verif = inscriptionSchema.safeParse(req.body);
    if (!verif.success) {
      return res.status(400).json({
        errors: verif.error.format()
      });
    }

    // Cette route est uniquement pour créer des SUPER_ADMIN ou auto-inscription initiale
    // Pour créer des ADMIN/CAISSIER, utiliser /api/admin/utilisateurs ou /api/entreprises/:id/utilisateurs
    if (verif.data.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ 
        message: 'Cette route est réservée aux SUPER_ADMIN. Utilisez /api/admin/utilisateurs pour créer des ADMIN/CAISSIER' 
      });
    }

    const donneesInscription = {
      ...verif.data,
      entrepriseId: undefined // SUPER_ADMIN n'a jamais d'entrepriseId
    };

    const resultat = await this.service.sInscrire(donneesInscription);
    this.service.setCookieToken(res, resultat.token);
    res.status(201).json(resultat);
  } catch (error) {
    next(error);
  }
};


  public profil = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.utilisateur) {
        res.status(401).json({ message: 'Non authentifié' });
        return;
      }
      const profil = await this.service.obtenirProfil(req.utilisateur.id);
      if (!profil) {
        res.status(404).json({ message: 'Utilisateur non trouvé' });
        return;
      }
      res.json(profil);
    } catch (error) {
      next(error);
    }
  };

  public deconnexion = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      this.service.clearCookieToken(res);
      res.json({ message: 'Déconnecté avec succès' });
    } catch (error) {
      next(error);
    }
  };
}
