const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function compareTables() {
    try {
        console.log('--- Comparing Tables ---');

        const resContracts = await pool.query('SELECT COUNT(*) FROM contracts');
        console.log(`contracts: ${resContracts.rows[0].count}`);

        const resDeadline = await pool.query('SELECT COUNT(*) FROM deadline_contracts');
        console.log(`deadline_contracts: ${resDeadline.rows[0].count}`);

        const resFin = await pool.query('SELECT COUNT(*) FROM finance_contracts');
        console.log(`finance_contracts: ${resFin.rows[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

compareTables();
