const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database');
const eventRoutes = require('./routes/events');
const djRoutes = require('./routes/djs')
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const spotifyRoutes = require('./routes/spotify');
const stripeRoutes = require('./routes/stripe');
const paymentRoutes = require('./routes/payment');
const waitlistRoutes = require('./routes/waitlist');
const mailgunRoutes = require('./routes/mailgun');
const s3Routes = require('./routes/s3');
const twilioRoutes = require('./routes/twilio');
const bodyParser = require('body-parser');
const http = require('http');

const {WebSocketServer} = require('ws')
const url = require('url');

const app = express();

// Create a standalone WebSocket server
const wss = new WebSocketServer({ 
    port: 3001
});


// Store clients by event ID
global.eventClients = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    // Parse the URL to get the eventId query parameter
    const parsedUrl = url.parse(req.url || '', true);
    const eventId = parsedUrl.query.eventId;
    
    if (!eventId) {
        console.log('WebSocket connection rejected: No eventId provided');
        ws.close(1008, 'Event ID is required');
        return;
    }
    
    console.log(`WebSocket client connected for event: ${eventId}`);
    
    // Add client to event map
    if (!eventClients.has(eventId)) {
        eventClients.set(eventId, new Set());
    }
    eventClients.get(eventId).add(ws);
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
        type: 'connection', 
        message: 'Connected to event stream',
        eventId
    }));
    
    // Handle client disconnection
    ws.on('close', () => {
        console.log(`WebSocket client disconnected from event: ${eventId}`);
        const clients = eventClients.get(eventId);
        if (clients) {
            clients.delete(ws);
            if (clients.size === 0) {
                eventClients.delete(eventId);
            }
        }
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Helper function to notify clients about event updates
global.notifyEventClients = (eventId, data) => {
    if (!eventClients.has(eventId)) return;
    
    const clients = eventClients.get(eventId);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true // Important for cookies
}));
app.use(cookieParser()); // Add cookie parser
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/events', eventRoutes);
app.use('/djs', djRoutes);
app.use('/requests', requestRoutes);
app.use('/users', userRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/stripe', stripeRoutes);
app.use('/payment', paymentRoutes);
app.use('/waitlist', waitlistRoutes);
app.use('/mailgun', mailgunRoutes);
app.use('/twilio', twilioRoutes);
app.use('/s3', s3Routes);

app.get('/', function(req, res) {
    res.json("Server is running")
})

// Database sync
sequelize.sync({ force: false, logging: false }).then(() => {
    console.log('Database synced');
}).catch(err => {
    console.error('Error syncing database:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(401).json({ error: 'Unauthenticated!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`HTTP server is running on port ${PORT}`);
    console.log(`
 ____  _____ ___  _   _ _____ ____ _____ 
|  _ \| ____/ _ \| | | | ____/ ___|_   _|
| |_) |  _|| | | | | | |  _| \___ \ | |  
|  _ <| |__| |_| | |_| | |___ ___) || |  
|_| \_\_____\__\_\\___/|_____|____/ |_|  `);
});

module.exports = app;