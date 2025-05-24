// config/config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'votre_base',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectModule: require('mysql2') // Important pour MySQL
  },
  migrationStorageTableName: 'db_migrations', // Nom personnalisé
  // Ajoutez aussi les autres environnements si nécessaire
  test: {
    // configuration test...
  },
  production: {
    // configuration production...
  }
};