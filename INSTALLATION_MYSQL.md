# Guide d'Installation de MySQL

Pour installer MySQL, suivez ces étapes :

## 1. Installation de MySQL

### Sur Ubuntu/Debian :
```bash
sudo apt update
sudo apt install mysql-server
```

### Sur macOS avec Homebrew :
```bash
brew install mysql
```

### Sur Windows :
1. Téléchargez MySQL Community Server depuis le site officiel : https://dev.mysql.com/downloads/mysql/
2. Exécutez l'installateur et suivez les instructions

## 2. Démarrage du service MySQL

### Sur Ubuntu/Debian :
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Sur macOS :
```bash
brew services start mysql
```

### Sur Windows :
Le service MySQL démarre automatiquement après l'installation.

## 3. Sécurisation de l'installation

```bash
sudo mysql_secure_installation
```

## 4. Vérification de l'installation

```bash
mysql --version
```

## 5. Test de la connexion

```bash
mysql -u root -p
```

## Notes importantes
- Conservez votre mot de passe root MySQL en lieu sûr
- Assurez-vous que le service MySQL est en cours d'exécution avant d'utiliser l'application
- Le port par défaut de MySQL est 3306

## Résolution des problèmes de connexion

Si vous rencontrez l'erreur "ECONNREFUSED 127.0.0.1:3306", suivez ces étapes :

1. Vérifiez que MySQL est en cours d'exécution :
   ```bash
   # Sur Ubuntu/Debian
   sudo systemctl status mysql

   # Sur macOS
   brew services list | grep mysql
   ```

2. Si MySQL n'est pas en cours d'exécution, démarrez-le :
   ```bash
   # Sur Ubuntu/Debian
   sudo systemctl start mysql

   # Sur macOS
   brew services start mysql
   ```

3. Vérifiez que vous pouvez vous connecter localement :
   ```bash
   mysql -u root -p
   ```

4. Assurez-vous que MySQL écoute sur l'adresse locale (127.0.0.1) :
   ```bash
   sudo netstat -tlnp | grep mysql
   ```

5. Si nécessaire, créez un nouvel utilisateur avec les privilèges appropriés :
   ```bash
   mysql -u root -p
   ```
   Puis dans MySQL :
   ```sql
   CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON *.* TO 'user'@'localhost';
   FLUSH PRIVILEGES;
   ```