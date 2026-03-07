require('dotenv').config();
const db = require('./server/db');

async function checkTables() {
    const contracts = await db.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contracts' ORDER BY ordinal_position"
    );
    const deadline = await db.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'deadline_contracts' ORDER BY ordinal_position"
    );
    const counts = await db.query(
        "SELECT (SELECT COUNT(*) FROM contracts) as contracts_count, (SELECT COUNT(*) FROM deadline_contracts) as deadline_count"
    );

    console.log('CONTRACTS COLUMNS:', contracts.rows.map(r => r.column_name).join(', '));
    console.log('DEADLINE_CONTRACTS COLUMNS:', deadline.rows.map(r => r.column_name).join(', '));
    console.log('ROW COUNTS:', counts.rows[0]);
    process.exit(0);
}
checkTables().catch(e => { console.error(e.message); process.exit(1); });
