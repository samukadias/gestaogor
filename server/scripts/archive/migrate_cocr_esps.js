const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: '127.0.0.1', database: 'fluxo_prod', password: 'postgres', port: 5432 });

async function migrateESPs() {
    try {
        const res = await pool.query(`SELECT id, secao_responsavel as esp_legado, esps FROM contracts WHERE secao_responsavel IS NOT NULL AND secao_responsavel != ''`);

        let updatedCount = 0;
        const regex = /\bE\d+\b/gi; // Matches "E" followed by numbers, case insensitive (e.g. E0241007)

        for (let row of res.rows) {
            if (!row.esp_legado) continue;

            // Extract all matches
            const matches = [...row.esp_legado.matchAll(regex)].map(m => m[0].toUpperCase());

            if (matches.length > 0) {
                // Build JSON array
                // We use Set to avoid duplicates if someone typed "E123, E123"
                const uniqueESPs = [...new Set(matches)];
                const jsonESPs = uniqueESPs.map(espNum => ({
                    esp_number: espNum,
                    object_description: "",
                    total_value: 0
                }));

                // Compare if there's any difference before updating to save db hits
                let existingESPs = [];
                if (row.esps) {
                    try {
                        existingESPs = typeof row.esps === 'string' ? JSON.parse(row.esps) : row.esps;
                    } catch (e) { }
                }

                // we just override for this migration pass.
                await pool.query('UPDATE contracts SET esps = $1 WHERE id = $2', [JSON.stringify(jsonESPs), row.id]);
                console.log(`Contract ID ${row.id}: Migrated "${row.esp_legado}" ->`, jsonESPs.map(e => e.esp_number));
                updatedCount++;
            }
        }

        console.log(`DONE! Successfully migrated ESPs for ${updatedCount} contracts.`);

    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        pool.end();
    }
}

migrateESPs();
