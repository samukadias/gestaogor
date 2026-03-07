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

        console.log("Checking demands for Analyst ID 6 (Jair)...");
        // Check count, years, and sample IDs
        const res = await client.query(`
            SELECT 
                count(*),
                EXTRACT(YEAR FROM created_date) as year,
                json_agg(id) as sample_ids
            FROM demands 
            WHERE analyst_id = 6
            GROUP BY year
        `);

        if (res.rows.length === 0) {
            console.log("No demands found for analyst_id = 6");

            // Check if there are demands assigned to '6' as string? (Unlikely in PG int column)
        } else {
            console.table(res.rows);
        }

        await client.end();
    } catch (e) {
        console.error(e);
    }
};

run();
