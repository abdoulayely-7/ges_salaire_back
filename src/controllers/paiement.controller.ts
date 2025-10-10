import type { Request, Response, NextFunction } from 'express';
import { PaiementService } from '../services/paiement.service.js';
import { PDFService } from '../services/pdf.service.js';
import { enregistrerPaiementSchema, modifierPaiementSchema, paiementParamsSchema } from '../validator/paiement.validator.js';

export class PaiementController {
  private service: PaiementService;

  constructor() {
    this.service = new PaiementService();
  }

  public listerParBulletin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paiements = await this.service.listerParBulletin(parseInt(req.params.bulletinId));
      res.json(paiements);
    } catch (error) {
      next(error);
    }
  };

  public listerTous = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.utilisateur) {
        res.status(401).json({ message: 'Non authentifié' });
        return;
      }

      const { 
        page = 1, 
        limit = 10, 
        dateDebut, 
        dateFin, 
        employeId, 
        methodePaiement 
      } = req.query;

      const filtres = {
        dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
        dateFin: dateFin ? new Date(dateFin as string) : undefined,
        employeId: employeId ? parseInt(employeId as string) : undefined,
        methodePaiement: methodePaiement as string || undefined,
        entrepriseId: req.utilisateur.entrepriseId
      };

      const result = await this.service.listerAvecFiltres(
        parseInt(page as string), 
        parseInt(limit as string), 
        filtres
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  public obtenirParId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifParams = paiementParamsSchema.safeParse(req.params);
      if (!verifParams.success) {
        return res.status(400).json({
          errors: verifParams.error.format()
        });
      }

      const paiement = await this.service.obtenirParId(verifParams.data.id);
      if (!paiement) {
        res.status(404).json({ message: 'Paiement non trouvé' });
        return;
      }
      res.json(paiement);
    } catch (error) {
      next(error);
    }
  };

  public creer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.utilisateur) {
        res.status(401).json({ message: 'Non authentifié' });
        return;
      }

      const verif = enregistrerPaiementSchema.safeParse({
        ...req.body,
        bulletinPaieId: parseInt(req.params.bulletinId)
      });
      if (!verif.success) {
        return res.status(400).json({
          errors: verif.error.format()
        });
      }

      // Extraire seulement les champs nécessaires pour la création
      const { bulletinPaieId, montant, methodePaiement, reference, notes } = verif.data;
      
      const paiement = await this.service.creer({
        bulletinPaieId,
        montant,
        methodePaiement,
        reference: reference || null,
        notes: notes || null,
        traiteParId: req.utilisateur.id,
      });
      res.status(201).json(paiement);
    } catch (error) {
      next(error);
    }
  };

  public modifier = async (req: Request, res: Response, Next: NextFunction) => {
    try {
      const paiement = await this.service.modifier(parseInt(req.params.id), req.body);
      (res as Response).json(paiement);
    } catch (error) {
      Next(error);
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

  public genererRecuPDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paiementComplet = await this.service.obtenirAvecDetails(parseInt(req.params.id));
      
      if (!paiementComplet) {
        res.status(404).json({ message: 'Paiement non trouvé' });
        return;
      }

      const pdfBuffer = await PDFService.genererRecuPaiement(
        paiementComplet,
        paiementComplet.bulletinPaie,
        paiementComplet.bulletinPaie.employe,
        paiementComplet.bulletinPaie.employe.entreprise
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="recu-${paiementComplet.numeroRecu}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  public genererListePaiementsPDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entrepriseId, periode } = req.params;
      const paiements = await this.service.listerParEntrepriseEtPeriode(
        parseInt(entrepriseId), 
        periode
      );

      if (paiements.length === 0) {
        res.status(404).json({ message: 'Aucun paiement trouvé pour cette période' });
        return;
      }

      const entreprise = paiements[0]?.bulletinPaie?.employe?.entreprise;
      const pdfBuffer = await PDFService.genererListePaiements(paiements, entreprise, periode);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="liste-paiements-${periode}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
