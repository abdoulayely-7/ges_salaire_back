import { EmployeRepository } from '../repositories/employe.repository.js';
import { EntrepriseRepository } from '../repositories/entreprise.repository.js';
import type { CreerEmployeDto, ModifierEmployeDto, FiltreEmployeDto } from '../interfaces/employe.interface.js';
import type { Employe } from '../repositories/employe.repository.js';

export class EmployeService {
  private employeRepository: EmployeRepository;
  private entrepriseRepository: EntrepriseRepository;

  constructor() {
    this.employeRepository = new EmployeRepository();
    this.entrepriseRepository = new EntrepriseRepository();
  }

  async listerParEntreprise(entrepriseId: number, filtre?: FiltreEmployeDto): Promise<Employe[]> {
    return await this.employeRepository.listerParEntreprise(entrepriseId, filtre);
  }

  async obtenirParId(id: number): Promise<Employe | null> {
    return await this.employeRepository.trouverParId(id);
  }

  async creer(donnees: CreerEmployeDto, entrepriseId: number): Promise<Employe> {
    // Vérifier que l'entreprise existe
    const entreprise = await this.entrepriseRepository.trouverParId(entrepriseId);
    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    // Générer automatiquement le code employé
    const codeEmploye = await this.genererCodeEmploye(entrepriseId);

    // Validation des données selon le type de contrat
    this.validerDonneesContrat(donnees);

    const nouvelEmploye = await this.employeRepository.creer({
      ...donnees,
      codeEmploye,
      dateEmbauche: new Date(donnees.dateEmbauche),
      entrepriseId
    });

    return nouvelEmploye;
  }

  /**
   * Génère un code employé unique pour une entreprise
   * Format: EMP-{entrepriseId}-{compteur}
   */
  private async genererCodeEmploye(entrepriseId: number): Promise<string> {
    // Compter le nombre d'employés existants dans cette entreprise
    const count = await this.employeRepository.compterParEntreprise(entrepriseId);
    
    // Générer le code avec un compteur incrémental
    const numeroSequentiel = (count + 1).toString().padStart(4, '0');
    return `EMP-${entrepriseId}-${numeroSequentiel}`;
  }

  async modifier(id: number, donnees: ModifierEmployeDto): Promise<Employe> {
    // Vérifier que l'employé existe
    const employe = await this.employeRepository.trouverParId(id);
    if (!employe) {
      throw new Error('Employé non trouvé');
    }

    // Validation des données selon le type de contrat si modifié
    if (donnees.typeContrat || donnees.salaireBase !== undefined || donnees.tauxJournalier !== undefined) {
      const donneesAValider = {
        typeContrat: donnees.typeContrat || employe.typeContrat,
        salaireBase: donnees.salaireBase !== undefined ? donnees.salaireBase : employe.salaireBase,
        tauxJournalier: donnees.tauxJournalier !== undefined ? donnees.tauxJournalier : employe.tauxJournalier
      };
      this.validerDonneesContrat(donneesAValider);
    }

    // Préparer les données avec conversion de date si nécessaire
    const donneesPreparees: any = { ...donnees };
    if (donnees.dateEmbauche) {
      donneesPreparees.dateEmbauche = new Date(donnees.dateEmbauche);
    }

    return await this.employeRepository.modifier(id, donneesPreparees);
  }

  async supprimer(id: number): Promise<void> {
    // Vérifier que l'employé existe
    const employe = await this.employeRepository.trouverParId(id);
    if (!employe) {
      throw new Error('Employé non trouvé');
    }

    // TODO: Vérifier qu'il n'y a pas de bulletins de paie en cours
    
    await this.employeRepository.supprimer(id);
  }

  async activer(id: number): Promise<void> {
    const employe = await this.employeRepository.trouverParId(id);
    if (!employe) {
      throw new Error('Employé non trouvé');
    }

    if (employe.estActif) {
      throw new Error('L\'employé est déjà actif');
    }

    await this.employeRepository.activer(id);
  }

  async desactiver(id: number): Promise<void> {
    const employe = await this.employeRepository.trouverParId(id);
    if (!employe) {
      throw new Error('Employé non trouvé');
    }

    if (!employe.estActif) {
      throw new Error('L\'employé est déjà inactif');
    }

    // TODO: Vérifier qu'il n'y a pas de bulletins de paie en cours
    
    await this.employeRepository.desactiver(id);
  }

  async toggle(id: number): Promise<Employe> {
    const employe = await this.employeRepository.trouverParId(id);
    if (!employe) {
      throw new Error('Employé non trouvé');
    }

    if (employe.estActif) {
      // TODO: Vérifier qu'il n'y a pas de bulletins de paie en cours avant de désactiver
      await this.employeRepository.desactiver(id);
    } else {
      await this.employeRepository.activer(id);
    }

    // Retourner l'employé mis à jour
    return await this.employeRepository.trouverParId(id) as Employe;
  }

  async listerActifsParEntreprise(entrepriseId: number): Promise<Employe[]> {
    return await this.employeRepository.listerActifsParEntreprise(entrepriseId);
  }

  async obtenirStatistiques(entrepriseId: number) {
    const [total, actifs] = await Promise.all([
      this.employeRepository.compterParEntreprise(entrepriseId),
      this.employeRepository.compterActifsParEntreprise(entrepriseId)
    ]);

    return {
      nombreTotal: total,
      nombreActifs: actifs,
      nombreInactifs: total - actifs
    };
  }

  private validerDonneesContrat(donnees: {
    typeContrat: string;
    salaireBase?: number | null | undefined;
    tauxJournalier?: number | null | undefined;
  }): void {
    switch (donnees.typeContrat) {
      case 'JOURNALIER':
        if (!donnees.tauxJournalier || donnees.tauxJournalier <= 0) {
          throw new Error('Taux journalier requis et doit être positif pour un contrat journalier');
        }
        break;
      case 'FIXE':
      case 'HONORAIRE':
        if (!donnees.salaireBase || donnees.salaireBase <= 0) {
          throw new Error('Salaire de base requis et doit être positif pour ce type de contrat');
        }
        break;
      default:
        throw new Error('Type de contrat invalide');
    }
  }
}