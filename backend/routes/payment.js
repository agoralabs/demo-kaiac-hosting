const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Invoice, Payment, Subscription } = require('../models');
const db = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// pay the first subscription
router.post('/', auth, async (req, res) => {

    const transaction = await db.sequelize.transaction();

    try {
  
        logger.info(`req.user.id=${req.user.id}`);
    
        if (!req.user) {
            logger.error('No user found in request');
            return res.status(401).json({ error: 'User not authenticated' });
        }
    
        const { invoice_id } = req.body;
        logger.info(`invoice_id=${invoice_id}`);

        
        const invoice = await Invoice.findOne({
            where: { id: invoice_id },
            include: [
            { 
                model: User,
                attributes: ['id', 'email']
            },
            { 
                model: Subscription,
                attributes: ['id', 'billing_address']
            }
            ],
            transaction
        });

        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Invoice not found' });
        }
  
        const amount = parseFloat(invoice.amount)+parseFloat(invoice.tax_amount);
        const currency = invoice.currency;
        const userId = invoice.User.id;
        // 2. Récupérer l'utilisateur
        const user = await User.findByPk(userId);
        if (!user.stripe_customer_id) {
            // Créer le client Stripe si inexistant
            const customer = await stripe.customers.create({
            email: user.email
            });
            user.stripe_customer_id = customer.id;
            await user.save();
        }
  
        // Utiliser paymentMethod.id
        // 3. Traitement du paiement
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe utilise des centimes
            currency: currency || 'eur',
            metadata: {
              invoice_id: invoice_id,
              invoice_number: invoice.invoice_number
            }
        });
  
        // 4. Enregistrement du paiement
        const payment = await Payment.create({
            payment_reference: invoice.invoice_number,
            user_id: userId,
            amount: amount,
            payment_date: new Date(),
            method: 'card',
            status: paymentIntent.status,
            stripe_payment_id: paymentIntent.id,
            stripe_payment_client_secret: paymentIntent.client_secret,
            billing_address: invoice.billing_address || null,
            payment_type: "recurring",
            subscription_id: invoice.subscription_id
        });
  
        
        invoice.payment_id = payment.id;
        invoice.save();

        await transaction.commit();
        // 7. Réponse
        res.json({
            success: true,
            payment: payment
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

// pay the subscription
router.post('/subscribe', auth, async (req, res) => {

  const transaction = await db.sequelize.transaction();

  try {

      logger.info(`req.user.id=${req.user.id}`);
  
      if (!req.user) {
          logger.error('No user found in request');
          return res.status(401).json({ error: 'User not authenticated' });
      }

      const selectedPlan = req.body;

      if (!selectedPlan) {
        return res.status(400).json({ error: 'Données du plan manquantes' });
      }

      logger.info(`selectedPlan=${JSON.stringify(selectedPlan, null, 2)}`);


      const subtotal = parseFloat(selectedPlan.totalAmount);
      const taxAmount = parseFloat(selectedPlan.totalAmountTax);
      const totalAmount = parseFloat(selectedPlan.totalAmountTTC);

      const currency = selectedPlan.currency;
      const userId = req.user.id;
      // 2. Récupérer l'utilisateur
      const user = await User.findByPk(userId, {transaction});
      if (!user.stripe_customer_id) {
          // Créer le client Stripe si inexistant
          const customer = await stripe.customers.create({
          email: user.email
          });
          user.stripe_customer_id = customer.id;
          await user.save(transaction);
      }

      logger.info(`user=${JSON.stringify(user, null, 2)}`);

      // 3. Créer une nouvelle souscription
      const start_date = new Date();
      const end_date = calculateEndDate(start_date, selectedPlan.durationInMonths);
      const subscription = await Subscription.create({
          user_id: userId,
          plan_id: selectedPlan.id,
          status: 'pending',
          start_date: start_date,
          end_date: end_date,
          next_payment_date: end_date,
          billing_cycle: 'annual',
          created_at: new Date(),
          amount: totalAmount,
          preferred_payment_method: selectedPlan.selectedPaymentMethod,
          billing_address: selectedPlan.billingAddress,
          duration_months: selectedPlan.durationInMonths,
          upgraded_at: null
      }, { transaction });

      // Utiliser paymentMethod.id
      // 3. Traitement du paiement
      const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // Stripe utilise des centimes
          currency: currency || 'eur',
          metadata: {
            user_id: userId,
            subscription_id: subscription.id,
            plan_name: selectedPlan.name,
            plan_duration: selectedPlan.durationInMonths,
            plan_price: selectedPlan.monthlyPrice,
            plan_total_amount: totalAmount,
            plan_tax_amount: taxAmount,
            plan_subtotal: subtotal,
            plan_currency: currency,
            plan_tax_rate: selectedPlan.taxRate,
            plan_id: selectedPlan.id
          }
      });

      logger.info(`paymentIntent=${JSON.stringify(paymentIntent, null, 2)}`);

      const paymentData = {
        payment_reference: selectedPlan.name+"-"+selectedPlan.durationInMonths+"-mois",
        user_id: userId,
        amount: totalAmount,
        payment_date: new Date(),
        method: selectedPlan.selectedPaymentMethod,
        status: paymentIntent.status,
        stripe_payment_id: paymentIntent.id,
        stripe_payment_client_secret: paymentIntent.client_secret,
        billing_address: subscription.billing_address || null,
        payment_type: "recurring",
        subscription_id: subscription.id,
        payment_data: paymentIntent
      };

      logger.info(`paymentData=${JSON.stringify(paymentData, null, 2)}`);
      // 4. Enregistrement du paiement
      const payment = await Payment.create(paymentData, { transaction });

      logger.info(`payment=${JSON.stringify(payment, null, 2)}`);

      await transaction.commit();
      // 7. Réponse
      res.json({
          success: true,
          payment: payment
      });

  } catch (error) {

    await transaction.rollback();
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


function safeFinancialCalculations(amount, taxRate) {
  const safeAmount = Math.max(0, parseFloat(amount) || 0);
  const safeTaxRate = Math.max(0, parseFloat(taxRate) || 0);
  
  return {
    subtotal: safeAmount,
    taxAmount: parseFloat((safeAmount * safeTaxRate).toFixed(2)),
    totalAmount: parseFloat((safeAmount * (1 + safeTaxRate)).toFixed(2))
  };
}

// Helper function
function calculateEndDate(start_date, duration_months) {
  const date = new Date(start_date);
  date.setMonth(date.getMonth() + duration_months);
  return date;
}

module.exports = router;