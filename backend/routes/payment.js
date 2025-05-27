const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Invoice, Payment, Subscription } = require('../models');
const db = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const axios = require('axios');
const crypto = require('crypto');

// Configuration PayPal
const PAYPAL_API = process.env.PAYPAL_API || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

// Configuration Wave
const WAVE_API_URL = process.env.WAVE_API_URL || 'https://api.wave.com/v1/checkout';
const WAVE_SECRET_KEY = process.env.WAVE_SECRET_KEY;
const WAVE_BUSINESS_ID = process.env.WAVE_BUSINESS_ID;
const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET;

// Configuration CinetPay
const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
const CINETPAY_API_URL = process.env.CINETPAY_API_URL || 'https://api-checkout.cinetpay.com/v2/payment';
const CINETPAY_NOTIFY_URL = process.env.BACKEND_URL + '/api/payment/mobile-money/notify';
const CINETPAY_RETURN_URL = process.env.FRONTEND_URL + '/payment/success';
const CINETPAY_CANCEL_URL = process.env.FRONTEND_URL + '/payment/cancel';

// Fonction pour obtenir un token d'accès PayPal
async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API}/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      data: 'grant_type=client_credentials'
    });
    return response.data.access_token;
  } catch (error) {
    logger.error('Error getting PayPal access token:', error);
    throw new Error('Failed to get PayPal access token');
  }
}

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
        
        // Reste du code existant...
    } catch (error) {
        await transaction.rollback();
        logger.error('Error processing payment:', error);
        return res.status(500).json({ error: 'Payment processing failed' });
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

// Créer une commande PayPal
router.post('/paypal/create-order', auth, async (req, res) => {
  try {
    const { plan_id, amount, currency, duration, billing_address } = req.body;
    
    if (!plan_id || !amount || !currency || !duration) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const accessToken = await getPayPalAccessToken();
    
    const order = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toString()
          },
          description: `Abonnement hébergement - ${duration} mois`
        }
      ],
      application_context: {
        brand_name: 'KaiaC Hosting',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      }
    };

    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API}/v2/checkout/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: order
    });

    // Stocker temporairement les informations de commande (vous pourriez utiliser Redis ou une table temporaire)
    // Pour cet exemple, nous supposons que ces informations seront transmises lors de la capture

    return res.status(200).json({
      id: response.data.id,
      status: response.data.status
    });
  } catch (error) {
    logger.error('Error creating PayPal order:', error);
    return res.status(500).json({ message: 'Failed to create PayPal order' });
  }
});

// Capturer un paiement PayPal
router.post('/paypal/capture-order', auth, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { orderID, plan_id, duration, billing_address } = req.body;
    
    if (!orderID || !plan_id || !duration) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const accessToken = await getPayPalAccessToken();
    
    // Capturer le paiement
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.status !== 'COMPLETED') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Créer l'abonnement, la facture et l'enregistrement de paiement
    // Cette partie dépend de votre logique métier existante
    // Vous devrez adapter cela à votre modèle de données

    // Exemple:
    const subscription = await Subscription.create({
      user_id: req.user.id,
      plan_id: plan_id,
      status: 'active',
      start_date: new Date(),
      end_date: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000), // Approximation
      billing_address: billing_address,
      payment_method: 'paypal'
    }, { transaction });

    // Créer une facture
    const captureDetails = response.data.purchase_units[0].payments.captures[0];
    const amount = parseFloat(captureDetails.amount.value);
    
    const invoice = await Invoice.create({
      user_id: req.user.id,
      subscription_id: subscription.id,
      amount: amount * 0.8, // Exemple: 80% du montant total est le prix hors taxe
      tax_amount: amount * 0.2, // Exemple: 20% de TVA
      tax_rate: 0.2,
      currency: captureDetails.amount.currency_code,
      status: 'paid',
      due_date: new Date(),
      paid_date: new Date()
    }, { transaction });

    // Enregistrer le paiement
    await Payment.create({
      user_id: req.user.id,
      invoice_id: invoice.id,
      amount: amount,
      currency: captureDetails.amount.currency_code,
      payment_method: 'paypal',
      transaction_id: captureDetails.id,
      status: 'completed'
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      subscription_id: subscription.id,
      message: 'Payment successful and subscription activated'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error capturing PayPal payment:', error);
    return res.status(500).json({ message: 'Failed to capture payment' });
  }
});



// Initialiser un paiement Wave
router.post('/wave/initialize', auth, async (req, res) => {
  try {
    const { plan_id, amount, currency, duration, billing_address, customer_name, customer_email } = req.body;
    
    if (!plan_id || !amount || !currency || !duration) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Générer un ID de session unique
    const sessionId = `KAIAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Préparer les données pour Wave
    const payload = {
      amount: parseFloat(amount),
      currency: currency,
      business_id: WAVE_BUSINESS_ID,
      session_id: sessionId,
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      error_url: `${process.env.FRONTEND_URL}/payment/error`,
      webhook_url: `${process.env.BACKEND_URL}/api/payment/wave/webhook`,
      metadata: {
        plan_id: plan_id,
        user_id: req.user.id,
        duration: duration
      }
    };
    
    // Appeler l'API Wave
    const response = await axios({
      method: 'post',
      url: WAVE_API_URL,
      headers: {
        'Authorization': `Bearer ${WAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    // Stocker les informations de paiement dans la base de données
    await Payment.create({
      user_id: req.user.id,
      payment_reference: sessionId,
      amount: amount,
      currency: currency,
      method: 'wave',
      status: 'pending',
      payment_type: 'initial',
      session_id: sessionId,
      wave_checkout_id: response.data.id,
      metadata: {
        plan_id: plan_id,
        duration: duration,
        billing_address: billing_address
      },
      billing_address: billing_address
    });
    
    return res.status(200).json({
      session_id: sessionId,
      payment_url: response.data.payment_url
    });
  } catch (error) {
    logger.error('Error initializing Wave payment:', error);
    return res.status(500).json({ message: 'Failed to initialize payment' });
  }
});

// Vérifier le statut d'un paiement Wave
router.get('/wave/status/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Récupérer le paiement
    const payment = await Payment.findOne({
      where: { session_id: sessionId }
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Vérifier le statut auprès de Wave
    const waveCheckoutId = payment.wave_checkout_id;
    
    const response = await axios({
      method: 'get',
      url: `${WAVE_API_URL}/${waveCheckoutId}`,
      headers: {
        'Authorization': `Bearer ${WAVE_SECRET_KEY}`
      }
    });
    
    if (response.data.status === 'success') {
      // Paiement réussi
      if (payment.status !== 'completed') {
        // Mettre à jour le paiement
        payment.status = 'completed';
        payment.payment_date = new Date();
        await payment.save();
        
        // Créer l'abonnement et la facture
        const metadata = payment.metadata;
        
        // Créer l'abonnement
        const subscription = await Subscription.create({
          user_id: payment.user_id,
          plan_id: metadata.plan_id,
          status: 'active',
          start_date: new Date(),
          end_date: new Date(Date.now() + metadata.duration * 30 * 24 * 60 * 60 * 1000),
          billing_address: metadata.billing_address,
          payment_method: 'wave'
        });
        
        // Mettre à jour le paiement avec l'ID de l'abonnement
        payment.subscription_id = subscription.id;
        await payment.save();
        
        // Créer une facture
        const invoice = await Invoice.create({
          user_id: payment.user_id,
          subscription_id: subscription.id,
          payment_id: payment.id,
          amount: payment.amount * 0.8, // 80% du montant total est le prix hors taxe
          tax_amount: payment.amount * 0.2, // 20% de TVA
          tax_rate: 0.2,
          currency: payment.currency,
          status: 'paid',
          due_date: new Date(),
          paid_date: new Date()
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Payment successful'
      });
    } else if (response.data.status === 'failed') {
      // Paiement échoué
      payment.status = 'failed';
      await payment.save();
      
      return res.status(200).json({
        status: 'failed',
        message: 'Payment failed'
      });
    } else {
      // Paiement en attente
      return res.status(200).json({
        status: 'pending',
        message: 'Payment is still pending'
      });
    }
  } catch (error) {
    logger.error('Error checking Wave payment status:', error);
    return res.status(500).json({ message: 'Failed to check payment status' });
  }
});

// Webhook pour les notifications Wave
router.post('/wave/webhook', async (req, res) => {
  try {
    // Vérifier la signature
    const signature = req.headers['wave-signature'];
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', WAVE_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(403).json({ message: 'Invalid signature' });
    }
    
    const { event, data } = req.body;
    
    if (event === 'checkout.session.complete') {
      // Trouver le paiement
      const payment = await Payment.findOne({
        where: { wave_checkout_id: data.id }
      });
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Mettre à jour le statut
      payment.status = 'completed';
      payment.payment_date = new Date();
      await payment.save();
      
      // Le reste de la logique sera géré par l'endpoint de vérification du statut
    }
    
    // Toujours renvoyer un succès à Wave
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing Wave webhook:', error);
    return res.status(500).json({ message: 'Error processing webhook' });
  }
});
// Initialiser un paiement Mobile Money via CinetPay
router.post('/mobile-money/initialize', auth, async (req, res) => {
  try {
    const { plan_id, amount, currency, duration, billing_address, customer_name, customer_email, customer_phone } = req.body;
    
    if (!plan_id || !amount || !currency || !duration) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Générer un ID de transaction unique
    const transactionId = `KAIAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Préparer les données pour CinetPay
    const paymentData = {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: parseFloat(amount),
      currency: currency,
      channels: 'MOBILE_MONEY',
      description: `Abonnement hébergement - ${duration} mois`,
      customer_name: customer_name,
      customer_email: customer_email,
      customer_phone_number: customer_phone || '',
      customer_address: `${billing_address.address}, ${billing_address.city}, ${billing_address.country}`,
      customer_city: billing_address.city,
      customer_country: billing_address.country,
      customer_state: billing_address.state || '',
      customer_zip_code: billing_address.postal_code || '',
      notify_url: CINETPAY_NOTIFY_URL,
      return_url: CINETPAY_RETURN_URL,
      cancel_url: CINETPAY_CANCEL_URL,
      metadata: JSON.stringify({
        plan_id: plan_id,
        user_id: req.user.id,
        duration: duration
      })
    };
    
    // Appeler l'API CinetPay
    const response = await axios.post(CINETPAY_API_URL, paymentData);
    
    if (response.data.code !== '201') {
      return res.status(400).json({ message: response.data.message || 'Failed to initialize payment' });
    }
    
    // Stocker les informations de paiement dans la base de données
    await Payment.create({
      user_id: req.user.id,
      payment_reference: transactionId,
      amount: amount,
      currency: currency,
      method: 'mobile_money',
      status: 'pending',
      payment_type: 'initial',
      session_id: transactionId,
      metadata: {
        plan_id: plan_id,
        duration: duration,
        billing_address: billing_address,
        cinetpay_payment_token: response.data.data.payment_token
      },
      billing_address: billing_address
    });
    
    return res.status(200).json({
      transaction_id: transactionId,
      payment_url: response.data.data.payment_url
    });
  } catch (error) {
    logger.error('Error initializing CinetPay payment:', error);
    return res.status(500).json({ message: 'Failed to initialize payment' });
  }
});

// Vérifier le statut d'un paiement Mobile Money
router.get('/mobile-money/status/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Récupérer le paiement
    const payment = await Payment.findOne({
      where: { payment_reference: transactionId }
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Vérifier le statut auprès de CinetPay
    const checkData = {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId
    };
    
    const response = await axios.post(`${CINETPAY_API_URL}/check`, checkData);
    
    if (response.data.code === '00') {
      // Paiement réussi
      if (payment.status !== 'completed') {
        // Mettre à jour le paiement
        payment.status = 'completed';
        payment.payment_date = new Date();
        await payment.save();
        
        // Créer l'abonnement et la facture
        const metadata = payment.metadata;
        
        // Créer l'abonnement
        const subscription = await Subscription.create({
          user_id: payment.user_id,
          plan_id: metadata.plan_id,
          status: 'active',
          start_date: new Date(),
          end_date: new Date(Date.now() + metadata.duration * 30 * 24 * 60 * 60 * 1000),
          billing_address: metadata.billing_address,
          payment_method: 'mobile_money'
        });
        
        // Mettre à jour le paiement avec l'ID de l'abonnement
        payment.subscription_id = subscription.id;
        await payment.save();
        
        // Créer une facture
        const invoice = await Invoice.create({
          user_id: payment.user_id,
          subscription_id: subscription.id,
          payment_id: payment.id,
          amount: payment.amount * 0.8, // 80% du montant total est le prix hors taxe
          tax_amount: payment.amount * 0.2, // 20% de TVA
          tax_rate: 0.2,
          currency: payment.currency,
          status: 'paid',
          due_date: new Date(),
          paid_date: new Date()
        });
      }
      
      return res.status(200).json({
        status: 'SUCCESSFUL',
        message: 'Payment successful'
      });
    } else if (response.data.code === '600') {
      // Paiement échoué
      payment.status = 'failed';
      await payment.save();
      
      return res.status(200).json({
        status: 'FAILED',
        message: response.data.message || 'Payment failed'
      });
    } else {
      // Paiement en attente
      return res.status(200).json({
        status: 'PENDING',
        message: 'Payment is still pending'
      });
    }
  } catch (error) {
    logger.error('Error checking CinetPay payment status:', error);
    return res.status(500).json({ message: 'Failed to check payment status' });
  }
});

// Webhook pour les notifications CinetPay
router.post('/mobile-money/notify', async (req, res) => {
  try {
    const { cpm_trans_id, cpm_site_id, cpm_trans_status } = req.body;
    
    // Vérifier que la notification vient bien de CinetPay
    if (cpm_site_id !== CINETPAY_SITE_ID) {
      return res.status(403).json({ message: 'Invalid site ID' });
    }
    
    // Trouver le paiement
    const payment = await Payment.findOne({
      where: { payment_reference: cpm_trans_id }
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Mettre à jour le statut
    if (cpm_trans_status === 'ACCEPTED') {
      payment.status = 'completed';
      payment.payment_date = new Date();
      await payment.save();
      
      // Le reste de la logique sera géré par l'endpoint de vérification du statut
    } else if (cpm_trans_status === 'REFUSED') {
      payment.status = 'failed';
      await payment.save();
    }
    
    // Toujours renvoyer un succès à CinetPay
    return res.status(200).json({ message: 'Notification received' });
  } catch (error) {
    logger.error('Error processing CinetPay notification:', error);
    return res.status(500).json({ message: 'Error processing notification' });
  }
});


module.exports = router;