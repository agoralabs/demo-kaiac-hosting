#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

// Get absolute path to .env file and load it immediately
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment from:', envPath);

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found at', envPath);
  process.exit(1);
}

require('dotenv').config({ path: envPath });
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found at', envPath);
  console.error('Please ensure the .env file exists in the backend directory');
  process.exit(1);
}

try {
  fs.accessSync(envPath, fs.constants.R_OK);
} catch (err) {
  console.error('❌ Error: Cannot read .env file at', envPath);
  console.error('Please check file permissions');
  process.exit(1);
}

function checkDependency(name) {
    try {
        require(name);
        console.log(`✅ ${name} is properly installed`);
        return true;
    } catch (error) {
        console.error(`❌ ${name} is not properly installed:`, error.message);
        return false;
    }
}

const criticalDeps = [
    'express',
    'mysql2',
    'sequelize',
    'stripe',
    'dotenv',
    'bcryptjs',
    'cors',
    'helmet',
    'compression',
    'body-parser',
    'ioredis',
    'connect-redis',
    'express-session',
    'express-validator',
    'winston',
    'morgan',
    'express-rate-limit',
    'jsonwebtoken'
];

console.log('Checking critical dependencies...');
let allPassed = true;

for (const dep of criticalDeps) {
    if (!checkDependency(dep)) {
        allPassed = false;
    }
}

if (!allPassed) {
    console.error('\n❌ Some dependencies are missing or not properly installed');
    console.log('Try running: npm install');
    process.exit(1);
} else {
    console.log('\n✅ All critical dependencies are properly installed');
}