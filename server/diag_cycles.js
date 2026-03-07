const db = require('./db');
const fs = require('fs');

async function checkCycles() {
    try {
        const cycles = await db.query('SELECT * FROM cycles ORDER BY id');
        let out = '';
        for (const c of cycles.rows) {
            const demands = await db.query('SELECT COUNT(*) FROM demands WHERE cycle_id = $1', [c.id]);
            out += `Cycle [${c.id}] ${c.name}: ${demands.rows[0].count} demands\n`;
        }
        fs.writeFileSync('cycles_out.txt', out);
        console.log("Done");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkCycles();
