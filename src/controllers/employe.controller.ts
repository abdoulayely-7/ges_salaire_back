import type { Request, Response, NextFunction } from 'express';
import { EmployeService } from '../services/employe.service.js';
import { creerEmployeSchema, modifierEmployeSchema, employeParamsSchema } from '../validator/employe.validator.js';

export class EmployeController {
  private service: EmployeService;

  constructor() {
    this.service = new EmployeService();
  }

  public listerParEntreprise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Récupérer les filtres depuis query params
      const filtres = {
        recherche: req.query.nom as string || req.query.recherche as string, // nom -> recherche
        estActif: req.query.actif === 'true' ? true : req.query.actif === 'false' ? false : undefined,
        poste: req.query.poste as string,
        typeContrat: req.query.typeContrat as any
      };

      // Nettoyer les filtres undefined
      const filtresCleans = Object.fromEntries(
        Object.entries(filtres).filter(([_, value]) => value !== undefined)
      );

      const employes = await this.service.listerParEntreprise(
        parseInt(req.params.entrepriseId), 
        Object.keys(filtresCleans).length > 0 ? filtresCleans : undefined
      );
      res.json(employes);
    } catch (error) {
      next(error);
    }
  };

  public obtenirParId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = employeParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const employe = await this.service.obtenirParId(verifParams.data.id);
      if (!employe) {
        res.status(404).json({ message: 'Employé non trouvé' });
        return;
      }
      res.json(employe);
    } catch (error) {
      next(error);
    }
  };

  public creer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Déterminer l'entrepriseId à utiliser
      let entrepriseId: number;
      
      if (!req.utilisateur) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      if (req.utilisateur.role === 'SUPER_ADMIN') {
        // SUPER_ADMIN utilise l'entrepriseId de l'URL
        entrepriseId = parseInt(req.params.entrepriseId);
        if (isNaN(entrepriseId)) {
          return res.status(400).json({ message: 'ID entreprise invalide dans l\'URL' });
        }
      } else {
        // ADMIN/CAISSIER utilisent leur propre entrepriseId
        if (!req.utilisateur.entrepriseId) {
          return res.status(400).json({ message: 'Utilisateur sans entreprise valide' });
        }
        entrepriseId = req.utilisateur.entrepriseId;
      }

      const verif = creerEmployeSchema.safeParse({
        ...req.body,
        entrepriseId
      });
      if (!verif.success) {
        return res.status(400).json({
          errors: verif.error.format()
        });
      }

      const employe = await this.service.creer(verif.data, verif.data.entrepriseId);
      res.status(201).json(employe);
    } catch (error) {
      next(error);
    }
  };

  public modifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = employeParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const verifBody = modifierEmployeSchema.safeParse({
        ...req.body,
        id: verifParams.data.id
      });
      if (!verifBody.success) {
        return res.status(400).json({
          errors: verifBody.error.format()
        });
      }

      const employe = await this.service.modifier(verifParams.data.id, verifBody.data);
      res.json(employe);
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
      const stats = await this.service.obtenirStatistiques(parseInt(req.params.entrepriseId));
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  public activer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employe = await this.service.activer(parseInt(req.params.id));
      res.json(employe);
    } catch (error) {
      next(error);
    }
  };

  public desactiver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employe = await this.service.desactiver(parseInt(req.params.id));
      res.json(employe);
    } catch (error) {
      next(error);
    }
  };

  public toggle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employe = await this.service.toggle(parseInt(req.params.id));
      res.json(employe);
    } catch (error) {
      next(error);
    }
  };
}