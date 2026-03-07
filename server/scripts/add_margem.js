const db = require('./db');

async function addMargemColumns() {
    try {
        console.log('Iniciando adição de colunas margem_bruta e margem_liquida...');

        // Em demands
        await db.query(`ALTER TABLE demands ADD COLUMN IF NOT EXISTS margem_bruta DECIMAL(5, 2);`);
        await db.query(`ALTER TABLE demands ADD COLUMN IF NOT EXISTS margem_liquida DECIMAL(5, 2);`);
        console.log('✅ demands atualizado.');

        // Em contracts
        await db.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS margem_bruta DECIMAL(5, 2);`);
        await db.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS margem_liquida DECIMAL(5, 2);`);
        console.log('✅ contracts atualizado.');

        // Em deadline_contracts
        await db.query(`ALTER TABLE deadline_contracts ADD COLUMN IF NOT EXISTS margem_bruta DECIMAL(5, 2);`);
        await db.query(`ALTER TABLE deadline_contracts ADD COLUMN IF NOT EXISTS margem_liquida DECIMAL(5, 2);`);
        console.log('✅ deadline_contracts atualizado.');

        console.log('Migração concluída com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('Erro ao adicionar colunas:', err);
        process.exit(1);
    }
}

addMargemColumns();
