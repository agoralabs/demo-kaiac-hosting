const express = require('express');
const router = express.Router();
const db = require('../models');
const { User, AlertSettings } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

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
    const { firstname, lastname, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = password;
    // Create new user
    const user = await User.create({ firstname, lastname, email, password_hash });

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

module.exports = router;