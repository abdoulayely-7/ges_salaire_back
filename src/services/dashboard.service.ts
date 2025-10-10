import { BaseRepository } from '../repositories/base.repository.js';

interface KPIs {
  nombreEmployes: number;
  nombreEmployesActifs: number;
  masseSalarialeMensuelle: number;
  montantPaye: number;
  montantRestant: number;
}

interface EvolutionMasseSalariale {
  mois: string;
  montant: number;
}

interface ProchainPaiement {
  id: number;
  employeNom: string;
  montantRestant: number;
  dateEcheance?: Date;
}

export class DashboardService extends BaseRepository {
  async obtenirKPIs(entrepriseId: number): Promise<KPIs> {
    const nombreEmployes = await this.prisma.employe.count({
      where: { entrepriseId }
    });

    const nombreEmployesActifs = await this.prisma.employe.count({
      where: { entrepriseId, estActif: true }
    });

    // Masse salariale mensuelle (somme des salaires nets des bulletins actifs)
    const bulletinsActifs = await this.prisma.bulletinPaie.findMany({
      where: {
        cyclePaie: {
          entrepriseId,
          statut: { in: ['BROUILLON', 'APPROUVE'] }
        }
      },
      select: { salaireNet: true }
    });

    const masseSalarialeMensuelle = bulletinsActifs.reduce((sum, b) => sum + b.salaireNet, 0);

    // Montant payé total
    const montantPaye = await this.prisma.bulletinPaie.aggregate({
      where: {
        cyclePaie: { entrepriseId }
      },
      _sum: { montantPaye: true }
    });

    // Montant restant total
    const montantRestant = await this.prisma.bulletinPaie.aggregate({
      where: {
        cyclePaie: { entrepriseId }
      },
      _sum: {
        salaireNet: true,
        montantPaye: true
      }
    });

    const restant = (montantRestant._sum.salaireNet || 0) - (montantRestant._sum.montantPaye || 0);

    return {
      nombreEmployes,
      nombreEmployesActifs,
      masseSalarialeMensuelle,
      montantPaye: montantPaye._sum.montantPaye || 0,
      montantRestant: restant
    };
  }

  async obtenirEvolutionMasseSalariale(entrepriseId: number): Promise<EvolutionMasseSalariale[]> {
    // Récupérer les 6 derniers mois
    const maintenant = new Date();
    const resultats: EvolutionMasseSalariale[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const debutMois = new Date(date.getFullYear(), date.getMonth(), 1);
      const finMois = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const montant = await this.prisma.bulletinPaie.aggregate({
        where: {
          cyclePaie: { entrepriseId },
          creeLe: {
            gte: debutMois,
            lte: finMois
          }
        },
        _sum: { salaireNet: true }
      });

      resultats.push({
        mois: date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
        montant: montant._sum.salaireNet || 0
      });
    }

    return resultats;
  }

  async obtenirProchainsPaiements(entrepriseId: number, limit = 10): Promise<ProchainPaiement[]> {
    const bulletins = await this.prisma.bulletinPaie.findMany({
      where: {
        cyclePaie: { entrepriseId },
        salaireNet: {
          gt: this.prisma.bulletinPaie.fields.montantPaye
        }
      },
      include: {
        employe: {
          select: { prenom: true, nom: true }
        },
        cyclePaie: {
          select: { dateFin: true }
        }
      },
      orderBy: [
        { cyclePaie: { dateFin: 'asc' } },
        { creeLe: 'asc' }
      ],
      take: limit
    });

    return bulletins.map(b => ({
      id: b.id,
      employeNom: `${b.employe.prenom} ${b.employe.nom}`,
      montantRestant: b.salaireNet - b.montantPaye,
      dateEcheance: b.cyclePaie.dateFin
    }));
  }

  async compterCyclesEnCours(entrepriseId: number): Promise<number> {
    return await this.prisma.cyclePaie.count({
      where: {
        entrepriseId,
        statut: { in: ['BROUILLON', 'APPROUVE'] }
      }
    });
  }

  async compterBulletinsEnAttente(entrepriseId: number): Promise<number> {
    return await this.prisma.bulletinPaie.count({
      where: {
        cyclePaie: { entrepriseId },
        salaireNet: {
          gt: this.prisma.bulletinPaie.fields.montantPaye
        }
      }
    });
  }

  async verifierDonnees(entrepriseId: number): Promise<boolean> {
    const [employesCount, cyclesCount, bulletinsCount] = await Promise.all([
      this.prisma.employe.count({ where: { entrepriseId } }),
      this.prisma.cyclePaie.count({ where: { entrepriseId } }),
      this.prisma.bulletinPaie.count({
        where: { cyclePaie: { entrepriseId } }
      })
    ]);

    // Considérer qu'il y a des données s'il y a au moins des employés ET des cycles
    return employesCount > 0 && cyclesCount > 0;
  }

  async initialiserDonnees(entrepriseId: number): Promise<{ message: string }> {
    // Vérifier que l'entreprise existe
    const entreprise = await this.prisma.entreprise.findUnique({
      where: { id: entrepriseId }
    });

    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    // Créer des employés de test si aucun employé n'existe
    const employesExistants = await this.prisma.employe.count({ where: { entrepriseId } });

    if (employesExistants === 0) {
      // Créer quelques employés de test
      await this.prisma.employe.createMany({
        data: [
          {
            entrepriseId,
            codeEmploye: 'EMP001',
            prenom: 'Jean',
            nom: 'Dupont',
            poste: 'Développeur',
            typeContrat: 'FIXE',
            salaireBase: 250000,
            email: 'jean.dupont@test.com',
            telephone: '+221771234567',
            dateEmbauche: new Date('2024-01-15')
          },
          {
            entrepriseId,
            codeEmploye: 'EMP002',
            prenom: 'Marie',
            nom: 'Martin',
            poste: 'Designer',
            typeContrat: 'FIXE',
            salaireBase: 200000,
            email: 'marie.martin@test.com',
            telephone: '+221772345678',
            dateEmbauche: new Date('2024-02-01')
          },
          {
            entrepriseId,
            codeEmploye: 'EMP003',
            prenom: 'Pierre',
            nom: 'Dubois',
            poste: 'Chef de projet',
            typeContrat: 'FIXE',
            salaireBase: 300000,
            email: 'pierre.dubois@test.com',
            telephone: '+221773456789',
            dateEmbauche: new Date('2024-01-01')
          }
        ]
      });
    }

    return { message: 'Données d\'exemple initialisées avec succès' };
  }

  async obtenirStatsGlobales(): Promise<{
    totalEntreprises: number;
    totalEmployesActifs: number;
    masseSalarialeTotale: number;
    totalBulletinsGeneres: number;
    montantTotalPaye: number;
    montantTotalRestant: number;
  }> {
    // Statistiques globales pour le super admin
    const totalEntreprises = await this.prisma.entreprise.count();

    const totalEmployesActifs = await this.prisma.employe.count({
      where: { estActif: true }
    });

    // Masse salariale totale (somme des salaires nets de tous les bulletins)
    const bulletinsResult = await this.prisma.bulletinPaie.aggregate({
      _sum: {
        salaireNet: true,
        montantPaye: true
      },
      _count: true
    });

    const masseSalarialeTotale = bulletinsResult._sum.salaireNet || 0;
    const montantTotalPaye = bulletinsResult._sum.montantPaye || 0;
    const montantTotalRestant = masseSalarialeTotale - montantTotalPaye;
    const totalBulletinsGeneres = bulletinsResult._count;

    return {
      totalEntreprises,
      totalEmployesActifs,
      masseSalarialeTotale,
      totalBulletinsGeneres,
      montantTotalPaye,
      montantTotalRestant
    };
  }

  async obtenirEvolutionMasseSalarialeGlobale(): Promise<EvolutionMasseSalariale[]> {
    // Récupérer les 6 derniers mois pour toutes les entreprises
    const maintenant = new Date();
    const resultats: EvolutionMasseSalariale[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const debutMois = new Date(date.getFullYear(), date.getMonth(), 1);
      const finMois = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const montant = await this.prisma.bulletinPaie.aggregate({
        where: {
          creeLe: {
            gte: debutMois,
            lte: finMois
          }
        },
        _sum: { salaireNet: true }
      });

      resultats.push({
        mois: date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
        montant: montant._sum.salaireNet || 0
      });
    }

    return resultats;
  }

  async obtenirRepartitionEmployesParEntreprise(): Promise<{ nom: string; employesActifs: number }[]> {
    const entreprises = await this.prisma.entreprise.findMany({
      select: {
        nom: true,
        _count: {
          select: {
            employes: {
              where: { estActif: true }
            }
          }
        }
      }
    });

    return entreprises.map(entreprise => ({
      nom: entreprise.nom,
      employesActifs: entreprise._count.employes
    })).filter(item => item.employesActifs > 0);
  }

}