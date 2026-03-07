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

        console.log("Fetching distinct statuses...");
        const res = await client.query(`
            SELECT DISTINCT status, COUNT(*) as count
            FROM demands
            GROUP BY status
            ORDER BY status
        `);

        console.table(res.rows);

        await client.end();
    } catch (e) {
        console.error(e);
    }
};

run();
