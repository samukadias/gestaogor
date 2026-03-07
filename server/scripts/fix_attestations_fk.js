const db = require('./db');

const fixForeignKey = async () => {
    try {
        console.log('Starting FK Fix for monthly_attestations...');

        // 1. Drop existing FK constraint
        console.log('Dropping old constraint...');
        await db.query(`
            ALTER TABLE monthly_attestations 
            DROP CONSTRAINT IF EXISTS monthly_attestations_contract_id_fkey
        `);

        // 2. Add new FK constraint referencing finance_contracts
        console.log('Adding new constraint referencing finance_contracts...');
        await db.query(`
            ALTER TABLE monthly_attestations 
            ADD CONSTRAINT monthly_attestations_contract_id_fkey 
            FOREIGN KEY (contract_id) 
            REFERENCES finance_contracts(id)
        `);

        console.log('✅ Specific FK fixed successfully.');

    } catch (err) {
        console.error('❌ Error fixing FK:', err.message);
    } finally {
        process.exit();
    }
};

fixForeignKey();
