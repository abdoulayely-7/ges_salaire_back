import { Request, Response, NextFunction } from 'express';
import { AppError, createApiError, isOperationalError } from '../validator/errors/index.js';

/**
 * Middleware de gestion d'erreurs global
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log de l'erreur avec plus de contexte
  console.error('🚨 Erreur détectée:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
  });

  // Si c'est une erreur opérationnelle (AppError), l'utiliser directement
  if (error instanceof AppError) {
    const apiError = createApiError(error.message, error.statusCode, { path: req.path });
    res.status(error.statusCode).json(apiError);
    return;
  }

  // Gestion des erreurs spécifiques de Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    const appError = handlePrismaError(prismaError);
    const apiError = createApiError(appError.message, appError.statusCode, { path: req.path });
    res.status(appError.statusCode).json(apiError);
    return;
  }

  // Gestion des erreurs de validation JWT
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const appError = new AppError('Token invalide', 401);
    const apiError = createApiError(appError.message, appError.statusCode, { path: req.path });
    res.status(401).json(apiError);
    return;
  }

  // Gestion des erreurs de syntaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    const appError = new AppError('Format JSON invalide dans le corps de la requête', 400);
    const apiError = createApiError(appError.message, appError.statusCode, { path: req.path });
    res.status(400).json(apiError);
    return;
  }

  // Pour toutes les autres erreurs non opérationnelles
  const appError = new AppError(
    process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : error.message,
    500,
    false
  );

  const apiError = createApiError(appError.message, appError.statusCode, { path: req.path });
  res.status(500).json(apiError);
}

/**
 * Gestionnaire spécifique pour les erreurs Prisma
 */
function handlePrismaError(error: any): AppError {
  const code = error.code;
  
  switch (code) {
    case 'P2002':
      // Violation de contrainte unique
      const fields = error.meta?.target || ['champ'];
      return new AppError(`Une entrée avec ${fields.join(', ')} existe déjà`, 409);
      
    case 'P2014':
      // Violation de relation
      return new AppError('Violation de clé étrangère', 400);
      
    case 'P2003':
      // Violation de clé étrangère
      return new AppError('Référence invalide - la ressource liée n\'existe pas', 400);
      
    case 'P2025':
      // Enregistrement non trouvé
      return new AppError('Enregistrement non trouvé', 404);
      
    case 'P2015':
    case 'P2016':
      // Erreur de requête
      return new AppError('Erreur dans la requête de base de données', 400);
      
    default:
      return new AppError('Erreur de base de données', 500);
  }
}

/**
 * Middleware pour gérer les routes non trouvées
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const appError = new AppError(`Route ${req.originalUrl} non trouvée`, 404);
  const apiError = createApiError(appError.message, appError.statusCode, { path: req.path });
  res.status(404).json(apiError);
};

/**
 * Middleware pour les erreurs d'authentification
 */
export const authErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    const appError = new AppError('Token d\'authentification manquant', 401);
    const apiError = createApiError(appError.message, appError.statusCode, { path: req.path });
    res.status(401).json(apiError);
    return;
  }
  next();
};

/**
 * Middleware de logging des requêtes
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  console.log(`📡 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Middleware pour les en-têtes de sécurité
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Désactiver les informations sur le serveur
  res.removeHeader('X-Powered-By');

  // Headers de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer');

  next();
};
