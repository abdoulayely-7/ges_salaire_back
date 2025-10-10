import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import type { ConnexionDto, InscriptionDto, ModifierUtilisateurDto, TokenPayload, ReponseAuth } from '../interfaces/auth.interface.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { EntrepriseRepository } from '../repositories/entreprise.repository.js';

export class AuthService {
  private authRepository: AuthRepository;
  private entrepriseRepository: EntrepriseRepository;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-secure';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  constructor() {
    this.authRepository = new AuthRepository();
    this.entrepriseRepository = new EntrepriseRepository();
  }

  public setCookieToken(res: Response, token: string): void {
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/'
    });
  }

  public clearCookieToken(res: Response): void {
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }

  genererToken(payload: TokenPayload): string {
    return jsonwebtoken.sign(payload, this.JWT_SECRET, { 
      expiresIn: '24h' 
    });
  }

  verifierToken(token: string): TokenPayload {
    try {
      return jsonwebtoken.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  async seConnecter(email: string, motDePasse: string): Promise<ReponseAuth | null> {
    try {
      const utilisateur = await this.authRepository.trouverParEmail(email);
      
      if (!utilisateur) {
        return null;
      }

      const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
      
      if (!motDePasseValide) {
        return null;
      }

      const payload: TokenPayload = {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        entrepriseId: utilisateur.entrepriseId || undefined
      };

      const token = this.genererToken(payload);

      return {
        utilisateur: {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role,
          entrepriseId: utilisateur.entrepriseId || undefined
        },
        token
      };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  async sInscrire(donnees: InscriptionDto): Promise<ReponseAuth> {
    try {
      // Vérifier si l'email existe déjà
      const utilisateurExistant = await this.authRepository.trouverParEmail(donnees.email);

      if (utilisateurExistant) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      // Validation des rôles et entreprises
      if (donnees.role === 'SUPER_ADMIN' && donnees.entrepriseId) {
        throw new Error('Un SUPER_ADMIN ne doit pas être lié à une entreprise');
      }
      
      if ((donnees.role === 'ADMIN' || donnees.role === 'CAISSIER') && !donnees.entrepriseId) {
        throw new Error('Une entreprise est requise pour ce rôle');
      }

      // Hacher le mot de passe
      const motDePasseHache = await bcrypt.hash(donnees.motDePasse, 12);

      // Créer l'utilisateur
      const nouvelUtilisateur = await this.authRepository.creer({
        email: donnees.email,
        motDePasse: motDePasseHache,
        nom: donnees.nom,
        prenom: donnees.prenom,
        role: donnees.role || 'EMPLOYE',
        entrepriseId: donnees.entrepriseId || undefined
      });

      const payload: TokenPayload = {
        id: nouvelUtilisateur.id,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
        entrepriseId: nouvelUtilisateur.entrepriseId || undefined
      };

      const token = this.genererToken(payload);

      return {
        utilisateur: {
          id: nouvelUtilisateur.id,
          email: nouvelUtilisateur.email,
          nom: nouvelUtilisateur.nom,
          prenom: nouvelUtilisateur.prenom,
          role: nouvelUtilisateur.role,
          entrepriseId: nouvelUtilisateur.entrepriseId || undefined
        },
        token
      };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  async obtenirProfil(id: number): Promise<{ utilisateur: Omit<ReponseAuth['utilisateur'], never> } | null> {
    try {
      const utilisateur = await this.authRepository.trouverParId(id);

      if (!utilisateur) {
        return null;
      }

      return {
        utilisateur: {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role,
          entrepriseId: utilisateur.entrepriseId || undefined
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  async modifierUtilisateur(id: number, donnees: ModifierUtilisateurDto): Promise<ReponseAuth['utilisateur']> {
    try {
      const utilisateurExistant = await this.authRepository.trouverParId(id);

      if (!utilisateurExistant) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (donnees.email !== utilisateurExistant.email) {
        const emailExistant = await this.authRepository.trouverParEmail(donnees.email);
        if (emailExistant) {
          throw new Error('Un utilisateur avec cet email existe déjà');
        }
      }

      // Validation des rôles et entreprises
      if (donnees.role === 'SUPER_ADMIN' && utilisateurExistant.entrepriseId) {
        throw new Error('Un SUPER_ADMIN ne doit pas être lié à une entreprise');
      }

      if ((donnees.role === 'ADMIN' || donnees.role === 'CAISSIER') && !utilisateurExistant.entrepriseId) {
        throw new Error('Une entreprise est requise pour ce rôle');
      }

      // Préparer les données de mise à jour
      const donneesMaj: any = {
        email: donnees.email,
        nom: donnees.nom,
        prenom: donnees.prenom,
        role: donnees.role,
        estActif: donnees.estActif !== undefined ? donnees.estActif : utilisateurExistant.estActif
      };

      // Hacher le mot de passe si fourni
      if (donnees.motDePasse) {
        donneesMaj.motDePasse = await bcrypt.hash(donnees.motDePasse, 12);
      }

      // Mettre à jour l'utilisateur
      const utilisateurMaj = await this.authRepository.mettreAJour(id, donneesMaj);

      return {
        id: utilisateurMaj.id,
        email: utilisateurMaj.email,
        nom: utilisateurMaj.nom,
        prenom: utilisateurMaj.prenom,
        role: utilisateurMaj.role,
        entrepriseId: utilisateurMaj.entrepriseId || undefined
      };
    } catch (error) {
      console.error('Erreur lors de la modification de l\'utilisateur:', error);
      throw error;
    }
  }

  async supprimerUtilisateur(id: number): Promise<void> {
    try {
      const utilisateur = await this.authRepository.trouverParId(id);

      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier que ce n'est pas le dernier SUPER_ADMIN
      if (utilisateur.role === 'SUPER_ADMIN') {
        const superAdmins = await this.authRepository.compterParRole('SUPER_ADMIN');
        if (superAdmins <= 1) {
          throw new Error('Impossible de supprimer le dernier SUPER_ADMIN');
        }
      }

      await this.authRepository.supprimer(id);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();