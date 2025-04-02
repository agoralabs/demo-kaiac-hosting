# Résolution de l'erreur 404 /api/auth/login - Problème de connexion MySQL

L'erreur 404 sur le login est causée par un problème de connexion à MySQL qui empêche le serveur de démarrer correctement. Voici les étapes pour résoudre ce problème :

## 1. Vérifier que MySQL est en cours d'exécution

```bash
# Sur Linux
sudo systemctl status mysql

# Sur macOS avec Homebrew
brew services list | grep mysql

# Sur Windows
services.msc   # Cherchez "MySQL" dans la liste
```

## 2. Vérifier les informations de connexion MySQL

Dans le fichier `backend/.env`, vérifiez que ces valeurs sont correctes :
```
DB_HOST=localhost  # ou 127.0.0.1
DB_PORT=3306
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nom_de_votre_base
```

## 3. Créer la base de données si elle n'existe pas

```bash
# Se connecter à MySQL
mysql -u root -p

# Dans MySQL, créer la base de données
CREATE DATABASE nom_de_votre_base;
```

## 4. Vérifier les permissions MySQL

```sql
# Dans MySQL
GRANT ALL PRIVILEGES ON nom_de_votre_base.* TO 'votre_utilisateur'@'localhost';
FLUSH PRIVILEGES;
```

## 5. Redémarrer le serveur

Une fois ces étapes effectuées :
1. Arrêtez le serveur backend (Ctrl+C)
2. Redémarrez-le : `cd backend && npm start`
3. Vérifiez les logs pour confirmer la connexion MySQL

Si vous voyez "Database connection established" dans les logs, le serveur devrait maintenant fonctionner correctement et l'API /api/auth/login sera accessible.