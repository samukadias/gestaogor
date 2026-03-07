const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkYears() {
    try {
        const res = await pool.query(`
            SELECT EXTRACT(YEAR FROM created_date) as year, COUNT(*) 
            FROM demands 
            GROUP BY year 
            ORDER BY year DESC
        `);
        console.log('Demands per Year:', res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

checkYears();
