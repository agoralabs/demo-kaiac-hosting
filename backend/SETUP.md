# Backend Setup Guide

To properly start the backend, please follow these steps:

1. First, make sure you are in the backend directory:
```bash
cd backend
```

2. Install all required dependencies:
```bash
npm install
```

3. Create a .env file in the backend directory:
```bash
cp .env.example .env
```

4. The backend requires the following environment variables in your .env file:
- PORT (default: 3001)
- DATABASE_URL or individual database connection parameters:
  - DB_HOST
  - DB_USER
  - DB_PASSWORD
  - DB_NAME
  - DB_PORT

5. Start the server:
```bash
npm start
```

If you encounter any issues:
1. Make sure all dependencies are properly installed
2. Check if your .env file is properly configured
3. Ensure your database is running and accessible
4. Look at the error messages in the console for specific issues

## Required Dependencies
The following dependencies should be installed:
- express and related middleware:
  - express
  - express-async-handler
  - express-validator
  - body-parser
  - cookie-parser
  - cors
  - compression
  - helmet
  - morgan
  - express-rate-limit
- Database related:
  - mysql2
  - sequelize
- Other core dependencies:
  - stripe
  - dotenv
  - bcryptjs

You can verify they are installed by checking the node_modules directory or running:
```bash
npm list
```