const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is not set. The server cannot start without it.');
    process.exit(1);
}
const JWT_EXPIRES_IN = '8h';

/**
 * Generate JWT token for a user
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
        allowed_modules: user.allowed_modules,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and attaches user to req
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(403).json({ error: 'Invalid token.' });
    }
};

/**
 * Middleware to restrict viewer role from performing write operations
 */
const authorizeAction = (req, res, next) => {
    if (req.user && req.user.role === 'viewer') {
        const method = req.method.toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            // Exceção: Permitir que o visualizador atualize apenas a própria senha (no 1º acesso)
            if (method === 'PUT' && req.path === `/users/${req.user.id}`) {
                const bodyKeys = Object.keys(req.body || {});
                console.log(`[AUTH DEBUG] User ${req.user.id} attempting PUT to themselves`);
                console.log(`[AUTH DEBUG] Body keys: `, bodyKeys);
                const isOnlyUpdatingPassword = bodyKeys.every(k => k === 'password' || k === 'must_change_password');
                if (isOnlyUpdatingPassword && bodyKeys.includes('password')) {
                    console.log(`[AUTH DEBUG] Allowing viewer to change their password`);
                    return next();
                }
                console.log(`[AUTH DEBUG] Blocked because payload was invalid. Only allowed: password, must_change_password`);
            } else {
                console.log(`[AUTH DEBUG] Blocked a ${method} request to ${req.path} by user ${req.user.id}`);
            }
            return res.status(403).json({ error: 'Acesso negado. Perfil de apenas leitura.' });
        }
    }
    next();
};

module.exports = { generateToken, authenticateToken, authorizeAction, JWT_SECRET };
