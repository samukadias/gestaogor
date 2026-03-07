const { createCrudRoutes } = require('./index'); // can't easily import express app from index.js if not exported
// Instead, let's just query the DB directly to see if tables exist and are populated.
// If tables exist, the generic CRUD likely works.
const db = require('./db');

async function diag() {
    try {
        console.log('--- API Dependency Diagnostic ---');

        // Check Users
        try {
            const users = await db.query('SELECT count(*) FROM users');
            console.log('Users table count:', users.rows[0].count);
        } catch (e) {
            console.error('Users table error:', e.message);
        }

        // Check TermoConfirmacao (confirmation_terms) mapping check
        // We need to know the table name. Usually 'confirmation_terms'.
        // Let's check information_schema for table names again to be sure.
        const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tableNames = tables.rows.map(r => r.table_name);
        console.log('Tables:', tableNames);

        // Check confirmation_terms if it exists
        if (tableNames.includes('confirmation_terms')) {
            const tcs = await db.query('SELECT count(*) FROM confirmation_terms');
            console.log('confirmation_terms count:', tcs.rows[0].count);
        } else {
            console.log('WARNING: confirmation_terms table NOT found.');
        }

    } catch (e) {
        console.error('Diag failed:', e);
    }
}

diag();
