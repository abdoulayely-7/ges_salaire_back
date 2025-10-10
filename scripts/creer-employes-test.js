import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function creerEmployesTest() {
  try {
    console.log('Création d\'employés de test...');

    // Récupérer la première entreprise
    const entreprise = await prisma.entreprise.findFirst();
    if (!entreprise) {
      console.log('Aucune entreprise trouvée. Veuillez créer une entreprise d\'abord.');
      return;
    }

    console.log(`Création d'employés pour l'entreprise: ${entreprise.nom}`);

    // Employés de test
    const employesData = [
      {
        prenom: 'Ahmed',
        nom: 'Diallo',
        poste: 'Développeur',
        typeContrat: 'FIXE',
        salaireBase: 500000,
        email: 'ahmed.diallo@test.com',
        telephone: '+221771234567'
      },
      {
        prenom: 'Fatou',
        nom: 'Sow',
        poste: 'Comptable',
        typeContrat: 'FIXE',
        salaireBase: 400000,
        email: 'fatou.sow@test.com',
        telephone: '+221772345678'
      },
      {
        prenom: 'Mamadou',
        nom: 'Ba',
        poste: 'Commercial',
        typeContrat: 'HONORAIRE',
        salaireBase: 300000,
        email: 'mamadou.ba@test.com',
        telephone: '+221773456789'
      },
      {
        prenom: 'Amina',
        nom: 'Ndiaye',
        poste: 'Assistante',
        typeContrat: 'JOURNALIER',
        tauxJournalier: 25000,
        email: 'amina.ndiaye@test.com',
        telephone: '+221774567890'
      },
      {
        prenom: 'Ibrahima',
        nom: 'Gueye',
        poste: 'Technicien',
        typeContrat: 'FIXE',
        salaireBase: 350000,
        email: 'ibrahima.gueye@test.com',
        telephone: '+221775678901'
      }
    ];

    for (const employeData of employesData) {
      // Générer le code employé
      const count = await prisma.employe.count({
        where: { entrepriseId: entreprise.id }
      });
      const numeroSequentiel = (count + 1).toString().padStart(4, '0');
      const codeEmploye = `EMP-${entreprise.id}-${numeroSequentiel}`;

      const nouvelEmploye = await prisma.employe.create({
        data: {
          ...employeData,
          codeEmploye,
          entrepriseId: entreprise.id,
          dateEmbauche: new Date()
        }
      });

      console.log(`✅ Employé créé: ${nouvelEmploye.prenom} ${nouvelEmploye.nom} (${nouvelEmploye.codeEmploye})`);
    }

    console.log('\n🎉 Tous les employés de test ont été créés avec succès!');
    console.log(`📊 Total d'employés dans l'entreprise ${entreprise.nom}: ${employesData.length}`);

  } catch (error) {
    console.error('Erreur lors de la création des employés:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
creerEmployesTest();