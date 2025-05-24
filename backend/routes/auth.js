const express = require('express');
const router = express.Router();
const db = require('../models');
const { User, AlertSettings } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');

// Configuration Mailcow
const MAILCOW_DOMAIN = process.env.MAILCOW_HOST;
const MAILCOW_HOST = `https://${MAILCOW_DOMAIN}`;
const API_KEY = process.env.MAILCOW_API_KEY;

router.get('/verify', auth, async (req, res) => {
  try {
    logger.info(`req.user.userId=${req.user.id}`);

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    logger.info(`user=${user}`);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying token' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { firstname, lastname, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = password;
    // Create new user
    const user = await User.create({ 
      firstname, 
      lastname, 
      email,
      password_hash,
      phone_number: phone });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    AlertSettings.applyDefaults(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstname : user.firstname,
        lastname : user.lastname,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// post create admin user
router.post('/create-admin-user', async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password_hash: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin User created successfully',
      data: newUser
    });

  } catch (error) {
    logger.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, 'L\'adresse email est requise');
      //return res.status(400).json({ message: 'L\'adresse email est requise' });
    }

    // Rechercher l'utilisateur
    const userRecord = await User.findOne({ where: { email } });

    // Pour des raisons de sécurité, nous ne révélons pas si l'email existe ou non
    if (!userRecord) {
      return res.status(200).json({ 
        message: 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.' 
      });
    }

    // Générer un token unique
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    console.log(`resetToken=${resetToken}`);
    console.log(`resetTokenExpiry=${resetTokenExpiry}`);
    // Sauvegarder le token dans la base de données
    userRecord.reset_password_token = resetToken;
    userRecord.reset_password_expires = resetTokenExpiry;

    await userRecord.save();

    // Construire le lien de réinitialisation
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Envoyer un email à l'utilisateur (à implémenter selon votre système d'envoi d'emails)
    // Setup email data
    const mailOptions = {
      from: `"Support" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <h1>Réinitialisation de votre mot de passe</h1>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <a href="${resetLink}">Réinitialiser mon mot de passe</a>
        <p>Ce lien est valable pendant 24 heures.</p>
        <p>Si vous n'avez pas demandé la réinitialisation de votre mot de passe, ignorez cet email.</p>
      `
    };

    // Pour l'exemple, nous allons juste logger le lien
    logger.info('Reset password link:', resetLink);

    // Send mail
    const result = await sendEmail(mailOptions);

    if (!result.success) {
      // Gérer l'échec sans faire crasher l'application
      return res.status(500).json({
        success: false,
        message: 'Échec de l\'envoi de l\'email',
        error: result.message
      });
    }

    // Répondre avec succès
    res.status(200).json({ 
      message: 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.' 
    });

  } catch (error) {
    logger.error('Error in forgot-password:', error);
    throw new ApiError(500, 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation');
    //res.status(500).json({ 
    //  message: 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation' 
    //});
  }
}));

async function sendEmail_old(mailOptions) {

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Votre serveur mailcow
    port: process.env.SMTP_PORT,                     // Port STARTTLS
    secure: false,                  // true pour le port 465 (SSL)
    auth: {
      user: process.env.SMTP_USER, // Une adresse créée dans mailcow
      pass: process.env.SMTP_PASS        // Mot de passe de l'adresse
    },
    tls: { rejectUnauthorized: false }  // À désactiver en prod si vous avez un certificat auto-signé
  });
  
  // Envoi d'email
  transporter.sendMail(mailOptions);

}

// Route pour réinitialiser le mot de passe
router.post('/reset-password', asyncHandler(async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
        
      throw new ApiError(400, 'Email et mot de passe requis');
      //return res.status(400).json({ message: 'Token et mot de passe requis' });
    }

    // Rechercher l'utilisateur avec le token valide
    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          [db.Sequelize.Op.gt]: new Date() // Token non expiré
        }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Le lien de réinitialisation est invalide ou a expiré' 
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour l'utilisateur
    await user.update({
      password_hash: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    });

    // Répondre avec succès
    res.status(200).json({ 
      message: 'Votre mot de passe a été réinitialisé avec succès' 
    });

  } catch (error) {
    logger.error('Error in reset-password:', error);
    throw new ApiError(500, 'Une erreur est survenue lors de la réinitialisation du mot de passe');
    //res.status(500).json({ 
    //  message: 'Une erreur est survenue lors de la réinitialisation du mot de passe' 
    //});
  }
}));

module.exports = router;
