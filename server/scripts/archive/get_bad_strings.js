const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: '127.0.0.1', database: 'fluxo_prod', password: 'postgres', port: 5432 });

async function check() {
    try {
        const tables = ['contracts', 'finance_contracts', 'deadline_contracts', 'clients', 'analysts', 'demands', 'users', 'status_history', 'stage_history'];
        const badStrings = new Set();

        for (let t of tables) {
            const res = await pool.query(`SELECT * FROM ${t}`);
            res.rows.forEach(r => {
                Object.values(r).forEach(v => {
                    if (typeof v === 'string' && v.includes('??')) {
                        badStrings.add(v);
                    }
                });
            });
        }

        console.log("Unique corrupted strings:");
        Array.from(badStrings).sort().forEach(s => console.log(`"${s}"`));

    } catch (e) { console.error(e) }
    finally {
        pool.end();
    }
}
check();
