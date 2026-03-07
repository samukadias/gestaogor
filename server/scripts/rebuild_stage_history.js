const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function rebuildStageHistory() {
    try {
        console.log('--- Rebuilding stage_history ---');

        // 1. Clear existing bad data
        await pool.query('TRUNCATE TABLE stage_history RESTART IDENTITY');
        console.log('Truncated stage_history.');

        // 2. Fetch Demands
        const demandsRes = await pool.query('SELECT * FROM demands');
        const demands = demandsRes.rows;
        console.log(`Processing ${demands.length} demands...`);

        let insertedCount = 0;

        for (const demand of demands) {
            // A. TRIAGEM STAGE
            if (demand.created_date) {
                const start = new Date(demand.created_date);
                let end = demand.qualification_date ? new Date(demand.qualification_date) : null;

                // If no qualification date, but status is advanced (e.g. delivers), assume qualified?
                // For now rely on qualification_date column.

                let duration = 0;
                if (end) {
                    duration = Math.round((end - start) / 1000 / 60);
                } else {
                    // Current stage is Triagem if not qualified
                    // Or maybe it was cancelled/rejected before qualification?
                    duration = Math.round((new Date() - start) / 1000 / 60);
                }

                // Insert Triagem
                await pool.query(`
                    INSERT INTO stage_history (demand_id, stage, entered_at, exited_at, duration_minutes)
                    VALUES ($1, $2, $3, $4, $5)
                `, [demand.id, 'Triagem', demand.created_date, demand.qualification_date, duration]);
                insertedCount++;
            }

            // B. QUALIFICAÇÃO STAGE
            if (demand.qualification_date) {
                const start = new Date(demand.qualification_date);
                // When did it exit Qualificação?
                // If we have status history, maybe we can find a transition?
                // Or if delivery_date exists, use that as specific stage end?
                // Simplification: If delivered, Qualificação ended.
                // But we don't know WHEN it ended (could be months before delivery).
                // Leave exited_at NULL unless we find info in status_history?
                // Reconstruct from status_history if possible.

                // For now, let's insert 'Qualificação' as entered.
                // Duration calculation: active since qualification.
                const duration = Math.round((new Date() - start) / 1000 / 60);

                // Check if current stage is NOT Qualificação or Triagem
                // If demand.stage is 'PO', 'OO', etc., then it EXITED Qualificação.
                // But we don't know when.

                await pool.query(`
                    INSERT INTO stage_history (demand_id, stage, entered_at, exited_at, duration_minutes)
                    VALUES ($1, $2, $3, NULL, $4)
                `, [demand.id, 'Qualificação', demand.qualification_date, duration]);
                insertedCount++;
            }

            // C. Current Stage (if valid and not locally handled)
            if (demand.stage && demand.stage !== 'Triagem' && demand.stage !== 'Qualificação') {
                // Insert an entry for the current stage (PO, OO, etc) without start date (unknown)
                // Actually this might mess up charts if entered_at is null.
                // Maybe filter out records with no entered_at in dashboard?
                // Or assume entered_at = qualification_date (worst case)?
                // Let's skip inserting "Ghost" active stages for now to avoid bad data.
            }
        }

        console.log(`Rebuilt ${insertedCount} stage history records.`);

        // 3. Enrich with status_history (If available) - Advanced step deferred
        // For now, Triagem/Qualificação data should be enough to show the chart.

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

rebuildStageHistory();
