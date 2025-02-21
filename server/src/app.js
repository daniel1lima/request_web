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
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true // Important for cookies
}));
app.use(cookieParser()); // Add cookie parser
app.use(express.json());
app.use(bodyParser.json());

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
    console.log(`Server is running on port ${PORT}`);
    console.log(`
 ____  _____ ___  _   _ _____ ____ _____ 
|  _ \| ____/ _ \| | | | ____/ ___|_   _|
| |_) |  _|| | | | | | |  _| \___ \ | |  
|  _ <| |__| |_| | |_| | |___ ___) || |  
|_| \_\_____\__\_\\___/|_____|____/ |_|  `);
});

module.exports = app;