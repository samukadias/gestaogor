const { Client } = require('pg');

const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'fluxo_prod',
    password: 'password',
    port: 5433,
});

const run = async () => {
    try {
        await client.connect();

        console.log('Adding active column to clients table...');
        await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE`);
        console.log('Column added.');

        await client.end();
    } catch (e) {
        console.error('Error:', e);
    }
};

run();
