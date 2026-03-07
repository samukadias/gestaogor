const db = require('./db');

async function dump() {
    try {
        const res = await db.query('SELECT * FROM deadline_contracts WHERE id = 3');
        console.log(JSON.stringify(res.rows[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

dump();
