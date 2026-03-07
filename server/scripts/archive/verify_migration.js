
const fs = require('fs');
const pool = require('./db');

async function check() {
    try {
        const res = await pool.query("SELECT role, COUNT(id) FROM users GROUP BY role");
        fs.writeFileSync('roles.json', JSON.stringify(res.rows, null, 2));

        const dayane = await pool.query("SELECT email, role, perfil FROM users WHERE email='dayane@gor.com'");
        fs.writeFileSync('dayane.json', JSON.stringify(dayane.rows[0], null, 2));
    } catch (e) {
        console.error(e)
    } finally {
        pool.end()
    }
}
check()
