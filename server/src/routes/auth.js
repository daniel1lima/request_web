const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Check admin session status
router.get('/check-admin', (req, res) => {
    try {
        const token = req.cookies.admin_token;
        
        if (!token) {
            return res.json({ isValid: false });
        }

        // Verify the JWT token
        jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ isValid: true });
    } catch (error) {
        return res.json({ isValid: false });
    }
});

// Admin login endpoint
router.post('/admin-login', (req, res) => {
    try {
        const { password } = req.body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { admin: true },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set HTTP-only cookie
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400000 // 24 hours
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router; 