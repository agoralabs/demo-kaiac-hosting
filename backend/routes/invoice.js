const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Invoice, User, Subscription, Plan } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { Op } = require('sequelize');
const { uploadToS3 } = require('../services/fileUpload');
const path = require('path');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});


// create invoice
router.post('/:subscription_id', auth, async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { subscription_id } = req.params;

        // 1. Récupérer l'abonnement avec son billing_cycle
        const subscription = await Subscription.findOne({
            where: { id : subscription_id},
            include: [
            { 
                model: User,
                attributes: ['id', 'email', 'firstname', 'lastname', 'billing_address']
            },
            { 
                model: Plan,
                attributes: ['name']
            }
            ],
            transaction
        });
    
        if (!subscription) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Subscription not found or unauthorized' });
        }

        // 2. Déterminer la période courante à facturer
        const currentDate = new Date();
        let periodStart, periodEnd;

        if (subscription.billing_cycle === 'monthly') {
            periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        } else { // annual
            periodStart = new Date(currentDate.getFullYear(), 0, 1);
            periodEnd = new Date(currentDate.getFullYear(), 11, 31);
        }
        
        // 3. Vérifier si une facture existe déjà pour cette période
        const existingInvoice = await Invoice.findOne({
            where: {
            subscription_id: subscription.id,
            [Op.or]: [
                // Périodes qui se chevauchent
                {
                period_start: { [Op.lte]: periodEnd },
                period_end: { [Op.gte]: periodStart }
                },
                // Périodes identiques
                {
                period_start: periodStart,
                period_end: periodEnd
                }
            ]
            },
            transaction
        });
    
        if (existingInvoice) {
            await transaction.rollback();
            return res.status(409).json({
            success: false,
            message: `Une facture existe déjà pour ce ${subscription.billing_cycle === 'monthly' ? 'mois' : 'cycle annuel'}`,
            data: {
                existing_invoice: existingInvoice.invoice_number,
                existing_period: {
                start: existingInvoice.period_start,
                end: existingInvoice.period_end
                },
                billing_cycle: subscription.billing_cycle
            }
            });
        }

        const user = subscription.User;

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 3. Génération du numéro de facture
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const { subtotal, taxAmount, totalAmount } = safeFinancialCalculations(subscription.amount, 0.20);

        // 4. Création du PDF
        const { filePath, fileName } = await createPDFInvoice(invoiceNumber, subscription, user, subtotal, taxAmount, totalAmount);

        // 3. Vérification du fichier
        if (!fs.existsSync(filePath)) {
            throw new Error('PDF file was not created');
        }
  
        // 5. Uploader le PDF (ex: S3 ou autre stockage)
        const pdfUrl = await uploadToS3(s3, filePath, `invoices/${fileName}`);

        // 5. Enregistrement en base
        const newInvoice = await Invoice.create({
            invoice_number: invoiceNumber,
            subscription_id: subscription.id,
            user_id: user.id,
            issued_at: new Date(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            amount: subtotal,
            tax_amount: taxAmount,
            currency: subscription.currency,
            pdf_url: pdfUrl,
            status: 'issued',
            notes: "Invoice created and sent successfully",
            payment_terms: 'Paiement dans les 30 jours',
            period_start: periodStart,
            period_end: periodEnd,
            billing_address: subscription.billing_address
            }, { transaction });
        
        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Invoice created and sent successfully',
            data: {
                invoice_number: newInvoice.invoice_number,
                amount: newInvoice.amount,
                currency: newInvoice.currency,
                pdf_url: newInvoice.pdf_url,
                download_url: `/invoices/download/${newInvoice.id}`
            }
            });

        // Nettoyer le fichier temporaire
        fs.unlinkSync(filePath);

    } catch (error) {
        await transaction.rollback();
        logger.error('Invoice creation error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create invoice'
        });
    }
});


async function createPDFInvoice(invoiceNumber, subscription, user, subtotal, taxAmount, totalAmount) {
    const doc = new PDFDocument();
    const fileName = `invoice_${invoiceNumber}.pdf`;
    const filePath = path.join(__dirname, '../tmp', fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // En-tête
    doc.fontSize(20).text('Facture', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Numéro: ${invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Période: ${subscription.start_date} - ${subscription.end_date}`);
    doc.moveDown();

    const address = safeReadableAddress(subscription.billing_address);

    // Informations client
    doc.text(`Client: ${user.firstname} ${user.lastname}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Adresse: ${address}`);
    doc.moveDown();

    // Détails de la commande
    doc.fontSize(14).text('Détails de la commande:');
    doc.text(`Plan: ${subscription.Plan.name}`);
    // Ajouter dans la section "Détails de la commande"
    doc.text(`Sous-total: ${subtotal} ${subscription.currency}`);
    doc.text(`TVA (20%): ${taxAmount} ${subscription.currency}`);


    doc.moveDown();

    // Total
    doc.fontSize(16).text(`Total TTC: ${totalAmount} ${subscription.currency}`, {
        align: 'right',
        underline: true
    });

    // Conditions de paiement
    doc.fontSize(10).text('Conditions de paiement: Paiement dans les 30 jours suivant la réception de la facture.', {
        align: 'center'
    });

    // Attendez la fin de l'écriture
    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        doc.end();
    });

    
    return { filePath, fileName };
}

// delete invoice by id and from S3 bucket
router.delete('/:id', auth, async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOne({
            where: { id },
            transaction
        });

        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Supprimer le PDF de S3
        const key = getS3KeyFromStandardUrl(invoice.pdf_url);
        await deleteFromS3(key);

        // Supprimer l'enregistrement de la facture
        await Invoice.destroy({
            where: { id },
            transaction
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        logger.error('Invoice deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete invoice'
        });
    }
});

// get user invoices by user id
router.get('/', auth, async (req, res) => {
    try {
        logger.info(`req.user.id=${req.user.id}`);

        if (!req.user) {
          logger.error('No user found in request');
          return res.status(401).json({ error: 'User not authenticated' });
        }
        const user_id = req.user.id;
        const invoices = await Invoice.findAll({
            where: { user_id },
            include: [
                {
                    model: Subscription,
                    attributes: ['id', 'reference', 'start_date', 'end_date'],
                    include: [
                        {
                            model: Plan,
                            attributes: ['name']
                        }
                    ]
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Invoices retrieved successfully',
            count: invoices.length,
            data: invoices
        });
    } catch (error) {
        logger.error('Invoice retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve invoices'
        });
    }
}); 

function getS3KeyFromStandardUrl(url) {
    if (!url.includes('amazonaws.com/')) {
      throw new Error('URL S3 non valide');
    }
    
    const parts = url.split('amazonaws.com/');
    return parts[1].split('/').slice(1).join('/');
}

function deleteFromS3(key) {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    };

    return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function safeFinancialCalculations(amount, taxRate) {
    const safeAmount = Math.max(0, parseFloat(amount) || 0);
    const safeTaxRate = Math.max(0, parseFloat(taxRate) || 0);
    
    return {
      subtotal: safeAmount,
      taxAmount: parseFloat((safeAmount * safeTaxRate).toFixed(2)),
      totalAmount: parseFloat((safeAmount * (1 + safeTaxRate)).toFixed(2))
    };
}

function safeReadableAddress(billing_address) {
    if (!billing_address) return 'N/A';

    const { line1, postal_code, city, country } = billing_address;

    return `${line1}, ${postal_code}, ${city}, ${country}`;
}



module.exports = router;