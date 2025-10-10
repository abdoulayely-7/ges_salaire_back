import { BaseRepository } from './base.repository.js';
import type { CyclePaie, StatutCyclePaie, BulletinPaie } from '@prisma/client';

export interface CreerCyclePaieData {
  titre: string;
  periode: string;
  dateDebut: Date;
  dateFin: Date;
  entrepriseId: number;
}

export interface ModifierCyclePaieData {
  titre?: string;
  periode?: string;
  dateDebut?: Date;
  dateFin?: Date;
  statut?: StatutCyclePaie;
}

export class CyclePaieRepository extends BaseRepository {
  async listerParEntreprise(entrepriseId: number): Promise<CyclePaie[]> {
    return await this.prisma.cyclePaie.findMany({
      where: { entrepriseId },
      orderBy: { creeLe: 'desc' },
      include: {
        bulletinsPaie: true
      }
    });
  }

  async trouverParId(id: number): Promise<CyclePaie | null> {
    return await this.prisma.cyclePaie.findUnique({
      where: { id },
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true,
            paiements: true
          }
        }
      }
    });
  }

  async creer(donnees: CreerCyclePaieData): Promise<CyclePaie> {
    return await this.prisma.cyclePaie.create({
      data: {
        titre: donnees.titre,
        periode: donnees.periode,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin,
        entrepriseId: donnees.entrepriseId
      }
    });
  }

  async modifier(id: number, donnees: ModifierCyclePaieData): Promise<CyclePaie> {
    return await this.prisma.cyclePaie.update({
      where: { id },
      data: donnees
    });
  }

  async supprimer(id: number): Promise<void> {
    await this.prisma.cyclePaie.delete({
      where: { id }
    });
  }

  async approuver(id: number): Promise<CyclePaie> {
    return await this.prisma.cyclePaie.update({
      where: { id },
      data: {
        statut: 'APPROUVE',
        approuveLe: new Date()
      }
    });
  }

  async cloturer(id: number): Promise<CyclePaie> {
    return await this.prisma.cyclePaie.update({
      where: { id },
      data: {
        statut: 'CLOTURE',
        clotureLe: new Date()
      }
    });
  }

  async verifierChevauchement(entrepriseId: number, dateDebut: Date, dateFin: Date, excludeId?: number): Promise<boolean> {
    const where: any = {
      entrepriseId,
      OR: [
        {
          AND: [
            { dateDebut: { lte: dateDebut } },
            { dateFin: { gte: dateDebut } }
          ]
        },
        {
          AND: [
            { dateDebut: { lte: dateFin } },
            { dateFin: { gte: dateFin } }
          ]
        },
        {
          AND: [
            { dateDebut: { gte: dateDebut } },
            { dateFin: { lte: dateFin } }
          ]
        }
      ]
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.cyclePaie.count({ where });
    return count > 0;
  }

  async mettreAJourTotaux(id: number): Promise<void> {
    const bulletins = await this.prisma.bulletinPaie.findMany({
      where: { cyclePaieId: id },
      select: {
        salaireBrut: true,
        salaireNet: true,
        montantPaye: true
      }
    });

    const totalBrut = bulletins.reduce((sum, b) => sum + b.salaireBrut, 0);
    const totalNet = bulletins.reduce((sum, b) => sum + b.salaireNet, 0);
    const totalPaye = bulletins.reduce((sum, b) => sum + b.montantPaye, 0);

    await this.prisma.cyclePaie.update({
      where: { id },
      data: {
        totalBrut,
        totalNet,
        totalPaye
      }
    });
  }
}