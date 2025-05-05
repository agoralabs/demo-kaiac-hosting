const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Plan, Payment, Subscription } = require('../models');
const logger = require('../utils/logger');

// get all subscriptions
router.get('/', auth, async (req, res) => {
    try {

        logger.info(`req.user.id=${req.user.id}`);
        if (!req.user) {
          logger.error('No user found in request');
          return res.status(401).json({ error: 'User not authenticated' });
        }
        const subscriptions = await Subscription.findAll({
            include: [
              {
                model: User,
                attributes: ['id', 'email', 'firstName', 'lastName'] // Champs spécifiques seulement
              },
              {
                model: Plan,
                attributes: ['id', 'name', 'monthly_price', 'annual_price']
              }
            ],
            order: [['created_at', 'DESC']] // Tri par date récente
          });
    
          if (!subscriptions.length) {
            return res.status(404).json({
              success: false,
              message: 'No subscriptions found'
            });
          }
    
          res.json({
            success: true,
            count: subscriptions.length,
            data: subscriptions
          });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get available plans 
router.get('/plans', auth, async (req, res) => {
    try {

        logger.info(`req.user.id=${req.user.id}`);
        if (!req.user) {
          logger.error('No user found in request');
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const plans = await Plan.findAll({
            attributes: ['id', 'name', 'monthly_price', 'annual_price', 'description'], // Champs à retourner
            order: [['monthly_price', 'ASC']] // Tri par prix croissant
          });
    
        res.json({
        success: true,
        data: plans,
        message: 'Plans retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
    }
});

// Upgrade subscription
router.put('/:id/upgrade', auth, async (req, res) => {
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

// subscribe to a plan
router.post('/subscribe', auth, async (req, res) => {
    try {
        logger.info(`req.user.id=${req.user.id}`);
        if (!req.user) {
          logger.error('No user found in request');
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const { plan_id, billing_cycle, preferred_payment_method, billing_address, duration_months } = req.body;
        const user_id = req.user.id;

        // 1. Vérifier que le plan existe
        const plan = await Plan.findByPk(plan_id);
        if (!plan) {
            return res.status(404).json({
            success: false,
            message: 'Plan not found'
            });
        }

        // 2. Créer une nouvelle souscription
        const start_date = new Date();
        const subscription = await Subscription.create({
            user_id: user_id,
            plan_id: plan.id,
            status: 'pending',
            start_date: start_date,
            end_date: calculateEndDate(start_date, duration_months),
            next_payment_date: calculateNextPaymentDate(start_date, billing_cycle),
            billing_cycle: billing_cycle,
            created_at: new Date(),
            amount: chooseAmount(plan, billing_cycle),
            preferred_payment_method: preferred_payment_method,
            billing_address: billing_address,
            duration_months: duration_months,
            upgraded_at: null
        });

        // 3. Retourner la réponse
        res.json({
            success: true,
            message: 'Subscription created successfully',
            data: subscription
        });

    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
    }
});

// activate subscription
router.put('/:id/activate', auth, async (req, res) => {
    try {
        logger.info(`req.user.id=${req.user.id}`);
        if (!req.user) {
          logger.error('No user found in request');
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const { id } = req.params;

        // 1. Vérifier que la souscription existe
        const subscription = await Subscription.findByPk(id);
        if (!subscription) {
            return res.status(404).json({
            success: false,
            message: 'Subscription not found'
            });
        }

        // 2. Mettre à jour le statut de la souscription
        await subscription.update({
            status: 'active',
            activated_at: new Date()
        });

        // 3. Retourner la réponse
        res.json({
            success: true,
            message: 'Subscription activated successfully',
            data: subscription
        });

    } catch (error) {
        console.error('Activation error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
    }
});

// Helper function
function calculateEndDate(start_date, duration_months) {
  const date = new Date(start_date);
  date.setMonth(date.getMonth() + duration_months);
  return date;
}

function calculateNextPaymentDate(start_date, billingCycle) {
  const date = new Date(start_date);
  if (billingCycle === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

function chooseAmount(plan, billingCycle) {
  return billingCycle === 'annual' ? plan.annual_price : plan.monthly_price;
}

module.exports = router;