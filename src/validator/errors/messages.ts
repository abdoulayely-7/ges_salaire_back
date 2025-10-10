/**
 * Messages d'erreur standardisés pour l'API
 */

export const ERROR_MESSAGES = {
  // Erreurs générales
  INTERNAL_ERROR: "Une erreur interne s'est produite",
  NOT_FOUND: "Ressource non trouvée",
  UNAUTHORIZED: "Accès non autorisé",
  FORBIDDEN: "Accès interdit",
  BAD_REQUEST: "Requête invalide",
  VALIDATION_ERROR: "Erreur de validation",
  
  // Erreurs d'authentification
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  TOKEN_EXPIRED: "Token expiré",
  TOKEN_INVALID: "Token invalide",
  ACCESS_DENIED: "Accès refusé",
  
  // Erreurs d'entreprise
  ENTREPRISE_NOT_FOUND: "Entreprise non trouvée",
  ENTREPRISE_EXISTS: "Une entreprise avec ce nom existe déjà",
  
  // Erreurs d'employé
  EMPLOYE_NOT_FOUND: "Employé non trouvé",
  EMPLOYE_CODE_EXISTS: "Un employé avec ce code existe déjà",
  
  // Erreurs de cycle de paie
  CYCLE_NOT_FOUND: "Cycle de paie non trouvé",
  CYCLE_CLOSED: "Ce cycle de paie est fermé",
  CYCLE_EXISTS: "Un cycle pour cette période existe déjà",
  
  // Erreurs de bulletin de paie
  BULLETIN_NOT_FOUND: "Bulletin de paie non trouvé",
  BULLETIN_EXISTS: "Un bulletin avec ce numéro existe déjà",
  
  // Erreurs de paiement
  PAIEMENT_NOT_FOUND: "Paiement non trouvé",
  PAIEMENT_ALREADY_PAID: "Ce bulletin a déjà été payé",
  MONTANT_INSUFFISANT: "Montant insuffisant"
} as const;

export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];