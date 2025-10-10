import { z } from 'zod';

/**
 * Validators pour la gestion des bulletins de paie
 */

// Schema pour la création de bulletin de paie
export const creerBulletinPaieSchema = z.object({
  numeroBulletin: z.string()
    .min(1, "Le numéro de bulletin est requis")
    .min(5, "Le numéro de bulletin doit contenir au moins 5 caractères")
    .max(50, "Le numéro de bulletin ne peut pas dépasser 50 caractères")
    .regex(/^[A-Z0-9-_]+$/, "Le numéro de bulletin ne peut contenir que des lettres majuscules, chiffres, tirets et underscores")
    .trim(),
  
  employeId: z.number()
    .int("L'ID employé doit être un entier")
    .positive("L'ID employé doit être positif"),
  
  cyclePaieId: z.number()
    .int("L'ID cycle de paie doit être un entier")
    .positive("L'ID cycle de paie doit être positif"),
  
  joursTravailes: z.number()
    .int("Le nombre de jours travaillés doit être un entier")
    .min(0, "Le nombre de jours travaillés ne peut pas être négatif")
    .max(31, "Le nombre de jours travaillés ne peut pas dépasser 31"),
  
  salaireBrut: z.number()
    .min(0, "Le salaire brut doit être positif ou nul"),
  
  deductions: z.number()
    .min(0, "Les déductions doivent être positives ou nulles")
    .default(0),
  
  salaireNet: z.number()
    .min(0, "Le salaire net doit être positif ou nul")
});

// Schema pour la modification de bulletin de paie
export const modifierBulletinPaieSchema = creerBulletinPaieSchema.partial().extend({
  id: z.number().int().positive()
});

// Schema pour les paramètres de requête
export const bulletinPaieParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "L'ID doit être un nombre")
    .transform(Number)
    .refine(val => val > 0, "L'ID doit être positif")
});

// Types dérivés
export type CreerBulletinPaieDto = z.infer<typeof creerBulletinPaieSchema>;
export type ModifierBulletinPaieDto = z.infer<typeof modifierBulletinPaieSchema>;
export type BulletinPaieParamsDto = z.infer<typeof bulletinPaieParamsSchema>;
