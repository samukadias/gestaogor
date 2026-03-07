const db = require('./db');

async function diag() {
    try {
        console.log('Diagnostic Counts:');

        const t1 = await db.query('SELECT count(*) FROM finance_contracts');
        console.log('finance_contracts:', t1.rows[0].count);

        const t2 = await db.query('SELECT count(*) FROM deadline_contracts');
        console.log('deadline_contracts:', t2.rows[0].count);

        const t3 = await db.query('SELECT count(*) FROM contracts');
        console.log('contracts:', t3.rows[0].count);

        const t4 = await db.query('SELECT count(*) FROM users');
        console.log('users:', t4.rows[0].count);

    } catch (e) {
        console.error('Diag failed:', e);
    }
}

diag();
