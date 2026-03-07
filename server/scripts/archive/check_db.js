const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: '127.0.0.1', database: 'fluxo_prod', password: 'postgres', port: 5432 });

async function check() {
  try {
    const tables = ['contracts', 'finance_contracts', 'deadline_contracts', 'clients', 'analysts', 'demands', 'users', 'status_history', 'stage_history'];
    for (let t of tables) {
      const res = await pool.query(`SELECT * FROM ${t}`);
      let count = 0;
      let samples = [];
      res.rows.forEach(r => {
        let hasBad = false;
        Object.values(r).forEach(v => {
          if (typeof v === 'string' && v.includes('??')) hasBad = true;
        });
        if (hasBad) {
          count++;
          if (samples.length < 3) {
            // Collect only the string fields containing ??
            let badFields = {};
            Object.entries(r).forEach(([k, v]) => {
              if (typeof v === 'string' && v.includes('??')) badFields[k] = v;
            });
            samples.push(badFields);
          }
        }
      });
      console.log(`Table ${t} has ${count} rows with ?? out of ${res.rows.length}`);
      if (samples.length > 0) {
        console.log(`  Samples from ${t}:`, JSON.stringify(samples));
      }
    }
  } catch (e) { console.error(e) }
  finally {
    pool.end();
  }
}
check();
