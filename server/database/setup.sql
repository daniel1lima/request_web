-- Create the database (run this as superuser)
CREATE DATABASE cpsc_database;

-- Connect to the database
\c cpsc_database

-- Create the demo table
CREATE TABLE IF NOT EXISTS demotable (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL
);

-- Insert some sample data
INSERT INTO demotable (name) VALUES 
    ('John Doe'),
    ('Jane Smith'),
    ('Bob Johnson'); 