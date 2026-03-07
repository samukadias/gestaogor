const db = require('./db');

async function checkVolume() {
    try {
        console.log('Checking database volume...');

        const tables = ['demands', 'status_history', 'users', 'clients'];
        for (const table of tables) {
            const res = await db.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`${table}: ${res.rows[0].count} records`);
        }

    } catch (err) {
        console.error('Error checking volume:', err);
    }
}

checkVolume();
