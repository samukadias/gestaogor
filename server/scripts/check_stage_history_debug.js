const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkStageHistory() {
    try {
        console.log('--- Checking stage_history table ---');

        const countRes = await pool.query('SELECT COUNT(*) FROM stage_history');
        console.log(`Total records: ${countRes.rows[0].count}`);

        const sampleRes = await pool.query('SELECT * FROM stage_history LIMIT 5');
        console.log('Sample data:', sampleRes.rows);

        // Check distinct stages
        const stagesRes = await pool.query('SELECT DISTINCT stage FROM stage_history');
        console.log('Distinct stages:', stagesRes.rows.map(r => r.stage));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkStageHistory();
