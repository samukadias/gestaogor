const path = require('path');
// Tenta carregar o db usando caminho absoluto para evitar confusão
const dbPath = path.resolve(__dirname, 'server/db.js');
console.log('Loading DB from:', dbPath);

try {
    const db = require(dbPath);

    async function checkUser() {
        try {
            console.log('Querying for herick@cvac.com...');
            const res = await db.query("SELECT * FROM users WHERE email = 'herick@cvac.com'");
            if (res.rows.length === 0) {
                console.log('User NOT FOUND in "users" table.');
            } else {
                console.log('User Found:', res.rows[0]);

                // Check if linked to analysts
                const name = res.rows[0].name;
                const analystRes = await db.query("SELECT * FROM analysts WHERE name = $1", [name]);
                if (analystRes.rows.length === 0) {
                    console.log(`User name "${name}" NOT FOUND in "analysts" table.`);
                } else {
                    console.log('Analyst Table Data:', analystRes.rows[0]);
                }

                // Check contracts for this analyst
                const contractsRes = await db.query("SELECT count(*) FROM finance_contracts WHERE responsible_analyst = $1", [name]);
                console.log(`Contracts count for "${name}":`, contractsRes.rows[0].count);

                // Check a sample contract to see exact name format
                const sampleRes = await db.query("SELECT responsible_analyst FROM finance_contracts LIMIT 5");
                console.log('Sample responsible_analyst values:', sampleRes.rows.map(r => r.responsible_analyst));
            }
        } catch (e) {
            console.error('Database Query Error:', e);
        } finally {
            process.exit();
        }
    }

    checkUser();

} catch (e) {
    console.error('Failed to require db module:', e);
}
