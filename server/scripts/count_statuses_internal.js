const db = require('./db');

async function run() {
    try {
        console.log("Querying demands status counts...");
        const result = await db.query(`
            SELECT status, COUNT(*) as count
            FROM demands
            GROUP BY status
            ORDER BY count DESC
        `);

        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
