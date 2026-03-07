/**
 * safe_migrations.js
 * 
 * Opção A: Adiciona updated_at à tabela contracts (se não existir)
 * Opção B: Renomeia deadline_contracts → archive_prazos_contracts (se existir)
 * 
 * Ambas as operações são SEGURAS e NÃO APAGAM nenhum dado.
 * Para desfazer:
 *   A: ALTER TABLE contracts DROP COLUMN updated_at;
 *   B: ALTER TABLE archive_prazos_contracts RENAME TO deadline_contracts;
 */

require('dotenv').config();
const db = require('./db');

async function run() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // --- Opção A: Adicionar updated_at em contracts ---
        const hasUpdatedAt = await client.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'contracts' AND column_name = 'updated_at'
        `);

        if (hasUpdatedAt.rows.length === 0) {
            await client.query(`
                ALTER TABLE contracts
                ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            `);
            // Preenche o updated_at dos registros existentes com o created_at deles
            await client.query(`
                UPDATE contracts SET updated_at = created_at WHERE updated_at IS NULL
            `);
            console.log('✅ Opção A: Coluna updated_at adicionada à tabela contracts.');
        } else {
            console.log('ℹ️  Opção A: Coluna updated_at já existe em contracts. Nenhuma alteração.');
        }

        // --- Opção B: Renomear deadline_contracts → archive_prazos_contracts ---
        const hasDeadline = await client.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'deadline_contracts'
        `);

        const hasArchive = await client.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'archive_prazos_contracts'
        `);

        if (hasDeadline.rows.length > 0 && hasArchive.rows.length === 0) {
            await client.query(`
                ALTER TABLE deadline_contracts RENAME TO archive_prazos_contracts
            `);
            // Renomear também a sequência de ID para manter consistência
            await client.query(`
                ALTER SEQUENCE IF EXISTS deadline_contracts_id_seq RENAME TO archive_prazos_contracts_id_seq
            `);
            console.log('✅ Opção B: Tabela deadline_contracts renomeada → archive_prazos_contracts.');
        } else if (hasArchive.rows.length > 0) {
            console.log('ℹ️  Opção B: archive_prazos_contracts já existe. Nenhuma alteração.');
        } else {
            console.log('ℹ️  Opção B: deadline_contracts não encontrada. Nenhuma alteração.');
        }

        await client.query('COMMIT');

        // Verificação final
        const verify = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM contracts) as contracts_count,
                (SELECT COUNT(*) FROM archive_prazos_contracts) as archive_count
        `);
        console.log('\n📊 Verificação final de contagem de registros:');
        console.log('  contracts:', verify.rows[0].contracts_count);
        console.log('  archive_prazos_contracts:', verify.rows[0].archive_count);
        console.log('\n✅ Migração concluída com sucesso. Nenhum dado foi apagado.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Erro — operação revertida automaticamente (ROLLBACK):', err.message);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();
