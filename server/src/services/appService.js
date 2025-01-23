const db = require('./utils/dbUtil');

async function testDbConnection() {
    try {
        await db.query('SELECT NOW()');
        return true;
    } catch (err) {
        console.error('Database connection test failed:', err);
        return false;
    }
}

async function initiateDemotable() {
    try {
        await db.query(`
            DROP TABLE IF EXISTS demotable;
            CREATE TABLE demotable (
                id SERIAL PRIMARY KEY,
                name VARCHAR(20) NOT NULL
            );
        `);
        return true;
    } catch (err) {
        console.error('Error initiating demotable:', err);
        return false;
    }
}

async function fetchDemotableFromDb() {
    try {
        const result = await db.query('SELECT * FROM demotable');
        return result.rows.map(row => [row.id, row.name]);
    } catch (err) {
        console.error('Error fetching from demotable:', err);
        return [];
    }
}

async function insertDemotable(id, name) {
    try {
        const result = await db.query(
            'INSERT INTO demotable (name) VALUES ($1) RETURNING *',
            [name]
        );
        return result.rowCount > 0;
    } catch (err) {
        console.error('Error inserting into demotable:', err);
        return false;
    }
}

async function updateNameDemotable(oldName, newName) {
    try {
        const result = await db.query(
            'UPDATE demotable SET name = $1 WHERE name = $2',
            [newName, oldName]
        );
        return result.rowCount > 0;
    } catch (err) {
        console.error('Error updating demotable:', err);
        return false;
    }
}

module.exports = {
    testDbConnection,
    initiateDemotable,
    fetchDemotableFromDb,
    insertDemotable,
    updateNameDemotable
};