# Guide de Démarrage Rapide

## Prérequis
1. Node.js (v14+)
2. MySQL (v8.0+)
3. Redis (v6.0+)

## Installation

1. Installer les dépendances
```bash
cd backend
npm install
```

2. Configurer l'environnement
```bash
cp .env.example .env
# Modifier les valeurs dans .env selon votre configuration
```

3. Initialiser la base de données
```bash
npm run init-db
```

4. Vérifier l'installation
```bash
npm run verify
```

5. Démarrer le serveur
```bash
npm start
# ou pour le développement :
npm run dev
```

## Résolution des Problèmes

### Erreur "mysql not found"
- Vérifier que MySQL est installé et démarré
- Windows : `net start mysql`
- Linux/Mac : `sudo service mysql start`

### Erreur "redis not found"
- Vérifier que Redis est installé et démarré
- Windows (WSL) : `sudo service redis-server start`
- Linux/Mac : `brew services start redis` ou `sudo systemctl start redis`

### Erreur de connexion à la base de données
1. Vérifier les informations dans .env
2. Vérifier que la base existe
3. Vérifier les permissions utilisateur MySQL

### Erreur "nodemon not found"
```bash
npm install -g nodemon
```

## Vérification du Fonctionnement
```bash
curl http://localhost:3001/health
```
Si tout fonctionne, vous devriez recevoir : `{"status":"OK"}`