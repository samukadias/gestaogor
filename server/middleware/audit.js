const db = require('../db');

/**
 * Middleware factory to log write operations to activity_log table.
 * Wraps POST, PUT, DELETE routes with audit trail recording.
 */
const auditTrail = (entity) => {
    return async (req, res, next) => {
        // Store original json method to intercept response
        const originalJson = res.json.bind(res);

        res.json = (data) => {
            // Only log successful operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const action = req.method === 'POST' ? 'CREATE'
                    : req.method === 'PUT' ? 'UPDATE'
                        : req.method === 'DELETE' ? 'DELETE'
                            : null;

                if (action) {
                    const userId = req.user ? req.user.id : null;
                    const userName = req.user ? (req.user.name || req.user.email) : 'System';
                    const entityId = req.params.id || (data && data.id) || null;
                    const changes = action === 'DELETE' ? null : JSON.stringify(req.body);

                    // Fire and forget - don't block the response
                    db.query(
                        `INSERT INTO activity_log (user_id, user_name, action, entity, entity_id, changes)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [userId, userName, action, entity, entityId, changes]
                    ).catch(err => {
                        console.error('[AUDIT LOG ERROR]:', err.message);
                    });
                }
            }

            return originalJson(data);
        };

        next();
    };
};

module.exports = auditTrail;
