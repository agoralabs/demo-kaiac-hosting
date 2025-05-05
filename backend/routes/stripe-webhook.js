const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Invoice, Payment, SubscriptionHistory, Subscription} = require('../models');
const db = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { Op } = require('sequelize');
const { uploadToS3 } = require('../services/fileUpload');
const path = require('path');
const AWS = require('aws-sdk');
const payment = require('../models/payment');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});


// stripe webhook pour gérer les paiements réussis 
// /api/stripe-webhook stripe listen --forward-to localhost:3001/api/stripe-webhook
module.exports = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    const transaction = await db.sequelize.transaction();
    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        logger.error('❌ Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    try {

        // Gérer les événements Stripe
        switch (event.type) {
            case 'payment_intent.created': {
                const paymentIntent = event.data.object;
 
                // Optionnel : enregistrer une trace dans ta BDD
                // ou mettre à jour un statut
                break;
            }
            case 'payment_intent.succeeded':{
                const paymentIntent = event.data.object;
                const subscription_id = paymentIntent.metadata.subscription_id;
                // 2. Récupérer la souscription actuelle
                const subscription = await Subscription.findOne({
                    where: { id : subscription_id},
                    include: [
                    { 
                        model: User,
                        attributes: ['id', 'email', 'firstname', 'lastname', 'billing_address']
                    }
                    ],
                    transaction
                });

                if (!subscription) {
                    throw new Error("Subscription not found");
                }
                // 2.1 Mettre à jour le statut de la souscription
                const updated = await subscription.update({
                    status: 'active',
                    activated_at: new Date()
                }, {transaction});

                console.log("Updated subscription:", updated);
                // 3. Récupérer le paiement
                const dbPayment = await Payment.findOne({
                    where: { stripe_payment_id : paymentIntent.id},
                    transaction
                });
                // 3.1 Génération du numéro de facture
                const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const user = subscription.User;
                // 4. Création du PDF
                const { filePath, fileName } = await createPDFInvoice(invoiceNumber, subscription, user, paymentIntent);

                // 4.1 Vérification du fichier
                if (!fs.existsSync(filePath)) {
                    throw new Error('PDF file was not created');
                }
                // 5. Uploader le PDF (ex: S3 ou autre stockage)
                const pdfUrl = await uploadToS3(s3, filePath, `invoices/${fileName}`);

                // 6. Enregistrement en base
                const invoice = await Invoice.create({
                    invoice_number: invoiceNumber,
                    subscription_id: subscription.id,
                    user_id: user.id,
                    issued_at: new Date(),
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
                    amount: paymentIntent.metadata.plan_subtotal,
                    tax_amount: paymentIntent.metadata.plan_tax_amount,
                    currency: paymentIntent.metadata.plan_currency,
                    pdf_url: pdfUrl,
                    status: 'paid',
                    notes: "Invoice created and sent successfully",
                    payment_terms: 'Paiement dans les 30 jours',
                    period_start: subscription.start_date,
                    period_end: subscription.end_date,
                    billing_address: subscription.billing_address,
                    payment_id: dbPayment.id,
                    payment_date: dbPayment.payment_date
                    }, { transaction });
                
                // 7. Commiy pour valider la transaction
                await transaction.commit();
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                //TODO
                console.log('Payment failes:', paymentIntent);
                await transaction.commit();
                break;
            }
            case 'charge.succeeded': {
                const paymentIntent = event.data.object;
                console.log('💳 Charge réussie:', paymentIntent);
            
                // Optionnel : enregistrer une trace dans ta BDD
                // ou mettre à jour un statut
            
                break;
              }
            
              case 'charge.updated': {
                const paymentIntent = event.data.object;
                console.log('🔄 Charge mise à jour:', paymentIntent);
            
                // Optionnel : gérer un changement d'état de la charge
                break;
              }
            // ... handle other event types
            default:
                logger.log(`Unhandled event type ${event.type}`);
        }
    
        // Return a 200 response to acknowledge receipt of the event
        res.status(200).send();
    } catch (error) {
        await transaction.rollback();
        logger.error('❌ Error processing payment_intent:', error);
        return res.status(500).send('Internal Server Error');
    }
  };
  
  async function createPDFInvoice(invoiceNumber, subscription, user, paymentIntent) {
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
    doc.text(`Plan: ${paymentIntent.metadata.plan_name}-${paymentIntent.metadata.plan_duration}-mois`);
    // Ajouter dans la section "Détails de la commande"
    doc.text(`Sous-total: ${paymentIntent.metadata.plan_subtotal} ${subscription.currency}`);
    doc.text(`TVA (20%): ${paymentIntent.metadata.plan_tax_amount} ${subscription.currency}`);


    doc.moveDown();

    // Total
    doc.fontSize(16).text(`Total TTC: ${paymentIntent.metadata.plan_total_amount} ${subscription.currency}`, {
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

function safeReadableAddress(billing_address) {
    if (!billing_address) return 'N/A';

    const { street, postal_code, city, country } = billing_address;

    return `${street}, ${postal_code}, ${city}, ${country}`;
}
