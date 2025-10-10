import { BaseRepository } from './base.repository.js';
import type { BulletinPaie, StatutBulletinPaie } from '@prisma/client';

export interface CreerBulletinPaieData {
  numeroBulletin: string;
  joursTravailes?: number | null;
  salaireBrut: number;
  deductions: number;
  salaireNet: number;
  employeId: number;
  cyclePaieId: number;
}

export interface ModifierBulletinPaieData {
  joursTravailes?: number | null;
  salaireBrut?: number;
  deductions?: number;
  salaireNet?: number;
  statut?: StatutBulletinPaie;
}

export class BulletinPaieRepository extends BaseRepository {
  async listerParCycle(cyclePaieId: number): Promise<BulletinPaie[]> {
    return await this.prisma.bulletinPaie.findMany({
      where: { cyclePaieId },
      include: {
        employe: true,
        paiements: true
      },
      orderBy: { creeLe: 'desc' }
    });
  }

  async listerParEmploye(employeId: number, filtres?: { statut?: string[] }): Promise<BulletinPaie[]> {
    const where: any = { employeId };
    
    if (filtres?.statut && filtres.statut.length > 0) {
      where.statut = { in: filtres.statut };
    }

    return await this.prisma.bulletinPaie.findMany({
      where,
      include: {
        employe: true,
        cyclePaie: {
          include: {
            entreprise: true
          }
        },
        paiements: true
      },
      orderBy: { creeLe: 'desc' }
    });
  }

  async trouverParId(id: number): Promise<BulletinPaie | null> {
    return await this.prisma.bulletinPaie.findUnique({
      where: { id },
      include: {
        employe: true,
        cyclePaie: {
          include: {
            entreprise: true
          }
        },
        paiements: true
      }
    });
  }

  async creer(donnees: CreerBulletinPaieData): Promise<BulletinPaie> {
    return await this.prisma.bulletinPaie.create({
      data: {
        numeroBulletin: donnees.numeroBulletin,
        joursTravailes: donnees.joursTravailes ?? null,
        salaireBrut: donnees.salaireBrut,
        deductions: donnees.deductions,
        salaireNet: donnees.salaireNet,
        employeId: donnees.employeId,
        cyclePaieId: donnees.cyclePaieId
      }
    });
  }

  async modifier(id: number, donnees: ModifierBulletinPaieData): Promise<BulletinPaie> {
    return await this.prisma.bulletinPaie.update({
      where: { id },
      data: donnees
    });
  }

  async supprimer(id: number): Promise<void> {
    await this.prisma.bulletinPaie.delete({
      where: { id }
    });
  }

  async mettreAJourMontantPaye(id: number): Promise<void> {
    const paiements = await this.prisma.paiement.findMany({
      where: { bulletinPaieId: id },
      select: { montant: true }
    });

    const montantPaye = paiements.reduce((sum, p) => sum + p.montant, 0);

    // Récupérer le salaire net pour calculer le statut
    const bulletin = await this.prisma.bulletinPaie.findUnique({
      where: { id },
      select: { salaireNet: true }
    });

    const salaireNet = bulletin?.salaireNet ?? 0;
    let statut: 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' = 'EN_ATTENTE';
    if (montantPaye <= 0) {
      statut = 'EN_ATTENTE';
    } else if (montantPaye < salaireNet) {
      statut = 'PARTIEL';
    } else {
      statut = 'PAYE';
    }

    await this.prisma.bulletinPaie.update({
      where: { id },
      data: { montantPaye, statut }
    });
  }

  async compterParCycle(cyclePaieId: number): Promise<number> {
    return await this.prisma.bulletinPaie.count({
      where: { cyclePaieId }
    });
  }

  async trouverAvecDetails(id: number): Promise<any> {
    const bulletin = await this.prisma.bulletinPaie.findUnique({
      where: { id },
      include: {
        employe: {
          include: {
            entreprise: true
          }
        },
        cyclePaie: {
          include: {
            entreprise: true
          }
        },
        paiements: {
          include: {
            traitePar: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!bulletin) return null;

    // Pour les contrats honoraires, calculer les heures travaillées depuis les pointages
    let heuresTravaillees = null;
    if (bulletin.employe.typeContrat === 'HONORAIRE') {
      const pointages = await this.prisma.pointage.findMany({
        where: {
          employeId: bulletin.employeId,
          datePointage: {
            gte: bulletin.cyclePaie.dateDebut,
            lte: bulletin.cyclePaie.dateFin
          },
          typePointage: 'SORTIE' // On prend les pointages de sortie qui ont les heures calculées
        },
        select: {
          heuresTravaillees: true
        }
      });

      heuresTravaillees = pointages.reduce((total: number, pointage: any) => {
        return total + (pointage.heuresTravaillees || 0);
      }, 0);
    }

    return {
      ...bulletin,
      heuresTravaillees
    };
  }

  async getPointagesForBulletin(employeId: number, dateDebut: Date, dateFin: Date): Promise<any[]> {
    return await this.prisma.pointage.findMany({
      where: {
        employeId,
        datePointage: {
          gte: dateDebut,
          lte: dateFin
        },
        typePointage: 'SORTIE'
      },
      select: {
        heuresTravaillees: true
      }
    });
  }
}