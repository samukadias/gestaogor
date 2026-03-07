const { Client } = require('pg');

const sourceClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 54322,
});

const destClient = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'fluxo_prod',
    password: 'password',
    port: 5433,
});

const run = async () => {
    try {
        console.log('Connecting to databases...');
        await sourceClient.connect();
        await destClient.connect();
        console.log('Connected!');

        console.log('Fetching contracts from Source...');
        const res = await sourceClient.query('SELECT * FROM contracts');
        const contracts = res.rows;
        console.log(`Found ${contracts.length} contracts.`);

        console.log('Inserting into Destination (deadline_contracts)...');

        let inserted = 0;
        let errors = 0;

        for (const contract of contracts) {
            try {
                // Map fields. keys match exactly except ID.
                // We exclude 'id' to let Serial generate it.
                // We keep created_at, updated_at

                const keys = [
                    'analista_responsavel', 'cliente', 'grupo_cliente', 'contrato', 'termo',
                    'status', 'status_vencimento', 'data_inicio_efetividade', 'data_fim_efetividade',
                    'data_limite_andamento', 'valor_contrato', 'valor_faturado', 'valor_cancelado',
                    'valor_a_faturar', 'valor_novo_contrato', 'objeto', 'tipo_tratativa',
                    'tipo_aditamento', 'etapa', 'secao_responsavel', 'observacao',
                    'numero_processo_sei_nosso', 'numero_processo_sei_cliente',
                    'contrato_cliente', 'contrato_anterior', 'numero_pnpp_crm', 'sei',
                    'contrato_novo', 'termo_novo', 'created_by', 'created_at', 'updated_at'
                ];

                const values = keys.map(k => contract[k]);

                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const query = `INSERT INTO deadline_contracts (${keys.join(', ')}) VALUES (${placeholders})`;

                await destClient.query(query, values);
                inserted++;
            } catch (err) {
                console.error(`Error inserting contract ${contract.contrato}:`, err.message);
                errors++;
            }
        }

        console.log(`Migration Finished. Inserted: ${inserted}, Errors: ${errors}`);

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sourceClient.end();
        await destClient.end();
    }
};

run();
