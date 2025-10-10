import { BulletinPaieRepository } from '../repositories/bulletinPaie.repository.js';
import { EmployeRepository } from '../repositories/employe.repository.js';
import { CyclePaieRepository } from '../repositories/cyclePaie.repository.js';
import type { CreerBulletinPaieData, ModifierBulletinPaieData } from '../repositories/bulletinPaie.repository.js';
import type { BulletinPaie } from '@prisma/client';

export class BulletinPaieService {
  private bulletinPaieRepository: BulletinPaieRepository;
  private employeRepository: EmployeRepository;
  private cyclePaieRepository: CyclePaieRepository;

  constructor() {
    this.bulletinPaieRepository = new BulletinPaieRepository();
    this.employeRepository = new EmployeRepository();
    this.cyclePaieRepository = new CyclePaieRepository();
  }

  async listerParCycle(cyclePaieId: number): Promise<BulletinPaie[]> {
    return await this.bulletinPaieRepository.listerParCycle(cyclePaieId);
  }

  async listerParEmploye(employeId: number, filtres?: { statut?: string[] }): Promise<BulletinPaie[]> {
    return await this.bulletinPaieRepository.listerParEmploye(employeId, filtres);
  }

  async obtenirParId(id: number): Promise<BulletinPaie | null> {
    return await this.bulletinPaieRepository.trouverParId(id);
  }

  async modifier(id: number, donnees: ModifierBulletinPaieData): Promise<BulletinPaie> {
    const bulletin = await this.bulletinPaieRepository.trouverParId(id);
    if (!bulletin) {
      throw new Error('Bulletin de paie non trouvé');
    }

    // Fetch employe and cycle for checks
    const employe = await this.employeRepository.trouverParId(bulletin.employeId);
    if (!employe) {
      throw new Error('Employé non trouvé');
    }
    // Vérifier que le cycle est en brouillon avant modification
    const cycle = await this.cyclePaieRepository.trouverParId(bulletin.cyclePaieId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }
    if (cycle.statut !== 'BROUILLON') {
      throw new Error('Le bulletin ne peut être modifié que lorsque le cycle est en brouillon');
    }

    // Validation stricte des jours travaillés pour les journaliers
    if (employe.typeContrat === 'JOURNALIER' && donnees.joursTravailes !== undefined) {
      this.validerJoursTravailes(donnees.joursTravailes, cycle);
    }

    // Recalculer les montants si nécessaire
    let salaireBrut = donnees.salaireBrut ?? bulletin.salaireBrut;
    let deductions = donnees.deductions ?? bulletin.deductions;
    let joursTravailes = donnees.joursTravailes ?? bulletin.joursTravailes;

    // Pour les journaliers, recalculer le salaire brut
    if (employe.typeContrat === 'JOURNALIER' && joursTravailes !== null && joursTravailes !== undefined) {
      salaireBrut = (employe.tauxJournalier || 0) * joursTravailes;
    }

    // Pour les honoraires, recalculer le salaire brut basé sur les heures travaillées
    if (employe.typeContrat === 'HONORAIRE') {
      // Récupérer les heures travaillées depuis les pointages
      const pointages = await this.bulletinPaieRepository.getPointagesForBulletin(bulletin.employeId, cycle.dateDebut, cycle.dateFin);
      const heuresTravaillees = pointages.reduce((total, pointage) => total + (pointage.heuresTravaillees || 0), 0);
      salaireBrut = (employe.tauxJournalier || 0) * heuresTravaillees;
    }

    const salaireNet = salaireBrut - deductions;

    const bulletinModifie = await this.bulletinPaieRepository.modifier(id, {
      ...donnees,
      salaireBrut,
      salaireNet
    });

    // Mettre à jour le montant payé
    await this.bulletinPaieRepository.mettreAJourMontantPaye(id);

    return bulletinModifie;
  }

  async supprimer(id: number): Promise<void> {
    const bulletin = await this.bulletinPaieRepository.trouverParId(id);
    if (!bulletin) {
      throw new Error('Bulletin de paie non trouvé');
    }
    // Empêcher la suppression si le cycle n'est pas en brouillon
    const cycle = await this.cyclePaieRepository.trouverParId(bulletin.cyclePaieId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }
    if (cycle.statut !== 'BROUILLON') {
      throw new Error('Le bulletin ne peut être supprimé que lorsque le cycle est en brouillon');
    }

    await this.bulletinPaieRepository.supprimer(id);
  }

  // Méthode pour recalculer un bulletin
  async recalculer(id: number): Promise<BulletinPaie> {
    const bulletin = await this.bulletinPaieRepository.trouverParId(id);
    if (!bulletin) {
      throw new Error('Bulletin de paie non trouvé');
    }

    const employe = await this.employeRepository.trouverParId(bulletin.employeId);
    if (!employe) {
      throw new Error('Employé non trouvé');
    }

    let salaireBrut = bulletin.salaireBrut;
    let joursTravailes = bulletin.joursTravailes;

    if (employe.typeContrat === 'JOURNALIER') {
      if (joursTravailes === null) {
        joursTravailes = 22; // Valeur par défaut
      }
      salaireBrut = (employe.tauxJournalier || 0) * joursTravailes;
    } else if (employe.typeContrat === 'HONORAIRE') {
      // Pour les honoraires, calculer le salaire basé sur les heures travaillées
      const cycle = await this.cyclePaieRepository.trouverParId(bulletin.cyclePaieId);
      if (cycle) {
        const pointages = await this.bulletinPaieRepository.getPointagesForBulletin(bulletin.employeId, cycle.dateDebut, cycle.dateFin);
        const heuresTravaillees = pointages.reduce((total: number, pointage: any) => total + (pointage.heuresTravaillees || 0), 0);
        salaireBrut = (employe.tauxJournalier || 0) * heuresTravaillees;
      }
    }

    const salaireNet = salaireBrut - bulletin.deductions;

    return await this.bulletinPaieRepository.modifier(id, {
      joursTravailes,
      salaireBrut,
      salaireNet
    });
  }

  async obtenirAvecDetails(id: number): Promise<any> {
    return await this.bulletinPaieRepository.trouverAvecDetails(id);
  }

  /**
   * Valide les jours travaillés selon la période du cycle
   */
  private validerJoursTravailes(joursTravailes: number | null, cycle: any): void {
    if (joursTravailes === null || joursTravailes === undefined) {
      return; // Valide pour les non-journaliers
    }

    // Validation des valeurs de base
    if (joursTravailes < 0) {
      throw new Error('Le nombre de jours travaillés ne peut pas être négatif');
    }

    if (joursTravailes > 31) {
      throw new Error('Le nombre de jours travaillés ne peut pas dépasser 31 jours par période');
    }

    // Calcul du nombre de jours maximum selon la période du cycle
    const dateDebut = new Date(cycle.dateDebut);
    const dateFin = new Date(cycle.dateFin);
    const joursMaxDansPeriode = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (joursTravailes > joursMaxDansPeriode) {
      throw new Error(`Le nombre de jours travaillés (${joursTravailes}) ne peut pas dépasser le nombre de jours dans la période (${joursMaxDansPeriode})`);
    }

    // Validation pour éviter les erreurs de saisie communes
    if (joursTravailes > 25 && joursMaxDansPeriode <= 31) {
      console.warn(`⚠️ Attention: ${joursTravailes} jours travaillés semble élevé pour une période de ${joursMaxDansPeriode} jours`);
    }
  }
}