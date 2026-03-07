const pool = require('./db.js');

async function run() {
    try {
        console.log("--- ROLES MAP BEFORE MIGRATION ---");
        const beforeRes = await pool.query(`
      SELECT role, count(id) as total 
      FROM users 
      GROUP BY role 
      ORDER BY total DESC
    `);
        console.table(beforeRes.rows);

        console.log("\n--- EXECUTIVES TO BE MIGRATED ---");
        // We will migrate users with role='general_manager' AND specific legacy roles 
        // Usually Dayane and other generic C-Level accesses should be updated.
        // In our manual check, Dayane's role in DB is "general_manager"
        const execsRes = await pool.query(`
      SELECT id, name, email, role, department, perfil 
      FROM users 
      WHERE email = 'dayane@gor.com' OR role = 'general_manager'
    `);
        console.table(execsRes.rows);

        console.log("\n--- EXECUTING MIGRATION ---");
        // Update role to 'executive'
        const updateRes = await pool.query(`
      UPDATE users 
      SET role = 'executive' 
      WHERE email = 'dayane@gor.com' OR role = 'general_manager'
    `);
        console.log(`Updated ${updateRes.rowCount} users to 'executive' role.`);

        console.log("\n--- ROLES MAP AFTER MIGRATION ---");
        const afterRes = await pool.query(`
      SELECT role, count(id) as total 
      FROM users 
      GROUP BY role 
      ORDER BY total DESC
    `);
        console.table(afterRes.rows);

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        pool.end();
    }
}
run();
