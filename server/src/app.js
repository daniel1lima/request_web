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
const authRoutes = require('./routes/auth');
const frontendAuthMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true // Important for cookies
}));
app.use(cookieParser()); // Add cookie parser
app.use(express.json());
app.use(frontendAuthMiddleware);

// Routes
app.use('/auth', authRoutes); // Add auth routes
app.use('/events', eventRoutes);
app.use('/djs', djRoutes);
app.use('/requests', requestRoutes);
app.use('/users', userRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/stripe', stripeRoutes);
app.use('/payment', paymentRoutes);
app.use('/waitlist', waitlistRoutes);



// Database sync
sequelize.sync({ force: true, logging: false }).then(() => {
    //console.log('Database synced');
}).catch(err => {
    console.error('Error syncing database:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
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