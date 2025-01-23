const db = require('./dbUtil');

async function initializeDatabase() {
  try {
    // Create demo table
    await db.query(`
      CREATE TABLE IF NOT EXISTS demotable (
        id SERIAL PRIMARY KEY,
        name VARCHAR(20) NOT NULL
      );
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

module.exports = initializeDatabase; 