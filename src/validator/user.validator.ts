import { z } from 'zod';

/**
 * Validateurs Zod pour les utilisateurs côté backend
 */

// Schéma pour créer un utilisateur
export const createUserValidator = z.object({
  nom: z.string()
    .min(1, 'Le nom est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),

  prenom: z.string()
    .min(1, 'Le prénom est obligatoire')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'),

  email: z.string()
    .min(1, 'L\'email est obligatoire')
    .email('Format d\'email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères'),

  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CAISSIER', 'VIGILE']),

  motDePasse: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),

  estActif: z.boolean().optional().default(true)
});

// Schéma pour mettre à jour un utilisateur (mot de passe optionnel)
export const updateUserValidator = z.object({
  nom: z.string()
    .min(1, 'Le nom est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets')
    .optional(),

  prenom: z.string()
    .min(1, 'Le prénom est obligatoire')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets')
    .optional(),

  email: z.string()
    .min(1, 'L\'email est obligatoire')
    .email('Format d\'email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères')
    .optional(),

  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CAISSIER', 'VIGILE']).optional(),

  motDePasse: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .optional(),

  estActif: z.boolean().optional()
});

export default {
  createUserValidator,
  updateUserValidator
};