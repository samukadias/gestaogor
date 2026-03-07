const { Client } = require('pg');

const destClient = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'fluxo_prod',
    password: 'password',
    port: 5433,
});

const run = async () => {
    try {
        await destClient.connect();

        console.log('Expanding columns to TEXT...');
        const cols = [
            'contrato', 'termo', 'tipo_tratativa', 'tipo_aditamento', 'secao_responsavel',
            'numero_processo_sei_nosso', 'numero_processo_sei_cliente', 'contrato_cliente',
            'contrato_anterior', 'numero_pnpp_crm', 'sei', 'contrato_novo', 'termo_novo'
        ];

        for (const col of cols) {
            await destClient.query(`ALTER TABLE deadline_contracts ALTER COLUMN ${col} TYPE TEXT`);
        }

        console.log('Columns expanded.');

        console.log('Truncating deadline_contracts...');
        await destClient.query('TRUNCATE TABLE deadline_contracts RESTART IDENTITY');
        console.log('Truncated.');

        await destClient.end();
    } catch (e) {
        console.error('Error:', e);
    }
};

run();
