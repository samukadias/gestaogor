const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function inspectStageHistory() {
    try {
        console.log('--- Inspecting stage_history data ---');

        const res = await pool.query('SELECT id, stage, entered_at, exited_at, duration_minutes FROM stage_history LIMIT 20');
        console.table(res.rows);

        const countExited = await pool.query('SELECT COUNT(*) FROM stage_history WHERE exited_at IS NOT NULL');
        console.log(`Records with exited_at: ${countExited.rows[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

inspectStageHistory();
