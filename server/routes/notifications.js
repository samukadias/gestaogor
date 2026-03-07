const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * GET /notifications
 * Get notifications for the current authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, unread_only } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        const values = [userId];

        if (unread_only === 'true') {
            query += ' AND read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';
        values.push(parseInt(limit));

        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('[NOTIFICATIONS ERROR]:', err.message);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

/**
 * GET /notifications/unread-count
 * Get count of unread notifications for authenticated user
 */
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE',
            [userId]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('[NOTIFICATIONS COUNT ERROR]:', err.message);
        res.status(500).json({ error: 'Failed to fetch count.' });
    }
});

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[NOTIFICATION READ ERROR]:', err.message);
        res.status(500).json({ error: 'Failed to update notification.' });
    }
});

/**
 * PUT /notifications/mark-all-read
 * Mark all notifications as read for authenticated user
 */
router.put('/mark-all-read', async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
            [userId]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('[NOTIFICATION MARK ALL ERROR]:', err.message);
        res.status(500).json({ error: 'Failed to mark all as read.' });
    }
});

/**
 * Generate notifications for expiring contracts.
 * Called by cron job in main server.
 */
const generateExpiringContractNotifications = async () => {
    try {
        // Find contracts expiring in 30, 60, 90 days
        const intervals = [
            { days: 30, type: 'contract_expiring_30' },
            { days: 60, type: 'contract_expiring_60' },
            { days: 90, type: 'contract_expiring_90' },
        ];

        // Get managers and relevant users
        const managers = await db.query(
            "SELECT id FROM users WHERE role IN ('manager', 'admin') AND (department IN ('GOR', 'COCR') OR allowed_modules @> '{contracts}')"
        );

        for (const { days, type } of intervals) {
            const contracts = await db.query(`
                SELECT id, cliente, contrato, data_fim_efetividade
                FROM archive_prazos_contracts
                WHERE data_fim_efetividade BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
                AND status = 'Ativo'
            `);

            for (const contract of contracts.rows) {
                for (const manager of managers.rows) {
                    // Check if notification already exists for this contract + user + type
                    const existing = await db.query(
                        'SELECT id FROM notifications WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND type = $4',
                        [manager.id, 'deadline_contract', contract.id, type]
                    );

                    if (existing.rows.length === 0) {
                        await db.query(
                            `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [
                                manager.id,
                                type,
                                `Contrato vencendo em ${days} dias`,
                                `O contrato ${contract.contrato} do cliente ${contract.cliente} vence em ${new Date(contract.data_fim_efetividade).toLocaleDateString('pt-BR')}.`,
                                'deadline_contract',
                                contract.id
                            ]
                        );
                    }
                }
            }
        }

        // Also check for overdue demands
        const overdueDemands = await db.query(`
            SELECT d.id, d.product, d.analyst_id, d.expected_delivery_date
            FROM demands d
            WHERE d.expected_delivery_date < NOW()
            AND d.status NOT IN ('ENTREGUE', 'CANCELADA')
        `);

        for (const demand of overdueDemands.rows) {
            if (demand.analyst_id) {
                // Find the user linked to this analyst
                const analyst = await db.query('SELECT name, email FROM analysts WHERE id = $1', [demand.analyst_id]);
                if (analyst.rows.length > 0) {
                    const user = await db.query('SELECT id FROM users WHERE email = $1', [analyst.rows[0].email]);
                    if (user.rows.length > 0) {
                        const existing = await db.query(
                            "SELECT id FROM notifications WHERE user_id = $1 AND entity_type = 'demand' AND entity_id = $2 AND type = 'demand_overdue'",
                            [user.rows[0].id, demand.id]
                        );
                        if (existing.rows.length === 0) {
                            await db.query(
                                `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                                 VALUES ($1, $2, $3, $4, $5, $6)`,
                                [
                                    user.rows[0].id,
                                    'demand_overdue',
                                    'Demanda atrasada',
                                    `A demanda "${demand.product}" (ID #${demand.id}) está atrasada desde ${new Date(demand.expected_delivery_date).toLocaleDateString('pt-BR')}.`,
                                    'demand',
                                    demand.id
                                ]
                            );
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error('[NOTIFICATION CRON ERROR]:', err.message);
    }
};

module.exports = { router, generateExpiringContractNotifications };
