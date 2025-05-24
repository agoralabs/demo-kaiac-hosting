const app = require('./app');
const http = require('http');

// Normalisation du port
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

// Configuration du port
const port = normalizePort(process.env.PORT || '3001');
app.set('port', port);

// Création du serveur HTTP
const server = http.createServer(app);

// Gestion des erreurs du serveur
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    console.error('Server error:', error);
    // Ne pas quitter le processus
    return;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // Messages d'erreur spécifiques pour certains codes
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} nécessite des privilèges élevés`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} est déjà utilisé`);
      process.exit(1);
      break;
    default:
      console.error('Server error:', error);
      // Ne pas quitter le processus
  }
});

// Gestion spécifique des erreurs de connexion réseau
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
  
  // Vérifier si c'est une erreur de connexion SMTP
  if (reason && reason.code === 'ETIMEDOUT' && 
      reason.message && reason.message.includes(':25')) {
    console.error('Erreur de connexion SMTP - Le serveur de messagerie est inaccessible');
    // Ne pas quitter le processus
  }
});

process.on('uncaughtException', (error) => {
  console.error('Exception non capturée:', error);
  // Ne pas quitter le processus
});

// Démarrage du serveur
server.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
