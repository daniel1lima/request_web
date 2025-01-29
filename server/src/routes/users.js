const express = require('express');
const router = express.Router();
const { User, Request, Event } = require('../models/Index');

// Get all users
router.get('/all', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch users',
            details: error.message
        });
    }
});

// Get specific user by ID (with their requests)
router.get('/getById', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId, 10);
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing user ID',
                details: 'userId query parameter is required'
            });
        }

        const user = await User.findByPk(userId, {
            include: [{
                model: Request,
                include: [{ model: Event }]
            }]
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch user',
            details: error.message
        });
    }
});

// Create new user
router.post('/create', async (req, res) => {
    try {
        const { UserName, userEmail, password } = req.body;

        // Validate required fields
        if (!UserName || !userEmail || !password) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { userEmail } });
        if (existingUser) {
            return res.status(400).json({
                error: 'Email already registered'
            });
        }

        const newUser = await User.create({
            UserName,
            userEmail,
            password // Note: In a real application, you should hash the password
        });

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to create user',
            details: error.message
        });
    }
});

// Update user information
router.put('/update', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId, 10);
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing user ID',
                details: 'userId query parameter is required'
            });
        }

        const { UserName, userEmail, password } = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({
            UserName: UserName || user.UserName,
            userEmail: userEmail || user.userEmail,
            password: password || user.password
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update user',
            details: error.message
        });
    }
});

// Delete user
router.delete('/delete', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId, 10);
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing user ID',
                details: 'userId query parameter is required'
            });
        }

        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete user',
            details: error.message
        });
    }
});

// Get user's requests
router.get('/getRequests', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId, 10);
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing user ID',
                details: 'userId query parameter is required'
            });
        }

        const requests = await Request.findAll({
            where: { userID: userId },
            include: [{ 
                model: Event,
                attributes: ['eventName', 'eventDateTime', 'eventLocation']
            }]
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch user requests',
            details: error.message
        });
    }
});

module.exports = router;
