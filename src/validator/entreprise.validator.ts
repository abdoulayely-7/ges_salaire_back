import { z } from 'zod';

/**
 * Validators pour la gestion des entreprises
 */

// Schema pour la création d'entreprise
export const creerEntrepriseSchema = z.object({
  nom: z.string()
    .min(1, "Le nom de l'entreprise est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  
  logo: z.string()
    .refine(
      (value) => {
        if (!value) return true; // Optional
        // Accepter les URLs complètes, les chemins relatifs ou les données base64
        return value.startsWith('http') ||
               value.startsWith('/uploads/') ||
               value.startsWith('data:image/');
      },
      "Le logo doit être une URL valide, un chemin d'upload ou une image base64"
    )
    .optional(),

  couleur: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être un code hexadécimal valide (ex: #3b82f6)")
    .default("#3b82f6"),
  
  adresse: z.string()
    .min(1, "L'adresse est requise")
    .min(10, "L'adresse doit contenir au moins 10 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .trim(),
  
  telephone: z.string()
    .min(1, "Le téléphone est requis")
    .regex(/^\+?[0-9]{8,15}$/, "Format de téléphone invalide (8-15 chiffres, + optionnel)")
    .trim(),
  
  email: z.string()
    .min(1, "L'email de l'entreprise est requis")
    .email("Format d'email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères"),
  
  devise: z.string()
    .min(1, "La devise est requise")
    .length(3, "La devise doit contenir exactement 3 caractères (ex: XOF, EUR, USD)")
    .regex(/^[A-Z]{3}$/, "La devise doit être en majuscules (ex: XOF, EUR, USD)"),
  
  periodePaie: z.enum(['MENSUELLE', 'HEBDOMADAIRE', 'JOURNALIERE'])
});

// Schema pour la modification d'entreprise
export const modifierEntrepriseSchema = creerEntrepriseSchema.partial();

// Schema pour les paramètres de requête
export const entrepriseParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "L'ID doit être un nombre")
    .transform(Number)
    .refine(val => val > 0, "L'ID doit être positif")
});

// Types dérivés
export type CreerEntrepriseDto = z.infer<typeof creerEntrepriseSchema>;
export type ModifierEntrepriseDto = z.infer<typeof modifierEntrepriseSchema>;
export type EntrepriseParamsDto = z.infer<typeof entrepriseParamsSchema>;
