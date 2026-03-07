const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function saveDemands() {
    try {
        console.log('Fetching new demands...');
        const res = await pool.query("SELECT * FROM demands WHERE created_date >= '2026-02-06 00:00:00'");

        if (res.rows.length > 0) {
            fs.writeFileSync('saved_demands.json', JSON.stringify(res.rows, null, 2));
            console.log(`Saved ${res.rows.length} demands to saved_demands.json`);
        } else {
            console.log('No new demands found to save.');
            fs.writeFileSync('saved_demands.json', '[]');
        }

    } catch (err) {
        console.error('Error saving demands:', err.message);
    } finally {
        pool.end();
    }
}

saveDemands();
