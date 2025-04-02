# System Requirements

Before running the backend, ensure you have the following installed:

## Required Software

1. Node.js (v14 or higher)
```bash
node --version
```

2. MySQL Server (v8.0 recommended)
```bash
mysql --version
```

3. Redis Server (v6.0 or higher)
```bash
redis-cli --version
```

## Installation Guide

### MySQL
- Windows: Download and install from MySQL website
- Mac: `brew install mysql`
- Linux: `sudo apt install mysql-server`

### Redis
- Windows: Install through WSL or Redis for Windows
- Mac: `brew install redis`
- Linux: `sudo apt install redis-server`

## Verify Installation

Run the verification script:
```bash
cd backend
npm run verify
```

## Troubleshooting

### MySQL Issues
- Ensure MySQL service is running:
  - Windows: `net start mysql`
  - Mac/Linux: `sudo service mysql start`
- Check MySQL connection:
  ```bash
  mysql -u root -p
  ```

### Redis Issues
- Ensure Redis service is running:
  - Windows: Check Redis service in Task Manager
  - Mac/Linux: `redis-cli ping` (should return PONG)
- Start Redis if needed:
  - Mac/Linux: `sudo service redis-server start`