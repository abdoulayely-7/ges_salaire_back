const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Supprimer l'utilisateur s'il existe déjà
    await prisma.utilisateur.deleteMany({
      where: { email: 'super@admin.com' }
    });

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

    // Créer l'utilisateur SUPER_ADMIN
    const user = await prisma.utilisateur.create({
      data: {
        email: 'super@admin.com',
        motDePasse: hashedPassword,
        prenom: 'Super',
        nom: 'Admin',
        role: 'SUPER_ADMIN',
        estActif: true,
        entrepriseId: null // SUPER_ADMIN n'est lié à aucune entreprise
      }
    });

    console.log('✅ Super Admin créé avec succès:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du Super Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();