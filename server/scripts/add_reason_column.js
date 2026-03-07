require('dotenv').config();
const db = require('./db');

async function addReasonColumn() {
    try {
        console.log("Adding delivery_date_change_reason column to demands table...");

        await db.query(`
            ALTER TABLE demands 
            ADD COLUMN IF NOT EXISTS delivery_date_change_reason TEXT;
        `);

        console.log("Column added successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
}

addReasonColumn();
