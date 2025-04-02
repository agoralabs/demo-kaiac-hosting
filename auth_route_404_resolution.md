# Résolution de l'erreur 404 sur /api/auth/login

Si vous rencontrez l'erreur "POST http://localhost:3001/api/auth/login 404 (Not Found)", suivez ces étapes pour résoudre le problème:

1. Assurez-vous que le serveur backend est en cours d'exécution
   ```bash
   # Dans le dossier backend
   npm start
   ```

2. Si le serveur est déjà en cours d'exécution, arrêtez-le et redémarrez-le:
   - Appuyez sur Ctrl+C pour arrêter le serveur
   - Exécutez `npm start` pour redémarrer le serveur

3. Vérifiez que le serveur démarre correctement:
   - Vous devriez voir des messages de log indiquant que la base de données est connectée
   - Le serveur devrait indiquer qu'il écoute sur le port 3001

4. Vérifiez que l'URL de l'API dans le frontend est correcte:
   ```javascript
   // Dans frontend/.env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

Si l'erreur persiste après ces étapes, vérifiez les logs du serveur pour plus de détails sur d'éventuelles erreurs.