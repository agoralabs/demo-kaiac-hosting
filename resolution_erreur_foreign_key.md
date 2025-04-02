# Résolution de l'erreur de contrainte de clé étrangère

## Problème
L'erreur "Constraint Orders_ibfk_1 on table Orders does not exist" survient au démarrage du backend.

## Cause
Cette erreur se produit en raison d'une incohérence entre les contraintes de clé étrangère définies dans les modèles Sequelize et l'état actuel de la base de données.

## Solution appliquée
1. Nous avons ajouté les associations correctes entre les modèles User et Order dans `backend/models/index.js`:
   ```javascript
   db.User.hasMany(db.Order);
   db.Order.belongsTo(db.User);
   ```

2. Assurez-vous que la table Orders est correctement synchronisée avec la base de données.

## Étapes pour résoudre le problème
1. Vérifiez que MySQL est bien démarré:
   ```bash
   # Sur Linux
   sudo systemctl status mysql
   # Si arrêté, démarrez-le avec:
   sudo systemctl start mysql

   # Sur macOS
   brew services list | grep mysql
   # Si arrêté, démarrez-le avec:
   brew services start mysql
   ```

2. Assurez-vous que les identifiants MySQL dans le fichier .env sont corrects:
   ```
   DB_USER=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=wordpress_hosting
   ```

3. Arrêtez complètement le serveur backend s'il est en cours d'exécution
4. Redémarrez le serveur backend
5. Les nouvelles associations seront créées automatiquement lors de la synchronisation de la base de données

## Note importante
Si le problème persiste après le redémarrage, vous pouvez essayer de :

1. Sauvegarder vos données importantes
2. Supprimer manuellement les tables de la base de données
3. Redémarrer le serveur pour permettre à Sequelize de recréer les tables avec les bonnes contraintes

Les modifications apportées devraient résoudre le problème de contrainte de clé étrangère en s'assurant que la relation entre les tables Users et Orders est correctement définie.