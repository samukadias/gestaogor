const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};

const client = new Client(config);

async function smartRestore() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Truncate Tables
        const tables = [
            'status_history', 'stage_history', 'demands', 'contracts', 'clients', 'analysts',
            'cycles', 'requesters', 'holidays', 'users', 'finance_contracts',
            'deadline_contracts', 'invoices', 'monthly_attestations', 'termos_confirmacao'
        ];

        console.log('Truncating tables...');
        for (const table of tables) {
            try {
                await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
            } catch (e) {
                console.log(`Skipping truncate for ${table}: ${e.message}`);
            }
        }

        // 2. Parse and Restore COPY Data
        const backupPath = 'full_backup.sql'; // Assumes in root based on previous copy
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found at ${backupPath}`);
        }

        const fileStream = fs.createReadStream(backupPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let currentTable = null;
        let columns = [];
        let buffer = [];
        const BATCH_SIZE = 1000;

        console.log('Reading backup and restoring data...');

        for await (const line of rl) {
            if (line.startsWith('COPY ')) {
                // Parse: COPY public.analysts (id, name, email, created_at) FROM stdin;
                const match = line.match(/COPY public\.(\w+) \((.*)\) FROM stdin;/);
                if (match) {
                    currentTable = match[1];
                    columns = match[2].split(',').map(c => c.trim());
                    console.log(`Restoring ${currentTable}...`);
                }
            } else if (line.trim() === '\\.') {
                if (currentTable) {
                    await insertBatch(currentTable, columns, buffer);
                    buffer = [];
                    currentTable = null;
                }
            } else if (currentTable) {
                // Data line
                buffer.push(line);
                if (buffer.length >= BATCH_SIZE) {
                    await insertBatch(currentTable, columns, buffer);
                    buffer = [];
                }
            }
        }

        console.log('✅ Smart restore completed!');

    } catch (err) {
        console.error('❌ Error during smart restore:', err);
    } finally {
        await client.end();
    }
}

async function insertBatch(table, columns, lines) {
    if (lines.length === 0) return;

    try {
        // Construct INSERT statement
        // INSERT INTO table (cols) VALUES ($1, $2...), ($X, $Y...)

        const values = [];
        const placeholders = [];
        let placeholderIdx = 1;

        for (const line of lines) {
            const row = line.split('\t').map(val => {
                if (val === '\\N') return null;
                return val;
            });

            // Adjust row length to match columns if needed (unlikely if copy is valid)
            const rowPlaceholders = [];
            for (let i = 0; i < columns.length; i++) {
                values.push(row[i]);
                rowPlaceholders.push(`$${placeholderIdx++}`);
            }
            placeholders.push(`(${rowPlaceholders.join(', ')})`);
        }

        const query = `INSERT INTO "${table}" (${columns.join(', ')}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;

        await client.query(query, values);

    } catch (e) {
        console.error(`Error inserting batch into ${table}:`, e.message);
        // Fallback: Try inserting row by row to identify/isolate errors?
        // For now, just log.
    }
}

smartRestore();
