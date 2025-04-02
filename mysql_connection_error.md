# Résolution de l'erreur 404 pour /api/subscriptions

Cette erreur peut se produire pour plusieurs raisons :
1. Le serveur backend n'est pas démarré à cause des problèmes de connexion avec MySQL et Redis
2. Le frontend n'est pas configuré correctement pour se connecter au backend
3. Le token d'authentification n'est pas présent ou est invalide

## 1. Configuration de l'environnement

1. Copiez le fichier d'exemple d'environnement :
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Modifiez le fichier `.env` avec les valeurs appropriées :
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root  # ou votre utilisateur MySQL
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=wordpress_hosting
   JWT_SECRET=votre_secret_jwt
   SESSION_SECRET=votre_secret_session
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

## 2. Configuration de MySQL

1. Installez MySQL si ce n'est pas déjà fait :
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install mysql-server

   # macOS
   brew install mysql
   ```

2. Démarrez le service MySQL :
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mysql

   # macOS
   brew services start mysql
   ```

3. Créez la base de données et l'utilisateur :
   ```sql
   mysql -u root -p
   
   CREATE DATABASE wordpress_hosting;
   CREATE USER 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';
   GRANT ALL PRIVILEGES ON wordpress_hosting.* TO 'dev_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## 3. Configuration de Redis

1. Installez Redis :
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server

   # macOS
   brew install redis
   ```

2. Démarrez le service Redis :
   ```bash
   # Ubuntu/Debian
   sudo systemctl start redis

   # macOS
   brew services start redis
   ```

## 4. Démarrage du serveur

1. Installez les dépendances :
   ```bash
   cd backend
   npm install
   ```

2. Démarrez le serveur :
   ```bash
   npm run start
   ```

3. Vérifiez les logs pour vous assurer que le serveur démarre correctement :
   ```bash
   tail -f backend/logs/app.log
   ```

## 5. Configuration du Frontend

1. Assurez-vous que le fichier `.env` dans le dossier frontend contient la bonne URL du backend :
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

2. Vérifiez que vous êtes bien connecté (le token JWT doit être présent dans le localStorage) :
   ```javascript
   // Ouvrez la console du navigateur et tapez :
   localStorage.getItem('token')
   ```

3. Vérifiez que le backend répond bien :
   ```bash
   curl http://localhost:3001/api/health
   ```

## 6. Résolution des problèmes courants

Si le serveur ne démarre toujours pas :

1. Vérifiez que MySQL est en cours d'exécution :
   ```bash
   sudo systemctl status mysql
   ```

2. Vérifiez que Redis est en cours d'exécution :
   ```bash
   sudo systemctl status redis
   ```

3. Testez la connexion MySQL :
   ```bash
   mysql -u dev_user -p wordpress_hosting
   ```

4. Consultez les logs d'erreur :
   ```bash
   tail -f /var/log/mysql/error.log
   tail -f backend/logs/app.log
   ```