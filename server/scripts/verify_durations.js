const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function verifyDurations() {
    try {
        console.log('--- Verifying duration_minutes ---');

        const total = await pool.query('SELECT COUNT(*) FROM stage_history');
        const valid = await pool.query('SELECT COUNT(*) FROM stage_history WHERE duration_minutes > 0');
        const nulls = await pool.query('SELECT COUNT(*) FROM stage_history WHERE duration_minutes IS NULL');
        const zeros = await pool.query('SELECT COUNT(*) FROM stage_history WHERE duration_minutes = 0');

        console.log(`Total: ${total.rows[0].count}`);
        console.log(`Valid (>0): ${valid.rows[0].count}`);
        console.log(`Nulls: ${nulls.rows[0].count}`);
        console.log(`Zeros: ${zeros.rows[0].count}`);

        if (parseInt(valid.rows[0].count) > 0) {
            console.log('SUCCESS: Durations are populated.');
        } else {
            console.log('FAILURE: Durations are still missing.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

verifyDurations();
