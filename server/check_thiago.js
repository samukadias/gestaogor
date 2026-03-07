const pool = require('./db.js');
const fs = require('fs');

async function run() {
    try {
        const res = await pool.query("SELECT * FROM users WHERE email='thiago@cdpc.com'");
        if (res.rows.length > 0) {
            fs.writeFileSync('thiago.json', JSON.stringify(res.rows[0], null, 2));
            console.log("SUCCESS Thiago Found");
        } else {
            console.log("User thiago@cdpc.com not found");
            const allRes = await pool.query("SELECT * FROM users WHERE email LIKE '%thiago%'");
            if (allRes.rows.length > 0) {
                fs.writeFileSync('thiago.json', JSON.stringify(allRes.rows[0], null, 2));
                console.log("SUCCESS Thiago Found by LIKE");
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
