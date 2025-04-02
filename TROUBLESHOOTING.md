# Guide de dépannage

## Erreur backend "nodemon n'est pas reconnu en tant que commande interne"

Si vous recevez l'erreur "nodemon n'est pas reconnu en tant que commande interne" lors de l'exécution de `npm run dev`, suivez ces étapes :

1. Naviguez vers le répertoire backend :
```bash
cd backend
```

2. Installez toutes les dépendances (y compris nodemon) :
```bash
npm install
```

3. Maintenant vous pouvez lancer le serveur de développement :
```bash
npm run dev
```

Cette erreur se produit lorsque le package nodemon n'est pas installé localement. La commande `npm install` installera toutes les dépendances listées dans package.json, y compris nodemon qui est nécessaire pour le serveur de développement.