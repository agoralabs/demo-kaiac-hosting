#!/bin/bash

# Script de démarrage du backend KaiaC Hosting en production
# À placer dans le répertoire backend du projet

# Variables d'environnement (à personnaliser)
export PORT=3001
export NODE_ENV=production

# Décommentez si vous utilisez Redis
# export REDIS_URL="redis://localhost:6379"

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "Erreur: Ce script doit être exécuté depuis le répertoire backend"
  exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances..."
  npm install --production
fi

# Démarrer l'application avec PM2 (gestion des processus Node.js)
# Si PM2 n'est pas installé, l'installer globalement
if ! command -v pm2 &> /dev/null; then
  echo "Installation de PM2..."
  npm install -g pm2
fi

# Arrêter l'instance précédente si elle existe
pm2 stop kaiac-backend 2>/dev/null || true

# Démarrer l'application
echo "Démarrage du backend KaiaC Hosting..."
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2 pour redémarrage automatique
pm2 save

echo "Le backend KaiaC Hosting est en cours d'exécution."
echo "Pour voir les logs: pm2 logs kaiac-backend"
echo "Pour arrêter le service: pm2 stop kaiac-backend"
