const { Pool } = require('pg');
require('dotenv').config();

// FORCE PORT 5432
const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'password',
    port: 5432,
});

async function run() {
    try {
        console.log("Connecting to port 5432...");
        const result = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM demands
            GROUP BY status
            ORDER BY count DESC
        `);

        if (result.rows.length > 0) {
            console.table(result.rows);
        } else {
            console.log("Connected to 5432 but found 0 demands.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error connecting to 5432:", err.message);
        process.exit(1);
    }
}

run();
