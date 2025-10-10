import type { Request, Response, NextFunction } from 'express';
import { CyclePaieService } from '../services/cyclePaie.service.js';
import { creerCyclePaieSchema, modifierCyclePaieSchema, cyclePaieParamsSchema } from '../validator/cyclepaie.validator.js';

export class CyclePaieController {
  private service: CyclePaieService;

  constructor() {
    this.service = new CyclePaieService();
  }

  public listerParEntreprise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entrepriseId } = req.params;
      const cycles = await this.service.listerParEntreprise(parseInt(entrepriseId));
      res.json(cycles);
    } catch (error) {
      next(error);
    }
  };

  public obtenirParId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = cyclePaieParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const cycle = await this.service.obtenirParId(verifParams.data.id);
      if (!cycle) {
        res.status(404).json({ message: 'Cycle de paie non trouvé' });
        return;
      }
      res.json(cycle);
    } catch (error) {
      next(error);
    }
  };

  public creer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verif = creerCyclePaieSchema.safeParse({
        ...req.body,
        entrepriseId: parseInt(req.params.entrepriseId)
      });
      if (!verif.success) {
        return res.status(400).json({
          errors: verif.error.format()
        });
      }

      // S'assurer que periode est définie
      let periode = verif.data.periode;
      if (!periode && verif.data.mois && verif.data.annee) {
        // Générer la période au format "YYYY-MM"
        const moisFormate = verif.data.mois.toString().padStart(2, '0');
        periode = `${verif.data.annee}-${moisFormate}`;
      }
      
      if (!periode) {
        return res.status(400).json({
          message: "La période est requise ou doit être calculée à partir du mois et de l'année"
        });
      }

      const donnees = {
        titre: verif.data.titre,
        periode,
        dateDebut: new Date(verif.data.dateDebut),
        dateFin: new Date(verif.data.dateFin),
        entrepriseId: verif.data.entrepriseId,
      };
      const cycle = await this.service.creer(donnees);
      res.status(201).json(cycle);
    } catch (error) {
      next(error);
    }
  };

  public modifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const donnees = { ...req.body };
      if (donnees.dateDebut) donnees.dateDebut = new Date(donnees.dateDebut);
      if (donnees.dateFin) donnees.dateFin = new Date(donnees.dateFin);
      const cycle = await this.service.modifier(parseInt(req.params.id), donnees);
      res.json(cycle);
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

  public approuver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycle = await this.service.approuver(parseInt(req.params.id));
      res.json(cycle);
    } catch (error) {
      next(error);
    }
  };

  public cloturer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycle = await this.service.cloturer(parseInt(req.params.id));
      res.json(cycle);
    } catch (error) {
      next(error);
    }
  };

  public genererBulletins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bulletins = await this.service.genererBulletins(parseInt(req.params.id));
      res.status(201).json(bulletins);
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

  public mettreAJourJoursTravailes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { joursTravailes } = req.body as { joursTravailes: Array<{employeId: number, jours: number}> };
      const bulletinsMisAJour = await this.service.mettreAJourJoursTravailes(parseInt(req.params.id), joursTravailes);
      res.json(bulletinsMisAJour);
    } catch (error) {
      next(error);
    }
  };

  public obtenirBulletins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = cyclePaieParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const bulletins = await this.service.obtenirBulletins(verifParams.data.id);
      res.json(bulletins);
    } catch (error) {
      next(error);
    }
  };

  public recalculerBulletins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = cyclePaieParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const bulletins = await this.service.recalculerBulletins(verifParams.data.id);
      res.json(bulletins);
    } catch (error) {
      next(error);
    }
  };
}
