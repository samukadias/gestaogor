const pool = require('./db.js');
const fs = require('fs');

async function run() {
    try {
        const query = fs.readFileSync('perf_indexes.sql', 'utf8');
        await pool.query(query);
        console.log("Performance Indices Migration Successful");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
run();
