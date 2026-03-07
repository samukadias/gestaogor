const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * GET /activity-log
 * Returns activity log entries with optional filters.
 * Only accessible to managers/admins.
 */
router.get('/', async (req, res) => {
    try {
        // Only managers can view activity log
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Managers only.' });
        }

        const { entity, action, user_id, limit = 50, page = 1 } = req.query;
        let query = 'SELECT * FROM activity_log';
        const conditions = [];
        const values = [];

        if (entity) {
            values.push(entity);
            conditions.push(`entity = $${values.length}`);
        }

        if (action) {
            values.push(action);
            conditions.push(`action = $${values.length}`);
        }

        if (user_id) {
            values.push(parseInt(user_id));
            conditions.push(`user_id = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ' ORDER BY created_at DESC';

        const limitVal = Math.min(parseInt(limit), 100);
        const offsetVal = (Math.max(parseInt(page), 1) - 1) * limitVal;
        query += ` LIMIT ${limitVal} OFFSET ${offsetVal}`;

        const result = await db.query(query, values);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) FROM activity_log';
        if (conditions.length > 0) {
            countQuery += ` WHERE ${conditions.join(' AND ')}`;
        }
        const countResult = await db.query(countQuery, values);

        res.json({
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: limitVal,
        });
    } catch (err) {
        console.error('[ACTIVITY LOG ERROR]:', err.message);
        res.status(500).json({ error: 'Failed to fetch activity log.' });
    }
});

module.exports = router;
