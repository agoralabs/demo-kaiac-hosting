const { Sequelize, DataTypes } = require('sequelize');
const mysql2 = require('mysql2');
const logger = require('../utils/logger');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const sequelize = require(__dirname + '/../config/database.js');

// Initialize database interface with name matching imports
const db = {};


// Add database event hooks
sequelize.addHook('afterDisconnect', async () => {
    logger.warn('Database connection lost, attempting to reconnect...');
});

sequelize.beforeConnect(async () => {
    logger.info('Attempting database connection...');
});

sequelize.afterConnect(async () => {
    logger.info('Database connection established');
});

sequelize.addHook('afterInit', () => {
    logger.info('Database tables initialized');
});

// Initialize models
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;


// Define initialization function with direct access to db object through closure
db.initializeDatabase = async () => {
    try {
        logger.info('Initializing database...');
        
        await db.sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        logger.info('Synchronizing database tables...');
        await db.sequelize.sync({ alter: true });
        logger.info('Database tables synced successfully');

        return true;
    } catch (error) {
        logger.error('Unable to initialize database:', error);
        throw error;
    }
};



// Export the db object
module.exports = db;
// db.Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);
