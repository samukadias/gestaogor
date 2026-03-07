const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkStageHistoryForYear() {
    try {
        // Get demands from 2026
        const demands2026 = await pool.query(`
            SELECT id FROM demands 
            WHERE EXTRACT(YEAR FROM created_date) = 2026
        `);
        console.log('Demands in 2026:', demands2026.rows.length);

        if (demands2026.rows.length > 0) {
            const demandIds = demands2026.rows.map(d => d.id);

            // Check stage_history for these demands
            const stageData = await pool.query(`
                SELECT stage, COUNT(*) as count, 
                       AVG(duration_minutes) as avg_minutes
                FROM stage_history 
                WHERE demand_id = ANY($1)
                AND duration_minutes IS NOT NULL
                GROUP BY stage
                ORDER BY stage
            `, [demandIds]);

            console.log('\nStage history for 2026 demands:');
            if (stageData.rows.length === 0) {
                console.log('⚠️  NO stage_history data for 2026 demands!');
                console.log('This is why SLA per stage is not showing.');
            } else {
                console.log('Stage data found:');
                stageData.rows.forEach(row => {
                    console.log(`  ${row.stage}: ${row.count} entries, avg ${(row.avg_minutes / 1440).toFixed(1)} days`);
                });
            }
        } else {
            console.log('⚠️  No demands found for 2026');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}

checkStageHistoryForYear();
