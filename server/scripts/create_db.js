const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default 'postgres' database to create new db
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};

const client = new Client(config);

async function createDatabase() {
    try {
        await client.connect();
        console.log('Connected to \'postgres\' database.');

        // Check if database exists
        await client.query("DROP DATABASE IF EXISTS fluxo_prod");
        console.log("Database 'fluxo_prod' dropped (if it existed). Creating...");
        await client.query('CREATE DATABASE fluxo_prod');
        console.log("Database 'fluxo_prod' created successfully.");
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
