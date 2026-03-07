const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'full_backup.sql');
let sql = fs.readFileSync(backupPath, 'utf8');

// Fix malformed arrays: "["flow"]" -> '{"flow"}' or similar postgres array literal issues
// The error was: malformed array literal: "["flow"]"
// Postgres expects arrays as '{val1,val2}' not '["val1","val2"]' when inserting as string literal into array column,
// UNLESS handling JSON/JSONB. The error suggests it's trying to parse as Postgres Array.

// Replace `allowed_modules` values format
// Pattern: '["val1", "val2"]' or '["val1"]' -> '{val1,val2}'
// We will use a regex to find these patterns in INSERT statements for 'users' or generally.
// Assuming the backup uses single quotes for strings: '["flow"]'

console.log('Fixing array formats in backup file...');

// 1. naive replace for specifically known values if simple regex is risky
// But let's try regex for '["..."]' style arrays being inserted into SQL
// The error is `malformed array literal: "["flow"]"` which implies the SQL has `'["flow"]'` string literal for an array column.

// Regex to match '["..."]' and convert to '{"..."}' which Postgres accepts for text[]
// We need to be careful not to replace JSON columns content if any.
// The error specifically cited `allowed_modules`.

// Find lines with INSERT INTO "users" and fix the array part.
const lines = sql.split('\n');
const fixedLines = lines.map(line => {
    if (line.includes('INSERT INTO "users"')) {
        // Look for '["..."]' pattern and replace [ with { and ] with }
        // Example: '["flow"]' -> '{"flow"}'
        // Example: '["flow", "finance"]' -> '{"flow", "finance"}'
        // Note: Postgres array string format uses double quotes for elements if needed: '{"a","b"}'

        // This simple replacement assumes the array string structure is strict JSON-like
        // and just swapping brackets is enough for Postgres text[] format if it was exported as JSON string.
        let newLine = line.replace(/'\[(.*?)\]'/g, (match, content) => {
            // content is "flow" or "flow","a"
            // We want '{"flow"}'
            return `'{${content}}'`;
        });
        return newLine;
    }
    return line;
});

const fixedSql = fixedLines.join('\n');

if (fixedSql !== sql) {
    fs.writeFileSync(backupPath, fixedSql, 'utf8');
    console.log('✅ Fixed array formats in full_backup.sql');
} else {
    console.log('⚠️ No array formats needed fixing or pattern not matched.');
}
