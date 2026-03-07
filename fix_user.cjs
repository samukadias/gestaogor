const path = require('path');
const dbPath = path.join(__dirname, 'server', 'db.js');
const db = require(dbPath);

async function fixUser() {
    try {
        console.log('Updating herick@cvac.com to role=analyst...');
        const res = await db.query("UPDATE users SET role = 'analyst', department = 'CVAC', profile_type = 'analista' WHERE email = 'herick@cvac.com' RETURNING *");
        console.log('Updated User:', res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fixUser();
