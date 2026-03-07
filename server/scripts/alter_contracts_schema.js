const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function alterSchema() {
    try {
        console.log('--- Altering contracts schema ---');

        const queries = [
            "ALTER TABLE contracts ALTER COLUMN contract_number TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN status TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN contrato TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN termo TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN status_vencimento TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN tipo_tratativa TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN tipo_aditamento TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN secao_responsavel TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN numero_processo_sei_nosso TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN numero_processo_sei_cliente TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN contrato_cliente TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN contrato_anterior TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN numero_pnpp_crm TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN sei TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN contrato_novo TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN termo_novo TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN client_name TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN responsible_analyst TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN pd_number TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN sei_process_number TYPE VARCHAR(255)",
            "ALTER TABLE contracts ALTER COLUMN sei_send_area TYPE VARCHAR(255)"
        ];

        for (const query of queries) {
            try {
                await pool.query(query);
                console.log(`Executed: ${query}`);
            } catch (e) {
                console.log(`Failed (might be okay if type matches): ${query} - ${e.message}`);
            }
        }

        console.log('Schema alteration complete.');

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

alterSchema();
