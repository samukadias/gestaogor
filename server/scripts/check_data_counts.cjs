const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkCounts() {
    try {
        const tables = ['contracts', 'demands', 'finance_contracts', 'deadline_contracts', 'users'];
        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${table}: Error - ${e.message}`);
            }
        }
    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        pool.end();
    }
}

checkCounts();
