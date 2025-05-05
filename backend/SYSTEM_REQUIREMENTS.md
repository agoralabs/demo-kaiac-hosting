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

### Allow remote access redis

Écouter sur toutes les interfaces réseau (par défaut, Redis n'écoute que sur 127.0.0.1)

Ouvrez le fichier redis.conf (généralement situé dans /  ou /etc/redis.conf).

> bind 0.0.0.0

Désactiver le mode protégé (pour autoriser les connexions distantes)

> protected-mode no


Restart redis

> sudo systemctl restart redis-server  # Sur systemd (Ubuntu/Debian/CentOS)