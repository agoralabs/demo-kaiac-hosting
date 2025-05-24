/**
 * Service d'envoi d'emails avec gestion robuste des erreurs
 */
const { createTransporter } = require('../config/nodemailer');

// Variable pour stocker le transporteur
let transporter = null;

// Initialiser le transporteur de manière asynchrone
const initTransporter = async () => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

/**
 * Envoie un email avec gestion des erreurs
 * @param {Object} options - Options d'email (to, subject, text, html)
 * @returns {Promise} - Résultat de l'envoi
 */
const sendEmail = async (options) => {
  try {
    // Initialiser le transporteur si nécessaire
    const emailTransporter = await initTransporter();
    
    // Vérifier si le transporteur est configuré
    if (!emailTransporter) {
      console.warn('Transporteur email non configuré. Email non envoyé.');
      return { success: false, message: 'Service email non disponible' };
    }

    // Configurer l'email
    const mailOptions = {
      from: options.from || 'noreply@kaiachosting.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    // Envoyer l'email avec un timeout
    const info = await Promise.race([
      emailTransporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Délai d\'envoi d\'email dépassé')), 15000)
      )
    ]);

    console.log('Email envoyé avec succès:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    // Retourner une erreur au lieu de la lancer
    return { 
      success: false, 
      message: 'Échec de l\'envoi de l\'email', 
      error: error.message 
    };
  }
};

/**
 * Envoie un email de bienvenue
 * @param {Object} user - Informations de l'utilisateur
 * @returns {Promise} - Résultat de l'envoi
 */
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Bienvenue sur KaiaC Hosting',
    text: `Bonjour ${user.firstName || user.username},\n\nBienvenue sur KaiaC Hosting! Votre compte a été créé avec succès.\n\nCordialement,\nL'équipe KaiaC Hosting`,
    html: `<h1>Bienvenue sur KaiaC Hosting!</h1>
           <p>Bonjour ${user.firstName || user.username},</p>
           <p>Votre compte a été créé avec succès.</p>
           <p>Cordialement,<br>L'équipe KaiaC Hosting</p>`
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail
};
