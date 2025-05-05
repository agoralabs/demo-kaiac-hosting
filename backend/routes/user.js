const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { 
  Plan, 
  User, 
  Order, 
  OrderItem, 
  Subscription, 
  Website, 
  Domain, 
  Email,
  Payment,
  Invoice } = require('../models');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const axios = require('axios');

router.get('/profile', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id; // Assuming auth middleware sets this
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!user) {
      logger.error(`No user found with ID ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fect user profile' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {

    const { firstname, lastname, email, currentPassword, newPassword } = req.body;

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id; // Assuming auth middleware sets this
    const user = await User.findByPk(userId);
    if (!user) {
      logger.error(`No user found with ID ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstname && firstname.length < 2) {
      return res.status(400).json({ error: 'The firstname has at least 2 chars' });
    }

    // Mise à jour des informations de base
    const updates = {};
    if (firstname) updates.firstname = firstname;
    if (lastname) updates.lastname = lastname;
    if (email) updates.email = email;

    // Check password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (newPassword) updates.password = newPassword;

    // Vérification de l'unicité de l'email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'This mail is already used' });
      }
    }

    // Mise à jour de l'utilisateur
    await user.update(updates);

    // Renvoyer les données mises à jour (sans le mot de passe)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      message: 'User profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('User profile update error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// user subscriptions
router.get('/subscriptions', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id; // Assuming auth middleware sets this

    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Plan,
          attributes: ['id', 'name', 'plan_type', 'price_1_month', 'price_12_months', 'price_24_months', 'included_sites', 'included_storage_mb', 'included_emails', 'included_domains']
        }
      ]
    });
    res.json({
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: subscriptions
  });

  } catch (error) {
    console.error('User Subscriptions fecth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users subscriptions'
  });
  }
});

// souscriptions de type hosting
router.get('/subscriptions/:subtype', auth, async (req, res) => {
  try {
    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id;
    const subType = req.params.subtype;

    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Plan,
          where: { plan_type: subType }, // Filtre pour ne inclure que les plans de type hosting
          attributes: ['id', 'name', 'plan_type', 'price_1_month', 'price_12_months', 'price_24_months', 
                      'price_60_months', 'price_60_months', 'included_domains',
                      'included_sites', 'included_storage_mb', 'included_emails', 'included_domains']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Hosting subscriptions retrieved successfully',
      data: subscriptions
    });

  } catch (error) {
    console.error('Hosting Subscriptions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hosting subscriptions'
    });
  }
});


router.get('/websites', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    // include Domain
    const websites = await Website.findAll({
      where: {
        user_id: userId
      },
      include: [{
        model: Domain
      },
      {
        model: Subscription,
        include: [{
          model: Plan,
          attributes: ['name']
        }]
      }]
    });

    res.json({
      success: true,
      message: 'Hosting websites retrieved successfully',
      data: websites
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/domains', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const domains = await Domain.findAll({
      where: {
        user_id: userId,
        status: 'active'
      }
    });

    res.json({
      success: true,
      message: 'Hosting domains retrieved successfully',
      data: domains
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get domains is_emails_domain true 
router.get('/domains/emails-activated', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const domains = await Domain.findAll({
      where: {
        user_id: userId,
        status: 'active',
        is_emails_domain: true
      }
    });

    res.json({
      success: true,
      message: 'Hosting domains retrieved successfully',
      data: domains
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/domains/:id/websites', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const domainId = req.params.id;
    const websites = await Website.findAll({
      where: {
        user_id: userId,
        domain_id: domainId
      }
    });

    res.json({
      success: true,
      message: 'Hosting websites retrieved successfully',
      data: websites
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// post create domain
router.post('/domains', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { domain_name, expires_at } = req.body;

    // format expires_at
    const expiresAtDate = new Date(expires_at);

    const domain = await Domain.create({
      user_id: userId,
      domain_name: domain_name,
      expires_at: expiresAtDate,
      category: 'declared'
    });

    res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      data: domain
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//delete domain by id
router.delete('/domains/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const domainId = req.params.id;

    const domain = await Domain.findOne({
      where: {
        id: domainId,
        user_id: userId
      }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    await domain.destroy();

    res.json({
      success: true,
      message: 'Domain deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// user create websites
router.post('/websites', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { name, subdomain, domain_id, subscription_id } = req.body;

    const domain = await Domain.findOne({
      where: {
        id: domain_id
      }
    });

    const website = await Website.create({
      user_id: userId,
      name: name,
      record: subdomain,
      domain_id: domain_id,
      subscription_id: subscription_id
    });

    res.status(201).json({
      success: true,
      message: 'Website created successfully',
      data: website
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/websites', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id; // Assuming auth middleware sets this

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: userId };
    if (status) whereClause.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Plan,
            attributes: ['id', 'name', 'billing_cycle']
          }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true // Important pour le count avec des includes
    });

    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      orders
    });

  } catch (error) {
    console.error('User Orders fecth error:', error);
    res.status(500).json({ error: 'Failed to fetch users orders' });
  }
});

// delete websites by id
router.delete('/websites/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const websiteId = req.params.id;

    const website = await Website.findOne({
      where: {
        id: websiteId,
        user_id: userId
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    await website.destroy();

    res.json({
      success: true,
      message: 'Website deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// create email
router.post('/emails', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { local_part, password, domain_id, subscription_id } = req.body;

    const domain = await Domain.findOne({
      where: {
        id: domain_id
      }
    });

    const emailAccount = await Email.create({
      user_id: userId,
      address: `${local_part}@${domain.domain_name}`,
      password_hash: password,
      domain_id: domain_id,
      subscription_id: subscription_id
    });

    res.status(201).json({
      success: true,
      message: 'Email created successfully',
      data: emailAccount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get emails
router.get('/emails', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const emails = await Email.findAll({
      where: {
        user_id: userId
      },
      include: [{
        model: Domain,
        attributes: ['domain_name']
      }]
    });

    res.json({
      success: true,
      message: 'Emails retrieved successfully',
      data: emails
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//delete email by id
router.delete('/emails/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const emailId = req.params.id;

    const email = await Email.findOne({
      where: {
        id: emailId,
        user_id: userId
      }
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    await email.destroy();

    res.json({
      success: true,
      message: 'Email deleted successfully'
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get user payments
router.get('/payments', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const offset = (page - 1) * perPage;

    const userId = req.user.id;

    const { count, rows } = await Payment.findAndCountAll({
      where: { user_id: userId },
      limit: perPage,
      offset: offset,
      order: [['payment_date', 'DESC']]
    });



    res.json({
      success: true,
      message: 'Payments retrieved successfully',
      data: rows,
      meta: {
        total: count,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(count / perPage)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//get user invoices
router.get('/invoices', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const offset = (page - 1) * perPage;

    const userId = req.user.id;

    const { count, rows } = await Invoice.findAndCountAll({
      where: { user_id: userId },
      limit: perPage,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: rows,
      meta: {
        total: count,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(count / perPage)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Récupérer les domaines expirant dans les 30 jours
const getExpiringDomainsCount = async (userId) => {
  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);

  return await Domain.count({
    where: {
      user_id: userId,
      expires_at: {
        [Op.between]: [today, in30Days] // Entre aujourd'hui et dans 30 jours
      }
    }
  });
};

// get user dashboard-stats {
  //   hosting: 0,
  //   domains: 0,
  //   emails: 0,
  //   invoices: 0,
  //   activeHosting: 0,
  //   expiringDomains: 0,
  //   unpaidInvoices: 0
  // }
// }
router.get('/dashboard-stats', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;

    const hosting = await Website.count({ where: { user_id: userId } });
    const domains = await Domain.count({ where: { user_id: userId } });
    const emails = await Email.count({ where: { user_id: userId } });
    const invoices = await Invoice.count({ where: { user_id: userId } });
    const activeHosting = await Website.count({ where: { user_id: userId, is_active: true } });
    const expiringDomains = await Domain.count({ where: { user_id: userId, expires_at: { [Op.lt]: new Date() } } });
    const unpaidInvoices = await Invoice.count({ where: { user_id: userId, status: 'unpaid' } });

    const stats = {
      hosting: await Website.count({ where: { user_id: userId } }),
      domains: await Domain.count({ where: { user_id: userId } }),
      emails: await Email.count({ where: { user_id: userId } }),
      invoices: await Invoice.count({ where: { user_id: userId } }),
      activeHosting: await Website.count({ 
        where: { 
          user_id: userId,
          is_active: true
        } 
      }),
      expiringDomains: await getExpiringDomainsCount(userId),
      unpaidInvoices: await Invoice.count({
        where: {
          user_id: userId,
          status: 'unpaid'
        }
      })
    };

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        hosting,
        domains,
        emails,
        invoices,
        activeHosting,
        expiringDomains,
        unpaidInvoices
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// create mailcow domain with post 
// DOMAIN="$1"
// MAILCOW_HOST="https://mail.skyscaledev.com"
// API_KEY="C28D4F-2ABA7C-D8581D-EDCC97-11692B"

// curl -X POST \
//   -H "X-API-Key: $API_KEY" \
//   -H "Content-Type: application/json" \
//   -d "{\"domain\": \"$DOMAIN\"}" \
//   "$MAILCOW_HOST/api/v1/add/domain"

router.post('/domains/create', auth, async (req, res) => {
  try {
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    logger.info(`req.user.id=${userId}`);

    const domain = req.body.domain;
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const MAILCOW_HOST = `https://${process.env.MAILCOW_HOST}`;
    const API_KEY = process.env.MAILCOW_API_KEY;
    
    const response = await axios.post(
      `${MAILCOW_HOST}/api/v1/add/domain`,
      { domain: domain },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      data: response.data
    });

  } catch (error) {
    logger.error('Error creating domain:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;