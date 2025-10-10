export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintient la stack trace (seulement en V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Crée une erreur API standardisée
 */
export const createApiError = (message: string, statusCode: number = 500, details?: any) => {
  return {
    error: true,
    statusCode,
    message,
    details: details || null,
    timestamp: new Date().toISOString()
  };
};

/**
 * Vérifie si une erreur est opérationnelle
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};