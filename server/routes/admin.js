/**
 * server/routes/admin.js
 *
 * Admin-only endpoints:
 *   GET /admin/system-stats     → CPU, memory, uptime
 *   GET /admin/users/online     → Users seen in the last 2 minutes
 */

const express = require('express');
const os = require('os');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Guard: admin only
router.use(authenticateToken, (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    next();
});

// --- CPU sampling helpers ---
// Node's process.cpuUsage() returns cumulative µs; we diff two samples 500ms apart.
let lastCpuUsage = process.cpuUsage();
let lastCpuTime = process.hrtime.bigint();

function sampleCpu() {
    const now = process.hrtime.bigint();
    const current = process.cpuUsage();
    const elapsedMs = Number(now - lastCpuTime) / 1e6; // ns → ms
    const userMs = (current.user - lastCpuUsage.user) / 1000; // µs → ms
    const sysMs = (current.system - lastCpuUsage.system) / 1000;
    const cpuPercent = Math.min(100, ((userMs + sysMs) / elapsedMs) * 100);
    lastCpuUsage = current;
    lastCpuTime = now;
    return Math.round(cpuPercent * 10) / 10; // 1 decimal place
}

/**
 * GET /admin/system-stats
 * Returns process memory, CPU usage, uptime and OS load average.
 */
router.get('/system-stats', (req, res) => {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    res.json({
        cpu: {
            percent: sampleCpu(),
            cores: os.cpus().length,
            model: os.cpus()[0]?.model || 'N/A',
        },
        memory: {
            // Node process heap
            heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
            rssMb: Math.round(mem.rss / 1024 / 1024), // total resident set
            // OS-level
            totalMb: Math.round(totalMem / 1024 / 1024),
            freeMb: Math.round(freeMem / 1024 / 1024),
            usedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
        },
        uptime: {
            processSeconds: Math.round(process.uptime()),
            osSeconds: Math.round(os.uptime()),
        },
        platform: process.platform,
        nodeVersion: process.version,
    });
});

/**
 * GET /admin/users/online
 * Returns users seen (heartbeat) in the last 2 minutes.
 */
router.get('/users/online', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, role, department
            FROM users
            WHERE last_seen_at > NOW() - INTERVAL '2 minutes'
            ORDER BY last_seen_at DESC
        `);
        res.json({
            count: result.rows.length,
            users: result.rows,
        });
    } catch (err) {
        console.error('[ADMIN ONLINE USERS ERROR]:', err.message);
        res.status(500).json({ error: 'Falha ao buscar usuários online.' });
    }
});

module.exports = router;
