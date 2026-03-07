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

async function restoreDemands() {
    try {
        if (!fs.existsSync('saved_demands.json')) {
            console.log('No saved_demands.json file found.');
            return;
        }

        const data = fs.readFileSync('saved_demands.json', 'utf8');
        const demands = JSON.parse(data);

        if (demands.length === 0) {
            console.log('No demands to restore.');
            return;
        }

        console.log(`Restoring ${demands.length} demands...`);

        for (const demand of demands) {
            // Construct INSERT query dynamically based on keys
            // Exclude 'id' to let it auto-increment, OR keep it if we want to preserve exact ID? 
            // Better to keep ID if possible to preserve links, but if we truncated, IDs might reset or conflict if we restored a backup that claimed them.
            // Since we restored a backup from 2am, and this demand was created AFTER 2am, its ID likely doesn't exist in the backup (unless backup has future IDs which is impossible).
            // So safe to insert with ID.

            const keys = Object.keys(demand).filter(k => demand[k] !== null);
            const values = keys.map(k => demand[k]);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

            const query = `INSERT INTO demands (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`; // Safety check

            await pool.query(query, values);
            console.log(`Restored demand ID: ${demand.id}`);
        }

        console.log('Done restoring demands.');

    } catch (err) {
        console.error('Error restoring demands:', err.message);
    } finally {
        pool.end();
    }
}

restoreDemands();
