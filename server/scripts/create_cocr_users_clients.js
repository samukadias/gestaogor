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
        console.log('Fetching Contracts...');

        // 1. Process Analysts (Users)
        const analystsRes = await client.query(`SELECT DISTINCT analista_responsavel FROM deadline_contracts WHERE analista_responsavel IS NOT NULL AND analista_responsavel != ''`);
        const analysts = analystsRes.rows.map(r => r.analista_responsavel.trim());
        console.log(`Found ${analysts.length} unique analysts.`);

        for (const name of analysts) {
            try {
                // Generate email: first name lower @cocr.com
                const firstName = name.split(' ')[0].toLowerCase().trim();
                const email = `${firstName}@cocr.com`;
                const password = '1234';

                // Check if user exists
                const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);

                if (userCheck.rows.length === 0) {
                    // Create User
                    await client.query(
                        `INSERT INTO users (name, email, password, department, role, allowed_modules) 
                         VALUES ($1, $2, $3, 'COCR', 'analyst', '{contracts}')`,
                        [name, email, password]
                    );

                    // Create Analyst entry (if needed for older logic, seems index.js syncs them but let's be safe)
                    await client.query(
                        `INSERT INTO analysts (name, email) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
                        [name, email]
                    );

                    console.log(`Created user: ${name} (${email})`);
                } else {
                    console.log(`User already exists: ${email}`);
                }
            } catch (err) {
                console.error(`Error processing analyst ${name}:`, err.message);
            }
        }

        // 2. Process Clients
        const clientsRes = await client.query(`SELECT DISTINCT cliente FROM deadline_contracts WHERE cliente IS NOT NULL AND cliente != ''`);
        const clients = clientsRes.rows.map(r => r.cliente.trim());
        console.log(`Found ${clients.length} unique clients.`);

        for (const clientName of clients) {
            try {
                await client.query(
                    `INSERT INTO clients (name, active) VALUES ($1, true) ON CONFLICT (name) DO NOTHING`,
                    [clientName]
                );
            } catch (err) {
                // Ignore uniqueness error if ON CONFLICT fails for some reason (rare with name check) or multiple names vary slightly
                // Actually postgres constraint might be only on ID or name. index.js says name UNIQUE? 
                // Let's check index.js: "name VARCHAR(255) UNIQUE NOT NULL" for clients.
                console.error(`Error processing client ${clientName}:`, err.message);
            }
        }
        console.log('Clients processed.');

        await client.end();
        console.log('Done.');

    } catch (e) {
        console.error('Fatal Error:', e);
    }
};

run();
