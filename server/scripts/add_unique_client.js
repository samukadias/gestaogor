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

        console.log('Checking for duplicates before adding UNIQUE constraint...');
        // Remove duplicates if any (keeping the one with lowest ID)
        await client.query(`
            DELETE FROM clients a USING clients b
            WHERE a.id > b.id AND a.name = b.name;
        `);
        console.log('Duplicates removed.');

        console.log('Adding UNIQUE constraint to clients(name)...');
        await client.query(`ALTER TABLE clients ADD CONSTRAINT clients_name_key UNIQUE (name)`);
        console.log('Constraint added.');

        await client.end();
    } catch (e) {
        // Ignore if constraint already exists or other benign error
        console.log('Info/Error:', e.message);
    }
};

run();
