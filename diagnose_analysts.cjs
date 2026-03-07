const path = require('path');
const dbPath = path.join(__dirname, 'server', 'db.js');
const db = require(dbPath);

async function diagnose() {
    try {
        console.log('--- USERS (Analyst Role) ---');
        const analysts = await db.query("SELECT id, name, email, role FROM users WHERE role = 'analyst' OR profile_type = 'analista' OR department='CVAC'");
        console.table(analysts.rows);

        console.log('\n--- CONTRACTS (Distinct Responsible Analyst) ---');
        const contracts = await db.query("SELECT DISTINCT responsible_analyst FROM finance_contracts");
        console.table(contracts.rows);

        console.log('\n--- MATCH CHECK ---');
        analysts.rows.forEach(user => {
            const match = contracts.rows.find(c => c.responsible_analyst === user.name);
            console.log(`User "${user.name}" matches contract analyst? ${match ? 'YES' : 'NO'}`);
            if (!match) {
                // Try fuzzy
                const fuzzy = contracts.rows.find(c => c.responsible_analyst && c.responsible_analyst.includes(user.name.split(' ')[0]));
                console.log(`   -> Potential partial match: ${fuzzy ? fuzzy.responsible_analyst : 'NONE'}`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

diagnose();
