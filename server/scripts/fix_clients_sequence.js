const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function fixSequence() {
    try {
        console.log('--- Fixing clients sequence ---');

        // Check current max id
        const maxIdRes = await pool.query('SELECT MAX(id) FROM clients');
        const maxId = maxIdRes.rows[0].max || 0;
        console.log(`Max ID: ${maxId}`);

        // Set sequence
        // Note: setval expects the NEXT value if is_called is true, or current if false.
        // Usually safer to set to maxId, and next call gets maxId+1

        // PG specific: setval('sequence_name', val, true) -> nextval will be val+1
        await pool.query(`SELECT setval('clients_id_seq', ${maxId})`);
        console.log('Sequence reset to ' + maxId);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

fixSequence();
