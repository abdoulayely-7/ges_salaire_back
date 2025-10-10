import { z } from 'zod';

/**
 * Validators pour la gestion des employés
 */

// Schema pour la création d'employé
export const creerEmployeSchema = z.object({
  prenom: z.string()
    .min(1, "Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets")
    .trim(),
  
  nom: z.string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets")
    .trim(),
  
  email: z.string()
    .email("Format d'email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères")
    .optional(),
  
  telephone: z.string()
    .regex(/^\+?[0-9]{8,15}$/, "Format de téléphone invalide (8-15 chiffres, + optionnel)")
    .trim()
    .optional(),
  
  poste: z.string()
    .min(1, "Le poste est requis")
    .min(2, "Le poste doit contenir au moins 2 caractères")
    .max(100, "Le poste ne peut pas dépasser 100 caractères")
    .trim(),
  
  typeContrat: z.enum(['FIXE', 'JOURNALIER', 'HONORAIRE']),
  
  salaireBase: z.number()
    .min(0, "Le salaire de base doit être positif ou nul")
    .optional(),
  
  tauxJournalier: z.number()
    .min(0, "Le taux journalier doit être positif ou nul")
    .optional(),
  
  compteBancaire: z.string()
    .regex(/^[0-9A-Z\s-]+$/, "Format de compte bancaire invalide")
    .trim()
    .optional(),
  
  dateEmbauche: z.string()
    .min(1, "La date d'embauche est requise")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  
  estActif: z.boolean().default(true),
  
  entrepriseId: z.number()
    .int("L'ID entreprise doit être un entier")
    .positive("L'ID entreprise doit être positif")
}).refine((data) => {
  // Validation conditionnelle selon le type de contrat
  if (data.typeContrat === 'FIXE' && !data.salaireBase) {
    return false;
  }
  if ((data.typeContrat === 'JOURNALIER' || data.typeContrat === 'HONORAIRE') && !data.tauxJournalier) {
    return false;
  }
  return true;
}, {
  message: "Salaire de base requis pour FIXE, taux journalier requis pour JOURNALIER/HONORAIRE"
});

// Schema pour la modification d'employé
export const modifierEmployeSchema = creerEmployeSchema.partial().extend({
  id: z.number().int().positive()
});

// Schema pour les paramètres de requête
export const employeParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "L'ID doit être un nombre")
    .transform(Number)
    .refine(val => val > 0, "L'ID doit être positif")
});

// Types dérivés
export type CreerEmployeDto = z.infer<typeof creerEmployeSchema>;
export type ModifierEmployeDto = z.infer<typeof modifierEmployeSchema>;
export type EmployeParamsDto = z.infer<typeof employeParamsSchema>;
