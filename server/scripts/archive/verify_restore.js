const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};

const client = new Client(config);

async function verifyRestore() {
    try {
        await client.connect();
        console.log('Verifying table counts...');

        const tables = ['demands', 'clients', 'analysts', 'users', 'contracts', 'deadline_contracts'];

        for (const table of tables) {
            const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
            console.log(`${table}: ${res.rows[0].count} records`);
        }

    } catch (err) {
        console.error('Error verifying database:', err);
    } finally {
        await client.end();
    }
}

verifyRestore();
