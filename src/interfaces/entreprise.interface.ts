import type { PeriodePaie as PrismaPeriodePaie } from '@prisma/client';

export type PeriodePaie = PrismaPeriodePaie;

export interface CreerEntrepriseDto {
  nom: string;
  logo?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  devise?: string;
  periodePaie?: PeriodePaie;
}

export interface ModifierEntrepriseDto {
  nom?: string;
  logo?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  devise?: string;
  periodePaie?: PeriodePaie;
  estActif?: boolean;
}

export interface EntrepriseAvecStats {
  id: number;
  nom: string;
  logo?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  devise: string;
  periodePaie: PeriodePaie;
  estActif: boolean;
  creeLe: Date;
  misAJourLe: Date;

  // Statistiques
  nombreEmployes: number;
  nombreEmployesActifs: number;
  masseSalarialeMensuelle: number;
}