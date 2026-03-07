const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

// Log config to be sure
console.log('DB Config:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD ? '******' : '(empty)'
});

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function check() {
    try {
        console.log('--- Database Check ---');
        
        // 1. Check Contracts
        const resContracts = await pool.query('SELECT COUNT(*) FROM contracts');
        console.log(`Contracts Total: ${resContracts.rows[0].count}`);

        // 2. Check Deadline Contracts
        const resDeadline = await pool.query('SELECT COUNT(*) FROM deadline_contracts');
        console.log(`Deadline Contracts Total: ${resDeadline.rows[0].count}`);

        // 3. Check Demands
        const resDemands = await pool.query('SELECT COUNT(*) FROM demands');
        console.log(`Demands Total: ${resDemands.rows[0].count}`);

        // 4. Check Users (specifically COCR)
        const resUsers = await pool.query("SELECT COUNT(*) FROM users WHERE department = 'COCR'");
        console.log(`COCR Users Total: ${resUsers.rows[0].count}`);

        // 5. Check if any contract is linked to COCR users (via responsible_analyst or similar)
        // Since contracts table lacks department, we infer from users or fields.
        // Let's check a sample of contracts to see if fields like 'secao_responsavel' exist and are populated.
        
        try {
            const resSecao = await pool.query("SELECT secao_responsavel, count(*) FROM contracts GROUP BY secao_responsavel");
            if (resSecao.rows.length > 0) {
                console.log('Contracts by Section:', resSecao.rows);
            } else {
                console.log('Contracts by Section: None (Table empty or column null)');
            }
        } catch (e) {
            console.log('Could not query secao_responsavel from contracts (maybe column missing?):', e.message);
        }

    } catch (err) {
        console.error('Error connecting or querying:', err.message);
    } finally {
        pool.end();
    }
}

check();
