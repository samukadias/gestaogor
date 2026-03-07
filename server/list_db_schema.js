const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function listSchema() {
    try {
        const query = `
            SELECT table_name, column_name, data_type, is_nullable, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `;
        const res = await pool.query(query);

        const tables = {};
        res.rows.forEach(row => {
            if (!tables[row.table_name]) {
                tables[row.table_name] = [];
            }
            let type = row.data_type;
            if (row.character_maximum_length) {
                type += `(${row.character_maximum_length})`;
            }
            tables[row.table_name].push({
                name: row.column_name,
                type: type,
                nullable: row.is_nullable
            });
        });

        let mdOutput = '# Database Schema\n\n';

        for (const [tableName, columns] of Object.entries(tables)) {
            mdOutput += `## ${tableName}\n\n`;
            mdOutput += '| Column | Type | Nullable |\n';
            mdOutput += '| :--- | :--- | :--- |\n';
            columns.forEach(col => {
                mdOutput += `| \`${col.name}\` | ${col.type} | ${col.nullable} |\n`;
            });
            mdOutput += '\n';
        }

        // Write to file
        fs.writeFileSync('server/schema_output.md', mdOutput);
        console.log('Schema written to server/schema_output.md');

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

listSchema();
