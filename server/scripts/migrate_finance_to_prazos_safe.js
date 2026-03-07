const db = require('./db');

async function migrate() {
    try {
        console.log('Starting SAFE migration from finance_contracts to deadline_contracts...');

        const res = await db.query('SELECT * FROM finance_contracts');
        const habits = res.rows;
        console.log(`Found ${habits.length} finance contracts.`);

        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        for (const c of habits) {
            try {
                const contrato = c.pd_number || c.contract_number || `UNKNOWN-${c.id}`;

                // Check if exists
                const check = await db.query('SELECT id FROM deadline_contracts WHERE contrato = $1', [contrato]);
                if (check.rows.length > 0) {
                    skipped++;
                    continue;
                }

                // Sanitization
                const cliente = c.client_name || 'Desconhecido';
                const analista = c.responsible_analyst || null;
                const valor = c.total_value || 0;

                await db.query(`
                    INSERT INTO deadline_contracts (
                        contrato, cliente, analista_responsavel, 
                        valor_contrato, status, 
                        data_inicio_efetividade, data_fim_efetividade,
                        numero_processo_sei_nosso, objeto, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    contrato,
                    cliente,
                    analista,
                    valor,
                    'Ativo',
                    c.start_date,
                    c.end_date,
                    c.sei_process_number,
                    'Importado do Financeiro',
                    'system_migration'
                ]);
                inserted++;
            } catch (err) {
                console.error(`Error migrating contract ID ${c.id}:`, err.message);
                errors++;
            }
        }

        console.log(`Migration complete. Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);

    } catch (e) {
        console.error('Migration failed at top level:', e);
    }
}

migrate();
