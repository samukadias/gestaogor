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

        console.log("Checking Users...");
        const users = await client.query("SELECT * FROM users WHERE name ILIKE '%Jair%'");
        console.table(users.rows);

        if (users.rows.length > 0) {
            const email = users.rows[0].email;
            console.log(`Checking Analysts for email: ${email}...`);
            const analysts = await client.query("SELECT * FROM analysts WHERE email = $1", [email]);
            console.table(analysts.rows);
        } else {
            console.log("User Jair not found in users table.");
        }

        await client.end();
    } catch (e) {
        console.error(e);
    }
};

run();
