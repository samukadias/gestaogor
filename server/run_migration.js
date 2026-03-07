const pool = require('./db.js');
const fs = require('fs');

async function run() {
    try {
        const query = fs.readFileSync('migrate_rbac.sql', 'utf8');
        await pool.query(query);
        console.log("Migration Successful");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
