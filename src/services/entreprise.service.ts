import { EntrepriseRepository } from '../repositories/entreprise.repository.js';
import type { CreerEntrepriseDto, ModifierEntrepriseDto, EntrepriseAvecStats } from '../interfaces/entreprise.interface.js';
import * as bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export class EntrepriseService {
  private entrepriseRepository: EntrepriseRepository;

  constructor() {
    this.entrepriseRepository = new EntrepriseRepository();
  }

  private async saveDataUriLogo(dataUri: string): Promise<string> {
    const match = dataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Format de logo base64 invalide');
    }
    const mime = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp'
    };
    const ext = extMap[mime] || '.bin';

    const uploadDir = path.resolve(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    return `/uploads/${filename}`;
  }

  private async normalizeLogo(logo?: string): Promise<string | undefined> {
    if (!logo) return undefined;
    if (logo.startsWith('data:image/')) {
      return await this.saveDataUriLogo(logo);
    }
    if (logo.startsWith('http') || logo.startsWith('/uploads/')) {
      return logo;
    }
    throw new Error('Format de logo non supporté');
  }

  async listerTout(): Promise<EntrepriseAvecStats[]> {
    const entreprises = await this.entrepriseRepository.listerTout();
    
    const entreprisesAvecStats = await Promise.all(
      entreprises.map(async (entreprise) => {
        const stats = await this.entrepriseRepository.obtenirStatistiques(entreprise.id);
        return {
          ...entreprise,
          estActif: entreprise.estActif,
          ...stats
        };
      })
    );

    return entreprisesAvecStats;
  }

  async obtenirParId(id: number): Promise<EntrepriseAvecStats | null> {
    const entreprise = await this.entrepriseRepository.trouverParId(id);
    if (!entreprise) {
      return null;
    }

    const stats = await this.entrepriseRepository.obtenirStatistiques(id);
    return {
      ...entreprise,
      estActif: entreprise.estActif,
      ...stats
    };
  }

  async creer(donnees: CreerEntrepriseDto): Promise<EntrepriseAvecStats> {
    // Vérifier l'unicité du nom
    const existeDejaAvecCeNom = await this.entrepriseRepository.verifierExistence(donnees.nom);
    if (existeDejaAvecCeNom) {
      throw new Error('Une entreprise avec ce nom existe déjà');
    }

    const dataToCreate = { ...donnees, logo: await this.normalizeLogo(donnees.logo) };
    const entreprise = await this.entrepriseRepository.creer(dataToCreate);
    const stats = await this.entrepriseRepository.obtenirStatistiques(entreprise.id);

    return {
      ...entreprise,
      estActif: entreprise.estActif,
      ...stats
    };
  }

  async modifier(id: number, donnees: ModifierEntrepriseDto): Promise<EntrepriseAvecStats> {
    // Vérifier que l'entreprise existe
    const entrepriseExistante = await this.entrepriseRepository.trouverParId(id);
    if (!entrepriseExistante) {
      throw new Error('Entreprise non trouvée');
    }

    // Vérifier l'unicité du nom si modifié
    if (donnees.nom) {
      const existeDejaAvecCeNom = await this.entrepriseRepository.verifierExistence(donnees.nom, id);
      if (existeDejaAvecCeNom) {
        throw new Error('Une entreprise avec ce nom existe déjà');
      }
    }

    const dataToUpdate = { ...donnees, logo: await this.normalizeLogo(donnees.logo) };
    const entrepriseModifiee = await this.entrepriseRepository.modifier(id, dataToUpdate);
    const stats = await this.entrepriseRepository.obtenirStatistiques(id);

    return {
      ...entrepriseModifiee,
      estActif: entrepriseModifiee.estActif,
      ...stats
    };
  }

  async supprimer(id: number): Promise<void> {
    // Vérifier que l'entreprise existe
    const entreprise = await this.entrepriseRepository.trouverParId(id);
    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    // Vérifier qu'il n'y a pas d'employés actifs
    const stats = await this.entrepriseRepository.obtenirStatistiques(id);
    if (stats.nombreEmployesActifs > 0) {
      throw new Error('Impossible de supprimer une entreprise avec des employés actifs');
    }

    await this.entrepriseRepository.supprimer(id);
  }

  async obtenirStatistiques(id: number) {
    const entreprise = await this.entrepriseRepository.trouverParId(id);
    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    return await this.entrepriseRepository.obtenirStatistiques(id);
  }

  async listerUtilisateurs(id: number) {
    // Vérifier que l'entreprise existe
    const entreprise = await this.entrepriseRepository.trouverParId(id);
    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    return await this.entrepriseRepository.listerUtilisateurs(id);
  }

  async toggleStatut(id: number): Promise<EntrepriseAvecStats> {
    // Vérifier que l'entreprise existe
    const entrepriseExistante = await this.entrepriseRepository.trouverParId(id);
    if (!entrepriseExistante) {
      throw new Error('Entreprise non trouvée');
    }

    const nouveauStatut = !entrepriseExistante.estActif;
    const entrepriseModifiee = await this.entrepriseRepository.modifier(id, { estActif: nouveauStatut });
    const stats = await this.entrepriseRepository.obtenirStatistiques(id);

    return {
      ...entrepriseModifiee,
      estActif: entrepriseModifiee.estActif,
      ...stats
    };
  }

  async creerUtilisateur(entrepriseId: number, donneesUtilisateur: any) {
    // Vérifier que l'entreprise existe
    const entrepriseExistante = await this.entrepriseRepository.trouverParId(entrepriseId);
    if (!entrepriseExistante) {
      throw new Error('Entreprise non trouvée');
    }

    // Vérifier l'unicité de l'email
    const utilisateurExistant = await this.entrepriseRepository.trouverUtilisateurParEmail(donneesUtilisateur.email);
    if (utilisateurExistant) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hacher le mot de passe
    const motDePasseHache = await bcrypt.hash(donneesUtilisateur.motDePasse, 10);

    const donneesFinales = {
      ...donneesUtilisateur,
      motDePasse: motDePasseHache,
      entrepriseId
    };

    return await this.entrepriseRepository.creerUtilisateur(donneesFinales);
  }

  async modifierUtilisateur(entrepriseId: number, utilisateurId: number, donneesUtilisateur: any) {
    // Vérifier que l'entreprise existe
    const entrepriseExistante = await this.entrepriseRepository.trouverParId(entrepriseId);
    if (!entrepriseExistante) {
      throw new Error('Entreprise non trouvée');
    }

    // Vérifier que l'utilisateur existe et appartient à cette entreprise
    const utilisateurExistant = await this.entrepriseRepository.trouverUtilisateurParId(utilisateurId);
    if (!utilisateurExistant || utilisateurExistant.entrepriseId !== entrepriseId) {
      throw new Error('Utilisateur non trouvé dans cette entreprise');
    }

    // Si un email est fourni, vérifier son unicité
    if (donneesUtilisateur.email && donneesUtilisateur.email !== utilisateurExistant.email) {
      const utilisateurAvecMemeEmail = await this.entrepriseRepository.trouverUtilisateurParEmail(donneesUtilisateur.email);
      if (utilisateurAvecMemeEmail && utilisateurAvecMemeEmail.id !== utilisateurId) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }
    }

    // Hacher le mot de passe si fourni
    let donneesFinales = { ...donneesUtilisateur };
    if (donneesUtilisateur.motDePasse) {
      donneesFinales.motDePasse = await bcrypt.hash(donneesUtilisateur.motDePasse, 10);
    }

    return await this.entrepriseRepository.modifierUtilisateur(utilisateurId, donneesFinales);
  }

  async mettreAJourLogo(entrepriseId: number, logoUrl: string): Promise<EntrepriseAvecStats> {
    console.log(`🖼️ Mise à jour du logo pour l'entreprise ${entrepriseId} avec URL: ${logoUrl}`);
    
    // Vérifier que l'entreprise existe
    const entrepriseExistante = await this.entrepriseRepository.trouverParId(entrepriseId);
    if (!entrepriseExistante) {
      throw new Error('Entreprise non trouvée');
    }

    // Mettre à jour le logo
    const entrepriseModifiee = await this.entrepriseRepository.modifier(entrepriseId, { logo: logoUrl });
    console.log(`✅ Logo mis à jour en base:`, entrepriseModifiee.logo);
    
    const stats = await this.entrepriseRepository.obtenirStatistiques(entrepriseId);

    return {
      ...entrepriseModifiee,
      estActif: entrepriseModifiee.estActif,
      ...stats
    };
  }
}