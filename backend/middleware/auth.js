const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

const auth = async (req, res, next) => {
    try {
        // Ensure request is properly formed
        if (!req.headers) {
            console.error('No headers in request');
            return res.status(401).json({ error: 'Malformed request' });
        }
        //console.log('Auth middleware - all headers:', req.headers);
        //console.log('Auth middleware - auth header:', req.headers.authorization);
        const token = req.headers.authorization?.split(' ')[1];
        //console.log('Auth middleware - extracted token:', token);
        //console.log('Auth middleware - JWT_SECRET exists:', !!process.env.JWT_SECRET);
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        //console.log('Attempting to verify token with secret:', process.env.JWT_SECRET?.substring(0, 3) + '...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //console.log('Decoded token:', decoded);
        // Verify decoded.userId exists and find user
        if (!decoded.userId) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }
        const user = await User.findByPk(decoded.userId,
            {
                attributes: ['id', 'firstname', 'lastname', 'email']
            });
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        //console.log('Setting req.user:', user);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid token', details: error.message });
    }
};

module.exports = auth;