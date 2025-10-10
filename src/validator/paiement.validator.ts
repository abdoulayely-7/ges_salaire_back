import { z } from 'zod';

/**
 * Validators pour la gestion des paiements
 */

// Schema pour l'enregistrement d'un paiement
export const enregistrerPaiementSchema = z.object({
  bulletinPaieId: z.number()
    .int("L'ID bulletin de paie doit être un entier")
    .positive("L'ID bulletin de paie doit être positif"),
  
  montant: z.number()
    .min(0.01, "Le montant doit être supérieur à 0")
    .max(999999.99, "Le montant ne peut pas dépasser 999999.99"),
  
  datePaiement: z.string()
    .min(1, "La date de paiement est requise")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  
  methodePaiement: z.enum(['ESPECES', 'VIREMENT_BANCAIRE', 'ORANGE_MONEY', 'WAVE', 'AUTRE']),
  
  reference: z.string()
    .max(100, "La référence ne peut pas dépasser 100 caractères")
    .trim()
    .optional(),
  
  notes: z.string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .trim()
    .optional()
});

// Schema pour la modification d'un paiement
export const modifierPaiementSchema = enregistrerPaiementSchema.partial().extend({
  id: z.number().int().positive()
});

// Schema pour les paramètres de requête
export const paiementParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "L'ID doit être un nombre")
    .transform(Number)
    .refine(val => val > 0, "L'ID doit être positif")
});

// Types dérivés
export type EnregistrerPaiementDto = z.infer<typeof enregistrerPaiementSchema>;
export type ModifierPaiementDto = z.infer<typeof modifierPaiementSchema>;
export type PaiementParamsDto = z.infer<typeof paiementParamsSchema>;
