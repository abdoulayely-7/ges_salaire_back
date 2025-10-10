import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function creerEntrepriseTest() {
  try {
    console.log('🌱 Création d\'une nouvelle entreprise de test...\n');

    // Créer une nouvelle entreprise
    const entreprise = await prisma.entreprise.create({
      data: {
        nom: 'Ma Nouvelle Entreprise',
        logo: 'https://via.placeholder.com/150',
        adresse: '123 Rue Nouvelle, Dakar',
        telephone: '+221 77 999 88 77',
        email: 'contact@nouvelle-entreprise.com',
        devise: 'XOF',
        periodePaie: 'MENSUELLE'
      }
    });

    console.log('✅ Entreprise créée:', entreprise.nom, '(ID:', entreprise.id, ')');

    // Créer un admin pour cette entreprise
    const admin = await prisma.utilisateur.create({
      data: {
        email: 'admin@nouvelle-entreprise.com',
        motDePasse: bcrypt.hashSync('password123', 10),
        prenom: 'Admin',
        nom: 'Nouveau',
        role: 'ADMIN',
        entrepriseId: entreprise.id
      }
    });

    console.log('✅ Admin créé:', admin.email);
    console.log('\n🔑 Informations de connexion:');
    console.log('   Email: admin@nouvelle-entreprise.com');
    console.log('   Mot de passe: password123');
    console.log('\n📊 Cette entreprise a maintenant:');
    console.log('   - 0 employé');
    console.log('   - 0 cycle de paie');
    console.log('   - 1 utilisateur (admin)');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

creerEntrepriseTest();