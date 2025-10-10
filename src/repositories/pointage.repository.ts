import { BaseRepository } from './base.repository.js';
import type { Pointage, TypePointage, StatutPointage } from '@prisma/client';

export interface CreerPointageData {
  employeId: number;
  entrepriseId: number;
  pointeParId: number;
  typePointage: TypePointage;
  statut?: StatutPointage;
  commentaire?: string;
  heuresTravaillees?: number;
  latitude?: number;
  longitude?: number;
}

export interface ModifierPointageData {
  statut?: StatutPointage;
  commentaire?: string;
}

export class PointageRepository extends BaseRepository {
  async listerParEntreprise(entrepriseId: number, dateDebut?: Date, dateFin?: Date): Promise<Pointage[]> {
    const where: any = { entrepriseId };

    if (dateDebut && dateFin) {
      where.datePointage = {
        gte: dateDebut,
        lte: dateFin
      };
    }

    return await this.prisma.pointage.findMany({
      where,
      include: {
        employe: true,
        pointePar: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true
          }
        }
      },
      orderBy: { datePointage: 'desc' }
    });
  }

  async listerParEmploye(employeId: number, dateDebut?: Date, dateFin?: Date): Promise<Pointage[]> {
    const where: any = { employeId };

    if (dateDebut && dateFin) {
      where.datePointage = {
        gte: dateDebut,
        lte: dateFin
      };
    }

    return await this.prisma.pointage.findMany({
      where,
      include: {
        pointePar: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true
          }
        }
      },
      orderBy: { datePointage: 'desc' }
    });
  }

  async trouverParId(id: number): Promise<Pointage | null> {
    return await this.prisma.pointage.findUnique({
      where: { id },
      include: {
        employe: true,
        entreprise: true,
        pointePar: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true
          }
        }
      }
    });
  }

  async creer(donnees: CreerPointageData): Promise<Pointage> {
    return await this.prisma.pointage.create({
      data: {
        employeId: donnees.employeId,
        entrepriseId: donnees.entrepriseId,
        pointeParId: donnees.pointeParId,
        typePointage: donnees.typePointage,
        statut: donnees.statut || 'VALIDE',
        commentaire: donnees.commentaire || null,
        heuresTravaillees: donnees.heuresTravaillees || null,
        latitude: donnees.latitude || null,
        longitude: donnees.longitude || null
      },
      include: {
        employe: true,
        pointePar: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true
          }
        }
      }
    });
  }

  async modifier(id: number, donnees: ModifierPointageData): Promise<Pointage> {
    return await this.prisma.pointage.update({
      where: { id },
      data: donnees,
      include: {
        employe: true,
        pointePar: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true
          }
        }
      }
    });
  }

  async supprimer(id: number): Promise<void> {
    await this.prisma.pointage.delete({
      where: { id }
    });
  }

  async compterParEntreprise(entrepriseId: number, dateDebut?: Date, dateFin?: Date): Promise<number> {
    const where: any = { entrepriseId };

    if (dateDebut && dateFin) {
      where.datePointage = {
        gte: dateDebut,
        lte: dateFin
      };
    }

    return await this.prisma.pointage.count({ where });
  }

  async obtenirStatistiquesPointage(entrepriseId: number, dateDebut?: Date, dateFin?: Date): Promise<any> {
    const where: any = { entrepriseId };

    if (dateDebut && dateFin) {
      where.datePointage = {
        gte: dateDebut,
        lte: dateFin
      };
    }

    const pointages = await this.prisma.pointage.findMany({
      where,
      select: {
        typePointage: true,
        statut: true,
        employeId: true,
        datePointage: true
      }
    });

    const stats = {
      totalPointages: pointages.length,
      entrees: pointages.filter(p => p.typePointage === 'ENTREE').length,
      sorties: pointages.filter(p => p.typePointage === 'SORTIE').length,
      valides: pointages.filter(p => p.statut === 'VALIDE').length,
      retards: pointages.filter(p => p.statut === 'RETARD').length,
      annules: pointages.filter(p => p.statut === 'ANNULE').length,
      employesDistincts: new Set(pointages.map(p => p.employeId)).size
    };

    return stats;
  }

  async verifierPointageDuJour(employeId: number, date: Date): Promise<{entree?: Pointage, sortie?: Pointage}> {
    const debutJour = new Date(date);
    debutJour.setHours(0, 0, 0, 0);

    const finJour = new Date(date);
    finJour.setHours(23, 59, 59, 999);

    const pointages = await this.prisma.pointage.findMany({
      where: {
        employeId,
        datePointage: {
          gte: debutJour,
          lte: finJour
        }
      },
      orderBy: { datePointage: 'asc' }
    });

    const entree = pointages.find(p => p.typePointage === 'ENTREE');
    const sortie = pointages.find(p => p.typePointage === 'SORTIE');

    return { entree, sortie };
  }

  async compterJoursTravaillesParPeriode(employeId: number, dateDebut: Date, dateFin: Date): Promise<number> {
    // Compter les jours distincts où l'employé a fait au moins un pointage d'entrée
    const pointages = await this.prisma.pointage.findMany({
      where: {
        employeId,
        typePointage: 'ENTREE',
        datePointage: {
          gte: dateDebut,
          lte: dateFin
        }
      },
      select: {
        datePointage: true
      }
    });

    // Extraire les dates uniques (sans l'heure)
    const datesUniques = new Set(
      pointages.map(p => {
        const date = new Date(p.datePointage);
        return date.toDateString(); // Format YYYY-MM-DD
      })
    );

    return datesUniques.size;
  }

  async sommerHeuresTravailleesParPeriode(employeId: number, dateDebut: Date, dateFin: Date): Promise<number> {
    // Sommer les heures travaillées pour tous les pointages de sortie dans la période
    const result = await this.prisma.pointage.aggregate({
      where: {
        employeId,
        typePointage: 'SORTIE',
        datePointage: {
          gte: dateDebut,
          lte: dateFin
        },
        heuresTravaillees: {
          not: null
        }
      },
      _sum: {
        heuresTravaillees: true
      }
    });

    return result._sum.heuresTravaillees || 0;
  }
}