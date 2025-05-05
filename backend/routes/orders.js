const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order, User, Plan, OrderItem, Payment, Subscription, Notification } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { Op } = require('sequelize'); // Ajout de l'import

router.post('/', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    const { planId, billing_cycle, preferred_payment_method, billing_address } = req.body;
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id; // Assuming auth middleware sets this

    const plan = await Plan.findByPk(planId);

    
    // Create order in database
    const order = await Order.create({
      user_id: userId,
      order_reference: `ORD-${Date.now()}`,
      total_amount: plan.monthly_price,
      preferred_payment_method: preferred_payment_method,
      billing_address: billing_address,
      status: 'pending'
    });

    const orderItem = await OrderItem.create({
      order_id: order.id,
      plan_id: planId,
      quantity: 1,
      unit_price: plan.monthly_price,
      billing_cycle: billing_cycle,
      duration_months: 12
    });

    res.status(201).json({
      message: `Commande ${order.order_reference} créée avec succès`,
      order: order
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Plan
        }]
      }]
    });

    res.json({ orders });

  } catch (error) {
    console.error('Orders findAll error:', error);
    res.status(500).json({ error: 'Failed to fecth orders' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id // Sécurité : ne permet d'accéder qu'à ses propres commandes
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Plan
        }]
      }, Payment, Subscription]
    });

    
    res.json({ order });

  } catch (error) {
    console.error('Order findOne error:', error);
    res.status(500).json({ error: 'Failed to fecth order' });
  }
});

// pay the first subscription
router.post('/:id/checkout', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);

    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { payment_method_id, billing_address, save_payment_method } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;

    // 1. Récupérer la commande
    const order = await Order.findOne({
      where: {
        id: orderId,
        user_id: userId,
        status: 'pending'
      },
      include: ['items']
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée ou déjà traitée' });
    }

    const orderItem = order.items[0];

    // 2. Récupérer l'utilisateur
    const user = await User.findByPk(userId);
    if (!user.stripe_customer_id) {
      // Créer le client Stripe si inexistant
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: payment_method_id,
        invoice_settings: {
          default_payment_method: payment_method_id
        }
      });
      user.stripe_customer_id = customer.id;
      await user.save();
    }

    
    // Utiliser paymentMethod.id
    // 3. Traitement du paiement
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // Convertir en cents
      currency: 'eur',
      customer: user.stripe_customer_id,
      payment_method: payment_method_id,
      off_session: true,
      confirm: true,
      metadata: { order_id: order.id }
    });

    // 6. Création des abonnements
    const start_date = new Date();
    const subscription = await Subscription.create({
      user_id: userId,
      plan_id: orderItem.plan_id,
      order_id: order.id,
      status: 'active',
      start_date: start_date,
      end_date: calculateEndDate(orderItem.billing_cycle),
      next_payment_date: calculateNextPaymentDate(start_date, orderItem.billing_cycle),
      billing_cycle: orderItem.billing_cycle
    });
    
    logger.info('subscription:', subscription);

    // 4. Enregistrement du paiement
    const payment = await Payment.create({
      payment_reference: order.order_reference,
      order_id: order.id,
      user_id: userId,
      amount: order.total_amount,
      payment_date: new Date(),
      method: 'card',
      status: paymentIntent.status,
      stripe_payment_id: paymentIntent.id,
      billing_address: billing_address || null,
      payment_type: "initial",
      subscription_id: subscription.id
    });

    // 5. Mise à jour de la commande
    await order.update({ status: 'completed' });

    // 7. Réponse
    res.json({
      success: true,
      payment_status: paymentIntent.status,
      order_id: order.id,
      payment_id: payment.id,
      subscription_id: subscription.id
    });

  } catch (error) {

    logger.error('Erreur traitement paiement:', error);
      
    // Erreurs spécifiques Stripe
    if (error.type === 'StripeCardError') {
      return res.status(402).json({ 
        error: 'Paiement refusé',
        decline_code: error.decline_code 
      });
    }

    res.status(500).json({ 
      error: 'Échec du traitement du paiement'
    });

  }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { reason } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;

    // 1. Vérifier la commande
    const order = await Order.findOne({
      where: {
        id: orderId,
        user_id: userId,
        status: {
          [Op.in]: ['pending', 'processing', 'completed'] // États annulables
        }
      },
      include: [Payment, Subscription]
    });

    if (!order) {
      return res.status(404).json({ 
        error: 'Commande non trouvée, déjà annulée ou non annulable' 
      });
    }

    // 2. Annulation Stripe si paiement existant
    if (order.Payment?.stripe_payment_id) {
      try {
        await stripe.refunds.create({
          payment_intent: order.Payment.stripe_payment_id,
          reason: 'requested_by_customer'
        });
      } catch (stripeError) {
        console.error('Erreur remboursement Stripe:', stripeError);
        // Continuer même si le remboursement échoue
      }
    }

    // 3. Mettre à jour les entités
    const updatePromises = [
      order.update({ 
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason 
      }),
      
      order.Payment?.update({ 
        status: 'refunded' 
      }),
      
      order.Subscription?.update({ 
        status: 'cancelled',
        end_date: new Date() 
      })
    ];

    await Promise.all(updatePromises);

    // 4. Créer une notification
    await Notification.create({
      user_id: userId,
      title: 'Commande annulée',
      message: `Votre commande #${order.order_reference} a été annulée`,
      type: 'order_cancellation',
      metadata: {
        order_id: order.id,
        refund_amount: order.Payment?.amount
      }
    });

    res.json({
      success: true,
      order_id: order.id,
      new_status: 'cancelled',
      refund_initiated: !!order.Payment
    });

  } catch (error) {
    console.error('Erreur annulation commande:', error);    
    res.status(500).json({ 
      error: 'Échec de l\'annulation'
    });
  }
});

// Helper function
function calculateEndDate(billingCycle) {
  const date = new Date();
  if (billingCycle === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

function calculateNextPaymentDate(startDate, billingCycle) {
  const date = new Date(startDate);
  if (billingCycle === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

function getPaymentCardNumber(payment_method_id) {

  const cards = {
    "success" : "4242424242424242",
    "insufficient_funds": "4000000000009995",
    "fraud_detected": "4100000000000019",
    "expired_card": "4000000000000069",
    "incorrect_cvc": "4000000000000127",
    "incorrect_number": "4242424242424241",
    "invalid_cvc": "4000000000000101",
    "invalid_number": "4242424242424241"
  };

  return cards[payment_method_id] || "4242424242424242";

}

module.exports = router;