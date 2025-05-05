const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Plan } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// const plans = {
//   '1': { name: 'BASIC', price: 9.99, createdAt: new Date(), updatedAt: new Date() },
//   '2': { name: 'STANDARD', price: 19.99, createdAt: new Date(), updatedAt: new Date() },
//   '3': { name: 'PREMIUM', price: 39.99, createdAt: new Date(), updatedAt: new Date() }
// };


router.get('/', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const existingPlans = await Plan.findAll();
    res.json({ existingPlans });

  } catch (error) {
    console.error('Plan findAll error:', error);
    res.status(500).json({ error: 'Failed to fecth plans' });
  }
});

// create plans
router.post('/', auth, async (req, res) => {

  try {
    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // Vérifie d'abord si des données existent déjà
    logger.info("Enter create plans");

    const { plans } = req.body;

    // Validation supplémentaire
    const validPlans = plans.map(plan => {
      return {
        id: plan.id,
        name: plan.name,
        plan_type: plan.plan_type,
        description: plan.description || null,
        features: plan.features || null,
        price_1_month: plan.price_1_month || null,
        price_12_months: plan.price_12_months || null,
        price_24_months: plan.price_24_months || null,
        price_36_months: plan.price_36_months || null,
        price_60_months: plan.price_60_months || null,
        price_120_months: plan.price_120_months || null,
        included_sites: plan.included_sites || null,
        included_storage_mb: plan.included_storage_mb || 1024, // Valeur par défaut 1GB
        monthly_billing_cycle: plan.monthly_billing_cycle || true,
        annual_billing_cycle: plan.annual_billing_cycle || true,
        is_active: plan.is_active !== false // true par défaut
      };
    });

    const existingPlansCount = await Plan.count();
    logger.info(`existingPlans=${existingPlansCount}`);
    if (existingPlansCount === 0) {

      const createdPlans = await Plan.bulkCreate(validPlans, {
        validate: true, // Validation de chaque entrée
        returning: true // Pour récupérer les IDs générés
      });


      logger.info('Plan créés avec succès');

      res.status(201).json({
        message: `${createdPlans.length} plans créés avec succès`,
        plans: createdPlans
      });

    } else {
      logger.info('La table Plan contient déjà des données, insertion ignorée');

      res.status(400).json({
        error: 'La table Plan contient déjà des données, insertion ignorée'
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'insertion des plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

});


// Upgrade plan
router.put('/plans/:id', auth, async (req, res) => {
  try {
      logger.info(`req.user.id=${req.user.id}`);
      if (!req.user) {
        logger.error('No user found in request');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const { newPlanId } = req.body;

      // 1. Vérifier que le nouveau plan existe
      const newPlan = await Plan.findByPk(newPlanId);
      if (!newPlan) {
          return res.status(404).json({
          success: false,
          message: 'Plan not found'
          });
      }

      // 2. Récupérer la souscription actuelle
      const subscription = await Subscription.findByPk(id, {
          include: [{ model: Plan }]
      });

      if (!subscription) {
          return res.status(404).json({
          success: false,
          message: 'Subscription not found'
          });
      }

      // 3. Vérifier que ce n'est pas un downgrade
      // 3. Conversion et validation des prix
      const currentPrice = Number(subscription.Plan.monthly_price);
      const newPrice = Number(newPlan.monthly_price);

      if (currentPrice > newPrice) {
          return res.status(400).json({
          success: false,
          message: 'Cannot upgrade to a cheaper or equal plan'
          });
      }

      // 4. Effectuer la mise à jour
      await subscription.update({
          PlanId: newPlanId,
          status: 'upgraded', // ou un statut personnalisé
          upgraded_at: new Date()
      });

      // 5. Retourner la réponse
      res.json({
          success: true,
          message: 'Subscription upgraded successfully',
          data: {
          oldPlan: subscription.Plan.name,
          newPlan: newPlan.name,
          priceDifference: newPlan.monthly_price - subscription.Plan.monthly_price
          }
      });

  } catch (error) {
      console.error('Upgrade error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
  }
});

module.exports = router;