const db = require('./db');

async function fixSeq() {
    try {
        console.log('Fixing sequence for deadline_contracts...');

        // 1. Get Max ID
        const res = await db.query('SELECT MAX(id) as max_id FROM deadline_contracts');
        const maxId = parseInt(res.rows[0].max_id) || 0;
        console.log('Max ID found:', maxId);

        if (maxId === 0) {
            console.log('Table is empty or error reading max id.');
            return;
        }

        // 2. Adjust sequence
        // We assume the sequence name is deadline_contracts_id_seq
        // To be safe, we set it to maxId + 1 so the next insert uses a free ID.
        // setval(seq, val, is_called) -> if is_called=true (default), next value is val+1.
        await db.query(`SELECT setval('deadline_contracts_id_seq', $1)`, [maxId]);
        console.log(`Sequence 'deadline_contracts_id_seq' reset to ${maxId}. Next ID will be ${maxId + 1}.`);

    } catch (e) {
        console.error('Error fixing sequence:', e.message);
        // If sequence name is wrong, try to discover it
        if (e.message.includes('nonexistent')) {
            console.log('Attempting to discover sequence name...');
            // This query works in recent PG versions
            try {
                const seqRes = await db.query(`SELECT pg_get_serial_sequence('deadline_contracts', 'id') as seq`);
                const seqName = seqRes.rows[0].seq;
                if (seqName) {
                    console.log('Found sequence:', seqName);
                    await db.query(`SELECT setval($1, $2)`, [seqName, maxId]);
                    console.log(`Sequence ${seqName} reset to ${maxId}.`);
                } else {
                    console.error('Could not auto-discover sequence.');
                }
            } catch (ex) {
                console.error('Discovery failed:', ex.message);
            }
        }
    }
}

fixSeq();
