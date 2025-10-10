import type { RoleUtilisateur as PrismaRoleUtilisateur } from '@prisma/client';

export type RoleUtilisateur = PrismaRoleUtilisateur;

export interface ConnexionDto {
  email: string;
  motDePasse: string;
}

export interface InscriptionDto {
  email: string;
  motDePasse: string;
  prenom: string;
  nom: string;
  role: RoleUtilisateur;
  entrepriseId?: number; // Géré automatiquement selon le rôle de l'utilisateur connecté
}

export interface ModifierUtilisateurDto {
  email: string;
  prenom: string;
  nom: string;
  role: RoleUtilisateur;
  estActif?: boolean;
  motDePasse?: string;
}

export interface TokenPayload {
  id: number;
  email: string;
  role: RoleUtilisateur;
  entrepriseId?: number;
}

export interface ReponseAuth {
  utilisateur: {
    id: number;
    email: string;
    prenom: string;
    nom: string;
    role: RoleUtilisateur;
    entrepriseId?: number;
  };
  token: string;
}