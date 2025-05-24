/**
 * Configuration Nodemailer avec gestion robuste des erreurs
 */
const nodemailer = require('nodemailer');

// Créer un transporteur de test si aucune configuration n'est fournie
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    };
  } catch (error) {
    console.error('Impossible de créer un compte de test Ethereal:', error);
    return null;
  }
};

// Créer et configurer le transporteur
const createTransporter = async () => {
  try {
    // Utiliser les variables d'environnement ou un compte de test
    let config;
    
    if (process.env.SMTP_HOST) {
      config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '25'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Timeouts plus courts pour éviter de bloquer l'application
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        // Désactiver la vérification TLS si nécessaire
        tls: {
          rejectUnauthorized: false
        }
      };
    } else {
      // Utiliser un compte de test si aucune configuration n'est fournie
      config = await createTestAccount();
      if (!config) {
        throw new Error('Impossible de configurer le service email');
      }
    }
    
    return nodemailer.createTransport(config);
  } catch (error) {
    console.error('Erreur lors de la création du transporteur email:', error);
    return null;
  }
};

module.exports = {
  createTransporter
};
