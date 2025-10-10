import type { Request, Response, NextFunction } from 'express';
import { BulletinPaieService } from '../services/bulletinPaie.service.js';
import { CyclePaieRepository } from '../repositories/cyclePaie.repository.js';
import { BulletinPaieRepository } from '../repositories/bulletinPaie.repository.js';
import { PDFService } from '../services/pdf.service.js';
import { creerBulletinPaieSchema, modifierBulletinPaieSchema, bulletinPaieParamsSchema } from '../validator/bulletin.validator.js';

export class BulletinPaieController {
  private service: BulletinPaieService;
  private cycleRepo: CyclePaieRepository;
  private bulletinRepo: BulletinPaieRepository;

  constructor() {
    this.service = new BulletinPaieService();
    this.cycleRepo = new CyclePaieRepository();
    this.bulletinRepo = new BulletinPaieRepository();
  }

  public listerParCycle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycle = await this.cycleRepo.trouverParId(parseInt(req.params.cycleId));
      if (!cycle) {
        res.status(404).json({ message: 'Cycle non trouvé' });
        return;
      }
      if (req.utilisateur && req.utilisateur.role !== 'SUPER_ADMIN' && req.utilisateur.entrepriseId !== cycle.entrepriseId) {
        res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
        return;
      }
      const bulletins = await this.service.listerParCycle(parseInt(req.params.cycleId));
      res.json(bulletins);
    } catch (error) {
      next(error);
    }
  };

  public obtenirParId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bulletin = await this.bulletinRepo.trouverParId(parseInt(req.params.id));
      if (!bulletin) {
        res.status(404).json({ message: 'Bulletin non trouvé' });
        return;
      }
      if (req.utilisateur && req.utilisateur.role !== 'SUPER_ADMIN') {
        const cycle = await this.cycleRepo.trouverParId(bulletin.cyclePaieId);
        if (!cycle || req.utilisateur.entrepriseId !== cycle.entrepriseId) {
          res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
          return;
        }
      }
      res.json(bulletin);
    } catch (error) {
      next(error);
    }
  };

  public obtenirAvecDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bulletin = await this.service.obtenirAvecDetails(parseInt(req.params.id));
      if (!bulletin) {
        res.status(404).json({ message: 'Bulletin non trouvé' });
        return;
      }
      if (req.utilisateur && req.utilisateur.role !== 'SUPER_ADMIN') {
        const cycle = await this.cycleRepo.trouverParId(bulletin.cyclePaieId);
        if (!cycle || req.utilisateur.entrepriseId !== cycle.entrepriseId) {
          res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
          return;
        }
      }
      res.json(bulletin);
    } catch (error) {
      next(error);
    }
  };

  public modifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existant = await this.bulletinRepo.trouverParId(parseInt(req.params.id));
      if (!existant) {
        res.status(404).json({ message: 'Bulletin non trouvé' });
        return;
      }
      if (req.utilisateur && req.utilisateur.role !== 'SUPER_ADMIN') {
        const cycle = await this.cycleRepo.trouverParId(existant.cyclePaieId);
        if (!cycle || req.utilisateur.entrepriseId !== cycle.entrepriseId) {
          res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
          return;
        }
      }
      const bulletin = await this.service.modifier(parseInt(req.params.id), req.body);
      res.json(bulletin);
    } catch (error) {
      next(error);
    }
  };

  public supprimer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existant = await this.bulletinRepo.trouverParId(parseInt(req.params.id));
      if (!existant) {
        res.status(404).json({ message: 'Bulletin non trouvé' });
        return;
      }
      if (req.utilisateur && req.utilisateur.role !== 'SUPER_ADMIN') {
        const cycle = await this.cycleRepo.trouverParId(existant.cyclePaieId);
        if (!cycle || req.utilisateur.entrepriseId !== cycle.entrepriseId) {
          res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
          return;
        }
      }
      await this.service.supprimer(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public recalculer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existant = await this.bulletinRepo.trouverParId(parseInt(req.params.id));
      if (!existant) {
        res.status(404).json({ message: 'Bulletin non trouvé' });
        return;
      }
      if (req.utilisateur && req.utilisateur.role !== 'SUPER_ADMIN') {
        const cycle = await this.cycleRepo.trouverParId(existant.cyclePaieId);
        if (!cycle || req.utilisateur.entrepriseId !== cycle.entrepriseId) {
          res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
          return;
        }
      }
      const bulletin = await this.service.recalculer(parseInt(req.params.id));
      res.json(bulletin);
    } catch (error) {
      next(error);
    }
  };

  public listerParEmploye = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeId = parseInt(req.params.employeId);
      const { statut } = req.query;
      
      // Filtres optionnels
      const filtres: any = {};
      if (statut) {
        // Gérer les statuts multiples (séparés par des virgules)
        filtres.statut = typeof statut === 'string' ? statut.split(',') : [statut];
      }

      const bulletins = await this.service.listerParEmploye(employeId, filtres);
      res.json(bulletins);
    } catch (error) {
      next(error);
    }
  };

  public genererPDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bulletinComplet = await this.service.obtenirAvecDetails(parseInt(req.params.id));
      
      if (!bulletinComplet) {
        res.status(404).json({ message: 'Bulletin de paie non trouvé' });
        return;
      }

      // Vérifier l'appartenance à l'entreprise pour ADMIN/CAISSIER
      if (req.utilisateur && req.utilisateur.role !== 'SUPER_ADMIN') {
        const cycle = await this.cycleRepo.trouverParId(bulletinComplet.cyclePaieId);
        if (!cycle || req.utilisateur.entrepriseId !== cycle.entrepriseId) {
          res.status(403).json({ message: 'Accès refusé - Entreprise non autorisée' });
          return;
        }
      }

      const pdfBuffer = await PDFService.genererBulletinPaie(
        bulletinComplet,
        bulletinComplet.employe,
        bulletinComplet.cyclePaie.entreprise,
        bulletinComplet.cyclePaie
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bulletin-${bulletinComplet.employe.nom}-${bulletinComplet.employe.prenom}-${bulletinComplet.cyclePaie.periode}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
