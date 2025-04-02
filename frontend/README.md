# Configuration du Frontend

Pour configurer le port du backend dans le frontend, nous avons créé deux fichiers:

1. `.env` - Contient la configuration active
2. `.env.example` - Sert de modèle pour la configuration

Ces fichiers contiennent la variable d'environnement suivante:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Cette configuration permet au frontend de se connecter correctement au backend sur le port 3001 au lieu du port 3000.