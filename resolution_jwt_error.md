## Résolution de l'erreur JWT lors de l'inscription

L'erreur "secretOrPrivateKey must have a value" a été résolue en :

1. Créant un fichier `.env` dans le dossier backend
2. Ajoutant une clé JWT_SECRET sécurisée
3. Configurant NODE_ENV=development

Pour que les changements prennent effet :
1. Assurez-vous que le serveur backend est redémarré
2. Le fichier .env est correctement lu au démarrage

Note : Ne partagez jamais la clé JWT_SECRET en production. Utilisez une clé différente et sécurisée pour l'environnement de production.