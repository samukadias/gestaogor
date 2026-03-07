require('dotenv').config();
const db = require('./db');

async function migrate() {
    try {
        await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITHOUT TIME ZONE');
        console.log('OK: last_seen_at column added to users');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
migrate();
