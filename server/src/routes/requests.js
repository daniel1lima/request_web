const express = require('express');
const router = express.Router();
const { Request, User, Event, Payment } = require('../models/Index');

// Store SSE clients for each event
const eventClients = new Map();

/**
 * Helper Functions
 */
const notifyEventClients = (eventId, data) => {
    console.log(`Attempting to notify clients for event ${eventId} with data:`, JSON.stringify(data));
    console.log('Current eventClients Map:', Array.from(eventClients.entries()).map(([key, value]) => `${key}: ${value.size} clients`));
    
    if (eventClients.has(eventId)) {
        const clients = eventClients.get(eventId);
        console.log(`Found ${clients.size} clients for event ${eventId}`);
        
        clients.forEach(client => {
            try {
                if (client.writable) {
                    client.write(`data: ${JSON.stringify(data)}\n\n`);
                    console.log(`Successfully sent notification to client for event ${eventId}`);
                } else {
                    console.log(`Client for event ${eventId} is not writable, removing`);
                    clients.delete(client);
                }
            } catch (error) {
                console.error(`Error sending to client for event ${eventId}:`, error);
                clients.delete(client);
            }
        });

        if (clients.size === 0) {
            console.log(`Removing empty client set for event ${eventId}`);
            eventClients.delete(eventId);
        }
    } else {
        console.log(`No clients found for event ${eventId}`);
    }
};

/**
 * Route Handlers
 */

// Get all requests
router.get('/all', async (req, res) => {
    try {
        const requests = await Request.findAll({
            include: [
                { model: User, attributes: ['UserName'] },
                { model: Event, attributes: ['eventName'] }
            ]
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch requests',
            details: error.message
        });
    }
});

// Get specific request by ID
router.get('/getById', async (req, res) => {
    try {
        const requestId = req.query.requestId;
        
        if (!requestId) {
            return res.status(400).json({ 
                error: 'Missing request ID', 
                details: 'requestId query parameter is required' 
            });
        }

        const request = await Request.findOne({
            where: { requestID: requestId },
            include: [
                { model: User, attributes: ['UserName'] },
                { model: Event, attributes: ['eventName'] }
            ]
        });
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json(request);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch request',
            details: error.message
        });
    }
});

// Create new request
router.post('/create', async (req, res) => {
    try {
        const { songName, songArtist, songImage, userID, eventID, paymentID } = req.body;

        if (!songName || !songArtist || !eventID) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newRequest = await Request.create({
            songName, songArtist, songImage, userID, eventID, paymentID,
            accepted: false, played: false, requestUpvotes: 0
        });

        console.log('New request created:', newRequest.toJSON());

        const fullRequest = await Request.findOne({
            where: { requestID: newRequest.requestID },
            include: [
                { model: User, attributes: ['UserName'] },
                { model: Event, attributes: ['eventName'] }
            ]
        });

        if (!fullRequest) {
            console.error('Failed to fetch created request with ID:', newRequest.requestID);
            return res.status(500).json({ error: 'Request created but failed to fetch details' });
        }

        res.status(201).json(fullRequest);

        const eventIdNum = parseInt(eventID, 10);
        if (eventClients.has(eventIdNum)) {
            console.log(`Found ${eventClients.get(eventIdNum).size} clients to notify for event ${eventIdNum}`);
            notifyEventClients(eventIdNum, { type: 'create', request: fullRequest });
        }
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({
            error: 'Failed to create request',
            details: error.message
        });
    }
});

// Accept a request
router.put('/accept', async (req, res) => {
    try {
        const requestId = req.query.requestId;
        console.log('Attempting to accept request:', requestId);
        
        if (!requestId) {
            return res.status(400).json({ 
                error: 'Missing request ID', 
                details: 'requestId query parameter is required' 
            });
        }

        const request = await Request.findOne({ where: { requestID: requestId } });
        
        if (!request) {
            console.log('Request not found:', requestId);
            return res.status(404).json({ error: 'Request not found' });
        }

        await request.update({ accepted: true });

        const fullRequest = await Request.findOne({
            where: { requestID: requestId },
            include: [
                { model: User, attributes: ['UserName'] },
                { model: Event, attributes: ['eventName'] }
            ]
        });

        res.json(fullRequest);

        const eventIdNum = parseInt(request.eventID, 10);
        if (eventClients.has(eventIdNum)) {
            notifyEventClients(eventIdNum, { type: 'update', request: fullRequest });
        }
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({
            error: 'Failed to accept request',
            details: error.message
        });
    }
});

// Mark request as played
router.put('/played', async (req, res) => {
    try {
        const requestId = req.query.requestId;
        console.log('Attempting to mark request as played:', requestId);
        
        if (!requestId) {
            return res.status(400).json({ 
                error: 'Missing request ID', 
                details: 'requestId query parameter is required' 
            });
        }

        const request = await Request.findOne({ where: { requestID: requestId } });
        
        if (!request) {
            console.log('Request not found:', requestId);
            return res.status(404).json({ error: 'Request not found' });
        }

        if (!request.accepted) {
            console.log('Attempted to play unaccepted request:', requestId);
            return res.status(400).json({ 
                error: 'Invalid operation', 
                details: 'Request must be accepted before it can be marked as played' 
            });
        }

        await request.update({ played: true });

        const fullRequest = await Request.findOne({
            where: { requestID: requestId },
            include: [
                { model: User, attributes: ['UserName'] },
                { model: Event, attributes: ['eventName'] }
            ]
        });

        res.json(fullRequest);

        const eventIdNum = parseInt(request.eventID, 10);
        if (eventClients.has(eventIdNum)) {
            notifyEventClients(eventIdNum, { type: 'update', request: fullRequest });
        }
    } catch (error) {
        console.error('Mark played error:', error);
        res.status(500).json({
            error: 'Failed to mark request as played',
            details: error.message
        });
    }
});

// Delete request
router.delete('/delete', async (req, res) => {
    try {
        const requestId = req.query.requestId;
        
        if (!requestId) {
            return res.status(400).json({ 
                error: 'Missing request ID', 
                details: 'requestId query parameter is required' 
            });
        }

        const request = await Request.findOne({ where: { requestID: requestId } });
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const eventIdNum = parseInt(request.eventID, 10);
        const deletedRequest = {
            requestID: request.requestID,
            eventID: request.eventID
        };

        await request.destroy();
        res.json({ message: 'Request deleted successfully' });

        if (eventClients.has(eventIdNum)) {
            notifyEventClients(eventIdNum, { type: 'delete', request: deletedRequest });
        }
    } catch (error) {
        console.error('Delete request error:', error);
        res.status(500).json({
            error: 'Failed to delete request',
            details: error.message
        });
    }
});

// Webhook endpoint for real-time request updates
router.get('/webhook/getByEvent', async (req, res) => {
    const eventId = parseInt(req.query.eventId, 10);
    console.log('New webhook connection requested for event:', eventId);
    
    if (!eventId) {
        return res.status(400).json({ 
            error: 'Missing event ID', 
            details: 'eventId query parameter is required'
        });
    }

    try {
        // Verify event exists
        const event = await Event.findOne({ 
            where: { eventID: eventId }
        });

        if (!event) {
            return res.status(404).json({ 
                error: 'Event not found',
                details: `No event found with ID ${eventId}`
            });
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        const requests = await Request.findAll({
            where: { eventID: eventId },
            include: [
                { model: User, attributes: ['UserName'] },
                { model: Event, attributes: ['eventName'] }
            ]
        });
        
        const initialData = { type: 'initial', requests };
        res.write(`data: ${JSON.stringify(initialData)}\n\n`);

        if (!eventClients.has(eventId)) {
            eventClients.set(eventId, new Set());
        }
        eventClients.get(eventId).add(res);

        const keepAlive = setInterval(() => {
            if (res.writableEnded) {
                clearInterval(keepAlive);
                return;
            }
            res.write(': keepalive\n\n');
        }, 30000);

        req.on('close', () => {
            clearInterval(keepAlive);
            if (eventClients.has(eventId)) {
                eventClients.get(eventId).delete(res);
                if (eventClients.get(eventId).size === 0) {
                    eventClients.delete(eventId);
                }
            }
        });
    } catch (error) {
        console.error('Webhook error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to establish webhook connection' });
        }
    }
});


// REDUNDANT ROUTES


// // Get all requests for a specific event
// router.get('/getByEvent', async (req, res) => {
//     try {
//         const eventId = req.query.eventID;
        
//         if (!eventId) {
//             return res.status(400).json({ 
//                 error: 'Missing event ID', 
//                 details: 'eventID query parameter is required' 
//             });
//         }

//         const requests = await Request.findAll({
//             where: { eventID: eventId },
//             include: [
//                 { model: User, attributes: ['UserName'] }
//             ]
//         });
//         res.json(requests);
//     } catch (error) {
//         res.status(500).json({ 
//             error: 'Failed to fetch requests for event', 
//             details: error.message 
//         });
//     }
// });

// Get all accepted requests within an event
// router.get('/getaccepted', async (req, res) => {
//     try {
//         const eventId = req.query.eventId;
        
//         if (!eventId) {
//             return res.status(400).json({ 
//                 error: 'Missing event ID', 
//                 details: 'eventId query parameter is required' 
//             });
//         }

//         const requests = await Request.findAll({
//             where: { 
//                 accepted: true,
//                 eventID: eventId
//             },
//             include: [
//                 { model: User, attributes: ['UserName'] }
//             ]
//         });
//         res.json(requests);
//     } catch (error) {
//         res.status(500).json({
//             error: 'Failed to fetch accepted requests',
//             details: error.message
//         });
//     }
// });


module.exports = router;