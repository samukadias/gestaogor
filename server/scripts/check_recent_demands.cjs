const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkRecent() {
    try {
        const res = await pool.query("SELECT COUNT(*) FROM demands WHERE created_date >= '2026-02-06 00:00:00'");
        console.log(`Demands created today: ${res.rows[0].count}`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}

checkRecent();
