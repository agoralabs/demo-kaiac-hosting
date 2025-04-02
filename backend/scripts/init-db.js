require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    try {
        // Create connection without database name
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
            CHARACTER SET ${process.env.DATABASE_CHARSET || 'utf8mb4'} 
            COLLATE ${process.env.DATABASE_CHARSET || 'utf8mb4'}_unicode_ci`);
        console.log('✅ Database initialized successfully');
        
        await connection.end();
    } catch (error) {
        console.error('❌ Database initialization failed');
        console.error('Error details:', error.message);
        console.error('Please verify:');
        console.error('1. MySQL is running');
        console.error('2. Credentials in .env are correct');
        console.error('3. User has CREATE DATABASE permissions');
        process.exit(1);
    }
}

initializeDatabase();