// Early error handlers
process.on('uncaughtException', (error) => {
  console.error('CRITICAL: Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('CRITICAL: Unhandled Rejection:', error);
  process.exit(1);
});

const path = require('path');
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath });
const logger = require('./utils/logger');

// Validate environment variables early
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Import dependencies
const express = require('express');
const cors = require('cors');
const db = require('./models');

// Constants
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds
const PORT = process.env.PORT || 3001;

// Database configuration validation
function validateDBConfig() {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };
  
  const missing = Object.entries(dbConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing database configuration: ${missing.join(', ')}`);
  }
}


// Initialize Express app
const app = express();

// Stripe webhook en premier et avec raw
const stripeWebhook = require('./routes/stripe-webhook');
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhook);


// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/user', require('./routes/user'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/website', require('./routes/website'));
app.use('/api/invoice', require('./routes/invoice'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/domains', require('./routes/domains'));

async function connectWithRetry(attempt = 1) {
  try {
    await db.sequelize.authenticate();
    return true;
  } catch (error) {
    if (attempt === MAX_RETRIES) {
      throw error;
    }
    logger.warn(`Database connection attempt ${attempt} failed. Retrying in ${RETRY_DELAY}ms...`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return connectWithRetry(attempt + 1);
  }
}

async function startServer() {
  try {
    validateDBConfig();
    logger.info('Configuration validated');

    logger.info('Attempting database connection...');
    await connectWithRetry();
    await db.sequelize.authenticate();
    logger.info('Database connection established.');
    
    await db.sequelize.sync({ alter: true });
    logger.info('Database models synchronized.');

    logger.info('Starting server...');
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
    });
  } catch (error) {
    logger.error('Server startup error:', error);
    logger.error('Database connection details:');
    logger.error(`- Host: ${process.env.DB_HOST}`);
    logger.error(`- Database: ${process.env.DB_NAME}`);
    logger.error(`- User: ${process.env.DB_USER}`);
    logger.error(`- Port: ${process.env.DB_PORT}`);
    process.exit(1);
  }
}

startServer();