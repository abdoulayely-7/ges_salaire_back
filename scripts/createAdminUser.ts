import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Trouver l'entreprise existante
    const entreprise = await prisma.entreprise.findFirst();
    
    if (!entreprise) {
      console.error('Aucune entreprise trouvée dans la base de données');
      return;
    }
    
    // Créer l'utilisateur admin@gmail.com
    const admin = await prisma.utilisateur.upsert({
      where: { email: 'admin@gmail.com' },
      update: {
        motDePasse: bcrypt.hashSync('password123', 10),
        role: 'ADMIN',
        entrepriseId: entreprise.id
      },
      create: {
        email: 'admin@gmail.com',
        motDePasse: bcrypt.hashSync('password123', 10),
        prenom: 'Admin',
        nom: 'Gmail',
        role: 'ADMIN',
        entrepriseId: entreprise.id
      }
    });
    
    console.log('✅ Utilisateur admin@gmail.com créé avec succès:', admin);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();