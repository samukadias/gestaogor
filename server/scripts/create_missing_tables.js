const db = require('./db');

async function createTable() {
    try {
        console.log('Creating confirmation_terms table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS confirmation_terms (
                id SERIAL PRIMARY KEY,
                contrato_associado_pd VARCHAR(255),
                valor_total DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created successfully.');

        // Also ensure routes are registered (restarting server usually does this but we want to be sure DB is ready)

    } catch (e) {
        console.error('Error creating table:', e);
    }
}

createTable();
