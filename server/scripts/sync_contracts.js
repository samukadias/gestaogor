const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function syncContracts() {
    try {
        console.log('--- Syncing deadline_contracts to contracts ---');

        // 1. Clear contracts (optional, but safer to avoid dupes since we know it was empty)
        // await pool.query('TRUNCATE TABLE contracts RESTART IDENTITY');
        // console.log('Truncated contracts table.');

        // 2. Insert data mapping columns
        // We need to map columns carefully.
        // deadline_contracts columns: id, analista_responsavel, cliente, contrato, ...
        // contracts columns: id, analista_responsavel, cliente, contrato, ... (Mostly match based on schema dump)

        const insertQuery = `
            INSERT INTO contracts (
                id, 
                analista_responsavel, 
                cliente, 
                grupo_cliente, 
                contrato, 
                termo, 
                status, 
                status_vencimento, 
                data_inicio_efetividade, 
                data_fim_efetividade, 
                data_limite_andamento, 
                valor_contrato, 
                valor_faturado, 
                valor_cancelado, 
                valor_a_faturar, 
                valor_novo_contrato, 
                objeto, 
                tipo_tratativa, 
                tipo_aditamento, 
                etapa, 
                secao_responsavel, 
                observacao, 
                numero_processo_sei_nosso, 
                numero_processo_sei_cliente, 
                contrato_cliente, 
                contrato_anterior, 
                numero_pnpp_crm, 
                sei, 
                contrato_novo, 
                termo_novo, 
                created_by, 
                created_at
            )
            SELECT 
                id, 
                analista_responsavel, 
                cliente, 
                grupo_cliente, 
                contrato, 
                termo, 
                status, 
                status_vencimento, 
                data_inicio_efetividade, 
                data_fim_efetividade, 
                data_limite_andamento, 
                valor_contrato, 
                valor_faturado, 
                valor_cancelado, 
                valor_a_faturar, 
                valor_novo_contrato, 
                objeto, 
                tipo_tratativa, 
                tipo_aditamento, 
                etapa, 
                secao_responsavel, 
                observacao, 
                numero_processo_sei_nosso, 
                numero_processo_sei_cliente, 
                contrato_cliente, 
                contrato_anterior, 
                numero_pnpp_crm, 
                sei, 
                contrato_novo, 
                termo_novo, 
                created_by, 
                created_at
            FROM deadline_contracts
            ON CONFLICT (id) DO NOTHING;
        `;

        const res = await pool.query(insertQuery);
        console.log(`Inserted ${res.rowCount} records into contracts.`);

        // 3. Reset sequence for contracts
        const maxIdRes = await pool.query('SELECT MAX(id) FROM contracts');
        const maxId = maxIdRes.rows[0].max || 0;
        await pool.query(`SELECT setval('contracts_id_seq', ${maxId})`);
        console.log(`Reset contracts_id_seq to ${maxId}`);

    } catch (err) {
        console.error('Error syncing:', err);
    } finally {
        pool.end();
    }
}

syncContracts();
