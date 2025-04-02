const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order, User } = require('../models');

router.post('/', async (req, res) => {
  try {
    console.log('Order route - req.user:', req.user);
    const { planId } = req.body;
    if (!req.user) {
      console.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id; // Assuming auth middleware sets this

    // Get plan details
    const planDetails = getPlanDetails(planId);
    
    // Create order in database
    const order = await Order.create({
      userId,
      planId,
      amount: planDetails.price,
      status: 'pending'
    });

    const stripeEnabled = process.env.STRIPE_ENABLED === 'true'; // Node.js

    if (!stripeEnabled) {
      // If Stripe is disabled, create a dummy order
      // Update order with session ID
      const session = { id: 'dummy-session-id' };
      await order.update({ stripeSessionId: session.id });

      res.json({ sessionId: session.id,
        success_url: `${process.env.FRONTEND_URL}/success?orderId=${order.id}`
      });

    }else{
      // If Stripe is enabled, proceed with Stripe integration
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planDetails.name,
                description: `WordPress Hosting Plan - ${planDetails.name}`
              },
              unit_amount: Math.round(planDetails.price * 100) // Convert to cents
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/success?orderId=${order.id}`,
        cancel_url: `${process.env.FRONTEND_URL}/plans`
      });

      // Update order with session ID
      await order.update({ stripeSessionId: session.id });

      res.json({ sessionId: session.id });
    }



  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

function getPlanDetails(planId) {
  const plans = {
    'basic': { name: 'BASIC', price: 9.99 },
    'standard': { name: 'STANDARD', price: 19.99 },
    'premium': { name: 'PREMIUM', price: 39.99 }
  };
  return plans[planId];
}

module.exports = router;