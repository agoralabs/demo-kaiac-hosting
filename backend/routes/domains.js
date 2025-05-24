const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Domain, Email, Subscription } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../models');
const { Route53DomainsClient, CheckDomainAvailabilityCommand, ListPricesCommand } = require('@aws-sdk/client-route-53-domains');
const { mockCheckDomain, mockRegisterDomain } = require('./mock/mock-domains');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { Route53Client, ChangeResourceRecordSetsCommand, ListHostedZonesByNameCommand } = require('@aws-sdk/client-route-53');
const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const sqs = new SQSClient({ region: process.env.AWS_REGION }); 
const route53 = new Route53Client({ region: process.env.AWS_REGION });

// Configuration Mailcow
const MAILCOW_DOMAIN = process.env.MAILCOW_HOST;
const MAILCOW_HOST = `https://${MAILCOW_DOMAIN}`;
const API_KEY = process.env.MAILCOW_API_KEY;

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

    // function to convert duration_months in years
    function convertDurationMonthsToYears(durationMonths) {
        return durationMonths / 12;
    }

// Enregistrement de domaine
router.post('/register-domain', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user_id = req.user.id;

    const {domainName, subscription_id, domainData} = req.body;

    // find subscription by id include Plan
    const subscription = await Subscription.findOne({
        where: {
          id: subscription_id
        }
    });


    const durationInYears = convertDurationMonthsToYears(subscription.duration_months);

    const mock = true;

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

          const domain = await createDomainRecord(domainName, subscription_id, user_id, contactInfo, durationInYears, domainData);

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

async function createDomainRecord(domainName, subscription_id, user_id, contactInfo, durationInYears, domainData) {
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
        subscription_id: subscription_id,
        category: 'buyed'
    };

    const domain = await Domain.create(domainToCreate);

    if (!domain) {
        throw new Error('Failed to create domain');
    }

    return domain;
}

async function generateDKIM(domain) {
  const response = await retryRequest(
    () => axios.post(
      `${MAILCOW_HOST}/api/v1/add/dkim/${domain}`,
      null,
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    ),
    3,
    5000
  );

  console.log(`DKIM generated for domain "${domain}"`, response.data);
  return response;
}

async function getDKIM(domain) {
  const response = await retryRequest(
    () => axios.get(
      `${MAILCOW_HOST}/api/v1/get/dkim/${domain}`,
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    ),
    3,
    5000
  );

  const dkimRecord = response.data.dkim_txt;
  console.log(`DKIM record for "${domain}":`, dkimRecord);
  return dkimRecord;
}

function chunkString(str, size) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.substring(i, i + size));
  }
  return chunks;
}

async function getHostedZoneId(domain) {
  const command = new ListHostedZonesByNameCommand({
    DNSName: domain
  });
  
  const response = await route53.send(command);
  if (!response.HostedZones || response.HostedZones.length === 0) {
    throw new Error(`No hosted zone found for domain: ${domain}`);
  }
  
  const zoneId = response.HostedZones[0].Id.split('/').pop();
  console.log(`Found hosted zone ID for "${domain}":`, zoneId);
  return zoneId;
}

function chunkString(str, size) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.substring(i, i + size));
  }
  return chunks;
}

async function retryRequest(requestFn, attempts, delayMs) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.log(`Attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

function getDNSRecordChanges(domain, mailHostname, dkimChunks, action) {
  if (!['CREATE', 'DELETE'].includes(action)) {
    throw new Error(`Invalid action: ${action}. Must be CREATE or DELETE`);
  }

  const changes = [
    // MX Record
    {
      Action: action === 'CREATE' ? 'UPSERT' : 'DELETE',
      ResourceRecordSet: {
        Name: domain,
        Type: "MX",
        TTL: 3600,
        ResourceRecords: [{ Value: `10 ${mailHostname}.` }]
      }
    },
    // Autodiscover CNAME
    {
      Action: action === 'CREATE' ? 'UPSERT' : 'DELETE',
      ResourceRecordSet: {
        Name: `autodiscover.${domain}`,
        Type: "CNAME",
        TTL: 3600,
        ResourceRecords: [{ Value: mailHostname }]
      }
    },
    // Autoconfig CNAME
    {
      Action: action === 'CREATE' ? 'UPSERT' : 'DELETE',
      ResourceRecordSet: {
        Name: `autoconfig.${domain}`,
        Type: "CNAME",
        TTL: 3600,
        ResourceRecords: [{ Value: mailHostname }]
      }
    },
    // SPF TXT
    {
      Action: action === 'CREATE' ? 'UPSERT' : 'DELETE',
      ResourceRecordSet: {
        Name: domain,
        Type: "TXT",
        TTL: 3600,
        ResourceRecords: [{ Value: `"v=spf1 mx a:${mailHostname} -all"` }]
      }
    },
    // DKIM TXT
    {
      Action: action === 'CREATE' ? 'UPSERT' : 'DELETE',
      ResourceRecordSet: {
        Name: `dkim._domainkey.${domain}`,
        Type: "TXT",
        TTL: 3600,
        ResourceRecords: dkimChunks.map(chunk => ({ Value: `"${chunk}"` }))
      }
    },
    // DMARC TXT
    {
      Action: action === 'CREATE' ? 'UPSERT' : 'DELETE',
      ResourceRecordSet: {
        Name: `_dmarc.${domain}`,
        Type: "TXT",
        TTL: 3600,
        ResourceRecords: [{ Value: `"v=DMARC1; p=none; rua=mailto:postmaster@${domain}"` }]
      }
    },
    // SRV Record
    {
      Action: action === 'CREATE' ? 'UPSERT' : 'DELETE',
      ResourceRecordSet: {
        Name: `_autodiscover._tcp.${domain}`,
        Type: "SRV",
        TTL: 3600,
        ResourceRecords: [{ Value: `10 10 443 ${mailHostname}.` }]
      }
    }
  ];

  return changes;
}

// Fonctions pour la création du domaine mailcow
async function createMailcowDomain(domain) {

  const response = await retryRequest(
    () => axios.post(
      `${MAILCOW_HOST}/api/v1/add/domain`,
      { 
        domain,
        description: "Créé via AWS Lambda"
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        }
      }
    ),
    3,
    5000
  );

  console.log(`Domain "${domain}" created in Mailcow`, response.data);
  return response;
}

// Fonctions pour la suppression
async function deleteMailcowDomain(domain) {
  const response = await retryRequest(
    () => axios.post(
      `${MAILCOW_HOST}/api/v1/delete/domain`,
      { domain: domain }, // Corps de la requête avec l'attribut domain
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json' // Important
        }
      }
    ),
    3,
    5000
  );

  console.log(`Domain "${domain}" deleted from Mailcow`, response.data);
  return response;
}

async function createDNSRecords(domain, dkimRecord) {
  const zoneId = await getHostedZoneId(domain);
  const mailHostname = process.env.MAILCOW_HOST;
  
  const dkimChunks = chunkString(dkimRecord, 255);

  const params = {
    ChangeBatch: {
      Changes: getDNSRecordChanges(domain, mailHostname, dkimChunks, 'CREATE')
    },
    HostedZoneId: zoneId
  };

  const command = new ChangeResourceRecordSetsCommand(params);
  const response = await route53.send(command);
  console.log(`DNS records created for "${domain}"`, response);
  return response;
}

async function createDNSRecords(domain, dkimRecord) {
  const zoneId = await getHostedZoneId(domain);
  
  const dkimChunks = chunkString(dkimRecord, 255);

  const params = {
    ChangeBatch: {
      Changes: getDNSRecordChanges(domain, MAILCOW_DOMAIN, dkimChunks, 'CREATE')
    },
    HostedZoneId: zoneId
  };

  const command = new ChangeResourceRecordSetsCommand(params);
  const response = await route53.send(command);
  console.log(`DNS records created for "${domain}"`, response);
  return response;
}

async function deleteDNSRecords(domain, dkimRecord) {
  const zoneId = await getHostedZoneId(domain);
  
  const dkimChunks = chunkString(dkimRecord, 255);

  const params = {
    ChangeBatch: {
      Changes: getDNSRecordChanges(domain, MAILCOW_DOMAIN, dkimChunks, 'DELETE')
    },
    HostedZoneId: zoneId
  };

  const command = new ChangeResourceRecordSetsCommand(params);
  const response = await route53.send(command);
  console.log(`DNS records deleted for "${domain}"`, response);
  return response;
}

// create a mailcow domain
router.post('/toggle-emails-activation', auth, async (req, res) => {
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
        where: { domain_name: domain}
      });

      if (!domainRecord) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      if(!domainRecord.is_emails_domain){
        // 1. Création du domaine dans Mailcow
        await createMailcowDomain(domain);
        
        // 2. Génération du DKIM
        await generateDKIM(domain);
        
        // 3. Récupération du DKIM
        const dkimRecord = await getDKIM(domain);

        domainRecord.dkim = dkimRecord;
        domainRecord.is_emails_domain = true;

        // Si c'est un domaine acheté géré par kaiac
        if(domainRecord.category == 'buyed'){
          await createDNSRecords(domain, dkimRecord);
        }
      }else{
        // 1. Suppression du domaine Mailcow
        await deleteMailcowDomain(domain);

        // Si c'est un domaine acheté géré par kaiac
        if(domainRecord.category == 'buyed'){
          await deleteDNSRecords(domain, domainRecord.dkim);
        }

        domainRecord.dkim = null;
        domainRecord.is_emails_domain = false;
      }

      await domainRecord.save();

      res.status(201).json({
        success: true,
        message: 'Mailcow Domain activation request queued successfully',
        data : domainRecord
      });
  
    } catch (error) {
      logger.error('Error queuing Mailcow Domain activation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

// get mailcow dns informations
router.get('/get-dns-info/:id', auth, async (req, res) => {
    try {
        if (!req.user) {
            logger.error('No user found in request');
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = req.user.id;
        logger.info(`req.user.id=${userId}`);

        const domain_id = req.params.id;
        if (!domain_id) {
            return res.status(400).json({ error: 'Domain is required' });
        }

        const domainRecord = await Domain.findOne({
            where: { id: domain_id }
        });

        if (!domainRecord) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        const mxDomain = MAILCOW_DOMAIN;
        const domain = domainRecord.domain_name;
        const dkim = domainRecord.dkim;
        const dnsInfo = `${domain}	IN	MX	10 ${mxDomain}.
autodiscover.${domain}	IN	CNAME	${mxDomain}
_autodiscover._tcp.${domain}	IN	SRV	10 10 443 ${mxDomain}.
autoconfig.${domain}	IN	CNAME	${mxDomain}
${domain}	IN	TXT	"v=spf1 mx a:${mxDomain} -all"
_dmarc.${domain}	IN	TXT	"v=DMARC1;p=none;rua=mailto:postmaster@${domain}"
dkim._domainkey.${domain}	IN	TXT	"${dkim}"
`;

        res.status(200).json({
            success: true,
            message: 'DNS information retrieved successfully',
            data: dnsInfo
        });

    } catch (error) {
        logger.error('Error retrieving DNS information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// capitalize first letter
function capitalizeWord(word) {
  if (!word) return word; // Gestion des valeurs nulles/vides
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Fonctions pour la création de l'adresse mail
async function createMailcowMailbox(domain, localPart, mailboxPwd) {

  if (!domain || !localPart || !mailboxPwd) {
    throw new Error('Missing required parameters');
  }

  try {    

    const email = `${localPart}@${domain}`;

    const payload = {
      local_part: localPart,
      domain: domain,
      password: mailboxPwd,
      password2: mailboxPwd,
      name: capitalizeWord(localPart),
      quota: 3072, // 3GB en MB
      active: '1', // 1 pour actif, 0 pour inactif
      force_pw_update: '1', // Force le changement de mot de passe
      tls_enforce_in: '1', // Force TLS entrant
      tls_enforce_out: '1', // Force TLS sortant
      description: "Créé via AWS Lambda"
    };
  
    const response = await retryRequest(
      () => axios.post(
        `${MAILCOW_HOST}/api/v1/add/mailbox`,
        payload,
        {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json',
          }
        }
      ),
      3,
      5000
    );
  
    console.log(`Email ${email} created successfully`, response.data);
  
    return response;

  } catch (error) {
    console.error('Error creating mailbox:', error.response?.data || error.message);
    
    return {
        statusCode: error.response?.status || 500,
        body: JSON.stringify({
            success: false,
            error: error.response?.data || error.message
        })
    };
  }

}

// create a mailbox mailcow
router.post('/create-mailcow-mailbox', auth, async (req, res) => {
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

    await createMailcowMailbox(domain, local_part, password);

    const emailAccount = await Email.create({
      user_id: userId,
      address: `${local_part}@${domain}`,
      password_hash: password,
      domain_id: domain_id,
      subscription_id: subscription_id,
      is_active: true,
      is_updating_email: false
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

// Fonctions pour la suppression de l'adresse email
async function deleteMailcowMailbox(domain, localPart) {

  if (!domain || !localPart) {
    throw new Error('Missing required parameters');
  }

  try {
    const email = `${localPart}@${domain}`;

    const response = await retryRequest(
      () => axios.post(
        `${MAILCOW_HOST}/api/v1/delete/mailbox`,
        { email }, // Corps de la requête avec l'attribut domain
        {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json' // Important
          }
        }
      ),
      3,
      5000
    );
  
    console.log(`Email ${email} deleted successfully`, response.data);

    return response;

  } catch (error) {
    console.error('Error deleting mailbox:', error.response?.data || error.message);
    
    // Gestion spécifique des erreurs 404 (email non trouvé)
    if (error.response?.status === 404) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Email ${email} was already deleted or doesn't exist`
            })
        };
    }
    
    return {
        statusCode: error.response?.status || 500,
        body: JSON.stringify({
            success: false,
            error: error.response?.data || error.message
        })
    };
  } 

}

// delete a mailcow mailbox
router.delete('/delete-mailcow-mailbox/:id', auth, async (req, res) => {
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

    await deleteMailcowMailbox(domain, localPart);

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