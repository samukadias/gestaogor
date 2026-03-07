const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function resetStageHistory() {
    try {
        console.log('--- Resetting stage_history (User Request) ---');

        await pool.query('TRUNCATE TABLE stage_history RESTART IDENTITY');
        console.log('Success: stage_history table has been cleared.');

        const res = await pool.query('SELECT COUNT(*) FROM stage_history');
        console.log(`Current Count: ${res.rows[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

resetStageHistory();
