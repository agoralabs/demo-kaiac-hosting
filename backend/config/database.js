const logger = require('../utils/logger');

const validateDBConfig = () => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT',
    'STRIPE_KEY',
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

module.exports = validateDBConfig;