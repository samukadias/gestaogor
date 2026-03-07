require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../full_backup.sql');

async function backup() {
    try {
        console.log("Starting backup...");
        const tablesResult = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        const tables = tablesResult.rows.map(r => r.table_name);
        let sqlContent = `-- Backup generated at ${new Date().toISOString()}\n\n`;

        // Constraint handling: usually we disable triggers/constraints or order tables carefully.
        // For simplicity, we'll order by independent tables first if possible, or just dump all and let user handle restoration (usually acceptable for simple transfer if we DROP/CREATE).
        // Better: Disable constraints? Postgres COPY is better but complex to script.
        // We will just dump INSERTS.

        for (const table of tables) {
            console.log(`Backing up ${table}...`);
            const data = await db.query(`SELECT * FROM "${table}"`);

            if (data.rows.length > 0) {
                sqlContent += `\n-- Data for ${table}\n`;
                const columns = Object.keys(data.rows[0]);

                for (const row of data.rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        if (typeof val === 'object') return `'${JSON.stringify(val)}'`; // JSON columns
                        // Escape single quotes for SQL
                        return `'${String(val).replace(/'/g, "''")}'`;
                    });

                    sqlContent += `INSERT INTO "${table}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`;
                }
            }
        }

        fs.writeFileSync(OUTPUT_FILE, sqlContent);
        console.log(`Backup completed successfully to: ${OUTPUT_FILE}`);
        process.exit(0);

    } catch (error) {
        console.error("Backup failed:", error);
        process.exit(1);
    }
}

backup();
