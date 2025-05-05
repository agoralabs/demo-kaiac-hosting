const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Plan, Subscription } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../models');
const { Op } = require('sequelize'); // Ajout de l'import
// const plans = {
//   '1': { name: 'BASIC', price: 9.99, createdAt: new Date(), updatedAt: new Date() },
//   '2': { name: 'STANDARD', price: 19.99, createdAt: new Date(), updatedAt: new Date() },
//   '3': { name: 'PREMIUM', price: 39.99, createdAt: new Date(), updatedAt: new Date() }
// };


router.get('/plans', auth, async (req, res) => {
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
router.post('/plans', auth, async (req, res) => {

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
        description: plan.description || null,
        monthly_price: plan.monthly_price,
        annual_price: plan.annual_price || Math.round(plan.monthly_price * 12 * 0.9), // 10% de réduction annuelle par défaut
        included_sites: plan.included_sites,
        included_storage_mb: plan.included_storage_mb || 1024, // Valeur par défaut 1GB
        monthly_billing_cycle: plan.monthly_billing_cycle || true,
        annual_billing_cycle: plan.annual_billing_cycle || true,
        is_active: plan.is_active !== false // true par défaut
      };
    });

    const createdPlans = await Plan.bulkCreate(validPlans, {
        validate: true, // Validation de chaque entrée
        returning: true // Pour récupérer les IDs générés
      });


      logger.info('Plan créés avec succès');

      res.status(201).json({
        message: `${createdPlans.length} plans créés avec succès`,
        plans: createdPlans
      });

  } catch (error) {
    console.error('Erreur lors de l\'insertion des plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

});

// update plans
router.put('/plans/:id', auth, async (req, res) => {
    const transaction = await db.sequelize.transaction();
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const updates = req.body;

    const existingPlan = await Plan.findOne({
        where: { id },
        lock: transaction.LOCK.UPDATE,
        transaction
        });
    
    if (!existingPlan) {
        await transaction.rollback();
        return res.status(404).json({
            success: false,
            message: 'Plan not found'
        });
    }

    // 3. Validation du prix si modifié
    if (updates.monthly_price !== undefined) {
        const newPrice = parseFloat(updates.monthly_price);
        if (isNaN(newPrice) || newPrice < 0) {
            await transaction.rollback();
            return res.status(400).json({
            success: false,
            message: 'Monthly price must be a positive number'
            });
        }
    }

    if (updates.annual_price !== undefined) {
        const newPrice = parseFloat(updates.annual_price);
        if (isNaN(newPrice) || newPrice < 0) {
            await transaction.rollback();
            return res.status(400).json({
            success: false,
            message: 'Annual price must be a positive number'
            });
        }
    }

    // 4. Empêcher les doublons de noms
    if (updates.name) {
        const duplicate = await Plan.findOne({
            where: {
            name: updates.name,
            id: { [Op.ne]: id }
            },
            transaction
        });

        if (duplicate) {
            await transaction.rollback();
            return res.status(409).json({
            success: false,
            message: 'Plan name already exists'
            });
        }
    }

    // 5. Mise à jour
    await existingPlan.update(updates, { transaction });

    await transaction.commit();

    // 6. Récupérer le plan fraîchement mis à jour
    const updatedPlan = await Plan.findByPk(id);

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: updatedPlan
    });

    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

// delete plans
router.delete('/plans/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    const plan = await Plan.findOne({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// get all users
router.get('/users', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const users = await User.findAll();

    res.json({ users });

  } catch (error) {
    console.error('User findAll error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// get /users/:id/subscriptions (get all subscriptions for a user)

router.get('/users/:id/subscriptions', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    const subscriptions = await Subscription.findAll({
      where: { user_id: id }
    });

    res.json({ subscriptions });

  } catch (error) {
    console.error('Subscription findAll error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});


module.exports = router;