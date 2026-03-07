const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

pool.query('SELECT id, name, email, password FROM users', (err, res) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Users found:', res.rows);
    }
    pool.end();
});
