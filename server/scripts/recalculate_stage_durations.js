const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function recalculateDurations() {
    try {
        console.log('--- Recalculating stage_history durations ---');

        // 1. Get all records with entered_at and exited_at
        const res = await pool.query(`
            SELECT id, entered_at, exited_at 
            FROM stage_history 
            WHERE entered_at IS NOT NULL AND exited_at IS NOT NULL
        `);

        console.log(`Found ${res.rowCount} records to update.`);

        let updatedCount = 0;

        for (const row of res.rows) {
            const start = new Date(row.entered_at);
            const end = new Date(row.exited_at);

            // Difference in minutes
            const duration = Math.round((end - start) / 1000 / 60);

            if (duration >= 0) {
                await pool.query('UPDATE stage_history SET duration_minutes = $1 WHERE id = $2', [duration, row.id]);
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} records.`);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

recalculateDurations();
