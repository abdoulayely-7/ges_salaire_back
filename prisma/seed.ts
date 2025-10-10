import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer une entreprise de test
  const entreprise = await prisma.entreprise.create({
    data: {
      nom: 'Entreprise Test SA',
      logo: 'https://via.placeholder.com/150',
      adresse: '123 Rue de Test, Dakar',
      telephone: '+221 77 123 45 67',
      email: 'contact@testsa.com',
      devise: 'XOF',
      periodePaie: 'MENSUELLE'
    }
  });

  console.log('✅ Entreprise créée:', entreprise.nom);

  // Créer un super admin (upsert pour éviter les doublons)
  const superAdmin = await prisma.utilisateur.upsert({
    where: { email: 'superadmin@testsa.com' },
    update: {},
    create: {
      email: 'superadmin@testsa.com',
      motDePasse: bcrypt.hashSync('password123', 10),
      prenom: 'Super',
      nom: 'Admin',
      role: 'SUPER_ADMIN',
      entrepriseId: entreprise.id
    }
  });

  // Créer un admin
  const admin = await prisma.utilisateur.upsert({
    where: { email: 'admin@testsa.com' },
    update: {},
    create: {
      email: 'admin@testsa.com',
      motDePasse: bcrypt.hashSync('password123', 10),
      prenom: 'Admin',
      nom: 'Normal',
      role: 'ADMIN',
      entrepriseId: entreprise.id
    }
  });

  // Créer un caissier
  const caissier = await prisma.utilisateur.upsert({
    where: { email: 'caissier@testsa.com' },
    update: {},
    create: {
      email: 'caissier@testsa.com',
      motDePasse: bcrypt.hashSync('password123', 10),
      prenom: 'Caissier',
      nom: 'Test',
      role: 'CAISSIER',
      entrepriseId: entreprise.id
    }
  });
  
  // Créer un admin avec l'email admin@gmail.com
  const testAdmin = await prisma.utilisateur.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      motDePasse: bcrypt.hashSync('password123', 10),
      prenom: 'Admin',
      nom: 'Gmail',
      role: 'ADMIN',
      entrepriseId: entreprise.id
    }
  });

  console.log('✅ Utilisateurs créés');

  // Créer des employés (upsert pour éviter les doublons)
  const employes = await Promise.all([
    prisma.employe.upsert({
      where: { 
        entrepriseId_codeEmploye: {
          entrepriseId: entreprise.id,
          codeEmploye: 'EMP001'
        }
      },
      update: {},
      create: {
        codeEmploye: 'EMP001',
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@testsa.com',
        telephone: '+221 77 111 11 11',
        poste: 'Développeur Senior',
        typeContrat: 'FIXE',
        salaireBase: 750000,
        compteBancaire: 'SN123456789',
        dateEmbauche: new Date('2023-01-15'),
        entrepriseId: entreprise.id
      }
    }),
    prisma.employe.upsert({
      where: {
        entrepriseId_codeEmploye: {
          entrepriseId: entreprise.id,
          codeEmploye: 'EMP002'
        }
      },
      update: {},
      create: {
        codeEmploye: 'EMP002',
        prenom: 'Marie',
        nom: 'Martin',
        email: 'marie.martin@testsa.com',
        poste: 'Designer UX/UI',
        typeContrat: 'FIXE',
        salaireBase: 600000,
        dateEmbauche: new Date('2023-03-01'),
        entrepriseId: entreprise.id
      }
    }),
    prisma.employe.upsert({
      where: {
        entrepriseId_codeEmploye: {
          entrepriseId: entreprise.id,
          codeEmploye: 'EMP003'
        }
      },
      update: {},
      create: {
        codeEmploye: 'EMP003',
        prenom: 'Ahmed',
        nom: 'Diallo',
        poste: 'Comptable',
        typeContrat: 'JOURNALIER',
        tauxJournalier: 35000,
        dateEmbauche: new Date('2023-06-01'),
        entrepriseId: entreprise.id
      }
    }),
    prisma.employe.create({
      data: {
        codeEmploye: 'EMP004',
        prenom: 'Fatou',
        nom: 'Sow',
        poste: 'Assistante Administrative',
        typeContrat: 'HONORAIRE',
        salaireBase: 400000,
        dateEmbauche: new Date('2023-09-01'),
        entrepriseId: entreprise.id
      }
    })
  ]);

  console.log('✅ Employés créés:', employes.length);

  // Créer un cycle de paie
  const cycle = await prisma.cyclePaie.create({
    data: {
      titre: 'Paie Novembre 2024',
      periode: '2024-11',
      dateDebut: new Date('2024-11-01'),
      dateFin: new Date('2024-11-30'),
      entrepriseId: entreprise.id
    }
  });

  console.log('✅ Cycle de paie créé:', cycle.titre);

  // Générer les bulletins automatiquement
  const bulletins = [];
  for (const employe of employes) {
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

    const deductions = Math.round(salaireBrut * 0.1); // 10% de déductions
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

  console.log('✅ Bulletins générés:', bulletins.length);

  // Créer des paiements partiels pour certains bulletins
  const paiements = await Promise.all([
    prisma.paiement.upsert({
      where: { numeroRecu: 'REC-2024-11-001' },
      update: {},
      create: {
        montant: 675000, // Paiement complet pour Jean
        methodePaiement: 'VIREMENT_BANCAIRE',
        reference: 'VIR-2024-11-001',
        numeroRecu: 'REC-2024-11-001',
        bulletinPaieId: bulletins[0].id,
        traiteParId: caissier.id
      }
    }),
    prisma.paiement.upsert({
      where: { numeroRecu: 'REC-2024-11-002' },
      update: {},
      create: {
        montant: 300000, // Paiement partiel pour Marie
        methodePaiement: 'ORANGE_MONEY',
        reference: 'OM-2024-11-002',
        numeroRecu: 'REC-2024-11-002',
        bulletinPaieId: bulletins[1].id,
        traiteParId: caissier.id
      }
    }),
    prisma.paiement.upsert({
      where: { numeroRecu: 'REC-2024-11-003' },
      update: {},
      create: {
        montant: 200000, // Premier paiement pour Ahmed
        methodePaiement: 'ESPECES',
        numeroRecu: 'REC-2024-11-003',
        bulletinPaieId: bulletins[2].id,
        traiteParId: caissier.id
      }
    })
  ]);

  console.log('✅ Paiements créés:', paiements.length);

  // Mettre à jour les montants payés dans les bulletins
  for (const bulletin of bulletins) {
    const paiementsBulletin = paiements.filter(p => p.bulletinPaieId === bulletin.id);
    const montantPaye = paiementsBulletin.reduce((sum, p) => sum + p.montant, 0);

    await prisma.bulletinPaie.update({
      where: { id: bulletin.id },
      data: { montantPaye }
    });
  }

  // Mettre à jour les totaux du cycle
  const totalBrut = bulletins.reduce((sum, b) => sum + b.salaireBrut, 0);
  const totalNet = bulletins.reduce((sum, b) => sum + b.salaireNet, 0);
  const totalPaye = bulletins.reduce((sum, b) => sum + b.montantPaye, 0);

  await prisma.cyclePaie.update({
    where: { id: cycle.id },
    data: {
      totalBrut,
      totalNet,
      totalPaye
    }
  });

  console.log('✅ Totaux du cycle mis à jour');
  console.log('🎉 Seed terminé avec succès!');
  console.log('');
  console.log('📊 Résumé des données créées:');
  console.log(`   - 1 entreprise`);
  console.log(`   - 3 utilisateurs (1 super admin, 1 admin, 1 caissier)`);
  console.log(`   - 4 employés`);
  console.log(`   - 1 cycle de paie`);
  console.log(`   - 4 bulletins de paie`);
  console.log(`   - 3 paiements`);
  console.log('');
  console.log('🔐 Comptes de test:');
  console.log(`   Super Admin: superadmin@testsa.com / password123`);
  console.log(`   Admin: admin@testsa.com / password123`);
  console.log(`   Caissier: caissier@testsa.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });