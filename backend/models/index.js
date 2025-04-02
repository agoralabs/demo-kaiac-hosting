const { Sequelize, DataTypes } = require('sequelize');
const mysql2 = require('mysql2');
const logger = require('../utils/logger');
require('dotenv').config();

// Initialize database interface with name matching imports
const db = {
    Sequelize,
    sequelize: null,
    User: null,
    Order: null
};

// Database configuration
const config = {
    dialect: 'mysql',
    dialectModule: mysql2,
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    logging: (msg) => logger?.debug(msg),
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
    }
};

// Initialize Sequelize instance
db.sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    config
);

// Add database event hooks
db.sequelize.addHook('afterDisconnect', async () => {
    logger.warn('Database connection lost, attempting to reconnect...');
});

db.sequelize.beforeConnect(async () => {
    logger.info('Attempting database connection...');
});

db.sequelize.afterConnect(async () => {
    logger.info('Database connection established');
});

db.sequelize.addHook('afterInit', () => {
    logger.info('Database tables initialized');
});

// Initialize models
db.User = require('./user')(db.sequelize, DataTypes);
db.Order = require('./order')(db.sequelize, DataTypes);

// Set up associations
db.User.hasMany(db.Order);
db.Order.belongsTo(db.User);

// Define initialization function with direct access to db object through closure
db.initializeDatabase = async () => {
    try {
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