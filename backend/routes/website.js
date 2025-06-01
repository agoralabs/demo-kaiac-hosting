const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Domain, Website, Subscription, Plan, Backup, BackupSettings, RedirectRule } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../models');
const { Route53DomainsClient, CheckDomainAvailabilityCommand, ListPricesCommand } = require('@aws-sdk/client-route-53-domains');
const { mockCheckDomain, mockRegisterDomain } = require('./mock/mock-domains');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { uploadToS3Content, uploadToS3JsonObject } = require('../services/fileUpload');
const AWS = require('aws-sdk');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { SSMClient, GetParameterCommand, PutParameterCommand, SendCommandCommand, GetCommandInvocationCommand } = require("@aws-sdk/client-ssm");
const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const ssmClient = new SSMClient({ region: process.env.AWS_REGION,
  maxAttempts: 3, // Active le retry automatique du SDK
});

dotenv.config();

const sqs = new SQSClient({ region: process.env.AWS_REGION }); 

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// get all websites
router.get('/all', auth, async (req, res) => {
  try {
    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;

    const websites = await Website.findAll({
      where: {
        user_id: userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Websites fetched successfully',
      data: websites
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 

// get all websites by subscription_id
router.get('/', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.query.subscription_id) {
      return res.status(400).json({ error: 'Missing subscription_id parameter' });
    }

    const websites = await Website.findAll({
      where: {
        subscription_id: req.query.subscription_id
      }
    });
    res.json(websites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function domainToUnderscoreFormat(domain) {
  // Remplacer tous les points par des underscores
  return domain.replace(/\./g, '_');
}

function truncateToLength(str, maxLength) {
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

function sftpTruncate(str) {
  return truncateToLength(str,20);
}

// Deploy Wordpress Website OpenLiteSpeed,
router.post('/deploy-wordpress', auth, upload.fields([
  { name: 'wordpress_zip', maxCount: 1 },
  { name: 'database_dump', maxCount: 1 }
]), async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;

    const { 
      name,
      environment,
      subdomain, 
      domain_id, 
      subscription_id, 
      wordpress_version,
      installation_method,
      git_repo_url,
      git_branch,
      git_username,
      git_token,
      wp_source_domain } = req.body;

    const existingDomain = await Domain.findOne({
      where: {
        id: domain_id
      }
    });

    // 4. Vérification des doublons de sous domaine
    const existingWebsite = await Website.findOne({
      where: { 
        record : subdomain
      },
      include: [{
        model: Domain,
        where: { domain_name: existingDomain.domain_name }
      }]
    });

    if (existingWebsite) {
        return res.status(409).json({
          success: false,
          message: 'Domain already exists for this subscription'
        });
    }

    // Vérifier si des fichiers ont été uploadés (pour la méthode zip_and_sql)
    let wordpressZipUrl = null;
    let databaseDumpUrl = null;
    if (req.body.installation_method === 'zip_and_sql') {
      if (!req.files['wordpress_zip'] || !req.files['database_dump']) {
        return res.status(400).json({ error: 'Both WordPress ZIP and SQL dump are required' });
      }

      // Générer des noms de fichiers uniques
      const timestamp = Date.now();
      const wpZipKey = `wordpress-deployments/${userId}/${timestamp}-wordpress.zip`;
      const sqlDumpKey = `wordpress-deployments/${userId}/${timestamp}-database.sql`;

      // Uploader le fichier WordPress ZIP
      const wpZipFile = req.files['wordpress_zip'][0];
      // Use path.join() and os.tmpdir() for cross-platform temp directory
      const wpZipTempPath = path.join(os.tmpdir(), `${timestamp}-wordpress.zip`);
      fs.writeFileSync(wpZipTempPath, wpZipFile.buffer);
      const wordpressZipUrls = await uploadToS3Content(s3, wpZipTempPath, wpZipKey);
      wordpressZipUrl = wordpressZipUrls.s3_location;
      fs.unlinkSync(wpZipTempPath); // Nettoyer le fichier temporaire

      // Uploader le dump SQL
      const sqlDumpFile = req.files['database_dump'][0];
      const sqlDumpTempPath = path.join(os.tmpdir(), `${timestamp}-database.sql`);
      fs.writeFileSync(sqlDumpTempPath, sqlDumpFile.buffer);
      const databaseDumpUrls = await uploadToS3Content(s3, sqlDumpTempPath, sqlDumpKey);
      databaseDumpUrl = databaseDumpUrls.s3_location;
      fs.unlinkSync(sqlDumpTempPath); // Nettoyer le fichier temporaire
    }

    // Deployment du site
    const record = subdomain;
    const siteDomain = `${subdomain}.${existingDomain.domain_name}`;
    const domain = existingDomain.domain_name;
    const domain_folder = domainToUnderscoreFormat(siteDomain);
    const wp_db_name = `${domain_folder}_db`;
    const wp_db_user = `${wp_db_name}_usr`;
    const wp_db_password = process.env.WP_DEFAULT_DB_USER_PWD;
    const php_version = process.env.WP_DEFAULT_PHP_VERSION;
    const wp_version = wordpress_version || process.env.WP_DEFAULT_VERSION;
    const wp_zip_location = wordpressZipUrl;
    const wp_db_dump_location = databaseDumpUrl;
    const ftp_user = sftpTruncate(`${domain_folder}_ftp`);
    const ftp_pwd = process.env.WP_DEFAULT_FTP_PWD;
    const ftp_host = process.env.WP_DEFAULT_FTP_HOST;
    const ftp_port = process.env.WP_DEFAULT_FTP_PORT;
    const wp_domain_category = existingDomain.category;

    // 6. Création du site
    const newWebsite = await Website.create({
        name : name,
        environment: environment,
        record: record,
        domain_id: domain_id,
        is_active: true,
        subscription_id: subscription_id,
        user_id: userId,
        domain_folder: domain_folder,
        wp_db_name: wp_db_name,
        wp_db_user: wp_db_user,
        wp_db_password: wp_db_password,
        php_version: php_version,
        wp_version: wp_version,
        is_processing_site: true,
        installation_method: installation_method,
        git_repo_url: git_repo_url,
        git_branch: git_branch,
        git_username: git_username,
        git_token: git_token,
        wp_zip_location: wp_zip_location,
        wp_db_dump_location: wp_db_dump_location,
        wp_source_domain: wp_source_domain,
        ftp_user: ftp_user,
        ftp_pwd: ftp_pwd,
        ftp_host: ftp_host,
        ftp_port: ftp_port,
        last_deployed_at: new Date().toISOString()
    });


    const newWebsiteFromDb = await Website.findByPk(newWebsite.id, {
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

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    
    const messageBody = JSON.stringify({
      userId,
      record,
      domain,
      domain_folder,
      wp_db_name,
      wp_db_user,
      wp_db_password,
      php_version,
      wp_version,
      installation_method,
      git_repo_url,
      git_branch,
      git_username,
      git_token,
      wp_zip_location,
      wp_db_dump_location,
      wp_source_domain,
      environment,
      ftp_user,
      ftp_pwd,
      wp_domain_category,
      command: 'MANAGE_WP', // Déployer wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${domain}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    res.status(201).json({
        success: true,
        message: 'Website created successfully',
        data: newWebsiteFromDb
    });

  } catch (error) {
    console.error('Website creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// get /:id Website by id

router.get('/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }

    const website = await Website.findByPk(req.params.id);
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }
    res.json(website);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get /:id Website by id

router.get('/get-infos/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }

    const websiteId = req.params.id;    

    if (!websiteId) {
      return res.status(400).json({ error: 'Missing Website id parameter' });
    }

    const newWebsiteFromDb = await Website.findByPk(websiteId, {
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

    // const domain_folder = newWebsiteFromDb.domain_folder;
    // const web_root = `/var/www/${domain_folder}`;
    // let cmd = `cat ${web_root}/site-size-data.json`;
    // let comment = `Get site-size-data for ${web_root}`;
    
    // const output = await executeShellCommand(cmd, comment);

    // // Parse output string to JSON
    // const sizesReportData = JSON.parse(output);
    // // sizesReportData = {
    // //   "web_root": "/var/www/site1_skyscaledev_com",
    // //   "web_size_bytes": "73030558",
    // //   "db_name": "site1_skyscaledev_com_db",
    // //   "db_size_bytes": "2211840"
    // // }

    // if(sizesReportData && sizesReportData.web_size_bytes && sizesReportData.db_size_bytes){
    //   const totalSize = parseInt(sizesReportData.web_size_bytes) + parseInt(sizesReportData.db_size_bytes);
    //   const totalSizeMB = Math.round(totalSize / (1024 * 1024));
    //   newWebsiteFromDb.used_storage_mb = totalSizeMB;
    //   await newWebsiteFromDb.save();
    // }

    if (!newWebsiteFromDb) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.status(200).json({
      success: true,
      message: 'is_processing_site updated successfully',
      data: newWebsiteFromDb
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// put /:id Website by id

router.put('/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.params.id) {
        return res.status(400).json({ error: 'Missing id parameter' });
    }

    const { name, domain, used_storage_mb, is_active } = req.body;

    const website = await Website.findByPk(req.params.id);
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    await website.update(req.body);
    res.json(website);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// delete /:id Website by id
router.delete('/delete-wordpress/:id', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);
    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;

    if (!req.params.id) {
        return res.status(400).json({ error: 'Missing id parameter' });
    }

    const websiteId = req.params.id;

    //get website by pk and include Domain 
    const website = await Website.findByPk(websiteId, {
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const record = website.record;
    const domain = website.Domain.domain_name;
    const domain_folder = website.domain_folder;
    const wp_db_name = website.wp_db_name;
    const wp_db_user = website.wp_db_user;
    const wp_db_password = website.wp_db_password;
    const php_version = website.php_version;
    const wp_version = website.wp_version;
    const ftp_user = website.ftp_user;
    const installation_method = "delete";
    const wp_domain_category = website.Domain.category;
    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record,
      domain,
      domain_folder,
      installation_method,
      wp_db_name,
      wp_db_user,
      wp_db_password,
      php_version,
      wp_version,
      ftp_user,
      wp_domain_category,
      command: 'MANAGE_WP', // Supprimer le site wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${domain}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    await website.destroy();
    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/update-is-processing-site', async (req, res) => {  try {
    const { record, domain } = req.body;

      // find website by record and FK Domain.domain_name 
      const siteFromDb = await Website.findOne({
        where: { record },
        include: [{
          model: Domain,
          where: { domain_name: domain }
        }]
      });

      if (!siteFromDb) {
          return res.status(404).json({ error: 'Website not found' });
      }

      siteFromDb.is_processing_site = false;
      await siteFromDb.save();
      
      res.status(200).json({
          success: true,
          message: 'is_processing_site updated successfully',
          data: siteFromDb
      });

  } catch (error) {
      logger.error(error);
      logger.error('Error updating is_processing_site:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// retourner la liste des version wordpress disponibles
router.get('/wordpress/versions', auth, async (req, res) => {
  try {

    logger.info(`req.user.id=${req.user.id}`);

    const WORDPRESS_VERSIONS = [
      'latest',
      '6.5',
      '6.4',
      '6.3',
      '6.2',
      '6.1',
      '6.0',
      '5.9'
    ];

    res.status(200).json({
      success: true,
      message: 'Liste des versions wordpress retournée avec succès',
      data: WORDPRESS_VERSIONS
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// put wp_admin_user website
router.put('/:id/update-credentials', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const { wp_admin_user, wp_admin_user_pwd, wp_admin_user_app_pwd } = req.body;

      // find website by websiteId include Domain 
      const siteFromDb = await Website.findByPk(websiteId,{
        include: [{
          model: Domain
        }]
      });


      if (!siteFromDb) {
          return res.status(404).json({ error: 'Website not found' });
      }

      siteFromDb.wp_admin_user = wp_admin_user;
      siteFromDb.wp_admin_user_pwd = wp_admin_user_pwd;
      siteFromDb.wp_admin_user_app_pwd = wp_admin_user_app_pwd;

      await siteFromDb.save();
      
      res.status(200).json({
          success: true,
          message: 'Wordpress credentials updated successfully',
          data: siteFromDb
      });

  } catch (error) {
      logger.error(error);
      logger.error('Error updating is_processing_site:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// put used_storage_mb website
router.put('/update-used-storage/:id', auth, async (req, res) => {
  try {
    
    const websiteId = req.params.id;

    // find website by websiteId include Domain
    // Cette requête permet de récupérer un site web par son ID (websiteId)
    // et inclut les données associées du modèle Domain via la relation définie dans les modèles
    const siteFromDb = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });
    
    if (!siteFromDb) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const domain_name = `https://${siteFromDb.record}.${siteFromDb.Domain.domain_name}`;

    const wp_directory_sizes_route = "/index.php/wp-json/wp-site-health/v1/directory-sizes";

    const wp_directory_sizes_url = `${domain_name}${wp_directory_sizes_route}`;

    logger.info(`wp_directory_sizes_url=${wp_directory_sizes_url}`);

    // Encode correctement les credentials
    const wp_admin_user = siteFromDb.wp_admin_user;
    const wp_admin_user_app_pwd = siteFromDb.wp_admin_user_app_pwd;

    //check if wp_admin_user_app_pwd or wp_admin_user are empty
    if (!wp_admin_user_app_pwd || !wp_admin_user) {
      return res.status(400).json({ error: 'Missing credentials (Admin user or App Password)' });
    }

    const userpwd = `${wp_admin_user}:${wp_admin_user_app_pwd}`;
    const basicAuth = Buffer.from(userpwd).toString('base64');

    const wp_directory_sizes_response = await axios.get(wp_directory_sizes_url, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info(`wp_directory_sizes_response=${wp_directory_sizes_response.data}`);

    const used_storage_mb = wp_directory_sizes_response.data.total_size.size;

    // parse used_storage_mb to integer and round it
    const used_storage_mb_int = parseInt(used_storage_mb, 10);

    siteFromDb.used_storage_mb = used_storage_mb_int;

    await siteFromDb.save();

    res.status(200).json({
        success: true,
        message: 'Used storage updated successfully',
        data: siteFromDb
    });

  } catch (error) {
      logger.error(error);
      logger.error('Error updating used_storage_mb:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// put wp_admin_user website
router.put('/:id/update-git-infos', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const { git_repo_url, git_branch, git_username, git_token } = req.body;

      // find website by websiteId include Domain 
      const siteFromDb = await Website.findByPk(websiteId,{
        include: [{
          model: Domain
        }]
      });


      if (!siteFromDb) {
          return res.status(404).json({ error: 'Website not found' });
      }

      siteFromDb.git_repo_url = git_repo_url;
      siteFromDb.git_branch = git_branch;
      siteFromDb.git_username = git_username;
      siteFromDb.git_token = git_token;

      await siteFromDb.save();
      
      res.status(200).json({
          success: true,
          message: 'Wordpress credentials updated successfully',
          data: siteFromDb
      });

  } catch (error) {
      logger.error(error);
      logger.error('Error updating is_processing_site:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// monitor site processing by id 
router.get('/monitor-processing/:id', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;

    // find website by websiteId include Domain
    // Cette requête permet de récupérer un site web par son ID (websiteId)
    const siteFromDb = await Website.findByPk(websiteId,
      {
        attributes: ['is_processing_site']
      });
      
    if (!siteFromDb) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const is_processing_site = siteFromDb.is_processing_site
    res.status(200).json({
      success: true,
      message: 'Site processing status retrieved successfully',
      data: is_processing_site
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error retrieving site processing status:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// get /database-credentials/${websiteId}
router.get('/database-credentials/:id', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;

    // find website by websiteId include Domain
    // Cette requête permet de récupérer un site web par son ID (websiteId)
    const siteFromDb = await Website.findByPk(websiteId);

    if (!siteFromDb) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const wp_db_name = siteFromDb.wp_db_name;
    const wp_db_user = siteFromDb.wp_db_user;
    const wp_db_password = siteFromDb.wp_db_password;
    const phpmyadmin_url = process.env.PHPMYADMIN_URL;

    res.status(200).json({
      success: true,
      message: 'Database credentials retrieved successfully',
      data: {
        wp_db_name,
        wp_db_user,
        wp_db_password,
        phpmyadmin_url
      }
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error retrieving database credentials:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getFolderSizeInMB(folderPath) {
  try {
    const sizeInBytes = await calculateFolderSize(folderPath);
    const sizeInMB = sizeInBytes / (1024 * 1024); // Conversion octets → mégaoctets
    return Math.round(sizeInMB * 100) / 100; // Arrondi à 2 décimales
  } catch (error) {
    console.error('Erreur lors du calcul de la taille du dossier:', error);
    throw error;
  }
}

async function calculateFolderSize(folderPath) {
  const items = await fs.promises.readdir(folderPath);
  let totalSize = 0;

  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    const stats = await fs.promises.stat(itemPath);

    if (stats.isDirectory()) {
      totalSize += await calculateFolderSize(itemPath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

async function getDatabaseSizeInMB(schemaName) {
  try {
    const result = await db.sequelize.query(
      `SELECT 
         SUM(data_length + index_length) / 1024 / 1024 AS size_mb
       FROM information_schema.TABLES 
       WHERE table_schema = :schemaName
       GROUP BY table_schema`,
      {
        replacements: { schemaName },
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (!result || result.length === 0) return 0;
    return Math.round(result[0].size_mb * 100) / 100;
  } catch (error) {
    console.error('Erreur lors du calcul de la taille de la base:', error);
    throw error;
  }
}

// post mettre à jour la taille de stockage de tous les sites
router.post('/update-all-storage', auth, async (req, res) => {
  try {
    const websites = await Website.findAll({
      include: [{
        model: Domain
      }]
    });

    for (const website of websites) {

      const site_folder_path = `/var/www/${website.domain_folder}`;

      //const site_folder_size_mb = await getFolderSizeInMB(site_folder_path);
      const site_folder_size_mb = 10.0;

      logger.info(`site_folder_size_mb=${site_folder_size_mb}`);

      const wp_db_name = website.wp_db_name;

      const db_size_mb = await getDatabaseSizeInMB(wp_db_name);

      logger.info(`db_size_mb=${db_size_mb}`);

      website.used_storage_mb = site_folder_size_mb + db_size_mb;

      await website.save();
    }

    res.status(200).json({
      success: true,
      message: 'Used storage updated successfully for all websites'
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error updating used_storage_mb:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

    // Vérification que la souscription est encore possible
  async function getFirstSubscriptionByUserIdWithAvailableSites(userId) {
    try {
      // Get all subscriptions for user with their plan and websites
      const subscriptions = await Subscription.findAll({
        where: {
          user_id: userId,
        },
        include: [
          {
            model: Plan,
            attributes: ['included_sites']
          },
          {
            model: Website
          }
        ]
      });
  
      // Find first subscription that has available site slots
      for (const subscription of subscriptions) {
        const maxSites = subscription.Plan.included_sites;
        const currentSites = subscription.Websites.length;
        
        if (currentSites < maxSites) {
          return subscription;
        }
      }
  
      throw new Error('No subscription with available sites found');
  
    } catch (error) {
      logger.error('Error getting subscription:', error);
      throw error;
    }
  }

//post duplicate website
router.post('/duplicate/:id', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const { target_environment, subdomain, domain_id } = req.body;

    const userId = req.user.id;
    // find website by websiteId include Domain
    // Cette requête permet de récupérer un site web par son ID (websiteId)
    const siteFromDb = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!siteFromDb) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const existingDomain = await Domain.findOne({
      where: { id: domain_id }
    });

    // 4. Vérification des doublons de domaine

    const existingWebsite = await Website.findOne({
      where: { 
        record : subdomain
       },
      include: [{
        model: Domain,
        where: { domain_name: existingDomain.domain_name }
      }]
    });

    if (existingWebsite) {
      return res.status(409).json({
        success: false,
        message: 'Domain already exists for this subscription'
      });
    }

    const subscription = await getFirstSubscriptionByUserIdWithAvailableSites(userId);

    if (!subscription) {
      return res.status(409).json({
        success: false,
        message: 'No subscription with available sites found'
      });
    }

    const record = subdomain;
    const siteDomain = `${subdomain}.${existingDomain.domain_name}`;
    const domain = existingDomain.domain_name;
    const domain_folder = domainToUnderscoreFormat(siteDomain);
    const wp_db_name = `${domain_folder}_db`;
    const wp_db_user = `${wp_db_name}_usr`;
    const wp_db_password = process.env.WP_DEFAULT_DB_USER_PWD;
    const php_version = siteFromDb.php_version;
    const wp_version = siteFromDb.wp_version;
    const installation_method = 'copy';
    const wp_source_domain = `${siteFromDb.record}.${siteFromDb.Domain.domain_name}`;
    const wp_source_domain_folder = siteFromDb.domain_folder;
    const wp_source_db_name = siteFromDb.wp_db_name;
    const environment = target_environment;
    const ftp_user = sftpTruncate(`${domain_folder}_ftp`);
    const ftp_pwd = process.env.WP_DEFAULT_FTP_PWD;
    const ftp_host = process.env.WP_DEFAULT_FTP_HOST;
    const ftp_port = process.env.WP_DEFAULT_FTP_PORT;
    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const wp_domain_category = existingDomain.category;

    const messageBody = JSON.stringify({
      userId,
      record,
      domain,
      domain_folder,
      wp_db_name,
      wp_db_user,
      wp_db_password,
      php_version,
      wp_version,
      installation_method,
      wp_source_domain,
      wp_source_domain_folder,
      wp_source_db_name,
      environment,
      ftp_user,
      ftp_pwd,
      wp_domain_category,
      command: 'MANAGE_WP', // Déployer wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${domain}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);
    
    // crete site in db
    const newWebsite = await Website.create({
      name : siteFromDb.name,
      environment: target_environment,
      record: record,
      domain_id: domain_id,
      is_active: true,
      subscription_id: subscription.id,
      user_id: userId,
      domain_folder: domain_folder,
      wp_db_name: wp_db_name,
      wp_db_user: wp_db_user,
      wp_db_password: wp_db_password,
      php_version: siteFromDb.php_version,
      wp_version: siteFromDb.wp_version,
      is_processing_site: true,
      installation_method: installation_method,
      wp_source_domain: wp_source_domain,
      ftp_user: ftp_user,
      ftp_pwd: ftp_pwd,
      ftp_host: ftp_host,
      ftp_port: ftp_port,
      last_deployed_at: new Date().toISOString()
    });


    const newWebsiteFromDb = await Website.findByPk(newWebsite.id, {
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

    res.status(200).json({
      success: true,
      message: 'Website duplicated successfully',
      data: newWebsiteFromDb
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error duplicating website:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// post push env source to env target
router.post('/push-env', auth, async (req, res) => {
  try {
    const {
      groupName,
      sourceEnv,
      targetEnv,
      fileSelection,
      selectedFiles,
      databaseSelection,
      selectedTables,
      performSearchReplace
    } = req.body;

    const pushInfos = req.body;

    // find source website by name and environment
    const sourceWebsite = await Website.findOne({
      where: {
        name: groupName,
        environment: sourceEnv
      },
      include: [{
        model: Domain
      }]
    });

    if (!sourceWebsite) {
      return res.status(404).json({ error: 'Source website not found' });
    }

    // find target website by name and environment
    const targetWebsite = await Website.findOne({
      where: {
        name: groupName,
        environment: targetEnv
      },
      include: [{
        model: Domain
      }]
    }); 

    if (!targetWebsite) {
      return res.status(404).json({ error: 'Target website not found' });
    }

    const userId = req.user.id; 
    const timestamp = Date.now();
    const pushInfosKey = `wordpress-push/${userId}/${timestamp}-push-${sourceEnv}-to-${targetEnv}.json`;
    const pushInfosS3 = await uploadToS3JsonObject(s3, pushInfos, pushInfosKey);
    
    const targetDomain = targetWebsite.Domain.domain_name;
    const sourceDomain = sourceWebsite.Domain.domain_name;
    const wp_domain_category = targetWebsite.Domain.category;

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId: userId,
      record: targetWebsite.record,
      domain: targetDomain,
      domain_folder: targetWebsite.domain_folder,
      wp_db_name: targetWebsite.wp_db_name,
      wp_db_user: targetWebsite.wp_db_user,
      wp_db_password: targetWebsite.wp_db_password,
      php_version: targetWebsite.php_version,
      wp_version: targetWebsite.wp_version,
      installation_method: 'push',
      wp_source_domain: `${sourceWebsite.record}.${sourceDomain}`,
      wp_source_domain_folder: sourceWebsite.domain_folder,
      wp_source_db_name: sourceWebsite.wp_db_name,
      environment: targetWebsite.environment,
      wp_push_location: pushInfosS3.s3_location,
      wp_domain_category,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });


    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${targetDomain}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    targetWebsite.is_processing_site = true;
    targetWebsite.last_deployed_at = new Date().toISOString();
    await targetWebsite.save();

    res.status(200).json({
      success: true,
      message: 'Push env source to env target successfully',
      data: targetWebsite
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error pushing env source to env target:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// put ${id}/toggle-maintenance website.is_maintenance_mode_enabled
router.put('/:id/toggle-maintenance', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId, {
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const toggle_maintenance_mode = !website.is_maintenance_mode_enabled ? 'on' : 'off';
    const userId = req.user.id;
    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      installation_method: 'maintenance',
      userId: userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder: website.domain_folder,
      toggle_maintenance_mode: toggle_maintenance_mode,
      wp_db_name: website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    website.is_maintenance_mode_enabled = !website.is_maintenance_mode_enabled;
    await website.save();

    res.status(200).json({
      success: true,
      message: 'Maintenance mode toggled successfully',
      data: website
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error toggling maintenance mode:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// put ${id}/toggle-lscache website.is_lscache_enabled
router.put('/:id/toggle-lscache', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const is_lscache_enabled = req.body;
    const toggle_lscache = !website.is_lscache_enabled ? 'on' : 'off';
    const userId = req.user.id;
    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      installation_method: 'cache',
      userId: userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder: website.domain_folder,
      toggle_lscache: toggle_lscache,
      wp_db_name: website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    website.is_lscache_enabled = !website.is_lscache_enabled;
    await website.save();

    res.status(200).json({
      success: true,
      message: 'Maintenance mode toggled successfully',
      data: website
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error toggling maintenance mode:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ${id}/backups
router.get('/:id/backups', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId);

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const offset = (page - 1) * perPage;


    const { count, rows } = await Backup.findAndCountAll({
      where: { website_id: websiteId },
      limit: perPage,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const backups = await Backup.findAll({
      where: {
        website_id: websiteId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Backups retrieved successfully',
      data: rows,
      meta: {
        total: count,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(count / perPage)
      }
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error retrieving backups:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// post /:id/backup-settings
router.post('/:id/backup-settings', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId);

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const backupSettings = req.body;
    
    // update backup settings if already exist
    const existingBackupSettings = await BackupSettings.findOne({
      where: {
        website_id: websiteId
      }
    });

    if (existingBackupSettings) {
      // Update existing backup settings
      const updatedBackupSettings = await existingBackupSettings.update({
        frequency: backupSettings.frequency,
        retention_period: backupSettings.retentionPeriod,
        max_backups: backupSettings.maxBackups,
        include_database: backupSettings.includeDatabase,
        include_files: backupSettings.includeFiles,
        backup_time: backupSettings.backupTime,
        day_of_week: backupSettings.dayOfWeek,
        day_of_month: backupSettings.dayOfMonth,
        notify_on_failure: backupSettings.notifyOnFailure,
        notify_email: backupSettings.notifyEmail
      });

      res.status(200).json({
        success: true,
        message: 'Backup settings updated successfully',
        data: updatedBackupSettings
      });

    } else{

      // save backup settings to db
      const backup_settings = await BackupSettings.create({
        website_id: websiteId,
        frequency: backupSettings.frequency,
        retention_period: backupSettings.retentionPeriod,
        max_backups: backupSettings.maxBackups,
        include_database: backupSettings.includeDatabase,
        include_files: backupSettings.includeFiles,
        backup_time: backupSettings.backupTime,
        day_of_week: backupSettings.dayOfWeek,
        day_of_month: backupSettings.dayOfMonth,
        notify_on_failure: backupSettings.notifyOnFailure,
        notify_email: backupSettings.notifyEmail
      });

      res.status(200).json({
        success: true,
        message: 'Backup settings created successfully',
        data: backup_settings
      });
    }
    


  } catch (error) {
    logger.error(error);
    logger.error('Error updating backup settings:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// get /:id/backup-settings
router.get('/:id/backup-settings', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId);

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const backupSettings = await BackupSettings.findOne({
      where: {
        website_id: websiteId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Backup settings retrieved successfully',
      data: backupSettings
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error retrieving backup settings:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getBackupType(backupSettings) {
  if (!backupSettings) {
    return 'full';
  }

  if (backupSettings.include_database && backupSettings.include_files) {
    return 'full';
  }

  if (backupSettings.include_database) {
    return 'database';
  }

  if (backupSettings.include_files) {
    return 'files';
  }

  return 'full'; // Default to full backup if no settings specified
}

// fonction getBackupFileName(website) qui retourne une chaine de caractère contenant domain_folder environment et un timestamp
function getBackupFileName(website) {
  const timestamp = Date.now();
  const s3ObjectName = `${website.domain_folder}-${website.environment}-${timestamp}.zip`;
  return `s3://${process.env.AWS_BUCKET_NAME}/wordpress-backups/${s3ObjectName}`;
}

// post(`/${id}/backups-manual`, { note });
router.post('/:id/backups-manual', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain,
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const backupSettings = await BackupSettings.findOne({
      where: {
        website_id: websiteId
      }
    });

    const backupName = `Sauvegarde manuelle de ${website.name} - ${website.environment}`;
    const backupType = getBackupType(backupSettings);
    const backupStatus = 'pending';
    const backupLocation = getBackupFileName(website);
    const backupRestorePoint = true;
    const backupWPVersion = website.wp_version;
    const userId = req.user.id;
    const backupNote = req.body;

    const backup = await Backup.create({
      website_id: websiteId,
      user_id: userId,
      notes: backupNote.note,
      name: backupName,
      type: backupType,
      status: backupStatus,
      location: backupLocation,
      restore_point: backupRestorePoint,
      wp_version: backupWPVersion,
      is_automatic: false
    });

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      installation_method: 'backup',
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder: website.domain_folder,
      backup_location: backupLocation,
      backup_type: backupType,
      wp_db_name: website.wp_db_name,
      wp_db_user: website.wp_db_user,
      wp_db_password: website.wp_db_password,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-backup', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${userId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error creating backup:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get /:id/backups/:idbackup/download
router.get('/:id/backups/:idbackup/download', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId);

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const backupId = req.params.idbackup;
    const backup = await Backup.findByPk(backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: backup.location.split('s3://')[1].split('/').slice(1).join('/')
    });

    const response = await s3.send(command);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${backup.name}.zip`);
    response.Body.pipe(res);

  } catch (error) {
    logger.error(error);
    logger.error('Error downloading backup:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// delete /:id/backups/:idbackup
router.delete('/:id/backups/:idbackup', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId);

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const backupId = req.params.idbackup;
    const backup = await Backup.findByPk(backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    
    // supprimer aussi dans s3 l'objet backup.location
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: backup.location.split('s3://')[1].split('/').slice(1).join('/')
    });

    await s3.send(command);

    await backup.destroy();

    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully',
      data: backup
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error deleting backup:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// post /:id/backups/:idbackup/restore
router.post('/:id/backups/:idbackup/restore', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain,
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const backupId = req.params.idbackup;
    const backup = await Backup.findByPk(backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const userId = req.user.id;

    const {
      name,
      environment,
      subdomain, 
      domain_id, 
      subscription_id } = req.body;

    const existingDomain = await Domain.findOne({
      where: { id: domain_id }
    });

    // Vérification des doublons de domaine
    const existingWebsite = await Website.findOne({
      where: { 
        record : subdomain
       },
      include: [{
        model: Domain,
        where: { domain_name: existingDomain.domain_name }
      }]
    });

    if (existingWebsite) {
        return res.status(409).json({
          success: false,
          message: 'Domain already exists for this subscription'
        });
    }

    // Deployment du site
    const record = subdomain;
    const siteDomain = `${subdomain}.${existingDomain.domain_name}`;
    const domain = existingDomain.domain_name;
    const domain_folder = domainToUnderscoreFormat(siteDomain);
    const wp_db_name = `${domain_folder}_db`;
    const wp_db_user = `${wp_db_name}_usr`;
    const wp_db_password = process.env.WP_DEFAULT_DB_USER_PWD;
    const php_version = website.php_version;
    const wp_version = website.wp_version;
    const ftp_user = sftpTruncate(`${domain_folder}_ftp`);
    const ftp_pwd = process.env.WP_DEFAULT_FTP_PWD;
    const ftp_host = process.env.WP_DEFAULT_FTP_HOST;
    const ftp_port = process.env.WP_DEFAULT_FTP_PORT;
    const installation_method = 'restore';
    const backup_location = backup.location;
    const wp_source_domain = `${website.record}.${website.Domain.domain_name}`;
    const backup_type = backup.type;
    const wp_domain_category = existingDomain.category;
    
    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record,
      domain,
      domain_folder,
      wp_db_name,
      wp_db_user,
      wp_db_password,
      php_version,
      wp_version,
      environment,
      ftp_user,
      ftp_pwd,
      ftp_host,
      ftp_port,
      installation_method,
      wp_source_domain,
      backup_location,
      backup_type,
      wp_domain_category,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${websiteId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    // Création du site
    const newWebsite = await Website.create({
      name : name,
      environment: environment,
      record: record,
      domain_id: domain_id,
      is_active: true,
      subscription_id: subscription_id,
      user_id: userId,
      domain_folder: domain_folder,
      wp_db_name: wp_db_name,
      wp_db_user: wp_db_user,
      wp_db_password: wp_db_password,
      php_version: php_version,
      wp_version: wp_version,
      is_processing_site: true,
      installation_method: installation_method,
      wp_zip_location: backup_location,
      wp_source_domain: wp_source_domain,
      ftp_user: ftp_user,
      ftp_pwd: ftp_pwd,
      ftp_host: ftp_host,
      ftp_port: ftp_port,
      last_deployed_at: new Date().toISOString()
    });


    const newWebsiteFromDb = await Website.findByPk(newWebsite.id, {
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


    res.status(200).json({
      success: true,
      message: 'Restore created successfully',
      data: newWebsiteFromDb
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error creating restore:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get all /redirects/${id}
router.get('/redirects/:id', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId);

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const redirects = await RedirectRule.findAll({
      where: {
        website_id: websiteId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Redirects retrieved successfully',
      data: redirects
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error retrieving redirects:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Récupérer les règles actuelles depuis Parameter Store
async function getCurrentRules(parameterName) {
  try {
    const command = new GetParameterCommand({
      Name: parameterName,
    });
    const response = await ssmClient.send(command);
    return JSON.parse(response.Parameter.Value);
  } catch (error) {
    if (error.name === "ParameterNotFound") {
      return { rules: [] }; // Initialise un JSON vide si le paramètre n'existe pas
    }
    throw error;
  }
}

// Mettre à jour les règles dans Parameter Store
async function updateRules(newRules, parameterName) {
  const command = new PutParameterCommand({
    Name: parameterName,
    Value: JSON.stringify(newRules),
    Type: "String",
    Overwrite: true,
  });

  logger.info(`command=${JSON.stringify(newRules, null, 2)}`);

  await ssmClient.send(command);
  console.log("✅ Règles mises à jour avec succès !");
}

// Ajouter une nouvelle règle
async function addRule(currentRules, newRule, parameterName) {
  currentRules.rules.push(newRule);
  await updateRules(currentRules, parameterName);
}

// 4. Modifier une règle existante (par ID)
async function editRule(ruleId, currentRules, updatedRule, parameterName) {

  if (!currentRules || !currentRules.rules) {
    currentRules = { rules: [] };
  }

  const updatedRules = {
    rules: currentRules.rules.map(rule => {

      if (rule.id.toString() === ruleId.toString()) {
        logger.info(`rule=${JSON.stringify(rule, null, 2)}`);
        rule.priority = parseInt(updatedRule.priority);
        rule.rewrite_rule = updatedRule.rewrite_rule;
        rule.status_code = updatedRule.status_code;
        rule.source = updatedRule.source;
        rule.destination = updatedRule.destination;
        rule.condition = updatedRule.condition;
        rule.is_active = updatedRule.is_active;
        rule.type = updatedRule.type;
        rule.name = updatedRule.name;
        return rule;
      }

      return rule;
    })
  };

  logger.info(`updatedRules=${JSON.stringify(updatedRules, null, 2)}`);
  
  // if (!updatedRules.rules.some(rule => rule.id === ruleId)) {
  //   throw new Error("Règle non trouvée !");
  // }

  await updateRules(updatedRules, parameterName);
}

// post /${id}/redirects 
router.post('/:id/redirects', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const userId = req.user.id;
    const { name, type, source, destination, condition, status_code, rewrite_rule, priority, is_active } = req.body;

    const domain_folder = website.domain_folder;
    const installation_method = 'redirect';

    const redirectRule = await RedirectRule.create({
      website_id: websiteId,
      name: name,
      type: type,
      condition: condition,
      rewrite_rule: rewrite_rule,
      priority: priority,
      is_active: is_active,
      source: source,
      destination: destination,
      status_code: status_code
    });

    const parameterName = `/wordpress/${domain_folder}/redirects`;
    await addRule(redirectRule, parameterName);

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder,
      installation_method,
      wp_db_name : website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${websiteId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);    

    res.status(200).json({
      success: true,
      message: 'Redirect created successfully',
      data: redirectRule
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error creating redirect:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// delete /${id}/redirects/${idredirect}
router.delete('/:id/redirects/:idredirect', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const redirectId = req.params.idredirect;
    const redirect = await RedirectRule.findByPk(redirectId);

    if (!redirect) {
      return res.status(404).json({ error: 'Redirect not found' });
    }

    await redirect.destroy();

    const domain_folder = website.domain_folder;
    const installation_method = 'redirect';

    const parameterName = `/wordpress/${domain_folder}/redirects`;
    const currentRules = await getCurrentRules(parameterName);
    
    const updatedRules = [];
    for (const rule of currentRules.rules) {
      if (parseInt(rule.id) !== parseInt(redirectId)) {
        updatedRules.push(rule);
      }
    }

    await updateRules({ rules: updatedRules }, parameterName);

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder,
      installation_method,
      wp_db_name : website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${websiteId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    res.status(200).json({
      success: true,
      message: 'Redirect deleted successfully',
      data: redirect
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error deleting redirect:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// put /${id}/redirects/${idredirect} update priority
router.put('/:id/redirects/:idredirect', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const redirectId = req.params.idredirect;
    const redirect = await RedirectRule.findByPk(redirectId);

    if (!redirect) {
      return res.status(404).json({ error: 'Redirect not found' });
    }

    const updatedRedirect = req.body;
    const priority = updatedRedirect.priority;

    await redirect.update({
      priority: priority
    });

    const redirectFromDb = await RedirectRule.findByPk(redirectId);

    const domain_folder = website.domain_folder;
    const installation_method = 'redirect';

    const parameterName = `/wordpress/${domain_folder}/redirects`;

    logger.info(`redirectFromDb=${redirectFromDb}`);
    const currentRules = await getCurrentRules(parameterName);
    logger.info(`currentRules=${currentRules}`);

    await editRule(redirectId, currentRules, redirectFromDb, parameterName);

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder,
      installation_method,
      wp_db_name : website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${websiteId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    res.status(200).json({
      success: true,
      message: 'Redirect updated successfully',
      data: redirectFromDb
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error updating redirect:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getEc2InstanceId(tagName, tagValue) {
  try {


    const command = new DescribeInstancesCommand({
      Filters: [
        {
          Name: `tag:${tagName}`,
          Values: [tagValue]
        },
        {
          Name: 'instance-state-name',
          Values: ['running']
        }
      ]
    });

    const response = await ec2Client.send(command);

    if (!response.Reservations || response.Reservations.length === 0) {
      throw new Error('No EC2 instances found');
    }

    const instance = response.Reservations[0].Instances[0];
    return instance.InstanceId;

  } catch (error) {
    logger.error('Error getting EC2 instance ID:', error);
    throw error;
  }
}

// get /${id}/logs/${logType}
router.get('/:id/logs/:logType', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const logType = req.params.logType;
    const lines = req.query.lines || 100; // Valeur par défaut de 100 lignes
    const filter = req.query.filter || ''; // Filtre vide par défaut  
    const domain_folder = website.domain_folder;

    const logFilePath = `/usr/local/lsws/logs/vhosts/${domain_folder}/${logType}.log`;


    // Récupérer ec2_instance_id grâce à process.env.EC2_TAG_NAME et process.env.EC2_TAG_VALUE
    const ec2_instance_id = await getEc2InstanceId(process.env.EC2_TAG_NAME, process.env.EC2_TAG_VALUE);

    logger.info(`ec2_instance_id=${ec2_instance_id}`);

    let cmd = `cat ${logFilePath}`;
    if (filter) {
      cmd = `grep -i "${filter}" ${logFilePath}`;
    }
    if (lines) {
      cmd += ` | head -n ${lines}`;
    }

    logger.info(`cmd=${cmd}`);
    // Commande pour lire le fichier de logs
    const command = new SendCommandCommand({
      InstanceIds: [ec2_instance_id], // ID de l'instance EC2
      DocumentName: 'AWS-RunShellScript',
      Comment: `Read log file ${logFilePath}`,
      Parameters: {
        commands: [cmd]
      }
    });

    const response = await ssmClient.send(command);
    
    // Wait for command completion with timeout
    const getCommandOutput = async (commandId, instanceId, timeout = 30000) => {
      const startTime = Date.now();
      let attempts = 0;

      while (Date.now() - startTime < timeout) {
        attempts++;
        try {
          const commandInvocation = new GetCommandInvocationCommand({
            CommandId: commandId,
            InstanceId: instanceId,
          });

          const response = await ssmClient.send(commandInvocation);
          
          if (response.Status === 'Success') {
            return response.StandardOutputContent;
          } else if (response.Status === 'Failed') {
            throw new Error(`Command failed: ${response.StandardErrorContent}`);
          }

          // Attente progressive (1s, 2s, 4s...)
          const waitTime = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));

        } catch (error) {
          if (error.name === 'InvocationDoesNotExist') {
            if (attempts < 3) {
              // Attente plus longue pour la première propagation
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            throw new Error(`Command not found after 3 attempts. Verify command ID and region.`);
          }
          throw error;
        }
      }

      throw new Error(`Timeout after ${timeout}ms waiting for command`);
    };

    const commandId = response.Command.CommandId;
    logger.info(`commandId=${commandId}`);
    
    const output = await getCommandOutput(commandId, ec2_instance_id);
    logger.info(`output=${output}`);

    const logData = output.split('\n');
    logger.info(`logData.length=${logData.length}`);

    res.status(200).json({
      success: true,
      message: 'Logs retrieved successfully',
      data: logData
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error retrieving logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// put /${id}/toggle-wp-debug is_wp_debug_enabled
router.put('/:id/toggle-wp-debug', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }
    //const enabled = req.body;
    const toggle_wp_debug = !website.is_wp_debug_enabled ? 'on' : 'off';
    const userId = req.user.id;
    const domain_folder = website.domain_folder;
    const installation_method = 'debug';

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder,
      installation_method,
      toggle_wp_debug,
      wp_db_name : website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${websiteId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    website.is_wp_debug_enabled = !website.is_wp_debug_enabled;
    await website.save();

    res.status(200).json({
      success: true,
      message: 'WP debug updated successfully',
      data: website
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error updating WP debug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get /${id}/logs/${logType}/download 

router.get('/:id/logs/:logType/download', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId);

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const logType = req.params.logType;
    const logFilename = `${logType}-${website.name}-${website.environment}.log`;

    const lines = req.query.lines || 100; // Valeur par défaut de 100 lignes
    const filter = req.query.filter || ''; // Filtre vide par défaut  
    const domain_folder = website.domain_folder;

    const logFilePath = `/usr/local/lsws/logs/vhosts/${domain_folder}/${logType}.log`;

    // Récupérer ec2_instance_id grâce à process.env.EC2_TAG_NAME et process.env.EC2_TAG_VALUE
    const ec2_instance_id = await getEc2InstanceId(process.env.EC2_TAG_NAME, process.env.EC2_TAG_VALUE);

    logger.info(`ec2_instance_id=${ec2_instance_id}`);

    let cmd = `cat ${logFilePath}`;
    if (filter) {
      cmd = `grep -i "${filter}" ${logFilePath}`;
    }
    if (lines) {
      cmd += ` | head -n ${lines}`;
    }

    logger.info(`cmd=${cmd}`);
    // Commande pour lire le fichier de logs
    const command = new SendCommandCommand({
      InstanceIds: [ec2_instance_id], // ID de l'instance EC2
      DocumentName: 'AWS-RunShellScript',
      Comment: `Read log file ${logFilePath} for download`,
      Parameters: {
        commands: [cmd]
      }
    });

    const response = await ssmClient.send(command);
    
    // Wait for command completion with timeout
    const getCommandOutput = async (commandId, instanceId, timeout = 30000) => {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        const command = new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: instanceId
        });
    
        const response = await ssmClient.send(command);
    
        if (response.Status === 'Success') {
          return response.StandardOutputContent;
        } else if (response.Status === 'Failed') {
          throw new Error(`Command failed: ${response.StandardErrorContent}`);
        }
    
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    
      throw new Error('Command timed out');
    };
    
    const commandId = response.Command.CommandId;
    logger.info(`commandId=${commandId}`);
    
    const output = await getCommandOutput(commandId, ec2_instance_id);
    logger.info(`output=${output}`);


    // Set headers for text file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${logFilename}`);

    // Send the text content directly
    res.send(output);

  } catch (error) {
    logger.error(error);
    logger.error('Error downloading log file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// post /${id}/plugins/install-query-monitor
router.post('/:id/plugins/install-query-monitor', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const userId = req.user.id;
    const domain_folder = website.domain_folder;
    const installation_method = 'install_query_monitor';

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder,
      installation_method,
      wp_db_name : website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${websiteId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    website.is_wp_query_monitor_installed = true;
    website.is_wp_query_monitor_enabled = true;
    await website.save();

    res.status(200).json({
      success: true,
      message: 'Plugin installation started successfully',
      data: website
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error installing plugin:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// put /${id}/toggle-plugin-query-monitor
router.put('/:id/toggle-plugin-query-monitor', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const toggle_wp_query_monitor = !website.is_wp_query_monitor_enabled ? 'on' : 'off';
    const userId = req.user.id;
    const domain_folder = website.domain_folder;
    const installation_method = 'toggle_query_monitor';

    const queueUrl = process.env.WEBSITE_DEPLOY_QUEUE_URL;
    const messageBody = JSON.stringify({
      userId,
      record: website.record,
      domain: website.Domain.domain_name,
      domain_folder,
      installation_method,
      toggle_wp_query_monitor,
      wp_db_name : website.wp_db_name,
      command: 'MANAGE_WP', // Deploy wordpress
      requestedAt: new Date().toISOString()
    });

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: 'wordpress-deploy', // obligatoire pour les FIFO queues
      MessageDeduplicationId: `${websiteId}-${Date.now()}` // unique à chaque envoi
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    website.is_wp_query_monitor_enabled = !website.is_wp_query_monitor_enabled;
    await website.save();

    res.status(200).json({
      success: true,
      message: 'WP debug updated successfully',
      data: website
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error updating WP debug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function executeShellCommand(command, comment, timeout = 30000) {
  // Récupérer ec2_instance_id grâce à process.env.EC2_TAG_NAME et process.env.EC2_TAG_VALUE
  const ec2_instance_id = await getEc2InstanceId(process.env.EC2_TAG_NAME, process.env.EC2_TAG_VALUE);

  const sendCommand = new SendCommandCommand({
    InstanceIds: [ec2_instance_id],
    DocumentName: 'AWS-RunShellScript',
    Comment: comment,
    Parameters: {
      commands: [command]
    }
  });

  const response = await ssmClient.send(sendCommand);
  const commandId = response.Command.CommandId;
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < timeout) {
    attempts++;
    try {
      const getCommand = new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: ec2_instance_id
      });

      const commandResponse = await ssmClient.send(getCommand);

      if (commandResponse.Status === 'Success') {
        return commandResponse.StandardOutputContent;
      } else if (commandResponse.Status === 'Failed') {
        throw new Error(`Command failed: ${commandResponse.StandardErrorContent}`);
      }

      // Attente progressive (1s, 2s, 4s...)
      const waitTime = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, waitTime));

    } catch (error) {
      if (error.name === 'InvocationDoesNotExist') {
        if (attempts < 3) {
          // Attente plus longue pour la première propagation
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw new Error(`Command not found after 3 attempts. Verify command ID and region.`);
      }
      throw error;
    }
  }

  throw new Error(`Timeout after ${timeout}ms waiting for command`);
}

// get generated wp config
router.get('/:id/generate-wp-report', auth, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByPk(websiteId,{
      include: [{
        model: Domain
      }]
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const domain_folder = website.domain_folder;

    const web_root = `/var/www/${domain_folder}`;
    let cmd = `cat ${web_root}/wp-config-report.json`;
    let comment = `Generate report config for ${web_root}`;
    
    const output = await executeShellCommand(cmd, comment);

    // Parse output string to JSON
    const reportData = JSON.parse(output);
    
    res.status(200).json({
      success: true,
      message: 'Report retrieved successfully',
      data: reportData
    });

  } catch (error) {
    logger.error(error);
    logger.error('Error retrieving Report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;