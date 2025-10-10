import { z } from 'zod';

/**
 * Validators pour l'authentification
 */

// Schema pour la connexion
export const connexionSchema = z.object({
  email: z.string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères"),
  
  motDePasse: z.string()
    .min(1, "Le mot de passe est requis")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(50, "Le mot de passe ne peut pas dépasser 50 caractères")
});

// Schema pour l'inscription (sans entrepriseId dans le body - sera pris automatiquement)
export const inscriptionSchema = z.object({
  email: z.string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères"),
  
  motDePasse: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(50, "Le mot de passe ne peut pas dépasser 50 caractères")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, 
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"),
  
  nom: z.string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets"),
  
  prenom: z.string()
    .min(1, "Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets"),
  
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CAISSIER', 'VIGILE'])
});

// Schema pour la modification d'utilisateur
export const modifierUtilisateurSchema = z.object({
  email: z.string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères"),

  nom: z.string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets"),

  prenom: z.string()
    .min(1, "Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets"),

  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CAISSIER', 'VIGILE']),

  estActif: z.boolean().optional(),

  motDePasse: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(50, "Le mot de passe ne peut pas dépasser 50 caractères")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre")
    .optional()
});

// Types dérivés
export type ConnexionDto = z.infer<typeof connexionSchema>;
export type InscriptionDto = z.infer<typeof inscriptionSchema>;
export type ModifierUtilisateurDto = z.infer<typeof modifierUtilisateurSchema>;
