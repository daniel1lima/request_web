const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const initializeDatabase = require('./utils/initDb');
const loadEnvFile = require('./utils/envUtil');

// Load environment variables
const envVariables = loadEnvFile(path.join(__dirname, '../../.env'));

const app = express();
const PORT = envVariables.PORT || 65534;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Routes
app.use('/', routes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

