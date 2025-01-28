const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const app = express();

// Sync database
sequelize.sync({ force: false }).then(() => {
  console.log('Database synced');
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use('/events', require('./routes/events'));
app.use('/requests', require('./routes/requests'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});