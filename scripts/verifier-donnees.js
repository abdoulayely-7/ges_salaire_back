import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifierDonnees() {
  try {
    console.log('🔍 Vérification des données dans la base...\n');

    // Compter les entreprises
    const entreprises = await prisma.entreprise.findMany({
      include: {
        _count: {
          select: {
            employes: true,
            cyclesPaie: true,
            utilisateurs: true
          }
        }
      }
    });

    console.log(`📊 Nombre d'entreprises: ${entreprises.length}`);
    
    if (entreprises.length > 0) {
      console.log('\n📋 Détails des entreprises:');
      entreprises.forEach((entreprise, index) => {
        console.log(`\n${index + 1}. ${entreprise.nom} (ID: ${entreprise.id})`);
        console.log(`   - Email: ${entreprise.email}`);
        console.log(`   - Employés: ${entreprise._count.employes}`);
        console.log(`   - Cycles de paie: ${entreprise._count.cyclesPaie}`);
        console.log(`   - Utilisateurs: ${entreprise._count.utilisateurs}`);
        console.log(`   - Créée le: ${entreprise.creeLe}`);
      });
    }

    // Compter tous les employés
    const totalEmployes = await prisma.employe.count();
    console.log(`\n👥 Nombre total d'employés: ${totalEmployes}`);

    if (totalEmployes > 0) {
      const employes = await prisma.employe.findMany({
        select: {
          id: true,
          nom: true,
          prenom: true,
          entrepriseId: true,
          creeLe: true
        }
      });
      
      console.log('\n👤 Liste des employés:');
      employes.forEach((employe, index) => {
        console.log(`${index + 1}. ${employe.prenom} ${employe.nom} (Entreprise ID: ${employe.entrepriseId}) - Créé le: ${employe.creeLe}`);
      });
    }

    // Compter tous les cycles
    const totalCycles = await prisma.cyclePaie.count();
    console.log(`\n🔄 Nombre total de cycles de paie: ${totalCycles}`);

    if (totalCycles > 0) {
      const cycles = await prisma.cyclePaie.findMany({
        select: {
          id: true,
          titre: true,
          entrepriseId: true,
          creeLe: true
        }
      });
      
      console.log('\n📅 Liste des cycles de paie:');
      cycles.forEach((cycle, index) => {
        console.log(`${index + 1}. ${cycle.titre} (Entreprise ID: ${cycle.entrepriseId}) - Créé le: ${cycle.creeLe}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifierDonnees();