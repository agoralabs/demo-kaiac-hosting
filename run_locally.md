# Comment exécuter l'application en local

Pour exécuter l'application en local, suivez ces étapes :

## 1. Configuration du Backend

1. Naviguez vers le dossier backend :
```bash
cd backend
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur en mode développement :
```bash
npm run dev
```

Le backend démarrera sur http://localhost:3000 (ou le port spécifié dans les variables d'environnement)

## 2. Configuration du Frontend

1. Dans un nouveau terminal, naviguez vers le dossier frontend :
```bash
cd frontend
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez l'application en mode développement :
```bash
npm run dev
```

Le frontend démarrera sur http://localhost:3000 (pour changer le port, vous pouvez utiliser la commande `npm run dev -- -p 3001`)

## Notes importantes :

- Assurez-vous d'avoir Node.js installé sur votre machine
- Les deux services (frontend et backend) doivent fonctionner simultanément
- Le backend nécessite une base de données MySQL (voir la configuration dans les variables d'environnement)
- Configurez les variables d'environnement appropriées avant de lancer l'application

## 3. Configuration des variables d'environnement

1. Dans le dossier backend, créez un fichier `.env` basé sur `.env.example`
2. Remplissez les valeurs nécessaires pour :
   - La connexion à la base de données MySQL
   - La clé Stripe (si le paiement est utilisé)
   - Le port du serveur (par défaut 3000)