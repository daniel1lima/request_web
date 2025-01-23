const db = require('../utils/dbUtil');

exports.testDbConnection = async () => {
    try {
        await db.query('SELECT NOW()');
        return true;
    } catch (err) {
        console.error('Error testing connection:', err);
        return false;
    }
};

exports.fetchDemotableFromDb = async () => {
    try {
        const result = await db.query('SELECT * FROM demotable');
        return result.rows;
    } catch (err) {
        console.error('Error fetching from demotable:', err);
        return [];
    }
};

exports.initiateDemotable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS demotable (
                id SERIAL PRIMARY KEY,
                name VARCHAR(20) NOT NULL
            );
        `);
        return true;
    } catch (err) {
        console.error('Error initiating demotable:', err);
        return false;
    }
};

exports.insertDemotable = async (id, name) => {
    try {
        await db.query('INSERT INTO demotable (id, name) VALUES ($1, $2)', [id, name]);
        return true;
    } catch (err) {
        console.error('Error inserting into demotable:', err);
        return false;
    }
};

exports.updateNameDemotable = async (oldName, newName) => {
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
}; 