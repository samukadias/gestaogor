const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fluxoprod',
});

async function check() {
    try {
        const userResult = await pool.query("SELECT * FROM users WHERE email = 'sefaz@prodesp.com'");
        console.log('User found:', userResult.rows[0] ? userResult.rows[0].name : 'Not found');

        const contractsResult = await pool.query("SELECT DISTINCT cliente FROM deadline_contracts WHERE cliente ILIKE '%SECRETARIA%' OR cliente ILIKE '%FAZENDA%' LIMIT 10");
        console.log('Similar Clients in Contracts:', contractsResult.rows.map(r => r.cliente));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
