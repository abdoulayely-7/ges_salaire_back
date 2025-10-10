import { PointageRepository } from '../repositories/pointage.repository.js';
import { EmployeRepository } from '../repositories/employe.repository.js';
import { EntrepriseRepository } from '../repositories/entreprise.repository.js';
import type { CreerPointageData, ModifierPointageData } from '../repositories/pointage.repository.js';

export class PointageService {
  private pointageRepository: PointageRepository;
  private employeRepository: EmployeRepository;
  private entrepriseRepository: EntrepriseRepository;

  constructor() {
    this.pointageRepository = new PointageRepository();
    this.employeRepository = new EmployeRepository();
    this.entrepriseRepository = new EntrepriseRepository();
  }

  async listerParEntreprise(entrepriseId: number, dateDebut?: Date, dateFin?: Date): Promise<any[]> {
    return await this.pointageRepository.listerParEntreprise(entrepriseId, dateDebut, dateFin);
  }

  async listerParEmploye(employeId: number, dateDebut?: Date, dateFin?: Date): Promise<any[]> {
    return await this.pointageRepository.listerParEmploye(employeId, dateDebut, dateFin);
  }

  async obtenirParId(id: number): Promise<any | null> {
    return await this.pointageRepository.trouverParId(id);
  }

  async creer(donnees: CreerPointageData): Promise<any> {
    // Vérifier si l'employé appartient à l'entreprise
    const employe = await this.employeRepository.trouverParId(donnees.employeId);
    if (!employe || employe.entrepriseId !== donnees.entrepriseId) {
      throw new Error('Employé non trouvé dans cette entreprise');
    }

    // Vérifier si le vigile appartient à l'entreprise
    const vigile = await this.entrepriseRepository.trouverUtilisateurParId(donnees.pointeParId);
    if (!vigile || vigile.entrepriseId !== donnees.entrepriseId || (vigile.role as any) !== 'VIGILE') {
      throw new Error('Vigile non autorisé pour cette entreprise');
    }

    // Vérifier les règles de pointage (pas de double entrée/sortie dans la même journée)
    const pointageDuJour = await this.pointageRepository.verifierPointageDuJour(donnees.employeId, new Date());

    if (donnees.typePointage === 'ENTREE' && pointageDuJour.entree) {
      throw new Error('L\'employé a déjà pointé son entrée aujourd\'hui');
    }

    if (donnees.typePointage === 'SORTIE' && !pointageDuJour.entree) {
      throw new Error('L\'employé doit d\'abord pointer son entrée avant de pointer sa sortie');
    }

    if (donnees.typePointage === 'SORTIE' && pointageDuJour.sortie) {
      throw new Error('L\'employé a déjà pointé sa sortie aujourd\'hui');
    }

    // Calculer les heures travaillées pour la sortie
    let heuresTravaillees: number | undefined = undefined;
    if (donnees.typePointage === 'SORTIE' && pointageDuJour.entree) {
      const heureEntree = new Date(pointageDuJour.entree.datePointage);
      const heureSortie = new Date();
      const differenceMs = heureSortie.getTime() - heureEntree.getTime();
      heuresTravaillees = Math.round((differenceMs / (1000 * 60 * 60)) * 100) / 100; // Arrondi à 2 décimales
    }

    // Déterminer automatiquement le statut (retard si après 9h pour entrée)
    let statut: 'VALIDE' | 'RETARD' | 'ANNULE' = 'VALIDE';
    if (donnees.typePointage === 'ENTREE') {
      const heureActuelle = new Date().getHours();
      if (heureActuelle >= 9) {
        statut = 'RETARD';
      }
    }

    return await this.pointageRepository.creer({
      ...donnees,
      statut: donnees.statut || statut,
      heuresTravaillees
    });
  }

  async modifier(id: number, donnees: ModifierPointageData): Promise<any> {
    const pointage = await this.pointageRepository.trouverParId(id);
    if (!pointage) {
      throw new Error('Pointage non trouvé');
    }

    return await this.pointageRepository.modifier(id, donnees);
  }

  async supprimer(id: number): Promise<void> {
    const pointage = await this.pointageRepository.trouverParId(id);
    if (!pointage) {
      throw new Error('Pointage non trouvé');
    }

    await this.pointageRepository.supprimer(id);
  }

  async obtenirStatistiques(entrepriseId: number, dateDebut?: Date, dateFin?: Date): Promise<any> {
    return await this.pointageRepository.obtenirStatistiquesPointage(entrepriseId, dateDebut, dateFin);
  }

  async effectuerPointage(employeId: number, entrepriseId: number, vigileId: number, typePointage: 'ENTREE' | 'SORTIE', commentaire?: string, latitude?: number, longitude?: number): Promise<any> {
    return await this.creer({
      employeId,
      entrepriseId,
      pointeParId: vigileId,
      typePointage,
      commentaire,
      latitude,
      longitude
    });
  }

  async obtenirPointagesEmploye(employeId: number, dateDebut?: Date, dateFin?: Date): Promise<any[]> {
    return await this.pointageRepository.listerParEmploye(employeId, dateDebut, dateFin);
  }

  async obtenirPointagesJour(entrepriseId: number, date: Date): Promise<any[]> {
    const debutJour = new Date(date);
    debutJour.setHours(0, 0, 0, 0);

    const finJour = new Date(date);
    finJour.setHours(23, 59, 59, 999);

    return await this.pointageRepository.listerParEntreprise(entrepriseId, debutJour, finJour);
  }
}