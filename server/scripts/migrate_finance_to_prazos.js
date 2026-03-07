const db = require('./db');

async function migrate() {
    try {
        console.log('Starting migration from finance_contracts to deadline_contracts...');

        // 1. Fetch source data
        console.log('Executing SELECT query...');
        const res = await db.query('SELECT * FROM finance_contracts');
        const habits = res.rows;
        console.log(`Found ${habits.length} finance contracts.`);

        if (habits.length === 0) {
            console.log('No contracts to migrate.');
            return;
        }

        let inserted = 0;
        let errors = 0;

        // 2. Insert into destination
        for (const c of habits) {
            try {
                // Map values
                const contrato = c.pd_number || c.contract_number || `UNKNOWN-${c.id}`;

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
                    ON CONFLICT (contrato) DO NOTHING
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
                // If 'contrato' doesn't have a unique constraint, ON CONFLICT will fail.
                // In that case, we should manually check or just insert (risk duplicates).
                // But let's see if this works.
                console.error(`Error migrating contract ID ${c.id}:`, err.message);
                errors++;
            }
        }

        console.log(`Migration complete. Inserted: ${inserted}, Errors: ${errors}`);

    } catch (e) {
        console.error('Migration failed at top level:', e);
    }
}

migrate();
