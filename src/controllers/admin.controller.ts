import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { EntrepriseRepository } from '../repositories/entreprise.repository.js';
import { inscriptionSchema, modifierUtilisateurSchema } from '../validator/auth.validator.js';
import { entrepriseParamsSchema } from '../validator/entreprise.validator.js';

export class AdminController {
  private authService: AuthService;
  private entrepriseRepository: EntrepriseRepository;

  constructor() {
    this.authService = new AuthService();
    this.entrepriseRepository = new EntrepriseRepository();
  }

  /**
   * Création d'un utilisateur par un admin - prend automatiquement l'entrepriseId de l'admin connecté
   */
  public creerUtilisateur = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérification de l'authentification
      if (!req.utilisateur) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      // Seuls les ADMIN et SUPER_ADMIN peuvent créer des utilisateurs
      if (req.utilisateur.role !== 'ADMIN' && req.utilisateur.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Accès refusé - Rôle insuffisant' });
      }

      // Validation des données
      const verif = inscriptionSchema.safeParse(req.body);
      if (!verif.success) {
        return res.status(400).json({
          errors: verif.error.format()
        });
      }

      // Déterminer l'entrepriseId selon le contexte
      let entrepriseId: number | undefined;
      
      if (verif.data.role === 'SUPER_ADMIN') {
        // SUPER_ADMIN n'a jamais d'entrepriseId
        entrepriseId = undefined;
      } else {
        // Pour ADMIN et CAISSIER
        if (req.utilisateur.role === 'SUPER_ADMIN') {
          // Si c'est un SUPER_ADMIN qui crée, il doit spécifier l'entreprise via l'URL
          return res.status(400).json({ 
            message: 'Utilisez la route /api/entreprises/:entrepriseId/utilisateurs pour spécifier l\'entreprise' 
          });
        } else {
          // Si c'est un ADMIN qui crée, utiliser son entrepriseId
          entrepriseId = req.utilisateur.entrepriseId;
        }
      }

      const donneesInscription = {
        ...verif.data,
        entrepriseId
      };

      const resultat = await this.authService.sInscrire(donneesInscription);
      res.status(201).json(resultat);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Création d'un utilisateur par un SUPER_ADMIN avec entreprise spécifique
   */
  public creerUtilisateurPourEntreprise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérification de l'authentification
      if (!req.utilisateur) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      // Seuls les SUPER_ADMIN peuvent utiliser cette route
      if (req.utilisateur.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Accès refusé - Seuls les SUPER_ADMIN peuvent utiliser cette route' });
      }

      // Validation des paramètres d'URL
      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      // Validation des données
      const verif = inscriptionSchema.safeParse(req.body);
      if (!verif.success) {
        return res.status(400).json({
          errors: verif.error.format()
        });
      }

      // Le rôle SUPER_ADMIN ne peut pas être créé via cette route (il n'appartient à aucune entreprise)
      if (verif.data.role === 'SUPER_ADMIN') {
        return res.status(400).json({
          message: 'Un SUPER_ADMIN ne peut pas être lié à une entreprise. Utilisez /api/admin/utilisateurs'
        });
      }

      // Vérifier que l'entreprise existe
      const entreprise = await this.entrepriseRepository.trouverParId(verifParams.data.id);
      if (!entreprise) {
        return res.status(404).json({
          message: `Entreprise avec l'ID ${verifParams.data.id} non trouvée`
        });
      }

      const donneesInscription = {
        ...verif.data,
        entrepriseId: verifParams.data.id
      };

      const resultat = await this.authService.sInscrire(donneesInscription);
      res.status(201).json(resultat);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Modification d'un utilisateur par un SUPER_ADMIN
   */
  public modifierUtilisateurPourEntreprise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérification de l'authentification
      if (!req.utilisateur) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      // Seuls les SUPER_ADMIN peuvent utiliser cette route
      if (req.utilisateur.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Accès refusé - Seuls les SUPER_ADMIN peuvent utiliser cette route' });
      }

      // Validation des paramètres d'URL
      const verifParams = entrepriseParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const userId = parseInt(req.params.userId);
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }

      // Validation des données (schema à créer)
      const verif = modifierUtilisateurSchema.safeParse(req.body);
      if (!verif.success) {
        return res.status(400).json({
          errors: verif.error.format()
        });
      }

      const resultat = await this.authService.modifierUtilisateur(userId, verif.data);
      res.status(200).json(resultat);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Suppression d'un utilisateur par un SUPER_ADMIN
   */
  public supprimerUtilisateurPourEntreprise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérification de l'authentification
      if (!req.utilisateur) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      // Seuls les SUPER_ADMIN peuvent utiliser cette route
      if (req.utilisateur.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Accès refusé - Seuls les SUPER_ADMIN peuvent utiliser cette route' });
      }

      const userId = parseInt(req.params.userId);
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ message: 'ID utilisateur invalide' });
      }

      await this.authService.supprimerUtilisateur(userId);
      res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      next(error);
    }
  };
}