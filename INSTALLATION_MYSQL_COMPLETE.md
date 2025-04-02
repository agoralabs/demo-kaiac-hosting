# Guide Complet d'Installation MySQL

## 1. Installation de MySQL

### Sur Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
```

### Sur Windows
1. Téléchargez MySQL Installer depuis le site officiel
2. Exécutez l'installateur
3. Sélectionnez "Server only" ou "Custom"
4. Suivez l'assistant d'installation

## 2. Configuration Initiale

### Sécuriser l'installation (Linux)
```bash
sudo mysql_secure_installation
```

### Créer la base de données et l'utilisateur
```bash
# Se connecter à MySQL en tant que root
sudo mysql

# Dans le shell MySQL :
CREATE DATABASE wordpress_hosting;
CREATE USER 'wp_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON wordpress_hosting.* TO 'wp_user'@'localhost';
FLUSH PRIVILEGES;
exit;
```

## 3. Configuration du Backend

1. Copiez le fichier d'exemple d'environnement :
```bash
cd backend
cp .env.example .env
```

2. Modifiez le fichier `.env` avec vos informations :
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wordpress_hosting
DB_USER=wp_user
DB_PASSWORD=votre_mot_de_passe
```

## 4. Vérification

### Vérifier que MySQL est en cours d'exécution
```bash
# Sur Linux
sudo systemctl status mysql

# Sur Windows (dans services.msc)
# Cherchez "MySQL" et vérifiez qu'il est "En cours d'exécution"
```

### Tester la connexion
```bash
mysql -u wp_user -p wordpress_hosting
```

## 5. Dépannage

Si vous voyez l'erreur "ECONNREFUSED 127.0.0.1:3306", vérifiez :

1. Que MySQL est bien démarré :
```bash
# Linux
sudo systemctl restart mysql

# Windows
# Redémarrer le service MySQL dans services.msc
```

2. Que les informations de connexion sont correctes dans `.env`

3. Que l'utilisateur a les bons droits :
```sql
GRANT ALL PRIVILEGES ON wordpress_hosting.* TO 'wp_user'@'localhost';
FLUSH PRIVILEGES;
```

## 6. Démarrage du Serveur

Une fois MySQL configuré :
```bash
cd backend
npm install
npm start
```

Vous devriez voir "Database connection established" dans les logs.