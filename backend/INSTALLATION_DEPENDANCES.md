# Installation des Dépendances

Pour résoudre l'erreur "Error: Cannot find module 'bcryptjs'", veuillez suivre ces étapes :

1. Assurez-vous d'être dans le répertoire backend :
```bash
cd backend
```

2. Installez toutes les dépendances en exécutant :
```bash
npm install
```

Cela installera toutes les dépendances requises, y compris le module `bcryptjs`.

Si vous continuez à rencontrer des problèmes, essayez de supprimer le répertoire node_modules et le fichier package-lock.json, puis exécutez npm install à nouveau :
```bash
rm -rf node_modules
rm package-lock.json
npm install
```