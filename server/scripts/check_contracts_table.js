const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkContracts() {
    try {
        console.log('--- Checking "contracts" table ---');

        const countRes = await pool.query('SELECT COUNT(*) FROM contracts');
        console.log(`Total records in contracts: ${countRes.rows[0].count}`);

        const id3Res = await pool.query('SELECT id, contrato, cliente FROM contracts WHERE id = 3');
        if (id3Res.rows.length > 0) {
            console.log('Record with ID 3 exists:', id3Res.rows[0]);
        } else {
            console.log('Record with ID 3 DOES NOT exist.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkContracts();
