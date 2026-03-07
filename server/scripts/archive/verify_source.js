const { Client } = require('pg');

const sourceClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres', // Trying default
    port: 54322,
});

const run = async () => {
    try {
        await sourceClient.connect();
        console.log('Connected to Source DB!');

        // List tables
        const res = await sourceClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log('Tables:', res.rows.map(r => r.table_name));

        // If contracts exists, describe it
        if (res.rows.find(r => r.table_name === 'contracts')) {
            const cols = await sourceClient.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'contracts'
            `);
            const fs = require('fs');
            fs.writeFileSync('source_schema.json', JSON.stringify(cols.rows, null, 2));
            console.log('Schema saved to source_schema.json');
        }

        await sourceClient.end();
    } catch (e) {
        console.error('Connection failed:', e.message);
        // Try to connect without password or different default if needed, 
        // but let's see the error first.
    }
};

run();
