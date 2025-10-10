const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function creerCaissier() {
  try {
    console.log('🔄 Création d\'un utilisateur caissier de test...');

    // Rechercher une entreprise existante
    const entreprise = await prisma.entreprise.findFirst({
      where: { estActif: true }
    });

    if (!entreprise) {
      console.error('❌ Aucune entreprise trouvée. Veuillez d\'abord créer une entreprise.');
      return;
    }

    console.log(`📍 Entreprise trouvée: ${entreprise.nom} (ID: ${entreprise.id})`);

    // Vérifier si un caissier existe déjà
    const caissierExistant = await prisma.utilisateur.findFirst({
      where: {
        role: 'CAISSIER',
        entrepriseId: entreprise.id
      }
    });

    if (caissierExistant) {
      console.log('⚠️ Un caissier existe déjà pour cette entreprise:');
      console.log(`   Email: ${caissierExistant.email}`);
      console.log(`   Nom: ${caissierExistant.prenom} ${caissierExistant.nom}`);
      return;
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash('caissier123', 10);

    // Créer l'utilisateur caissier
    const caissier = await prisma.utilisateur.create({
      data: {
        email: `caissier@${entreprise.nom.toLowerCase().replace(/\s+/g, '')}.com`,
        motDePasse: motDePasseHash,
        prenom: 'Jean',
        nom: 'Caissier',
        role: 'CAISSIER',
        entrepriseId: entreprise.id,
        estActif: true
      }
    });

    console.log('✅ Utilisateur caissier créé avec succès !');
    console.log('📋 Informations de connexion:');
    console.log(`   Email: ${caissier.email}`);
    console.log(`   Mot de passe: caissier123`);
    console.log(`   Rôle: ${caissier.role}`);
    console.log(`   Entreprise: ${entreprise.nom}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création du caissier:', error);
  } finally {
    await prisma.$disconnect();
  }
}

creerCaissier();