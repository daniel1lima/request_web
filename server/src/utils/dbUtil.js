const { Pool } = require('pg');
const loadEnvFile = require('./envUtil');

const envVariables = loadEnvFile('./.env');

const pool = new Pool({
  user: envVariables.POSTGRES_USER,
  host: envVariables.POSTGRES_HOST,
  database: envVariables.POSTGRES_DB,
  password: envVariables.POSTGRES_PASSWORD,
  port: envVariables.POSTGRES_PORT || 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
}; 