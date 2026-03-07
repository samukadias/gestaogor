const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function cleanDb() {
    try {
        console.log('Cleaning database...');
        const tables = [
            'status_history', 'demands', 'contracts', 'users', 'analysts',
            'clients', 'cycles', 'requesters', 'holidays',
            'finance_contracts', 'deadline_contracts', 'monthly_attestations',
            'invoices', 'termos_confirmacao'
        ];

        for (const table of tables) {
            try {
                // Check if table exists first to avoid error
                const res = await pool.query(`SELECT to_regclass('${table}')`);
                if (res.rows[0].to_regclass) {
                    await pool.query(`TRUNCATE "${table}" CASCADE`);
                    console.log(`Truncated ${table}`);
                }
            } catch (e) {
                console.log(`Error truncating ${table}: ${e.message}`);
            }
        }
        console.log('Database cleaned.');
    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        pool.end();
    }
}

cleanDb();
