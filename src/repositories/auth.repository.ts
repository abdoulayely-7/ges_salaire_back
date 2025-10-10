import { BaseRepository } from './base.repository.js';
import type { Utilisateur, RoleUtilisateur } from '@prisma/client';

export interface CreerUtilisateurData {
  email: string;
  motDePasse: string;
  prenom: string;
  nom: string;
  role: RoleUtilisateur;
  entrepriseId?: number;
}

export interface MettreAJourUtilisateurData {
  email?: string;
  motDePasse?: string;
  prenom?: string;
  nom?: string;
  role?: RoleUtilisateur;
  estActif?: boolean;
}

export interface UtilisateurAvecEntreprise extends Utilisateur {
  entreprise?: {
    id: number;
    nom: string;
  } | null;
}

export class AuthRepository extends BaseRepository {
  async trouverParEmail(email: string): Promise<Utilisateur | null> {
    return await this.prisma.utilisateur.findUnique({
      where: { email }
    });
  }

  async trouverParId(id: number): Promise<UtilisateurAvecEntreprise | null> {
    return await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        entreprise: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });
  }

  async creer(donnees: CreerUtilisateurData): Promise<Utilisateur> {
    return await this.prisma.utilisateur.create({
      data: donnees
    });
  }

  async mettreAJourDerniereConnexion(id: number): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { id },
      data: { derniereConnexion: new Date() }
    });
  }

  async desactiver(id: number): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { id },
      data: { estActif: false }
    });
  }

  async activer(id: number): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { id },
      data: { estActif: true }
    });
  }

  async listerParEntreprise(entrepriseId: number): Promise<Utilisateur[]> {
    return await this.prisma.utilisateur.findMany({
      where: { entrepriseId },
      select: {
        id: true,
        email: true,
        motDePasse: true,
        prenom: true,
        nom: true,
        role: true,
        estActif: true,
        derniereConnexion: true,
        creeLe: true,
        misAJourLe: true,
        entrepriseId: true
      }
    });
  }

  async mettreAJour(id: number, donnees: MettreAJourUtilisateurData): Promise<Utilisateur> {
    return await this.prisma.utilisateur.update({
      where: { id },
      data: donnees
    });
  }

  async compterParRole(role: RoleUtilisateur): Promise<number> {
    return await this.prisma.utilisateur.count({
      where: { role }
    });
  }

  async supprimer(id: number): Promise<void> {
    await this.prisma.utilisateur.delete({
      where: { id }
    });
  }
}