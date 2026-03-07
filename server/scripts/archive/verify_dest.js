const { Client } = require('pg');

const destClient = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'fluxo_prod',
    password: 'password',
    port: 5433,
});

const run = async () => {
    try {
        await destClient.connect();
        const res = await destClient.query('SELECT count(*) FROM deadline_contracts');
        console.log('Count in deadline_contracts:', res.rows[0].count);

        const sample = await destClient.query('SELECT * FROM deadline_contracts LIMIT 1');
        console.log('Sample row:', sample.rows[0]);

        await destClient.end();
    } catch (e) {
        console.error(e);
    }
};

run();
