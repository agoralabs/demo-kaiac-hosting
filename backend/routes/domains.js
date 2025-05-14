const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Domain, Email } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../models');
const { Route53DomainsClient, CheckDomainAvailabilityCommand, ListPricesCommand } = require('@aws-sdk/client-route-53-domains');
const { mockCheckDomain, mockRegisterDomain } = require('./mock/mock-domains');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const dotenv = require('dotenv');
dotenv.config();

const sqs = new SQSClient({ region: process.env.AWS_REGION }); 


// Vérification de disponibilité
router.post('/check', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { domainName, mock } = req.body;

    const existingDomain = await Domain.findOne({
        where: { domain_name: domainName }
      });

    if (existingDomain) {
        const result = {
                available: false,
                reason: 'already_registered',
                registeredData: {
                    userId: existingDomain.user_id,
                    status: existingDomain.status,
                    expiresAt: existingDomain.expires_at
                  },
                fromDatabase: true
            };
        return res.status(200).json(result);
    }

    

    if (mock) {
        try {
          const result = mockCheckDomain(domainName);
          return res.status(200).json(result);
        } catch (error) {
          return res.status(500).json({ error: 'Mock error' });
        }
    }

    const client = new Route53DomainsClient({
        region: 'us-east-1', // Route53 Domains est seulement disponible dans us-east-1
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    const availabilityCommand = new CheckDomainAvailabilityCommand({
        DomainName: domainName,
        CheckAvailabilityFilter: {
            Valid: true,
            Available: true,
        },
    });

    // Récupération des prix
    const pricesCommand = new ListPricesCommand({
        Tld: domainName.split('.').pop() // Extrait le TLD (.com, .fr, etc.)
    });

    const [availabilityResponse, pricesResponse] = await Promise.all([
        client.send(availabilityCommand),
        client.send(pricesCommand)
    ]);

    const tld = domainName.split('.').pop();
    const priceInEur = await getDomainPriceInEur(pricesResponse, tld);
    

    res.status(200).json({
        available: availabilityResponse.Availability === 'AVAILABLE',
        prices: priceInEur
    });

  } catch (error) {
    console.error('Error checking domain:', error);
    res.status(500).json({ error: 'Error checking domain availability' });
  }
});

/**
 * Convertit un prix USD en EUR
 * @param {number} usdPrice - Prix en dollars USD
 * @param {number} [exchangeRate=0.92] - Taux de change USD->EUR (0.92 par défaut, valeur moyenne 2023)
 * @returns {number} Prix converti en euros
 */
function convertUsdToEur(usdPrice, exchangeRate = 0.92) {
    if (isNaN(usdPrice)) {
      console.error("Le prix fourni n'est pas un nombre valide");
      return 0;
    }
    return parseFloat((usdPrice * exchangeRate).toFixed(2));
  }

function getDomainPrice(pricesResponse, tld) {
    try {
      const tldLower = tld.toLowerCase();
      const priceEntry = pricesResponse.Prices.find(price => 
        price.Name.toLowerCase() === tldLower
      );
      
      return {
        registration: priceEntry?.RegistrationPrice?.Price || 0,
        renewal: priceEntry?.RenewalPrice?.Price || 0,
        transfer: priceEntry?.TransferPrice?.Price || 0,
        currency: priceEntry?.RegistrationPrice?.Currency || 'USD'
      };
    } catch (error) {
      console.error("Error getting domain price:", error);
      return {
        registration: 0,
        renewal: 0,
        transfer: 0,
        currency: 'USD'
      };
    }
}

async function getDomainPriceInEur(pricesResponse, tld) {
    try {

        const priceInfo = getDomainPrice(pricesResponse, tld);
      
      // 2. Récupérer le taux de change actuel (optionnel)
      // let exchangeRate = 0.92; // Valeur statique
      let exchangeRate = await getCurrentExchangeRate(); // Voir fonction ci-dessous
      
      // 3. Convertir
      return {
        registration: convertUsdToEur(priceInfo.registration, exchangeRate),
        renewal: convertUsdToEur(priceInfo.renewal, exchangeRate),
        transfer: convertUsdToEur(priceInfo.transfer, exchangeRate),
        currency: "EUR",
        exchange_rate: exchangeRate,
        last_updated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error("Erreur de conversion:", error);
      return { error: "Conversion impossible" };
    }
  }
  

async function getCurrentExchangeRate() {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      return data.rates.EUR || 0.92; // Fallback si l'API échoue
      
      // Alternative gratuite:
      // const response = await fetch('https://api.exchangerate.host/latest?base=USD');
      // const data = await response.json();
      // return data.rates.EUR;
    } catch {
      return 0.92; // Valeur par défaut si l'API échoue
    }
}

// Enregistrement de domaine
router.post('/register', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user_id = req.user.id;

    const { domainName, durationInYears, domainData, mock } = req.body;

    const contactInfo = {
        FirstName: 'Joseph',
        LastName: 'EKOBO KIDOU',
        Email: 'secobo@yahoo.com',
        PhoneNumber: '0624873333',
        AddressLine1: '3 ALLEE LOUISE BOURGEOIS',
        City: 'CLAMART',
        State: 'HAUTS DE SEINE',
        CountryCode: 'FR',
        ZipCode: '92140'
    };

    if (mock) {
        try {
          const result = mockRegisterDomain(domainName, contactInfo, durationInYears);

          const domain = await createDomainRecord(domainName, user_id, contactInfo, durationInYears, domainData);

          return res.status(200).json({ 
                domainName: domain.domain_name,
                operationId: result.OperationId 
            });
        } catch (error) {
            logger.error('Mock error:', error);
          return res.status(500).json({ 
            error: 'Mock error',
            details: error
        });
        }
    }

    const client = new Route53DomainsClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const command = new RegisterDomainCommand({
        DomainName: domainName,
        DurationInYears: durationInYears || 1,
        AdminContact: contactInfo,
        RegistrantContact: contactInfo,
        TechContact: contactInfo,
        PrivacyProtectAdminContact: true,
        PrivacyProtectRegistrantContact: true,
        PrivacyProtectTechContact: true,
        AutoRenew: true,
      });
  
    const response = await client.send(command);

    const domain = await createDomainRecord(domainName, user_id, contactInfo, durationInYears, domainData);

    res.status(200).json({ 
        domainName: domain.domain_name,
        operationId: response.OperationId 
    });

  } catch (error) {
    logger.error('Error registering domain:', error);
    res.status(500).json({ error: 'Error registering domain' });
  }
});


async function createDomainRecord(domainName, user_id, contactInfo, durationInYears, domainData) {
    const domainToCreate = {
        domain_name: domainName,
        user_id: user_id,
        firstname: contactInfo.FirstName,
        lastname: contactInfo.LastName,
        email: contactInfo.Email,
        phone: contactInfo.PhoneNumber,
        street: contactInfo.AddressLine1,
        city: contactInfo.City,
        region: contactInfo.State,
        postal_code: contactInfo.ZipCode,
        yearly_price: domainData.price, //TODO
        duration: durationInYears, 
        category: 'buyed'
    };

    const domain = await Domain.create(domainToCreate);

    if (!domain) {
        throw new Error('Failed to create domain');
    }

    return domain;
}

// create a mailcow domain
router.post('/activate-emails', auth, async (req, res) => {
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
  
      const domainRecord = await Domain.findOne({
        where: { domain_name: domain,
          is_route53_domain: true
        }
      });

      if (!domainRecord) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      const queueUrl = process.env.EMAIL_DOMAIN_CREATION_QUEUE_URL;
      const messageBody = JSON.stringify({
        userId,
        domain,
        command: 'CREATE_DOMAIN', // Ajout du domaine
        requestedAt: new Date().toISOString()
      });
  
      const params = {
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        MessageGroupId: 'domain-creation', // obligatoire pour les FIFO queues
        MessageDeduplicationId: `${userId}-${domain}-${Date.now()}` // unique à chaque envoi
      };
  
      const command = new SendMessageCommand(params);
      await sqs.send(command);

      domainRecord.is_emails_domain = true;
      domainRecord.is_updating_email = true;
      await domainRecord.save();

      res.status(201).json({
        success: true,
        message: 'Domain creation request queued successfully',
        data : domainRecord
      });
  
    } catch (error) {
      logger.error('Error queuing domain creation:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
});
  
// delete a mailcow domain
router.post('/deactivate-emails', auth, async (req, res) => {
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

        const domainRecord = await Domain.findOne({
            where: {
                domain_name: domain,
                is_route53_domain: true
            }
        });

        if (!domainRecord) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        const queueUrl = process.env.EMAIL_DOMAIN_CREATION_QUEUE_URL;
        const messageBody = JSON.stringify({
            userId,
            domain,
            command: 'DELETE_DOMAIN', // Commande DELETE_DOMAIN pour la désactivation
            requestedAt: new Date().toISOString()
        });

        const params = {
            QueueUrl: queueUrl,
            MessageBody: messageBody,
            MessageGroupId: 'domain-deletion', // Groupe différent pour la suppression
            MessageDeduplicationId: `${userId}-${domain}-${Date.now()}`
        };

        const command = new SendMessageCommand(params);
        await sqs.send(command);

        domainRecord.is_emails_domain = false; // Mise à jour du statut
        domainRecord.is_updating_email = true;
        await domainRecord.save();

        res.status(200).json({
            success: true,
            message: 'Domain email deactivation request queued successfully',
            data: domainRecord
        });

    } catch (error) {
        logger.error('Error queuing domain email deactivation:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// create a mailbox
router.post('/create-mailbox', auth, async (req, res) => {
  try {
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    logger.info(`req.user.id=${userId}`);

    const { local_part, password, domain_id, subscription_id } = req.body;

    const domainRecord = await Domain.findOne({
      where: {
        id: domain_id,
        is_route53_domain: true
      }
    });
    
    if (!domainRecord) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const domain = domainRecord.domain_name;
    const queueUrl = process.env.EMAIL_DOMAIN_CREATION_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      domain,
      command: 'CREATE_MAILBOX', // Ajout de la boite mail
      localPart: local_part,
      mailboxPwd: password,
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'domain-creation', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${domain}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    const emailAccount = await Email.create({
      user_id: userId,
      address: `${local_part}@${domain}`,
      password_hash: password,
      domain_id: domain_id,
      subscription_id: subscription_id,
      is_active: true,
      is_updating_email: true
    });

    res.status(201).json({
      success: true,
      message: 'Email created successfully',
      data: emailAccount
    });

  } catch (error) {
    logger.error('Error queuing domain creation:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// delete a mailbox
router.delete('/delete-mailbox/:id', auth, async (req, res) => {
  try {
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

    // split mail address
    const [localPart, domainName] = email.address.split('@');

    const domain = domainName;
    const queueUrl = process.env.EMAIL_DOMAIN_CREATION_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      domain,
      command: 'DELETE_MAILBOX', // Ajout de la boite mail
      localPart: localPart,
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'domain-creation', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${domain}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    await email.destroy();

    res.json({
      success: true,
      message: 'Email deleted successfully'
    });

  } catch (error) {
    logger.error('Error queuing domain creation:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// post is_updating_email to false using domain name as parameter
router.post('/update-is-updating-email', auth, async (req, res) => {
    try {
        const domainName = req.body.domain;
        const domain = await Domain.findOne({
            where: {
                domain_name: domainName,
                is_route53_domain: true
            }
        });

        if (!domain) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        domain.is_updating_email = false;
        await domain.save();

        res.status(200).json({
            success: true,
            message: 'is_updating_email updated successfully',
            data: domain
        });

    } catch (error) {
        logger.error('Error updating is_updating_email:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/update-is-updating-email-address', auth, async (req, res) => {
  try {
      const emailAddress = req.body.address;
      const email = await Email.findOne({
          where: {
            address: emailAddress
          }
      });

      if (!email) {
          return res.status(404).json({ error: 'Email not found' });
      }

      email.is_updating_email = false;
      await email.save();

      res.status(200).json({
          success: true,
          message: 'is_updating_email updated successfully',
          data: email
      });

  } catch (error) {
      logger.error('Error updating is_updating_email:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// post declare domain
router.post('/declare', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { domainName, expiresAt, isAwsDomain, awsAccessKeyId, awsSecretAccessKey } = req.body;

    // format expiresAt
    const expiresAtDate = new Date(expiresAt);

    const domain = await Domain.create({
      user_id: userId,
      domain_name: domainName,
      expires_at: expiresAtDate,
      is_route53_domain: isAwsDomain,
      aws_access_key_id: awsAccessKeyId,
      aws_secret_access_key: awsSecretAccessKey,
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

// add system domain
router.post('/declare', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const domainName = req.body;

    const domain = await Domain.create({
      user_id: userId,
      domain_name: domainName,
      category: 'system'
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

module.exports = router;