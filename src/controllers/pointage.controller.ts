import type { Request, Response, NextFunction } from 'express';
import { PointageService } from '../services/pointage.service.js';

export class PointageController {
  private service: PointageService;

  constructor() {
    this.service = new PointageService();
  }

  public listerParEntreprise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entrepriseId = parseInt(req.params.entrepriseId);
      if (isNaN(entrepriseId)) {
        return res.status(400).json({ message: 'ID entreprise invalide' });
      }

      const dateDebut = req.query.dateDebut ? new Date(req.query.dateDebut as string) : undefined;
      const dateFin = req.query.dateFin ? new Date(req.query.dateFin as string) : undefined;

      const pointages = await this.service.listerParEntreprise(entrepriseId, dateDebut, dateFin);
      res.json(pointages);
    } catch (error) {
      next(error);
    }
  };

  public listerParEmploye = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeId = parseInt(req.params.employeId);
      if (isNaN(employeId)) {
        return res.status(400).json({ message: 'ID employé invalide' });
      }

      const dateDebut = req.query.dateDebut ? new Date(req.query.dateDebut as string) : undefined;
      const dateFin = req.query.dateFin ? new Date(req.query.dateFin as string) : undefined;

      const pointages = await this.service.listerParEmploye(employeId, dateDebut, dateFin);
      res.json(pointages);
    } catch (error) {
      next(error);
    }
  };

  public obtenirParId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID pointage invalide' });
      }

      const pointage = await this.service.obtenirParId(id);
      if (!pointage) {
        return res.status(404).json({ message: 'Pointage non trouvé' });
      }

      res.json(pointage);
    } catch (error) {
      next(error);
    }
  };

  public creer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeId, entrepriseId, pointeParId, typePointage, statut, commentaire, latitude, longitude } = req.body;

      if (!employeId || !entrepriseId || !pointeParId || !typePointage) {
        return res.status(400).json({ message: 'Données manquantes' });
      }

      const pointage = await this.service.creer({
        employeId: parseInt(employeId),
        entrepriseId: parseInt(entrepriseId),
        pointeParId: parseInt(pointeParId),
        typePointage,
        statut,
        commentaire,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined
      });

      res.status(201).json(pointage);
    } catch (error) {
      next(error);
    }
  };

  public effectuerPointage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeId, typePointage, commentaire } = req.body;
      const entrepriseId = parseInt(req.params.entrepriseId);
      const vigileId = (req as any).utilisateur.id; // Récupéré du middleware d'authentification

      if (!employeId || !typePointage || isNaN(entrepriseId)) {
        return res.status(400).json({ message: 'Données manquantes' });
      }

      // Déterminer le statut selon l'heure
      const maintenant = new Date();
      const heureActuelle = maintenant.getHours() + maintenant.getMinutes() / 60;

      let statut = 'VALIDE';
      if (typePointage === 'ENTREE') {
        // Règles pour l'entrée
        if (heureActuelle >= 8 && heureActuelle <= 16) {
          statut = heureActuelle > 8.25 ? 'RETARD' : 'VALIDE'; // Après 8h15 = retard
        } else {
          statut = 'VALIDE'; // Pointage hors horaires accepté mais marqué
        }
      }

      const pointage = await this.service.effectuerPointage(
        parseInt(employeId),
        entrepriseId,
        vigileId,
        typePointage,
        commentaire,
        undefined, // Pas de latitude
        undefined  // Pas de longitude
      );

      res.status(201).json(pointage);
    } catch (error) {
      next(error);
    }
  };

  public modifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID pointage invalide' });
      }

      const { statut, commentaire } = req.body;

      const pointage = await this.service.modifier(id, {
        statut,
        commentaire
      });

      res.json(pointage);
    } catch (error) {
      next(error);
    }
  };

  public supprimer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID pointage invalide' });
      }

      await this.service.supprimer(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public obtenirStatistiques = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entrepriseId = parseInt(req.params.entrepriseId);
      if (isNaN(entrepriseId)) {
        return res.status(400).json({ message: 'ID entreprise invalide' });
      }

      const dateDebut = req.query.dateDebut ? new Date(req.query.dateDebut as string) : undefined;
      const dateFin = req.query.dateFin ? new Date(req.query.dateFin as string) : undefined;

      const stats = await this.service.obtenirStatistiques(entrepriseId, dateDebut, dateFin);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  public obtenirPointagesJour = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entrepriseId = parseInt(req.params.entrepriseId);
      if (isNaN(entrepriseId)) {
        return res.status(400).json({ message: 'ID entreprise invalide' });
      }

      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      const pointages = await this.service.obtenirPointagesJour(entrepriseId, date);
      res.json(pointages);
    } catch (error) {
      next(error);
    }
  };
}