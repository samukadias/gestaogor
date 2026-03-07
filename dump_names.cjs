const path = require('path');
const dbPath = path.join(__dirname, 'server', 'db.js');
const db = require(dbPath);

async function checkNames() {
    try {
        const users = await db.query("SELECT name FROM users WHERE role='analyst' OR profile_type='analista' OR department='CVAC'");
        console.log('--- USERS ---');
        users.rows.forEach(u => console.log(`"${u.name}"`));

        const contracts = await db.query("SELECT DISTINCT responsible_analyst FROM finance_contracts");
        console.log('\n--- CONTRACTS RESPONSABLES ---');
        contracts.rows.forEach(c => console.log(`"${c.responsible_analyst}"`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkNames();
