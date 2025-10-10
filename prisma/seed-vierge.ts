import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database avec données VIERGES (aucune donnée fictive)...');

  // ==========================================
  // SUPER ADMIN UNIQUEMENT
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
  // AUCUNE ENTREPRISE, AUCUN EMPLOYÉ, AUCUN CYCLE
  // ==========================================

  console.log('ℹ️  Aucune entreprise créée automatiquement');
  console.log('ℹ️  Aucune donnée fictive ajoutée');

  console.log('🎉 Seed vierge terminé avec succès!');
  console.log('');
  console.log('📊 RÉSUMÉ DES DONNÉES CRÉÉES:');
  console.log(`   👤 1 Super Administrateur uniquement`);
  console.log(`   🏢 0 entreprise`);
  console.log(`   👷 0 employé`);
  console.log(`   📅 0 cycle de paie`);
  console.log('');

  console.log('🔐 COMPTE DE CONNEXION:');
  console.log('');
  console.log('👑 SUPER ADMINISTRATEUR:');
  console.log(`   Email: superadmin@gestion-paie.com`);
  console.log(`   Mot de passe: SuperAdmin123!`);
  console.log('');

  console.log('💡 COMMENT TESTER:');
  console.log('   1. Connectez-vous en tant que Super Admin');
  console.log('   2. Créez une nouvelle entreprise via le dashboard');
  console.log('   3. Créez un Admin pour cette entreprise');
  console.log('   4. Connectez-vous avec l\'Admin créé');
  console.log('   5. Vérifiez que les tableaux sont vides');
  console.log('   6. Ajoutez manuellement des employés et cycles de paie');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });