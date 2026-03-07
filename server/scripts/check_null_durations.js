const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkNullDurations() {
    try {
        console.log('--- Checking stage_history duration_minutes ---');

        const countRes = await pool.query('SELECT COUNT(*) FROM stage_history');
        console.log(`Total records: ${countRes.rows[0].count}`);

        const nullRes = await pool.query('SELECT COUNT(*) FROM stage_history WHERE duration_minutes IS NULL');
        console.log(`Records with NULL duration: ${nullRes.rows[0].count}`);

        const zeroRes = await pool.query('SELECT COUNT(*) FROM stage_history WHERE duration_minutes = 0');
        console.log(`Records with 0 duration: ${zeroRes.rows[0].count}`);

        const validRes = await pool.query('SELECT * FROM stage_history WHERE duration_minutes > 0 LIMIT 5');
        console.log('Sample valid records:', validRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkNullDurations();
