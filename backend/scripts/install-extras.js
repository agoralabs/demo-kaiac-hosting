#!/usr/bin/env node
const { execSync } = require('child_process');
const logger = console;

const EXTRA_DEPS = [
  'mysql2',
  'sequelize-cli',
  'express-async-handler'
];

async function installExtras() {
  logger.log('Installing extra dependencies...');
  
  try {
    for (const dep of EXTRA_DEPS) {
      logger.log(`Installing ${dep}...`);
      execSync(`npm install ${dep} --save`, { stdio: 'inherit' });
    }
    logger.log('✅ Extra dependencies installed successfully');
  } catch (error) {
    logger.error('❌ Failed to install extra dependencies:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  installExtras();
}