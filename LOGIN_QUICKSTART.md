# Guide Rapide - Correction de l'erreur 404 Login

Ce guide vous aidera à résoudre rapidement l'erreur "POST http://localhost:3001/api/auth/login 404 (Not Found)".

## Configuration Rapide

1. Créez le fichier `.env` dans le dossier backend :
```bash
cd backend
cat > .env << EOL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wordpress_hosting
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-secret-key
EOL
```

2. Démarrez MySQL (choisissez votre système) :
```bash
# Ubuntu/Debian
sudo systemctl start mysql

# Windows
# Ouvrez services.msc et démarrez MySQL
```

3. Créez la base de données (utilisez votre mot de passe MySQL si nécessaire) :
```bash
# Se connecter à MySQL (appuyez sur Entrée si pas de mot de passe)
mysql -u root -p 

# Dans MySQL, copiez et collez ces commandes :
CREATE DATABASE IF NOT EXISTS wordpress_hosting;
use wordpress_hosting;
# Quittez MySQL avec : exit
```

4. Redémarrez le serveur dans l'ordre suivant :

```bash
# 1. Arrêtez le serveur actuel avec Ctrl+C si en cours d'exécution

# 2. Nettoyez l'installation
cd backend
rm -rf node_modules package-lock.json

# 3. Réinstallez les dépendances
npm install

# 4. Démarrez le serveur
npm start
```

## Vérification

1. Le serveur devrait afficher :
```
Database connection established
Server running on port 3001
```

2. Testez l'API avec curl :
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Erreurs Connues

Si vous voyez "ECONNREFUSED" :
1. Vérifiez que MySQL est en cours d'exécution
2. Vérifiez que le port 3306 est ouvert : `sudo lsof -i :3306`
3. Essayez de redémarrer MySQL : `sudo systemctl restart mysql`

Si les erreurs persistent, vérifiez les logs avec :
```bash
cd backend
npm run verify
```