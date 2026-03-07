require('dotenv').config();
const db = require('./db');

async function migrateDeliveryDates() {
    try {
        console.log("Starting migration: Set delivery_date = expected_delivery_date for ENTREGUE demands...");

        // First, check how many records need updating
        const checkResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM demands 
            WHERE status = 'ENTREGUE' 
            AND delivery_date IS NULL 
            AND expected_delivery_date IS NOT NULL
        `);

        console.log(`Found ${checkResult.rows[0].count} ENTREGUE demands without delivery_date (but with expected_delivery_date)`);

        // Run the update
        const updateResult = await db.query(`
            UPDATE demands 
            SET delivery_date = expected_delivery_date 
            WHERE status = 'ENTREGUE' 
            AND delivery_date IS NULL 
            AND expected_delivery_date IS NOT NULL
        `);

        console.log(`Updated ${updateResult.rowCount} records.`);

        // Check for any remaining ENTREGUE without either date
        const remainingResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM demands 
            WHERE status = 'ENTREGUE' 
            AND delivery_date IS NULL
        `);

        console.log(`Remaining ENTREGUE demands without delivery_date: ${remainingResult.rows[0].count}`);

        console.log("Migration complete!");
        process.exit(0);
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
}

migrateDeliveryDates();
