const { Pool } = require('pg');

const config = {
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'fluxo_prod',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 5000,
};

console.log('Testing connection with config:', { ...config, password: '***' });

const pool = new Pool(config);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Connection Failed:', err);
        // Print more details if available
        if (err.code) console.error('Error Code:', err.code);
        if (err.routine) console.error('Routine:', err.routine);
    } else {
        console.log('Connection Successful:', res.rows[0]);
    }
    pool.end();
});
