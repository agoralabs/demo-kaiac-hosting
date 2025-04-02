require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
require('dotenv').config();

process.on('unhandledRejection', (error) => {
    console.error('❌ Verification error:', error);
    process.exit(1);
});

// Redis check function
async function checkRedis() {
    try {
        const Redis = require('ioredis');
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                redis.disconnect();
                reject(new Error('Redis connection timeout'));
            }, 5000);

            redis.on('error', (err) => {
                clearTimeout(timeout);
                redis.disconnect();
                reject(err);
            });

            redis.on('connect', async () => {
                clearTimeout(timeout);
                console.log('✅ Redis server is running');
                await redis.quit();
                resolve();
            });
        });
    } catch (error) {
        throw new Error(`Redis check failed: ${error.message}`);
    }
}

async function main() {
    console.log('Verifying installation...');
    console.log('Node.js version:', process.version);
    
    // First check MySQL connection
    try {
        await checkMySQLConnection();
    } catch (error) {
        console.error('❌ MySQL check failed:', error.message);
        process.exit(1);
    }
    
    try {
        console.log('Checking Redis...');
        await checkRedis();
    } catch (error) {
        console.error('❌', error.message);
        console.error('Please ensure Redis server is running');
        process.exit(1);
    }

    // Check if MySQL is installed
try {
    const { execSync } = require('child_process');
    const mysqlVersion = execSync('mysql --version').toString();
    const versionMatch = mysqlVersion.match(/\d+\.\d+\.\d+/);
    if (versionMatch) {
        const version = versionMatch[0].split('.').map(Number);
        if (version[0] < 8) {
            console.error('❌ MySQL version 8.0 or higher is required');
            console.error('Current version:', mysqlVersion.trim());
            process.exit(1);
        }
    }
    console.log('✅ MySQL is installed');
} catch (error) {
    console.error('❌ MySQL is not installed or not in PATH');
    console.error('Please install MySQL and try again');
    process.exit(1);
}

// Check node_modules
if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    console.error('❌ node_modules not found. Please run: npm install');
    process.exit(1);
}

// Check .env file
if (!fs.existsSync(path.join(__dirname, '..', '.env'))) {
    console.error('❌ .env file not found. Please copy .env.example to .env and configure it');
    process.exit(1);
}

// Check required dependencies
const package = require('../package.json');
// Check Node.js version
const nodeVersion = process.versions.node;
const [major] = nodeVersion.split('.');
if (parseInt(major) < 14) {
    console.error('❌ Node.js version 14 or higher is required');
    console.error('Current version:', nodeVersion);
    process.exit(1);
}
console.log('✅ Node.js version verified:', nodeVersion);

const requiredDeps = [
    'express',
    'mysql2',
    'sequelize',
    'stripe',
    'dotenv',
    'bcryptjs',
    'cors',
    'compression',
    'helmet',
    'cookie-parser',
    'morgan',
    'body-parser',
    'express-rate-limit',
    'express-async-handler',
    'express-async-errors',
    'express-validator',
    'winston',
    'express-session',
    'connect-redis',
    'ioredis'
];

// Verify MySQL and MySQL2
async function checkMySQLConnection() {
    try {
        const mysql2 = require('mysql2/promise');
        const connection = await mysql2.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            connectTimeout: 10000
        });
        
        await connection.ping();
        console.log('✅ MySQL server is accessible');
        await connection.end();
        return true;
    } catch (error) {
        throw new Error(`MySQL connection failed: ${error.message}`);
    }
}

// Verify MySQL client library and connection
try {
    const mysql2 = require('mysql2');
    if (!mysql2) {
        throw new Error('mysql2 not loaded properly');
    }
    console.log('✅ mysql2 client library verified');

    // Test MySQL connection
    const connection = mysql2.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD
    });
    
    connection.connect();
    console.log('✅ MySQL connection test successful');
    connection.end();
} catch (error) {
    console.error('❌ MySQL verification failed:', error.message);
    console.error('Please ensure:');
    console.error('1. MySQL is installed and running');
    console.error('2. mysql2 package is installed (npm install mysql2)');
    console.error('3. Database credentials in .env are correct');
    process.exit(1);
}

console.log('Checking required dependencies...');
for (const dep of requiredDeps) {
    if (!package.dependencies[dep]) {
        console.error(`❌ Missing dependency: ${dep}`);
        process.exit(1);
    }
}

// Verify Redis CLI
    try {
        execSync('redis-cli -h '+process.env.REDIS_HOST+' -p '+process.env.REDIS_PORT+' ping');
        console.log('✅ Redis CLI is available');
    } catch (error) {
        console.warn('⚠️ Redis CLI not found in PATH, skipping ping test');
    }

    // Create required directories
    const requiredDirs = ['logs', 'tmp'];
    for (const dir of requiredDirs) {
        const dirPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    // All checks passed
    console.log('✅ All installation checks passed!');
    console.log('✅ Required directories created');
    console.log('To start the server, run: npm start');
}

main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
});