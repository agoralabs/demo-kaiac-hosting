# Backend Server

## Quick Start
```bash
cd backend
npm install
npm run verify
# If verification passes:
npm start
```

## Included Security Features
- CORS protection with configurable origin
- Helmet security headers
- Rate limiting (100 requests per 15 minutes per IP)
- Compression for performance
- Error handling middleware
- Request logging with Morgan

## Environment Variables
See `.env.example` for required configuration.

## Troubleshooting
If the server fails to start:
1. Run `npm run verify` to check installation
2. Check MySQL database connection
3. Verify environment variables
4. Check console for detailed error messages

# Routes

## Routes utilisateurs (routes/api/userRoutes.js)
// Public routes
router.post('/signup', userController.register);
router.post('/verify', userController.login);
router.post('/login', userController.login);

// Protected routes
router.use(auth.authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/orders', userController.getUserOrders);
router.get('/subscriptions', userController.getUserSubscriptions);

## Routes Plans

router.get('/', planController.getPlans);
router.post('/', orderController.createPlan);

## Routes commandes (routes/api/orderRoutes.js)

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderDetails);
router.post('/:id/checkout', orderController.processPayment);
router.put('/:id/cancel', orderController.cancelOrder);

## Routes abonnements (routes/api/subscriptionRoutes.js)
// Routes de base
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/plans', subscriptionController.getAvailablePlans);

// Gestion des abonnements utilisateur
router.post('/', subscriptionController.createSubscription);
router.get('/:id', subscriptionController.getSubscriptionDetails);
router.put('/:id/upgrade', subscriptionController.upgradeSubscription);
router.put('/:id/cancel', subscriptionController.cancelSubscription);
router.get('/:id/usage', subscriptionController.getSubscriptionUsage);



## Routes pour l'administration (routes/api/adminRoutes.js)

// Gestion des plans
router.get('/plans', adminController.getAllPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

// Gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.get('/users/:id/subscriptions', adminController.getUserSubscriptions);

## Routes pour les sites (routes/api/websiteRoutes.js)

router.post('/', websiteController.createWebsite);
router.get('/:id', websiteController.getWebsiteDetails);
router.put('/:id', websiteController.updateWebsite);
router.delete('/:id', websiteController.deleteWebsite);

## Routes (routes/api/storageRoutes.js)

router.get('/usage', storageController.getStorageUsage);
router.get('/current', storageController.checkCurrentUsage);

## Routes pour les factures (routes/api/invoiceRoutes.js)

router.get('/', invoiceController.getUserInvoices);
router.get('/:id/pdf', invoiceController.generateInvoicePdf);

## Routes (routes/api/subscriptionHistoryRoutes.js)

router.get('/subscriptions/:id/history', historyController.getSubscriptionHistory);


# Migration Base de données
npx sequelize-cli db:migrate --config=config/database.js

J'ai créé le script shell start-production.sh dans le dossier backend et je l'ai rendu exécutable. Voici les d
étails pour démarrer votre backend en production sur un serveur Ubuntu :

### Packages requis à installer au préalable

bash
# Mise à jour des packages
sudo apt update
sudo apt upgrade -y

# Installation de Node.js (v14 ou supérieur)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de MySQL
sudo apt install -y mysql-server

# Installation de Redis (optionnel, pour la gestion des sessions)
sudo apt install -y redis-server

# Outils supplémentaires
sudo apt install -y git nginx


### Utilisation du script

1. Connectez-vous à votre serveur Ubuntu
2. Naviguez vers le dossier backend de votre application
3. Modifiez le script pour configurer vos variables d'environnement :
  bash
   nano start-production.sh

  Personnalisez les valeurs pour DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET et STRIPE_SECRET_KEY

4. Exécutez le script :
  bash
   ./start-production.sh


Le script va :
• Vérifier que vous êtes dans le bon répertoire
• Installer les dépendances si nécessaire
• Installer PM2 (gestionnaire de processus pour Node.js) si nécessaire
• Démarrer l'application en mode production
• Configurer PM2 pour redémarrer automatiquement l'application en cas de redémarrage du serveur

Pour vérifier l'état de votre application :
bash
pm2 status


Pour consulter les logs :
bash
pm2 logs kaiac-backend


Pour arrêter l'application :
bash
pm2 stop kaiac-backend


N'oubliez pas de configurer également Nginx comme proxy inverse pour exposer votre application sur le port 80/
443 avec HTTPS.