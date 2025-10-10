import { CyclePaieRepository } from '../repositories/cyclePaie.repository.js';
import { BulletinPaieRepository } from '../repositories/bulletinPaie.repository.js';
import { EmployeRepository } from '../repositories/employe.repository.js';
import type { CreerCyclePaieData, ModifierCyclePaieData } from '../repositories/cyclePaie.repository.js';
import type { CreerBulletinPaieData } from '../repositories/bulletinPaie.repository.js';
import type { CyclePaie, BulletinPaie } from '@prisma/client';

export class CyclePaieService {
  private cyclePaieRepository: CyclePaieRepository;
  private bulletinPaieRepository: BulletinPaieRepository;
  private employeRepository: EmployeRepository;
  private pointageRepository: any; // Import dynamique pour éviter les dépendances circulaires

  constructor() {
    this.cyclePaieRepository = new CyclePaieRepository();
    this.bulletinPaieRepository = new BulletinPaieRepository();
    this.employeRepository = new EmployeRepository();
  }

  async listerParEntreprise(entrepriseId: number): Promise<CyclePaie[]> {
    return await this.cyclePaieRepository.listerParEntreprise(entrepriseId);
  }

  async obtenirParId(id: number): Promise<CyclePaie | null> {
    return await this.cyclePaieRepository.trouverParId(id);
  }

  async creer(donnees: CreerCyclePaieData): Promise<CyclePaie> {
    // Vérifier le chevauchement de dates
    const chevauchement = await this.cyclePaieRepository.verifierChevauchement(
      donnees.entrepriseId,
      donnees.dateDebut,
      donnees.dateFin
    );

    if (chevauchement) {
      throw new Error('Un cycle de paie existe déjà pour cette période');
    }

    return await this.cyclePaieRepository.creer(donnees);
  }

  async modifier(id: number, donnees: ModifierCyclePaieData): Promise<CyclePaie> {
    const cycle = await this.cyclePaieRepository.trouverParId(id);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    // Vérifier le chevauchement si dates modifiées
    if (donnees.dateDebut || donnees.dateFin) {
      const dateDebut = donnees.dateDebut || cycle.dateDebut;
      const dateFin = donnees.dateFin || cycle.dateFin;

      const chevauchement = await this.cyclePaieRepository.verifierChevauchement(
        cycle.entrepriseId,
        dateDebut,
        dateFin,
        id
      );

      if (chevauchement) {
        throw new Error('Un cycle de paie existe déjà pour cette période');
      }
    }

    return await this.cyclePaieRepository.modifier(id, donnees);
  }

  async supprimer(id: number): Promise<void> {
    const cycle = await this.cyclePaieRepository.trouverParId(id);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    // Vérifier qu'il n'y a pas de bulletins
    const nombreBulletins = await this.bulletinPaieRepository.compterParCycle(id);
    if (nombreBulletins > 0) {
      throw new Error('Impossible de supprimer un cycle avec des bulletins');
    }

    await this.cyclePaieRepository.supprimer(id);
  }

  async approuver(id: number): Promise<CyclePaie> {
    const cycle = await this.cyclePaieRepository.trouverParId(id);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    if (cycle.statut !== 'BROUILLON') {
      throw new Error('Seul un cycle en brouillon peut être approuvé');
    }

    return await this.cyclePaieRepository.approuver(id);
  }

  async cloturer(id: number): Promise<CyclePaie> {
    const cycle = await this.cyclePaieRepository.trouverParId(id);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    if (cycle.statut !== 'APPROUVE') {
      throw new Error('Seul un cycle approuvé peut être clôturé');
    }

    return await this.cyclePaieRepository.cloturer(id);
  }

  async genererBulletins(id: number): Promise<BulletinPaie[]> {
    const cycle = await this.cyclePaieRepository.trouverParId(id);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    if (cycle.statut !== 'BROUILLON') {
      throw new Error('Les bulletins ne peuvent être générés que pour un cycle en brouillon');
    }

    // Vérifier qu'il n'y a pas déjà des bulletins
    const nombreBulletins = await this.bulletinPaieRepository.compterParCycle(id);
    if (nombreBulletins > 0) {
      throw new Error('Des bulletins existent déjà pour ce cycle');
    }

    // Récupérer les employés actifs
    const employes = await this.employeRepository.listerActifsParEntreprise(cycle.entrepriseId);

    // Importer dynamiquement le repository pointage pour éviter les dépendances circulaires
    const { PointageRepository } = await import('../repositories/pointage.repository.js');
    const pointageRepository = new PointageRepository();

    const bulletins: BulletinPaie[] = [];

    for (const employe of employes) {
      let salaireBrut = 0;
      let joursTravailes: number | null = null;

      switch (employe.typeContrat) {
        case 'FIXE':
          // Pour les employés fixes, salaire fixe mensuel
          salaireBrut = employe.salaireBase || 150000; // Valeur par défaut
          break;

        case 'HONORAIRE':
          // Pour les honoraires, calcul basé sur les heures travaillées et le taux journalier
          const heuresHonoraire = await pointageRepository.sommerHeuresTravailleesParPeriode(
            employe.id,
            cycle.dateDebut,
            cycle.dateFin
          );
          // Utiliser le taux journalier directement multiplié par les heures travaillées
          salaireBrut = (employe.tauxJournalier || 0) * heuresHonoraire;
          break;

        case 'JOURNALIER':
          // Pour les journaliers, calcul basé sur les jours de pointage effectif
          const joursPointage = await pointageRepository.compterJoursTravaillesParPeriode(
            employe.id,
            cycle.dateDebut,
            cycle.dateFin
          );
          const tauxJournalier = employe.tauxJournalier || 15000; // Valeur par défaut
          salaireBrut = tauxJournalier * joursPointage;
          joursTravailes = joursPointage;
          break;
      }

      // Arrondir le salaire brut à 2 décimales
      salaireBrut = Math.round(salaireBrut * 100) / 100;

      const numeroBulletin = `BP-${cycle.id.toString().padStart(8, '0')}-${employe.id.toString().padStart(8, '0')}`;

      const bulletinData: CreerBulletinPaieData = {
        numeroBulletin,
        joursTravailes,
        salaireBrut,
        deductions: 0,
        salaireNet: salaireBrut,
        employeId: employe.id,
        cyclePaieId: id
      };

      const bulletin = await this.bulletinPaieRepository.creer(bulletinData);
      bulletins.push(bulletin);
    }

    // Mettre à jour les totaux du cycle
    await this.cyclePaieRepository.mettreAJourTotaux(id);

    return bulletins;
  }

  async obtenirStatistiques(id: number): Promise<any> {
    const cycle = await this.cyclePaieRepository.trouverParId(id);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    const bulletins = await this.bulletinPaieRepository.listerParCycle(id);
    
    const stats = {
      cycleInfo: {
        id: cycle.id,
        titre: cycle.titre,
        periode: cycle.periode,
        statut: cycle.statut,
        dateDebut: cycle.dateDebut,
        dateFin: cycle.dateFin
      },
      bulletins: {
        total: bulletins.length,
        enAttente: bulletins.filter(b => b.statut === 'EN_ATTENTE').length,
        partiel: bulletins.filter(b => b.statut === 'PARTIEL').length,
        paye: bulletins.filter(b => b.statut === 'PAYE').length
      },
      montants: {
        totalBrut: bulletins.reduce((sum, b) => sum + b.salaireBrut, 0),
        totalNet: bulletins.reduce((sum, b) => sum + b.salaireNet, 0),
        totalPaye: bulletins.reduce((sum, b) => sum + b.montantPaye, 0),
        totalRestant: bulletins.reduce((sum, b) => sum + (b.salaireNet - b.montantPaye), 0)
      },
      progression: {
        pourcentagePaye: bulletins.length > 0 
          ? Math.round((bulletins.filter(b => b.statut === 'PAYE').length / bulletins.length) * 100)
          : 0
      }
    };

    return stats;
  }

  async mettreAJourJoursTravailes(cycleId: number, joursTravailes: Array<{employeId: number, jours: number}>): Promise<any[]> {
    const cycle = await this.cyclePaieRepository.trouverParId(cycleId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    if (cycle.statut !== 'BROUILLON') {
      throw new Error('Les jours travaillés ne peuvent être modifiés que pour un cycle en brouillon');
    }

    const bulletinsMisAJour = [];

    for (const item of joursTravailes) {
      // Trouver le bulletin pour cet employé
      const bulletins = await this.bulletinPaieRepository.listerParCycle(cycleId);
      const bulletin = bulletins.find(b => b.employeId === item.employeId);

      if (bulletin) {
        // Récupérer l'employé pour validation
        const employe = await this.employeRepository.trouverParId(item.employeId);
        if (employe && employe.typeContrat === 'JOURNALIER') {
          // Valider les jours travaillés
          if (item.jours < 0 || item.jours > 31) {
            throw new Error(`Nombre de jours invalide pour l'employé ${employe.prenom} ${employe.nom}: ${item.jours}`);
          }

          // Recalculer le salaire brut
          const salaireBrut = (employe.tauxJournalier || 0) * item.jours;
          const salaireNet = salaireBrut - bulletin.deductions;

          const bulletinMisAJour = await this.bulletinPaieRepository.modifier(bulletin.id, {
            joursTravailes: item.jours,
            salaireBrut,
            salaireNet
          });

          bulletinsMisAJour.push(bulletinMisAJour);
        }
      }
    }

    // Mettre à jour les totaux du cycle
    await this.cyclePaieRepository.mettreAJourTotaux(cycleId);

    return bulletinsMisAJour;
  }

  async obtenirBulletins(cycleId: number): Promise<any[]> {
    const cycle = await this.cyclePaieRepository.trouverParId(cycleId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    const bulletins = await this.bulletinPaieRepository.listerParCycle(cycleId);

    // Calculer les montants totaux payés pour chaque bulletin
    const bulletinsAvecStats = bulletins.map((bulletin: any) => {
      const totalPaye = bulletin.paiements?.reduce((sum: number, paiement: any) => sum + paiement.montant, 0) || 0;
      const restantAPayer = bulletin.salaireNet - totalPaye;

      return {
        ...bulletin,
        totalPaye,
        restantAPayer,
        employe: bulletin.employe
      };
    });

    return bulletinsAvecStats;
  }

  async recalculerBulletins(cycleId: number): Promise<any[]> {
    const cycle = await this.cyclePaieRepository.trouverParId(cycleId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    if (cycle.statut !== 'BROUILLON') {
      throw new Error('Les bulletins ne peuvent être recalculés que pour un cycle en brouillon');
    }

    const bulletins = await this.bulletinPaieRepository.listerParCycle(cycleId);

    // Importer dynamiquement le repository pointage
    const { PointageRepository } = await import('../repositories/pointage.repository.js');
    const pointageRepository = new PointageRepository();

    for (const bulletin of bulletins) {
      // Récupérer les données à jour de l'employé
      const employe = await this.employeRepository.trouverParId(bulletin.employeId);
      if (!employe) continue;

      let salaireBrut = 0;
      let joursTravailes: number | null = null;

      switch (employe.typeContrat) {
        case 'FIXE':
          // Pour les employés fixes, salaire fixe mensuel
          salaireBrut = employe.salaireBase || 150000; // Valeur par défaut
          break;

        case 'HONORAIRE':
          // Pour les honoraires, calcul basé sur les heures travaillées et le taux journalier
          const heuresHonoraire = await pointageRepository.sommerHeuresTravailleesParPeriode(
            employe.id,
            cycle.dateDebut,
            cycle.dateFin
          );
          // Utiliser le taux journalier directement multiplié par les heures travaillées
          salaireBrut = (employe.tauxJournalier || 0) * heuresHonoraire;
          break;

        case 'JOURNALIER':
          // Pour les journaliers, calcul basé sur les jours de pointage effectif
          const joursPointage = await pointageRepository.compterJoursTravaillesParPeriode(
            employe.id,
            cycle.dateDebut,
            cycle.dateFin
          );
          const tauxJournalier = employe.tauxJournalier || 15000; // Valeur par défaut
          salaireBrut = tauxJournalier * joursPointage;
          joursTravailes = joursPointage;
          break;
      }

      // Arrondir le salaire brut à 2 décimales
      salaireBrut = Math.round(salaireBrut * 100) / 100;
      const salaireNet = salaireBrut - bulletin.deductions;

      // Mettre à jour le bulletin
      await this.bulletinPaieRepository.modifier(bulletin.id, {
        salaireBrut,
        salaireNet,
        joursTravailes
      });
    }

    // Mettre à jour les totaux du cycle
    await this.cyclePaieRepository.mettreAJourTotaux(cycleId);

    // Retourner les bulletins mis à jour
    return await this.obtenirBulletins(cycleId);
  }
}