require('dotenv').config(); // Pour charger les variables d'environnement
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');
const logger = require('../utils/logger');

// Configuration de la base de données MySQL
const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: mysql2,
  host: process.env.DB_HOST || 'localhost',      // Hôte MySQL
  port: process.env.DB_PORT || 3306,            // Port MySQL par défaut
  username: process.env.DB_USER || 'root',      // Nom d'utilisateur
  password: process.env.DB_PASSWORD || '',      // Mot de passe
  database: process.env.DB_NAME || 'votre_base',// Nom de la base
  timezone: '+00:00',                          // Fuseau horaire UTC
  retry: {
      max: 10,
      match: [
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
          /TimeoutError/
      ],
      backoffBase: 1000,
      backoffExponent: 1.5,
  },
  logging: (msg) => logger?.debug(msg),
  // Options de pool (gestion des connexions)
  pool: {
    max: 10,     // Nombre max de connexions
    min: 0,      // Nombre min de connexions
    acquire: 30000, // Temps max (ms) pour acquérir une connexion
    idle: 10000  // Temps max (ms) avant libération
  },

  // Options de dialecte spécifiques à MySQL
  dialectOptions: {
    // Options SSL si nécessaire (pour les bases en production)
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    
    // Support des grands nombres (si vous utilisez BIGINT)
    supportBigNumbers: true,
    bigNumberStrings: true,
    
    // Format des dates
    dateStrings: true,
    typeCast: true
  },

  // Configuration des logs
  logging: process.env.NODE_ENV === 'development' 
    ? console.log 
    : false, // Désactive les logs en production
  

  // Définition des options globales
  define: {
    timestamps: true,       // Active created_at/updated_at
    underscored: true,      // Utilise le snake_case pour les noms de colonnes
    freezeTableName: true,  // Désactive la pluralisation automatique
    paranoid: false,        // Désactive le soft delete (peut être activé si besoin)
    charset: 'utf8mb4',     // Encodage pour supporter les emojis
    collate: 'utf8mb4_unicode_ci'
  }
});

const validateDBConfig = () => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REDIS_URL',
    'SESSION_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate port is a number
  const port = parseInt(process.env.DB_PORT);
  if (isNaN(port)) {
    throw new Error('DB_PORT must be a valid number');
  }
};

validateDBConfig();

// Test de la connexion (optionnel mais recommandé)
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à MySQL établie avec succès.');
  } catch (error) {
    console.error('Impossible de se connecter à la base MySQL:', error);
    process.exit(1); // Quitte l'application en cas d'échec
  }
}

testConnection();



module.exports = sequelize;


