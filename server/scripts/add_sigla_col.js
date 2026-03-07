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

        console.log('Adding sigla column to clients table...');
        await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS sigla VARCHAR(50)`);
        console.log('Column added.');

        await client.end();
    } catch (e) {
        console.error('Error:', e);
    }
};

run();
