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

        const users = await client.query("SELECT id, name, email, role FROM users WHERE name ILIKE '%Jair%'");
        if (users.rows.length === 0) {
            console.log("No user found.");
            return;
        }

        const user = users.rows[0];
        console.log("User found:", user);

        const analysts = await client.query("SELECT id, name, email FROM analysts WHERE email = $1", [user.email]);
        if (analysts.rows.length === 0) {
            console.log("!!! User IS NOT in analysts table !!!");
        } else {
            console.log("User IS in analysts table:", analysts.rows[0]);
        }

        await client.end();
    } catch (e) {
        console.error(e);
    }
};

run();
