const pool = require('./db.js');
const fs = require('fs');

async function run() {
    try {
        const res = await pool.query("SELECT * FROM users WHERE email='dayane@gor.com'");
        fs.writeFileSync('dayane.json', JSON.stringify(res.rows[0], null, 2));
        console.log("SUCCESS");
    } catch (err) {
        console.error(err);
    }
}
run();
