const express = require('express');
const cors = require('cors');
const { errorConverter, errorHandler } = require('./middleware/errorHandler');

// Créer l'application Express
const app = express();

// Middleware de base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ajouter un middleware de logging pour déboguer
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Route de test pour vérifier le fonctionnement normal
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne correctement' });
});

// Route de test pour vérifier la gestion d'erreurs
app.get('/api/test-error', (req, res, next) => {
  try {
    throw new Error('Erreur de test');
  } catch (error) {
    next(error);
  }
});

// Importer et utiliser les routes
// app.use('/api/users', require('./routes/users'));
// app.use('/api/plans', require('./routes/plans'));
// etc...

// Gestionnaire pour les routes non trouvées
app.use((req, res, next) => {
  const error = new Error('Route non trouvée');
  error.statusCode = 404;
  next(error);
});

// Convertisseur d'erreurs - doit être avant le gestionnaire d'erreurs
app.use(errorConverter);

// Gestionnaire d'erreurs global - doit être le dernier middleware
app.use(errorHandler);

// Configuration pour éviter que le processus ne se termine en cas d'erreur
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
  
  // Gestion spécifique des erreurs de connexion SMTP
  if (reason && reason.code === 'ETIMEDOUT' && 
      reason.message && reason.message.includes(':25')) {
    console.error('Erreur de connexion SMTP - Le serveur de messagerie est inaccessible');
  }
  
  // Afficher la pile d'appels pour le débogage
  if (reason && reason.stack) {
    console.error('Stack trace:', reason.stack);
  }
  
  // Ne pas terminer le processus
});

process.on('uncaughtException', (error) => {
  console.error('Exception non capturée:', error);
  
  // Afficher la pile d'appels pour le débogage
  if (error && error.stack) {
    console.error('Stack trace:', error.stack);
  }
  
  // Ne pas terminer le processus
});

module.exports = app;
