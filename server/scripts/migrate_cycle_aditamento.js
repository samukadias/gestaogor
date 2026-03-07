const db = require('../db');

async function migrateCycles() {
    try {
        console.log("Applying UPDATE to cycle ID 2...");
        await db.query('UPDATE cycles SET name = $1 WHERE id = $2', ['ADITAMENTO', 2]);

        console.log("Migration complete. Verifying applied changes...");
        const res = await db.query('SELECT * FROM cycles ORDER BY id');
        console.table(res.rows);
    } catch (e) {
        console.error("Migration failed:", e.message);
    } finally {
        process.exit(0);
    }
}

migrateCycles();
