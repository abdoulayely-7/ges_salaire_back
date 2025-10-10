export enum StatutCyclePaie {
  BROUILLON = 'BROUILLON',
  APPROUVE = 'APPROUVE',
  CLOTURE = 'CLOTURE'
}

export enum StatutBulletinPaie {
  EN_ATTENTE = 'EN_ATTENTE',
  PARTIEL = 'PARTIEL',
  PAYE = 'PAYE'
}

export enum MethodePaiement {
  ESPECES = 'ESPECES',
  VIREMENT_BANCAIRE = 'VIREMENT_BANCAIRE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  WAVE = 'WAVE',
  AUTRE = 'AUTRE'
}

export interface CreerCyclePaieDto {
  titre: string;
  periode: string; // Format: "2024-01" pour janvier 2024
  dateDebut: string; // Format ISO
  dateFin: string; // Format ISO
}

export interface JoursTravaile {
  employeId: number;
  joursTravailes: number;
}

export interface CreerPaiementDto {
  bulletinPaieId: number;
  montant: number;
  methodePaiement: MethodePaiement;
  reference?: string;
  notes?: string;
}

export interface StatistiquesKPI {
  masseSalariale: number;
  montantPaye: number;
  montantRestant: number;
  nombreEmployesActifs: number;
  prochainsPaiements: {
    employeNom: string;
    montantDu: number;
    dateLimite: Date;
  }[];
}

export interface EvolutionMasseSalariale {
  periode: string;
  montant: number;
}