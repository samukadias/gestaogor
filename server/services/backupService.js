const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const PG_DUMP_PATH = '"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe"';
const BACKUP_DIR = path.join(__dirname, '../backups');
const NETWORK_BACKUP_DIR = 'T:\\DRC\\GOR\\NLRP\\GERAL\\BACKUP SISTEMA GOR';
const DB_NAME = 'fluxo_prod';
const DB_USER = 'postgres';
const DB_HOST = '127.0.0.1';
const MAX_BACKUPS = 21; // 3 backups per day * 7 days

// Ensure backup directories exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const copyToNetwork = (localPath, filename) => {
    try {
        if (!fs.existsSync(NETWORK_BACKUP_DIR)) {
            fs.mkdirSync(NETWORK_BACKUP_DIR, { recursive: true });
        }
        const networkPath = path.join(NETWORK_BACKUP_DIR, filename);
        fs.copyFileSync(localPath, networkPath);
        console.log(`[Backup] ✅ Copied to network: ${networkPath}`);

        // Clean old backups on network too
        cleanOldBackups(NETWORK_BACKUP_DIR);
    } catch (err) {
        console.error(`[Backup] ⚠️ Failed to copy to network (${NETWORK_BACKUP_DIR}): ${err.message}`);
    }
};

const createBackup = () => {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const command = `${PG_DUMP_PATH} -U ${DB_USER} -h ${DB_HOST} -d ${DB_NAME} -f "${filepath}"`;

    console.log(`[Backup] Starting backup: ${filename}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Backup] Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`[Backup] Info: ${stderr}`);
        }
        console.log(`[Backup] ✅ Local: ${filepath}`);
        cleanOldBackups(BACKUP_DIR);

        // Copy to network drive
        copyToNetwork(filepath, filename);
    });
};

const cleanOldBackups = (directory) => {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error(`[Backup] Error reading directory ${directory}:`, err);
            return;
        }

        const sqlFiles = files
            .filter(file => file.endsWith('.sql'))
            .map(file => {
                const filePath = path.join(directory, file);
                const stats = fs.statSync(filePath);
                return { file, filePath, mtime: stats.mtime };
            })
            .sort((a, b) => b.mtime - a.mtime); // Newest first

        if (sqlFiles.length > MAX_BACKUPS) {
            const filesToDelete = sqlFiles.slice(MAX_BACKUPS);
            filesToDelete.forEach(backup => {
                fs.unlink(backup.filePath, (err) => {
                    if (err) console.error(`[Backup] Error deleting old backup ${backup.file}:`, err);
                    else console.log(`[Backup] Deleted old backup: ${backup.file}`);
                });
            });
        }
    });
};

const init = () => {
    console.log('[Backup] Service initialized. Schedule: 13:00, 18:00, 23:00');
    console.log(`[Backup] Local: ${BACKUP_DIR}`);
    console.log(`[Backup] Network: ${NETWORK_BACKUP_DIR}`);

    // Schedule task to run at 13:00, 18:00, and 23:00 every day
    cron.schedule('0 13,18,23 * * *', () => {
        createBackup();
    });

    // Run one immediately on start for verification (Optional, but good for user confidence)
    // createBackup(); 
};

module.exports = { init, createBackup };
