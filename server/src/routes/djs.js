const express = require('express');
const router = express.Router();
const { DJ, Event, Payment } = require('../models/Index');

// Get all DJs
router.get('/all', async (req, res) => {
    try {
        const djs = await DJ.findAll();
        res.json(djs);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch DJs',
            details: error.message 
        });
    }
});

// Get specific DJ by ID (with their events and payments)
router.get('/getById', async (req, res) => {
    try {
        const { djId } = req.query;
        
        if (!djId) {
            return res.status(400).json({ 
                error: 'Missing DJ ID',
                details: 'djId query parameter is required'
            });
        }

        const dj = await DJ.findByPk(djId, {
            include: [
                { model: Event },
                { model: Payment }
            ]
        });
        
        if (!dj) {
            return res.status(404).json({ error: 'DJ not found' });
        }
        
        res.json(dj);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch DJ',
            details: error.message 
        });
    }
});

// Create new DJ
router.post('/create', async (req, res) => {
    try {
        const { djName, djEmail, djPhone, djInsta } = req.body;

        // Validate required fields
        if (!djName || !djEmail) {
            return res.status(400).json({ 
                error: 'Name and email are required' 
            });
        }

        const newDJ = await DJ.create({
            djName,
            djEmail,
            djPhone,
            djInsta
        });

        res.status(201).json(newDJ);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to create DJ',
            details: error.message 
        });
    }
});

// Update DJ information
router.put('/update', async (req, res) => {
    try {
        const { djId } = req.query;
        
        if (!djId) {
            return res.status(400).json({ 
                error: 'Missing DJ ID',
                details: 'djId query parameter is required'
            });
        }

        const { djName, djEmail, djPhone, djInsta } = req.body;
        const dj = await DJ.findByPk(djId);

        if (!dj) {
            return res.status(404).json({ error: 'DJ not found' });
        }

        await dj.update({
            djName: djName || dj.djName,
            djEmail: djEmail || dj.djEmail,
            djPhone: djPhone || dj.djPhone,
            djInsta: djInsta || dj.djInsta
        });

        res.json(dj);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to update DJ',
            details: error.message 
        });
    }
});

// Delete DJ
router.delete('/delete', async (req, res) => {
    try {
        const { djId } = req.query;
        
        if (!djId) {
            return res.status(400).json({ 
                error: 'Missing DJ ID',
                details: 'djId query parameter is required'
            });
        }

        const dj = await DJ.findByPk(djId);
        
        if (!dj) {
            return res.status(404).json({ error: 'DJ not found' });
        }

        await dj.destroy();
        res.json({ message: 'DJ deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to delete DJ',
            details: error.message 
        });
    }
});

// Get DJ's events
router.get('/getEvents', async (req, res) => {
    try {
        const { djId } = req.query;
        
        if (!djId) {
            return res.status(400).json({ 
                error: 'Missing DJ ID',
                details: 'djId query parameter is required'
            });
        }

        const events = await Event.findAll({
            where: { djId },
            include: [{ 
                model: DJ,
                attributes: ['djName', 'djEmail', 'djPhone', 'djInsta']
            }]
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch DJ events',
            details: error.message 
        });
    }
});

// Get DJ's payments
// router.get('/getPayments', async (req, res) => {
//     try {
//         const djId = parseInt(req.query.djId, 10);
//         
//         if (!djId) {
//             return res.status(400).json({ 
//                 error: 'Missing DJ ID',
//                 details: 'djId query parameter is required'
//             });
//         }
//
//         const payments = await Payment.findAll({
//             where: { DJID: djId }
//         });
//         res.json(payments);
//     } catch (error) {
//         res.status(500).json({ 
//             error: 'Failed to fetch DJ payments',
//             details: error.message 
//         });
//     }
// });



module.exports = router;
