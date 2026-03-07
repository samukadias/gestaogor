const db = require('../db');

async function addValorAditamento() {
    try {
        console.log('Iniciando adição da coluna valor_aditamento...');

        // Em contracts
        await db.query(`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS valor_aditamento DECIMAL(15, 2);`);
        console.log('✅ contracts atualizado.');

        // Em deadline_contracts
        await db.query(`ALTER TABLE deadline_contracts ADD COLUMN IF NOT EXISTS valor_aditamento DECIMAL(15, 2);`);
        console.log('✅ deadline_contracts atualizado.');

        console.log('Migração concluída com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('Erro ao adicionar coluna:', err);
        process.exit(1);
    }
}

addValorAditamento();
