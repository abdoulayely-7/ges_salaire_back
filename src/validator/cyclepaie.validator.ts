import { z } from 'zod';

/**
 * Validators pour la gestion des cycles de paie
 */

// Schema pour la création de cycle de paie
export const creerCyclePaieSchema = z.object({
  titre: z.string()
    .min(1, "Le titre du cycle est requis")
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères")
    .trim(),

  periode: z.string()
    .min(7, "La période doit contenir au moins 7 caractères")
    .max(50, "La période ne peut pas dépasser 50 caractères")
    .trim()
    .optional(),

  mois: z.number()
    .int("Le mois doit être un entier")
    .min(1, "Le mois doit être entre 1 et 12")
    .max(12, "Le mois doit être entre 1 et 12")
    .optional(),

  annee: z.number()
    .int("L'année doit être un entier")
    .min(2020, "L'année doit être >= 2020")
    .max(2050, "L'année doit être <= 2050")
    .optional(),

  dateDebut: z.string()
    .min(1, "La date de début est requise")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),

  dateFin: z.string()
    .min(1, "La date de fin est requise")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),

  ouvert: z.boolean().default(true),

  entrepriseId: z.number()
    .int("L'ID entreprise doit être un entier")
    .positive("L'ID entreprise doit être positif")
}).refine((data) => {
  // Validation: date de fin doit être après date de début
  const debut = new Date(data.dateDebut);
  const fin = new Date(data.dateFin);
  return fin > debut;
}, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ['dateFin']
}).transform((data) => {
  // Si periode est fourni au format YYYY-MM, extraire mois et annee
  if (data.periode && /^\d{4}-\d{2}$/.test(data.periode)) {
    const [annee, mois] = data.periode.split('-').map(Number);
    return {
      ...data,
      mois,
      annee
    };
  }
  return data;
});

// Schema pour la modification de cycle de paie
export const modifierCyclePaieSchema = z.object({
  titre: z.string()
    .min(1, "Le titre du cycle est requis")
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères")
    .trim()
    .optional(),

  periode: z.string()
    .min(7, "La période doit contenir au moins 7 caractères")
    .max(50, "La période ne peut pas dépasser 50 caractères")
    .trim()
    .optional(),

  mois: z.number()
    .int("Le mois doit être un entier")
    .min(1, "Le mois doit être entre 1 et 12")
    .max(12, "Le mois doit être entre 1 et 12")
    .optional(),

  annee: z.number()
    .int("L'année doit être un entier")
    .min(2020, "L'année doit être >= 2020")
    .max(2050, "L'année doit être <= 2050")
    .optional(),

  dateDebut: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),

  dateFin: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional(),

  ouvert: z.boolean().optional(),

  id: z.number().int().positive()
}).refine((data) => {
  // Validation: si les deux dates sont fournies, vérifier que dateFin > dateDebut
  if (data.dateDebut && data.dateFin) {
    const debut = new Date(data.dateDebut);
    const fin = new Date(data.dateFin);
    return fin > debut;
  }
  return true;
}, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ['dateFin']
});

// Schema pour les paramètres de requête
export const cyclePaieParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "L'ID doit être un nombre")
    .transform(Number)
    .refine(val => val > 0, "L'ID doit être positif")
});

// Types dérivés
export type CreerCyclePaieDto = z.infer<typeof creerCyclePaieSchema>;
export type ModifierCyclePaieDto = z.infer<typeof modifierCyclePaieSchema>;
export type CyclePaieParamsDto = z.infer<typeof cyclePaieParamsSchema>;
