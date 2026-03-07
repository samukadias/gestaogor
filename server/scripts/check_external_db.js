const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 54322,
});

async function check() {
    try {
        console.log('Connecting to 54322...');
        await client.connect();
        console.log('Connected!');

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log('Tables in 54322:', res.rows.map(r => r.table_name));

        const countRes = await client.query('SELECT count(*) FROM contracts');
        console.log('Contracts count:', countRes.rows[0]);

    } catch (e) {
        console.error('Connection failed:', e.message);
    } finally {
        await client.end();
    }
}

check();
