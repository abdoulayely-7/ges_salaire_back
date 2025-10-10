import { BaseRepository } from './base.repository.js';
import type { Paiement, MethodePaiement } from '@prisma/client';

export interface CreerPaiementData {
  montant: number;
  methodePaiement: MethodePaiement;
  reference?: string | null;
  notes?: string | null;
  numeroRecu?: string; // Optionnel car généré automatiquement
  bulletinPaieId: number;
  traiteParId: number;
}

export interface ModifierPaiementData {
  montant?: number;
  methodePaiement?: MethodePaiement;
  reference?: string;
  notes?: string;
}

export class PaiementRepository extends BaseRepository {
  async listerParBulletin(bulletinPaieId: number): Promise<Paiement[]> {
    return await this.prisma.paiement.findMany({
      where: { bulletinPaieId },
      include: {
        traitePar: true
      },
      orderBy: { creeLe: 'desc' }
    });
  }

  async trouverParId(id: number): Promise<Paiement | null> {
    return await this.prisma.paiement.findUnique({
      where: { id },
      include: {
        bulletinPaie: {
          include: {
            employe: true,
            cyclePaie: {
              include: {
                entreprise: true
              }
            }
          }
        },
        traitePar: true
      }
    });
  }

  async creer(donnees: CreerPaiementData): Promise<Paiement> {
    if (!donnees.numeroRecu) {
      throw new Error('Le numéro de reçu est requis pour créer un paiement');
    }
    
    return await this.prisma.paiement.create({
      data: {
        montant: donnees.montant,
        methodePaiement: donnees.methodePaiement,
        reference: donnees.reference || null,
        notes: donnees.notes || null,
        numeroRecu: donnees.numeroRecu,
        bulletinPaieId: donnees.bulletinPaieId,
        traiteParId: donnees.traiteParId
      }
    });
  }

  async modifier(id: number, donnees: ModifierPaiementData): Promise<Paiement> {
    return await this.prisma.paiement.update({
      where: { id },
      data: donnees
    });
  }

  async supprimer(id: number): Promise<void> {
    await this.prisma.paiement.delete({
      where: { id }
    });
  }

  async compterParBulletin(bulletinPaieId: number): Promise<number> {
    return await this.prisma.paiement.count({
      where: { bulletinPaieId }
    });
  }

  async genererNumeroRecu(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Compter les paiements du jour
    const debutJour = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const finJour = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const count = await this.prisma.paiement.count({
      where: {
        creeLe: {
          gte: debutJour,
          lt: finJour
        }
      }
    });

    const numero = String(count + 1).padStart(4, '0');
    return `REC${year}${month}${day}${numero}`;
  }

  async trouverAvecDetails(id: number): Promise<Paiement | null> {
    return await this.prisma.paiement.findUnique({
      where: { id },
      include: {
        bulletinPaie: {
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
            }
          }
        },
        traitePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });
  }

  async listerParEntrepriseEtPeriode(entrepriseId: number, periode: string): Promise<Paiement[]> {
    return await this.prisma.paiement.findMany({
      where: {
        bulletinPaie: {
          cyclePaie: {
            entrepriseId: entrepriseId,
            periode: periode
          }
        }
      },
      include: {
        bulletinPaie: {
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
            }
          }
        },
        traitePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      },
      orderBy: { creeLe: 'desc' }
    });
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
    const where: any = {};

    // Filtres de base
    if (filtres.entrepriseId) {
      where.bulletinPaie = {
        employe: {
          entrepriseId: filtres.entrepriseId
        }
      };
    }

    // Filtre par employé
    if (filtres.employeId) {
      where.bulletinPaie = {
        ...where.bulletinPaie,
        employeId: filtres.employeId
      };
    }

    // Filtre par méthode de paiement
    if (filtres.methodePaiement) {
      where.methodePaiement = filtres.methodePaiement;
    }

    // Filtre par date
    if (filtres.dateDebut || filtres.dateFin) {
      where.creeLe = {};
      if (filtres.dateDebut) {
        where.creeLe.gte = filtres.dateDebut;
      }
      if (filtres.dateFin) {
        where.creeLe.lte = filtres.dateFin;
      }
    }

    // Compter le total
    const total = await this.prisma.paiement.count({ where });
    
    // Récupérer les paiements avec pagination
    const paiements = await this.prisma.paiement.findMany({
      where,
      include: {
        bulletinPaie: {
          include: {
            employe: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                codeEmploye: true,
                entreprise: {
                  select: {
                    id: true,
                    nom: true
                  }
                }
              }
            },
            cyclePaie: {
              select: {
                id: true,
                titre: true,
                periode: true
              }
            }
          }
        },
        traitePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      },
      orderBy: { creeLe: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      paiements,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}