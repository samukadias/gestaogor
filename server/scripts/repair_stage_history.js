const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function repairStageHistory() {
    try {
        console.log('--- Repairing stage_history (Setting exited_at) ---');

        // Fetch all history ordered by demand and entry time
        const res = await pool.query(`
            SELECT id, demand_id, stage, entered_at, exited_at 
            FROM stage_history 
            ORDER BY demand_id, entered_at ASC
        `);

        const rows = res.rows;
        let updates = 0;

        for (let i = 0; i < rows.length; i++) {
            const current = rows[i];
            const next = rows[i + 1];

            // If next exists and is for the same demand, verify/set exited_at
            if (next && next.demand_id === current.demand_id) {
                // Determine logically when this stage ended (it ended when the next one started)
                const inferredExit = next.entered_at;

                // Only update if exited_at is missing or different (allowing for small diffs)
                if (!current.exited_at || new Date(current.exited_at).getTime() !== new Date(inferredExit).getTime()) {
                    await pool.query('UPDATE stage_history SET exited_at = $1 WHERE id = $2', [inferredExit, current.id]);

                    // Also calculate duration
                    const start = new Date(current.entered_at);
                    const end = new Date(inferredExit);
                    const duration = Math.round((end - start) / 1000 / 60); // minutes

                    if (duration >= 0) {
                        await pool.query('UPDATE stage_history SET duration_minutes = $1 WHERE id = $2', [duration, current.id]);
                        updates++;
                    }
                }
            } else {
                // This is the LAST stage for this demand (current stage)
                // We should calculate duration "so far" if we want it to show up?
                // Dashboard logic checks duration_minutes. If we want "Time in Current Stage", we update it relative to NOW.
                // BUT, usually SLA is for completed stages.
                // Let's leave correct logic: if it's current, exited_at is NULL.
                // But we CAN update duration_minutes to "time so far" so it appears in charts?
                // The dashboard seems to sum duration_minutes. If we set it for current stage, it shows "current time spent".
                // Let's optionally set it for current stage too.

                const start = new Date(current.entered_at);
                const now = new Date();
                const duration = Math.round((now - start) / 1000 / 60);

                // Update duration only, keep exited_at NULL
                await pool.query('UPDATE stage_history SET duration_minutes = $1 WHERE id = $2', [duration, current.id]);
                updates++;
            }
        }

        console.log(`Repaired/Updated ${updates} records.`);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

repairStageHistory();
