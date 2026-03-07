const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fluxoprod',
});

async function run() {
    try {
        // 1. Get the exact user name
        const userRes = await pool.query("SELECT name, email FROM users WHERE email = 'sefaz@prodesp.com'");
        if (userRes.rows.length === 0) {
            console.log('User not found!');
            return;
        }
        const userName = userRes.rows[0].name;
        console.log(`Target User Name: "${userName}"`);

        // 2. Find contracts that likely belong to this user (using ILIKE '%FAZENDA%')
        const findRes = await pool.query("SELECT id, cliente FROM deadline_contracts WHERE cliente ILIKE '%FAZENDA%' OR cliente ILIKE '%SEFAZ%'");
        console.log(`Found ${findRes.rows.length} potential contracts.`);
        console.log('Sample:', findRes.rows.slice(0, 3));

        // 3. Update them to match the user name EXACTLY
        if (findRes.rows.length > 0) {
            const updateRes = await pool.query("UPDATE deadline_contracts SET cliente = $1 WHERE cliente ILIKE '%FAZENDA%' OR cliente ILIKE '%SEFAZ%'", [userName]);
            console.log(`Updated ${updateRes.rowCount} contracts to have client name: "${userName}"`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
