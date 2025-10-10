// Types globaux pour le système de paie

export interface ProchainPaiement {
  id: number;
  employeNom: string;
  montantRestant: number;
  dateEcheance: Date;
}

export interface CreerEmployeData {
  codeEmploye: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  poste: string;
  typeContrat: 'CDI' | 'CDD' | 'FREELANCE' | 'STAGIAIRE';
  salaireBase?: number;
  tauxJournalier?: number;
  compteBancaire?: string;
  dateEmbauche: Date;
  entrepriseId: number;
}

export interface CreerBulletinPaieData {
  employeId: number;
  cyclePaieId: number;
  joursTravailes?: number;
  salaireBrut: number;
  deductions: number;
  salaireNet: number;
}

export interface CreerCyclePaieData {
  titre: string;
  periode: string;
  dateDebut: Date;
  dateFin: Date;
  entrepriseId: number;
}

export interface CreerPaiementData {
  bulletinPaieId: number;
  montant: number;
  methodePaiement: 'ESPECES' | 'VIREMENT_BANCAIRE' | 'ORANGE_MONEY' | 'WAVE' | 'AUTRE';
  reference?: string;
  notes?: string;
  traiteParId: number;
}