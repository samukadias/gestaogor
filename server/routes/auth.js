const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 attempts per window
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * POST /auth/login
 * Authenticate user with email/password and return JWT
 */
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user by email
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Compare password - support both bcrypt hashed and legacy plaintext
        let passwordValid = false;
        if (user.password && user.password.startsWith('$2')) {
            // Bcrypt hashed password
            passwordValid = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plaintext password - compare directly
            passwordValid = (user.password === password);

            // If match, upgrade to bcrypt hash
            if (passwordValid) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
            }
        }

        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Return user data (without password) + token
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            token,
            user: userWithoutPassword,
        });
    } catch (err) {
        console.error('[AUTH LOGIN ERROR]:', err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

/**
 * GET /auth/me
 * Return current authenticated user data (requires JWT)
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, role, department, allowed_modules, profile_type FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[AUTH ME ERROR]:', err);
        res.status(500).json({ error: 'Failed to fetch user data.' });
    }
});

/**
 * POST /auth/ping
 * Heartbeat — updates last_seen_at for the authenticated user.
 * Called by the frontend every 60 seconds.
 */
router.post('/ping', authenticateToken, async (req, res) => {
    try {
        await db.query(
            'UPDATE users SET last_seen_at = NOW() WHERE id = $1',
            [req.user.id]
        );
        res.json({ ok: true });
    } catch (err) {
        // Non-critical — don't crash anything, just log
        console.error('[AUTH PING ERROR]:', err.message);
        res.json({ ok: false });
    }
});

module.exports = router;

