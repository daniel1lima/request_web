const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const eventRoutes = require('./routes/events');
const djRoutes = require('./routes/djs')
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const spotifyRoutes = require('./routes/spotify');
const stripeRoutes = require('./routes/stripe');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/events', eventRoutes);
app.use('/djs', djRoutes);
app.use('/requests', requestRoutes);
app.use('/users', userRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/stripe', stripeRoutes);



// Database sync
sequelize.sync({ force: false }).then(() => {
    console.log('Database synced');
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
});

module.exports = app;