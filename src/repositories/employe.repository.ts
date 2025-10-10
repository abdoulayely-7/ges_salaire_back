import { BaseRepository } from './base.repository.js';
import type { TypeContrat } from '../interfaces/employe.interface.js';

export interface Employe {
  id: number;
  codeEmploye: string;
  prenom: string;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  poste: string;
  typeContrat: TypeContrat;
  salaireBase?: number | null;
  tauxJournalier?: number | null;
  compteBancaire?: string | null;
  estActif: boolean;
  dateEmbauche: Date;
  creeLe: Date;
  misAJourLe: Date;
  entrepriseId: number;
}

export interface CreerEmployeData {
  codeEmploye: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  poste: string;
  typeContrat: TypeContrat;
  salaireBase?: number;
  tauxJournalier?: number;
  compteBancaire?: string;
  dateEmbauche: Date;
  entrepriseId: number;
}

export interface ModifierEmployeData {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  typeContrat?: TypeContrat;
  salaireBase?: number;
  tauxJournalier?: number;
  compteBancaire?: string;
  estActif?: boolean;
}

export interface FiltreEmploye {
  typeContrat?: TypeContrat;
  poste?: string;
  estActif?: boolean;
  recherche?: string;
}

export class EmployeRepository extends BaseRepository {
  async listerParEntreprise(entrepriseId: number, filtre?: FiltreEmploye): Promise<Employe[]> {
    const where: any = { entrepriseId };

    if (filtre) {
      if (filtre.typeContrat) {
        where.typeContrat = filtre.typeContrat;
      }
      if (filtre.poste) {
        where.poste = { contains: filtre.poste };
      }
      if (filtre.estActif !== undefined) {
        where.estActif = filtre.estActif;
      }
      if (filtre.recherche) {
        where.OR = [
          { prenom: { contains: filtre.recherche } },
          { nom: { contains: filtre.recherche } },
          { email: { contains: filtre.recherche } },
          { codeEmploye: { contains: filtre.recherche } }
        ];
      }
    }

    return await this.prisma.employe.findMany({
      where,
      orderBy: [
        { estActif: 'desc' },
        { nom: 'asc' },
        { prenom: 'asc' }
      ]
    });
  }

  async trouverParId(id: number): Promise<Employe | null> {
    return await this.prisma.employe.findUnique({
      where: { id }
    });
  }

  async trouverParCode(entrepriseId: number, codeEmploye: string): Promise<Employe | null> {
    return await this.prisma.employe.findUnique({
      where: {
        entrepriseId_codeEmploye: {
          entrepriseId,
          codeEmploye
        }
      }
    });
  }

  async creer(donnees: CreerEmployeData): Promise<Employe> {
    return await this.prisma.employe.create({
      data: donnees
    });
  }

  async modifier(id: number, donnees: ModifierEmployeData): Promise<Employe> {
    return await this.prisma.employe.update({
      where: { id },
      data: donnees
    });
  }

  async supprimer(id: number): Promise<void> {
    await this.prisma.employe.delete({
      where: { id }
    });
  }

  async activer(id: number): Promise<void> {
    await this.prisma.employe.update({
      where: { id },
      data: { estActif: true }
    });
  }

  async desactiver(id: number): Promise<void> {
    await this.prisma.employe.update({
      where: { id },
      data: { estActif: false }
    });
  }

  async compterParEntreprise(entrepriseId: number): Promise<number> {
    return await this.prisma.employe.count({
      where: { entrepriseId }
    });
  }

  async compterActifsParEntreprise(entrepriseId: number): Promise<number> {
    return await this.prisma.employe.count({
      where: { entrepriseId, estActif: true }
    });
  }

  async listerActifsParEntreprise(entrepriseId: number): Promise<Employe[]> {
    return await this.prisma.employe.findMany({
      where: { entrepriseId, estActif: true },
      orderBy: [
        { nom: 'asc' },
        { prenom: 'asc' }
      ]
    });
  }

  async verifierCodeUnique(entrepriseId: number, codeEmploye: string, excludeId?: string): Promise<boolean> {
    const where: any = { entrepriseId, codeEmploye };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.employe.count({ where });
    return count === 0;
  }
}