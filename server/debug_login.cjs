const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkLogin() {
    try {
        console.log('--- Checking Potential Login Users ---');

        // Common users to check
        const emails = [
            'gestor_cocr@fluxo.com',
            'analista_cocr@fluxo.com',
            'gestor_cdpc@fluxo.com',
            'gerente_gor@fluxo.com',
            'gestor@fluxo.com'
        ];

        for (const email of emails) {
            const res = await pool.query('SELECT id, name, email, password, role FROM users WHERE email = $1', [email]);
            if (res.rows.length > 0) {
                console.log(`FOUND: ${email} -> Password: '${res.rows[0].password}' (Role: ${res.rows[0].role})`);
            } else {
                console.log(`MISSING: ${email}`);
            }
        }

        // Check for ANY user to give an example
        const anyUser = await pool.query('SELECT * FROM users LIMIT 3');
        console.log('\n--- First 3 Users in DB ---');
        console.log(anyUser.rows.map(u => `${u.email} : ${u.password}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

checkLogin();
