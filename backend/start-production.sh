#!/bin/bash

# Script de démarrage du backend KaiaC Hosting en production
# Version adaptée pour être exécutée depuis n'importe quel répertoire

# Définition du répertoire cible
BACKEND_DIR="/home/ubuntu/demo-kaiac-hosting/backend"

# Variables d'environnement
export PORT=3001
export NODE_ENV=production

# Se déplacer dans le répertoire backend
cd "$BACKEND_DIR" || {
  echo "Erreur: Impossible d'accéder au répertoire backend $BACKEND_DIR"
  exit 1
}

# Vérification de la présence des fichiers essentiels
if [ ! -f "package.json" ]; then
  echo "Erreur: Fichier package.json introuvable dans $BACKEND_DIR"
  exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances..."
  npm install --production
fi

# Vérification et installation de PM2
if ! command -v pm2 &> /dev/null; then
  echo "Installation de PM2..."
  npm install -g pm2
fi

# Gestion de l'application PM2
echo "Gestion du processus Node.js..."
pm2 stop kaiac-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Affichage des informations
echo "-----------------------------------------"
echo "Backend KaiaC Hosting démarré avec succès"
echo "Répertoire: $BACKEND_DIR"
echo "Statut:"
pm2 list | grep kaiac-backend
echo "-----------------------------------------"
echo "Commandes utiles:"
echo "  Voir les logs: pm2 logs kaiac-backend"
echo "  Arrêter: pm2 stop kaiac-backend"
echo "  Redémarrer: pm2 restart kaiac-backend"