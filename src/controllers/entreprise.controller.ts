import type { Request, Response, NextFunction } from 'express';
import { EntrepriseService } from '../services/entreprise.service.js';
import { creerEntrepriseSchema, modifierEntrepriseSchema, entrepriseParamsSchema } from '../validator/entreprise.validator.js';
import { createUserValidator, updateUserValidator } from '../validator/user.validator.js';

export class EntrepriseController {
  private service: EntrepriseService;

  constructor() {
    this.service = new EntrepriseService();
  }

  public listerTout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.listerTout();
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public obtenirParId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const entreprise = await this.service.obtenirParId(verifParams.data.id);
      if (!entreprise) {
        res.status(404).json({ message: 'Entreprise non trouvée' });
        return;
      }
      res.json(entreprise);
    } catch (error) {
      next(error);
    }
  };

  public creer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verif = creerEntrepriseSchema.safeParse(req.body);
      if (!verif.success) {
        return res.status(400).json({
          errors: verif.error.format()
        });
      }

      const entreprise = await this.service.creer(verif.data);
      res.status(201).json(entreprise);
    } catch (error) {
      next(error);
    }
  };

  public modifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const verifBody = modifierEntrepriseSchema.safeParse(req.body);
      if (!verifBody.success) {
        return res.status(400).json({
          errors: verifBody.error.format()
        });
      }

      const entreprise = await this.service.modifier(verifParams.data.id, verifBody.data);
      res.json(entreprise);
    } catch (error) {
      next(error);
    }
  };

  public supprimer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.supprimer(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public obtenirStatistiques = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.obtenirStatistiques(parseInt(req.params.id));
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  public listerUtilisateurs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const utilisateurs = await this.service.listerUtilisateurs(verifParams.data.id);
      res.json(utilisateurs);
    } catch (error) {
      next(error);
    }
  };

  public toggleStatut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const entreprise = await this.service.toggleStatut(verifParams.data.id);
      res.json(entreprise);
    } catch (error) {
      next(error);
    }
  };

  public creerUtilisateur = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🚀 Création utilisateur - Body:', JSON.stringify(req.body, null, 2));
      console.log('🚀 Création utilisateur - Role:', req.body.role);
      console.log('🚀 Création utilisateur - Params:', req.params);

      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      console.log('🚀 Validation params:', verifParams.success ? 'OK' : verifParams.error.issues);
      if (!verifParams.success) {
        return res.status(400).json({
          message: 'Paramètres invalides',
          errors: verifParams.error.issues
        });
      }

      const verifBody = createUserValidator.safeParse(req.body);
      console.log('🚀 Validation body:', verifBody.success ? 'OK' : verifBody.error.issues);
      if (!verifBody.success) {
        console.log('❌ Validation échouée:', JSON.stringify(verifBody.error.issues, null, 2));
        return res.status(400).json({
          message: 'Données invalides',
          errors: verifBody.error.issues
        });
      }

      console.log('✅ Validation réussie, création de l\'utilisateur...');
      const utilisateur = await this.service.creerUtilisateur(verifParams.data.id, verifBody.data);
      console.log('✅ Utilisateur créé:', utilisateur.id);
      res.status(201).json(utilisateur);
    } catch (error) {
      console.error('❌ Erreur lors de la création utilisateur:', error);
      next(error);
    }
  };

  public modifierUtilisateur = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          message: 'Paramètres invalides',
          errors: verifParams.error.issues
        });
      }

      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({
          message: 'ID utilisateur invalide'
        });
      }

      const verifBody = updateUserValidator.safeParse(req.body);
      if (!verifBody.success) {
        return res.status(400).json({
          message: 'Données invalides',
          errors: verifBody.error.issues
        });
      }

      const utilisateur = await this.service.modifierUtilisateur(verifParams.data.id, userId, verifBody.data);
      res.json(utilisateur);
    } catch (error) {
      next(error);
    }
  };

  public uploadLogo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérifier que req.params existe
      if (!req.params) {
        return res.status(400).json({
          message: 'Paramètres de requête manquants'
        });
      }

      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          message: 'Paramètres invalides',
          errors: verifParams.error.format(),
          receivedParams: req.params
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Aucun fichier logo fourni'
        });
      }

      // Construire l'URL du logo
      const logoUrl = `/uploads/${req.file.filename}`;
      
      // Mettre à jour l'entreprise avec le nouveau logo
      const entreprise = await this.service.mettreAJourLogo(verifParams.data.id, logoUrl);
      
      res.json({
        message: 'Logo uploadé avec succès',
        logoUrl,
        entreprise
      });
    } catch (error) {
      next(error);
    }
  };
}
