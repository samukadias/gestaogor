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
        const count = await pool.query('SELECT COUNT(*) FROM stage_history');
        console.log('stage_history count:', count.rows[0].count);

        if (parseInt(count.rows[0].count) === 0) {
            console.log('⚠️  Table is EMPTY - SLA per stage will not appear on dashboard');
        } else {
            const sample = await pool.query('SELECT * FROM stage_history LIMIT 3');
            console.log('\nSample data:');
            console.log(sample.rows);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}

checkStageHistory();
