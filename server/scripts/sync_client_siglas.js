const { Pool } = require('pg');
const env = require('dotenv').config({ path: '../.env' });
const db = require('../db');

/**
 * Script to synchronize 'sigla' in the 'clients' table
 * based on 'grupo_cliente' and 'cliente' from 'contracts' / 'deadline_contracts'.
 */
const syncClientSiglas = async (isDryRun = true) => {
    console.log(`\n========================================`);
    console.log(`🚀 STARTING SIGLA SYNCHRONIZATION ${isDryRun ? '[DRY RUN]' : '[EXECUTION]'}`);
    console.log(`========================================\n`);

    const client = await db.connect();
    let updatedCount = 0;
    let notFoundCount = 0;

    try {
        await client.query('BEGIN');

        // 1. Fetch all unique pairs of (cliente, grupo_cliente) from legacy contracts or deadline_contracts
        // Since both deadline_contracts and contracts map 'grupo_cliente', we use a UNION to be safe
        console.log('📊 Step 1: Fetching existing Cliente -> Grupo Cliente mappings from COCR contracts...');

        const mappingsResult = await client.query(`
            SELECT DISTINCT
                TRIM(cliente) as cliente_nome,
                TRIM(grupo_cliente) as sigla
            FROM deadline_contracts
            WHERE cliente IS NOT NULL 
              AND TRIM(cliente) != ''
              AND grupo_cliente IS NOT NULL 
              AND TRIM(grupo_cliente) != ''

            UNION

            SELECT DISTINCT
                TRIM(client_name) as cliente_nome,
                -- Sometimes 'esps' holds extra metadata, but usually legacy contracts holds the 'grupo_cliente'.
                -- Unfortunately, the newer 'contracts' table doesn't have 'grupo_cliente' explicitly unless it's a legacy json.
                -- Let's stick to deadline_contracts which faithfully ports it.
                NULL as sigla
            FROM finance_contracts
            WHERE 1=0 -- Dummy to match union if needed, but we don't need it. We only trust deadline_contracts or contracts legacy columns.
        `);

        // Refining the query, let's just use deadline_contracts as it's the COCR table.
        const cocrMappings = await client.query(`
            SELECT DISTINCT
                TRIM(cliente) as cliente_nome,
                TRIM(grupo_cliente) as sigla
            FROM deadline_contracts
            WHERE cliente IS NOT NULL 
              AND TRIM(cliente) != ''
              AND grupo_cliente IS NOT NULL 
              AND TRIM(grupo_cliente) != ''
        `);

        const mappings = cocrMappings.rows;
        console.log(`✅ Found ${mappings.length} unique Cliente -> Sigla mappings in COCR.\n`);

        // Group by client name in case there are conflicts (one client with multiple different siglas)
        const groupedMappings = mappings.reduce((acc, row) => {
            const key = row.cliente_nome.toUpperCase();
            if (!acc[key]) acc[key] = new Set();
            acc[key].add(row.sigla);
            return acc;
        }, {});

        // 2. Fetch all clients from Administration
        console.log('📊 Step 2: Fetching clients from Administration table (`clients`)...');
        const clientsResult = await client.query(`SELECT id, name, sigla FROM clients`);
        const targetClients = clientsResult.rows;
        console.log(`✅ Found ${targetClients.length} clients registered in Administration.\n`);

        console.log('📊 Step 3: Analyzing and applying updates...\n');

        for (const target of targetClients) {
            const clientNameUpper = (target.name || '').trim().toUpperCase();
            const matchingSiglasSet = groupedMappings[clientNameUpper];

            if (!matchingSiglasSet || matchingSiglasSet.size === 0) {
                notFoundCount++;
                continue;
            }

            const matchingSiglas = Array.from(matchingSiglasSet);

            // If multiple siglas exist for the same client, pick the first one and warn
            const proposedSigla = matchingSiglas[0];

            if (matchingSiglas.length > 1) {
                console.log(`⚠️ Warning: Client "${target.name}" has multiple siglas in COCR: [${matchingSiglas.join(', ')}]. Picking "${proposedSigla}".`);
            }

            // Only update if it doesn't already have a sigla, or if the current sigla doesn't match the standard
            const currentSigla = (target.sigla || '').trim();

            if (!currentSigla || currentSigla !== proposedSigla) {
                console.log(`🔄 Updating: [${target.name}] -> Sigla: "${proposedSigla}" (was: "${currentSigla}")`);

                if (!isDryRun) {
                    await client.query(
                        `UPDATE clients SET sigla = $1 WHERE id = $2`,
                        [proposedSigla, target.id]
                    );
                }
                updatedCount++;
            }
        }

        if (!isDryRun) {
            await client.query('COMMIT');
            console.log(`\n✅ EXECUTION COMPLETE. Transaction committed.`);
        } else {
            await client.query('ROLLBACK');
            console.log(`\n✅ DRY RUN COMPLETE. No changes were made (rolled back).`);
        }

        console.log(`----------------------------------------`);
        console.log(`📈 SUMMARY:`);
        console.log(`- Clients to be updated / updated: ${updatedCount}`);
        console.log(`- Clients without matching COCR groups: ${notFoundCount}`);
        console.log(`- Total admin clients analyzed: ${targetClients.length}`);
        console.log(`========================================\n`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ MIGRATION FAILED:', err);
    } finally {
        client.release();
    }
}

// Check execution argument
const args = process.argv.slice(2);
const isExecutionMode = args.includes('--execute');

syncClientSiglas(!isExecutionMode).then(() => {
    process.exit(0);
});
