import { PaiementRepository } from '../repositories/paiement.repository.js';
import { BulletinPaieRepository } from '../repositories/bulletinPaie.repository.js';
import { CyclePaieRepository } from '../repositories/cyclePaie.repository.js';
import type { CreerPaiementData, ModifierPaiementData } from '../repositories/paiement.repository.js';
import type { Paiement } from '@prisma/client';

export class PaiementService {
  private paiementRepository: PaiementRepository;
  private bulletinPaieRepository: BulletinPaieRepository;
  private cyclePaieRepository: CyclePaieRepository;

  constructor() {
    this.paiementRepository = new PaiementRepository();
    this.bulletinPaieRepository = new BulletinPaieRepository();
    this.cyclePaieRepository = new CyclePaieRepository();
  }

  async listerParBulletin(bulletinPaieId: number): Promise<Paiement[]> {
    return await this.paiementRepository.listerParBulletin(bulletinPaieId);
  }

  async obtenirParId(id: number): Promise<Paiement | null> {
    return await this.paiementRepository.trouverParId(id);
  }

  async creer(donnees: CreerPaiementData): Promise<Paiement> {
    // Générer le numéro de reçu
    const numeroRecu = await this.paiementRepository.genererNumeroRecu();

    const paiementData = {
      ...donnees,
      numeroRecu
    };

    const paiement = await this.paiementRepository.creer(paiementData);

    // Mettre à jour le montant payé du bulletin
    await this.bulletinPaieRepository.mettreAJourMontantPaye(donnees.bulletinPaieId);
    // Mettre à jour les totaux du cycle
    const bulletin = await this.bulletinPaieRepository.trouverParId(donnees.bulletinPaieId);
    if (bulletin) {
      await this.cyclePaieRepository.mettreAJourTotaux(bulletin.cyclePaieId);
    }

    return paiement;
  }

  async modifier(id: number, donnees: ModifierPaiementData): Promise<Paiement> {
    const paiement = await this.paiementRepository.modifier(id, donnees);

    // Mettre à jour le montant payé du bulletin
    await this.bulletinPaieRepository.mettreAJourMontantPaye(paiement.bulletinPaieId);
    const bulletin = await this.bulletinPaieRepository.trouverParId(paiement.bulletinPaieId);
    if (bulletin) {
      await this.cyclePaieRepository.mettreAJourTotaux(bulletin.cyclePaieId);
    }

    return paiement;
  }

  async supprimer(id: number): Promise<void> {
    const paiement = await this.paiementRepository.trouverParId(id);
    if (!paiement) {
      throw new Error('Paiement non trouvé');
    }

    await this.paiementRepository.supprimer(id);

    // Mettre à jour le montant payé du bulletin
    await this.bulletinPaieRepository.mettreAJourMontantPaye(paiement.bulletinPaieId);
    const bulletin = await this.bulletinPaieRepository.trouverParId(paiement.bulletinPaieId);
    if (bulletin) {
      await this.cyclePaieRepository.mettreAJourTotaux(bulletin.cyclePaieId);
    }
  }

  async obtenirAvecDetails(id: number): Promise<any> {
    return await this.paiementRepository.trouverAvecDetails(id);
  }

  async listerParEntrepriseEtPeriode(entrepriseId: number, periode: string): Promise<any[]> {
    return await this.paiementRepository.listerParEntrepriseEtPeriode(entrepriseId, periode);
  }

  async listerAvecFiltres(
    page: number, 
    limit: number, 
    filtres: {
      dateDebut?: Date;
      dateFin?: Date;
      employeId?: number;
      methodePaiement?: string;
      entrepriseId?: number;
    }
  ): Promise<{
    paiements: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await this.paiementRepository.listerAvecFiltres(page, limit, filtres);
  }
}