import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import entrepriseRoutes from './routes/entreprise.routes.js';
import employeRoutes from './routes/employe.routes.js';
import cyclePaieRoutes from './routes/cyclePaie.routes.js';
import bulletinPaieRoutes from './routes/bulletinPaie.routes.js';
import paiementRoutes from './routes/paiement.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import pointageRoutes from './routes/pointage.routes.js';

import { errorHandler, notFoundHandler, requestLogger, securityHeaders } from './middleware/errorHandler.js';

dotenv.config();

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité et de logging
app.use(securityHeaders);
app.use(requestLogger);
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (comme les appels d'API mobile ou Postman)
    if (!origin) return callback(null, true);
    
    // Liste des origines autorisées
    const allowedOrigins = ['http://localhost:3001', 'http://localhost:3002'];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser()); 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés (logos, etc.) avec headers CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
}, express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/entreprises', entrepriseRoutes);
app.use('/api', employeRoutes);
app.use('/api', cyclePaieRoutes);
app.use('/api', bulletinPaieRoutes);
app.use('/api', paiementRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', pointageRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'API Backend Gestion des Salaires',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      entreprises: '/api/entreprises',
      employes: '/api/employes',
      'cycles-paie': '/api/cycles-paie'
    },
    timestamp: new Date().toISOString(),
  });
});


app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Gestion des routes non trouvées (404)
app.use(notFoundHandler);

// Gestion globale des erreurs (doit être en dernier)
app.use(errorHandler);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 API URL: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 Available endpoints:`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Entreprises: http://localhost:${PORT}/api/entreprises`);
  console.log(`   - Employés: http://localhost:${PORT}/api/employes`);
  console.log(`   - Cycles de paie: http://localhost:${PORT}/api/cycles-paie`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});