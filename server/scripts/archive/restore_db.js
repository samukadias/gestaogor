const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};

const client = new Client(config);

async function restoreDatabase() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Truncate tables to ensure clean state (Cascade to handle FKs)
        console.log('Cleaning existing data...');
        // Order matters slightly less with CASCADE, but good practice to be broad
        const tables = [
            'status_history', 'demands', 'contracts', 'clients', 'analysts',
            'cycles', 'requesters', 'holidays', 'users', 'finance_contracts',
            'deadline_contracts', 'invoices', 'monthly_attestations', 'termos_confirmacao'
        ];

        // Disable triggers optionally or just truncate cascade
        for (const table of tables) {
            try {
                await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
                console.log(`Truncated ${table}`);
            } catch (e) {
                console.log(`Skipping truncate for ${table} (might not exist): ${e.message}`);
            }
        }

        // 2. Read Backup File
        const backupPath = path.join(__dirname, '..', 'full_backup.sql');
        console.log(`Reading backup from: ${backupPath}`);
        const sql = fs.readFileSync(backupPath, 'utf8');

        // 3. Execute Backup SQL
        console.log('Executing restoration SQL...');

        // Temporarily disable triggers (including FK constraints) for current session/transaction
        await client.query("SET session_replication_role = 'replica';");

        await client.query(sql);

        // Re-enable triggers
        await client.query("SET session_replication_role = 'origin';");

        console.log('✅ Backup restored successfully!');

    } catch (err) {
        console.error('❌ Error restoring database:', err);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.table) console.error('Table:', err.table);
        if (err.column) console.error('Column:', err.column);
        if (err.where) console.error('Where:', err.where);
    } finally {
        await client.end();
    }
}

restoreDatabase();
