#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

// Get absolute path to .env file and load it first
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment from:', envPath);

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found at', envPath);
  process.exit(1);
}

// Load environment variables before any other requires
require('dotenv').config({ path: envPath });

// Verify environment variables are loaded
if (!process.env.DB_HOST || !process.env.DB_PORT) {
  console.error('❌ Error: Required environment variables not loaded:');
  console.error('DB_HOST:', process.env.DB_HOST);
  console.error('DB_PORT:', process.env.DB_PORT);
  console.error('Current working directory:', process.cwd());
  process.exit(1);
}

const net = require('net');
const logger = require('../utils/logger');

// Debug log environment variables (excluding sensitive data)
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('REDIS_URL:', process.env.REDIS_URL);
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);

function waitForService(host, port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function tryConnect() {
      const socket = new net.Socket();

      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });

      socket.on('error', (error) => {
        socket.destroy();

        if (Date.now() - start >= timeout) {
          reject(new Error(`Timeout waiting for ${host}:${port}`));
          return;
        }

        setTimeout(tryConnect, 1000);
      });

      socket.connect(port, host);
    }

    tryConnect();
  });
}

async function main() {
  // Validate environment variables
  if (!process.env.DB_HOST || !process.env.DB_PORT) {
    console.error('❌ Error: DB_HOST or DB_PORT environment variables are not set');
    console.error('Please ensure your .env file exists and contains DB_HOST and DB_PORT values');
    process.exit(1);
  }

  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    console.error('❌ Error: REDIS_HOST or REDIS_PORT environment variables are not set');
    console.error('Please ensure your .env file exists and contains REDIS_HOST and REDIS_PORT values');
    process.exit(1);
  }

  const services = [
    { name: 'MySQL', host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT, 10) },
    { name: 'Redis', host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) }
  ];

  for (const service of services) {
    console.log(`Waiting for ${service.name} at ${service.host}:${service.port}...`);
    try {
      await waitForService(service.host, service.port);
      console.log(`✅ ${service.name} is available`);
    } catch (error) {
      console.error(`❌ ${service.name} is not available:`, error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Failed to check services:', error);
    process.exit(1);
  });
}

module.exports = { waitForService };