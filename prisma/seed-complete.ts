import { PrismaClient, TypeContrat } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with complete test data...');

  // ==========================================
  // ENTREPRISES
  // ==========================================

  const entreprises = await Promise.all([
    prisma.entreprise.create({
      data: {
        nom: 'Tech Solutions Sénégal',
        logo: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=TS',
        adresse: '123 Avenue Léopold Sédar Senghor, Dakar',
        telephone: '+221 33 123 45 67',
        email: 'contact@techsolutions.sn',
        devise: 'XOF',
        periodePaie: 'MENSUELLE'
      }
    }),

    prisma.entreprise.create({
      data: {
        nom: 'OpenAI Sénégal',
        logo: 'https://via.placeholder.com/150/10B981/FFFFFF?text=OpenAI',
        adresse: '456 Boulevard Martin Luther King, Dakar',
        telephone: '+221 33 234 56 78',
        email: 'contact@openai.sn',
        devise: 'XOF',
        periodePaie: 'MENSUELLE'
      }
    }),

    prisma.entreprise.create({
      data: {
        nom: 'Global Services SA',
        logo: 'https://via.placeholder.com/150/F59E0B/FFFFFF?text=GS',
        adresse: '789 Rue Félix Faure, Dakar',
        telephone: '+221 33 345 67 89',
        email: 'contact@globalservices.sn',
        devise: 'XOF',
        periodePaie: 'HEBDOMADAIRE'
      }
    }),

    prisma.entreprise.create({
      data: {
        nom: 'Digital Marketing Pro',
        logo: 'https://via.placeholder.com/150/8B5CF6/FFFFFF?text=DMP',
        adresse: '321 Avenue Cheikh Anta Diop, Dakar',
        telephone: '+221 33 456 78 90',
        email: 'contact@digitalmarketing.sn',
        devise: 'XOF',
        periodePaie: 'MENSUELLE'
      }
    }),

    prisma.entreprise.create({
      data: {
        nom: 'Construction Excellence',
        logo: 'https://via.placeholder.com/150/EF4444/FFFFFF?text=CE',
        adresse: '654 Boulevard de la République, Dakar',
        telephone: '+221 33 567 89 01',
        email: 'contact@construction.sn',
        devise: 'XOF',
        periodePaie: 'JOURNALIERE'
      }
    })
  ]);

  console.log('✅ Entreprises créées:', entreprises.length);

  // ==========================================
  // SUPER ADMIN
  // ==========================================

  const superAdmin = await prisma.utilisateur.upsert({
    where: { email: 'superadmin@gestion-paie.com' },
    update: {},
    create: {
      email: 'superadmin@gestion-paie.com',
      motDePasse: bcrypt.hashSync('SuperAdmin123!', 10),
      prenom: 'Super',
      nom: 'Administrateur',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ Super Admin créé');

  // ==========================================
  // UTILISATEURS PAR ENTREPRISE
  // ==========================================

  const utilisateurs = [];

  for (const entreprise of entreprises) {
    // Admin pour chaque entreprise
    const admin = await prisma.utilisateur.create({
      data: {
        email: `admin@${entreprise.email?.split('@')[1] || 'entreprise.com'}`,
        motDePasse: bcrypt.hashSync('Admin123!', 10),
        prenom: 'Admin',
        nom: entreprise.nom.split(' ')[0],
        role: 'ADMIN',
        entrepriseId: entreprise.id
      }
    });

    // Caissier pour chaque entreprise
    const caissier = await prisma.utilisateur.create({
      data: {
        email: `caissier@${entreprise.email?.split('@')[1] || 'entreprise.com'}`,
        motDePasse: bcrypt.hashSync('Caissier123!', 10),
        prenom: 'Caissier',
        nom: entreprise.nom.split(' ')[0],
        role: 'CAISSIER',
        entrepriseId: entreprise.id
      }
    });

    utilisateurs.push(admin, caissier);
  }

  console.log('✅ Utilisateurs créés:', utilisateurs.length);

  // ==========================================
  // EMPLOYÉS PAR ENTREPRISE
  // ==========================================

  const employesData = [];

  for (let i = 0; i < entreprises.length; i++) {
    const entreprise = entreprises[i];
    const employesEntreprise = [];

    // Employés pour Tech Solutions
    if (i === 0) {
      employesEntreprise.push(
        {
          codeEmploye: 'TS001',
          prenom: 'Mamadou',
          nom: 'Diop',
          email: 'mamadou.diop@techsolutions.sn',
          telephone: '+221 77 111 11 11',
          poste: 'Développeur Full Stack',
          typeContrat: TypeContrat.FIXE,
          salaireBase: 850000,
          dateEmbauche: new Date('2023-01-15')
        },
        {
          codeEmploye: 'TS002',
          prenom: 'Aminata',
          nom: 'Fall',
          email: 'aminata.fall@techsolutions.sn',
          poste: 'Chef de Projet',
          typeContrat: TypeContrat.FIXE,
          salaireBase: 750000,
          dateEmbauche: new Date('2023-03-01')
        },
        {
          codeEmploye: 'TS003',
          prenom: 'Ibrahima',
          nom: 'Seck',
          poste: 'Designer Graphique',
          typeContrat: TypeContrat.JOURNALIER,
          tauxJournalier: 45000,
          dateEmbauche: new Date('2023-06-01')
        }
      );
    }

    // Employés pour OpenAI Sénégal
    else if (i === 1) {
      employesEntreprise.push(
        {
          codeEmploye: 'OAI001',
          prenom: 'Fatou',
          nom: 'Ndiaye',
          email: 'fatou.ndiaye@openai.sn',
          telephone: '+221 77 222 22 22',
          poste: 'Data Scientist',
          typeContrat: TypeContrat.FIXE,
          salaireBase: 950000,
          dateEmbauche: new Date('2023-02-01')
        },
        {
          codeEmploye: 'OAI002',
          prenom: 'Cheikh',
          nom: 'Gueye',
          poste: 'Ingénieur IA',
          typeContrat: TypeContrat.HONORAIRE,
          salaireBase: 1200000,
          dateEmbauche: new Date('2023-04-15')
        }
      );
    }

    // Employés pour Global Services (suspendue - moins d'employés)
    else if (i === 2) {
      employesEntreprise.push(
        {
          codeEmploye: 'GS001',
          prenom: 'Khadija',
          nom: 'Ba',
          poste: 'Comptable',
          typeContrat: TypeContrat.FIXE,
          salaireBase: 500000,
          dateEmbauche: new Date('2023-05-01')
        }
      );
    }

    // Employés pour Digital Marketing Pro
    else if (i === 3) {
      employesEntreprise.push(
        {
          codeEmploye: 'DMP001',
          prenom: 'Ousmane',
          nom: 'Sall',
          email: 'ousmane.sall@digitalmarketing.sn',
          poste: 'Marketing Manager',
          typeContrat: TypeContrat.FIXE,
          salaireBase: 650000,
          dateEmbauche: new Date('2023-07-01')
        },
        {
          codeEmploye: 'DMP002',
          prenom: 'Adama',
          nom: 'Diouf',
          poste: 'Community Manager',
          typeContrat: TypeContrat.JOURNALIER,
          tauxJournalier: 35000,
          dateEmbauche: new Date('2023-08-15')
        }
      );
    }

    // Employés pour Construction Excellence
    else if (i === 4) {
      employesEntreprise.push(
        {
          codeEmploye: 'CE001',
          prenom: 'Moussa',
          nom: 'Sy',
          poste: 'Chef de Chantier',
          typeContrat: TypeContrat.JOURNALIER,
          tauxJournalier: 55000,
          dateEmbauche: new Date('2023-09-01')
        }
      );
    }

    // Créer les employés
    for (const empData of employesEntreprise) {
      const employe = await prisma.employe.create({
        data: {
          ...empData,
          entrepriseId: entreprise.id
        }
      });
      employesData.push(employe);
    }
  }

  console.log('✅ Employés créés:', employesData.length);

  // ==========================================
  // CYCLES DE PAIE
  // ==========================================

  const cycles = [];

  for (const entreprise of entreprises) { // Pour toutes les entreprises
    const cycle = await prisma.cyclePaie.create({
      data: {
        titre: `Paie Décembre ${new Date().getFullYear()}`,
        periode: `${new Date().getFullYear()}-12`,
        dateDebut: new Date(new Date().getFullYear(), 11, 1), // Décembre
        dateFin: new Date(new Date().getFullYear(), 11, 31),
        entrepriseId: entreprise.id
      }
    });
    cycles.push(cycle);
  }

  console.log('✅ Cycles de paie créés:', cycles.length);

  // ==========================================
  // BULLETINS DE PAIE
  // ==========================================

  const bulletins = [];

  for (const cycle of cycles) {
    const employesEntreprise = employesData.filter(e => e.entrepriseId === cycle.entrepriseId);

    for (const employe of employesEntreprise) {
      let salaireBrut = 0;
      let joursTravailes: number | null = null;

      switch (employe.typeContrat) {
        case 'FIXE':
        case 'HONORAIRE':
          salaireBrut = employe.salaireBase || 0;
          break;
        case 'JOURNALIER':
          joursTravailes = 22; // Mois complet
          salaireBrut = (employe.tauxJournalier || 0) * joursTravailes;
          break;
      }

      const deductions = Math.round(salaireBrut * 0.08); // 8% de déductions
      const salaireNet = salaireBrut - deductions;

      const numeroBulletin = `BP-${cycle.id.toString().padStart(6, '0')}-${employe.codeEmploye}`;

      const bulletin = await prisma.bulletinPaie.create({
        data: {
          numeroBulletin,
          joursTravailes,
          salaireBrut,
          deductions,
          salaireNet,
          employeId: employe.id,
          cyclePaieId: cycle.id
        }
      });

      bulletins.push(bulletin);
    }
  }

  console.log('✅ Bulletins générés:', bulletins.length);

  // ==========================================
  // RÉSUMÉ
  // ==========================================

  console.log('🎉 Seed complet terminé avec succès!');
  console.log('');
  console.log('📊 RÉSUMÉ DES DONNÉES CRÉÉES:');
  console.log(`   📁 ${entreprises.length} entreprises`);
  console.log(`   👤 1 Super Administrateur`);
  console.log(`   👥 ${utilisateurs.length} utilisateurs (admins et caissiers)`);
  console.log(`   👷 ${employesData.length} employés`);
  console.log(`   📅 ${cycles.length} cycles de paie`);
  console.log(`   📄 ${bulletins.length} bulletins de paie`);
  console.log('');

  console.log('🔐 COMPTES DE CONNEXION:');
  console.log('');
  console.log('👑 SUPER ADMINISTRATEUR:');
  console.log(`   Email: superadmin@gestion-paie.com`);
  console.log(`   Mot de passe: SuperAdmin123!`);
  console.log('');

  entreprises.forEach((entreprise, index) => {
    console.log(`🏢 ${entreprise.nom}:`);
    console.log(`   Admin: admin@${entreprise.email?.split('@')[1] || 'entreprise.com'} / Admin123!`);
    console.log(`   Caissier: caissier@${entreprise.email?.split('@')[1] || 'entreprise.com'} / Caissier123!`);
    console.log('');
  });

  console.log('💡 CONSEILS DE TEST:');
  console.log('   • Utilisez le Super Admin pour gérer toutes les entreprises');
  console.log('   • Les entreprises suspendues n\'ont pas de cycles de paie actifs');
  console.log('   • Testez la création/modification d\'utilisateurs et employés');
  console.log('   • Vérifiez les différents types de contrats (FIXE, JOURNALIER, HONORAIRE)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });